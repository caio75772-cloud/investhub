export type Provento = {
  ticker: string
  tipo: string
  valorPorAcao: number
  dataCom: string | null
  dataPagamento: string | null
}

export type RespostaProventos = {
  disponivel: boolean
  motivo?: string
  ticker?: string
  proventos: Provento[]
}

export async function buscarProventosAtivo(
  ticker: string,
  inicio: string,
  fim: string,
): Promise<RespostaProventos> {
  try {
    const parametros = new URLSearchParams({
      ticker,
      inicio,
      fim,
    })

    const resposta = await fetch(
      `/api/proventos?${parametros.toString()}`,
    )

    const dados = await resposta.json()

    if (!resposta.ok) {
      return {
        disponivel: false,
        motivo:
          dados?.motivo ??
          'ERRO_AO_BUSCAR_PROVENTOS',
        proventos: [],
      }
    }

    return {
      disponivel:
        dados?.disponivel === true,

      motivo:
        dados?.motivo,

      ticker:
        dados?.ticker,

      proventos:
        Array.isArray(dados?.proventos)
          ? dados.proventos
          : [],
    }
  } catch (erro) {
    console.error(
      `Erro ao buscar proventos de ${ticker}:`,
      erro,
    )

    return {
      disponivel: false,
      motivo: 'ERRO_DE_CONEXAO',
      proventos: [],
    }
  }
}