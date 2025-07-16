# Contract Testing Guide

## Overview

This guide defines MANDATORY contract testing requirements for all SyriaMart services. **NO FEATURE OR SERVICE WILL BE DEPLOYED WITHOUT COMPREHENSIVE CONTRACT TESTS.**

## Contract Testing Requirements

### 1. API Contract Tests (REST/GraphQL)

#### Mandatory Test Coverage

```typescript
// REQUIRED: Consumer-Driven Contract Test Example
import { Pact } from '@pact-foundation/pact';
import { UserServiceClient } from '../src/clients/user-service.client';

describe('Order Service → User Service Contract', () => {
  const provider = new Pact({
    consumer: 'order-service',
    provider: 'user-service',
    log: path.resolve(process.cwd(), 'logs', 'pact.log'),
    logLevel: 'warn',
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2
  });

  // MANDATORY: Positive scenario
  describe('get user by id', () => {
    it('returns user when user exists', async () => {
      // Arrange
      await provider.addInteraction({
        state: 'user with id 123 exists',
        uponReceiving: 'a request to get user',
        withRequest: {
          method: 'GET',
          path: '/api/v1/users/123',
          headers: {
            'Authorization': 'Bearer valid-token',
            'Accept': 'application/json'
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            id: '123',
            email: like('user@example.com'),
            firstName: like('John'),
            lastName: like('Doe'),
            role: term({
              matcher: 'customer|vendor|admin',
              generate: 'customer'
            })
          }
        }
      });

      // Act & Assert
      await provider.executeTest(async (mockProvider) => {
        const client = new UserServiceClient(mockProvider.url);
        const user = await client.getUserById('123');
        
        expect(user).toHaveProperty('id', '123');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('role');
      });
    });

    // MANDATORY: Negative scenarios
    it('returns 404 when user does not exist', async () => {
      await provider.addInteraction({
        state: 'user with id 999 does not exist',
        uponReceiving: 'a request for non-existent user',
        withRequest: {
          method: 'GET',
          path: '/api/v1/users/999',
          headers: {
            'Authorization': 'Bearer valid-token'
          }
        },
        willRespondWith: {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            error: {
              code: 'USER_NOT_FOUND',
              message: like('User not found')
            }
          }
        }
      });
    });

    // MANDATORY: Error scenarios
    it('returns 401 when token is invalid', async () => {
      await provider.addInteraction({
        state: 'any',
        uponReceiving: 'a request with invalid token',
        withRequest: {
          method: 'GET',
          path: regex('/api/v1/users/\\d+'),
          headers: {
            'Authorization': 'Bearer invalid-token'
          }
        },
        willRespondWith: {
          status: 401,
          body: {
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid authentication token'
            }
          }
        }
      });
    });

    // MANDATORY: Edge cases
    it('handles network timeout gracefully', async () => {
      // Test timeout handling
      const client = new UserServiceClient('http://timeout.example.com');
      await expect(client.getUserById('123')).rejects.toThrow('Network timeout');
    });

    it('handles malformed response', async () => {
      await provider.addInteraction({
        state: 'server returns malformed response',
        uponReceiving: 'a request that triggers malformed response',
        withRequest: {
          method: 'GET',
          path: '/api/v1/users/malformed'
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'text/plain'
          },
          body: 'not json'
        }
      });
    });
  });
});
```

### 2. Event Contract Tests (AsyncAPI)

#### Mandatory Event Testing

```typescript
// REQUIRED: Event Contract Test
import { SchemaRegistry } from '@confluent/schemaregistry';
import { EventValidator } from '../src/events/validator';

describe('Order Events Contract', () => {
  const registry = new SchemaRegistry({ url: 'http://localhost:8081' });
  const validator = new EventValidator(registry);

  // MANDATORY: Schema validation
  describe('Order.Created event', () => {
    const eventSchema = 'order.created.v1';

    it('validates correct event structure', async () => {
      const event = {
        eventId: 'evt_123',
        eventType: 'Order.Created',
        eventVersion: 1,
        timestamp: Date.now(),
        aggregateId: 'order_456',
        data: {
          orderId: 'order_456',
          userId: 'user_789',
          items: [
            {
              productId: 'prod_123',
              quantity: 2,
              price: 99.99
            }
          ],
          total: 199.98,
          status: 'pending'
        }
      };

      const isValid = await validator.validate(event, eventSchema);
      expect(isValid).toBe(true);
    });

    // MANDATORY: Schema evolution testing
    it('maintains backward compatibility', async () => {
      const v1Schema = await registry.getSchema(eventSchema, 1);
      const v2Schema = await registry.getSchema(eventSchema, 2);
      
      const compatibility = await registry.testCompatibility(
        eventSchema,
        v2Schema,
        'BACKWARD'
      );
      
      expect(compatibility).toBe(true);
    });

    // MANDATORY: Invalid event testing
    it('rejects events with missing required fields', async () => {
      const invalidEvent = {
        eventType: 'Order.Created',
        // Missing required fields
      };

      await expect(
        validator.validate(invalidEvent, eventSchema)
      ).rejects.toThrow('Missing required field: eventId');
    });

    it('rejects events with invalid data types', async () => {
      const invalidEvent = {
        eventId: 123, // Should be string
        eventType: 'Order.Created',
        // ... other fields
      };

      await expect(
        validator.validate(invalidEvent, eventSchema)
      ).rejects.toThrow('Invalid type for eventId');
    });
  });

  // MANDATORY: Consumer contract tests
  describe('Payment Service consumes Order.Created', () => {
    it('processes valid Order.Created events', async () => {
      const consumer = new PaymentEventConsumer();
      const event = createValidOrderCreatedEvent();
      
      await consumer.process(event);
      
      // Verify payment was initiated
      const payment = await paymentRepo.findByOrderId(event.data.orderId);
      expect(payment).toBeDefined();
      expect(payment.status).toBe('pending');
    });

    it('handles duplicate events idempotently', async () => {
      const consumer = new PaymentEventConsumer();
      const event = createValidOrderCreatedEvent();
      
      // Process same event twice
      await consumer.process(event);
      await consumer.process(event);
      
      // Should only create one payment
      const payments = await paymentRepo.findAllByOrderId(event.data.orderId);
      expect(payments).toHaveLength(1);
    });

    it('rejects events from incompatible version', async () => {
      const consumer = new PaymentEventConsumer({ maxVersion: 1 });
      const v3Event = createOrderCreatedEventV3(); // Incompatible version
      
      await expect(consumer.process(v3Event)).rejects.toThrow(
        'Unsupported event version: 3'
      );
    });
  });
});
```

