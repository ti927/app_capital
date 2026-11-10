import { toPng } from 'html-to-image';

/**
 * O "Convert To PNG" do Bubble (`documentacao-completa.md:2216–2219`): fotografa
 * os elementos da operação para anexar ao e-mail de status
 * (specs/13-email.md). Roda no navegador.
 *
 * Fotografa as **cópias** que `PrintsParaEmail` (operacoes/dialogo.tsx) monta
 * fora da área visível — já claras e com largura de computador. Nada do que a
 * pessoa vê muda durante o print: sem trocar tema, sem redimensionar, sem
 * piscar.
 *
 * - `observacoes`   → a lista de observações (`obs` no Bubble)
 * - `fundos`        → a tabela "Lista de Fornecedores" (`ops-table`)
 * - `fundos-resumo` → a mesma, em três colunas (`ops-table2`)
 */
export const ALVOS = {
  observacoes: { seletor: '[data-print="observacoes"]', titulo: 'Observações' },
  fundos: { seletor: '[data-print="fundos"]', titulo: 'Fundos' },
  'fundos-resumo': { seletor: '[data-print="fundos-resumo"]', titulo: 'Fundos (resumido)' },
  // As mesmas duas, sem a coluna "Na mão de".
  'fundos-sem-na-mao': { seletor: '[data-print="fundos-sem-na-mao"]', titulo: 'Fundos (sem "Na mão de")' },
  'fundos-resumo-sem-na-mao': {
    seletor: '[data-print="fundos-resumo-sem-na-mao"]',
    titulo: 'Fundos (resumido, sem "Na mão de")',
  },
} as const;

export type Alvo = keyof typeof ALVOS;

/** Botões (lápis, lixeira) não entram no print — no e-mail não se clica. */
function semBotoes(no: HTMLElement) {
  return !(no instanceof HTMLElement && (no.tagName === 'BUTTON' || no.classList.contains('lc-table__actions')));
}

/** PNG em base64 (sem o prefixo `data:`), ou `null` se o elemento não existe — operação sem observação ou sem fundo. */
export async function capturar(alvo: Alvo): Promise<string | null> {
  const no = document.querySelector<HTMLElement>(ALVOS[alvo].seletor);
  if (!no || !no.offsetHeight) return null;
  const url = await toPng(no, { backgroundColor: '#ffffff', pixelRatio: 2, filter: semBotoes });
  return url.slice(url.indexOf(',') + 1);
}
