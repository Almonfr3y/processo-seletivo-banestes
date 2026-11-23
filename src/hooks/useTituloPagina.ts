import { useEffect } from 'react';

const NOME_SISTEMA = 'Painel de Clientes';

/**
 * Atualiza o título da aba do navegador.
 * Leitores de tela anunciam o título ao trocar de página, então ele precisa
 * descrever a tela atual (boa prática de acessibilidade em SPAs).
 */
export function useTituloPagina(titulo: string) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · ${NOME_SISTEMA}` : NOME_SISTEMA;
  }, [titulo]);
}
