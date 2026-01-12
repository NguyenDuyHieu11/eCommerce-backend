# Database Design

This document details the MongoDB schema design for the eCommerce platform.

## Table of Contents

1. [Collections Overview](#collections-overview)
2. [Schema Definitions](#schema-definitions)
3. [Entity Relationships](#entity-relationships)
4. [Indexing Strategy](#indexing-strategy)

---

## Collections Overview

| Collection | Purpose | Document Count (Est.) |
|------------|---------|----------------------|
| `Shops` | Seller accounts & authentication | Low |
| `Products` | Product catalog | High |
| `clothing` / `electronics` / `furniture` | Type-specific attributes | High |
| `Inventories` | Stock management | High |
| `carts` | Shopping carts | Medium |
| `discounts` | Promo codes & offers | Low |
| `NOTIFICATIONS` | User notifications | High |
| `apikeys` | API authentication | Low |
| `keytokens` | JWT token storage | Low |

---

## Schema Definitions

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

## Indexing Strategy

| Collection | Index | Type | Purpose |
|------------|-------|------|---------|
| `Shops` | `email` | Unique | Fast lookup, prevent duplicates |
| `Products` | `product_shop` | Regular | Find products by shop |
| `Products` | `is_draft`, `is_publish` | Compound | Filter by status |
| `Products` | `product_slug` | Unique | URL routing |
| `carts` | `cart_userId` | Regular | Find user's cart |
| `Inventories` | `inven_productId` | Regular | Stock lookup |
| `discounts` | `discount_code` | Unique | Promo code validation |
| `apikeys` | `keyId` | Unique | API authentication |

---

## Design Decisions

### Why Separate Collections for Product Types?

Instead of embedding all attributes in the Product document, we use separate collections (`clothing`, `electronics`, `furniture`) because:

1. **Schema Flexibility** - Each type has different required fields
2. **Query Efficiency** - Avoid scanning large embedded documents
3. **Future Extensibility** - Easy to add new product types

### Why `cart_userId` is Number, not ObjectId?

The cart system is designed to support both:
- Registered users (with MongoDB ObjectId)
- Guest users (with session-based numeric ID)

This allows cart persistence before user registration.

### Why Notifications Use Kafka?

See [README.md](../README.md#message-queue-architecture) for the architectural decision on async notifications.

