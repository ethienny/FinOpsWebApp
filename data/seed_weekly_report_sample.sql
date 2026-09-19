-- Seed script with fictitious data for one weekly report cycle.
-- Mirrors the shapes exported from Azure Table Storage to Delta: the
-- AnomalyHistory partition, the WeeklyReport partition (coverage and stats
-- rows) and the SubscriptionContacts table pushed by the data team.
-- Written for Databricks SQL. Drop the USING DELTA clauses to run it on
-- another engine. Every id, name, address and amount below is invented.
--
-- Reported week : Mon 2026-09-07 to Sun 2026-09-13
-- Runbook date  : Mon 2026-09-14 (entity keys anchor to this Monday)

-- ───────────────────────────────────────────────
-- Schema
-- ───────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS finops_anomaly_sample;
USE finops_anomaly_sample;

DROP TABLE IF EXISTS anomaly_history;
DROP TABLE IF EXISTS weekly_report_coverage;
DROP TABLE IF EXISTS weekly_report_stats;
DROP TABLE IF EXISTS subscription_contacts;

-- One row per alert notification, as written by the Function App.
CREATE TABLE anomaly_history (
    partition_key        STRING,
    row_key              STRING,
    subscription_id      STRING,
    subscription_name    STRING,
    detection_date       DATE,
    delta_percent        DOUBLE,
    total_cost           DOUBLE,
    notified_at          TIMESTAMP,
    send_status          STRING,
    routing_source       STRING,
    tag_status           STRING,
    contacts_status      STRING,
    contact_source       STRING,
    recipient_overlap    INT,
    window_from          DATE,
    window_to            DATE,
    window_source        STRING,
    observed_change_usd  DOUBLE,
    attribution_status   STRING
) USING DELTA;

-- Result of the coverage runbook, one row per week.
CREATE TABLE weekly_report_coverage (
    partition_key   STRING,
    row_key         STRING,
    generated_at    TIMESTAMP,
    covered         INT,
    missing         INT,
    skipped         INT,
    failed          INT,
    total_checked   INT,
    tfe_workspace   STRING,
    alert_name      STRING,
    missing_subs    STRING
) USING DELTA;

-- Result of the stats runbook, one row per week. JSON columns keep the
-- same shape the aggregator runbook parses.
CREATE TABLE weekly_report_stats (
    partition_key                    STRING,
    row_key                          STRING,
    generated_at                     TIMESTAMP,
    total_runs                       INT,
    succeeded_runs                   INT,
    failed_runs                      INT,
    total_notified                   INT,
    total_suppressed                 INT,
    suppression_rate                 DOUBLE,
    prev_total_runs                  INT,
    prev_notified                    INT,
    prev_suppressed                  INT,
    week_label                       STRING,
    prev_week_label                  STRING,
    top_subs                         STRING,
    top_subs_observed_increase_total DOUBLE,
    top_subs_not_reconciled          INT,
    top_subs_beyond_cap              INT,
    routing_tag                      INT,
    routing_missing_tag              INT,
    routing_invalid_tag              INT,
    routing_lookup_failed            INT,
    routing_tag_and_contacts         INT,
    routing_tag_only                 INT,
    routing_contacts_only            INT,
    routing_none                     INT,
    routing_legacy                   INT,
    routing_overlap_alerts           INT,
    contact_sources                  STRING,
    fallback_subs_total              INT,
    fallback_subs                    STRING
) USING DELTA;

-- Contact rows pushed by the data team, one per subscription and application.
CREATE TABLE subscription_contacts (
    partition_key                 STRING,
    row_key                       STRING,
    ts                            TIMESTAMP,
    primary_contact               STRING,
    application_support_contact   STRING,
    architecture_contact          STRING,
    source_system                 STRING
) USING DELTA;

-- ───────────────────────────────────────────────
-- Subscription contacts
-- ───────────────────────────────────────────────

