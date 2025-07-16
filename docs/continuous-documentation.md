# Continuous Documentation Policy

## Overview

This policy mandates continuous documentation maintenance for the SyriaMart platform. **Documentation is code. Outdated documentation is a bug. Undocumented features do not exist.**

## Documentation Requirements

### 1. Documentation Categories

#### Mandatory Documentation Types

```yaml
technical_documentation:
  api_specifications:
    format: OpenAPI 3.x
    location: docs/api-specs/
    review_cycle: every_sprint
    owners: [api-team, service-owners]
    
  event_schemas:
    format: AsyncAPI 2.x
    location: docs/events/
    review_cycle: every_sprint
    owners: [platform-team, service-owners]
    
  architecture:
    format: Markdown + Diagrams
    location: docs/architecture/
    review_cycle: monthly
    owners: [architects, tech-leads]
    
  runbooks:
    format: Markdown
    location: docs/runbooks/
    review_cycle: bi_monthly
    owners: [sre-team, service-owners]
    
  security:
    format: Markdown
    location: docs/security/
    review_cycle: monthly
    owners: [security-team]

code_documentation:
  inline_comments:
    standard: JSDoc/TSDoc
    required_for: [public-apis, complex-logic, algorithms]
    
  readme_files:
    required_for: [every-service, every-library]
    template: docs/templates/README.template.md
    
  adrs:
    required_for: [architectural-decisions]
    template: docs/adrs/000-adr-template.md
    
  changelogs:
    format: Keep-a-Changelog
    required_for: [every-release]
```

### 2. Documentation Standards

#### API Documentation Standards

```yaml
# Example: OpenAPI Documentation Standard
openapi: 3.0.3
info:
  title: Service Name API
  version: 1.0.0
  description: |
    Comprehensive description including:
    - Purpose of the service
    - Key features
    - Integration points
    - Rate limits
    - Authentication methods
  contact:
    name: API Support Team
    email: api-support@syriamart.com
  x-documentation:
    lastReviewed: 2025-01-15
    reviewers: [john.doe, jane.smith]
    nextReview: 2025-02-15

# MANDATORY sections for every endpoint:
paths:
  /resource:
    get:
      summary: Brief summary (required)
      description: |
        Detailed description including:
        - Use cases
        - Business rules
        - Performance characteristics
        - Caching behavior
      operationId: getResource
      tags: [Resources]
      parameters:
        - name: id
          description: Clear parameter description
          required: true
          schema:
            type: string
            format: uuid
            example: "550e8400-e29b-41d4-a716-446655440000"
      responses:
        '200':
          description: Success response with example
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Resource'
              examples:
                success:
                  value:
                    id: "550e8400-e29b-41d4-a716-446655440000"
                    name: "Example Resource"
        '400':
          description: Validation error with examples
        '401':
          description: Authentication error
        '404':
          description: Resource not found
        '500':
          description: Server error
      x-code-samples:
        - lang: 'curl'
          source: |
            curl -X GET https://api.syriamart.com/v1/resource \
              -H "Authorization: Bearer token"
        - lang: 'JavaScript'
          source: |
            const response = await fetch('/api/v1/resource', {
              headers: { 'Authorization': 'Bearer token' }
            });
```

#### Code Documentation Standards

```typescript
/**
 * @module UserService
 * @description Handles user management operations including authentication,
 * profile management, and role-based access control.
 * 
 * @requires DatabaseConnection
 * @requires CacheService
 * @requires EventBus
 * 
 * @since 1.0.0
 * @author Platform Team
 * @lastModified 2025-01-15
 * @reviewer john.doe
 */

/**
 * Creates a new user account with the provided information.
 * 
 * @async
 * @function createUser
 * @param {CreateUserDto} userData - User registration data
 * @param {string} userData.email - User's email address (must be unique)
 * @param {string} userData.password - Password (min 8 chars, requires special char)
 * @param {string} userData.firstName - User's first name
 * @param {string} userData.lastName - User's last name
 * @param {PhoneNumber} userData.phoneNumber - Syrian phone number
 * 
 * @returns {Promise<User>} Created user object
 * 
 * @throws {ConflictError} When email already exists
 * @throws {ValidationError} When input validation fails
 * @throws {DatabaseError} When database operation fails
 * 
 * @emits User.Created - When user is successfully created
 * 
 * @example
 * try {
 *   const user = await userService.createUser({
 *     email: 'user@example.com',
 *     password: 'SecureP@ss123',
 *     firstName: 'John',
 *     lastName: 'Doe',
 *     phoneNumber: { countryCode: '+963', number: '991234567' }
 *   });
 *   console.log('User created:', user.id);
 * } catch (error) {
 *   if (error instanceof ConflictError) {
 *     console.error('Email already exists');
 *   }
 * }
 * 
 * @see {@link https://docs.syriamart.com/api/users#create|API Documentation}
 * @todo Add email verification step
 */
export async function createUser(userData: CreateUserDto): Promise<User> {
  // Implementation
}
```

