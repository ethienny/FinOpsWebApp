// ============================================================================
// Database Initialization Job Module
// ============================================================================

param location string
param containerAppEnvId string
param managedIdentityId string
param containerRegistryServer string
param sqlServerFqdn string
param sqlDatabaseName string
param sqlAdminUsername string
param keyVaultName string
param customerName string
param contactEmail string

@secure()
param licenseKey string
param tags object

// ============================================================================
// DATABASE INIT JOB
// ============================================================================

resource databaseInitJob 'Microsoft.App/jobs@2023-05-01' = {
  name: 'job-finops-db-init'
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentityId}': {}
    }
  }
  properties: {
    environmentId: containerAppEnvId
    configuration: {
      triggerType: 'Manual'
      replicaTimeout: 1800
      replicaRetryLimit: 1
      registries: [
        {
          server: containerRegistryServer
          identity: managedIdentityId
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'db-init'
          image: '${containerRegistryServer}/finops-db-init:latest'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'SQL_SERVER'
              value: sqlServerFqdn
            }
            {
              name: 'SQL_DATABASE'
              value: sqlDatabaseName
            }
            {
              name: 'SQL_ADMIN_USERNAME'
              value: sqlAdminUsername
            }
            {
              name: 'KEY_VAULT_URI'
              value: 'https://${keyVaultName}.vault.azure.net/'
            }
            {
              name: 'CUSTOMER_NAME'
              value: customerName
            }
            {
              name: 'CONTACT_EMAIL'
              value: contactEmail
            }
            {
              name: 'LICENSE_KEY'
              value: licenseKey
            }
            {
              name: 'AZURE_CLIENT_ID'
              value: reference(managedIdentityId, '2023-01-31').clientId
            }
            {
              name: 'AZURE_TENANT_ID'
              value: subscription().tenantId
            }
          ]
        }
      ]
    }
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output jobName string = databaseInitJob.name
output jobId string = databaseInitJob.id
