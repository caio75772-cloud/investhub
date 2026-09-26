/// <reference types="node" />

export default async function handler(req: any, res: any) {
  const { tickers } = req.query

  if (!tickers || typeof tickers !== 'string') {
    return res.status(400).json({
      error: 'Tickers não informados',
    })
  }

  const tickersNormalizados = [
    ...new Set(
      tickers
        .split(',')
        .map((ticker) =>
          ticker.trim().toUpperCase(),
        )
        .filter(Boolean),
    ),
  ]

  if (tickersNormalizados.length === 0) {
    return res.status(400).json({
      error: 'Nenhum ticker válido informado',
    })
  }

  const token = process.env.BRAPI_TOKEN

  if (!token) {
    return res.status(500).json({
      error: 'BRAPI_TOKEN não configurado no servidor',
    })
  }

  try {
    const results = []

for (const ticker of tickersNormalizados) {
  const resposta = await fetch(
    `https://brapi.dev/api/v2/stocks/quote?symbols=${encodeURIComponent(
      ticker,
    )}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!resposta.ok) {
    console.error(
      `Erro BRAPI ${ticker}:`,
      resposta.status,
    )

    continue
  }

  const dados = await resposta.json()

  const ativo = dados.results?.[0]

  if (ativo) {
    results.push(ativo)
  }
}

    return res.status(200).json({
      results,
      requestedAt: new Date().toISOString(),
    })
  } catch (erro) {
    console.error(
      'Erro ao consultar cotações:',
      erro,
    )

    return res.status(500).json({
      error: 'Erro interno ao consultar cotações',
    })
  }
}