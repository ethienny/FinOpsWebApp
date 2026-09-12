-- ============================================================================
-- FinOps Insight Engine - Database Schema
-- Version: 1.0
-- Description: Complete database schema for Azure cost optimization platform
-- ============================================================================

-- ============================================================================
-- CORE CONFIGURATION TABLES
-- ============================================================================

-- Installation metadata
CREATE TABLE Installation (
    InstallationId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TenantId NVARCHAR(100) NOT NULL,
    LicenseKey NVARCHAR(200) NOT NULL,
    CustomerName NVARCHAR(200) NOT NULL,
    ContactEmail NVARCHAR(200) NOT NULL,
    InstallationDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    LastLicenseValidation DATETIME2,
    LicenseStatus NVARCHAR(20) NOT NULL DEFAULT 'Active', -- Active, Expired, Invalid
    Version NVARCHAR(20) NOT NULL,
    CONSTRAINT UQ_Installation_TenantId UNIQUE (TenantId)
);

-- Azure Subscriptions being analyzed
CREATE TABLE Subscriptions (
    SubscriptionId NVARCHAR(100) PRIMARY KEY,
    SubscriptionName NVARCHAR(200) NOT NULL,
    TenantId NVARCHAR(100) NOT NULL,
    State NVARCHAR(50) NOT NULL, -- Enabled, Disabled, Warned
    IsActive BIT NOT NULL DEFAULT 1,
    FirstDiscovered DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    LastScanned DATETIME2,
    CONSTRAINT FK_Subscriptions_Installation FOREIGN KEY (TenantId) 
        REFERENCES Installation(TenantId)
);

-- Analysis runs/executions
CREATE TABLE AnalysisRuns (
    RunId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    StartTime DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    EndTime DATETIME2,
    Status NVARCHAR(20) NOT NULL, -- Running, Completed, Failed
    TotalSubscriptions INT NOT NULL DEFAULT 0,
    TotalResources INT NOT NULL DEFAULT 0,
    TotalRecommendations INT NOT NULL DEFAULT 0,
    EstimatedMonthlySavings DECIMAL(18,2) NOT NULL DEFAULT 0,
    ErrorMessage NVARCHAR(MAX),
    ExecutionTimeSeconds INT
);

-- Track which subscriptions were analyzed in each run
CREATE TABLE AnalysisRunSubscriptions (
    RunId UNIQUEIDENTIFIER NOT NULL,
    SubscriptionId NVARCHAR(100) NOT NULL,
    ResourcesAnalyzed INT NOT NULL DEFAULT 0,
    RecommendationsFound INT NOT NULL DEFAULT 0,
    EstimatedSavings DECIMAL(18,2) NOT NULL DEFAULT 0,
    Status NVARCHAR(20) NOT NULL, -- Completed, Failed, Skipped
    ErrorMessage NVARCHAR(MAX),
    PRIMARY KEY (RunId, SubscriptionId),
    CONSTRAINT FK_AnalysisRunSubs_Run FOREIGN KEY (RunId) 
        REFERENCES AnalysisRuns(RunId),
    CONSTRAINT FK_AnalysisRunSubs_Sub FOREIGN KEY (SubscriptionId) 
        REFERENCES Subscriptions(SubscriptionId)
);

-- ============================================================================
-- RESOURCE INVENTORY TABLES
-- ============================================================================

-- Master resource inventory
CREATE TABLE Resources (
    ResourceId NVARCHAR(500) PRIMARY KEY,
    SubscriptionId NVARCHAR(100) NOT NULL,
    ResourceGroup NVARCHAR(200) NOT NULL,
    ResourceName NVARCHAR(200) NOT NULL,
    ResourceType NVARCHAR(100) NOT NULL, -- Microsoft.Compute/virtualMachines, etc
    Location NVARCHAR(50) NOT NULL,
    Tags NVARCHAR(MAX), -- JSON
    CreatedDate DATETIME2,
    LastDiscovered DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedDate DATETIME2,
    CONSTRAINT FK_Resources_Subscription FOREIGN KEY (SubscriptionId) 
        REFERENCES Subscriptions(SubscriptionId)
);

CREATE INDEX IX_Resources_SubscriptionId ON Resources(SubscriptionId);
CREATE INDEX IX_Resources_ResourceType ON Resources(ResourceType);
CREATE INDEX IX_Resources_Location ON Resources(Location);
CREATE INDEX IX_Resources_IsDeleted ON Resources(IsDeleted) WHERE IsDeleted = 0;

