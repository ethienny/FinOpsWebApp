import type { runHistory as en } from "../en/runHistory";
import type { Widen } from "../widen";

export const runHistory: Widen<typeof en> = {
  kpi: {
    totalRuns: "Total de Execuções",
    publishedRuns: "Execuções Publicadas",
    avgMetricAvailability: "Disponibilidade Média de Métricas",
    avgCostCoverage: "Cobertura Média de Custo",
  },
  charts: {
    savingsEvolutionTitle: "Evolução da Economia entre Execuções",
    savingsEvolutionSubtitle: "PRICED e HEURISTIC mantidos como séries separadas",
    metricAvailabilityTrend: "Tendência de Disponibilidade de Métricas",
    costCoverageTrend: "Tendência de Cobertura de Custo",
    publishedVsNotPublished: "Execuções Publicadas vs Não Publicadas",
    runDurationTrend: "Tendência de Duração da Execução (minutos)",
    published: "Publicadas",
    notPublished: "Não publicadas",
  },
  comparison: {
    heading: "Comparação de execuções",
    tableHeading: "Tabela de comparação de execuções",
    runA: "Execução A",
    runB: "Execução B",
    vs: "vs",
    select: "Selecionar",
    selectToCompare: "Selecione uma execução para comparar.",
    rowsProduced: "Linhas produzidas",
    metricAvailability: "Disponibilidade de métricas",
    costCoverage: "Cobertura de custo",
    pricedSavingsRows: "Linhas de economia precificada",
    heuristicSavingsRows: "Linhas de economia heurística",
    dataQuality: "Qualidade de dados",
    publication: "Publicação",
  },
  table: {
    duration: "Duração",
  },
};
