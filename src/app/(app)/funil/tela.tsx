'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Botao, Campo } from '@/components/ui/base';
import { Dialogo } from '@/components/ui/dialogo';
import {
  IconeArquivar,
  IconeBuscar,
  IconeChevronDireita,
  IconeChevronEsquerda,
  IconeFechar,
  IconeMais,
} from '@/components/ui/icones';
import { data } from '@/lib/dominio';
import { arquivarCartao, criarColuna, excluirColuna, moverCartao, moverColuna } from './acoes';
import { DialogoCartao } from './dialogo';
import { PainelTarefas } from './tarefas';
import type { CartaoDoFunil, EtapaFunil, TagFunil, Tarefa } from './page';
import './funil.css';

type Aba = 'quadro' | 'tarefas';

export function TelaFunil({
  quadro,
  etapas,
  tags,
  cartoes,
  cartaoTags,
  cartaoUsuarios,
  perfis,
  tarefas,
  perfilId,
  ehMaster,
}: {
  quadro: { id: string; nome: string } | null;
  etapas: EtapaFunil[];
  tags: TagFunil[];
  cartoes: CartaoDoFunil[];
  cartaoTags: Array<{ cartao_id: string; tag_id: string }>;
  cartaoUsuarios: Array<{ cartao_id: string; perfil_id: string }>;
  perfis: Array<{ id: string; nome: string }>;
  tarefas: Tarefa[];
  perfilId: string;
  ehMaster: boolean;
}) {
  const [aba, setAba] = useState<Aba>('quadro');
  const [busca, setBusca] = useState('');
  const [tagFiltro, setTagFiltro] = useState<string | null>(null);
  const [aberto, setAberto] = useState<CartaoDoFunil | null>(null);
  const [criandoEm, setCriandoEm] = useState<string | null>(null);
  const [novaColuna, setNovaColuna] = useState(false);
  const [arrastado, setArrastado] = useState<string | null>(null);
  const [, transicao] = useTransition();

  // `?aba=tarefas` deixa o link compartilhável. Lido uma vez, na montagem:
  // depois quem manda é o estado local, para a troca de aba não recarregar.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('aba') === 'tarefas') setAba('tarefas');
  }, []);

  const trocarAba = (nova: Aba) => {
    setAba(nova);
    const url = new URL(window.location.href);
    if (nova === 'tarefas') url.searchParams.set('aba', 'tarefas');
    else url.searchParams.delete('aba');
    // `replaceState` e não `router.push`: trocar de aba não é navegação, e o
    // quadro não pode remontar nem perder busca e filtro de tag.
    window.history.replaceState(null, '', url.toString());
  };

  const tagsDe = useMemo(() => {
    const mapa = new Map<string, TagFunil[]>();
    const porId = new Map(tags.map((t) => [t.id, t]));
    for (const v of cartaoTags) {
      const t = porId.get(v.tag_id);
      if (!t) continue;
      mapa.set(v.cartao_id, [...(mapa.get(v.cartao_id) ?? []), t]);
    }
    return mapa;
  }, [cartaoTags, tags]);

  const visiveis = useMemo(() => {
    const alvo = busca.trim().toLowerCase();
    return cartoes.filter((c) => {
      if (c.arquivado) return false;
      if (tagFiltro && !(tagsDe.get(c.id) ?? []).some((t) => t.id === tagFiltro)) return false;
      if (!alvo) return true;
      return [c.empresa, c.contato, c.indicante].some((v) => (v ?? '').toLowerCase().includes(alvo));
    });
  }, [cartoes, busca, tagFiltro, tagsDe]);

  const colunas = useMemo(
    () => etapas.filter((e) => e.no_fluxo).sort((a, b) => a.ordem - b.ordem),
    [etapas],
  );

  /** Cartões que a aba de tarefas oferece: os não arquivados, sem filtro de tela. */
  const cartoesParaTarefa = useMemo(() => cartoes.filter((c) => !c.arquivado), [cartoes]);

  const soltarEm = (etapaId: string | null) => {
    if (!arrastado) return;
    const naColuna = visiveis.filter((c) => c.etapa_id === etapaId).length;
    transicao(() => void moverCartao(arrastado, etapaId, naColuna));
    setArrastado(null);
  };

  const abrirCartaoPorId = (cartaoId: string) => {
    const alvo = cartoes.find((c) => c.id === cartaoId);
    if (alvo) setAberto(alvo);
  };

  const emAberto = tarefas.filter((t) => !t.concluida).length;

  return (
    <>
      <div className="tela__topo">
        <h1 className="tela__titulo t-page-title">FUNIL COMERCIAL</h1>
        <div className="tela__acoes">
          <Botao variante="secondary">Colunas no fluxo</Botao>
          <Botao variante="secondary">Tags</Botao>
          <Botao variante="primary" onClick={() => setNovaColuna(true)}>
            <IconeMais tamanho={15} /> Nova coluna
          </Botao>
        </div>
      </div>

      <div className="abas" role="tablist">
        <button
          type="button"
          role="tab"
          className="abas__item"
          aria-selected={aba === 'quadro'}
          onClick={() => trocarAba('quadro')}
        >
          Quadro
        </button>
        <button
          type="button"
          role="tab"
          className="abas__item"
          aria-selected={aba === 'tarefas'}
          onClick={() => trocarAba('tarefas')}
        >
          Tarefas {emAberto ? <span className="abas__conta">{emAberto}</span> : null}
        </button>
      </div>

      {/* As duas abas ficam montadas: trocar de aba não pode remontar o quadro
          nem perder busca e filtro de tag. `hidden` esconde sem desmontar. */}
      <div hidden={aba !== 'quadro'}>
        {/* Barra de filtro: busca e as cinco tags como pílulas com ponto colorido. */}
        <div className="funil__filtros">
          <label className="busca">
            <span className="lc-field__label" style={{ position: 'absolute', left: -9999 }}>
              Buscar
            </span>
            <input
              className="busca__campo"
              type="search"
              value={busca}
              placeholder="Buscar empresa, contato, indicante.."
              onChange={(e) => setBusca(e.target.value)}
            />
            <span className="busca__lupa">
              <IconeBuscar tamanho={16} />
            </span>
          </label>

          <span className="apoio">Filtrar por tag:</span>
          <div className="funil__tags">
            {tags.map((t) => (
              <button
                key={t.id}
                type="button"
                className={['lc-chip', 'funil__tag', tagFiltro === t.id && 'funil__tag--ativa']
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={tagFiltro === t.id}
                onClick={() => setTagFiltro((v) => (v === t.id ? null : t.id))}
              >
                <span className="lc-chip__dot" style={{ background: t.cor ?? 'var(--border-strong)' }} />
                {t.nome}
              </button>
            ))}
          </div>
        </div>

        {/* Quadro: colunas roláveis na horizontal. */}
        <div className="funil__quadro">
          {colunas.map((coluna, i) => {
            const daColuna = visiveis.filter((c) => c.etapa_id === coluna.id);
            const arquivadosAqui = cartoes.filter((c) => c.etapa_id === coluna.id && c.arquivado).length;

            return (
              <section
                key={coluna.id}
                className="funil__coluna"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => soltarEm(coluna.id)}
              >
                <header className="funil__coluna-topo">
                  <div className="funil__coluna-acoes">
                    <button
                      type="button"
                      aria-label="Mover coluna para a esquerda"
                      disabled={i === 0}
                      onClick={() => transicao(() => void moverColuna(coluna.id, coluna.ordem - 1.5))}
                    >
                      <IconeChevronEsquerda tamanho={15} />
                    </button>
                    <button
                      type="button"
                      aria-label="Mover coluna para a direita"
                      disabled={i === colunas.length - 1}
                      onClick={() => transicao(() => void moverColuna(coluna.id, coluna.ordem + 1.5))}
                    >
                      <IconeChevronDireita tamanho={15} />
                    </button>
                  </div>
                  <h2 className="funil__coluna-nome">{coluna.nome}</h2>
                  <div className="funil__coluna-acoes">
                    <button type="button" aria-label="Arquivar coluna" title="Arquivar">
                      <IconeArquivar tamanho={15} />
                    </button>
                    <button
                      type="button"
                      aria-label="Excluir coluna"
                      title="Excluir"
                      onClick={() => transicao(() => void excluirColuna(coluna.id))}
                    >
                      <IconeFechar tamanho={15} />
                    </button>
                  </div>
                </header>

                <p className="funil__coluna-contagem apoio">
                  {daColuna.length} {daColuna.length === 1 ? 'cartão' : 'cartões'} / {arquivadosAqui} arquivados
                </p>

                <div className="funil__cartoes">
                  {daColuna.map((c) => (
                    <Cartao
                      key={c.id}
                      cartao={c}
                      tags={tagsDe.get(c.id) ?? []}
                      tarefasEmAberto={tarefas.filter((t) => t.cartao_id === c.id && !t.concluida).length}
                      aoAbrir={() => setAberto(c)}
                      aoArquivar={() => transicao(() => void arquivarCartao(c.id, true))}
                      aoArrastar={() => setArrastado(c.id)}
                    />
                  ))}
                </div>

                <button type="button" className="funil__novo" onClick={() => setCriandoEm(coluna.id)}>
                  <IconeMais tamanho={14} /> Novo cartão
                </button>
              </section>
            );
          })}
        </div>
      </div>

      <div hidden={aba !== 'tarefas'}>
        <PainelTarefas
          tarefas={tarefas}
          cartoes={cartoesParaTarefa}
          perfis={perfis}
          perfilId={perfilId}
          ehMaster={ehMaster}
          quadroId={quadro?.id ?? null}
          aoAbrirCartao={abrirCartaoPorId}
        />
      </div>

      {(aberto || criandoEm) && quadro ? (
        <DialogoCartao
          aberto
          cartao={aberto}
          quadroId={quadro.id}
          etapaInicial={criandoEm}
          etapas={colunas}
          tags={tags}
          tagsDoCartao={aberto ? (tagsDe.get(aberto.id) ?? []).map((t) => t.id) : []}
          perfis={perfis}
          perfilId={perfilId}
          usuariosDoCartao={
            aberto ? cartaoUsuarios.filter((u) => u.cartao_id === aberto.id).map((u) => u.perfil_id) : []
          }
          tarefas={aberto ? tarefas.filter((t) => t.cartao_id === aberto.id) : []}
          aoFechar={() => {
            setAberto(null);
            setCriandoEm(null);
          }}
        />
      ) : null}

      {quadro ? (
        <DialogoNovaColuna
          aberto={novaColuna}
          quadroId={quadro.id}
          aoFechar={() => setNovaColuna(false)}
        />
      ) : null}
    </>
  );
}