-- ============================================================================
-- COST DATA TABLES
-- ============================================================================

-- Historical cost data (aggregated monthly)
CREATE TABLE MonthlyCosts (
    CostId BIGINT IDENTITY(1,1) PRIMARY KEY,
    ResourceId NVARCHAR(500) NOT NULL,
    SubscriptionId NVARCHAR(100) NOT NULL,
    YearMonth INT NOT NULL, -- YYYYMM format (e.g., 202402)
    TotalCost DECIMAL(18,2) NOT NULL,
    Currency NVARCHAR(10) NOT NULL DEFAULT 'USD',
    RecordedDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_MonthlyCosts_Resource FOREIGN KEY (ResourceId) 
        REFERENCES Resources(ResourceId),
    CONSTRAINT FK_MonthlyCosts_Subscription FOREIGN KEY (SubscriptionId) 
        REFERENCES Subscriptions(SubscriptionId),
    CONSTRAINT UQ_MonthlyCosts_Resource_Month UNIQUE (ResourceId, YearMonth)
);

CREATE INDEX IX_MonthlyCosts_YearMonth ON MonthlyCosts(YearMonth);
CREATE INDEX IX_MonthlyCosts_SubscriptionId ON MonthlyCosts(SubscriptionId);

-- ============================================================================
-- RECOMMENDATIONS TABLES
-- ============================================================================

-- All optimization recommendations
CREATE TABLE Recommendations (
    RecommendationId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    RunId UNIQUEIDENTIFIER NOT NULL,
    ResourceId NVARCHAR(500) NOT NULL,
    SubscriptionId NVARCHAR(100) NOT NULL,
    Category NVARCHAR(50) NOT NULL, -- Cost, Performance, Security, Reliability, Excellence
    Severity NVARCHAR(20) NOT NULL, -- Critical, High, Medium, Low
    RecommendationType NVARCHAR(100) NOT NULL, -- RightSize, Delete, Reserved, etc
    Title NVARCHAR(500) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    CurrentConfiguration NVARCHAR(MAX), -- JSON
    RecommendedConfiguration NVARCHAR(MAX), -- JSON
    EstimatedMonthlySavings DECIMAL(18,2) NOT NULL DEFAULT 0,
    EstimatedAnnualSavings DECIMAL(18,2) NOT NULL DEFAULT 0,
    ConfidenceScore DECIMAL(5,2) NOT NULL DEFAULT 0, -- 0-100
    ImplementationEffort NVARCHAR(20), -- Low, Medium, High
    ImpactLevel NVARCHAR(20), -- Low, Medium, High
    Status NVARCHAR(20) NOT NULL DEFAULT 'Open', -- Open, Accepted, Rejected, Implemented
    CreatedDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedDate DATETIME2,
    ImplementedDate DATETIME2,
    RejectionReason NVARCHAR(500),
    CONSTRAINT FK_Recommendations_Run FOREIGN KEY (RunId) 
        REFERENCES AnalysisRuns(RunId),
    CONSTRAINT FK_Recommendations_Resource FOREIGN KEY (ResourceId) 
        REFERENCES Resources(ResourceId),
    CONSTRAINT FK_Recommendations_Subscription FOREIGN KEY (SubscriptionId) 
        REFERENCES Subscriptions(SubscriptionId)
);

CREATE INDEX IX_Recommendations_RunId ON Recommendations(RunId);
CREATE INDEX IX_Recommendations_ResourceId ON Recommendations(ResourceId);
CREATE INDEX IX_Recommendations_Status ON Recommendations(Status);
CREATE INDEX IX_Recommendations_Severity ON Recommendations(Severity);
CREATE INDEX IX_Recommendations_Category ON Recommendations(Category);

-- ============================================================================
-- SERVICE-SPECIFIC TABLES
-- ============================================================================

