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
	r.HandleFunc("/api/wishlist", handler.GetWishlist).Methods("GET")
	r.HandleFunc("/api/wishlist", handler.AddToWishlist).Methods("POST")
	r.HandleFunc("/api/wishlist/{productID}", handler.RemoveFromWishlist).Methods("DELETE")

	r.PathPrefix("/").Handler(http.FileServer(http.Dir("../frontend")))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("server running on http://localhost:%s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
