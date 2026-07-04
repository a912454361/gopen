package database

import (
	"database/sql"
	"os"

	_ "github.com/glebarez/go-sqlite"
)

var DB *sql.DB

func Init() error {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./data/gopen.db"
	}

	if err := os.MkdirAll("./data", 0755); err != nil {
		return err
	}

	var err error
	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		return err
	}

	if err := DB.Ping(); err != nil {
		return err
	}

	_, err = DB.Exec(`CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT UNIQUE NOT NULL,
		email TEXT UNIQUE NOT NULL,
		password TEXT NOT NULL,
		provider TEXT DEFAULT 'local',
		provider_id TEXT,
		avatar TEXT,
		is_active INTEGER DEFAULT 1,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)`)
	if err != nil {
		return err
	}

	return nil
}

func GetDB() *sql.DB {
	return DB
}
