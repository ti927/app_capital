'use client';

import { useMemo, useState } from 'react';
import { Botao } from './base';
import { Dialogo } from './dialogo';
import { IconeBuscar, IconeChevronBaixo, IconeFechar, IconeSalvar } from './icones';

export interface Opcao {
  valor: string;
  rotulo: string;
  /** Ponto colorido antes do rótulo — usado por status e tag. */
  cor?: string;
}

/* ------------------------------------------------------------------ único -- */

export interface SeletorPopupProps {
  rotulo?: string;
  nome?: string;
  opcoes: Opcao[];
  valorInicial?: string;
  placeholder?: string;
  desabilitado?: boolean;
  className?: string;
  /** Avisa o consumidor quando quem escolhe não é um formulário. */
  aoEscolher?: (valor: string) => void;
}

/**
 * Escolha de um valor. Abre um pop-up com busca em vez do menu suspenso nativo:
 * o menu nativo abre para baixo, corta em tela curta e não tem busca — com 31
 * tipos de operação ou 73 fundos isso é inutilizável.
 */
export function SeletorPopup({
  rotulo,
  nome,
  opcoes,
  valorInicial = '',
  placeholder = 'Escolha aqui',
  desabilitado,
  className,
  aoEscolher,
}: SeletorPopupProps) {
  const [valor, setValor] = useState(valorInicial);
  const [aberto, setAberto] = useState(false);
  const [filtro, setFiltro] = useState('');

  const escolhida = opcoes.find((o) => o.valor === valor);
  const visiveis = useFiltradas(opcoes, filtro);

  return (
    <div className={['lc-field', className].filter(Boolean).join(' ')}>
      {rotulo ? <span className="lc-field__label">{rotulo}</span> : null}
      {nome ? <input type="hidden" name={nome} value={valor} /> : null}

      <button
        type="button"
        className="gatilho"
        disabled={desabilitado}
        onClick={() => setAberto(true)}
        aria-haspopup="dialog"
      >
        <span className={escolhida ? 'gatilho__valor' : 'gatilho__vazio'}>
          {escolhida ? (
            <>
              {escolhida.cor ? <span className="gatilho__ponto" style={{ background: escolhida.cor }} /> : null}
              {escolhida.rotulo}
            </>
          ) : (
            placeholder
          )}
        </span>
        <IconeChevronBaixo tamanho={14} />
      </button>

      <Dialogo
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        titulo={rotulo ?? 'Escolha'}
        largura="sm"
        rodape={
          <>
            {valor ? (
              <Botao
                variante="tertiary"
                onClick={() => {
                  setValor('');
                  aoEscolher?.('');
                  setAberto(false);
                }}
              >
                Limpar
              </Botao>
            ) : null}
            <Botao variante="secondary" onClick={() => setAberto(false)}>
              Fechar
            </Botao>
          </>
        }
      >
        <CampoDeFiltro valor={filtro} aoMudar={setFiltro} total={opcoes.length} />
        <ul className="opcoes">
          {visiveis.map((o) => (
            <li key={o.valor}>
              <button
                type="button"
                className={['opcoes__item', o.valor === valor && 'opcoes__item--ativo'].filter(Boolean).join(' ')}
                onClick={() => {
                  setValor(o.valor);
                  aoEscolher?.(o.valor);
                  setAberto(false);
                }}
              >
                {o.cor ? <span className="gatilho__ponto" style={{ background: o.cor }} /> : null}
                <span className="opcoes__rotulo">{o.rotulo}</span>
                {o.valor === valor ? <IconeSalvar tamanho={14} /> : null}
              </button>
            </li>
          ))}
          {visiveis.length === 0 ? <li className="opcoes__vazio apoio">Nada encontrado</li> : null}
        </ul>
      </Dialogo>
    </div>
  );
}

/* --------------------------------------------------------------- múltiplo -- */

export interface SeletorMultiploProps {
  rotulo?: string;
  nome: string;
  opcoes: Opcao[];
  inicial?: string[];
  placeholder?: string;
  desabilitado?: boolean;
  className?: string;
  /** Pinta as fichas escolhidas em vermelho — "tipos não atendidos". */
  negativo?: boolean;
  aoMudar?: (valores: string[]) => void;
}

