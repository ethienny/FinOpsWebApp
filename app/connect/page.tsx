// Onboarding page. Shows what the product asks for on Azure, generates the
// Lighthouse template with the provider identity, and records the connection.
// Emulation: no call to Azure is made; the material itself is real.

import { ShieldCheck } from "lucide-react";
import { ConnectForm } from "@/components/onboarding/ConnectForm";
import { CopyBlock } from "@/components/onboarding/CopyBlock";
import { StatusBadge } from "@/components/badges";
import { disconnectAzure } from "@/app/actions/connection";
import { formatDate } from "@/lib/formatters";
import { buildLighthouseTemplate, deployCommand, REQUIRED_ROLES, revokeCommand } from "@/lib/onboarding/lighthouse";
import { getConnection, getProviderIdentity } from "@/lib/onboarding/store";

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section className="card-surface p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400/15 text-xs font-semibold text-cyan-100">
          {number}
        </span>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export default async function ConnectPage() {
  const [connection, provider] = await Promise.all([getConnection(), getProviderIdentity()]);
  const template = JSON.stringify(buildLighthouseTemplate(provider), null, 2);
  const subscription = connection?.subscriptionId ?? "<your-subscription-id>";

  return (
    <div className="space-y-6">
      <section className="card-surface flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-cyan-300" />
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-cyan-300">Azure connection</p>
            {connection ? (
              <>
                <p className="mt-1 text-sm text-white">
                  {connection.displayName} <span className="font-mono text-xs text-slate-400">{connection.subscriptionId}</span>
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Connected {formatDate(connection.connectedAt)} via {connection.method === "lighthouse" ? "Azure Lighthouse" : "app registration"} by {connection.connectedBy}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-slate-300">No subscription connected yet. Follow the three steps below.</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge value={connection ? "CONNECTED" : "NOT CONNECTED"} />
          {connection ? (
            <form action={disconnectAzure}>
              <button type="submit" className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 hover:text-white">
                Disconnect
              </button>
            </form>
          ) : null}
        </div>
      </section>

      <p className="text-xs text-slate-400">
        Emulation: this page records the connection without calling Azure. The roles, the template and the commands are the real
        ones a customer uses.
      </p>

      <Step number={1} title="What we ask for: three read only roles, nothing that writes">
        <div className="grid gap-3 md:grid-cols-3">
          {REQUIRED_ROLES.map((role) => (
            <div key={role.definitionId} className="rounded-xl border border-white/10 bg-navy-900/40 px-4 py-3">
              <p className="text-sm font-medium text-white">{role.name}</p>
              <p className="mt-1 text-xs text-slate-400">{role.purpose}</p>
              <p className="mt-2 font-mono text-[10px] text-slate-500">{role.definitionId}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-400">
          The product never asks for Contributor or Owner and never changes anything in your subscription. Recommendations are
          applied by your team.
        </p>
      </Step>

      <Step number={2} title="Delegate access with Azure Lighthouse">
        <p className="mb-4 text-sm text-slate-300">
          Save the template below as <span className="font-mono text-xs">finops-lighthouse.json</span> and deploy it on your
          subscription. The delegation appears under <em>Service providers</em> in your Azure portal, where you can review and
          remove it at any time.
        </p>
        {provider.placeholder ? (
          <p className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs text-amber-100">
            Provider identity is a placeholder. Set FINOPS_PROVIDER_TENANT_ID and FINOPS_PROVIDER_PRINCIPAL_ID in the environment
            so the template carries your real tenant and service principal.
          </p>
        ) : null}
        <div className="space-y-3">
          <CopyBlock title="Lighthouse template" filename="finops-lighthouse.json" text={template} />
          <CopyBlock title="Deploy with Azure CLI" text={deployCommand(subscription)} />
        </div>
      </Step>

      <Step number={3} title="Verify the connection and know how to revoke it">
        <div className="space-y-4">
          <ConnectForm />
          <CopyBlock title="Revoke from your side, whenever you want" text={revokeCommand(subscription)} />
          <p className="text-xs text-slate-400">
            Revoking removes every permission at once. No action on our side is required, and nothing you delete depends on us.
          </p>
        </div>
      </Step>
    </div>
  );
}
