'use server';

import { revalidatePath } from 'next/cache';
import { clienteServidor } from '@/lib/supabase/servidor';
import { perfilAtual } from '@/lib/perfil';
import { emailValido, montarEmailDeStatus, type Incluir } from '@/lib/email/status-operacao';
import { enviar, ErroDeEnvio, faltaConfigurar } from '@/lib/email/resend';

const texto = (dados: FormData, chave: string) => {
  const v = String(dados.get(chave) ?? '').trim();
  return v === '' ? null : v;
};
const marcado = (dados: FormData, chave: string) => dados.get(chave) === 'on';
const numero = (dados: FormData, chave: string) => {
  const v = String(dados.get(chave) ?? '');
  return v === '' ? null : Number(v);
};

export async function gravarOperacao(_anterior: unknown, dados: FormData) {
  const supabase = await clienteServidor();
  const id = String(dados.get('id') ?? '');

  const campos = {
    identificador: texto(dados, 'identificador'),
    cliente_id: texto(dados, 'cliente_id'),
    status_operacao_id: numero(dados, 'status_operacao_id'),
    garantias_sugeridas: texto(dados, 'garantias_sugeridas'),
    limites_fundos_assinados: texto(dados, 'limites_fundos_assinados'),
    pmts: texto(dados, 'pmts'),
    prazo: texto(dados, 'prazo'),
    carencia: texto(dados, 'carencia'),
    demanda_inicial: texto(dados, 'demanda_inicial'),
    demanda_final: texto(dados, 'demanda_final'),
    destino_recurso: texto(dados, 'destino_recurso'),
    faturamento_anual: texto(dados, 'faturamento_anual'),
    comissao: texto(dados, 'comissao'),
    parecer: texto(dados, 'parecer'),
    tem_fee: marcado(dados, 'tem_fee'),
    nda_assinado: marcado(dados, 'nda_assinado'),
    mandato_assinado: marcado(dados, 'mandato_assinado'),
    mandato_assinado_fornecedor: marcado(dados, 'mandato_assinado_fornecedor'),
    estruturacao_em_andamento: marcado(dados, 'estruturacao_em_andamento'),
  };

  let alvo = id;
  if (id) {
    const { error } = await supabase.from('operacao').update(campos).eq('id', id);
    if (error) return { erro: 'Não consegui salvar. Tente de novo.' };
  } else {
    const { data, error } = await supabase.from('operacao').insert(campos).select('id').single();
    if (error || !data) return { erro: 'Não consegui cadastrar. Tente de novo.' };
    alvo = data.id as string;
  }

  /*
    "Parecer do cliente": no Bubble o ipt.parecercliente do diálogo de operação
    grava em `cliente.parecer` (documentacao-completa.md:2105–2120). O campo só
    vai no formulário quando a operação tem cliente — sem ele, nada a gravar.
  */
  if (dados.has('parecer_cliente') && campos.cliente_id) {
    // O navegador envia <textarea> com CRLF; sem normalizar, abrir e salvar sem
    // mexer reescrevia o parecer do cliente (e o log registrava mudança falsa).
    const parecerCliente = texto(dados, 'parecer_cliente')?.replace(/\r\n/g, '\n') ?? null;
    const { error } = await supabase
      .from('cliente')
      .update({ parecer: parecerCliente })
      .eq('id', campos.cliente_id);
    if (error) return { erro: 'Salvei a operação, mas não o parecer do cliente. Tente de novo.' };
  }

  // Declínios: regrava o conjunto inteiro.
  const declinios = dados.getAll('declinios').map(String).filter(Boolean);
  await supabase.from('operacao_declinio').delete().eq('operacao_id', alvo);
  if (declinios.length) {
    await supabase
      .from('operacao_declinio')
      .insert(declinios.map((fornecedor_id) => ({ operacao_id: alvo, fornecedor_id })));
  }

  revalidatePath('/operacoes');
  revalidatePath('/clientes');
  return { ok: true, id: alvo };
}

export async function arquivarOperacao(id: string, arquivado: boolean) {
  const supabase = await clienteServidor();
  await supabase.from('operacao').update({ arquivado }).eq('id', id);
  revalidatePath('/operacoes');
}

export async function excluirOperacao(id: string) {
  const supabase = await clienteServidor();
  await supabase.from('operacao').delete().eq('id', id);
  revalidatePath('/operacoes');
}

/* ------------------------------------------------------------ observações -- */

export async function adicionarObservacao(operacaoId: string, texto: string) {
  const limpo = texto.trim();
  if (!limpo) return;
  const perfil = await perfilAtual();
  const supabase = await clienteServidor();
  await supabase
    .from('operacao_observacao')
    .insert({ operacao_id: operacaoId, texto: limpo, autor_id: perfil.id });
  revalidatePath('/operacoes');
}

export async function excluirObservacao(id: number) {
  const supabase = await clienteServidor();
  await supabase.from('operacao_observacao').delete().eq('id', id);
  revalidatePath('/operacoes');
}

/* ------------------------------------------------------------------ etapas - */

export interface DadosEtapa {
  fornecedor_id: string | null;
  tipo_operacao_id: number | null;
  na_mao_de: string | null;
  status_id: number | null;
}

export async function criarEtapa(operacaoId: string, dados: DadosEtapa) {
  const supabase = await clienteServidor();
  const { data: operacao } = await supabase
    .from('operacao')
    .select('cliente_id')
    .eq('id', operacaoId)
    .single();

  await supabase.from('etapa_operacao').insert({
    operacao_id: operacaoId,
    cliente_id: operacao?.cliente_id ?? null,
    ...dados,
  });
  revalidatePath('/operacoes');
}