-- Virtual Machines detailed analysis
CREATE TABLE VirtualMachines (
    ResourceId NVARCHAR(500) PRIMARY KEY,
    VMSize NVARCHAR(50) NOT NULL,
    OSType NVARCHAR(20) NOT NULL, -- Windows, Linux
    PowerState NVARCHAR(20) NOT NULL, -- Running, Stopped, Deallocated
    AvailabilityZone NVARCHAR(50),
    ProvisioningState NVARCHAR(50),
    CPU_Cores INT NOT NULL,
    Memory_GB INT NOT NULL,
    AvgCPU_30d DECIMAL(5,2),
    MaxCPU_30d DECIMAL(5,2),
    AvgMemory_30d DECIMAL(5,2),
    MaxMemory_30d DECIMAL(5,2),
    NetworkIn_30d_GB DECIMAL(18,2),
    NetworkOut_30d_GB DECIMAL(18,2),
    DiskIOPS_Avg DECIMAL(18,2),
    UptimePercentage_30d DECIMAL(5,2),
    RecommendedSize NVARCHAR(50),
    RecommendedSizeReason NVARCHAR(500),
    EstimatedMonthlyCost DECIMAL(18,2),
    RecommendedMonthlyCost DECIMAL(18,2),
    LastMetricsUpdate DATETIME2,
    CONSTRAINT FK_VirtualMachines_Resource FOREIGN KEY (ResourceId) 
        REFERENCES Resources(ResourceId)
);

-- Storage Accounts detailed analysis
CREATE TABLE StorageAccounts (
    ResourceId NVARCHAR(500) PRIMARY KEY,
    AccountKind NVARCHAR(50) NOT NULL, -- StorageV2, BlobStorage, etc
    SkuName NVARCHAR(50) NOT NULL, -- Standard_LRS, Premium_LRS, etc
    AccessTier NVARCHAR(20), -- Hot, Cool, Archive
    TotalCapacity_GB DECIMAL(18,2),
    UsedCapacity_GB DECIMAL(18,2),
    BlobContainerCount INT,
    FileShareCount INT,
    QueueCount INT,
    TableCount INT,
    LastAccessDate DATETIME2,
    TransactionsPerDay_Avg DECIMAL(18,2),
    DataEgress_30d_GB DECIMAL(18,2),
    RecommendedTier NVARCHAR(20),
    RecommendedSKU NVARCHAR(50),
    EstimatedMonthlyCost DECIMAL(18,2),
    RecommendedMonthlyCost DECIMAL(18,2),
    LastMetricsUpdate DATETIME2,
    CONSTRAINT FK_StorageAccounts_Resource FOREIGN KEY (ResourceId) 
        REFERENCES Resources(ResourceId)
);

-- SQL Databases detailed analysis
CREATE TABLE SQLDatabases (
    ResourceId NVARCHAR(500) PRIMARY KEY,
    ServerName NVARCHAR(200) NOT NULL,
    DatabaseName NVARCHAR(200) NOT NULL,
    Edition NVARCHAR(50) NOT NULL, -- Basic, Standard, Premium, GeneralPurpose, etc
    ServiceTier NVARCHAR(50),
    ComputeTier NVARCHAR(50), -- Provisioned, Serverless
    MaxSize_GB DECIMAL(18,2),
    CurrentSize_GB DECIMAL(18,2),
    DTU_Current INT,
    DTU_Limit INT,
    AvgDTU_30d DECIMAL(5,2),
    MaxDTU_30d DECIMAL(5,2),
    AvgCPU_30d DECIMAL(5,2),
    AvgStorage_30d DECIMAL(5,2),
    ConnectionCount_Avg INT,
    RecommendedTier NVARCHAR(50),
    RecommendedServiceObjective NVARCHAR(50),
    EstimatedMonthlyCost DECIMAL(18,2),
    RecommendedMonthlyCost DECIMAL(18,2),
    LastMetricsUpdate DATETIME2,
    CONSTRAINT FK_SQLDatabases_Resource FOREIGN KEY (ResourceId) 
        REFERENCES Resources(ResourceId)
);

-- PostgreSQL Servers detailed analysis
CREATE TABLE PostgreSQLServers (
    ResourceId NVARCHAR(500) PRIMARY KEY,
    ServerName NVARCHAR(200) NOT NULL,
    Version NVARCHAR(20),
    SkuName NVARCHAR(50) NOT NULL,
    SkuTier NVARCHAR(50) NOT NULL, -- Burstable, GeneralPurpose, MemoryOptimized
    vCores INT,
    Storage_GB INT,
    BackupRetentionDays INT,
    GeoRedundantBackup BIT,
    HighAvailability BIT,
    AvgCPU_30d DECIMAL(5,2),
    MaxCPU_30d DECIMAL(5,2),
    AvgMemory_30d DECIMAL(5,2),
    AvgStorage_30d DECIMAL(5,2),
    AvgConnections_30d INT,
    MaxConnections_30d INT,
    RecommendedSKU NVARCHAR(50),
    RecommendedTier NVARCHAR(50),
    EstimatedMonthlyCost DECIMAL(18,2),
    RecommendedMonthlyCost DECIMAL(18,2),
    LastMetricsUpdate DATETIME2,
    CONSTRAINT FK_PostgreSQLServers_Resource FOREIGN KEY (ResourceId) 
        REFERENCES Resources(ResourceId)
);

