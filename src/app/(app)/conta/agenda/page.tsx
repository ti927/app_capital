import { perfilAtual } from '@/lib/perfil';
import { estadoDe } from '@/lib/google/conexao';
import { PainelAgenda } from './painel';

export const metadata = { title: 'Agenda · Lure Capital' };

const ERROS: Record<string, string> = {
  oauth: 'O Google não concluiu a autorização. Tente de novo.',
  'sem-token':
    'O Google não mandou a autorização permanente. Tente de novo — e, se pedir, marque a permissão de agenda.',
  gravar: 'A autorização veio, mas não consegui guardar. Tente de novo; se persistir, fale com o administrador.',
};

/** Conectar o Google Agenda de quem está logado (specs/11-google-agenda.md). */
export default async function PaginaAgenda({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; conectada?: string }>;
}) {
  const [perfil, { erro, conectada }] = await Promise.all([perfilAtual(), searchParams]);
  const estado = await estadoDe(perfil.id);

  return (
    <PainelAgenda
      estado={estado}
      erro={erro ? (ERROS[erro] ?? ERROS.oauth) : null}
      acabouDeConectar={conectada === '1' && estado.conectado}
    />
  );
}
