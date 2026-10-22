'use server';

import { clienteServidor } from '@/lib/supabase/servidor';
import { ErroDrive, dentroDe, estadoDoDrive, listarPasta, pastaDoCliente, type ItemDoDrive } from '@/lib/google/drive';

export type RespostaDocumentos =
  | { estado: 'sem-drive' }
  | { estado: 'sem-pasta'; buscado: string }
  | { estado: 'erro'; erro: string }
  | {
      estado: 'ok';
      pastaDoCliente: { id: string; nome: string };
      /** Outras pastas que também pareciam deste cliente (só os nomes). */
      outras: string[];
      itens: ItemDoDrive[];
    };

/**
 * Documentos do cliente (specs/17). Primeira trava: a pessoa enxerga o
 * cliente — a leitura vai com o cliente DELA, então a RLS decide. Segunda:
 * a subpasta pedida está dentro da pasta do cliente.
 */
export async function documentosDoCliente(clienteId: string, pastaId?: string): Promise<RespostaDocumentos> {
  const supabase = await clienteServidor();
  const [{ data: cliente }, drive] = await Promise.all([
    supabase.from('cliente').select('nome_razao').eq('id', clienteId).maybeSingle(),
    estadoDoDrive(),
  ]);
  if (!cliente) return { estado: 'erro', erro: 'Não achei o cliente.' };
  if (!drive.conectado) return { estado: 'sem-drive' };

  try {
    const { pasta, outras } = await pastaDoCliente(cliente.nome_razao as string);
    if (!pasta) return { estado: 'sem-pasta', buscado: cliente.nome_razao as string };

    const alvo = pastaId ?? pasta.id;
    if (alvo !== pasta.id && !(await dentroDe(alvo, pasta.id))) {
      return { estado: 'erro', erro: 'Essa pasta não é deste cliente.' };
    }
    return { estado: 'ok', pastaDoCliente: pasta, outras, itens: await listarPasta(alvo) };
  } catch (e) {
    return {
      estado: 'erro',
      erro: e instanceof ErroDrive ? `O Drive não respondeu: ${e.message}.` : 'Erro inesperado ao ler o Drive.',
    };
  }
}
