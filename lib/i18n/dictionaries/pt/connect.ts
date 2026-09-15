import type { connect as en } from "../en/connect";
import type { Widen } from "../widen";

export const connect: Widen<typeof en> = {
  azureConnection: "Conexão com o Azure",
  connectedPrefix: "Conectado em",
  via: "via",
  by: "por",
  methodLighthouse: "Azure Lighthouse",
  methodAppRegistration: "Registro de aplicativo",
  notConnectedYet: "Nenhuma assinatura conectada ainda. Siga os três passos abaixo.",
  disconnect: "Desconectar",
  emulationNote:
    "Emulação: esta página registra a conexão sem chamar o Azure. Os papéis, o template e os comandos são os mesmos que um cliente usaria.",
  step1: {
    title: "O que pedimos: três papéis somente leitura, nada que escreva",
    footer:
      "O produto nunca pede Contributor ou Owner e nunca altera nada na sua assinatura. As recomendações são aplicadas pela sua equipe.",
  },
  step2: {
    title: "Delegue acesso com o Azure Lighthouse",
    introBeforeFile: "Salve o template abaixo como",
    introAfterFile: "e implante-o na sua assinatura. A delegação aparece em",
    servicesProviders: "Provedores de serviço",
    introEnd: "no seu portal do Azure, onde você pode revisar e remover a qualquer momento.",
    placeholderWarning:
      "A identidade do provedor é um placeholder. Defina FINOPS_PROVIDER_TENANT_ID e FINOPS_PROVIDER_PRINCIPAL_ID no ambiente para que o template use seu tenant e service principal reais.",
    lighthouseTemplate: "Template do Lighthouse",
    deployWithCli: "Implantar com o Azure CLI",
  },
  step3: {
    title: "Verifique a conexão e saiba como revogá-la",
    revokeTitle: "Revogue pelo seu lado, quando quiser",
    revokeNote:
      "Revogar remove todas as permissões de uma vez. Nenhuma ação do nosso lado é necessária, e nada que você remova depende de nós.",
  },
  form: {
    subscriptionId: "ID da assinatura",
    displayName: "Nome de exibição",
    displayNamePlaceholder: "Assinatura de produção",
    method: "Método",
    checking: "Verificando...",
    verifyAndConnect: "Verificar e conectar",
  },
  copyBlock: {
    copy: "Copiar",
    copied: "Copiado",
  },
  rolePurposes: {
    Reader: "Inventário: nomes de recursos, tipos, tamanhos, regiões e tags.",
    "Cost Management Reader": "Custo por recurso e por assinatura via Cost Management.",
    "Monitoring Reader": "Métricas de uso como CPU, memória e throughput do Azure Monitor.",
  },
  errors: {
    subscriptionIdGuid: "O ID da assinatura deve ser um GUID.",
    checkFields: "Verifique os campos e tente novamente.",
  },
  success: "Conexão registrada. Na emulação, nenhuma chamada ao Azure é feita.",
};
