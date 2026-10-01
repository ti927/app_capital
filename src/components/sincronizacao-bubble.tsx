'use client';

import { useState, useTransition } from 'react';
import { Aviso, Botao } from './ui/base';
import { Dialogo } from './ui/dialogo';
import { IconeSincronizar } from './ui/icones';
import { sincronizarComBubble, type RespostaSincronizacao } from '@/lib/bubble/acao';

/**
 * Botão de desenvolvimento: traz do Bubble os cadastros que ainda não existem
 * aqui. Só é montado para a conta de `SINCRONIZACAO_EMAIL` (o layout decide),
 * e a ação confere de novo no servidor. specs/10-sincronizacao-bubble.md.
 *
 * Abre um diálogo antes de rodar: a ação escreve no banco, então não dispara
 * num clique distraído na barra.
 */
export function BotaoSincronizarBubble() {
  const [aberto, setAberto] = useState(false);
  const [resposta, setResposta] = useState<RespostaSincronizacao | null>(null);
  const [rodando, iniciar] = useTransition();

  const rodar = () =>
    iniciar(async () => {
      setResposta(null);
      try {
        setResposta(await sincronizarComBubble());
      } catch {
        setResposta({ ok: false, erro: 'A sincronização não respondeu. Tente de novo.' });
      }
    });

  const total = resposta?.ok ? resposta.novos.reduce((s, n) => s + n.quantidade, 0) : 0;

  return (
    <>
      <Botao
        variante="tertiary"
        tamanho="sm"
        className="casca__acao"
        onClick={() => setAberto(true)}
        aria-haspopup="dialog"
        title="Sincronizar com o Bubble (dev)"
      >
        <IconeSincronizar tamanho={16} />
        <span className="casca__acao-rotulo">Bubble</span>
      </Botao>

      <Dialogo
        aberto={aberto}
        aoFechar={() => {
          if (!rodando) setAberto(false);
        }}
        contexto="Desenvolvimento"
        titulo="Sincronizar com o Bubble"
        largura="sm"
        rodape={
          <>
            <Botao variante="secondary" onClick={() => setAberto(false)} disabled={rodando}>
              Fechar
            </Botao>
            <Botao variante="primary" onClick={rodar} disabled={rodando} aria-busy={rodando}>
              {rodando ? 'Sincronizando…' : resposta ? 'Sincronizar de novo' : 'Sincronizar'}
            </Botao>
          </>
        }
      >
        <p className="apoio configuracoes__nota">
          Traz do Bubble só os cadastros que ainda não existem aqui — fornecedores, clientes,
          operações, etapas e o funil. Nada que já existe é alterado ou apagado.
        </p>

        {rodando ? (
          <p className="apoio configuracoes__nota" role="status">
            Lendo o Bubble e gravando os novos. Pode levar alguns segundos.
          </p>
        ) : null}

        {resposta && !resposta.ok ? <Aviso titulo="Não sincronizou" corpo={resposta.erro} /> : null}

        {resposta?.ok ? (
          <>
            <p className="apoio configuracoes__nota" role="status">
              {total === 0
                ? 'Nenhum cadastro novo.'
                : `${total} ${total === 1 ? 'registro novo' : 'registros novos'}.`}{' '}
              Raiz: {resposta.raiz} · {(resposta.duracaoMs / 1000).toFixed(1)}s
            </p>

            <ul className="acessos">
              {resposta.novos.map((n) => (
                <li key={n.tabela} className="acessos__item">
                  <span className="acessos__pagina acessos__nome">{n.tabela}</span>
                  <span className={`acessos__nivel${n.quantidade > 0 ? ' acessos__nivel--ve' : ''}`}>
                    {n.quantidade} {n.quantidade === 1 ? 'novo' : 'novos'}
                  </span>
                </li>
              ))}
            </ul>

            {resposta.erros.length ? (
              <Aviso
                className="sincronizacao__aviso"
                titulo={`${resposta.erros.length} ${resposta.erros.length === 1 ? 'erro' : 'erros'}`}
                corpo={
                  <ul>
                    {resposta.erros.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                }
              />
            ) : null}

            {resposta.avisos.length ? (
              <Aviso
                tom="neutral"
                className="sincronizacao__aviso"
                titulo="Pulados"
                corpo={
                  <ul>
                    {resposta.avisos.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                }
              />
            ) : null}
          </>
        ) : null}
      </Dialogo>
    </>
  );
}
