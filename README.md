# Selwa — Bhutanese Artisan Marketplace

A web application that connects Bhutanese artisans with buyers. Customers can browse
handcrafted products, add items to a cart, create an account, and view their profile.
Artisans and product data are stored in a PostgreSQL database served through a Go backend.

> **School project — Part B**

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Database Schema](#database-schema)
4. [Backend Architecture](#backend-architecture)
   - [How the server starts](#how-the-server-starts)
   - [Router — Gorilla Mux](#router--gorilla-mux)
   - [Handlers](#handlers)
   - [Models](#models)
   - [Utilities](#utilities)
5. [API Reference](#api-reference)
6. [Frontend Architecture](#frontend-architecture)
   - [Pages](#pages)
   - [JavaScript files](#javascript-files)
   - [CSS / Design system](#css--design-system)
7. [Data flow walkthroughs](#data-flow-walkthroughs)
   - [Signup flow](#signup-flow)
   - [Login flow](#login-flow)
   - [Add to cart flow](#add-to-cart-flow)
   - [Checkout flow](#checkout-flow)
8. [How to Run](#how-to-run)
9. [Dependencies](#dependencies)
10. [What Is Working](#what-is-working)
11. [What Is NOT Working](#what-is-not-working)
12. [Security notes](#security-notes)

---

## Tech Stack

| Layer      | Technology                          | Why                                                       |
|------------|-------------------------------------|-----------------------------------------------------------|
| Language   | Go 1.21                             | Fast, simple, compiled, good for HTTP servers             |
| Router     | Gorilla Mux v1.8.1                  | Clean `{id}` path variables, per-route method enforcement |
| Database   | PostgreSQL                          | Relational, good for products + artisan join queries      |
| DB driver  | `lib/pq`                            | Standard Go PostgreSQL driver                             |
| Passwords  | `golang.org/x/crypto/bcrypt`        | Industry-standard password hashing                        |
| Frontend   | Plain HTML + CSS + Vanilla JS       | No framework needed for this scope                        |
| UI library | Bootstrap 5.3 + Bootstrap Icons     | Responsive grid and icon set                              |
| Fonts      | Playfair Display + DM Sans (Google) | Serif for headings, sans-serif for body                   |
| State      | `localStorage` (browser)           | Cart and auth state — no server-side sessions             |

---

## Project Structure

```
selwa/
│
├── README.md                    ← this file
│
├── backend/
│   ├── main.go                  ← entry point: connects DB, starts router
│   ├── go.mod                   ← Go module definition + dependencies
│   ├── go.sum                   ← dependency checksums (auto-generated)
│   ├── schema.sql               ← table definitions + seed data (16 products)
│   ├── .air.toml                ← live-reload config for `air`
│   │
│   ├── routes/
│   │   └── routes.go            ← all routes registered on the Gorilla Mux router
│   │
│   ├── handler/
│   │   ├── auth.go              ← Signup and Login HTTP handlers
│   │   └── product.go           ← HealthCheck, GetProducts, GetProduct handlers
│   │
│   ├── model/
│   │   ├── user.go              ← User struct, Create(), ValidateUserCredentials()
│   │   └── product.go           ← Product + ArtisanSummary structs, GetAllProducts(), Read()
│   │
│   ├── db/
│   │   └── db.go                ← opens and pings the PostgreSQL connection
│   │
│   └── utils/
│       └── response.go          ← ResponseWithJSON() and ResponseWithError() helpers
│
└── frontend/
    │
    ├── index.html               ← home page: hero, trust bar, featured products, artisans
    ├── products.html            ← product grid with category filter sidebar + sort
    ├── cart.html                ← shopping cart (JS-rendered from localStorage)
    ├── profile.html             ← user profile: name, email, cart summary, logout
    ├── login.html               ← sign-in form (wired to /api/login)
    ├── signup.html              ← create account form (wired to /api/signup)
    ├── artisans.html            ← static artisan showcase page
    ├── about.html               ← static about / mission page
    ├── details.html             ← static product detail page (not dynamic)
    ├── getintouch.html          ← static contact / artisan inquiry page
    ├── faq.html                 ← static FAQ page
    ├── privacy.html             ← static privacy policy
    ├── terms.html               ← static terms of service
    ├── forgot-password.html     ← exists but unlinked — no backend for this
    │
    ├── javascript/
    │   ├── global.js            ← shared: cart (localStorage), nav auth, addToCart()
    │   ├── auth.js              ← login + signup form handlers, password strength/toggle
    │   ├── cart.js              ← cart page: render items, qty change, remove, checkout
    │   └── products.js          ← products page: sort by price, filter by category
    │
    ├── css/
    │   ├── global.css           ← design system: tokens, nav, buttons, product cards
    │   ├── home.css             ← home page specific styles
    │   ├── products.css         ← products layout and filter sidebar
    │   ├── cart.css             ← cart layout and item cards
    │   ├── details.css          ← product detail page styles
    │   ├── auth.css             ← login / signup form styles
    │   ├── about.css            ← about page styles
    │   └── artisans.css         ← artisan listing styles
    │
    └── images/
        ├── hero.webp            ← full-bleed homepage hero
        ├── bangchung.avif       ← product images (avif / webp format)
        ├── palang.avif
        ├── tea-cup.avif
        ├── tsholam-keychain.avif
        ├── high-altitude-honey.avif
        ├── menjong-sorig.avif
        ├── cordyceps.avif
        ├── honey-bumthang.avif
        ├── himalayan-tea.avif
        ├── incense-stick.avif
        ├── zoedow-ezay.avif
        ├── bumthapa-puta.avif
        ├── gift.webp
        └── selwa.bt.jpeg        ← used on the auth panel
```

---

## Database Schema

Three tables: `users`, `artisans`, `products`.

```sql
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,       -- bcrypt hash, never plain text
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE artisans (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    location   VARCHAR(255) NOT NULL,
    craft_type VARCHAR(100) NOT NULL,
    bio        TEXT
);

CREATE TABLE products (
    id             BIGSERIAL PRIMARY KEY,
    name           VARCHAR(255) NOT NULL,
    description    TEXT NOT NULL,
    price          DECIMAL(10,2) NOT NULL,
    category       VARCHAR(100) NOT NULL,      -- e.g. Crafts, Wellness, Food
    artisan_id     BIGINT REFERENCES artisans(id),
    region         VARCHAR(100),               -- e.g. Bumthang, Thimphu
    materials      TEXT,
    stock_quantity INTEGER DEFAULT 0,
    image_url      VARCHAR(500),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

The `schema.sql` file also contains `TRUNCATE` + `INSERT` statements that seed
**4 artisans** and **16 products** so the app works immediately after setup.

### Relationships

- A product has one artisan (`artisan_id` foreign key).
- The `GET /api/products` query does a `LEFT JOIN` on `artisans` so the artisan
  name, location, and craft type come back in the same JSON object as the product.

---

## Backend Architecture

### How the server starts

`main.go` is the only entry point:

```go
func main() {
    db.Init()               // open + ping PostgreSQL
    routes.InitializeRoutes() // register routes, start HTTP server
}
```

It does two things: connect to the database and start the router. Nothing else.

### Router — Gorilla Mux

`routes/routes.go` creates a Gorilla Mux router and registers every route on it.

```go
r := mux.NewRouter()

r.HandleFunc("/api/health",        handler.HealthCheck).Methods("GET")
r.HandleFunc("/api/products",      handler.GetProducts).Methods("GET")
r.HandleFunc("/api/products/{id}", handler.GetProduct).Methods("GET")
r.HandleFunc("/api/signup",        handler.Signup).Methods("POST")
r.HandleFunc("/api/login",         handler.Login).Methods("POST")

r.PathPrefix("/").Handler(http.FileServer(http.Dir("../frontend")))
```

Why Gorilla Mux instead of the standard library `ServeMux`?

- **`{id}` path variables** — you can write `/api/products/{id}` and then read
  `mux.Vars(r)["id"]` in the handler. With stdlib you have to manually trim the
  path prefix with `strings.TrimPrefix`, which is fragile.
- **Per-route method enforcement** — `.Methods("GET")` returns a `405 Method Not
  Allowed` automatically if the wrong HTTP method is used. With stdlib you need a
  custom wrapper function to do the same thing.
- The last route (`PathPrefix("/")`) catches everything else and serves it as a
  static file from the `frontend/` folder.

### Handlers

Located in `handler/`. Each handler receives an `http.ResponseWriter` and
`*http.Request`, does its work, and writes a JSON response using the utils helpers.

**`handler/auth.go`**

| Function   | What it does                                                                 |
|------------|------------------------------------------------------------------------------|
| `Signup`   | Decodes JSON body → validates fields → calls `user.Create()` → returns 201  |
| `Login`    | Decodes JSON body → calls `ValidateUserCredentials()` → returns 200         |

Error cases handled:
- Missing fields → `400 Bad Request`
- Duplicate email on signup → `409 Conflict`
- Wrong password / unknown email on login → `401 Unauthorized`
- Any unexpected DB error → `500 Internal Server Error`

**`handler/product.go`**

| Function       | What it does                                                              |
|----------------|---------------------------------------------------------------------------|
| `HealthCheck`  | Returns `{ "status": "ok", "service": "selwa-backend" }`                |
| `GetProducts`  | Calls `model.GetAllProducts()` → returns JSON array                      |
| `GetProduct`   | Reads `{id}` via `mux.Vars(r)`, calls `product.Read()` → returns object |

Error cases handled:
- Non-integer `{id}` → `400 Bad Request`
- Product not in DB → `404 Not Found`

### Models

Located in `model/`. Models handle all SQL — no SQL lives in handlers.

**`model/user.go`**

```
User struct          { ID, Name, Email }   (no password hash — never sent to client)
CreateUserInput      { Name, Email, Password }
LoginInput           { Email, Password }

User.Create(input)             → bcrypt hash → INSERT → scan returned id
GetUserByEmail(email)          → SELECT by email → returns User + hash
ValidateUserCredentials(e, p)  → GetUserByEmail → bcrypt.CompareHashAndPassword
```

Sentinel errors: `ErrDuplicateEmail`, `ErrInvalidCredentials` — handlers check
these with `errors.Is()` to return the right HTTP status code.

**`model/product.go`**

```
ArtisanSummary struct   { ID, Name, Location, CraftType }
Product struct          { ID, Name, Description, Price, Category, Region,
                          Materials, StockQuantity, ImageURL, Artisan }

GetAllProducts()    → SELECT * FROM products LEFT JOIN artisans → []Product
Product.Read()      → SELECT ... WHERE p.id = $1 → fills product fields
```

Both functions handle nullable artisan columns using `sql.NullInt64` /
`sql.NullString` since `artisan_id` is nullable (LEFT JOIN may produce NULLs).

### Utilities

**`utils/response.go`** — two helpers used by every handler:

```go
ResponseWithJSON(w, statusCode, payload)   // sets Content-Type, writes JSON
ResponseWithError(w, statusCode, message)  // wraps message in { "error": "..." }
```

**`db/db.go`** — opens the PostgreSQL connection once and stores it in `db.Db`:

```go
connStr := os.Getenv("DATABASE_URL")
// fallback: postgres://sundrabomjan@/selwa?host=/var/run/postgresql&sslmode=disable
```

If `DATABASE_URL` is set (e.g. on a server), it uses that. Otherwise it falls
back to a local Unix socket connection which works on the development machine.

---

## API Reference

All API routes return `Content-Type: application/json`.

### GET /api/health

Returns a simple status check. Useful to confirm the server is running.

```json
// Response 200
{
  "status": "ok",
  "service": "selwa-backend"
}
```

---

### GET /api/products

Returns all 16 products with their artisan data joined in.

```json
// Response 200 — array of product objects
[
  {
    "id": 1,
    "name": "Bangchung",
    "description": "A traditional Bhutanese woven bamboo container...",
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

---

### GET /api/products/{id}

Returns a single product by its integer ID.

```json
// Response 200
{
  "id": 3,
  "name": "Bhutanese Tea Cup",
  ...
}

// Response 404 — if id does not exist
{ "error": "Product not found" }

// Response 400 — if id is not a number
{ "error": "Invalid product ID" }
```

---

### POST /api/signup

Creates a new user account. Password is hashed with bcrypt before storing.

```json
// Request body
{
  "name": "Tashi Dorji",
  "email": "tashi@example.com",
  "password": "mypassword123"
}

// Response 201 — success
{
  "message": "Account created successfully",
  "user": {
    "id": 1,
    "name": "Tashi Dorji",
    "email": "tashi@example.com"
  }
}

// Response 400 — missing fields
{ "error": "Name, email, and password are required" }

// Response 409 — email already registered
{ "error": "Email already exists" }
```

---

### POST /api/login

Validates email + password. Returns the user object if correct.

```json
// Request body
{
  "email": "tashi@example.com",
  "password": "mypassword123"
}

// Response 200 — success
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "Tashi Dorji",
    "email": "tashi@example.com"
  }
}

// Response 401 — wrong email or password
{ "error": "Invalid email or password" }
```

---

## Frontend Architecture

The frontend is served as static files by the Go server itself (the last route in
`routes.go` is `http.FileServer`). There is no separate build step or dev server.

### Pages

| File               | Purpose                                                                                    | Has JS logic |
|--------------------|--------------------------------------------------------------------------------------------|:------------:|
| `index.html`       | Home page. Hero image, stats bar, 3 featured product cards, 3 artisan cards, CTA section  | global.js    |
| `products.html`    | Full product grid. Category filter sidebar (functional). Sort dropdown (functional)        | Yes          |
| `cart.html`        | Shopping cart. Items loaded from localStorage. Qty +/−, remove, total, checkout button    | Yes          |
| `profile.html`     | Shown after login. Displays user name/email, cart summary, logout button                   | Yes          |
| `login.html`       | Email + password form. POSTs to `/api/login`. Inline error display                        | Yes          |
| `signup.html`      | Name, email, password, confirm-password. POSTs to `/api/signup`. Password strength bar    | Yes          |
| `artisans.html`    | Static page listing featured artisans with bios and craft tags                             | global.js    |
| `about.html`       | Static mission / about page                                                                | global.js    |
| `details.html`     | Static product detail page — does NOT load real data from the API                         | global.js    |
| `getintouch.html`  | Contact form — static only, no backend endpoint                                            | global.js    |
| `faq.html`         | Static FAQ accordion                                                                       | global.js    |
| `privacy.html`     | Static privacy policy                                                                      | global.js    |
| `terms.html`       | Static terms of service                                                                    | global.js    |

Every page that has a navbar loads `global.js` at the bottom. `global.js` runs
`updateCartCount()` and `renderNavAuth()` on every page load automatically.

### JavaScript files

#### `javascript/global.js`

Loaded on every page. Provides shared functions.

```
getCart()             reads the cart array from localStorage
saveCart(cart)        writes cart to localStorage, then calls updateCartCount()
getUser()             reads the logged-in user object from localStorage (or null)
updateCartCount()     counts total qty in cart, sets the text of all #cart-count elements
renderNavAuth()       if user exists → show their name linking to profile.html
                      if no user    → show "Sign in" linking to login.html
addToCart(event)      called by "Add" buttons on product cards:
                        - stops the click from navigating to details.html
                        - reads .p-card__name, .p-card__price, img src from the card
                        - adds to cart or increments qty if already there
                        - saves cart, briefly shows ✓ on the button
```

Cart data is stored in `localStorage` under the key `selwa_cart` as a JSON array:

```json
[
  { "name": "Bangchung", "price": 850, "image": "images/bangchung.avif", "qty": 2 },
  { "name": "Tsholam Keychain", "price": 450, "image": "images/tsholam-keychain.avif", "qty": 1 }
]
```

User data is stored under `selwa_user`:

```json
{ "id": 1, "name": "Tashi Dorji", "email": "tashi@example.com" }
```

#### `javascript/auth.js`

Loaded on `login.html` and `signup.html`. Handles form submissions.

```
Password visibility toggle   — .password-toggle buttons switch input type
                               between "password" and "text"

Login form submit            — fetch POST /api/login
                             — on success: localStorage.setItem('selwa_user', ...)
                               then redirect to profile.html
                             — on error: show inline error div above the form

Signup form submit           — validates passwords match
                             — fetch POST /api/signup
                             — on success: localStorage.setItem('selwa_user', ...)
                               then redirect to profile.html
                             — on error: show inline error

Password strength indicator  — listens to #password input events
                             — scores 1 point each for: length ≥ 8,
                               uppercase letter, digit, special character
                             — updates #strength-fill width and colour
                               (red → orange → yellow → green)
```

#### `javascript/cart.js`

Loaded only on `cart.html`.

```
renderCart()         reads getCart(), builds HTML for each item, injects into
                     #cart-items; hides #cart-main and shows #empty-cart if empty
changeItemQty(idx, delta)   increments or decrements cart[idx].qty (minimum 1),
                            saves and re-renders
removeItem(idx)      splices item out of cart array, saves and re-renders
updateSummary()      recalculates subtotal and total, updates #subtotal, #total,
                     #summary-count elements
checkout()           if cart empty → does nothing
                     if user not logged in → redirects to login.html
                     otherwise → clears cart, re-renders, shows alert
```

#### `javascript/products.js`

Loaded only on `products.html`.

```
handleSort(value)    called by the sort <select> onchange
                     grabs all .p-card elements, sorts by price extracted from
                     .p-card__price text, reappends cards to #product-grid in
                     the new order

applyFilters()       reads all checked checkboxes that have data-category attribute
                     for each .p-card: shows it if its data-category matches any
                     checked box, hides it otherwise
                     if nothing is checked → shows all cards
                     updates the #product-count text
```

### CSS / Design system

`css/global.css` defines the entire design system used across all pages.

**Color tokens (CSS variables):**

| Variable        | Value     | Used for                         |
|-----------------|-----------|----------------------------------|
| `--ink`         | `#0F0A05` | Darkest backgrounds (hero, CTA)  |
| `--ink-2`       | `#1C1208` | Footer background, nav bar       |
| `--bark`        | `#3D2008` | Heading text                     |
| `--gold`        | `#B8701A` | Primary accent, buttons, links   |
| `--gold-warm`   | `#D4920A` | Star ratings, hover states       |
| `--gold-pale`   | `#EDD09A` | Text on dark backgrounds         |
| `--gold-mist`   | `#FAF1E2` | Hover backgrounds, badges        |
| `--cream`       | `#FAF7F2` | Page background                  |
| `--text-muted`  | `#8B6040` | Secondary text                   |
| `--border`      | `#E2D8C8` | Card and input borders           |

**Typography:**
- Headings: `Playfair Display` (serif, Google Fonts)
- Body: `DM Sans` (sans-serif, Google Fonts)

**Shared components defined in global.css:**
- `.s-nav` — sticky navbar with blur backdrop
- `.s-btn`, `.s-btn--gold`, `.s-btn--outline-dark`, `.s-btn--dark`, `.s-btn--add` — button variants
- `.p-card`, `.p-grid` — product card and responsive grid
- `.a-card` — artisan card with avatar and banner
- `.s-filters`, `.s-filter-opt` — filter sidebar styles
- `.s-footer` — two-tone footer
- `.s-hero` — full-height hero with overlay gradient

---

## Data flow walkthroughs

### Signup flow

```
User fills name, email, password, confirm-password on signup.html
         │
         ▼
auth.js validates passwords match (client-side, instant)
         │
         ▼
auth.js POST /api/signup  { name, email, password }
         │
         ▼
handler/auth.go  Signup()
  → decodes JSON body
  → checks name/email/password are not empty (400 if missing)
         │
         ▼
model/user.go  user.Create(input)
  → bcrypt.GenerateFromPassword(password, cost=10)
  → INSERT INTO users (name, email, password_hash) RETURNING id
  → if pq error code 23505 → return ErrDuplicateEmail
         │
         ▼
handler/auth.go
  → ErrDuplicateEmail? → 409 Conflict
  → success?           → 201 Created  { message, user: {id, name, email} }
         │
         ▼
auth.js receives response
  → localStorage.setItem('selwa_user', JSON.stringify(data.user))
  → window.location.href = 'profile.html'
         │
         ▼
profile.html loads → reads localStorage → displays name, email, cart summary
```

### Login flow

```
User fills email + password on login.html
         │
         ▼
auth.js POST /api/login  { email, password }
         │
         ▼
handler/auth.go  Login()
  → decodes JSON
  → calls model.ValidateUserCredentials(email, password)
         │
         ▼
model/user.go  ValidateUserCredentials()
  → SELECT id, name, email, password_hash FROM users WHERE email = $1
  → sql.ErrNoRows? → return ErrInvalidCredentials
  → bcrypt.CompareHashAndPassword(hash, password)
  → mismatch?      → return ErrInvalidCredentials
  → match          → return *User
         │
         ▼
handler/auth.go
  → ErrInvalidCredentials? → 401 Unauthorized
  → success?               → 200 OK  { message, user: {id, name, email} }
         │
         ▼
auth.js
  → error? → showError() inserts a red div above the form
  → ok?    → localStorage.setItem('selwa_user', ...) → redirect to profile.html
```

### Add to cart flow

```
User clicks "Add" button on a product card (index.html or products.html)
         │
         ▼
global.js  addToCart(event)
  → event.preventDefault()   — stops the parent <a> from navigating
  → event.stopPropagation()  — stops event bubbling
  → btn.closest('.p-card')   — walks up the DOM to find the card
  → reads .p-card__name      → name string
  → reads .p-card__price     → strips "Nu. " and commas → integer price
  → reads img.src            → image path
         │
         ▼
  → getCart() from localStorage
  → if item with same name exists → qty += 1
  → else → push { name, price, image, qty: 1 }
  → saveCart(cart) → localStorage + updateCartCount()
         │
         ▼
  → btn.textContent = '✓'
  → after 900ms → restore original button text
         │
         ▼
cart-count badge in navbar updates to reflect new total
```

### Checkout flow

```
User on cart.html clicks "Proceed to checkout"
         │
         ▼
cart.js  checkout()
  → getCart().length === 0?  → do nothing
  → getUser() === null?      → redirect to login.html
         │
         ▼
  → saveCart([])   — clears localStorage cart
  → renderCart()  — re-renders: shows empty state
  → alert('Order placed! Thank you for supporting Bhutanese artisans.')
```

Note: no order is saved to the database. This is a known limitation (see below).

---

## How to Run

### Prerequisites

- Go 1.21+
- PostgreSQL running locally
- A database named `selwa`

### Steps

```bash
# 1. Create the database (only needed once)
createdb selwa

# 2. Apply the schema and seed data
psql -d selwa -f backend/schema.sql

# 3. Start the server
cd backend
go run main.go
```

The server listens on **http://localhost:8080** and also serves the frontend
directory, so opening that URL in a browser loads the home page directly.

#### Live reload (optional)

If you have [air](https://github.com/air-verse/air) installed:

```bash
cd backend
air
```

`air` watches for file changes and restarts the server automatically.

#### Custom database URL

If your Postgres setup is different, set the environment variable before running:

```bash
DATABASE_URL="postgres://user:password@localhost/selwa?sslmode=disable" go run main.go
```

---

## Dependencies

```
backend/go.mod:

github.com/gorilla/mux v1.8.1        — HTTP router with path variables
github.com/lib/pq v1.10.9            — PostgreSQL driver for database/sql
golang.org/x/crypto v0.17.0          — bcrypt for password hashing
```

No frontend build dependencies. Bootstrap and Google Fonts are loaded from CDN via
`<link>` tags in each HTML file.

---

## What Is Working

### Backend

| Feature                        | Detail                                                                                   |
|--------------------------------|------------------------------------------------------------------------------------------|
| Gorilla Mux router             | Clean route table, `{id}` path vars, automatic 405 on wrong method                     |
| `GET /api/health`              | Returns `{ status: "ok" }` — useful to confirm server is up                            |
| `GET /api/products`            | Queries all 16 products with LEFT JOIN on artisans, returns JSON array                  |
| `GET /api/products/{id}`       | Fetches one product by integer ID; 404 if not found, 400 if id is not a number         |
| `POST /api/signup`             | Hashes password with bcrypt, inserts user; 409 on duplicate email                      |
| `POST /api/login`              | Looks up user, compares bcrypt hash; 401 on bad credentials                            |
| Error responses                | All errors return `{ "error": "..." }` JSON with the correct HTTP status code          |
| Static file serving            | `frontend/` directory is served automatically — no separate web server needed          |

### Frontend

| Feature                        | Detail                                                                                   |
|--------------------------------|------------------------------------------------------------------------------------------|
| Cart (localStorage)            | Add, remove, increment/decrement qty; total recalculates live                           |
| Cart count badge               | Updates in the navbar on every page whenever cart changes                               |
| "Add" button feedback          | Button briefly shows ✓ and reverts — confirms the item was added                       |
| Login form                     | POSTs to API, stores user in localStorage, redirects to profile, shows inline error     |
| Signup form                    | POSTs to API, password match check, stores user in localStorage, redirects to profile  |
| Password strength bar          | Live indicator on signup: scores length, uppercase, digits, special characters          |
| Password visibility toggle     | Eye icon on login and signup toggles between hidden/visible password                    |
| Nav auth state                 | "Sign in" link when logged out; user's first name linking to profile when logged in     |
| Profile page                   | Shows initials avatar, name, email; lists cart items with prices; logout button         |
| Logout                         | Clears `selwa_user` from localStorage, redirects to home                               |
| Category filter (products)     | Checking a category shows only matching cards; unchecking all shows everything          |
| Sort by price (products)       | "Price: Low to high" and "Price: High to low" reorder cards in the DOM                 |
| Empty cart state               | Dedicated empty-state panel shown when cart has no items                               |
| Checkout guard                 | Checkout redirects to login if user is not signed in                                   |
| Mobile responsive navbar       | Hamburger menu on small screens; search collapses to icon                              |

---

## What Is NOT Working

### Backend

| Missing feature             | Explanation                                                                                                                     |
|-----------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| No JWT / sessions           | After login the server returns the user object and forgets about it. The browser stores it in localStorage. Anyone who opens DevTools can edit localStorage and impersonate another user. A real app would issue a signed JWT or a server-side session cookie. |
| No protected routes         | All API endpoints are public. There is no middleware that reads a token and rejects requests from unauthenticated users. `/api/products` being public is fine, but a real checkout endpoint should require authentication. |
| No logout endpoint          | Logout is done purely by deleting `selwa_user` from localStorage. The server never knew the user was logged in, so there is nothing to invalidate. |
| No order storage            | When checkout() runs, it clears the cart locally but nothing is written to the database. There is no `orders` table and no `/api/orders` endpoint. |
| No password reset           | `forgot-password.html` exists as a file but is not linked from anywhere. There is no backend endpoint to send a reset email or update a password. |

### Frontend

| Missing feature              | Explanation                                                                                                                    |
|------------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| Products page is static HTML | The 6 cards in `products.html` are hardcoded. They do not call `GET /api/products`. The database has 16 products but only 6 are displayed. A proper implementation would `fetch('/api/products')` and build the cards dynamically. |
| `details.html` is static     | Every "Add" / product card links to `details.html` but that page always shows the same hardcoded content. It does not read a product ID from the URL and call `GET /api/products/{id}`. |
| Search bar does nothing      | The search form submits to `products.html?q=...` and the URL parameter is set, but `products.js` does not read `URLSearchParams` and filter cards. |
| `getintouch.html` form       | The contact / artisan inquiry form on this page has a submit button, but there is no backend endpoint. Submitting it does nothing. |
| No real checkout             | The checkout flow clears the cart and shows an alert. No payment processing, no order confirmation email, no order history. |
| Static info pages            | `about.html`, `artisans.html`, `faq.html`, `privacy.html`, `terms.html` are plain HTML with no dynamic data. Artisan profiles are hardcoded; they don't come from the database. |

---

## Security Notes

### Passwords

Passwords are hashed with **bcrypt** from `golang.org/x/crypto/bcrypt` at cost factor 10:

```go
passwordHash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
```

- The plain-text password is never written to the database.
- bcrypt is a slow, adaptive hash function designed specifically for passwords. It includes a random salt so two users with the same password get different hashes.
- `bcrypt.CompareHashAndPassword` is used on login — it re-hashes the attempt and compares in constant time, preventing timing attacks.

### What is NOT secure (for this project scope)

- **No HTTPS** — the server runs on plain HTTP. A production deployment would need TLS.
- **No CSRF protection** — the API accepts any POST with the right JSON body.
- **localStorage is not secure storage** — tokens or user data in localStorage can be
  read by any JavaScript on the page (XSS risk). A production app uses `HttpOnly`
  cookies for session tokens.
- **No rate limiting** — the login endpoint has no brute-force protection.
