package routes

import (
	"log"
	"net/http"
	"selwa/db"
	"selwa/handler"
)

func InitializeRoutes() {
	db.Init()

	mux := http.NewServeMux()

	mux.HandleFunc("/api/health", handler.HealthCheck)
	mux.HandleFunc("/api/products", handler.GetProducts)
	mux.HandleFunc("/api/products/", handler.GetProduct)
	mux.HandleFunc("/api/signup", handler.Signup)
	mux.HandleFunc("/api/login", handler.Login)

	fileServer := http.FileServer(http.Dir("../frontend"))
	mux.Handle("/", fileServer)

	log.Println("server running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
