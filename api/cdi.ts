/// <reference types="node" />

export default async function handler(req: any, res: any) {
  const { inicio, fim } = req.query

  if (
    !inicio ||
    !fim ||
    typeof inicio !== 'string' ||
    typeof fim !== 'string'
  ) {
    return res.status(400).json({
      error: 'Período não informado',
    })
  }

  try {
    const formatarDataBCB = (dataISO: string) => {
      const [ano, mes, dia] = dataISO.split('-')
      return `${dia}/${mes}/${ano}`
    }

    const resposta = await fetch(
      `https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=${encodeURIComponent(
        formatarDataBCB(inicio),
      )}&dataFinal=${encodeURIComponent(
        formatarDataBCB(fim),
      )}`,
    )

    if (!resposta.ok) {
      return res.status(resposta.status).json({
        error: 'Erro ao consultar CDI',
      })
    }

    const dados = await resposta.json()

    return res.status(200).json(dados)
  } catch (erro) {
    console.error('Erro ao consultar CDI:', erro)

    return res.status(500).json({
      error: 'Erro interno ao consultar CDI',
    })
  }
}