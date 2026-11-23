/**
 * Conversões de texto ↔ valores (números e datas) e formatação para exibição.
 * Todas as saídas seguem o padrão brasileiro (pt-BR).
 */

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatoMoedaCompacta = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const formatoData = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' });
const formatoDataCurta = new Intl.DateTimeFormat('pt-BR');

/** 1234.5 → "R$ 1.234,50" */
export function formatarMoeda(valor: number): string {
  return formatoMoeda.format(valor);
}

/** 1250000 → "R$ 1,3 mi" (usado onde o espaço é curto, como na listagem). */
export function formatarMoedaCompacta(valor: number): string {
  return formatoMoedaCompacta.format(valor);
}

/** Date → "14 de maio de 1990" */
export function formatarData(data: Date): string {
  return formatoData.format(data);
}

/** Date → "14/05/1990" */
export function formatarDataCurta(data: Date): string {
  return formatoDataCurta.format(data);
}

/**
 * Converte texto em número aceitando os formatos mais comuns:
 * "85000.00" (padrão da planilha), "85.000,00" e "85000,5" (padrão brasileiro).
 * Retorna `null` quando o texto não representa um número.
 */
export function converterNumero(texto: string): number | null {
  let t = texto
    .trim()
    .replace(/^R\$\s*/i, '')
    .replace(/\s/g, '');
  if (t === '') return null;

  if (t.includes(',')) {
    // Vírgula presente: ela é o separador decimal e os pontos são de milhar.
    t = t.replace(/\./g, '').replace(',', '.');
  }

  if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
}

/**
 * Converte texto em data aceitando "AAAA-MM-DD" (padrão da planilha) e "DD/MM/AAAA".
 *
 * A data é criada no fuso local de propósito: `new Date("1990-05-14")` seria
 * interpretado como meia-noite UTC e, no Brasil (UTC-3), apareceria como 13/05.
 * Retorna `null` para datas inexistentes (ex.: 31/02).
 */
export function converterData(texto: string): Date | null {
  const t = texto.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t);

  let ano: number, mes: number, dia: number;
  if (iso) [ano, mes, dia] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else if (br) [dia, mes, ano] = [Number(br[1]), Number(br[2]), Number(br[3])];
  else return null;

  const data = new Date(ano, mes - 1, dia);
  // Se o JavaScript "corrigiu" a data (31/02 → 03/03), ela não existia.
  const valida = data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
  return valida ? data : null;
}

/** Idade (ou tempo de fundação) em anos completos até hoje. */
export function calcularIdade(data: Date, hoje = new Date()): number {
  let anos = hoje.getFullYear() - data.getFullYear();
  const aindaNaoFezAniversario =
    hoje.getMonth() < data.getMonth() || (hoje.getMonth() === data.getMonth() && hoje.getDate() < data.getDate());
  if (aindaNaoFezAniversario) anos--;
  return anos;
}

/** "Ana Maria Souza" → "AS" (usado no avatar do cliente). */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

/**
 * Prepara um texto para busca: minúsculas e sem acentos.
 * Assim "joao" encontra "João" e "VIUVO" encontra "Viúvo".
 */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}
