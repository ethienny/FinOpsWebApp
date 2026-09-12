#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Deploy FinOps Insight Engine Infrastructure to Azure

.DESCRIPTION
    This script deploys the complete FinOps Insight Engine infrastructure to Azure
    including SQL Database, Container Apps, Storage, Key Vault, and all required services.

.PARAMETER SubscriptionId
    Azure Subscription ID where resources will be deployed

.PARAMETER ParametersFile
    Path to the parameters JSON file (default: parameters.dev.json)

.PARAMETER Location
    Azure region for deployment (default: brazilsouth)

.PARAMETER WhatIf
    Run in simulation mode without creating resources

.EXAMPLE
    ./deploy.ps1 -SubscriptionId "00000000-0000-0000-0000-000000000000"

.EXAMPLE
    ./deploy.ps1 -SubscriptionId "00000000-0000-0000-0000-000000000000" -ParametersFile "parameters.prod.json" -Location "eastus"

.EXAMPLE
    ./deploy.ps1 -SubscriptionId "00000000-0000-0000-0000-000000000000" -WhatIf

#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$SubscriptionId,

    [Parameter(Mandatory = $false)]
    [string]$ParametersFile = "parameters.dev.json",

    [Parameter(Mandatory = $false)]
    [string]$Location = "brazilsouth",

    [Parameter(Mandatory = $false)]
    [switch]$WhatIf
)

# ============================================================================
# CONFIGURATION
# ============================================================================

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$DeploymentName = "finops-deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$BicepFile = "main.bicep"

# ============================================================================
# FUNCTIONS
# ============================================================================

function Write-Step {
    param([string]$Message)
    Write-Host "`n===================================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "===================================================`n" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Blue
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# ============================================================================
# PRE-FLIGHT CHECKS
# ============================================================================

Write-Step "Pre-flight Checks"

# Check if Azure CLI is installed
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Error "Azure CLI is not installed. Please install it from: https://aka.ms/installazurecli"
    exit 1
}
Write-Success "Azure CLI is installed"

# Check if logged in to Azure
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Warning "Not logged in to Azure. Running 'az login'..."
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to log in to Azure"
        exit 1
    }
}
Write-Success "Logged in to Azure as: $($account.user.name)"

# Check if subscription exists
Write-Info "Setting subscription to: $SubscriptionId"
az account set --subscription $SubscriptionId 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Subscription $SubscriptionId not found or not accessible"
    exit 1
}
$subscription = az account show | ConvertFrom-Json
Write-Success "Subscription set to: $($subscription.name)"

# Check if Bicep file exists
if (-not (Test-Path $BicepFile)) {
    Write-Error "Bicep file not found: $BicepFile"
    exit 1
}
Write-Success "Bicep file found: $BicepFile"

# Check if parameters file exists
if (-not (Test-Path $ParametersFile)) {
    Write-Error "Parameters file not found: $ParametersFile"
    exit 1
}
Write-Success "Parameters file found: $ParametersFile"

# Validate Bicep file
Write-Info "Validating Bicep template..."
az bicep build --file $BicepFile 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Bicep template validation failed"
    exit 1
}
Write-Success "Bicep template is valid"

# ============================================================================
# DEPLOYMENT
# ============================================================================

Write-Step "Starting Deployment"

$deployParams = @(
    "deployment", "sub", "create"
    "--name", $DeploymentName
    "--location", $Location
    "--template-file", $BicepFile
    "--parameters", $ParametersFile
)

if ($WhatIf) {
    Write-Warning "Running in WHAT-IF mode (no resources will be created)"
    $deployParams += "--what-if"
}

Write-Info "Deployment Name: $DeploymentName"
Write-Info "Location: $Location"
Write-Info "Bicep File: $BicepFile"
Write-Info "Parameters File: $ParametersFile"

Write-Host "`nStarting Azure deployment..." -ForegroundColor Yellow
Write-Host "This may take 10-15 minutes..." -ForegroundColor Yellow

# Execute deployment
$deploymentOutput = az @deployParams 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Error "Deployment failed!"
    Write-Host $deploymentOutput -ForegroundColor Red
    exit 1
}