INSERT INTO subscription_contacts VALUES
    ('a1b2c3d4-0001-4000-8000-000000000001', 'APP-1042', TIMESTAMP '2026-09-06 03:15:00', 'ana.ribeiro@example.com', 'payments-support@example.com', 'carlos.mendes@example.com', 'ServiceNow CMDB'),
    ('a1b2c3d4-0002-4000-8000-000000000002', 'APP-1107', TIMESTAMP '2026-09-06 03:15:00', 'joao.silva@example.com', '', 'beatriz.costa@example.com', 'ServiceNow CMDB'),
    ('a1b2c3d4-0003-4000-8000-000000000003', 'APP-1210', TIMESTAMP '2026-09-06 03:15:00', 'maria.santos@example.com;pedro.alves@example.com', 'data-platform@example.com', 'rafael.lima@example.com', 'ServiceNow CMDB'),
    ('a1b2c3d4-0005-4000-8000-000000000005', 'APP-1333', TIMESTAMP '2026-09-06 03:15:00', 'N/A', '', '', 'ServiceNow CMDB'),
    ('a1b2c3d4-0006-4000-8000-000000000006', 'APP-1390', TIMESTAMP '2026-09-06 03:15:00', 'lucas.ferreira@example.com', 'ml-ops@example.com', '', 'ServiceNow CMDB'),
    ('a1b2c3d4-0008-4000-8000-000000000008', 'APP-1451', TIMESTAMP '2026-09-06 03:15:00', 'fernanda.rocha@example.com', '', 'fernanda.rocha@example.com', 'ServiceNow CMDB');

-- ───────────────────────────────────────────────
-- Anomaly history (reported week)
-- ───────────────────────────────────────────────

