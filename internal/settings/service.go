package settings

import (
	"database/sql"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

type SettingsService struct {
	db *sql.DB
}

func NewSettingsService() (*SettingsService, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}
	appDir := filepath.Join(home, ".aura")
	if err := os.MkdirAll(appDir, 0755); err != nil {
		return nil, err
	}
	dbPath := filepath.Join(appDir, "aura.db")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, err
	}

	// Optimize SQLite performance and enable WAL mode to prevent SQLITE_BUSY locks
	_, _ = db.Exec("PRAGMA journal_mode=WAL;")
	_, _ = db.Exec("PRAGMA synchronous=NORMAL;")
	_, _ = db.Exec("PRAGMA busy_timeout=5000;")

	// Create tables if they don't exist
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS folders (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			path TEXT UNIQUE NOT NULL
		);
		CREATE TABLE IF NOT EXISTS config (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);
	`)
	if err != nil {
		db.Close()
		return nil, err
	}

	return &SettingsService{db: db}, nil
}

func (s *SettingsService) GetFolders() ([]string, error) {
	rows, err := s.db.Query("SELECT path FROM folders")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var folders []string
	for rows.Next() {
		var path string
		if err := rows.Scan(&path); err != nil {
			return nil, err
		}
		folders = append(folders, path)
	}
	return folders, nil
}

func (s *SettingsService) AddFolder(path string) error {
	_, err := s.db.Exec("INSERT OR IGNORE INTO folders (path) VALUES (?)", path)
	return err
}

func (s *SettingsService) DeleteFolder(path string) error {
	_, err := s.db.Exec("DELETE FROM folders WHERE path = ?", path)
	return err
}

func (s *SettingsService) IsFirstTime() (bool, error) {
	var val string
	err := s.db.QueryRow("SELECT value FROM config WHERE key = 'first_time'").Scan(&val)
	if err == sql.ErrNoRows {
		// If key doesn't exist, it is first time
		return true, nil
	}
	if err != nil {
		return false, err
	}
	return val == "true", nil
}

func (s *SettingsService) SetFirstTime(value bool) error {
	valStr := "false"
	if value {
		valStr = "true"
	}
	_, err := s.db.Exec("INSERT OR REPLACE INTO config (key, value) VALUES ('first_time', ?)", valStr)
	return err
}

func (s *SettingsService) GetDB() *sql.DB {
	return s.db
}
