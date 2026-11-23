/**
 * Cartão com todas as informações de uma conta bancária, incluindo uma barra
 * que mostra quanto do limite de crédito já foi utilizado.
 */

import type { Conta } from '../types/modelos';
import { formatarMoeda } from '../utils/formatadores';
import { Etiqueta } from './Etiqueta';
import { Icone } from './Icone';
import estilos from './CartaoConta.module.css';

const NOMES_TIPO = { corrente: 'Conta corrente', poupanca: 'Conta poupança' } as const;

export function CartaoConta({ conta }: { conta: Conta }) {
  const temLimite = conta.limiteCredito > 0;
  const utilizado = Math.max(0, conta.limiteCredito - conta.creditoDisponivel);
  // Percentual limitado a 0–100 para a barra não "vazar" se os dados vierem inconsistentes.
  const percentualUsado = temLimite ? Math.min(100, Math.round((utilizado / conta.limiteCredito) * 100)) : 0;
  const idTitulo = `conta-${conta.id}`;

  return (
    <article className={estilos.cartao} aria-labelledby={idTitulo}>
      <header className={estilos.topo}>
        <span className={estilos.icone} aria-hidden="true">
          <Icone nome="cartao" />
        </span>
        <div>
          <h3 id={idTitulo} className={estilos.tipo}>
            {NOMES_TIPO[conta.tipo]}
          </h3>
          <p className={estilos.id}>{conta.id}</p>
        </div>
        <Etiqueta tom={conta.tipo === 'corrente' ? 'primario' : 'destaque'}>
          {conta.tipo === 'corrente' ? 'Corrente' : 'Poupança'}
        </Etiqueta>
      </header>

      <div className={estilos.saldo}>
        <p className={estilos.rotulo}>Saldo</p>
        <p className={`${estilos.valorSaldo} ${conta.saldo < 0 ? estilos.negativo : ''}`}>
          {formatarMoeda(conta.saldo)}
        </p>
      </div>

      <dl className={estilos.detalhes}>
        <div>
          <dt>Limite de crédito</dt>
          <dd>{formatarMoeda(conta.limiteCredito)}</dd>
        </div>
        <div>
          <dt>Crédito disponível</dt>
          <dd>{formatarMoeda(conta.creditoDisponivel)}</dd>
        </div>
      </dl>

      {temLimite ? (
        <div className={estilos.uso}>
          <div className={estilos.usoTexto}>
            <span>Limite utilizado</span>
            <span>
              {formatarMoeda(utilizado)} ({percentualUsado}%)
            </span>
          </div>
          {/* <meter> é o elemento semântico para "quanto de um total foi usado" */}
          <meter
            className={estilos.medidor}
            min={0}
            max={100}
            low={50}
            high={80}
            optimum={0}
            value={percentualUsado}
            aria-label={`Limite de crédito utilizado: ${percentualUsado}%`}
          />
        </div>
      ) : (
        <p className={estilos.semLimite}>Esta conta não possui limite de crédito.</p>
      )}
    </article>
  );
}
