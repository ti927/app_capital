import type { SupabaseClient } from '@supabase/supabase-js';
import { ErroDrive, estadoDoDrive, pastaDoCliente, varrerPasta } from '@/lib/google/drive';
import { itemPadrao, montarChecklist, STATUS, type ItemDaChecklist, type LinhaGravada, type StatusDoItem } from './itens';

/**
 * Checklist de documentos do cliente (specs/18-checklist-documentos.md) — o
 * que a aba e o MCP chamam. Sempre com o `supabase` DA PESSOA: a RLS de
 * `cliente` e de `cliente_checklist_item` (db/017) decide quem lê e grava.
 * O Drive vai com a conexão da empresa, só depois de a RLS mostrar o cliente.
 */

export type EstadoDaVarredura =
  | { estado: 'ok'; pasta: { id: string; nome: string }; arquivos: number }
  | { estado: 'sem-drive' }
  | { estado: 'sem-pasta'; buscado: string }
  | { estado: 'erro'; erro: string };

export type RespostaChecklist =
  | { ok: false; erro: string }
  | { ok: true; cliente: string; varredura: EstadoDaVarredura; itens: ItemDaChecklist[] };

const COLUNAS = 'id, chave, titulo, status, origem, observacao, criado_em';

export async function carregarChecklist(supabase: SupabaseClient, clienteId: string): Promise<RespostaChecklist> {
  const [{ data: cliente }, linhas, drive] = await Promise.all([
    supabase.from('cliente').select('nome_razao').eq('id', clienteId).maybeSingle(),
    supabase.from('cliente_checklist_item').select(COLUNAS).eq('cliente_id', clienteId),
    estadoDoDrive(),
  ]);
  if (!cliente) return { ok: false, erro: 'Não achei o cliente, ou ele está fora do seu acesso.' };
  if (linhas.error) return { ok: false, erro: `Não consegui ler a checklist: ${linhas.error.message}` };

  const nome = cliente.nome_razao as string;
  let varredura: EstadoDaVarredura;
  let arquivos: Awaited<ReturnType<typeof varrerPasta>> | null = null;
  if (!drive.conectado) {
    varredura = { estado: 'sem-drive' };
  } else {
    try {
      const { pasta } = await pastaDoCliente(nome);
      if (!pasta) {
        varredura = { estado: 'sem-pasta', buscado: nome };
      } else {
        arquivos = await varrerPasta(pasta.id);
        varredura = { estado: 'ok', pasta, arquivos: arquivos.length };
      }
    } catch (e) {
      varredura = {
        estado: 'erro',
        erro: e instanceof ErroDrive ? `O Drive não respondeu: ${e.message}.` : 'Erro inesperado ao ler o Drive.',
      };
    }
  }

  const itens = montarChecklist((linhas.data ?? []) as LinhaGravada[], arquivos);
  return { ok: true, cliente: nome, varredura, itens };
}

/**
 * A pasta do cliente no Drive, só se a pessoa enxerga o cliente (RLS). Para
 * o MCP listar e ler arquivos com as mesmas travas da aba Documentos.
 */
export async function pastaDoClienteVisivel(
  supabase: SupabaseClient,
  clienteId: string,
): Promise<{ pasta: { id: string; nome: string } } | { erro: string }> {
  const [{ data: cliente }, drive] = await Promise.all([
    supabase.from('cliente').select('nome_razao').eq('id', clienteId).maybeSingle(),
    estadoDoDrive(),
  ]);
  if (!cliente) return { erro: 'Não achei o cliente, ou ele está fora do seu acesso.' };
  if (!drive.conectado) return { erro: 'O Google Drive da Lure não está conectado (Conexões, no app).' };
  try {
    const { pasta } = await pastaDoCliente(cliente.nome_razao as string);
    return pasta ? { pasta } : { erro: `Nenhuma pasta com o nome "${cliente.nome_razao}" no Drive.` };
  } catch (e) {
    return { erro: e instanceof ErroDrive ? `O Drive não respondeu: ${e.message}.` : 'Erro inesperado ao ler o Drive.' };
  }
}

const ehUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

/**
 * Marca um item. `ref` é a chave do item padrão ou o id do item extra.
 * `status: null` devolve o item à varredura do Drive (tira a marcação).
 * `observacao` indefinida não mexe na que já existe.
 */
export async function marcarItem(
  supabase: SupabaseClient,
  perfilId: string,
  clienteId: string,
  ref: string,
  status: StatusDoItem | null,
  origem: 'app' | 'mcp',
  observacao?: string | null,
): Promise<{ erro?: string }> {
  if (status !== null && !STATUS.includes(status)) return { erro: 'Status desconhecido.' };
  const nota = observacao === undefined ? {} : { observacao: observacao?.trim() || null };

  if (itemPadrao(ref)) {
    if (status === null && observacao === undefined) {
      const { error } = await supabase.from('cliente_checklist_item').delete().eq('cliente_id', clienteId).eq('chave', ref);
      return error ? { erro: error.message } : {};
    }
    const { error } = await supabase
      .from('cliente_checklist_item')
      .upsert(
        { cliente_id: clienteId, chave: ref, status, origem, atualizado_por: perfilId, ...nota },
        { onConflict: 'cliente_id,chave' },
      );
    return error ? { erro: error.message } : {};
  }

  if (!ehUuid(ref)) return { erro: `Não existe item "${ref}" na checklist.` };
  const { data, error } = await supabase
    .from('cliente_checklist_item')
    .update({ status, origem, atualizado_por: perfilId, ...nota })
    .eq('id', ref)
    .eq('cliente_id', clienteId)
    .select('id');
  if (error) return { erro: error.message };
  return data?.length ? {} : { erro: 'Item não encontrado, ou fora do seu acesso.' };
}

export async function adicionarItem(
  supabase: SupabaseClient,
  perfilId: string,
  clienteId: string,
  titulo: string,
  origem: 'app' | 'mcp',
  status: StatusDoItem | null = null,
): Promise<{ id?: string; erro?: string }> {
  const limpo = titulo.trim().replace(/\s+/g, ' ');
  if (!limpo) return { erro: 'Escreva o nome do item.' };
  if (limpo.length > 200) return { erro: 'Nome longo demais (máximo 200 caracteres).' };
  const { data, error } = await supabase
    .from('cliente_checklist_item')
    .insert({ cliente_id: clienteId, titulo: limpo, status, origem, atualizado_por: perfilId })
    .select('id')
    .single();
  return error ? { erro: error.message } : { id: data.id as string };
}

/** Só item extra sai da lista; o padrão, no máximo, vira "não se aplica". */
export async function removerItem(supabase: SupabaseClient, clienteId: string, id: string): Promise<{ erro?: string }> {
  if (!ehUuid(id)) return { erro: 'Itens padrão não saem da lista — marque como "não se aplica".' };
  const { data, error } = await supabase
    .from('cliente_checklist_item')
    .delete()
    .eq('id', id)
    .eq('cliente_id', clienteId)
    .not('titulo', 'is', null)
    .select('id');
  if (error) return { erro: error.message };
  return data?.length ? {} : { erro: 'Item não encontrado, ou fora do seu acesso.' };
}
