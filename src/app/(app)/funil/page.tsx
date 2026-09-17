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

export default async function PaginaFunil() {
  const perfil = await perfilAtual();
  const supabase = await clienteServidor();

  const [quadros, etapas, tags, cartoes, cartaoTags, cartaoUsuarios, perfis] = await Promise.all([
    supabase.from('funil_quadro').select('id, nome, ordem').order('ordem'),
    supabase.from('funil_etapa').select('id, quadro_id, nome, ordem, no_fluxo').order('ordem'),
    supabase.from('funil_tag').select('id, nome, cor, ativo').order('nome'),
    supabase
      .from('funil_cartao')
      .select(
        'id, quadro_id, etapa_id, empresa, contato, segmento, faturamento, indicante, parecer, ' +
          'historico, ordem, data_kb, data_call, arquivado, atualizado_em',
      )
      .order('ordem'),
    supabase.from('funil_cartao_tag').select('cartao_id, tag_id'),
    supabase.from('funil_cartao_usuario').select('cartao_id, perfil_id'),
    supabase.from('perfil').select('id, nome').eq('ativo', true).order('nome'),
  ]);

  // O indicante só vê os cartões em que está.
  const meus = new Set(
    (cartaoUsuarios.data ?? [])
      .filter((v) => v.perfil_id === perfil.id)
      .map((v) => v.cartao_id as string),
  );
  const todos = (cartoes.data ?? []) as unknown as FunilCartao[];
  const visiveis = perfil.nivel_acesso === 'master' ? todos : todos.filter((c) => meus.has(c.id));

  return (
    <TelaFunil
      quadro={(quadros.data?.[0] ?? null) as { id: string; nome: string } | null}
      etapas={(etapas.data ?? []) as unknown as EtapaFunil[]}
      tags={(tags.data ?? []) as unknown as TagFunil[]}
      cartoes={visiveis}
      cartaoTags={(cartaoTags.data ?? []) as unknown as Array<{ cartao_id: string; tag_id: string }>}
      cartaoUsuarios={(cartaoUsuarios.data ?? []) as unknown as Array<{ cartao_id: string; perfil_id: string }>}
      perfis={(perfis.data ?? []) as unknown as Array<{ id: string; nome: string }>}
    />
  );
}
