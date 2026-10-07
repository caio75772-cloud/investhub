/// <reference types="node" />

function numeroOuNull(valor: unknown) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ''
  ) {
    return null
  }

  const numero = Number(valor)

  return Number.isFinite(numero)
    ? numero
    : null
}

async function consultarBrapi(
  url: string,
  token: string,
) {
  const resposta = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  let dados: any = null

  try {
    dados = await resposta.json()
  } catch {
    dados = null
  }

  return {
    resposta,
    dados,
  }
}

export default async function handler(
  req: any,
  res: any,
) {
  const { ticker } = req.query

  if (
    !ticker ||
    typeof ticker !== 'string'
  ) {
    return res.status(400).json({
      disponivel: false,
      motivo: 'TICKER_INVALIDO',
    })
  }

  const token = process.env.BRAPI_TOKEN

  if (!token) {
    return res.status(500).json({
      disponivel: false,
      motivo: 'TOKEN_NAO_CONFIGURADO',
    })
  }

  const tickerNormalizado =
    ticker.trim().toUpperCase()

  try {
    const urlEstatisticas =
      `https://brapi.dev/api/v2/stocks/statistics?symbols=${encodeURIComponent(
        tickerNormalizado,
      )}`

    const urlFinanceiro =
      `https://brapi.dev/api/v2/stocks/financial-data?symbols=${encodeURIComponent(
        tickerNormalizado,
      )}`

    const [
      consultaEstatisticas,
      consultaFinanceiro,
    ] = await Promise.all([
      consultarBrapi(
        urlEstatisticas,
        token,
      ),
      consultarBrapi(
        urlFinanceiro,
        token,
      ),
    ])

    const {
      resposta: respostaEstatisticas,
      dados: dadosEstatisticas,
    } = consultaEstatisticas

    const {
      resposta: respostaFinanceiro,
      dados: dadosFinanceiro,
    } = consultaFinanceiro

    const estatisticasBloqueadas =
      respostaEstatisticas.status === 403 ||
      dadosEstatisticas?.code ===
        'FEATURE_NOT_AVAILABLE'

    const financeiroBloqueado =
      respostaFinanceiro.status === 403 ||
      dadosFinanceiro?.code ===
        'FEATURE_NOT_AVAILABLE'

    const ativoEstatisticas =
      dadosEstatisticas?.results?.find(
        (item: any) =>
          item.symbol ===
            tickerNormalizado ||
          item.requestedSymbol ===
            tickerNormalizado,
      ) ?? null

    const ativoFinanceiro =
      dadosFinanceiro?.results?.find(
        (item: any) =>
          item.symbol ===
            tickerNormalizado ||
          item.requestedSymbol ===
            tickerNormalizado,
      ) ?? null

    const estatisticas =
      ativoEstatisticas?.data ?? null

    const financeiro =
      ativoFinanceiro?.data ?? null

    const pl = numeroOuNull(
      estatisticas?.trailingPE,
    )

    const pvp = numeroOuNull(
      estatisticas?.priceToBook,
    )

    const dy = numeroOuNull(
      estatisticas?.dividendYield,
    )

    const roe = numeroOuNull(
      financeiro?.returnOnEquity,
    )

    const possuiAlgumDado =
      pl !== null ||
      pvp !== null ||
      dy !== null ||
      roe !== null

    if (!possuiAlgumDado) {
      if (
        estatisticasBloqueadas ||
        financeiroBloqueado
      ) {
        return res.status(200).json({
          disponivel: false,
          motivo: 'PLANO_BRAPI',
          ticker: tickerNormalizado,
          pl: null,
          pvp: null,
          dy: null,
          roe: null,
        })
      }

      return res.status(200).json({
        disponivel: false,
        motivo:
          'ATIVO_NAO_ENCONTRADO_OU_SEM_DADOS',
        ticker: tickerNormalizado,
        pl: null,
        pvp: null,
        dy: null,
        roe: null,
      })
    }

    const parcial =
      estatisticasBloqueadas ||
      financeiroBloqueado ||
      !respostaEstatisticas.ok ||
      !respostaFinanceiro.ok

    return res.status(200).json({
      disponivel: true,
      parcial,
      ticker: tickerNormalizado,

      pl,
      pvp,
      dy,
      roe,
    })
  } catch (erro) {
    console.error(
      'Erro ao consultar fundamentos:',
      erro,
    )

    return res.status(500).json({
      disponivel: false,
      motivo: 'ERRO_INTERNO',
      ticker: tickerNormalizado,
      pl: null,
      pvp: null,
      dy: null,
      roe: null,
    })
  }
}