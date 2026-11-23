import { describe, expect, it } from 'vitest';
import {
  formatarDocumento,
  mascararDocumentoParcial,
  normalizarDocumento,
  tipoPessoa,
  validarCnpj,
  validarCpf,
} from '../utils/documento';
import { calcularIdade, converterData, converterNumero, iniciais, normalizarTexto } from '../utils/formatadores';

describe('documento', () => {
  it('recupera zeros à esquerda perdidos pelo Google Sheets', () => {
    expect(normalizarDocumento('1010101010')).toBe('01010101010'); // CPF com 10 dígitos
    expect(normalizarDocumento('11122233')).toBe('00011122233'); // CPF com 8 dígitos
    expect(normalizarDocumento('1234567000199')).toBe('01234567000199'); // CNPJ com 13 dígitos
  });

  it('remove pontuação e rejeita valores impossíveis', () => {
    expect(normalizarDocumento('529.982.247-25')).toBe('52998224725');
    expect(normalizarDocumento('0')).toBeNull();
    expect(normalizarDocumento('')).toBeNull();
    expect(normalizarDocumento('123456789012345')).toBeNull(); // 15 dígitos
  });

  it('identifica pessoa física e jurídica', () => {
    expect(tipoPessoa('52998224725')).toBe('PF');
    expect(tipoPessoa('11222333000181')).toBe('PJ');
  });

  it('valida dígitos verificadores de CPF e CNPJ', () => {
    expect(validarCpf('529.982.247-25')).toBe(true);
    expect(validarCpf('529.982.247-26')).toBe(false);
    expect(validarCpf('111.111.111-11')).toBe(false); // sequência repetida
    expect(validarCnpj('11.222.333/0001-81')).toBe(true);
    expect(validarCnpj('11.222.333/0001-82')).toBe(false);
  });

  it('formata e mascara documentos', () => {
    expect(formatarDocumento('52998224725')).toBe('529.982.247-25');
    expect(formatarDocumento('11222333000181')).toBe('11.222.333/0001-81');
    expect(mascararDocumentoParcial('5299822')).toBe('529.982.2');
    expect(mascararDocumentoParcial('52998224725')).toBe('529.982.247-25');
    expect(mascararDocumentoParcial('11222333000181')).toBe('11.222.333/0001-81');
  });
});

describe('formatadores', () => {
  it('converte números no padrão da planilha e no padrão brasileiro', () => {
    expect(converterNumero('85000.00')).toBe(85000);
    expect(converterNumero('85.000,50')).toBe(85000.5);
    expect(converterNumero('R$ 1.234,56')).toBe(1234.56);
    expect(converterNumero('-120.5')).toBe(-120.5);
    expect(converterNumero('abc')).toBeNull();
    expect(converterNumero('')).toBeNull();
  });

  it('converte datas no fuso local, sem voltar um dia', () => {
    const data = converterData('1990-05-14');
    expect(data?.getFullYear()).toBe(1990);
    expect(data?.getMonth()).toBe(4);
    expect(data?.getDate()).toBe(14);
    expect(converterData('14/05/1990')?.getDate()).toBe(14);
  });

  it('rejeita datas inexistentes', () => {
    expect(converterData('2023-02-31')).toBeNull();
    expect(converterData('ontem')).toBeNull();
  });

  it('calcula idade considerando se já fez aniversário', () => {
    const hoje = new Date(2026, 10, 23);
    expect(calcularIdade(new Date(1990, 4, 14), hoje)).toBe(36);
    expect(calcularIdade(new Date(1990, 11, 1), hoje)).toBe(35);
  });

  it('gera iniciais e normaliza texto para busca', () => {
    expect(iniciais('Ana Maria Souza')).toBe('AS');
    expect(iniciais('Waguinho')).toBe('W');
    expect(normalizarTexto('  JOÃO Viúvo ')).toBe('joao viuvo');
  });
});
