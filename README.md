# Painel de Clientes

Sistema web para consulta e cadastro de clientes, contas e agências, desenvolvido para a etapa prática do processo seletivo de estágio em TI do Banestes.

Os dados são lidos **em tempo de execução** de uma planilha do Google (formato CSV), via Fetch API.

## Funcionalidades

- **Lista de clientes** com os dados principais, **10 clientes por página**.
- **Busca** por nome, nome social ou CPF/CNPJ (com ou sem pontuação, sem diferenciar acentos).
- **Filtros** por agência, estado civil e tipo de pessoa (física/jurídica), além de **ordenação**.
- Filtros e página ficam na **URL**: o botão "voltar" do navegador restaura a lista e buscas podem ser compartilhadas.
- **Detalhes do cliente**: todos os dados cadastrais, resumo financeiro, dados da **agência** e todas as **contas** (com barra de limite de crédito utilizado).
- **Cadastro de cliente** com validação (React Hook Form + Zod). O cliente é salvo apenas em memória, com id gerado no navegador, e aparece na lista até a página ser recarregada.
- Botão **"Atualizar dados"**, que lê a planilha novamente sem perder os clientes cadastrados na sessão.
- Interface **responsiva** (celular, tablet e desktop) com **tema escuro** automático.

## Tecnologias

| Tecnologia | Uso |
| --- | --- |
| Vite + React + TypeScript | Base do projeto |
| React Router | Navegação entre páginas |
| PapaParse | Leitura do CSV (trata aspas, vírgulas e quebras de linha dentro de campos) |
| Zod | Validação e conversão dos dados da planilha e do formulário |
| React Hook Form | Controle do formulário de cadastro |
| CSS Modules | Estilos isolados por componente, com variáveis CSS (design tokens) |
| Vitest | Testes automatizados |

## Como executar

Requisitos: Node.js 20+ e npm.

```bash
npm install
npm run dev      # servidor de desenvolvimento em http://localhost:5173
npm test         # testes automatizados
npm run build    # build de produção (pasta dist/)
npm run lint     # análise estática
```

## Organização do código

```
src/
├── types/       Interfaces Cliente, Conta e Agencia (contrato do enunciado)
├── services/    Acesso à planilha (fetch + CSV), conversão e validação dos dados
├── utils/       Funções puras: CPF/CNPJ, formatação, filtros, paginação, schema do formulário
├── context/     Estado global dos dados (DadosProvider)
├── hooks/       useDados, filtros na URL e título da página
├── components/  Componentes reutilizáveis de interface
├── pages/       Páginas: lista, detalhe, cadastro e 404
└── __testes__/  Testes automatizados (com cópia real das abas da planilha)
```

O fluxo dos dados é: `planilha.ts` (baixa e interpreta o CSV) → `normalizacao.ts` (converte cada linha para os tipos do domínio) → `dados.ts` (junta as abas e verifica a consistência entre elas) → `DadosProvider` (disponibiliza para as páginas).

## Tratamento dos dados da planilha

A planilha pode ser alterada a qualquer momento, então nenhuma linha é considerada confiável. Cada linha passa por um schema Zod; se não puder ser convertida, ela é **descartada com um aviso** e o restante do sistema continua funcionando. Os avisos aparecem de forma discreta no topo da lista ("N inconsistências encontradas").

Situações encontradas nos dados e decisões tomadas:

| Situação | Decisão |
| --- | --- |
| CPFs com zeros à esquerda perdidos (o Google Sheets trata a coluna como número, ex.: `1010101010`) | Completar com zeros até 11 dígitos (CPF) ou 14 (CNPJ), nos clientes e nas contas, para manter o vínculo entre eles |
| Conta com CPF `0` (sem dono) | Descartada, com aviso |
| Cliente ligado a uma agência inexistente (`9999`) | Cliente exibido normalmente; no detalhe aparece "Agência não encontrada" |
| RG `ISENTO` ou vazio | Tratado como não informado (campo opcional `rg?`) |
| Colunas extras sem nome no cabeçalho | Ignoradas: as colunas são lidas pelo nome, não pela posição |
| Data de "nascimento" de pessoa jurídica | Exibida como "Data de fundação" |
| Nome social preenchido | Exibido como nome principal, com o nome civil nos dados cadastrais |
| Variações de texto (`casada`, `VIÚVA`, `Poupança`) | Normalizadas para os valores da interface (`Casado`, `Viúvo`, `poupanca`) |
| Números em formato brasileiro (`1.234,56`) | Aceitos além do formato da planilha (`1234.56`) |
| Datas `AAAA-MM-DD` | Criadas no fuso local, para não aparecerem um dia antes no Brasil |
| Coluna obrigatória removida ou planilha privada | Mensagem de erro clara com botão "Tentar novamente" |
| ids ou CPFs repetidos | Mantida a primeira ocorrência, com aviso |

## Acessibilidade

- HTML semântico (`header`, `nav`, `main`, `search`, `section`, listas e `dl`), com um único `h1` por página.
- Link "Pular para o conteúdo" e foco visível em todos os elementos interativos.
- Ao trocar de página, o foco vai para o título da nova página e o título da aba do navegador é atualizado.
- Todos os campos têm rótulo; erros do formulário usam `aria-invalid` e `aria-describedby`, e o foco vai para o primeiro campo inválido.
- A contagem de resultados da busca é anunciada por leitores de tela (`aria-live`).
- Contraste de cores dentro do padrão WCAG AA, nos temas claro e escuro; respeita `prefers-reduced-motion`.
- Verificado com o axe-core, sem violações nas páginas de lista, detalhe e cadastro.
