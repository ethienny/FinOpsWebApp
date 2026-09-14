-- ============================================================================
-- Cost Alert Report - Schema Azure SQL Database
-- Espelha as fontes do Function App de detecção de anomalias de custo:
-- a partição AnomalyHistory e a partição WeeklyReport (linhas de coverage e
-- stats) do Azure Table Storage, e a tabela SubscriptionContacts publicada
-- pelo time de dados.
--
-- Ao contrário de infra/sql/schema.sql (rodado uma única vez num banco
-- recém-provisionado), este arquivo pode ser reaplicado com segurança: cada
-- CREATE TABLE só roda se o objeto ainda não existir.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- dbo.CostAlertAnomalyHistory - uma linha por alerta de anomalia enviado
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.CostAlertAnomalyHistory', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CostAlertAnomalyHistory (
        PartitionKey        NVARCHAR(100) NULL,
        RowKey               NVARCHAR(300) NULL,
        SubscriptionId       NVARCHAR(200) NULL,
        SubscriptionName     NVARCHAR(MAX) NULL,
        DetectionDate        DATE NULL,
        DeltaPercent         FLOAT NULL,
        TotalCost            FLOAT NULL,
        NotifiedAt           DATETIME2 NULL,
        SendStatus           NVARCHAR(50) NULL,
        RoutingSource        NVARCHAR(50) NULL,
        TagStatus            NVARCHAR(50) NULL,
        ContactsStatus       NVARCHAR(50) NULL,
        ContactSource        NVARCHAR(MAX) NULL,
        RecipientOverlap     INT NULL,
        WindowFrom           DATE NULL,
        WindowTo             DATE NULL,
        WindowSource         NVARCHAR(50) NULL,
        ObservedChangeUsd    FLOAT NULL,
        AttributionStatus    NVARCHAR(50) NULL
    );
    CREATE INDEX IX_CostAlertAnomalyHistory_SubscriptionId ON dbo.CostAlertAnomalyHistory (SubscriptionId);
    CREATE INDEX IX_CostAlertAnomalyHistory_NotifiedAt ON dbo.CostAlertAnomalyHistory (NotifiedAt);
END

-- ----------------------------------------------------------------------------
-- dbo.CostAlertWeeklyReportCoverage - resultado do runbook de coverage, uma
-- linha por semana
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.CostAlertWeeklyReportCoverage', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CostAlertWeeklyReportCoverage (
        PartitionKey    NVARCHAR(100) NULL,
        RowKey          NVARCHAR(100) NULL,
        GeneratedAt     DATETIME2 NULL,
        Covered         INT NULL,
        Missing         INT NULL,
        Skipped         INT NULL,
        Failed          INT NULL,
        TotalChecked    INT NULL,
        TfeWorkspace    NVARCHAR(MAX) NULL,
        AlertName       NVARCHAR(MAX) NULL,
        MissingSubs     NVARCHAR(MAX) NULL -- JSON: [{ Name, Id }]
    );
END

-- ----------------------------------------------------------------------------
-- dbo.CostAlertWeeklyReportStats - resultado do runbook de stats, uma linha
-- por semana. Colunas de lista guardam o mesmo JSON que o runbook agregador
-- publica.
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.CostAlertWeeklyReportStats', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CostAlertWeeklyReportStats (
        PartitionKey                     NVARCHAR(100) NULL,
        RowKey                           NVARCHAR(100) NULL,
        GeneratedAt                      DATETIME2 NULL,
        TotalRuns                        INT NULL,
        SucceededRuns                    INT NULL,
        FailedRuns                       INT NULL,
        TotalNotified                    INT NULL,
        TotalSuppressed                  INT NULL,
        SuppressionRate                  FLOAT NULL,
        PrevTotalRuns                    INT NULL,
        PrevNotified                     INT NULL,
        PrevSuppressed                   INT NULL,
        WeekLabel                        NVARCHAR(100) NULL,
        PrevWeekLabel                    NVARCHAR(100) NULL,
        TopSubs                          NVARCHAR(MAX) NULL, -- JSON: [{ Name, AlertCount, ObservedIncreaseUsd, NotReconciled }]
        TopSubsObservedIncreaseTotal     FLOAT NULL,
        TopSubsNotReconciled             INT NULL,
        TopSubsBeyondCap                 INT NULL,
        RoutingTag                       INT NULL,
        RoutingMissingTag                INT NULL,
        RoutingInvalidTag                INT NULL,
        RoutingLookupFailed              INT NULL,
        RoutingTagAndContacts            INT NULL,
        RoutingTagOnly                   INT NULL,
        RoutingContactsOnly              INT NULL,
        RoutingNone                      INT NULL,
        RoutingLegacy                    INT NULL,
        RoutingOverlapAlerts             INT NULL,
        ContactSources                   NVARCHAR(MAX) NULL, -- JSON: [{ Source, Alerts }]
        FallbackSubsTotal                INT NULL,
        FallbackSubs                     NVARCHAR(MAX) NULL  -- JSON: [{ Name, Reason, AlertCount }]
    );
END

-- ----------------------------------------------------------------------------
-- dbo.CostAlertSubscriptionContacts - linhas pushadas pelo time de dados, uma
-- por assinatura/aplicação
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.CostAlertSubscriptionContacts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CostAlertSubscriptionContacts (
        PartitionKey                 NVARCHAR(200) NULL,
        RowKey                       NVARCHAR(100) NULL,
        Ts                           DATETIME2 NULL,
        PrimaryContact               NVARCHAR(MAX) NULL,
        ApplicationSupportContact    NVARCHAR(MAX) NULL,
        ArchitectureContact          NVARCHAR(MAX) NULL,
        SourceSystem                 NVARCHAR(MAX) NULL
    );
    CREATE INDEX IX_CostAlertSubscriptionContacts_PartitionKey ON dbo.CostAlertSubscriptionContacts (PartitionKey);
END
