// Root layout. Loads the sidebar metadata, the filter options of both scopes
// and the plan entitlements once per request, then wraps every page in the
// application shell.

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { getRepository } from "@/lib/repositories";
import { getEntitlements } from "@/lib/entitlements/store";
import { getAnomalyFilterOptions } from "@/lib/anomalies/service";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "FinOps Insight Engine",
  description: "Cloud Cost Intelligence & Optimization",
};

// The layout reads data (SQL or CSV) on every page. Rendering per request
// avoids depending on database connectivity at build time, when Azure SQL
// Serverless may be paused.
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const repo = getRepository();
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const [meta, filterOptions, anomalyFilterOptions, entitlements] = await Promise.all([
    repo.getSidebarMeta(),
    repo.getFilterOptions(),
    getAnomalyFilterOptions(),
    getEntitlements(),
  ]);

  return (
    <html lang={locale === "pt" ? "pt-BR" : "en"}>
      <body className={`${inter.variable} font-sans`}>
        <LocaleProvider locale={locale} dict={dict}>
          <AppShell meta={meta} filterOptions={filterOptions} anomalyFilterOptions={anomalyFilterOptions} entitlements={entitlements}>
            {children}
          </AppShell>
        </LocaleProvider>
      </body>
    </html>
  );
}
