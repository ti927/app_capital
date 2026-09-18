import { clienteServidor } from '@/lib/supabase/servidor';
import { perfilAtual } from '@/lib/perfil';
import type { FunilCartao } from '@/lib/dominio';
import { TelaFunil } from './tela';

export const metadata = { title: 'Funil de Clientes · Lure Capital' };

export interface EtapaFunil {
  id: string;
  quadro_id: string;
  nome: string;
  ordem: number;
  no_fluxo: boolean;
}
export interface TagFunil {
  id: string;
  nome: string;
  cor: string | null;
  ativo: boolean;
}

/**
 * Cartão com o cliente que ele virou (`funil_cartao.cliente_id`, migration
 * 006). Fica aqui, e não em `src/lib/dominio.ts`, porque por ora só o funil
 * usa — e porque `dominio.ts` é de outra frente nesta rodada.
 */
export type CartaoDoFunil = FunilCartao & { cliente_id: string | null };

/** Os cinco tipos de tarefa. `text` no banco, lista fixa em `./tarefas-apoio.ts`. */
export type TipoTarefa = 'reuniao' | 'ligacao' | 'follow_up' | 'documento' | 'outro';

export interface Tarefa {
  id: string;
  cartao_id: string;
  quadro_id: string;
  titulo: string;
  descricao: string | null;
  tipo: TipoTarefa | null;
  /** `yyyy-mm-dd`. */
  prazo: string | null;
  /** `HH:MM:SS`, opcional — "reunião às 15h". */
  hora: string | null;
  concluida: boolean;
  data_conclusao: string | null;
  responsavel_id: string | null;
}

export default async function PaginaFunil() {
  const perfil = await perfilAtual();
  const supabase = await clienteServidor();

  const [quadros, etapas, tags, cartoes, cartaoTags, cartaoUsuarios, perfis, tarefas, clientes] =
    await Promise.all([
      supabase.from('funil_quadro').select('id, nome, ordem').order('ordem'),
      supabase.from('funil_etapa').select('id, quadro_id, nome, ordem, no_fluxo').order('ordem'),
      supabase.from('funil_tag').select('id, nome, cor, ativo').order('nome'),
      supabase
        .from('funil_cartao')
        .select(
          'id, quadro_id, etapa_id, empresa, contato, segmento, faturamento, indicante, parecer, ' +
            'historico, ordem, data_kb, data_call, arquivado, atualizado_em, cliente_id',
        )
        .order('ordem'),
      supabase.from('funil_cartao_tag').select('cartao_id, tag_id'),
      supabase.from('funil_cartao_usuario').select('cartao_id, perfil_id'),
      supabase.from('perfil').select('id, nome').eq('ativo', true).order('nome'),
      supabase
        .from('funil_tarefa')
        .select(
          'id, cartao_id, quadro_id, titulo, descricao, tipo, prazo, hora, concluida, ' +
            'data_conclusao, responsavel_id',
        )
        .order('prazo'),
      supabase.from('cliente').select('id, nome_razao').order('nome_razao'),
    ]);

  // O indicante só vê os cartões em que está.
  const meus = new Set(
    (cartaoUsuarios.data ?? [])
      .filter((v) => v.perfil_id === perfil.id)
      .map((v) => v.cartao_id as string),
  );
  const todos = (cartoes.data ?? []) as unknown as CartaoDoFunil[];
  const ehMaster = perfil.nivel_acesso === 'master';
  const visiveis = ehMaster ? todos : todos.filter((c) => meus.has(c.id));

  /**
   * Tarefa segue o recorte do cartão: quem enxerga o cartão enxerga as tarefas
   * dele. Mais as em que a pessoa é responsável, para não sumir da caixa de
   * quem tem que fazer só porque o cartão é de outro.
   */
  const idsVisiveis = new Set(visiveis.map((c) => c.id));
  const todasTarefas = (tarefas.data ?? []) as unknown as Tarefa[];
  const tarefasVisiveis = ehMaster
    ? todasTarefas
    : todasTarefas.filter((t) => idsVisiveis.has(t.cartao_id) || t.responsavel_id === perfil.id);

  return (
    <TelaFunil
      quadro={(quadros.data?.[0] ?? null) as { id: string; nome: string } | null}
      etapas={(etapas.data ?? []) as unknown as EtapaFunil[]}
      tags={(tags.data ?? []) as unknown as TagFunil[]}
      cartoes={visiveis}
      cartaoTags={(cartaoTags.data ?? []) as unknown as Array<{ cartao_id: string; tag_id: string }>}
      cartaoUsuarios={
        (cartaoUsuarios.data ?? []) as unknown as Array<{ cartao_id: string; perfil_id: string }>
      }
      perfis={(perfis.data ?? []) as unknown as Array<{ id: string; nome: string }>}
      tarefas={tarefasVisiveis}
      clientes={(clientes.data ?? []) as unknown as Array<{ id: string; nome_razao: string }>}
      perfilId={perfil.id}
      ehMaster={ehMaster}
    />
  );
}
