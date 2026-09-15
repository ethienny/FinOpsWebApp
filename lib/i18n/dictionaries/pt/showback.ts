import type { showback as en } from "../en/showback";
import type { Widen } from "../widen";

export const showback: Widen<typeof en> = {
  kpis: {
    totalCost: "Custo Total",
    allocatedCost: "Custo Alocado",
    allocatedHint: "Com responsável ou centro de custo",
    unallocatedCost: "Custo Não Alocado",
    unallocatedHint: "Sem metadados de responsabilidade",
    totalResources: "Total de Recursos",
  },
  charts: {
    costByOwner: "Alocação de Custo por Responsável",
    savingsByOwner: "Economia Validada por Responsável",
    savingsByOwnerSubtitle: "Apenas economia PRECIFICADA",
    costByEnvironment: "Custo por Ambiente",
    costByCostCenter: "Custo por Centro de Custo",
    costByApplication: "Custo por Aplicação",
    costBySubscription: "Custo por Assinatura",
    costByTenant: "Custo por Tenant",
  },
  tableHeading: "Tabela de alocação",
  columns: {
    owner: "Responsável",
    costCenter: "Centro de Custo",
    application: "Aplicação",
    environment: "Ambiente",
    monthlyCost: "Custo Mensal",
    resourceCount: "Quantidade de Recursos",
    percentOfTotal: "% do Total",
  },
};
