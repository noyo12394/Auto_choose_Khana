import Database from "better-sqlite3";
import { dirname, resolve } from "node:path";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

export type UserContext = {
  user: { id: number; name: string; location: string; created_at: string };
  profile: {
    user_id: number;
    dietary: string[];
    cuisines: string[];
    spice: string;
    budget_lunch: number;
    budget_dinner: number;
    budget_weekly_groceries: number;
    auto_order_budget: number;
  };
  goals: { user_id: number; protein_g: number; calories: number; other_json: Record<string, unknown> };
  pantry: { user_id: number; sku_id: string; typical_days_between_orders: number; last_ordered_at: string }[];
  todayMacros: { calories: number; proteinG: number; carbsG: number; fatG: number };
};

export function dbPath() {
  const configured = process.env.DATABASE_URL ?? "./data/pantry.sqlite";
  return resolve(repoRoot, configured);
}

export function openDb(path = dbPath()) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  return db;
}

export function migrate(db = openDb()) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS profile (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      dietary TEXT NOT NULL,
      cuisines TEXT NOT NULL,
      spice TEXT NOT NULL,
      budget_lunch INTEGER NOT NULL,
      budget_dinner INTEGER NOT NULL,
      budget_weekly_groceries INTEGER NOT NULL,
      auto_order_budget INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS goals (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      protein_g INTEGER NOT NULL,
      calories INTEGER NOT NULL,
      other_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pantry (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      sku_id TEXT NOT NULL,
      typical_days_between_orders INTEGER NOT NULL,
      last_ordered_at TEXT NOT NULL,
      PRIMARY KEY (user_id, sku_id)
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      server TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      placed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'pending'
    );
  `);
  return db;
}

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

export function getUserContext(userId: number, db = migrate()): UserContext {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as UserContext["user"] | undefined;
  const profile = db.prepare("SELECT * FROM profile WHERE user_id = ?").get(userId) as Omit<UserContext["profile"], "dietary" | "cuisines"> & { dietary: string; cuisines: string };
  const goals = db.prepare("SELECT * FROM goals WHERE user_id = ?").get(userId) as Omit<UserContext["goals"], "other_json"> & { other_json: string };
  if (!user || !profile || !goals) throw new Error(`Missing user context for user ${userId}`);
  const pantry = db.prepare("SELECT * FROM pantry WHERE user_id = ?").all(userId) as UserContext["pantry"];
  const todayRows = db.prepare("SELECT payload_json FROM orders WHERE user_id = ? AND date(placed_at) = date('now')").all(userId) as { payload_json: string }[];
  const todayMacros = todayRows.reduce(
    (sum, row) => {
      const payload = parseJson<{ macros?: Partial<UserContext["todayMacros"]> }>(row.payload_json);
      return {
        calories: sum.calories + (payload.macros?.calories ?? 0),
        proteinG: sum.proteinG + (payload.macros?.proteinG ?? 0),
        carbsG: sum.carbsG + (payload.macros?.carbsG ?? 0),
        fatG: sum.fatG + (payload.macros?.fatG ?? 0)
      };
    },
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );
  return {
    user,
    profile: { ...profile, dietary: parseJson(profile.dietary), cuisines: parseJson(profile.cuisines) },
    goals: { ...goals, other_json: parseJson(goals.other_json) },
    pantry,
    todayMacros
  };
}

export function logToolCall(userId: number, server: string, payload: unknown, status = "tool_call", db = migrate()) {
  db.prepare("INSERT INTO orders (user_id, server, payload_json, status) VALUES (?, ?, ?, ?)").run(userId, server, JSON.stringify(payload), status);
}

export function listUsers(db = migrate()) {
  return db.prepare("SELECT * FROM users ORDER BY id").all() as UserContext["user"][];
}