### 3. GraphQL Contract Tests

```typescript
// REQUIRED: GraphQL Contract Test
import { GraphQLClient } from 'graphql-request';
import { gql } from 'graphql-tag';

describe('Catalog Service GraphQL Contract', () => {
  const client = new GraphQLClient('http://localhost:4000/graphql');

  // MANDATORY: Query contract
  it('returns product list with pagination', async () => {
    const query = gql`
      query GetProducts($page: Int!, $limit: Int!) {
        products(page: $page, limit: $limit) {
          items {
            id
            name
            price {
              amount
              currency
            }
          }
          pagination {
            page
            limit
            total
            pages
          }
        }
      }
    `;

    const variables = { page: 1, limit: 10 };
    const response = await client.request(query, variables);
    
    expect(response.products.items).toBeArray();
    expect(response.products.pagination).toMatchObject({
      page: 1,
      limit: 10,
      total: expect.any(Number),
      pages: expect.any(Number)
    });
  });

  // MANDATORY: Mutation contract
  it('creates product with valid input', async () => {
    const mutation = gql`
      mutation CreateProduct($input: CreateProductInput!) {
        createProduct(input: $input) {
          id
          name
          price {
            amount
            currency
          }
        }
      }
    `;

    const input = {
      name: 'Test Product',
      description: 'Test Description',
      price: { amount: 99.99, currency: 'SYP' },
      categoryId: 'cat_123'
    };

    const response = await client.request(mutation, { input });
    expect(response.createProduct).toMatchObject({
      id: expect.any(String),
      name: input.name,
      price: input.price
    });
  });

  // MANDATORY: Error handling
  it('returns validation errors for invalid input', async () => {
    const mutation = gql`
      mutation CreateProduct($input: CreateProductInput!) {
        createProduct(input: $input) {
          id
        }
      }
    `;

    const invalidInput = {
      name: '', // Empty name
      price: { amount: -10 } // Negative price
    };

    await expect(
      client.request(mutation, { input: invalidInput })
    ).rejects.toThrow('Validation error');
  });
});
```

### 4. Negative Scenario Requirements

Every contract test suite MUST include:

```yaml
mandatory_negative_tests:
  authentication:
    - Missing token
    - Invalid token
    - Expired token
    - Insufficient permissions
    
  validation:
    - Missing required fields
    - Invalid data types
    - Out of range values
    - Malformed requests
    
  system_failures:
    - Service unavailable
    - Database connection lost
    - Network timeout
    - Rate limit exceeded
    
  business_logic:
    - Invalid state transitions
    - Constraint violations
    - Duplicate operations
    - Race conditions
```

### 5. Contract Test Execution

#### CI/CD Integration

```yaml
# .github/workflows/contract-tests.yml
name: Contract Tests

on: [push, pull_request]

jobs:
  consumer-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run Consumer Contract Tests
        run: |
          npm run test:contracts:consumer
          
      - name: Publish Pacts
        run: |
          npm run pact:publish
          
  provider-tests:
    runs-on: ubuntu-latest
    needs: consumer-tests
    steps:
      - name: Verify Provider Contracts
        run: |
          npm run test:contracts:provider
          
      - name: Can-I-Deploy Check
        run: |
          npm run pact:can-i-deploy
          
  event-contract-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Validate Event Schemas
        run: |
          npm run test:events:schemas
          
      - name: Check Schema Compatibility
        run: |
          npm run schema:check:compatibility
```

### 6. Contract Test Metrics

#### Required Coverage Metrics

```typescript
// contract-coverage.config.js
module.exports = {
  api: {
    endpoints: {
      minimum: 100, // 100% of endpoints must have contracts
      includes: ['positive', 'negative', 'edge-cases']
    },
    scenarios: {
      authentication: ['valid', 'invalid', 'expired', 'missing'],
      validation: ['valid', 'invalid-types', 'missing-fields', 'constraints'],
      errors: ['4xx', '5xx', 'timeout', 'malformed']
    }
  },
  events: {
    schemas: {
      minimum: 100, // 100% of events must have schemas
      versioning: 'required',
      compatibility: 'backward'
    },
    consumers: {
      idempotency: 'required',
      error_handling: 'required',
      version_compatibility: 'required'
    }
  }
};
```

## Enforcement

**Contract tests are MANDATORY and will be enforced through:**

1. **Pre-commit hooks**: Prevent commits without contract tests
2. **PR checks**: Block merge without passing contracts
3. **Deployment gates**: Prevent deployment without contract verification
4. **Monitoring**: Track contract test coverage and failures

**NO EXCEPTIONS. ALL INTEGRATIONS MUST HAVE CONTRACT TESTS.**