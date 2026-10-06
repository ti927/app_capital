/**
 * Monta o e-mail "Status atual de suas operações." (specs/13-email.md).
 *
 * Pura — sem banco e sem rede — para ser testada (`status-operacao.test.ts`).
 * Como no Bubble, observações e fundos vão como **prints** das tabelas da
 * tela (tirados em `capturar.ts`): anexados, e mostrados no corpo pelo `cid:`
 * de cada anexo.
 */

export const ASSUNTO = 'Status atual de suas operações.';

/**
 * O texto que já vem no campo "Email" — o conteúdo inicial do
 * `ipt.emailparacliente` no Bubble (`documentacao-completa.md:1859–1881`).
 * Com "Week Update" ligado, começa com "WEEK UPDATE". A pessoa edita à vontade
 * antes de enviar.
 */
export function textoPadrao(d: { cliente: string | null; identificador: string | null; status: string; weekUpdate: boolean }) {
  return [
    ...(d.weekUpdate ? ['WEEK UPDATE', ''] : []),
    'Olá, segue atualizações de status de suas operações:',
    '',
    `Cliente: ${d.cliente ?? ''}`,
    `Identificador: ${d.identificador ?? ''}`,
    '',
    `Status: ${d.status}`,
    '',
    'att. Lure Capital',
  ].join('\n');
}

/** Texto de usuário dentro de HTML: nada vira tag. */
export function escapar(texto: string) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Corpo do e-mail: o texto que a pessoa escreveu e, embaixo, cada imagem com o
 * título. A versão em texto puro só cita os anexos — quem lê sem HTML abre os
 * arquivos.
 */
export function montarEmailDeStatus(entrada: { texto: string; imagens: Array<{ id: string; titulo: string }> }) {
  const paragrafos = entrada.texto
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px">${escapar(p).replace(/\n/g, '<br>')}</p>`)
    .join('');

  const figuras = entrada.imagens
    .map(
      (i) =>
        `<p style="margin:20px 0 6px;font-weight:600">${escapar(i.titulo)}</p>` +
        `<img src="cid:${i.id}" alt="${escapar(i.titulo)}" width="700" style="display:block;max-width:100%;height:auto;border:1px solid #e5e5e5">`,
    )
    .join('');

  const html =
    `<div style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;font-size:14px;line-height:1.5;max-width:720px">` +
    `${paragrafos}${figuras}</div>`;

  const texto = [
    entrada.texto.trim(),
    ...(entrada.imagens.length ? ['', `Anexos: ${entrada.imagens.map((i) => i.titulo).join(', ')}.`] : []),
  ].join('\n');

  return { assunto: ASSUNTO, html, texto };
}

/** Confere o formato, não a existência. */
export function emailValido(email: string | null | undefined): email is string {
  return Boolean(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()));
}
