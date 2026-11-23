import { describe, expect, it } from 'vitest';
import type { Cliente } from '../types/modelos';
import { FILTROS_PADRAO, filtrarClientes, itensPaginacao, paginar } from '../utils/filtroClientes';
import { criarSchemaCliente, VALORES_INICIAIS } from '../utils/schemaFormularioCliente';

function cliente(dados: Partial<Cliente>): Cliente {
  return {
    id: 'CLI-X',
    cpfCnpj: '52998224725',
    dataNascimento: new Date(1990, 0, 1),
    nome: 'Fulano',
    email: 'f@f.com',
    endereco: 'Rua A',
    rendaAnual: 1000,
    patrimonio: 0,
    estadoCivil: 'Solteiro',
    codigoAgencia: 1001,
    ...dados,
  };
}

const CLIENTES = [
  cliente({ id: '1', nome: 'João Pereira', cpfCnpj: '52998224725' }),
  cliente({ id: '2', nome: 'Helena Castro', nomeSocial: 'Elena Castro', cpfCnpj: '11144477735' }),
  cliente({ id: '3', nome: 'Padaria Estrela', cpfCnpj: '11222333000181', codigoAgencia: 1003 }),
];

describe('filtro de clientes', () => {
  it('busca por nome ignorando acentos e maiúsculas', () => {
    expect(filtrarClientes(CLIENTES, { ...FILTROS_PADRAO, busca: 'JOAO' }).map((c) => c.id)).toEqual(['1']);
  });

  it('busca pelo nome social', () => {
    expect(filtrarClientes(CLIENTES, { ...FILTROS_PADRAO, busca: 'elena' }).map((c) => c.id)).toEqual(['2']);
  });

  it('busca por CPF/CNPJ com ou sem pontuação', () => {
    expect(filtrarClientes(CLIENTES, { ...FILTROS_PADRAO, busca: '529.982' }).map((c) => c.id)).toEqual(['1']);
    expect(filtrarClientes(CLIENTES, { ...FILTROS_PADRAO, busca: '0001-81' }).map((c) => c.id)).toEqual(['3']);
  });

  it('filtra por tipo de pessoa e agência', () => {
    expect(filtrarClientes(CLIENTES, { ...FILTROS_PADRAO, tipoPessoa: 'PJ' })).toHaveLength(1);
    expect(filtrarClientes(CLIENTES, { ...FILTROS_PADRAO, codigoAgencia: 1001 })).toHaveLength(2);
  });
});

describe('paginação', () => {
  const itens = Array.from({ length: 95 }, (_, i) => i);

  it('mostra no máximo 10 itens por página', () => {
    const pagina = paginar(itens, 2);
    expect(pagina.itens).toHaveLength(10);
    expect(pagina).toMatchObject({ inicio: 11, fim: 20, totalPaginas: 10 });
  });

  it('ajusta páginas fora do intervalo', () => {
    expect(paginar(itens, 99).paginaAtual).toBe(10);
    expect(paginar(itens, -3).paginaAtual).toBe(1);
    expect(paginar([], 1)).toMatchObject({ totalPaginas: 1, inicio: 0, fim: 0 });
  });

  it('abrevia a lista de páginas com reticências', () => {
    expect(itensPaginacao(5, 10)).toEqual([1, 'reticencias', 4, 5, 6, 'reticencias', 10]);
    expect(itensPaginacao(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('formulário de cadastro', () => {
  const schema = criarSchemaCliente(new Set(['52998224725']), new Set([1001]));
  const valido = {
    ...VALORES_INICIAIS,
    cpfCnpj: '111.444.777-35',
    nome: 'Maria Silva',
    dataNascimento: '1995-03-20',
    estadoCivil: 'Casado' as const,
    email: 'maria@exemplo.com',
    endereco: 'Rua das Flores, 10',
    rendaAnual: '5.000,00',
    patrimonio: '0',
    codigoAgencia: '1001',
  };

  it('converte os valores digitados para os tipos de Cliente', () => {
    const resultado = schema.parse(valido);
    expect(resultado).toMatchObject({ cpfCnpj: '11144477735', rendaAnual: 5000, codigoAgencia: 1001 });
    expect(resultado.rg).toBeUndefined();
    expect(resultado.dataNascimento).toBeInstanceOf(Date);
  });

  it('recusa CPF inválido, CPF já cadastrado e agência inexistente', () => {
    expect(schema.safeParse({ ...valido, cpfCnpj: '111.444.777-36' }).success).toBe(false);
    expect(schema.safeParse({ ...valido, cpfCnpj: '529.982.247-25' }).success).toBe(false);
    expect(schema.safeParse({ ...valido, codigoAgencia: '9999' }).success).toBe(false);
  });

  it('recusa data futura e valores negativos', () => {
    expect(schema.safeParse({ ...valido, dataNascimento: '2999-01-01' }).success).toBe(false);
    expect(schema.safeParse({ ...valido, rendaAnual: '-10' }).success).toBe(false);
  });
});
