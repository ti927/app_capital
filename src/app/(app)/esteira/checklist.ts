/**
 * Os 11 itens do checklist da esteira, na ordem de produção
 * (design/design-system/20-dialogos.md). Os quatro últimos são livres: o
 * rótulo é digitado pelo usuário.
 *
 * Mora aqui, e não em acoes.ts, porque aquele arquivo é `'use server'` — num
 * módulo de server actions só sobrevivem exports que sejam função assíncrona,
 * e esta constante chegava `undefined` no navegador.
 */
export const ITENS_CHECKLIST = [
  { chave: 'regulamento', rotulo: 'Regulamento:', livre: false },
  { chave: 'contrato_cessao', rotulo: 'Contrato de Cessão', livre: false },
  { chave: 'contrato_cobranca', rotulo: 'Contrato de Cobrança', livre: false },
  { chave: 'arquivos', rotulo: 'Arquivos de Remessa e Retorno:', livre: false },
  { chave: 'integralizacao_sub', rotulo: 'Integralização de cota sub:', livre: false },
  { chave: 'int_senior', rotulo: 'Integralização de cotas senior e mezo:', livre: false },
  { chave: 'inc_dc', rotulo: 'Inclusão de DC:', livre: false },
  { chave: 'cmp1', rotulo: '', livre: true },
  { chave: 'cmp2', rotulo: '', livre: true },
  { chave: 'cmp3', rotulo: '', livre: true },
  { chave: 'cmp4', rotulo: '', livre: true },
] as const;
