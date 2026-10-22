'use client';

import { useState } from 'react';
import { useAvisos } from '@/components/ui/aviso';
import { linkModeloGoogle } from '@/lib/google/evento';
import { enviarTarefaParaMinhaAgenda } from './acoes';
import type { Tarefa } from './page';

/**
 * Ícone do Google Agenda na linha da tarefa (pedido de 22/10/2026): manda a
 * tarefa para a agenda de QUEM CLICOU — não do responsável, que já recebe o
 * evento dele pelo caminho de specs/11.
 *
 * Com a agenda conectada, um clique cria o evento direto. Sem conexão, o
 * ícone é um link que abre o Google Agenda com o evento preenchido, na conta
 * logada no navegador — a pessoa só aperta Salvar. Sem prazo não há quando
 * marcar: o ícone fica apagado e o `title` diz por quê.
 */
export function BotaoAgenda({
  tarefa,
  empresa,
  conectado,
}: {
  tarefa: Pick<Tarefa, 'id' | 'titulo' | 'descricao' | 'prazo' | 'hora'>;
  empresa: string | null;
  conectado: boolean;
}) {
  const { avisar } = useAvisos();
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);

  if (!tarefa.prazo) {
    return (
      <span className="botao-agenda botao-agenda--apagado" title="Defina um prazo para mandar para a agenda">
        <LogoGoogleAgenda />
      </span>
    );
  }

  if (!conectado) {
    // O link nasce no clique: o endereço do app só existe no navegador, e
    // montá-lo no render daria um href diferente no servidor (hidratação).
    return (
      <button
        type="button"
        className="botao-agenda"
        title="Abrir no Google Agenda (sua agenda não está conectada ao app)"
        aria-label={`Pôr ${tarefa.titulo} no Google Agenda`}
        onClick={() =>
          window.open(
            linkModeloGoogle(tarefa, { empresa, linkFunil: `${window.location.origin}/funil?aba=tarefas` }),
            '_blank',
            'noopener,noreferrer',
          )
        }
      >
        <LogoGoogleAgenda />
      </button>
    );
  }

  return (
    <button
      type="button"
      className={['botao-agenda', enviada && 'botao-agenda--enviada'].filter(Boolean).join(' ')}
      disabled={enviando}
      title={enviada ? 'Já foi para a sua agenda — clicar de novo cria outra cópia' : 'Mandar para a minha agenda do Google'}
      aria-label={`Mandar ${tarefa.titulo} para a minha agenda do Google`}
      onClick={async () => {
        setEnviando(true);
        const r = await enviarTarefaParaMinhaAgenda(tarefa.id);
        setEnviando(false);
        if (r.erro) {
          avisar(r.erro, { tipo: 'erro' });
          return;
        }
        setEnviada(true);
        avisar('Tarefa na sua agenda do Google');
      }}
    >
      <LogoGoogleAgenda />
    </button>
  );
}

/** O logo do Google Agenda, simplificado para 16px: o "31" no quadro de quatro cores. */
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
