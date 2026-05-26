package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"selwa/model"
	"selwa/utils"

	"github.com/gorilla/mux"
)

func GetWishlist(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.UserIDFromCookie(r)
	if err != nil {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}
	items, err := model.GetWishlist(userID)
	if err != nil {
		http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

func AddToWishlist(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.UserIDFromCookie(r)
	if err != nil {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}
	var body struct {
		ProductID int64 `json:"product_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.ProductID == 0 {
		http.Error(w, `{"error":"invalid request"}`, http.StatusBadRequest)
		return
	}
	if err := model.AddToWishlist(userID, body.ProductID); err != nil {
		http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func RemoveFromWishlist(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.UserIDFromCookie(r)
	if err != nil {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}
	productID, err := strconv.ParseInt(mux.Vars(r)["productID"], 10, 64)
	if err != nil {
		http.Error(w, `{"error":"invalid product id"}`, http.StatusBadRequest)
		return
	}
	if err := model.RemoveFromWishlist(userID, productID); err != nil {
		http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
