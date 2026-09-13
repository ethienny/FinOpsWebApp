// ============================================================================
// FinOps WebApp - Infraestrutura mínima (custo baixo)
// Escopo: Resource Group (crie o RG antes com `az group create`)
// Recursos: Azure SQL Database (Serverless) + App Service (Linux, Node)
// ============================================================================

@description('Região do Azure para os recursos')
param location string = resourceGroup().location

@description('Prefixo curto usado nos nomes dos recursos (só letras minúsculas e números)')
@minLength(3)
@maxLength(15)
param namePrefix string

@description('Usuário administrador do SQL Server lógico')
param sqlAdminUsername string = 'finopsadmin'

@description('Senha do administrador do SQL Server (defina em tempo de deploy, nunca commitar)')
@secure()
param sqlAdminPassword string

@description('Seu IP público atual, para liberar acesso administrativo ao SQL (opcional). Deixe vazio para pular.')
param clientIpAddress string = ''

@description('SKU do App Service Plan. B3 (7GB RAM) é o mínimo confortável para este app: o carregamento inicial dos dados do SQL pica ~3.7GB.')
param appServicePlanSku string = 'B3'

@description('Se falso, provisiona só o SQL Database (útil quando a cota de App Service Plan ainda não foi liberada)')
param deployWebApp bool = true

var isFreeTier = appServicePlanSku == 'F1'

var uniqueSuffix = uniqueString(resourceGroup().id)
var sqlServerName = 'sql-${namePrefix}-${uniqueSuffix}'
var sqlDatabaseName = 'finopsdb'
var appServicePlanName = 'plan-${namePrefix}-${uniqueSuffix}'
var webAppName = 'app-${namePrefix}-${uniqueSuffix}'

// ----------------------------------------------------------------------------
// SQL Server (lógico) + Database Serverless
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
    maxSizeBytes: 34359738368 // 32GB (serverless permite crescer sem custo extra fixo)
    autoPauseDelay: 60 // minutos ociosos até pausar (custo zero de compute enquanto pausado)
    minCapacity: json('0.5') // vCores mínimos ao "acordar"
    zoneRedundant: false
    readScale: 'Disabled'
    requestedBackupStorageRedundancy: 'Local'
  }
}

// Política "Proxy": sem isso, o Azure SQL redireciona o cliente para uma porta
// alta (11000-11999) após o handshake em 1433, e a rede do App Service
// (compute compartilhado, sem VNet) bloqueia esse redirecionamento — o que
// aparece como ECONNRESET/"socket hang up" no app.
resource sqlConnectionPolicy 'Microsoft.Sql/servers/connectionPolicies@2023-05-01-preview' = {
  parent: sqlServer
  name: 'default'
  properties: {
    connectionType: 'Proxy'
  }
}

// ----------------------------------------------------------------------------
// App Service (Linux, Node) para o Next.js
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
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: 'false' } // deploy já vem pré-buildado (output standalone)
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
