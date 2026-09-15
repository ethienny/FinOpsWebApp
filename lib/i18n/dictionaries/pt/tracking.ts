import type { tracking as en } from "../en/tracking";
import type { Widen } from "../widen";

export const tracking: Widen<typeof en> = {
  kpi: {
    savingsInProgress: "Economia em Andamento",
    savingsInProgressHint: "Somente PRECIFICADA, aceita ou em andamento",
    realizedSavings: "Economia Realizada",
    realizedSavingsHint: "Somente PRECIFICADA, marcada como concluída",
    recommendationsDecided: "Recomendações Decididas",
    decidedHint: "{count} ainda em aberto neste escopo",
    dismissed: "Descartadas",
    dismissedHint: "Excluídas da economia acompanhada",
  },
  charts: {
    byStatusTitle: "Decisões por Status",
    byStatusSubtitle: "Recomendações com decisão diferente de aberto",
    byOwnerTitle: "Economia Acompanhada por Responsável",
    byOwnerSubtitle: "Economia PRECIFICADA aceita, em andamento ou concluída",
  },
  decidedRecommendations: "Recomendações decididas",
  empty: {
    title: "Nenhuma decisão registrada neste escopo ainda.",
    detail: "Abra um recurso em Oportunidades e registre o que a equipe decidiu sobre sua recomendação.",
  },
  table: {
    resource: "Recurso",
    decision: "Decisão",
    assignedTo: "Responsável",
    service: "Serviço",
    subscription: "Assinatura",
    recommendation: "Recomendação",
    monthlySavings: "Economia mensal",
    reliability: "Confiabilidade",
    run: "Execução",
    updated: "Atualizado",
  },
};
