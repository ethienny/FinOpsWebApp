import type { home as en } from "../en/home";
import type { Widen } from "../widen";

export const home: Widen<typeof en> = {
  latestRun: {
    label: "Última Execução Publicada",
    engine: "Engine",
    published: "Publicado em",
    sincePreviousRun: "Desde a execução anterior: {new} novas, {resolved} resolvidas",
    executiveReport: "Relatório executivo",
    engineHealth: "Saúde do Engine",
    noPublishedRun: "Nenhuma execução oficial publicada no momento.",
  },
  kpi: {
    monthlyCostAnalyzed: { label: "Custo Mensal Analisado", hint: "SOMA(Custo Mensal) na última execução completa" },
    validatedSavingsPriced: { label: "Economia Validada (PRECIFICADA)", hint: "Nunca combinada com economia heurística" },
    estimatedOpportunityHeuristic: {
      label: "Oportunidade Estimada (HEURÍSTICA)",
      hint: "Apenas direcional, não é economia precificada oficial",
    },
    actionableResources: { label: "Recursos Acionáveis", hint: "CONTAGEM onde IsActionable = true" },
    realizedSavings: { label: "Economia Realizada", hint: "Recomendações PRECIFICADAS marcadas como concluídas", link: "Abrir acompanhamento" },
    savingsInProgress: { label: "Economia em Andamento", hint: "Aceita ou em andamento", link: "Abrir acompanhamento" },
    missedSavingsToDate: {
      label: "Economia Perdida até o Momento",
      hintTemplate: "{count} recomendações abertas há 5 ou mais execuções",
      link: "Abrir insights",
    },
    quickWinsAvailable: {
      label: "Quick Wins Disponíveis",
      hint: "Alto valor, baixo risco de execução, ainda não realizado",
      link: "Abrir insights",
    },
  },
  charts: {
    costVsSavingsTitle: "Custo vs Economia por Tipo de Serviço",
    costVsSavingsSubtitle: "Custo da última execução vs economia PRECIFICADA",
    savingsByActionTitle: "Economia por Categoria de Ação",
  },
  topResources: {
    title: "Top 10 Recursos por Economia Validada",
    allOpportunities: "Todas as oportunidades",
  },
  table: {
    resource: "Recurso",
    service: "Serviço",
    subscription: "Assinatura",
    action: "Ação",
    savings: "Economia",
    priority: "Prioridade",
  },
};
