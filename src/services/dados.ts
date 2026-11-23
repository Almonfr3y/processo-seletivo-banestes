/**
 * Ponto de entrada para carregar todos os dados do sistema.
 *
 * Busca as três abas em paralelo, converte cada uma para os modelos do domínio
 * e verifica a consistência entre elas (ids repetidos, contas sem dono,
 * clientes ligados a agências inexistentes...).
 */

import type { Agencia, AvisoDados, Cliente, Conta } from '../types/modelos';
import { COLUNAS, converterAgencias, converterClientes, converterContas } from './normalizacao';
import { buscarAba } from './planilha';

export interface DadosBancarios {
  clientes: Cliente[];
  contas: Conta[];
  agencias: Agencia[];
  avisos: AvisoDados[];
}

export async function carregarDados(signal?: AbortSignal): Promise<DadosBancarios> {
  const [linhasClientes, linhasContas, linhasAgencias] = await Promise.all([
    buscarAba('clientes', COLUNAS.clientes, signal),
    buscarAba('contas', COLUNAS.contas, signal),
    buscarAba('agencias', COLUNAS.agencias, signal),
  ]);

  const clientes = converterClientes(linhasClientes);
  const contas = converterContas(linhasContas);
  const agencias = converterAgencias(linhasAgencias);

  const avisos: AvisoDados[] = [...clientes.avisos, ...contas.avisos, ...agencias.avisos];

  // Registros duplicados: mantemos a primeira ocorrência e avisamos sobre as demais.
  const clientesUnicos = removerDuplicados(clientes.itens, (c) => c.id, 'clientes', 'id repetido', avisos);
  const clientesValidos = removerDuplicados(clientesUnicos, (c) => c.cpfCnpj, 'clientes', 'CPF/CNPJ repetido', avisos);
  const contasValidas = removerDuplicados(contas.itens, (c) => c.id, 'contas', 'id repetido', avisos);
  const agenciasValidas = removerDuplicados(agencias.itens, (a) => a.codigo, 'agencias', 'código repetido', avisos);

  avisos.push(...verificarRelacionamentos(clientesValidos, contasValidas, agenciasValidas));

  if (avisos.length > 0) {
    console.warn(`[dados] ${avisos.length} problema(s) encontrado(s) na planilha:`, avisos);
  }

  return { clientes: clientesValidos, contas: contasValidas, agencias: agenciasValidas, avisos };
}

/** Mantém só a primeira ocorrência de cada chave, registrando aviso para as repetidas. */
function removerDuplicados<T extends { id: string }>(
  itens: T[],
  chave: (item: T) => string | number,
  aba: AvisoDados['aba'],
  motivo: string,
  avisos: AvisoDados[],
): T[] {
  const vistos = new Set<string | number>();
  return itens.filter((item) => {
    const valor = chave(item);
    if (vistos.has(valor)) {
      avisos.push({ aba, registro: item.id, mensagem: `Registro ignorado: ${motivo} (${valor}).` });
      return false;
    }
    vistos.add(valor);
    return true;
  });
}

/**
 * Confere as ligações entre as abas. Esses problemas não removem registros
 * (o cliente continua visível), apenas geram avisos e são tratados na interface.
 */
function verificarRelacionamentos(clientes: Cliente[], contas: Conta[], agencias: Agencia[]): AvisoDados[] {
  const avisos: AvisoDados[] = [];
  const documentos = new Set(clientes.map((c) => c.cpfCnpj));
  const codigosAgencia = new Set(agencias.map((a) => a.codigo));

  for (const conta of contas) {
    if (!documentos.has(conta.cpfCnpjCliente)) {
      avisos.push({
        aba: 'contas',
        registro: conta.id,
        mensagem: `Conta sem cliente correspondente (CPF/CNPJ ${conta.cpfCnpjCliente}).`,
      });
    }
    if (conta.creditoDisponivel > conta.limiteCredito) {
      avisos.push({
        aba: 'contas',
        registro: conta.id,
        mensagem: 'Crédito disponível maior que o limite de crédito.',
      });
    }
  }

  for (const cliente of clientes) {
    if (!codigosAgencia.has(cliente.codigoAgencia)) {
      avisos.push({
        aba: 'clientes',
        registro: cliente.id,
        mensagem: `Agência ${cliente.codigoAgencia} não encontrada.`,
      });
    }
  }

  return avisos;
}
