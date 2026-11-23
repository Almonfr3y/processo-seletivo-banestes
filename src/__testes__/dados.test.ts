/**
 * Testes da leitura da planilha usando cópias reais das abas (pasta ./dados),
 * baixadas em 23/11/2026. Garantem que as inconsistências conhecidas
 * continuam sendo tratadas.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { carregarDados } from '../services/dados';
import { COLUNAS, converterClientes } from '../services/normalizacao';
import { interpretarCsv } from '../services/planilha';
import agenciasCsv from './dados/agencias.csv?raw';
import clientesCsv from './dados/clientes.csv?raw';
import contasCsv from './dados/contas.csv?raw';

const CSV_POR_ABA: Record<string, string> = { clientes: clientesCsv, contas: contasCsv, agencias: agenciasCsv };

/** Substitui o fetch global por uma versão que devolve os CSVs locais. */
function simularPlanilha(sobrescrever: Partial<Record<string, string>> = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const aba = new URL(url).searchParams.get('sheet') ?? '';
      const corpo = sobrescrever[aba] ?? CSV_POR_ABA[aba];
      return new Response(corpo, { headers: { 'content-type': 'text/csv; charset=utf-8' } });
    }),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('leitura dos dados reais', () => {
  it('carrega os registros válidos das três abas', async () => {
    simularPlanilha();
    const dados = await carregarDados();
    expect(dados.clientes).toHaveLength(100);
    expect(dados.agencias).toHaveLength(5);
    expect(dados.contas).toHaveLength(107); // CNT-108 é descartada (CPF "0")
  });

  it('recupera zeros à esquerda e mantém as contas ligadas ao cliente', async () => {
    simularPlanilha();
    const dados = await carregarDados();
    const tatiana = dados.clientes.find((c) => c.id === 'CLI-022');
    expect(tatiana?.cpfCnpj).toBe('01010101010');
    expect(dados.contas.some((c) => c.cpfCnpjCliente === '01010101010')).toBe(true);
  });

  it('converte os campos para os tipos da interface', async () => {
    simularPlanilha();
    const [ana] = (await carregarDados()).clientes;
    expect(ana).toMatchObject({
      id: 'CLI-001',
      cpfCnpj: '11122233344',
      rendaAnual: 85000,
      codigoAgencia: 1001,
      estadoCivil: 'Solteiro',
    });
    expect(ana.dataNascimento).toBeInstanceOf(Date);
    expect(ana.nomeSocial).toBeUndefined();
  });

  it('trata RG "ISENTO" ou vazio como não informado', async () => {
    simularPlanilha();
    const { clientes } = await carregarDados();
    expect(clientes.find((c) => c.id === 'CLI-004')?.rg).toBeUndefined(); // ISENTO
    expect(clientes.find((c) => c.id === 'CLI-007')?.rg).toBeUndefined(); // vazio
  });

  it('gera avisos para conta sem dono e agência inexistente', async () => {
    simularPlanilha();
    const { avisos } = await carregarDados();
    expect(avisos.map((a) => a.registro)).toEqual(expect.arrayContaining(['CNT-108', 'CLI-021']));
  });
});

describe('robustez contra mudanças na planilha', () => {
  it('ignora a linha inválida sem perder as demais', () => {
    const csv = [
      '"id","cpfCnpj","rg","dataNascimento","nome","nomeSocial","email","endereco","rendaAnual","patrimonio","estadoCivil","codigoAgencia"',
      '"CLI-1","52998224725","","1990-01-01","Válido","","a@a.com","Rua 1","1000","0","casada","1001"',
      '"CLI-2","52998224725","","data ruim","Inválido","","b@b.com","Rua 2","abc","0","Noivo","1001"',
    ].join('\n');
    const { itens, avisos } = converterClientes(interpretarCsv(csv, 'clientes', COLUNAS.clientes));
    expect(itens).toHaveLength(1);
    expect(itens[0].estadoCivil).toBe('Casado'); // "casada" é normalizado
    expect(avisos[0].registro).toBe('CLI-2');
  });

  it('falha com mensagem clara se faltar uma coluna obrigatória', async () => {
    simularPlanilha({ agencias: '"id","nome"\n"AG-01","Central"' });
    await expect(carregarDados()).rejects.toThrow(/colunas esperadas: codigo, endereco/);
  });

  it('avisa quando a planilha deixa de devolver CSV', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html>login</html>', { headers: { 'content-type': 'text/html' } })),
    );
    await expect(carregarDados()).rejects.toThrow(/não retornou dados em CSV/);
  });
});
