/**
 * Mostra, de forma discreta e expansível, os problemas encontrados nos dados
 * da planilha (registros ignorados, contas sem dono, agências inexistentes).
 * Usa <details>/<summary>, que já é acessível por teclado e leitor de tela.
 */

import { useDados } from '../hooks/useDados';
import { Icone } from './Icone';
import estilos from './AvisosPlanilha.module.css';

const NOMES_ABA = { clientes: 'Clientes', contas: 'Contas', agencias: 'Agências' } as const;

export function AvisosPlanilha() {
  const { avisos } = useDados();
  if (avisos.length === 0) return null;

  return (
    <details className={estilos.avisos}>
      <summary className={estilos.resumo}>
        <Icone nome="alerta" tamanho={18} />
        {avisos.length === 1
          ? '1 inconsistência encontrada nos dados da planilha'
          : `${avisos.length} inconsistências encontradas nos dados da planilha`}
      </summary>
      <p className={estilos.explicacao}>
        Os registros abaixo foram ignorados ou estão incompletos. O restante do sistema funciona normalmente.
      </p>
      <ul className={estilos.lista}>
        {avisos.map((aviso, i) => (
          <li key={`${aviso.aba}-${aviso.registro}-${i}`}>
            <strong>
              {NOMES_ABA[aviso.aba]} · {aviso.registro}:
            </strong>{' '}
            {aviso.mensagem}
          </li>
        ))}
      </ul>
    </details>
  );
}
