export type TipoMovimentacao = 'compra' | 'venda'

export type Movimentacao = {
  id: string
  tipo: TipoMovimentacao
  quantidade: number
  preco: number
  data: string
}

export type Posicao = {
  ticker: string
  nome: string
  quantidade: number
  precoMedio: number
  data: string
  movimentacoes?: Movimentacao[]
}

const CHAVE_CARTEIRA = 'investhub-carteira'

export function carregarCarteira(): Posicao[] {
  const carteiraSalva =
    localStorage.getItem(CHAVE_CARTEIRA)

  if (!carteiraSalva) {
    return []
  }

  try {
    return JSON.parse(carteiraSalva)
  } catch (erro) {
    console.error(
      'Erro ao carregar carteira:',
      erro,
    )

    return []
  }
}

export function salvarCarteira(
  posicoes: Posicao[],
) {
  localStorage.setItem(
    CHAVE_CARTEIRA,
    JSON.stringify(posicoes),
  )
}