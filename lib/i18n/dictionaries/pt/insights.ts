import type { insights as en } from "../en/insights";
import type { Widen } from "../widen";

export const insights: Widen<typeof en> = {
  costOfInaction: {
    heading: "Custo de Não Agir",
    description:
      "Há quanto tempo as recomendações atuais estão abertas ao longo das execuções completas do engine, e a economia PRECIFICADA já perdida enquanto esperavam.",
  },
  kpi: {
    missedSavingsToDate: "Economia Perdida até Hoje",
    missedSavingsHint: "Economia PRECIFICADA acumulada desde a primeira detecção",
    persistentRecommendations: "Recomendações Persistentes",
    persistentRecommendationsHint: "Mesma recomendação por 5 ou mais execuções",
    averageAge: "Idade Média",
    runsUnit: "execuções",
    averageAgeHint: "Entre {count} recomendações acionáveis",
    newThisRun: "Novas Nesta Execução",
    newThisRunHint: "Recomendações detectadas pela primeira vez na última execução",
  },
  quickWins: {
    heading: "Quick Wins",
    description:
      "Ações PRECIFICADAS classificadas por valor e segurança de execução: confiança, risco de performance, cobertura de métricas e se a ação é destrutiva.",
    valueVsRisk: { title: "Valor vs Risco de Execução", subtitle: "Quick wins ficam no canto superior esquerdo" },
    validatedSavingsByAge: {
      title: "Economia Validada por Idade",
      subtitle: "Economia PRECIFICADA das recomendações abertas; as mais antigas merecem atenção primeiro",
    },
    top10Heading: "Top 10 Quick Wins",
  },
  table: {
    resource: "Recurso",
    service: "Serviço",
    action: "Ação",
    savings: "Economia",
    score: "Pontuação",
    risk: "Risco",
    age: "Idade",
  },
};
