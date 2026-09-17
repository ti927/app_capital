'use server';

import { revalidatePath } from 'next/cache';
import { clienteServidor } from '@/lib/supabase/servidor';

import { ITENS_CHECKLIST } from './checklist';

export async function gravarEtapaDaEsteira(_anterior: unknown, dados: FormData) {
  const supabase = await clienteServidor();
  const etapaId = String(dados.get('etapa_id') ?? '');
  if (!etapaId) return { erro: 'Escolha uma etapa antes de gravar.' };

  const texto = (chave: string) => {
    const v = String(dados.get(chave) ?? '').trim();
    return v === '' ? null : v;
  };

  const { error } = await supabase
    .from('etapa_operacao')
    .update({
      volume: texto('volume'),
      dt_inicio: texto('dt_inicio'),
      ts_assinado: dados.get('ts_assinado') === 'on',
      op_de_pe: dados.get('op_de_pe') === 'on',
      fee_recebido: dados.get('fee_recebido') === 'on',
      // Blocos condicionados pelo instrumento
      gestor: texto('gestor'),
      administrador: texto('administrador'),
      dtvm: texto('dtvm'),
      assessoria_legal: texto('assessoria_legal'),
      securitizadora: texto('securitizadora'),
      agente_fiduciario: texto('agente_fiduciario'),
      custodiante: texto('custodiante'),
      emissor: texto('emissor'),
      estruturador: texto('estruturador'),
      demais: texto('demais'),
    })
    .eq('id', etapaId);

  if (error) return { erro: 'Não consegui salvar. Tente de novo.' };

  // Instrumentos
  const instrumentos = dados.getAll('instrumento').map((v) => Number(v)).filter(Number.isFinite);
  await supabase.from('etapa_instrumento').delete().eq('etapa_id', etapaId);
  if (instrumentos.length) {
    await supabase
      .from('etapa_instrumento')
      .insert(instrumentos.map((tipo_operacao_id) => ({ etapa_id: etapaId, tipo_operacao_id })));
  }

  // Checklist: um upsert por item que tenha valor ou descrição.
  for (const [ordem, item] of ITENS_CHECKLIST.entries()) {
    const valorBruto = String(dados.get(`valor_${item.chave}`) ?? '');
    const descricao = String(dados.get(`desc_${item.chave}`) ?? '').trim() || null;
    const rotulo = item.livre
      ? String(dados.get(`rotulo_${item.chave}`) ?? '').trim() || null
      : item.rotulo;
    const valor = valorBruto === '' ? null : Number(valorBruto);

    if (valor === null && descricao === null && !rotulo) continue;

    await supabase.from('etapa_checklist_item').upsert(
      {
        etapa_id: etapaId,
        chave: item.chave,
        rotulo: rotulo ?? item.chave,
        descricao,
        valor,
        ordem: ordem + 1,
      },
      { onConflict: 'etapa_id,chave' },
    );
  }

  revalidatePath('/esteira');
  return { ok: true };
}

export async function acrescentarEtapa(operacaoId: string) {
  const supabase = await clienteServidor();
  const { data: operacao } = await supabase
    .from('operacao')
    .select('cliente_id')
    .eq('id', operacaoId)
    .single();

  await supabase
    .from('etapa_operacao')
    .insert({ operacao_id: operacaoId, cliente_id: operacao?.cliente_id ?? null });

  revalidatePath('/esteira');
}
