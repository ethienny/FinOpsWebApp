import type { sizing as en } from "../en/sizing";
import type { Widen } from "../widen";

export const sizing: Widen<typeof en> = {
  profileNote: "O perfil é obrigatório e de seleção única. A economia conservadora oficial nunca vem da soma de todos os perfis.",
  profiles: {
    Conservative: "Conservador",
    Moderate: "Moderado",
    Aggressive: "Agressivo",
  },
  kpi: {
    selectedProfileSavings: "Economia do Perfil Selecionado",
    officialConservativeSavings: "Economia Conservadora Oficial",
    officialConservativeSavingsHint: "OfficialConservativeSavings, recursos únicos",
    resourcesWithSizing: "Recursos com Sizing",
    averagePerformanceRisk: "Risco Médio de Performance",
    averagePerformanceRiskHint: "Pontuação {score} (Baixo=1 Médio=2 Alto=3)",
  },
  charts: {
    savingsByServiceType: "Economia por Tipo de Serviço",
    riskDistribution: "Distribuição de Risco",
    targetProfileDistribution: { title: "Distribuição do Perfil Alvo", subtitle: "Contagem de linhas em todos os perfis" },
    currentVsTargetVcpu: "vCPU Atual vs Alvo",
    currentVsTargetMemory: "Memória Atual vs Alvo (GB)",
  },
  recommendationsHeading: "Recomendações de sizing — perfil {profile}",
  table: {
    resource: "Recurso",
    service: "Serviço",
    currentSku: "SKU Atual",
    currentVcpu: "vCPU Atual",
    currentMemory: "Memória Atual",
    targetSku: "SKU Alvo",
    targetVcpu: "vCPU Alvo",
    targetMemory: "Memória Alvo",
    projectedPeak: "Pico Projetado",
    monthlySavings: "Economia Mensal",
    performanceRisk: "Risco de Performance",
  },
};
