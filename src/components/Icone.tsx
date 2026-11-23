/**
 * Conjunto pequeno de ícones em SVG, desenhados no próprio projeto
 * (sem biblioteca externa). São decorativos: `aria-hidden` faz o leitor de
 * tela ignorá-los, e o significado sempre vem do texto ao lado.
 */

const CAMINHOS = {
  busca: 'M11 4a7 7 0 1 0 4.2 12.6l4.1 4.1 1.4-1.4-4.1-4.1A7 7 0 0 0 11 4Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z',
  pessoa: 'M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 10c4.4 0 8 2 8 4.5V20H4v-1.5C4 16 7.6 14 12 14Z',
  empresa: 'M4 20V6l8-3v5l8 3v9H4Zm2-2h4v-3H6v3Zm0-5h4v-2H6v2Zm6 5h6v-6l-6-2v8Z',
  mais: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z',
  voltar: 'M10.6 5.6 12 7l-4 4h12v2H8l4 4-1.4 1.4L4.2 12l6.4-6.4Z',
  setaDireita: 'M8.6 5.6 7.2 7l5 5-5 5 1.4 1.4L15 12 8.6 5.6Z',
  setaEsquerda: 'M15.4 5.6 16.8 7l-5 5 5 5-1.4 1.4L9 12l6.4-6.4Z',
  atualizar: 'M12 5a7 7 0 0 1 6.3 4H15v2h6V5h-2v2.3A9 9 0 1 0 21 12h-2a7 7 0 1 1-7-7Z',
  alerta: 'M12 3 2 20h20L12 3Zm-1 6h2v5h-2V9Zm0 7h2v2h-2v-2Z',
  agencia: 'M12 2 3 7v2h18V7l-9-5ZM5 11v6h2v-6H5Zm4 0v6h2v-6H9Zm4 0v6h2v-6h-2Zm4 0v6h2v-6h-2ZM3 19v2h18v-2H3Z',
  cartao:
    'M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm1 2v2h16V7H4Zm0 5v5h16v-5H4Zm2 2h5v1H6v-1Z',
  fechar: 'M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6 10.6 12 5 6.4 6.4 5Z',
  sucesso: 'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm-1.2 13.6 6.5-6.5-1.4-1.4-5.1 5.1-2.3-2.3-1.4 1.4 3.7 3.7Z',
  filtro: 'M3 5h18l-7 8v6l-4-2v-4L3 5Z',
} as const;

export type NomeIcone = keyof typeof CAMINHOS;

interface IconeProps {
  nome: NomeIcone;
  /** Tamanho em pixels (largura = altura). */
  tamanho?: number;
  className?: string;
}

export function Icone({ nome, tamanho = 20, className }: IconeProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={CAMINHOS[nome]} />
    </svg>
  );
}