/** Escolha de vários valores, no mesmo pop-up com busca. */
export function SeletorMultiploPopup({
  rotulo,
  nome,
  opcoes,
  inicial = [],
  placeholder = 'Escolha aqui',
  desabilitado,
  className,
  negativo,
  aoMudar,
}: SeletorMultiploProps) {
  const [escolhidos, setEscolhidos] = useState<string[]>(inicial);
  const [aberto, setAberto] = useState(false);
  const [filtro, setFiltro] = useState('');

  const visiveis = useFiltradas(opcoes, filtro);
  const porValor = useMemo(() => new Map(opcoes.map((o) => [o.valor, o])), [opcoes]);

  const alternar = (v: string) => {
    const novo = escolhidos.includes(v) ? escolhidos.filter((x) => x !== v) : [...escolhidos, v];
    setEscolhidos(novo);
    aoMudar?.(novo);
  };

  return (
    <div className={['lc-field', className].filter(Boolean).join(' ')}>
      {rotulo ? <span className="lc-field__label">{rotulo}</span> : null}
      {escolhidos.map((v) => (
        <input key={v} type="hidden" name={nome} value={v} />
      ))}

      <button
        type="button"
        className="gatilho"
        disabled={desabilitado}
        onClick={() => setAberto(true)}
        aria-haspopup="dialog"
      >
        {escolhidos.length === 0 ? (
          <span className="gatilho__vazio">{placeholder}</span>
        ) : (
          <span className="gatilho__fichas">
            {escolhidos.slice(0, 3).map((v) => (
              <span key={v} className={['ficha', negativo && 'ficha--negativa'].filter(Boolean).join(' ')}>
                {porValor.get(v)?.rotulo ?? v}
              </span>
            ))}
            {escolhidos.length > 3 ? <span className="apoio">+{escolhidos.length - 3}</span> : null}
          </span>
        )}
        <IconeChevronBaixo tamanho={14} />
      </button>

      <Dialogo
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        titulo={rotulo ?? 'Escolha'}
        contexto={escolhidos.length ? `${escolhidos.length} selecionado(s)` : undefined}
        largura="sm"
        rodape={
          <>
            {escolhidos.length ? (
              <Botao
                variante="tertiary"
                onClick={() => {
                  setEscolhidos([]);
                  aoMudar?.([]);
                }}
              >
                Limpar
              </Botao>
            ) : null}
            <Botao variante="primary" onClick={() => setAberto(false)}>
              Pronto
            </Botao>
          </>
        }
      >
        <CampoDeFiltro valor={filtro} aoMudar={setFiltro} total={opcoes.length} />
        <ul className="opcoes">
          {visiveis.map((o) => {
            const marcado = escolhidos.includes(o.valor);
            return (
              <li key={o.valor}>
                <button
                  type="button"
                  className={['opcoes__item', marcado && 'opcoes__item--ativo'].filter(Boolean).join(' ')}
                  aria-pressed={marcado}
                  onClick={() => alternar(o.valor)}
                >
                  <span className={['caixa', marcado && 'caixa--marcada'].filter(Boolean).join(' ')}>
                    {marcado ? <IconeSalvar tamanho={12} /> : null}
                  </span>
                  {o.cor ? <span className="gatilho__ponto" style={{ background: o.cor }} /> : null}
                  <span className="opcoes__rotulo">{o.rotulo}</span>
                </button>
              </li>
            );
          })}
          {visiveis.length === 0 ? <li className="opcoes__vazio apoio">Nada encontrado</li> : null}
        </ul>
      </Dialogo>
    </div>
  );
}

/* ------------------------------------------------------------------ apoio -- */

function useFiltradas(opcoes: Opcao[], filtro: string) {
  return useMemo(() => {
    const alvo = filtro.trim().toLowerCase();
    if (!alvo) return opcoes;
    return opcoes.filter((o) => o.rotulo.toLowerCase().includes(alvo));
  }, [opcoes, filtro]);
}

function CampoDeFiltro({
  valor,
  aoMudar,
  total,
}: {
  valor: string;
  aoMudar: (v: string) => void;
  total: number;
}) {
  // Abaixo de 8 opções a busca atrapalha mais do que ajuda.
  if (total < 8) return null;
  return (
    <div className="filtro-opcoes">
      <IconeBuscar tamanho={15} />
      <input
        className="filtro-opcoes__campo"
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder={`Buscar entre ${total}`}
        aria-label="Buscar opção"
        autoFocus
      />
      {valor ? (
        <button type="button" className="filtro-opcoes__limpar" onClick={() => aoMudar('')} aria-label="Limpar busca">
          <IconeFechar tamanho={13} />
        </button>
      ) : null}
    </div>
  );
}