INSERT INTO anomaly_history VALUES
    -- sub-payments-prod: three alerts, the pattern detected case
    ('AnomalyHistory', 'a1b2c3d4-0001-4000-8000-000000000001_2026-09-07T08-12-41-118203+00-00', 'a1b2c3d4-0001-4000-8000-000000000001', 'sub-payments-prod', DATE '2026-09-06', 142.7, 3184.55, TIMESTAMP '2026-09-07 08:12:41', 'Sent', 'tag_databricks', 'found', 'found', 'ServiceNow CMDB', 1, DATE '2026-08-07', DATE '2026-09-05', 'azure', 1872.30, 'reconciled'),
    ('AnomalyHistory', 'a1b2c3d4-0001-4000-8000-000000000001_2026-09-09T08-05-17-902114+00-00', 'a1b2c3d4-0001-4000-8000-000000000001', 'sub-payments-prod', DATE '2026-09-08', 96.4, 2578.10, TIMESTAMP '2026-09-09 08:05:17', 'Sent', 'tag_databricks', 'found', 'found', 'ServiceNow CMDB', 1, DATE '2026-08-09', DATE '2026-09-07', 'azure', 1265.80, 'reconciled'),
    ('AnomalyHistory', 'a1b2c3d4-0001-4000-8000-000000000001_2026-09-12T08-09-55-330871+00-00', 'a1b2c3d4-0001-4000-8000-000000000001', 'sub-payments-prod', DATE '2026-09-11', 61.2, 2114.90, TIMESTAMP '2026-09-12 08:09:55', 'Sent', 'tag_databricks', 'found', 'found', 'ServiceNow CMDB', 1, DATE '2026-08-12', DATE '2026-09-10', 'azure', 802.45, 'partial'),

    -- sub-core-banking-uat: both sources resolved but name different people, overlap is zero
    ('AnomalyHistory', 'a1b2c3d4-0002-4000-8000-000000000002_2026-09-08T08-03-29-551902+00-00', 'a1b2c3d4-0002-4000-8000-000000000002', 'sub-core-banking-uat', DATE '2026-09-07', 88.9, 1456.20, TIMESTAMP '2026-09-08 08:03:29', 'Sent', 'tag_databricks', 'found', 'found', 'ServiceNow CMDB', 0, DATE '2026-08-08', DATE '2026-09-06', 'azure', 684.15, 'reconciled'),

    -- sub-data-platform-prod: two alerts, one the billed cost could not reproduce
    ('AnomalyHistory', 'a1b2c3d4-0003-4000-8000-000000000003_2026-09-08T08-14-02-774410+00-00', 'a1b2c3d4-0003-4000-8000-000000000003', 'sub-data-platform-prod', DATE '2026-09-07', 210.3, 5920.75, TIMESTAMP '2026-09-08 08:14:02', 'Sent', 'tag_databricks', 'found', 'found', 'ServiceNow CMDB', 2, DATE '2026-08-08', DATE '2026-09-06', 'azure', 3940.60, 'reconciled'),
    ('AnomalyHistory', 'a1b2c3d4-0003-4000-8000-000000000003_2026-09-11T08-07-48-210553+00-00', 'a1b2c3d4-0003-4000-8000-000000000003', 'sub-data-platform-prod', DATE '2026-09-10', 47.5, 2890.40, TIMESTAMP '2026-09-11 08:07:48', 'Sent', 'tag_databricks', 'found', 'found', 'ServiceNow CMDB', 2, DATE '2026-08-11', DATE '2026-09-09', 'azure', 0.00, 'not_reconciled'),

    -- sub-digital-channels-dev: tag only, no contact row pushed
    ('AnomalyHistory', 'a1b2c3d4-0004-4000-8000-000000000004_2026-09-09T08-11-36-098771+00-00', 'a1b2c3d4-0004-4000-8000-000000000004', 'sub-digital-channels-dev', DATE '2026-09-08', 73.8, 612.30, TIMESTAMP '2026-09-09 08:11:36', 'Sent', 'tag_only', 'found', 'missing', '', 0, DATE '2026-08-09', DATE '2026-09-07', 'azure', 258.90, 'reconciled'),

    -- sub-legacy-reporting: tag missing and contact row is junk, fell back to the CBO list
    ('AnomalyHistory', 'a1b2c3d4-0005-4000-8000-000000000005_2026-09-10T08-02-12-664201+00-00', 'a1b2c3d4-0005-4000-8000-000000000005', 'sub-legacy-reporting', DATE '2026-09-09', 55.1, 1038.60, TIMESTAMP '2026-09-10 08:02:12', 'Sent', 'none', 'missing', 'invalid', 'ServiceNow CMDB', 0, DATE '2026-08-10', DATE '2026-09-08', 'fallback', 371.20, 'partial'),

    -- sub-ml-training-sandbox: no tag, contacts only
    ('AnomalyHistory', 'a1b2c3d4-0006-4000-8000-000000000006_2026-09-10T08-16-44-451329+00-00', 'a1b2c3d4-0006-4000-8000-000000000006', 'sub-ml-training-sandbox', DATE '2026-09-09', 318.6, 4477.85, TIMESTAMP '2026-09-10 08:16:44', 'Sent', 'databricks_only', 'missing', 'found', 'ServiceNow CMDB', 0, DATE '2026-08-10', DATE '2026-09-08', 'azure', 3402.15, 'reconciled'),

    -- sub-shared-services-hub: invalid tag value and the contacts lookup failed on our side
    ('AnomalyHistory', 'a1b2c3d4-0007-4000-8000-000000000007_2026-09-12T08-04-58-887615+00-00', 'a1b2c3d4-0007-4000-8000-000000000007', 'sub-shared-services-hub', DATE '2026-09-11', 39.4, 2211.05, TIMESTAMP '2026-09-12 08:04:58', 'Sent', 'none', 'invalid', 'lookup_failed', '', 0, DATE '2026-08-12', DATE '2026-09-10', 'azure', 0.00, 'not_reconciled'),

    -- sub-treasury-prod: same person in both sources
    ('AnomalyHistory', 'a1b2c3d4-0008-4000-8000-000000000008_2026-09-13T08-08-21-133904+00-00', 'a1b2c3d4-0008-4000-8000-000000000008', 'sub-treasury-prod', DATE '2026-09-12', 124.9, 1897.40, TIMESTAMP '2026-09-13 08:08:21', 'Sent', 'tag_databricks', 'found', 'found', 'ServiceNow CMDB', 1, DATE '2026-08-13', DATE '2026-09-11', 'azure', 1054.70, 'reconciled'),

    -- Pending row: the Logic App never confirmed the send, so it is excluded from the counts
    ('AnomalyHistory', 'a1b2c3d4-0004-4000-8000-000000000004_2026-09-13T08-19-03-720116+00-00', 'a1b2c3d4-0004-4000-8000-000000000004', 'sub-digital-channels-dev', DATE '2026-09-12', 42.0, 588.10, TIMESTAMP '2026-09-13 08:19:03', 'PendingSend', 'tag_only', 'found', 'missing', '', 0, DATE '2026-08-13', DATE '2026-09-11', 'azure', 190.35, 'reconciled');

