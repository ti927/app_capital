'use client';

import { usePathname } from 'next/navigation';

/**
 * Entrada do conteúdo a cada troca de tela.
 *
 * O `key` no caminho é o truque inteiro: quando a rota muda, o React desmonta
 * e remonta este nó, e a animação de entrada roda de novo. A casca em volta
 * (app bar e navegação lateral) não se mexe — só a área que trocou de fato.
 *
 * Não segura navegação: a animação é do CSS, começa quando o conteúdo já está
 * montado. Quem pediu `prefers-reduced-motion` não recebe nenhuma (animacoes.css).
 */
export function Transicao({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();
  return (
    <div key={caminho} className="transicao">
      {children}
    </div>
  );
}
