import { useEffect, useState } from 'react'

import {
  TrendingUp,
  CircleDollarSign,
  Wallet,
  ArrowUpRight,
  ChartNoAxesCombined,
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
const [posicoes, setPosicoes] = useState<Posicao[]>([])

const [cotacoes, setCotacoes] = useState<
  Record<string, Cotacao>
>({})

const [cotacoesCarregadas, setCotacoesCarregadas] =
  useState(false)

const [periodoGrafico, setPeriodoGrafico] = useState('12mo')
const [historico, setHistorico] = useState<SerieHistorica[]>([])
const [carregandoHistorico, setCarregandoHistorico] = useState(false)
useEffect(() => {
  setPosicoes(carregarCarteira())
}, [])
useEffect(() => {
  async function carregarCotacoes() {
    setCotacoesCarregadas(false)

    if (posicoes.length === 0) {
      setCotacoes({})
      setCotacoesCarregadas(true)
      return
    }

    const tickers = posicoes.map(
      (posicao) => posicao.ticker,
    )

    const novasCotacoes =
      await buscarCotacoes(tickers)

    setCotacoes(novasCotacoes)
    setCotacoesCarregadas(true)
  }

  carregarCotacoes()
}, [posicoes])

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

      const novasSeries = await Promise.all(
        posicoes.map((posicao) =>
          buscarHistoricoAtivo(
            posicao.ticker,
            periodo as '1mo' | '3mo' | '6mo' | '1y',
          ),
        ),
      )

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
const valorAtualCarteira = posicoes.reduce(
  (total, posicao) => {
    const precoAtual =
      cotacoes[posicao.ticker]?.preco ?? posicao.precoMedio

    return total + posicao.quantidade * precoAtual
  },
  0,
)

if (valorAtualCarteira > 0) {
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

        <button className="primary-button">
          Ver carteira
          <ArrowUpRight size={17} />
        </button>
      </header>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-top">
            <div>
              <p>Patrimônio total</p>
            <h2>
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
      ? 'Dados parciais'
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
      </section>

      <section className="dashboard-grid">
        <article className="panel main-panel">
          <div className="panel-header">
            <div>
              <p className="panel-label">CARTEIRA</p>
              <h3>Evolução patrimonial</h3>
            </div>

            <select
  value={periodoGrafico}
  onChange={(event) => setPeriodoGrafico(event.target.value)}
>
  <option value="12mo">12 meses</option>
  <option value="6mo">6 meses</option>
  <option value="3mo">3 meses</option>
  <option value="1mo">1 mês</option>
</select>
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

      return (
        <div
          className="allocation-item"
          key={posicao.ticker}
        >
          <div className="allocation-info">
            <strong>{posicao.ticker}</strong>

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