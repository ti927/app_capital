/**
 * Logos do Google Agenda e do Google Drive, nas cores deles — os únicos
 * ícones coloridos do produto, porque são marca de terceiro e é por eles que
 * a pessoa reconhece o serviço (Conexões, ícone da tarefa no funil).
 * Decorativos: quem precisa de nome acessível põe no botão que os envolve.
 */

export function LogoGoogleAgenda({ tamanho = 16 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M18 2H6a4 4 0 0 0-4 4v12a4 4 0 0 0 4 4h12z" fill="#fff" />
      <path d="M2 6a4 4 0 0 1 4-4h12v4H2z" fill="#1A73E8" />
      <path d="M18 2a4 4 0 0 1 4 4v12h-4z" fill="#FBBC04" />
      <path d="M18 18h4a4 4 0 0 1-4 4z" fill="#EA4335" />
      <path d="M2 18h16v4H6a4 4 0 0 1-4-4z" fill="#34A853" />
      <path d="M2 6h4v12H2z" fill="#4285F4" />
      <text x="12" y="15.5" textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="Arial, sans-serif" fill="#1A73E8">
        31
      </text>
    </svg>
  );
}

export function LogoGoogleDrive({ tamanho = 16 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 87.3 78" aria-hidden="true" focusable="false">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066DA" />
      <path d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A9.06 9.06 0 0 0 0 53h27.5z" fill="#00AC47" />
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 11.5z" fill="#EA4335" />
      <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832D" />
      <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684FC" />
      <path d="M73.4 26.5 60.7 4.5c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#FFBA00" />
    </svg>
  );
}
