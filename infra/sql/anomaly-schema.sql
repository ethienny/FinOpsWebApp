-- ============================================================================
-- Cost Anomalies - Schema Azure SQL Database
-- Espelha as 4 tabelas lidas por lib/anomalies/store.ts em modo sql
-- (schema configurável via ANOMALY_SQL_SCHEMA, padrão dbo): a partição
-- AnomalyHistory, a partição WeeklyReport (linhas de coverage e stats) do
-- Azure Table Storage, e a tabela subscription_contacts publicada pelo time
-- de dados. Nomes de tabela e coluna são minúsculos/snake_case de propósito
-- — loadFromSql faz `SELECT *` e o mapeamento em lib/anomalies/store.ts
-- acessa os campos por esse nome exato.
--
-- Pode ser reaplicado com segurança: cada CREATE TABLE só roda se o objeto
-- ainda não existir.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- dbo.anomaly_history - uma linha por alerta de anomalia enviado
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.anomaly_history', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.anomaly_history (
        partition_key        NVARCHAR(100) NULL,
        row_key               NVARCHAR(300) NULL,
        subscription_id       NVARCHAR(200) NULL,
        subscription_name     NVARCHAR(MAX) NULL,
        detection_date        DATE NULL,
        delta_percent         FLOAT NULL,
        total_cost            FLOAT NULL,
        notified_at           DATETIME2 NULL,
        send_status           NVARCHAR(50) NULL,
        routing_source        NVARCHAR(50) NULL,
        tag_status            NVARCHAR(50) NULL,
        contacts_status       NVARCHAR(50) NULL,
        contact_source        NVARCHAR(MAX) NULL,
        recipient_overlap     INT NULL,
        window_from           DATE NULL,
        window_to             DATE NULL,
        window_source         NVARCHAR(50) NULL,
        observed_change_usd   FLOAT NULL,
        attribution_status    NVARCHAR(50) NULL
    );
    CREATE INDEX IX_anomaly_history_subscription_id ON dbo.anomaly_history (subscription_id);
    CREATE INDEX IX_anomaly_history_notified_at ON dbo.anomaly_history (notified_at);
END

-- ----------------------------------------------------------------------------
-- dbo.weekly_report_coverage - resultado do runbook de coverage, uma linha
-- por semana
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.weekly_report_coverage', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.weekly_report_coverage (
        partition_key    NVARCHAR(100) NULL,
        row_key          NVARCHAR(100) NULL,
        generated_at     DATETIME2 NULL,
        covered          INT NULL,
        missing          INT NULL,
        skipped          INT NULL,
        failed           INT NULL,
        total_checked    INT NULL,
        tfe_workspace    NVARCHAR(MAX) NULL,
        alert_name       NVARCHAR(MAX) NULL,
        missing_subs     NVARCHAR(MAX) NULL -- JSON: [{ Name, Id }]
    );
END

-- ----------------------------------------------------------------------------
-- dbo.weekly_report_stats - resultado do runbook de stats, uma linha por
-- semana. Colunas de lista guardam o mesmo JSON que o runbook agregador
-- publica.
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.weekly_report_stats', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.weekly_report_stats (
        partition_key                     NVARCHAR(100) NULL,
        row_key                           NVARCHAR(100) NULL,
        generated_at                      DATETIME2 NULL,
        total_runs                        INT NULL,
        succeeded_runs                    INT NULL,
        failed_runs                       INT NULL,
        total_notified                    INT NULL,
        total_suppressed                  INT NULL,
        suppression_rate                  FLOAT NULL,
        prev_total_runs                   INT NULL,
        prev_notified                     INT NULL,
        prev_suppressed                   INT NULL,
        week_label                        NVARCHAR(100) NULL,
        prev_week_label                   NVARCHAR(100) NULL,
        top_subs                          NVARCHAR(MAX) NULL, -- JSON: [{ Name, AlertCount, ObservedIncreaseUsd, NotReconciled }]
        top_subs_observed_increase_total  FLOAT NULL,
        top_subs_not_reconciled           INT NULL,
        top_subs_beyond_cap               INT NULL,
        routing_tag                       INT NULL,
        routing_missing_tag               INT NULL,
        routing_invalid_tag               INT NULL,
        routing_lookup_failed             INT NULL,
        routing_tag_and_contacts          INT NULL,
        routing_tag_only                  INT NULL,
        routing_contacts_only             INT NULL,
        routing_none                      INT NULL,
        routing_legacy                    INT NULL,
        routing_overlap_alerts            INT NULL,
        contact_sources                   NVARCHAR(MAX) NULL, -- JSON: [{ Source, Alerts }]
        fallback_subs_total               INT NULL,
        fallback_subs                     NVARCHAR(MAX) NULL  -- JSON: [{ Name, Reason, AlertCount }]
    );
END

-- ----------------------------------------------------------------------------
-- dbo.subscription_contacts - linhas pushadas pelo time de dados, uma por
-- assinatura/aplicação
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.subscription_contacts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.subscription_contacts (
        partition_key                 NVARCHAR(200) NULL,
        row_key                       NVARCHAR(100) NULL,
        ts                            DATETIME2 NULL,
        primary_contact                NVARCHAR(MAX) NULL,
        application_support_contact    NVARCHAR(MAX) NULL,
        architecture_contact           NVARCHAR(MAX) NULL,
        source_system                  NVARCHAR(MAX) NULL
    );
    CREATE INDEX IX_subscription_contacts_partition_key ON dbo.subscription_contacts (partition_key);
END
