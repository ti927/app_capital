import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * "Executar como" (specs/15-executar-como.md): a conta de `EXECUTAR_COMO_EMAIL`
 * entra no app como outra pessoa, para testar o que ela vê. Regras puras —
 * `regras.test.ts`.
 */

export const COOKIE_EXECUTAR_COMO = 'lc_executar_como';
/** Quanto tempo o selo da troca vale: depois disso "Voltar" exige novo login. */
export const DURACAO_MS = 8 * 60 * 60 * 1000;

export interface QuemExecutaComo {
  email: string | null;
  nivel_acesso: string;
  ativo: boolean;
}

/**
 * Só a conta de e-mail igual a `EXECUTAR_COMO_EMAIL`, master e ativa. Sem a
 * variável, ninguém: falhar fechado.
 */
export function podeExecutarComo(perfil: QuemExecutaComo, emailPermitido: string | undefined): boolean {
  const permitido = emailPermitido?.trim().toLowerCase();
  if (!permitido) return false;
  return (
    perfil.ativo === true &&
    perfil.nivel_acesso === 'master' &&
    (perfil.email ?? '').trim().toLowerCase() === permitido
  );
}

export interface Selo {
  /** Perfil de quem fez a troca (para onde "Voltar" leva). */
  original: string;
  /** Perfil em nome de quem a sessão está agora. */
  alvo: string;
  /** Epoch em ms. */
  expira: number;
}

const assinatura = (corpo: string, segredo: string) => createHmac('sha256', segredo).update(corpo).digest('base64url');

/** `corpo.assinatura`, corpo = JSON do selo em base64url. */
export function assinarSelo(selo: Selo, segredo: string): string {
  const corpo = Buffer.from(JSON.stringify(selo)).toString('base64url');
  return `${corpo}.${assinatura(corpo, segredo)}`;
}

/** O selo, se a assinatura confere e ainda não venceu; senão `null`. */
export function lerSelo(valor: string | undefined, segredo: string, agora: number): Selo | null {
  if (!valor || !segredo) return null;
  const [corpo, assinado, sobra] = valor.split('.');
  if (!corpo || !assinado || sobra !== undefined) return null;
  const esperado = Buffer.from(assinatura(corpo, segredo));
  const recebido = Buffer.from(assinado);
  if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) return null;
  try {
    const selo = JSON.parse(Buffer.from(corpo, 'base64url').toString('utf8')) as Selo;
    if (typeof selo.original !== 'string' || typeof selo.alvo !== 'string' || typeof selo.expira !== 'number') return null;
    return selo.expira > agora ? selo : null;
  } catch {
    return null;
  }
}
