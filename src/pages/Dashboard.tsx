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

const [posicoes, setPosicoes] = useState<Posicao[]>([])

const [cotacoes, setCotacoes] = useState<
  Record<string, Cotacao>
>({})

const [cotacoesCarregadas, setCotacoesCarregadas] =
  useState(false)

const [periodoGrafico, setPeriodoGrafico] = useState('12mo')

const [periodoAberto, setPeriodoAberto] =
  useState(false)

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

        const hoje = new Date()
        const inicio = new Date(hoje)

        if (periodoGrafico === '1mo') {
          inicio.setMonth(inicio.getMonth() - 1)
        } else if (periodoGrafico === '3mo') {
          inicio.setMonth(inicio.getMonth() - 3)
        } else if (periodoGrafico === '6mo') {
          inicio.setMonth(inicio.getMonth() - 6)
        } else {
          inicio.setFullYear(inicio.getFullYear() - 1)
        }

        const formatarData = (data: Date) =>
          [
            data.getFullYear(),
            String(data.getMonth() + 1).padStart(2, '0'),
            String(data.getDate()).padStart(2, '0'),
          ].join('-')

        const resposta = await fetch(
          `/api/cdi?inicio=${formatarData(
            inicio,
          )}&fim=${formatarData(hoje)}`,
        )

        if (!resposta.ok) {
          setRentabilidadeCdi(null)
          return
        }

        const dados = await resposta.json()

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
}, [benchmarkSelecionado, periodoGrafico])

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
  historicoCompleto
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

const rentabilidadePeriodoCarteira = (() => {
  if (
    dadosGrafico.length < 2 ||
    dadosGrafico[0].valor <= 0
  ) {
    return null
  }

  const inicioPeriodo = dadosGrafico[0].data

  const fimPeriodo =
    dadosGrafico[dadosGrafico.length - 1].data

  const duracaoPeriodo =
    Math.max(fimPeriodo - inicioPeriodo, 1)

  let fluxoLiquido = 0
  let fluxoPonderado = 0

  posicoes.forEach((posicao) => {
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

    movimentacoes.forEach((movimentacao) => {
      const dataMovimentacao = Math.floor(
        new Date(
          `${movimentacao.data}T12:00:00Z`,
        ).getTime() / 1000,
      )

      if (
        dataMovimentacao <= inicioPeriodo ||
        dataMovimentacao > fimPeriodo
      ) {
        return
      }

      const valorMovimentacao =
        movimentacao.quantidade *
        movimentacao.preco

      const fluxo =
        movimentacao.tipo === 'compra'
          ? valorMovimentacao
          : -valorMovimentacao

      const peso =
        (fimPeriodo - dataMovimentacao) /
        duracaoPeriodo

      fluxoLiquido += fluxo
      fluxoPonderado += fluxo * peso
    })
  })

  const valorInicial =
    dadosGrafico[0].valor

  const valorFinal =
    dadosGrafico[dadosGrafico.length - 1].valor

  const baseAjustada =
    valorInicial + fluxoPonderado

  if (baseAjustada <= 0) {
    return null
  }

  return (
    ((valorFinal -
      valorInicial -
      fluxoLiquido) /
      baseAjustada) *
    100
  )
})()

const dataInicioComparacao =
  dadosGrafico.length > 0
    ? new Date(dadosGrafico[0].data * 1000)
        .toISOString()
        .slice(0, 10)
    : null

const pontosBenchmarkComparaveis =
  historicoBenchmark?.pontos.filter((ponto) => {
    const preco =
      ponto.adjustedClose ?? ponto.close

    if (!Number.isFinite(preco)) {
      return false
    }

    if (!dataInicioComparacao) {
      return true
    }

    const dataPonto = new Date(
      ponto.date * 1000,
    )
      .toISOString()
      .slice(0, 10)

    return dataPonto >= dataInicioComparacao
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

const excessoBenchmark =
  rentabilidadePeriodoCarteira != null &&
  rentabilidadeBenchmark != null
    ? ((1 + rentabilidadePeriodoCarteira / 100) /
        (1 + rentabilidadeBenchmark / 100) -
        1) *
      100
    : null

const larguraGrafico = 820
const alturaGrafico = 260
const margemGrafico = 18

const valoresGrafico =
  dadosGrafico.map((ponto) => ponto.valor)

const minimoGrafico =
  valoresGrafico.length > 0
    ? Math.min(...valoresGrafico)
    : 0

const maximoGrafico =
  valoresGrafico.length > 0
    ? Math.max(...valoresGrafico)
    : 0

const intervaloGrafico =
  Math.max(maximoGrafico - minimoGrafico, 1)

const divisorGrafico =
  Math.max(dadosGrafico.length - 1, 1)

const pontosGrafico = dadosGrafico
  .map((ponto, index) => {
    const x =
      margemGrafico +
      (index / divisorGrafico) *
        (larguraGrafico - margemGrafico * 2)

    const y =
      margemGrafico +
      (1 -
        (ponto.valor - minimoGrafico) /
          intervaloGrafico) *
        (alturaGrafico - margemGrafico * 2)

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
            <h2 style={{ whiteSpace: "nowrap", fontSize: "clamp(1.45rem, 1.55vw, 2rem)" }}>
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
              <p>Rentabilidade</p>
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
      : `${resultadoNaoRealizado >= 0 ? '+' : ''}${formatarReal(
          resultadoNaoRealizado,
        )} não realizado`}
</span>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <div>
              <p>Proventos</p>
              <h2>R$ 0,00</h2>
            </div>

            <div className="stat-icon">
              <CircleDollarSign size={21} />
            </div>
          </div>

          <span className="neutral-text">
            Recebidos no período
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
          .replace('.', ',')}%`}
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
      <p>Ativos</p>
      <h2>{posicoes.length}</h2>
    </div>

    <div className="stat-icon">
      <Wallet size={21} />
    </div>
  </div>

  <span className="neutral-text">
    Ativos na carteira
  </span>
</article>

      </section>

      <section className="dashboard-grid">
        <article className="panel main-panel">
          <div className="panel-header">
  <div>
    <p className="panel-label">CARTEIRA</p>
    <h3>Evolução patrimonial</h3>
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
        <span>Início do período</span>
        <strong>
          {formatarReal(dadosGrafico[0].valor)}
        </strong>
      </div>

      <div>
        <span>Final do período</span>
        <strong>
          {formatarReal(
            dadosGrafico[dadosGrafico.length - 1].valor,
          )}
        </strong>
      </div>
    </div>

    <svg
      viewBox={`0 0 ${larguraGrafico} ${alturaGrafico}`}
      role="img"
      aria-label="Evolução patrimonial"
    >
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
          dadosGrafico[0].data * 1000,
        ).toLocaleDateString('pt-BR')}
      </span>

      <span>
        {new Date(
          dadosGrafico[
            dadosGrafico.length - 1
          ].data * 1000,
        ).toLocaleDateString('pt-BR')}
      </span>
    </div>
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