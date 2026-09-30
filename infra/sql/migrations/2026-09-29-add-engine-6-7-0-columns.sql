-- ============================================================================
-- Migration: add the columns introduced in FinOps engine 6.5.14-6.7.0
-- (idle/allocation, license, commitment, redundancy) to dbo.FinOpsRecommendations
-- and dbo.FinOpsLatestRun on an already-provisioned database. schema.sql was
-- updated with the same columns for fresh deployments; run this script
-- against an existing database instead of re-running schema.sql (which would
-- try to CREATE TABLE again).
--
-- Idempotent: safe to run more than once.
-- ============================================================================

DECLARE @sql NVARCHAR(MAX) = N'';

;WITH NewColumns AS (
    SELECT * FROM (VALUES
        ('FlatZeroMetrics', 'NVARCHAR(MAX) NULL'),
        ('IdleMonthlyCost', 'FLOAT NULL'),
        ('CostIsAllocated', 'BIT NULL'),
        ('ManagedBy', 'NVARCHAR(MAX) NULL'),
        ('ManagedByDetail', 'NVARCHAR(MAX) NULL'),
        ('LicenseMonthlyCost', 'FLOAT NULL'),
        ('LicenseProducts', 'NVARCHAR(MAX) NULL'),
        ('LicenseBenefitStatus', 'NVARCHAR(MAX) NULL'),
        ('LicenseMonthlySavings', 'FLOAT NULL'),
        ('CommitmentCoverage', 'FLOAT NULL'),
        ('SavingsRealization', 'NVARCHAR(MAX) NULL'),
        ('CommitmentEligibleMonthlyCost', 'FLOAT NULL'),
        ('CommitmentMonthlySavings', 'FLOAT NULL'),
        ('CommitmentMonthlySavings3Y', 'FLOAT NULL'),
        ('CommitmentOffer', 'NVARCHAR(MAX) NULL'),
        ('RedundancyMonthlySavings', 'FLOAT NULL')
    ) AS c(ColumnName, ColumnDef)
)
SELECT @sql = @sql +
    'ALTER TABLE ' + QUOTENAME(t.TABLE_SCHEMA) + '.' + QUOTENAME(t.TABLE_NAME) +
    ' ADD ' + QUOTENAME(nc.ColumnName) + ' ' + nc.ColumnDef + ';' + CHAR(10)
FROM (VALUES ('dbo', 'FinOpsRecommendations'), ('dbo', 'FinOpsLatestRun')) AS t(TABLE_SCHEMA, TABLE_NAME)
CROSS JOIN NewColumns nc
WHERE NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS c
    WHERE c.TABLE_SCHEMA = t.TABLE_SCHEMA AND c.TABLE_NAME = t.TABLE_NAME AND c.COLUMN_NAME = nc.ColumnName
);

IF LEN(@sql) = 0
    PRINT 'All engine 6.5.14-6.7.0 columns already present on FinOpsRecommendations and FinOpsLatestRun.';
ELSE
BEGIN
    PRINT @sql;
    EXEC sp_executesql @sql;
    PRINT 'Migration applied.';
END
