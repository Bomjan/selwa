package httpresp

import (
	"encoding/json"
	"net/http"
)

type ErrorResponse struct {
	Error string `json:"error"`
}

type MessageResponse struct {
	Message string `json:"message"`
}

func ResponseWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(payload)
}

func ResponseWithError(w http.ResponseWriter, code int, message string) {
	ResponseWithJSON(w, code, ErrorResponse{Error: message})
}

func ResponseWithMessage(w http.ResponseWriter, code int, message string) {
	ResponseWithJSON(w, code, MessageResponse{Message: message})
}
