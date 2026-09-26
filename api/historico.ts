/// <reference types="node" />

export default async function handler(req: any, res: any) {
  const { ticker, periodo } = req.query

  if (
    !ticker ||
    typeof ticker !== 'string'
  ) {
    return res.status(400).json({
      error: 'Ticker não informado',
    })
  }

  const periodoValido =
    typeof periodo === 'string'
      ? periodo
      : '1y'

  const token = process.env.BRAPI_TOKEN

  if (!token) {
    return res.status(500).json({
      error: 'BRAPI_TOKEN não configurado no servidor',
    })
  }

  try {
    const resposta = await fetch(
      `https://brapi.dev/api/v2/stocks/historical?symbols=${encodeURIComponent(
        ticker.toUpperCase(),
      )}&range=${encodeURIComponent(
        periodoValido,
      )}&interval=1d&sortOrder=asc`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    if (!resposta.ok) {
  const detalheErro = await resposta.text()

  console.error(
    `Erro histórico BRAPI ${ticker}:`,
    resposta.status,
    detalheErro,
  )

  return res.status(resposta.status).json({
    error: 'Erro ao consultar histórico',
    detalhe: detalheErro,
  })
}

    const dados = await resposta.json()

    return res.status(200).json(dados)
  } catch (erro) {
    console.error(
      'Erro ao consultar histórico:',
      erro,
    )

    return res.status(500).json({
      error: 'Erro interno ao consultar histórico',
    })
  }
}