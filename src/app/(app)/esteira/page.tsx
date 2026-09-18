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

type OperacaoResumo = Pick<Operacao, 'id' | 'identificador' | 'cliente_id'>;

export default async function PaginaEsteira() {
  const perfil = await perfilAtual();
  if (perfil.nivel_acesso !== 'master') redirect('/clientes');

  const supabase = await clienteServidor();

  const [operacoes, clientes, fornecedores, tipos, etapas, checklist, instrumentos] = await Promise.all([
    /**
     * A esteira é só o que está em estruturação — o toggle da operação manda
     * (documentacao-completa.md:1611). Sem ele a tela listava toda operação
     * não arquivada.
     */
    supabase
      .from('operacao')
      .select('id, identificador, cliente_id')
      .eq('arquivado', false)
      .eq('estruturacao_em_andamento', true),
    supabase.from('cliente').select('id, nome_razao'),
    supabase.from('fornecedor').select('id, nome_fundo'),
    supabase.from('tipo_operacao').select('id, chave, rotulo, ordem').order('ordem'),
    supabase.from('etapa_operacao').select(CAMPOS_ETAPA),
    supabase.from('etapa_checklist_item').select('id, etapa_id, chave, rotulo, descricao, valor, ordem'),
    supabase.from('etapa_instrumento').select('etapa_id, tipo_operacao_id'),
  ]);

  const listaClientes = (clientes.data ?? []) as unknown as Array<{ id: string; nome_razao: string }>;
  const nomeCliente = new Map(listaClientes.map((c) => [c.id, c.nome_razao]));

  /**
   * A lista mostra o nome do cliente, então é por ele que ordena — não pelo
   * identificador. A ordenação fica aqui, e não na consulta, porque o nome
   * está na outra tabela.
   */
  const emEstruturacao = ((operacoes.data ?? []) as unknown as OperacaoResumo[])
    .slice()
    .sort((a, b) => {
      const na = (a.cliente_id && nomeCliente.get(a.cliente_id)) || a.identificador || '';
      const nb = (b.cliente_id && nomeCliente.get(b.cliente_id)) || b.identificador || '';
      return na.localeCompare(nb, 'pt-BR');
    });

  return (
    <TelaEsteira
      operacoes={emEstruturacao}
      clientes={listaClientes}
      fornecedores={(fornecedores.data ?? []) as unknown as Array<{ id: string; nome_fundo: string }>}
      tipos={(tipos.data ?? []) as unknown as TabelaApoio[]}
      etapas={(etapas.data ?? []) as unknown as EtapaEsteira[]}
      checklist={(checklist.data ?? []) as unknown as ItemChecklist[]}
      instrumentos={(instrumentos.data ?? []) as unknown as Array<{ etapa_id: string; tipo_operacao_id: number }>}
    />
  );
}
