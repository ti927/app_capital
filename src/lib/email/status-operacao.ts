/**
 * Monta o e-mail "Status atual de suas operações." (specs/13-email.md).
 *
 * Pura — sem banco e sem rede — para ser testada (`status-operacao.test.ts`).
 * No Bubble, observações e fundos iam como **imagens** das tabelas; aqui vão
 * como tabelas dentro do corpo (decisão de 05/10/2026): leem no celular, dá
 * para copiar, e não dependem de gerar PNG.
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
  /** Fundos: tabela completa (fundo, tipo, status, na mão de, alterado em). */
  fundos: boolean;
  /** Fundos (resumido): só fundo, status e na mão de — "Fundos3Colunas" do Bubble. */
  resumo: boolean;
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

const data = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date(iso)) : '-';

const TABELA = 'border-collapse:collapse;width:100%;font-size:14px;margin:8px 0 20px';
const CELULA = 'border:1px solid #d9d9d9;padding:6px 8px;text-align:left;vertical-align:top';
const CABECA = `${CELULA};background:#f2f2f2;font-weight:600`;

function tabela(cabecalho: string[], linhas: string[][]) {
  const th = cabecalho.map((c) => `<th style="${CABECA}">${escapar(c)}</th>`).join('');
  const tr = linhas
    .map((l) => `<tr>${l.map((c) => `<td style="${CELULA}">${escapar(c)}</td>`).join('')}</tr>`)
    .join('');
  return `<table style="${TABELA}"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}

const titulo = (t: string) => `<h3 style="font-size:15px;margin:16px 0 4px">${escapar(t)}</h3>`;

/**
 * Corpo do e-mail: o texto que a pessoa escreveu e, conforme as chaves, as
 * tabelas. Seção sem linha nenhuma não entra — tabela vazia só confunde.
 */
export function montarEmailDeStatus(entrada: {
  texto: string;
  cliente: string | null;
  identificador: string | null;
  observacoes: ObservacaoDoEmail[];
  etapas: EtapaDoEmail[];
  incluir: Incluir;
}) {
  const { texto, observacoes, etapas, incluir } = entrada;
  const partes: string[] = [];
  const partesTexto: string[] = [texto.trim()];

  const paragrafos = texto
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px">${escapar(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
  partes.push(paragrafos);

  if (incluir.observacoes && observacoes.length) {
    partes.push(titulo('Observações'));
    partes.push(tabela(['Data', 'Observação'], observacoes.map((o) => [data(o.criadoEm), o.texto])));
    partesTexto.push('Observações:', ...observacoes.map((o) => `- ${data(o.criadoEm)}: ${o.texto}`));
  }

  if (incluir.fundos && etapas.length) {
    partes.push(titulo('Fundos'));
    partes.push(
      tabela(
        ['Fundo', 'Tipo de operação', 'Status', 'Na mão de', 'Alterado em'],
        etapas.map((e) => [e.fundo, e.tipo ?? '-', e.status ?? '-', e.naMaoDe ?? '-', data(e.atualizadoEm)]),
      ),
    );
    partesTexto.push('Fundos:', ...etapas.map((e) => `- ${e.fundo}: ${e.status ?? '-'} (${e.naMaoDe ?? '-'})`));
  } else if (incluir.resumo && etapas.length) {
    // Com as duas chaves ligadas, a tabela completa já contém a resumida.
    partes.push(titulo('Fundos'));
    partes.push(tabela(['Fundo', 'Status', 'Na mão de'], etapas.map((e) => [e.fundo, e.status ?? '-', e.naMaoDe ?? '-'])));
    partesTexto.push('Fundos:', ...etapas.map((e) => `- ${e.fundo}: ${e.status ?? '-'}`));
  }

  const html =
    `<div style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;font-size:14px;line-height:1.5;max-width:720px">` +
    `${partes.join('')}</div>`;
  return { assunto: ASSUNTO, html, texto: partesTexto.join('\n') };
}

/** Confere o formato, não a existência. */
export function emailValido(email: string | null | undefined): email is string {
  return Boolean(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()));
}
