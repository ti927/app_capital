'use client';

import { useEffect, useState, useTransition } from 'react';
import { Botao, Campo } from '@/components/ui/base';
import { Dialogo } from '@/components/ui/dialogo';
import { ALVOS, capturar, type Alvo } from '@/lib/email/capturar';
import { emailsDaOperacao, enviarEmailDeStatus } from './acoes';

/**
 * O Pop.email do Bubble (`documentacao-completa.md:2028`, specs/13-email.md):
 * destinatários entre os e-mails do cliente, um destinatário adicional, o
 * texto, e o que entra junto — observações, fundos ou fundos resumidos.
 * Assunto fixo e cópia oculta ficam no servidor.
 */
export function DialogoEmail({
  operacaoId,
  contexto,
  aoFechar,
}: {
  operacaoId: string;
  contexto: string | undefined;
  aoFechar: () => void;
}) {
  const [emails, setEmails] = useState<string[] | null>(null);
  const [falta, setFalta] = useState<string | null>(null);
  const [escolhidos, setEscolhidos] = useState<string[]>([]);
  const [extra, setExtra] = useState('');
  const [texto, setTexto] = useState('');
  const [incluir, setIncluir] = useState({ observacoes: false, fundos: false, resumo: false });
  const [resultado, setResultado] = useState<{ ok?: true; erro?: string } | null>(null);
  const [previa, setPrevia] = useState<Array<{ id: Alvo; png: string }> | null>(null);
  const [enviando, transicao] = useTransition();

  useEffect(() => {
    void emailsDaOperacao(operacaoId).then((r) => {
      setEmails(r.emails);
      setFalta(r.falta);
      // Com um e-mail só, ele já vem marcado; com vários, a pessoa escolhe.
      if (r.emails.length === 1) setEscolhidos(r.emails);
    });
  }, [operacaoId]);

  const alternar = (email: string) =>
    setEscolhidos((atual) => (atual.includes(email) ? atual.filter((e) => e !== email) : [...atual, email]));

  const alvos = (): Alvo[] => [
    ...(incluir.observacoes ? (['observacoes'] as const) : []),
    ...(incluir.fundos ? (['fundos'] as const) : []),
    ...(incluir.resumo ? (['fundos-resumo'] as const) : []),
  ];

  /** Os mesmos prints do envio, mostrados aqui antes de mandar. */
  function verPrevia() {
    setResultado(null);
    transicao(async () => {
      try {
        setPrevia(await capturar(alvos()));
      } catch {
        setResultado({ erro: 'Não consegui tirar o print das tabelas. Tente de novo.' });
      }
    });
  }

  /**
   * Como o Bubble: antes de enviar, fotografa na tela da operação (aberta por
   * baixo deste diálogo) os elementos escolhidos, e só então envia.
   */
  function enviar() {
    setResultado(null);
    transicao(async () => {
      let imagens: Array<{ id: string; png: string }> = [];
      try {
        imagens = await capturar(alvos());
      } catch {
        setResultado({ erro: 'Não consegui tirar o print das tabelas. Tente de novo.' });
        return;
      }
      setResultado(await enviarEmailDeStatus({ operacaoId, destinatarios: escolhidos, extra, texto, imagens }));
    });
  }

  const enviado = resultado?.ok === true;

  return (
    <Dialogo
      aberto
      aoFechar={aoFechar}
      titulo="Envio de Email"
      contexto={contexto}
      largura="md"
      rodape={
        enviado ? (
          <Botao variante="primary" onClick={aoFechar}>
            Fechar
          </Botao>
        ) : (
          <>
            <Botao variante="secondary" onClick={aoFechar}>
              Cancelar
            </Botao>
            <Botao
              variante="primary"
              onClick={enviar}
              disabled={enviando || Boolean(falta) || (!escolhidos.length && !extra.trim()) || !texto.trim()}
            >
              {enviando ? 'Enviando…' : 'Enviar'}
            </Botao>
          </>
        )
      }
    >
      <div className="pilha email-status">
        {falta ? (
          <div className="lc-notice lc-notice--neutral" role="status">
            <p className="lc-notice__title">Envio de e-mail ainda não configurado</p>
            <div className="lc-notice__body">Falta {falta}. Fale com o administrador.</div>
          </div>
        ) : null}

        <fieldset className="email-status__grupo">
          <legend className="lc-field__label">Destinatários</legend>
          {emails === null ? (
            <p className="apoio">Carregando os e-mails do cliente…</p>
          ) : emails.length ? (
            emails.map((e) => (
              <label key={e} className="interruptor">
                <input type="checkbox" checked={escolhidos.includes(e)} onChange={() => alternar(e)} />
                <span>{e}</span>
              </label>
            ))
          ) : (
            <p className="apoio">O cliente não tem e-mail cadastrado — use o destinatário adicional.</p>
          )}
        </fieldset>

        <Campo
          rotulo="Destinatário adicional"
          tipo="email"
          valor={extra}
          aoMudar={setExtra}
          placeholder="alguem@empresa.com.br"
        />

        <fieldset className="email-status__grupo">
          <legend className="lc-field__label">Dados a serem incluídos</legend>
          <label className="interruptor">
            <input
              type="checkbox"
              checked={incluir.observacoes}
              onChange={(e) => setIncluir((i) => ({ ...i, observacoes: e.target.checked }))}
            />
            <span>Observação</span>
          </label>
          <label className="interruptor">
            <input
              type="checkbox"
              checked={incluir.fundos}
              onChange={(e) => setIncluir((i) => ({ ...i, fundos: e.target.checked }))}
            />
            <span>Fundos</span>
          </label>
          <label className="interruptor">
            <input
              type="checkbox"
              checked={incluir.resumo}
              onChange={(e) => setIncluir((i) => ({ ...i, resumo: e.target.checked }))}
            />
            <span>Fundos (Resumido)</span>
          </label>
        </fieldset>

        <Campo
          rotulo="Email"
          multilinha
          linhas={8}
          valor={texto}
          aoMudar={setTexto}
          placeholder="Texto do e-mail para o cliente"
        />

        <p className="apoio">
          Assunto: “Status atual de suas operações.” — sai como Lure Capital, com cópia oculta para o
          responsável. Observação e Fundos vão como print das tabelas desta operação.
        </p>

        {incluir.observacoes || incluir.fundos || incluir.resumo ? (
          <div className="linha">
            <Botao variante="tertiary" tamanho="sm" onClick={verPrevia} disabled={enviando}>
              Ver prévia dos prints
            </Botao>
          </div>
        ) : null}

        {previa ? (
          <div className="pilha email-status__previa">
            {previa.length ? (
              previa.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element -- é um data: URL gerado aqui, não há o que otimizar
                <img key={p.id} src={`data:image/png;base64,${p.png}`} alt={ALVOS[p.id].titulo} />
              ))
            ) : (
              <p className="apoio">Nada para fotografar: esta operação não tem observação nem fundo.</p>
            )}
          </div>
        ) : null}

        {resultado?.erro ? (
          <p className="lc-field__msg" role="alert">
            {resultado.erro}
          </p>
        ) : null}
        {enviado ? (
          <div className="lc-notice lc-notice--neutral" role="status">
            <p className="lc-notice__title">E-mail enviado</p>
          </div>
        ) : null}
      </div>
    </Dialogo>
  );
}
