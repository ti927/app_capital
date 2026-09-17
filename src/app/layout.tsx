import type { Metadata, Viewport } from 'next';
import { Archivo, IBM_Plex_Mono } from 'next/font/google';
import { SCRIPT_TEMA } from '@/components/ui/tema';
import './globals.css';
import './interface.css';

// Archivo é a substituição web de Akkurat/FLAMA, já decidida no design system.
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--fonte-sans',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--fonte-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Lure Capital',
  description: 'Estruturação de operações de crédito.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f5' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0d0d' },
  ],
};

export default function LayoutRaiz({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Antes da primeira pintura, para a pagina nao piscar no tema errado. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
