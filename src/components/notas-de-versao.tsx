'use client';

import { Fragment, useEffect, useLayoutEffect, useRef, useState, useTransition } from 'react';
import { IconeNotificacoes } from './ui/icones';
import { marcarNotasVistas } from '@/lib/notas-de-versao-acao';
import type { RodadaDeNotas } from '@/lib/notas-de-versao';

/** **negrito** e `código` — o único markdown que as notas usam por dentro da linha. */
function Inline({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((parte, i) =>
        parte.startsWith('**') ? (
          <strong key={i}>{parte.slice(2, -2)}</strong>
        ) : parte.startsWith('`') ? (
          <code key={i}>{parte.slice(1, -1)}</code>
        ) : (
          <Fragment key={i}>{parte}</Fragment>
        ),
      )}
    </>
  );
}

/**
 * Sino das notas de versão, na barra de cima. Só é montado para quem está em
 * `NOTAS_DE_VERSAO_EMAILS` (o layout decide). Abre um painel pequeno preso ao
 * sino — popover, sem véu — e, ao abrir, marca a rodada como vista no banco.
 */
export function BotaoNotasDeVersao({
  rodadas,
  haNovidade,
}: {
  rodadas: RodadaDeNotas[];
  haNovidade: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [novidade, setNovidade] = useState(haNovidade);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const painel = useRef<HTMLDivElement>(null);
  const [, gravar] = useTransition();

  function alternar() {
    if (aberto) return setAberto(false);
    setAberto(true);
    if (novidade) {
      setNovidade(false);
      gravar(() => void marcarNotasVistas());
    }
  }

  // Preso ao sino: `fixed` escapa do overflow da barra; o `right` mínimo
  // a conta do `right` mantém o painel inteiro dentro da janela no celular.
  useLayoutEffect(() => {
    if (!aberto || !botao.current) return;
    const r = botao.current.getBoundingClientRect();
    const largura = Math.min(360, window.innerWidth - 16);
    const direita = Math.max(8, window.innerWidth - r.right);
    setPos({ top: r.bottom + 8, right: Math.min(direita, window.innerWidth - 8 - largura) });
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => {
      const alvo = e.target as Node;
      if (painel.current?.contains(alvo) || botao.current?.contains(alvo)) return;
      setAberto(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAberto(false);
        botao.current?.focus();
      }
    };
    document.addEventListener('pointerdown', fora);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', fora);
      document.removeEventListener('keydown', esc);
    };
  }, [aberto]);

  return (
    <>
      <button
        ref={botao}
        type="button"
        className="lc-btn lc-btn--tertiary lc-btn--sm casca__acao lc-notas__sino"
        onClick={alternar}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        title="Notas de versão"
        aria-label={novidade ? 'Notas de versão (há novidade)' : 'Notas de versão'}
      >
        <IconeNotificacoes tamanho={16} />
        {novidade ? <span className="lc-notas__bolinha" aria-hidden="true" data-testid="notas-bolinha" /> : null}
      </button>

      {aberto && pos ? (
        <div
          ref={painel}
          className="lc-notas"
          role="dialog"
          aria-label="Notas de versão"
          style={{ top: pos.top, right: pos.right }}
        >
          <div className="lc-notas__lista">
            {rodadas.map((r) => (
              <section key={r.id} className="lc-notas__rodada">
                <h2 className="lc-notas__titulo">
                  <span className="lc-notas__data">{r.data}</span> {r.titulo}
                </h2>
                {r.grupos.map((g, gi) => (
                  <div key={gi}>
                    {g.titulo ? <h3 className="lc-notas__grupo">{g.titulo}</h3> : null}
                    <ul>
                      {g.itens.map((it, ii) => (
                        <li key={ii} className={`lc-notas__${it.tipo}`}>
                          <Inline texto={it.texto} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
