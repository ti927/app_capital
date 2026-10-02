'use client';

import { useActionState, useState } from 'react';
import { Botao, Campo } from '@/components/ui/base';
import { clienteNavegador } from '@/lib/supabase/navegador';
import { entrarComSenha } from './actions';

/**
 * Entrada pelo Google. As contas foram criadas com `email_confirm`, então o
 * login por Google cai nelas pelo e-mail.
 *
 * O formulário de senha só aparece com `ENTRADA_COM_SENHA=1` no servidor — é
 * por ele que `npm run qa` e a medição entram, já que um robô não passa pelo
 * Google. Em produção a variável não existe e a tela mostra só o Google.
 */
export function FormularioDeEntrada({
  de,
  comSenha,
  erroOauth,
}: {
  de: string;
  comSenha: boolean;
  erroOauth: boolean;
}) {
  const [indo, setIndo] = useState(false);
  const [erroAoIr, setErroAoIr] = useState(false);

  async function entrarComGoogle() {
    setIndo(true);
    setErroAoIr(false);
    const supabase = clienteNavegador();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/retorno?de=${encodeURIComponent(de)}` },
    });
    // Sem erro o navegador já está indo para o Google; com erro, fica aqui.
    if (error) {
      setIndo(false);
      setErroAoIr(true);
    }
  }

  return (
    <div className="entrada__caixa">
      <h1 className="t-public-title">Bem vindo de volta!</h1>
      <p className="t-public-subtitle apoio">Entre com a sua conta Google</p>

      <Botao
        variante="primary"
        tamanho="lg"
        onClick={entrarComGoogle}
        disabled={indo}
        className="entrada__google"
      >
        {indo ? 'Abrindo o Google…' : 'Entrar com Google'}
      </Botao>

      {erroOauth || erroAoIr ? (
        <p className="lc-field__msg entrada__erro" role="alert">
          Não foi possível entrar com o Google. Tente de novo; se persistir, fale com o
          administrador.
        </p>
      ) : null}

      {comSenha ? <EntradaComSenha de={de} /> : null}
    </div>
  );
}

function EntradaComSenha({ de }: { de: string }) {
  const [estado, agir, enviando] = useActionState(entrarComSenha, null as { erro?: string } | null);

  return (
    <form action={agir} className="pilha entrada__campos">
      <input type="hidden" name="de" value={de} />

      <Campo rotulo="Email" nome="email" tipo="email" placeholder="voce@exemplo.com" tamanho="lg" />
      <Campo rotulo="Senha" nome="senha" tipo="password" placeholder="*********" tamanho="lg" />

      {estado?.erro ? (
        <p className="lc-field__msg" role="alert">
          {estado.erro}
        </p>
      ) : null}

      <Botao variante="secondary" tamanho="lg" type="submit" disabled={enviando}>
        {enviando ? 'Entrando…' : 'Entrar com senha'}
      </Botao>
    </form>
  );
}
