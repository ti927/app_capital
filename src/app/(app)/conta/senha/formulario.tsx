'use client';

import { useActionState } from 'react';
import { Botao, Campo } from '@/components/ui/base';
import { TopoDaTela } from '@/components/ui/casca';
import { trocarSenha } from './acoes';

/**
 * Formulário de troca de senha. Duas caixas e um botão: a senha nova e a
 * repetição, que é o que evita trocar por um erro de digitação e ficar de fora.
 *
 * Não pede a senha atual: quem está aqui já passou pelo login, e a sessão é o
 * que autoriza a troca (`supabase.auth.updateUser`).
 */
export function FormularioDeSenha({ email }: { email: string }) {
  const [estado, agir, gravando] = useActionState(
    trocarSenha,
    null as { erro?: string; ok?: boolean } | null,
  );

  return (
    <>
      <TopoDaTela titulo="Trocar senha" />

      <div className="conta__caixa">
        <p className="apoio">
          Conta: <strong>{email}</strong>
        </p>

        <form action={agir} className="pilha">
          <Campo rotulo="Senha nova" nome="nova" tipo="password" placeholder="Pelo menos 8 caracteres" />
          <Campo rotulo="Repita a senha nova" nome="repetida" tipo="password" placeholder="A mesma de cima" />

          {estado?.erro ? (
            <p className="lc-field__msg" role="alert">
              {estado.erro}
            </p>
          ) : null}

          {estado?.ok ? (
            <div className="lc-notice lc-notice--neutral" role="status">
              <p className="lc-notice__title">Senha trocada</p>
              <div className="lc-notice__body">
                A senha nova já vale. Ela continua valendo quando o login por Google entrar — a conta
                é a mesma.
              </div>
            </div>
          ) : null}

          <div className="linha">
            <Botao variante="primary" type="submit" disabled={gravando}>
              {gravando ? 'Trocando…' : 'Trocar senha'}
            </Botao>
          </div>
        </form>
      </div>
    </>
  );
}
