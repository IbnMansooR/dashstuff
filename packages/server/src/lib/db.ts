import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, "../../data");
fs.mkdirSync(dataDir, { recursive: true });

export const DATA_DIR = dataDir;
export const SCREENSHOT_DIR = path.join(dataDir, "screenshots");
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

export const db = new DatabaseSync(path.join(dataDir, "worktrack.sqlite"));
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS companies (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  company_id    TEXT NOT NULL REFERENCES companies(id),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('owner','manager','employee')),
  hourly_rate   REAL NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'UZS',
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS devices (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  company_id  TEXT NOT NULL REFERENCES companies(id),
  token_hash  TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL DEFAULT 'Qurilma',
  os          TEXT NOT NULL DEFAULT '',
  revoked     INTEGER NOT NULL DEFAULT 0,
  last_seen_at TEXT,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS samples (
  id               TEXT PRIMARY KEY,
  device_id        TEXT NOT NULL REFERENCES devices(id),
  user_id          TEXT NOT NULL REFERENCES users(id),
  company_id       TEXT NOT NULL REFERENCES companies(id),
  started_at       TEXT NOT NULL,
  ended_at         TEXT NOT NULL,
  key_count        INTEGER NOT NULL DEFAULT 0,
  mouse_count      INTEGER NOT NULL DEFAULT 0,
  activity_percent INTEGER NOT NULL DEFAULT 0,
  working          INTEGER NOT NULL DEFAULT 1,
  created_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_samples_user_time ON samples(user_id, started_at);

CREATE TABLE IF NOT EXISTS screenshots (
  id          TEXT PRIMARY KEY,
  sample_id   TEXT NOT NULL REFERENCES samples(id),
  user_id     TEXT NOT NULL REFERENCES users(id),
  company_id  TEXT NOT NULL REFERENCES companies(id),
  taken_at    TEXT NOT NULL,
  enc_path    TEXT NOT NULL,
  iv          TEXT NOT NULL,
  auth_tag    TEXT NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_screenshots_user_time ON screenshots(user_id, taken_at);
`);

console.log("DB tayyor:", path.join(dataDir, "worktrack.sqlite"));
