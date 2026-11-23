/**
 * Cadastro de um novo cliente.
 *
 * Usa React Hook Form para controlar o formulário e Zod para validar.
 * O cliente é salvo apenas em memória (ver DadosProvider) com id gerado
 * no navegador, e passa a aparecer na lista até a página ser recarregada.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { Alerta } from '../components/Alerta';
import { CabecalhoPagina } from '../components/CabecalhoPagina';
import { CampoFormulario } from '../components/CampoFormulario';
import { ErroCarregamento } from '../components/EstadosCarregamento';
import { Icone } from '../components/Icone';
import botao from '../components/botao.module.css';
import { useDados } from '../hooks/useDados';
import { useTituloPagina } from '../hooks/useTituloPagina';
import { ESTADOS_CIVIS } from '../types/modelos';
import { mascararDocumentoParcial, somenteDigitos, TAMANHO_CPF } from '../utils/documento';
import { criarSchemaCliente, VALORES_INICIAIS } from '../utils/schemaFormularioCliente';
import type { EntradaFormularioCliente, SaidaFormularioCliente } from '../utils/schemaFormularioCliente';
import estilos from './PaginaNovoCliente.module.css';

/** Data de hoje no formato do <input type="date">, usada como limite máximo. */
const HOJE_ISO = new Date().toLocaleDateString('sv-SE'); // "sv-SE" produz AAAA-MM-DD