### 3. Documentation Review Process

#### Automated Documentation Checks

```yaml
# .github/workflows/documentation-check.yml
name: Documentation Compliance

on: [push, pull_request]

jobs:
  doc-validation:
    runs-on: ubuntu-latest
    steps:
      - name: Check API Documentation
        run: |
          # Verify OpenAPI specs are valid
          npx @apidevtools/swagger-cli validate docs/api-specs/**/*.yaml
          
          # Check for missing endpoints
          npm run docs:check:coverage
          
      - name: Check Code Documentation
        run: |
          # JSDoc coverage check
          npx jsdoc -c jsdoc.config.json --explain | grep -E "undocumented|missing"
          
      - name: Check README Updates
        run: |
          # Ensure README is updated with code changes
          ./scripts/check-readme-updates.sh
          
      - name: Check Changelog
        run: |
          # Verify changelog entry for version changes
          if git diff HEAD^ HEAD --name-only | grep -q "package.json"; then
            git diff HEAD^ HEAD --name-only | grep -q "CHANGELOG.md" || exit 1
          fi
```

#### Review Schedule

```typescript
// documentation-review-scheduler.ts
interface DocumentationReview {
  document: string;
  lastReviewed: Date;
  reviewers: string[];
  nextReview: Date;
  status: 'current' | 'needs-review' | 'outdated';
}

class DocumentationReviewScheduler {
  async scheduleReviews(): Promise<void> {
    const documents = await this.getDocumentList();
    
    for (const doc of documents) {
      const daysSinceReview = this.daysSince(doc.lastReviewed);
      
      if (daysSinceReview >= doc.reviewCycleDays) {
        await this.createReviewTask(doc);
        await this.notifyReviewers(doc);
      }
    }
  }
  
  async createReviewTask(doc: DocumentationReview): Promise<void> {
    await this.jira.createIssue({
      type: 'Documentation Review',
      title: `Review Required: ${doc.document}`,
      description: `Documentation review cycle reached for ${doc.document}`,
      assignee: doc.reviewers[0],
      dueDate: this.addDays(new Date(), 7),
      labels: ['documentation', 'review-required'],
      customFields: {
        documentPath: doc.document,
        lastReviewed: doc.lastReviewed,
        reviewCycle: doc.reviewCycleDays
      }
    });
  }
}
```

### 4. Documentation Generation

#### Automated API Documentation

```typescript
// generate-api-docs.ts
import { generateOpenAPISpec } from '@nestjs/swagger';
import { writeFileSync } from 'fs';

async function generateAPIDocs(): Promise<void> {
  const services = await getServiceList();
  
  for (const service of services) {
    // Extract routes and schemas
    const spec = await generateOpenAPISpec(service.app, {
      info: {
        title: `${service.name} API`,
        version: service.version,
        description: service.description,
        'x-documentation': {
          lastGenerated: new Date().toISOString(),
          sourceCommit: process.env.GIT_COMMIT,
          reviewers: service.owners
        }
      }
    });
    
    // Add code samples
    spec.paths = addCodeSamples(spec.paths);
    
    // Add response examples
    spec.paths = addResponseExamples(spec.paths);
    
    // Validate completeness
    validateDocumentation(spec);
    
    // Write to file
    writeFileSync(
      `docs/api-specs/services/${service.name}.yaml`,
      yaml.dump(spec)
    );
  }
}
```

#### Event Documentation Generation

```typescript
// generate-event-docs.ts
async function generateEventDocs(): Promise<void> {
  const events = await scanEventDefinitions();
  
  const asyncApiSpec = {
    asyncapi: '2.6.0',
    info: {
      title: 'SyriaMart Event Catalog',
      version: '1.0.0',
      description: 'Event-driven architecture documentation'
    },
    channels: {}
  };
  
  for (const event of events) {
    asyncApiSpec.channels[event.topic] = {
      description: event.description,
      subscribe: {
        summary: `Subscribe to ${event.name} events`,
        operationId: `on${event.name}`,
        message: {
          $ref: `#/components/messages/${event.name}`,
          examples: event.examples
        }
      },
      bindings: {
        kafka: {
          topic: event.topic,
          partitions: event.partitions,
          replicas: event.replicas
        }
      }
    };
  }
  
  writeFileSync('docs/events/event-catalog.yaml', yaml.dump(asyncApiSpec));
}
```

### 5. Documentation Metrics

#### Coverage Tracking

```typescript
// documentation-metrics.ts
interface DocumentationMetrics {
  apiCoverage: number;        // % of endpoints documented
  codeCoverage: number;       // % of public methods documented
  eventCoverage: number;      // % of events documented
  testCoverage: number;       // % of tests documented
  readmeCompleteness: number; // % of required sections present
  reviewCompliance: number;   // % of docs reviewed on schedule
}