-- ───────────────────────────────────────────────
-- Anomaly history (prior week, for the week over week comparison)
-- ───────────────────────────────────────────────

INSERT INTO anomaly_history VALUES
    ('AnomalyHistory', 'a1b2c3d4-0001-4000-8000-000000000001_2026-09-01T08-10-27-405118+00-00', 'a1b2c3d4-0001-4000-8000-000000000001', 'sub-payments-prod', DATE '2026-08-31', 78.3, 2280.15, TIMESTAMP '2026-09-01 08:10:27', 'Sent', 'tag_databricks', 'found', 'found', 'ServiceNow CMDB', 1, DATE '2026-08-01', DATE '2026-08-30', 'azure', 995.40, 'reconciled'),
    ('AnomalyHistory', 'a1b2c3d4-0003-4000-8000-000000000003_2026-09-03T08-06-49-118820+00-00', 'a1b2c3d4-0003-4000-8000-000000000003', 'sub-data-platform-prod', DATE '2026-09-02', 133.7, 4310.90, TIMESTAMP '2026-09-03 08:06:49', 'Sent', 'tag_databricks', 'found', 'found', 'ServiceNow CMDB', 2, DATE '2026-08-03', DATE '2026-09-01', 'azure', 2466.35, 'reconciled'),
    ('AnomalyHistory', 'a1b2c3d4-0005-4000-8000-000000000005_2026-09-04T08-13-05-903312+00-00', 'a1b2c3d4-0005-4000-8000-000000000005', 'sub-legacy-reporting', DATE '2026-09-03', 49.6, 987.25, TIMESTAMP '2026-09-04 08:13:05', 'Sent', 'none', 'missing', 'invalid', 'ServiceNow CMDB', 0, DATE '2026-08-04', DATE '2026-09-02', 'fallback', 0.00, 'not_reconciled'),
    ('AnomalyHistory', 'a1b2c3d4-0008-4000-8000-000000000008_2026-09-05T08-09-31-667204+00-00', 'a1b2c3d4-0008-4000-8000-000000000008', 'sub-treasury-prod', DATE '2026-09-04', 91.2, 1633.80, TIMESTAMP '2026-09-05 08:09:31', 'Sent', 'tag_databricks', 'found', 'found', 'ServiceNow CMDB', 1, DATE '2026-08-05', DATE '2026-09-03', 'azure', 780.55, 'reconciled');

-- ───────────────────────────────────────────────
-- Weekly report: coverage row
-- ───────────────────────────────────────────────

