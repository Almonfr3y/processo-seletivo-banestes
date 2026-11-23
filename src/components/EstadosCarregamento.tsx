/**
 * Telas intermediárias exibidas enquanto os dados não estão prontos:
 * carregando (esqueleto animado) e erro (com opção de tentar novamente).
 */

import { useDados } from '../hooks/useDados';
import { Alerta } from './Alerta';
import { Icone } from './Icone';
import botao from './botao.module.css';
import estilos from './EstadosCarregamento.module.css';

/** Esqueleto que imita o formato da lista, reduzindo a sensação de espera. */
export function EsqueletoLista({ linhas = 6 }: { linhas?: number }) {
  return (
    <div role="status" aria-live="polite">
      <span className="somente-leitor-tela">Carregando dados da planilha…</span>
      <ul className={estilos.esqueleto} aria-hidden="true">
        {Array.from({ length: linhas }, (_, i) => (
          <li key={i} className={estilos.linha}>
            <span className={`${estilos.bloco} ${estilos.circulo}`} />
            <span className={estilos.textos}>
              <span className={`${estilos.bloco} ${estilos.textoLongo}`} />
              <span className={`${estilos.bloco} ${estilos.textoCurto}`} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Mensagem de falha ao carregar a planilha, com botão para tentar de novo. */
export function ErroCarregamento() {
  const { erro, recarregar } = useDados();
  return (
    <Alerta
      tipo="erro"
      papel="alert"
      titulo="Não foi possível carregar os dados"
      acoes={
        <button type="button" className={`${botao.botao} ${botao.secundario}`} onClick={recarregar}>
          <Icone nome="atualizar" tamanho={18} />
          Tentar novamente
        </button>
      }
    >
      {erro}
    </Alerta>
  );
}
