// ============================================================================
// Worker Container App Module (PowerShell Engine)
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
param analysisQueueName string
param environmentName string
param tags object

// ============================================================================
// WORKER CONTAINER APP
// ============================================================================

resource workerContainerApp 'Microsoft.App/containerApps@2023-05-01' = {
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
          name: 'finops-worker'
          image: '${containerRegistryServer}/finops-worker:latest'
          resources: {
            cpu: json('1.0')
            memory: '2Gi'
          }
          env: [
            {
              name: 'ENVIRONMENT'
              value: environmentName
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
              name: 'ServiceBus__QueueName'
              value: analysisQueueName
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
            {
              name: 'AZURE_SUBSCRIPTION_ID'
              value: subscription().subscriptionId
            }
            {
              name: 'AZURE_TENANT_ID'
              value: subscription().tenantId
            }
            {
              name: 'WORKER_CONCURRENCY'
              value: '5'
            }
            {
              name: 'MAX_ANALYSIS_DURATION_MINUTES'
              value: '60'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 5
        rules: [
          {
            name: 'queue-scaling'
            azureQueue: {
              queueName: analysisQueueName
              queueLength: 5
              auth: [
                {
                  secretRef: 'servicebus-connection'
                  triggerParameter: 'connection'
                }
              ]
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

output containerAppName string = workerContainerApp.name
