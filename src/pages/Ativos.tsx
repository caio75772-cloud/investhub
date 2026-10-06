import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'

import {
  listarAtivosMercado,
  type AtivoBusca,
  type AtivoMercado,
  type FiltroTipoAtivo,
} from '../services/ativos'

import {
  buscarCotacoes,
  buscarHistoricoAtivo,
  type Cotacao,
  type SerieHistorica,
} from '../services/mercado'

function Ativos() {
  const [busca, setBusca] = useState('')

    const [ativosMercado, setAtivosMercado] =
  useState<AtivoMercado[]>([])

const [totalAtivosMercado, setTotalAtivosMercado] =
  useState(0)

const [tipoSelecionado, setTipoSelecionado] =
  useState<FiltroTipoAtivo>('acoes')

const [carregandoMercado, setCarregandoMercado] =
  useState(false)

    const [ativoSelecionado, setAtivoSelecionado] =
  useState<AtivoBusca | null>(null)

const [cotacaoSelecionada, setCotacaoSelecionada] =
  useState<Cotacao | null>(null)

const [carregandoCotacao, setCarregandoCotacao] =
  useState(false)

  const [periodoHistorico, setPeriodoHistorico] =
  useState<'1mo' | '3mo' | '6mo' | '1y'>('3mo')

const [historicoAtivo, setHistoricoAtivo] =
  useState<SerieHistorica | null>(null)

const [carregandoHistorico, setCarregandoHistorico] =
  useState(false)

  const [
  indiceHistoricoSelecionado,
  setIndiceHistoricoSelecionado,
] = useState<number | null>(null)

useEffect(() => {
  const timer = window.setTimeout(
    async () => {
      setCarregandoMercado(true)

      try {
        const resposta =
          await listarAtivosMercado(
            tipoSelecionado,
            busca,
            1,
          )

        setAtivosMercado(resposta.ativos)

        setTotalAtivosMercado(
          resposta.total,
        )
      } catch (erro) {
        console.error(
          'Erro ao carregar mercado:',
          erro,
        )

        setAtivosMercado([])
        setTotalAtivosMercado(0)
      } finally {
        setCarregandoMercado(false)
      }
    },
    300,
  )

  return () => {
    window.clearTimeout(timer)
  }
}, [tipoSelecionado, busca])

  

  useEffect(() => {
  async function carregarHistorico() {
    if (!ativoSelecionado) {
      setHistoricoAtivo(null)
      return
    }

    setCarregandoHistorico(true)

    setIndiceHistoricoSelecionado(null)

    try {
      const historico =
        await buscarHistoricoAtivo(
          ativoSelecionado.ticker,
          periodoHistorico,
        )

      setHistoricoAtivo(historico)
    } finally {
      setCarregandoHistorico(false)
    }
  }

  void carregarHistorico()
}, [ativoSelecionado, periodoHistorico])

  async function selecionarAtivo(ativo: AtivoBusca) {
  setAtivoSelecionado(ativo)
  setCotacaoSelecionada(null)
  setCarregandoCotacao(true)

  const cotacoes =
    await buscarCotacoes([ativo.ticker])

  setCotacaoSelecionada(
    cotacoes[ativo.ticker.toUpperCase()] ?? null,
  )

  setCarregandoCotacao(false)
  setBusca(ativo.ticker)
}

const pontosHistorico =
  historicoAtivo?.pontos
    .map((ponto) => ({
      data: ponto.date,
      valor:
        ponto.adjustedClose ??
        ponto.close,
    }))
    .filter((ponto) =>
      Number.isFinite(ponto.valor),
    ) ?? []

const larguraGraficoAtivo = 700
const alturaGraficoAtivo = 220
const margemGraficoAtivo = 12

const valoresHistorico =
  pontosHistorico.map(
    (ponto) => ponto.valor,
  )

const minimoHistorico =
  valoresHistorico.length > 0
    ? Math.min(...valoresHistorico)
    : 0

const maximoHistorico =
  valoresHistorico.length > 0
    ? Math.max(...valoresHistorico)
    : 0

const intervaloHistorico =
  Math.max(
    maximoHistorico - minimoHistorico,
    1,
  )

const divisorHistorico =
  Math.max(
    pontosHistorico.length - 1,
    1,
  )

const pontosLinhaHistorico =
  pontosHistorico
    .map((ponto, index) => {
      const x =
        margemGraficoAtivo +
        (index / divisorHistorico) *
          (larguraGraficoAtivo -
            margemGraficoAtivo * 2)

      const y =
        margemGraficoAtivo +
        (1 -
          (ponto.valor -
            minimoHistorico) /
            intervaloHistorico) *
          (alturaGraficoAtivo -
            margemGraficoAtivo * 2)

      return `${x},${y}`
    })
    .join(' ')

    const dataInicioHistorico =
  pontosHistorico.length > 0
    ? new Date(
        pontosHistorico[0].data * 1000,
      ).toLocaleDateString('pt-BR')
    : ''

const dataFimHistorico =
  pontosHistorico.length > 0
    ? new Date(
        pontosHistorico[
          pontosHistorico.length - 1
        ].data * 1000,
      ).toLocaleDateString('pt-BR')
    : ''

    const pontoHistoricoSelecionado =
  indiceHistoricoSelecionado != null
    ? pontosHistorico[indiceHistoricoSelecionado]
    : null

const xHistoricoSelecionado =
  indiceHistoricoSelecionado != null
    ? margemGraficoAtivo +
      (indiceHistoricoSelecionado /
        divisorHistorico) *
        (larguraGraficoAtivo -
          margemGraficoAtivo * 2)
    : null

const yHistoricoSelecionado =
  pontoHistoricoSelecionado
    ? margemGraficoAtivo +
      (1 -
        (pontoHistoricoSelecionado.valor -
          minimoHistorico) /
          intervaloHistorico) *
        (alturaGraficoAtivo -
          margemGraficoAtivo * 2)
    : null

    const abasMercado: {
  valor: FiltroTipoAtivo
  nome: string
}[] = [
  { valor: 'todos', nome: 'Todos' },
  { valor: 'acoes', nome: 'Ações' },
  { valor: 'fiis', nome: 'FIIs' },
  { valor: 'bdrs', nome: 'BDRs' },
  { valor: 'etfs', nome: 'ETFs' },
]

function formatarValorMercado(
  valor: number | null,
) {
  if (valor == null) {
    return '—'
  }

  if (valor >= 1_000_000_000_000) {
    return `R$ ${(valor / 1_000_000_000_000)
      .toFixed(1)
      .replace('.', ',')} tri`
  }

  if (valor >= 1_000_000_000) {
    return `R$ ${(valor / 1_000_000_000)
      .toFixed(1)
      .replace('.', ',')} bi`
  }

  if (valor >= 1_000_000) {
    return `R$ ${(valor / 1_000_000)
      .toFixed(1)
      .replace('.', ',')} mi`
  }

  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

  return (
    <main className="content">
      <div className="market-page-header">
  <p className="eyebrow">ATIVOS</p>

  <h1>Explore o mercado</h1>

  <p className="subtitle">
    Pesquise ativos, compare indicadores e
    encontre oportunidades para analisar.
  </p>
</div>

<section className="market-explorer">
  <div className="market-search">
    <Search size={20} />

    <input
      type="text"
      value={busca}
      placeholder="Busque por ticker ou nome da empresa..."
      onChange={(event) =>
        setBusca(event.target.value)
      }
    />
  </div>

  <div className="market-toolbar">
    <div className="market-tabs">
      {abasMercado.map((aba) => (
        <button
          type="button"
          key={aba.valor}
          className={
            tipoSelecionado === aba.valor
              ? 'active'
              : ''
          }
          onClick={() =>
            setTipoSelecionado(aba.valor)
          }
        >
          {aba.nome}
        </button>
      ))}
    </div>

    <button
      type="button"
      className="market-filter-button"
    >
      Filtros
    </button>
  </div>

  <div className="market-results-header">
    <span>
      {carregandoMercado
        ? 'Carregando ativos...'
        : `${totalAtivosMercado} ativos encontrados`}
    </span>

    <small>
      Ordenado por valor de mercado
    </small>
  </div>

  <div className="market-table">
    <div className="market-table-head">
      <span>ATIVO</span>
      <span>PREÇO</span>
      <span>VARIAÇÃO</span>
      <span>P/L</span>
      <span>P/VP</span>
      <span>DY</span>
      <span>ROE</span>
      <span>VALOR MERCADO</span>
    </div>

    {carregandoMercado ? (
      <div className="market-table-empty">
        Carregando mercado...
      </div>
    ) : ativosMercado.length === 0 ? (
      <div className="market-table-empty">
        Nenhum ativo encontrado.
      </div>
    ) : (
      ativosMercado.map((ativo) => (
        <button
          type="button"
          className="market-table-row"
          key={ativo.ticker}
          onClick={() =>
            selecionarAtivo({
              ticker: ativo.ticker,
              nome: ativo.nome,
              tipo:
                ativo.tipo ?? undefined,
            })
          }
        >
          <div className="market-asset">
            <div className="market-asset-logo">
              <img
                src={
                  ativo.logoUrl ??
                  `https://icons.brapi.dev/icons/${ativo.ticker}.svg`
                }
                alt={ativo.ticker}
                onError={(event) => {
                  event.currentTarget.style.display =
                    'none'
                }}
              />
            </div>

            <div>
              <strong>{ativo.ticker}</strong>
              <span>{ativo.nome}</span>
            </div>
          </div>

          <strong>
            {ativo.preco != null
              ? ativo.preco.toLocaleString(
                  'pt-BR',
                  {
                    style: 'currency',
                    currency: 'BRL',
                  },
                )
              : '—'}
          </strong>

          <strong
            className={
              ativo.variacao == null
                ? ''
                : ativo.variacao >= 0
                  ? 'positive-text'
                  : 'negative-text'
            }
          >
            {ativo.variacao == null
              ? '—'
              : `${ativo.variacao >= 0 ? '↗ +' : '↘ '}${ativo.variacao
                  .toFixed(2)
                  .replace('.', ',')}%`}
          </strong>

          <span>—</span>
          <span>—</span>
          <span>—</span>
          <span>—</span>

          <span>
            {formatarValorMercado(
              ativo.valorMercado,
            )}
          </span>
        </button>
      ))
    )}
  </div>
</section>

{ativoSelecionado && (
  <section className="asset-detail-card">
    <div className="asset-detail-header">
      <div className="asset-symbol asset-detail-logo">
        <img
          src={`https://icons.brapi.dev/icons/${ativoSelecionado.ticker.toUpperCase()}.svg`}
          alt={ativoSelecionado.ticker}
          className="asset-symbol-logo"
        />
      </div>

      <div>
        <h2>{ativoSelecionado.ticker}</h2>
        <p>{ativoSelecionado.nome}</p>
      </div>
    </div>

    {carregandoCotacao ? (
      <p className="assets-search-message">
        Carregando cotação...
      </p>
    ) : cotacaoSelecionada ? (
      <div className="asset-detail-data">
        <div>
          <span>Cotação atual</span>
          <strong>
            {cotacaoSelecionada.preco.toLocaleString(
              'pt-BR',
              {
                style: 'currency',
                currency: 'BRL',
              },
            )}
          </strong>
        </div>

        <div>
          <span>Variação do dia</span>

          <strong
            className={
              cotacaoSelecionada.variacao >= 0
                ? 'positive-text'
                : 'negative-text'
            }
          >
            {cotacaoSelecionada.variacao >= 0
              ? '+'
              : ''}
            {cotacaoSelecionada.variacao
              .toFixed(2)
              .replace('.', ',')}
            %
          </strong>
        </div>
      </div>
    ) : (
      <p className="assets-search-message">
        Cotação indisponível.
      </p>
    )}

<div className="asset-history">
  <div className="asset-history-header">
    <div>
      <h3>Evolução do preço</h3>
      <span>Histórico do ativo</span>
    </div>

    <select
      value={periodoHistorico}
      onChange={(event) =>
        setPeriodoHistorico(
          event.target.value as
            | '1mo'
            | '3mo'
            | '6mo'
            | '1y',
        )
      }
    >
      <option value="1mo">1 mês</option>
      <option value="3mo">3 meses</option>
      <option value="6mo">6 meses</option>
      <option value="1y">1 ano</option>
    </select>
  </div>

  {carregandoHistorico ? (
    <p className="assets-search-message">
      Carregando histórico...
    </p>
  ) : pontosHistorico.length > 1 ? (
    <div className="asset-history-chart">
  <svg
  viewBox={`0 0 ${larguraGraficoAtivo} ${alturaGraficoAtivo}`}
  role="img"
  aria-label={`Histórico de ${ativoSelecionado?.ticker}`}
  onMouseMove={(event) => {
    if (pontosHistorico.length === 0) {
      return
    }

    const rect =
      event.currentTarget.getBoundingClientRect()

    const posicaoX =
      event.clientX - rect.left

    const percentualX =
      posicaoX / rect.width

    const indice = Math.round(
      percentualX *
        (pontosHistorico.length - 1),
    )

    setIndiceHistoricoSelecionado(
      Math.max(
        0,
        Math.min(
          pontosHistorico.length - 1,
          indice,
        ),
      ),
    )
  }}
  onMouseLeave={() =>
    setIndiceHistoricoSelecionado(null)
  }
>
    <polyline
      points={pontosLinhaHistorico}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

{xHistoricoSelecionado != null &&
  yHistoricoSelecionado != null && (
    <>
      <line
        x1={xHistoricoSelecionado}
        x2={xHistoricoSelecionado}
        y1={margemGraficoAtivo}
        y2={
          alturaGraficoAtivo -
          margemGraficoAtivo
        }
        className="asset-history-guide"
      />

      <circle
        cx={xHistoricoSelecionado}
        cy={yHistoricoSelecionado}
        r="5"
        className="asset-history-point"
      />
    </>
  )}

  </svg>

  {pontoHistoricoSelecionado &&
  xHistoricoSelecionado != null &&
  yHistoricoSelecionado != null && (
    <div
      className="asset-history-tooltip"
      style={{
        left: `${Math.min(
          88,
          Math.max(
            12,
            (xHistoricoSelecionado /
              larguraGraficoAtivo) *
              100,
          ),
        )}%`,

        top: `${Math.max(
          12,
          (yHistoricoSelecionado /
            alturaGraficoAtivo) *
            100,
        )}%`,
      }}
    >
      <strong>
        {new Date(
          pontoHistoricoSelecionado.data *
            1000,
        ).toLocaleDateString('pt-BR')}
      </strong>

      <div>
        <span>Cotação</span>

        <b>
          {pontoHistoricoSelecionado.valor.toLocaleString(
            'pt-BR',
            {
              style: 'currency',
              currency: 'BRL',
            },
          )}
        </b>
      </div>
    </div>
  )}

  <div className="asset-history-dates">
    <span>{dataInicioHistorico}</span>
    <span>{dataFimHistorico}</span>
  </div>
</div>
  ) : (
    <p className="assets-search-message">
      Histórico indisponível.
    </p>
  )}
</div>
    
  </section>
)}

    </main>
  )
}

export default Ativos