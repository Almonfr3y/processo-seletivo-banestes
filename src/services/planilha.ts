/**
 * Acesso à planilha do Google que serve como "API" de dados.
 *
 * Cada aba é baixada em formato CSV via Fetch API e convertida em uma lista de
 * objetos { nomeDaColuna: valor } com a biblioteca PapaParse. Nesta camada os
 * valores ainda são todos texto: a conversão para os tipos do domínio acontece
 * em `normalizacao.ts`.
 */

import Papa from 'papaparse';

const ID_PLANILHA = '1LkyaeCgiyaIN1IxXnbZQPmVMIcht3PIxMDUXHsvczK0';

export type NomeAba = 'clientes' | 'contas' | 'agencias';

/** Uma linha do CSV: chave = nome da coluna (cabeçalho), valor = conteúdo da célula. */
export type LinhaCsv = Record<string, string | undefined>;

/** Erro com mensagem amigável, pensada para ser exibida ao usuário. */
export class ErroPlanilha extends Error {
  constructor(mensagem: string, options?: ErrorOptions) {
    super(mensagem, options);
    this.name = 'ErroPlanilha';
  }
}

/** Monta a URL de exportação em CSV de uma aba da planilha. */
export function urlDaAba(aba: NomeAba): string {
  return `https://docs.google.com/spreadsheets/d/${ID_PLANILHA}/gviz/tq?tqx=out:csv&sheet=${aba}`;
}

/**
 * Baixa uma aba da planilha e devolve suas linhas.
 *
 * @param colunasObrigatorias colunas que precisam existir no cabeçalho. Se faltar
 *   alguma, a estrutura da planilha mudou e não é seguro continuar.
 * @param signal permite cancelar a requisição (ex.: quando o componente é desmontado).
 */
export async function buscarAba(
  aba: NomeAba,
  colunasObrigatorias: readonly string[],
  signal?: AbortSignal,
): Promise<LinhaCsv[]> {
  let resposta: Response;
  try {
    // `no-store` garante que sempre leremos a versão mais recente da planilha.
    resposta = await fetch(urlDaAba(aba), { signal, cache: 'no-store' });
  } catch (erro) {
    if (signal?.aborted) throw erro; // cancelamento não é erro de rede
    throw new ErroPlanilha('Não foi possível conectar à planilha. Verifique sua conexão com a internet.', {
      cause: erro,
    });
  }

  if (!resposta.ok) {
    throw new ErroPlanilha(`A planilha respondeu com erro ao carregar "${aba}" (HTTP ${resposta.status}).`);
  }

  // Se a planilha deixar de ser pública, o Google devolve uma página HTML de login.
  const tipoConteudo = resposta.headers.get('content-type') ?? '';
  if (!tipoConteudo.includes('text/csv')) {
    throw new ErroPlanilha(`A aba "${aba}" não retornou dados em CSV. A planilha pode não estar mais pública.`);
  }

  const texto = await resposta.text();
  return interpretarCsv(texto, aba, colunasObrigatorias);
}

/** Converte o texto CSV em objetos, usando a primeira linha como cabeçalho. */
export function interpretarCsv(texto: string, aba: NomeAba, colunasObrigatorias: readonly string[]): LinhaCsv[] {
  const resultado = Papa.parse<LinhaCsv>(texto, {
    header: true,
    skipEmptyLines: 'greedy', // ignora linhas vazias ou só com vírgulas
    transformHeader: (cabecalho) => cabecalho.trim(),
  });

  const cabecalho = resultado.meta.fields ?? [];
  const faltando = colunasObrigatorias.filter((coluna) => !cabecalho.includes(coluna));
  if (faltando.length > 0) {
    throw new ErroPlanilha(`A aba "${aba}" não possui as colunas esperadas: ${faltando.join(', ')}.`);
  }

  return resultado.data;
}
