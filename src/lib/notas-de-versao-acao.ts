'use server';

import { perfilAtual } from '@/lib/perfil';
import { clienteServidor } from '@/lib/supabase/servidor';
import { NOTAS_DE_VERSAO } from './notas-de-versao';
import { veNotasDeVersao } from './notas-de-versao-acesso';

/**
 * Marca a rodada mais recente como vista pela pessoa da sessão. Grava com a
 * sessão dela (RLS: `perfil_atualiza` só deixa mexer na própria linha). O
 * identificador vem do arquivo, não do cliente — nada que o navegador mande
 * entra no banco.
 */
export async function marcarNotasVistas(): Promise<void> {
  const perfil = await perfilAtual();
  if (!veNotasDeVersao(perfil.email, process.env.NOTAS_DE_VERSAO_EMAILS)) return;
  const ultima = NOTAS_DE_VERSAO[0]?.id;
  if (!ultima) return;
  const supabase = await clienteServidor();
  await supabase.from('perfil').update({ notas_vistas: ultima }).eq('id', perfil.id);
}
