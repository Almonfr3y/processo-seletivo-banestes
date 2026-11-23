/**
 * Modelos de domínio do sistema.
 *
 * As interfaces Cliente, Conta e Agencia seguem exatamente o contrato definido
 * no enunciado. Os valores possíveis de campos fechados (estado civil e tipo de
 * conta) ficam em arrays `as const` para que possam ser usados tanto como tipo
 * quanto em tempo de execução (selects do formulário, validação com Zod etc.).
 */

export const ESTADOS_CIVIS = ['Solteiro', 'Casado', 'Viúvo', 'Divorciado'] as const;
export type EstadoCivil = (typeof ESTADOS_CIVIS)[number];

export const TIPOS_CONTA = ['corrente', 'poupanca'] as const;
export type TipoConta = (typeof TIPOS_CONTA)[number];

export interface Cliente {
  id: string;
  cpfCnpj: string;
  rg?: string;
  dataNascimento: Date;
  nome: string;
  nomeSocial?: string;
  email: string;
  endereco: string;
  rendaAnual: number;
  patrimonio: number;
  estadoCivil: EstadoCivil;
  codigoAgencia: number;
}

export interface Conta {
  id: string;
  cpfCnpjCliente: string;
  tipo: TipoConta;
  saldo: number;
  limiteCredito: number;
  creditoDisponivel: number;
}

export interface Agencia {
  id: string;
  codigo: number;
  nome: string;
  endereco: string;
}

/** Pessoa física (CPF, 11 dígitos) ou jurídica (CNPJ, 14 dígitos). */
export type TipoPessoa = 'PF' | 'PJ';

/**
 * Problema encontrado ao ler ou relacionar os dados da planilha.
 * Os avisos não interrompem o sistema: são exibidos de forma discreta
 * para que o usuário saiba que algum registro foi ignorado ou está incompleto.
 */
export interface AvisoDados {
  aba: 'clientes' | 'contas' | 'agencias';
  /** Identificador do registro (ou número da linha, se não houver id). */
  registro: string;
  mensagem: string;
}