-- CosmosDB Accounts detailed analysis
CREATE TABLE CosmosDBAccounts (
    ResourceId NVARCHAR(500) PRIMARY KEY,
    AccountName NVARCHAR(200) NOT NULL,
    DefaultConsistencyLevel NVARCHAR(50),
    DatabaseAccountOfferType NVARCHAR(50),
    TotalRegions INT,
    Regions NVARCHAR(500), -- Comma-separated
    ProvisionedThroughput_RU INT,
    AvgRU_30d DECIMAL(18,2),
    MaxRU_30d DECIMAL(18,2),
    AvgStorageSize_GB DECIMAL(18,2),
    TotalRequests_30d BIGINT,
    AutoscaleEnabled BIT,
    RecommendedThroughput INT,
    RecommendedRegions NVARCHAR(500),
    EstimatedMonthlyCost DECIMAL(18,2),
    RecommendedMonthlyCost DECIMAL(18,2),
    LastMetricsUpdate DATETIME2,
    CONSTRAINT FK_CosmosDBAccounts_Resource FOREIGN KEY (ResourceId) 
        REFERENCES Resources(ResourceId)
);

-- App Services detailed analysis
CREATE TABLE AppServices (
    ResourceId NVARCHAR(500) PRIMARY KEY,
    AppName NVARCHAR(200) NOT NULL,
    Kind NVARCHAR(50), -- app, functionapp, etc
    SkuName NVARCHAR(50) NOT NULL, -- B1, S1, P1v2, etc
    SkuTier NVARCHAR(50) NOT NULL,
    SkuCapacity INT,
    State NVARCHAR(20), -- Running, Stopped
    DefaultHostName NVARCHAR(500),
    AvgCPU_30d DECIMAL(5,2),
    MaxCPU_30d DECIMAL(5,2),
    AvgMemory_30d DECIMAL(5,2),
    MaxMemory_30d DECIMAL(5,2),
    AvgResponseTime_ms DECIMAL(10,2),
    TotalRequests_30d BIGINT,
    Http5xx_30d INT,
    RecommendedSKU NVARCHAR(50),
    RecommendedCapacity INT,
    EstimatedMonthlyCost DECIMAL(18,2),
    RecommendedMonthlyCost DECIMAL(18,2),
    LastMetricsUpdate DATETIME2,
    CONSTRAINT FK_AppServices_Resource FOREIGN KEY (ResourceId) 
        REFERENCES Resources(ResourceId)
);

-- AI/Cognitive Services detailed analysis
CREATE TABLE AIServices (
    ResourceId NVARCHAR(500) PRIMARY KEY,
    ServiceName NVARCHAR(200) NOT NULL,
    Kind NVARCHAR(100), -- OpenAI, ComputerVision, TextAnalytics, etc
    SkuName NVARCHAR(50) NOT NULL,
    TotalCalls_30d BIGINT,
    AvgCallsPerDay DECIMAL(18,2),
    SuccessRate_30d DECIMAL(5,2),
    AvgLatency_ms DECIMAL(10,2),
    TokensProcessed_30d BIGINT,
    EstimatedMonthlyCost DECIMAL(18,2),
    RecommendedSKU NVARCHAR(50),
    RecommendedMonthlyCost DECIMAL(18,2),
    LastMetricsUpdate DATETIME2,
    CONSTRAINT FK_AIServices_Resource FOREIGN KEY (ResourceId) 
        REFERENCES Resources(ResourceId)
);

-- ============================================================================
-- MACHINE LEARNING PREDICTIONS TABLES
-- ============================================================================

