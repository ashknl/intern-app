import { app } from 'electron'
import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'
import fs from 'node:fs'

let db: DatabaseSync | null = null

export function getDb(): DatabaseSync {
  if (db) return db

  const dbPath = path.join(app.getPath('userData'), 'interns.db')

  const dir = path.dirname(dbPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const isFirstRun = !fs.existsSync(dbPath)

  db = new DatabaseSync(dbPath)
  db.exec('PRAGMA journal_mode = WAL')

  if (isFirstRun) {
    runMigrations(db)
  }

  return db
}

export interface InternRow {
  name: string
  institution_roll: string
  guardian_name: string
  guardian_relation: string
  branch: string
  year_of_study: string
  starting_date: string
  no_of_days: number
  section_posted: string
  institution_name: string
}

export function insertInterns(rows: InternRow[]): number {
  const database = getDb()
  const stmt = database.prepare(`
    INSERT INTO interns (
      name, institution_roll, guardian_name, guardian_relation,
      branch, year_of_study, starting_date, no_of_days,
      section_posted, institution_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  database.exec('BEGIN')
  try {
    for (const row of rows) {
      stmt.run(
        row.name,
        row.institution_roll,
        row.guardian_name,
        row.guardian_relation,
        row.branch,
        row.year_of_study,
        row.starting_date,
        row.no_of_days,
        row.section_posted,
        row.institution_name,
      )
    }
    database.exec('COMMIT')
  } catch (err) {
    database.exec('ROLLBACK')
    throw err
  }
  return rows.length
}

const LIKE_FIELDS = new Set([
  'name',
  'institution_roll',
  'guardian_name',
  'guardian_relation',
  'branch',
  'institution_name',
])

export function searchInterns(filters: Partial<InternRow>): Record<string, unknown>[] {
  const database = getDb()
  const conditions: string[] = []
  const params: unknown[] = []

  for (const [field, value] of Object.entries(filters)) {
    if (value === '' || value == null) continue

    if (LIKE_FIELDS.has(field)) {
      conditions.push(`${field} LIKE ?`)
      params.push(`%${value}%`)
    } else if (field === 'no_of_days') {
      conditions.push(`${field} = ?`)
      params.push(Number(value))
    } else {
      conditions.push(`${field} = ?`)
      params.push(value)
    }
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const sql = `SELECT * FROM interns ${where} ORDER BY created_at DESC`

  const stmt = database.prepare(sql)

  console.log(params)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  return stmt.all(...params)
}

export function getAllInterns(): InternRow[] {
  const database = getDb()
  const stmt = database.prepare('SELECT * FROM interns ORDER BY created_at DESC')
  //@ts-ignore
  return stmt.all() as InternRow[]
}

function runMigrations(db: DatabaseSync): void {
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