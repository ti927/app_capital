'use client';

import { useState, useTransition } from 'react';
import { Botao } from '@/components/ui/base';
import { TopoDaTela } from '@/components/ui/casca';
import { clienteNavegador } from '@/lib/supabase/navegador';
import type { EstadoDaConexao } from '@/lib/google/conexao';
import { desconectarAgenda } from './acoes';

const ESCOPO_AGENDA = 'https://www.googleapis.com/auth/calendar.events';

/**
 * Conectar refaz o OAuth do Google pedindo, além do login, a permissão de
 * criar eventos — com `access_type=offline` (o app age quando a pessoa não
 * está na tela) e `prompt=consent` (sem isso o Google só manda o refresh
 * token na primeira vez da vida, e uma reconexão voltaria sem ele).
 */
export function PainelAgenda({
  estado,
  erro,
  acabouDeConectar,
}: {
  estado: EstadoDaConexao;
  erro: string | null;
  acabouDeConectar: boolean;
}) {
  const [indo, setIndo] = useState(false);
  const [desconectando, transicao] = useTransition();

  async function conectar() {
    setIndo(true);
    const { error } = await clienteNavegador().auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: ESCOPO_AGENDA,
        queryParams: { access_type: 'offline', prompt: 'consent' },
        redirectTo: `${window.location.origin}/auth/retorno?agenda=1`,
      },
    });
    if (error) setIndo(false);
  }

  return (
    <>
      <TopoDaTela titulo="Google Agenda" />

      <div className="conta__caixa pilha">
        <p className="apoio">
          Com a agenda conectada, toda tarefa do funil do tipo <strong>reunião</strong>, com data e
          hora, em que você é responsável vira um evento na sua agenda, com link do Google Meet.
          Editar ou excluir a tarefa atualiza o evento.
        </p>

        {acabouDeConectar ? (
          <div className="lc-notice lc-notice--neutral" role="status">
            <p className="lc-notice__title">Agenda conectada</p>
            <div className="lc-notice__body">
              As próximas tarefas de reunião já vão para a sua agenda. As que já existiam entram na
              próxima vez que forem salvas.
            </div>
          </div>
        ) : null}

        {erro ? (
          <p className="lc-field__msg" role="alert">
            {erro}
          </p>
        ) : null}

        {estado.caiu ? (
          <p className="lc-field__msg" role="alert">
            O Google recusou a conexão — o acesso foi revogado ou expirou. Conecte de novo.
          </p>
        ) : null}

        {estado.conectado ? (
          <>
            <p>
              Conectada{estado.emailGoogle ? <> como <strong>{estado.emailGoogle}</strong></> : null}.
            </p>
            <div className="linha">
              <Botao
                variante="secondary"
                disabled={desconectando}
                onClick={() => transicao(() => desconectarAgenda())}
              >
                {desconectando ? 'Desconectando…' : 'Desconectar'}
              </Botao>
            </div>
          </>
        ) : (
          <div className="linha">
            <Botao variante="primary" disabled={indo} onClick={conectar}>
              {indo ? 'Abrindo o Google…' : estado.caiu ? 'Reconectar Google Agenda' : 'Conectar Google Agenda'}
            </Botao>
          </div>
        )}
      </div>
    </>
  );
}
