-- D1 Database Schema for Mizany

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  city TEXT DEFAULT 'Kota Tangerang',
  tilawah_target INTEGER DEFAULT 20,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS amal_items (
  id TEXT PRIMARY KEY,
  user_id TEXT, -- NULL for system defaults
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'checklist', 'target', 'counter', 'amount'
  unit TEXT,
  icon TEXT DEFAULT 'star',
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  log_date TEXT NOT NULL, -- 'YYYY-MM-DD'
  amal_id TEXT NOT NULL,
  is_done INTEGER DEFAULT 0,
  value REAL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, log_date, amal_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (amal_id) REFERENCES amal_items(id) ON DELETE CASCADE
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(user_id, log_date);
