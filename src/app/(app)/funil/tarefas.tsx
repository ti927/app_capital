'use client';

import { useActionState, useEffect, useMemo, useState, useTransition, type ReactNode } from 'react';
import { Botao, Campo, Vazio } from '@/components/ui/base';
import { Dialogo } from '@/components/ui/dialogo';
import { SeletorPopup } from '@/components/ui/seletor-popup';
import {
  IconeChevronBaixo,
  IconeChevronCima,
  IconeDeletar,
  IconeMais,
  IconeSalvar,
} from '@/components/ui/icones';
import type { FunilCartao } from '@/lib/dominio';
import { Calendario } from './calendario';
import { alternarTarefa, criarTarefa, excluirTarefa, gravarTarefa } from './acoes';
import { GRUPOS, TIPOS_TAREFA, grupoDa, prazoCurto, rotuloDoTipo, type ChaveGrupo } from './tarefas-apoio';
import type { Tarefa } from './page';

/**
 * Painel "Tarefas" da página do funil.
 *
 * Duas colunas no desktop — a lista agrupada por prazo à esquerda, o calendário
 * do mês à direita —, empilhadas abaixo de 900px. O calendário não é enfeite:
 * clicar num dia filtra a lista.
 *
 * Toda tarefa pertence a um cartão (decisão de 18/09/2026, fechada no banco na
 * migration 006): "Nova tarefa" exige escolher o cartão antes de deixar salvar.
 */
