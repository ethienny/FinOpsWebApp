// Connection state and provider identity for the onboarding emulation. The
// provider identity comes from the environment with placeholders for local
// use; the connection is kept in data/state, outside version control.

import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import type { AzureConnection, ProviderIdentity } from "@/types/onboarding";
import { isGuid } from "./lighthouse";

const STATE_DIR = join(process.cwd(), "data", "state");
const CONNECTION_FILE = join(STATE_DIR, "connection.json");

const PLACEHOLDER_TENANT = "00000000-0000-0000-0000-000000000000";
const PLACEHOLDER_PRINCIPAL = "00000000-0000-0000-0000-000000000001";

export function getProviderIdentity(): ProviderIdentity & { placeholder: boolean } {
  const tenantId = process.env.FINOPS_PROVIDER_TENANT_ID || PLACEHOLDER_TENANT;
  const principalId = process.env.FINOPS_PROVIDER_PRINCIPAL_ID || PLACEHOLDER_PRINCIPAL;
  return {
    tenantId,
    principalId,
    principalDisplayName: process.env.FINOPS_PROVIDER_PRINCIPAL_NAME || "FinOps Insight Engine",
    offerName: "FinOps Insight Engine",
    placeholder: tenantId === PLACEHOLDER_TENANT || principalId === PLACEHOLDER_PRINCIPAL,
  };
}

export async function getConnection(): Promise<AzureConnection | null> {
  if (!existsSync(CONNECTION_FILE)) return null;
  try {
    const parsed = JSON.parse(readFileSync(CONNECTION_FILE, "utf8")) as AzureConnection;
    // The subscription id feeds a command shown for copy and paste, so the file is checked like the form was.
    return isGuid(parsed.subscriptionId) ? parsed : null;
  } catch (err) {
    console.error("[connection] stored connection could not be read:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function saveConnection(connection: AzureConnection): Promise<void> {
  mkdirSync(STATE_DIR, { recursive: true });
  const tmp = `${CONNECTION_FILE}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, JSON.stringify(connection, null, 2));
  renameSync(tmp, CONNECTION_FILE);
}

export async function clearConnection(): Promise<void> {
  if (existsSync(CONNECTION_FILE)) unlinkSync(CONNECTION_FILE);
}
