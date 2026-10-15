import { cache } from 'react';
import { clienteServidor } from './supabase/servidor';
import type { NivelAcesso } from './dominio';

/** Valores do enum `public.pagina` (db/001_fundacao.sql). */
export type Pagina = 'clientes' | 'fornecedores' | 'operacao' | 'esteira_de_estruturacao';

/**
 * Páginas de master liberadas, uma a uma, para um indicante (specs/16).
 *
 * A fonte é `acesso_pagina`; a RLS deixa cada um ler só as próprias linhas.
 * Master não consulta: já vê tudo. Embrulhado em `cache()` como `perfilAtual`
 * — o layout e a página perguntam na mesma requisição, e a resposta vale só
 * para ela.
 */
export const paginasLiberadas = cache(async function paginasLiberadas(
  perfilId: string,
  nivel: NivelAcesso,
): Promise<Pagina[]> {
  if (nivel === 'master') return [];
  const supabase = await clienteServidor();
  const { data } = await supabase.from('acesso_pagina').select('pagina').eq('perfil_id', perfilId);
  return (data ?? []).map((l) => l.pagina as Pagina);
});

/** Master entra em tudo; indicante só na página que foi liberada para ele. */
export function podeAbrir(nivel: NivelAcesso, liberadas: readonly Pagina[], pagina: Pagina): boolean {
  return nivel === 'master' || liberadas.includes(pagina);
}