-- Cost predictions
CREATE TABLE CostPredictions (
    PredictionId BIGINT IDENTITY(1,1) PRIMARY KEY,
    ResourceId NVARCHAR(500) NOT NULL,
    SubscriptionId NVARCHAR(100) NOT NULL,
    PredictionDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    TargetYearMonth INT NOT NULL, -- YYYYMM
    PredictedCost DECIMAL(18,2) NOT NULL,
    ConfidenceInterval_Lower DECIMAL(18,2),
    ConfidenceInterval_Upper DECIMAL(18,2),
    ModelVersion NVARCHAR(20),
    Accuracy DECIMAL(5,2),
    CONSTRAINT FK_CostPredictions_Resource FOREIGN KEY (ResourceId) 
        REFERENCES Resources(ResourceId),
    CONSTRAINT FK_CostPredictions_Subscription FOREIGN KEY (SubscriptionId) 
        REFERENCES Subscriptions(SubscriptionId)
);

CREATE INDEX IX_CostPredictions_TargetYearMonth ON CostPredictions(TargetYearMonth);
CREATE INDEX IX_CostPredictions_ResourceId ON CostPredictions(ResourceId);

-- ============================================================================
-- WELL-ARCHITECTED FRAMEWORK TABLES
-- ============================================================================

-- WAF Assessment results
CREATE TABLE WAFAssessments (
    AssessmentId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    RunId UNIQUEIDENTIFIER NOT NULL,
    SubscriptionId NVARCHAR(100) NOT NULL,
    Pillar NVARCHAR(50) NOT NULL, -- Cost, Performance, Security, Reliability, Excellence
    Score DECIMAL(5,2) NOT NULL, -- 0-100
    TotalChecks INT NOT NULL,
    PassedChecks INT NOT NULL,
    FailedChecks INT NOT NULL,
    WarningChecks INT NOT NULL,
    AssessmentDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_WAFAssessments_Run FOREIGN KEY (RunId) 
        REFERENCES AnalysisRuns(RunId),
    CONSTRAINT FK_WAFAssessments_Subscription FOREIGN KEY (SubscriptionId) 
        REFERENCES Subscriptions(SubscriptionId)
);

CREATE INDEX IX_WAFAssessments_RunId ON WAFAssessments(RunId);
CREATE INDEX IX_WAFAssessments_Pillar ON WAFAssessments(Pillar);

-- ============================================================================
-- REPORTING TABLES
-- ============================================================================

-- Executive summary snapshots
CREATE TABLE ExecutiveSummaries (
    SummaryId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    RunId UNIQUEIDENTIFIER NOT NULL,
    GeneratedDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    TotalSubscriptions INT NOT NULL,
    TotalResources INT NOT NULL,
    TotalMonthlyCost DECIMAL(18,2) NOT NULL,
    TotalPotentialSavings DECIMAL(18,2) NOT NULL,
    SavingsPercentage DECIMAL(5,2) NOT NULL,
    TotalRecommendations INT NOT NULL,
    CriticalRecommendations INT NOT NULL,
    HighRecommendations INT NOT NULL,
    TopCostResources NVARCHAR(MAX), -- JSON array
    TopSavingsOpportunities NVARCHAR(MAX), -- JSON array
    WAFScoreOverall DECIMAL(5,2),
    WAFScoreCost DECIMAL(5,2),
    WAFScorePerformance DECIMAL(5,2),
    WAFScoreSecurity DECIMAL(5,2),
    WAFScoreReliability DECIMAL(5,2),
    WAFScoreExcellence DECIMAL(5,2),
    CONSTRAINT FK_ExecutiveSummaries_Run FOREIGN KEY (RunId) 
        REFERENCES AnalysisRuns(RunId)
);

-- ============================================================================
-- AUDIT AND LOGGING TABLES
-- ============================================================================

-- Activity log
CREATE TABLE ActivityLog (
    LogId BIGINT IDENTITY(1,1) PRIMARY KEY,
    Timestamp DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    Category NVARCHAR(50) NOT NULL, -- System, Analysis, Recommendation, User
    Action NVARCHAR(100) NOT NULL,
    ResourceId NVARCHAR(500),
    UserId NVARCHAR(100),
    Details NVARCHAR(MAX), -- JSON
    Severity NVARCHAR(20) NOT NULL DEFAULT 'Info' -- Debug, Info, Warning, Error, Critical
);

