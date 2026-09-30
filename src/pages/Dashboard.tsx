import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  CircleDollarSign,
  Wallet,
  ArrowUpRight,
  ChartNoAxesCombined,
  ChevronDown,
} from 'lucide-react'
import {
  buscarCotacoes,
  buscarHistoricoAtivo,
  type Cotacao,
  type SerieHistorica,
} from '../services/mercado'
import {
  buscarProventosAtivo,
  type Provento,
} from '../services/proventos'
import {
  carregarCarteira,
  type Posicao,
  type TipoMovimentacao,
} from '../services/carteira'
import {
  calcularValorInvestido,
  calcularPatrimonio,
  calcularResultadoNaoRealizado,
  calcularRentabilidade,
  calcularAlocacao,
} from '../services/calculos'

function Dashboard() {
  const navigate = useNavigate()

const [benchmarkSelecionado, setBenchmarkSelecionado] =
  useState('IBOV')

  const [benchmarkAberto, setBenchmarkAberto] =
  useState(false)

  const [historicoBenchmark, setHistoricoBenchmark] =
  useState<SerieHistorica | null>(null)

const [carregandoBenchmark, setCarregandoBenchmark] =
  useState(false)

  const [rentabilidadeCdi, setRentabilidadeCdi] =
  useState<number | null>(null)

  const [dataFimCdi, setDataFimCdi] =
  useState<string | null>(null)

const [posicoes, setPosicoes] = useState<Posicao[]>([])

const [proventos, setProventos] =
  useState<Provento[]>([])

const [
  proventosDisponiveis,
  setProventosDisponiveis,
] = useState<boolean | null>(null)

const [
  carregandoProventos,
  setCarregandoProventos,
] = useState(false)

const [cotacoes, setCotacoes] = useState<
  Record<string, Cotacao>
>({})

const [cotacoesCarregadas, setCotacoesCarregadas] =
  useState(false)

const [periodoGrafico, setPeriodoGrafico] = useState('12mo')

const [periodoAberto, setPeriodoAberto] =
  useState(false)

  const [modoGrafico, setModoGrafico] =
  useState<'rentabilidade' | 'patrimonio'>(
    'rentabilidade',
  )

const [historico, setHistorico] = useState<SerieHistorica[]>([])
const [carregandoHistorico, setCarregandoHistorico] = useState(false)
useEffect(() => {
  setPosicoes(carregarCarteira())
}, [])
const carregarCotacoes = useCallback(
  async (forcarAtualizacao = false) => {
    setCotacoesCarregadas(false)

    if (posicoes.length === 0) {
      setCotacoes({})
      setCotacoesCarregadas(true)
      return
    }

    try {
      const tickers = posicoes.map(
        (posicao) => posicao.ticker,
      )

      const novasCotacoes = await buscarCotacoes(
        tickers,
        forcarAtualizacao,
      )

      setCotacoes(novasCotacoes)
    } finally {
      setCotacoesCarregadas(true)
    }
  },
  [posicoes],
)

useEffect(() => {
  void carregarCotacoes()
}, [carregarCotacoes])

useEffect(() => {
  const intervalo = window.setInterval(() => {
    if (
      document.visibilityState === 'visible' &&
      posicoes.length > 0
    ) {
      void carregarCotacoes(true)
    }
  }, 5 * 60 * 1000)

  return () => {
    window.clearInterval(intervalo)
  }
}, [carregarCotacoes, posicoes.length])

useEffect(() => {
  async function carregarHistorico() {
    if (posicoes.length === 0) {
      setHistorico([])
      return
    }

    setCarregandoHistorico(true)

    try {
      const periodo =
        periodoGrafico === '12mo'
          ? '1y'
          : periodoGrafico

      const novasSeries: SerieHistorica[] = []

for (const posicao of posicoes) {
  const serie = await buscarHistoricoAtivo(
    posicao.ticker,
    periodo as '1mo' | '3mo' | '6mo' | '1y',
  )

  novasSeries.push(serie)

  await new Promise((resolve) =>
    setTimeout(resolve, 500),
  )
}

setHistorico(novasSeries)
    } catch (erro) {
      console.error(
        'Erro ao carregar histórico:',
        erro,
      )
    } finally {
      setCarregandoHistorico(false)
    }
  }

  carregarHistorico()
}, [posicoes, periodoGrafico])

useEffect(() => {
  async function carregarBenchmark() {
    setCarregandoBenchmark(true)

    try {
      if (benchmarkSelecionado === 'CDI') {
        setHistoricoBenchmark(null)
setDataFimCdi(null)
        if (
  !dataInicioComparacao ||
  !dataFimComparacao
) {
  setRentabilidadeCdi(null)
  return
}

const resposta = await fetch(
  `/api/cdi?inicio=${encodeURIComponent(
    dataInicioComparacao,
  )}&fim=${encodeURIComponent(
    dataFimComparacao,
  )}`,
)

        if (!resposta.ok) {
          setRentabilidadeCdi(null)
          return
        }

        const dados = await resposta.json()

        const ultimoDadoCdi =
  dados.length > 0
    ? dados[dados.length - 1]
    : null

if (ultimoDadoCdi?.data) {
  const [dia, mes, ano] =
    ultimoDadoCdi.data.split('/')

  setDataFimCdi(`${ano}-${mes}-${dia}`)
} else {
  setDataFimCdi(null)
}


        const acumulado = dados.reduce(
          (
            fator: number,
            item: { valor: string },
          ) => {
            const taxaDiaria =
              Number(item.valor.replace(',', '.')) / 100

            return fator * (1 + taxaDiaria)
          },
          1,
        )

        setRentabilidadeCdi(
          (acumulado - 1) * 100,
        )

        return
      }

      setRentabilidadeCdi(null)

      let tickerBenchmark: string | null = null

      if (benchmarkSelecionado === 'IBOV') {
        tickerBenchmark = '^BVSP'
      }

      if (benchmarkSelecionado === 'SP500') {
        tickerBenchmark = 'IVVB11'
      }

      if (benchmarkSelecionado === 'NASDAQ') {
        tickerBenchmark = 'NASD11'
      }

      if (!tickerBenchmark) {
        setHistoricoBenchmark(null)
        return
      }

      const periodo =
        periodoGrafico === '12mo'
          ? '1y'
          : periodoGrafico

      const serie = await buscarHistoricoAtivo(
        tickerBenchmark,
        periodo as '1mo' | '3mo' | '6mo' | '1y',
      )

      setHistoricoBenchmark(serie)
    } catch (erro) {
      console.error(
        'Erro ao carregar benchmark:',
        erro,
      )

      setHistoricoBenchmark(null)
      setRentabilidadeCdi(null)
    } finally {
      setCarregandoBenchmark(false)
    }
  }

  void carregarBenchmark()
}, [
  benchmarkSelecionado,
  periodoGrafico,
  historico,
])
const valorInvestidoTotal =
  calcularValorInvestido(posicoes)

const patrimonioTotal =
  calcularPatrimonio(posicoes, cotacoes)

const resultadoNaoRealizado =
  calcularResultadoNaoRealizado(
    valorInvestidoTotal,
    patrimonioTotal,
  )

const rentabilidade =
  calcularRentabilidade(
    valorInvestidoTotal,
    patrimonioTotal,
  )

  const patrimonioFechamentoAnterior =
  posicoes.reduce((total, posicao) => {
    const cotacao =
      cotacoes[posicao.ticker]

    if (!cotacao) {
      return total
    }

    const fatorVariacao =
      1 + cotacao.variacao / 100

    if (fatorVariacao <= 0) {
      return total
    }

    const precoFechamentoAnterior =
      cotacao.preco / fatorVariacao

    return (
      total +
      posicao.quantidade *
        precoFechamentoAnterior
    )
  }, 0)

const resultadoDia =
  patrimonioTotal -
  patrimonioFechamentoAnterior

const rentabilidadeDia =
  patrimonioFechamentoAnterior > 0
    ? (resultadoDia /
        patrimonioFechamentoAnterior) *
      100
    : 0

const cotacoesIncompletas =
  cotacoesCarregadas &&
  posicoes.some(
    (posicao) =>
      cotacoes[posicao.ticker]?.preco == null,
  )

function formatarReal(valor: number) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}
const dadosGrafico = (() => {
  const valoresPorData = new Map<number, number>()
const normalizarData = (timestamp: number) => {
  const data = new Date(timestamp * 1000)

  return Math.floor(
    Date.UTC(
      data.getUTCFullYear(),
      data.getUTCMonth(),
      data.getUTCDate(),
      12,
    ) / 1000,
  )
}
  historico.forEach((serie) => {
    const posicao = posicoes.find(
      (item) => item.ticker === serie.ticker,
    )

    if (!posicao) return

    const movimentacoes =
      posicao.movimentacoes &&
      posicao.movimentacoes.length > 0
        ? posicao.movimentacoes
        : [
            {
              id: `inicial-${posicao.ticker}`,
              tipo: 'compra' as TipoMovimentacao,
              quantidade: posicao.quantidade,
              preco: posicao.precoMedio,
              data: posicao.data,
            },
          ]

    serie.pontos.forEach((ponto) => {
      const preco =
        ponto.adjustedClose ?? ponto.close

      if (!Number.isFinite(preco)) return

      const quantidadeNaData = movimentacoes.reduce(
        (quantidade, movimentacao) => {
         const dataMovimentacao = movimentacao.data

const dataHistorica = new Date(
  ponto.date * 1000,
)
  .toISOString()
  .slice(0, 10)

if (dataMovimentacao > dataHistorica) {
  return quantidade
}

          if (movimentacao.tipo === 'compra') {
            return quantidade + movimentacao.quantidade
          }

          return quantidade - movimentacao.quantidade
        },
        0,
      )

      if (quantidadeNaData <= 0) {
        return
      }

      const dataNormalizada = normalizarData(ponto.date)

const valorAnterior =
  valoresPorData.get(dataNormalizada) ?? 0

valoresPorData.set(
  dataNormalizada,
  valorAnterior + quantidadeNaData * preco,
)
    })
  })

  const historicoCompleto = posicoes.every(
  (posicao) =>
    historico.some(
      (serie) =>
        serie.ticker === posicao.ticker &&
        serie.pontos.length > 0,
    ),
)

const ativosSemHistorico = posicoes.filter((posicao) => {
  const serie = historico.find(
    (item) => item.ticker === posicao.ticker,
  )

  return !serie || serie.pontos.length === 0
})

if (ativosSemHistorico.length > 0) {
  console.log(
    'ATIVOS SEM HISTÓRICO:',
    ativosSemHistorico.map((ativo) => ativo.ticker),
  )
}

if (!historicoCompleto) {
  return []
}

const valorAtualCarteira = posicoes.reduce(
  (total, posicao) => {
    const precoAtual =
      cotacoes[posicao.ticker]?.preco ?? posicao.precoMedio

    return total + posicao.quantidade * precoAtual
  },
  0,
)

if (
  valorAtualCarteira > 0 &&
  historicoCompleto &&
  !cotacoesIncompletas
) {
  const agora = Math.floor(Date.now() / 1000)
const hojeNormalizado = normalizarData(agora)

valoresPorData.set(
  hojeNormalizado,
  valorAtualCarteira,
)
}
  return Array.from(valoresPorData.entries())
    .sort(([dataA], [dataB]) => dataA - dataB)
    .map(([data, valor]) => ({
      data,
      valor,
    }))
})()

