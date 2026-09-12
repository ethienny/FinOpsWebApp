# FinOps Insight Engine - Infrastructure Deployment Guide

## 📋 Overview

This guide walks you through deploying the complete FinOps Insight Engine infrastructure to Azure using Bicep templates.

**Deployment Time:** ~15 minutes  
**Resources Created:** 15+ Azure resources  
**Estimated Monthly Cost:** $315-600 USD (depends on usage)

---

## 🏗️ Architecture

### Resources Deployed

| Resource | Purpose | SKU/Tier |
|----------|---------|----------|
| Resource Group | Container for all resources | N/A |
| SQL Server + Database | Store analysis data | Basic (2GB) |
| Container Apps Environment | Host containerized apps | Consumption |
| Container App (API) | REST API endpoints | 0.5 CPU, 1GB RAM |
| Container App (Worker) | PowerShell analysis engine | 1 CPU, 2GB RAM |
| Storage Account | Reports, exports, backups | Standard LRS |
| Key Vault | Secrets management | Standard |
| Service Bus | Job queue | Standard |
| Container Registry | Private Docker images | Basic |
| Log Analytics | Centralized logging | Pay-as-you-go |
| Application Insights | Application monitoring | Pay-as-you-go |
| Managed Identity | Passwordless authentication | N/A |

### Network Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Azure Subscription                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            Resource Group: rg-finops-{prefix}          │ │
│  │                                                         │ │
│  │  ┌─────────────────┐      ┌──────────────────┐        │ │
│  │  │  Container Apps │◄─────┤  Managed Identity│        │ │
│  │  │   Environment   │      │  (Reader, Cost   │        │ │
│  │  └────────┬────────┘      │   Mgmt Reader)   │        │ │
│  │           │                └──────────────────┘        │ │
│  │  ┌────────▼────────┐      ┌──────────────────┐        │ │
│  │  │   API Container │      │ Worker Container │        │ │
│  │  │   (REST API)    │      │  (PowerShell)    │        │ │
│  │  └────────┬────────┘      └────────┬─────────┘        │ │
│  │           │                         │                  │ │
│  │  ┌────────▼─────────────────────────▼────────┐        │ │
│  │  │            Service Bus                     │        │ │
│  │  │  ┌──────────────┐  ┌──────────────┐       │        │ │
│  │  │  │analysis-jobs │  │notifications │       │        │ │
│  │  │  └──────────────┘  └──────────────┘       │        │ │
│  │  └───────────────────────────────────────────┘        │ │
│  │                                                         │ │
│  │  ┌──────────────┐    ┌──────────────┐                 │ │
│  │  │  SQL Server  │    │  Key Vault   │                 │ │
│  │  │  + Database  │    │  (Secrets)   │                 │ │
│  │  └──────────────┘    └──────────────┘                 │ │
│  │                                                         │ │
│  │  ┌──────────────┐    ┌──────────────┐                 │ │
│  │  │   Storage    │    │ Container    │                 │ │
│  │  │   Account    │    │  Registry    │                 │ │
│  │  └──────────────┘    └──────────────┘                 │ │
│  │                                                         │ │
│  │  ┌──────────────┐    ┌──────────────┐                 │ │
│  │  │Log Analytics │    │   App        │                 │ │
│  │  │  Workspace   │    │  Insights    │                 │ │
│  │  └──────────────┘    └──────────────┘                 │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

### Required Tools

1. **Azure CLI** (version 2.50+)
   ```bash
   # Install on Windows
   winget install -e --id Microsoft.AzureCLI
   
   # Install on macOS
   brew install azure-cli
   
   # Install on Linux
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   ```

2. **PowerShell** (version 7.0+)
   ```bash
   # Install on Windows
   winget install -e --id Microsoft.PowerShell
   
   # Install on macOS
   brew install powershell
   
   # Install on Linux
   wget https://aka.ms/install-powershell.sh; sudo bash install-powershell.sh
   ```

