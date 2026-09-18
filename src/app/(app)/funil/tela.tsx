'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { Botao, Campo } from '@/components/ui/base';
import { Dialogo } from '@/components/ui/dialogo';
import {
  IconeArquivar,
  IconeBuscar,
  IconeChevronDireita,
  IconeChevronEsquerda,
  IconeCliente,
  IconeFechar,
  IconeMais,
} from '@/components/ui/icones';
import { data } from '@/lib/dominio';
import {
  arquivarCartao,
  criarCartaoVazio,
  criarColuna,
  excluirColuna,
  moverCartao,
  trocarOrdemColunas,
} from './acoes';
import { DialogoCartao } from './dialogo';
import { DialogoColunas, DialogoTags } from './gestao';
import { PainelTarefas } from './tarefas';
import { DialogoVirarCliente } from './virar-cliente';
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
  clientes,
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
  clientes: Array<{ id: string; nome_razao: string }>;
  perfilId: string;
  ehMaster: boolean;
}) {
  const [aba, setAba] = useState<Aba>('quadro');
  const [busca, setBusca] = useState('');
  const [tagFiltro, setTagFiltro] = useState<string | null>(null);
  /**
   * O cartão aberto é guardado por **id**, não por objeto: depois de gravar, a
   * lista chega nova do servidor e um objeto preso no estado ficaria velho.
   * `recemCriado` cobre a fresta entre criar o cartão e a lista chegar.
   */
  const [abertoId, setAbertoId] = useState<string | null>(null);
  const [recemCriado, setRecemCriado] = useState<CartaoDoFunil | null>(null);
  const [criandoCartao, setCriandoCartao] = useState(false);
  const [novaColuna, setNovaColuna] = useState(false);
  const [gerindoTags, setGerindoTags] = useState(false);
  const [gerindoColunas, setGerindoColunas] = useState(false);
  /** Colunas que estão mostrando os arquivados em vez dos ativos. */
  const [vendoArquivados, setVendoArquivados] = useState<string[]>([]);
  const [colunaAExcluir, setColunaAExcluir] = useState<EtapaFunil | null>(null);
  const [aVirarCliente, setAVirarCliente] = useState<CartaoDoFunil | null>(null);
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

  const aberto = useMemo(() => {
    if (!abertoId) return null;
    return cartoes.find((c) => c.id === abertoId) ?? (recemCriado?.id === abertoId ? recemCriado : null);
  }, [abertoId, cartoes, recemCriado]);

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

  /** Busca e filtro de tag valem também para a vista de arquivados. */
  const passaNoFiltro = useCallback(
    (c: CartaoDoFunil) => {
      if (tagFiltro && !(tagsDe.get(c.id) ?? []).some((t) => t.id === tagFiltro)) return false;
      const alvo = busca.trim().toLowerCase();
      if (!alvo) return true;
      return [c.empresa, c.contato, c.indicante].some((v) => (v ?? '').toLowerCase().includes(alvo));
    },
    [busca, tagFiltro, tagsDe],
  );

  const visiveis = useMemo(
    () => cartoes.filter((c) => !c.arquivado && passaNoFiltro(c)),
    [cartoes, passaNoFiltro],
  );

  const colunas = useMemo(
    () => etapas.filter((e) => e.no_fluxo).sort((a, b) => a.ordem - b.ordem),
    [etapas],
  );

  /** Tag desativada some do filtro e da escolha no cartão — e não perde nada. */
  const tagsAtivas = useMemo(() => tags.filter((t) => t.ativo), [tags]);

  /** Cartões que a aba de tarefas oferece: os não arquivados, sem filtro de tela. */
  const cartoesParaTarefa = useMemo(() => cartoes.filter((c) => !c.arquivado), [cartoes]);

  const soltarEm = (etapaId: string | null) => {
    if (!arrastado) return;
    const naColuna = visiveis.filter((c) => c.etapa_id === etapaId).length;
    transicao(() => void moverCartao(arrastado, etapaId, naColuna));
    setArrastado(null);
  };

  /** Cria o cartão no banco e abre o diálogo já nele — nada se perde no meio. */
  const criarAqui = async (etapaId: string) => {
    if (!quadro || criandoCartao) return;
    setCriandoCartao(true);
    const criado = (await criarCartaoVazio(quadro.id, etapaId)) as CartaoDoFunil | null;
    setCriandoCartao(false);
    if (!criado) return;
    setRecemCriado(criado);
    setAbertoId(criado.id);
  };

  const abrirCartaoPorId = (cartaoId: string) => {
    if (cartoes.some((c) => c.id === cartaoId)) setAbertoId(cartaoId);
  };

  const emAberto = tarefas.filter((t) => !t.concluida).length;

  return (
    <div className="funil__tela">
      <div className="tela__topo">
        <h1 className="tela__titulo t-page-title">FUNIL COMERCIAL</h1>
        <div className="tela__acoes">
          <Botao variante="secondary" onClick={() => setGerindoColunas(true)}>
            Colunas no fluxo
          </Botao>
          <Botao variante="secondary" onClick={() => setGerindoTags(true)}>
            Tags
          </Botao>
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
      <div className="funil__aba" hidden={aba !== 'quadro'}>
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
            {tagsAtivas.map((t) => (
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
            const vendoArquivadosAqui = vendoArquivados.includes(coluna.id);
            const daColuna = cartoes.filter(
              (c) => c.etapa_id === coluna.id && !!c.arquivado === vendoArquivadosAqui && passaNoFiltro(c),
            );
            const ativosAqui = cartoes.filter((c) => c.etapa_id === coluna.id && !c.arquivado).length;
            const arquivadosAqui = cartoes.filter((c) => c.etapa_id === coluna.id && c.arquivado).length;

            return (
              <section
                key={coluna.id}
                className={['funil__coluna', vendoArquivadosAqui && 'funil__coluna--arquivados']
                  .filter(Boolean)
                  .join(' ')}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => soltarEm(coluna.id)}
              >
                <header className="funil__coluna-topo">
                  <div className="funil__coluna-acoes">
                    <button
                      type="button"
                      aria-label="Mover coluna para a esquerda"
                      title="Mover para a esquerda"
                      disabled={i === 0}
                      onClick={() =>
                        transicao(() =>
                          void trocarOrdemColunas(
                            coluna.id,
                            coluna.ordem,
                            colunas[i - 1].id,
                            colunas[i - 1].ordem,
                          ),
                        )
                      }
                    >
                      <IconeChevronEsquerda tamanho={15} />
                    </button>
                    <button
                      type="button"
                      aria-label="Mover coluna para a direita"
                      title="Mover para a direita"
                      disabled={i === colunas.length - 1}
                      onClick={() =>
                        transicao(() =>
                          void trocarOrdemColunas(
                            coluna.id,
                            coluna.ordem,
                            colunas[i + 1].id,
                            colunas[i + 1].ordem,
                          ),
                        )
                      }
                    >
                      <IconeChevronDireita tamanho={15} />
                    </button>
                  </div>
                  <h2 className="funil__coluna-nome">{coluna.nome}</h2>
                  <div className="funil__coluna-acoes">
                    {/* A caixa mostra os arquivados DA COLUNA — não arquiva a
                        coluna. É o que o botão faz no funil original. */}
                    <button
                      type="button"
                      className={vendoArquivadosAqui ? 'funil__coluna-acao--ativa' : undefined}
                      aria-pressed={vendoArquivadosAqui}
                      aria-label={
                        vendoArquivadosAqui
                          ? `Ver cartões ativos de ${coluna.nome}`
                          : `Ver cartões arquivados de ${coluna.nome}`
                      }
                      title={vendoArquivadosAqui ? 'Ver ativos' : 'Ver arquivados'}
                      onClick={() =>
                        setVendoArquivados((v) =>
                          v.includes(coluna.id) ? v.filter((x) => x !== coluna.id) : [...v, coluna.id],
                        )
                      }
                    >
                      <IconeArquivar tamanho={15} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Excluir coluna ${coluna.nome}`}
                      title="Excluir coluna"
                      onClick={() => setColunaAExcluir(coluna)}
                    >
                      <IconeFechar tamanho={15} />
                    </button>
                  </div>
                </header>

                <p className="funil__coluna-contagem apoio">
                  <span className={vendoArquivadosAqui ? undefined : 'funil__contagem--forte'}>
                    {ativosAqui} {ativosAqui === 1 ? 'cartão' : 'cartões'}
                  </span>{' '}
                  /{' '}
                  <span className={vendoArquivadosAqui ? 'funil__contagem--forte' : undefined}>
                    {arquivadosAqui} arquivado{arquivadosAqui === 1 ? '' : 's'}
                  </span>
                </p>

                <div className="funil__cartoes">
                  {daColuna.map((c) => (
                    <Cartao
                      key={c.id}
                      cartao={c}
                      tags={tagsDe.get(c.id) ?? []}
                      tarefasEmAberto={tarefas.filter((t) => t.cartao_id === c.id && !t.concluida).length}
                      aoAbrir={() => setAbertoId(c.id)}
                      aoArquivar={() => transicao(() => void arquivarCartao(c.id, !c.arquivado))}
                      aoArrastar={() => setArrastado(c.id)}
                      aoVirarCliente={() => setAVirarCliente(c)}
                    />
                  ))}
                </div>

                {/* Na vista de arquivados não se cria cartão — como no original. */}
                {vendoArquivadosAqui ? null : (
                  <button
                    type="button"
                    className="funil__novo"
                    disabled={criandoCartao}
                    onClick={() => void criarAqui(coluna.id)}
                  >
                    <IconeMais tamanho={14} /> {criandoCartao ? 'Criando…' : 'Novo cartão'}
                  </button>
                )}
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

      {aberto && quadro ? (
        <DialogoCartao
          aberto
          cartao={aberto}
          quadroId={quadro.id}
          etapaInicial={null}
          etapas={colunas}
          tags={tagsAtivas}
          tagsDoCartao={aberto ? (tagsDe.get(aberto.id) ?? []).map((t) => t.id) : []}
          perfis={perfis}
          perfilId={perfilId}
          usuariosDoCartao={
            aberto ? cartaoUsuarios.filter((u) => u.cartao_id === aberto.id).map((u) => u.perfil_id) : []
          }
          tarefas={aberto ? tarefas.filter((t) => t.cartao_id === aberto.id) : []}
          aoVirarCliente={() => aberto && setAVirarCliente(aberto)}
          aoFechar={() => {
            setAbertoId(null);
            setRecemCriado(null);
          }}
        />
      ) : null}

      <DialogoVirarCliente
        cartao={aVirarCliente}
        clientes={clientes}
        aoFechar={() => setAVirarCliente(null)}
      />

      {quadro ? (
        <>
          <DialogoNovaColuna
            aberto={novaColuna}
            quadroId={quadro.id}
            aoFechar={() => setNovaColuna(false)}
          />
          <DialogoTags
            aberto={gerindoTags}
            quadroId={quadro.id}
            tags={tags}
            aoFechar={() => setGerindoTags(false)}
          />
          <DialogoColunas
            aberto={gerindoColunas}
            etapas={etapas}
            aoFechar={() => setGerindoColunas(false)}
          />
          <DialogoExcluirColuna
            coluna={colunaAExcluir}
            quantosCartoes={
              colunaAExcluir
                ? cartoes.filter((c) => c.etapa_id === colunaAExcluir.id).length
                : 0
            }
            aoFechar={() => setColunaAExcluir(null)}
          />
        </>
      ) : null}
    </div>
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
  aoVirarCliente,
}: {
  cartao: CartaoDoFunil;
  tags: TagFunil[];
  tarefasEmAberto: number;
  aoAbrir: () => void;
  aoArquivar: () => void;
  aoArrastar: () => void;
  aoVirarCliente: () => void;
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
        {/* As duas ações do cartão no quadro: virar cliente e arquivar. */}
        <button
          type="button"
          className="funil__cartao-acao"
          onClick={aoVirarCliente}
          title={cartao.cliente_id ? 'Ver cliente' : 'Cadastrar como cliente'}
          aria-label={cartao.cliente_id ? 'Ver cliente' : 'Cadastrar como cliente'}
        >
          <IconeCliente tamanho={14} />
        </button>
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
          {cartao.cliente_id ? (
            <span className="funil__pilula funil__pilula--cliente">já é cliente</span>
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

/* ------------------------------------------------------- excluir coluna ---- */

/**
 * Excluir coluna apaga os cartões dela — é o que o funil original faz. Por
 * isso a pergunta traz a contagem na frente: quem clica no ✕ precisa saber o
 * tamanho do estrago antes, não depois.
 */
function DialogoExcluirColuna({
  coluna,
  quantosCartoes,
  aoFechar,
}: {
  coluna: EtapaFunil | null;
  quantosCartoes: number;
  aoFechar: () => void;
}) {
  const [, transicao] = useTransition();

  return (
    <Dialogo
      aberto={coluna !== null}
      aoFechar={aoFechar}
      titulo="Excluir coluna"
      largura="sm"
      rodape={
        <>
          <Botao variante="secondary" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao
            variante="danger"
            onClick={() => {
              if (coluna) transicao(() => void excluirColuna(coluna.id));
              aoFechar();
            }}
          >
            Excluir coluna
          </Botao>
        </>
      }
    >
      <p>
        {quantosCartoes > 0 ? (
          <>
            A coluna <strong>{coluna?.nome}</strong> tem{' '}
            <strong>
              {quantosCartoes} {quantosCartoes === 1 ? 'cartão' : 'cartões'}
            </strong>{' '}
            (contando os arquivados). Excluir a coluna <strong>apaga esses cartões</strong>, e isso
            não tem volta.
          </>
        ) : (
          <>
            Excluir a coluna <strong>{coluna?.nome}</strong>? Ela está vazia.
          </>
        )}
      </p>
    </Dialogo>
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
