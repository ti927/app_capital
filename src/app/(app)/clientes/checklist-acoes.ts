'use server';

import { perfilAtual } from '@/lib/perfil';
import { clienteServidor } from '@/lib/supabase/servidor';
import type { StatusDoItem } from '@/lib/checklist/itens';
import {
  adicionarItem,
  carregarChecklist,
  marcarItem,
  removerItem,
  type RespostaChecklist,
} from '@/lib/checklist/servico';

/** A aba Checklist do cliente (specs/18). A RLS decide quem lê e grava. */

export async function checklistDoCliente(clienteId: string): Promise<RespostaChecklist> {
  return carregarChecklist(await clienteServidor(), clienteId);
}

export async function marcarItemDaChecklist(clienteId: string, ref: string, status: StatusDoItem) {
  const [supabase, perfil] = await Promise.all([clienteServidor(), perfilAtual()]);
  return marcarItem(supabase, perfil.id, clienteId, ref, status, 'app');
}

export async function adicionarItemNaChecklist(clienteId: string, titulo: string) {
  const [supabase, perfil] = await Promise.all([clienteServidor(), perfilAtual()]);
  return adicionarItem(supabase, perfil.id, clienteId, titulo, 'app');
}

export async function removerItemDaChecklist(clienteId: string, id: string) {
  return removerItem(await clienteServidor(), clienteId, id);
}