3. **Bicep CLI** (usually installed with Azure CLI)
   ```bash
   az bicep install
   az bicep upgrade
   ```

### Required Permissions

You need the following Azure permissions:

- **Subscription Contributor** or **Owner** role
- Ability to create resource groups
- Ability to assign RBAC roles
- Ability to create service principals (for Managed Identity)

---

## 🚀 Quick Start Deployment

### Step 1: Clone/Download Files

Ensure you have all these files in the same directory:

```
bicep/
├── main.bicep
├── parameters.dev.json
├── deploy.ps1
└── modules/
    ├── sql.bicep
    ├── storage.bicep
    ├── keyvault.bicep
    ├── servicebus.bicep
    ├── container-registry.bicep
    ├── managed-identity.bicep
    ├── monitoring.bicep
    ├── container-app-environment.bicep
    ├── container-app-api.bicep
    ├── container-app-worker.bicep
    └── database-init-job.bicep
```

### Step 2: Configure Parameters

Edit `parameters.dev.json`:

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "environmentName": {
      "value": "dev"  // dev, staging, or prod
    },
    "location": {
      "value": "brazilsouth"  // Your Azure region
    },
    "customerPrefix": {
      "value": "teste"  // 3-10 characters, lowercase, no spaces
    },
    "licenseKey": {
      "value": "FINOPS-PROF-TESTE-ABC12345"  // Your license key
    },
    "customerName": {
      "value": "Test Customer"  // Your company name
    },
    "contactEmail": {
      "value": "your-email@example.com"  // Your email
    },
    "sqlAdminUsername": {
      "value": "finopsadmin"  // SQL admin username
    },
    "sqlAdminPassword": {
      "value": "CHANGE_ME_Strong_P@ssw0rd_123!"  // STRONG password!
    }
  }
}
```

**⚠️ IMPORTANT:** Change the `sqlAdminPassword` to a strong password!

### Step 3: Login to Azure

```powershell
# Login to Azure
az login

# List your subscriptions
az account list --output table

# Set the subscription you want to use
az account set --subscription "YOUR_SUBSCRIPTION_ID"
```

### Step 4: Run Deployment (Dry Run First)

```powershell
# Navigate to bicep directory
cd bicep

# Run WHAT-IF to see what will be created (NO actual deployment)
./deploy.ps1 -SubscriptionId "YOUR_SUBSCRIPTION_ID" -WhatIf

# If everything looks good, run the actual deployment
./deploy.ps1 -SubscriptionId "YOUR_SUBSCRIPTION_ID"
```

### Step 5: Wait for Completion

The deployment will take approximately **10-15 minutes**.

You'll see progress output like:

```
===================================================
Pre-flight Checks
===================================================

✓ Azure CLI is installed
✓ Logged in to Azure as: user@example.com
✓ Subscription set to: My Azure Subscription
✓ Bicep file found: main.bicep
✓ Parameters file found: parameters.dev.json
✓ Bicep template is valid

===================================================
Starting Deployment
===================================================

Starting Azure deployment...
This may take 10-15 minutes...
```

---

## 📊 Deployment Outputs

After successful deployment, you'll see:

```
═══════════════════════════════════════════════════
           DEPLOYMENT SUMMARY
═══════════════════════════════════════════════════

Resource Group:
  rg-finops-teste-dev

API Endpoint:
  https://ca-finops-api-dev.xyz123.brazilsouth.azurecontainerapps.io

SQL Server:
  sql-finops-teste-xyz123.database.windows.net
  Database: finopsdb

Key Vault:
  https://kv-finops-teste-xyz123.vault.azure.net/

Container Registry:
  crfinopstestexyz123.azurecr.io

Managed Identity:
  Client ID: 00000000-0000-0000-0000-000000000000
