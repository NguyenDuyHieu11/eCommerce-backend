# eCommerce Platform

A microservices-based eCommerce system built with Node.js, MongoDB, and Apache Kafka.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Design Decisions](#design-decisions)
- [Project Structure](#project-structure)
- [Message Queue Architecture](#message-queue-architecture)
- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [Roadmap](#roadmap)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 CLIENTS                                      │
│                        (Web App / Mobile App)                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                                     │
│                   Authentication · Rate Limiting · Routing                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                 ┌───────────────────┼───────────────────┐
                 ▼                   ▼                   ▼
        ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
        │  nodejs-       │  │  nodejs-       │  │  sys_message_  │
        │  eCommerce     │  │  eCommerce     │  │  queue         │
        │                │  │                │  │                │
        │ Shop/Auth      │  │ Product/Cart   │  │ Notification   │
        │ Checkout       │  │ Discount       │  │ Consumer       │
        │ Service        │  │ Inventory      │  │                │
        └───────┬────────┘  └───────┬────────┘  └───────┬────────┘
                │                   │                   │
                └─────────┬─────────┘                   │
                          ▼                             │
                 ┌────────────────┐                     │
                 │    MongoDB     │◄────────────────────┘
                 │                │    (saves notifications)
                 └────────────────┘
                          │
                          ▼
                 ┌────────────────┐
                 │     Kafka      │
                 │                │
                 │ notification-  │
                 │ topic          │
                 │ retry-topic    │
                 │ dlq-topic      │
                 └────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **API** | Node.js + Express | RESTful backend |
| **Database** | MongoDB | Primary data store |
| **Message Queue** | Apache Kafka | Async event processing |
| **Auth** | JWT + API Keys | Authentication & authorization |
| **Caching** | Redis | Session & cache (planned) |

---

## Design Decisions

### 1. Monolith-First, Microservices-Ready

**Decision:** Start with a modular monolith (`nodejs-eCommerce`), extract services when needed.

**Why:**
- Faster iteration during MVP phase
- Avoid premature complexity
- Clear module boundaries enable future extraction
- Message queue already decouples notification processing

```
Current State:                    Future State:
┌─────────────────────┐          ┌──────────┐ ┌──────────┐ ┌──────────┐
│  nodejs-eCommerce   │    →     │  Shop    │ │ Product  │ │  Order   │
│  (modular monolith) │          │ Service  │ │ Service  │ │ Service  │
└─────────────────────┘          └──────────┘ └──────────┘ └──────────┘
```

### 2. Event-Driven Notifications

**Decision:** Use Kafka for all notification processing instead of synchronous calls.

**Why:**
- **Decoupling** - API returns immediately, notification happens async
- **Reliability** - Messages persist until processed
- **Scalability** - Add more consumers during peak load
- **Resilience** - Retry mechanism handles temporary failures

```
Without Kafka:                    With Kafka:
┌────────┐                        ┌────────┐
│  API   │──► MongoDB             │  API   │──► Kafka ──► Consumer ──► MongoDB
│        │──► Email (sync)        │        │            (async)        Email
│        │──► Push (sync)         └────────┘
└────────┘
   ↑                                  ↑
   │ Slow, blocks response            │ Fast, non-blocking
```

### 3. Retry Funnel Pattern

**Decision:** Failed messages go through exponential backoff retries before hitting DLQ.

**Why:**
- Most failures are transient (network, temporary DB issues)
- Silent self-healing reduces noise
- Only persistent failures reach DLQ for human review

```
┌─────────────────────────────────────────────────────────────────┐
│                     RETRY FUNNEL                                 │
│                                                                 │
│   Main Topic ──► Fail ──► Retry (10s)                          │
│                           Fail ──► Retry (30s)                  │
│                                    Fail ──► Retry (1min)        │
│                                             Fail ──► Retry (5m) │
│                                                      Fail ──► DLQ│
│                                                                 │
│   Success at any step = Self-healed (silent, no alert)         │
│   Reaches DLQ = Alert ops team                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Partition Key Strategy

**Decision:** Use `receiverId` as Kafka partition key for notifications.

**Why:**
- All notifications for one user go to same partition
- Guarantees ordering per user (Order Placed → Payment → Shipped)
- Enables parallel processing across different users

```
Producer                          Kafka Partitions
   │
   ├── user_001 ──────────────► Partition 0: [msg1, msg4, msg7]
   ├── user_002 ──────────────► Partition 1: [msg2, msg5, msg8]
   └── user_003 ──────────────► Partition 2: [msg3, msg6, msg9]
                                     │
                                     ▼
                              Each user's messages
                              processed in order
```

### 5. Factory Pattern for Products

**Decision:** Use Factory pattern for creating different product types.

**Why:**
- Each product type (Electronics, Clothing, Furniture) has different attributes
- Centralized validation and creation logic
- Easy to add new product types without modifying existing code

```javascript
// Adding new product type is simple:
ProductFactory.registerProductType('Books', BooksProduct);
```

---

## Project Structure

```
eCommerce/
│
├── nodejs-eCommerce/           # Main backend API
│   ├── src/
│   │   ├── controllers/        # HTTP request handlers
│   │   ├── services/           # Business logic
│   │   ├── models/             # MongoDB schemas
│   │   │   └── repositories/   # Data access layer
│   │   ├── routes/             # API endpoints
│   │   ├── middlewares/        # Auth, error handling
│   │   ├── auth/               # JWT utilities
│   │   └── configs/            # App configuration
│   └── server.js               # Entry point
│
├── sys_message_queue/          # Message queue microservice
│   └── src/
│       ├── configs/            # Kafka configuration
│       ├── dbs/                # Kafka connection
│       ├── producer/           # Message producers
│       ├── consumer/           # Message consumers
│       │   ├── notification.consumer.js
│       │   └── retry.consumer.js
│       └── services/           # DLQ, handlers
│           ├── dlq.service.js
│           └── notification.handler.js
│
└── docs/                       # Documentation
    └── DATABASE.md             # Database schema details
```

---

## Message Queue Architecture

### Topics

| Topic | Purpose | Retention |
|-------|---------|-----------|
| `notification-topic` | Primary notification events | 7 days |
| `notification-retry-topic` | Failed messages awaiting retry | 7 days |
| `notification-dlq-topic` | Dead letters for manual review | 30 days |

### Message Flow

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Producer   │────►│ notification-   │────►│    Consumer      │
│ (API calls)  │     │ topic           │     │                  │
└──────────────┘     └─────────────────┘     └────────┬─────────┘
                                                      │
                                              ┌───────┴───────┐
                                              │               │
                                           Success         Failure
                                              │               │
                                              ▼               ▼
                                         ┌────────┐    ┌─────────────┐
                                         │ MongoDB│    │ retry-topic │
                                         │ Email  │    └──────┬──────┘
                                         └────────┘           │
                                                              ▼
                                                    ┌──────────────────┐
                                                    │  Retry Consumer  │
                                                    │  (with delay)    │
                                                    └────────┬─────────┘
                                                             │
                                                     ┌───────┴───────┐
                                                     │               │
                                                  Success    Max Retries
                                                     │               │
                                                     ▼               ▼
                                                ┌────────┐    ┌───────────┐
                                                │ Done!  │    │ DLQ Topic │
                                                │(silent)│    │  (alert)  │
                                                └────────┘    └───────────┘
```

### Retry Configuration

| Attempt | Delay | Cumulative Wait |
|---------|-------|-----------------|
| 1st | 10 seconds | 10s |
| 2nd | 30 seconds | 40s |
| 3rd | 1 minute | 1m 40s |
| 4th | 5 minutes | 6m 40s |
| 5th | 15 minutes | 21m 40s |
| → DLQ | - | - |

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB v6+
- Apache Kafka (or Docker)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd eCommerce

# Install main backend dependencies
cd nodejs-eCommerce
npm install

# Install message queue service dependencies
cd ../sys_message_queue
npm install
```

### Running Services

```bash
# Terminal 1: MongoDB
mongod

# Terminal 2: Kafka (Docker)
docker-compose up -d kafka

# Terminal 3: Main backend
cd nodejs-eCommerce && npm start

# Terminal 4: Notification consumer
cd sys_message_queue
node -e "require('./src/consumer/notification.consumer').notificationConsumer()"

# Terminal 5: Retry consumer
cd sys_message_queue
node -e "require('./src/consumer/retry.consumer').retryConsumer()"
```

### Environment Variables

```bash
# nodejs-eCommerce/.env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your-secret-key

# sys_message_queue/.env
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=ecommerce-system
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [DATABASE.md](docs/DATABASE.md) | MongoDB schema design & relationships |
| [API.md](docs/API.md) | API endpoints (planned) |

---

## Roadmap

### Phase 1: MVP (Current)
- [x] Shop authentication (JWT)
- [x] Product management (CRUD)
- [x] Cart functionality
- [x] Discount system
- [x] Notification via Kafka
- [x] Retry & DLQ mechanism

### Phase 2: Core Features
- [ ] Order management
- [ ] Payment integration
- [ ] Idempotency (duplicate prevention)
- [ ] Email notifications

### Phase 3: Scale
- [ ] User service (separate from Shop)
- [ ] Search service (Elasticsearch)
- [ ] Redis caching
- [ ] Rate limiting

### Phase 4: Production
- [ ] Monitoring (Prometheus/Grafana)
- [ ] Distributed tracing
- [ ] CI/CD pipeline
- [ ] Kubernetes deployment

---

## License

ISC

---

## Contributing

This is a learning project for microservices architecture. Feedback and suggestions welcome!
