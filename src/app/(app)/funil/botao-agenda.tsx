'use client';

import { useState } from 'react';
import { useAvisos } from '@/components/ui/aviso';
import { LogoGoogleAgenda } from '@/components/ui/logos-google';
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

