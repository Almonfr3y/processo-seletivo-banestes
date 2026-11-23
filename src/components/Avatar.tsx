import type { TipoPessoa } from '../types/modelos';
import { iniciais } from '../utils/formatadores';
import { Icone } from './Icone';
import estilos from './Avatar.module.css';

/** Pares de cor (fundo/texto) com bom contraste, escolhidos de forma estável pelo nome. */
const TONS = ['azul', 'verde', 'roxo', 'laranja', 'rosa', 'ciano'] as const;

/** Mesma entrada → mesma cor, para o avatar de um cliente não mudar entre telas. */
function tomPorNome(nome: string): (typeof TONS)[number] {
  let hash = 0;
  for (const letra of nome) hash = (hash * 31 + letra.charCodeAt(0)) >>> 0;
  return TONS[hash % TONS.length];
}

interface AvatarProps {
  nome: string;
  tipo: TipoPessoa;
  grande?: boolean;
}

/** Círculo com as iniciais (pessoa física) ou um ícone de prédio (empresa). Decorativo. */
export function Avatar({ nome, tipo, grande = false }: AvatarProps) {
  const classes = [estilos.avatar, estilos[tomPorNome(nome)], grande ? estilos.grande : ''].join(' ');
  return (
    <span className={classes} aria-hidden="true">
      {tipo === 'PJ' ? <Icone nome="empresa" tamanho={grande ? 30 : 20} /> : iniciais(nome)}
    </span>
  );
}
