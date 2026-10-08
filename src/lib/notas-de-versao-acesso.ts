/**
 * Quem vê o sino de notas de versão: os e-mails de `NOTAS_DE_VERSAO_EMAILS`
 * (variável de servidor, lista separada por vírgula, sem diferenciar caixa).
 * Sem a variável, ninguém vê — falha fechado.
 */
export function veNotasDeVersao(email: string | null | undefined, lista: string | undefined): boolean {
  const meu = (email ?? '').trim().toLowerCase();
  if (!meu || !lista) return false;
  return lista
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(meu);
}
