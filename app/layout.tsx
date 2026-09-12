import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { getRepository } from "@/lib/repositories";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "FinOps Insight Engine",
  description: "Cloud Cost Intelligence & Optimization",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const repo = getRepository();
  const [meta, filterOptions] = await Promise.all([repo.getSidebarMeta(), repo.getFilterOptions()]);

  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <AppShell meta={meta} filterOptions={filterOptions}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
