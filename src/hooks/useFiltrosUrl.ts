/**
 * Guarda os filtros e a página da lista de clientes na URL (?busca=ana&pagina=2).
 *
 * Vantagens para o usuário: o botão "voltar" do navegador restaura a lista
 * exatamente como estava, e é possível compartilhar ou favoritar uma busca.
 */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { ESTADOS_CIVIS } from '../types/modelos';
import type { EstadoCivil, TipoPessoa } from '../types/modelos';
import { FILTROS_PADRAO, ORDENACOES } from '../utils/filtroClientes';
import type { FiltrosClientes, Ordenacao } from '../utils/filtroClientes';

/** Nome de cada filtro na URL. */
const PARAMETROS = {
  busca: 'busca',
  codigoAgencia: 'agencia',
  estadoCivil: 'estadoCivil',
  tipoPessoa: 'tipo',
  ordenacao: 'ordem',
} as const satisfies Record<keyof FiltrosClientes, string>;

const PARAMETRO_PAGINA = 'pagina';

/* Conversores: a URL pode ser editada à mão, então valores inválidos são ignorados. */

function lerCodigoAgencia(valor: string | null): number | null {
  const numero = Number(valor);
  return valor && Number.isInteger(numero) ? numero : null;
}

function lerEstadoCivil(valor: string | null): EstadoCivil | null {
  return ESTADOS_CIVIS.find((e) => e === valor) ?? null;
}

function lerTipoPessoa(valor: string | null): TipoPessoa | null {
  return valor === 'PF' || valor === 'PJ' ? valor : null;
}

function lerOrdenacao(valor: string | null): Ordenacao {
  return valor !== null && valor in ORDENACOES ? (valor as Ordenacao) : FILTROS_PADRAO.ordenacao;
}

export function useFiltrosUrl() {
  const [parametros, setParametros] = useSearchParams();

  const filtros = useMemo<FiltrosClientes>(
    () => ({
      busca: parametros.get(PARAMETROS.busca) ?? '',
      codigoAgencia: lerCodigoAgencia(parametros.get(PARAMETROS.codigoAgencia)),
      estadoCivil: lerEstadoCivil(parametros.get(PARAMETROS.estadoCivil)),
      tipoPessoa: lerTipoPessoa(parametros.get(PARAMETROS.tipoPessoa)),
      ordenacao: lerOrdenacao(parametros.get(PARAMETROS.ordenacao)),
    }),
    [parametros],
  );

  const pagina = Number(parametros.get(PARAMETRO_PAGINA)) || 1;

  /** Altera um ou mais filtros. Qualquer mudança de filtro volta para a página 1. */
  const alterarFiltros = useCallback(
    (alteracoes: Partial<FiltrosClientes>) => {
      setParametros(
        (atuais) => {
          const novos = new URLSearchParams(atuais);
          for (const [chave, valor] of Object.entries(alteracoes)) {
            const nome = PARAMETROS[chave as keyof FiltrosClientes];
            const padrao = FILTROS_PADRAO[chave as keyof FiltrosClientes];
            // Valores padrão não vão para a URL, mantendo-a curta e legível.
            if (valor === null || valor === '' || valor === padrao) novos.delete(nome);
            else novos.set(nome, String(valor));
          }
          novos.delete(PARAMETRO_PAGINA);
          return novos;
        },
        // Digitar na busca não deve criar uma entrada no histórico a cada letra.
        { replace: true },
      );
    },
    [setParametros],
  );

  const irParaPagina = useCallback(
    (novaPagina: number) => {
      setParametros((atuais) => {
        const novos = new URLSearchParams(atuais);
        if (novaPagina <= 1) novos.delete(PARAMETRO_PAGINA);
        else novos.set(PARAMETRO_PAGINA, String(novaPagina));
        return novos;
      });
    },
    [setParametros],
  );

  const limparFiltros = useCallback(() => setParametros({}, { replace: true }), [setParametros]);

  const temFiltrosAtivos =
    filtros.busca !== '' ||
    filtros.codigoAgencia !== null ||
    filtros.estadoCivil !== null ||
    filtros.tipoPessoa !== null;

  return { filtros, pagina, alterarFiltros, irParaPagina, limparFiltros, temFiltrosAtivos };
}
