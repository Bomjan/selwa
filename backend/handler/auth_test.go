package handler

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"selwa/db"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

func setupMockDB(t *testing.T) sqlmock.Sqlmock {
	t.Helper()
	mockDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	db.Db = mockDB
	t.Cleanup(func() { mockDB.Close() })
	return mock
}

func postJSON(body string) *http.Request {
	return httptest.NewRequest(http.MethodPost, "/", bytes.NewBufferString(body))
}

// ── Signup ────────────────────────────────────────────────────────────────────

func TestSignup_InvalidJSON(t *testing.T) {
	req := postJSON(`not json`)
	rr := httptest.NewRecorder()
	Signup(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("want 400, got %d", rr.Code)
	}
}

func TestSignup_MissingName(t *testing.T) {
	req := postJSON(`{"email":"a@b.com","password":"secret"}`)
	rr := httptest.NewRecorder()
	Signup(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("want 400, got %d", rr.Code)
	}
}

func TestSignup_MissingEmail(t *testing.T) {
	req := postJSON(`{"name":"Alice","password":"secret"}`)
	rr := httptest.NewRecorder()
	Signup(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("want 400, got %d", rr.Code)
	}
}

func TestSignup_MissingPassword(t *testing.T) {
	req := postJSON(`{"name":"Alice","email":"a@b.com"}`)
	rr := httptest.NewRecorder()
	Signup(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("want 400, got %d", rr.Code)
	}
}

func TestSignup_DuplicateEmail(t *testing.T) {
	mock := setupMockDB(t)
	mock.ExpectQuery("INSERT INTO users").
		WithArgs("Alice", "dup@test.com", sqlmock.AnyArg()).
		WillReturnError(&pq.Error{Code: "23505"})

	req := postJSON(`{"name":"Alice","email":"dup@test.com","password":"secret123"}`)
	rr := httptest.NewRecorder()
	Signup(rr, req)

	if rr.Code != http.StatusConflict {
		t.Errorf("want 409, got %d", rr.Code)
	}
}

func TestSignup_Success(t *testing.T) {
	mock := setupMockDB(t)
	mock.ExpectQuery("INSERT INTO users").
		WithArgs("Alice", "alice@test.com", sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(int64(7)))

	req := postJSON(`{"name":"Alice","email":"alice@test.com","password":"secret123"}`)
	rr := httptest.NewRecorder()
	Signup(rr, req)

	if rr.Code != http.StatusCreated {
		t.Errorf("want 201, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp AuthResponse
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.User == nil || resp.User.ID != 7 {
		t.Errorf("want user.ID=7, got %+v", resp.User)
	}
	if resp.Message == "" {
		t.Error("want non-empty message")
	}
}

// ── Login ─────────────────────────────────────────────────────────────────────

func TestLogin_InvalidJSON(t *testing.T) {
	req := postJSON(`{bad}`)
	rr := httptest.NewRecorder()
	Login(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("want 400, got %d", rr.Code)
	}
}

func TestLogin_MissingEmail(t *testing.T) {
	req := postJSON(`{"password":"secret"}`)
	rr := httptest.NewRecorder()
	Login(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("want 400, got %d", rr.Code)
	}
}

func TestLogin_MissingPassword(t *testing.T) {
	req := postJSON(`{"email":"a@b.com"}`)
	rr := httptest.NewRecorder()
	Login(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("want 400, got %d", rr.Code)
	}
}

func TestLogin_UserNotFound(t *testing.T) {
	mock := setupMockDB(t)
	mock.ExpectQuery("SELECT").
		WithArgs("ghost@test.com").
		WillReturnError(sql.ErrNoRows)

	req := postJSON(`{"email":"ghost@test.com","password":"secret"}`)
	rr := httptest.NewRecorder()
	Login(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("want 401, got %d", rr.Code)
	}
}

func TestLogin_WrongPassword(t *testing.T) {
	mock := setupMockDB(t)
	hash, _ := bcrypt.GenerateFromPassword([]byte("correctpassword"), bcrypt.DefaultCost)
	mock.ExpectQuery("SELECT").
		WithArgs("user@test.com").
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "email", "password_hash"}).
			AddRow(int64(1), "User", "user@test.com", string(hash)))

	req := postJSON(`{"email":"user@test.com","password":"wrongpassword"}`)
	rr := httptest.NewRecorder()
	Login(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("want 401, got %d", rr.Code)
	}
}

func TestLogin_Success(t *testing.T) {
	mock := setupMockDB(t)
	hash, _ := bcrypt.GenerateFromPassword([]byte("mypassword"), bcrypt.DefaultCost)
	mock.ExpectQuery("SELECT").
		WithArgs("alice@test.com").
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "email", "password_hash"}).
			AddRow(int64(3), "Alice", "alice@test.com", string(hash)))

	req := postJSON(`{"email":"alice@test.com","password":"mypassword"}`)
	rr := httptest.NewRecorder()
	Login(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("want 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp AuthResponse
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.User == nil || resp.User.Email != "alice@test.com" {
		t.Errorf("want user email=alice@test.com, got %+v", resp.User)
	}
}
