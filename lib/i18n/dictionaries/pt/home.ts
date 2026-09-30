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
    idleCostCeiling: { label: "Custo Ocioso (Teto)", hint: "Custo total dos recursos ociosos em análise" },
    probableSavingsFloor: { label: "Economia Provável (Piso)", hint: "Economia se o responsável mantiver o recurso num tamanho menor" },
    licenseSavings: { label: "Economia de Licença (Hybrid Benefit)", hint: "O que ativar o Hybrid Benefit economizaria", link: "Abrir Hybrid Benefit" },
    commitmentSavings1Year: { label: "Economia de Commitment, 1 Ano", hint: "Figura oficial - nunca somar com a alternativa de 3 anos" },
    commitmentSavings3Years: { label: "Economia de Commitment, 3 Anos", hint: "Alternativa à figura de 1 ano, nunca as duas juntas" },
    redundancySavings: { label: "Economia de Redundância (Backup)", hint: "Cofres não-produtivos migrados de geo para redundância local" },
  },
  keepThemApart:
    "Mantenha-os separados. Teto e piso são duas leituras dos mesmos recursos ociosos. Nenhum dos dois é somado à Economia Validada ou à Oportunidade Estimada, nem somados entre si. Economia de Licença, Economia de Commitment e Economia de Redundância são alavancas separadas, cada uma em seu próprio card. Economia de Commitment de 1 ano e 3 anos são duas alternativas para o mesmo compute: mostre uma ou outra, nunca a soma. Cash agora e commitment liberado são duas partes da Economia Validada e somam o total dela.",
  charts: {
    costVsSavingsTitle: "Custo vs Economia por Tipo de Serviço",
    costVsSavingsSubtitle: "Custo da última execução vs economia PRECIFICADA",
    savingsByActionTitle: "Economia por Categoria de Ação",
    cashVsCommitmentTitle: "Economia Validada, Cash vs Commitment",
    cashVsCommitmentSubtitle: "Economia PRECIFICADA por serviço, dividida por como o dinheiro chega",
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
