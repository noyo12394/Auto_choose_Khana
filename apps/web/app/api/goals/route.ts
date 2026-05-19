import { NextResponse } from "next/server";
import { migrate } from "@khana/db";

export async function POST(request: Request) {
  const body = (await request.json()) as { protein_g: number; calories: number; spice: string };
  const db = migrate();
  db.prepare("UPDATE goals SET protein_g = ?, calories = ? WHERE user_id = 1").run(body.protein_g, body.calories);
  db.prepare("UPDATE profile SET spice = ? WHERE user_id = 1").run(body.spice);
  return NextResponse.json({ ok: true });
}
