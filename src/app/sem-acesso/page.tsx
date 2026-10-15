import { redirect } from 'next/navigation';
import { Botao } from '@/components/ui/base';
import { clienteServidor } from '@/lib/supabase/servidor';
import { sairEEntrarComOutraConta } from './acoes';

export const metadata = { title: 'Sem acesso · Lure Capital' };

/**
 * Para onde `perfilAtual` (src/lib/perfil.ts) manda quem tem sessão mas não tem
 * perfil ativo — em geral, uma conta Google diferente da cadastrada. Fica fora
 * de `(app)`: a casca chama `perfilAtual`, e daqui ela mandaria de volta para
 * cá. Sem sessão vai para o login; com perfil ativo, para o app.
 */
export default async function PaginaSemAcesso() {
  const supabase = await clienteServidor();
  const { data } = await supabase.auth.getUser();
  const usuario = data.user;
  if (!usuario) redirect('/entrar');

  const { data: perfil } = await supabase.from('perfil').select('ativo').eq('id', usuario.id).maybeSingle();
  if (perfil?.ativo) redirect('/clientes');

  return (
    <main className="entrada">
      <section className="entrada__marca" aria-hidden="true">
        <div className="entrada__marca-conteudo">
          <svg width="72" height="72" viewBox="0 0 48 48" fill="none">
            <rect x="18.5" y="3" width="11" height="12.5" rx="1.5" fill="var(--neutral-0)" />
            <rect x="18.5" y="32.5" width="11" height="12.5" rx="1.5" fill="var(--neutral-0)" />
            <rect x="3" y="18.5" width="12.5" height="11" rx="1.5" fill="var(--neutral-0)" />
            <rect x="32.5" y="18.5" width="12.5" height="11" rx="1.5" fill="var(--neutral-0)" />
            <rect x="18.5" y="18.5" width="11" height="11" rx="1.5" fill="var(--accent)" />
          </svg>
          <p className="entrada__assinatura">
            LURE <span className="entrada__chip">CAPITAL</span>
          </p>
        </div>
      </section>

      <section className="entrada__forma">
        <div className="entrada__caixa">
          <h1 className="t-public-title">Sem acesso</h1>
          <p className="t-public-subtitle apoio">
            A conta <strong>{usuario.email ?? 'usada'}</strong> não tem acesso ao Lure Capital
            {perfil ? ' — o acesso dela foi desativado' : ''}.
          </p>
          <p className="apoio">
            Se você usa outra conta Google na Lure, saia e entre com ela. Se esta é a conta certa, peça
            o acesso a um administrador.
          </p>
          <form action={sairEEntrarComOutraConta}>
            <Botao type="submit" variante="primary" tamanho="lg" className="entrada__google">
              Sair e entrar com outra conta
            </Botao>
          </form>
        </div>
      </section>
    </main>
  );
}
