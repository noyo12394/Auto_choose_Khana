import { rmSync } from "node:fs";
import { dbPath, migrate, openDb } from "./index.js";

const path = dbPath();
rmSync(path, { force: true });
rmSync(`${path}-wal`, { force: true });
rmSync(`${path}-shm`, { force: true });
const db = migrate(openDb(path));

const createdAt = new Date().toISOString();
db.prepare("INSERT INTO users (id, name, location, created_at) VALUES (?, ?, ?, ?)").run(1, "Aanya", "Bandra, Mumbai", createdAt);
db.prepare(`
  INSERT INTO profile (user_id, dietary, cuisines, spice, budget_lunch, budget_dinner, budget_weekly_groceries, auto_order_budget)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(1, JSON.stringify(["high-protein"]), JSON.stringify(["South Indian", "Maharashtrian", "Coastal"]), "medium", 280, 420, 2400, 350);
db.prepare("INSERT INTO goals (user_id, protein_g, calories, other_json) VALUES (?, ?, ?, ?)").run(1, 115, 2050, JSON.stringify({ fiberG: 28, note: "Prefer steady protein across meals" }));

const pantryItems = [
  ["sku-1", 6, -5],
  ["sku-2", 3, -2],
  ["sku-3", 20, -17],
  ["sku-4", 10, -9],
  ["sku-5", 18, -8],
  ["sku-6", 5, -4],
  ["sku-9", 14, -13],
  ["sku-15", 4, -3]
] as const;
for (const [skuId, cadence, daysAgo] of pantryItems) {
  const last = new Date();
  last.setDate(last.getDate() + daysAgo);
  db.prepare("INSERT INTO pantry (user_id, sku_id, typical_days_between_orders, last_ordered_at) VALUES (?, ?, ?, ?)").run(1, skuId, cadence, last.toISOString());
}

const history = [
  { server: "food", macros: { calories: 610, proteinG: 42, carbsG: 55, fatG: 22 }, summary: "Chicken sukka brown rice bowl" },
  { server: "instamart", macros: { calories: 296, proteinG: 38, carbsG: 8, fatG: 12 }, summary: "Paneer restock" }
];
for (const item of history) {
  db.prepare("INSERT INTO orders (user_id, server, payload_json, status) VALUES (?, ?, ?, ?)").run(1, item.server, JSON.stringify(item), "seeded");
}

console.log(`Seeded Aanya into ${path}`);
