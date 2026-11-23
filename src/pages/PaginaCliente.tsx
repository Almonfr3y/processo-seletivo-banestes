/**
 * Detalhes de um cliente: todos os dados cadastrais, a agência a que pertence
 * e todas as suas contas bancárias, com um resumo financeiro no topo.
 */

import type { ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { Alerta } from '../components/Alerta';
import { Avatar } from '../components/Avatar';
import { CabecalhoPagina } from '../components/CabecalhoPagina';
import { CartaoConta } from '../components/CartaoConta';
import { Etiqueta } from '../components/Etiqueta';
import { ErroCarregamento, EsqueletoLista } from '../components/EstadosCarregamento';
import { Icone } from '../components/Icone';
import botao from '../components/botao.module.css';
import { useDados } from '../hooks/useDados';
import { useTituloPagina } from '../hooks/useTituloPagina';
import type { Agencia, Cliente, Conta } from '../types/modelos';
import { formatarDocumento, tipoPessoa } from '../utils/documento';
import { nomeExibicao } from '../utils/filtroClientes';
import { calcularIdade, formatarData, formatarMoeda } from '../utils/formatadores';
import estilos from './PaginaCliente.module.css';

/** Estado enviado pela lista (ou pelo cadastro) ao navegar para cá. */
interface EstadoNavegacao {
  /** Endereço da lista com os filtros que estavam aplicados. */
  voltarPara?: string;
  /** Verdadeiro quando o cliente acabou de ser cadastrado. */
  cadastrado?: boolean;
}

export function PaginaCliente() {
  const { id = '' } = useParams();
  const { state } = useLocation() as { state: EstadoNavegacao | null };
  const dados = useDados();

  const cliente = dados.clientes.find((c) => c.id === id);
  useTituloPagina(cliente ? nomeExibicao(cliente) : 'Cliente');

  const voltar = (
    <Link to={state?.voltarPara ?? '/'} className={`${botao.botao} ${botao.fantasma} ${estilos.voltar}`}>
      <Icone nome="voltar" tamanho={18} />
      Voltar para a lista
    </Link>
  );

  if (!cliente) {
    if (dados.status === 'carregando') return <EsqueletoLista linhas={3} />;
    if (dados.status === 'erro') return <ErroCarregamento />;
    return (
      <>
        <CabecalhoPagina antes={voltar} titulo="Cliente não encontrado" />
        <Alerta tipo="alerta" titulo={`Não existe cliente com o identificador "${id}".`}>
          Ele pode ter sido removido da planilha ou, se foi cadastrado nesta sessão, a página foi recarregada.
        </Alerta>
      </>
    );
  }

  const contas = dados.contasPorDocumento.get(cliente.cpfCnpj) ?? [];
  const agencia = dados.agenciaPorCodigo.get(cliente.codigoAgencia);

  return (
    <>
      {state?.cadastrado && (
        <div className={estilos.mensagem}>
          <Alerta tipo="sucesso" papel="status" titulo="Cliente cadastrado com sucesso!">
            Ele já aparece na lista de clientes e ficará disponível até a página ser recarregada.
          </Alerta>
        </div>
      )}

      <CabecalhoPagina
        antes={voltar}
        icone={<Avatar nome={nomeExibicao(cliente)} tipo={tipoPessoa(cliente.cpfCnpj)} grande />}
        titulo={nomeExibicao(cliente)}
        descricao={<EtiquetasCliente cliente={cliente} />}
      />

      <ResumoFinanceiro cliente={cliente} contas={contas} />

      <div className={estilos.colunas}>
        <section aria-labelledby="titulo-dados" className={estilos.painel}>
          <h2 id="titulo-dados" className={estilos.tituloSecao}>
            Dados cadastrais
          </h2>
          <DadosCadastrais cliente={cliente} />
        </section>

        <section aria-labelledby="titulo-agencia" className={estilos.painel}>
          <h2 id="titulo-agencia" className={estilos.tituloSecao}>
            Agência
          </h2>
          <DadosAgencia agencia={agencia} codigo={cliente.codigoAgencia} />
        </section>
      </div>

      <section aria-labelledby="titulo-contas" className={estilos.secaoContas}>
        <h2 id="titulo-contas" className={estilos.tituloSecao}>
          Contas bancárias <span className={estilos.contador}>({contas.length})</span>
        </h2>
        {contas.length === 0 ? (
          <p className={estilos.semContas}>Este cliente ainda não possui contas bancárias.</p>
        ) : (
          <ul className={estilos.listaContas}>
            {contas.map((conta) => (
              <li key={conta.id}>
                <CartaoConta conta={conta} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Subcomponentes (usados só nesta página)                                    */
/* -------------------------------------------------------------------------- */

/** Etiquetas exibidas abaixo do nome: tipo de pessoa e documento. */
function EtiquetasCliente({ cliente }: { cliente: Cliente }) {
  const tipo = tipoPessoa(cliente.cpfCnpj);
  return (
    <span className={estilos.etiquetas}>
      <Etiqueta tom={tipo === 'PJ' ? 'destaque' : 'primario'}>
        {tipo === 'PJ' ? 'Pessoa jurídica' : 'Pessoa física'}
      </Etiqueta>
      <Etiqueta>{formatarDocumento(cliente.cpfCnpj)}</Etiqueta>
    </span>
  );
}

/** Indicadores principais em destaque. */
function ResumoFinanceiro({ cliente, contas }: { cliente: Cliente; contas: Conta[] }) {
  const saldoTotal = contas.reduce((total, c) => total + c.saldo, 0);
  const creditoTotal = contas.reduce((total, c) => total + c.creditoDisponivel, 0);

  const indicadores = [
    { rotulo: 'Saldo em contas', valor: saldoTotal, destaque: true },
    { rotulo: 'Crédito disponível', valor: creditoTotal },
    { rotulo: 'Renda anual', valor: cliente.rendaAnual },
    { rotulo: 'Patrimônio', valor: cliente.patrimonio },
  ];

  return (
    <section aria-label="Resumo financeiro">
      <dl className={estilos.resumo}>
        {indicadores.map(({ rotulo, valor, destaque }) => (
          <div key={rotulo} className={`${estilos.indicador} ${destaque ? estilos.indicadorDestaque : ''}`}>
            <dt>{rotulo}</dt>
            <dd>{formatarMoeda(valor)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Todos os dados cadastrais do cliente. */
function DadosCadastrais({ cliente }: { cliente: Cliente }) {
  const pj = tipoPessoa(cliente.cpfCnpj) === 'PJ';
  const idade = calcularIdade(cliente.dataNascimento);
  const naoInformado = <span className={estilos.vazio}>Não informado</span>;

  // Para empresas, alguns rótulos mudam: "nome" é a razão social e
  // "data de nascimento" representa a data de fundação.
  return (
    <dl className={estilos.dados}>
      <Dado rotulo={pj ? 'Razão social' : 'Nome civil'}>{cliente.nome}</Dado>
      <Dado rotulo="Nome social">{cliente.nomeSocial ?? naoInformado}</Dado>
      <Dado rotulo={pj ? 'CNPJ' : 'CPF'}>{formatarDocumento(cliente.cpfCnpj)}</Dado>
      <Dado rotulo="RG">{cliente.rg ?? naoInformado}</Dado>
      <Dado rotulo={pj ? 'Data de fundação' : 'Data de nascimento'}>
        {formatarData(cliente.dataNascimento)} ({idade} {idade === 1 ? 'ano' : 'anos'})
      </Dado>
      <Dado rotulo="Estado civil">{cliente.estadoCivil}</Dado>
      <Dado rotulo="E-mail">
        <a href={`mailto:${cliente.email}`}>{cliente.email}</a>
      </Dado>
      <Dado rotulo="Endereço">{cliente.endereco}</Dado>
      <Dado rotulo="Identificador">
        <span className={estilos.mono}>{cliente.id}</span>
      </Dado>
    </dl>
  );
}

/** Um par rótulo/valor dentro de uma lista de definições (<dl>). */
function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className={estilos.dado}>
      <dt>{rotulo}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** Dados da agência ou aviso, caso o código não exista na planilha. */
function DadosAgencia({ agencia, codigo }: { agencia: Agencia | undefined; codigo: number }) {
  if (!agencia) {
    return (
      <Alerta tipo="alerta" titulo={`Agência ${codigo} não encontrada`}>
        O código informado no cadastro do cliente não corresponde a nenhuma agência da planilha.
      </Alerta>
    );
  }

  return (
    <div className={estilos.agencia}>
      <span className={estilos.iconeAgencia} aria-hidden="true">
        <Icone nome="agencia" tamanho={26} />
      </span>
      <dl className={estilos.dados}>
        <Dado rotulo="Nome">{agencia.nome}</Dado>
        <Dado rotulo="Código">{agencia.codigo}</Dado>
        <Dado rotulo="Endereço">{agencia.endereco}</Dado>
        <Dado rotulo="Identificador">
          <span className={estilos.mono}>{agencia.id}</span>
        </Dado>
      </dl>
    </div>
  );
}
