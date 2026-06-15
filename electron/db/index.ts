import { app } from "electron";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;

  const dbPath = path.join(app.getPath("userData"), "interns.db");

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const isFirstRun = !fs.existsSync(dbPath);

  db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL");

  if (isFirstRun) {
    runMigrations(db);
  }

  return db;
}

export interface InternRow {
  name: string;
  gender?: string;
  identification_mark?: string;
  institution_roll: string;
  degree?: string;
  branch: string;
  year_of_study: string;
  guardian_name: string;
  guardian_relation: string;
  res_c_o?: string;
  res_p_o?: string;
  res_pin?: string;
  res_contact?: string;
  cur_c_o?: string;
  cur_p_o?: string;
  cur_pin?: string;
  cur_contact?: string;
  starting_date: string;
  no_of_days: number;
  section_posted: string;
  institution_name: string;
  registration_id?: string;
}

export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  security_question: string;
  security_answer_hash: string;
  created_at: string;
}

export function insertInterns(rows: InternRow[]): number {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO interns (
      name, institution_roll, guardian_name, guardian_relation,
      branch, year_of_study, starting_date, no_of_days,
      section_posted, institution_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  database.exec("BEGIN");
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
      );
    }
    database.exec("COMMIT");
  } catch (err) {
    database.exec("ROLLBACK");
    throw err;
  }
  return rows.length;
}

const LIKE_FIELDS = new Set([
  "name",
  "institution_roll",
  "guardian_name",
  "guardian_relation",
  "branch",
  "institution_name",
]);

export function searchInterns(
  filters: Partial<InternRow>,
): Record<string, unknown>[] {
  const database = getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];

  for (const [field, value] of Object.entries(filters)) {
    if (value === "" || value == null) continue;

    if (LIKE_FIELDS.has(field)) {
      conditions.push(`${field} LIKE ?`);
      params.push(`%${value}%`);
    } else if (field === "no_of_days") {
      conditions.push(`${field} = ?`);
      params.push(Number(value));
    } else {
      conditions.push(`${field} = ?`);
      params.push(value);
    }
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sql = `SELECT * FROM interns ${where} ORDER BY created_at DESC`;

  const stmt = database.prepare(sql);

  console.log(params);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  return stmt.all(...params);
}

export function getAllInterns(): InternRow[] {
  const database = getDb();
  const stmt = database.prepare(
    "SELECT * FROM interns ORDER BY created_at DESC",
  );
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return stmt.all() as InternRow[];
}

export function createUser(
  username: string,
  passwordHash: string,
  securityQuestion: string,
  securityAnswerHash: string,
): number {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO users (username, password_hash, security_question, security_answer_hash)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(
    username,
    passwordHash,
    securityQuestion,
    securityAnswerHash,
  );
  return Number(result.lastInsertRowid);
}

export function getUserByUsername(username: string): UserRow | undefined {
  const database = getDb();
  const stmt = database.prepare("SELECT * FROM users WHERE username = ?");
  return stmt.get(username) as UserRow | undefined;
}

export function getUserSecurityQuestion(username: string): string | undefined {
  const database = getDb();
  const stmt = database.prepare(
    "SELECT security_question FROM users WHERE username = ?",
  );
  const row = stmt.get(username) as { security_question: string } | undefined;
  return row?.security_question;
}

export function updatePassword(
  username: string,
  newPasswordHash: string,
): boolean {
  const database = getDb();
  const stmt = database.prepare(
    "UPDATE users SET password_hash = ? WHERE username = ?",
  );
  const result = stmt.run(newPasswordHash, username);
  return result.changes > 0;
}

export function checkSecurityAnswerHash(
  username: string,
  passwordHash: string,
): boolean {
  const database = getDb();

  const stmt = "SELECT security_answer_hash FROM users WHERE username = ?";
  const prepared_stmt = database.prepare(stmt);

  const result = prepared_stmt.get(username);
  if (passwordHash === result?.security_answer_hash) {
    return true;
  } else {
    return false;
  }
}

export interface SafeUserRow {
  id: number
  username: string
  security_question: string
  created_at: string
}

export function getAllUsers(): SafeUserRow[] {
  const database = getDb()
  const stmt = database.prepare(
    'SELECT id, username, security_question, created_at FROM users ORDER BY username ASC',
  )
  return stmt.all() as SafeUserRow[]
}

export interface OfficerRow {
  id: number
  officer_name: string
  officer_designation: string
  created_at: string
}

export function getAllOfficers(): OfficerRow[] {
  const database = getDb()
  const stmt = database.prepare(
    'SELECT id, officer_name, officer_designation, created_at FROM signing_officers ORDER BY officer_name ASC',
  )
  return stmt.all() as OfficerRow[]
}

export function insertOfficer(name: string, designation: string): number {
  const database = getDb()
  const stmt = database.prepare(
    'INSERT INTO signing_officers (officer_name, officer_designation) VALUES (?, ?)',
  )
  const result = stmt.run(name, designation)
  return Number(result.lastInsertRowid)
}

export function deleteOfficer(id: number): boolean {
  const database = getDb()
  const stmt = database.prepare('DELETE FROM signing_officers WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}

export function insertManualIntern(row: InternRow): number {
  const database = getDb()
  const stmt = database.prepare(`
    INSERT INTO interns (
      name, gender, identification_mark,
      institution_roll, degree, branch, year_of_study,
      guardian_name, guardian_relation,
      res_c_o, res_p_o, res_pin, res_contact,
      cur_c_o, cur_p_o, cur_pin, cur_contact,
      starting_date, no_of_days, section_posted, institution_name, registration_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  database.exec('BEGIN')
  try {
    stmt.run(
      row.name,
      row.gender ?? null,
      row.identification_mark ?? null,
      row.institution_roll,
      row.degree ?? null,
      row.branch,
      row.year_of_study,
      row.guardian_name,
      row.guardian_relation,
      row.res_c_o ?? null,
      row.res_p_o ?? null,
      row.res_pin ?? null,
      row.res_contact ?? null,
      row.cur_c_o ?? null,
      row.cur_p_o ?? null,
      row.cur_pin ?? null,
      row.cur_contact ?? null,
      row.starting_date,
      row.no_of_days,
      row.section_posted,
      row.institution_name,
      row.registration_id ?? null,
    )
    database.exec('COMMIT')
  } catch (err) {
    database.exec('ROLLBACK')
    throw err
  }
  return 1
}

function runMigrations(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS interns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      gender TEXT,
      identification_mark TEXT,
      institution_roll TEXT NOT NULL,
      degree TEXT,
      branch TEXT NOT NULL,
      year_of_study TEXT NOT NULL,
      guardian_name TEXT NOT NULL,
      guardian_relation TEXT NOT NULL,
      res_c_o TEXT,
      res_p_o TEXT,
      res_pin TEXT,
      res_contact TEXT,
      cur_c_o TEXT,
      cur_p_o TEXT,
      cur_pin TEXT,
      cur_contact TEXT,
      starting_date TEXT NOT NULL,
      no_of_days INTEGER NOT NULL,
      section_posted TEXT NOT NULL,
      institution_name TEXT NOT NULL,
      registration_id TEXT UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      security_question TEXT NOT NULL,
      security_answer_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS signing_officers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      officer_name TEXT NOT NULL,
      officer_designation TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
}
