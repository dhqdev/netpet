import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularValores } from '../src/regras/valores.js';

const servico = { preco_pequeno: 5500, preco_medio: 7000, preco_grande: 9000 };

test('preço depende do porte e soma adicionais', () => {
  const v = calcularValores({ servico, porte: 'medio', adicionais: [{ preco: 2500 }], forma: 'pix' });
  assert.equal(v.subtotal, 9500);
  assert.equal(v.taxa_servico, 475);            // 5%
  assert.equal(v.total, 9975);
  assert.equal(v.comissao, 1140);               // 12% no plano Grátis
  assert.equal(v.repasse, 9500 - 1140);
});

test('Parceiro Pro paga 8% e assinante netpet+ não paga taxa', () => {
  const v = calcularValores({ servico, porte: 'grande', planoParceiro: 'pro', assinantePlus: true, forma: 'cartao' });
  assert.equal(v.taxa_servico, 0);
  assert.equal(v.comissao, 720);
  assert.equal(v.total, 9000);
});

test('pagando no local não tem taxa nem comissão', () => {
  const v = calcularValores({ servico, porte: 'pequeno', forma: 'no_local' });
  assert.deepEqual([v.taxa_servico, v.comissao, v.repasse, v.total], [0, 0, 0, 5500]);
});

test('cupom da netpet não sai do bolso do estabelecimento', () => {
  const netpet = calcularValores({ servico, porte: 'medio', cupom: { percentual: 10, estabelecimento_id: null }, forma: 'pix' });
  const loja = calcularValores({ servico, porte: 'medio', cupom: { percentual: 10, estabelecimento_id: 'x' }, forma: 'pix' });
  assert.equal(netpet.desconto, 700);
  assert.equal(netpet.repasse, 7000 - 840);     // comissão sobre o valor cheio
  assert.equal(loja.repasse, 6300 - 756);       // desconto sai da loja
});

test('leva e traz vai inteiro para o estabelecimento', () => {
  const v = calcularValores({ servico, porte: 'medio', levaETraz: 1500, forma: 'pix' });
  assert.equal(v.total, 7000 + 350 + 1500);
  assert.equal(v.repasse, 7000 - 840 + 1500);
});
