/**
 * Conversão das linhas do CSV (só texto) para os modelos do domínio.
 *
 * Cada aba tem um schema Zod que descreve como transformar e validar cada
 * coluna. A planilha pode ser alterada a qualquer momento, então nenhuma linha
 * é considerada confiável: se uma linha não puder ser convertida, ela é
 * descartada e gera um aviso, mas o restante dos dados continua funcionando.
 */

import { z } from 'zod';
import type { Agencia, AvisoDados, Cliente, Conta, EstadoCivil, TipoConta } from '../types/modelos';
import { normalizarDocumento } from '../utils/documento';
import { converterData, converterNumero, normalizarTexto } from '../utils/formatadores';
import type { LinhaCsv, NomeAba } from './planilha';

/* -------------------------------------------------------------------------- */
/* Blocos reutilizáveis para descrever colunas                                */
/* -------------------------------------------------------------------------- */

/** Célula de texto: ausente vira "" e espaços nas pontas são removidos. */
const celula = z
  .string()
  .optional()
  .transform((valor) => (valor ?? '').trim());

/** Texto que não pode ficar vazio. */
const textoObrigatorio = (campo: string) => celula.pipe(z.string().min(1, `${campo} vazio`));

/** Texto opcional: célula vazia vira `undefined` (campo ausente na interface). */
const textoOpcional = celula.transform((valor) => (valor === '' ? undefined : valor));

/** Número decimal ("85000.00", "85.000,00"...). */
const numero = (campo: string) =>
  celula.transform((valor, ctx) => {
    const convertido = converterNumero(valor);
    if (convertido === null) {
      ctx.addIssue({ code: 'custom', message: `${campo} inválido ("${valor}")` });
      return z.NEVER;
    }
    return convertido;
  });

/** Número que não pode ser negativo (renda, limite de crédito...). */
const numeroNaoNegativo = (campo: string) => numero(campo).pipe(z.number().min(0, `${campo} negativo`));

/** Número inteiro (códigos de agência). */
const inteiro = (campo: string) => numero(campo).pipe(z.number().int(`${campo} não é um número inteiro`));

/** CPF ou CNPJ, recuperando zeros à esquerda perdidos pelo Google Sheets. */
const documento = (campo: string) =>
  celula.transform((valor, ctx) => {
    const normalizado = normalizarDocumento(valor);
    if (normalizado === null) {
      ctx.addIssue({ code: 'custom', message: `${campo} inválido ("${valor}")` });
      return z.NEVER;
    }
    return normalizado;
  });

/** Data no formato AAAA-MM-DD ou DD/MM/AAAA. */
const data = (campo: string) =>
  celula.transform((valor, ctx) => {
    const convertida = converterData(valor);
    if (convertida === null) {
      ctx.addIssue({ code: 'custom', message: `${campo} inválida ("${valor}")` });
      return z.NEVER;
    }
    return convertida;
  });

/**
 * Valor de uma lista fechada, tolerante a maiúsculas, acentos e variações
 * (ex.: "viuva", "VIÚVO" e "Viúva" viram "Viúvo").
 */
function valorDeLista<T extends string>(campo: string, sinonimos: Record<string, T>) {
  return celula.transform((valor, ctx) => {
    const encontrado = sinonimos[normalizarTexto(valor)];
    if (encontrado === undefined) {
      ctx.addIssue({ code: 'custom', message: `${campo} desconhecido ("${valor}")` });
      return z.NEVER;
    }
    return encontrado;
  });
}

const SINONIMOS_ESTADO_CIVIL: Record<string, EstadoCivil> = {
  solteiro: 'Solteiro',
  solteira: 'Solteiro',
  casado: 'Casado',
  casada: 'Casado',
  viuvo: 'Viúvo',
  viuva: 'Viúvo',
  divorciado: 'Divorciado',
  divorciada: 'Divorciado',
};

const SINONIMOS_TIPO_CONTA: Record<string, TipoConta> = {
  corrente: 'corrente',
  'conta corrente': 'corrente',
  poupanca: 'poupanca',
  'conta poupanca': 'poupanca',
};

