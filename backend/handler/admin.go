package handler

import (
	"encoding/json"
	"net/http"
	"selwa/model"
	"selwa/utils"
	"strconv"

	"github.com/gorilla/mux"
)

func adminGuard(w http.ResponseWriter, r *http.Request) (*model.User, bool) {
	idStr := r.Header.Get("X-User-ID")
	if idStr == "" {
		utils.ResponseWithError(w, http.StatusUnauthorized, "Authentication required")
		return nil, false
	}
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.ResponseWithError(w, http.StatusUnauthorized, "Invalid user ID")
		return nil, false
	}
	user, err := model.GetUserByID(id)
	if err != nil || !user.IsAdmin {
		utils.ResponseWithError(w, http.StatusForbidden, "Admin access required")
		return nil, false
	}
	return user, true
}

func AdminStats(w http.ResponseWriter, r *http.Request) {
	if _, ok := adminGuard(w, r); !ok {
		return
	}
	stats, err := model.GetAdminStats()
	if err != nil {
		utils.ResponseWithError(w, http.StatusInternalServerError, "Failed to fetch stats")
		return
	}
	utils.ResponseWithJSON(w, http.StatusOK, stats)
}

func AdminGetUsers(w http.ResponseWriter, r *http.Request) {
	if _, ok := adminGuard(w, r); !ok {
		return
	}
	users, err := model.GetAllUsers()
	if err != nil {
		utils.ResponseWithError(w, http.StatusInternalServerError, "Failed to fetch users")
		return
	}
	utils.ResponseWithJSON(w, http.StatusOK, users)
}

func AdminGetOrders(w http.ResponseWriter, r *http.Request) {
	if _, ok := adminGuard(w, r); !ok {
		return
	}
	orders, err := model.GetAllOrders()
	if err != nil {
		utils.ResponseWithError(w, http.StatusInternalServerError, "Failed to fetch orders")
		return
	}
	utils.ResponseWithJSON(w, http.StatusOK, orders)
}

func AdminCreateProduct(w http.ResponseWriter, r *http.Request) {
	if _, ok := adminGuard(w, r); !ok {
		return
	}
	var input model.CreateProductInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		utils.ResponseWithError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}
	defer r.Body.Close()
	if input.Name == "" || input.Category == "" || input.Price <= 0 {
		utils.ResponseWithError(w, http.StatusBadRequest, "Name, category, and price are required")
		return
	}
	product, err := model.CreateProduct(input)
	if err != nil {
		utils.ResponseWithError(w, http.StatusInternalServerError, "Failed to create product")
		return
	}
	utils.ResponseWithJSON(w, http.StatusCreated, product)
}

func AdminUpdateProduct(w http.ResponseWriter, r *http.Request) {
	if _, ok := adminGuard(w, r); !ok {
		return
	}
	id, err := strconv.ParseInt(mux.Vars(r)["id"], 10, 64)
	if err != nil {
		utils.ResponseWithError(w, http.StatusBadRequest, "Invalid product ID")
		return
	}
	var input model.CreateProductInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		utils.ResponseWithError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}
	defer r.Body.Close()
	product, err := model.UpdateProduct(id, input)
	if err != nil {
		if err == model.ErrProductNotFound {
			utils.ResponseWithError(w, http.StatusNotFound, "Product not found")
			return
		}
		utils.ResponseWithError(w, http.StatusInternalServerError, "Failed to update product")
		return
	}
	utils.ResponseWithJSON(w, http.StatusOK, product)
}

func AdminDeleteProduct(w http.ResponseWriter, r *http.Request) {
	if _, ok := adminGuard(w, r); !ok {
		return
	}
	id, err := strconv.ParseInt(mux.Vars(r)["id"], 10, 64)
	if err != nil {
		utils.ResponseWithError(w, http.StatusBadRequest, "Invalid product ID")
		return
	}
	if err := model.DeleteProduct(id); err != nil {
		if err == model.ErrProductNotFound {
			utils.ResponseWithError(w, http.StatusNotFound, "Product not found")
			return
		}
		utils.ResponseWithError(w, http.StatusInternalServerError, "Failed to delete product")
		return
	}
	utils.ResponseWithJSON(w, http.StatusOK, map[string]string{"message": "Product deleted"})
}