```

**Save these outputs!** You'll need them for the next steps.

---

## 🗄️ Database Initialization

### Option 1: Using Azure Portal (Easiest)

1. Go to Azure Portal → Your SQL Server
2. Click on **Query editor**
3. Login with the SQL admin credentials
4. Copy the entire content of `database/schema.sql`
5. Paste and click **Run**

### Option 2: Using Azure CLI

```bash
# Get your SQL Server name from deployment outputs
SQL_SERVER="sql-finops-teste-xyz123"
SQL_DATABASE="finopsdb"
SQL_USER="finopsadmin"
SQL_PASSWORD="YourPassword"

# Run the schema script
az sql db query \
  --server $SQL_SERVER \
  --database $SQL_DATABASE \
  --admin-user $SQL_USER \
  --admin-password $SQL_PASSWORD \
  --input ../database/schema.sql
```

### Option 3: Using SQL Server Management Studio (SSMS)

1. Open SSMS
2. Connect to: `sql-finops-teste-xyz123.database.windows.net`
3. Authentication: SQL Server Authentication
4. Username: `finopsadmin`
5. Password: Your password
6. Open `database/schema.sql`
7. Execute

---

## 🐳 Container Images (Next Step)

After infrastructure is deployed, you need to build and push Docker images.

**This will be covered in the next phase** when we create the application code.

For now, the infrastructure is ready and waiting for the container images.

---

## ✅ Post-Deployment Verification

### 1. Check Resource Group

```bash
# List all resources in the resource group
az resource list \
  --resource-group rg-finops-teste-dev \
  --output table
```

You should see ~15 resources.

### 2. Test SQL Connection

```bash
# Test SQL connection (replace with your values)
sqlcmd -S sql-finops-teste-xyz123.database.windows.net \
       -d finopsdb \
       -U finopsadmin \
       -P YourPassword \
       -Q "SELECT @@VERSION"
```

### 3. Check Container Apps Status

```bash
# List container apps
az containerapp list \
  --resource-group rg-finops-teste-dev \
  --output table
```

Both should show "Succeeded" provisioning state.

### 4. Verify Managed Identity Permissions

```bash
# Get managed identity
IDENTITY_ID=$(az identity show \
  --resource-group rg-finops-teste-dev \
  --name id-finops-teste-dev \
  --query principalId -o tsv)

# Check role assignments
az role assignment list \
  --assignee $IDENTITY_ID \
  --all \
  --output table
```

You should see Reader, Monitoring Reader, and Cost Management Reader roles.

---

## 🔒 Security Best Practices

### 1. Restrict SQL Server Firewall

By default, the SQL firewall allows all IPs (for easy setup).

**Production:** Restrict to specific IPs or Azure services only:

```bash
# Remove the "Allow All IPs" rule
az sql server firewall-rule delete \
  --resource-group rg-finops-teste-dev \
  --server sql-finops-teste-xyz123 \
  --name AllowAllIPs

# Add specific IP
az sql server firewall-rule create \
  --resource-group rg-finops-teste-dev \
  --server sql-finops-teste-xyz123 \
  --name MyOfficeIP \
  --start-ip-address 203.0.113.10 \
  --end-ip-address 203.0.113.10
```

### 2. Rotate SQL Admin Password

```bash
# Change SQL admin password
az sql server update \
  --resource-group rg-finops-teste-dev \
  --name sql-finops-teste-xyz123 \
  --admin-password "NewStrongP@ssw0rd456!"
```

### 3. Enable Azure AD Authentication

The deployment already configures the Managed Identity as Azure AD admin.

Consider **disabling SQL authentication** in production:

```bash
az sql server ad-only-auth enable \
  --resource-group rg-finops-teste-dev \
  --name sql-finops-teste-xyz123
