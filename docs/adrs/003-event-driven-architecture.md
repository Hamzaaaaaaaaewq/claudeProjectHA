# ADR-003: Event-Driven Architecture for Inter-Service Communication

## Title

ADR-003: Implement Event-Driven Architecture with Kafka and Schema Registry

## Status

Accepted

## Context

SyriaMart's microservices need to communicate efficiently while maintaining loose coupling:

- Services must react to changes in other services without direct dependencies
- System must handle Syria's unreliable network infrastructure
- Need for eventual consistency across services
- Requirement for audit trails and event sourcing for payments/orders
- Support for real-time features (inventory updates, notifications)
- Handle high volume of events during peak shopping periods

Specific Syrian market considerations:
- Network interruptions require message durability
- Mobile-first approach needs efficient data synchronization
- Multiple payment provider integrations need event tracking

## Decision

We will implement an event-driven architecture with:

1. **Apache Kafka**: Primary event streaming platform
2. **Schema Registry**: Centralized schema management (Avro/Protobuf)
3. **Event Sourcing**: For Order and Payment services
4. **CQRS Pattern**: Separate read/write models where beneficial
5. **RabbitMQ**: For simple message queuing (notifications)
6. **Versioned Schemas**: All events must have versioned schemas

Key principles:
- Events are immutable facts
- Services publish domain events
- Consumers are responsible for idempotency
- All events are versioned and backward compatible

## Consequences

### Positive

- **Loose Coupling**: Services communicate through events, not direct calls
- **Scalability**: Event streaming handles high throughput
- **Resilience**: Services continue working even if others are down
- **Audit Trail**: Complete history of all business events
- **Real-time Updates**: Instant propagation of changes
- **Replay Capability**: Can replay events for debugging or recovery
- **Offline Support**: Events can be processed when connection restored

### Negative

- **Complexity**: Event-driven systems are complex to design and debug
- **Eventual Consistency**: No immediate consistency guarantees
- **Message Ordering**: Ensuring order requires careful design
- **Schema Evolution**: Managing schema changes is challenging
- **Debugging**: Tracing issues across events is difficult
- **Infrastructure**: Requires Kafka cluster management

### Neutral

- **Team Training**: Developers need to understand event-driven patterns
- **Monitoring**: Need comprehensive event monitoring
- **Schema Management**: Centralized schema registry required
- **Testing Strategy**: New testing patterns for event-driven flows

## Alternatives Considered

### Option 1: Synchronous REST APIs Only
- **Description**: Services communicate only via REST APIs
- **Pros**: Simple, immediate consistency, easy debugging
- **Cons**: Tight coupling, cascading failures, no offline support
- **Why Rejected**: Doesn't handle Syria's network reliability issues

### Option 2: Direct Database Integration
- **Description**: Services share databases or read from each other's databases
- **Pros**: Simple queries, immediate consistency
- **Cons**: Tight coupling, scaling issues, no service autonomy
- **Why Rejected**: Violates microservices principles

### Option 3: Redis Pub/Sub
- **Description**: Use Redis for all pub/sub messaging
- **Pros**: Simple, low latency, familiar technology
- **Cons**: No durability, no replay, limited features
- **Why Rejected**: Lacks durability required for critical business events

## Implementation Details

### Event Categories

```yaml
Domain Events:
  - User.Registered
  - Product.Created
  - Order.Placed
  - Payment.Completed
  - Inventory.Updated

Integration Events:
  - Email.SendRequested
  - SMS.SendRequested
  - Search.IndexRequested

System Events:
  - Service.Started
  - Health.CheckFailed
  - RateLimit.Exceeded
```

### Schema Standards

```avro
{
  "namespace": "com.syriamart.events",
  "type": "record",
  "name": "OrderPlaced",
  "fields": [
    {"name": "eventId", "type": "string"},
    {"name": "eventType", "type": "string"},
    {"name": "eventVersion", "type": "int"},
    {"name": "timestamp", "type": "long"},
    {"name": "aggregateId", "type": "string"},
    {"name": "userId", "type": "string"},
    {"name": "orderId", "type": "string"},
    {"name": "items", "type": {"type": "array", "items": "OrderItem"}},
    {"name": "total", "type": "double"},
    {"name": "metadata", "type": ["null", {"type": "map", "values": "string"}]}
  ]
}
```

### Kafka Topic Strategy

```yaml
Topics:
  - user.events (partitioned by userId)
  - catalog.events (partitioned by productId)
  - order.events (partitioned by orderId)
  - payment.events (partitioned by orderId)
  - notification.events (partitioned by userId)

Configuration:
  - Retention: 7 days minimum
  - Replication: 3
  - Partitions: Based on expected throughput
  - Compression: Snappy
```

### Event Flow Example

```
1. User places order via Order Service
2. Order Service:
   - Validates order
   - Saves to database
   - Publishes Order.Placed event
3. Payment Service consumes Order.Placed:
   - Initiates payment
   - Publishes Payment.Initiated
4. Inventory Service consumes Order.Placed:
   - Reserves inventory
   - Publishes Inventory.Reserved
5. Notification Service consumes Order.Placed:
   - Sends order confirmation
```

## References

- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Confluent Schema Registry](https://docs.confluent.io/platform/current/schema-registry/index.html)
- [Event Sourcing Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/event-sourcing)
- Internal Event Standards Document

## Notes

- **Implementation Timeline**: 2 months for core event infrastructure
- **Responsible Team**: Platform Architecture Team
- **Review Date**: 2025-05-15
- **Success Metrics**: <100ms event latency, 99.9% delivery guarantee
- **Monitoring**: Kafka Manager, custom dashboards for event flow