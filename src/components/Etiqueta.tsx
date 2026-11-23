import type { ReactNode } from 'react';
import estilos from './Etiqueta.module.css';

export type TomEtiqueta = 'neutro' | 'primario' | 'destaque' | 'sucesso' | 'alerta';

/** Pequeno rótulo colorido (ex.: "PJ", "Novo", "Conta corrente"). */
export function Etiqueta({ children, tom = 'neutro' }: { children: ReactNode; tom?: TomEtiqueta }) {
  return <span className={`${estilos.etiqueta} ${estilos[tom]}`}>{children}</span>;
}
