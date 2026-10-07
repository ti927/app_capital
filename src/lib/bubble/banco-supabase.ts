import type { SupabaseClient } from '@supabase/supabase-js';
import type { Linha, Mapa } from './mapeamento';
import {
  FILHAS,
  type Banco,
  type TabelaArquivavel,
  type TabelaComBubble,
  type TabelaFilha,
} from './sincronizar';

/**
 * `Banco` da sincronização sobre o cliente Supabase **da sessão** — não a
 * service role. Assim a gravação sai em nome de quem clicou: a trigger de
 * `evento` registra o ator (`auth.uid()`), e as policies de master (db/009)
 * continuam valendo sem mudar nada aqui.
 *
 * Escreve só o que a regra de espelho pede (specs/10): INSERT do que falta,
 * UPDATE por `id` das colunas que mudaram, `arquivado = true` no que sumiu do
 * Bubble e, nos filhos marcados `origem_bubble`, o DELETE do que saiu de lá.
 * Nunca apaga registro-pai.
 */

/** Chave do ON CONFLICT de cada filho (sempre a chave natural, com o pai). */
function conflito(tabela: TabelaFilha): string {
  const cfg = FILHAS[tabela];
  return tabela === 'operacao_observacao' ? 'id' : [cfg.pai, ...cfg.chave].join(',');
}

const PAGINA = 1000;
const LOTE = 500;
/** Quantos pais por consulta `in (...)`: uuid tem 36 caracteres e a URL tem teto. */
const PAIS_POR_CONSULTA = 100;
/** Quantos UPDATEs em paralelo. */
const PARALELO = 10;

function falhou(tabela: string, erro: { message: string } | null): void {
  if (erro) throw new Error(`${tabela}: ${erro.message}`);
}

function lotes<T>(linhas: T[], tamanho = LOTE): T[][] {
  const saida: T[][] = [];
  for (let i = 0; i < linhas.length; i += tamanho) saida.push(linhas.slice(i, i + tamanho));
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
    async atuais(tabela: TabelaComBubble): Promise<Mapa<Linha>> {
      const linhas = await tudo<Linha & { bubble_id: string }>(tabela, '*', true);
      return new Map(linhas.map((l) => [l.bubble_id, l]));
    },

    async atualizar(tabela, mudancas): Promise<number> {
      let total = 0;
      for (const grupo of lotes(mudancas, PARALELO)) {
        await Promise.all(
          grupo.map(async ({ id, valores }) => {
            const { error } = await supabase.from(tabela).update(valores).eq('id', id);
            falhou(tabela, error);
            total += 1;
          }),
        );
      }
      return total;
    },

    async arquivar(tabela: TabelaArquivavel, ids: string[]): Promise<number> {
      let total = 0;
      for (const lote of lotes(ids, PAIS_POR_CONSULTA)) {
        const { data, error } = await supabase
          .from(tabela)
          .update({ arquivado: true })
          .in('id', lote)
          .select('id');
        falhou(tabela, error);
        total += data?.length ?? 0;
      }
      return total;
    },

    async filhosDe(tabela: TabelaFilha, paiIds: string[]): Promise<Linha[]> {
      const cfg = FILHAS[tabela];
      const saida: Linha[] = [];
      for (const lote of lotes(paiIds, PAIS_POR_CONSULTA)) {
        for (let de = 0; ; de += PAGINA) {
          let q = supabase.from(tabela).select('*').in(cfg.pai, lote);
          // ordem estável: a das observações repetidas depende dela
          q = cfg.temId ? q.order('id') : q.order(cfg.pai).order(cfg.chave[0]);
          const { data, error } = await q.range(de, de + PAGINA - 1);
          falhou(tabela, error);
          const linhas = (data ?? []) as unknown as Linha[];
          saida.push(...linhas);
          if (linhas.length < PAGINA) break;
        }
      }
      return saida;
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
      for (const lote of lotes(linhas)) {
        const base = supabase.from(tabela);
        // observação não tem chave natural: INSERT simples (a reconciliação já checou)
        const { data, error } = await (tabela === 'operacao_observacao'
          ? base.insert(lote)
          : base.upsert(lote, { onConflict: conflito(tabela), ignoreDuplicates: true })
        ).select();
        falhou(tabela, error);
        total += data?.length ?? 0;
      }
      return total;
    },

    async atualizarFilhos(tabela: TabelaFilha, linhas: Linha[]): Promise<number> {
      let total = 0;
      for (const lote of lotes(linhas)) {
        const { data, error } = await supabase
          .from(tabela)
          .upsert(lote, { onConflict: conflito(tabela) })
          .select();
        falhou(tabela, error);
        total += data?.length ?? 0;
      }
      return total;
    },

    async removerFilhos(tabela: TabelaFilha, linhas: Linha[]): Promise<number> {
      const cfg = FILHAS[tabela];
      let total = 0;
      if (cfg.temId) {
        for (const lote of lotes(linhas, PAIS_POR_CONSULTA)) {
          const { data, error } = await supabase
            .from(tabela)
            .delete()
            .in('id', lote.map((l) => l.id as string | number))
            .eq('origem_bubble', true)
            .select();
          falhou(tabela, error);
          total += data?.length ?? 0;
        }
        return total;
      }
      // chave composta: um DELETE por vínculo, sempre com origem_bubble = true
      for (const grupo of lotes(linhas, PARALELO)) {
        await Promise.all(
          grupo.map(async (l) => {
            const igual = Object.fromEntries([cfg.pai, ...cfg.chave].map((c) => [c, l[c]]));
            const { data, error } = await supabase
              .from(tabela)
              .delete()
              .match(igual)
              .eq('origem_bubble', true)
              .select();
            falhou(tabela, error);
            total += data?.length ?? 0;
          }),
        );
      }
      return total;
    },
  };
}
