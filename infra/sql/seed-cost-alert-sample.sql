-- ============================================================================
-- Cost Alert Report - dados fictícios de um ciclo semanal
-- Traduzido de data/seed_weekly_report_sample.sql (escrito originalmente para
-- Databricks/Delta) para T-SQL / Azure SQL Database, seguindo o schema de
-- infra/sql/cost-alert-schema.sql. Todo id, nome, endereço e valor abaixo é
-- inventado.
--
-- Semana do relatório : seg 2026-09-07 a dom 2026-09-13
-- Data do runbook      : seg 2026-09-14 (as chaves de entidade ancoram nessa segunda)
--
-- Idempotente: pode ser reaplicado (faz TRUNCATE antes de inserir).
-- ============================================================================

TRUNCATE TABLE dbo.CostAlertSubscriptionContacts;
TRUNCATE TABLE dbo.CostAlertAnomalyHistory;
TRUNCATE TABLE dbo.CostAlertWeeklyReportCoverage;
TRUNCATE TABLE dbo.CostAlertWeeklyReportStats;

-- ───────────────────────────────────────────────
-- Subscription contacts
-- ───────────────────────────────────────────────

INSERT INTO dbo.CostAlertSubscriptionContacts
    (PartitionKey, RowKey, Ts, PrimaryContact, ApplicationSupportContact, ArchitectureContact, SourceSystem)
VALUES
    (N'a1b2c3d4-0001-4000-8000-000000000001', N'APP-1042', '2026-09-06 03:15:00', N'ana.ribeiro@example.com', N'payments-support@example.com', N'carlos.mendes@example.com', N'ServiceNow CMDB'),
    (N'a1b2c3d4-0002-4000-8000-000000000002', N'APP-1107', '2026-09-06 03:15:00', N'joao.silva@example.com', N'', N'beatriz.costa@example.com', N'ServiceNow CMDB'),
    (N'a1b2c3d4-0003-4000-8000-000000000003', N'APP-1210', '2026-09-06 03:15:00', N'maria.santos@example.com;pedro.alves@example.com', N'data-platform@example.com', N'rafael.lima@example.com', N'ServiceNow CMDB'),
    (N'a1b2c3d4-0005-4000-8000-000000000005', N'APP-1333', '2026-09-06 03:15:00', N'N/A', N'', N'', N'ServiceNow CMDB'),
    (N'a1b2c3d4-0006-4000-8000-000000000006', N'APP-1390', '2026-09-06 03:15:00', N'lucas.ferreira@example.com', N'ml-ops@example.com', N'', N'ServiceNow CMDB'),
    (N'a1b2c3d4-0008-4000-8000-000000000008', N'APP-1451', '2026-09-06 03:15:00', N'fernanda.rocha@example.com', N'', N'fernanda.rocha@example.com', N'ServiceNow CMDB');

-- ───────────────────────────────────────────────
-- Anomaly history (semana reportada)
-- ───────────────────────────────────────────────

INSERT INTO dbo.CostAlertAnomalyHistory
    (PartitionKey, RowKey, SubscriptionId, SubscriptionName, DetectionDate, DeltaPercent, TotalCost, NotifiedAt, SendStatus, RoutingSource, TagStatus, ContactsStatus, ContactSource, RecipientOverlap, WindowFrom, WindowTo, WindowSource, ObservedChangeUsd, AttributionStatus)
