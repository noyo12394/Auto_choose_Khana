import { NextResponse } from "next/server";
import { migrate } from "@khana/db";

export async function DELETE() {
  const db = migrate();
  db.prepare("DELETE FROM users WHERE id = ?").run(1);
  return NextResponse.json({ ok: true });
}