class DocumentationReporter {
  async generateReport(): Promise<DocumentationMetrics> {
    const metrics = await this.calculateMetrics();
    
    // Generate dashboard
    await this.updateDashboard(metrics);
    
    // Check thresholds
    if (metrics.apiCoverage < 100) {
      throw new Error(`API documentation incomplete: ${metrics.apiCoverage}%`);
    }
    
    if (metrics.reviewCompliance < 90) {
      await this.escalateOverdueReviews();
    }
    
    return metrics;
  }
  
  async calculateMetrics(): Promise<DocumentationMetrics> {
    return {
      apiCoverage: await this.calculateAPICoverage(),
      codeCoverage: await this.calculateCodeDocCoverage(),
      eventCoverage: await this.calculateEventCoverage(),
      testCoverage: await this.calculateTestDocCoverage(),
      readmeCompleteness: await this.calculateReadmeCompleteness(),
      reviewCompliance: await this.calculateReviewCompliance()
    };
  }
}
```

### 6. Documentation Templates

#### Service README Template

```markdown
# Service Name

## Overview
Brief description of the service purpose and key features.

## Architecture
- **Type**: Microservice / Library / Tool
- **Language**: TypeScript / Python / Go
- **Framework**: Express / NestJS / FastAPI
- **Database**: PostgreSQL / MongoDB / Redis
- **Dependencies**: List key dependencies

## Getting Started

### Prerequisites
- Node.js 20+
- Docker
- PostgreSQL 15+

### Installation
\`\`\`bash
npm install
npm run setup
\`\`\`

### Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| DB_HOST | Database host | localhost | Yes |
| REDIS_URL | Redis connection | redis://localhost | Yes |

### Running
\`\`\`bash
# Development
npm run dev

# Production
npm run build
npm start
\`\`\`

## API Documentation
- [OpenAPI Specification](./docs/api-spec.yaml)
- [Postman Collection](./docs/postman.json)
- [API Portal](https://api.syriamart.com/docs)

## Testing
\`\`\`bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Contract tests
npm run test:contracts
\`\`\`

## Deployment
See [Deployment Guide](./docs/deployment.md)

## Monitoring
- **Metrics**: http://grafana.syriamart.com/d/service-name
- **Logs**: http://kibana.syriamart.com
- **Alerts**: PagerDuty integration

## Contributing
See [Contributing Guidelines](../../CONTRIBUTING.md)

## Support
- **Team**: @platform-team
- **Slack**: #service-name-support
- **On-Call**: See PagerDuty

## Documentation
- **Last Updated**: 2025-01-15
- **Reviewers**: @john.doe, @jane.smith
- **Next Review**: 2025-02-15
```

### 7. Enforcement

#### Git Hooks

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check if documentation is updated
if git diff --cached --name-only | grep -qE '\.(ts|js|py|go)$'; then
  # Check if corresponding docs are updated
  if ! git diff --cached --name-only | grep -qE '(README|\.yaml|\.md)$'; then
    echo "❌ Error: Code changes detected without documentation updates"
    echo "Please update relevant documentation:"
    echo "  - API specifications (if endpoints changed)"
    echo "  - README (if setup/config changed)"
    echo "  - Changelog (if version changed)"
    exit 1
  fi
fi

# Validate OpenAPI specs
for file in $(git diff --cached --name-only | grep -E '\.yaml$'); do
  if [[ $file == *"api-specs"* ]]; then
    npx @apidevtools/swagger-cli validate $file || exit 1
  fi
done
```

## Compliance

**Documentation is MANDATORY and will be enforced through:**

1. **Automated checks**: Block commits/merges without documentation
2. **Review cycles**: Scheduled reviews with escalation
3. **Metrics tracking**: Documentation coverage dashboard
4. **Quality gates**: Deployment blocked without documentation

**Remember: Undocumented code is technical debt. Outdated documentation is a lie.**