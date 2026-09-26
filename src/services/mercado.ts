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


export async function buscarCotacoes(
  tickers: string[],
  forcarAtualizacao = false,
): Promise<Record<string, Cotacao>> {
  const resultado: Record<string, Cotacao> = {}

  const tickersNormalizados = [
    ...new Set(
      tickers.map((ticker) =>
        ticker.trim().toUpperCase(),
      ),
    ),
  ]

  const tickersParaBuscar =
    tickersNormalizados.filter((ticker) => {
      const cache = CACHE_COTACOES.get(ticker)

      if (
        !forcarAtualizacao &&
        cache &&
        Date.now() - cache.timestamp < TEMPO_CACHE
      ) {
        resultado[ticker] = cache.cotacao
        return false
      }

      return true
    })

  if (tickersParaBuscar.length === 0) {
    return resultado
  }

  try {
    const resposta = await fetch(
      `/api/cotacoes?tickers=${encodeURIComponent(
        tickersParaBuscar.join(','),
      )}`,
    )

    if (!resposta.ok) {
      console.error(
        'Erro ao buscar cotações:',
        resposta.status,
      )

      return resultado
    }

    const dados = await resposta.json()

    for (const item of dados.results ?? []) {
      const ticker =
        item.requestedSymbol ??
        item.symbol

      const ativo = item.data

      if (
        !ticker ||
        ativo?.regularMarketPrice == null
      ) {
        continue
      }

      const cotacao: Cotacao = {
        preco: ativo.regularMarketPrice,
        variacao:
          ativo.regularMarketChangePercent ?? 0,
      }

      resultado[ticker.toUpperCase()] = cotacao

      CACHE_COTACOES.set(
        ticker.toUpperCase(),
        {
          cotacao,
          timestamp: Date.now(),
        },
      )
    }

    return resultado
  } catch (erro) {
    console.error(
      'Erro ao buscar cotações:',
      erro,
    )

    return resultado
  }
}

export async function buscarHistoricoAtivo(
  ticker: string,
  periodo: PeriodoHistorico,
): Promise<SerieHistorica> {
  try {
    const resposta = await fetch(
      `/api/historico?ticker=${encodeURIComponent(
        ticker,
      )}&periodo=${encodeURIComponent(periodo)}`,
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
        dados.results?.[0]?.data
          ?.historicalDataPrice ?? [],
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