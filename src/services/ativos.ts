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

export type AtivoMercado = {
  ticker: string
  nome: string
  preco: number | null
  variacao: number | null
  valorMercado: number | null
  setor: string | null
  tipo: string | null
  subtipo: string | null
  logoUrl: string | null
}

export type ListaAtivosMercado = {
  ativos: AtivoMercado[]
  total: number
  temProximaPagina: boolean
}

export type FiltroTipoAtivo =
  | 'todos'
  | 'acoes'
  | 'fiis'
  | 'bdrs'
  | 'etfs'

export async function listarAtivosMercado(
  tipo: FiltroTipoAtivo = 'acoes',
  busca = '',
  pagina = 1,
): Promise<ListaAtivosMercado> {
  try {
    const parametros =
      new URLSearchParams()

    parametros.set('limit', '12')
    parametros.set('page', String(pagina))

    parametros.set(
      'sortBy',
      'market_cap_basic',
    )

    parametros.set(
      'sortOrder',
      'desc',
    )

    if (busca.trim()) {
      parametros.set(
        'search',
        busca.trim(),
      )
    }

    if (tipo === 'acoes') {
      parametros.set(
        'type',
        'stock',
      )
    }

    if (tipo === 'bdrs') {
      parametros.set(
        'type',
        'bdr',
      )
    }

    if (tipo === 'fiis') {
      parametros.set(
        'subType',
        'fii',
      )
    }

    if (tipo === 'etfs') {
      parametros.set(
        'subType',
        'etf',
      )
    }

    const resposta = await fetch(
      `https://brapi.dev/api/quote/list?${parametros.toString()}`,
    )

    if (!resposta.ok) {
      return {
        ativos: [],
        total: 0,
        temProximaPagina: false,
      }
    }

    const dados = await resposta.json()

    const ativos: AtivoMercado[] =
      (dados.stocks ?? []).map(
        (ativo: any) => ({
          ticker:
            ativo.stock ?? '',

          nome:
            ativo.name ??
            ativo.stock ??
            '',

          preco:
            Number.isFinite(
              Number(ativo.close),
            )
              ? Number(ativo.close)
              : null,

          variacao:
            Number.isFinite(
              Number(ativo.change),
            )
              ? Number(ativo.change)
              : null,

          valorMercado:
            Number.isFinite(
              Number(ativo.market_cap),
            )
              ? Number(
                  ativo.market_cap,
                )
              : null,

          setor:
            ativo.sector ?? null,

          tipo:
            ativo.type ?? null,

          subtipo:
            ativo.subType ?? null,

          logoUrl:
            ativo.logo ??
            (ativo.stock
              ? `https://icons.brapi.dev/icons/${ativo.stock}.svg`
              : null),
        }),
      )

    return {
      ativos,

      total:
        Number(dados.totalCount) ||
        ativos.length,

      temProximaPagina:
        dados.hasNextPage === true,
    }
  } catch (erro) {
    console.error(
      'Erro ao listar ativos do mercado:',
      erro,
    )

    return {
      ativos: [],
      total: 0,
      temProximaPagina: false,
    }
  }
}