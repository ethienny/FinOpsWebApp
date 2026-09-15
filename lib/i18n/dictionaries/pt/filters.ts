import type { filters as en } from "../en/filters";
import type { Widen } from "../widen";

export const filters: Widen<typeof en> = {
  fields: {
    tenant: "Tenant",
    subscription: "Assinatura",
    serviceType: "Tipo de Serviço",
    priority: "Prioridade",
    owner: "Responsável",
    environment: "Ambiente",
    costCenter: "Centro de Custo",
    service: "Serviço",
    routingSource: "Origem do Roteamento",
    attribution: "Atribuição",
  },
  allOption: "Todos",
  clearFilters: "Limpar Filtros",
  noGlobalFilters: "Nenhum filtro global aplicado",
  wholeReportedWeek: "Semana completa do relatório",
};
