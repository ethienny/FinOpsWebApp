import type { shell as en } from "../en/shell";
import type { Widen } from "../widen";

export const shell: Widen<typeof en> = {
  brand: {
    name: "FinOps Insight Engine",
    tagline: "Inteligência de Custos em Nuvem e Otimização",
  },
  skipLink: "Pular para o conteúdo",
  eyebrow: "INTELIGÊNCIA DE NUVEM / FINOPS",
  nav: {
    ariaLabel: "Navegação principal",
    groups: {
      overview: "VISÃO GERAL",
      optimize: "OTIMIZAR",
      monitor: "MONITORAR",
      operations: "OPERAÇÕES",
    },
    items: {
      executive: "Executivo",
      whatChanged: "O que Mudou",
      showback: "Showback e Chargeback",
      opportunities: "Oportunidades",
      insights: "Insights",
      sizing: "Sizing",
      tracking: "Acompanhamento",
      costAnomalies: "Anomalias de Custo",
      resources: "Recursos",
      engineHealth: "Saúde do Engine",
      runHistory: "Histórico de Execuções",
      connectAzure: "Conectar Azure",
    },
    lockedTitle: "Fora do plano atual",
  },
  sidebar: {
    engineVersion: "Versão do Engine",
    latestPublishedRun: "Última Execução Publicada",
    publicationStatus: "Status de Publicação",
    dataQualityStatus: "Status de Qualidade dos Dados",
  },
  mobileMenu: {
    open: "Abrir navegação",
    close: "Fechar",
    closeMenu: "Fechar menu",
    navigationAria: "Navegação",
  },
  languageSwitcher: {
    aria: "Idioma",
  },
  scope: {
    alertScope: "ESCOPO DO ALERTA",
    analysisScope: "ESCOPO DA ANÁLISE",
  },
  pages: {
    home: {
      title: "Visão Executiva",
      subtitle: "Visão de nível executivo do custo em nuvem, otimização e oportunidades de economia validadas.",
    },
    showback: {
      title: "Showback e Chargeback",
      subtitle: "Alocação de custo e responsabilidade financeira entre responsáveis, aplicações e centros de custo.",
    },
    opportunities: {
      title: "Oportunidades",
      subtitle: "Recomendações de otimização acionáveis, com economias precificadas e heurísticas mantidas separadas.",
    },
    tracking: {
      title: "Acompanhamento de Recomendações",
      subtitle: "O que as equipes decidiram em cada recomendação, quem é o responsável e as economias em andamento ou entregues.",
    },
    connect: {
      title: "Conecte seu Azure",
      subtitle: "Três papéis somente leitura, um template, e você pode revogar a qualquer momento pelo seu próprio portal.",
    },
    report: {
      title: "Relatório Executivo",
      subtitle: "Resumo imprimível de custo, economias validadas, prioridades e qualidade de dados para o escopo atual.",
    },
    changes: {
      title: "O que Mudou",
      subtitle: "Recomendações que surgiram, foram resolvidas ou mudaram desde a execução completa anterior.",
    },
    anomalies: {
      title: "Anomalias de Custo",
      subtitle:
        "Relatório semanal dos alertas de anomalia: quem foi notificado, o que foi suprimido e onde falta cobertura ou responsável.",
    },
    insights: {
      title: "Insights",
      subtitle: "Quanto custa esperar e quais ações valem a pena priorizar.",
    },
    sizing: {
      title: "Sizing",
      subtitle: "Análise de rightsizing pelos perfis conservador, moderado e agressivo.",
    },
    resources: {
      title: "Recursos",
      subtitle: "Inventário completo analisado, com detalhamento até a evidência técnica.",
    },
    engineHealth: {
      title: "Saúde do Engine",
      subtitle: "Saúde de execução, estado de publicação e qualidade de dados do engine FinOps.",
    },
    runHistory: {
      title: "Histórico de Execuções e Tendências",
      subtitle: "Compare execuções do engine e observe a evolução da economia e da qualidade ao longo do tempo.",
    },
    resourceDetail: {
      title: "Detalhe do Recurso",
      subtitle: "Análise técnica aprofundada de um recurso de nuvem específico.",
    },
    fallback: {
      title: "FinOps Insight Engine",
      subtitle: "Inteligência de Custos em Nuvem e Otimização",
    },
  },
};
