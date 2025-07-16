# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SyriaMart is a comprehensive e-commerce platform designed for the Syrian market, built with microservices architecture and strict engineering standards. The platform addresses unique challenges including limited internet infrastructure (35.8% penetration), mobile-first usage patterns, and local payment methods (SEP, Syriatel Cash, MTN Pay).

**Project Status**: Phase 1 Foundation (Authentication System Implemented)  
**Last Updated**: January 15, 2025  
**Primary Language**: TypeScript  
**Architecture**: Microservices with Event-Driven Communication  
**Latest Achievement**: Secure Authentication System with CSRF, Rate Limiting, and Strong Password Validation

## Critical Compliance Requirements

**⚠️ ALL CHANGES MUST COMPLY WITH MANDATORY STANDARDS - NO EXCEPTIONS**

Before ANY work, review:
- `docs/MANDATORY-STANDARDS.md` - Non-negotiable engineering standards
- `docs/SECURITY.md` - Security requirements and threat models
- `.github/workflows/enforcement-pipeline.yml` - CI/CD gates that enforce compliance

### Key Enforcement Points:
1. **API Documentation**: OpenAPI 3.x specs MUST exist BEFORE implementation
2. **Event Schemas**: AsyncAPI 2.x documentation required for all events
3. **Contract Tests**: 100% coverage including negative scenarios
4. **Security**: Zero high-severity issues allowed
5. **Dependencies**: Must be documented in `docs/dependencies/registry.json`
6. **Rollback**: All deployments must have <5 minute rollback procedures

## Common Commands

### Backend Development
```bash
# Local environment setup
./scripts/setup-local.sh

# Start all services
docker-compose up -d

# Run specific service
cd services/user-service && npm run dev

# Run database migrations
npm run migrate:all            # All services
npm run migrate:user-service   # Specific service
```

### Frontend Development
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Development server
npm run dev               # Start Next.js dev server (http://localhost:3000)

# Build commands
npm run build            # Production build
npm run start            # Start production server
npm run storybook        # Component development (http://localhost:6006)

# Testing
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run e2e              # Run E2E tests with Playwright
npm run e2e:ui           # Run E2E tests with UI

# Code quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting issues
npm run type-check       # TypeScript type checking
npm run format           # Format with Prettier
npm run format:check     # Check formatting

# Performance & Quality
npm run lighthouse       # Run Lighthouse CI
npm run bundle-analyze   # Analyze bundle size
npm run check:bundle     # Check bundle size limits
npm run check:arabic     # Validate Arabic typography

# Visual testing
npm run percy            # Run Percy visual tests

# Pre-commit validation
npm run validate         # Run all checks (type, lint, test, bundle)
```

### Testing
```bash
# Unit tests with coverage
npm run test:unit -- --coverage

# Run specific test file
npm run test:unit -- user.service.test.ts

# Integration tests (requires services running)
npm run test:integration

# Contract tests (Pact)
npm run test:contracts:consumer
npm run test:contracts:provider

# E2E tests
npm run test:e2e

# Run ALL tests (CI simulation)
npm run test:all
```

### Code Quality
```bash
# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Format code
npm run format

# Security scan
npm run security:check

# Check dependency documentation
node scripts/check-dependency-docs.js
```

### API Documentation
```bash
# Validate OpenAPI specs
npm run validate:openapi

# Generate API documentation
npm run docs:api:generate

# Serve API docs locally
npm run docs:api:serve

# Check API coverage
npm run api:coverage:check
```

### Deployment
```bash
# Deploy to staging
./scripts/deploy.sh staging

# Production deployment (requires approvals)
./scripts/deploy.sh production

# Rollback deployment
./scripts/rollback.sh service-name version
```

## Architecture Overview

### Frontend Structure
```
frontend/
├── src/
│   ├── app/            # Next.js 14 App Router pages ✅ STARTED
│   ├── components/     # Reusable UI components 📦
│   │   ├── ui/         # Base components (Button, Input, etc.)
│   │   ├── features/   # Feature-specific components
│   │   └── layouts/    # Layout components
│   ├── lib/            # Utilities and configurations ✅
│   ├── hooks/          # Custom React hooks 📦
│   ├── stores/         # Zustand state management 📦
│   ├── api/            # API client and types 📦
│   └── styles/         # Global styles and themes ✅
├── public/             # Static assets
├── tests/              # Test suites 📦
└── scripts/            # Build and utility scripts ✅