CREATE INDEX IX_ActivityLog_Timestamp ON ActivityLog(Timestamp DESC);
CREATE INDEX IX_ActivityLog_Category ON ActivityLog(Category);
CREATE INDEX IX_ActivityLog_Severity ON ActivityLog(Severity);

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

-- Latest analysis summary
GO
CREATE VIEW vw_LatestAnalysisSummary AS
SELECT TOP 1
    ar.RunId,
    ar.StartTime,
    ar.EndTime,
    ar.Status,
    ar.TotalSubscriptions,
    ar.TotalResources,
    ar.TotalRecommendations,
    ar.EstimatedMonthlySavings,
    ar.ExecutionTimeSeconds,
    COUNT(DISTINCT r.ResourceId) AS UniqueResourcesWithRecommendations,
    SUM(CASE WHEN r.Severity = 'Critical' THEN 1 ELSE 0 END) AS CriticalCount,
    SUM(CASE WHEN r.Severity = 'High' THEN 1 ELSE 0 END) AS HighCount,
    SUM(CASE WHEN r.Severity = 'Medium' THEN 1 ELSE 0 END) AS MediumCount,
    SUM(CASE WHEN r.Severity = 'Low' THEN 1 ELSE 0 END) AS LowCount
FROM AnalysisRuns ar
LEFT JOIN Recommendations r ON ar.RunId = r.RunId
WHERE ar.Status = 'Completed'
GROUP BY ar.RunId, ar.StartTime, ar.EndTime, ar.Status, ar.TotalSubscriptions, 
         ar.TotalResources, ar.TotalRecommendations, ar.EstimatedMonthlySavings, 
         ar.ExecutionTimeSeconds
ORDER BY ar.EndTime DESC;
GO

-- Top cost resources
GO
CREATE VIEW vw_TopCostResources AS
SELECT TOP 100
    r.ResourceId,
    r.ResourceName,
    r.ResourceType,
    r.ResourceGroup,
    r.Location,
    s.SubscriptionName,
    mc.TotalCost AS LastMonthCost,
    mc.YearMonth,
    ROW_NUMBER() OVER (ORDER BY mc.TotalCost DESC) AS CostRank
FROM Resources r
INNER JOIN Subscriptions s ON r.SubscriptionId = s.SubscriptionId
INNER JOIN (
    SELECT ResourceId, YearMonth, TotalCost,
           ROW_NUMBER() OVER (PARTITION BY ResourceId ORDER BY YearMonth DESC) AS rn
    FROM MonthlyCosts
) mc ON r.ResourceId = mc.ResourceId AND mc.rn = 1
WHERE r.IsDeleted = 0
ORDER BY mc.TotalCost DESC;
GO

-- Recommendations summary by category
GO
CREATE VIEW vw_RecommendationsByCategory AS
SELECT 
    Category,
    Severity,
    COUNT(*) AS RecommendationCount,
    SUM(EstimatedMonthlySavings) AS TotalMonthlySavings,
    SUM(EstimatedAnnualSavings) AS TotalAnnualSavings,
    AVG(ConfidenceScore) AS AvgConfidenceScore
FROM Recommendations
WHERE Status = 'Open'
GROUP BY Category, Severity;
GO

-- Subscription health overview
GO
CREATE VIEW vw_SubscriptionHealthOverview AS
SELECT 
    s.SubscriptionId,
    s.SubscriptionName,
    COUNT(DISTINCT r.ResourceId) AS TotalResources,
    COALESCE(SUM(mc.TotalCost), 0) AS LastMonthTotalCost,
    COUNT(rec.RecommendationId) AS OpenRecommendations,
    COALESCE(SUM(rec.EstimatedMonthlySavings), 0) AS PotentialMonthlySavings,
    CASE 
        WHEN COALESCE(SUM(mc.TotalCost), 0) > 0 
        THEN (COALESCE(SUM(rec.EstimatedMonthlySavings), 0) / SUM(mc.TotalCost)) * 100 
        ELSE 0 
    END AS SavingsPercentage,
    s.LastScanned
FROM Subscriptions s
LEFT JOIN Resources r ON s.SubscriptionId = r.SubscriptionId AND r.IsDeleted = 0
LEFT JOIN (
    SELECT ResourceId, SUM(TotalCost) AS TotalCost
    FROM MonthlyCosts
    WHERE YearMonth = (SELECT MAX(YearMonth) FROM MonthlyCosts)
    GROUP BY ResourceId
) mc ON r.ResourceId = mc.ResourceId
LEFT JOIN Recommendations rec ON s.SubscriptionId = rec.SubscriptionId AND rec.Status = 'Open'
WHERE s.IsActive = 1
GROUP BY s.SubscriptionId, s.SubscriptionName, s.LastScanned;
GO

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

