/// <reference types="node" />

type ProventoNormalizado = {
  ticker: string
  tipo: string
  valorPorAcao: number
  dataCom: string | null
  dataPagamento: string | null
}

export default async function handler(
  req: any,
  res: any,
) {
  const { ticker, inicio, fim } = req.query

  if (
    !ticker ||
    typeof ticker !== 'string'
  ) {
    return res.status(400).json({
      disponivel: false,
      motivo: 'TICKER_INVALIDO',
      proventos: [],
    })
  }

  const token = process.env.BRAPI_TOKEN

  if (!token) {
    return res.status(500).json({
      disponivel: false,
      motivo: 'TOKEN_NAO_CONFIGURADO',
      proventos: [],
    })
  }

  const parametros = new URLSearchParams({
    symbols: ticker.toUpperCase(),
    sortOrder: 'asc',
  })

  if (typeof inicio === 'string') {
    parametros.set('startDate', inicio)
  }

  if (typeof fim === 'string') {
    parametros.set('endDate', fim)
  }

  try {
    const resposta = await fetch(
      `https://brapi.dev/api/v2/stocks/dividends?${parametros.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    const dados = await resposta.json()

    if (
      dados?.code === 'FEATURE_NOT_AVAILABLE' ||
      resposta.status === 403
    ) {
      return res.status(200).json({
        disponivel: false,
        motivo: 'PLANO_BRAPI',
        proventos: [],
      })
    }

    if (!resposta.ok) {
      return res.status(resposta.status).json({
        disponivel: false,
        motivo: 'ERRO_BRAPI',
        proventos: [],
      })
    }

    const resultado = dados?.results?.[0]

    const dividendos =
      resultado?.data?.cashDividends ?? []

    const proventos: ProventoNormalizado[] =
      dividendos.map((item: any) => ({
        ticker:
          resultado?.symbol ??
          ticker.toUpperCase(),

        tipo:
          item.label ?? 'PROVENTO',

        valorPorAcao:
          Number(item.rate) || 0,

        dataCom:
          item.lastDatePrior ?? null,

        dataPagamento:
          item.paymentDate ?? null,
      }))

    return res.status(200).json({
      disponivel: true,
      ticker: ticker.toUpperCase(),
      proventos,
    })
  } catch (erro) {
    console.error(
      'Erro ao consultar proventos:',
      erro,
    )

    return res.status(500).json({
      disponivel: false,
      motivo: 'ERRO_INTERNO',
      proventos: [],
    })
  }
}