// ============================================================================
// API Container App Module
// ============================================================================

param location string
param containerAppName string
param containerAppEnvId string
param managedIdentityId string
param containerRegistryServer string
param sqlServerFqdn string
param sqlDatabaseName string
param serviceBusNamespace string
param keyVaultName string
param storageAccountName string
param appInsightsConnectionString string
param environmentName string
param tags object

// ============================================================================
// API CONTAINER APP
// ============================================================================

resource apiContainerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: containerAppName
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentityId}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerAppEnvId
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 8080
        transport: 'auto'
        allowInsecure: false
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
      }
      registries: [
        {
          server: containerRegistryServer
          identity: managedIdentityId
        }
      ]
      secrets: []
    }
    template: {
      containers: [
        {
          name: 'finops-api'
          image: '${containerRegistryServer}/finops-api:latest'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'ASPNETCORE_ENVIRONMENT'
              value: environmentName
            }
            {
              name: 'ASPNETCORE_URLS'
              value: 'http://+:8080'
            }
            {
              name: 'SqlServer__Server'
              value: sqlServerFqdn
            }
            {
              name: 'SqlServer__Database'
              value: sqlDatabaseName
            }
            {
              name: 'SqlServer__UseAzureADAuthentication'
              value: 'true'
            }
            {
              name: 'ServiceBus__Namespace'
              value: '${serviceBusNamespace}.servicebus.windows.net'
            }
            {
              name: 'ServiceBus__UseAzureADAuthentication'
              value: 'true'
            }
            {
              name: 'KeyVault__VaultUri'
              value: 'https://${keyVaultName}.vault.azure.net/'
            }
            {
              name: 'Storage__AccountName'
              value: storageAccountName
            }
            {
              name: 'Storage__UseAzureADAuthentication'
              value: 'true'
            }
            {
              name: 'ApplicationInsights__ConnectionString'
              value: appInsightsConnectionString
            }
            {
              name: 'AZURE_CLIENT_ID'
              value: reference(managedIdentityId, '2023-01-31').clientId
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 8080
                scheme: 'HTTP'
              }
              initialDelaySeconds: 30
              periodSeconds: 10
              timeoutSeconds: 5
              failureThreshold: 3
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/health/ready'
                port: 8080
                scheme: 'HTTP'
              }
              initialDelaySeconds: 15
              periodSeconds: 5
              timeoutSeconds: 3
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 10
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '100'
              }
            }
          }
        ]
      }
    }
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output containerAppName string = apiContainerApp.name
output containerAppFqdn string = apiContainerApp.properties.configuration.ingress.fqdn
output containerAppUrl string = 'https://${apiContainerApp.properties.configuration.ingress.fqdn}'
