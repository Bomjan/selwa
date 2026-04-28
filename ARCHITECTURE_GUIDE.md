# CRUD Application Architecture Guide

A complete architectural blueprint for building Go-based REST API applications with PostgreSQL. This guide is domain-agnostic - follow this structure to replicate the pattern for any CRUD application.

---

## 1. Project Structure

```
myapp/
├── main.go                 # Application entry point
├── go.mod                  # Go module definition
├── go.sum                  # Dependency checksums
├── .air.toml              # Hot reload configuration (development)
├── .gitignore
├── controller/            # HTTP request handlers
│   ├── auth.go           # Authentication endpoints (login, signup, logout)
│   ├── student.go        # Entity-specific CRUD handlers
│   ├── course.go         # Entity-specific CRUD handlers
│   └── enroll.go         # Relationship/association handlers
├── model/                 # Data models and database queries
│   ├── model.go          # Core entity models with DB operations
│   └── enroll.go         # Relationship models
├── routes/                # HTTP route definitions
│   └── routes.go         # Route registration and server startup
├── dataStore/             # Database connection layer
│   └── postgres/
│       └── db.go         # Database connection initialization
├── utils/                 # Shared utilities
│   ├── httpResp/
│   │   └── response.go   # HTTP response helpers
│   └── date/
│       └── date.go       # Date formatting utilities
└── views/                 # Static files (HTML, CSS, JS)
```

---

