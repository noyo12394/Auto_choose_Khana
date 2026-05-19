import "dotenv/config";
import cron from "node-cron";
import { listUsers, migrate } from "../../db/src/index.js";
import { predictPantryRestock } from "../../core/src/index.js";
import { getUserContext } from "../../db/src/index.js";

export function runPantryPredictor() {
  const db = migrate();
  for (const user of listUsers(db)) {
    const context = getUserContext(user.id, db);
    const proposal = predictPantryRestock(context.pantry);
    if (proposal.items.length > 0) {
      db.prepare("INSERT INTO notifications (user_id, payload_json, status) VALUES (?, ?, ?)").run(
        user.id,
        JSON.stringify({ type: "restock", message: `Ready to restock? ${proposal.items.length} items running low.`, proposal }),
        "pending"
      );
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const schedule = process.env.PANTRY_CRON ?? "0 9 * * *";
  cron.schedule(schedule, runPantryPredictor);
  console.log(`Pantry predictor cron scheduled: ${schedule}`);
}