const dadosRentabilidadeGrafico = (() => {
  if (
    historico.length === 0 ||
    posicoes.length === 0
  ) {
    return []
  }

  const normalizarDataRentabilidade = (
    timestamp: number,
  ) => {
    const data = new Date(timestamp * 1000)

    return Math.floor(
      Date.UTC(
        data.getUTCFullYear(),
        data.getUTCMonth(),
        data.getUTCDate(),
        12,
      ) / 1000,
    )
  }

  const mapasDePrecos = new Map<
    string,
    Map<number, number>
  >()

  const datasDisponiveis = new Set<number>()

  historico.forEach((serie) => {
    const mapa = new Map<number, number>()

    serie.pontos.forEach((ponto) => {
      const preco =
        ponto.adjustedClose ?? ponto.close

      if (!Number.isFinite(preco)) {
        return
      }

      const data =
        normalizarDataRentabilidade(
          ponto.date,
        )

      mapa.set(data, preco)
      datasDisponiveis.add(data)
    })

    mapasDePrecos.set(
      serie.ticker,
      mapa,
    )
  })

  const hoje =
    normalizarDataRentabilidade(
      Math.floor(Date.now() / 1000),
    )

  const cotacoesAtuaisCompletas =
    posicoes.every(
      (posicao) =>
        cotacoes[posicao.ticker]?.preco != null,
    )

  if (cotacoesAtuaisCompletas) {
    posicoes.forEach((posicao) => {
      const precoAtual =
        cotacoes[posicao.ticker]?.preco

      if (precoAtual == null) {
        return
      }

      const mapa =
        mapasDePrecos.get(posicao.ticker)

      if (mapa) {
        mapa.set(hoje, precoAtual)
      }
    })

    datasDisponiveis.add(hoje)
  }

  const datas = Array.from(
    datasDisponiveis,
  ).sort((a, b) => a - b)

  if (datas.length === 0) {
    return []
  }

  function quantidadeNaData(
    posicao: Posicao,
    timestamp: number,
  ) {
    const data = new Date(
      timestamp * 1000,
    )
      .toISOString()
      .slice(0, 10)

    const movimentacoes =
      posicao.movimentacoes &&
      posicao.movimentacoes.length > 0
        ? posicao.movimentacoes
        : [
            {
              id: `inicial-${posicao.ticker}`,
              tipo:
                'compra' as TipoMovimentacao,
              quantidade:
                posicao.quantidade,
              preco:
                posicao.precoMedio,
              data:
                posicao.data,
            },
          ]

    return movimentacoes.reduce(
      (quantidade, movimentacao) => {
        if (movimentacao.data > data) {
          return quantidade
        }

        return movimentacao.tipo ===
          'compra'
          ? quantidade +
              movimentacao.quantidade
          : quantidade -
              movimentacao.quantidade
      },
      0,
    )
  }

  let fatorAcumulado = 1

  const resultado = [
    {
      data: datas[0],
      rentabilidade: 0,
    },
  ]

  for (
    let index = 1;
    index < datas.length;
    index += 1
  ) {
    const dataAnterior =
      datas[index - 1]

    const dataAtual =
      datas[index]

    let patrimonioBase = 0
    let resultadoMercado = 0

    posicoes.forEach((posicao) => {
      const quantidade =
        quantidadeNaData(
          posicao,
          dataAnterior,
        )

      if (quantidade <= 0) {
        return
      }

      const mapaPrecos =
        mapasDePrecos.get(
          posicao.ticker,
        )

      const precoAnterior =
        mapaPrecos?.get(dataAnterior)

      const precoAtual =
        mapaPrecos?.get(dataAtual)

      if (
        precoAnterior == null ||
        precoAtual == null
      ) {
        return
      }

      patrimonioBase +=
        quantidade * precoAnterior

      resultadoMercado +=
        quantidade *
        (precoAtual - precoAnterior)
    })

    if (patrimonioBase > 0) {
      const retornoDoDia =
        resultadoMercado /
        patrimonioBase

      fatorAcumulado *=
        1 + retornoDoDia
    }

    resultado.push({
      data: dataAtual,
      rentabilidade:
        (fatorAcumulado - 1) * 100,
    })
  }

  return resultado
})()

