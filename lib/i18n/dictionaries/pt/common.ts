import type { common as en } from "../en/common";
import type { Widen } from "../widen";

export const common: Widen<typeof en> = {
  table: {
    searchPlaceholder: "Buscar...",
    filterAriaLabel: "Filtrar {column}",
    allOption: "Todos",
    previous: "Anterior",
    next: "Próximo",
    noRows: "Nenhum registro no escopo atual.",
    rowsCount: "{count} registros",
  },
  kpi: {
    viewDetails: "Ver detalhes",
  },
  badges: {
    decision: {
      done: "Concluído",
      inProgress: "Em andamento",
      accepted: "Aceito",
      dismissed: "Descartado",
      open: "Aberto",
    },
    age: {
      persistent: "Persistente",
      recurring: "Recorrente",
      new: "Novo",
    },
    change: {
      new: "Novo",
      resolved: "Resolvido",
      actionChanged: "Ação alterada",
      reliabilityChanged: "Confiabilidade alterada",
      savingsChanged: "Economia alterada",
    },
    outcome: {
      found: "encontrado",
      reconciled: "reconciliado",
      sent: "enviado",
      valid: "válido",
      owned: "com responsável",
      partial: "parcial",
      missing: "ausente",
      pendingsend: "envio pendente",
      unowned: "sem responsável",
      invalid: "inválido",
      lookup_failed: "falha na busca",
      not_reconciled: "não reconciliado",
      failed: "falhou",
    },
  },
  actions: {
    export: "Exportar",
    print: "Imprimir",
    save: "Salvar",
    cancel: "Cancelar",
  },
};
