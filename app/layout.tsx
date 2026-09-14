import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { getRepository } from "@/lib/repositories";
import { getEntitlements } from "@/lib/entitlements/store";
import { getAnomalyFilterOptions } from "@/lib/anomalies/service";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "FinOps Insight Engine",
  description: "Cloud Cost Intelligence & Optimization",
};

// O layout busca dados (SQL/CSV) em toda página; força renderização por
// requisição para não depender de conectividade com o banco em build time
// (o Azure SQL Serverless pode estar pausado durante o build).
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const repo = getRepository();
  const [meta, filterOptions, anomalyFilterOptions, entitlements] = await Promise.all([
    repo.getSidebarMeta(),
    repo.getFilterOptions(),
    getAnomalyFilterOptions(),
    getEntitlements(),
  ]);

  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <AppShell meta={meta} filterOptions={filterOptions} anomalyFilterOptions={anomalyFilterOptions} entitlements={entitlements}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
