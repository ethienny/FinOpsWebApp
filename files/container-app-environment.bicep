// ============================================================================
// Container Apps Environment Module
// ============================================================================

param location string
param containerAppEnvName string
param logAnalyticsCustomerId string
param logAnalyticsPrimaryKey string
param tags object

// ============================================================================
// CONTAINER APP ENVIRONMENT
// ============================================================================

resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: containerAppEnvName
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsCustomerId
        sharedKey: logAnalyticsPrimaryKey
      }
    }
    zoneRedundant: false
    workloadProfiles: [
      {
        name: 'Consumption'
        workloadProfileType: 'Consumption'
      }
    ]
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output containerAppEnvId string = containerAppEnv.id
output containerAppEnvName string = containerAppEnv.name
output defaultDomain string = containerAppEnv.properties.defaultDomain
output staticIp string = containerAppEnv.properties.staticIp
