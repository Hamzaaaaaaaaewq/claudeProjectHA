# API Specifications

**Last Updated**: January 15, 2025  
**Version**: 1.1.0  
**Status**: Active Development  
**Compliance**: ✅ All APIs require OpenAPI 3.x documentation BEFORE implementation  
**Latest Update**: Authentication API fully documented and implemented

This directory contains OpenAPI 3.x specifications for all SyriaMart services.

## Mandatory Documentation Requirements

**⚠️ CRITICAL: No API implementation without complete OpenAPI documentation**

### Documentation Checklist (Enforced by CI/CD)
- ✅ OpenAPI 3.x specification exists
- ✅ All endpoints documented
- ✅ Request/response schemas defined
- ✅ Error responses documented
- ✅ Authentication requirements specified
- ✅ Rate limiting documented
- ✅ Examples provided
- ✅ Contract tests reference the spec

## Structure

```
api-specs/
├── README.md                   # This file
├── common/                     # Shared schemas and components
│   ├── schemas.yaml           # Common data models
│   ├── parameters.yaml        # Common parameters
│   ├── responses.yaml         # Common responses
│   └── security.yaml          # Security schemes
├── services/                   # Service-specific specs
│   ├── user-service.yaml      # User service API ✅
│   ├── catalog-service.yaml   # Catalog service API 📦
│   ├── order-service.yaml     # Order service API 📦
│   ├── payment-service.yaml   # Payment service API ✅
│   ├── vendor-service.yaml    # Vendor service API 📦
│   └── search-service.yaml    # Search service API 📦
└── postman/                    # Postman collections
    └── syriamart.postman_collection.json
```

**Legend**: ✅ Complete | 🚧 In Progress | 📦 Planned

## API Standards

### Versioning

All APIs follow semantic versioning:
- URL: `/api/v1/resource`
- Header: `API-Version: 1.0.0`
- Breaking changes require new major version

### Response Format

