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
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionary";

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
  const dict = getDictionary(await getLocale());
  const t = dict.connect;
  const [connection, provider] = await Promise.all([getConnection(), getProviderIdentity()]);
  const template = JSON.stringify(buildLighthouseTemplate(provider), null, 2);
  const subscription = connection?.subscriptionId ?? "<your-subscription-id>";

  return (
    <div className="space-y-6">
      <section className="card-surface flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-cyan-300" />
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-cyan-300">{t.azureConnection}</p>
            {connection ? (
              <>
                <p className="mt-1 text-sm text-white">
                  {connection.displayName} <span className="font-mono text-xs text-slate-400">{connection.subscriptionId}</span>
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {t.connectedPrefix} {formatDate(connection.connectedAt)} {t.via}{" "}
                  {connection.method === "lighthouse" ? t.methodLighthouse : t.methodAppRegistration} {t.by} {connection.connectedBy}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-slate-300">{t.notConnectedYet}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge value={connection ? "CONNECTED" : "NOT CONNECTED"} />
          {connection ? (
            <form action={disconnectAzure}>
              <button type="submit" className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 hover:text-white">
                {t.disconnect}
              </button>
            </form>
          ) : null}
        </div>
      </section>

      <p className="text-xs text-slate-400">{t.emulationNote}</p>

      <Step number={1} title={t.step1.title}>
        <div className="grid gap-3 md:grid-cols-3">
          {REQUIRED_ROLES.map((role) => (
            <div key={role.definitionId} className="rounded-xl border border-white/10 bg-navy-900/40 px-4 py-3">
              <p className="text-sm font-medium text-white">{role.name}</p>
              <p className="mt-1 text-xs text-slate-400">
                {(t.rolePurposes as Record<string, string>)[role.name] ?? role.purpose}
              </p>
              <p className="mt-2 font-mono text-[10px] text-slate-500">{role.definitionId}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-400">{t.step1.footer}</p>
      </Step>

      <Step number={2} title={t.step2.title}>
        <p className="mb-4 text-sm text-slate-300">
          {t.step2.introBeforeFile} <span className="font-mono text-xs">finops-lighthouse.json</span> {t.step2.introAfterFile}{" "}
          <em>{t.step2.servicesProviders}</em> {t.step2.introEnd}
        </p>
        {provider.placeholder ? (
          <p className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs text-amber-100">
            {t.step2.placeholderWarning}
          </p>
        ) : null}
        <div className="space-y-3">
          <CopyBlock title={t.step2.lighthouseTemplate} filename="finops-lighthouse.json" text={template} />
          <CopyBlock title={t.step2.deployWithCli} text={deployCommand(subscription)} />
        </div>
      </Step>

      <Step number={3} title={t.step3.title}>
        <div className="space-y-4">
          <ConnectForm />
          <CopyBlock title={t.step3.revokeTitle} text={revokeCommand(subscription)} />
          <p className="text-xs text-slate-400">{t.step3.revokeNote}</p>
        </div>
      </Step>
    </div>
  );
}
