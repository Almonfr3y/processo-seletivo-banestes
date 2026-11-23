/**
 * Navegação entre páginas da lista: "Anterior", números e "Próxima".
 * Com muitas páginas, mostra só a primeira, a última e as vizinhas da atual,
 * separadas por reticências (ex.: 1 … 4 5 6 … 10).
 */

import { itensPaginacao } from '../utils/filtroClientes';
import { Icone } from './Icone';
import estilos from './Paginacao.module.css';

interface PaginacaoProps {
  paginaAtual: number;
  totalPaginas: number;
  aoMudarPagina: (pagina: number) => void;
}

export function Paginacao({ paginaAtual, totalPaginas, aoMudarPagina }: PaginacaoProps) {
  if (totalPaginas <= 1) return null;

  return (
    <nav className={estilos.paginacao} aria-label="Paginação da lista de clientes">
      <button
        type="button"
        className={estilos.botao}
        onClick={() => aoMudarPagina(paginaAtual - 1)}
        disabled={paginaAtual === 1}
      >
        <Icone nome="setaEsquerda" tamanho={18} />
        <span className={estilos.rotuloSeta}>Anterior</span>
        <span className="somente-leitor-tela">página</span>
      </button>

      <ol className={estilos.numeros}>
        {itensPaginacao(paginaAtual, totalPaginas).map((item, i) =>
          item === 'reticencias' ? (
            <li key={`r${i}`} className={estilos.reticencias} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                className={`${estilos.botao} ${estilos.numero}`}
                onClick={() => aoMudarPagina(item)}
                aria-current={item === paginaAtual ? 'page' : undefined}
                aria-label={`Página ${item}`}
              >
                {item}
              </button>
            </li>
          ),
        )}
      </ol>

      <button
        type="button"
        className={estilos.botao}
        onClick={() => aoMudarPagina(paginaAtual + 1)}
        disabled={paginaAtual === totalPaginas}
      >
        <span className={estilos.rotuloSeta}>Próxima</span>
        <span className="somente-leitor-tela">página</span>
        <Icone nome="setaDireita" tamanho={18} />
      </button>
    </nav>
  );
}
