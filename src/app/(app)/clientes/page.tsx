import { clienteServidor } from '@/lib/supabase/servidor';
import { perfilAtual } from '@/lib/perfil';
import type { Cliente } from '@/lib/dominio';
import { TelaClientes, type CartaoDoFunil } from './tela';

export const metadata = { title: 'Cliente · Lure Capital' };

const CAMPOS =
  'id, nome_razao, cnpj, cidade, telefone, email, atividade_cia, diretor_gerente, ' +
  'faturamento_anual, estimativa_faturamento, margem_liquida, passivo_oneroso, ativos, ' +
  'demanda, info_adicionais, parecer, status, quem_indicou, arquivado';

export default async function PaginaClientes() {
  const perfil = await perfilAtual();
  const supabase = await clienteServidor();

  // Recorte por nível. Hoje é feito aqui porque a RLS está desligada; quando
  // db/003_rls.sql for aplicado o banco garante o mesmo e isto continua válido.
  let visiveis: string[] | null = null;
  if (perfil.nivel_acesso !== 'master') {
    const { data } = await supabase
      .from('cliente_visualizador')
      .select('cliente_id')
      .eq('perfil_id', perfil.id);
    visiveis = (data ?? []).map((v) => v.cliente_id as string);
  }

  const base = () => {
    const q = supabase.from('cliente').select(CAMPOS).order('nome_razao');
    return visiveis ? q.in('id', visiveis.length ? visiveis : ['']) : q;
  };

  const [ativos, arquivados, emails, usuarios, vinculos, cartoes] = await Promise.all([
    base().eq('arquivado', false),
    perfil.nivel_acesso === 'master' ? base().eq('arquivado', true) : Promise.resolve({ data: [] }),
    supabase.from('cliente_email').select('id, cliente_id, email').order('email'),
    supabase.from('perfil').select('id, nome').eq('ativo', true).order('nome'),
    supabase.from('cliente_visualizador').select('cliente_id, perfil_id'),
    // "Puxar do funil": só os cartões que ainda não viraram cliente.
    supabase
      .from('funil_cartao')
      .select('id, empresa, contato, segmento, faturamento, indicante, parecer')
      .is('cliente_id', null)
      .eq('arquivado', false)
      .order('empresa'),
  ]);

  return (
    <TelaClientes
      nivel={perfil.nivel_acesso}
      clientes={(ativos.data ?? []) as unknown as Cliente[]}
      arquivados={(arquivados.data ?? []) as unknown as Cliente[]}
      emails={(emails.data ?? []) as unknown as Array<{ id: number; cliente_id: string; email: string }>}
      usuarios={(usuarios.data ?? []) as unknown as Array<{ id: string; nome: string }>}
      vinculos={(vinculos.data ?? []) as unknown as Array<{ cliente_id: string; perfil_id: string }>}
      cartoesDoFunil={(cartoes.data ?? []) as unknown as CartaoDoFunil[]}
    />
  );
}
