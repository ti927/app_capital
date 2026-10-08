'use client';

import { useEffect, useState, useTransition } from 'react';
import { Botao, Campo } from '@/components/ui/base';
import { Dialogo } from '@/components/ui/dialogo';
import { useAvisos } from '@/components/ui/aviso';
import { ALVOS, capturar, type Alvo } from '@/lib/email/capturar';
import { textoPadrao } from '@/lib/email/status-operacao';
import { emailsDaOperacao, enviarEmailDeStatus } from './acoes';

/** As chaves "Dados a serem incluídos", na ordem em que os prints vão no e-mail. */
const CHAVES: Array<{ alvo: Alvo; rotulo: string }> = [
  { alvo: 'observacoes', rotulo: 'Observação' },
  { alvo: 'fundos', rotulo: 'Fundos' },
  { alvo: 'fundos-resumo', rotulo: 'Fundos (Resumido)' },
];

/** `undefined`: não pedido · `'carregando'` · `null`: não há o que fotografar · string: o PNG. */
type Print = 'carregando' | string | null;

/**
 * O Pop.email do Bubble (`documentacao-completa.md:2028`, specs/13-email.md):
 * destinatários entre os e-mails do cliente, um destinatário adicional, o
 * texto, e os prints que vão junto. Marcar uma chave já mostra o print como vai
 * no e-mail; o envio usa esses mesmos prints. Assunto fixo e cópia oculta
 * ficam no servidor.
 */
export function DialogoEmail({
  operacaoId,
  contexto,
  cliente,
  identificador,
  statusOperacao,
  aoFechar,
}: {
  operacaoId: string;
  contexto: string | undefined;
  cliente: string | null;
  identificador: string | null;
  /** O "Status Atual da Operação" — vem preenchido no campo Status. */
  statusOperacao: string;
  aoFechar: () => void;
}) {
  const [emails, setEmails] = useState<string[] | null>(null);
  const [falta, setFalta] = useState<string | null>(null);
  const [escolhidos, setEscolhidos] = useState<string[]>([]);
  const [extra, setExtra] = useState('');
  const [status, setStatus] = useState(statusOperacao);
  const [weekUpdate, setWeekUpdate] = useState(false);
  const padrao = textoPadrao({ cliente, identificador, status, weekUpdate });
  // Enquanto a pessoa não mexe no texto, ele acompanha Status e Week Update
  // (como o conteúdo inicial do Bubble); depois da primeira edição, é dela.
  const [textoEditado, setTextoEditado] = useState<string | null>(null);
  const texto = textoEditado ?? padrao;
  const [marcados, setMarcados] = useState<Alvo[]>([]);
  const [prints, setPrints] = useState<Partial<Record<Alvo, Print>>>({});
  const [resultado, setResultado] = useState<{ ok?: true; erro?: string } | null>(null);
  const [enviando, transicao] = useTransition();
  const { avisar } = useAvisos();

  useEffect(() => {
    void emailsDaOperacao(operacaoId).then((r) => {
      setEmails(r.emails);
      setFalta(r.falta);
      // Com um e-mail só, ele já vem marcado; com vários, a pessoa escolhe.
      if (r.emails.length === 1) setEscolhidos(r.emails);
    });
  }, [operacaoId]);

  const alternarEmail = (email: string) =>
    setEscolhidos((atual) => (atual.includes(email) ? atual.filter((e) => e !== email) : [...atual, email]));

  /** Marcar fotografa (uma vez só); desmarcar só tira do e-mail. */
  async function alternarPrint(alvo: Alvo, marcar: boolean) {
    setMarcados((atual) => (marcar ? [...atual, alvo] : atual.filter((a) => a !== alvo)));
    if (!marcar || prints[alvo] !== undefined) return;
    setPrints((p) => ({ ...p, [alvo]: 'carregando' }));
    try {
      const png = await capturar(alvo);
      setPrints((p) => ({ ...p, [alvo]: png }));
    } catch {
      setPrints((p) => ({ ...p, [alvo]: undefined }));
      setMarcados((atual) => atual.filter((a) => a !== alvo));
      setResultado({ erro: `Não consegui tirar o print de "${ALVOS[alvo].titulo}". Tente marcar de novo.` });
    }
  }

  const naOrdem = CHAVES.filter((c) => marcados.includes(c.alvo));
  const preparando = naOrdem.some((c) => prints[c.alvo] === 'carregando');

  function enviar() {
    setResultado(null);
    const imagens = naOrdem.flatMap((c) => {
      const png = prints[c.alvo];
      return typeof png === 'string' && png !== 'carregando' ? [{ id: c.alvo, png }] : [];
    });
    transicao(async () => {
      const r = await enviarEmailDeStatus({ operacaoId, destinatarios: escolhidos, extra, texto, imagens });
      setResultado(r);
      if (r?.ok) avisar('E-mail enviado');
      else if (r?.erro) avisar(r.erro, { tipo: 'erro' });
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
              carregando={enviando}
              disabled={
                preparando || Boolean(falta) || (!escolhidos.length && !extra.trim()) || !texto.trim()
              }
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
                <input type="checkbox" checked={escolhidos.includes(e)} onChange={() => alternarEmail(e)} />
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

        <Campo
          rotulo="Status"
          multilinha
          linhas={3}
          valor={status}
          aoMudar={setStatus}
          placeholder="Status da operação para o cliente"
        />

        <label className="interruptor">
          <input type="checkbox" checked={weekUpdate} onChange={(e) => setWeekUpdate(e.target.checked)} />
          <span>Week Update</span>
        </label>

        <Campo
          rotulo="Email"
          multilinha
          linhas={11}
          valor={texto}
          aoMudar={setTextoEditado}
          placeholder="Texto do e-mail para o cliente"
        />
        {textoEditado !== null && textoEditado !== padrao ? (
          <div className="linha">
            <Botao variante="tertiary" tamanho="sm" onClick={() => setTextoEditado(null)}>
              Voltar ao texto padrão
            </Botao>
          </div>
        ) : null}

        <fieldset className="email-status__grupo">
          <legend className="lc-field__label">Dados a serem incluídos</legend>
          {CHAVES.map((c) => (
            <label key={c.alvo} className="interruptor">
              <input
                type="checkbox"
                checked={marcados.includes(c.alvo)}
                onChange={(e) => void alternarPrint(c.alvo, e.target.checked)}
              />
              <span>{c.rotulo}</span>
            </label>
          ))}
        </fieldset>

        {naOrdem.length ? (
          <div className="pilha email-status__previa">
            <span className="lc-field__label">Como vai no e-mail</span>
            {naOrdem.map((c) => {
              const png = prints[c.alvo];
              return (
                <figure key={c.alvo} className="email-status__print">
                  <figcaption className="apoio">{ALVOS[c.alvo].titulo}</figcaption>
                  {png === 'carregando' || png === undefined ? (
                    <p className="apoio">Preparando o print…</p>
                  ) : png === null ? (
                    <p className="apoio">Nada para mostrar: esta operação não tem {c.alvo === 'observacoes' ? 'observação' : 'fundo'}.</p>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- data: URL gerado aqui, não há o que otimizar
                    <img src={`data:image/png;base64,${png}`} alt={ALVOS[c.alvo].titulo} />
                  )}
                </figure>
              );
            })}
          </div>
        ) : null}

        <p className="apoio">Assunto: “Status atual de suas operações.” — sai como Lure Capital, com cópia oculta para o responsável.</p>

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
