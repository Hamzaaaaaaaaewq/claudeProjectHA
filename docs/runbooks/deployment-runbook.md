# Deployment Runbook

## Overview

This runbook provides step-by-step instructions for deploying SyriaMart services to production.

## Pre-Deployment Checklist

### Code Readiness
- [ ] All tests passing (unit, integration, e2e)
- [ ] Code review approved
- [ ] Security scan completed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] API specs updated
- [ ] Version tagged in Git

### Infrastructure Readiness
- [ ] Database migrations prepared
- [ ] Infrastructure changes applied
- [ ] Secrets updated in Vault
- [ ] Monitoring alerts configured
- [ ] Backup verified
- [ ] Rollback plan prepared

### Communication
- [ ] Deployment window scheduled
- [ ] Team notified
- [ ] Maintenance page ready (if needed)
- [ ] Customer communication prepared

## Deployment Steps

### Step 1: Pre-Deployment Verification

```bash
# 1.1 Verify cluster health
kubectl get nodes
kubectl get pods -n production

# 1.2 Check current version
kubectl get deployments -n production -o wide

# 1.3 Verify database connectivity
kubectl exec -it postgres-primary-0 -n production -- psql -U postgres -c "SELECT version();"

# 1.4 Check Redis cluster
kubectl exec -it redis-master-0 -n production -- redis-cli ping

# 1.5 Verify Kafka cluster
kubectl exec -it kafka-0 -n production -- kafka-topics.sh --list --bootstrap-server localhost:9092
```

### Step 2: Database Migrations

```bash
# 2.1 Backup current database
kubectl exec -it postgres-primary-0 -n production -- pg_dump -U postgres syriamart > backup_$(date +%Y%m%d_%H%M%S).sql

# 2.2 Run migrations in dry-run mode
kubectl run migration-dry-run --rm -it --image=syriamart/migrations:$VERSION \
  --env="DB_HOST=postgres-primary" \
  --env="DRY_RUN=true" \
  -- npm run migrate:dry-run

# 2.3 Apply migrations
kubectl run migration --rm -it --image=syriamart/migrations:$VERSION \
  --env="DB_HOST=postgres-primary" \
  -- npm run migrate:up

# 2.4 Verify migrations
kubectl exec -it postgres-primary-0 -n production -- psql -U postgres syriamart -c "SELECT * FROM migrations ORDER BY id DESC LIMIT 5;"
```

### Step 3: Deploy Services (Blue-Green)

```bash
# 3.1 Deploy new version to green environment
export VERSION=v1.2.0
export SERVICE=user-service

# 3.2 Apply green deployment
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${SERVICE}-green
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ${SERVICE}
      version: green
  template:
    metadata:
      labels:
        app: ${SERVICE}
        version: green
    spec:
      containers:
      - name: ${SERVICE}
        image: syriamart/${SERVICE}:${VERSION}
        env:
        - name: ENV
          value: production
        ports:
        - containerPort: 3000
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
EOF

# 3.3 Wait for green deployment to be ready
kubectl wait --for=condition=available --timeout=300s deployment/${SERVICE}-green -n production

# 3.4 Run smoke tests
kubectl run smoke-test --rm -it --image=syriamart/test-runner:latest \
  --env="TARGET=http://${SERVICE}-green:3000" \
  -- npm run test:smoke

# 3.5 Switch traffic to green (10% canary)
kubectl patch service ${SERVICE} -n production -p '{"spec":{"selector":{"version":"green"}}}'

# 3.6 Monitor metrics
watch -n 2 'kubectl top pods -n production | grep ${SERVICE}'

# 3.7 Gradual traffic shift (if metrics good)
# 25%
kubectl annotate service ${SERVICE} -n production trafficWeight="blue=75,green=25"
sleep 300

# 50%
kubectl annotate service ${SERVICE} -n production trafficWeight="blue=50,green=50"
sleep 300

# 100%
kubectl annotate service ${SERVICE} -n production trafficWeight="blue=0,green=100"

# 3.8 Delete blue deployment (after verification)
kubectl delete deployment ${SERVICE}-blue -n production

# 3.9 Rename green to blue for next deployment
kubectl patch deployment ${SERVICE}-green -n production --type='json' \
  -p='[{"op": "replace", "path": "/metadata/name", "value":"'${SERVICE}'-blue"}]'
```

### Step 4: Post-Deployment Verification

```bash
# 4.1 Verify service health
curl -f http://api.syriamart.com/health || echo "Health check failed"

# 4.2 Check error rates
kubectl logs -n production -l app=${SERVICE} --tail=100 | grep ERROR | wc -l

# 4.3 Verify API responses
curl -X GET "http://api.syriamart.com/api/v1/users/profile" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json"

# 4.4 Check database connections
kubectl exec -it ${SERVICE}-pod -n production -- netstat -an | grep 5432 | wc -l

# 4.5 Verify cache connectivity
kubectl exec -it ${SERVICE}-pod -n production -- redis-cli -h redis-master ping
```

