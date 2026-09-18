'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Botao } from './base';
import { IconeBuscar, IconeChevronBaixo, IconeFechar, IconeSalvar } from './icones';

export interface Opcao {
  valor: string;
  rotulo: string;
  /** Ponto colorido antes do rótulo — usado por status e tag. */
  cor?: string;
}

/* ---------------------------------------------------------------------------
   O menu de escolha.

   Antes isto era um `Dialogo`: escolher um valor tirava a tela inteira da
   frente do usuário, e dentro de uma célula de tabela que já estava num
   diálogo abria um segundo pop-up por cima do primeiro. Agora é um menu
   ancorado no próprio campo.

   Ele mora num portal no `body`, em `position: fixed`, por um motivo
   específico: a tabela de etapas tem `overflow` e o diálogo também — um menu
   dentro do fluxo seria cortado pela borda dos dois. Do portal ele escapa dos
   dois recortes, e a posição é recalculada a cada rolagem.

   O que veio do desenho antigo e continua: a busca, quando a lista é grande.
   Com 31 tipos de operação e 73 fundos, rolar não resolve.
   --------------------------------------------------------------------------- */

const MARGEM = 8;
const ALTURA_MAXIMA = 320;
const LARGURA_MINIMA = 248;

interface Posicao {
  estilo: CSSProperties;
  acima: boolean;
}

