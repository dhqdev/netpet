// Cálculo dos valores de um agendamento. Função pura (sem banco), fácil de testar.
// Tudo em centavos.
import { taxas } from '../config.js';

const pct = (valor, p) => Math.round((valor * p) / 100);

export function precoPorPorte(servico, porte) {
  return { pequeno: servico.preco_pequeno, medio: servico.preco_medio, grande: servico.preco_grande }[porte];
}

/**
 * @param servico      linha de servicos
 * @param porte        porte do pet
 * @param adicionais   [{ preco }]
 * @param cupom        linha de cupons ou null (já validado)
 * @param levaETraz    taxa de leva e traz (0 se não pediu)
 * @param assinantePlus tutor com netpet+ não paga taxa de serviço
 * @param planoParceiro 'gratis' | 'pro'
 * @param forma        'pix' | 'cartao' | 'no_local'
 */
export function calcularValores({ servico, porte, adicionais = [], cupom = null, levaETraz = 0, assinantePlus = false, planoParceiro = 'gratis', forma }) {
  const subtotal = precoPorPorte(servico, porte) + adicionais.reduce((s, a) => s + a.preco, 0);

  let desconto = 0;
  if (cupom) desconto = cupom.percentual ? pct(subtotal, cupom.percentual) : Math.min(cupom.valor_fixo, subtotal);

  const pagoNoApp = forma !== 'no_local';
  // A taxa de serviço só existe quando o pagamento passa pelo app.
  const taxaServico = pagoNoApp && !assinantePlus ? pct(subtotal - desconto, taxas.servicoTutor) : 0;
  const total = subtotal - desconto + levaETraz + taxaServico;

  // Quem banca o desconto: cupom do estabelecimento sai do repasse dele;
  // cupom da netpet (sem estabelecimento) sai da netpet.
  const descontoDoEstab = cupom?.estabelecimento_id ? desconto : 0;
  const baseEstab = subtotal - descontoDoEstab;
  const comissao = pagoNoApp ? pct(baseEstab, planoParceiro === 'pro' ? taxas.comissaoPro : taxas.comissaoGratis) : 0;
  // No local o tutor paga direto ao estabelecimento; não há repasse pelo app.
  const repasse = pagoNoApp ? baseEstab - comissao + levaETraz : 0;

  return { subtotal, desconto, taxa_leva_traz: levaETraz, taxa_servico: taxaServico, total, comissao, repasse };
}
