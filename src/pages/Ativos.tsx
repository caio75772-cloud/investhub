import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'

import {
  buscarAtivos,
  type AtivoBusca,
} from '../services/ativos'

function Ativos() {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] =
    useState<AtivoBusca[]>([])
  const [buscando, setBuscando] =
    useState(false)

  useEffect(() => {
    const termo = busca.trim()

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
  }, [busca])

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
          resultados.length === 0 && (
            <p className="assets-search-message">
              Nenhum ativo encontrado.
            </p>
          )}
      </section>
    </main>
  )
}

export default Ativos