import { getUserContext, migrate } from "@khana/db";
import { predictPantryRestock } from "@khana/core";
import { PantryApp } from "../components/pantry-app";

export const dynamic = "force-dynamic";

export default function Page() {
  const db = migrate();
  const context = getUserContext(1, db);
  const notifications = db.prepare("SELECT * FROM notifications WHERE user_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1").all(1) as { payload_json: string }[];
  return (
    <PantryApp
      initialContext={context}
      initialPrediction={predictPantryRestock(context.pantry)}
      notification={notifications[0] ? JSON.parse(notifications[0].payload_json) : null}
    />
  );
}
