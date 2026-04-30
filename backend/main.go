package main

import (
	"selwa/db"
	"selwa/routes"
)

func main() {
	db.Init()
	routes.InitializeRoutes()
}
