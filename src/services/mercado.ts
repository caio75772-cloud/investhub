export type Cotacao = {
  preco: number
  variacao: number
}

export type PontoHistorico = {
  date: number
  close: number
  adjustedClose?: number
}

export type SerieHistorica = {
  ticker: string
  pontos: PontoHistorico[]
}

type PeriodoHistorico = '1mo' | '3mo' | '6mo' | '1y'

const CACHE_COTACOES = new Map<
  string,
  {
    cotacao: Cotacao
    timestamp: number
  }
>()

const TEMPO_CACHE = 60 * 1000

export async function buscarCotacao(
  ticker: string,
): Promise<Cotacao | null> {
  const tickerNormalizado = ticker.toUpperCase()

  const cache = CACHE_COTACOES.get(tickerNormalizado)

  if (
    cache &&
    Date.now() - cache.timestamp < TEMPO_CACHE
  ) {
    return cache.cotacao
  }

  try {
  let resposta: Response

  if (import.meta.env.DEV) {
    const token = import.meta.env.VITE_BRAPI_TOKEN

    resposta = await fetch(
      `https://brapi.dev/api/v2/stocks/quote?symbols=${encodeURIComponent(
        tickerNormalizado
      )}`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      }
    )
  } else {
    resposta = await fetch(
      `/api/cotacoes?ticker=${encodeURIComponent(tickerNormalizado)}`
    )
  }

    if (!resposta.ok) {
      return null
    }

    const dados = await resposta.json()

    const ativo = dados.results?.[0]?.data

    if (ativo?.regularMarketPrice == null) {
      return null
    }

    const cotacao: Cotacao = {
      preco: ativo.regularMarketPrice,
      variacao:
        ativo.regularMarketChangePercent ?? 0,
    }

    CACHE_COTACOES.set(tickerNormalizado, {
      cotacao,
      timestamp: Date.now(),
    })

    return cotacao
  } catch (erro) {
    console.error(
      `Erro ao buscar cotação de ${tickerNormalizado}:`,
      erro,
    )

    return null
  }
}

export async function buscarCotacoes(
  tickers: string[],
): Promise<Record<string, Cotacao>> {
  const resultado: Record<string, Cotacao> = {}

  await Promise.all(
    tickers.map(async (ticker) => {
      const cotacao = await buscarCotacao(ticker)

      if (cotacao) {
        resultado[ticker.toUpperCase()] = cotacao
      }
    }),
  )

  return resultado
}

export async function buscarHistoricoAtivo(
  ticker: string,
  periodo: PeriodoHistorico,
): Promise<SerieHistorica> {
  try {
    const resposta = await fetch(
      `https://brapi.dev/api/v2/stocks/historical?symbols=${encodeURIComponent(
        ticker,
      )}&range=${periodo}&interval=1d&sortOrder=asc`,
    )

    if (!resposta.ok) {
      return {
        ticker,
        pontos: [],
      }
    }

    const dados = await resposta.json()

    return {
      ticker,
      pontos:
        dados.results?.[0]?.data?.historicalDataPrice ??
        [],
    }
  } catch (erro) {
    console.error(
      `Erro ao buscar histórico de ${ticker}:`,
      erro,
    )

    return {
      ticker,
      pontos: [],
    }
  }
}