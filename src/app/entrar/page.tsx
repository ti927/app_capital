import { Suspense } from 'react';
import { FormularioDeEntrada } from './formulario';

export const metadata = { title: 'Entrar · Lure Capital' };

export default function PaginaEntrar() {
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
          <p className="entrada__tagline">Organize potencial em resultados.</p>
        </div>
      </section>

      <section className="entrada__forma">
        <Suspense fallback={null}>
          <FormularioDeEntrada />
        </Suspense>
      </section>
    </main>
  );
}
