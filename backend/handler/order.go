package handler

import (
	"encoding/json"
	"net/http"
	"selwa/model"
	"selwa/utils"
)

func PlaceOrder(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.UserIDFromCookie(r)
	if err != nil {
		utils.ResponseWithError(w, http.StatusUnauthorized, "Please sign in to place an order")
		return
	}

	var input model.CreateOrderInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		utils.ResponseWithError(w, http.StatusBadRequest, "Invalid request")
		return
	}
	defer r.Body.Close()

	if len(input.Items) == 0 {
		utils.ResponseWithError(w, http.StatusBadRequest, "Cart is empty")
		return
	}

	orderID, err := model.CreateOrder(userID, input)
	if err != nil {
		utils.ResponseWithError(w, http.StatusInternalServerError, "Failed to place order")
		return
	}

	utils.ResponseWithJSON(w, http.StatusCreated, map[string]int64{"order_id": orderID})
}
