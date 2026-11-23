/**
 * Item da lista de clientes com os dados mais importantes.
 *
 * O link fica só no nome (texto curto e claro para leitores de tela), mas
 * com CSS ele "se estica" para cobrir o cartão inteiro, então clicar em
 * qualquer parte do cartão abre o cliente.
 */

import { Link, useLocation } from 'react-router';
import type { Agencia, Cliente } from '../types/modelos';
import { formatarDocumento, tipoPessoa } from '../utils/documento';
import { nomeExibicao } from '../utils/filtroClientes';
import { formatarMoedaCompacta } from '../utils/formatadores';
import { Avatar } from './Avatar';
import { Etiqueta } from './Etiqueta';
import { Icone } from './Icone';
import estilos from './CartaoCliente.module.css';

interface CartaoClienteProps {
  cliente: Cliente;
  agencia: Agencia | undefined;
  quantidadeContas: number;
  cadastradoLocalmente: boolean;
}

export function CartaoCliente({ cliente, agencia, quantidadeContas, cadastradoLocalmente }: CartaoClienteProps) {
  const tipo = tipoPessoa(cliente.cpfCnpj);
  const nome = nomeExibicao(cliente);
  // Guarda a busca/página atual para o botão "voltar" do detalhe restaurar a lista.
  const { search } = useLocation();

  return (
    <article className={estilos.cartao}>
      <Avatar nome={nome} tipo={tipo} />

      <div className={estilos.identificacao}>
        <h2 className={estilos.nome}>
          <Link
            to={`/clientes/${encodeURIComponent(cliente.id)}`}
            state={{ voltarPara: `/${search}` }}
            className={estilos.link}
          >
            {nome}
          </Link>
        </h2>
        <p className={estilos.documento}>
          <span className="somente-leitor-tela">{tipo === 'PJ' ? 'CNPJ' : 'CPF'}: </span>
          {formatarDocumento(cliente.cpfCnpj)}
        </p>
        <div className={estilos.etiquetas}>
          <Etiqueta tom={tipo === 'PJ' ? 'destaque' : 'primario'}>
            {tipo === 'PJ' ? 'Pessoa jurídica' : 'Pessoa física'}
          </Etiqueta>
          {cliente.nomeSocial && <Etiqueta>Nome social</Etiqueta>}
          {cadastradoLocalmente && <Etiqueta tom="sucesso">Novo</Etiqueta>}
        </div>
      </div>

      <dl className={estilos.dados}>
        <div>
          <dt>Agência</dt>
          <dd>
            {agencia ? (
              agencia.nome
            ) : (
              <span className={estilos.semAgencia}>
                <Icone nome="alerta" tamanho={14} /> Não encontrada
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt>Renda anual</dt>
          <dd>{formatarMoedaCompacta(cliente.rendaAnual)}</dd>
        </div>
        <div>
          <dt>Contas</dt>
          <dd>{quantidadeContas}</dd>
        </div>
      </dl>

      <Icone nome="setaDireita" className={estilos.seta} />
    </article>
  );
}
