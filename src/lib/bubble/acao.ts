'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { perfilAtual } from '@/lib/perfil';
import { clienteServidor } from '@/lib/supabase/servidor';
import { buscarTipo, urlDaRaiz, type RaizBubble } from './api';
import { bancoSupabase } from './banco-supabase';
import { podeSincronizar } from './permissao';
import { sincronizar, type ResultadoSincronizacao } from './sincronizar';

export type RespostaSincronizacao =
  | ({ ok: true; raiz: RaizBubble; duracaoMs: number } & ResultadoSincronizacao)
  | { ok: false; erro: string };

/**
 * Botão "Sincronizar com o Bubble" — espelha o Bubble aqui (sentido único).
 * Ver specs/10-sincronizacao-bubble.md.
 *
 * A permissão é conferida AQUI, de novo. O layout esconde o botão de quem não
 * pode, mas uma server action é um endpoint POST como outro qualquer: quem
 * souber o id dela chama sem botão nenhum.
 *
 * A chave do Bubble só existe neste processo (`BUBBLE_API_KEY`, sem
 * `NEXT_PUBLIC_`). Nada dela volta na resposta.
 */
export async function sincronizarComBubble(): Promise<RespostaSincronizacao> {
  const perfil = await perfilAtual();
  if (!podeSincronizar(perfil, process.env.SINCRONIZACAO_EMAIL)) {
    return { ok: false, erro: 'Sem permissão para sincronizar.' };
  }

  const chave = process.env.BUBBLE_API_KEY;
  const app = process.env.BUBBLE_APP_URL;
  if (!chave || !app) {
    return { ok: false, erro: 'BUBBLE_API_KEY ou BUBBLE_APP_URL não configurada no servidor.' };
  }

  // Live por padrão: é o banco de verdade. version-test é uma cópia de
  // 15/09/2026 e pode ter registro de teste — só por escolha explícita.
  const raiz: RaizBubble =
    process.env.BUBBLE_SINCRONIZACAO_RAIZ === 'version-test' ? 'version-test' : 'live';
  const url = urlDaRaiz(app.replace(/\/+$/, ''), raiz);

  const inicio = Date.now();
  try {
    const supabase = (await clienteServidor()) as unknown as SupabaseClient;
    const resultado = await sincronizar(bancoSupabase(supabase), (tipo) => buscarTipo(url, chave, tipo));
    const mudou = resultado.tabelas.some((t) => t.novos + t.atualizados + t.arquivados + t.removidos > 0);
    if (mudou) revalidatePath('/', 'layout');
    return { ok: true, raiz, duracaoMs: Date.now() - inicio, ...resultado };
  } catch (e) {
    // Mensagem do banco ou da rede; nunca carrega a chave.
    return { ok: false, erro: e instanceof Error ? e.message : 'Falha inesperada na sincronização.' };
  }
}
