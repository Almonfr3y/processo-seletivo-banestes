import { useContext } from 'react';
import { ContextoDados } from '../context/contextoDados';
import type { ValorContextoDados } from '../context/contextoDados';

/** Acesso aos dados bancários compartilhados. Deve ser usado dentro de <DadosProvider>. */
export function useDados(): ValorContextoDados {
  const contexto = useContext(ContextoDados);
  if (contexto === null) {
    throw new Error('useDados precisa ser usado dentro de <DadosProvider>.');
  }
  return contexto;
}
