package routes

import (
	"log"
	"net/http"
	"os"
	"selwa/handler"

	"github.com/gorilla/mux"
)

func InitializeRoutes() {
	r := mux.NewRouter()

	r.HandleFunc("/api/health", handler.HealthCheck).Methods("GET")
	r.HandleFunc("/api/products", handler.GetProducts).Methods("GET")
	r.HandleFunc("/api/products/{id}", handler.GetProduct).Methods("GET")
	r.HandleFunc("/api/signup", handler.Signup).Methods("POST")
	r.HandleFunc("/api/login", handler.Login).Methods("POST")
	r.HandleFunc("/api/logout", handler.Logout).Methods("POST")
	r.HandleFunc("/api/me", handler.Me).Methods("GET")
	r.HandleFunc("/api/orders", handler.PlaceOrder).Methods("POST")

	// Admin routes — protected by X-User-ID header (user must have is_admin=true)
	r.HandleFunc("/api/admin/stats", handler.AdminStats).Methods("GET")
	r.HandleFunc("/api/admin/users", handler.AdminGetUsers).Methods("GET")
	r.HandleFunc("/api/admin/orders", handler.AdminGetOrders).Methods("GET")
	r.HandleFunc("/api/admin/products", handler.AdminCreateProduct).Methods("POST")
	r.HandleFunc("/api/admin/products/{id}", handler.AdminUpdateProduct).Methods("PUT")
	r.HandleFunc("/api/admin/products/{id}", handler.AdminDeleteProduct).Methods("DELETE")

	r.PathPrefix("/").Handler(http.FileServer(http.Dir("../frontend")))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("server running on http://localhost:%s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
