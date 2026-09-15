-- ============================================================================
-- Cost Anomalies: Azure SQL Database schema
-- Mirrors the four tables lib/anomalies/store.ts reads in sql mode (schema
-- configurable through ANOMALY_SQL_SCHEMA, default dbo): the AnomalyHistory
-- partition and the WeeklyReport partition (coverage and stats rows) of Azure
-- Table Storage, and the subscription_contacts table published by the data
-- team. Table and column names are lowercase snake_case on purpose: the store
-- runs SELECT * and maps the fields by these exact names.
--
-- Safe to reapply: each CREATE TABLE only runs when the object does not exist.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- dbo.anomaly_history: one row per anomaly alert notification
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
        attribution_status    NVARCHAR(50) NULL,
        resource_id           NVARCHAR(400) NULL,
        resource_name         NVARCHAR(MAX) NULL,
        service_type          NVARCHAR(MAX) NULL,
        resource_group        NVARCHAR(MAX) NULL
    );
    CREATE INDEX IX_anomaly_history_subscription_id ON dbo.anomaly_history (subscription_id);
    CREATE INDEX IX_anomaly_history_notified_at ON dbo.anomaly_history (notified_at);
END

-- Resource behind the alert. Databases created before these columns existed
-- get them here without recreating the table.
IF OBJECT_ID('dbo.anomaly_history', 'U') IS NOT NULL AND COL_LENGTH('dbo.anomaly_history', 'resource_id') IS NULL
BEGIN
    ALTER TABLE dbo.anomaly_history ADD
        resource_id     NVARCHAR(400) NULL,
        resource_name   NVARCHAR(MAX) NULL,
        service_type    NVARCHAR(MAX) NULL,
        resource_group  NVARCHAR(MAX) NULL;
END

-- ----------------------------------------------------------------------------
-- dbo.weekly_report_coverage: result of the coverage runbook, one row per week
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
-- dbo.weekly_report_stats: result of the stats runbook, one row per week. List
-- columns keep the same JSON the aggregator runbook publishes.
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
-- dbo.subscription_contacts: rows pushed by the data team, one per
-- subscription and application
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
