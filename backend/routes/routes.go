package routes

import (
	"log"
	"net/http"
	"selwa/controller"
	"selwa/dataStore/postgres"
)

func InitializeRoutes() {
	postgres.Init()

	mux := http.NewServeMux()

	mux.HandleFunc("/api/health", methodGuard(http.MethodGet, controller.HealthCheck))
	mux.HandleFunc("/api/products", methodGuard(http.MethodGet, controller.GetProducts))
	mux.HandleFunc("/api/products/", methodGuard(http.MethodGet, controller.GetProduct))
	mux.HandleFunc("/api/signup", methodGuard(http.MethodPost, controller.Signup))
	mux.HandleFunc("/api/login", methodGuard(http.MethodPost, controller.Login))

	fileServer := http.FileServer(http.Dir("../frontend"))
	mux.Handle("/", fileServer)

	handler := withCORS(mux)

	log.Println("server running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}

func methodGuard(expected string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != expected {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		next(w, r)
	}
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
