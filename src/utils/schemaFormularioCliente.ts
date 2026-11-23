/**
 * Regras de validação do formulário de cadastro de cliente (Zod).
 *
 * Os campos do formulário são sempre texto; o schema valida cada um e já
 * converte para os tipos da interface Cliente (número, Date, enum...).
 * O schema é criado por uma função porque depende dos dados atuais:
 * não pode repetir um CPF/CNPJ existente e a agência precisa existir.
 */

import { z } from 'zod';
import { ESTADOS_CIVIS } from '../types/modelos';
import type { Cliente } from '../types/modelos';
import { somenteDigitos, TAMANHO_CNPJ, TAMANHO_CPF, validarCnpj, validarCpf } from './documento';
import { converterData, converterNumero } from './formatadores';

const DATA_MINIMA = new Date(1900, 0, 1);

/** Valor monetário digitado ("1.500,00", "1500.5"...), sem valores negativos. */
const valorMonetario = (campo: string) =>
  z
    .string()
    .trim()
    .min(1, `Informe ${campo}.`)
    .transform((texto, ctx) => {
      const valor = converterNumero(texto);
      if (valor === null) {
        ctx.addIssue({ code: 'custom', message: 'Digite um valor numérico, como 1.500,00.' });
        return z.NEVER;
      }
      if (valor < 0) {
        ctx.addIssue({ code: 'custom', message: 'O valor não pode ser negativo.' });
        return z.NEVER;
      }
      return valor;
    });

/** Texto opcional: vazio vira `undefined` (campo opcional da interface). */
const textoOpcional = (maximo: number) =>
  z
    .string()
    .trim()
    .max(maximo, `Use no máximo ${maximo} caracteres.`)
    .transform((texto) => (texto === '' ? undefined : texto));

export function criarSchemaCliente(documentosExistentes: ReadonlySet<string>, codigosAgencia: ReadonlySet<number>) {
  return z.object({
    cpfCnpj: z
      .string()
      .transform(somenteDigitos)
      .superRefine((doc, ctx) => {
        const erro = (message: string) => ctx.addIssue({ code: 'custom', message });
        if (doc.length === 0) return erro('Informe o CPF ou CNPJ.');
        if (doc.length !== TAMANHO_CPF && doc.length !== TAMANHO_CNPJ) {
          return erro('O CPF deve ter 11 dígitos e o CNPJ, 14.');
        }
        const valido = doc.length === TAMANHO_CPF ? validarCpf(doc) : validarCnpj(doc);
        if (!valido) return erro(`${doc.length === TAMANHO_CPF ? 'CPF' : 'CNPJ'} inválido. Confira os dígitos.`);
        if (documentosExistentes.has(doc)) return erro('Já existe um cliente cadastrado com este documento.');
      }),

    rg: textoOpcional(20),

    nome: z.string().trim().min(3, 'Informe o nome completo (mínimo de 3 letras).').max(120, 'Nome muito longo.'),

    nomeSocial: textoOpcional(120),

    dataNascimento: z
      .string()
      .min(1, 'Informe a data.')
      .transform((texto, ctx) => {
        const data = converterData(texto);
        if (data === null) {
          ctx.addIssue({ code: 'custom', message: 'Data inválida.' });
          return z.NEVER;
        }
        if (data > new Date()) {
          ctx.addIssue({ code: 'custom', message: 'A data não pode estar no futuro.' });
          return z.NEVER;
        }
        if (data < DATA_MINIMA) {
          ctx.addIssue({ code: 'custom', message: 'Informe uma data a partir de 1900.' });
          return z.NEVER;
        }
        return data;
      }),

    estadoCivil: z.enum(ESTADOS_CIVIS, { error: 'Selecione o estado civil.' }),

    email: z
      .string()
      .trim()
      .min(1, 'Informe o e-mail.')
      .pipe(z.email('Digite um e-mail válido, como nome@exemplo.com.')),

    endereco: z.string().trim().min(5, 'Informe o endereço completo.').max(200, 'Endereço muito longo.'),

    rendaAnual: valorMonetario('a renda anual'),

    patrimonio: valorMonetario('o patrimônio'),

    codigoAgencia: z
      .string()
      .min(1, 'Selecione a agência.')
      .transform(Number)
      .refine((codigo) => codigosAgencia.has(codigo), 'Selecione uma agência válida.'),
  }) satisfies z.ZodType<Omit<Cliente, 'id'>>;
}

export type SchemaCliente = ReturnType<typeof criarSchemaCliente>;
/** Valores do formulário (o que o usuário digita). */
export type EntradaFormularioCliente = z.input<SchemaCliente>;
/** Valores após validação (prontos para virar um Cliente). */
export type SaidaFormularioCliente = z.output<SchemaCliente>;

export const VALORES_INICIAIS: EntradaFormularioCliente = {
  cpfCnpj: '',
  rg: '',
  nome: '',
  nomeSocial: '',
  dataNascimento: '',
  // Começa vazio para obrigar uma escolha consciente no <select>.
  estadoCivil: '' as EntradaFormularioCliente['estadoCivil'],
  email: '',
  endereco: '',
  rendaAnual: '',
  patrimonio: '',
  codigoAgencia: '',
};
