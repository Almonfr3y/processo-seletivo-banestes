/**
 * Provedor dos dados bancários.
 *
 * Responsável por buscar a planilha ao abrir o sistema, guardar os clientes
 * cadastrados pelo usuário (somente em memória, como pede o enunciado) e
 * montar índices usados pelas telas.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { carregarDados } from '../services/dados';
import type { DadosBancarios } from '../services/dados';
import { ErroPlanilha } from '../services/planilha';
import type { Cliente, Conta } from '../types/modelos';
import { ContextoDados } from './contextoDados';
import type { StatusCarregamento, ValorContextoDados } from './contextoDados';

const DADOS_VAZIOS: DadosBancarios = { clientes: [], contas: [], agencias: [], avisos: [] };

export function DadosProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<StatusCarregamento>('carregando');
  const [erro, setErro] = useState<string | null>(null);
  const [dadosPlanilha, setDadosPlanilha] = useState<DadosBancarios>(DADOS_VAZIOS);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);
  // Clientes cadastrados no formulário. Ficam só na memória e somem ao recarregar a página.
  const [clientesLocais, setClientesLocais] = useState<Cliente[]>([]);
  // Mudar este número dispara uma nova leitura da planilha (ver efeito abaixo).
  const [versaoLeitura, setVersaoLeitura] = useState(0);

  useEffect(() => {
    // O AbortController cancela a requisição se o efeito for refeito ou o
    // componente desmontado, evitando atualizar estado com dados antigos.
    const controle = new AbortController();

    carregarDados(controle.signal)
      .then((dados) => {
        setDadosPlanilha(dados);
        setAtualizadoEm(new Date());
        setErro(null);
        setStatus('sucesso');
      })
      .catch((e: unknown) => {
        if (controle.signal.aborted) return;
        console.error('[dados] Falha ao carregar a planilha:', e);
        setErro(e instanceof ErroPlanilha ? e.message : 'Ocorreu um erro inesperado ao carregar os dados.');
        setStatus('erro');
      });

    return () => controle.abort();
  }, [versaoLeitura]);

  const recarregar = useCallback(() => {
    setStatus('carregando');
    setVersaoLeitura((v) => v + 1);
  }, []);

  const adicionarCliente = useCallback((dados: Omit<Cliente, 'id'>): Cliente => {
    // randomUUID garante um id único sem depender de um servidor.
    const novo: Cliente = { ...dados, id: `CLI-${crypto.randomUUID()}` };
    setClientesLocais((atuais) => [...atuais, novo]);
    return novo;
  }, []);

  const valor = useMemo<ValorContextoDados>(() => {
    const { contas, agencias, avisos } = dadosPlanilha;

    const contasPorDocumento = new Map<string, Conta[]>();
    for (const conta of contas) {
      const lista = contasPorDocumento.get(conta.cpfCnpjCliente) ?? [];
      lista.push(conta);
      contasPorDocumento.set(conta.cpfCnpjCliente, lista);
    }

    return {
      status,
      erro,
      // Junta os clientes da planilha com os cadastrados nesta sessão (identificados como "Novo" na lista).
      clientes: [...clientesLocais, ...dadosPlanilha.clientes],
      contas,
      agencias,
      avisos,
      atualizadoEm,
      agenciaPorCodigo: new Map(agencias.map((a) => [a.codigo, a])),
      contasPorDocumento,
      idsCadastradosLocalmente: new Set(clientesLocais.map((c) => c.id)),
      recarregar,
      adicionarCliente,
    };
  }, [status, erro, dadosPlanilha, clientesLocais, atualizadoEm, recarregar, adicionarCliente]);

  return <ContextoDados value={valor}>{children}</ContextoDados>;
}
