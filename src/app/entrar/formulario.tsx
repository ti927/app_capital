'use client';

import { useActionState, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Botao, Campo } from '@/components/ui/base';
import { Dialogo } from '@/components/ui/dialogo';
import { clienteNavegador } from '@/lib/supabase/navegador';
import { entrarComSenha, pedirTrocaDeSenha } from './actions';

export function FormularioDeEntrada() {
  const parametros = useSearchParams();
  const de = parametros.get('de') ?? '/clientes';

  const [estado, agir, enviando] = useActionState(entrarComSenha, null as { erro?: string } | null);
  const [trocaAberta, setTrocaAberta] = useState(false);

  /**
   * Google. O provedor ainda não está ligado no Supabase — quando estiver, este
   * botão passa a funcionar sem mais nenhuma mudança: as cinco contas foram
   * criadas com `email_confirm`, então o login por Google cai nelas pelo e-mail.
   */
  async function entrarComGoogle() {
    const supabase = clienteNavegador();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/retorno?de=${encodeURIComponent(de)}` },
    });
  }

  return (
    <div className="entrada__caixa">
      <h1 className="t-public-title">Bem vindo de volta!</h1>
      <p className="t-public-subtitle apoio">Faça login na sua conta</p>

      <form action={agir} className="pilha entrada__campos">
        <input type="hidden" name="de" value={de} />

        <Campo rotulo="Email" nome="email" tipo="email" placeholder="voce@exemplo.com" tamanho="lg" />
        <Campo rotulo="Senha" nome="senha" tipo="password" placeholder="*********" tamanho="lg" />

        {estado?.erro ? (
          <p className="lc-field__msg" role="alert">
            {estado.erro}
          </p>
        ) : null}

        <Botao variante="primary" tamanho="lg" type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Log in'}
        </Botao>
      </form>

      <Botao variante="secondary" tamanho="lg" onClick={entrarComGoogle} className="entrada__google">
        Entrar com Google
      </Botao>

      <button type="button" className="entrada__link" onClick={() => setTrocaAberta(true)}>
        Esqueceu a senha?
      </button>

      <DialogoTrocaDeSenha aberto={trocaAberta} aoFechar={() => setTrocaAberta(false)} />
    </div>
  );
}

function DialogoTrocaDeSenha({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  const [estado, agir, enviando] = useActionState(
    pedirTrocaDeSenha,
    null as { erro?: string; aviso?: string } | null,
  );

  return (
    <Dialogo
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Esqueci minha senha"
      largura="sm"
      rodape={
        <Botao variante="primary" type="submit" form="forma-troca-senha" disabled={enviando}>
          Enviar solicitação
        </Botao>
      }
    >
      <form id="forma-troca-senha" action={agir} className="pilha">
        <p className="apoio">
          Digite seu email para que mandemos uma solicitação de troca de senha.
        </p>
        <Campo rotulo="Email" nome="email" tipo="email" placeholder="voce@exemplo.com" />
        {estado?.erro ? <p className="lc-field__msg">{estado.erro}</p> : null}
        {estado?.aviso ? <p className="apoio">{estado.aviso}</p> : null}
      </form>
    </Dialogo>
  );
}