if ($WhatIf) {
    Write-Host $deploymentOutput
    Write-Success "WHAT-IF deployment completed successfully"
    exit 0
}

# ============================================================================
# GET DEPLOYMENT OUTPUTS
# ============================================================================

Write-Step "Retrieving Deployment Outputs"

$outputs = az deployment sub show `
    --name $DeploymentName `
    --query "properties.outputs" `
    | ConvertFrom-Json

if (-not $outputs) {
    Write-Warning "Could not retrieve deployment outputs"
} else {
    Write-Success "Deployment completed successfully!"
    
    Write-Host "`n" -NoNewline
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "           DEPLOYMENT SUMMARY                      " -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
    
    Write-Host "`nResource Group:" -ForegroundColor Cyan
    Write-Host "  $($outputs.resourceGroupName.value)" -ForegroundColor White
    
    Write-Host "`nAPI Endpoint:" -ForegroundColor Cyan
    Write-Host "  $($outputs.deploymentSummary.value.apiEndpoint)" -ForegroundColor White
    
    Write-Host "`nSQL Server:" -ForegroundColor Cyan
    Write-Host "  $($outputs.sqlServerFqdn.value)" -ForegroundColor White
    Write-Host "  Database: $($outputs.sqlDatabaseName.value)" -ForegroundColor White
    
    Write-Host "`nKey Vault:" -ForegroundColor Cyan
    Write-Host "  $($outputs.keyVaultUri.value)" -ForegroundColor White
    
    Write-Host "`nContainer Registry:" -ForegroundColor Cyan
    Write-Host "  $($outputs.containerRegistryLoginServer.value)" -ForegroundColor White
    
    Write-Host "`nManaged Identity:" -ForegroundColor Cyan
    Write-Host "  Client ID: $($outputs.managedIdentityClientId.value)" -ForegroundColor White
    
    Write-Host "`nApplication Insights:" -ForegroundColor Cyan
    Write-Host "  Instrumentation Key: $($outputs.appInsightsInstrumentationKey.value)" -ForegroundColor White
    
    Write-Host "`n" -NoNewline
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
}

# ============================================================================
# NEXT STEPS
# ============================================================================

Write-Step "Next Steps"

Write-Host "1. Build and push Docker images to Container Registry:" -ForegroundColor Yellow
Write-Host "   az acr login --name $($outputs.containerRegistryLoginServer.value -replace '\.azurecr\.io', '')" -ForegroundColor White
Write-Host "   docker build -t finops-api:latest ./api" -ForegroundColor White
Write-Host "   docker tag finops-api:latest $($outputs.containerRegistryLoginServer.value)/finops-api:latest" -ForegroundColor White
Write-Host "   docker push $($outputs.containerRegistryLoginServer.value)/finops-api:latest" -ForegroundColor White

Write-Host "`n2. Initialize database schema:" -ForegroundColor Yellow
Write-Host "   Run the database initialization job or execute schema.sql manually" -ForegroundColor White

Write-Host "`n3. Test the API:" -ForegroundColor Yellow
Write-Host "   curl https://$($outputs.apiContainerAppFqdn.value)/health" -ForegroundColor White

Write-Host "`n4. Monitor the deployment:" -ForegroundColor Yellow
Write-Host "   az portal open" -ForegroundColor White
Write-Host "   Navigate to Resource Group: $($outputs.resourceGroupName.value)" -ForegroundColor White

Write-Success "`nDeployment script completed!"

# ============================================================================
# SAVE OUTPUTS TO FILE
# ============================================================================

$outputFile = "deployment-outputs-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$outputs | ConvertTo-Json -Depth 10 | Out-File $outputFile
Write-Info "Deployment outputs saved to: $outputFile"
