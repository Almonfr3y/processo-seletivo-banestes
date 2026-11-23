/**
 * Definição do contexto que compartilha os dados bancários com toda a aplicação.
 * (O componente provedor fica em `DadosProvider.tsx` e o hook de acesso em
 * `hooks/useDados.ts`, separação exigida pelo Fast Refresh do Vite.)
 */

import { createContext } from 'react';
import type { Agencia, AvisoDados, Cliente, Conta } from '../types/modelos';

/** Etapas do carregamento dos dados da planilha. */
export type StatusCarregamento = 'carregando' | 'sucesso' | 'erro';

export interface ValorContextoDados {
  status: StatusCarregamento;
  /** Mensagem amigável quando `status === 'erro'`. */
  erro: string | null;
  /** Clientes da planilha + clientes cadastrados nesta sessão. */
  clientes: Cliente[];
  contas: Conta[];
  agencias: Agencia[];
  avisos: AvisoDados[];
  /** Data/hora da última leitura bem-sucedida da planilha. */
  atualizadoEm: Date | null;

  /** Índices para consultas rápidas (evitam percorrer listas a cada render). */
  agenciaPorCodigo: ReadonlyMap<number, Agencia>;
  contasPorDocumento: ReadonlyMap<string, Conta[]>;

  /** Ids dos clientes cadastrados localmente (para destacá-los na interface). */
  idsCadastradosLocalmente: ReadonlySet<string>;

  /** Lê a planilha novamente, mantendo os clientes cadastrados nesta sessão. */
  recarregar: () => void;
  /** Gera o id, adiciona o cliente em memória e devolve o cliente salvo. */
  adicionarCliente: (dados: Omit<Cliente, 'id'>) => Cliente;
}

export const ContextoDados = createContext<ValorContextoDados | null>(null);
