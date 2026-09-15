// App shell chrome: brand, sidebar navigation and the title/subtitle shown
// above each page. Route keys mirror the paths used in AppShell's PAGE_COPY.

export const shell = {
  brand: {
    name: "FinOps Insight Engine",
    tagline: "Cloud Cost Intelligence & Optimization",
  },
  skipLink: "Skip to content",
  eyebrow: "CLOUD INTELLIGENCE / FINOPS",
  nav: {
    ariaLabel: "Main navigation",
    groups: {
      overview: "OVERVIEW",
      optimize: "OPTIMIZE",
      monitor: "MONITOR",
      operations: "OPERATIONS",
    },
    items: {
      executive: "Executive",
      whatChanged: "What Changed",
      showback: "Showback & Chargeback",
      opportunities: "Opportunities",
      insights: "Insights",
      sizing: "Sizing",
      tracking: "Tracking",
      costAnomalies: "Cost Anomalies",
      resources: "Resources",
      engineHealth: "Engine Health",
      runHistory: "Run History",
      connectAzure: "Connect Azure",
    },
    lockedTitle: "Not in current plan",
  },
  sidebar: {
    engineVersion: "Engine Version",
    latestPublishedRun: "Latest Published Run",
    publicationStatus: "Publication Status",
    dataQualityStatus: "Data Quality Status",
  },
  mobileMenu: {
    open: "Open navigation",
    close: "Close",
    closeMenu: "Close menu",
    navigationAria: "Navigation",
  },
  languageSwitcher: {
    aria: "Language",
  },
  scope: {
    alertScope: "ALERT SCOPE",
    analysisScope: "ANALYSIS SCOPE",
  },
  pages: {
    home: {
      title: "Executive Overview",
      subtitle: "C-level view of cloud cost, optimization and validated savings opportunities.",
    },
    showback: {
      title: "Showback & Chargeback",
      subtitle: "Cost allocation and financial accountability across owners, applications and cost centers.",
    },
    opportunities: {
      title: "Opportunities",
      subtitle: "Actionable optimization recommendations with priced and heuristic savings kept separate.",
    },
    tracking: {
      title: "Recommendation Tracking",
      subtitle: "What the teams decided on each recommendation, who owns it and the savings under way or delivered.",
    },
    connect: {
      title: "Connect your Azure",
      subtitle: "Three read only roles, one template, and you can revoke it from your own portal at any time.",
    },
    report: {
      title: "Executive Report",
      subtitle: "Printable summary of cost, validated savings, priorities and data quality for the current scope.",
    },
    changes: {
      title: "What Changed",
      subtitle: "Recommendations that appeared, were resolved or moved since the previous complete run.",
    },
    anomalies: {
      title: "Cost Anomalies",
      subtitle:
        "Weekly report of the anomaly alerting: who was notified, what was suppressed, and where coverage or ownership is missing.",
    },
    insights: {
      title: "Insights",
      subtitle: "What it costs to wait and which actions are worth taking first.",
    },
    sizing: {
      title: "Sizing",
      subtitle: "Rightsizing analysis by conservative, moderate and aggressive target profiles.",
    },
    resources: {
      title: "Resources",
      subtitle: "Complete analyzed inventory with drill-through into technical evidence.",
    },
    engineHealth: {
      title: "Engine Health",
      subtitle: "Execution health, publication state and data quality of the FinOps engine.",
    },
    runHistory: {
      title: "Run History & Trends",
      subtitle: "Compare engine executions and observe savings and quality evolution over time.",
    },
    resourceDetail: {
      title: "Resource Detail",
      subtitle: "Deep technical analysis of a specific cloud resource.",
    },
    fallback: {
      title: "FinOps Insight Engine",
      subtitle: "Cloud Cost Intelligence & Optimization",
    },
  },
} as const;