### Step 5: Monitoring & Alerts

```bash
# 5.1 Check Prometheus metrics
curl -s http://prometheus.syriamart.com/api/v1/query?query=up{job="${SERVICE}"} | jq .

# 5.2 Verify Grafana dashboards
open https://grafana.syriamart.com/d/service-overview?var-service=${SERVICE}

# 5.3 Check alert rules
curl -s http://prometheus.syriamart.com/api/v1/rules | jq '.data.groups[].rules[] | select(.labels.service=="${SERVICE}")'

# 5.4 Test alert notification
kubectl exec -it alertmanager-0 -n monitoring -- amtool alert add \
  alertname="TestAlert" service="${SERVICE}" severity="info" \
  --annotation=summary="Test alert after deployment"
```

## Rollback Procedures

### Automatic Rollback Triggers
- Error rate > 5%
- Response time > 2s (p95)
- Health check failures > 10%
- Memory usage > 90%

### Manual Rollback Steps

```bash
# 1. Switch traffic back to blue
kubectl patch service ${SERVICE} -n production -p '{"spec":{"selector":{"version":"blue"}}}'

# 2. Scale down green deployment
kubectl scale deployment ${SERVICE}-green -n production --replicas=0

# 3. Revert database migrations (if needed)
kubectl run migration-rollback --rm -it --image=syriamart/migrations:$PREVIOUS_VERSION \
  --env="DB_HOST=postgres-primary" \
  -- npm run migrate:down

# 4. Delete green deployment
kubectl delete deployment ${SERVICE}-green -n production

# 5. Notify team
curl -X POST https://hooks.slack.com/services/XXX/YYY/ZZZ \
  -H 'Content-type: application/json' \
  -d '{"text":"Rollback completed for '${SERVICE}' to version '${PREVIOUS_VERSION}'"}'
```

## Service-Specific Deployments

### User Service
```bash
# Additional steps for user service
# Clear session cache after deployment
kubectl exec -it redis-master-0 -n production -- redis-cli --scan --pattern "session:*" | xargs redis-cli DEL
```

### Payment Service
```bash
# Payment service requires maintenance mode
# 1. Enable maintenance mode
kubectl annotate service payment-service -n production maintenance="true"

# 2. Wait for in-flight transactions
sleep 60

# 3. Deploy as normal
# 4. Disable maintenance mode
kubectl annotate service payment-service -n production maintenance-
```

### Catalog Service
```bash
# Reindex search after catalog deployment
kubectl exec -it elasticsearch-master-0 -n production -- \
  curl -X POST "localhost:9200/products/_refresh"
```

## Troubleshooting

### Common Issues

#### Pods Not Starting
```bash
# Check pod events
kubectl describe pod ${POD_NAME} -n production

# Check logs
kubectl logs ${POD_NAME} -n production --previous

# Check resource limits
kubectl top pod ${POD_NAME} -n production
```

#### Database Connection Issues
```bash
# Test connectivity
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- \
  psql -h postgres-primary -U postgres -c "SELECT 1"

# Check connection pool
kubectl exec -it ${POD_NAME} -n production -- netstat -an | grep 5432
```

#### High Memory Usage
```bash
# Get memory dump
kubectl exec -it ${POD_NAME} -n production -- kill -USR2 1

# Analyze heap
kubectl cp production/${POD_NAME}:/tmp/heapdump.hprof ./heapdump.hprof
```

## Post-Deployment Tasks

### Performance Validation
```bash
# Run load test
kubectl run load-test --rm -it --image=loadimpact/k6 -- \
  run -e BASE_URL=http://api.syriamart.com /scripts/load-test.js

# Check response times
curl -w "@curl-format.txt" -o /dev/null -s http://api.syriamart.com/api/v1/products
```

### Security Scan
```bash
# Run security scan
kubectl run security-scan --rm -it --image=owasp/zap2docker-stable -- \
  zap-baseline.py -t http://api.syriamart.com

# Check for vulnerabilities
trivy image syriamart/${SERVICE}:${VERSION}
```

### Documentation Update
- [ ] Update deployment log
- [ ] Record any issues encountered
- [ ] Update runbook if needed
- [ ] Share lessons learned

## Deployment Log Template

```markdown
## Deployment: ${SERVICE} ${VERSION}

**Date**: $(date)
**Deployed by**: ${USER}
**Duration**: XX minutes

### Changes
- Feature: XXX
- Bugfix: XXX
- Performance: XXX

### Issues Encountered
- None / Description

### Rollback Required
- No / Yes (reason)

### Notes
- Additional observations
```

## Emergency Contacts

- **On-Call Engineer**: +963-XXX-XXXX
- **Platform Lead**: platform-lead@syriamart.com
- **Database Admin**: dba@syriamart.com
- **Security Team**: security@syriamart.com