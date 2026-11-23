/**
 * Busca e filtros da lista de clientes.
 * Todo campo tem um <label> visível (ou exclusivo para leitor de tela, no caso da busca).
 */

import { useId } from 'react';
import { ESTADOS_CIVIS } from '../types/modelos';
import type { Agencia, EstadoCivil, TipoPessoa } from '../types/modelos';
import { ORDENACOES } from '../utils/filtroClientes';
import type { FiltrosClientes, Ordenacao } from '../utils/filtroClientes';
import { Icone } from './Icone';
import botao from './botao.module.css';
import estilos from './BarraFiltros.module.css';

interface BarraFiltrosProps {
  filtros: FiltrosClientes;
  agencias: Agencia[];
  temFiltrosAtivos: boolean;
  aoAlterar: (alteracoes: Partial<FiltrosClientes>) => void;
  aoLimpar: () => void;
}

export function BarraFiltros({ filtros, agencias, temFiltrosAtivos, aoAlterar, aoLimpar }: BarraFiltrosProps) {
  const id = useId();

  return (
    <search className={estilos.barra} aria-label="Buscar e filtrar clientes">
      <div className={estilos.busca}>
        <label htmlFor={`${id}-busca`} className="somente-leitor-tela">
          Buscar por nome ou CPF/CNPJ
        </label>
        <Icone nome="busca" className={estilos.iconeBusca} />
        <input
          id={`${id}-busca`}
          type="search"
          className={estilos.campoBusca}
          placeholder="Buscar por nome ou CPF/CNPJ"
          value={filtros.busca}
          onChange={(e) => aoAlterar({ busca: e.target.value })}
          autoComplete="off"
          enterKeyHint="search"
        />
      </div>

      <div className={estilos.filtros}>
        <div className={estilos.campo}>
          <label htmlFor={`${id}-agencia`}>Agência</label>
          <select
            id={`${id}-agencia`}
            value={filtros.codigoAgencia ?? ''}
            onChange={(e) => aoAlterar({ codigoAgencia: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">Todas</option>
            {agencias.map((a) => (
              <option key={a.codigo} value={a.codigo}>
                {a.codigo} · {a.nome}
              </option>
            ))}
          </select>
        </div>

        <div className={estilos.campo}>
          <label htmlFor={`${id}-estado-civil`}>Estado civil</label>
          <select
            id={`${id}-estado-civil`}
            value={filtros.estadoCivil ?? ''}
            onChange={(e) => aoAlterar({ estadoCivil: (e.target.value || null) as EstadoCivil | null })}
          >
            <option value="">Todos</option>
            {ESTADOS_CIVIS.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </div>

        <div className={estilos.campo}>
          <label htmlFor={`${id}-tipo`}>Tipo de pessoa</label>
          <select
            id={`${id}-tipo`}
            value={filtros.tipoPessoa ?? ''}
            onChange={(e) => aoAlterar({ tipoPessoa: (e.target.value || null) as TipoPessoa | null })}
          >
            <option value="">Todas</option>
            <option value="PF">Pessoa física</option>
            <option value="PJ">Pessoa jurídica</option>
          </select>
        </div>

        <div className={estilos.campo}>
          <label htmlFor={`${id}-ordem`}>Ordenar por</label>
          <select
            id={`${id}-ordem`}
            value={filtros.ordenacao}
            onChange={(e) => aoAlterar({ ordenacao: e.target.value as Ordenacao })}
          >
            {Object.entries(ORDENACOES).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </div>

        {temFiltrosAtivos && (
          <button type="button" className={`${botao.botao} ${botao.fantasma} ${estilos.limpar}`} onClick={aoLimpar}>
            <Icone nome="fechar" tamanho={18} />
            Limpar filtros
          </button>
        )}
      </div>
    </search>
  );
}
