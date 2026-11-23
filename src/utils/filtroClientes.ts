/**
 * Regras de busca, filtro, ordenação e paginação da lista de clientes.
 * São funções puras (sem React), fáceis de testar e reutilizar.
 */

import type { Cliente, EstadoCivil, TipoPessoa } from '../types/modelos';
import { somenteDigitos, tipoPessoa } from './documento';
import { normalizarTexto } from './formatadores';

export const CLIENTES_POR_PAGINA = 10;

export const ORDENACOES = {
  'nome-asc': 'Nome (A–Z)',
  'nome-desc': 'Nome (Z–A)',
  'renda-desc': 'Maior renda anual',
  'patrimonio-desc': 'Maior patrimônio',
} as const;
export type Ordenacao = keyof typeof ORDENACOES;

export interface FiltrosClientes {
  /** Texto livre: busca por nome, nome social ou CPF/CNPJ. */
  busca: string;
  codigoAgencia: number | null;
  estadoCivil: EstadoCivil | null;
  tipoPessoa: TipoPessoa | null;
  ordenacao: Ordenacao;
}

export const FILTROS_PADRAO: FiltrosClientes = {
  busca: '',
  codigoAgencia: null,
  estadoCivil: null,
  tipoPessoa: null,
  ordenacao: 'nome-asc',
};

/** Nome exibido do cliente: o nome social tem prioridade quando existe. */
export function nomeExibicao(cliente: Cliente): string {
  return cliente.nomeSocial ?? cliente.nome;
}

/** Verifica se o cliente corresponde ao texto digitado na busca. */
function correspondeBusca(cliente: Cliente, busca: string): boolean {
  const termo = normalizarTexto(busca);
  if (termo === '') return true;

  const nomes = normalizarTexto(`${cliente.nome} ${cliente.nomeSocial ?? ''}`);
  if (nomes.includes(termo)) return true;

  // Para o documento comparamos só os dígitos, assim "123.456" e "123456" funcionam.
  const digitosBusca = somenteDigitos(busca);
  return digitosBusca.length > 0 && cliente.cpfCnpj.includes(digitosBusca);
}

const comparadorNome = new Intl.Collator('pt-BR', { sensitivity: 'base' });

const COMPARADORES: Record<Ordenacao, (a: Cliente, b: Cliente) => number> = {
  'nome-asc': (a, b) => comparadorNome.compare(nomeExibicao(a), nomeExibicao(b)),
  'nome-desc': (a, b) => comparadorNome.compare(nomeExibicao(b), nomeExibicao(a)),
  'renda-desc': (a, b) => b.rendaAnual - a.rendaAnual,
  'patrimonio-desc': (a, b) => b.patrimonio - a.patrimonio,
};

/** Aplica busca, filtros e ordenação, devolvendo uma nova lista. */
export function filtrarClientes(clientes: Cliente[], filtros: FiltrosClientes): Cliente[] {
  return clientes
    .filter(
      (c) =>
        correspondeBusca(c, filtros.busca) &&
        (filtros.codigoAgencia === null || c.codigoAgencia === filtros.codigoAgencia) &&
        (filtros.estadoCivil === null || c.estadoCivil === filtros.estadoCivil) &&
        (filtros.tipoPessoa === null || tipoPessoa(c.cpfCnpj) === filtros.tipoPessoa),
    )
    .sort(COMPARADORES[filtros.ordenacao]);
}

export interface Pagina<T> {
  itens: T[];
  paginaAtual: number;
  totalPaginas: number;
  totalItens: number;
  /** Posição (base 1) do primeiro e do último item exibidos, para "Mostrando 11–20 de 95". */
  inicio: number;
  fim: number;
}

/**
 * Recorta a lista na página pedida. Páginas fora do intervalo são ajustadas
 * (ex.: página 9 de uma lista com 3 páginas mostra a página 3).
 */
export function paginar<T>(itens: T[], pagina: number, porPagina = CLIENTES_POR_PAGINA): Pagina<T> {
  const totalPaginas = Math.max(1, Math.ceil(itens.length / porPagina));
  const paginaAtual = Math.min(Math.max(1, Math.trunc(pagina) || 1), totalPaginas);
  const inicioIndice = (paginaAtual - 1) * porPagina;
  const recorte = itens.slice(inicioIndice, inicioIndice + porPagina);

  return {
    itens: recorte,
    paginaAtual,
    totalPaginas,
    totalItens: itens.length,
    inicio: recorte.length > 0 ? inicioIndice + 1 : 0,
    fim: inicioIndice + recorte.length,
  };
}

export type ItemPaginacao = number | 'reticencias';

/**
 * Calcula quais números de página exibir no componente de paginação.
 * Até 7 páginas mostra todas; acima disso, a primeira, a última e as vizinhas
 * da atual, com reticências nos saltos (ex.: 1 … 4 5 6 … 10).
 */
export function itensPaginacao(atual: number, total: number): ItemPaginacao[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const paginas = new Set([1, total, atual - 1, atual, atual + 1]);
  const ordenadas = [...paginas].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const itens: ItemPaginacao[] = [];
  ordenadas.forEach((pagina, i) => {
    const anterior = ordenadas[i - 1];
    if (anterior !== undefined && pagina - anterior > 1) itens.push('reticencias');
    itens.push(pagina);
  });
  return itens;
}
