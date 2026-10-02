import { Autorizacao } from './autorizacao';

export const metadata = { title: 'Autorizar acesso · Lure Capital' };

/**
 * Tela de consentimento do OAuth 2.1 do Supabase (specs/12). O caminho é o que
 * está em Authentication → OAuth Server → Authorization Path. O middleware já
 * garantiu o login: quem chega aqui sem sessão vai para /entrar e volta.
 */
export default async function PaginaConsentimento({
  searchParams,
}: {
  searchParams: Promise<{ authorization_id?: string }>;
}) {
  const { authorization_id } = await searchParams;
  return (
    <main className="entrada entrada--sozinha">
      <section className="entrada__forma">
        <Autorizacao autorizacaoId={authorization_id ?? null} />
      </section>
    </main>
  );
}
