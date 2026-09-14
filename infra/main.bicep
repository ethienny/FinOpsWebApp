// ============================================================================
// FinOps WebApp: minimal, low cost infrastructure
// Scope: resource group (create it first with `az group create`)
// Resources: Azure SQL Database (serverless) and App Service (Linux, Node)
// ============================================================================

@description('Azure region for the resources')
param location string = resourceGroup().location

@description('Short prefix used in resource names (lowercase letters and digits only)')
@minLength(3)
@maxLength(15)
param namePrefix string

@description('Administrator login of the logical SQL Server')
param sqlAdminUsername string = 'finopsadmin'

@description('SQL Server administrator password (set at deploy time, never commit it)')
@secure()
param sqlAdminPassword string

@description('Your current public IP, to allow administrative access to SQL (optional). Leave empty to skip.')
param clientIpAddress string = ''

@description('App Service Plan SKU. B3 (7GB RAM) is the comfortable minimum for this app: the initial data load from SQL peaks around 3.7GB.')
param appServicePlanSku string = 'B3'

@description('When false, provisions only the SQL Database (useful while the App Service Plan quota is not yet granted)')
param deployWebApp bool = true

var isFreeTier = appServicePlanSku == 'F1'

var uniqueSuffix = uniqueString(resourceGroup().id)
var sqlServerName = 'sql-${namePrefix}-${uniqueSuffix}'
var sqlDatabaseName = 'finopsdb'
var appServicePlanName = 'plan-${namePrefix}-${uniqueSuffix}'
var webAppName = 'app-${namePrefix}-${uniqueSuffix}'

// ----------------------------------------------------------------------------
// Logical SQL Server and serverless database
// ----------------------------------------------------------------------------

resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: sqlAdminUsername
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
}

resource firewallAllowAzureServices 'Microsoft.Sql/servers/firewallRules@2023-05-01-preview' = {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource firewallAllowClientIp 'Microsoft.Sql/servers/firewallRules@2023-05-01-preview' = if (!empty(clientIpAddress)) {
  parent: sqlServer
  name: 'AllowClientIp'
  properties: {
    startIpAddress: clientIpAddress
    endIpAddress: clientIpAddress
  }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-05-01-preview' = {
  parent: sqlServer
  name: sqlDatabaseName
  location: location
  sku: {
    name: 'GP_S_Gen5'
    tier: 'GeneralPurpose'
    family: 'Gen5'
    capacity: 1
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: 34359738368 // 32GB (serverless grows without a fixed extra cost)
    autoPauseDelay: 60 // idle minutes before pausing (no compute cost while paused)
    minCapacity: json('0.5') // minimum vCores when waking up
    zoneRedundant: false
    readScale: 'Disabled'
    requestedBackupStorageRedundancy: 'Local'
  }
}

// Proxy connection policy: without it Azure SQL redirects the client to a
// high port (11000 to 11999) after the handshake on 1433, and the App Service
// network (shared compute, no VNet) blocks that redirect, which shows up in
// the app as ECONNRESET or "socket hang up".
resource sqlConnectionPolicy 'Microsoft.Sql/servers/connectionPolicies@2023-05-01-preview' = {
  parent: sqlServer
  name: 'default'
  properties: {
    connectionType: 'Proxy'
  }
}

// ----------------------------------------------------------------------------
// App Service (Linux, Node) for Next.js
// ----------------------------------------------------------------------------

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = if (deployWebApp) {
  name: appServicePlanName
  location: location
  kind: 'linux'
  sku: {
    name: appServicePlanSku
  }
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2023-12-01' = if (deployWebApp) {
  name: webAppName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      alwaysOn: !isFreeTier
      appCommandLine: 'node server.js'
      healthCheckPath: '/api/health'
      appSettings: [
        { name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~20' }
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: 'false' } // the deploy is already built (standalone output)
        { name: 'WEBSITES_CONTAINER_START_TIME_LIMIT', value: '400' }
        { name: 'DATA_SOURCE', value: 'sql' }
        { name: 'AZURE_SQL_SERVER', value: sqlServer.properties.fullyQualifiedDomainName }
        { name: 'AZURE_SQL_DATABASE', value: sqlDatabaseName }
        { name: 'AZURE_SQL_USER', value: sqlAdminUsername }
        { name: 'AZURE_SQL_PASSWORD', value: sqlAdminPassword }
        { name: 'NODE_OPTIONS', value: '--max-old-space-size=5120' }
      ]
    }
  }
}

// ----------------------------------------------------------------------------
// Outputs
// ----------------------------------------------------------------------------

output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
output sqlDatabaseName string = sqlDatabaseName
output webAppName string = deployWebApp ? webApp.name : ''
output webAppUrl string = deployWebApp ? 'https://${webApp.properties.defaultHostName}' : ''
