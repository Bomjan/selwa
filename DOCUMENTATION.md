# Selwa — Project Documentation

---

## Cover Page

**Project Title:** Selwa — Bhutanese Handicrafts E-Commerce Platform

**Module:** Web Application Development (Part B)

**Student:** Bomjan

**Date:** June 2026

**Repository:** [GitLab / GitHub — see Appendix]

**Live URL:** [Render deployment — see Appendix]

---

## Abstract

Selwa is a web-based e-commerce platform that enables users to browse and purchase authentic Bhutanese handicrafts directly from local artisans. The platform connects buyers with craft makers from regions across Bhutan — Thimphu, Paro, and Bumthang — offering products ranging from traditional bamboo weaving and woodcraft to wellness goods and organic foods.

The system is built using Go for the backend, PostgreSQL for data persistence, and plain HTML, CSS, and JavaScript for the frontend. Authentication is handled via signed session cookies with bcrypt password hashing. The application is deployed on Render using a managed PostgreSQL database. This document covers the full technical implementation, design decisions, API specification, database schema, and testing approach for the project.

---

## Background and Problem Statement

Bhutan has a rich tradition of handicrafts — bamboo weaving, woodcarving, herbal wellness products, and organic foods — but artisans have limited reach beyond local markets. Buyers outside Bhutan, or even outside specific districts, have no reliable way to discover, verify, or purchase these goods.

Existing e-commerce platforms are generic and do not reflect the cultural context of Bhutanese crafts. There is no dedicated space that connects artisan identity, regional provenance, and product authenticity in a single browsing experience.

**Problem:** Bhutanese artisans lack a digital storefront that preserves cultural identity while enabling e-commerce functionality.

**Proposed Solution:** Selwa — a purpose-built platform with a Himalayan earth-tone design system, artisan profiles, product catalogue, user authentication, wishlist, and order placement.

---

## Aim, Objectives, and Scope

### Aim

To design and develop a full-stack web application that allows users to browse and purchase Bhutanese handicrafts, while giving artisans a dignified digital presence.

### Objectives

1. Build a RESTful JSON API in Go serving product, artisan, auth, wishlist, and order data.
2. Implement secure user registration and login using bcrypt and signed HTTP-only session cookies.
3. Develop a multi-page frontend (HTML/CSS/JS) wired to the live backend API.
4. Design a custom Selwa design system (earth-tone palette, Playfair Display + DM Sans typography) applied consistently across all pages.
5. Deploy the application on a public URL using Render.
6. Write unit tests for authentication and product handler logic.

### Scope

**In scope:**
- Product catalogue (browse, filter by category, view detail)
- User authentication (signup, login, logout, session persistence)
- Wishlist (add, remove, view)
- Order placement (checkout from cart)
- Artisan profiles page
- Static pages: home, about, FAQ

**Out of scope:**
- Payment gateway integration
- Admin dashboard / product management UI
- Email verification or password reset
- Real-time inventory tracking

---

## Technology Used

| Layer | Technology | Version / Notes |
|---|---|---|
| Backend language | Go | 1.21 |
| HTTP router | gorilla/mux | v1.8.1 |
| Database driver | lib/pq (PostgreSQL) | v1.10.9 |
| Password hashing | golang.org/x/crypto bcrypt | v0.17.0 |
| Test mocking | DATA-DOG/go-sqlmock | v1.5.2 |
| Database | PostgreSQL | Managed by Render |
| Frontend | HTML5, CSS3, Vanilla JS | No framework |
| CSS library | Bootstrap 5.3 | Icons + modal JS only |
| Fonts | Google Fonts | Playfair Display, DM Sans |
| Deployment | Render | Free tier (web + DB) |

---

## Requirements

### Functional Requirements

| ID | Requirement |
|---|---|
| FR-01 | Users can register an account with name, email, and password |
| FR-02 | Users can log in and receive a persistent session cookie |
| FR-03 | Users can browse all products |
| FR-04 | Users can view a single product detail page |
| FR-05 | Users can add and remove products from their wishlist |
| FR-06 | Users can place an order from their cart |
| FR-07 | Users can view their own profile |
| FR-08 | Session persists for 30 days via HttpOnly cookie |

### Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-01 | Passwords must be stored as bcrypt hashes (never plaintext) |
| NFR-02 | Session tokens must be HMAC-signed and HttpOnly |
| NFR-03 | API responses must use consistent JSON structure |
| NFR-04 | The frontend must be responsive and usable on mobile |
| NFR-05 | The application must be deployable with a single `go build` |
| NFR-06 | The system must pass all unit tests before deployment |

---

## System Architecture

Selwa follows a layered monolithic architecture. The Go backend serves both the REST API and the static frontend files from a single process.

```
Browser
  |
  v
[ Go HTTP Server — port 8080 ]
  |-- /api/*         --> Handler layer
  |                       |-- model layer (SQL queries)
  |                             |-- db package (database/sql + lib/pq)
  |                                   |-- PostgreSQL
  |-- /* (static)    --> http.FileServer (../frontend)
```

### Package Layout

```
backend/
  main.go              -- entry point: init DB, start router
  db/db.go             -- opens and pings the PostgreSQL connection
  routes/routes.go     -- registers all HTTP routes via gorilla/mux
  handler/             -- HTTP handlers (thin: parse input, call model, write response)
    auth.go
    product.go
    order.go
    wishlist.go
  model/               -- database query functions (all SQL lives here)
    user.go
    product.go
    order.go
    wishlist.go
  utils/
    session.go         -- HMAC-signed cookie creation, verification, clearing
    response.go        -- JSON response helpers

frontend/
  index.html           -- home page
  products.html        -- product catalogue
  details.html         -- single product detail (reads ?id= from URL)
  artisans.html        -- artisan profiles
  cart.html            -- shopping cart (localStorage)
  wishlist.html        -- saved items
  login.html / signup.html
  about.html / faq.html / profile.html
  css/                 -- global.css + page-specific stylesheets
  js/                  -- page-specific JS files
  images/              -- product and hero images (.avif, .webp)
```

### Authentication Flow

```
POST /api/signup or /api/login
  --> handler validates input
  --> model hashes password (bcrypt) or validates it
  --> utils.SetSessionCookie writes HMAC-signed HttpOnly cookie
  --> subsequent requests read cookie via utils.UserIDFromCookie
```

---

## API and Database Design

### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/health | No | Health check |
| GET | /api/products | No | List all products |
| GET | /api/products/{id} | No | Get product by ID |
| POST | /api/signup | No | Register new user |
| POST | /api/login | No | Login, sets session cookie |
| POST | /api/logout | No | Clears session cookie |
| GET | /api/me | Yes | Get current user profile |
| POST | /api/orders | Yes | Place an order |
| GET | /api/wishlist | Yes | Get user wishlist |
| POST | /api/wishlist | Yes | Add product to wishlist |
| DELETE | /api/wishlist/{productID} | Yes | Remove from wishlist |

### Request / Response Examples

**POST /api/signup**
```json
Request:  { "name": "Alice", "email": "alice@example.com", "password": "secret123" }
Response: { "message": "Account created successfully", "user": { "id": 1, "name": "Alice", "email": "alice@example.com" } }
```

**GET /api/products/{id}**
```json
Response: {
  "id": 1, "name": "Bangchung", "price": 800.00,
  "category": "Crafts", "region": "Thimphu",
  "artisan_id": 1, "materials": "Bamboo",
  "stock_quantity": 12, "image_url": "/images/bangchung.avif"
}
```

**POST /api/orders**
```json
Request:  { "items": [{ "product_id": 1, "quantity": 2, "unit_price": 800.00 }] }
Response: { "order_id": 42 }
```

### Entity Relationship Diagram

```
users
  id (PK), name, email (UNIQUE), password_hash, is_admin, created_at

artisans
  id (PK), name, location, craft_type, bio

products
  id (PK), name, description, price, category
  artisan_id (FK -> artisans.id)
  region, materials, stock_quantity, image_url, created_at

wishlists
  id (PK)
  user_id (FK -> users.id, CASCADE)
  product_id (FK -> products.id, CASCADE)
  UNIQUE (user_id, product_id)

orders
  id (PK)
  user_id (FK -> users.id, CASCADE)
  status, total_amount, created_at, updated_at

order_items
  id (PK)
  order_id (FK -> orders.id, CASCADE)
  product_id (FK -> products.id, nullable)
  quantity, unit_price
```