const ultimoPontoHistoricoBenchmark =
  historicoBenchmark?.pontos
    .filter((ponto) => {
      const preco =
        ponto.adjustedClose ?? ponto.close

      return Number.isFinite(preco)
    })
    .at(-1)

const dataFimHistoricoBenchmark =
  ultimoPontoHistoricoBenchmark
    ? new Date(
        ultimoPontoHistoricoBenchmark.date * 1000,
      )
        .toISOString()
        .slice(0, 10)
    : null

    const rentabilidadePeriodoGrafico =
  dadosRentabilidadeGrafico.length > 0
    ? dadosRentabilidadeGrafico[
        dadosRentabilidadeGrafico.length - 1
      ].rentabilidade
    : null

const dataFimBenchmarkEfetiva =
  benchmarkSelecionado === 'CDI'
    ? dataFimCdi
    : dataFimHistoricoBenchmark



const dataInicioComparacao =
  dadosGrafico.length > 0
    ? new Date(dadosGrafico[0].data * 1000)
        .toISOString()
        .slice(0, 10)
    : null

    const dataFimComparacao =
  dadosGrafico.length > 0
    ? new Date(
        dadosGrafico[dadosGrafico.length - 1].data * 1000,
      )
        .toISOString()
        .slice(0, 10)
    : null

    useEffect(() => {
  async function carregarProventos() {
    if (
      posicoes.length === 0 ||
      !dataInicioComparacao ||
      !dataFimComparacao
    ) {
      setProventos([])
      setProventosDisponiveis(null)
      return
    }

    setCarregandoProventos(true)

    try {
      const todosProventos: Provento[] = []

      for (const posicao of posicoes) {
        const resposta =
          await buscarProventosAtivo(
            posicao.ticker,
            dataInicioComparacao,
            dataFimComparacao,
          )

        if (!resposta.disponivel) {
          setProventos([])
          setProventosDisponiveis(false)
          return
        }

        todosProventos.push(
          ...resposta.proventos,
        )

        await new Promise((resolve) =>
          setTimeout(resolve, 300),
        )
      }

      setProventos(todosProventos)
      setProventosDisponiveis(true)
    } catch (erro) {
      console.error(
        'Erro ao carregar proventos:',
        erro,
      )

      setProventos([])
      setProventosDisponiveis(false)
    } finally {
      setCarregandoProventos(false)
    }
  }

  carregarProventos()
}, [
  posicoes,
  dataInicioComparacao,
  dataFimComparacao,
])
const totalProventosPeriodo = proventos.reduce(
  (total, provento) => {
    if (
      !provento.dataCom ||
      !provento.dataPagamento ||
      !dataInicioComparacao ||
      !dataFimComparacao
    ) {
      return total
    }

    if (
      provento.dataPagamento < dataInicioComparacao ||
      provento.dataPagamento > dataFimComparacao
    ) {
      return total
    }

    const posicao = posicoes.find(
      (item) => item.ticker === provento.ticker,
    )

    if (!posicao) {
      return total
    }

    const movimentacoes =
      posicao.movimentacoes &&
      posicao.movimentacoes.length > 0
        ? posicao.movimentacoes
        : [
            {
              id: `inicial-${posicao.ticker}`,
              tipo: 'compra' as TipoMovimentacao,
              quantidade: posicao.quantidade,
              preco: posicao.precoMedio,
              data: posicao.data,
            },
          ]

    const quantidadeNaDataCom =
      movimentacoes.reduce(
        (quantidade, movimentacao) => {
          if (
            movimentacao.data >
            provento.dataCom!
          ) {
            return quantidade
          }

          return movimentacao.tipo === 'compra'
            ? quantidade + movimentacao.quantidade
            : quantidade - movimentacao.quantidade
        },
        0,
      )

    if (quantidadeNaDataCom <= 0) {
      return total
    }

    return (
      total +
      quantidadeNaDataCom *
        provento.valorPorAcao
    )
  },
  0,
)
const pontosBenchmarkComparaveis =
  historicoBenchmark?.pontos.filter((ponto) => {
    const preco =
      ponto.adjustedClose ?? ponto.close

    if (!Number.isFinite(preco)) {
      return false
    }

    if (
  !dataInicioComparacao ||
  !dataFimComparacao
) {
  return true
}

const dataPonto = new Date(
  ponto.date * 1000,
)
  .toISOString()
  .slice(0, 10)

return (
  dataPonto >= dataInicioComparacao &&
  dataPonto <= dataFimComparacao
)
  }) ?? []

