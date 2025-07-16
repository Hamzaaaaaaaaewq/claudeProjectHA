# SyriaMart Development Guidelines

**Last Updated**: January 15, 2025  
**Version**: 2.1.0  
**Status**: Active  
**Latest Update**: Authentication System Development Guidelines

## Table of Contents

1. [Development Environment](#development-environment)
2. [Code Standards](#code-standards)
3. [Git Workflow](#git-workflow)
4. [API Development](#api-development)
5. [Testing Requirements](#testing-requirements)
6. [Security Guidelines](#security-guidelines)
7. [Authentication Development](#authentication-development)
8. [Documentation Standards](#documentation-standards)
9. [Performance Guidelines](#performance-guidelines)
10. [Mandatory Compliance Checklist](#mandatory-compliance-checklist)

## Development Environment

### Prerequisites

- Node.js 20+ LTS
- Docker Desktop
- Kubernetes (minikube or Docker Desktop K8s)
- PostgreSQL 15+
- Redis 7+
- Git 2.40+
- VS Code or WebStorm

### Required VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-azuretools.vscode-docker",
    "ms-kubernetes-tools.vscode-kubernetes-tools",
    "42crunch.vscode-openapi",
    "humao.rest-client",
    "orta.vscode-jest",
    "ryanluker.vscode-coverage-gutters"
  ]
}
```

### Local Setup

```bash
# Clone repository
git clone https://github.com/syriamart/platform.git
cd syriamart

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start infrastructure
docker-compose up -d

# Run database migrations
npm run migrate:all

# Start services in development
npm run dev
```

## Code Standards

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Code Style Rules

#### Naming Conventions

```typescript
// Interfaces: PascalCase with 'I' prefix
interface IUserService {
  findById(id: string): Promise<User>;
}

// Classes: PascalCase
class UserService implements IUserService {
  // Private members: underscore prefix
  private _repository: UserRepository;
  
  // Methods: camelCase
  async findById(id: string): Promise<User> {
    return this._repository.findById(id);
  }
}

// Constants: SCREAMING_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;

// Enums: PascalCase
enum OrderStatus {
  Pending = 'PENDING',
  Processing = 'PROCESSING',
  Completed = 'COMPLETED'
}

// File names: kebab-case
// user-service.ts, order-repository.ts
```

#### Import Order

```typescript
// 1. Node built-ins
import { readFile } from 'fs/promises';

// 2. External dependencies
import express from 'express';
import { Repository } from 'typeorm';

// 3. Internal dependencies
import { Logger } from '@syriamart/common';

// 4. Relative imports
import { UserService } from './services/user-service';
import { User } from './entities/user';
```

### ESLint Configuration

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'plugin:security/recommended'
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    'no-console': 'error',
    'security/detect-object-injection': 'warn'
  }
};
```

### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

## Git Workflow

### Branch Naming

```bash
feature/JIRA-123-user-authentication
bugfix/JIRA-456-payment-validation
hotfix/JIRA-789-critical-security-fix
release/v1.2.0
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat(user-service): add OAuth2 authentication support

- Implement Google OAuth2 provider
- Add Facebook OAuth2 provider
- Update user model with provider fields

BREAKING CHANGE: User model schema updated
Refs: JIRA-123
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding tests
- `chore`: Maintenance tasks
- `build`: Build system changes
- `ci`: CI/CD changes

### Pull Request Process

1. Create feature branch from `develop`
2. Write code following standards
3. Add/update tests (minimum 80% coverage)
4. Update API documentation if needed
5. Run linting and tests locally
6. Create PR with description template
7. Address review comments
8. Squash and merge after approval

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
- [ ] API specs updated
```

## API Development

### API Design Principles

1. **RESTful Design**: Follow REST principles
2. **Consistent Naming**: Use kebab-case for URLs
3. **Versioning**: Include version in URL (`/api/v1/`)
4. **Status Codes**: Use appropriate HTTP status codes
5. **Error Handling**: Consistent error response format
6. **Pagination**: Standard pagination for lists
7. **Filtering**: Query parameter based filtering
8. **HATEOAS**: Include links for resource navigation

### API Implementation Checklist

- [ ] OpenAPI spec created and reviewed
- [ ] Request validation implemented
- [ ] Response serialization configured
- [ ] Error handling added
- [ ] Rate limiting configured
- [ ] Authentication/authorization implemented
- [ ] Logging added
- [ ] Metrics instrumented
- [ ] Contract tests written
- [ ] Load tests performed

### Example Controller

```typescript
@Controller('users')
@ApiTags('users')
export class UserController {
  constructor(
    private readonly userService: IUserService,
    private readonly logger: ILogger,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseGuards(JwtAuthGuard)
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<UserDto> {
    this.logger.info('Finding user by ID', { id, userId: request.user.id });
    
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return UserDto.fromEntity(user);
  }
}
```

## Testing Requirements

### Test Categories

1. **Unit Tests**: Test individual functions/methods
2. **Integration Tests**: Test service interactions
3. **Contract Tests**: Verify API contracts
4. **E2E Tests**: Test complete user flows
5. **Performance Tests**: Load and stress testing
6. **Security Tests**: Vulnerability scanning

### Coverage Requirements

```yaml
unit_tests:
  coverage: 85%
  branches: 80%
  
integration_tests:
  coverage: 80%
  critical_paths: 100%
  
contract_tests:
  coverage: 100%
  
e2e_tests:
  critical_flows: 100%
  happy_paths: 100%
  error_scenarios: 80%
```

### Test Structure

```typescript
describe('UserService', () => {
  let service: UserService;
  let repository: MockRepository<User>;

  beforeEach(() => {
    repository = createMockRepository();
    service = new UserService(repository);
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = 'test-id';
      const expectedUser = createTestUser({ id: userId });
      repository.findById.mockResolvedValue(expectedUser);

      // Act
      const result = await service.findById(userId);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(repository.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      repository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById('unknown')).rejects.toThrow(NotFoundException);
    });
  });
});
```

### Testing Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **One Assertion**: One logical assertion per test
3. **Descriptive Names**: Test names should describe behavior
4. **Test Data Builders**: Use builders for test data
5. **Mock External Dependencies**: Isolate unit under test
6. **No Test Interdependence**: Tests must run independently
7. **Fast Tests**: Keep tests fast (<100ms for unit tests)

## Security Guidelines

### OWASP Top 10 Compliance

1. **Injection**: Use parameterized queries, input validation
2. **Broken Authentication**: Implement proper session management
3. **Sensitive Data Exposure**: Encrypt sensitive data
4. **XML External Entities**: Disable XML external entity processing
5. **Broken Access Control**: Implement proper authorization
6. **Security Misconfiguration**: Secure defaults, minimal exposure
7. **Cross-Site Scripting**: Sanitize all user input
8. **Insecure Deserialization**: Validate serialized data
9. **Using Components with Known Vulnerabilities**: Regular updates
10. **Insufficient Logging**: Comprehensive security logging

### Security Checklist

- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (output encoding)
- [ ] CSRF tokens for state-changing operations
- [ ] Rate limiting implemented
- [ ] Authentication required for protected resources
- [ ] Authorization checks for resource access
- [ ] Sensitive data encrypted at rest
- [ ] TLS for all communications
- [ ] Security headers configured
- [ ] Dependency vulnerabilities scanned
- [ ] Secrets stored in vault, not code

### Example Security Implementation (FROM PRODUCTION CODE)

```typescript
// Strong password validation - services/user-service/src/auth/auth.service.ts
private validatePasswordStrength(password: string): void {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
  
  if (!passwordRegex.test(password)) {
    throw new BadRequestException(
      'Password must be at least 12 characters long and contain at least one uppercase letter, ' +
      'one lowercase letter, one number, and one special character (@$!%*?&)'
    );
  }
  
  if (this.securityService.isCommonPassword(password)) {
    throw new BadRequestException('This password is too common. Please choose a stronger password.');
  }
}

// CSRF Protection - services/user-service/src/auth/auth.controller.ts
@Post('logout')
@RequireCsrf() // Automatic CSRF validation
async logout(@Req() req: Request, @Res() res: Response) {
  // Logout logic
}

// SQL injection prevention
async findByEmail(email: string): Promise<User | null> {
  return this.repository
    .createQueryBuilder('user')
    .where('user.email = :email', { email }) // Parameterized
    .getOne();
}

// Authorization
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin)
async deleteUser(@Param('id') id: string): Promise<void> {
  await this.userService.delete(id);
}
```

## Documentation Standards

### Code Documentation

```typescript
/**
 * Service for managing user operations
 * @class UserService
 * @implements {IUserService}
 */
export class UserService implements IUserService {
  /**
   * Find a user by their ID
   * @param {string} id - The user's UUID
   * @returns {Promise<User>} The user if found
   * @throws {NotFoundException} If user not found
   * @example
   * const user = await userService.findById('123e4567-e89b-12d3-a456-426614174000');
   */
  async findById(id: string): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
}
```

### API Documentation

- All endpoints must have OpenAPI documentation
- Include request/response examples
- Document all error responses
- Describe rate limits and authentication
- Add usage examples in multiple languages

### README Requirements

Each service must have a README with:
1. Service overview and purpose
2. Prerequisites and setup instructions
3. Configuration options
4. API endpoints summary
5. Testing instructions
6. Deployment guide
7. Troubleshooting section

## Performance Guidelines

### Performance Targets

```yaml
api_response_times:
  p50: < 100ms
  p95: < 200ms
  p99: < 500ms

database_queries:
  simple_queries: < 10ms
  complex_queries: < 50ms
  
page_load_time:
  3g_connection: < 3s
  4g_connection: < 1s
```

### Optimization Checklist

- [ ] Database queries optimized (indexes, joins)
- [ ] N+1 queries eliminated
- [ ] Caching implemented where appropriate
- [ ] Pagination for large datasets
- [ ] Lazy loading for relationships
- [ ] Response compression enabled
- [ ] Image optimization implemented
- [ ] CDN configured for static assets
- [ ] Connection pooling configured
- [ ] Async operations for I/O

### Example Optimizations

```typescript
// Efficient query with selected fields
async findActiveUsers(): Promise<User[]> {
  return this.repository
    .createQueryBuilder('user')
    .select(['user.id', 'user.email', 'user.firstName', 'user.lastName'])
    .where('user.isActive = :active', { active: true })
    .orderBy('user.createdAt', 'DESC')
    .limit(100)
    .cache(60000) // Cache for 1 minute
    .getMany();
}

// Batch operations
async updateMultiple(updates: UpdateData[]): Promise<void> {
  const chunks = chunk(updates, 100); // Process in batches
  
  for (const batch of chunks) {
    await this.repository
      .createQueryBuilder()
      .insert()
      .values(batch)
      .onConflict('("id") DO UPDATE SET "updatedAt" = EXCLUDED."updatedAt"')
      .execute();
  }
}
```

## Monitoring and Logging

### Logging Standards

```typescript
// Log levels
logger.error('Payment failed', { orderId, error: err.message, stack: err.stack });
logger.warn('High response time detected', { endpoint, duration });
logger.info('Order created', { orderId, userId, total });
logger.debug('Cache hit', { key, ttl });

// Structured logging
const requestLogger = logger.child({
  requestId: req.id,
  userId: req.user?.id,
  method: req.method,
  path: req.path,
});
```

### Metrics Collection

```typescript
// Prometheus metrics
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});

// Track metrics
const timer = httpRequestDuration.startTimer();
// ... handle request
timer({ method: 'GET', route: '/users/:id', status_code: 200 });
```

## Authentication Development

### Authentication System Architecture

```typescript
// File structure for authentication
services/user-service/
├── src/
│   ├── auth/
│   │   ├── auth.controller.ts    // HTTP endpoints with decorators
│   │   ├── auth.service.ts       // Business logic
│   │   └── dto/                  // Validation DTOs
│   ├── middleware/
│   │   └── csrf.middleware.ts    // CSRF protection
│   └── security/
│       ├── security.service.ts   // Security utilities
│       └── rate-limiter.service.ts // Rate limiting
└── tests/
    └── contracts/
        └── auth.contract.test.ts // Contract tests
```

### Authentication Development Guidelines

1. **Password Requirements**
   ```typescript
   // Minimum requirements (enforced)
   - Length: 12+ characters
   - Uppercase: At least 1
   - Lowercase: At least 1
   - Number: At least 1
   - Special: At least 1 (@$!%*?&)
   ```

2. **Rate Limiting Implementation**
   ```typescript
   // Apply rate limiting decorator
   @Post('login')
   @RateLimit({ prefix: 'login', max: 5, windowMs: 900000 })
   async login(@Body() dto: LoginDto) { }
   ```

3. **CSRF Protection**
   ```typescript
   // State-changing operations require CSRF
   @Post('change-password')
   @RequireCsrf()
   async changePassword(@Body() dto: ChangePasswordDto) { }
   ```

4. **JWT Token Management**
   ```typescript
   // Token configuration (configurable via env)
   JWT_ACCESS_EXPIRY=15m   // 5m, 15m, 30m, 1h
   JWT_REFRESH_EXPIRY=7d   // 1d, 7d, 30d
   ```

5. **Session Security**
   ```typescript
   // Cookie settings for production
   httpOnly: true
   secure: true        // HTTPS only
   sameSite: 'strict'
   maxAge: 86400000    // 24 hours
   ```

### Testing Authentication Features

```typescript
// Contract test example
describe('POST /api/v1/auth/login', () => {
  it('returns 429 after too many attempts', async () => {
    // Test rate limiting
  });
  
  it('returns 401 for invalid credentials', async () => {
    // Test authentication failure
  });
  
  it('returns 403 without CSRF token', async () => {
    // Test CSRF protection
  });
});
```

## Continuous Integration

### CI Pipeline Stages

```yaml
stages:
  - install
  - lint
  - test
  - build
  - security-scan
  - docker-build
  - deploy-staging
  - e2e-tests
  - deploy-production

quality-gates:
  - linting: no-errors
  - unit-tests: pass-100%
  - coverage: minimum-85%  # Updated requirement
  - security: no-high-vulnerabilities
  - build: successful
  - e2e-tests: critical-paths-pass
  - documentation: up-to-date  # New requirement
  - contracts: 100%-coverage   # New requirement
```

### Pre-commit Hooks

```yaml
repos:
  - repo: local
    hooks:
      - id: lint
        name: ESLint
        entry: npm run lint
        language: system
        files: \.(ts|tsx)$
        
      - id: format
        name: Prettier
        entry: npm run format
        language: system
        files: \.(ts|tsx|json|md)$
        
      - id: test
        name: Unit Tests
        entry: npm run test:unit
        language: system
        pass_filenames: false
        
      - id: api-docs
        name: API Documentation Check
        entry: npm run validate:openapi
        language: system
        files: \.(yaml|yml)$
```

## Mandatory Compliance Checklist

Before submitting any PR, ensure ALL items are checked:

### Documentation Compliance
- [ ] OpenAPI 3.x spec updated for API changes
- [ ] AsyncAPI spec updated for event changes
- [ ] README.md updated if setup/config changed
- [ ] ADR created for architectural decisions
- [ ] Changelog updated with changes

### Testing Compliance
- [ ] Unit test coverage ≥ 85%
- [ ] Contract tests for all integrations
- [ ] Negative scenarios tested
- [ ] Performance benchmarks met
- [ ] Security tests passed

### Code Quality Compliance
- [ ] ESLint: 0 errors
- [ ] Prettier: Code formatted
- [ ] TypeScript: No type errors
- [ ] No console.log statements
- [ ] Error handling implemented

### Security Compliance
- [ ] No hardcoded secrets
- [ ] Input validation added
- [ ] SQL injection prevented
- [ ] XSS protection implemented
- [ ] Dependencies documented in registry

### Operational Compliance
- [ ] Rollback procedure documented
- [ ] Monitoring added
- [ ] Logging implemented
- [ ] Health checks added
- [ ] Performance within SLA

## Development Tools

### Recommended IDE Extensions

#### VS Code
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-azuretools.vscode-docker",
    "ms-kubernetes-tools.vscode-kubernetes-tools",
    "42crunch.vscode-openapi",
    "humao.rest-client",
    "orta.vscode-jest",
    "ryanluker.vscode-coverage-gutters",
    "streetsidesoftware.code-spell-checker",
    "yzhang.markdown-all-in-one"
  ]
}
```

### Useful Scripts

```bash
# Check all compliance requirements
npm run compliance:check

# Generate API documentation
npm run docs:api:generate

# Validate all schemas
npm run validate:all

# Run security audit
npm run security:audit

# Check dependency updates
npm run deps:check
```

## Troubleshooting

### Common Authentication Issues

#### Rate Limiting Not Working
```bash
# Check Redis connection
redis-cli ping

# Verify rate limit keys
redis-cli KEYS "login_attempt:*"

# Clear rate limits for testing
redis-cli FLUSHDB
```

#### CSRF Token Validation Fails
```bash
# Check cookie settings
- Ensure SameSite is not too restrictive for your setup
- Verify CORS allows credentials
- Check if cookies are enabled in client
```

#### JWT Token Issues
```bash
# Verify environment variables
echo $JWT_ACCESS_SECRET
echo $JWT_REFRESH_SECRET

# Check token expiry configuration
npm run config:validate
```

### Common Issues

#### API Documentation Validation Fails
```bash
# Validate specific file
npx @apidevtools/swagger-cli validate docs/api-specs/services/user-service.yaml

# Check for common issues
npm run api:lint
```

#### Contract Tests Failing
```bash
# Run contract tests in debug mode
DEBUG=pact* npm run test:contracts

# Verify pact broker connection
npm run pact:verify-broker
```

#### Security Scan Issues
```bash
# Run detailed security scan
npm audit fix --force

# Check specific vulnerability
npm ls <package-name>
```

## Best Practices

### Service Development
1. Start with API specification
2. Write contract tests first
3. Implement with TDD
4. Add comprehensive logging
5. Document all decisions

### Database Management
1. One database per service
2. Use migrations for changes
3. Test rollback procedures
4. Monitor query performance
5. Index foreign keys

### Event-Driven Design
1. Use schema registry
2. Version all events
3. Ensure idempotency
4. Handle out-of-order events
5. Monitor event lag