**Relationships:**
- One artisan has many products (one-to-many)
- One user has many wishlist entries (one-to-many)
- One user has many orders (one-to-many)
- One order has many order items (one-to-many)
- One product appears in many order items and wishlist entries

---

## UI Design

### Design System

Selwa uses a custom design system (`css/global.css`) built around a Himalayan earth-tone palette. Bootstrap 5 is retained only for its modal JavaScript; all visual styling is custom.

**Colour Palette:**

| Name | Hex | Usage |
|---|---|---|
| Rust | #8B4513 | Primary CTA buttons, brand accent |
| Warm Sand | #F5E6C8 | Background, card fills |
| Deep Forest | #2D4A2D | Nav background, footer |
| Cream | #FDF8EF | Page background |
| Charcoal | #2C2C2C | Body text |

**Typography:**
- Headings: Playfair Display (serif) — 400, 600, 700 weights
- Body: DM Sans (sans-serif) — 400, 500, 600 weights

### Component Classes

| Class | Element |
|---|---|
| `s-nav` | Top navigation bar |
| `s-logo` | Brand wordmark link |
| `s-hero` | Full-width hero section |
| `p-card` | Product listing card |
| `a-card` | Artisan profile card |
| `s-footer` | Page footer |
| `auth-panel` | Login / signup container (BEM) |

### Pages

| Page | Description |
|---|---|
| `index.html` | Hero, featured categories, brief about section |
| `products.html` | Product grid, loaded dynamically from API |
| `details.html` | Single product — image, description, price, add to cart/wishlist |
| `artisans.html` | Cards for each artisan with craft type and location |
| `cart.html` | Cart items from localStorage, checkout triggers POST /api/orders |
| `wishlist.html` | User wishlist fetched from API |
| `login.html` | Login form |
| `signup.html` | Registration form |
| `about.html` | Brand story |
| `faq.html` | Frequently asked questions |
| `profile.html` | Logged-in user profile |

---

## Implementation

### Backend

The entry point `main.go` calls `db.Init()` then `routes.InitializeRoutes()`. The database package opens a `database/sql` connection to PostgreSQL using either the `DATABASE_URL` environment variable (production) or a local Unix socket (development).

Routing is handled by `gorilla/mux`. Each route maps to a handler function. Handlers are intentionally thin — they decode request bodies, call model functions, and write JSON responses via utility helpers. All SQL queries live in the model layer.

Session management uses a stateless HMAC-SHA256 signed cookie (`selwa_sess`). The cookie is HttpOnly, SameSite=Lax, and marked Secure when the request arrives over HTTPS or behind a trusted proxy (`X-Forwarded-Proto: https`). Sessions last 30 days.

Password hashing uses bcrypt at the default cost factor. Passwords are never stored or logged in plaintext.

### Frontend

Each HTML page loads a corresponding JavaScript file that makes `fetch` calls to the Go API. No JavaScript framework is used.

- `products.js` — fetches `GET /api/products`, renders `p-card` elements
- `details.js` — reads `?id=` from `window.location.search`, fetches `GET /api/products/{id}`
- `auth.js` — posts to `/api/login` or `/api/signup`, redirects on success
- `cart.js` — reads cart from `localStorage`, posts to `/api/orders` on checkout
- `wishlist.js` — fetches and renders wishlist, handles add/remove via API
- `nav.js` — calls `GET /api/me` to show/hide login and profile links

The cart is stored in `localStorage` as a JSON array. On checkout it is sent as a POST body to `/api/orders`, which creates the order in the database.

---

## Testing

Unit tests are written using the Go standard `testing` package. The database is mocked using `go-sqlmock` so tests run without a live PostgreSQL instance.

### Test Files

| File | Coverage |
|---|---|
| `handler/auth_test.go` | Signup and Login handlers |
| `handler/product_test.go` | GetProducts and GetProduct handlers |
| `utils/response_test.go` | JSON response helpers |

### Auth Test Cases

