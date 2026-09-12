# FinOps Insight Engine - Arquitetura Híbrida SaaS
## Control Plane (Sua Infra) + Data Plane (Cliente Infra)

---

## VISÃO GERAL

### Princípio Fundamental
**ZERO dados de custo ou recursos do cliente saem da infraestrutura deles.**

```
┌─────────────────────────────────────────────────────────────┐
│  SUA INFRAESTRUTURA (Control Plane)                         │
│  - Licensing & Authentication                               │
│  - Portal de gerenciamento                                  │
│  - Update distribution                                      │
│  - Telemetria agregada (opt-in)                            │
│  - Billing                                                  │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ HTTPS/TLS 1.3
                            │ (License validation only)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  INFRAESTRUTURA DO CLIENTE (Data Plane)                     │
│  - FinOps Engine (containers)                               │
│  - Database (SQL/Cosmos)                                    │
│  - Storage (Blob)                                           │
│  - Dashboards (opcional - pode ser local)                  │
│  - TODOS OS DADOS DE ANÁLISE                               │
└─────────────────────────────────────────────────────────────┘
```

---

# 1. CONTROL PLANE - SUA INFRAESTRUTURA

## 1.1 Responsabilidades
- ✅ Gerenciar licenças e subscriptions
- ✅ Autenticar clientes
- ✅ Distribuir updates do produto
- ✅ Coletar telemetria agregada (opt-in, sem dados sensíveis)
- ✅ Billing e cobrança
- ✅ Portal de auto-serviço para clientes
- ❌ **NUNCA** armazenar dados de custo/recursos dos clientes

---

## 1.2 Componentes do Control Plane

### A. Portal de Gerenciamento (React + ASP.NET Core)

**URL:** `portal.finopsinsight.com`

**Funcionalidades:**

1. **Customer Self-Service Portal**
   - Registro e onboarding
   - Gerenciamento de licenças
   - Download de deployment templates
   - Documentação e tutoriais
   - Suporte (ticketing system)

2. **License Management**
   - Geração de license keys
   - Ativação/desativação
   - Tier management (Basic/Pro/Enterprise)
   - Feature flags por licença

3. **Deployment Wizard**
   - Gerador de ARM/Bicep templates customizado
   - Estimativa de custos Azure
   - Pre-flight checks
   - Guided deployment

4. **Update Center**
   - Notificações de novas versões
   - Release notes
   - Download de containers atualizados
   - Rollback instructions

5. **Analytics Dashboard (Agregado)**
   - Número de instalações ativas
   - Versões em uso
   - Health status (opt-in ping)
   - Feature adoption (telemetria agregada)

**Stack Tecnológico:**
```
Frontend: React + TypeScript + Tailwind
Backend: ASP.NET Core 8.0
Database: Azure SQL (pequeno, apenas metadata)
Hosting: Azure App Service (Standard tier)
```

---

### B. Licensing Service (API)

**Endpoint:** `https://license.finopsinsight.com/api/v1`

**APIs:**

```http
POST /api/v1/licenses/generate
POST /api/v1/licenses/validate
POST /api/v1/licenses/activate
POST /api/v1/licenses/deactivate
GET  /api/v1/licenses/{licenseKey}/features
POST /api/v1/licenses/{licenseKey}/heartbeat
```

**License Key Format:**
```
FINOPS-{TIER}-{CUSTOMER_ID}-{HASH}
Exemplo: FINOPS-ENT-A7B3F-8X9K2L4M6N8P
```

**License Validation Response:**
```json
{
  "valid": true,
  "tier": "Enterprise",
  "features": [
    "multi-subscription",
    "ml-predictions",
    "custom-reports",
    "api-access",
    "premium-support"
  ],
  "expiresAt": "2027-02-13T00:00:00Z",
  "maxSubscriptions": 100,
  "maxUsers": 50
}
```

**Segurança:**
- License keys assinadas com RSA 4096-bit
- JWT tokens com validade curta (1h)
- Rate limiting agressivo
- IP whitelisting (opcional)

---

### C. Update Distribution Service

**Container Registry:** `finopsinsight.azurecr.io`

**Componentes distribuídos:**

1. **Docker Images (versionadas)**
   ```
   finopsinsight.azurecr.io/finops-engine:6.0.1
   finopsinsight.azurecr.io/finops-api:6.0.1
   finopsinsight.azurecr.io/finops-ui:6.0.1
   ```

2. **ARM/Bicep Templates**
   - Deploy completo (infra + app)
   - Update in-place
   - Rollback templates

3. **PowerShell Modules**
   - Core analysis engine
   - Azure connectors
   - Report generators

**Update Mechanism:**
```
Cliente Data Plane (scheduled check)
  ↓
Chama: GET /api/v1/updates/check (com license key)
  ↓
Control Plane retorna:
{
  "currentVersion": "6.0.1",
  "latestVersion": "6.1.0",
  "updateAvailable": true,
  "releaseNotes": "...",
  "downloadUrl": "https://...",
  "critical": false,
  "autoUpdateRecommended": true
}
  ↓
Cliente decide: manual ou auto-update
```

