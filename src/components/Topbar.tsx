import {
  useEffect,
  useState,
} from 'react'

import {
  Bell,
  Search,
} from 'lucide-react'

import {
  buscarResumoMercado,
  type ItemResumoMercado,
} from '../services/resumoMercado'

function Topbar() {
  const [
    resumoMercado,
    setResumoMercado,
  ] = useState<ItemResumoMercado[]>([])

  const [
    carregando,
    setCarregando,
  ] = useState(true)

  async function carregarResumo(
    forcarAtualizacao = false,
  ) {
    try {
      const dados =
        await buscarResumoMercado(
          forcarAtualizacao,
        )

      setResumoMercado(dados)
    } catch (erro) {
      console.error(
        'Erro ao carregar resumo do mercado:',
        erro,
      )
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    void carregarResumo()

    const intervalo = window.setInterval(
      () => {
        if (
          document.visibilityState ===
          'visible'
        ) {
          void carregarResumo(true)
        }
      },
      30 * 60 * 1000,
    )

    return () => {
      window.clearInterval(intervalo)
    }
  }, [])

  function formatarValor(
    item: ItemResumoMercado,
  ) {
    if (item.formato === 'moeda') {
      return item.preco.toLocaleString(
        'pt-BR',
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
      )
    }

    return item.preco.toLocaleString(
      'pt-BR',
      {
        maximumFractionDigits: 0,
      },
    )
  }

  return (
    <header className="topbar">
      <div className="topbar-search">
        <Search size={16} />

        <input
          type="text"
          placeholder="Buscar ativo, indicador ou ferramenta"
          aria-label="Buscar no InvestHub"
        />
      </div>

      <div className="topbar-market">
        {carregando ? (
          <span className="topbar-loading">
            Carregando mercado...
          </span>
        ) : resumoMercado.length === 0 ? (
          <span className="topbar-loading">
            Mercado indisponível
          </span>
        ) : (
          resumoMercado.map((item) => (
            <div
              className="topbar-quote"
              key={item.ticker}
            >
              <span className="topbar-quote-name">
                {item.nome}
              </span>

              <strong>
                {formatarValor(item)}
              </strong>

              <span
                className={
                  item.variacao >= 0
                    ? 'topbar-quote-change positive'
                    : 'topbar-quote-change negative'
                }
              >
                {item.variacao >= 0
                  ? '+'
                  : ''}
                {item.variacao
                  .toFixed(2)
                  .replace('.', ',')}
                %
              </span>
            </div>
          ))
        )}
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="topbar-icon-button"
          aria-label="Notificações"
        >
          <Bell size={17} />
        </button>

        <div className="topbar-profile">
          <div className="topbar-avatar">
            IH
          </div>

          <div>
            <strong>InvestHub</strong>
            <span>Perfil do investidor</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Topbar