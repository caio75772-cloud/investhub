import {
  buscarCotacoes,
} from './mercado'

export type ItemResumoMercado = {
  ticker: string
  nome: string
  preco: number
  variacao: number
  formato: 'indice' | 'moeda'
}

const ATIVOS_RESUMO = [
  {
    ticker: '^BVSP',
    nome: 'Ibovespa',
    formato: 'indice' as const,
  },
  {
    ticker: 'IVVB11',
    nome: 'S&P 500 BRL',
    formato: 'moeda' as const,
  },
  {
    ticker: 'NASD11',
    nome: 'Nasdaq 100 BRL',
    formato: 'moeda' as const,
  },
]

export async function buscarResumoMercado(
  forcarAtualizacao = false,
): Promise<ItemResumoMercado[]> {
  const tickers = ATIVOS_RESUMO.map(
    (ativo) => ativo.ticker,
  )

  const cotacoes = await buscarCotacoes(
    tickers,
    forcarAtualizacao,
  )

  return ATIVOS_RESUMO.flatMap((ativo) => {
    const cotacao = cotacoes[ativo.ticker]

    if (!cotacao) {
      return []
    }

    return [
      {
        ticker: ativo.ticker,
        nome: ativo.nome,
        preco: cotacao.preco,
        variacao: cotacao.variacao,
        formato: ativo.formato,
      },
    ]
  })
}