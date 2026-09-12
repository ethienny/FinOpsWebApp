# Correções de Server/Client Components

Foram corrigidas as tabelas das páginas /, /opportunities, /resources,
/showback, /sizing, /engine-health e /run-history.

Cada página continua sendo um Server Component com sua consulta no servidor.
As colunas e suas funções render/sortValue agora ficam em sete componentes
específicos em components/tables. As páginas passam apenas linhas e, quando
necessário, a moeda. Colunas, filtros, busca, paginação e formatação foram preservados.
Não foi usado "use server" como workaround.

A tabela em ResourceDetail já estava dentro de um componente cliente.
Não foram encontrados outros casos de cell/formatter atravessando a fronteira
servidor/cliente no código recebido.

Correções complementares:
- Import do tipo FinOpsRecommendation no repositório.
- Tipagem de VerticalBars compatível com as séries recebidas.
- Codificação dos links de recursos compatível com o navegador e com os IDs
  base64url existentes, incluindo Unicode.
- Script lint atualizado para executar ESLint diretamente.
- Remoção de um import sem uso em ResourceDetail.

## Como aplicar

1. Faça uma cópia de segurança do projeto atual.
2. Extraia este ZIP na raiz do projeto, substituindo os arquivos correspondentes.
3. Preserve seu package-lock.json e seus arquivos .env locais: eles não vieram
   no ZIP recebido e não são incluídos nesta entrega.
4. Se necessário, execute npm install. Execute npm run typecheck e npm run lint.
5. Inicie com npm run dev e confira as sete páginas, ordenação, busca, filtros
   e os links para os detalhes dos recursos.

## Validação

- TypeScript: passou sem erros.
- ESLint completo: sem erros; encontrou apenas um import sem uso, removido.
- Verificação adicional: sete tabelas cliente, páginas preservadas no servidor,
  ausência de callbacks de tabela em app e compatibilidade dos IDs de recursos.
- Servidor dev: tentativa impedida por spawn EPERM no ambiente de execução.
  Portanto, a navegação e interação no navegador não foram validadas aqui.
- Build de produção não executado.

Foram usadas as dependências já instaladas no computador (Next 15.5.25 e
TypeScript 5.9.3). O ZIP original não continha package-lock.json.

Esta entrega contém os arquivos originais recebidos, com as correções acima.
node_modules, .next e arquivos temporários de validação não são incluídos.