---

### D. Telemetry Service (Opt-in)

**O que coleta (se cliente autorizar):**
- ✅ Versão do produto em uso
- ✅ Número de subscriptions analisadas (count, sem IDs)
- ✅ Número de recursos analisados (count, sem detalhes)
- ✅ Tempo de execução de análises
- ✅ Erros/exceções (stack traces SEM dados)
- ✅ Feature usage (qual features são usadas)
- ❌ **NUNCA** nomes de recursos, custos, detalhes

**Protocolo:**
```
Cliente → HTTPS POST → Control Plane
{
  "installationId": "uuid-hash",
  "version": "6.0.1",
  "tier": "Enterprise",
  "timestamp": "2026-02-13T10:00:00Z",
  "metrics": {
    "subscriptionsAnalyzed": 25,
    "resourcesAnalyzed": 3420,
    "analysisTimeMs": 45000,
    "featuresUsed": ["ml-predictions", "custom-reports"]
  }
}
```

**Privacy:**
- Completamente opt-in
- Cliente pode desabilitar a qualquer momento
- Dados agregados e anonimizados
- LGPD/GDPR compliant
- Não identifica recursos ou custos específicos

---

### E. Billing & Subscription Service

**Modelo de Cobrança:**

**Opção 1: Direct Billing (Stripe/Chargebee)**
```
Você cobra diretamente do cliente via:
- Cartão de crédito
- Boleto bancário
- Invoice (enterprise)

Tiers:
- Basic: R$ 999/mês (até 10 subscriptions)
- Professional: R$ 2.999/mês (até 50 subscriptions)
- Enterprise: R$ 9.999/mês (ilimitado + suporte premium)
```

**Opção 2: Azure Marketplace (Recomendado)**
```
Publicar como "Azure Application"
- Cliente compra via Azure Marketplace
- Microsoft gerencia billing
- Você recebe pagamento da Microsoft
- Integrado com Azure cost management do cliente
- Maior credibilidade

Azure Marketplace fee: ~3-20% (depende do volume)
```

**License Enforcement:**
- Grace period: 7 dias após expiração
- Soft lock: warning banners, limited features
- Hard lock: análises param após 30 dias

---

## 1.3 Database Schema - Control Plane

```sql
-- Clientes/Empresas
Customers (
  CustomerId UNIQUEIDENTIFIER PRIMARY KEY,
  CompanyName NVARCHAR(200),
  Email NVARCHAR(200),
  Phone NVARCHAR(50),
  Country NVARCHAR(100),
  CreatedAt DATETIME,
  Status NVARCHAR(50) -- Active, Suspended, Cancelled
)

-- Licenças
Licenses (
  LicenseId UNIQUEIDENTIFIER PRIMARY KEY,
  CustomerId UNIQUEIDENTIFIER FOREIGN KEY,
  LicenseKey NVARCHAR(100) UNIQUE,
  Tier NVARCHAR(50), -- Basic, Professional, Enterprise
  Status NVARCHAR(50), -- Active, Expired, Revoked
  IssuedAt DATETIME,
  ExpiresAt DATETIME,
  MaxSubscriptions INT,
  MaxUsers INT,
  Features NVARCHAR(MAX) -- JSON array
)

-- Instalações (Data Planes)
Installations (
  InstallationId UNIQUEIDENTIFIER PRIMARY KEY,
  LicenseId UNIQUEIDENTIFIER FOREIGN KEY,
  InstallationHash NVARCHAR(100), -- Anonymous identifier
  Version NVARCHAR(50),
  AzureRegion NVARCHAR(50),
  LastHeartbeat DATETIME,
  HealthStatus NVARCHAR(50)
)

-- Subscriptions/Billing
Subscriptions (
  SubscriptionId UNIQUEIDENTIFIER PRIMARY KEY,
  CustomerId UNIQUEIDENTIFIER FOREIGN KEY,
  PlanId NVARCHAR(50),
  Status NVARCHAR(50), -- Trial, Active, PastDue, Cancelled
  CurrentPeriodStart DATETIME,
  CurrentPeriodEnd DATETIME,
  TrialEnd DATETIME NULL,
  CancelAt DATETIME NULL
)

-- Invoices
Invoices (
  InvoiceId UNIQUEIDENTIFIER PRIMARY KEY,
  SubscriptionId UNIQUEIDENTIFIER FOREIGN KEY,
  Amount DECIMAL(10,2),
  Currency NVARCHAR(3),
  Status NVARCHAR(50), -- Draft, Open, Paid, Void
  IssuedAt DATETIME,
  PaidAt DATETIME NULL,
  DueDate DATETIME
)

-- Telemetry agregada (opt-in)
TelemetryEvents (
  EventId UNIQUEIDENTIFIER PRIMARY KEY,
  InstallationId UNIQUEIDENTIFIER FOREIGN KEY,
  EventType NVARCHAR(100),
  EventData NVARCHAR(MAX), -- JSON
  Timestamp DATETIME
)

-- Support Tickets
SupportTickets (
  TicketId UNIQUEIDENTIFIER PRIMARY KEY,
  CustomerId UNIQUEIDENTIFIER FOREIGN KEY,
  Subject NVARCHAR(200),
  Description NVARCHAR(MAX),
  Priority NVARCHAR(50),
  Status NVARCHAR(50),
  CreatedAt DATETIME,
  ResolvedAt DATETIME NULL
)
```

