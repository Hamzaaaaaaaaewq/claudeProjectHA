# Rollback Procedures

## Overview

This document defines MANDATORY rollback procedures for all SyriaMart deployments. **Every deployment MUST have tested rollback capabilities with < 5 minute execution time.**

## Rollback Requirements

### 1. Pre-Deployment Preparation

#### Mandatory Checklist
```yaml
before_deployment:
  - [ ] Current version tagged and archived
  - [ ] Database backup completed and verified
  - [ ] Configuration snapshot taken
  - [ ] Rollback scripts tested in staging
  - [ ] Team notified of rollback procedure
  - [ ] Monitoring alerts configured
  - [ ] Success criteria defined
```

### 2. Application Rollback Procedures

#### Kubernetes Deployment Rollback

```bash
#!/bin/bash
# rollback-deployment.sh - MUST complete in < 5 minutes

SERVICE_NAME=$1
NAMESPACE=${2:-production}
PREVIOUS_VERSION=$3

echo "🔄 Starting rollback for $SERVICE_NAME to version $PREVIOUS_VERSION"

# Step 1: Verify current state (30 seconds)
echo "📊 Current deployment status:"
kubectl get deployment $SERVICE_NAME -n $NAMESPACE -o wide
kubectl get pods -n $NAMESPACE -l app=$SERVICE_NAME

# Step 2: Scale down current deployment (1 minute)
echo "⬇️ Scaling down current deployment..."
kubectl scale deployment $SERVICE_NAME -n $NAMESPACE --replicas=0
kubectl wait --for=delete pod -l app=$SERVICE_NAME -n $NAMESPACE --timeout=60s

# Step 3: Update deployment image (30 seconds)
echo "🔄 Updating to previous version $PREVIOUS_VERSION..."
kubectl set image deployment/$SERVICE_NAME $SERVICE_NAME=syriamart/$SERVICE_NAME:$PREVIOUS_VERSION -n $NAMESPACE

# Step 4: Scale up with previous version (2 minutes)
echo "⬆️ Scaling up previous version..."
kubectl scale deployment $SERVICE_NAME -n $NAMESPACE --replicas=3
kubectl rollout status deployment/$SERVICE_NAME -n $NAMESPACE --timeout=120s

# Step 5: Verify health (1 minute)
echo "✅ Verifying service health..."
./scripts/health-check.sh $SERVICE_NAME $NAMESPACE

# Total time: ~4.5 minutes
echo "✅ Rollback completed successfully"
```

#### Blue-Green Rollback

```bash
#!/bin/bash
# blue-green-rollback.sh - Instant rollback

SERVICE_NAME=$1
NAMESPACE=${2:-production}

echo "🔄 Blue-Green rollback for $SERVICE_NAME"

# Step 1: Switch traffic back to blue (< 10 seconds)
kubectl patch service $SERVICE_NAME -n $NAMESPACE \
  -p '{"spec":{"selector":{"version":"blue"}}}'

# Step 2: Verify traffic switch
kubectl get endpoints $SERVICE_NAME -n $NAMESPACE

# Step 3: Delete green deployment
kubectl delete deployment $SERVICE_NAME-green -n $NAMESPACE --grace-period=30

echo "✅ Traffic switched back to blue version"
```

### 3. Database Rollback Procedures

#### Migration Rollback

```sql
-- rollback-migration.sql
-- MUST be idempotent and tested

BEGIN;

-- Step 1: Verify current migration version
SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 1;

-- Step 2: Execute rollback for specific version
-- Example: Rolling back version 20250115120000
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '20250115120000') THEN
        -- Rollback DDL changes
        ALTER TABLE orders DROP COLUMN IF EXISTS new_field;
        
        -- Restore constraints
        ALTER TABLE orders ADD CONSTRAINT check_amount CHECK (amount > 0);
        
        -- Remove migration record
        DELETE FROM schema_migrations WHERE version = '20250115120000';
        
        RAISE NOTICE 'Migration 20250115120000 rolled back successfully';
    ELSE
        RAISE NOTICE 'Migration 20250115120000 not found, skipping';
    END IF;
END $$;

COMMIT;
```

#### Data Rollback Script

```bash
#!/bin/bash
# data-rollback.sh

BACKUP_ID=$1
SERVICE=$2

echo "🔄 Starting data rollback for $SERVICE from backup $BACKUP_ID"

# Step 1: Stop writes (30 seconds)
kubectl annotate service $SERVICE-db -n production maintenance="true"

# Step 2: Create point-in-time backup (1 minute)
pg_dump -h $DB_HOST -U postgres $SERVICE > rollback_safety_$(date +%s).sql

# Step 3: Restore from backup (3 minutes)
psql -h $DB_HOST -U postgres -c "DROP DATABASE IF EXISTS ${SERVICE}_temp;"
psql -h $DB_HOST -U postgres -c "CREATE DATABASE ${SERVICE}_temp;"
pg_restore -h $DB_HOST -U postgres -d ${SERVICE}_temp < backups/$BACKUP_ID.sql

# Step 4: Swap databases (30 seconds)
psql -h $DB_HOST -U postgres << EOF
BEGIN;
ALTER DATABASE $SERVICE RENAME TO ${SERVICE}_old;
ALTER DATABASE ${SERVICE}_temp RENAME TO $SERVICE;
COMMIT;
EOF

# Step 5: Resume writes
kubectl annotate service $SERVICE-db -n production maintenance-

echo "✅ Data rollback completed"
```

### 4. Configuration Rollback