**Tech Stack**: Next.js 14, TypeScript, Tailwind CSS, Zustand, React Query
**Features**: PWA, RTL Support, Offline Mode, Mobile Responsive
```

### Microservices Structure
```
services/
├── user-service/       # Authentication, user management (PostgreSQL, Redis) ✅ IMPLEMENTED
│   ├── src/
│   │   ├── auth/       # JWT auth, login, registration
│   │   ├── security/   # CSRF, rate limiting, security utilities
│   │   └── middleware/ # CSRF protection, auth guards
│   └── tests/
│       └── contracts/  # Pact contract tests with full coverage
├── catalog-service/    # Products, categories, search (MongoDB, Elasticsearch) 📦
├── order-service/      # Order lifecycle, cart (PostgreSQL, Temporal) 📦
├── payment-service/    # Payment processing, wallets (PostgreSQL, Vault) 📋
├── vendor-service/     # Vendor management, analytics (PostgreSQL, ClickHouse) 📦
├── notification-service/ # Email, SMS, push (RabbitMQ) 📦
├── search-service/     # Full-text search, recommendations (Elasticsearch) 📦
└── analytics-service/  # Business intelligence, ML (ClickHouse, Python) 📦

**Legend**: ✅ Implemented | 📋 Documented | 📦 Planned
```

### Key Architecture Patterns

1. **Database per Service**: Each service owns its data, no shared databases
2. **Event-Driven Communication**: Kafka for domain events, RabbitMQ for notifications
3. **API Gateway**: All external requests through gateway with rate limiting
4. **Service Mesh**: Istio for inter-service communication
5. **CQRS**: Separate read/write models for high-traffic services
6. **Event Sourcing**: Payment and Order services maintain event logs

### Technology Stack
- **Backend**: TypeScript, Node.js, NestJS/Express
- **Databases**: PostgreSQL (OLTP), MongoDB (Catalog), Redis (Cache), Elasticsearch (Search)
- **Message Brokers**: Kafka (Events), RabbitMQ (Tasks)
- **Infrastructure**: Kubernetes, Docker, Terraform
- **Monitoring**: Prometheus, Grafana, ELK Stack, Jaeger

## Syrian Market Adaptations

### Payment Integration
- Primary: Cash on Delivery (COD)
- Mobile Wallets: Syriatel Cash, MTN Pay
- Integration specs in: `docs/contracts/payment-provider-*.yaml`

### Performance Optimizations
- Aggressive caching for slow connections
- Progressive image loading
- Offline-first mobile approach
- SMS fallback for critical notifications

### Localization
- RTL support for Arabic
- Currency: Syrian Pound (SYP)
- Phone validation: +963 format
- Date/time: Damascus timezone

## Testing Strategy

### Contract Testing Requirements
Every service interaction MUST have:
- Positive scenarios
- Authentication failures (401, 403)
- Validation errors (422)
- Not found cases (404)
- Service unavailable (503)
- Rate limiting (429)
- Network timeouts
- Idempotency checks

Example location: `services/payment-service/tests/contracts/`

### Performance Benchmarks
- API response: p95 < 200ms
- Page load: < 3s on 3G
- Database queries: < 50ms
- Event processing: < 100ms

## Deployment Process

### Blue-Green Deployment
1. All services use blue-green deployment
2. Canary releases for 10% → 25% → 50% → 100%
3. Automatic rollback on error rate > 5%
4. Health checks required before traffic shift

### Rollback Requirements
- One-command rollback: `./scripts/emergency-rollback.sh`
- Database migrations must be reversible
- Event schema changes need compatibility mode
- Configuration rollback via Vault versioning

## Security Considerations

### Authentication Flow (IMPLEMENTED)

#### Core Features
1. **JWT Tokens**: 
   - Access tokens: Configurable expiry (default 15min)
   - Refresh tokens: Configurable expiry (default 7 days)
   - RS256 asymmetric signing
   - Automatic token rotation

2. **Security Features**:
   - CSRF protection with double-submit cookies
   - Rate limiting: 5 login attempts per 15 minutes
   - Account locking after 10 failed attempts
   - Device fingerprinting for suspicious login detection
   - Strong password validation (12+ chars, complexity requirements)
   - Protection against timing attacks
   - Common password blacklist

3. **Session Management**:
   - Redis-backed sessions
   - Secure HTTP-only cookies
   - SameSite cookie protection
   - Session invalidation on logout

4. **Syrian Market Adaptations**:
   - Phone number validation (+963 format)
   - SMS OTP support (Syriatel, MTN)
   - Arabic error messages
   - RTL UI support

### Sensitive Data Handling
- PII encryption at rest
- Payment tokenization required
- Audit logs for all data access
- Vault for secrets management

## Monitoring & Debugging

### Key Dashboards
- Service Health: https://grafana.syriamart.com/d/service-health
- API Performance: https://grafana.syriamart.com/d/api-metrics
- Business Metrics: https://grafana.syriamart.com/d/business-kpis

### Debugging Tools
```bash
# View service logs
kubectl logs -f deployment/user-service -n production