---

## 1.4 Estimativa de Custos - Control Plane

**Infraestrutura Mínima (50 clientes):**

| Componente | Serviço Azure | Custo/Mês |
|------------|---------------|-----------|
| Portal Web + API | App Service (S1) | ~$75 |
| Database | Azure SQL (Basic) | ~$5 |
| Container Registry | Basic tier | ~$5 |
| Storage (templates) | Blob Storage (10GB) | ~$1 |
| Application Insights | Pay-as-you-go | ~$10 |
| Domain + SSL | Azure DNS + Cert | ~$5 |
| **TOTAL** | | **~$100/mês** |

**Escalando (500 clientes):**
- App Service (P1v2): ~$150
- Azure SQL (S0): ~$15
- Container Registry (Standard): ~$20
- **TOTAL: ~$200/mês**

**Margem:** Com clientes pagando R$ 999-9.999/mês, custos operacionais são <1% da receita.

---

# 2. DATA PLANE - INFRAESTRUTURA DO CLIENTE

## 2.1 Responsabilidades
- ✅ Executar análises FinOps
- ✅ Armazenar TODOS os dados de custo/recursos
- ✅ Hospedar dashboards (opcional)
- ✅ Processar recomendações
- ✅ Gerar relatórios
- ✅ Comunicar com Control Plane APENAS para license validation

---

## 2.2 Modelo de Deploy

### Opção A: Azure Container Apps (Recomendado)
**Vantagens:**
- Serverless, escala automático
- Managed Kubernetes (sem complexidade)
- Menor custo operacional
- Fácil para clientes operarem

### Opção B: Azure Kubernetes Service (AKS)
**Vantagens:**
- Máximo controle
- Melhor para instalações grandes (>100 subscriptions)
- Mais features avançadas

### Opção C: Azure Functions + App Service
**Vantagens:**
- Mais simples
- Menor curva de aprendizado
- Bom para clientes pequenos

---

## 2.3 Componentes do Data Plane

```
CLIENTE AZURE SUBSCRIPTION
│
├── Resource Group: finops-insight-engine
│   │
│   ├── 1. COMPUTE
│   │   ├── Container App: finops-engine-api
│   │   ├── Container App: finops-engine-worker
│   │   └── Container App: finops-ui (opcional)
│   │
│   ├── 2. DATA
│   │   ├── Azure SQL Database: finops-db
│   │   ├── Storage Account: finopsstorage
│   │   │   ├── Container: reports
│   │   │   ├── Container: exports
│   │   │   └── Container: backups
│   │   └── Redis Cache: finops-cache (opcional)
│   │
│   ├── 3. INTEGRATION
│   │   ├── Service Bus: finops-jobs
│   │   └── Key Vault: finops-secrets
│   │
│   ├── 4. MONITORING
│   │   ├── Application Insights: finops-monitoring
│   │   └── Log Analytics: finops-logs
│   │
│   └── 5. IDENTITY
│       └── Managed Identity: finops-identity
```

---

## 2.4 Arquitetura Detalhada - Data Plane

### A. FinOps Engine API (Container)

**Imagem:** `finopsinsight.azurecr.io/finops-api:6.0.1`

**Responsabilidades:**
- Receber requests do dashboard
- Orquestrar análises
- Servir dados do database local
- Validar license com Control Plane

**Endpoints:**
```http
GET  /api/health
GET  /api/license/status
GET  /api/dashboard/summary
GET  /api/subscriptions
POST /api/analysis/run
GET  /api/recommendations
POST /api/recommendations/{id}/apply
GET  /api/reports
```

**Environment Variables:**
```bash
FINOPS_LICENSE_KEY=FINOPS-ENT-A7B3F-...
FINOPS_CONTROL_PLANE_URL=https://license.finopsinsight.com
AZURE_SQL_CONNECTION_STRING=Server=...;Database=...
STORAGE_ACCOUNT_CONNECTION_STRING=DefaultEndpointsProtocol=https...
SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://...
APPINSIGHTS_INSTRUMENTATION_KEY=...
```

**Startup Flow:**
```
1. Container starts
2. Load license key from env/KeyVault
3. Validate license with Control Plane
   → POST https://license.finopsinsight.com/api/v1/licenses/validate
   → Recebe features habilitadas
4. Initialize database connection (local SQL)
5. Start API server
6. Schedule periodic license checks (cada 24h)
```

