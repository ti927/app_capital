'use client';

import { useRef, useState, useTransition } from 'react';
import { Menu } from './ui/seletor-popup';
import { IconeCliente } from './ui/icones';
import { useAvisos } from './ui/aviso';
import { entrarComo, voltarParaMinhaConta } from '@/lib/executar-como/acao';

/**
 * "Executar como" na barra, ao lado do nome (specs/15-executar-como.md). O
 * layout só monta isto para a conta de `EXECUTAR_COMO_EMAIL`; a ação no
 * servidor confere de novo.
 */
export function ExecutarComo({ pessoas }: { pessoas: Array<{ id: string; nome: string; nivel: string }> }) {
  const gatilho = useRef<HTMLButtonElement>(null);
  const [aberto, setAberto] = useState(false);
  const [indo, transicao] = useTransition();
  const { avisar } = useAvisos();

  return (
    <>
      <button
        ref={gatilho}
        type="button"
        className="lc-btn lc-btn--tertiary lc-btn--sm casca__acao executar-como__gatilho"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        title="Entrar como outra pessoa (teste)"
        aria-label="Entrar como outra pessoa"
        disabled={indo}
        onClick={() => setAberto((v) => !v)}
      >
        {indo ? <span className="lc-spinner" aria-hidden="true" /> : <IconeCliente tamanho={16} />}
      </button>
      <Menu
        aberto={aberto}
        gatilho={gatilho}
        rotulo="Entrar como"
        aoFechar={() => setAberto(false)}
        opcoes={pessoas.map((p) => ({ valor: p.id, rotulo: `${p.nome} · ${p.nivel === 'master' ? 'Master' : 'Indicante'}` }))}
        marcados={new Set()}
        aoEscolher={(id) => {
          setAberto(false);
          const nome = pessoas.find((p) => p.id === id)?.nome ?? '';
          avisar(`Entrando como ${nome}…`);
          transicao(async () => {
            const r = await entrarComo(id);
            if (r?.erro) avisar(r.erro, { tipo: 'erro' });
          });
        }}
      />
    </>
  );
}

/** Enquanto a sessão é de outra pessoa: quem é, e o caminho de volta. */
export function FaixaExecutandoComo({ nome }: { nome: string }) {
  return (
    <form action={voltarParaMinhaConta} className="executar-como__faixa" role="status">
      <IconeCliente tamanho={14} />
      <span>
        Testando como <strong>{nome}</strong>
      </span>
      <button type="submit" className="lc-btn lc-btn--secondary lc-btn--sm">
        Voltar para minha conta
      </button>
    </form>
  );
}
