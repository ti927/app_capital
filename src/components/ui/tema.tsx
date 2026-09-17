'use client';

import { useEffect, useState } from 'react';
import { IconeTemaClaro, IconeTemaEscuro } from './icones';

export type Tema = 'claro' | 'escuro';

const CHAVE = 'lure-tema';

/**
 * Roda antes da primeira pintura, no `<head>`: lê a preferência salva e põe
 * `data-theme` no `<html>`. Sem isso a página pisca no tema errado antes do
 * React assumir.
 *
 * Os tokens já respondem a `[data-theme]` e a `prefers-color-scheme` — ver
 * src/app/tokens.css, gerado de design/design-system/tokens.json.
 */
export const SCRIPT_TEMA = `(function(){try{
  var t = localStorage.getItem('${CHAVE}');
  if (t === 'claro' || t === 'escuro') {
    document.documentElement.setAttribute('data-theme', t === 'escuro' ? 'dark' : 'light');
  }
}catch(e){}})();`;

/** Alterna claro e escuro e guarda a escolha. Sem escolha, segue o sistema. */
export function BotaoDeTema() {
  const [tema, setTema] = useState<Tema | null>(null);

  useEffect(() => {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo === 'claro' || salvo === 'escuro') {
      setTema(salvo);
      return;
    }
    // Sem escolha guardada: espelha o sistema, para o ícone não mentir.
    setTema(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro');
  }, []);

  function alternar() {
    const novo: Tema = tema === 'escuro' ? 'claro' : 'escuro';
    setTema(novo);
    localStorage.setItem(CHAVE, novo);
    document.documentElement.setAttribute('data-theme', novo === 'escuro' ? 'dark' : 'light');
  }

  // Até saber o tema, renderiza o botão sem ícone: evita trocar de forma na
  // hidratação.
  return (
    <button
      type="button"
      className="lc-btn lc-btn--tertiary lc-btn--sm casca__acao"
      onClick={alternar}
      title={tema === 'escuro' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      aria-label={tema === 'escuro' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
    >
      {tema === null ? (
        <span style={{ width: 16, height: 16, display: 'block' }} />
      ) : tema === 'escuro' ? (
        <IconeTemaClaro tamanho={16} />
      ) : (
        <IconeTemaEscuro tamanho={16} />
      )}
      <span className="casca__acao-rotulo">Tema</span>
    </button>
  );
}
