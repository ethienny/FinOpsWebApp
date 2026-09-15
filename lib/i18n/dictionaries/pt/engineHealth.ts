import type { engineHealth as en } from "../en/engineHealth";
import type { Widen } from "../widen";

export const engineHealth: Widen<typeof en> = {
  kpi: {
    latestRun: "Última Execução",
    engineVersion: "Versão do Engine",
    runDuration: "Duração da Execução",
    runStatus: "Status da Execução",
    metricAvailability: "Disponibilidade de Métricas",
    metricCompleteness: "Completude de Métricas",
    costAvailability: "Disponibilidade de Custo",
    fullCostCoverage: "Cobertura Total de Custo",
  },
  processingMetrics: {
    heading: "Métricas de processamento da execução",
    rowsProduced: "Linhas Produzidas",
    rowsPersisted: "Linhas Persistidas",
    rowsFailed: "Linhas com Falha",
    tenantsExpected: "Tenants Esperados",
    tenantsSucceeded: "Tenants com Sucesso",
    tenantsFailed: "Tenants com Falha",
    pricedSavingsRows: "Linhas de Economia Precificada",
    heuristicSavingsRows: "Linhas de Economia Heurística",
    unpricedSavingsRows: "Linhas de Economia Não Precificada",
  },
  degradedServices: {
    heading: "Serviços degradados",
    impact: "Impacto: qualidade degradada · Status: DEGRADED",
    none: "Nenhum serviço degradado relatado na última execução.",
  },
  runHistorySection: {
    heading: "Histórico de execuções",
  },
  table: {
    started: "Iniciado",
    finished: "Concluído",
  },
};