# Connect to service container
kubectl exec -it user-service-pod -n production -- /bin/sh

# Check event flow
kafka-console-consumer --topic order.events --from-beginning

# Database queries
psql -h localhost -U postgres -d syriamart_users
```

## Important Files Reference

- **Mandatory Standards**: `docs/MANDATORY-STANDARDS.md`
- **API Specs**: `docs/api-specs/services/*.yaml`
- **Event Schemas**: `docs/events/*.yaml`
- **ADRs**: `docs/adrs/` (Architecture decisions)
- **Runbooks**: `docs/runbooks/` (Operational procedures)
- **Dependencies**: `docs/dependencies/registry.json`
- **Rollback Procedures**: `docs/rollback-procedures.md`

## Development Workflow

1. Create feature branch: `feature/JIRA-XXX-description`
2. Write OpenAPI spec first (if API changes)
3. Implement with TDD approach
4. Add contract tests for integrations
5. Update documentation
6. Ensure 85%+ test coverage
7. Run security scans
8. Create PR with mandatory checklist

## Getting Help

- Architecture questions: Review ADRs in `docs/adrs/`
- API documentation: Check `docs/api-specs/`
- Authentication system: See `docs/AUTH.md`
- Deployment issues: See `docs/runbooks/deployment-runbook.md`
- Security concerns: Refer to `docs/SECURITY.md`
- Contract testing: See `docs/contracts/contract-testing-guide.md`
- Rollback procedures: Check `docs/rollback-procedures.md`
- Dependencies: Review `docs/dependencies/registry.json`

## Authentication System Quick Reference

### Environment Variables
```bash
# JWT Configuration
JWT_ACCESS_EXPIRY=15m     # Configurable: 5m, 15m, 30m, 1h
JWT_REFRESH_EXPIRY=7d     # Configurable: 1d, 7d, 30d

# Rate Limiting
LOGIN_MAX_ATTEMPTS=5      # Max login attempts
LOGIN_WINDOW_MS=900000    # 15 minutes window

# Security
ACCOUNT_LOCK_THRESHOLD=10 # Failed attempts before lock
ACCOUNT_LOCK_DURATION=3600 # Lock duration in seconds
```

### Key Files
- Auth Service: `services/user-service/src/auth/auth.service.ts`
- Auth Controller: `services/user-service/src/auth/auth.controller.ts`
- CSRF Middleware: `services/user-service/src/middleware/csrf.middleware.ts`
- Rate Limiter: `services/user-service/src/security/rate-limiter.service.ts`
- Contract Tests: `services/user-service/tests/contracts/auth.contract.test.ts`

## Recent Updates

- **2025-01-16**: Created comprehensive frontend implementation plan and testing strategy
- **2025-01-16**: Initialized frontend project with Next.js 14, TypeScript, and Tailwind CSS
- **2025-01-16**: Set up RTL support and Arabic typography for Syrian market
- **2025-01-16**: Configured development tooling (ESLint, Prettier, Husky, Commitlint)
- **2025-01-16**: Created base app structure with providers and global styles
- **2025-01-16**: Added frontend CI/CD pipeline with 13 stages including RTL testing
- **2025-01-15**: Implemented complete authentication system with advanced security features
- **2025-01-15**: Added CSRF protection middleware for all state-changing operations
- **2025-01-15**: Implemented configurable rate limiting with Redis backing
- **2025-01-15**: Enhanced password validation (12+ chars with complexity requirements)
- **2025-01-15**: Created comprehensive contract tests for all auth endpoints
- **2025-01-15**: Added device fingerprinting and suspicious login detection
- **2025-01-15**: Implemented account locking after failed attempts
- **2025-01-15**: Added comprehensive payment service API documentation
- **2025-01-15**: Established mandatory engineering standards and CI/CD enforcement