/**
 * Página inicial: lista de clientes com busca, filtros, ordenação e
 * paginação (no máximo 10 clientes por vez).
 */

import { useMemo, useRef } from 'react';
import { Link } from 'react-router';
import { AvisosPlanilha } from '../components/AvisosPlanilha';
import { BarraFiltros } from '../components/BarraFiltros';
import { CabecalhoPagina } from '../components/CabecalhoPagina';
import { CartaoCliente } from '../components/CartaoCliente';
import { ErroCarregamento, EsqueletoLista } from '../components/EstadosCarregamento';
import { Icone } from '../components/Icone';
import { Paginacao } from '../components/Paginacao';
import botao from '../components/botao.module.css';
import { useDados } from '../hooks/useDados';
import { useFiltrosUrl } from '../hooks/useFiltrosUrl';
import { useTituloPagina } from '../hooks/useTituloPagina';
import { filtrarClientes, paginar } from '../utils/filtroClientes';
import estilos from './PaginaClientes.module.css';

export function PaginaClientes() {
  useTituloPagina('Clientes');
  const dados = useDados();
  const { filtros, pagina, alterarFiltros, irParaPagina, limparFiltros, temFiltrosAtivos } = useFiltrosUrl();
  const resumoRef = useRef<HTMLParagraphElement>(null);

  // Recalcula a lista só quando os dados ou os filtros mudam.
  const filtrados = useMemo(() => filtrarClientes(dados.clientes, filtros), [dados.clientes, filtros]);
  const resultado = paginar(filtrados, pagina);

  /** Troca de página e leva o foco ao resumo, para o teclado continuar no lugar certo. */
  function mudarPagina(novaPagina: number) {
    irParaPagina(novaPagina);
    resumoRef.current?.focus();
    resumoRef.current?.scrollIntoView({ block: 'start' });
  }

  const carregando = dados.status === 'carregando';

  return (
    <>
      <CabecalhoPagina
        titulo="Clientes"
        descricao="Consulte os clientes, suas contas e agências."
        acoes={
          <>
            <button
              type="button"
              className={`${botao.botao} ${botao.secundario}`}
              onClick={dados.recarregar}
              disabled={carregando}
            >
              <Icone nome="atualizar" tamanho={18} />
              {carregando ? 'Atualizando…' : 'Atualizar dados'}
            </button>
            <Link to="/clientes/novo" className={`${botao.botao} ${botao.primario}`}>
              <Icone nome="mais" tamanho={18} />
              Novo cliente
            </Link>
          </>
        }
      />

      <div className={estilos.conteudo}>
        {dados.status === 'erro' && <ErroCarregamento />}

        {dados.status === 'sucesso' && <AvisosPlanilha />}

        <BarraFiltros
          filtros={filtros}
          agencias={dados.agencias}
          temFiltrosAtivos={temFiltrosAtivos}
          aoAlterar={alterarFiltros}
          aoLimpar={limparFiltros}
        />

        {dados.clientes.length === 0 && carregando ? (
          <EsqueletoLista />
        ) : dados.clientes.length === 0 && dados.status === 'erro' ? null : (
          <section aria-labelledby="resumo-resultados">
            <div className={estilos.barraResumo}>
              {/* aria-live: leitores de tela anunciam a contagem quando a busca muda */}
              <p id="resumo-resultados" ref={resumoRef} tabIndex={-1} className={estilos.resumo} aria-live="polite">
                {resultado.totalItens === 0
                  ? 'Nenhum cliente encontrado'
                  : `Mostrando ${resultado.inicio}–${resultado.fim} de ${resultado.totalItens} ${
                      resultado.totalItens === 1 ? 'cliente' : 'clientes'
                    }`}
              </p>
              {dados.atualizadoEm && (
                <p className={estilos.atualizacao}>
                  Atualizado às {dados.atualizadoEm.toLocaleTimeString('pt-BR', { timeStyle: 'short' })}
                </p>
              )}
            </div>

            {resultado.totalItens === 0 ? (
              <div className={estilos.vazio}>
                <Icone nome="busca" tamanho={40} />
                <p className={estilos.vazioTitulo}>Nenhum cliente corresponde à busca</p>
                <p>Confira o que foi digitado ou remova alguns filtros.</p>
                {temFiltrosAtivos && (
                  <button type="button" className={`${botao.botao} ${botao.secundario}`} onClick={limparFiltros}>
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : (
              <ul className={estilos.lista}>
                {resultado.itens.map((cliente) => (
                  <li key={cliente.id}>
                    <CartaoCliente
                      cliente={cliente}
                      agencia={dados.agenciaPorCodigo.get(cliente.codigoAgencia)}
                      quantidadeContas={dados.contasPorDocumento.get(cliente.cpfCnpj)?.length ?? 0}
                      cadastradoLocalmente={dados.idsCadastradosLocalmente.has(cliente.id)}
                    />
                  </li>
                ))}
              </ul>
            )}

            <Paginacao
              paginaAtual={resultado.paginaAtual}
              totalPaginas={resultado.totalPaginas}
              aoMudarPagina={mudarPagina}
            />
          </section>
        )}
      </div>
    </>
  );
}
