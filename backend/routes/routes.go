package routes

import (
	"log"
	"net/http"
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

	r.PathPrefix("/").Handler(http.FileServer(http.Dir("../frontend")))

	log.Println("server running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
