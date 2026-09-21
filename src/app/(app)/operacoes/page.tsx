import { redirect } from 'next/navigation';
import { clienteServidor } from '@/lib/supabase/servidor';
import { perfilAtual } from '@/lib/perfil';
import type { EtapaOperacao, Fornecedor, Operacao, TabelaApoio } from '@/lib/dominio';
import { TelaOperacoes } from './tela';

export const metadata = { title: 'Operação · Lure Capital' };

const CAMPOS =
  'id, identificador, cliente_id, status_operacao_id, demanda_inicial, demanda_final, ' +
  'destino_recurso, faturamento_anual, garantias_sugeridas, limites_fundos_assinados, prazo, ' +
  'carencia, pmts, comissao, parecer, tem_fee, nda_assinado, mandato_assinado, ' +
  'mandato_assinado_fornecedor, estruturacao_em_andamento, arquivado';

export interface ClienteResumo {
  id: string;
  nome_razao: string;
}
export interface Observacao {
  id: number;
  operacao_id: string;
  texto: string;
  criado_em: string;
}
export interface Declinio {
  operacao_id: string;
  fornecedor_id: string;
}
export interface Visualizador {
  cliente_id: string;
  perfil_id: string;
}

export default async function PaginaOperacoes() {
  const supabase = await clienteServidor();

  /**
   * As doze consultas saem ANTES de esperar o perfil — ver a nota em
   * `fornecedores/page.tsx`. Nenhuma depende dele, e o perfil custa duas idas
   * ao Supabase em série (~90ms) que antes corriam na frente do banco em vez
   * de junto com ele.
   */
  const pedidos = Promise.all([
    supabase.from('operacao').select(CAMPOS).eq('arquivado', false).order('identificador'),
    supabase.from('operacao').select(CAMPOS).eq('arquivado', true).order('identificador'),
    supabase.from('cliente').select('id, nome_razao').order('nome_razao'),
    supabase.from('fornecedor').select('id, nome_fundo').eq('arquivado', false).order('nome_fundo'),
    supabase.from('tipo_operacao').select('id, chave, rotulo, ordem').order('ordem'),
    supabase.from('status_etapa').select('id, chave, rotulo, ordem').order('ordem'),
    supabase.from('status_operacao').select('id, chave, rotulo, ordem').order('ordem'),
    supabase
      .from('etapa_operacao')
      .select(
        'id, operacao_id, cliente_id, fornecedor_id, status_id, tipo_operacao_id, na_mao_de, ' +
          'dt_inicio, volume, administrador, assessoria_legal, gestor, atualizado_em',
      ),
    supabase.from('operacao_observacao').select('id, operacao_id, texto, criado_em').order('criado_em'),
    supabase.from('operacao_declinio').select('operacao_id, fornecedor_id'),
    supabase.from('perfil').select('id, nome').eq('ativo', true),
    supabase.from('cliente_visualizador').select('cliente_id, perfil_id'),
  ]);
  pedidos.catch(() => {});

  const perfil = await perfilAtual();
  if (perfil.nivel_acesso !== 'master') redirect('/clientes');

  const [
    ativas,
    arquivadas,
    clientes,
    fornecedores,
    tipos,
    statusEtapa,
    statusOperacao,
    etapas,
    observacoes,
    declinios,
    perfis,
    visualizadores,
  ] = await pedidos;

  return (
    <TelaOperacoes
      operacoes={(ativas.data ?? []) as unknown as Operacao[]}
      arquivadas={(arquivadas.data ?? []) as unknown as Operacao[]}
      clientes={(clientes.data ?? []) as unknown as ClienteResumo[]}
      fornecedores={(fornecedores.data ?? []) as unknown as Array<Pick<Fornecedor, 'id' | 'nome_fundo'>>}
      tipos={(tipos.data ?? []) as unknown as TabelaApoio[]}
      statusEtapa={(statusEtapa.data ?? []) as unknown as TabelaApoio[]}
      statusOperacao={(statusOperacao.data ?? []) as unknown as TabelaApoio[]}
      etapas={(etapas.data ?? []) as unknown as EtapaOperacao[]}
      observacoes={(observacoes.data ?? []) as unknown as Observacao[]}
      declinios={(declinios.data ?? []) as unknown as Declinio[]}
      perfis={(perfis.data ?? []) as unknown as Array<{ id: string; nome: string }>}
      visualizadores={(visualizadores.data ?? []) as unknown as Visualizador[]}
    />
  );
}