export function PaginaNovoCliente() {
  useTituloPagina('Novo cliente');
  const navigate = useNavigate();
  const { clientes, agencias, status, adicionarCliente } = useDados();

  // O schema depende dos dados atuais (documentos já usados e agências existentes).
  const schema = useMemo(
    () => criarSchemaCliente(new Set(clientes.map((c) => c.cpfCnpj)), new Set(agencias.map((a) => a.codigo))),
    [clientes, agencias],
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitted, isSubmitting },
  } = useForm<EntradaFormularioCliente, unknown, SaidaFormularioCliente>({
    resolver: zodResolver(schema),
    defaultValues: VALORES_INICIAIS,
    mode: 'onTouched', // valida ao sair do campo e, depois disso, a cada alteração
  });

  // Rótulos se adaptam ao tipo de documento digitado (pessoa física ou jurídica).
  const documentoDigitado = useWatch({ control, name: 'cpfCnpj' });
  const ehEmpresa = somenteDigitos(documentoDigitado).length > TAMANHO_CPF;

  function salvar(dados: SaidaFormularioCliente) {
    const novo = adicionarCliente(dados);
    navigate(`/clientes/${encodeURIComponent(novo.id)}`, { state: { cadastrado: true } });
  }

  const quantidadeErros = Object.keys(errors).length;
  const campoDocumento = register('cpfCnpj');

  if (status === 'erro' && agencias.length === 0) {
    return (
      <>
        <CabecalhoPagina titulo="Novo cliente" />
        <ErroCarregamento />
      </>
    );
  }

  return (
    <>
      <CabecalhoPagina
        titulo="Novo cliente"
        descricao="Preencha os dados abaixo. Campos marcados com * são obrigatórios."
      />

      <form
        className={estilos.formulario}
        // Se houver erros, o React Hook Form leva o foco ao primeiro campo inválido.
        onSubmit={handleSubmit(salvar)}
        noValidate // a validação é feita pelo Zod, com mensagens em português
      >
        {isSubmitted && quantidadeErros > 0 && (
          <Alerta tipo="erro" papel="alert" titulo="Não foi possível salvar o cadastro">
            {quantidadeErros === 1
              ? 'Corrija o campo destacado abaixo.'
              : `Corrija os ${quantidadeErros} campos destacados abaixo.`}
          </Alerta>
        )}

        <fieldset className={estilos.grupo}>
          <legend className={estilos.legenda}>Identificação</legend>
          <div className={estilos.grade}>
            <CampoFormulario
              rotulo="CPF ou CNPJ"
              obrigatorio
              dica="Digite só os números; a pontuação é aplicada automaticamente."
              erro={errors.cpfCnpj?.message}
            >
              {(a) => (
                <input
                  {...a}
                  {...campoDocumento}
                  // Aplica a máscara antes de repassar o valor ao React Hook Form.
                  onChange={(e) => {
                    e.target.value = mascararDocumentoParcial(e.target.value);
                    return campoDocumento.onChange(e);
                  }}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="000.000.000-00"
                />
              )}
            </CampoFormulario>

            <CampoFormulario
              rotulo="RG"
              erro={errors.rg?.message}
              dica={ehEmpresa ? 'Empresas normalmente não possuem RG.' : undefined}
            >
              {(a) => <input {...a} {...register('rg')} autoComplete="off" />}
            </CampoFormulario>

            <CampoFormulario
              rotulo={ehEmpresa ? 'Razão social' : 'Nome completo'}
              obrigatorio
              largo
              erro={errors.nome?.message}
            >
              {(a) => <input {...a} {...register('nome')} autoComplete={ehEmpresa ? 'organization' : 'name'} />}
            </CampoFormulario>

            <CampoFormulario
              rotulo="Nome social"
              largo
              dica="Nome pelo qual a pessoa prefere ser chamada. Quando informado, é exibido no lugar do nome civil."
              erro={errors.nomeSocial?.message}
            >
              {(a) => <input {...a} {...register('nomeSocial')} autoComplete="off" />}
            </CampoFormulario>

            <CampoFormulario
              rotulo={ehEmpresa ? 'Data de fundação' : 'Data de nascimento'}
              obrigatorio
              erro={errors.dataNascimento?.message}
            >
              {(a) => <input {...a} {...register('dataNascimento')} type="date" min="1900-01-01" max={HOJE_ISO} />}
            </CampoFormulario>

            <CampoFormulario rotulo="Estado civil" obrigatorio erro={errors.estadoCivil?.message}>
              {(a) => (
                <select {...a} {...register('estadoCivil')}>
                  <option value="">Selecione…</option>
                  {ESTADOS_CIVIS.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>
              )}
            </CampoFormulario>
          </div>
        </fieldset>

        <fieldset className={estilos.grupo}>
          <legend className={estilos.legenda}>Contato</legend>
          <div className={estilos.grade}>
            <CampoFormulario rotulo="E-mail" obrigatorio largo erro={errors.email?.message}>
              {(a) => (
                <input {...a} {...register('email')} type="email" autoComplete="email" placeholder="nome@exemplo.com" />
              )}
            </CampoFormulario>

            <CampoFormulario
              rotulo="Endereço"
              obrigatorio
              largo
              dica="Rua, número, bairro, cidade e estado."
              erro={errors.endereco?.message}
            >
              {(a) => <input {...a} {...register('endereco')} autoComplete="street-address" />}
            </CampoFormulario>
          </div>
        </fieldset>

        <fieldset className={estilos.grupo}>
          <legend className={estilos.legenda}>Informações financeiras</legend>
          <div className={estilos.grade}>
            <CampoFormulario rotulo="Renda anual (R$)" obrigatorio erro={errors.rendaAnual?.message}>
              {(a) => <input {...a} {...register('rendaAnual')} inputMode="decimal" placeholder="0,00" />}
            </CampoFormulario>

            <CampoFormulario rotulo="Patrimônio (R$)" obrigatorio erro={errors.patrimonio?.message}>
              {(a) => <input {...a} {...register('patrimonio')} inputMode="decimal" placeholder="0,00" />}
            </CampoFormulario>

            <CampoFormulario rotulo="Agência" obrigatorio largo erro={errors.codigoAgencia?.message}>
              {(a) => (
                <select {...a} {...register('codigoAgencia')} disabled={agencias.length === 0}>
                  <option value="">{agencias.length === 0 ? 'Carregando agências…' : 'Selecione…'}</option>
                  {agencias.map((ag) => (
                    <option key={ag.codigo} value={ag.codigo}>
                      {ag.codigo} · {ag.nome} — {ag.endereco}
                    </option>
                  ))}
                </select>
              )}
            </CampoFormulario>
          </div>
        </fieldset>

        <div className={estilos.acoes}>
          <Link to="/" className={`${botao.botao} ${botao.secundario}`}>
            Cancelar
          </Link>
          <button
            type="submit"
            className={`${botao.botao} ${botao.primario}`}
            disabled={isSubmitting || status === 'carregando'}
          >
            <Icone nome="sucesso" tamanho={18} />
            Cadastrar cliente
          </button>
        </div>
      </form>
    </>
  );
}
