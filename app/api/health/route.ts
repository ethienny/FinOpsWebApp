// Health check endpoint with no database dependency. Route handlers do not
// go through the root layout, which reads data from SQL, so this answers at
// once even while SQL Serverless is still waking up. That keeps the App
// Service warmup probe from killing the container before the first data load
// finishes.

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok" });
}