| Test | Scenario | Expected |
|---|---|---|
| TestSignup_InvalidJSON | Malformed JSON body | 400 Bad Request |
| TestSignup_MissingName | Name field absent | 400 Bad Request |
| TestSignup_MissingEmail | Email field absent | 400 Bad Request |
| TestSignup_MissingPassword | Password field absent | 400 Bad Request |
| TestSignup_DuplicateEmail | Email already registered | 409 Conflict |
| TestSignup_Success | Valid new user | 201 Created, user in response |
| TestLogin_InvalidJSON | Malformed JSON | 400 Bad Request |
| TestLogin_MissingEmail | Email absent | 400 Bad Request |
| TestLogin_MissingPassword | Password absent | 400 Bad Request |
| TestLogin_UserNotFound | Unknown email | 401 Unauthorized |
| TestLogin_WrongPassword | Incorrect password | 401 Unauthorized |
| TestLogin_Success | Valid credentials | 200 OK, user in response |

### Running Tests

```bash
cd backend
go test ./...
```

---

## Deployment Details

The application is deployed on **Render** using a free-tier web service and a free-tier managed PostgreSQL database.

### Configuration (`render.yaml`)

```yaml
databases:
  - name: selwa-db
    databaseName: selwa
    user: selwa
    plan: free

services:
  - type: web
    name: selwa
    runtime: go
    rootDir: backend
    buildCommand: go build -o ./selwa-server .
    startCommand: ./selwa-server
    healthCheckPath: /api/health
    plan: free
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: selwa-db
          property: connectionString
```

### Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (injected by Render) |
| `SESSION_SECRET` | HMAC key for signing session cookies (set manually in Render dashboard) |
| `PORT` | HTTP port (defaults to 8080 if unset) |
| `COOKIE_SECURE` | Set to `true` to force Secure flag on cookies |

### Database Setup

After the first deploy, the schema is applied manually:

```bash
psql $DATABASE_URL -f schema.sql
psql $DATABASE_URL -f seed.sql
```

The `schema.sql` file uses `CREATE TABLE IF NOT EXISTS` so it is safe to re-run. The `seed.sql` file truncates and re-inserts all demo data (4 artisans, 16 products, 1 admin account).

---

## Conclusion

Selwa successfully delivers a full-stack e-commerce platform tailored to Bhutanese handicrafts. The project demonstrates:

- A clean layered Go backend (handler → model → db) serving a REST API with proper error handling and HTTP status codes
- Stateless session authentication using HMAC-signed HttpOnly cookies and bcrypt password storage
- A custom design system that reflects the cultural identity of the products being sold
- A fully wired multi-page frontend with no external JavaScript framework
- Unit tests covering all authentication paths using mock database injection
- Cloud deployment on Render with infrastructure-as-code via `render.yaml`

Future improvements could include a payment gateway integration, an admin dashboard for product management, and server-side rendered artisan detail pages.

---

## References

- Go standard library documentation: https://pkg.go.dev/net/http
- gorilla/mux router: https://github.com/gorilla/mux
- lib/pq PostgreSQL driver: https://github.com/lib/pq
- golang.org/x/crypto bcrypt: https://pkg.go.dev/golang.org/x/crypto/bcrypt
- go-sqlmock: https://github.com/DATA-DOG/go-sqlmock
- Bootstrap 5: https://getbootstrap.com
- Render deployment docs: https://render.com/docs
- OWASP Session Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html

---

## Appendix

### A. Repository

GitLab / GitHub link: _(add your repository URL here)_

### B. Live Deployment

Render URL: _(add your deployment URL here)_

### C. Admin Test Account

```
Email:    admin@selwa.bt
Password: admin123
```

### D. Screenshots

_(Add screenshots of the following pages)_

1. Home page — hero and category sections
2. Products page — grid of product cards
3. Product detail page — image, description, add to cart
4. Artisans page — artisan profile cards
5. Login and signup forms
6. Cart and wishlist pages
7. Render dashboard — deployment logs and database

### E. Database Seed Summary

| Table | Records |
|---|---|
| artisans | 4 (Karma Choden, Tashi Dorji, Dorji Wangchuk, Kinley Pem) |
| products | 16 across Crafts, Pottery, Wellness, Food categories |
| users | 1 admin (admin@selwa.bt) |
