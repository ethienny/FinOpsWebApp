import type { hybridBenefit as en } from "../en/hybridBenefit";
import type { Widen } from "../widen";

export const hybridBenefit: Widen<typeof en> = {
  title: "Hybrid Benefit",
  subtitle: "Licenças cobradas sem Azure Hybrid Benefit ou Red Hat Cloud Access",
  kpi: {
    licenseCostWithoutBenefit: {
      label: "Custo de Licença Sem o Benefício",
      hint: "Parte do Custo Mensal, já cobrado",
    },
    licenseSavings: {
      label: "Economia de Licença (Hybrid Benefit)",
      hint: "O que ativar o benefício economizaria",
    },
    resourcesWithoutHybridBenefit: {
      label: "Recursos Sem Hybrid Benefit",
      hint: "Licença cobrada sem o benefício",
    },
    resourcesWithHybridBenefit: {
      label: "Recursos Com Hybrid Benefit",
      hint: "Benefício já aplicado, licença zerada",
    },
  },
  charts: {
    byProductTitle: "Economia de Licença por Produto",
    bySubscriptionTitle: "Economia de Licença por Assinatura (Top 15)",
  },
  table: {
    title: "Recursos Sem Hybrid Benefit",
    resource: "Recurso",
    service: "Serviço",
    subscription: "Assinatura",
    licenseProducts: "Produtos de Licença",
    licenseCost: "Custo de Licença",
    licenseSavings: "Economia de Licença",
    action: "Ação",
  },
};
