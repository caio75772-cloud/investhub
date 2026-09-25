export default async function handler(req: any, res: any) {
  const { ticker } = req.query

  if (!ticker || typeof ticker !== "string") {
    return res.status(400).json({
      error: "Ticker não informado",
    })
  }

  const token = process.env.BRAPI_TOKEN

  if (!token) {
    return res.status(500).json({
      error: "BRAPI_TOKEN não configurado no servidor",
    })
  }

  try {
    const resposta = await fetch(
      `https://brapi.dev/api/v2/stocks/quote?symbols=${encodeURIComponent(
        ticker.toUpperCase()
      )}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!resposta.ok) {
      return res.status(resposta.status).json({
        error: "Erro ao consultar BRAPI",
      })
    }

    const dados = await resposta.json()

    return res.status(200).json(dados)
  } catch (erro) {
    console.error("Erro ao consultar cotação:", erro)

    return res.status(500).json({
      error: "Erro interno ao consultar cotação",
    })
  }
}