Standard success response:
```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2025-01-15T10:00:00Z",
    "version": "1.0.0",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

Standard error response:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource was not found",
    "details": {
      "field": "id",
      "value": "invalid-id"
    },
    "timestamp": "2025-01-15T10:00:00Z",
    "path": "/api/v1/users/invalid-id",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Error Codes

Standardized error codes across all services:

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `RESOURCE_NOT_FOUND` | Resource doesn't exist | 404 |
| `VALIDATION_ERROR` | Input validation failed | 422 |
| `AUTHENTICATION_REQUIRED` | Missing authentication | 401 |
| `INSUFFICIENT_PERMISSIONS` | Lacking required permissions | 403 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `RESOURCE_CONFLICT` | Duplicate or conflicting resource | 409 |
| `INTERNAL_ERROR` | Server error | 500 |
| `SERVICE_UNAVAILABLE` | Temporary outage | 503 |

### HTTP Status Codes

- `200 OK`: Successful GET, PUT
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Invalid request
- `401 Unauthorized`: Missing/invalid auth
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service down

### Pagination

All list endpoints support pagination:
```
GET /api/v1/products?page=1&limit=20&sort=created_at:desc
```

Response includes pagination metadata:
```json
{
  "data": [],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

### Filtering

Query parameter filtering:
```
GET /api/v1/products?category=electronics&price_min=100&price_max=500
```

### Authentication (IMPLEMENTED)

All APIs require authentication except public endpoints:

#### JWT Bearer Token (Primary) ✅
```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```
- **Algorithm**: RS256 (asymmetric)
- **Access Token Expiry**: 15m (configurable)
- **Refresh Token Expiry**: 7d (configurable)
- **Issuer**: syriamart.com
- **Audience**: syriamart-api

#### CSRF Protection ✅
```http
X-CSRF-Token: csrf_token_from_auth_response
```
- Required for: POST, PUT, DELETE, PATCH
- Token rotation on each request
- Double-submit cookie pattern

#### API Key (Service-to-Service)
```http
X-API-Key: sk_live_abcdef123456789
```

#### Session Cookie (Web Clients) ✅
```http
Cookie: refreshToken=...; Secure; HttpOnly; SameSite=Strict
Cookie: csrfToken=...; Secure; SameSite=Strict
```

### Syrian Market Adaptations

#### Phone Number Format
```json
{
  "phone": "+963991234567",
  "phoneCountryCode": "SY"
}
```

#### Currency Handling
```json
{
  "price": {
    "amount": 50000,
    "currency": "SYP",
    "formatted": "50,000 ل.س"
  }
}
```

#### Address Format
```json
{
  "address": {
    "governorate": "Damascus",
    "area": "Mezzeh",
    "street": "Al-Hamra Street",
    "building": "Building 15",
    "floor": "3rd Floor",
    "details": "Near Al-Sham Private University"
  }
}
```

### Rate Limiting

Default rate limits:
- Anonymous: 100 requests/hour
- Authenticated: 1000 requests/hour
- Premium: 10000 requests/hour

Headers:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

### CORS

Allowed origins:
- Production: `https://www.syriamart.com`
- Staging: `https://staging.syriamart.com`
- Development: `http://localhost:3000`

### Localization

Language support via Accept-Language header:
- `ar`: Arabic (default)
- `en`: English

### API Documentation

Each service provides:
- OpenAPI 3.x specification
- Interactive Swagger UI at `/api-docs`
- Postman collection
- Code examples in multiple languages

## API Documentation Status

### Completed APIs ✅

1. **User Service API** (`user-service.yaml`) - **IMPLEMENTED**
   - User registration with strong validation
   - JWT authentication with refresh tokens
   - CSRF protection on state-changing operations
   - Rate limiting (5 attempts/15 min for login)
   - Profile management
   - Address management
   - Session handling with Redis
   - Contract tests: 100% coverage

2. **Payment Service API** (`payment-service.yaml`) - **DOCUMENTED**
   - Payment initiation and processing
   - Wallet management
   - Transaction history
   - Refund handling
   - Syrian providers: SEP, Syriatel Cash, MTN Pay

### In Development 🚧

3. **Catalog Service API** (`catalog-service.yaml`)
   - Product CRUD operations
   - Category management
   - Inventory tracking

### Planned 📦

4. **Order Service API**
5. **Vendor Service API**
6. **Search Service API**
7. **Notification Service API**
8. **Analytics Service API**

## Validation & Testing

### Automated Validation (CI/CD Enforced)

```bash
# Validate all OpenAPI specs
npm run api:validate:all

# Validate specific service
npm run api:validate -- services/user-service.yaml

# Generate TypeScript types from specs
npm run api:generate-types

# Generate client SDKs
npm run api:generate-sdk -- --language typescript

# Update Postman collection
npm run api:update-postman

# Run contract tests against specs
npm run test:contracts:api
```

### Manual Testing

1. **Swagger UI**: Available at `/api-docs` for each service
2. **Postman Collections**: Pre-configured with examples
3. **cURL Examples**: Provided in each spec file

## Development Workflow

### 1. API-First Design Process

```mermaid
graph LR
    A[Requirements] --> B[OpenAPI Spec]
    B --> C[Peer Review]
    C --> D[Contract Tests]
    D --> E[Implementation]
    E --> F[Integration Tests]
    F --> G[Documentation]
```

### 2. Adding a New API

1. **Create OpenAPI Specification**
   ```bash
   cp templates/service-template.yaml services/new-service.yaml
   ```

2. **Define Endpoints and Schemas**
   - Follow existing patterns
   - Use common schemas where possible
   - Include all error responses

3. **Validate Specification**
   ```bash
   npm run api:validate -- services/new-service.yaml
   ```

4. **Generate Contract Tests**
   ```bash
   npm run api:generate-contracts -- services/new-service.yaml
   ```

5. **Implement Service**
   - Use generated types
   - Follow specification exactly
   - Add implementation tests

## Tools & Resources

### Development Tools
- **Swagger Editor**: https://editor.swagger.io
- **OpenAPI Generator**: https://openapi-generator.tech
- **Postman**: https://www.postman.com
- **Spectral**: API linting and validation
- **Redoc**: Beautiful API documentation

### VS Code Extensions
- OpenAPI (Swagger) Editor
- 42Crunch OpenAPI
- REST Client

### Online Validators
- https://apitools.dev/swagger-parser/online/
- https://openapi.tools

## Best Practices

1. **Use References**: Don't duplicate schemas
   ```yaml
   $ref: '#/components/schemas/User'
   ```

2. **Version Everything**: APIs, schemas, and examples

3. **Document Edge Cases**: Null values, empty arrays, limits

4. **Provide Examples**: Request and response examples

5. **Security First**: Document all auth requirements

6. **Error Scenarios**: Document all possible errors

7. **Deprecation**: Use deprecation flags with migration guides

## Recent Updates

- **2025-01-15**: Implemented complete authentication system with all security features
- **2025-01-15**: Added CSRF protection to all state-changing endpoints
- **2025-01-15**: Implemented configurable rate limiting with Redis
- **2025-01-15**: Enhanced password security (12+ chars with complexity)
- **2025-01-15**: Created comprehensive contract tests for auth endpoints
- **2025-01-15**: Created comprehensive payment service API with Syrian payment providers
- **2025-01-15**: Added mandatory documentation requirements and CI/CD enforcement
- **2025-01-15**: Established API-first development workflow
- **2025-01-15**: Added Syrian market adaptations (phone, currency, address formats)

## Authentication Endpoints Summary

| Endpoint | Method | Description | Rate Limit | CSRF |
|----------|--------|-------------|------------|------|
| `/api/v1/auth/register` | POST | User registration | 5/hour | No |
| `/api/v1/auth/login` | POST | User login | 5/15min | No |
| `/api/v1/auth/logout` | POST | User logout | - | Yes |
| `/api/v1/auth/refresh` | POST | Refresh tokens | 10/hour | No |
| `/api/v1/auth/verify-email` | POST | Verify email | - | No |
| `/api/v1/auth/forgot-password` | POST | Password reset | 3/hour | No |
| `/api/v1/auth/reset-password` | POST | Complete reset | - | Yes |