export function PainelTarefas({
  tarefas,
  cartoes,
  perfis,
  perfilId,
  ehMaster,
  quadroId,
  aoAbrirCartao,
}: {
  tarefas: Tarefa[];
  cartoes: FunilCartao[];
  perfis: Array<{ id: string; nome: string }>;
  perfilId: string;
  ehMaster: boolean;
  quadroId: string | null;
  aoAbrirCartao: (cartaoId: string) => void;
}) {
  // "Minhas" é o padrão: quem abre a aba quer ver o que tem para fazer.
  const [responsavel, setResponsavel] = useState<string>(perfilId);
  const [tipo, setTipo] = useState<string>('');
  const [dia, setDia] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Tarefa | null>(null);

  const nomePerfil = useMemo(() => new Map(perfis.map((p) => [p.id, p.nome])), [perfis]);
  const cartaoPorId = useMemo(() => new Map(cartoes.map((c) => [c.id, c])), [cartoes]);

  /**
   * Responsável e tipo filtram a lista **e** o calendário. O dia entra só
   * depois, na lista: o calendário precisa continuar mostrando o mês inteiro
   * mesmo com um dia escolhido, senão o filtro apaga o que o usuário usa para
   * trocar de dia.
   */
  const filtradas = useMemo(
    () =>
      tarefas.filter((t) => {
        if (responsavel && t.responsavel_id !== responsavel) return false;
        if (tipo && t.tipo !== tipo) return false;
        return true;
      }),
    [tarefas, responsavel, tipo],
  );

  const doDia = useMemo(
    () => (dia ? filtradas.filter((t) => (t.prazo ?? '').slice(0, 10) === dia) : filtradas),
    [filtradas, dia],
  );

  const porGrupo = useMemo(() => {
    const mapa = new Map<ChaveGrupo, Tarefa[]>();
    for (const t of doDia) {
      const g = grupoDa(t);
      mapa.set(g, [...(mapa.get(g) ?? []), t]);
    }
    // Dentro do grupo, o prazo mais próximo primeiro; sem prazo vai para o fim.
    for (const lista of mapa.values()) {
      lista.sort((a, b) => (a.prazo ?? '9999').localeCompare(b.prazo ?? '9999'));
    }
    return mapa;
  }, [doDia]);

  const temFiltro = responsavel !== '' || tipo !== '' || dia !== null;
  const escondidos = tarefas.length - doDia.length;

  const limpar = () => {
    setResponsavel('');
    setTipo('');
    setDia(null);
  };

  return (
    <div className="tarefas">
      <div className="tarefas__filtros">
        <SeletorPopup
          className="tarefas__filtro"
          rotulo="Responsável"
          valorInicial={responsavel}
          placeholder="Todas"
          opcoes={
            ehMaster
              ? perfis.map((p) => ({ valor: p.id, rotulo: p.id === perfilId ? `${p.nome} (eu)` : p.nome }))
              : [{ valor: perfilId, rotulo: nomePerfil.get(perfilId) ?? 'Minhas' }]
          }
          aoEscolher={setResponsavel}
        />
        <SeletorPopup
          className="tarefas__filtro"
          rotulo="Tipo"
          valorInicial={tipo}
          placeholder="Todos"
          opcoes={TIPOS_TAREFA.map((t) => ({ valor: t.valor, rotulo: t.rotulo }))}
          aoEscolher={setTipo}
        />
        <div className="tarefas__filtro-acao">
          <Botao
            variante="primary"
            disabled={!quadroId || cartoes.length === 0}
            title={
              cartoes.length === 0
                ? 'Crie um cartão antes: toda tarefa pertence a um cartão'
                : undefined
            }
            onClick={() => setCriando(true)}
          >
            <IconeMais tamanho={15} /> Nova tarefa
          </Botao>
        </div>
      </div>

      {/* Botão desabilitado sem explicação é bug de captura: aqui a razão fica escrita. */}
      {cartoes.length === 0 ? (
        <p className="tarefas__aviso apoio">
          Toda tarefa pertence a um cartão — crie um cartão no quadro para poder criar tarefas.
        </p>
      ) : null}

      <div className="tarefas__corpo">
        <div className="tarefas__lista">
          {doDia.length === 0 ? (
            <div className="vazio-tela">
              <Vazio
                titulo={tarefas.length ? 'Nenhuma tarefa com esse filtro' : 'Nenhuma tarefa ainda'}
                escondidos={escondidos || undefined}
                // Sem tarefa nenhuma, limpar filtro não traz nada: seria um beco.
                aoLimpar={temFiltro && tarefas.length > 0 ? limpar : undefined}
              />
            </div>
          ) : (
            GRUPOS.map(({ chave, rotulo }) => {
              const lista = porGrupo.get(chave) ?? [];
              if (!lista.length) return null;
              return (
                <Grupo key={chave} chave={chave} rotulo={rotulo} quantidade={lista.length}>
                  <ul className="lista">
                    {lista.map((t) => (
                      <LinhaTarefa
                        key={t.id}
                        tarefa={t}
                        cartao={cartaoPorId.get(t.cartao_id) ?? null}
                        responsavel={t.responsavel_id ? (nomePerfil.get(t.responsavel_id) ?? '') : ''}
                        aoAbrirCartao={aoAbrirCartao}
                        aoEditar={() => setEmEdicao(t)}
                      />
                    ))}
                  </ul>
                </Grupo>
              );
            })
          )}
        </div>

        <aside className="tarefas__calendario">
          <Calendario tarefas={filtradas} diaEscolhido={dia} aoEscolherDia={setDia} />
        </aside>
      </div>

      {quadroId ? (
        <DialogoTarefa
          key={emEdicao?.id ?? 'nova'}
          aberto={criando || emEdicao !== null}
          tarefa={emEdicao}
          quadroId={quadroId}
          cartoes={cartoes}
          perfis={perfis}
          perfilId={perfilId}
          // Com um dia filtrando pelo calendário, a tarefa nova já nasce com aquele prazo.
          prazoInicial={dia}
          aoFechar={() => {
            setCriando(false);
            setEmEdicao(null);
          }}
        />
      ) : null}
    </div>
  );
}

/* ----------------------------------------------------------------- grupo -- */