VALUES
    -- sub-payments-prod: três alertas, o caso de padrão detectado
    (N'AnomalyHistory', N'a1b2c3d4-0001-4000-8000-000000000001_2026-09-07T08-12-41-118203+00-00', N'a1b2c3d4-0001-4000-8000-000000000001', N'sub-payments-prod', '2026-09-06', 142.7, 3184.55, '2026-09-07 08:12:41', N'Sent', N'tag_databricks', N'found', N'found', N'ServiceNow CMDB', 1, '2026-08-07', '2026-09-05', N'azure', 1872.30, N'reconciled'),
    (N'AnomalyHistory', N'a1b2c3d4-0001-4000-8000-000000000001_2026-09-09T08-05-17-902114+00-00', N'a1b2c3d4-0001-4000-8000-000000000001', N'sub-payments-prod', '2026-09-08', 96.4, 2578.10, '2026-09-09 08:05:17', N'Sent', N'tag_databricks', N'found', N'found', N'ServiceNow CMDB', 1, '2026-08-09', '2026-09-07', N'azure', 1265.80, N'reconciled'),
    (N'AnomalyHistory', N'a1b2c3d4-0001-4000-8000-000000000001_2026-09-12T08-09-55-330871+00-00', N'a1b2c3d4-0001-4000-8000-000000000001', N'sub-payments-prod', '2026-09-11', 61.2, 2114.90, '2026-09-12 08:09:55', N'Sent', N'tag_databricks', N'found', N'found', N'ServiceNow CMDB', 1, '2026-08-12', '2026-09-10', N'azure', 802.45, N'partial'),

    -- sub-core-banking-uat: ambas as fontes resolvidas mas com pessoas diferentes, overlap zero
    (N'AnomalyHistory', N'a1b2c3d4-0002-4000-8000-000000000002_2026-09-08T08-03-29-551902+00-00', N'a1b2c3d4-0002-4000-8000-000000000002', N'sub-core-banking-uat', '2026-09-07', 88.9, 1456.20, '2026-09-08 08:03:29', N'Sent', N'tag_databricks', N'found', N'found', N'ServiceNow CMDB', 0, '2026-08-08', '2026-09-06', N'azure', 684.15, N'reconciled'),

    -- sub-data-platform-prod: dois alertas, um deles o custo faturado não reproduziu
    (N'AnomalyHistory', N'a1b2c3d4-0003-4000-8000-000000000003_2026-09-08T08-14-02-774410+00-00', N'a1b2c3d4-0003-4000-8000-000000000003', N'sub-data-platform-prod', '2026-09-07', 210.3, 5920.75, '2026-09-08 08:14:02', N'Sent', N'tag_databricks', N'found', N'found', N'ServiceNow CMDB', 2, '2026-08-08', '2026-09-06', N'azure', 3940.60, N'reconciled'),
    (N'AnomalyHistory', N'a1b2c3d4-0003-4000-8000-000000000003_2026-09-11T08-07-48-210553+00-00', N'a1b2c3d4-0003-4000-8000-000000000003', N'sub-data-platform-prod', '2026-09-10', 47.5, 2890.40, '2026-09-11 08:07:48', N'Sent', N'tag_databricks', N'found', N'found', N'ServiceNow CMDB', 2, '2026-08-11', '2026-09-09', N'azure', 0.00, N'not_reconciled'),

    -- sub-digital-channels-dev: só tag, sem linha de contato pushada
    (N'AnomalyHistory', N'a1b2c3d4-0004-4000-8000-000000000004_2026-09-09T08-11-36-098771+00-00', N'a1b2c3d4-0004-4000-8000-000000000004', N'sub-digital-channels-dev', '2026-09-08', 73.8, 612.30, '2026-09-09 08:11:36', N'Sent', N'tag_only', N'found', N'missing', N'', 0, '2026-08-09', '2026-09-07', N'azure', 258.90, N'reconciled'),

    -- sub-legacy-reporting: tag ausente e linha de contato é lixo, caiu para a lista da CBO
    (N'AnomalyHistory', N'a1b2c3d4-0005-4000-8000-000000000005_2026-09-10T08-02-12-664201+00-00', N'a1b2c3d4-0005-4000-8000-000000000005', N'sub-legacy-reporting', '2026-09-09', 55.1, 1038.60, '2026-09-10 08:02:12', N'Sent', N'none', N'missing', N'invalid', N'ServiceNow CMDB', 0, '2026-08-10', '2026-09-08', N'fallback', 371.20, N'partial'),

    -- sub-ml-training-sandbox: sem tag, só contatos
    (N'AnomalyHistory', N'a1b2c3d4-0006-4000-8000-000000000006_2026-09-10T08-16-44-451329+00-00', N'a1b2c3d4-0006-4000-8000-000000000006', N'sub-ml-training-sandbox', '2026-09-09', 318.6, 4477.85, '2026-09-10 08:16:44', N'Sent', N'databricks_only', N'missing', N'found', N'ServiceNow CMDB', 0, '2026-08-10', '2026-09-08', N'azure', 3402.15, N'reconciled'),

    -- sub-shared-services-hub: valor de tag inválido e a busca de contatos falhou do nosso lado
    (N'AnomalyHistory', N'a1b2c3d4-0007-4000-8000-000000000007_2026-09-12T08-04-58-887615+00-00', N'a1b2c3d4-0007-4000-8000-000000000007', N'sub-shared-services-hub', '2026-09-11', 39.4, 2211.05, '2026-09-12 08:04:58', N'Sent', N'none', N'invalid', N'lookup_failed', N'', 0, '2026-08-12', '2026-09-10', N'azure', 0.00, N'not_reconciled'),

    -- sub-treasury-prod: mesma pessoa nas duas fontes
    (N'AnomalyHistory', N'a1b2c3d4-0008-4000-8000-000000000008_2026-09-13T08-08-21-133904+00-00', N'a1b2c3d4-0008-4000-8000-000000000008', N'sub-treasury-prod', '2026-09-12', 124.9, 1897.40, '2026-09-13 08:08:21', N'Sent', N'tag_databricks', N'found', N'found', N'ServiceNow CMDB', 1, '2026-08-13', '2026-09-11', N'azure', 1054.70, N'reconciled'),

    -- Linha pendente: o Logic App nunca confirmou o envio, então fica fora das contagens
    (N'AnomalyHistory', N'a1b2c3d4-0004-4000-8000-000000000004_2026-09-13T08-19-03-720116+00-00', N'a1b2c3d4-0004-4000-8000-000000000004', N'sub-digital-channels-dev', '2026-09-12', 42.0, 588.10, '2026-09-13 08:19:03', N'PendingSend', N'tag_only', N'found', N'missing', N'', 0, '2026-08-13', '2026-09-11', N'azure', 190.35, N'reconciled');

