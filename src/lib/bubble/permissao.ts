/**
 * Quem pode sincronizar com o Bubble: uma conta só.
 *
 * Nível master não basta — há três masters ativos e o botão é ferramenta de
 * desenvolvimento. A conta é a de e-mail igual a `SINCRONIZACAO_EMAIL`
 * (variável de servidor, sem `NEXT_PUBLIC_`). Sem a variável, ninguém pode:
 * falhar fechado é o comportamento certo para uma ação que escreve no banco.
 *
 * O botão some para os outros, mas é a ação no servidor que chama isto de
 * novo — botão escondido não é trava. Ver specs/10-sincronizacao-bubble.md.
 */
export interface QuemSincroniza {
  email: string | null;
  nivel_acesso: string;
  ativo: boolean;
}

export function podeSincronizar(perfil: QuemSincroniza, emailPermitido: string | undefined): boolean {
  const permitido = emailPermitido?.trim().toLowerCase();
  if (!permitido) return false;
  return (
    perfil.ativo === true &&
    perfil.nivel_acesso === 'master' &&
    (perfil.email ?? '').trim().toLowerCase() === permitido
  );
}