/** Grupo da lista. "Concluídas" nasce recolhido — é histórico, não trabalho. */
function Grupo({
  chave,
  rotulo,
  quantidade,
  children,
}: {
  chave: ChaveGrupo;
  rotulo: string;
  quantidade: number;
  children: ReactNode;
}) {
  const [aberto, setAberto] = useState(chave !== 'concluidas');
  return (
    <section className="tarefas__grupo">
      <button
        type="button"
        className={['tarefas__grupo-topo', chave === 'vencidas' && 'tarefas__grupo-topo--vencidas']
          .filter(Boolean)
          .join(' ')}
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
      >
        {aberto ? <IconeChevronCima tamanho={14} /> : <IconeChevronBaixo tamanho={14} />}
        <span className="tarefas__grupo-nome">{rotulo}</span>
        <span className="tarefas__grupo-conta">{quantidade}</span>
      </button>
      {aberto ? children : null}
    </section>
  );
}

/* ----------------------------------------------------------------- linha -- */

function LinhaTarefa({
  tarefa,
  cartao,
  responsavel,
  aoAbrirCartao,
  aoEditar,
}: {
  tarefa: Tarefa;
  cartao: FunilCartao | null;
  responsavel: string;
  aoAbrirCartao: (cartaoId: string) => void;
  aoEditar: () => void;
}) {
  const [, transicao] = useTransition();
  return (
    <li className="lista__item tarefas__linha">
      <CaixaConcluir tarefa={tarefa} />

      <button type="button" className="tarefas__titulo" onClick={aoEditar}>
        <span
          className={
            tarefa.concluida ? 'tarefas__titulo-texto tarefas__titulo-texto--feito' : 'tarefas__titulo-texto'
          }
        >
          {tarefa.titulo}
        </span>
      </button>

      {tarefa.tipo ? <span className="tarefas__ficha">{rotuloDoTipo(tarefa.tipo)}</span> : null}

      <button
        type="button"
        className="tarefas__cartao"
        onClick={() => aoAbrirCartao(tarefa.cartao_id)}
        title="Abrir o cartão de origem"
      >
        {cartao?.empresa || 'Cartão em branco'}
      </button>

      {responsavel ? <span className="tarefas__responsavel apoio">{responsavel}</span> : null}
      {tarefa.prazo ? (
        <span className="tarefas__prazo apoio">{prazoCurto(tarefa.prazo, tarefa.hora)}</span>
      ) : null}

      <Botao
        variante="tertiary"
        tamanho="row"
        title="Excluir tarefa"
        aria-label={`Excluir ${tarefa.titulo}`}
        onClick={() => transicao(() => void excluirTarefa(tarefa.id))}
      >
        <IconeDeletar tamanho={14} />
      </Botao>
    </li>
  );
}

/** A caixa de concluir. Usada aqui e no bloco de tarefas dentro do cartão. */
export function CaixaConcluir({ tarefa }: { tarefa: Pick<Tarefa, 'id' | 'titulo' | 'concluida'> }) {
  const [, transicao] = useTransition();
  return (
    <button
      type="button"
      className={['caixa', tarefa.concluida && 'caixa--marcada'].filter(Boolean).join(' ')}
      role="checkbox"
      aria-checked={tarefa.concluida}
      aria-label={tarefa.concluida ? `Reabrir ${tarefa.titulo}` : `Concluir ${tarefa.titulo}`}
      onClick={() => transicao(() => void alternarTarefa(tarefa.id, !tarefa.concluida))}
    >
      {tarefa.concluida ? <IconeSalvar tamanho={12} /> : null}
    </button>
  );
}

/* --------------------------------------------------------------- diálogo -- */

/**
 * Criar e editar são o mesmo formulário — o `id` decide qual é, como no
 * diálogo de cliente. O cartão é obrigatório, por isso vem primeiro; quando o
 * diálogo abre de dentro de um cartão, ele já vem preso e só se lê.
 */
