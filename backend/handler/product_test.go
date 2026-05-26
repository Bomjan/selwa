package handler

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"selwa/db"
	"selwa/model"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/gorilla/mux"
)

func productCols() *sqlmock.Rows {
	return sqlmock.NewRows([]string{
		"id", "name", "description", "price", "category", "region",
		"materials", "stock_quantity", "image_url",
		"artisan_id", "artisan_name", "artisan_location", "artisan_craft_type",
	})
}

func addProductRow(rows *sqlmock.Rows) *sqlmock.Rows {
	return rows.AddRow(
		int64(1), "Bangchung", "A woven basket", 25.00, "crafts", "Thimphu",
		"bamboo", 10, "/images/bangchung.avif",
		sql.NullInt64{Int64: 2, Valid: true},
		sql.NullString{String: "Karma", Valid: true},
		sql.NullString{String: "Paro", Valid: true},
		sql.NullString{String: "weaving", Valid: true},
	)
}

func getRequest(path string) *http.Request {
	return httptest.NewRequest(http.MethodGet, path, nil)
}

// ── HealthCheck ───────────────────────────────────────────────────────────────

func TestHealthCheck(t *testing.T) {
	rr := httptest.NewRecorder()
	HealthCheck(rr, getRequest("/api/health"))

	if rr.Code != http.StatusOK {
		t.Errorf("want 200, got %d", rr.Code)
	}

	var resp map[string]string
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp["status"] != "ok" {
		t.Errorf("want status=ok, got %q", resp["status"])
	}
	if resp["service"] != "selwa-backend" {
		t.Errorf("want service=selwa-backend, got %q", resp["service"])
	}
}

// ── GetProducts ───────────────────────────────────────────────────────────────

func TestGetProducts_Success(t *testing.T) {
	mock := setupMockDB(t)
	rows := addProductRow(productCols())
	mock.ExpectQuery("SELECT").WillReturnRows(rows)

	rr := httptest.NewRecorder()
	GetProducts(rr, getRequest("/api/products"))

	if rr.Code != http.StatusOK {
		t.Errorf("want 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var products []model.Product
	if err := json.NewDecoder(rr.Body).Decode(&products); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(products) != 1 {
		t.Fatalf("want 1 product, got %d", len(products))
	}
	if products[0].Name != "Bangchung" {
		t.Errorf("want Name=Bangchung, got %q", products[0].Name)
	}
}

func TestGetProducts_DBError(t *testing.T) {
	mock := setupMockDB(t)
	mock.ExpectQuery("SELECT").WillReturnError(sql.ErrConnDone)

	rr := httptest.NewRecorder()
	GetProducts(rr, getRequest("/api/products"))

	if rr.Code != http.StatusInternalServerError {
		t.Errorf("want 500, got %d", rr.Code)
	}
}

func TestGetProducts_ReturnsEmptyList(t *testing.T) {
	mock := setupMockDB(t)
	mock.ExpectQuery("SELECT").WillReturnRows(productCols())

	rr := httptest.NewRecorder()
	GetProducts(rr, getRequest("/api/products"))

	if rr.Code != http.StatusOK {
		t.Errorf("want 200, got %d", rr.Code)
	}

	var products []model.Product
	if err := json.NewDecoder(rr.Body).Decode(&products); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(products) != 0 {
		t.Errorf("want 0 products, got %d", len(products))
	}
}

// ── GetProduct ────────────────────────────────────────────────────────────────

func withID(r *http.Request, id string) *http.Request {
	return mux.SetURLVars(r, map[string]string{"id": id})
}

func TestGetProduct_BadID(t *testing.T) {
	// no DB interaction needed — handler returns 400 before querying
	db.Db = nil

	req := withID(getRequest("/api/products/abc"), "abc")
	rr := httptest.NewRecorder()
	GetProduct(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("want 400, got %d", rr.Code)
	}
}

func TestGetProduct_NotFound(t *testing.T) {
	mock := setupMockDB(t)
	mock.ExpectQuery("SELECT").
		WithArgs(int64(999)).
		WillReturnError(sql.ErrNoRows)

	req := withID(getRequest("/api/products/999"), "999")
	rr := httptest.NewRecorder()
	GetProduct(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Errorf("want 404, got %d", rr.Code)
	}
}

func TestGetProduct_Success(t *testing.T) {
	mock := setupMockDB(t)
	rows := addProductRow(productCols())
	mock.ExpectQuery("SELECT").
		WithArgs(int64(1)).
		WillReturnRows(rows)

	req := withID(getRequest("/api/products/1"), "1")
	rr := httptest.NewRecorder()
	GetProduct(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("want 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var p model.Product
	if err := json.NewDecoder(rr.Body).Decode(&p); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if p.ID != 1 || p.Name != "Bangchung" {
		t.Errorf("unexpected product: %+v", p)
	}
	if p.Artisan.Name != "Karma" {
		t.Errorf("want artisan=Karma, got %q", p.Artisan.Name)
	}
}
