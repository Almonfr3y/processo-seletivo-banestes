/**
 * Envoltório padrão de um campo de formulário: rótulo, dica e mensagem de erro.
 *
 * Os atributos de acessibilidade são gerados aqui e entregues ao campo por
 * "render prop", garantindo que todo campo tenha:
 *  - `id` ligado ao <label>;
 *  - `aria-invalid` quando há erro;
 *  - `aria-describedby` apontando para a dica e o erro (lidos pelo leitor de tela).
 */

import { useId } from 'react';
import type { ReactNode } from 'react';
import { Icone } from './Icone';
import estilos from './CampoFormulario.module.css';

export interface AtributosCampo {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby': string | undefined;
  'aria-required'?: boolean;
}

interface CampoFormularioProps {
  rotulo: string;
  obrigatorio?: boolean;
  dica?: ReactNode;
  erro?: string;
  /** Ocupa a linha inteira da grade do formulário. */
  largo?: boolean;
  children: (atributos: AtributosCampo) => ReactNode;
}

export function CampoFormulario({ rotulo, obrigatorio, dica, erro, largo, children }: CampoFormularioProps) {
  const id = useId();
  const idDica = dica ? `${id}-dica` : undefined;
  const idErro = erro ? `${id}-erro` : undefined;
  const descricao = [idDica, idErro].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`${estilos.campo} ${largo ? estilos.largo : ''} ${erro ? estilos.comErro : ''}`}>
      <label htmlFor={id} className={estilos.rotulo}>
        {rotulo}
        {obrigatorio ? (
          <span className={estilos.obrigatorio} aria-hidden="true">
            {' '}
            *
          </span>
        ) : (
          <span className={estilos.opcional}> (opcional)</span>
        )}
      </label>

      {children({ id, 'aria-invalid': Boolean(erro), 'aria-describedby': descricao, 'aria-required': obrigatorio })}

      {dica && (
        <p id={idDica} className={estilos.dica}>
          {dica}
        </p>
      )}
      {erro && (
        <p id={idErro} className={estilos.erro}>
          <Icone nome="alerta" tamanho={16} />
          {erro}
        </p>
      )}
    </div>
  );
}
