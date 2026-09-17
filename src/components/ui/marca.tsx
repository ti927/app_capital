/**
 * Marca — `Symbol` e `Logo` do design system.
 * Geometria e regras: design/design-system/components/Logo/README.md.
 */

export type Tom = 'ink' | 'white' | 'mono';

/** Os quatro braços do "+". O miolo é desenhado à parte. */
const BRACOS = [
  { x: 18.5, y: 3, w: 11, h: 12.5 },
  { x: 18.5, y: 32.5, w: 11, h: 12.5 },
  { x: 3, y: 18.5, w: 12.5, h: 11 },
  { x: 32.5, y: 18.5, w: 12.5, h: 11 },
];

export interface SimboloProps {
  /** Lado em px. Mínimo 16 — abaixo disso as folgas entre os blocos fecham. */
  tamanho?: number;
  tom?: Tom;
  /** Quando presente vira `<title>` e o SVG deixa de ser decorativo. */
  titulo?: string;
}

/**
 * O "+" de 5 blocos com o miolo em `accent`. Braços nunca coloridos.
 *
 * `ink` e `mono` seguem `--text`, não o preto fixo: o app troca de tema em
 * tempo de execução e a assinatura tem de continuar legível nos dois. `white`
 * continua fixo, para fundo escuro que não muda com o tema.
 */
export function Simbolo({ tamanho = 34, tom = 'ink', titulo }: SimboloProps) {
  const braco = tom === 'white' ? 'var(--neutral-0)' : 'var(--text)';
  const miolo = tom === 'mono' ? braco : 'var(--accent)';

  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden={titulo ? undefined : 'true'}
      role={titulo ? 'img' : undefined}
      style={{ flex: 'none', display: 'block' }}
    >
      {titulo ? <title>{titulo}</title> : null}
      {BRACOS.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx={1.5} fill={braco} />
      ))}
      <rect x={18.5} y={18.5} width={11} height={11} rx={1.5} fill={miolo} />
    </svg>
  );
}

export interface LogoProps extends SimboloProps {
  /** Corpo de "LURE" em px. 18 na app bar. */
  tamanhoNome?: number;
  /** Texto do chip. `null` remove o chip. */
  chip?: string | null;
  /** `false` deixa só o símbolo. */
  assinatura?: boolean;
  href?: string;
  rotulo?: string;
  className?: string;
}

/** Assinatura: símbolo + "LURE" em texto vivo + chip do produto. */
export function Logo({
  tamanho = 34,
  tamanhoNome = 22,
  tom = 'ink',
  chip = 'CAPITAL',
  assinatura = true,
  href,
  rotulo,
  className,
}: LogoProps) {
  const cor = tom === 'white' ? 'var(--neutral-0)' : 'var(--text)';
  const conteudo = (
    <>
      <Simbolo tamanho={tamanho} tom={tom} />
      {assinatura ? (
        <span className="lc-logo__wm">
          <span className="lc-logo__name" style={{ fontSize: tamanhoNome, color: cor }}>
            LURE
          </span>
          {chip ? <span className="lc-logo__chip">{chip}</span> : null}
        </span>
      ) : null}
    </>
  );

  const aria = rotulo ?? `Lure${chip ? ` ${chip}` : ''}`;

  return href ? (
    <a className={['lc-logo', className].filter(Boolean).join(' ')} href={href} aria-label={aria}>
      {conteudo}
    </a>
  ) : (
    <span className={['lc-logo', className].filter(Boolean).join(' ')} aria-label={aria}>
      {conteudo}
    </span>
  );
}
