import { app } from 'electron'
import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db

  const dbPath = path.join(app.getPath('userData'), 'interns.db')

  const dir = path.dirname(dbPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const isFirstRun = !fs.existsSync(dbPath)

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  if (isFirstRun) {
    runMigrations(db)
  }

  return db
}

function runMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS interns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      institution_roll TEXT NOT NULL,
      guardian_name TEXT NOT NULL,
      guardian_relation TEXT NOT NULL,
      branch TEXT NOT NULL,
      year_of_study TEXT NOT NULL,
      starting_date TEXT NOT NULL,
      no_of_days INTEGER NOT NULL,
      section_posted TEXT NOT NULL,
      institution_name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
}
