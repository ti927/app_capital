import { redirect } from 'next/navigation';
import { clienteServidor } from '@/lib/supabase/servidor';
import { perfilAtual } from '@/lib/perfil';
import type { Operacao, TabelaApoio } from '@/lib/dominio';
import { TelaEsteira } from './tela';

export const metadata = { title: 'Esteira de Estruturação · Lure Capital' };

export interface EtapaEsteira {
  id: string;
  operacao_id: string;
  fornecedor_id: string | null;
  tipo_operacao_id: number | null;
  status_id: number | null;
  volume: string | null;
  dt_inicio: string | null;
  ts_assinado: boolean;
  op_de_pe: boolean;
  fee_recebido: boolean;
  gestor: string | null;
  administrador: string | null;
  dtvm: string | null;
  assessoria_legal: string | null;
  securitizadora: string | null;
  agente_fiduciario: string | null;
  custodiante: string | null;
  emissor: string | null;
  estruturador: string | null;
  demais: string | null;
}

export interface ItemChecklist {
  id: number;
  etapa_id: string;
  chave: string;
  rotulo: string;
  descricao: string | null;
  valor: number | null;
  ordem: number;
}

const CAMPOS_ETAPA =
  'id, operacao_id, fornecedor_id, tipo_operacao_id, status_id, volume, dt_inicio, ' +
  'ts_assinado, op_de_pe, fee_recebido, gestor, administrador, dtvm, assessoria_legal, ' +
  'securitizadora, agente_fiduciario, custodiante, emissor, estruturador, demais';

export default async function PaginaEsteira() {
  const perfil = await perfilAtual();
  if (perfil.nivel_acesso !== 'master') redirect('/clientes');

  const supabase = await clienteServidor();

  const [operacoes, clientes, fornecedores, tipos, etapas, checklist, instrumentos] = await Promise.all([
    supabase
      .from('operacao')
      .select('id, identificador, cliente_id, arquivado')
      .eq('arquivado', false)
      .order('identificador'),
    supabase.from('cliente').select('id, nome_razao'),
    supabase.from('fornecedor').select('id, nome_fundo'),
    supabase.from('tipo_operacao').select('id, chave, rotulo, ordem').order('ordem'),
    supabase.from('etapa_operacao').select(CAMPOS_ETAPA),
    supabase.from('etapa_checklist_item').select('id, etapa_id, chave, rotulo, descricao, valor, ordem'),
    supabase.from('etapa_instrumento').select('etapa_id, tipo_operacao_id'),
  ]);

  return (
    <TelaEsteira
      operacoes={(operacoes.data ?? []) as unknown as Array<Pick<Operacao, 'id' | 'identificador' | 'cliente_id'>>}
      clientes={(clientes.data ?? []) as unknown as Array<{ id: string; nome_razao: string }>}
      fornecedores={(fornecedores.data ?? []) as unknown as Array<{ id: string; nome_fundo: string }>}
      tipos={(tipos.data ?? []) as unknown as TabelaApoio[]}
      etapas={(etapas.data ?? []) as unknown as EtapaEsteira[]}
      checklist={(checklist.data ?? []) as unknown as ItemChecklist[]}
      instrumentos={(instrumentos.data ?? []) as unknown as Array<{ etapa_id: string; tipo_operacao_id: number }>}
    />
  );
}