export async function atualizarEtapa(id: string, dados: DadosEtapa) {
  const supabase = await clienteServidor();
  await supabase.from('etapa_operacao').update(dados).eq('id', id);
  revalidatePath('/operacoes');
}

export async function excluirEtapa(id: string) {
  const supabase = await clienteServidor();
  await supabase.from('etapa_operacao').delete().eq('id', id);
  revalidatePath('/operacoes');
}

/* ------------------------------------------------------- e-mail de status */

/**
 * Os e-mails do cliente da operação — o "Multidropdown B" do Pop.email no
 * Bubble (`documentacao-completa.md:2037`): `cliente.email` mais os de
 * `cliente_email`, sem repetir.
 */
export async function emailsDaOperacao(operacaoId: string) {
  const supabase = await clienteServidor();
  const { data: op } = await supabase.from('operacao').select('cliente_id').eq('id', operacaoId).maybeSingle();
  if (!op?.cliente_id) return { emails: [] as string[], falta: faltaConfigurar() };

  const [{ data: cliente }, { data: extras }] = await Promise.all([
    supabase.from('cliente').select('email').eq('id', op.cliente_id).maybeSingle(),
    supabase.from('cliente_email').select('email').eq('cliente_id', op.cliente_id),
  ]);
  const todos = [cliente?.email, ...(extras ?? []).map((e) => e.email)]
    .map((e) => String(e ?? '').trim().toLowerCase())
    .filter(emailValido);
  return { emails: [...new Set(todos)], falta: faltaConfigurar() };
}

/**
 * "Enviar" do Pop.email (`documentacao-completa.md:2243`), em specs/13-email.md:
 * um envio para os e-mails do cliente com cópia oculta fixa para o Maicon, e
 * — se houver — outro para o destinatário adicional, com resposta indo para o
 * Maicon. Só master: o botão já some para o indicante, e a ação confere de novo.
 */
export async function enviarEmailDeStatus(entrada: {
  operacaoId: string;
  destinatarios: string[];
  extra: string;
  texto: string;
  incluir: Incluir;
}): Promise<{ ok?: true; erro?: string }> {
  const perfil = await perfilAtual();
  if (perfil.nivel_acesso !== 'master') return { erro: 'Só master envia e-mail de status.' };

  const texto = entrada.texto.trim();
  if (!texto) return { erro: 'Escreva o texto do e-mail.' };
  const extra = entrada.extra.trim().toLowerCase();
  if (extra && !emailValido(extra)) return { erro: 'O destinatário adicional não é um e-mail válido.' };

  // Destinatário do cliente só pode ser um e-mail cadastrado do cliente.
  const { emails } = await emailsDaOperacao(entrada.operacaoId);
  const para = entrada.destinatarios.map((e) => e.trim().toLowerCase()).filter((e) => emails.includes(e));
  if (!para.length && !extra) return { erro: 'Escolha ao menos um destinatário.' };

  const supabase = await clienteServidor();
  const [{ data: op }, { data: obs }, { data: etapas }] = await Promise.all([
    supabase.from('operacao').select('identificador, cliente(nome_razao)').eq('id', entrada.operacaoId).maybeSingle(),
    supabase.from('operacao_observacao').select('texto, criado_em').eq('operacao_id', entrada.operacaoId).order('criado_em'),
    supabase
      .from('etapa_operacao')
      .select('na_mao_de, atualizado_em, fornecedor(nome_fundo), tipo_operacao(rotulo), status_etapa(rotulo)')
      .eq('operacao_id', entrada.operacaoId),
  ]);
  if (!op) return { erro: 'Operação não encontrada.' };

  const nome = <T,>(v: unknown, campo: keyof T) => ((v as T | null)?.[campo] as string | undefined) ?? null;
  const email = montarEmailDeStatus({
    texto,
    cliente: nome<{ nome_razao: string }>(op.cliente, 'nome_razao'),
    identificador: (op.identificador as string | null) ?? null,
    observacoes: (obs ?? []).map((o) => ({ texto: o.texto as string, criadoEm: o.criado_em as string })),
    etapas: (etapas ?? [])
      .map((e) => ({
        fundo: nome<{ nome_fundo: string }>(e.fornecedor, 'nome_fundo') ?? 'Sem fundo',
        tipo: nome<{ rotulo: string }>(e.tipo_operacao, 'rotulo'),
        status: nome<{ rotulo: string }>(e.status_etapa, 'rotulo'),
        naMaoDe: (e.na_mao_de as string | null) ?? null,
        atualizadoEm: (e.atualizado_em as string | null) ?? null,
      }))
      .sort((a, b) => a.fundo.localeCompare(b.fundo, 'pt-BR')),
    incluir: entrada.incluir,
  });

  const copia = process.env.EMAIL_COPIA_OCULTA?.trim();
  try {
    if (para.length) {
      await enviar({ ...email, para, copiaOculta: copia ? [copia] : undefined });
    }
    if (extra) {
      await enviar({ ...email, para: [extra], responderPara: copia || undefined });
    }
  } catch (e) {
    return { erro: `Não consegui enviar: ${e instanceof ErroDeEnvio ? e.message : 'erro inesperado'}.` };
  }
  return { ok: true };
}
