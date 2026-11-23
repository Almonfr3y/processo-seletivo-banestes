import { Link } from 'react-router';
import { Alerta } from '../components/Alerta';
import { CabecalhoPagina } from '../components/CabecalhoPagina';
import botao from '../components/botao.module.css';
import { useTituloPagina } from '../hooks/useTituloPagina';

/** Exibida quando o endereço digitado não corresponde a nenhuma página. */
export function PaginaNaoEncontrada() {
  useTituloPagina('Página não encontrada');
  return (
    <>
      <CabecalhoPagina titulo="Página não encontrada" />
      <Alerta
        tipo="info"
        titulo="O endereço acessado não existe."
        acoes={
          <Link to="/" className={`${botao.botao} ${botao.primario}`}>
            Ir para a lista de clientes
          </Link>
        }
      />
    </>
  );
}
