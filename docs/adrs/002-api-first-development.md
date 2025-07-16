# ADR-002: API-First Development Approach

## Title

ADR-002: Mandate API-First Development with OpenAPI 3.x Specifications

## Status

Accepted

## Context

SyriaMart requires clear contracts between services and clients to:

- Enable parallel development by multiple teams
- Ensure consistency across all APIs
- Support automatic code generation and validation
- Provide comprehensive documentation for developers
- Enable contract testing between services
- Support multiple client types (web, mobile, third-party)

The platform must integrate with:
- Syrian payment providers (SEP, Syriatel Cash, MTN Pay)
- Local logistics partners
- Third-party services
- Mobile applications with offline capabilities

## Decision

We will adopt an API-First development approach with the following requirements:

1. **OpenAPI 3.x Specification**: Every API endpoint must have a complete, reviewed OpenAPI spec before implementation
2. **Contract-First**: Design API → Review → Generate code → Implement
3. **CI/CD Enforcement**: Pipelines fail without valid, up-to-date OpenAPI documentation
4. **Code Generation**: Use OpenAPI generators for server stubs and client SDKs
5. **Contract Testing**: Automated contract tests for all service interactions
6. **Version Management**: Semantic versioning with backward compatibility

## Consequences

### Positive

- **Clear Contracts**: Unambiguous API contracts between teams
- **Parallel Development**: Frontend and backend can work simultaneously
- **Consistency**: Standardized API design across all services
- **Documentation**: Always up-to-date, interactive API documentation
- **Code Generation**: Reduced boilerplate and human errors
- **Testing**: Contract tests catch integration issues early
- **Client SDKs**: Auto-generated SDKs for multiple languages

### Negative

- **Initial Overhead**: More upfront design work required
- **Learning Curve**: Teams must learn OpenAPI specification
- **Process Change**: Requires discipline to maintain spec-first approach
- **Tooling Dependencies**: Reliance on OpenAPI tooling ecosystem

### Neutral

- **Review Process**: API designs require review before implementation
- **Tool Selection**: Need to standardize on OpenAPI tools
- **Migration**: Existing APIs need to be documented
- **Training**: Teams need training on API-first methodology

## Alternatives Considered

### Option 1: Code-First with Documentation Generation
- **Description**: Write code first, generate documentation from code
- **Pros**: Faster initial development, documentation stays in sync
- **Cons**: Poor API design, inconsistency, no contract validation
- **Why Rejected**: Leads to implementation-driven APIs rather than design-driven

### Option 2: GraphQL for All APIs
- **Description**: Use GraphQL instead of REST
- **Pros**: Flexible queries, strong typing, single endpoint
- **Cons**: Complexity, caching challenges, learning curve
- **Why Rejected**: REST is simpler for most use cases and better for caching

### Option 3: gRPC for Internal Services
- **Description**: Use gRPC for service-to-service communication
- **Pros**: Performance, strong typing, streaming support
- **Cons**: Not web-friendly, requires HTTP/2, complex for external APIs
- **Why Rejected**: Need web-friendly APIs for Syrian infrastructure

## Implementation Details

### OpenAPI Workflow
```yaml
1. Design API in OpenAPI spec
2. Review with team and stakeholders
3. Generate server stubs and client SDKs
4. Implement business logic
5. Generate and run contract tests
6. Deploy with automated documentation
```

### Required Sections
Each OpenAPI spec must include:
- Complete request/response schemas
- Error responses for all status codes
- Security requirements
- Examples for all operations
- Detailed descriptions
- Rate limiting information

### Tooling Stack
- **Editor**: Swagger Editor / Stoplight Studio
- **Validation**: Spectral for linting
- **Code Generation**: OpenAPI Generator
- **Documentation**: Swagger UI / ReDoc
- **Testing**: Dredd / Schemathesis
- **SDK Generation**: OpenAPI Generator

## References

- [OpenAPI Specification 3.0.3](https://spec.openapis.org/oas/v3.0.3)
- [API-First Development](https://swagger.io/resources/articles/adopting-an-api-first-approach/)
- [Contract Testing](https://martinfowler.com/bliki/ContractTest.html)
- Internal API Standards Document

## Notes

- **Implementation Timeline**: Immediate for new APIs, 3 months for existing
- **Responsible Team**: API Governance Team
- **Review Date**: 2025-03-15
- **Success Metrics**: 100% API documentation coverage, <5% contract test failures