/* ----------------------------------------------------------------- cartão -- */

/**
 * Cartão, de cima para baixo: as tags (ou "sem tags") · empresa em negrito ·
 * contato · segmento · o parecer truncado · pílula de faturamento · pílula
 * "indicado por ‹nome›" · rodapé com "atualizado dd/mm/aaaa" e, quando houver,
 * "· call" e "- KB".
 */
function Cartao({
  cartao,
  tags,
  tarefasEmAberto,
  aoAbrir,
  aoArquivar,
  aoArrastar,
}: {
  cartao: CartaoDoFunil;
  tags: TagFunil[];
  tarefasEmAberto: number;
  aoAbrir: () => void;
  aoArquivar: () => void;
  aoArrastar: () => void;
}) {
  return (
    <article className="funil__cartao" draggable onDragStart={aoArrastar}>
      <div className="funil__cartao-tags">
        {tags.length ? (
          tags.map((t) => (
            <span key={t.id} className="lc-chip">
              <span className="lc-chip__dot" style={{ background: t.cor ?? 'var(--border-strong)' }} />
              {t.nome}
            </span>
          ))
        ) : (
          <span className="apoio funil__sem-tags">sem tags</span>
        )}
        <button
          type="button"
          className="funil__cartao-arquivar"
          onClick={aoArquivar}
          aria-label="Arquivar cartão"
        >
          <IconeArquivar tamanho={14} />
        </button>
      </div>

      <button type="button" className="funil__cartao-corpo" onClick={aoAbrir}>
        <p className="funil__empresa">{cartao.empresa || 'Cartão em branco'}</p>
        {cartao.contato || cartao.segmento ? (
          <p className="funil__linha-apoio">
            {[cartao.contato, cartao.segmento].filter(Boolean).join(' · ')}
          </p>
        ) : null}
        {cartao.parecer ? <p className="funil__parecer">{cartao.parecer}</p> : null}

        <div className="funil__pilulas">
          {cartao.faturamento ? <span className="funil__pilula">{cartao.faturamento}</span> : null}
          {cartao.indicante ? (
            <span className="funil__pilula funil__pilula--fraca">indicado por {cartao.indicante}</span>
          ) : null}
          {tarefasEmAberto ? (
            <span className="funil__pilula funil__pilula--tarefa">
              {tarefasEmAberto} {tarefasEmAberto === 1 ? 'tarefa' : 'tarefas'}
            </span>
          ) : null}
        </div>

        <p className="funil__rodape">
          atualizado {data(cartao.atualizado_em)}
          {cartao.data_call ? ` · call ${data(cartao.data_call)}` : ''}
          {cartao.data_kb ? ` - KB ${data(cartao.data_kb)}` : ''}
        </p>
      </button>
    </article>
  );
}

/* --------------------------------------------------------- nova coluna ---- */

function DialogoNovaColuna({
  aberto,
  quadroId,
  aoFechar,
}: {
  aberto: boolean;
  quadroId: string;
  aoFechar: () => void;
}) {
  const [nome, setNome] = useState('');
  const [, transicao] = useTransition();

  return (
    <Dialogo
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Nova coluna"
      largura="sm"
      rodape={
        <>
          <Botao variante="secondary" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao
            variante="primary"
            disabled={!nome.trim()}
            onClick={() => {
              transicao(() => void criarColuna(quadroId, nome));
              setNome('');
              aoFechar();
            }}
          >
            Criar coluna
          </Botao>
        </>
      }
    >
      <Campo rotulo="Nome da coluna" valor={nome} aoMudar={setNome} placeholder="Ex.: Negociação" />
      <p className="apoio">
        A coluna entra no fim do fluxo. Você pode reordenar em &ldquo;Colunas no fluxo&rdquo;.
      </p>
    </Dialogo>
  );
}
