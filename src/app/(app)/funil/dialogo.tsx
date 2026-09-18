'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { Botao, Campo } from '@/components/ui/base';
import { SeletorMultiploPopup, SeletorPopup } from '@/components/ui/seletor-popup';
import { Dialogo } from '@/components/ui/dialogo';
import { IconeDeletar, IconeMais } from '@/components/ui/icones';
import { data, type FunilCartao } from '@/lib/dominio';
import { arquivarCartao, excluirCartao, excluirTarefa, gravarCartao } from './acoes';
import { CaixaConcluir, DialogoTarefa } from './tarefas';
import { prazoCurto, rotuloDoTipo } from './tarefas-apoio';
import type { EtapaFunil, TagFunil, Tarefa } from './page';

/**
 * Diálogo do cartão do funil. Difere de todos os outros: **não tem botão de
 * salvar** — a gravação é automática, e o rodapé traz "Salvo automaticamente"
 * e "Excluir cartão" à esquerda, "Arquivar" e "Fechar" à direita.
 */
export function DialogoCartao({
  aberto,
  cartao,
  quadroId,
  etapaInicial,
  etapas,
  tags,
  tagsDoCartao,
  perfis,
  perfilId,
  usuariosDoCartao,
  tarefas,
  aoFechar,
}: {
  aberto: boolean;
  cartao: FunilCartao | null;
  quadroId: string;
  etapaInicial: string | null;
  etapas: EtapaFunil[];
  tags: TagFunil[];
  tagsDoCartao: string[];
  perfis: Array<{ id: string; nome: string }>;
  perfilId: string;
  usuariosDoCartao: string[];
  tarefas: Tarefa[];
  aoFechar: () => void;
}) {
  const [estado, agir, gravando] = useActionState(gravarCartao, null as { erro?: string; ok?: boolean } | null);
  const [escolhidas, setEscolhidas] = useState<string[]>(tagsDoCartao);
  const [tarefaNova, setTarefaNova] = useState(false);
  const [tarefaEmEdicao, setTarefaEmEdicao] = useState<Tarefa | null>(null);
  const [, transicao] = useTransition();

  useEffect(() => setEscolhidas(tagsDoCartao), [tagsDoCartao.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (estado?.ok) aoFechar();
  }, [estado, aoFechar]);

  const novo = !cartao;
  const emBranco = novo || (!cartao?.empresa && !cartao?.contato);

  return (
    <>
      <Dialogo
        aberto={aberto}
        aoFechar={aoFechar}
        titulo={novo ? 'Cartão criado' : 'Editar cartão'}
        largura="md"
        rodape={
          <div className="funil__rodape-dialogo">
            <div className="linha">
              <span className="apoio">● Salvo automaticamente</span>
              {cartao ? (
                <Botao
                  variante="dangerOutline"
                  tamanho="sm"
                  onClick={() => {
                    transicao(() => void excluirCartao(cartao.id));
                    aoFechar();
                  }}
                >
                  Excluir cartão
                </Botao>
              ) : null}
            </div>
            <div className="linha">
              {cartao ? (
                <Botao
                  variante="secondary"
                  onClick={() => {
                    transicao(() => void arquivarCartao(cartao.id, true));
                    aoFechar();
                  }}
                >
                  Arquivar
                </Botao>
              ) : null}
              <Botao variante="primary" type="submit" form="forma-cartao" disabled={gravando}>
                {gravando ? 'Gravando…' : 'Fechar'}
              </Botao>
            </div>
          </div>
        }
      >
        <form id="forma-cartao" action={agir} className="grade">
          <input type="hidden" name="id" value={cartao?.id ?? ''} />
          <input type="hidden" name="quadro_id" value={quadroId} />
          {escolhidas.map((t) => (
            <input key={t} type="hidden" name="tags" value={t} />
          ))}

          {/* 1 */}
          <Campo rotulo="Empresa" nome="empresa" valorInicial={cartao?.empresa ?? ''} placeholder="Digite aqui" />
          <Campo rotulo="Nome do contato" nome="contato" valorInicial={cartao?.contato ?? ''} placeholder="Digite aqui" />

          {/* 2 */}
          <Campo rotulo="Segmento / atividade" nome="segmento" valorInicial={cartao?.segmento ?? ''} placeholder="Digite aqui" />
          <Campo
            rotulo="Faturamento anual"
            nome="faturamento"
            valorInicial={cartao?.faturamento ?? ''}
            placeholder="Ex.: 20 milhões ou 20000000"
          />

          {/* 3, 4 */}
          <Campo className="grade__inteiro campo-alto" rotulo="Parecer" nome="parecer" multilinha linhas={9} valorInicial={cartao?.parecer ?? ''} placeholder="Digite aqui" />
          <Campo className="grade__inteiro campo-medio" rotulo="Histórico" nome="historico" multilinha linhas={9} valorInicial={cartao?.historico ?? ''} placeholder="Digite aqui" />

          {/* 4b — as tarefas do cartão, logo abaixo do histórico */}
          <BlocoTarefas
            tarefas={tarefas}
            perfis={perfis}
            temCartao={Boolean(cartao)}
            aoAdicionar={() => setTarefaNova(true)}
            aoEditar={setTarefaEmEdicao}
          />

          {/* 5 */}
          <SeletorPopup
            rotulo="Etapa"
            nome="etapa_id"
            valorInicial={cartao?.etapa_id ?? etapaInicial ?? ''}
            opcoes={etapas.map((e) => ({ valor: e.id, rotulo: e.nome }))}
          />
          <Campo rotulo="Indicante" nome="indicante" valorInicial={cartao?.indicante ?? ''} placeholder="Digite aqui" />
          <SeletorMultiploPopup
            rotulo="Usuário"
            nome="usuarios"
            inicial={usuariosDoCartao}
            opcoes={perfis.map((p) => ({ valor: p.id, rotulo: p.nome }))}
          />

          {/* 6 — somente leitura */}
          <Campo rotulo="Data inicial" calculado valorInicial={data(cartao?.atualizado_em)} />
          <Campo rotulo="Última atualização" calculado valorInicial={data(cartao?.atualizado_em)} />

          {/* 7 */}
          <Campo rotulo="Data do call realizado" nome="data_call" tipo="date" valorInicial={cartao?.data_call ?? ''} />
          <Campo rotulo="Data do envio do KB" nome="data_kb" tipo="date" valorInicial={cartao?.data_kb ?? ''} />

          {/* 8 — cinco pílulas alternáveis */}
          <div className="lc-field grade__inteiro">
            <span className="lc-field__label">Tags</span>
            <div className="tipos__lista">
              {tags.map((t) => {
                const marcada = escolhidas.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={['tipos__tag', marcada && 'tipos__tag--marcado'].filter(Boolean).join(' ')}
                    aria-pressed={marcada}
                    onClick={() =>
                      setEscolhidas((v) => (v.includes(t.id) ? v.filter((x) => x !== t.id) : [...v, t.id]))
                    }
                  >
                    {t.nome}
                  </button>
                );
              })}
            </div>
          </div>

          {emBranco ? (
            <div className="lc-notice lc-notice--neutral grade__inteiro" style={{ background: 'var(--warning-bg)' }}>
              <p className="lc-notice__title">Cartão em branco</p>
              <div className="lc-notice__body">
                Este cartão está salvo, mas ainda não tem empresa nem contato — ele aparece no quadro
                como &ldquo;Cartão em branco&rdquo;.
              </div>
            </div>
          ) : null}

          {estado?.erro ? (
            <p className="lc-field__msg grade__inteiro" role="alert">
              {estado.erro}
            </p>
          ) : null}
        </form>
      </Dialogo>

      {/* Fora do `<form>` do cartão: formulário dentro de formulário não existe.
          Criar tarefa não fecha o diálogo do cartão nem exige salvar o cartão. */}
      {cartao ? (
        <DialogoTarefa
          key={tarefaEmEdicao?.id ?? 'nova'}
          aberto={tarefaNova || tarefaEmEdicao !== null}
          tarefa={tarefaEmEdicao}
          quadroId={quadroId}
          cartoes={[cartao]}
          cartaoFixo={cartao.id}
          perfis={perfis}
          perfilId={perfilId}
          aoFechar={() => {
            setTarefaNova(false);
            setTarefaEmEdicao(null);
          }}
        />
      ) : null}
    </>
  );
}

