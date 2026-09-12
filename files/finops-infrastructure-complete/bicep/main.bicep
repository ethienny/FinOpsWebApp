// ============================================================================
// FinOps Insight Engine - Main Infrastructure Template
// Version: 1.0
// Description: Complete Azure infrastructure deployment
// ============================================================================

targetScope = 'subscription'

// ============================================================================
// PARAMETERS
// ============================================================================

@description('Environment name (dev, staging, prod)')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environmentName string = 'dev'

@description('Primary Azure region for deployment')
param location string = 'brazilsouth'

@description('Customer/Tenant identifier (will be part of resource names)')
@minLength(3)
@maxLength(10)
param customerPrefix string

@description('License key for this installation')
@secure()
param licenseKey string

@description('Customer name')
param customerName string

@description('Customer contact email')
param contactEmail string

@description('SQL Administrator username')
param sqlAdminUsername string = 'finopsadmin'

@description('SQL Administrator password')
@secure()
param sqlAdminPassword string

@description('Tags to apply to all resources')
param tags object = {
  Environment: environmentName
  ManagedBy: 'FinOpsInsightEngine'
  Version: '1.0'
}

// ============================================================================
// VARIABLES
// ============================================================================

var resourceGroupName = 'rg-finops-${customerPrefix}-${environmentName}'
var uniqueSuffix = uniqueString(subscription().subscriptionId, resourceGroupName)

// Resource naming
var sqlServerName = 'sql-finops-${customerPrefix}-${uniqueSuffix}'
var sqlDatabaseName = 'finopsdb'
var storageAccountName = 'stfinops${customerPrefix}${uniqueSuffix}'
var keyVaultName = 'kv-finops-${customerPrefix}-${uniqueSuffix}'
var serviceBusNamespace = 'sb-finops-${customerPrefix}-${uniqueSuffix}'
var containerRegistryName = 'crfinops${customerPrefix}${uniqueSuffix}'
var logAnalyticsName = 'law-finops-${customerPrefix}-${environmentName}'
var appInsightsName = 'ai-finops-${customerPrefix}-${environmentName}'
var containerAppEnvName = 'cae-finops-${customerPrefix}-${environmentName}'
var managedIdentityName = 'id-finops-${customerPrefix}-${environmentName}'

// Container App names
var apiContainerAppName = 'ca-finops-api-${environmentName}'
var workerContainerAppName = 'ca-finops-worker-${environmentName}'

// Service Bus queue names
var analysisQueueName = 'analysis-jobs'
var notificationQueueName = 'notifications'

// ============================================================================
// RESOURCE GROUP
// ============================================================================

resource resourceGroup 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

// ============================================================================
// MODULES
// ============================================================================

// Managed Identity
module managedIdentity 'modules/managed-identity.bicep' = {
  name: 'deploy-managed-identity'
  scope: resourceGroup
  params: {
    location: location
    managedIdentityName: managedIdentityName
    tags: tags
  }
}

// Monitoring (Log Analytics + Application Insights)
module monitoring 'modules/monitoring.bicep' = {
  name: 'deploy-monitoring'
  scope: resourceGroup
  params: {
    location: location
    logAnalyticsName: logAnalyticsName
    appInsightsName: appInsightsName
    tags: tags
  }
}

// Storage Account
module storage 'modules/storage.bicep' = {
  name: 'deploy-storage'
  scope: resourceGroup
  params: {
    location: location
    storageAccountName: storageAccountName
    tags: tags
  }
}

// Key Vault
module keyVault 'modules/keyvault.bicep' = {
  name: 'deploy-keyvault'
  scope: resourceGroup
  params: {
    location: location
    keyVaultName: keyVaultName
    managedIdentityPrincipalId: managedIdentity.outputs.principalId
    sqlAdminPassword: sqlAdminPassword
    licenseKey: licenseKey
    tags: tags
  }
}

// SQL Server and Database
module sqlServer 'modules/sql.bicep' = {
  name: 'deploy-sql'
  scope: resourceGroup
  params: {
    location: location
    sqlServerName: sqlServerName
    sqlDatabaseName: sqlDatabaseName
    sqlAdminUsername: sqlAdminUsername
    sqlAdminPassword: sqlAdminPassword
    managedIdentityPrincipalId: managedIdentity.outputs.principalId
    managedIdentityName: managedIdentityName
    tags: tags
  }
}

// Service Bus
module serviceBus 'modules/servicebus.bicep' = {
  name: 'deploy-servicebus'
  scope: resourceGroup
  params: {
    location: location
    serviceBusNamespace: serviceBusNamespace
    analysisQueueName: analysisQueueName
    notificationQueueName: notificationQueueName
    managedIdentityPrincipalId: managedIdentity.outputs.principalId
    tags: tags
  }
}