const primeiroPontoBenchmark =
  pontosBenchmarkComparaveis[0]

const ultimoPontoBenchmark =
  pontosBenchmarkComparaveis[
    pontosBenchmarkComparaveis.length - 1
  ]

const precoInicialBenchmark =
  primeiroPontoBenchmark
    ? primeiroPontoBenchmark.adjustedClose ??
      primeiroPontoBenchmark.close
    : null

const precoFinalBenchmark =
  ultimoPontoBenchmark
    ? ultimoPontoBenchmark.adjustedClose ??
      ultimoPontoBenchmark.close
    : null

const rentabilidadeBenchmark =
  benchmarkSelecionado === 'CDI'
    ? rentabilidadeCdi
    : precoInicialBenchmark != null &&
        precoFinalBenchmark != null &&
        precoInicialBenchmark > 0
      ? ((precoFinalBenchmark /
          precoInicialBenchmark) -
          1) *
        100
      : null

const rentabilidadeCarteiraComparavel =
  dadosRentabilidadeGrafico.length > 0
    ? dadosRentabilidadeGrafico
        .filter((ponto) => {
          if (!dataFimBenchmarkEfetiva) {
            return true
          }

          const dataPonto = new Date(
            ponto.data * 1000,
          )
            .toISOString()
            .slice(0, 10)

          return (
            dataPonto <=
            dataFimBenchmarkEfetiva
          )
        })
        .at(-1)?.rentabilidade ?? null
    : null      

