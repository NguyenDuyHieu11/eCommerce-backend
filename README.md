# eCommerce System - Database Design & Architecture

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Database Schema (MongoDB)](#database-schema-mongodb)
4. [Message Queue (Kafka)](#message-queue-kafka)
5. [Use Cases & Flows](#use-cases--flows)
6. [Entity Relationships](#entity-relationships)

---

## Overview

This is a **microservices-based eCommerce platform** built with:

| Component | Technology |
|-----------|------------|
| Backend API | Node.js + Express |
| Database | MongoDB |
| Message Queue | Apache Kafka |
| Caching | Redis (planned) |
| Authentication | JWT + API Keys |

### Project Structure

```
eCommerce/
├── nodejs-eCommerce/        # Main backend API (MVP)
│   └── src/
│       ├── models/          # MongoDB schemas
│       ├── services/        # Business logic
│       ├── controllers/     # HTTP handlers
│       └── routes/          # API endpoints
│
└── sys_message_queue/       # Message Queue microservice
    └── src/
        ├── producer/        # Kafka producers
        ├── consumer/        # Kafka consumers
        └── services/        # DLQ, handlers
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│                     (Mobile App / Web Frontend)                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                                     │
│                    (Authentication, Rate Limiting)                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   nodejs-eCommerce  │  │   nodejs-eCommerce  │  │  sys_message_queue  │
│                     │  │                     │  │                     │
│  • Shop Service     │  │  • Product Service  │  │  • Notification     │
│  • Auth Service     │  │  • Cart Service     │  │    Consumer         │
│  • Checkout Service │  │  • Discount Service │  │  • Retry Consumer   │
│                     │  │  • Inventory Service│  │                     │
└──────────┬──────────┘  └──────────┬──────────┘  └──────────┬──────────┘
           │                        │                        │
           └────────────┬───────────┘                        │
                        ▼                                    │
              ┌─────────────────┐                            │
              │    MongoDB      │                            │
              │                 │                            │
              │  • Shops        │                            │
              │  • Products     │                            │
              │  • Carts        │                            │
              │  • Discounts    │                            │
              │  • Inventory    │                            │
              │  • Notifications│◄───────────────────────────┘
              │  • ApiKeys      │
              │  • KeyTokens    │
              └─────────────────┘
                        
                        │
                        ▼
              ┌─────────────────┐
              │     Kafka       │
              │                 │
              │ • notification- │
              │   topic         │
              │ • notification- │
              │   retry-topic   │
              │ • notification- │
              │   dlq-topic     │
              └─────────────────┘
```

---

## Database Schema (MongoDB)

### 1. Shop (Users/Sellers)

**Collection:** `Shops`

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `name` | String | Shop name (max 150 chars) |
| `email` | String | Unique email |
| `passwordHash` | String | Bcrypt hashed password |
| `status` | Enum | `active` / `inactive` |
| `verify` | Boolean | Email verified |
| `roles` | Array[String] | User roles |
| `createdAt` | Date | Auto-generated |
| `updatedAt` | Date | Auto-generated |

```javascript
// Example
{
  _id: ObjectId("..."),
  name: "Tech Store",
  email: "shop@example.com",
  passwordHash: "$2b$10$...",
  status: "active",
  verify: true,
  roles: ["seller", "admin"]
}
```

---

### 2. Product

**Collection:** `Products`

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `product_name` | String | Product name |
| `product_thumbnail` | String | Image URL |
| `product_description` | String | Description |
| `product_price` | Number | Price |
| `product_quantity` | Number | Stock quantity |
| `product_type` | Enum | `Electronics` / `Clothing` / `Furniture` |
| `product_shop` | ObjectId | Reference to Shop |
| `product_attributes` | Mixed | Type-specific attributes |
| `product_slug` | String | URL-friendly name (auto-generated) |
| `product_ratingAverage` | Number | Rating 1-5 |
| `product_variations` | Array | Color, size variations |
| `is_draft` | Boolean | Draft status |
| `is_publish` | Boolean | Published status |

**Type-Specific Collections:**

- `clothing` → `{ brand, size, material }`
- `electronics` → `{ manufacturer, model }`
- `furniture` → `{ manufacturer, model, color }`

```javascript
// Example
{
  _id: ObjectId("..."),
  product_name: "iPhone 15 Pro",
  product_thumbnail: "https://...",
  product_price: 999,
  product_quantity: 50,
  product_type: "Electronics",
  product_shop: ObjectId("shop_id"),
  product_attributes: ObjectId("electronics_id"),
  product_slug: "iphone-15-pro",
  product_ratingAverage: 4.8,
  is_draft: false,
  is_publish: true
}
```

---

### 3. Cart

**Collection:** `carts`

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `cart_state` | Enum | `active` / `pending` / `completed` / `failed` |
| `cart_products` | Array | List of cart items |
| `cart_count` | Number | Total items count |
| `cart_userId` | Number | User ID |
| `createdOn` | Date | Created timestamp |
| `modifiedOn` | Date | Modified timestamp |

```javascript
// Example
{
  _id: ObjectId("..."),
  cart_state: "active",
  cart_products: [
    {
      productId: ObjectId("..."),
      shopId: ObjectId("..."),
      quantity: 2,
      name: "iPhone 15 Pro",
      price: 999
    }
  ],
  cart_count: 2,
  cart_userId: 12345
}
```

---

### 4. Inventory

**Collection:** `Inventories`

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `inven_productId` | ObjectId | Reference to Product |
| `inven_shopId` | ObjectId | Reference to Shop |
| `inven_stock` | Number | Current stock |
| `inven_location` | String | Warehouse location |
| `inven_preservation` | Array | Reservation records |

```javascript
// Example
{
  _id: ObjectId("..."),
  inven_productId: ObjectId("product_id"),
  inven_shopId: ObjectId("shop_id"),
  inven_stock: 100,
  inven_location: "Warehouse A",
  inven_preservation: [
    { cartId: "...", quantity: 2, createdAt: "..." }
  ]
}
```

---

### 5. Discount

**Collection:** `discounts`

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `discount_name` | String | Discount name |
| `discount_description` | String | Description |
| `discount_type` | String | `fixed amount` / `percentage` |
| `discount_value` | Number | Amount or percentage |
| `discount_code` | String | Promo code |
| `discount_start_date` | Date | Valid from |
| `discount_end_date` | Date | Valid until |
| `discount_maximum_uses` | Number | Total usage limit |
| `discount_uses_count` | Number | Times used |
| `discount_user_used` | Array | Users who used |
| `discount_max_uses_per_user` | Number | Per-user limit |
| `discount_min_order_value` | Number | Minimum order amount |
| `discount_shopId` | ObjectId | Reference to Shop |
| `discount_is_active` | Boolean | Active status |
| `discount_apply_to` | Enum | `all` / `specific` |
| `discount_product_ids` | Array | Applicable product IDs |

```javascript
// Example
{
  discount_name: "Summer Sale",
  discount_code: "SUMMER20",
  discount_type: "percentage",
  discount_value: 20,
  discount_start_date: ISODate("2025-06-01"),
  discount_end_date: ISODate("2025-08-31"),
  discount_maximum_uses: 1000,
  discount_uses_count: 150,
  discount_apply_to: "all"
}
```

---

### 6. Notification

**Collection:** `NOTIFICATIONS`

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `noti_type` | Enum | Notification type |
| `noti_senderId` | ObjectId | Who sent (Shop/System) |
| `noti_receiverId` | Number | Target user ID |
| `noti_content` | String | Message content |
| `noti_options` | Object | Additional metadata |

**Notification Types:**
- `ORDER_PLACED` - Order confirmation
- `PAYMENT_SUCCESS` - Payment received
- `PAYMENT_FAILED` - Payment failed
- `SHIPMENT_UPDATE` - Shipping status

```javascript
// Example
{
  noti_type: "ORDER_PLACED",
  noti_senderId: ObjectId("shop_id"),
  noti_receiverId: 12345,
  noti_content: "Your order #123 has been placed!",
  noti_options: {
    orderId: "order_123",
    totalAmount: 999
  }
}
```

---

### 7. ApiKey (Authentication)

**Collection:** `apikeys`

| Field | Type | Description |
|-------|------|-------------|
| `keyId` | String | Unique key identifier |
| `name` | String | Key name/description |
| `shop` | ObjectId | Reference to Shop |
| `hashedKey` | String | Hashed API key |
| `scopes` | Array[String] | Permissions |
| `revoked` | Boolean | Key status |
| `expiresAt` | Date | Expiration date |
| `usageCount` | Number | Times used |
| `lastUsedAt` | Date | Last usage |

---

### 8. KeyToken (JWT)

**Collection:** `keytokens`

| Field | Type | Description |
|-------|------|-------------|
| `user` | ObjectId | Reference to Shop |
| `publicKey` | String | JWT public key |

---

## Message Queue (Kafka)

### Topics

| Topic | Purpose | Consumer Group |
|-------|---------|----------------|
| `notification-topic` | Main notification events | `notification-group` |
| `notification-retry-topic` | Failed messages for retry | `notification-retry-group` |
| `notification-dlq-topic` | Dead Letter Queue | Manual processing |

### Message Structure

```javascript
{
  // Payload
  type: "ORDER_PLACED",           // NOTIFICATION_TYPES enum
  senderId: "shop_123",           // Who triggered
  receiverId: "user_456",         // Target user
  options: {                      // Type-specific data
    orderId: "order_789",
    totalAmount: 99.99
  },
  
  // Metadata (auto-added by producer)
  messageId: "msg_1234567890_abc",
  timestamp: "2025-12-30T10:00:00Z",
  
  // Retry metadata (added on failure)
  retryCount: 0,
  processAfter: null,
  lastError: null
}
```

### Retry Flow (The Funnel)

```
┌─────────────────────────────────────────────────────────────────┐
│                     RETRY FUNNEL                                 │
│                                                                 │
│   Attempt 1 → Fail → Retry Topic (wait 10s)                    │
│   Attempt 2 → Fail → Retry Topic (wait 30s)                    │
│   Attempt 3 → Fail → Retry Topic (wait 1min)                   │
│   Attempt 4 → Fail → Retry Topic (wait 5min)                   │
│   Attempt 5 → Fail → DLQ Topic                                  │
│                                                                 │
│   Success at any attempt → Self-healed! (Silent)               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Retry Delays Configuration

| Attempt | Delay |
|---------|-------|
| 1st retry | 10 seconds |
| 2nd retry | 30 seconds |
| 3rd retry | 1 minute |
| 4th retry | 5 minutes |
| 5th retry | 15 minutes |
| After 5th | → Dead Letter Queue |

---

## Use Cases & Flows

### UC1: Shop Registration

```
1. Shop submits registration form
2. System validates email uniqueness
3. Password is hashed (bcrypt)
4. Shop document created (status: inactive)
5. JWT tokens generated
6. KeyToken document created
7. Return tokens to client
```

### UC2: Create Product

```
1. Shop authenticates (JWT)
2. Shop submits product data
3. System validates product type
4. Type-specific attributes created (clothing/electronics/furniture)
5. Product document created (is_draft: true)
6. Inventory document created
7. Notification sent to followers (via Kafka)
   └─► notification-topic
       └─► Consumer saves to MongoDB
       └─► (Future) Email sent
```

### UC3: Add to Cart

```
1. User selects product
2. System validates product exists & in stock
3. Cart document created/updated
4. Inventory reservation created
5. Return updated cart
```

### UC4: Checkout

```
1. User submits checkout request
2. System validates cart exists
3. Product prices verified (prevent price tampering)
4. Discounts applied (if any)
5. Final amount calculated
6. (Future) Order created
7. (Future) Payment processed
8. Notification sent:
   └─► ORDER_PLACED → User
   └─► PAYMENT_SUCCESS/FAILED → User
9. Inventory deducted
```

### UC5: Notification Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Producer │────►│  Kafka   │────►│ Consumer │────►│ MongoDB  │
│          │     │  Topic   │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                        │
                                        ▼
                                  ┌──────────┐
                                  │  Email   │
                                  │  (TODO)  │
                                  └──────────┘
```

---

## Entity Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENTITY RELATIONSHIP DIAGRAM                   │
│                                                                 │
│   ┌────────┐                                                    │
│   │  Shop  │                                                    │
│   └────┬───┘                                                    │
│        │                                                        │
│        │ 1:N                                                    │
│        ▼                                                        │
│   ┌────────────┐         ┌────────────┐                        │
│   │  Product   │────────►│  Inventory │                        │
│   └────────────┘   1:1   └────────────┘                        │
│        │                                                        │
│        │                 ┌────────────┐                        │
│        └────────────────►│  Clothing  │                        │
│        │           1:1   │ Electronic │                        │
│        │                 │ Furniture  │                        │
│        │                 └────────────┘                        │
│        │                                                        │
│   ┌────┴───┐                                                    │
│   │  Cart  │◄────────────── User (external)                    │
│   └────────┘                                                    │
│        │                                                        │
│        │ N:1                                                    │
│        ▼                                                        │
│   ┌────────────┐                                               │
│   │  Discount  │                                               │
│   └────────────┘                                               │
│                                                                 │
│   ┌────────────────┐                                           │
│   │  Notification  │◄─────── Kafka Consumer                    │
│   └────────────────┘                                           │
│                                                                 │
│   ┌────────────┐     ┌────────────┐                            │
│   │  ApiKey    │     │  KeyToken  │                            │
│   └─────┬──────┘     └─────┬──────┘                            │
│         │                  │                                    │
│         └────────┬─────────┘                                    │
│                  │                                              │
│                  ▼                                              │
│             ┌────────┐                                          │
│             │  Shop  │                                          │
│             └────────┘                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB
- Apache Kafka (for message queue)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd eCommerce

# Install dependencies for main backend
cd nodejs-eCommerce
npm install

# Install dependencies for message queue service
cd ../sys_message_queue
npm install
```

### Running the Services

```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start Kafka (if using Docker)
docker-compose up kafka

# Terminal 3: Start main backend
cd nodejs-eCommerce
npm start

# Terminal 4: Start notification consumer
cd sys_message_queue
node -e "require('./src/consumer/notification.consumer').notificationConsumer()"

# Terminal 5: Start retry consumer
cd sys_message_queue
node -e "require('./src/consumer/retry.consumer').retryConsumer()"
```

---

## Future Enhancements

| Feature | Status | Priority |
|---------|--------|----------|
| Order Management | Planned | High |
| Payment Integration | Planned | High |
| User Service (separate from Shop) | Planned | Medium |
| Email Service | Planned | Medium |
| Push Notifications | Planned | Low |
| Idempotency (duplicate prevention) | Planned | High |
| Search Service (Elasticsearch) | Planned | Low |

---

## License

ISC

---

## Author

Built as a learning project for microservices architecture with Node.js, MongoDB, and Kafka.

