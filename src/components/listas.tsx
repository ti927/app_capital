'use client';

import { useState, type ReactNode } from 'react';
import { Botao } from './ui/base';
import { Dialogo } from './ui/dialogo';
import {
  IconeArquivar,
  IconeBuscar,
  IconeChevronBaixo,
  IconeChevronCima,
  IconeDeletar,
  IconeDesarquivar,
  IconeEditar,
} from './ui/icones';

/* -------------------------------------------------------------- busca ----- */

export function Busca({
  valor,
  aoMudar,
  placeholder,
}: {
  valor: string;
  aoMudar: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="busca">
      <span className="lc-field__label" style={{ position: 'absolute', left: -9999 }}>
        {placeholder}
      </span>
      <input
        className="busca__campo"
        type="search"
        value={valor}
        placeholder={placeholder}
        onChange={(e) => aoMudar(e.target.value)}
      />
      <span className="busca__lupa">
        <IconeBuscar tamanho={16} />
      </span>
    </label>
  );
}

/* ------------------------------------------------------- ações da linha --- */

/**
 * As três ações de uma linha, **nesta ordem: arquivar · deletar · editar**.
 * É a ordem de produção, confirmada nas capturas — ver
 * design/design-system/10-telas.md.
 */
export function AcoesLinha({
  aoArquivar,
  aoExcluir,
  aoEditar,
  rotuloArquivar = 'Arquivar',
}: {
  aoArquivar?: () => void;
  aoExcluir?: () => void;
  aoEditar?: () => void;
  rotuloArquivar?: string;
}) {
  return (
    <span className="lc-table__actions">
      {aoArquivar ? (
        <Botao variante="tertiary" tamanho="row" onClick={aoArquivar} title={rotuloArquivar} aria-label={rotuloArquivar}>
          {rotuloArquivar === 'Desarquivar' ? <IconeDesarquivar /> : <IconeArquivar />}
        </Botao>
      ) : null}
      {aoExcluir ? (
        <Botao variante="tertiary" tamanho="row" onClick={aoExcluir} title="Deletar" aria-label="Deletar">
          <IconeDeletar />
        </Botao>
      ) : null}
      {aoEditar ? (
        <Botao variante="tertiary" tamanho="row" onClick={aoEditar} title="Editar" aria-label="Editar">
          <IconeEditar />
        </Botao>
      ) : null}
    </span>
  );
}

/* ------------------------------------------------------- bloco arquivados - */

/** Recolhível, fechado por padrão. Some quando a contagem é zero. */
export function BlocoArquivados({
  quantidade,
  children,
}: {
  quantidade: number;
  children: ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  if (!quantidade) return null;

  return (
    <section className="arquivados">
      <button
        type="button"
        className="arquivados__cabecalho"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
      >
        <IconeArquivar tamanho={15} />
        <span>Arquivados</span>
        <span className="apoio">({quantidade})</span>
        {aberto ? <IconeChevronCima tamanho={15} /> : <IconeChevronBaixo tamanho={15} />}
      </button>
      {aberto ? <div className="arquivados__corpo">{children}</div> : null}
    </section>
  );
}

/* ----------------------------------------------------- confirmar exclusão - */

/**
 * Texto do original, com o nome em negrito:
 * "Tem certeza que deseja deletar o cliente **{nome}**? Essa ação é permanente
 * e não pode ser revertida."
 */
export function ConfirmarExclusao({
  aberto,
  entidade,
  artigo = 'o',
  nome,
  aoFechar,
  aoConfirmar,
}: {
  aberto: boolean;
  entidade: string;
  artigo?: string;
  nome: string;
  aoFechar: () => void;
  aoConfirmar: () => void;
}) {
  return (
    <Dialogo
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={`Deletar ${entidade}`}
      largura="sm"
      rodape={
        <>
          <Botao variante="secondary" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao
            variante="danger"
            onClick={() => {
              aoConfirmar();
              aoFechar();
            }}
          >
            Deletar
          </Botao>
        </>
      }
    >
      <p>
        Tem certeza que deseja deletar {artigo} {entidade.toLowerCase()} <strong>{nome}</strong>?
      </p>
      <p className="apoio">Essa ação é permanente e não pode ser revertida.</p>
    </Dialogo>
  );
}

/* --------------------------------------------------------- item da lista -- */

/**
 * Linha de lista clicável: o nome inteiro abre a edição, não só o lápis.
 * O botão cobre toda a área de texto, então o alvo é grande; as ações ficam
 * fora dele para o clique não se confundir.
 */
export function ItemDaLista({
  aoAbrir,
  children,
  acoes,
  rotuloAbrir,
}: {
  aoAbrir: () => void;
  children: ReactNode;
  acoes?: ReactNode;
  rotuloAbrir?: string;
}) {
  return (
    <li className="lista__item">
      <button type="button" className="lista__abrir" onClick={aoAbrir} aria-label={rotuloAbrir}>
        {children}
      </button>
      {acoes}
    </li>
  );
}
