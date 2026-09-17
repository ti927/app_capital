'use client';

import { useMemo, useState, useTransition } from 'react';
import { Botao, Campo } from '@/components/ui/base';
import { Dialogo } from '@/components/ui/dialogo';
import { data, type FunilCartao } from '@/lib/dominio';
import { arquivarCartao, criarColuna, excluirColuna, moverCartao, moverColuna } from './acoes';
import { DialogoCartao } from './dialogo';
import type { EtapaFunil, TagFunil } from './page';

export function TelaFunil({
  quadro,
  etapas,
  tags,
  cartoes,
  cartaoTags,
  cartaoUsuarios,
  perfis,
}: {
  quadro: { id: string; nome: string } | null;
  etapas: EtapaFunil[];
  tags: TagFunil[];
  cartoes: FunilCartao[];
  cartaoTags: Array<{ cartao_id: string; tag_id: string }>;
  cartaoUsuarios: Array<{ cartao_id: string; perfil_id: string }>;
  perfis: Array<{ id: string; nome: string }>;
}) {
  const [busca, setBusca] = useState('');
  const [tagFiltro, setTagFiltro] = useState<string | null>(null);
  const [aberto, setAberto] = useState<FunilCartao | null>(null);
  const [criandoEm, setCriandoEm] = useState<string | null>(null);
  const [novaColuna, setNovaColuna] = useState(false);
  const [arrastado, setArrastado] = useState<string | null>(null);
  const [, transicao] = useTransition();

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

  const colunas = useMemo(() => etapas.filter((e) => e.no_fluxo).sort((a, b) => a.ordem - b.ordem), [etapas]);

  const soltarEm = (etapaId: string | null) => {
    if (!arrastado) return;
    const naColuna = visiveis.filter((c) => c.etapa_id === etapaId).length;
    transicao(() => void moverCartao(arrastado, etapaId, naColuna));
    setArrastado(null);
  };

  return (
    <>
      <div className="tela__topo">
        <h1 className="tela__titulo t-page-title">FUNIL COMERCIAL</h1>
        <div className="tela__acoes">
          <Botao variante="secondary">Colunas no fluxo</Botao>
          <Botao variante="secondary">Tags</Botao>
          <Botao variante="primary" onClick={() => setNovaColuna(true)}>
            Nova coluna
          </Botao>
        </div>
      </div>

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
          <span className="busca__lupa" aria-hidden="true">
            ⌕
          </span>
        </label>

        <span className="apoio">Filtrar por tag:</span>
        <div className="funil__tags">
          {tags.map((t) => (
            <button
              key={t.id}
              type="button"
              className={['lc-chip', 'funil__tag', tagFiltro === t.id && 'funil__tag--ativa'].filter(Boolean).join(' ')}
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
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Mover coluna para a direita"
                    disabled={i === colunas.length - 1}
                    onClick={() => transicao(() => void moverColuna(coluna.id, coluna.ordem + 1.5))}
                  >
                    ›
                  </button>
                </div>
                <h2 className="funil__coluna-nome">{coluna.nome}</h2>
                <div className="funil__coluna-acoes">
                  <button type="button" aria-label="Arquivar coluna" title="Arquivar">
                    🗄
                  </button>
                  <button
                    type="button"
                    aria-label="Excluir coluna"
                    title="Excluir"
                    onClick={() => transicao(() => void excluirColuna(coluna.id))}
                  >
                    ✕
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
                    aoAbrir={() => setAberto(c)}
                    aoArquivar={() => transicao(() => void arquivarCartao(c.id, true))}
                    aoArrastar={() => setArrastado(c.id)}
                  />
                ))}
              </div>

              <button type="button" className="funil__novo" onClick={() => setCriandoEm(coluna.id)}>
                + Novo cartão
              </button>
            </section>
          );
        })}
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
          usuariosDoCartao={
            aberto ? cartaoUsuarios.filter((u) => u.cartao_id === aberto.id).map((u) => u.perfil_id) : []
          }
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
  aoAbrir,
  aoArquivar,
  aoArrastar,
}: {
  cartao: FunilCartao;
  tags: TagFunil[];
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
        <button type="button" className="funil__cartao-arquivar" onClick={aoArquivar} aria-label="Arquivar cartão">
          🗄
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