INSERT INTO weekly_report_coverage VALUES
    ('WeeklyReport', 'coverage_2026-09-14', TIMESTAMP '2026-09-14 09:04:12', 38, 3, 2, 1, 44, 'cbo-finops-prod', 'cbo-finops-cost-anomaly',
     '[{"Name":"sub-legacy-reporting","Id":"a1b2c3d4-0005-4000-8000-000000000005"},{"Name":"sub-archive-cold-storage","Id":"a1b2c3d4-0009-4000-8000-000000000009"},{"Name":"sub-vendor-poc-2026","Id":"a1b2c3d4-0010-4000-8000-000000000010"}]');

-- ───────────────────────────────────────────────
-- Weekly report: stats row
-- Counts below are consistent with the Sent rows of the reported week.
-- ───────────────────────────────────────────────

INSERT INTO weekly_report_stats VALUES
    ('WeeklyReport', 'stats_2026-09-14', TIMESTAMP '2026-09-14 09:33:47',
     17, 16, 1,          -- total, succeeded and failed Logic App runs
     11, 5, 31.3,        -- notified, suppressed and suppression rate
     11, 4, 7,           -- prior week runs, notified and suppressed
     'Sep 07 – Sep 13, 2026', 'Aug 31 – Sep 06, 2026',
     '[{"Name":"sub-payments-prod","AlertCount":3,"ObservedIncreaseUsd":3940.55,"NotReconciled":0},{"Name":"sub-data-platform-prod","AlertCount":2,"ObservedIncreaseUsd":3940.60,"NotReconciled":1},{"Name":"sub-core-banking-uat","AlertCount":1,"ObservedIncreaseUsd":684.15,"NotReconciled":0},{"Name":"sub-digital-channels-dev","AlertCount":1,"ObservedIncreaseUsd":258.90,"NotReconciled":0},{"Name":"sub-legacy-reporting","AlertCount":1,"ObservedIncreaseUsd":371.20,"NotReconciled":0},{"Name":"sub-ml-training-sandbox","AlertCount":1,"ObservedIncreaseUsd":3402.15,"NotReconciled":0},{"Name":"sub-shared-services-hub","AlertCount":1,"ObservedIncreaseUsd":0.00,"NotReconciled":1},{"Name":"sub-treasury-prod","AlertCount":1,"ObservedIncreaseUsd":1054.70,"NotReconciled":0}]',
     13652.25, 2, 0,
     0, 0, 0, 0,         -- legacy tag only cascade values, none this week
     7, 1, 1, 2, 0,      -- tag and contacts, tag only, contacts only, none, legacy
     6,                  -- alerts where at least one address overlapped
     '[{"Source":"ServiceNow CMDB","Alerts":9}]',
     2,
     '[{"Name":"sub-legacy-reporting","Reason":"none","AlertCount":1},{"Name":"sub-shared-services-hub","Reason":"none","AlertCount":1}]');

-- ───────────────────────────────────────────────
-- Sanity checks
-- ───────────────────────────────────────────────

-- Notified alerts per subscription in the reported week, must match TopSubs.
SELECT subscription_name,
       COUNT(*)                                                   AS alert_count,
       ROUND(SUM(CASE WHEN attribution_status IN ('reconciled', 'partial') THEN observed_change_usd ELSE 0 END), 2) AS observed_increase_usd,
       SUM(CASE WHEN attribution_status = 'not_reconciled' THEN 1 ELSE 0 END) AS not_reconciled
FROM anomaly_history
WHERE send_status = 'Sent'
  AND notified_at >= TIMESTAMP '2026-09-07 00:00:00'
  AND notified_at <  TIMESTAMP '2026-09-14 00:00:00'
GROUP BY subscription_name
ORDER BY alert_count DESC, subscription_name;

-- Routing outcome for the week, must match the Routing* columns of the stats row.
SELECT routing_source, COUNT(*) AS alerts
FROM anomaly_history
WHERE send_status = 'Sent'
  AND notified_at >= TIMESTAMP '2026-09-07 00:00:00'
  AND notified_at <  TIMESTAMP '2026-09-14 00:00:00'
GROUP BY routing_source
ORDER BY alerts DESC;