```bash
#!/bin/bash
# config-rollback.sh

CONFIG_VERSION=$1
SERVICE=$2

echo "🔄 Rolling back configuration to version $CONFIG_VERSION"

# Step 1: Retrieve previous config from Vault
vault kv get -version=$CONFIG_VERSION secret/$SERVICE/config > /tmp/config.json

# Step 2: Validate configuration
./scripts/validate-config.sh /tmp/config.json || exit 1

# Step 3: Apply configuration
kubectl create configmap $SERVICE-config \
  --from-file=config.json=/tmp/config.json \
  -n production --dry-run=client -o yaml | kubectl apply -f -

# Step 4: Restart pods to pick up new config
kubectl rollout restart deployment/$SERVICE -n production

echo "✅ Configuration rolled back"
```

### 5. Event Schema Rollback

```bash
#!/bin/bash
# schema-rollback.sh

SCHEMA_NAME=$1
VERSION=$2

echo "🔄 Rolling back schema $SCHEMA_NAME to version $VERSION"

# Step 1: Disable incompatible producers
kubectl scale deployment producers --replicas=0 -n production

# Step 2: Update schema registry
curl -X POST http://schema-registry:8081/subjects/$SCHEMA_NAME/versions \
  -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  -d @schemas/$SCHEMA_NAME-v$VERSION.avsc

# Step 3: Update consumers to handle both versions
kubectl set env deployment/consumers SCHEMA_VERSION=$VERSION -n production

# Step 4: Resume producers with old schema
kubectl scale deployment producers --replicas=3 -n production

echo "✅ Schema rollback completed"
```

### 6. Emergency Rollback Procedures

#### One-Command Rollback

```bash
#!/bin/bash
# emergency-rollback.sh - PANIC BUTTON

# This script MUST complete in < 2 minutes
set -e

echo "🚨 EMERGENCY ROLLBACK INITIATED"

# Step 1: Switch all traffic to previous version (30 seconds)
kubectl patch service user-service -n production -p '{"spec":{"selector":{"version":"stable"}}}'
kubectl patch service catalog-service -n production -p '{"spec":{"selector":{"version":"stable"}}}'
kubectl patch service order-service -n production -p '{"spec":{"selector":{"version":"stable"}}}'
kubectl patch service payment-service -n production -p '{"spec":{"selector":{"version":"stable"}}}'

# Step 2: Stop all canary deployments (30 seconds)
kubectl delete deployment -l version=canary -n production --grace-period=10

# Step 3: Restore last known good configuration (30 seconds)
kubectl apply -f backups/last-known-good-config.yaml

# Step 4: Clear caches (30 seconds)
kubectl exec -it redis-master-0 -n production -- redis-cli FLUSHALL

echo "✅ EMERGENCY ROLLBACK COMPLETED"
echo "📊 System status:"
kubectl get deployments -n production
```

### 7. Rollback Verification

#### Health Check Script

```bash
#!/bin/bash
# verify-rollback.sh

SERVICE=$1

echo "🔍 Verifying rollback for $SERVICE"

# API Health
curl -f http://api.syriamart.com/health/$SERVICE || exit 1

# Database connectivity
kubectl exec -it $SERVICE-0 -n production -- pg_isready || exit 1

# Error rate check
ERROR_RATE=$(kubectl logs -l app=$SERVICE -n production --since=5m | grep ERROR | wc -l)
if [ $ERROR_RATE -gt 10 ]; then
    echo "❌ High error rate detected: $ERROR_RATE errors"
    exit 1
fi

# Response time check
RESPONSE_TIME=$(curl -w "%{time_total}" -o /dev/null -s http://api.syriamart.com/api/v1/health)
if (( $(echo "$RESPONSE_TIME > 1.0" | bc -l) )); then
    echo "❌ Response time too high: ${RESPONSE_TIME}s"
    exit 1
fi

echo "✅ Rollback verification passed"
```

### 8. Rollback Communication

#### Automated Notifications

```typescript
// rollback-notifier.ts
class RollbackNotifier {
  async notifyRollback(service: string, reason: string, status: string) {
    // Slack notification
    await this.slack.send({
      channel: '#deployments',
      text: `🔄 Rollback ${status} for ${service}`,
      attachments: [{
        color: status === 'completed' ? 'good' : 'danger',
        fields: [
          { title: 'Service', value: service },
          { title: 'Reason', value: reason },
          { title: 'Time', value: new Date().toISOString() },
          { title: 'Operator', value: process.env.USER }
        ]
      }]
    });

    // Email to stakeholders
    await this.email.send({
      to: ['tech-team@syriamart.com', 'ops@syriamart.com'],
      subject: `Rollback ${status}: ${service}`,
      body: this.generateEmailBody(service, reason, status)
    });

    // Update status page
    await this.statusPage.createIncident({
      name: `${service} rollback`,
      status: 'investigating',
      message: `Rolling back ${service} due to ${reason}`
    });
  }
}
```

## Rollback Testing Requirements

### Monthly Rollback Drills

```yaml
rollback_drill_checklist:
  preparation:
    - [ ] Schedule maintenance window
    - [ ] Notify team
    - [ ] Prepare test scenarios
    
  execution:
    - [ ] Deploy new version to staging
    - [ ] Trigger rollback scenario
    - [ ] Execute rollback procedure
    - [ ] Measure execution time
    - [ ] Verify system health
    
  validation:
    - [ ] Rollback completed < 5 minutes
    - [ ] No data loss
    - [ ] All services healthy
    - [ ] Monitoring normal
    
  documentation:
    - [ ] Update procedures if needed
    - [ ] Record lessons learned
    - [ ] Share results with team
```

## Compliance

**These rollback procedures are MANDATORY. Every deployment must:**

1. Have tested rollback procedures
2. Complete rollback in < 5 minutes
3. Maintain data consistency
4. Include automated verification
5. Provide clear communication

**NO DEPLOYMENT WITHOUT PROVEN ROLLBACK CAPABILITY.**