function usePosicao(gatilho: React.RefObject<HTMLButtonElement | null>, aberto: boolean) {
  const [posicao, setPosicao] = useState<Posicao | null>(null);

  useLayoutEffect(() => {
    if (!aberto) {
      setPosicao(null);
      return;
    }

    const calcular = () => {
      const r = gatilho.current?.getBoundingClientRect();
      if (!r) return;

      const espacoAbaixo = window.innerHeight - r.bottom - MARGEM;
      const espacoAcima = r.top - MARGEM;
      // Só sobe quando não cabe embaixo e cabe melhor em cima.
      const acima = espacoAbaixo < 220 && espacoAcima > espacoAbaixo;

      const largura = Math.min(Math.max(r.width, LARGURA_MINIMA), window.innerWidth - MARGEM * 2);
      const esquerda = Math.min(Math.max(MARGEM, r.left), window.innerWidth - largura - MARGEM);

      setPosicao({
        acima,
        estilo: {
          width: largura,
          left: esquerda,
          maxHeight: Math.min(ALTURA_MAXIMA, (acima ? espacoAcima : espacoAbaixo) - 4),
          ...(acima ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
        },
      });
    };

    calcular();
    // `true` para pegar a rolagem de qualquer contêiner, não só a da janela.
    window.addEventListener('scroll', calcular, true);
    window.addEventListener('resize', calcular);
    return () => {
      window.removeEventListener('scroll', calcular, true);
      window.removeEventListener('resize', calcular);
    };
  }, [aberto, gatilho]);

  return posicao;
}

function Menu({
  aberto,
  gatilho,
  rotulo,
  aoFechar,
  opcoes,
  marcados,
  aoEscolher,
  multiplo,
  rodape,
}: {
  aberto: boolean;
  gatilho: React.RefObject<HTMLButtonElement | null>;
  rotulo: string;
  aoFechar: () => void;
  opcoes: Opcao[];
  marcados: Set<string>;
  aoEscolher: (valor: string) => void;
  multiplo?: boolean;
  rodape?: ReactNode;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const [filtro, setFiltro] = useState('');
  const [ativo, setAtivo] = useState(0);
  const posicao = usePosicao(gatilho, aberto);

  const visiveis = useMemo(() => {
    const alvo = filtro.trim().toLowerCase();
    if (!alvo) return opcoes;
    return opcoes.filter((o) => o.rotulo.toLowerCase().includes(alvo));
  }, [opcoes, filtro]);

  // Abaixo de 8 opções a busca atrapalha mais do que ajuda.
  const comBusca = opcoes.length >= 8;

  useEffect(() => {
    if (!aberto) return;
    setFiltro('');
    const marcado = opcoes.findIndex((o) => marcados.has(o.valor));
    setAtivo(marcado >= 0 ? marcado : 0);
    // `marcados` muda de identidade a cada render do pai; o que importa é a
    // abertura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, opcoes]);

  /** Clique fora fecha. O gatilho não conta: ele já alterna sozinho. */
  useEffect(() => {
    if (!aberto) return;
    const aoApontar = (e: MouseEvent) => {
      const alvo = e.target as Node;
      if (caixa.current?.contains(alvo) || gatilho.current?.contains(alvo)) return;
      aoFechar();
    };
    document.addEventListener('mousedown', aoApontar);
    return () => document.removeEventListener('mousedown', aoApontar);
  }, [aberto, aoFechar, gatilho]);

  /** O foco entra no menu: na busca quando existe, na lista quando não. */
  useEffect(() => {
    if (!aberto || !posicao) return;
    caixa.current?.querySelector<HTMLElement>('input, [role="listbox"]')?.focus();
  }, [aberto, posicao]);

  // Mantém a opção ativa à vista quando se anda de seta.
  useEffect(() => {
    caixa.current
      ?.querySelector<HTMLElement>('.opcoes__item--teclado')
      ?.scrollIntoView({ block: 'nearest' });
  }, [ativo]);

  const aoTeclar = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Não deixa o Esc chegar ao diálogo atrás e fechar os dois de uma vez.
      e.stopPropagation();
      aoFechar();
      gatilho.current?.focus();
      return;
    }
    if (e.key === 'Tab') {
      aoFechar();
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!visiveis.length) return;
      const passo = e.key === 'ArrowDown' ? 1 : -1;
      setAtivo((i) => (i + passo + visiveis.length) % visiveis.length);
      return;
    }
    if (e.key === 'Enter' && visiveis[ativo]) {
      e.preventDefault();
      aoEscolher(visiveis[ativo].valor);
    }
  };

  if (!aberto || !posicao || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={caixa}
      className={['lc-popover', posicao.acima && 'lc-popover--acima'].filter(Boolean).join(' ')}
      style={posicao.estilo}
      role="dialog"
      aria-label={rotulo}
      onKeyDown={aoTeclar}
    >
      {comBusca ? (
        <div className="filtro-opcoes">
          <IconeBuscar tamanho={15} />
          <input
            className="filtro-opcoes__campo"
            value={filtro}
            onChange={(e) => {
              setFiltro(e.target.value);
              setAtivo(0);
            }}
            placeholder={`Buscar entre ${opcoes.length}`}
            aria-label="Buscar opção"
            autoFocus
          />
          {filtro ? (
            <button
              type="button"
              className="filtro-opcoes__limpar"
              onClick={() => setFiltro('')}
              aria-label="Limpar busca"
            >
              <IconeFechar tamanho={13} />
            </button>
          ) : null}
        </div>
      ) : null}

      <ul
        className="opcoes"
        role="listbox"
        aria-multiselectable={multiplo || undefined}
        tabIndex={comBusca ? -1 : 0}
      >
        {visiveis.map((o, i) => {
          const marcado = marcados.has(o.valor);
          return (
            <li key={o.valor} role="option" aria-selected={marcado}>
              <button
                type="button"
                className={[
                  'opcoes__item',
                  marcado && 'opcoes__item--ativo',
                  i === ativo && 'opcoes__item--teclado',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onMouseEnter={() => setAtivo(i)}
                onClick={() => aoEscolher(o.valor)}
              >
                {multiplo ? (
                  <span className={['caixa', marcado && 'caixa--marcada'].filter(Boolean).join(' ')}>
                    {marcado ? <IconeSalvar tamanho={12} /> : null}
                  </span>
                ) : null}
                {o.cor ? <span className="gatilho__ponto" style={{ background: o.cor }} /> : null}
                <span className="opcoes__rotulo">{o.rotulo}</span>
                {!multiplo && marcado ? <IconeSalvar tamanho={14} /> : null}
              </button>
            </li>
          );
        })}
        {visiveis.length === 0 ? <li className="opcoes__vazio apoio">Nada encontrado</li> : null}
      </ul>

      {rodape ? <div className="lc-popover__pe">{rodape}</div> : null}
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ único -- */

export interface SeletorPopupProps {
  rotulo?: string;
  nome?: string;
  opcoes: Opcao[];
  valorInicial?: string;
  placeholder?: string;
  desabilitado?: boolean;
  className?: string;
  /** Avisa o consumidor quando quem escolhe não é um formulário. */
  aoEscolher?: (valor: string) => void;
}

/** Escolha de um valor, num menu ancorado no campo. */
export function SeletorPopup({
  rotulo,
  nome,
  opcoes,
  valorInicial = '',
  placeholder = 'Escolha aqui',
  desabilitado,
  className,
  aoEscolher,
}: SeletorPopupProps) {
  const [valor, setValor] = useState(valorInicial);
  const [aberto, setAberto] = useState(false);
  const gatilho = useRef<HTMLButtonElement>(null);

  const escolhida = opcoes.find((o) => o.valor === valor);
  const marcados = useMemo(() => new Set(valor ? [valor] : []), [valor]);
  const fechar = useCallback(() => setAberto(false), []);

  const escolher = (v: string) => {
    // Clicar de novo no que já está escolhido limpa — é o "Limpar" do rodapé
    // antigo, sem precisar de rodapé.
    const novo = v === valor ? '' : v;
    setValor(novo);
    aoEscolher?.(novo);
    setAberto(false);
    gatilho.current?.focus();
  };

  return (
    <div className={['lc-field', className].filter(Boolean).join(' ')}>
      {rotulo ? <span className="lc-field__label">{rotulo}</span> : null}
      {nome ? <input type="hidden" name={nome} value={valor} /> : null}

      <button
        ref={gatilho}
        type="button"
        className={['gatilho', aberto && 'gatilho--aberto'].filter(Boolean).join(' ')}
        disabled={desabilitado}
        onClick={() => setAberto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={aberto}
      >
        <span className={escolhida ? 'gatilho__valor' : 'gatilho__vazio'}>
          {escolhida ? (
            <>
              {escolhida.cor ? (
                <span className="gatilho__ponto" style={{ background: escolhida.cor }} />
              ) : null}
              {escolhida.rotulo}
            </>
          ) : (
            placeholder
          )}
        </span>
        <IconeChevronBaixo tamanho={14} />
      </button>

      <Menu
        aberto={aberto}
        gatilho={gatilho}
        rotulo={rotulo ?? 'Escolha'}
        aoFechar={fechar}
        opcoes={opcoes}
        marcados={marcados}
        aoEscolher={escolher}
      />
    </div>
  );
}

/* --------------------------------------------------------------- múltiplo -- */

export interface SeletorMultiploProps {
  rotulo?: string;
  nome: string;
  opcoes: Opcao[];
  inicial?: string[];
  placeholder?: string;
  desabilitado?: boolean;
  className?: string;
  /** Pinta as fichas escolhidas em vermelho — "tipos não atendidos". */
  negativo?: boolean;
  aoMudar?: (valores: string[]) => void;
}

/** Escolha de vários valores, no mesmo menu — que não fecha a cada clique. */
export function SeletorMultiploPopup({
  rotulo,
  nome,
  opcoes,
  inicial = [],
  placeholder = 'Escolha aqui',
  desabilitado,
  className,
  negativo,
  aoMudar,
}: SeletorMultiploProps) {
  const [escolhidos, setEscolhidos] = useState<string[]>(inicial);
  const [aberto, setAberto] = useState(false);
  const gatilho = useRef<HTMLButtonElement>(null);

  const porValor = useMemo(() => new Map(opcoes.map((o) => [o.valor, o])), [opcoes]);
  const marcados = useMemo(() => new Set(escolhidos), [escolhidos]);
  const fechar = useCallback(() => setAberto(false), []);

  const alternar = (v: string) => {
    const novo = escolhidos.includes(v) ? escolhidos.filter((x) => x !== v) : [...escolhidos, v];
    setEscolhidos(novo);
    aoMudar?.(novo);
  };

  return (
    <div className={['lc-field', className].filter(Boolean).join(' ')}>
      {rotulo ? <span className="lc-field__label">{rotulo}</span> : null}
      {escolhidos.map((v) => (
        <input key={v} type="hidden" name={nome} value={v} />
      ))}

      <button
        ref={gatilho}
        type="button"
        className={['gatilho', aberto && 'gatilho--aberto'].filter(Boolean).join(' ')}
        disabled={desabilitado}
        onClick={() => setAberto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={aberto}
      >
        {escolhidos.length === 0 ? (
          <span className="gatilho__vazio">{placeholder}</span>
        ) : (
          <span className="gatilho__fichas">
            {escolhidos.slice(0, 3).map((v) => (
              <span
                key={v}
                className={['ficha', negativo && 'ficha--negativa'].filter(Boolean).join(' ')}
              >
                {porValor.get(v)?.rotulo ?? v}
              </span>
            ))}
            {escolhidos.length > 3 ? <span className="apoio">+{escolhidos.length - 3}</span> : null}
          </span>
        )}
        <IconeChevronBaixo tamanho={14} />
      </button>

      <Menu
        aberto={aberto}
        gatilho={gatilho}
        rotulo={rotulo ?? 'Escolha'}
        aoFechar={fechar}
        opcoes={opcoes}
        marcados={marcados}
        aoEscolher={alternar}
        multiplo
        rodape={
          <>
            <span className="apoio">
              {escolhidos.length ? `${escolhidos.length} selecionado(s)` : 'Nenhum selecionado'}
            </span>
            {escolhidos.length ? (
              <Botao
                variante="tertiary"
                tamanho="sm"
                onClick={() => {
                  setEscolhidos([]);
                  aoMudar?.([]);
                }}
              >
                Limpar
              </Botao>
            ) : null}
            <Botao
              variante="secondary"
              tamanho="sm"
              onClick={() => {
                setAberto(false);
                gatilho.current?.focus();
              }}
            >
              Pronto
            </Botao>
          </>
        }
      />
    </div>
  );
}
