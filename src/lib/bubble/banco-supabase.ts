import type { SupabaseClient } from '@supabase/supabase-js';
import type { Linha, Mapa } from './mapeamento';
import type { Banco, TabelaComBubble, TabelaFilha } from './sincronizar';

/**
 * `Banco` da sincronização sobre o cliente Supabase **da sessão** — não a
 * service role. Assim a gravação sai em nome de quem clicou: a trigger de
 * `evento` registra o ator (`auth.uid()`), e quando `db/003_rls.sql` for
 * aplicado as policies de master continuam valendo sem mudar nada aqui.
 *
 * Só leitura e INSERT com `ignoreDuplicates` (ON CONFLICT DO NOTHING).
 */

/** Chave do ON CONFLICT de cada filho. Sem entrada = INSERT simples. */
const CONFLITO: Partial<Record<TabelaFilha, string>> = {
  fornecedor_tipo_operacao: 'fornecedor_id,tipo_operacao_id,papel',
  cliente_email: 'cliente_id,email',
  cliente_visualizador: 'cliente_id,perfil_id',
  operacao_declinio: 'operacao_id,fornecedor_id',
  etapa_instrumento: 'etapa_id,tipo_operacao_id',
  etapa_checklist_item: 'etapa_id,chave',
  funil_cartao_tag: 'cartao_id,tag_id',
  funil_cartao_usuario: 'cartao_id,perfil_id',
  // operacao_observacao não tem chave natural; só entra para operação nova.
};

const PAGINA = 1000;
const LOTE = 500;

function falhou(tabela: string, erro: { message: string } | null): void {
  if (erro) throw new Error(`${tabela}: ${erro.message}`);
}

function lotes<T>(linhas: T[]): T[][] {
  const saida: T[][] = [];
  for (let i = 0; i < linhas.length; i += LOTE) saida.push(linhas.slice(i, i + LOTE));
  return saida;
}

export function bancoSupabase(supabase: SupabaseClient): Banco {
  /** Lê uma tabela inteira, de 1000 em 1000 (o teto do PostgREST). */
  async function tudo<T>(tabela: string, colunas: string, filtrarBubble = false): Promise<T[]> {
    const saida: T[] = [];
    for (let de = 0; ; de += PAGINA) {
      let q = supabase.from(tabela).select(colunas);
      if (filtrarBubble) q = q.not('bubble_id', 'is', null);
      const { data, error } = await q.order('id').range(de, de + PAGINA - 1);
      falhou(tabela, error);
      const linhas = (data ?? []) as T[];
      saida.push(...linhas);
      if (linhas.length < PAGINA) return saida;
    }
  }

  return {
    async idsPorBubble(tabela: TabelaComBubble): Promise<Mapa> {
      const linhas = await tudo<{ id: string; bubble_id: string }>(tabela, 'id, bubble_id', true);
      return new Map(linhas.map((l) => [l.bubble_id, l.id]));
    },

    async catalogo(tabela): Promise<Mapa<number>> {
      const linhas = await tudo<{ id: number; rotulo: string }>(tabela, 'id, rotulo');
      return new Map(linhas.map((l) => [l.rotulo, l.id]));
    },

    async perfisPorEmail(): Promise<Mapa> {
      const linhas = await tudo<{ id: string; email: string | null }>('perfil', 'id, email');
      return new Map(
        linhas.filter((l) => l.email).map((l) => [(l.email as string).toLowerCase(), l.id]),
      );
    },

    async quadros(): Promise<Mapa> {
      const linhas = await tudo<{ id: string; nome: string }>('funil_quadro', 'id, nome');
      return new Map(linhas.map((l) => [l.nome, l.id]));
    },

    async inserirQuadros(nomes: string[]): Promise<Mapa> {
      const { data, error } = await supabase
        .from('funil_quadro')
        .upsert(
          nomes.map((nome) => ({ nome })),
          { onConflict: 'nome', ignoreDuplicates: true },
        )
        .select('id, nome');
      falhou('funil_quadro', error);
      return new Map(((data ?? []) as Array<{ id: string; nome: string }>).map((l) => [l.nome, l.id]));
    },

    async inserirNovos(tabela: TabelaComBubble, linhas: Linha[]): Promise<Mapa> {
      const entraram: Mapa = new Map();
      for (const lote of lotes(linhas)) {
        const { data, error } = await supabase
          .from(tabela)
          .upsert(lote, { onConflict: 'bubble_id', ignoreDuplicates: true })
          .select('id, bubble_id');
        falhou(tabela, error);
        for (const l of (data ?? []) as Array<{ id: string; bubble_id: string }>) {
          entraram.set(l.bubble_id, l.id);
        }
      }
      return entraram;
    },

    async inserirFilhos(tabela: TabelaFilha, linhas: Linha[]): Promise<number> {
      let total = 0;
      const conflito = CONFLITO[tabela];
      for (const lote of lotes(linhas)) {
        const base = supabase.from(tabela);
        const { data, error } = await (conflito
          ? base.upsert(lote, { onConflict: conflito, ignoreDuplicates: true })
          : base.insert(lote)
        ).select();
        falhou(tabela, error);
        total += data?.length ?? 0;
      }
      return total;
    },
  };
}
