import { useCallback, useEffect, useState } from 'react'

import {
  Plus,
  Wallet,
  TrendingUp,
  CircleDollarSign,
  PieChart,
  X,
  Search,
  Trash2,
  Pencil,
  History,
} from 'lucide-react'
import {
  buscarCotacoes,
  type Cotacao,
} from '../services/mercado'
import {
  carregarCarteira,
  salvarCarteira,
  type Posicao,
  type Movimentacao,
  type TipoMovimentacao,
} from '../services/carteira'
import {
  calcularValorInvestido,
  calcularPatrimonio,
  calcularResultadoNaoRealizado,
  calcularRentabilidade,
  calcularValorAtualPosicao,
  calcularResultadoPosicao,
  calcularRentabilidadePosicao,
} from '../services/calculos'
import {
  buscarAtivos,
  type AtivoBusca,
} from '../services/ativos'
type Ativo = {
  ticker: string
  nome: string
}




const hoje = new Date()

const dataHoje =
  hoje.getFullYear() +
  '-' +
  String(hoje.getMonth() + 1).padStart(2, '0') +
  '-' +
  String(hoje.getDate()).padStart(2, '0')

function Carteira() {
  const [modalAberto, setModalAberto] = useState(false)
  const [etapa, setEtapa] = useState(1)
const [tickerEmEdicao, setTickerEmEdicao] = useState<string | null>(null)
const [tickerMovimentacoes, setTickerMovimentacoes] =
  useState<string | null>(null)
  const [cotacoes, setCotacoes] = useState<
  Record<string, Cotacao>
>({})
const [cotacoesCarregadas, setCotacoesCarregadas] =
  useState(false)
  const [atualizandoCotacoes, setAtualizandoCotacoes] =
  useState(false)
const [ultimaAtualizacao, setUltimaAtualizacao] =
  useState<Date | null>(null)
  const [tipoNovaMovimentacao, setTipoNovaMovimentacao] =
  useState<TipoMovimentacao | null>(null)

const [quantidadeMovimentacao, setQuantidadeMovimentacao] =
  useState('')

const [precoMovimentacao, setPrecoMovimentacao] =
  useState('')

const [dataMovimentacao, setDataMovimentacao] =
  useState(dataHoje)
  const [busca, setBusca] = useState('')
  const [ativoSelecionado, setAtivoSelecionado] =
    useState<Ativo | null>(null)
const [sugestoesAtivos, setSugestoesAtivos] =
  useState<AtivoBusca[]>([])

const [buscandoAtivos, setBuscandoAtivos] =
  useState(false)
  const [quantidade, setQuantidade] = useState('')
  const [precoMedio, setPrecoMedio] = useState('')
  const [dataCompra, setDataCompra] = useState(dataHoje)

const [posicoes, setPosicoes] = useState<Posicao[]>(
  () => carregarCarteira(),
)

useEffect(() => {
  salvarCarteira(posicoes)
}, [posicoes])
useEffect(() => {
  const termo = busca.trim()

  if (!termo) {
    setSugestoesAtivos([])
    setBuscandoAtivos(false)
    return
  }

  const timer = setTimeout(async () => {
    setBuscandoAtivos(true)

    const resultados = await buscarAtivos(termo)

    setSugestoesAtivos(resultados)
    setBuscandoAtivos(false)
  }, 300)

  return () => clearTimeout(timer)
}, [busca])
const carregarCotacoes = useCallback(
  async (forcarAtualizacao = false) => {
    setCotacoesCarregadas(false)

    if (forcarAtualizacao) {
      setAtualizandoCotacoes(true)
    }

    if (posicoes.length === 0) {
      setCotacoes({})
      setCotacoesCarregadas(true)
      setAtualizandoCotacoes(false)
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
      setUltimaAtualizacao(new Date())
    } finally {
      setCotacoesCarregadas(true)
      setAtualizandoCotacoes(false)
    }
  },
  [posicoes],
)

useEffect(() => {
  void carregarCotacoes()
}, [carregarCotacoes])

console.log('COTAÇÕES:', cotacoes)

  

const valorInvestidoTotal =
  calcularValorInvestido(posicoes)

const patrimonioAtual =
  calcularPatrimonio(posicoes, cotacoes)

const resultadoNaoRealizado =
  calcularResultadoNaoRealizado(
    valorInvestidoTotal,
    patrimonioAtual,
  )

const rentabilidadeCarteira =
  calcularRentabilidade(
    valorInvestidoTotal,
    patrimonioAtual,
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
function removerAtivo(ticker: string) {
  const confirmar = window.confirm(
    `Deseja realmente remover ${ticker} da carteira?`,
  )

  if (!confirmar) return

  setPosicoes((posicoesAtuais) =>
    posicoesAtuais.filter(
      (posicao) => posicao.ticker !== ticker,
    ),
  )
}
function editarAtivo(posicao: Posicao) {
  setTickerEmEdicao(posicao.ticker)

  setAtivoSelecionado({
    ticker: posicao.ticker,
    nome: posicao.nome,
  })

  setBusca(posicao.ticker)
  setQuantidade(String(posicao.quantidade))
  setPrecoMedio(String(posicao.precoMedio))
  setDataCompra(posicao.data)

  setEtapa(2)
  setModalAberto(true)
}
function abrirModal() {
    setTickerEmEdicao(null)
    setBusca('')
    setAtivoSelecionado(null)
    setQuantidade('')
    setPrecoMedio('')
    setDataCompra(dataHoje)
    setEtapa(1)
    setModalAberto(true)
  }

function fecharModal() {
  setModalAberto(false)
  setEtapa(1)
  setTickerEmEdicao(null)
}


  function alterarBusca(valor: string) {
    setBusca(valor.toUpperCase())
    setAtivoSelecionado(null)
  }

  function continuar() {
    if (!ativoSelecionado) return
    setEtapa(2)
  }

  function adicionarAtivo() {
    if (!ativoSelecionado) return

    const qtd = Number(quantidade.replace(',', '.'))
    const preco = Number(precoMedio.replace(',', '.'))

    if (!qtd || !preco || qtd <= 0 || preco <= 0) return
if (tickerEmEdicao) {
  setPosicoes((posicoesAtuais) =>
    posicoesAtuais.map((posicao) =>
      posicao.ticker === tickerEmEdicao
        ? {
            ...posicao,
            quantidade: qtd,
            precoMedio: preco,
            data: dataCompra,
          }
        : posicao,
    ),
  )

  fecharModal()
  return
}
    setPosicoes((posicoesAtuais) => {
      const existente = posicoesAtuais.find(
        (posicao) =>
          posicao.ticker === ativoSelecionado.ticker,
      )

      if (!existente) {
        return [
          ...posicoesAtuais,
          {
            ticker: ativoSelecionado.ticker,
            nome: ativoSelecionado.nome,
            quantidade: qtd,
            precoMedio: preco,
            data: dataCompra,
          },
        ]
      }

      const novaQuantidade =
        existente.quantidade + qtd

      const novoPrecoMedio =
        (existente.quantidade * existente.precoMedio +
          qtd * preco) /
        novaQuantidade

      return posicoesAtuais.map((posicao) =>
        posicao.ticker === ativoSelecionado.ticker
          ? {
              ...posicao,
              quantidade: novaQuantidade,
              precoMedio: novoPrecoMedio,
              data: dataCompra,
            }
          : posicao,
      )
    })

    fecharModal()
  }
function salvarMovimentacao() {
  if (!posicaoMovimentacoes || !tipoNovaMovimentacao) return

  const qtd = Number(quantidadeMovimentacao.replace(',', '.'))
  const preco = Number(precoMovimentacao.replace(',', '.'))

  if (!qtd || !preco || qtd <= 0 || preco <= 0) {
    return
  }

  if (
    tipoNovaMovimentacao === 'venda' &&
    qtd > posicaoMovimentacoes.quantidade
  ) {
    window.alert(
      `Você possui apenas ${posicaoMovimentacoes.quantidade} ações de ${posicaoMovimentacoes.ticker}.`,
    )
    return
  }

  const novaMovimentacao: Movimentacao = {
    id: `${Date.now()}`,
    tipo: tipoNovaMovimentacao,
    quantidade: qtd,
    preco,
    data: dataMovimentacao,
  }

  setPosicoes((posicoesAtuais) =>
    posicoesAtuais.map((posicao) => {
      if (posicao.ticker !== posicaoMovimentacoes.ticker) {
        return posicao
      }

      const movimentacoesAtualizadas = [
        ...(posicao.movimentacoes ?? []),
        novaMovimentacao,
      ]

      if (tipoNovaMovimentacao === 'compra') {
        const novaQuantidade = posicao.quantidade + qtd

        const novoPrecoMedio =
          (
            posicao.quantidade * posicao.precoMedio +
            qtd * preco
          ) / novaQuantidade

        return {
          ...posicao,
          quantidade: novaQuantidade,
          precoMedio: novoPrecoMedio,
          data: dataMovimentacao,
          movimentacoes: movimentacoesAtualizadas,
        }
      }

      const novaQuantidade = posicao.quantidade - qtd

      return {
        ...posicao,
        quantidade: novaQuantidade,
        precoMedio:
          novaQuantidade === 0
            ? 0
            : posicao.precoMedio,
        data: dataMovimentacao,
        movimentacoes: movimentacoesAtualizadas,
      }
    }),
  )

  setTipoNovaMovimentacao(null)
  setQuantidadeMovimentacao('')
  setPrecoMovimentacao('')
  setDataMovimentacao(dataHoje)
}
function calcularResultadosDasVendas(posicao: Posicao) {
  const movimentacoes = (posicao.movimentacoes ?? [])
    .map((movimentacao, index) => ({
      movimentacao,
      index,
    }))
    .sort((a, b) => {
      const dataA = new Date(
        `${a.movimentacao.data}T12:00:00`,
      ).getTime()

      const dataB = new Date(
        `${b.movimentacao.data}T12:00:00`,
      ).getTime()

      if (dataA !== dataB) {
        return dataA - dataB
      }

      return a.index - b.index
    })

  let quantidadeAtual = 0
  let precoMedioAtual = 0

  const resultados: Record<
    string,
    {
      resultado: number
      retornoPercentual: number
    }
  > = {}

  movimentacoes.forEach(({ movimentacao }) => {
    if (movimentacao.tipo === 'compra') {
      const custoAnterior =
        quantidadeAtual * precoMedioAtual

      const custoNovaCompra =
        movimentacao.quantidade * movimentacao.preco

      quantidadeAtual += movimentacao.quantidade

      precoMedioAtual =
        quantidadeAtual > 0
          ? (custoAnterior + custoNovaCompra) /
            quantidadeAtual
          : 0
    }

    if (movimentacao.tipo === 'venda') {
      const resultado =
        (movimentacao.preco - precoMedioAtual) *
        movimentacao.quantidade

      const retornoPercentual =
        precoMedioAtual > 0
          ? ((movimentacao.preco - precoMedioAtual) /
              precoMedioAtual) *
            100
          : 0

      resultados[movimentacao.id] = {
        resultado,
        retornoPercentual,
      }

      quantidadeAtual -= movimentacao.quantidade

      if (quantidadeAtual <= 0) {
        quantidadeAtual = 0
        precoMedioAtual = 0
      }
    }
  })

  return resultados
}
function calcularResultadoRealizado(posicao: Posicao) {
  const movimentacoes = posicao.movimentacoes ?? []

  let quantidadeAtual = 0
  let precoMedioAtual = 0
  let resultadoRealizado = 0

  movimentacoes.forEach((movimentacao) => {
    if (movimentacao.tipo === 'compra') {
      const custoAtual =
        quantidadeAtual * precoMedioAtual

      const custoNovaCompra =
        movimentacao.quantidade * movimentacao.preco

      quantidadeAtual += movimentacao.quantidade

      precoMedioAtual =
        quantidadeAtual > 0
          ? (custoAtual + custoNovaCompra) /
            quantidadeAtual
          : 0
    }

    if (movimentacao.tipo === 'venda') {
      resultadoRealizado +=
        (movimentacao.preco - precoMedioAtual) *
        movimentacao.quantidade

      quantidadeAtual -= movimentacao.quantidade

      if (quantidadeAtual === 0) {
        precoMedioAtual = 0
      }
    }
  })

  return resultadoRealizado
}
  const formularioValido =
    Number(quantidade.replace(',', '.')) > 0 &&
    Number(precoMedio.replace(',', '.')) > 0
const posicaoMovimentacoes = tickerMovimentacoes
  ? posicoes.find(
      (posicao) => posicao.ticker === tickerMovimentacoes,
    )
  : null
  const totalCompras = posicaoMovimentacoes
  ? (posicaoMovimentacoes.movimentacoes ?? [])
      .filter((movimentacao) => movimentacao.tipo === 'compra')
      .reduce(
        (total, movimentacao) =>
          total +
          movimentacao.quantidade * movimentacao.preco,
        0,
      )
  : 0

const totalVendas = posicaoMovimentacoes
  ? (posicaoMovimentacoes.movimentacoes ?? [])
      .filter((movimentacao) => movimentacao.tipo === 'venda')
      .reduce(
        (total, movimentacao) =>
          total +
          movimentacao.quantidade * movimentacao.preco,
        0,
      )
  : 0

const resultadoRealizado = posicaoMovimentacoes
  ? calcularResultadoRealizado(posicaoMovimentacoes)
  : 0
  const resultadosVendas = posicaoMovimentacoes
  ? calcularResultadosDasVendas(posicaoMovimentacoes)
  : {}
  return (
    <>
      <main className="content">
        <header className="page-header">
          <div>
            <p className="eyebrow">PORTFÓLIO</p>

            <h1>Minha Carteira</h1>

            <p className="subtitle">
              Gerencie seus investimentos e acompanhe o desempenho
              da sua carteira.
            </p>
          </div>

          <div
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  }}
>
  <span
    style={{
      fontSize: '12px',
      color: '#71869b',
    }}
  >
    Última atualização:{' '}
    {ultimaAtualizacao
      ? ultimaAtualizacao.toLocaleTimeString('pt-BR')
      : '--:--:--'}
  </span>

  <button
    type="button"
    className="primary-button"
    onClick={() => void carregarCotacoes(true)}
    disabled={
      atualizandoCotacoes ||
      posicoes.length === 0
    }
  >
    {atualizandoCotacoes
      ? 'Atualizando...'
      : '↻ Atualizar cotações'}
  </button>

  <button
    type="button"
    className="primary-button"
    onClick={abrirModal}
  >
    <Plus size={17} />
    Adicionar ativo
  </button>
</div>
        </header>

        <section className="portfolio-summary-grid">
          <article className="stat-card">
            <div className="stat-top">
              <div>
                <p>Patrimônio atual</p>
                <h2>
  {!cotacoesCarregadas
    ? 'Carregando...'
    : formatarReal(patrimonioAtual)}
</h2>
              </div>

              <div className="stat-icon">
                <Wallet size={21} />
              </div>
            </div>

            <span className="neutral-text">
  {cotacoesIncompletas
  ? 'Dados parciais — cotação indisponível'
  : 'Valor de mercado da carteira'}
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
      : `${rentabilidadeCarteira >= 0 ? '+' : ''}${rentabilidadeCarteira
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
              Total recebido
            </span>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <div>
                <p>Ativos</p>
                <h2>{posicoes.length}</h2>
              </div>

              <div className="stat-icon">
                <PieChart size={21} />
              </div>
            </div>

            <span className="neutral-text">
              Ativos na carteira
            </span>
          </article>
        </section>

        <section className="portfolio-content-grid">
          <article className="panel portfolio-assets-panel">
            <div className="panel-header">
              <div>
                <p className="panel-label">POSIÇÕES</p>
                <h3>Meus ativos</h3>
              </div>
            </div>

            {posicoes.length === 0 ? (
              <div className="empty-portfolio">
                <Wallet size={42} />

                <h4>Sua carteira está vazia</h4>

                <p>
                  Adicione seu primeiro ativo para começar a
                  acompanhar patrimônio, rentabilidade e alocação.
                </p>

                <button
                  className="primary-button"
                  onClick={abrirModal}
                >
                  <Plus size={17} />
                  Adicionar primeiro ativo
                </button>
              </div>
            ) : (
              <div className="positions-list">
                {posicoes.map((posicao) => {
                  const cotacaoAtual =
  cotacoes[posicao.ticker]?.preco
const variacaoAtual =
  cotacoes[posicao.ticker]?.variacao
const valorInvestido =
  posicao.quantidade * posicao.precoMedio

const valorAtual =
  calcularValorAtualPosicao(
    posicao,
    cotacoes,
  )

const resultadoAtivo =
  calcularResultadoPosicao(
    valorInvestido,
    valorAtual,
  )

const rentabilidadeAtivo =
  calcularRentabilidadePosicao(
    valorInvestido,
    valorAtual,
  )
                  return (
                    <div
                      className="position-row"
                      key={posicao.ticker}
                    >
                      <div className="position-main">
                        <div className="asset-symbol">
                          {posicao.ticker.slice(0, 2)}
                        </div>

                        <div>
                          <strong>{posicao.ticker}</strong>
                          <span>{posicao.nome}</span>
                        </div>
                      </div>

                      <div className="position-data">
  <div>
    <span>Quantidade</span>
    <strong>{posicao.quantidade}</strong>
  </div>

  <div>
    <span>Preço médio</span>
    <strong>
      {formatarReal(posicao.precoMedio)}
    </strong>
  </div>

  <div>
    <span>Cotação atual</span>
    <strong>
  {cotacaoAtual != null
    ? formatarReal(cotacaoAtual)
    : cotacoesCarregadas
      ? 'Cotação indisponível'
      : 'Carregando...'}
</strong>
    {variacaoAtual != null && (
  <small
    className={
      variacaoAtual >= 0
        ? 'daily-change positive'
        : 'daily-change negative'
    }
  >
    {variacaoAtual > 0 ? '+' : ''}
    {variacaoAtual.toFixed(2).replace('.', ',')}% hoje
  </small>
)}
  </div>

  <div>
    <span>Custo da posição</span>
    <strong>
      {formatarReal(valorInvestido)}
    </strong>
  </div>

  <div>
    <span>Valor atual</span>
    <strong>
      {formatarReal(valorAtual)}
    </strong>
  </div>

  <div>
    <span>Resultado</span>
    <strong
      className={
        resultadoAtivo >= 0
          ? 'result-positive'
          : 'result-negative'
      }
    >
      {resultadoAtivo > 0 ? '+' : ''}
      {formatarReal(resultadoAtivo)}
    </strong>
  </div>

  <div>
    <span>Rentabilidade</span>
    <strong
      className={
        rentabilidadeAtivo >= 0
          ? 'result-positive'
          : 'result-negative'
      }
    >
      {rentabilidadeAtivo > 0 ? '+' : ''}
      {rentabilidadeAtivo.toFixed(2).replace('.', ',')}%
    </strong>
  </div>
</div>

<div className="position-actions">

<button
  className="position-history"
  onClick={() => setTickerMovimentacoes(posicao.ticker)}
  title={`Movimentações de ${posicao.ticker}`}
>
  <History size={16} />
</button>

<button
  className="position-edit"
  onClick={() => editarAtivo(posicao)}
  title={`Editar ${posicao.ticker}`}
>
  <Pencil size={16} />
</button>
                      <button
  className="position-delete"
  onClick={() => removerAtivo(posicao.ticker)}
  title={`Excluir ${posicao.ticker}`}
>
  <Trash2 size={16} />
</button>
</div>
                    </div>
                  )
                })}
              </div>
            )}
          </article>

          <article className="panel portfolio-allocation-panel">
            <div className="panel-header">
              <div>
                <p className="panel-label">ALOCAÇÃO</p>
                <h3>Distribuição da carteira</h3>
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
                  const cotacaoAtual =
  cotacoes[posicao.ticker]?.preco ?? posicao.precoMedio

const valorAtual =
  posicao.quantidade * cotacaoAtual

const percentual =
  patrimonioAtual > 0
    ? (valorAtual / patrimonioAtual) * 100
    : 0

                  return (
                    <div
                      className="allocation-item"
                      key={posicao.ticker}
                    >
                      <div className="allocation-info">
                        <strong>
                          {posicao.ticker}
                        </strong>

                        <span>
                          {percentual.toFixed(1)}%
                        </span>
                      </div>

                      <div className="allocation-bar">
                        <div
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

      {modalAberto && (
        <div
          className="modal-overlay"
          onClick={fecharModal}
        >
          <div
            className="asset-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <p className="panel-label">
                  CARTEIRA
                </p>

                <h2>
                  {etapa === 1
                    ? 'Adicionar ativo'
                    : ativoSelecionado?.ticker}
                </h2>
              </div>

              <button
                className="modal-close"
                onClick={fecharModal}
              >
                <X size={20} />
              </button>
            </div>

            {etapa === 1 ? (
              <>
                <p className="modal-description">
                  Pesquise pelo ticker ou nome da empresa.
                </p>

                <div className="asset-search">
                  <Search size={18} />

                  <input
                    autoFocus
                    type="text"
                    placeholder="Ex: PETR4, BBAS3, Itaú..."
                    value={busca}
                    onChange={(event) =>
                      alterarBusca(
                        event.target.value,
                      )
                    }
                  />
                </div>
{buscandoAtivos && (
  <div className="asset-search-status">
    Buscando ativos...
  </div>
)}

{!buscandoAtivos && sugestoesAtivos.length > 0 && (
  <div className="asset-results">
    {sugestoesAtivos.map((ativo) => (
  <button
    key={ativo.ticker}
    type="button"
    className="asset-result"
    onClick={() => {
      setAtivoSelecionado({
        ticker: ativo.ticker,
        nome: ativo.nome,
      })

      setBusca(ativo.ticker)
      setSugestoesAtivos([])
    }}
  >
    <div className="asset-icon">
      {ativo.ticker.slice(0, 2)}
    </div>

    <div>
      <strong>{ativo.ticker}</strong>
      <span>{ativo.nome}</span>
    </div>
  </button>
))}
  </div>
)}
                

                {busca &&
  !buscandoAtivos &&
  sugestoesAtivos.length === 0 && (
                    <div className="asset-not-found">
                      Nenhum ativo encontrado.
                    </div>
                  )}

                <div className="modal-actions">
                  <button
                    className="secondary-button"
                    onClick={fecharModal}
                  >
                    Cancelar
                  </button>

                  <button
                    className="primary-button"
                    disabled={!ativoSelecionado}
                    onClick={continuar}
                  >
                    Continuar
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="modal-description">
                  Informe os dados da sua posição em{' '}
                  <strong>
                    {ativoSelecionado?.ticker}
                  </strong>
                  .
                </p>

                <div className="asset-form">
                  <label>
                    <span>Quantidade</span>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Ex: 100"
                      value={quantidade}
                      onChange={(event) =>
                        setQuantidade(
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>Preço médio</span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Ex: 32,50"
                      value={precoMedio}
                      onChange={(event) =>
                        setPrecoMedio(
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>Data da compra</span>

                    <input
                      type="date"
                      value={dataCompra}
                      onChange={(event) =>
                        setDataCompra(
                          event.target.value,
                        )
                      }
                    />
                  </label>
                </div>

                <div className="modal-actions">
                  <button
                    className="secondary-button"
                    onClick={() => setEtapa(1)}
                  >
                    Voltar
                  </button>

                  <button
  className="primary-button"
  disabled={!formularioValido}
  onClick={adicionarAtivo}
>
  {tickerEmEdicao ? 'Salvar alterações' : 'Adicionar à carteira'}
</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    {tickerMovimentacoes && posicaoMovimentacoes && (
  <div
    className="modal-overlay"
    onClick={() => setTickerMovimentacoes(null)}
  >
    <div
      className="asset-modal history-modal"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="modal-header">
        <div>
          <p className="panel-label">HISTÓRICO</p>
          <h2>{posicaoMovimentacoes.ticker}</h2>
        </div>

        <button
          className="modal-close"
          onClick={() => setTickerMovimentacoes(null)}
          aria-label="Fechar histórico"
        >
          <X size={20} />
        </button>
      </div>

      <p className="modal-description">
        {posicaoMovimentacoes.nome}
      </p>
<div className="movement-summary">
  <div>
    <span>Total de compras</span>
    <strong>{formatarReal(totalCompras)}</strong>
  </div>

  <div>
    <span>Total de vendas</span>
    <strong>{formatarReal(totalVendas)}</strong>
  </div>

  <div>
    <span>Resultado realizado</span>

    <strong
      className={
        resultadoRealizado >= 0
          ? 'result-positive'
          : 'result-negative'
      }
    >
      {resultadoRealizado > 0 ? '+' : ''}
      {formatarReal(resultadoRealizado)}
    </strong>
  </div>
</div>
      <div className="movement-list">
        {(posicaoMovimentacoes.movimentacoes ?? []).length > 0 ? (
          [...(posicaoMovimentacoes.movimentacoes ?? [])]
            .sort(
              (a, b) =>
                new Date(b.data).getTime() -
                new Date(a.data).getTime(),
            )
            .map((movimentacao) => (
              <div
                className="movement-row"
                key={movimentacao.id}
              >
                <div className="movement-left">
                  <span
                    className={`movement-type ${movimentacao.tipo}`}
                  >
                    {movimentacao.tipo === 'compra'
                      ? 'COMPRA'
                      : 'VENDA'}
                  </span>

                  <div>
                    <strong>
                      {new Date(
                        `${movimentacao.data}T12:00:00`,
                      ).toLocaleDateString('pt-BR')}
                    </strong>

                    <span>
                      {movimentacao.quantidade} ações
                    </span>
                  </div>
                </div>

                <div className="movement-values">
                  <div>
                    <span>Preço</span>
                    <strong>
                      {formatarReal(movimentacao.preco)}
                    </strong>
                  </div>

                  <div>
                    <span>Total</span>
                    <strong>
                      {formatarReal(
                        movimentacao.quantidade *
                          movimentacao.preco,
                      )}
                    </strong>
                  </div>
                  {movimentacao.tipo === 'venda' &&
  resultadosVendas[movimentacao.id] && (
    <>
      <div>
        <span>Resultado</span>

        <strong
          className={
            resultadosVendas[movimentacao.id].resultado >= 0
              ? 'result-positive'
              : 'result-negative'
          }
        >
          {resultadosVendas[movimentacao.id].resultado > 0
            ? '+'
            : ''}
          {formatarReal(
            resultadosVendas[movimentacao.id].resultado,
          )}
        </strong>
      </div>

      <div>
        <span>Retorno</span>

        <strong
          className={
            resultadosVendas[movimentacao.id]
              .retornoPercentual >= 0
              ? 'result-positive'
              : 'result-negative'
          }
        >
          {resultadosVendas[movimentacao.id]
            .retornoPercentual > 0
            ? '+'
            : ''}
          {resultadosVendas[
            movimentacao.id
          ].retornoPercentual.toFixed(2)}
          %
        </strong>
      </div>
    </>
  )}
                </div>
              </div>
            ))
        ) : (
          <div className="movement-empty">
            Nenhuma movimentação cadastrada.
          </div>
        )}
      </div>
{tipoNovaMovimentacao && (
  <div className="movement-form">
    <div className="movement-form-header">
      <strong>
        {tipoNovaMovimentacao === 'compra'
          ? 'Nova compra'
          : 'Nova venda'}
      </strong>

      <button
        className="movement-form-close"
        onClick={() => setTipoNovaMovimentacao(null)}
      >
        <X size={16} />
      </button>
    </div>

    <div className="movement-form-grid">
      <label>
        <span>Quantidade</span>
        <input
          type="number"
          min="0"
          value={quantidadeMovimentacao}
          onChange={(event) =>
            setQuantidadeMovimentacao(event.target.value)
          }
          placeholder="Ex: 50"
        />
      </label>

      <label>
        <span>Preço</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={precoMovimentacao}
          onChange={(event) =>
            setPrecoMovimentacao(event.target.value)
          }
          placeholder="Ex: 6,50"
        />
      </label>

      <label>
        <span>Data</span>
        <input
          type="date"
          value={dataMovimentacao}
          onChange={(event) =>
            setDataMovimentacao(event.target.value)
          }
        />
      </label>
    </div>
    <button
  className="primary-button movement-save-button"
  disabled={
    !quantidadeMovimentacao ||
    !precoMovimentacao
  }
  onClick={salvarMovimentacao}
>
  {tipoNovaMovimentacao === 'compra'
    ? 'Registrar compra'
    : 'Registrar venda'}
</button>
  </div>
)}
<div className="modal-actions history-actions">
  <button
    className="movement-button buy"
    onClick={() => {
      setTipoNovaMovimentacao('compra')
      setQuantidadeMovimentacao('')
      setPrecoMovimentacao('')
      setDataMovimentacao(dataHoje)
    }}
  >
    + Nova compra
  </button>

  <button
    className="movement-button sell"
    onClick={() => {
      setTipoNovaMovimentacao('venda')
      setQuantidadeMovimentacao('')
      setPrecoMovimentacao('')
      setDataMovimentacao(dataHoje)
    }}
  >
    + Nova venda
  </button>

  <button
    className="secondary-button"
    onClick={() => {
      setTipoNovaMovimentacao(null)
      setTickerMovimentacoes(null)
    }}
  >
    Fechar
  </button>
</div>
    </div>
  </div>
)}  
    </>
  )
}

export default Carteira