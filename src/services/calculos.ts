import type { Posicao } from './carteira'
import type { Cotacao } from './mercado'

export function calcularValorInvestido(
  posicoes: Posicao[],
) {
  return posicoes.reduce(
    (total, posicao) =>
      total + posicao.quantidade * posicao.precoMedio,
    0,
  )
}

export function calcularPatrimonio(
  posicoes: Posicao[],
  cotacoes: Record<string, Cotacao>,
) {
  return posicoes.reduce((total, posicao) => {
    const cotacaoAtual =
      cotacoes[posicao.ticker]?.preco ??
      posicao.precoMedio

    return total + posicao.quantidade * cotacaoAtual
  }, 0)
}

export function calcularResultadoNaoRealizado(
  valorInvestido: number,
  patrimonioAtual: number,
) {
  return patrimonioAtual - valorInvestido
}

export function calcularRentabilidade(
  valorInvestido: number,
  patrimonioAtual: number,
) {
  if (valorInvestido <= 0) {
    return 0
  }

  const resultado =
    patrimonioAtual - valorInvestido

  return (resultado / valorInvestido) * 100
}

export function calcularValorAtualPosicao(
  posicao: Posicao,
  cotacoes: Record<string, Cotacao>,
) {
  const cotacaoAtual =
    cotacoes[posicao.ticker]?.preco ??
    posicao.precoMedio

  return posicao.quantidade * cotacaoAtual
}

export function calcularAlocacao(
  posicao: Posicao,
  patrimonioTotal: number,
  cotacoes: Record<string, Cotacao>,
) {
  if (patrimonioTotal <= 0) {
    return 0
  }

  const valorAtual =
    calcularValorAtualPosicao(posicao, cotacoes)

  return (valorAtual / patrimonioTotal) * 100
}

export function calcularResultadoPosicao(
  valorInvestido: number,
  valorAtual: number,
) {
  return valorAtual - valorInvestido
}

export function calcularRentabilidadePosicao(
  valorInvestido: number,
  valorAtual: number,
) {
  if (valorInvestido <= 0) {
    return 0
  }

  const resultado =
    valorAtual - valorInvestido

  return (resultado / valorInvestido) * 100
}