/* -------------------------------------------------------------------------- */
/* Schemas de cada aba                                                        */
/* -------------------------------------------------------------------------- */

/** Valores que, na coluna RG, significam "cliente sem RG". */
const RG_SEM_VALOR = new Set(['isento', 'nao possui', 'n/a', '-']);

const schemaCliente = z.object({
  id: textoObrigatorio('id'),
  cpfCnpj: documento('CPF/CNPJ'),
  // A planilha usa "ISENTO" para empresas; tratamos como RG não informado.
  rg: textoOpcional.transform((rg) => (rg && RG_SEM_VALOR.has(normalizarTexto(rg)) ? undefined : rg)),
  dataNascimento: data('data de nascimento'),
  nome: textoObrigatorio('nome'),
  nomeSocial: textoOpcional,
  email: textoObrigatorio('e-mail'),
  endereco: textoObrigatorio('endereço'),
  rendaAnual: numeroNaoNegativo('renda anual'),
  patrimonio: numero('patrimônio'),
  estadoCivil: valorDeLista('estado civil', SINONIMOS_ESTADO_CIVIL),
  codigoAgencia: inteiro('código da agência'),
}) satisfies z.ZodType<Cliente, LinhaCsv>;

const schemaConta = z.object({
  id: textoObrigatorio('id'),
  cpfCnpjCliente: documento('CPF/CNPJ do cliente'),
  tipo: valorDeLista('tipo de conta', SINONIMOS_TIPO_CONTA),
  saldo: numero('saldo'), // saldo negativo é possível (conta no cheque especial)
  limiteCredito: numeroNaoNegativo('limite de crédito'),
  creditoDisponivel: numeroNaoNegativo('crédito disponível'),
}) satisfies z.ZodType<Conta, LinhaCsv>;

const schemaAgencia = z.object({
  id: textoObrigatorio('id'),
  codigo: inteiro('código'),
  nome: textoObrigatorio('nome'),
  endereco: textoObrigatorio('endereço'),
}) satisfies z.ZodType<Agencia, LinhaCsv>;

/** Colunas que cada aba precisa ter no cabeçalho para ser lida. */
export const COLUNAS = {
  clientes: Object.keys(schemaCliente.shape),
  contas: Object.keys(schemaConta.shape),
  agencias: Object.keys(schemaAgencia.shape),
} as const satisfies Record<NomeAba, string[]>;

/* -------------------------------------------------------------------------- */
/* Conversão de uma aba inteira                                               */
/* -------------------------------------------------------------------------- */

export interface ResultadoConversao<T> {
  itens: T[];
  avisos: AvisoDados[];
}

/**
 * Converte todas as linhas de uma aba usando o schema correspondente.
 * Linhas inválidas são descartadas e registradas como aviso.
 */
function converterAba<T>(aba: NomeAba, linhas: LinhaCsv[], schema: z.ZodType<T, LinhaCsv>): ResultadoConversao<T> {
  const itens: T[] = [];
  const avisos: AvisoDados[] = [];

  linhas.forEach((linha, indice) => {
    const resultado = schema.safeParse(linha);
    if (resultado.success) {
      itens.push(resultado.data);
    } else {
      // +2: a linha 1 da planilha é o cabeçalho e o índice começa em 0.
      const registro = linha.id?.trim() || `linha ${indice + 2}`;
      const motivos = resultado.error.issues.map((issue) => issue.message).join('; ');
      avisos.push({ aba, registro, mensagem: `Registro ignorado: ${motivos}.` });
    }
  });

  return { itens, avisos };
}

export const converterClientes = (linhas: LinhaCsv[]) => converterAba('clientes', linhas, schemaCliente);
export const converterContas = (linhas: LinhaCsv[]) => converterAba('contas', linhas, schemaConta);
export const converterAgencias = (linhas: LinhaCsv[]) => converterAba('agencias', linhas, schemaAgencia);
