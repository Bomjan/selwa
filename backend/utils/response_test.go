package utils

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestResponseWithJSON_SetsContentType(t *testing.T) {
	rr := httptest.NewRecorder()
	ResponseWithJSON(rr, http.StatusOK, map[string]string{"key": "val"})

	ct := rr.Header().Get("Content-Type")
	if ct != "application/json" {
		t.Errorf("want Content-Type application/json, got %q", ct)
	}
}

func TestResponseWithJSON_SetsStatusCode(t *testing.T) {
	rr := httptest.NewRecorder()
	ResponseWithJSON(rr, http.StatusCreated, nil)

	if rr.Code != http.StatusCreated {
		t.Errorf("want 201, got %d", rr.Code)
	}
}

func TestResponseWithJSON_EncodesPayload(t *testing.T) {
	rr := httptest.NewRecorder()
	ResponseWithJSON(rr, http.StatusOK, map[string]string{"status": "ok"})

	var got map[string]string
	if err := json.NewDecoder(rr.Body).Decode(&got); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if got["status"] != "ok" {
		t.Errorf("want status=ok, got %q", got["status"])
	}
}

func TestResponseWithError_HasErrorField(t *testing.T) {
	rr := httptest.NewRecorder()
	ResponseWithError(rr, http.StatusBadRequest, "something broke")

	if rr.Code != http.StatusBadRequest {
		t.Errorf("want 400, got %d", rr.Code)
	}

	var got ErrorResponse
	if err := json.NewDecoder(rr.Body).Decode(&got); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if got.Error != "something broke" {
		t.Errorf("want error=something broke, got %q", got.Error)
	}
}