-- ───────────────────────────────────────────────
-- Anomaly history (semana anterior, para a comparação semana a semana)
-- ───────────────────────────────────────────────

INSERT INTO dbo.CostAlertAnomalyHistory
    (PartitionKey, RowKey, SubscriptionId, SubscriptionName, DetectionDate, DeltaPercent, TotalCost, NotifiedAt, SendStatus, RoutingSource, TagStatus, ContactsStatus, ContactSource, RecipientOverlap, WindowFrom, WindowTo, WindowSource, ObservedChangeUsd, AttributionStatus)
VALUES
    (N'AnomalyHistory', N'a1b2c3d4-0001-4000-8000-000000000001_2026-09-01T08-10-27-405118+00-00', N'a1b2c3d4-0001-4000-8000-000000000001', N'sub-payments-prod', '2026-08-31', 78.3, 2280.15, '2026-09-01 08:10:27', N'Sent', N'tag_databricks', N'found', N'found', N'ServiceNow CMDB', 1, '2026-08-01', '2026-08-30', N'azure', 995.40, N'reconciled'),
    (N'AnomalyHistory', N'a1b2c3d4-0003-4000-8000-000000000003_2026-09-03T08-06-49-118820+00-00', N'a1b2c3d4-0003-4000-8000-000000000003', N'sub-data-platform-prod', '2026-09-02', 133.7, 4310.90, '2026-09-03 08:06:49', N'Sent', N'tag_databricks', N'found', N'found', N'ServiceNow CMDB', 2, '2026-08-03', '2026-09-01', N'azure', 2466.35, N'reconciled'),
    (N'AnomalyHistory', N'a1b2c3d4-0005-4000-8000-000000000005_2026-09-04T08-13-05-903312+00-00', N'a1b2c3d4-0005-4000-8000-000000000005', N'sub-legacy-reporting', '2026-09-03', 49.6, 987.25, '2026-09-04 08:13:05', N'Sent', N'none', N'missing', N'invalid', N'ServiceNow CMDB', 0, '2026-08-04', '2026-09-02', N'fallback', 0.00, N'not_reconciled'),
    (N'AnomalyHistory', N'a1b2c3d4-0008-4000-8000-000000000008_2026-09-05T08-09-31-667204+00-00', N'a1b2c3d4-0008-4000-8000-000000000008', N'sub-treasury-prod', '2026-09-04', 91.2, 1633.80, '2026-09-05 08:09:31', N'Sent', N'tag_databricks', N'found', N'found', N'ServiceNow CMDB', 1, '2026-08-05', '2026-09-03', N'azure', 780.55, N'reconciled');