**License Validation (Cached):**
```csharp
public class LicenseValidator
{
    private LicenseInfo _cachedLicense;
    private DateTime _cacheExpiry;
    
    public async Task<LicenseInfo> ValidateLicenseAsync()
    {
        // Cache válido? Return cached
        if (_cachedLicense != null && DateTime.UtcNow < _cacheExpiry)
            return _cachedLicense;
        
        // Chama Control Plane
        var response = await _httpClient.PostAsync(
            "https://license.finopsinsight.com/api/v1/licenses/validate",
            new { licenseKey = _licenseKey }
        );
        
        if (response.IsSuccessStatusCode)
        {
            _cachedLicense = await response.Content.ReadAsAsync<LicenseInfo>();
            _cacheExpiry = DateTime.UtcNow.AddHours(24);
            return _cachedLicense;
        }
        
        // Fallback: grace period
        if (_cachedLicense != null && IsWithinGracePeriod())
            return _cachedLicense;
        
        throw new LicenseExpiredException();
    }
}
```

---

### B. FinOps Engine Worker (Container)

**Imagem:** `finopsinsight.azurecr.io/finops-engine:6.0.1`

**Responsabilidades:**
- Processar jobs de análise (da fila)
- Executar PowerShell analysis engine
- Salvar resultados no database local
- Gerar recomendações

**PowerShell Engine Integration:**
```powershell
# Seu código atual encapsulado em módulos
/app
  /modules
    /FinOps.Core
      FinOps.Core.psm1
    /FinOps.Compute
      Analyze-VirtualMachines.ps1
      Analyze-AppServices.ps1
    /FinOps.Storage
      Analyze-StorageAccounts.ps1
    /FinOps.Database
      Analyze-SqlDatabases.ps1
      Analyze-PostgreSQL.ps1
    /FinOps.AI
      Analyze-OpenAI.ps1
      Analyze-CognitiveServices.ps1
    /FinOps.Reports
      Generate-ExecutiveReport.ps1
```

**Worker Loop:**
```csharp
while (true)
{
    var message = await serviceBusReceiver.ReceiveMessageAsync();
    
    if (message != null)
    {
        var job = JsonSerializer.Deserialize<AnalysisJob>(message.Body);
        
        // Execute PowerShell
        using var ps = PowerShell.Create();
        ps.AddScript(@"
            Import-Module /app/modules/FinOps.Core
            $result = Invoke-FinOpsAnalysis -SubscriptionId $subscriptionId
            $result | ConvertTo-Json -Depth 10
        ");
        ps.AddParameter("subscriptionId", job.SubscriptionId);
        
        var results = ps.Invoke();
        
        // Save to local database
        await SaveResultsToDatabase(results);
        
        // Complete message
        await serviceBusReceiver.CompleteMessageAsync(message);
    }
    
    await Task.Delay(1000);
}
```

**Scaling:**
- Replica count: 1-10 (baseado em queue length)
- CPU limit: 2 cores por replica
- Memory: 4GB por replica

---

### C. FinOps UI (Container - Opcional)

**Imagem:** `finopsinsight.azurecr.io/finops-ui:6.0.1`

**Opções de Deploy:**

**Opção 1: Self-Hosted no Cliente**
- Container rodando React app
- Acessa API local (mesmo VNET)
- Cliente gerencia acesso (VPN, Private Link)

**Opção 2: Portal Centralizado com RLS**
- Cliente acessa portal.finopsinsight.com
- Portal conecta no API do cliente (via VPN/ExpressRoute)
- Row-level security garante isolamento

**Opção 3: Power BI Embedded**
- Dados ficam no SQL do cliente
- Power BI conecta via gateway
- Cliente compra licenças Power BI

**Recomendação:** Opção 1 (máximo controle para cliente)

---

### D. Database Local (Azure SQL)

