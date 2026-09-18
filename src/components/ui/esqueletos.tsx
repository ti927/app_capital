import type { CSSProperties } from 'react';

/* ---------------------------------------------------------------------------
   Esqueletos de carregamento.

   Regra: o esqueleto tem a **geometria da tela que vem**, não um desenho
   genérico. Ele reusa as mesmas classes do conteúdo real (`.tela__topo`,
   `.lista`, `.lc-table`, `.funil__quadro`), então quando o dado chega a troca
   é quase imperceptível — nada salta de lugar.

   Cada peça é um componente de servidor: entra no `loading.tsx` da rota e some
   sozinha quando a página termina de renderizar.

   Toda classe emprestada do conteúdo vem acompanhada de um modificador
   `--esqueleto`. Sem isso o esqueleto é indistinguível do conteúdo para quem
   espera por seletor: o QA dava `waitForSelector('.lista__item')` por
   satisfeito com a barra cinza e fotografava o esqueleto no lugar da lista.
   Descoberto abrindo as capturas, não no teste — que passou.
   --------------------------------------------------------------------------- */

/** Barra cinza de uma medida. `w` aceita qualquer unidade CSS. */
function Barra({ w, h, style }: { w: string; h?: number; style?: CSSProperties }) {
  return <span className="lc-skel" style={{ width: w, height: h ?? 12, ...style }} />;
}

/** Envelope: diz ao leitor de tela que a região está carregando. */
export function Esqueletos({ children }: { children: React.ReactNode }) {
  return (
    <div className="esq" role="status" aria-busy="true" aria-live="polite">
      <span className="lc-visualmente-oculto">Carregando…</span>
      {children}
    </div>
  );
}

/** Topo com busca à esquerda e botões à direita — `TopoDaTela` com o conteúdo cinza. */
export function EsqueletoTopo({ titulo, botoes = 1 }: { titulo?: boolean; botoes?: number }) {
  return (
    <div className="tela__topo">
      {titulo ? <Barra w="220px" h={18} /> : <Barra w="240px" h={32} style={{ borderRadius: 8 }} />}
      <div className="tela__acoes">
        {Array.from({ length: botoes }, (_, i) => (
          <Barra key={i} w={i === botoes - 1 ? '132px' : '104px'} h={34} style={{ borderRadius: 8 }} />
        ))}
      </div>
    </div>
  );
}

/** Fita de abas, na mesma altura da de verdade. */
export function EsqueletoAbas({ quantas = 2 }: { quantas?: number }) {
  return (
    <div className="abas">
      {Array.from({ length: quantas }, (_, i) => (
        <span key={i} className="esq__aba">
          <Barra w={`${72 + (i % 3) * 22}px`} />
        </span>
      ))}
    </div>
  );
}

/** Lista de itens — clientes, operações, esteira. */
export function EsqueletoLista({ linhas = 8 }: { linhas?: number }) {
  return (
    <ul className="lista">
      {Array.from({ length: linhas }, (_, i) => (
        <li key={i} className="lista__item lista__item--esqueleto">
          <span className="lista__texto">
            <Barra w={`${38 + ((i * 13) % 40)}%`} h={13} />
          </span>
          <span className="esq__acoes">
            <Barra w="24px" h={24} style={{ borderRadius: 6 }} />
            <Barra w="24px" h={24} style={{ borderRadius: 6 }} />
            <Barra w="24px" h={24} style={{ borderRadius: 6 }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Tabela densa — fornecedores. Mesma altura de cabeçalho e de linha. */
export function EsqueletoTabela({ colunas = 6, linhas = 8 }: { colunas?: number; linhas?: number }) {
  return (
    <table className="lc-table esq__tabela">
      <thead>
        <tr>
          {Array.from({ length: colunas }, (_, i) => (
            <th key={i} scope="col">
              <Barra w={i === 0 ? '60%' : '46%'} h={9} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: linhas }, (_, l) => (
          <tr key={l} className="lc-table__linha--esqueleto">
            {Array.from({ length: colunas }, (_, c) => (
              <td key={c}>
                <Barra w={c === 0 ? `${52 + ((l * 7) % 30)}%` : `${34 + ((l + c) % 4) * 12}%`} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Quadro do funil: colunas com cartões. */
export function EsqueletoQuadro({ colunas = 5, cartoes = 3 }: { colunas?: number; cartoes?: number }) {
  return (
    <div className="funil__quadro">
      {Array.from({ length: colunas }, (_, i) => (
        <section key={i} className="funil__coluna funil__coluna--esqueleto">
          <header className="funil__coluna-topo">
            <Barra w="120px" h={13} />
          </header>
          <Barra w="96px" h={10} style={{ marginBottom: 'var(--space-4)' }} />
          <div className="funil__cartoes">
            {Array.from({ length: cartoes - (i % 2) }, (_, c) => (
              <article key={c} className="esq__cartao">
                <Barra w="52%" h={10} />
                <Barra w="78%" h={13} />
                <Barra w="64%" />
                <Barra w="40%" h={10} />
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
