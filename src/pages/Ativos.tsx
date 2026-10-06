import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'

import {
  buscarAtivos,
  type AtivoBusca,
} from '../services/ativos'

import {
  buscarCotacoes,
  buscarHistoricoAtivo,
  type Cotacao,
  type SerieHistorica,
} from '../services/mercado'

function Ativos() {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] =
    useState<AtivoBusca[]>([])
  const [buscando, setBuscando] =
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
    const termo = busca.trim()

    if (
  ativoSelecionado &&
  termo.toUpperCase() ===
    ativoSelecionado.ticker.toUpperCase()
) {
  setResultados([])
  setBuscando(false)
  return
}

    if (!termo) {
      setResultados([])
      setBuscando(false)
      return
    }

    const timer = setTimeout(async () => {
      setBuscando(true)

      const ativos =
        await buscarAtivos(termo)

      setResultados(ativos)
      setBuscando(false)
    }, 300)

    

    return () => clearTimeout(timer)
  }, [busca, ativoSelecionado])

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
  setResultados([])
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

  return (
    <main className="content">
      <p className="eyebrow">MERCADO</p>

      <h1>Ativos</h1>

      <p className="subtitle">
        Pesquise ações e BDRs negociados na B3.
      </p>

      <section className="assets-search-panel">
        <div className="assets-search-input">
          <Search size={18} />

          <input
            type="text"
            placeholder="Busque por ticker ou empresa..."
            value={busca}
            onChange={(event) =>
              setBusca(event.target.value)
            }
          />
        </div>

        {buscando && (
          <p className="assets-search-message">
            Buscando ativos...
          </p>
        )}

        {!buscando &&
          resultados.length > 0 && (
            <div className="assets-search-results">
              {resultados.map((ativo) => (
                <button
  type="button"
  className="assets-search-result"
  key={ativo.ticker}
  onClick={() => selecionarAtivo(ativo)}
>
                  <div className="asset-symbol">
                    <img
                      src={`https://icons.brapi.dev/icons/${ativo.ticker.toUpperCase()}.svg`}
                      alt={ativo.ticker}
                      className="asset-symbol-logo"
                      onError={(event) => {
                        event.currentTarget.style.display =
                          'none'

                        const fallback =
                          event.currentTarget
                            .nextElementSibling as HTMLElement | null

                        if (fallback) {
                          fallback.style.display =
                            'flex'
                        }
                      }}
                    />

                    <span
                      className="asset-symbol-fallback"
                      style={{
                        display: 'none',
                      }}
                    >
                      {ativo.ticker.slice(0, 4)}
                    </span>
                  </div>

                  <div>
                    <strong>
                      {ativo.ticker}
                    </strong>

                    <span>
                      {ativo.nome}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

        {!buscando &&
  busca.trim() &&
  resultados.length === 0 &&
  !ativoSelecionado && (
    <p className="assets-search-message">
      Nenhum ativo encontrado.
    </p>
  )}

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