```

---

## 💰 Cost Optimization

### Daily Costs (Approximate)

| Resource | Daily Cost (USD) | Monthly Cost (USD) |
|----------|------------------|-------------------|
| SQL Database (Basic) | $0.16 | $5 |
| Container Apps (2 apps) | $1-2 | $30-60 |
| Storage Account | $0.10 | $3 |
| Service Bus (Standard) | $0.30 | $10 |
| Container Registry | $0.17 | $5 |
| Log Analytics | $0.50-2 | $15-60 |
| Key Vault | $0.01 | $0.30 |
| **TOTAL** | **$2.24-4.94** | **$68.30-143.30** |

### Cost Savings Tips

1. **Stop Container Apps when not in use:**
   ```bash
   az containerapp update \
     --name ca-finops-api-dev \
     --resource-group rg-finops-teste-dev \
     --min-replicas 0
   ```

2. **Scale down SQL to lower tier** (if testing):
   ```bash
   az sql db update \
     --resource-group rg-finops-teste-dev \
     --server sql-finops-teste-xyz123 \
     --name finopsdb \
     --service-objective Basic
   ```

3. **Delete entire resource group** when not needed:
   ```bash
   az group delete --name rg-finops-teste-dev --yes --no-wait
   ```

---

## 🧹 Complete Cleanup

### Delete Everything

```bash
# Delete the entire resource group and all resources
az group delete \
  --name rg-finops-teste-dev \
  --yes \
  --no-wait

# Verify deletion
az group exists --name rg-finops-teste-dev
# Should return: false
```

---

## 🐛 Troubleshooting

### Deployment Failed

**Check deployment status:**
```bash
az deployment sub show \
  --name finops-deploy-YYYYMMDD-HHMMSS \
  --query "properties.error"
```

**Common Issues:**

1. **"Resource name already exists"**
   - Change `customerPrefix` in parameters file
   - Resource names must be globally unique

2. **"Insufficient permissions"**
   - Ensure you have Contributor/Owner role
   - Check subscription limits

3. **"Quota exceeded"**
   - Check regional quotas
   - Try different region

### SQL Connection Failed

**Enable your IP in firewall:**
```bash
MY_IP=$(curl -s ifconfig.me)

az sql server firewall-rule create \
  --resource-group rg-finops-teste-dev \
  --server sql-finops-teste-xyz123 \
  --name MyCurrentIP \
  --start-ip-address $MY_IP \
  --end-ip-address $MY_IP
```

### Container App Not Starting

**Check logs:**
```bash
az containerapp logs show \
  --name ca-finops-api-dev \
  --resource-group rg-finops-teste-dev \
  --follow
```

---

## 📞 Support

For issues with:
- **Infrastructure deployment:** Check this README and troubleshooting section
- **Application code:** Wait for Phase 2 (API and Worker implementation)
- **Azure platform:** [Azure Support](https://azure.microsoft.com/support/)

---

## ✅ Deployment Checklist

Use this checklist to track your progress:

- [ ] Azure CLI installed and logged in
- [ ] PowerShell 7+ installed
- [ ] Subscription selected and verified
- [ ] `parameters.dev.json` configured with your values
- [ ] SQL admin password changed to strong password
- [ ] Dry-run deployment successful (`-WhatIf`)
- [ ] Full deployment completed successfully
- [ ] Deployment outputs saved
- [ ] Database schema initialized
- [ ] SQL connection tested
- [ ] Container Apps visible in portal
- [ ] Managed Identity has correct permissions
- [ ] Storage containers created
- [ ] Key Vault accessible
- [ ] Service Bus queues created

---

## 🎯 Next Steps

1. ✅ **Infrastructure Deployed** (YOU ARE HERE)
2. ⏳ **Build Container Images** (Next Phase)
   - API application (ASP.NET Core)
   - Worker application (PowerShell Engine)
   - Database init job
3. ⏳ **Deploy Applications**
4. ⏳ **First Analysis Run**
5. ⏳ **Create Power BI Dashboard**

---

**Infrastructure deployment complete!** 🎉

Your Azure environment is now ready to receive the FinOps Insight Engine application.