// Container Registry
module containerRegistry 'modules/container-registry.bicep' = {
  name: 'deploy-container-registry'
  scope: resourceGroup
  params: {
    location: location
    containerRegistryName: containerRegistryName
    managedIdentityPrincipalId: managedIdentity.outputs.principalId
    tags: tags
  }
}

// Container Apps Environment
module containerAppEnv 'modules/container-app-environment.bicep' = {
  name: 'deploy-container-app-env'
  scope: resourceGroup
  params: {
    location: location
    containerAppEnvName: containerAppEnvName
    logAnalyticsCustomerId: monitoring.outputs.logAnalyticsCustomerId
    logAnalyticsPrimaryKey: monitoring.outputs.logAnalyticsPrimaryKey
    tags: tags
  }
}

// API Container App
module apiContainerApp 'modules/container-app-api.bicep' = {
  name: 'deploy-api-container-app'
  scope: resourceGroup
  params: {
    location: location
    containerAppName: apiContainerAppName
    containerAppEnvId: containerAppEnv.outputs.containerAppEnvId
    managedIdentityId: managedIdentity.outputs.identityId
    containerRegistryServer: containerRegistry.outputs.loginServer
    sqlServerFqdn: sqlServer.outputs.sqlServerFqdn
    sqlDatabaseName: sqlDatabaseName
    serviceBusNamespace: serviceBus.outputs.serviceBusNamespace
    keyVaultName: keyVaultName
    storageAccountName: storageAccountName
    appInsightsConnectionString: monitoring.outputs.appInsightsConnectionString
    environmentName: environmentName
    tags: tags
  }
}

// Worker Container App
module workerContainerApp 'modules/container-app-worker.bicep' = {
  name: 'deploy-worker-container-app'
  scope: resourceGroup
  params: {
    location: location
    containerAppName: workerContainerAppName
    containerAppEnvId: containerAppEnv.outputs.containerAppEnvId
    managedIdentityId: managedIdentity.outputs.identityId
    containerRegistryServer: containerRegistry.outputs.loginServer
    sqlServerFqdn: sqlServer.outputs.sqlServerFqdn
    sqlDatabaseName: sqlDatabaseName
    serviceBusNamespace: serviceBus.outputs.serviceBusNamespace
    keyVaultName: keyVaultName
    storageAccountName: storageAccountName
    appInsightsConnectionString: monitoring.outputs.appInsightsConnectionString
    analysisQueueName: analysisQueueName
    environmentName: environmentName
    tags: tags
  }
}

// Database Initialization Job (runs schema creation)
module databaseInit 'modules/database-init-job.bicep' = {
  name: 'deploy-database-init'
  scope: resourceGroup
  params: {
    location: location
    containerAppEnvId: containerAppEnv.outputs.containerAppEnvId
    managedIdentityId: managedIdentity.outputs.identityId
    containerRegistryServer: containerRegistry.outputs.loginServer
    sqlServerFqdn: sqlServer.outputs.sqlServerFqdn
    sqlDatabaseName: sqlDatabaseName
    sqlAdminUsername: sqlAdminUsername
    keyVaultName: keyVaultName
    customerName: customerName
    contactEmail: contactEmail
    licenseKey: licenseKey
    tags: tags
  }
  dependsOn: [
    sqlServer
    keyVault
  ]
}

// ============================================================================
// OUTPUTS
// ============================================================================

output resourceGroupName string = resourceGroupName
output sqlServerFqdn string = sqlServer.outputs.sqlServerFqdn
output sqlDatabaseName string = sqlDatabaseName
output storageAccountName string = storageAccountName
output keyVaultName string = keyVaultName
output keyVaultUri string = keyVault.outputs.keyVaultUri
output serviceBusNamespace string = serviceBus.outputs.serviceBusNamespace
output containerRegistryLoginServer string = containerRegistry.outputs.loginServer
output managedIdentityClientId string = managedIdentity.outputs.clientId
output managedIdentityPrincipalId string = managedIdentity.outputs.principalId
output apiContainerAppFqdn string = apiContainerApp.outputs.containerAppFqdn
output workerContainerAppName string = workerContainerAppName
output appInsightsConnectionString string = monitoring.outputs.appInsightsConnectionString
output appInsightsInstrumentationKey string = monitoring.outputs.appInsightsInstrumentationKey

// Summary output
output deploymentSummary object = {
  resourceGroup: resourceGroupName
  location: location
  environment: environmentName
  customer: customerPrefix
  apiEndpoint: 'https://${apiContainerApp.outputs.containerAppFqdn}'
  sqlServer: sqlServer.outputs.sqlServerFqdn
  keyVault: keyVault.outputs.keyVaultUri
  containerRegistry: containerRegistry.outputs.loginServer
  managedIdentityId: managedIdentity.outputs.clientId
}