const excessoBenchmark =
  rentabilidadeCarteiraComparavel != null &&
  rentabilidadeBenchmark != null
    ? rentabilidadeCarteiraComparavel -
      rentabilidadeBenchmark
    : null

const larguraGrafico = 820
const alturaGrafico = 260
const margemGrafico = 18

const dadosGraficoExibidos =
  modoGrafico === 'rentabilidade'
    ? dadosRentabilidadeGrafico.map((ponto) => ({
        data: ponto.data,
        valor: ponto.rentabilidade,
      }))
    : dadosGrafico.map((ponto) => ({
        data: ponto.data,
        valor: ponto.valor,
      }))

const dadosBenchmarkGrafico =
  modoGrafico === 'rentabilidade' &&
  benchmarkSelecionado !== 'CDI' &&
  pontosBenchmarkComparaveis.length > 1
    ? (() => {
        const primeiro =
          pontosBenchmarkComparaveis[0]

        const precoBase =
          primeiro.adjustedClose ??
          primeiro.close

        if (
          !Number.isFinite(precoBase) ||
          precoBase <= 0
        ) {
          return []
        }

        return pontosBenchmarkComparaveis
          .map((ponto) => {
            const preco =
              ponto.adjustedClose ??
              ponto.close

            if (!Number.isFinite(preco)) {
              return null
            }

            return {
              data: ponto.date,
              valor:
                (preco / precoBase - 1) *
                100,
            }
          })
          .filter(
            (
              ponto,
            ): ponto is {
              data: number
              valor: number
            } => ponto !== null,
          )
      })()
    : []

const valoresGrafico = [
  ...dadosGraficoExibidos.map(
    (ponto) => ponto.valor,
  ),
  ...dadosBenchmarkGrafico.map(
    (ponto) => ponto.valor,
  ),
]

const minimoGrafico =
  valoresGrafico.length > 0
    ? Math.min(...valoresGrafico)
    : 0

const maximoGrafico =
  valoresGrafico.length > 0
    ? Math.max(...valoresGrafico)
    : 0

const intervaloGrafico =
  Math.max(
    maximoGrafico - minimoGrafico,
    1,
  )

  const dataInicialGrafico =
  dadosGraficoExibidos[0]?.data ?? 0

const dataFinalGrafico =
  dadosGraficoExibidos[
    dadosGraficoExibidos.length - 1
  ]?.data ?? dataInicialGrafico

const intervaloDatasGrafico =
  Math.max(
    dataFinalGrafico - dataInicialGrafico,
    1,
  )

const calcularXGrafico = (
  data: number,
) =>
  margemGrafico +
  ((data - dataInicialGrafico) /
    intervaloDatasGrafico) *
    (larguraGrafico -
      margemGrafico * 2)


const pontosGrafico =
  dadosGraficoExibidos
    .map((ponto) => {
      const x =
  calcularXGrafico(ponto.data)

      const y =
        margemGrafico +
        (1 -
          (ponto.valor -
            minimoGrafico) /
            intervaloGrafico) *
          (alturaGrafico -
            margemGrafico * 2)

      return `${x},${y}`
    })
    .join(' ')

const areaGrafico =
  dadosGraficoExibidos.length > 1
    ? (() => {
        const pontos = dadosGraficoExibidos.map(
          (ponto) => {
            const x =
              calcularXGrafico(ponto.data)

            const y =
              margemGrafico +
              (1 -
                (ponto.valor -
                  minimoGrafico) /
                  intervaloGrafico) *
                (alturaGrafico -
                  margemGrafico * 2)

            return `${x},${y}`
          },
        )

        const primeiroX =
          calcularXGrafico(
            dadosGraficoExibidos[0].data,
          )

        const ultimoX =
          calcularXGrafico(
            dadosGraficoExibidos[
              dadosGraficoExibidos.length - 1
            ].data,
          )

        const baseY =
          alturaGrafico - margemGrafico

        return `M ${primeiroX},${baseY} L ${pontos.join(
          ' L ',
        )} L ${ultimoX},${baseY} Z`
      })()
    : ''

