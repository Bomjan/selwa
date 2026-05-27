# Selwa — Bhutanese Handicrafts Platform

A full-stack e-commerce platform for authentic Bhutanese handicrafts, connecting customers with local artisans.

> School project — Part B

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Database Schema](#database-schema)
4. [Setup and Running](#setup-and-running)
5. [Environment Variables](#environment-variables)
6. [Authentication and Sessions](#authentication-and-sessions)
7. [REST API Reference](#rest-api-reference)
   - [Health](#health)
   - [Auth — Signup](#post-apisignup)
   - [Auth — Login](#post-apilogin)
   - [Auth — Logout](#post-apilogout)
   - [Auth — Me](#get-apime)
   - [Products — List](#get-apiproducts)
   - [Products — Single](#get-apiproductsid)
   - [Wishlist — Get](#get-apiwishlist)
   - [Wishlist — Add](#post-apiwishlist)
   - [Wishlist — Remove](#delete-apiwishlistproductid)
   - [Orders — Place](#post-apiorders)
   - [Admin — Stats](#get-apiadminstats)
   - [Admin — Users](#get-apiadminusers)
   - [Admin — Orders](#get-apiadminorders)
   - [Admin — Create Product](#post-apiadminproducts)
   - [Admin — Update Product](#put-apiadminproductsid)
   - [Admin — Delete Product](#delete-apiadminproductsid)
8. [Error Response Format](#error-response-format)
9. [Frontend Pages](#frontend-pages)
10. [Password Validation](#password-validation)
11. [Data Flow Walkthroughs](#data-flow-walkthroughs)
12. [Tests](#tests)
13. [Dependencies](#dependencies)

---

## Tech Stack

| Layer       | Technology                                        |
|-------------|---------------------------------------------------|
| Language    | Go 1.21                                           |
| Router      | Gorilla Mux v1.8.1                                |
| Database    | PostgreSQL                                        |
| DB driver   | `github.com/lib/pq` v1.10.9                       |
| Passwords   | `golang.org/x/crypto/bcrypt`                      |
| Sessions    | HMAC-SHA256 signed `HttpOnly` cookie              |
| Frontend    | Plain HTML + CSS + Vanilla JavaScript             |
| UI icons    | Bootstrap Icons 1.11.3 (CDN)                      |
| Fonts       | Playfair Display + DM Sans (Google Fonts, CDN)    |
| Cart state  | Browser `localStorage`                            |
| Test mocks  | `github.com/DATA-DOG/go-sqlmock` v1.5.2           |

---

## Project Structure

```
selwa/
├── README.md
├── backend/
│   ├── main.go              entry point: init DB then start router
│   ├── go.mod
│   ├── go.sum
│   ├── schema.sql           CREATE TABLE statements (IF NOT EXISTS, safe to re-run)
│   ├── seed.sql             demo artisans, products, admin account — wipes + re-inserts
│   │
│   ├── db/
│   │   └── db.go            opens + pings the Postgres connection; stores in db.Db
│   │
│   ├── model/
│   │   ├── user.go          User struct, Create, GetUserByID, ValidateUserCredentials
│   │   ├── product.go       Product + ArtisanSummary, CRUD, GetAllProducts, admin stats
│   │   ├── order.go         CreateOrder — transactional insert of orders + order_items
│   │   └── wishlist.go      WishlistItem, GetWishlist, AddToWishlist, RemoveFromWishlist
│   │
│   ├── handler/
│   │   ├── auth.go          Signup, Login, Logout, Me
│   │   ├── product.go       HealthCheck, GetProducts, GetProduct
│   │   ├── order.go         PlaceOrder
│   │   ├── wishlist.go      GetWishlist, AddToWishlist, RemoveFromWishlist
│   │   ├── admin.go         adminGuard, AdminStats, AdminGetUsers, AdminGetOrders,
│   │   │                    AdminCreateProduct, AdminUpdateProduct, AdminDeleteProduct
│   │   ├── auth_test.go     unit tests for Signup + Login handlers
│   │   └── product_test.go  unit tests for HealthCheck + GetProducts + GetProduct
│   │
│   ├── routes/
│   │   └── routes.go        registers every route; falls back to static file server
│   │
│   └── utils/
│       ├── session.go       SetSessionCookie, ClearSessionCookie, UserIDFromCookie
│       ├── response.go      ResponseWithJSON, ResponseWithError
│       └── response_test.go (utility tests)
│
└── frontend/
    ├── index.html           landing page
    ├── signup.html          registration with live password validation
    ├── login.html           sign-in
    ├── profile.html         user profile and order history
    ├── products.html        catalogue with filter + sort
    ├── details.html         single product detail
    ├── cart.html            localStorage cart + checkout
    ├── wishlist.html        saved items
    ├── artisans.html        artisan profiles
    ├── about.html           mission page
    ├── faq.html             FAQ accordion
    ├── admin.html           admin dashboard
    ├── css/
    │   └── global.css       design tokens, shared components
    ├── javascript/
    │   ├── auth.js          signup/login forms, password validation
    │   ├── global.js        cart helpers, nav auth state
    │   ├── products.js      product listing filter + sort
    │   ├── cart.js          cart page, checkout call
    │   ├── artisans.js      artisan page rendering
    │   ├── admin.js         admin dashboard
    │   └── bhutan.js        misc UI helpers
    └── images/
```

---

## Database Schema

### `users`

| Column          | Type           | Constraints                      |
|-----------------|----------------|----------------------------------|
| `id`            | BIGSERIAL      | PRIMARY KEY                      |
| `name`          | VARCHAR(255)   | NOT NULL                         |
| `email`         | VARCHAR(255)   | NOT NULL, UNIQUE                 |
| `password_hash` | VARCHAR(255)   | NOT NULL — bcrypt, never plaintext |
| `is_admin`      | BOOLEAN        | NOT NULL, DEFAULT false          |
| `created_at`    | TIMESTAMP      | DEFAULT CURRENT_TIMESTAMP        |

### `artisans`

| Column       | Type           | Constraints |
|--------------|----------------|-------------|
| `id`         | BIGSERIAL      | PRIMARY KEY |
| `name`       | VARCHAR(255)   | NOT NULL    |
| `location`   | VARCHAR(255)   | NOT NULL    |
| `craft_type` | VARCHAR(100)   | NOT NULL    |
| `bio`        | TEXT           |             |

### `products`

| Column           | Type           | Constraints                                       |
|------------------|----------------|---------------------------------------------------|
| `id`             | BIGSERIAL      | PRIMARY KEY                                       |
| `name`           | VARCHAR(255)   | NOT NULL                                          |
| `description`    | TEXT           | NOT NULL                                          |
| `price`          | DECIMAL(10,2)  | NOT NULL                                          |
| `category`       | VARCHAR(100)   | NOT NULL                                          |
| `artisan_id`     | BIGINT         | REFERENCES artisans(id), nullable                 |
| `region`         | VARCHAR(100)   |                                                   |
| `materials`      | TEXT           |                                                   |
| `stock_quantity` | INTEGER        | DEFAULT 0                                         |
| `image_url`      | VARCHAR(500)   |                                                   |
| `created_at`     | TIMESTAMP      | DEFAULT CURRENT_TIMESTAMP                         |

### `wishlists`

| Column       | Type      | Constraints                                               |
|--------------|-----------|-----------------------------------------------------------|
| `id`         | BIGSERIAL | PRIMARY KEY                                               |
| `user_id`    | BIGINT    | NOT NULL, REFERENCES users(id) ON DELETE CASCADE          |
| `product_id` | BIGINT    | NOT NULL, REFERENCES products(id) ON DELETE CASCADE       |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP                                 |
|              |           | UNIQUE (user_id, product_id)                              |

### `orders`

| Column         | Type          | Constraints                                     |
|----------------|---------------|-------------------------------------------------|
| `id`           | BIGSERIAL     | PRIMARY KEY                                     |
| `user_id`      | BIGINT        | NOT NULL, REFERENCES users(id) ON DELETE CASCADE|
| `status`       | VARCHAR(50)   | NOT NULL, DEFAULT `'pending'`                   |
| `total_amount` | DECIMAL(10,2) | NOT NULL                                        |
| `created_at`   | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP                       |
| `updated_at`   | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP                       |

### `order_items`

| Column       | Type          | Constraints                                              |
|--------------|---------------|----------------------------------------------------------|
| `id`         | BIGSERIAL     | PRIMARY KEY                                              |
| `order_id`   | BIGINT        | NOT NULL, REFERENCES orders(id) ON DELETE CASCADE        |
| `product_id` | BIGINT        | REFERENCES products(id), nullable (preserved for historical records) |
| `quantity`   | INTEGER       | NOT NULL                                                 |
| `unit_price` | DECIMAL(10,2) | NOT NULL — price at time of purchase, not the live price |

---

## Setup and Running

### Prerequisites

- Go 1.21+
- PostgreSQL running locally

### Steps

```bash
# 1. Create the database (once only)
createdb selwa

# 2. Create the tables (safe to re-run — uses IF NOT EXISTS)
psql selwa < backend/schema.sql

# 3. Insert demo artisans, products, and admin account (resets demo data)
psql selwa < backend/seed.sql

# 4. Start the server
cd backend
go run main.go
```

The server starts on `http://localhost:8080`. It also serves the entire `frontend/` directory as static files, so no separate dev server is needed.

### Demo admin account (from seed.sql)

| Field    | Value           |
|----------|-----------------|
| Email    | `admin@selwa.bt`|
| Password | `admin123`      |

---

## Environment Variables

| Variable         | Default                                                                          | Purpose                                                               |
|------------------|----------------------------------------------------------------------------------|-----------------------------------------------------------------------|
| `DATABASE_URL`   | `postgres://sundrabomjan@/selwa?host=/var/run/postgresql&sslmode=disable`        | Full Postgres connection string                                       |
| `PORT`           | `8080`                                                                           | HTTP listen port                                                      |
| `SESSION_SECRET` | `selwa-dev-secret-change-in-production`                                          | HMAC key for signing session tokens — must be changed in production   |
| `COOKIE_SECURE`  | `""` (false)                                                                     | Set to `true` to force the `Secure` cookie flag behind a TLS proxy   |

---

## Authentication and Sessions

### Mechanism

Selwa uses a stateless, cookie-based session. There is no session store; the user ID is embedded directly in the cookie and protected with an HMAC signature.

**On login or signup:**

1. `utils.SetSessionCookie` is called with the authenticated user's ID.
2. It builds a token in the form `<userID>.<HMAC-SHA256-hex>` where the HMAC is computed over the user ID string using `SESSION_SECRET` as the key.
3. The token is written as an `HttpOnly` cookie named `selwa_sess` that expires in 30 days.

**On every protected request:**

1. The handler calls `utils.UserIDFromCookie(r)`.
2. The function reads the `selwa_sess` cookie, splits on `.`, recomputes the HMAC from the ID portion, and compares with `hmac.Equal` (constant-time comparison to prevent timing attacks).
3. If the signature is invalid or the cookie is absent the function returns an error and the handler responds `401 Unauthorized`.

**On logout:**

`utils.ClearSessionCookie` sets `Max-Age: -1` and `Expires: epoch` to instruct the browser to delete the cookie immediately.

### Cookie attributes

| Attribute  | Value                                                                                     |
|------------|-------------------------------------------------------------------------------------------|
| `Name`     | `selwa_sess`                                                                              |
| `HttpOnly` | `true` — not readable from JavaScript                                                     |
| `SameSite` | `Lax`                                                                                     |
| `Secure`   | Set automatically when: request is over TLS, or `X-Forwarded-Proto: https`, or `COOKIE_SECURE=true` |
| `Expires`  | 30 days from the time the cookie is issued                                                |
| `Path`     | `/`                                                                                       |

### Admin authorization

Every admin handler calls the internal `adminGuard(w, r)` helper before doing any work:

```go
func adminGuard(w http.ResponseWriter, r *http.Request) (*model.User, bool) {
    id, err := utils.UserIDFromCookie(r)       // 1. must have valid session
    user, err := model.GetUserByID(id)         // 2. user must exist in DB
    if err != nil || !user.IsAdmin {           // 3. user.is_admin must be true
        utils.ResponseWithError(w, 403, "Admin access required")
        return nil, false
    }
    return user, true
}
```

The `is_admin` column in the `users` table is the sole source of truth. Setting it to `true` in the database gives admin access.

---

## REST API Reference

All endpoints return `Content-Type: application/json`.
All endpoints that accept a request body expect `Content-Type: application/json`.

Base URL: `http://localhost:8080`

---

### Health

#### `GET /api/health`

Server liveness check. No authentication required.

**Response `200 OK`**
```json
{
  "status": "ok",
  "service": "selwa-backend"
}
```

---

### `POST /api/signup`

Creates a new user account. The submitted password is hashed with bcrypt before being stored — the plaintext password is never written to the database. A session cookie is set on success so the user is immediately logged in.

**Request body**

| Field      | Type   | Required | Notes                               |
|------------|--------|----------|-------------------------------------|
| `name`     | string | Yes      | Full display name                   |
| `email`    | string | Yes      | Must not already exist in the database |
| `password` | string | Yes      | Plaintext — hashed server-side with bcrypt cost 10 |

```json
{
  "name": "Pema Dorji",
  "email": "pema@example.com",
  "password": "MyPass@123"
}
```

**Response `201 Created`**

Sets `selwa_sess` cookie (30-day, HttpOnly).

```json
{
  "message": "Account created successfully",
  "user": {
    "id": 12,
    "name": "Pema Dorji",
    "email": "pema@example.com",
    "is_admin": false
  }
}
```

**Error responses**

| HTTP status | `error` value                              | Cause                                          |
|-------------|--------------------------------------------|------------------------------------------------|
| 400         | `"Invalid JSON"`                           | Request body is not valid JSON                 |
| 400         | `"Name, email, and password are required"` | One or more fields are empty strings           |
| 409         | `"Email already exists"`                   | Postgres unique constraint violation (code 23505) |
| 500         | `"Failed to create user"`                  | Any other database error                       |

---

### `POST /api/login`

Validates credentials against the stored bcrypt hash and starts a session.

**Request body**

| Field      | Type   | Required |
|------------|--------|----------|
| `email`    | string | Yes      |
| `password` | string | Yes      |

```json
{
  "email": "pema@example.com",
  "password": "MyPass@123"
}
```

**Response `200 OK`**

Sets `selwa_sess` cookie (30-day, HttpOnly).

```json
{
  "message": "Login successful",
  "user": {
    "id": 12,
    "name": "Pema Dorji",
    "email": "pema@example.com",
    "is_admin": false
  }
}
```

**Error responses**

| HTTP status | `error` value                       | Cause                                              |
|-------------|-------------------------------------|----------------------------------------------------|
| 400         | `"Invalid JSON"`                    | Request body is not valid JSON                     |
| 400         | `"Email and password are required"` | Email or password field is empty                   |
| 401         | `"Invalid email or password"`       | No user with that email, or bcrypt comparison fails|
| 500         | `"Failed to login"`                 | Unexpected database error                          |

---

### `POST /api/logout`

Clears the session cookie. No request body. Always responds `200`.

**Response `200 OK`**
```json
{ "message": "Logged out" }
```

The `selwa_sess` cookie is expired immediately via `Max-Age: -1`.

---

### `GET /api/me`

Returns the currently authenticated user's profile. Requires a valid `selwa_sess` cookie.

**Response `200 OK`**
```json
{
  "id": 12,
  "name": "Pema Dorji",
  "email": "pema@example.com",
  "is_admin": false
}
```

**Error responses**

| HTTP status | `error` value         | Cause                                                         |
|-------------|-----------------------|---------------------------------------------------------------|
| 401         | `"Not authenticated"` | No cookie, or the cookie cannot be read                       |
| 401         | `"Session expired"`   | The user ID in the cookie no longer exists in the database; cookie is also cleared |

---

### `GET /api/products`

Returns every product with its associated artisan joined in. No authentication required.

Products are sorted by `products.id` ascending. If a product has no artisan, the artisan fields are zero values (`"id": 0`, `"name": ""`).

**Response `200 OK`**
```json
[
  {
    "id": 1,
    "name": "Bangchung",
    "description": "A traditional Bhutanese woven bamboo container used for storing and carrying food. Handwoven using split bamboo strips.",
    "price": 800,
    "category": "Crafts",
    "region": "Thimphu",
    "materials": "Bamboo",
    "stock_quantity": 12,
    "image_url": "/images/bangchung.avif",
    "artisan": {
      "id": 1,
      "name": "Karma Choden",
      "location": "Thimphu",
      "craft_type": "Crafts"
    }
  },
  ...
]
```

**Error responses**

| HTTP status | `error` value              |
|-------------|----------------------------|
| 500         | `"Failed to fetch products"` |

---

### `GET /api/products/{id}`

Returns a single product by its integer ID.

**Path parameter**

| Param | Type    | Description   |
|-------|---------|---------------|
| `id`  | integer | Product ID    |

**Response `200 OK`**
```json
{
  "id": 4,
  "name": "Happiness Tea",
  "description": "A soothing herbal tea blend sourced from high-altitude Bhutanese valleys.",
  "price": 450,
  "category": "Wellness",
  "region": "Bumthang",
  "materials": "Wild herbs",
  "stock_quantity": 20,
  "image_url": "/images/happiness-tea.avif",
  "artisan": {
    "id": 3,
    "name": "Dorji Wangchuk",
    "location": "Bumthang",
    "craft_type": "Wellness"
  }
}
```

**Error responses**

| HTTP status | `error` value               | Cause                           |
|-------------|-----------------------------|---------------------------------|
| 400         | `"Invalid product ID"`      | `id` path param is not an integer |
| 404         | `"Product not found"`       | No row with that ID             |
| 500         | `"Failed to fetch product"` | Unexpected database error       |

---

### `GET /api/wishlist`

Returns the authenticated user's wishlist ordered by most recently added. Requires session cookie.

**Response `200 OK`**

Returns an empty array `[]` when the wishlist is empty.

```json
[
  {
    "id": 3,
    "name": "Bhutanese Tea Cup",
    "price": 950,
    "image_url": "/images/tea-cup.avif",
    "category": "Pottery"
  },
  {
    "id": 8,
    "name": "Wild Cordyceps",
    "price": 3500,
    "image_url": "/images/cordyceps.avif",
    "category": "Wellness"
  }
]
```

**Error responses**

| HTTP status | Body                       | Cause               |
|-------------|----------------------------|---------------------|
| 401         | `{"error":"unauthorized"}` | No valid session    |
| 500         | `{"error":"db error"}`     | Database error      |

---

### `POST /api/wishlist`

Adds a product to the authenticated user's wishlist. Idempotent — adding an already-wishlisted product is silently ignored (handled by `ON CONFLICT DO NOTHING`). Requires session cookie.

**Request body**

| Field        | Type    | Required | Notes                     |
|--------------|---------|----------|---------------------------|
| `product_id` | integer | Yes      | Must be a non-zero integer |

```json
{ "product_id": 5 }
```

**Response `204 No Content`** — empty body.

**Error responses**

| HTTP status | Body                          | Cause                                   |
|-------------|-------------------------------|-----------------------------------------|
| 401         | `{"error":"unauthorized"}`    | No valid session                        |
| 400         | `{"error":"invalid request"}` | Missing body, invalid JSON, or `product_id` is 0 |
| 500         | `{"error":"db error"}`        | Database error                          |

---

### `DELETE /api/wishlist/{productID}`

Removes a product from the authenticated user's wishlist. Succeeds silently even if the product was never in the wishlist. Requires session cookie.

**Path parameter**

| Param       | Type    | Description |
|-------------|---------|-------------|
| `productID` | integer | Product ID  |

**Response `204 No Content`** — empty body.

**Error responses**

| HTTP status | Body                             | Cause                              |
|-------------|----------------------------------|------------------------------------|
| 401         | `{"error":"unauthorized"}`       | No valid session                   |
| 400         | `{"error":"invalid product id"}` | `productID` is not a valid integer |
| 500         | `{"error":"db error"}`           | Database error                     |

---

### `POST /api/orders`

Places an order for the authenticated user. Requires session cookie.

The handler creates an `orders` row and one `order_items` row per item inside a single database transaction. If any insert fails the transaction is rolled back and nothing is written.

The `total_amount` on the order is computed server-side as `SUM(unit_price * quantity)` across all items — the client supplies the prices so the frontend must pass the correct prices from the catalogue.

**Request body**

| Field                | Type    | Required | Notes                                         |
|----------------------|---------|----------|-----------------------------------------------|
| `items`              | array   | Yes      | Must contain at least one item                |
| `items[].product_id` | integer | No       | Can be `null` — preserved for custom items    |
| `items[].name`       | string  | No       | Informational label (not stored in orders table) |
| `items[].quantity`   | integer | Yes      | Number of units                               |
| `items[].unit_price` | number  | Yes      | Price per unit in BTN at time of checkout     |

```json
{
  "items": [
    { "product_id": 1, "name": "Bangchung",     "quantity": 2, "unit_price": 800.00 },
    { "product_id": 4, "name": "Happiness Tea", "quantity": 1, "unit_price": 450.00 }
  ]
}
```

Computed total: `(2 × 800) + (1 × 450) = 2050.00 BTN`

**Response `201 Created`**
```json
{ "order_id": 7 }
```

**Error responses**

| HTTP status | `error` value                        | Cause                           |
|-------------|--------------------------------------|---------------------------------|
| 401         | `"Please sign in to place an order"` | No valid session                |
| 400         | `"Invalid request"`                  | Malformed JSON body             |
| 400         | `"Cart is empty"`                    | `items` array has zero elements |
| 500         | `"Failed to place order"`            | Transaction or database error   |

---

### `GET /api/admin/stats`

Returns aggregate platform statistics. Requires admin session.

**Response `200 OK`**
```json
{
  "users": 24,
  "products": 16,
  "orders": 58,
  "revenue_nu": 148600
}
```

`revenue_nu` is `SUM(total_amount)` across all orders where `status != 'cancelled'`, truncated to an integer (BTN).

**Error responses**

| HTTP status | `error` value               |
|-------------|-----------------------------|
| 401         | `"Authentication required"` |
| 403         | `"Admin access required"`   |
| 500         | `"Failed to fetch stats"`   |

---

### `GET /api/admin/users`

Returns every registered user ordered by `id` ascending. Requires admin session.

**Response `200 OK`**
```json
[
  {
    "id": 1,
    "name": "Admin",
    "email": "admin@selwa.bt",
    "is_admin": true,
    "created_at": "2024-01-01T00:00:00Z"
  },
  {
    "id": 2,
    "name": "Pema Dorji",
    "email": "pema@example.com",
    "is_admin": false,
    "created_at": "2024-06-15T10:22:00Z"
  }
]
```

**Error responses**

| HTTP status | `error` value               |
|-------------|-----------------------------|
| 401         | `"Authentication required"` |
| 403         | `"Admin access required"`   |
| 500         | `"Failed to fetch users"`   |

---

### `GET /api/admin/orders`

Returns all orders with basic customer information, ordered by `created_at` descending (newest first). Requires admin session.

**Response `200 OK`**
```json
[
  {
    "id": 7,
    "status": "pending",
    "total_amount": 2050,
    "created_at": "2024-06-20T14:33:00Z",
    "user": {
      "id": 12,
      "name": "Pema Dorji",
      "email": "pema@example.com"
    }
  }
]
```

**Error responses**

| HTTP status | `error` value               |
|-------------|-----------------------------|
| 401         | `"Authentication required"` |
| 403         | `"Admin access required"`   |
| 500         | `"Failed to fetch orders"`  |

---

### `POST /api/admin/products`

Creates a new product. Returns the created product with its artisan data joined in. Requires admin session.

**Request body**

| Field            | Type    | Required | Notes                                         |
|------------------|---------|----------|-----------------------------------------------|
| `name`           | string  | Yes      |                                               |
| `category`       | string  | Yes      |                                               |
| `price`          | number  | Yes      | Must be greater than 0                        |
| `description`    | string  | No       |                                               |
| `artisan_id`     | integer | No       | Must reference an existing artisan; nullable  |
| `region`         | string  | No       |                                               |
| `materials`      | string  | No       |                                               |
| `stock_quantity` | integer | No       | Defaults to 0 if omitted                      |
| `image_url`      | string  | No       |                                               |

```json
{
  "name": "Hand-woven Carry Bag",
  "description": "A sturdy traditional bag made from dyed wool.",
  "price": 1200.00,
  "category": "Crafts",
  "artisan_id": 1,
  "region": "Thimphu",
  "materials": "Wool",
  "stock_quantity": 8,
  "image_url": "/images/bag.avif"
}
```

**Response `201 Created`**
```json
{
  "id": 17,
  "name": "Hand-woven Carry Bag",
  "description": "A sturdy traditional bag made from dyed wool.",
  "price": 1200,
  "category": "Crafts",
  "region": "Thimphu",
  "materials": "Wool",
  "stock_quantity": 8,
  "image_url": "/images/bag.avif",
  "artisan": {
    "id": 1,
    "name": "Karma Choden",
    "location": "Thimphu",
    "craft_type": "Crafts"
  }
}
```

**Error responses**

| HTTP status | `error` value                               | Cause                          |
|-------------|---------------------------------------------|--------------------------------|
| 401         | `"Authentication required"`                 |                                |
| 403         | `"Admin access required"`                   |                                |
| 400         | `"Invalid JSON"`                            | Malformed request body         |
| 400         | `"Name, category, and price are required"`  | Validation failure             |
| 500         | `"Failed to create product"`                | Database error                 |

---

### `PUT /api/admin/products/{id}`

Replaces all fields of an existing product. Every field in `CreateProductInput` is overwritten — any field omitted in the request body is set to its zero value. Returns the updated product with artisan join. Requires admin session.

**Path parameter**

| Param | Type    |
|-------|---------|
| `id`  | integer |

**Request body** — same shape as `POST /api/admin/products`

**Response `200 OK`** — updated product object with artisan join

**Error responses**

| HTTP status | `error` value                | Cause                          |
|-------------|------------------------------|--------------------------------|
| 401         | `"Authentication required"`  |                                |
| 403         | `"Admin access required"`    |                                |
| 400         | `"Invalid product ID"`       | `id` is not an integer         |
| 400         | `"Invalid JSON"`             | Malformed request body         |
| 404         | `"Product not found"`        | No row with that ID            |
| 500         | `"Failed to update product"` | Database error                 |

---

### `DELETE /api/admin/products/{id}`

Permanently deletes a product from the database. Requires admin session.

**Path parameter**

| Param | Type    |
|-------|---------|
| `id`  | integer |

**Response `200 OK`**
```json
{ "message": "Product deleted" }
```

**Error responses**

| HTTP status | `error` value                | Cause                          |
|-------------|------------------------------|--------------------------------|
| 401         | `"Authentication required"`  |                                |
| 403         | `"Admin access required"`    |                                |
| 400         | `"Invalid product ID"`       | `id` is not an integer         |
| 404         | `"Product not found"`        | No row with that ID            |
| 500         | `"Failed to delete product"` | Database error                 |

---

## Error Response Format

All handlers that use `utils.ResponseWithError` produce this envelope:

```json
{ "error": "Human-readable description" }
```

The wishlist handler uses raw `http.Error` with the same `"error"` key in the JSON string.

---

## Frontend Pages

| File            | Purpose                                                                   |
|-----------------|---------------------------------------------------------------------------|
| `index.html`    | Landing page — hero, featured products, artisan showcases                 |
| `products.html` | Full catalogue — category filter sidebar, sort by price                   |
| `details.html`  | Single product detail view — add to cart, add to wishlist                 |
| `cart.html`     | Cart from `localStorage` — qty edit, remove, checkout                     |
| `wishlist.html` | Saved items — calls `/api/wishlist`, remove items                         |
| `signup.html`   | Registration form — real-time password strength + requirements checklist  |
| `login.html`    | Sign-in form                                                              |
| `profile.html`  | User profile — name, email, order history, logout                         |
| `artisans.html` | Artisan profiles — bio, craft type, location                              |
| `about.html`    | Mission and about page                                                    |
| `faq.html`      | FAQ accordion                                                             |
| `admin.html`    | Admin dashboard — stats, user list, order list, product management        |

---

## Password Validation

The signup form enforces four rules in real-time entirely in the browser before the request reaches the server:

| Rule                   | Check                   |
|------------------------|-------------------------|
| At least 8 characters  | `value.length >= 8`     |
| One uppercase letter   | `/[A-Z]/`               |
| One number             | `/[0-9]/`               |
| One special character  | `/[^A-Za-z0-9]/`        |

Each rule appears as a list item beneath the password field. While the field is empty the list is hidden. As soon as the user starts typing it becomes visible and each rule displays:
- A green filled circle and green text when the rule is satisfied.
- An unfilled red circle and red text when it is not.

The strength bar above the list fills 25% per rule met and changes colour: red (Weak) → orange (Fair) → yellow (Good) → green (Strong).

The confirm-password field shows a small inline message: "Passwords match" in green or "Passwords do not match" in red, updated on every keystroke.

**Submitting the form is blocked** if any rule is still failing or if the two password fields do not match. All failing rules are forced to the red state and a top-level error message is shown. The `fetch` call to `/api/signup` is only reached when all four rules pass and the passwords match.

---

## Data Flow Walkthroughs

### Signup

```
Browser                           Server                          Database
  │                                 │                                │
  │  User fills form, clicks submit │                                │
  │                                 │                                │
  │  auth.js validates:             │                                │
  │  - all 4 password rules pass    │                                │
  │  - passwords match              │                                │
  │                                 │                                │
  │  POST /api/signup               │                                │
  │  {name, email, password}  ─────►│                                │
  │                                 │  handler/auth.go Signup()      │
  │                                 │  - decode JSON                 │
  │                                 │  - validate fields not empty   │
  │                                 │  - bcrypt.GenerateFromPassword │
  │                                 │  INSERT INTO users ───────────►│
  │                                 │                          ◄─────│ RETURNING id
  │                                 │  SetSessionCookie(w, r, id)    │
  │◄────────────────────────────────│  201 Created                   │
  │  Set-Cookie: selwa_sess=...     │  {message, user}               │
  │                                 │                                │
  │  auth.js:                       │                                │
  │  localStorage.setItem(user)     │                                │
  │  redirect → profile.html        │                                │
```

### Login

```
Browser                           Server                          Database
  │                                 │                                │
  │  POST /api/login                │                                │
  │  {email, password}        ─────►│                                │
  │                                 │  handler/auth.go Login()       │
  │                                 │  SELECT ... WHERE email=$1 ───►│
  │                                 │                          ◄─────│ row or ErrNoRows
  │                                 │  if no row → 401               │
  │                                 │  bcrypt.Compare(hash, password)│
  │                                 │  if mismatch → 401             │
  │                                 │  SetSessionCookie(w, r, id)    │
  │◄────────────────────────────────│  200 OK {message, user}        │
  │  Set-Cookie: selwa_sess=...     │                                │
```

### Wishlist add

```
Browser                           Server                          Database
  │                                 │                                │
  │  POST /api/wishlist             │                                │
  │  {product_id: 5}          ─────►│                                │
  │  Cookie: selwa_sess=...         │  handler/wishlist.go           │
  │                                 │  UserIDFromCookie → userID     │
  │                                 │  INSERT INTO wishlists         │
  │                                 │  ON CONFLICT DO NOTHING  ─────►│
  │◄────────────────────────────────│  204 No Content                │
```

### Place order

```
Browser                           Server                          Database
  │                                 │                                │
  │  POST /api/orders               │                                │
  │  {items: [...]}           ─────►│                                │
  │  Cookie: selwa_sess=...         │  handler/order.go PlaceOrder() │
  │                                 │  UserIDFromCookie → userID     │
  │                                 │  compute total = sum(qty*price)│
  │                                 │  BEGIN TRANSACTION        ─────►│
  │                                 │  INSERT INTO orders       ─────►│ → orderID
  │                                 │  INSERT INTO order_items  ─────►│ (one per item)
  │                                 │  COMMIT               ─────────►│
  │◄────────────────────────────────│  201 Created {order_id: 7}     │
```

---

## Tests

Tests live in `backend/handler/` and use `go-sqlmock` so no real database is needed.

```bash
cd backend
go test ./handler/...

# Verbose output:
go test -v ./handler/...
```

### `auth_test.go` — Signup and Login handlers

#### Setup helpers

**`setupMockDB(t)`** — creates a `go-sqlmock` mock, assigns it to `db.Db`, and registers a cleanup function that closes the mock when the test ends.

**`postJSON(body string)`** — returns an `*http.Request` with `POST` method and the given string as the JSON body.

#### Signup tests

| Test name                   | What it does                                                                                 | Expected status |
|-----------------------------|----------------------------------------------------------------------------------------------|-----------------|
| `TestSignup_InvalidJSON`    | Sends the string `"not json"` as the body                                                    | `400`           |
| `TestSignup_MissingName`    | Sends `{"email":"a@b.com","password":"secret"}` — name field absent                        | `400`           |
| `TestSignup_MissingEmail`   | Sends `{"name":"Alice","password":"secret"}` — email field absent                          | `400`           |
| `TestSignup_MissingPassword`| Sends `{"name":"Alice","email":"a@b.com"}` — password field absent                         | `400`           |
| `TestSignup_DuplicateEmail` | Configures mock to return a `*pq.Error{Code: "23505"}` on INSERT; sends valid body         | `409`           |
| `TestSignup_Success`        | Configures mock to return `id=7` on INSERT; sends valid body; verifies `user.ID=7` in response | `201`       |

#### Login tests

| Test name                 | What it does                                                                                        | Expected status |
|---------------------------|-----------------------------------------------------------------------------------------------------|-----------------|
| `TestLogin_InvalidJSON`   | Sends `"{bad}"` as the body                                                                         | `400`           |
| `TestLogin_MissingEmail`  | Sends `{"password":"secret"}` — email absent                                                        | `400`           |
| `TestLogin_MissingPassword` | Sends `{"email":"a@b.com"}` — password absent                                                    | `400`           |
| `TestLogin_UserNotFound`  | Configures mock to return `sql.ErrNoRows` on SELECT; sends valid body with unknown email            | `401`           |
| `TestLogin_WrongPassword` | Configures mock to return a valid user row with a known bcrypt hash; sends wrong password           | `401`           |
| `TestLogin_Success`       | Configures mock to return a valid user row; sends the matching password; verifies user email in response | `200`      |

---

### `product_test.go` — HealthCheck, GetProducts, GetProduct handlers

#### Setup helpers

**`productCols()`** — returns a `*sqlmock.Rows` with the 13 columns that the product + artisan join query scans: `id`, `name`, `description`, `price`, `category`, `region`, `materials`, `stock_quantity`, `image_url`, `artisan_id`, `artisan_name`, `artisan_location`, `artisan_craft_type`.

**`addProductRow(rows)`** — adds one row representing the "Bangchung" product (id=1, artisan Karma from Paro) to the provided rows object.

**`getRequest(path)`** — returns an `*http.Request` with `GET` method and the given path.

**`withID(r, id)`** — uses `mux.SetURLVars` to inject an `"id"` path variable into the request, simulating what Gorilla Mux does when a route like `/api/products/{id}` matches.

#### HealthCheck tests

| Test name           | What it does                                               | Expected |
|---------------------|------------------------------------------------------------|----------|
| `TestHealthCheck`   | Calls handler directly; checks status and response fields  | `200`, `status:"ok"`, `service:"selwa-backend"` |

#### GetProducts tests

| Test name                        | What it does                                                          | Expected |
|----------------------------------|-----------------------------------------------------------------------|----------|
| `TestGetProducts_Success`        | Mock returns one Bangchung row; verifies array length and name        | `200`, `len=1`, `Name="Bangchung"` |
| `TestGetProducts_DBError`        | Mock returns `sql.ErrConnDone`; checks error response                 | `500`    |
| `TestGetProducts_ReturnsEmptyList` | Mock returns zero rows; verifies response is `[]` not `null`       | `200`, `len=0` |

#### GetProduct tests

| Test name               | What it does                                                                                              | Expected |
|-------------------------|-----------------------------------------------------------------------------------------------------------|----------|
| `TestGetProduct_BadID`  | Sets `db.Db = nil`; passes `"abc"` as the id path var; handler must return 400 before touching the DB   | `400`    |
| `TestGetProduct_NotFound` | Mock returns `sql.ErrNoRows` for id=999; checks 404 response                                           | `404`    |
| `TestGetProduct_Success`  | Mock returns the Bangchung row for id=1; checks product fields and artisan name                         | `200`, `ID=1`, `Artisan.Name="Karma"` |

---

## Dependencies

```
backend/go.mod

github.com/gorilla/mux v1.8.1         HTTP router — path variables, per-route method enforcement
github.com/lib/pq v1.10.9             Postgres driver for database/sql
golang.org/x/crypto v0.17.0           bcrypt for password hashing
github.com/DATA-DOG/go-sqlmock v1.5.2 SQL mock for handler unit tests (test only)
```

Frontend has no build-time dependencies. Bootstrap Icons and Google Fonts are loaded from CDN via `<link>` tags.
