import { redirect } from 'next/navigation';
import { clienteServidor } from '@/lib/supabase/servidor';
import { perfilAtual } from '@/lib/perfil';
import type { Fornecedor, TabelaApoio } from '@/lib/dominio';
import { TelaFornecedores } from './tela';

export const metadata = { title: 'Fornecedor · Lure Capital' };

const CAMPOS =
  'id, nome_fundo, contato, email, numero, cidade, pf_ou_pj, status, segmento_foco, ' +
  'segmento_nao_atua, operacao_minima, faturamento_minimo, fee, parecer, link_indicacao, arquivado';

export interface VinculoTipo {
  fornecedor_id: string;
  tipo_operacao_id: number;
  papel: 'linha_1' | 'linha_2' | 'linha_3' | 'atende' | 'nao_atende';
}

export default async function PaginaFornecedores() {
  const perfil = await perfilAtual();
  // A tela inteira é de master: o indicante não vê fornecedores.
  if (perfil.nivel_acesso !== 'master') redirect('/clientes');

  const supabase = await clienteServidor();

  const [ativos, arquivados, tipos, vinculos] = await Promise.all([
    supabase.from('fornecedor').select(CAMPOS).eq('arquivado', false).order('nome_fundo'),
    supabase.from('fornecedor').select(CAMPOS).eq('arquivado', true).order('nome_fundo'),
    supabase.from('tipo_operacao').select('id, chave, rotulo, ordem').order('ordem'),
    supabase.from('fornecedor_tipo_operacao').select('fornecedor_id, tipo_operacao_id, papel'),
  ]);

  return (
    <TelaFornecedores
      fornecedores={(ativos.data ?? []) as unknown as Fornecedor[]}
      arquivados={(arquivados.data ?? []) as unknown as Fornecedor[]}
      tipos={(tipos.data ?? []) as unknown as TabelaApoio[]}
      vinculos={(vinculos.data ?? []) as unknown as VinculoTipo[]}
    />
  );
}