/* ---------------------------------------------------------------- tarefas -- */

/**
 * Bloco de tarefas do cartão: rótulo + "Adicionar", e a lista com caixa de
 * concluir, título, ficha do tipo, responsável, prazo e lixeira.
 *
 * Enquanto o cartão é novo não há a que pendurar a tarefa — o botão fica
 * desabilitado e o `title` diz por quê, como o "Adicionar e-mail" do cliente.
 */
function BlocoTarefas({
  tarefas,
  perfis,
  temCartao,
  aoAdicionar,
  aoEditar,
}: {
  tarefas: Tarefa[];
  perfis: Array<{ id: string; nome: string }>;
  temCartao: boolean;
  aoAdicionar: () => void;
  aoEditar: (t: Tarefa) => void;
}) {
  const [, transicao] = useTransition();
  const nomePerfil = new Map(perfis.map((p) => [p.id, p.nome]));

  // Em aberto primeiro, pelo prazo; as concluídas descem para o fim.
  const ordenadas = [...tarefas].sort((a, b) => {
    if (a.concluida !== b.concluida) return a.concluida ? 1 : -1;
    return (a.prazo ?? '9999').localeCompare(b.prazo ?? '9999');
  });

  return (
    <div className="grade__inteiro">
      <div className="linha" style={{ justifyContent: 'space-between' }}>
        <span className="lc-field__label">Tarefas</span>
        <Botao
          variante="tertiary"
          tamanho="sm"
          onClick={aoAdicionar}
          disabled={!temCartao}
          title={temCartao ? 'Adicionar tarefa' : 'Salve o cartão primeiro'}
        >
          <IconeMais tamanho={14} /> Adicionar
        </Botao>
      </div>

      {ordenadas.length > 0 ? (
        <ul className="lista" style={{ marginTop: 'var(--space-3)' }}>
          {ordenadas.map((t) => (
            <li key={t.id} className="lista__item tarefas__linha">
              <CaixaConcluir tarefa={t} />
              <button type="button" className="tarefas__titulo" onClick={() => aoEditar(t)}>
                <span
                  className={
                    t.concluida ? 'tarefas__titulo-texto tarefas__titulo-texto--feito' : 'tarefas__titulo-texto'
                  }
                >
                  {t.titulo}
                </span>
              </button>
              {t.tipo ? <span className="tarefas__ficha">{rotuloDoTipo(t.tipo)}</span> : null}
              {t.responsavel_id ? (
                <span className="tarefas__responsavel apoio">{nomePerfil.get(t.responsavel_id) ?? ''}</span>
              ) : null}
              {t.prazo ? <span className="tarefas__prazo apoio">{prazoCurto(t.prazo, t.hora)}</span> : null}
              <Botao
                variante="tertiary"
                tamanho="row"
                title="Excluir tarefa"
                aria-label={`Excluir ${t.titulo}`}
                onClick={() => transicao(() => void excluirTarefa(t.id))}
              >
                <IconeDeletar tamanho={14} />
              </Botao>
            </li>
          ))}
        </ul>
      ) : (
        <p className="apoio" style={{ marginTop: 'var(--space-2)' }}>
          {temCartao ? 'Nenhuma tarefa neste cartão.' : 'O cartão precisa estar salvo para receber tarefas.'}
        </p>
      )}
    </div>
  );
}