## 2. Architectural Pattern: Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                              │
│                    (Browser / Mobile)                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP Request (JSON)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Routes Layer                           │
│              (routes/routes.go)                             │
│   • Route definition (Gorilla Mux)                          │
│   • HTTP method mapping (GET, POST, PUT, DELETE)            │
│   • Static file serving                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Controller Layer                          │
│              (controller/*.go)                              │
│   • Request parsing (JSON decoding)                         │
│   • Input validation                                        │
│   • Cookie/Session verification                             │
│   • HTTP response formatting                                │
│   • Error handling & status codes                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Model Layer                            │
│              (model/*.go)                                   │
│   • Data structures (structs)                               │
│   • SQL query definitions (parameterized)                   │
│   • Database operations (Create, Read, Update, Delete)      │
│   • Business logic                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Database Layer                             │
│              (dataStore/postgres/db.go)                     │
│   • Connection pool management                              │
│   • Database driver (lib/pq)                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Layer Responsibilities

### 3.1 Entry Point (`main.go`)

**Purpose:** Minimal bootstrap - delegates immediately to routes.

```go
package main

import "myapp/routes"

func main() {
    routes.InitializeRoutes()
}
```

**Key Points:**
- Single responsibility: call route initializer
- No business logic
- Server startup happens in routes layer

---

### 3.2 Routes Layer (`routes/routes.go`)

**Purpose:** Define HTTP endpoints and map to controller functions.

**Structure:**
```go
func InitializeRoutes() {
    router := mux.NewRouter()
    
    // Entity routes
    router.HandleFunc("/student/add", controller.AddStudent).Methods("POST")
    router.HandleFunc("/student/{sid}", controller.GetStud).Methods("GET")
    router.HandleFunc("/student/{sid}", controller.UpdateStud).Methods("PUT")
    router.HandleFunc("/student/{sid}", controller.DeleteStud).Methods("DELETE")
    router.HandleFunc("/student", controller.GetAllStuds).Methods("GET")
    
    // Start server
    log.Fatal(http.ListenAndServe(":8080", router))
}
```

**Key Points:**
- Uses Gorilla Mux for routing
- HTTP methods explicitly defined per endpoint
- Path parameters in curly braces `{param}`
- Static file server for frontend assets
- Server listens on configured port (default: 8080)

---

### 3.3 Controller Layer (`controller/*.go`)

**Purpose:** Handle HTTP request/response cycle.

**Standard CRUD Handler Pattern:**

```go
func CreateEntity(w http.ResponseWriter, r *http.Request) {
    // 1. Authentication check
    if !VerifyCookie(w, r) {
        return
    }
    
    // 2. Parse JSON body
    var entity model.Entity
    decoder := json.NewDecoder(r.Body)
    if err := decoder.Decode(&entity); err != nil {
        httpresp.ResponseWithError(w, http.StatusBadRequest, "Invalid JSON")
        return
    }
    defer r.Body.Close()
    
    // 3. Call model layer
    if saveErr := entity.Create(); saveErr != nil {
        httpresp.ResponseWithError(w, http.StatusBadRequest, saveErr.Error())
        return
    }
    
    // 4. Return success response
    httpresp.ResponseWithJSON(w, http.StatusCreated, "Entity Created")
}
```

**Key Points:**
- **No SQL queries** - delegated to model layer
- **No business logic** - only request handling
- **Consistent error handling** - use utility functions
- **Proper HTTP status codes:**
  - `200 OK` - Successful GET/PUT
  - `201 Created` - Successful POST
  - `400 Bad Request` - Invalid input
  - `401 Unauthorized` - Authentication failed
  - `403 Forbidden` - Authorization failed
  - `404 Not Found` - Resource not found
  - `500 Internal Server Error` - Server-side error

---

### 3.4 Model Layer (`model/*.go`)

**Purpose:** Define data structures and database operations.

**Structure:**

```go
// 1. SQL query constants (parameterized)
const queryInsertEntity = `INSERT INTO entity (id, field1, field2) VALUES ($1, $2, $3);`
const queryGetEntity = `SELECT id, field1, field2 FROM entity WHERE id=$1;`
const queryUpdateEntity = `UPDATE entity SET id=$1, field1=$2, field2=$3 WHERE id=$4 RETURNING id;`
const queryDeleteEntity = `DELETE FROM entity WHERE id=$1 RETURNING id;`
const queryGetAllEntities = `SELECT * FROM entity;`

// 2. Struct definition with JSON tags
type Entity struct {
    ID     int64  `json:"id"`
    Field1 string `json:"field1"`
    Field2 string `json:"field2"`
}

// 3. CRUD methods on struct
func (e *Entity) Create() error {
    _, err := postgres.Db.Exec(queryInsertEntity, e.ID, e.Field1, e.Field2)
    return err
}

func (e *Entity) Read() error {
    return postgres.Db.QueryRow(queryGetEntity, e.ID).Scan(&e.ID, &e.Field1, &e.Field2)
}

func (e *Entity) Update(oldID int64) error {
    return postgres.Db.QueryRow(queryUpdateEntity, e.ID, e.Field1, e.Field2, oldID).Scan(&e.ID)
}

func (e *Entity) Delete() error {
    return postgres.Db.QueryRow(queryDeleteEntity, e.ID).Scan(&e.ID)
}

// 4. Collection methods (standalone functions)
func GetAllEntities() ([]Entity, error) {
    rows, err := postgres.Db.Query(queryGetAllEntities)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    entities := []Entity{}
    for rows.Next() {
        var e Entity
        if err := rows.Scan(&e.ID, &e.Field1, &e.Field2); err != nil {
            return nil, err
        }
        entities = append(entities, e)
    }
    return entities, nil
}
```

**Key Points:**
- **Parameterized queries** (`$1`, `$2`) prevent SQL injection
- **Query constants** at package level for reusability
- **Receiver methods** for single-entity operations
- **Standalone functions** for collection operations
- **Error propagation** - return errors to controller
- **JSON tags** define API field names

---

### 3.5 Database Layer (`dataStore/postgres/db.go`)

**Purpose:** Initialize and manage database connection.

**Structure:**

```go
package postgres

import (
    "database/sql"
    "fmt"
    "log"
    _ "github.com/lib/pq"
)

const (
    host     = "localhost"
    port     = "5432"
    user     = "your_username"
    password = "your_password"
    dbname   = "your_database"
)

var Db *sql.DB

func init() {
    connStr := fmt.Sprintf(
        "host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
        host, port, user, password, dbname,
    )
    
    var err error
    Db, err = sql.Open("postgres", connStr)
    if err != nil {
        panic(err)
    }
    log.Println("Database connected successfully")
}
```

**Key Points:**
- `init()` runs automatically on package import
- Single connection pool exported as `Db`
- Use `sslmode=disable` for local development
- Import driver with blank identifier `_`

---

### 3.6 Utility Layer (`utils/`)

#### HTTP Response Helpers (`utils/httpResp/response.go`)

```go
func ResponseWithError(w http.ResponseWriter, code int, message string) {
    ResponseWithJSON(w, code, map[string]string{"error": message})
}

func ResponseWithJSON(w http.ResponseWriter, code int, payload any) {
    response, _ := json.Marshal(payload)
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(code)
    w.Write(response)
}
```

#### Date Utilities (`utils/date/date.go`)

```go
const apiDateLayout = "2004-01-04T15:04:09Z"  // Go's reference time

func GetDate() string {
    return time.Now().UTC().Format(apiDateLayout)
}
```

---

## 4. Authentication Flow

### Cookie-Based Session Management

```
┌──────────┐     POST /signup      ┌──────────┐
│  Client  │ ────────────────────► │  Server  │
│          │                       │          │
│          │ ◄────── 201 ───────── │  Store   │
│          │    (JSON response)    │  in DB   │
└──────────┘                       └──────────┘

┌──────────┐     POST /login       ┌──────────┐
│  Client  │ ────────────────────► │  Server  │
│          │  (email, password)    │          │
│          │                       │ Validate │
│          │ ◄────── 200 ───────── │  creds   │
│          │  Set-Cookie: xxx      │          │
└──────────┘                       └──────────┘

┌──────────┐  GET /resource        ┌──────────┐
│  Client  │  + Cookie ──────────► │  Server  │
│          │                       │          │
│          │ ◄────── 200 ───────── │ Verify   │
│          │   (JSON data)         │ Cookie   │
└──────────┘                       └──────────┘
```

**Cookie Verification Function:**

```go
func VerifyCookie(w http.ResponseWriter, r *http.Request) bool {
    cookie, err := r.Cookie("my-cookie")
    if err != nil {
        if err == http.ErrNoCookie {
            httpresp.ResponseWithError(w, http.StatusSeeOther, "No cookie")
            return false
        }
        httpresp.ResponseWithError(w, http.StatusInternalServerError, "Internal error")
        return false
    }
    
    if cookie.Value != "expected-value" {
        httpresp.ResponseWithError(w, http.StatusUnauthorized, "Invalid cookie")
        return false
    }
    return true
}
```

---

## 5. API Endpoint Conventions

### RESTful Resource Naming

| HTTP Method | Endpoint              | Description           | Status Code |
|-------------|-----------------------|-----------------------|-------------|
| GET         | `/resource`           | List all              | 200         |
| GET         | `/resource/{id}`      | Get single            | 200 / 404   |
| POST        | `/resource/add`       | Create new            | 201 / 400   |
| PUT         | `/resource/{id}`      | Update existing       | 200 / 400   |
| DELETE      | `/resource/{id}`      | Delete                | 200 / 400   |

### Relationship Endpoints

| HTTP Method | Endpoint                    | Description           |
|-------------|-----------------------------|-----------------------|
| POST        | `/enroll`                   | Create relationship   |
| GET         | `/enroll/{stdId}/{courseId}`| Get relationship    |

---

## 6. Dependencies

**Core:**
- `github.com/gorilla/mux` - HTTP router
- `github.com/lib/pq` - PostgreSQL driver

**Development:**
- `air` - Hot reload for Go

**go.mod:**
```go
module myapp

go 1.21

require (
    github.com/gorilla/mux v1.8.1
    github.com/lib/pq v1.10.9
)
```

---

## 7. Step-by-Step: Adding a New Entity

To add a new CRUD entity (e.g., `Product`):

### Step 1: Create Model (`model/product.go`)

```go
package model

import "myapp/dataStore/postgres"

const queryCreateProduct = `INSERT INTO product (id, name, price) VALUES ($1, $2, $3);`
const queryGetProduct = `SELECT id, name, price FROM product WHERE id=$1;`
const queryUpdateProduct = `UPDATE product SET id=$1, name=$2, price=$3 WHERE id=$4 RETURNING id;`
const queryDeleteProduct = `DELETE FROM product WHERE id=$1 RETURNING id;`
const queryGetAllProducts = `SELECT * FROM product;`

type Product struct {
    ID    int64   `json:"id"`
    Name  string  `json:"name"`
    Price float64 `json:"price"`
}

func (p *Product) Create() error {
    _, err := postgres.Db.Exec(queryCreateProduct, p.ID, p.Name, p.Price)
    return err
}

func (p *Product) Read() error {
    return postgres.Db.QueryRow(queryGetProduct, p.ID).Scan(&p.ID, &p.Name, &p.Price)
}

func (p *Product) Update(oldID int64) error {
    return postgres.Db.QueryRow(queryUpdateProduct, p.ID, p.Name, p.Price, oldID).Scan(&p.ID)
}

func (p *Product) Delete() error {
    return postgres.Db.QueryRow(queryDeleteProduct, p.ID).Scan(&p.ID)
}

func GetAllProducts() ([]Product, error) {
    rows, err := postgres.Db.Query(queryGetAllProducts)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    products := []Product{}
    for rows.Next() {
        var p Product
        if err := rows.Scan(&p.ID, &p.Name, &p.Price); err != nil {
            return nil, err
        }
        products = append(products, p)
    }
    return products, nil
}
```

### Step 2: Create Controller (`controller/product.go`)

```go
package controller

import (
    "database/sql"
    "myapp/model"
    httpresp "myapp/utils/httpResp"
    "net/http"
    "github.com/gorilla/mux"
)

func AddProduct(w http.ResponseWriter, r *http.Request) {
    if !VerifyCookie(w, r) {
        return
    }
    
    var product model.Product
    decoder := json.NewDecoder(r.Body)
    if err := decoder.Decode(&product); err != nil {
        httpresp.ResponseWithError(w, http.StatusBadRequest, "Invalid JSON")
        return
    }
    defer r.Body.Close()
    
    if saveErr := product.Create(); saveErr != nil {
        httpresp.ResponseWithError(w, http.StatusBadRequest, saveErr.Error())
        return
    }
    
    httpresp.ResponseWithJSON(w, http.StatusCreated, "Product Created")
}

func GetProduct(w http.ResponseWriter, r *http.Request) {
    if !VerifyCookie(w, r) {
        return
    }
    
    pid := mux.Vars(r)["pid"]
    productId, _ := strconv.ParseInt(pid, 10, 64)
    
    p := model.Product{ID: productId}
    if getErr := p.Read(); getErr != nil {
        if getErr == sql.ErrNoRows {
            httpresp.ResponseWithError(w, http.StatusNotFound, "Product Not Found")
        } else {
            httpresp.ResponseWithError(w, http.StatusInternalServerError, getErr.Error())
        }
        return
    }
    
    httpresp.ResponseWithJSON(w, http.StatusOK, p)
}

// ... UpdateProduct, DeleteProduct, GetAllProducts
```

### Step 3: Register Routes (`routes/routes.go`)

```go
router.HandleFunc("/product/add", controller.AddProduct).Methods("POST")
router.HandleFunc("/product/{pid}", controller.GetProduct).Methods("GET")
router.HandleFunc("/product/{pid}", controller.UpdateProduct).Methods("PUT")
router.HandleFunc("/product/{pid}", controller.DeleteProduct).Methods("DELETE")
router.HandleFunc("/product", controller.GetAllProducts).Methods("GET")
```

### Step 4: Create Database Table

```sql
CREATE TABLE product (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);
```

---

## 8. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Gorilla Mux** | Simple, mature, path parameter support |
| **Parameterized queries** | SQL injection prevention |
| **Cookie-based auth** | Stateless sessions, easy to implement |
| **JSON everywhere** | Consistent API format |
| **Layered architecture** | Separation of concerns, testability |
| **Utility functions** | DRY principle for responses |
| **Receiver methods** | Object-oriented style for CRUD |

---

## 9. Replication Checklist

To replicate this architecture for a new application:

- [ ] Set up `go.mod` with required dependencies
- [ ] Configure database connection in `dataStore/postgres/db.go`
- [ ] Create database tables matching your entities
- [ ] For each entity:
  - [ ] Create struct in `model/` with SQL queries
  - [ ] Implement Create, Read, Update, Delete methods
  - [ ] Create controller handlers in `controller/`
  - [ ] Register routes in `routes/routes.go`
- [ ] Set up authentication (signup/login/logout)
- [ ] Add cookie verification to protected endpoints
- [ ] Create utility functions for common operations
- [ ] Configure `.air.toml` for hot reload (development)
- [ ] Add static file serving if needed

---

## 10. File Naming Conventions

| Pattern | Example |
|---------|---------|
| Entity model | `model/<entity>.go` |
| Entity controller | `controller/<entity>.go` |
| SQL queries | Constants prefixed with `query<Action>` |
| Handler functions | `<Action><Entity>` (e.g., `GetStudent`) |

---

This architecture provides a solid foundation for building RESTful CRUD applications in Go. Follow the patterns consistently, and you can rapidly scaffold new entities while maintaining code quality and security.
