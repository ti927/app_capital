'use client';

import { useEffect, useState } from 'react';
import { Botao } from '@/components/ui/base';
import { clienteNavegador } from '@/lib/supabase/navegador';
import { redirecionamentoPermitido } from '@/lib/mcp/consentimento';

type Estado =
  | { fase: 'carregando' }
  | { fase: 'erro'; mensagem: string }
  | { fase: 'recusado'; quem: string; destino: string }
  | { fase: 'pedir'; quem: string; destino: string; email: string }
  | { fase: 'indo' };

/**
 * Mostra quem pede acesso e para onde a autorização volta, e deixa aprovar só
 * quando o destino é o Claude (`redirecionamentoPermitido`). Destino estranho
 * é recusado no Supabase na hora, sem botão de aprovar — o registro dinâmico
 * permite que qualquer um se cadastre com qualquer nome.
 */
export function Autorizacao({ autorizacaoId }: { autorizacaoId: string | null }) {
  const [estado, setEstado] = useState<Estado>({ fase: 'carregando' });

  useEffect(() => {
    if (!autorizacaoId) {
      setEstado({ fase: 'erro', mensagem: 'O pedido de autorização veio sem identificador.' });
      return;
    }
    const supabase = clienteNavegador();
    void (async () => {
      const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(autorizacaoId);
      if (error || !data) {
        setEstado({ fase: 'erro', mensagem: 'Este pedido de autorização venceu ou não existe. Tente conectar de novo pelo Claude.' });
        return;
      }
      // Já aprovado antes: o Supabase devolve direto o caminho de volta.
      if ('redirect_url' in data) {
        setEstado({ fase: 'indo' });
        window.location.assign(data.redirect_url);
        return;
      }
      const quem = data.client.name || 'Aplicativo sem nome';
      let destino = data.redirect_uri;
      try {
        destino = new URL(data.redirect_uri).host;
      } catch {
        // fica o texto cru
      }
      if (!redirecionamentoPermitido(data.redirect_uri)) {
        await supabase.auth.oauth.denyAuthorization(autorizacaoId, { skipBrowserRedirect: true });
        setEstado({ fase: 'recusado', quem, destino });
        return;
      }
      setEstado({ fase: 'pedir', quem, destino, email: data.user.email });
    })();
  }, [autorizacaoId]);

  async function decidir(aprovar: boolean) {
    if (!autorizacaoId) return;
    setEstado({ fase: 'indo' });
    const supabase = clienteNavegador();
    const { data, error } = aprovar
      ? await supabase.auth.oauth.approveAuthorization(autorizacaoId, { skipBrowserRedirect: true })
      : await supabase.auth.oauth.denyAuthorization(autorizacaoId, { skipBrowserRedirect: true });
    if (error || !data?.redirect_url) {
      setEstado({ fase: 'erro', mensagem: 'Não consegui registrar a decisão. Tente conectar de novo pelo Claude.' });
      return;
    }
    window.location.assign(data.redirect_url);
  }

  return (
    <div className="entrada__caixa">
      <h1 className="t-public-title">Autorizar acesso</h1>

      {estado.fase === 'carregando' || estado.fase === 'indo' ? (
        <p className="apoio">{estado.fase === 'indo' ? 'Voltando para o aplicativo…' : 'Carregando o pedido…'}</p>
      ) : null}

      {estado.fase === 'erro' ? (
        <p className="lc-field__msg" role="alert">
          {estado.mensagem}
        </p>
      ) : null}

      {estado.fase === 'recusado' ? (
        <div className="lc-notice lc-notice--neutral" role="alert">
          <p className="lc-notice__title">Pedido recusado</p>
          <div className="lc-notice__body">
            “{estado.quem}” pediu acesso voltando para <strong>{estado.destino}</strong>, que não é o
            Claude. Só o Claude pode receber acesso à Lure Capital. Se não foi você, ignore.
          </div>
        </div>
      ) : null}

      {estado.fase === 'pedir' ? (
        <div className="pilha">
          <p>
            <strong>{estado.quem}</strong> ({estado.destino}) quer acessar a Lure Capital como{' '}
            <strong>{estado.email}</strong>.
          </p>
          <p className="apoio">
            Ele vai poder ler e escrever no funil, nos clientes e nas tarefas, com o mesmo acesso que
            você tem no app. Não pode excluir nada. Para revogar depois, desconecte o conector no
            Claude.
          </p>
          <div className="linha">
            <Botao variante="primary" onClick={() => void decidir(true)}>
              Permitir
            </Botao>
            <Botao variante="secondary" onClick={() => void decidir(false)}>
              Recusar
            </Botao>
          </div>
        </div>
      ) : null}
    </div>
  );
}
