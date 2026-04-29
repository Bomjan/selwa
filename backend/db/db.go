package db

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var Db *sql.DB

func Init() {
	if Db != nil {
		return
	}

	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		connStr = "postgres://sundrabomjan@/selwa?host=/var/run/postgresql&sslmode=disable"
	}

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("database open error:", err)
	}

	if err := db.Ping(); err != nil {
		log.Fatal("database ping error:", err)
	}

	Db = db
}