**Schema:**
```sql
-- Subscriptions monitoradas
Subscriptions (
  SubscriptionId UNIQUEIDENTIFIER,
  AzureSubscriptionId NVARCHAR(100),
  Name NVARCHAR(200),
  IsActive BIT,
  LastAnalyzed DATETIME
)

-- Análises executadas
AnalysisRuns (
  RunId UNIQUEIDENTIFIER PRIMARY KEY,
  SubscriptionId UNIQUEIDENTIFIER,
  StartTime DATETIME,
  EndTime DATETIME,
  Status NVARCHAR(50),
  ResourcesAnalyzed INT,
  RecommendationsGenerated INT
)

-- Recursos analisados
Resources (
  ResourceId NVARCHAR(500) PRIMARY KEY,
  RunId UNIQUEIDENTIFIER,
  SubscriptionId UNIQUEIDENTIFIER,
  ResourceType NVARCHAR(100),
  Name NVARCHAR(200),
  ResourceGroup NVARCHAR(200),
  Region NVARCHAR(100),
  Tags NVARCHAR(MAX), -- JSON
  MonthlyCost DECIMAL(10,2),
  Currency NVARCHAR(3)
)

-- Recomendações
Recommendations (
  RecommendationId UNIQUEIDENTIFIER PRIMARY KEY,
  RunId UNIQUEIDENTIFIER,
  ResourceId NVARCHAR(500),
  Type NVARCHAR(100), -- Resize, Delete, Reserved, etc
  Priority NVARCHAR(50), -- Critical, High, Medium, Low
  CurrentCost DECIMAL(10,2),
  PotentialSavings DECIMAL(10,2),
  SavingsPercentage DECIMAL(5,2),
  ConfidenceScore DECIMAL(3,2),
  Description NVARCHAR(MAX),
  ActionRequired NVARCHAR(MAX),
  Status NVARCHAR(50), -- Pending, Implemented, Dismissed
  CreatedAt DATETIME,
  ImplementedAt DATETIME NULL
)

-- Histórico de custos (time-series)
CostHistory (
  HistoryId BIGINT IDENTITY PRIMARY KEY,
  SubscriptionId UNIQUEIDENTIFIER,
  ResourceId NVARCHAR(500),
  Date DATE,
  DailyCost DECIMAL(10,2),
  Currency NVARCHAR(3),
  INDEX IX_CostHistory_Date (Date),
  INDEX IX_CostHistory_Resource (ResourceId, Date)
)

-- Configurações
Settings (
  SettingKey NVARCHAR(100) PRIMARY KEY,
  SettingValue NVARCHAR(MAX),
  UpdatedAt DATETIME
)
```

**Sizing:**
- Tier: S3 (100 DTUs) - para ~50 subscriptions
- Storage: 250GB (crescimento ~2GB/mês)
- Backup: 7 dias ponto-no-tempo
- Geo-replication: Opcional (HA)

---

### E. Storage Account

**Containers:**

