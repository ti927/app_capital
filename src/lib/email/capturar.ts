import { toPng } from 'html-to-image';

/**
 * O "Convert To PNG" do Bubble (`documentacao-completa.md:2216–2219`): fotografa
 * os elementos da tela da operação para anexar ao e-mail de status
 * (specs/13-email.md). Roda no navegador.
 *
 * - `observacoes`   → a lista de observações (`obs` no Bubble)
 * - `fundos`        → a tabela "Lista de Fornecedores" (`ops-table`)
 * - `fundos-resumo` → a cópia escondida em três colunas (`ops-table2`)
 */
export const ALVOS = {
  observacoes: { seletor: '[data-print="observacoes"]', titulo: 'Observações' },
  fundos: { seletor: '[data-print="fundos"]', titulo: 'Fundos' },
  'fundos-resumo': { seletor: '[data-print="fundos-resumo"]', titulo: 'Fundos (resumido)' },
} as const;

export type Alvo = keyof typeof ALVOS;

/** Largura de todo print, em px — a de um computador, qualquer que seja a tela. */
const LARGURA_DO_PRINT = 960;

/** Botões (lápis, lixeira) não entram no print — no e-mail não se clica. */
function semBotoes(no: HTMLElement) {
  return !(no instanceof HTMLElement && (no.tagName === 'BUTTON' || no.classList.contains('lc-table__actions')));
}

const quadro = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

/**
 * PNG em base64 (sem o prefixo `data:`) de cada alvo que existir na tela.
 * O e-mail é sempre claro: no tema escuro, troca para o claro só durante a
 * captura e volta logo depois.
 */
export async function capturar(alvos: Alvo[]): Promise<Array<{ id: Alvo; png: string }>> {
  const raiz = document.documentElement;
  const temaAntes = raiz.getAttribute('data-theme');
  // Sem transição durante a foto: a lista de observações anima a cor de fundo
  // (140ms) e, no tema escuro, o print saía no meio da troca — fundo escuro,
  // texto escuro. Ver `[data-capturando]` em globals.css.
  raiz.setAttribute('data-capturando', '');
  raiz.setAttribute('data-theme', 'light');
  await quadro();

  try {
    const imagens: Array<{ id: Alvo; png: string }> = [];
    for (const id of alvos) {
      const no = document.querySelector<HTMLElement>(ALVOS[id].seletor);
      if (!no) continue;

      // O print tem sempre a largura de um computador: no celular a tabela
      // está espremida, e sairia com "Ecoa…" e "doc…" no e-mail. Alarga o
      // elemento só durante a foto e devolve o estilo de antes.
      const estiloAntes = no.getAttribute('style');
      no.style.width = `${LARGURA_DO_PRINT}px`;
      no.style.maxWidth = 'none';
      await quadro();
      try {
        const url = await toPng(no, {
          backgroundColor: '#ffffff',
          pixelRatio: 2,
          width: no.offsetWidth,
          height: no.offsetHeight,
          filter: semBotoes,
          // A cópia resumida mora fora da tela; no print ela volta para o lugar.
          style: { position: 'static', left: '0', top: '0', margin: '0' },
        });
        imagens.push({ id, png: url.slice(url.indexOf(',') + 1) });
      } finally {
        if (estiloAntes === null) no.removeAttribute('style');
        else no.setAttribute('style', estiloAntes);
      }
    }
    return imagens;
  } finally {
    if (temaAntes === null) raiz.removeAttribute('data-theme');
    else raiz.setAttribute('data-theme', temaAntes);
    await quadro();
    raiz.removeAttribute('data-capturando');
  }
}
