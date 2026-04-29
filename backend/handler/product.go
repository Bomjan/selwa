package handler

import (
	"net/http"
	"selwa/model"
	"selwa/utils"
	"strconv"
	"strings"
)

func HealthCheck(w http.ResponseWriter, r *http.Request) {
	utils.ResponseWithJSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"service": "selwa-backend",
	})
}

func GetProducts(w http.ResponseWriter, r *http.Request) {
	products, err := model.GetAllProducts()
	if err != nil {
		utils.ResponseWithError(w, http.StatusInternalServerError, "Failed to fetch products")
		return
	}

	utils.ResponseWithJSON(w, http.StatusOK, products)
}

func GetProduct(w http.ResponseWriter, r *http.Request) {
	idText := strings.TrimPrefix(r.URL.Path, "/api/products/")
	idText = strings.TrimSpace(idText)
	if idText == "" {
		utils.ResponseWithError(w, http.StatusBadRequest, "Product ID is required")
		return
	}

	id, err := strconv.ParseInt(idText, 10, 64)
	if err != nil {
		utils.ResponseWithError(w, http.StatusBadRequest, "Invalid product ID")
		return
	}

	product := &model.Product{ID: id}
	if err := product.Read(); err != nil {
		if err == model.ErrProductNotFound {
			utils.ResponseWithError(w, http.StatusNotFound, "Product not found")
			return
		}

		utils.ResponseWithError(w, http.StatusInternalServerError, "Failed to fetch product")
		return
	}

	utils.ResponseWithJSON(w, http.StatusOK, product)
}