export function DialogoTarefa({
  aberto,
  tarefa,
  quadroId,
  cartoes,
  perfis,
  perfilId,
  cartaoFixo,
  prazoInicial,
  aoFechar,
}: {
  aberto: boolean;
  tarefa: Tarefa | null;
  quadroId: string;
  cartoes: FunilCartao[];
  perfis: Array<{ id: string; nome: string }>;
  perfilId: string;
  /** Quando o diálogo abre de dentro de um cartão, o cartão não se escolhe. */
  cartaoFixo?: string;
  prazoInicial?: string | null;
  aoFechar: () => void;
}) {
  const [estado, agir, gravando] = useActionState(
    tarefa ? gravarTarefa : criarTarefa,
    null as { erro?: string; ok?: boolean } | null,
  );
  const [cartaoId, setCartaoId] = useState(tarefa?.cartao_id ?? cartaoFixo ?? '');

  useEffect(() => {
    if (estado?.ok) aoFechar();
  }, [estado, aoFechar]);

  if (!aberto) return null;

  const nomeDoCartao = cartoes.find((c) => c.id === (cartaoFixo ?? cartaoId))?.empresa;

  return (
    <Dialogo
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={tarefa ? 'Editar tarefa' : 'Nova tarefa'}
      contexto={cartaoFixo ? nomeDoCartao || 'Cartão em branco' : undefined}
      largura="sm"
      rodape={
        <>
          <Botao variante="secondary" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao variante="primary" type="submit" form="forma-tarefa" disabled={gravando || !cartaoId}>
            {gravando ? 'Gravando…' : tarefa ? 'Salvar' : 'Criar tarefa'}
          </Botao>
        </>
      }
    >
      <form id="forma-tarefa" action={agir} className="grade">
        <input type="hidden" name="id" value={tarefa?.id ?? ''} />
        <input type="hidden" name="quadro_id" value={quadroId} />
        {cartaoFixo ? <input type="hidden" name="cartao_id" value={cartaoFixo} /> : null}

        {cartaoFixo ? (
          <Campo
            className="grade__inteiro"
            rotulo="Cartão"
            calculado
            valorInicial={nomeDoCartao || 'Cartão em branco'}
          />
        ) : (
          <SeletorPopup
            className="grade__inteiro"
            rotulo="Cartão"
            nome="cartao_id"
            valorInicial={cartaoId}
            placeholder="Escolha o cartão"
            opcoes={cartoes.map((c) => ({ valor: c.id, rotulo: c.empresa || 'Cartão em branco' }))}
            aoEscolher={setCartaoId}
          />
        )}

        <Campo
          className="grade__inteiro"
          rotulo="Título"
          nome="titulo"
          valorInicial={tarefa?.titulo ?? ''}
          placeholder="Ex.: Reunião com o cliente"
        />

        <SeletorPopup
          rotulo="Tipo"
          nome="tipo"
          valorInicial={tarefa?.tipo ?? ''}
          opcoes={TIPOS_TAREFA.map((t) => ({ valor: t.valor, rotulo: t.rotulo }))}
        />
        <SeletorPopup
          rotulo="Responsável"
          nome="responsavel_id"
          valorInicial={tarefa?.responsavel_id ?? perfilId}
          opcoes={perfis.map((p) => ({ valor: p.id, rotulo: p.nome }))}
        />

        <Campo
          rotulo="Prazo"
          nome="prazo"
          tipo="date"
          valorInicial={tarefa?.prazo?.slice(0, 10) ?? prazoInicial ?? ''}
        />
        <Campo rotulo="Hora (opcional)" nome="hora" tipo="time" valorInicial={tarefa?.hora?.slice(0, 5) ?? ''} />

        <Campo
          className="grade__inteiro campo-medio"
          rotulo="Descrição"
          nome="descricao"
          multilinha
          linhas={4}
          valorInicial={tarefa?.descricao ?? ''}
          placeholder="Digite aqui"
        />

        {!cartaoId ? (
          <p className="apoio grade__inteiro">
            Toda tarefa pertence a um cartão — escolha o cartão para poder salvar.
          </p>
        ) : null}

        {estado?.erro ? (
          <p className="lc-field__msg grade__inteiro" role="alert">
            {estado.erro}
          </p>
        ) : null}
      </form>
    </Dialogo>
  );
}