const pontosGraficoBenchmark =
  dadosBenchmarkGrafico
    .map((ponto) => {
      const x =
  calcularXGrafico(ponto.data)

      const y =
        margemGrafico +
        (1 -
          (ponto.valor -
            minimoGrafico) /
            intervaloGrafico) *
          (alturaGrafico -
            margemGrafico * 2)

      return `${x},${y}`
    })
    .join(' ')

  return (
    <main className="content">
      <header className="page-header">
        <div>
          <p className="eyebrow">VISÃO GERAL</p>
          <h1>Dashboard</h1>
          <p className="subtitle">
            Acompanhe sua carteira e seus investimentos em um só lugar.
          </p>
        </div>

        <button
  className="primary-button"
  onClick={() => navigate('/carteira')}
>
          Ver carteira
          <ArrowUpRight size={17} />
        </button>
      </header>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-top">
            <div>
              <p>Patrimônio total</p>
            <h2 className="patrimonio-total-value">
  {!cotacoesCarregadas
    ? 'Carregando...'
    : formatarReal(patrimonioTotal)}
</h2>
            </div>

            <div className="stat-icon">
              <Wallet size={21} />
            </div>
          </div>

          <span className="neutral-text">
  <p>
  {cotacoesIncompletas
    ? 'Dados parciais — cotação indisponível'
    : 'Valor de mercado da carteira'}
</p>
</span>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <div>
              <p>Rentabilidade acumulada</p>
              <h2>
  {!cotacoesCarregadas
    ? 'Carregando...'
    : cotacoesIncompletas
  ? '—'
      : `${rentabilidade >= 0 ? '+' : ''}${rentabilidade
          .toFixed(2)
          .replace('.', ',')}%`}
</h2>
            </div>

            <div className="stat-icon">
              <TrendingUp size={21} />
            </div>
          </div>

          <span
  className={
    resultadoNaoRealizado >= 0
      ? 'positive-text'
      : 'negative-text'
  }
>
  {!cotacoesCarregadas
    ? 'Carregando...'
    : cotacoesIncompletas
      ? 'Dados parciais'
      : `Resultado acumulado: ${resultadoNaoRealizado >= 0 ? '+' : ''}${formatarReal(
    resultadoNaoRealizado,
  )}`}
</span>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <div>
              <p>Proventos</p>
              <h2>
  {carregandoProventos
    ? '...'
    : proventosDisponiveis === true
      ? formatarReal(totalProventosPeriodo)
      : '—'}
</h2>
            </div>

            <div className="stat-icon">
              <CircleDollarSign size={21} />
            </div>
          </div>

          <span className="neutral-text">
  {carregandoProventos
    ? 'Carregando proventos...'
    : proventosDisponiveis === false
      ? 'Dados indisponíveis'
      : proventosDisponiveis === true
        ? 'Recebidos no período'
        : 'Aguardando dados'}
</span>
        </article>
<article className="stat-card">
  <div className="stat-top">
    <div>
      <p>Excesso vs benchmark</p>
      <h2
  className={
    excessoBenchmark == null
      ? ''
      : excessoBenchmark >= 0
        ? 'positive-text'
        : 'negative-text'
  }
>
  {carregandoBenchmark
    ? 'Carregando...'
    : excessoBenchmark == null
      ? '—'
      : `${excessoBenchmark >= 0 ? '+' : ''}${excessoBenchmark
    .toFixed(2)
    .replace('.', ',')} p.p.`}
</h2>
    </div>

    <div className="stat-icon">
      <TrendingUp size={21} />
    </div>
  </div>

  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}
  >
    <span className="neutral-text">
      vs.
    </span>

    <div className="benchmark-dropdown">
  <button
    type="button"
    className="benchmark-trigger"
    onClick={() =>
      setBenchmarkAberto((aberto) => !aberto)
    }
  >
    <span>
      {benchmarkSelecionado === 'IBOV'
        ? 'IBOV'
        : benchmarkSelecionado === 'CDI'
          ? 'CDI'
          : benchmarkSelecionado === 'SP500'
            ? 'S&P 500 (BRL)'
            : 'Nasdaq 100 (BRL)'}
    </span>

    <ChevronDown
      size={14}
      className={
        benchmarkAberto
          ? 'benchmark-chevron open'
          : 'benchmark-chevron'
      }
    />
  </button>

  {benchmarkAberto && (
    <div className="benchmark-menu">
      {[
        ['IBOV', 'IBOV'],
        ['CDI', 'CDI'],
        ['SP500', 'S&P 500 (BRL)'],
        ['NASDAQ', 'Nasdaq 100 (BRL)'],
      ].map(([valor, nome]) => (
        <button
          type="button"
          key={valor}
          className={
            benchmarkSelecionado === valor
              ? 'benchmark-option selected'
              : 'benchmark-option'
          }
          onClick={() => {
            setBenchmarkSelecionado(valor)
            setBenchmarkAberto(false)
          }}
        >
          <span>{nome}</span>

          {benchmarkSelecionado === valor && (
            <span className="benchmark-check">
              ✓
            </span>
          )}
        </button>
      ))}
    </div>
  )}
</div>
  </div>
</article>
<article className="stat-card">
  <div className="stat-top">
    <div>
      <p>Resultado do dia</p>

      <h2
        className={
          resultadoDia >= 0
            ? 'positive-text'
            : 'negative-text'
        }
      >
        {!cotacoesCarregadas
          ? 'Carregando...'
          : cotacoesIncompletas
            ? '—'
            : `${resultadoDia >= 0 ? '+' : ''}${formatarReal(
                resultadoDia,
              )}`}
      </h2>
    </div>

    <div className="stat-icon">
      <TrendingUp size={21} />
    </div>
  </div>

  <span
    className={
      rentabilidadeDia >= 0
        ? 'positive-text'
        : 'negative-text'
    }
  >
    {!cotacoesCarregadas
      ? 'Carregando...'
      : cotacoesIncompletas
        ? 'Dados parciais'
        : `${rentabilidadeDia >= 0 ? '+' : ''}${rentabilidadeDia
            .toFixed(2)
            .replace('.', ',')}% hoje`}
  </span>
</article>

      </section>

      <section className="dashboard-grid">
        <article className="panel main-panel">

