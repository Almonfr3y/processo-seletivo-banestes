/**
 * Estrutura comum a todas as páginas: link de pular para o conteúdo,
 * cabeçalho com navegação, área principal e rodapé.
 */

import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { Icone } from './Icone';
import estilos from './Layout.module.css';

export function Layout() {
  useFocoAoNavegar();

  return (
    <div className={estilos.pagina}>
      {/* Primeiro item focável: permite pular a navegação com o teclado */}
      <a href="#conteudo" className={estilos.pularConteudo}>
        Pular para o conteúdo
      </a>

      <header className={estilos.cabecalho}>
        <div className={estilos.cabecalhoInterno}>
          <Link to="/" className={estilos.marca}>
            <span className={estilos.logo} aria-hidden="true">
              <Icone nome="agencia" tamanho={22} />
            </span>
            <span>
              <span className={estilos.nomeSistema}>Painel de Clientes</span>
              <span className={estilos.subtitulo}>Banestes · Processo Seletivo</span>
            </span>
          </Link>

          <nav aria-label="Principal">
            <ul className={estilos.menu}>
              <li>
                <NavLink to="/" end className={classeLinkMenu}>
                  <Icone nome="pessoa" tamanho={18} />
                  Clientes
                </NavLink>
              </li>
              <li>
                <NavLink to="/clientes/novo" className={classeLinkMenu}>
                  <Icone nome="mais" tamanho={18} />
                  Novo cliente
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main id="conteudo" className={estilos.conteudo} tabIndex={-1}>
        <Outlet />
      </main>

      <footer className={estilos.rodape}>
        <p>
          Dados lidos em tempo real de uma planilha do Google. Clientes cadastrados aqui ficam salvos apenas até
          recarregar a página.
        </p>
      </footer>
    </div>
  );
}

/** NavLink informa se o link está ativo; usamos isso para destacar a página atual. */
function classeLinkMenu({ isActive }: { isActive: boolean }) {
  return isActive ? `${estilos.linkMenu} ${estilos.ativo}` : estilos.linkMenu;
}

/**
 * Em um site comum, trocar de página leva o foco ao topo. Numa SPA isso não
 * acontece sozinho: sem este ajuste, quem usa teclado ou leitor de tela ficaria
 * "preso" no link clicado. Aqui movemos o foco para o título da nova página.
 */
function useFocoAoNavegar() {
  const { pathname } = useLocation();
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const titulo = document.querySelector<HTMLElement>('main h1');
    (titulo ?? document.getElementById('conteudo'))?.focus();
    window.scrollTo({ top: 0 });
  }, [pathname]);
}
