export type AtivoBusca = {
  ticker: string
  nome: string
  tipo?: string
}

export async function buscarAtivos(
  termo: string,
): Promise<AtivoBusca[]> {
  const busca = termo.trim()

  if (busca.length < 1) {
    return []
  }

  try {
    const resposta = await fetch(
      `https://brapi.dev/api/quote/list?search=${encodeURIComponent(
        busca,
      )}&limit=8`,
    )

    if (!resposta.ok) {
      return []
    }

    const dados = await resposta.json()

    return (dados.stocks ?? []).map(
      (ativo: {
        stock: string
        name: string
        type?: string
      }) => ({
        ticker: ativo.stock,
        nome: ativo.name,
        tipo: ativo.type,
      }),
    )
  } catch (erro) {
    console.error(
      'Erro ao buscar ativos:',
      erro,
    )

    return []
  }
}