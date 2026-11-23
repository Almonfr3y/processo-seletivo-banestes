import type { ReactNode } from 'react';
import estilos from './CabecalhoPagina.module.css';

interface CabecalhoPaginaProps {
  titulo: ReactNode;
  descricao?: ReactNode;
  /** Botões ou links exibidos à direita do título. */
  acoes?: ReactNode;
  /** Conteúdo acima do título (ex.: link "voltar"). */
  antes?: ReactNode;
  /** Elemento decorativo à esquerda do título (ex.: avatar do cliente). */
  icone?: ReactNode;
}

/**
 * Título principal (h1) de cada página. O `tabIndex={-1}` permite que o foco
 * seja movido para ele ao navegar (ver `useFocoAoNavegar` no Layout).
 */
export function CabecalhoPagina({ titulo, descricao, acoes, antes, icone }: CabecalhoPaginaProps) {
  return (
    <div className={estilos.cabecalho}>
      {antes}
      <div className={estilos.linha}>
        <div className={estilos.identidade}>
          {icone}
          <div className={estilos.textos}>
            <h1 tabIndex={-1} className={estilos.titulo}>
              {titulo}
            </h1>
            {descricao && <div className={estilos.descricao}>{descricao}</div>}
          </div>
        </div>
        {acoes && <div className={estilos.acoes}>{acoes}</div>}
      </div>
    </div>
  );
}