<div className="performance-tabs">
  <button
    type="button"
    className={
      modoGrafico === 'rentabilidade'
        ? 'performance-tab active'
        : 'performance-tab'
    }
    onClick={() =>
      setModoGrafico('rentabilidade')
    }
  >
    Rentabilidade
  </button>

  <button
    type="button"
    className={
      modoGrafico === 'patrimonio'
        ? 'performance-tab active'
        : 'performance-tab'
    }
    onClick={() =>
      setModoGrafico('patrimonio')
    }
  >
    Patrimônio
  </button>
</div>

          <div className="panel-header">
  <div>
    <p className="panel-label">CARTEIRA</p>
    <h3>
  {modoGrafico === 'rentabilidade'
    ? 'Rentabilidade da carteira'
    : 'Evolução patrimonial'}
</h3>

{dadosGraficoExibidos.length > 0 && (
  <p className="performance-reference">
    {modoGrafico === 'rentabilidade'
      ? 'Rentabilidade'
      : 'Patrimônio'}
    {' • De '}
    {new Date(
      dadosGraficoExibidos[0].data * 1000,
    ).toLocaleDateString('pt-BR')}
    {' até '}
    {new Date(
      dadosGraficoExibidos[
        dadosGraficoExibidos.length - 1
      ].data * 1000,
    ).toLocaleDateString('pt-BR')}
  </p>
)}

    {modoGrafico === 'rentabilidade' ? (
  rentabilidadePeriodoGrafico != null && (
    <div className="period-return">
      <span>Rentabilidade no período</span>

      <strong
        className={
          rentabilidadePeriodoGrafico >= 0
            ? 'positive-text'
            : 'negative-text'
        }
      >
        {rentabilidadePeriodoGrafico >= 0 ? '+' : ''}
        {rentabilidadePeriodoGrafico
          .toFixed(2)
          .replace('.', ',')}%
      </strong>
    </div>
  )
) : dadosGrafico.length > 1 ? (
  <div className="period-return">
    <span>Variação patrimonial</span>

    <strong
      className={
        dadosGrafico[dadosGrafico.length - 1].valor -
          dadosGrafico[0].valor >=
        0
          ? 'positive-text'
          : 'negative-text'
      }
    >
      {dadosGrafico[dadosGrafico.length - 1].valor -
        dadosGrafico[0].valor >=
      0
        ? '+'
        : ''}
      {formatarReal(
        dadosGrafico[dadosGrafico.length - 1].valor -
          dadosGrafico[0].valor,
      )}
    </strong>
  </div>
) : null}

  </div>

  <div className="benchmark-dropdown">
    <button
      type="button"
      className="benchmark-trigger"
      onClick={() =>
        setPeriodoAberto((aberto) => !aberto)
      }
    >
      <span>
        {periodoGrafico === '12mo'
          ? '12 meses'
          : periodoGrafico === '6mo'
            ? '6 meses'
            : periodoGrafico === '3mo'
              ? '3 meses'
              : '1 mês'}
      </span>

      <ChevronDown
        size={14}
        className={
          periodoAberto
            ? 'benchmark-chevron open'
            : 'benchmark-chevron'
        }
      />
    </button>

    {periodoAberto && (
      <div className="benchmark-menu">
        {[
          ['12mo', '12 meses'],
          ['6mo', '6 meses'],
          ['3mo', '3 meses'],
          ['1mo', '1 mês'],
        ].map(([valor, nome]) => (
          <button
            type="button"
            key={valor}
            className={
              periodoGrafico === valor
                ? 'benchmark-option selected'
                : 'benchmark-option'
            }
            onClick={() => {
              setPeriodoGrafico(valor)
              setPeriodoAberto(false)
            }}
          >
            <span>{nome}</span>

            {periodoGrafico === valor && (
              <span className="benchmark-check">
                ✓
              </span>
            )}
          </button>
        ))}
      </div>
    )}
  </div>
