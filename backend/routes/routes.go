package routes

import (
	"log"
	"net/http"
	"selwa/handler"
)

// only routes to h if the HTTP method matches; otherwise 405
func only(method string, h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != method {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		h(w, r)
	}
}

func InitializeRoutes() {
	mux := http.NewServeMux()

	mux.HandleFunc("/api/health", only(http.MethodGet, handler.HealthCheck))
	mux.HandleFunc("/api/products", only(http.MethodGet, handler.GetProducts))
	mux.HandleFunc("/api/products/", only(http.MethodGet, handler.GetProduct))
	mux.HandleFunc("/api/signup", only(http.MethodPost, handler.Signup))
	mux.HandleFunc("/api/login", only(http.MethodPost, handler.Login))

	mux.Handle("/", http.FileServer(http.Dir("../frontend")))

	log.Println("server running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
