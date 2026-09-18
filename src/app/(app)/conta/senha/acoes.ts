'use server';

import { clienteServidor } from '@/lib/supabase/servidor';

/** Mínimo do Supabase é 6; 8 é o mínimo que vale pedir de gente adulta. */
const MINIMO = 8;

export async function trocarSenha(_anterior: unknown, dados: FormData) {
  const nova = String(dados.get('nova') ?? '');
  const repetida = String(dados.get('repetida') ?? '');

  if (nova.length < MINIMO) return { erro: `A senha precisa de pelo menos ${MINIMO} caracteres.` };
  if (nova !== repetida) return { erro: 'As duas senhas não são iguais.' };

  const supabase = await clienteServidor();

  // `updateUser` age sobre a sessão de quem está pedindo — não dá para trocar
  // a senha de outra pessoa por aqui, nem sem estar autenticado.
  const { error } = await supabase.auth.updateUser({ password: nova });
  if (error) {
    // A mensagem do Supabase vem em inglês; a única que o usuário precisa
    // entender é a da senha fraca demais.
    if (/weak|short|characters/i.test(error.message)) {
      return { erro: 'Essa senha é fraca demais. Use uma mais longa.' };
    }
    return { erro: 'Não consegui trocar a senha. Entre de novo e tente outra vez.' };
  }

  return { ok: true };
}
