import type { ReactNode } from 'react';
import { Icone } from './Icone';
import type { NomeIcone } from './Icone';
import estilos from './Alerta.module.css';

type TipoAlerta = 'sucesso' | 'alerta' | 'erro' | 'info';

const ICONES: Record<TipoAlerta, NomeIcone> = {
  sucesso: 'sucesso',
  alerta: 'alerta',
  erro: 'alerta',
  info: 'alerta',
};

interface AlertaProps {
  tipo: TipoAlerta;
  titulo: ReactNode;
  children?: ReactNode;
  /** Ações (botões) exibidas abaixo da mensagem. */
  acoes?: ReactNode;
  /**
   * Papel ARIA. `alert` interrompe o leitor de tela (erros);
   * `status` é anunciado de forma educada (confirmações).
   */
  papel?: 'alert' | 'status';
}

/** Caixa de mensagem para sucesso, erro ou atenção. */
export function Alerta({ tipo, titulo, children, acoes, papel }: AlertaProps) {
  return (
    <div className={`${estilos.caixa} ${estilos[tipo]}`} role={papel}>
      <Icone nome={ICONES[tipo]} className={estilos.icone} />
      <div className={estilos.corpo}>
        <p className={estilos.titulo}>{titulo}</p>
        {children && <div className={estilos.texto}>{children}</div>}
        {acoes && <div className={estilos.acoes}>{acoes}</div>}
      </div>
    </div>
  );
}
