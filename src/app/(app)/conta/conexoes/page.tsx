import { perfilAtual } from '@/lib/perfil';
import { estadoDe } from '@/lib/google/conexao';
import { estadoDoDrive } from '@/lib/google/drive';
import { PainelConexoes } from './painel';

export const metadata = { title: 'Conexões · Lure Capital' };

const ERROS: Record<string, string> = {
  oauth: 'O Google não concluiu a autorização. Tente de novo.',
  'sem-token': 'O Google não mandou a autorização permanente. Tente de novo — e, se pedir, marque todas as permissões.',
  gravar: 'A autorização veio, mas não consegui guardar. Tente de novo; se persistir, fale com o administrador.',
  'so-master': 'Só master conecta o Google Drive da empresa.',
};

/**
 * As ligações do app com o Google (specs/11 e specs/17): a agenda é de cada
 * pessoa; o Drive é um só, da empresa, e só o master vê o card dele.
 */
export default async function PaginaConexoes({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; de?: string; conectada?: string }>;
}) {
  const [perfil, { erro, de, conectada }] = await Promise.all([perfilAtual(), searchParams]);
  const ehMaster = perfil.nivel_acesso === 'master';
  const [agenda, drive] = await Promise.all([estadoDe(perfil.id), ehMaster ? estadoDoDrive() : null]);

  return (
    <PainelConexoes
      agenda={agenda}
      drive={drive}
      erro={erro ? { onde: de === 'drive' ? 'drive' : 'agenda', texto: ERROS[erro] ?? ERROS.oauth } : null}
      acabouDeConectar={conectada === 'drive' || conectada === 'agenda' ? conectada : null}
    />
  );
}