1. **reports/** - Relatórios gerados
   ```
   /reports/executive/2026/02/executive-report-20260213.pdf
   /reports/detailed/2026/02/detailed-analysis-20260213.xlsx
   ```

2. **exports/** - Exports de dados
   ```
   /exports/2026/02/13/recommendations-export.csv
   /exports/2026/02/13/resources-export.json
   ```

3. **backups/** - Backups de análises completas
   ```
   /backups/2026/02/analysis-backup-20260213.json
   ```

**Lifecycle Management:**
- Reports > 90 dias → Cool tier
- Reports > 365 dias → Archive tier
- Backups > 30 dias → Cool tier

---

### F. Service Bus

**Queue:** `analysis-jobs`

**Message Format:**
```json
{
  "jobId": "uuid",
  "subscriptionId": "uuid",
  "analysisType": "full", // full, incremental, specific-service
  "services": ["compute", "storage", "database"],
  "priority": "normal",
  "scheduledBy": "auto-scheduler",
  "createdAt": "2026-02-13T10:00:00Z"
}
```

**Dead Letter Queue:** Para jobs que falharam 3x

---

### G. Key Vault

**Secrets armazenados:**
```
finops-license-key              → License key do produto
azure-sql-connection-string     → Connection string database
storage-connection-string       → Storage account
servicebus-connection-string    → Service Bus
appinsights-key                 → Application Insights
```

**Acesso via Managed Identity:**
```csharp
var credential = new DefaultAzureCredential();
var secretClient = new SecretClient(
    new Uri("https://finops-kv.vault.azure.net/"),
    credential
);

var secret = await secretClient.GetSecretAsync("finops-license-key");
var licenseKey = secret.Value.Value;
```

---

## 2.5 Deploy Automático - ARM/Bicep Template

O cliente executa **UM comando** e toda infra é provisionada:

```bash
az deployment sub create \
  --template-file finops-deploy.bicep \
  --location brazilsouth \
  --parameters licenseKey='FINOPS-ENT-...' \
  --parameters adminEmail='admin@cliente.com'
```

**O que o template faz:**
1. ✅ Cria Resource Group
2. ✅ Provisiona SQL Database
3. ✅ Cria Storage Account
4. ✅ Provisiona Container Apps
5. ✅ Configura Service Bus
6. ✅ Cria Key Vault
7. ✅ Configura Managed Identity
8. ✅ Aplica RBAC (Reader nas subscriptions)
9. ✅ Deploy dos containers
10. ✅ Executa primeira análise

**Tempo total:** ~10-15 minutos

---

## 2.6 Estimativa de Custos - Data Plane (Cliente)

**Setup Inicial (10 subscriptions, 500 recursos):**

| Componente | Custo/Mês (USD) |
|------------|-----------------|
| Container Apps (2 apps) | ~$50 |
| Azure SQL (S3) | ~$200 |
| Storage Account | ~$10 |
| Service Bus (Basic) | ~$10 |
| Key Vault | ~$5 |
| Application Insights | ~$20 |
| Redis (opcional) | ~$20 |
| **TOTAL** | **~$315/mês** |

**Escalando (50 subscriptions, 5000 recursos):**
- Container Apps: ~$150
- Azure SQL (S6): ~$400
- Outros: ~$50
- **TOTAL: ~$600/mês**

**Importante:** Cliente paga esses custos de infra + sua licença SaaS.

---

# 3. COMUNICAÇÃO SEGURA ENTRE PLANOS

## 3.1 Princípios de Segurança

1. **Unidirecional:** Data Plane → Control Plane (nunca o contrário)
2. **Mínimo de dados:** Apenas license validation, nada mais
3. **TLS 1.3:** Todas comunicações criptografadas
4. **Sem dados sensíveis:** Zero custos/recursos trafegam
5. **Offline-capable:** Data Plane funciona com license cached

---

## 3.2 Fluxos de Comunicação

### A. License Validation (Startup + Periodic)

```
┌─────────────────┐                    ┌─────────────────┐
│   Data Plane    │                    │  Control Plane  │
│   (Cliente)     │                    │   (Você)        │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         │ 1. POST /api/v1/licenses/validate   │
         │    {                                 │
         │      "licenseKey": "FINOPS-ENT-...", │
         │      "installationId": "uuid-hash",  │
         │      "version": "6.0.1"              │
         │    }                                 │
         ├─────────────────────────────────────>│
         │                                      │
         │                  2. Validate key     │
         │                     Check expiry     │
         │                     Load features    │
         │                                      │
         │ 3. Response                          │
         │    {                                 │
         │      "valid": true,                  │
         │      "tier": "Enterprise",           │
         │      "features": [...],              │
         │      "expiresAt": "2027-02-13",      │
         │      "maxSubscriptions": 100         │
         │    }                                 │
         │<─────────────────────────────────────┤
         │                                      │
         │ 4. Cache response (24h)              │
         │    Enable features locally           │
         │                                      │
```

**Frequência:** 
- Startup: Sempre
- Runtime: A cada 24h
- Fallback: Cache até 7 dias (grace period)

---

### B. Update Check (Optional, Daily)

```
┌─────────────────┐                    ┌─────────────────┐
│   Data Plane    │                    │  Control Plane  │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         │ 1. GET /api/v1/updates/check        │
         │    ?licenseKey=FINOPS-...            │
         │    &currentVersion=6.0.1             │
         ├─────────────────────────────────────>│
         │                                      │
         │ 2. Response                          │
         │    {                                 │
         │      "latestVersion": "6.1.0",       │
         │      "updateAvailable": true,        │
         │      "releaseNotes": "...",          │
         │      "downloadUrl": "acr://...",     │
         │      "critical": false               │
         │    }                                 │
         │<─────────────────────────────────────┤
         │                                      │
         │ 3. Notify admin (email/dashboard)    │
         │    Admin decides when to update      │
         │                                      │
```

---

### C. Telemetry (Opt-in, Aggregated)

```
┌─────────────────┐                    ┌─────────────────┐
│   Data Plane    │                    │  Control Plane  │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         │ 1. POST /api/v1/telemetry (opt-in)  │
         │    {                                 │
         │      "installationId": "uuid-hash",  │
         │      "licenseKey": "FINOPS-...",     │
         │      "version": "6.0.1",             │
         │      "metrics": {                    │
         │        "subscriptionsCount": 25,     │
         │        "resourcesCount": 3420,       │
         │        "analysisTimeMs": 45000,      │
         │        "recommendationsCount": 87,   │
         │        "featuresUsed": ["ml", "api"] │
         │      }                               │
         │    }                                 │
         ├─────────────────────────────────────>│
         │                                      │
         │ 2. Store aggregated metrics          │
         │    (NO customer data, NO costs)      │
         │                                      │
         │ 3. Response: 200 OK                  │
         │<─────────────────────────────────────┤
         │                                      │
```

**Privacy Guarantees:**
- ❌ Zero resource names
- ❌ Zero cost values
- ❌ Zero subscription IDs
- ✅ Apenas counts e timings
- ✅ Completamente opt-in

---

## 3.3 Segurança de Rede

### Opção 1: Public Endpoint + TLS (Simples)
```
Data Plane → Internet → HTTPS/TLS 1.3 → Control Plane
```

**Segurança:**
- Certificate pinning
- Mutual TLS (opcional)
- IP whitelisting (Control Plane)

---

### Opção 2: Azure Private Link (Enterprise)
```
Data Plane → Private Endpoint → Azure Backbone → Control Plane
```

**Vantagens:**
- Tráfego nunca sai da rede Microsoft
- Maior segurança
- Compliance-friendly

**Custo adicional:** ~$10/mês por conexão

---

## 3.4 Offline Mode / Disconnected

**Cenário:** Cliente em air-gapped environment ou sem internet.

**Solução:**
1. **Manual License Activation**
   ```
   Cliente gera "activation request" offline
   → Envia via email/ticket
   → Você gera "activation response"
   → Cliente importa response
   → License válida por 90 dias
   ```

2. **Manual Updates**
   ```
   Cliente baixa containers via USB/transfer
   → Importa no registry local
   → Deploy manual
   ```

---

# 4. MODELO DE LICENSING E BILLING

## 4.1 Tiers de Produto

### BASIC - R$ 999/mês
**Inclui:**
- ✅ Até 10 Azure subscriptions
- ✅ Análise de recursos principais (VM, Storage, SQL)
- ✅ Dashboards básicos
- ✅ Relatórios mensais automáticos
- ✅ Suporte por email (48h SLA)
- ✅ Updates regulares

**Ideal para:** Pequenas empresas, startups

---

### PROFESSIONAL - R$ 2.999/mês
**Inclui tudo do Basic +**
- ✅ Até 50 Azure subscriptions
- ✅ Análise de TODOS serviços Azure (15+ serviços)
- ✅ Machine Learning predictions
- ✅ Well-Architected Framework compliance
- ✅ Custom reports builder
- ✅ API access
- ✅ Webhooks e integrações
- ✅ Suporte prioritário (24h SLA)
- ✅ Onboarding assistido

**Ideal para:** Empresas médias, scale-ups

---

### ENTERPRISE - R$ 9.999/mês
**Inclui tudo do Professional +**
- ✅ Subscriptions ilimitadas
- ✅ Multi-tenant support (manage multiple Azure ADs)
- ✅ Advanced ML models (anomaly detection, forecasting)
- ✅ Custom feature development
- ✅ White-label option
- ✅ Dedicated support (4h SLA)
- ✅ Quarterly business reviews
- ✅ Private Link connectivity
- ✅ SLA de 99.9%

**Ideal para:** Grandes corporações, enterprises

---

## 4.2 Add-ons (Opcionais)

| Add-on | Descrição | Preço/mês |
|--------|-----------|-----------|
| **Premium Support** | SLA 1h, suporte 24/7 | R$ 2.000 |
| **Professional Services** | Custom integrations, PoCs | R$ 300/hora |
| **Training** | Workshops para equipe | R$ 5.000/dia |
| **Managed Service** | Operamos para você | 20% do bill |

---

## 4.3 Processo de Compra

### Fluxo Self-Service:

```
1. Cliente acessa portal.finopsinsight.com
   ↓
2. Seleciona tier (Basic/Pro/Enterprise)
   ↓
3. Preenche dados da empresa
   ↓
4. Escolhe método de pagamento:
   - Cartão de crédito (Stripe) → Ativação imediata
   - Boleto → Ativação em 1-2 dias
   - Invoice (Enterprise) → Aprovação manual
   ↓
5. Recebe license key por email
   ↓
6. Download de deployment templates
   ↓
7. Guided deployment wizard
   ↓
8. Primeira análise executada
   ↓
9. Onboarding call (Pro/Enterprise)
```

---

### Fluxo Enterprise:

```
1. Reunião de discovery (demo + sizing)
   ↓
2. Proposta comercial customizada
   ↓
3. PoC (30 dias, grátis)
   ↓
4. Contrato assinado
   ↓
5. Onboarding dedicado (2-4 semanas)
   ↓
6. Go-live com suporte premium
```

---

## 4.4 Trial/Freemium

**Trial Gratuito (30 dias):**
- Tier Professional completo
- Até 5 subscriptions
- Sem cartão de crédito necessário
- Auto-downgrade para modo read-only após expiração

**Freemium (Futuro):**
- 1 subscription grátis para sempre
- Features básicas
- Upsell para pago

---

## 4.5 Billing via Azure Marketplace

**Vantagens:**
- ✅ Cliente paga na mesma fatura do Azure
- ✅ Usa commitment/credits existentes
- ✅ Microsoft gerencia cobranças
- ✅ Maior credibilidade
- ✅ Descoberta por novos clientes

**Processo:**
1. Publicar no Azure Marketplace como "Azure Application"
2. Cliente "compra" via Marketplace
3. Deploy automático via ARM template
4. Billing integrado com Azure cost

**Revenue share:** Microsoft fica com 3-20% (dependendo do tier)

---

## 4.6 Metering e Usage-Based Pricing (Futuro)

**Modelo Alternativo:** Pay-per-subscription analisada

```
R$ 99/subscription/mês

Exemplo:
- 10 subscriptions = R$ 990/mês
- 50 subscriptions = R$ 4.950/mês
- 100 subscriptions = R$ 9.900/mês (com desconto)
```

**Vantagens:**
- Mais justo (paga pelo que usa)
- Cresce com o cliente
- Previsível

---

# 5. ROADMAP DE IMPLEMENTAÇÃO

## Fase 1: MVP Control Plane (4-6 semanas)

**Semana 1-2: Licensing Service**
- [ ] API de validação de licenças
- [ ] Geração de license keys
- [ ] Database schema
- [ ] JWT authentication

**Semana 3-4: Portal Web**
- [ ] Frontend React básico
- [ ] Customer registration
- [ ] License management UI
- [ ] Deployment wizard

**Semana 5-6: Distribution**
- [ ] Azure Container Registry setup
- [ ] ARM/Bicep templates
- [ ] Update distribution API
- [ ] Documentation

**Entregável:** Portal funcional + Licensing working

---

## Fase 2: MVP Data Plane (6-8 semanas)

**Semana 1-2: Containerização**
- [ ] Dockerizar PowerShell engine
- [ ] Create API wrapper (ASP.NET)
- [ ] Worker container
- [ ] Local testing

**Semana 3-4: Database & Storage**
- [ ] Schema SQL local
- [ ] Migrations
- [ ] Blob storage integration
- [ ] Backup/restore

**Semana 5-6: Deployment Automation**
- [ ] Bicep template completo
- [ ] One-click deploy
- [ ] Health checks
- [ ] Monitoring setup

**Semana 7-8: Integration & Testing**
- [ ] License validation integration
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] Security audit

**Entregável:** Deploy funcional end-to-end

---

## Fase 3: Beta Customers (4-6 semanas)

**Atividades:**
- [ ] Recrutar 3-5 beta customers
- [ ] Onboarding assistido
- [ ] Coletar feedback
- [ ] Iterar baseado em feedback
- [ ] Case studies

**Entregável:** Produto validado por clientes reais

---

## Fase 4: GA (General Availability) (4-6 semanas)

**Atividades:**
- [ ] Polimento UI/UX
- [ ] Documentation completa
- [ ] Video tutorials
- [ ] Marketing website
- [ ] Billing automation (Stripe/Azure Marketplace)
- [ ] Support infrastructure

**Entregável:** Produto pronto para venda em escala

---

## Fase 5: Scale & Growth (Contínuo)

- [ ] Azure Marketplace listing
- [ ] Partner ecosystem
- [ ] Advanced features (ML, predictions)
- [ ] Mobile app
- [ ] API pública
- [ ] Integrations (ServiceNow, Jira, etc)

---

# 6. VANTAGENS COMPETITIVAS

## vs. Azure Advisor
- ✅ Muito mais profundo (15+ serviços vs. básico)
- ✅ ML predictions
- ✅ Histórico e trending
- ✅ Executive reports
- ✅ ROI tracking

## vs. CloudHealth/Flexera
- ✅ Especializado em Azure (não genérico)
- ✅ Dados ficam no cliente (compliance)
- ✅ Muito mais barato (R$ 999 vs. $1000+)
- ✅ Deploy em minutos (não meses)

## vs. Build in-house
- ✅ Deploy imediato
- ✅ Manutenção incluída
- ✅ Updates automáticos
- ✅ Expertise inclusa
- ✅ Muito mais barato que contratar DevOps

---

# 7. POSICIONAMENTO DE VENDAS

## Pitch Elevator (30 segundos):

*"FinOps Insight Engine é uma plataforma de otimização de custos Azure que roda 100% na SUA infraestrutura. Seus dados nunca saem do seu Azure. Deploy em 10 minutos, economias em 24 horas. Clientes economizam em média 30-40% nos custos Azure. A partir de R$ 999/mês."*

---

## Objeções Comuns:

**"Já temos Azure Advisor"**
→ *"Advisor cobre ~20% das otimizações. Nós cobrimos 15+ serviços com profundidade, ML predictions, e ROI tracking. Clientes típicos encontram 5-10x mais savings conosco."*

**"Nossos dados não podem sair da nossa infra"**
→ *"Perfeito! Por isso criamos arquitetura híbrida. TUDO roda na sua subscription. Nós apenas validamos a licença. Zero dados saem."*

**"É muito caro"**
→ *"Se você economizar R$ 10.000/mês (típico), o ROI é 10x no primeiro mês. E você pode cancelar a qualquer momento."*

**"Não temos tempo para operar mais uma ferramenta"**
→ *"Deploy é automático (10 min). Análises rodam sozinhas. Você só olha os dashboards e aplica recomendações. 95% automatizado."*

---

# 8. PRÓXIMOS PASSOS IMEDIATOS

## Esta Semana:
1. **Validar arquitetura** com você ✅ (este documento)
2. **Decidir tech stack** final (ASP.NET vs Node.js para API?)
3. **Setup Azure subscription** para Control Plane
4. **Iniciar development** do Licensing Service

## Próximas 2 Semanas:
1. Licensing API funcionando
2. Portal básico (frontend)
3. Primeiro ARM template de deploy
4. Containerizar PowerShell engine

## Primeiro Mês:
1. MVP end-to-end funcionando
2. Primeiro cliente beta (você mesmo?)
3. Documentação inicial
4. Pricing finalizado

---

**Questões para Você Decidir:**

1. **Tech Stack API:** ASP.NET Core (C#) ou Node.js (TypeScript)?
2. **Billing:** Direct (Stripe) ou Azure Marketplace primeiro?
3. **Freemium:** Oferecer trial gratuito de 30 dias?
4. **Support:** Contratar support desde o início ou você mesmo?
5. **Nome final:** "FinOps Insight Engine" ou algo mais marketable?

---

**Documento Versão:** 2.0 - Hybrid Architecture  
**Data:** Fevereiro 2026  
**Autor:** Ethienny - Azure Cloud Architect

**Confidencial:** Este documento contém estratégia de produto proprietária.