-- Initialize new installation
GO
CREATE PROCEDURE sp_InitializeInstallation
    @TenantId NVARCHAR(100),
    @LicenseKey NVARCHAR(200),
    @CustomerName NVARCHAR(200),
    @ContactEmail NVARCHAR(200),
    @Version NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    IF NOT EXISTS (SELECT 1 FROM Installation WHERE TenantId = @TenantId)
    BEGIN
        INSERT INTO Installation (TenantId, LicenseKey, CustomerName, ContactEmail, Version, LicenseStatus)
        VALUES (@TenantId, @LicenseKey, @CustomerName, @ContactEmail, @Version, 'Active');
        
        INSERT INTO ActivityLog (Category, Action, Details, Severity)
        VALUES ('System', 'InstallationInitialized', 
                JSON_OBJECT('TenantId', @TenantId, 'CustomerName', @CustomerName),
                'Info');
    END
END;
GO

-- Start new analysis run
GO
CREATE PROCEDURE sp_StartAnalysisRun
    @RunId UNIQUEIDENTIFIER OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    SET @RunId = NEWID();
    
    INSERT INTO AnalysisRuns (RunId, StartTime, Status)
    VALUES (@RunId, GETUTCDATE(), 'Running');
    
    INSERT INTO ActivityLog (Category, Action, Details, Severity)
    VALUES ('Analysis', 'AnalysisStarted', 
            JSON_OBJECT('RunId', CAST(@RunId AS NVARCHAR(50))),
            'Info');
    
    SELECT @RunId AS RunId;
END;
GO

-- Complete analysis run
GO
CREATE PROCEDURE sp_CompleteAnalysisRun
    @RunId UNIQUEIDENTIFIER,
    @Status NVARCHAR(20),
    @ErrorMessage NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @TotalSubs INT, @TotalRes INT, @TotalRecs INT, @TotalSavings DECIMAL(18,2);
    
    SELECT @TotalSubs = COUNT(DISTINCT SubscriptionId) FROM AnalysisRunSubscriptions WHERE RunId = @RunId;
    SELECT @TotalRes = SUM(ResourcesAnalyzed) FROM AnalysisRunSubscriptions WHERE RunId = @RunId;
    SELECT @TotalRecs = COUNT(*) FROM Recommendations WHERE RunId = @RunId;
    SELECT @TotalSavings = COALESCE(SUM(EstimatedMonthlySavings), 0) FROM Recommendations WHERE RunId = @RunId;
    
    UPDATE AnalysisRuns
    SET EndTime = GETUTCDATE(),
        Status = @Status,
        TotalSubscriptions = @TotalSubs,
        TotalResources = @TotalRes,
        TotalRecommendations = @TotalRecs,
        EstimatedMonthlySavings = @TotalSavings,
        ExecutionTimeSeconds = DATEDIFF(SECOND, StartTime, GETUTCDATE()),
        ErrorMessage = @ErrorMessage
    WHERE RunId = @RunId;
    
    INSERT INTO ActivityLog (Category, Action, Details, Severity)
    VALUES ('Analysis', 'AnalysisCompleted', 
            JSON_OBJECT('RunId', CAST(@RunId AS NVARCHAR(50)), 
                       'Status', @Status, 
                       'TotalRecommendations', @TotalRecs,
                       'EstimatedMonthlySavings', @TotalSavings),
            CASE WHEN @Status = 'Failed' THEN 'Error' ELSE 'Info' END);
END;
GO

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Create sample installation (for testing)
-- Comment out or remove in production
/*
INSERT INTO Installation (TenantId, LicenseKey, CustomerName, ContactEmail, Version, LicenseStatus)
VALUES ('00000000-0000-0000-0000-000000000000', 
        'FINOPS-PROF-TEST-ABC123', 
        'Test Customer', 
        'test@example.com', 
        '1.0.0', 
        'Active');
*/

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

PRINT 'FinOps Insight Engine database schema created successfully!';
PRINT 'Tables created: 23';
PRINT 'Views created: 4';
PRINT 'Stored Procedures created: 3';
