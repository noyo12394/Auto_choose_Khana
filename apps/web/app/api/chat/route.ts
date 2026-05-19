import { NextResponse } from "next/server";
import { chat } from "@khana/agent";

export async function POST(request: Request) {
  const body = (await request.json()) as { message: string; userId?: number };
  const result = await chat(body.userId ?? 1, body.message);
  return NextResponse.json(result);
}
