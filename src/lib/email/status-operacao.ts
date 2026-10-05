/**
 * Monta o e-mail "Status atual de suas operações." (specs/13-email.md).
 *
 * Pura — sem banco e sem rede — para ser testada (`status-operacao.test.ts`).
 * Como no Bubble, observações e fundos vão como **imagens** (prints das
 * tabelas, desenhados em `imagens.tsx`): anexadas, e mostradas no corpo pelo
 * `cid:` de cada anexo.
 */

export const ASSUNTO = 'Status atual de suas operações.';

export interface EtapaDoEmail {
  fundo: string;
  tipo: string | null;
  status: string | null;
  naMaoDe: string | null;
  atualizadoEm: string | null;
}

export interface ObservacaoDoEmail {
  texto: string;
  criadoEm: string;
}

export interface Incluir {
  observacoes: boolean;
  /** Fundos: a tabela completa (`ops-table` no Bubble). */
  fundos: boolean;
  /** Fundos (resumido): fundo, status e na mão de (`ops-table2` no Bubble). */
  resumo: boolean;
}

/**
 * Etapas que o Bubble tirava da tabela — e portanto do print
 * (`documentacao-completa.md:1840–1844`).
 */
export const STATUS_FORA_DO_EMAIL = ['ja_cliente_do_fundo', 'declinado_pelo_fundo', 'declinado_pelo_cliente'];

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