</div>
  

          {carregandoHistorico ? (
  <div className="empty-chart">
    <h4>Carregando histórico...</h4>
  </div>
) : dadosGrafico.length === 1 ? (
  <div className="empty-chart">
    <ChartNoAxesCombined size={44} />

    <h4>Acompanhamento iniciado hoje</h4>

    <p>
      Patrimônio atual: {formatarReal(dadosGrafico[0].valor)}.
      O gráfico começará a mostrar a evolução após novos pregões.
    </p>
  </div>
) : dadosGrafico.length === 0 ? (
  <div className="empty-chart">
    <ChartNoAxesCombined size={44} />

    <h4>Histórico indisponível</h4>

    <p>
      Não foi possível carregar dados suficientes
      para montar o gráfico.
    </p>
  </div>
) : (
  <div className="portfolio-chart">
    <div className="portfolio-chart-summary">
  <div>
    <span>
      {modoGrafico === 'rentabilidade'
        ? 'Base do período'
        : 'Patrimônio inicial'}
    </span>

    <strong>
      {modoGrafico === 'rentabilidade'
        ? '0,00%'
        : formatarReal(
            dadosGrafico[0]?.valor ?? 0,
          )}
    </strong>
  </div>

  <div>
    <span>
      {modoGrafico === 'rentabilidade'
        ? 'Final do período'
        : 'Patrimônio final'}
    </span>

    <strong
      className={
        modoGrafico === 'rentabilidade' &&
        rentabilidadePeriodoGrafico != null
          ? rentabilidadePeriodoGrafico >= 0
            ? 'positive-text'
            : 'negative-text'
          : ''
      }
    >
      {modoGrafico === 'rentabilidade'
        ? rentabilidadePeriodoGrafico != null
          ? `${rentabilidadePeriodoGrafico >= 0 ? '+' : ''}${rentabilidadePeriodoGrafico
              .toFixed(2)
              .replace('.', ',')}%`
          : '—'
        : formatarReal(
            dadosGrafico[
              dadosGrafico.length - 1
            ]?.valor ?? 0,
          )}
    </strong>
  </div>
</div>

    <svg
      viewBox={`0 0 ${larguraGrafico} ${alturaGrafico}`}
      role="img"
      aria-label="Rentabilidade da carteira"
    >

<defs>
  <linearGradient
    id="portfolioGradient"
    x1="0"
    x2="0"
    y1="0"
    y2="1"
  >
    <stop
      offset="0%"
      stopColor="rgba(0, 214, 163, 0.28)"
    />
    <stop
      offset="100%"
      stopColor="rgba(0, 214, 163, 0)"
    />
  </linearGradient>
</defs>

{modoGrafico === 'rentabilidade' &&
  areaGrafico && (
    <path
      d={areaGrafico}
      fill="url(#portfolioGradient)"
      stroke="none"
    />
  )}

{modoGrafico === 'rentabilidade' &&
  pontosGraficoBenchmark && (
    <polyline
      points={pontosGraficoBenchmark}
      fill="none"
      stroke="#8293a8"
      strokeWidth="2"
      strokeDasharray="7 7"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.8"
    />
  )}

      <polyline
        points={pontosGrafico}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>

    <div className="portfolio-chart-dates">
      <span>
        {new Date(
  dadosRentabilidadeGrafico[0].data * 1000,
).toLocaleDateString('pt-BR')}
      </span>

      <span>
        {new Date(
  dadosRentabilidadeGrafico[
    dadosRentabilidadeGrafico.length - 1
  ].data * 1000,
).toLocaleDateString('pt-BR')}
      </span>
    </div>

{modoGrafico === 'rentabilidade' && (
  <div className="performance-legend">
    <div className="performance-legend-item">
      <span className="legend-line portfolio"></span>

      <div>
        <span>Carteira</span>

        <strong
          className={
            rentabilidadePeriodoGrafico != null &&
            rentabilidadePeriodoGrafico >= 0
              ? 'positive-text'
              : 'negative-text'
          }
        >
          {rentabilidadePeriodoGrafico != null
            ? `${rentabilidadePeriodoGrafico >= 0 ? '+' : ''}${rentabilidadePeriodoGrafico
                .toFixed(2)
                .replace('.', ',')}%`
            : '—'}
        </strong>
      </div>
    </div>

    <div className="performance-legend-item">
      <span className="legend-line benchmark"></span>

      <div>
        <span>
          {benchmarkSelecionado === 'IBOV'
            ? 'Ibovespa'
            : benchmarkSelecionado === 'CDI'
              ? 'CDI'
              : benchmarkSelecionado === 'SP500'
                ? 'S&P 500 (BRL)'
                : 'Nasdaq 100 (BRL)'}
        </span>

        <strong
          className={
            rentabilidadeBenchmark != null &&
            rentabilidadeBenchmark >= 0
              ? 'positive-text'
              : 'negative-text'
          }
        >
          {rentabilidadeBenchmark != null
            ? `${rentabilidadeBenchmark >= 0 ? '+' : ''}${rentabilidadeBenchmark
                .toFixed(2)
                .replace('.', ',')}%`
            : '—'}
        </strong>
      </div>
    </div>
  </div>
)}

  </div>
)}
        </article>

        <article className="panel side-panel">
          <div className="panel-header">
            <div>
              <p className="panel-label">ALOCAÇÃO</p>
              <h3>Por ativo</h3>
            </div>
          </div>

          {posicoes.length === 0 ? (
  <div className="allocation-empty">
    <div className="allocation-circle">
      <span>0%</span>
    </div>

    <p>Nenhum ativo cadastrado</p>
  </div>
) : !cotacoesCarregadas ? (
  <div className="allocation-empty">
    <p>Carregando alocação...</p>
  </div>
) : cotacoesIncompletas ? (
  <div className="allocation-empty">
    <p>Dados parciais — alocação indisponível</p>
  </div>
) : (
  <div className="allocation-list">
    {posicoes.map((posicao) => {
      const percentual =
  calcularAlocacao(
    posicao,
    patrimonioTotal,
    cotacoes,
  )

  const valorAtualPosicao =
  posicao.quantidade *
  (cotacoes[posicao.ticker]?.preco ??
    posicao.precoMedio)

      return (
        <div
          className="allocation-item"
          key={posicao.ticker}
        >
          <div className="allocation-info">
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    }}
  >
    <strong>{posicao.ticker}</strong>

    <span
      style={{
        fontSize: '11px',
        color: '#71869b',
      }}
    >
      {formatarReal(valorAtualPosicao)}
    </span>
  </div>

  <span>
    {percentual.toFixed(1).replace('.', ',')}%
  </span>
</div>

          <div className="allocation-bar">
            <div
              className="allocation-fill"
              style={{
                width: `${percentual}%`,
              }}
            />
          </div>
        </div>
      )
    })}
  </div>
)}
        </article>
      </section>
    </main>
  )
}

export default Dashboard