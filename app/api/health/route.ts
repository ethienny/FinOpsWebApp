import { NextResponse } from "next/server";

// Rota de health-check dedicada, sem dependência do banco. Route Handlers não
// passam pelo RootLayout (que busca dados no SQL), então isso responde
// instantaneamente mesmo enquanto o SQL Serverless ainda está "acordando" —
// evita que o probe de warmup do App Service mate o container antes da
// primeira carga de dados terminar.
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
