'use client';

import { useState, useTransition } from 'react';
import { Aviso, Botao } from './ui/base';
import { Dialogo } from './ui/dialogo';
import { IconeSincronizar } from './ui/icones';
import { sincronizarComBubble, type RespostaSincronizacao } from '@/lib/bubble/acao';

/**
 * Botão de desenvolvimento: espelha o Bubble aqui (insere o novo, atualiza o
 * que mudou, arquiva o que sumiu; nunca apaga cadastro). Só é montado para a conta de `SINCRONIZACAO_EMAIL` (o layout decide),
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

  const mudancas = resposta?.ok
    ? resposta.tabelas.filter((t) => t.novos + t.atualizados + t.arquivados + t.removidos > 0)
    : [];
  const incompleta = resposta?.ok && resposta.naoExpostos.length > 0;

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
          Espelha o Bubble aqui — fornecedores, clientes, operações, etapas e o funil. O que é
          novo entra, o que mudou no Bubble é atualizado, o que sumiu de lá é arquivado (nunca
          apagado). O que foi criado só aqui não é tocado.
        </p>

        {rodando ? (
          <p className="apoio configuracoes__nota" role="status">
            Lendo o Bubble e gravando as diferenças. Pode levar alguns segundos.
          </p>
        ) : null}

        {resposta && !resposta.ok ? <Aviso titulo="Não sincronizou" corpo={resposta.erro} /> : null}

        {resposta?.ok ? (
          <>
            {incompleta ? (
              <Aviso
                className="sincronizacao__aviso"
                titulo="Sincronização incompleta: o Bubble não expõe estes tipos"
                corpo={
                  <>
                    <p>
                      Nada destes tipos foi sincronizado (e nada deles foi arquivado):{' '}
                      <strong>{resposta.naoExpostos.join(', ')}</strong>.
                    </p>
                    <p>
                      O que fazer: no Bubble, Settings › API, marcar cada tipo acima e publicar no
                      live. Depois, sincronizar de novo.
                    </p>
                  </>
                }
              />
            ) : null}

            <p className="apoio configuracoes__nota" role="status">
              {mudancas.length === 0
                ? incompleta
                  ? 'Nenhuma mudança nos tipos que o Bubble expõe.'
                  : 'Tudo igual ao Bubble: nenhuma mudança.'
                : `${mudancas.length} ${mudancas.length === 1 ? 'tabela mudou' : 'tabelas mudaram'}.`}{' '}
              Raiz: {resposta.raiz} · {(resposta.duracaoMs / 1000).toFixed(1)}s
            </p>

            <ul className="acessos">
              {resposta.tabelas.map((t) => {
                const partes = [
                  t.novos ? `${t.novos} ${t.novos === 1 ? 'novo' : 'novos'}` : '',
                  t.atualizados ? `${t.atualizados} ${t.atualizados === 1 ? 'atualizado' : 'atualizados'}` : '',
                  t.arquivados ? `${t.arquivados} ${t.arquivados === 1 ? 'arquivado' : 'arquivados'}` : '',
                  t.removidos ? `${t.removidos} ${t.removidos === 1 ? 'removido' : 'removidos'}` : '',
                ].filter(Boolean);
                return (
                  <li key={t.tabela} className="acessos__item">
                    <span className="acessos__pagina acessos__nome">{t.tabela}</span>
                    <span className={`acessos__nivel${partes.length ? ' acessos__nivel--ve' : ''}`}>
                      {partes.length ? partes.join(' · ') : 'sem mudança'}
                    </span>
                  </li>
                );
              })}
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
