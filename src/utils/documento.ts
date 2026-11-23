/**
 * Funções para tratar CPF e CNPJ.
 *
 * Internamente o sistema sempre guarda o documento só com dígitos
 * (ex.: "01234567890"). A pontuação é aplicada apenas na exibição.
 */

import type { TipoPessoa } from '../types/modelos';

export const TAMANHO_CPF = 11;
export const TAMANHO_CNPJ = 14;

/** Remove tudo que não for dígito: "123.456.789-09" → "12345678909". */
export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

/**
 * Normaliza um documento vindo da planilha.
 *
 * O Google Sheets interpreta CPFs como números e descarta os zeros à esquerda
 * ("01010101010" chega como "1010101010"). Para recuperar o valor original,
 * completamos com zeros até 11 dígitos (CPF) ou 14 dígitos (CNPJ).
 *
 * Retorna `null` quando o valor não pode ser um CPF/CNPJ (vazio, zero ou longo demais).
 */
export function normalizarDocumento(valor: string): string | null {
  const digitos = somenteDigitos(valor);
  if (digitos === '' || /^0+$/.test(digitos)) return null;
  if (digitos.length <= TAMANHO_CPF) return digitos.padStart(TAMANHO_CPF, '0');
  if (digitos.length <= TAMANHO_CNPJ) return digitos.padStart(TAMANHO_CNPJ, '0');
  return null;
}

/** Identifica se o documento (já normalizado) é de pessoa física ou jurídica. */
export function tipoPessoa(documento: string): TipoPessoa {
  return documento.length === TAMANHO_CNPJ ? 'PJ' : 'PF';
}

/** Aplica a máscara de exibição: 000.000.000-00 ou 00.000.000/0000-00. */
export function formatarDocumento(documento: string): string {
  const d = somenteDigitos(documento);
  if (d.length === TAMANHO_CPF) {
    return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  if (d.length === TAMANHO_CNPJ) {
    return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  return documento;
}

/**
 * Aplica a máscara progressivamente enquanto o usuário digita.
 * Até 11 dígitos usa o formato de CPF; acima disso, o de CNPJ.
 */
export function mascararDocumentoParcial(valor: string): string {
  const d = somenteDigitos(valor).slice(0, TAMANHO_CNPJ);
  if (d.length <= TAMANHO_CPF) {
    return d
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
  }
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/**
 * Calcula um dígito verificador pelo algoritmo do módulo 11,
 * usado tanto no CPF quanto no CNPJ (só os pesos mudam).
 */
function digitoVerificador(base: string, pesos: number[]): number {
  const soma = pesos.reduce((total, peso, i) => total + Number(base[i]) * peso, 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/** Valida um CPF conferindo os dois dígitos verificadores. */
export function validarCpf(cpf: string): boolean {
  const d = somenteDigitos(cpf);
  // Sequências repetidas (111.111.111-11 etc.) passam no cálculo, mas são inválidas.
  if (d.length !== TAMANHO_CPF || /^(\d)\1+$/.test(d)) return false;

  const dv1 = digitoVerificador(d, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const dv2 = digitoVerificador(d, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return dv1 === Number(d[9]) && dv2 === Number(d[10]);
}

/** Valida um CNPJ conferindo os dois dígitos verificadores. */
export function validarCnpj(cnpj: string): boolean {
  const d = somenteDigitos(cnpj);
  if (d.length !== TAMANHO_CNPJ || /^(\d)\1+$/.test(d)) return false;

  const dv1 = digitoVerificador(d, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const dv2 = digitoVerificador(d, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return dv1 === Number(d[12]) && dv2 === Number(d[13]);
}