-- ───────────────────────────────────────────────
-- Weekly report: linha de coverage
-- ───────────────────────────────────────────────

INSERT INTO dbo.CostAlertWeeklyReportCoverage
    (PartitionKey, RowKey, GeneratedAt, Covered, Missing, Skipped, Failed, TotalChecked, TfeWorkspace, AlertName, MissingSubs)
VALUES
    (N'WeeklyReport', N'coverage_2026-09-14', '2026-09-14 09:04:12', 38, 3, 2, 1, 44, N'cbo-finops-prod', N'cbo-finops-cost-anomaly',
     N'[{"Name":"sub-legacy-reporting","Id":"a1b2c3d4-0005-4000-8000-000000000005"},{"Name":"sub-archive-cold-storage","Id":"a1b2c3d4-0009-4000-8000-000000000009"},{"Name":"sub-vendor-poc-2026","Id":"a1b2c3d4-0010-4000-8000-000000000010"}]');

-- ───────────────────────────────────────────────
-- Weekly report: linha de stats
-- As contagens abaixo são consistentes com as linhas "Sent" da semana reportada.
-- ───────────────────────────────────────────────

INSERT INTO dbo.CostAlertWeeklyReportStats
    (PartitionKey, RowKey, GeneratedAt,
     TotalRuns, SucceededRuns, FailedRuns,
     TotalNotified, TotalSuppressed, SuppressionRate,
     PrevTotalRuns, PrevNotified, PrevSuppressed,
     WeekLabel, PrevWeekLabel,
     TopSubs, TopSubsObservedIncreaseTotal, TopSubsNotReconciled, TopSubsBeyondCap,
     RoutingTag, RoutingMissingTag, RoutingInvalidTag, RoutingLookupFailed,
     RoutingTagAndContacts, RoutingTagOnly, RoutingContactsOnly, RoutingNone, RoutingLegacy,
     RoutingOverlapAlerts,
     ContactSources,
     FallbackSubsTotal, FallbackSubs)
VALUES
    (N'WeeklyReport', N'stats_2026-09-14', '2026-09-14 09:33:47',
     17, 16, 1,          -- total, succeeded e failed Logic App runs
     11, 5, 31.3,         -- notified, suppressed e suppression rate
     11, 4, 7,            -- prior week runs, notified e suppressed
     N'Sep 07 – Sep 13, 2026', N'Aug 31 – Sep 06, 2026',
     N'[{"Name":"sub-payments-prod","AlertCount":3,"ObservedIncreaseUsd":3940.55,"NotReconciled":0},{"Name":"sub-data-platform-prod","AlertCount":2,"ObservedIncreaseUsd":3940.60,"NotReconciled":1},{"Name":"sub-core-banking-uat","AlertCount":1,"ObservedIncreaseUsd":684.15,"NotReconciled":0},{"Name":"sub-digital-channels-dev","AlertCount":1,"ObservedIncreaseUsd":258.90,"NotReconciled":0},{"Name":"sub-legacy-reporting","AlertCount":1,"ObservedIncreaseUsd":371.20,"NotReconciled":0},{"Name":"sub-ml-training-sandbox","AlertCount":1,"ObservedIncreaseUsd":3402.15,"NotReconciled":0},{"Name":"sub-shared-services-hub","AlertCount":1,"ObservedIncreaseUsd":0.00,"NotReconciled":1},{"Name":"sub-treasury-prod","AlertCount":1,"ObservedIncreaseUsd":1054.70,"NotReconciled":0}]',
     13652.25, 2, 0,
     0, 0, 0, 0,          -- valores legados da cascata de tag only, nenhum nesta semana
     7, 1, 1, 2, 0,       -- tag e contacts, tag only, contacts only, none, legacy
     6,                   -- alertas com pelo menos um endereço sobreposto
     N'[{"Source":"ServiceNow CMDB","Alerts":9}]',
     2,
     N'[{"Name":"sub-legacy-reporting","Reason":"none","AlertCount":1},{"Name":"sub-shared-services-hub","Reason":"none","AlertCount":1}]');
