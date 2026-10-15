'use client';

import { useState, useTransition } from 'react';
import { Botao } from './ui/base';
import { useAvisos } from './ui/aviso';
import { liberarPagina } from '@/lib/acesso-pagina-acoes';
import type { Pagina } from '@/lib/acesso-pagina';
import { Dialogo } from './ui/dialogo';
import { IconeConfiguracoes } from './ui/icones';
import { Indicador } from './ui/indicador';
import { usePreferencias } from './preferencias';
import type { NivelAcesso, PreferenciaPopups } from '@/lib/dominio';

const NIVEIS: Array<{ chave: NivelAcesso; rotulo: string }> = [
  { chave: 'master', rotulo: 'Master' },
  { chave: 'indicante', rotulo: 'Indicante' },
];

export interface PaginaDoAcesso {
  rotulo: string;
  /** Níveis que enxergam a página, de `niveisQueVeem`. */
  niveis: NivelAcesso[];
  /** Presente quando a página pode ser liberada a um indicante (`acesso_pagina`). */
  pagina?: Pagina;
}

export interface Liberacao {
  perfil_id: string;
  pagina: Pagina;
}

export interface UsuarioDoAcesso {
  id: string;
  nome: string;
  nivel_acesso: NivelAcesso;
}

/**
 * Configurações — duas abas:
 *   - "Preferências" (todos): pop-ups de cadastro clássicos ou modernos.
 *   - "Acesso às páginas" (só master): quem consegue ver cada página.
 *
 * "Acesso às páginas" (15/10/2026) liga e desliga uma página de master para
 * um indicante, gravando em `acesso_pagina` — a mesma tabela que o menu e o
 * porteiro da página leem (specs/16). Só as páginas com `pagina` aceitam;
 * as outras seguem só de master. Para o indicante a aba não existe.
 */
export function BotaoConfiguracoes({
  paginas,
  usuarios,
  liberacoes = [],
  master,
}: {
  paginas: PaginaDoAcesso[];
  usuarios: UsuarioDoAcesso[];
  liberacoes?: Liberacao[];
  master: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [aba, setAba] = useState<'preferencias' | 'acesso'>('preferencias');

  return (
    <>
      <Botao
        variante="secondary"
        tamanho="sm"
        className="casca__acao"
        onClick={() => setAberto(true)}
        aria-haspopup="dialog"
        title="Configurações"
      >
        <IconeConfiguracoes tamanho={16} />
        <span className="casca__acao-rotulo">Configurações</span>
      </Botao>

      <Dialogo
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        contexto="Configurações"
        titulo={aba === 'acesso' ? 'Acesso às páginas' : 'Preferências'}
        largura="md"
        rodape={
          <Botao variante="secondary" onClick={() => setAberto(false)}>
            Fechar
          </Botao>
        }
      >
        {master ? (
          <div className="abas configuracoes__abas" role="tablist">
            <Indicador seletor={'.abas__item[aria-selected="true"]'} tipo="sublinhado" />
            <button
              type="button"
              role="tab"
              className="abas__item"
              aria-selected={aba === 'preferencias'}
              onClick={() => setAba('preferencias')}
            >
              Preferências
            </button>
            <button
              type="button"
              role="tab"
              className="abas__item"
              aria-selected={aba === 'acesso'}
              onClick={() => setAba('acesso')}
            >
              Acesso às páginas
            </button>
          </div>
        ) : null}

        {master && aba === 'acesso' ? (
          <AcessoAsPaginas paginas={paginas} usuarios={usuarios} liberacoes={liberacoes} />
        ) : (
          <Preferencias />
        )}
      </Dialogo>
    </>
  );
}

const OPCOES_POPUPS: Array<{ valor: PreferenciaPopups; rotulo: string; texto: string }> = [
  { valor: 'classica', rotulo: 'Clássico', texto: 'Formulário com rótulo ao lado de cada campo. É o padrão.' },
  { valor: 'moderna', rotulo: 'Moderno', texto: 'Ficha com resumo no topo, seções com ícone e campos lado a lado.' },
];

/** Pop-ups: Clássico / Moderno. Grava no clique e vale no próximo pop-up aberto. */
function Preferencias() {
  const { popups, mudarPopups } = usePreferencias();
  return (
    <section className="ui2-preferencia" aria-labelledby="pref-popups-titulo">
      <h3 id="pref-popups-titulo" className="ui2-preferencia__titulo">
        Pop-ups de cadastro
      </h3>
      <p className="apoio">Vale para cliente, fornecedor e operação. Os campos e a ordem são os mesmos nos dois.</p>
      <div className="ui2-preferencia__opcoes" role="radiogroup" aria-labelledby="pref-popups-titulo">
        {OPCOES_POPUPS.map((o) => (
          <label key={o.valor} className="ui2-preferencia__opcao" data-opcao={o.valor}>
            <input
              type="radio"
              name="pref_popups"
              value={o.valor}
              checked={popups === o.valor}
              onChange={() => mudarPopups(o.valor)}
            />
            <Miniatura tipo={o.valor} />
            <span className="ui2-preferencia__rotulo">{o.rotulo}</span>
            <span className="ui2-preferencia__texto">{o.texto}</span>
          </label>
        ))}
      </div>
    </section>
  );
}

/** Prévia desenhada só com blocos e tokens — não é captura de tela. */
function Miniatura({ tipo }: { tipo: PreferenciaPopups }) {
  if (tipo === 'classica') {
    return (
      <span className="ui2-preferencia__miniatura ui2-mini ui2-mini--classica" aria-hidden="true">
        <span className="ui2-mini__titulo" />
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="ui2-mini__linha">
            <span className="ui2-mini__rotulo" />
            <span className="ui2-mini__caixa" />
          </span>
        ))}
        <span className="ui2-mini__botao" />
      </span>
    );
  }
  return (
    <span className="ui2-preferencia__miniatura ui2-mini ui2-mini--moderna" aria-hidden="true">
      <span className="ui2-mini__cabeca">
        <span className="ui2-mini__ladrilho" />
        <span className="ui2-mini__titulo" />
      </span>
      <span className="ui2-mini__faixa">
        <span />
        <span />
        <span />
      </span>
      <span className="ui2-mini__grade">
        <span />
        <span />
        <span />
        <span />
      </span>
      <span className="ui2-mini__botao" />
    </span>
  );
}

function AcessoAsPaginas({
  paginas,
  usuarios,
  liberacoes,
}: {
  paginas: PaginaDoAcesso[];
  usuarios: UsuarioDoAcesso[];
  liberacoes: Liberacao[];
}) {
  const contagem = NIVEIS.map(
    ({ chave, rotulo }) =>
    `${usuarios.filter((u) => u.nivel_acesso === chave).length} ${rotulo.toLowerCase()}`,
  ).join(' · ');

  // Estado local otimista: marca na hora, grava em segundo plano, desfaz se falhar.
  const [ligadas, setLigadas] = useState(() => new Set(liberacoes.map((l) => `${l.perfil_id}|${l.pagina}`)));
  const [, transicao] = useTransition();
  const { avisar } = useAvisos();
  const indicantes = usuarios.filter((u) => u.nivel_acesso === 'indicante');

  const alternar = (perfilId: string, pagina: Pagina, liberar: boolean) => {
    const chave = `${perfilId}|${pagina}`;
    const aplicar = (sim: boolean) =>
      setLigadas((s) => {
        const n = new Set(s);
        if (sim) n.add(chave);
        else n.delete(chave);
        return n;
      });
    aplicar(liberar);
    transicao(async () => {
      const r = await liberarPagina(perfilId, pagina, liberar);
      if (r.erro) {
        aplicar(!liberar);
        avisar(r.erro, { tipo: 'erro' });
      }
    });
  };

  return (
    <>
      <p className="apoio configuracoes__nota">
        Master vê tudo. Para páginas de master, marque abaixo quais indicantes também entram —
        cada um vê só o que é dele (clientes em que está em &ldquo;quem visualiza&rdquo;).
      </p>

      <ul className="acessos">
        {paginas.map((pagina) => {
          const liberados = pagina.pagina
            ? indicantes.filter((u) => ligadas.has(`${u.id}|${pagina.pagina}`))
            : [];
          const quemVe = usuarios.filter((u) => pagina.niveis.includes(u.nivel_acesso) || liberados.includes(u));
          return (
            <li key={pagina.rotulo} className="acessos__item">
              <div className="acessos__pagina">
                <span className="acessos__nome">{pagina.rotulo}</span>
                <span className="acessos__quem">
                  {quemVe.length
                    ? `${quemVe.length} de ${usuarios.length}: ${quemVe.map((u) => u.nome).join(' · ')}`
                    : 'ninguém'}
                </span>
              </div>
              <div className="acessos__niveis">
                {NIVEIS.map(({ chave, rotulo }) => {
                  const ve = pagina.niveis.includes(chave);
                  const dito = `${rotulo}: ${ve ? 'vê esta página' : 'não vê esta página'}`;
                  return (
                    <span
                      key={chave}
                      className={`acessos__nivel${ve ? ' acessos__nivel--ve' : ''}`}
                      title={dito}
                      aria-label={dito}
                    >
                      <span aria-hidden="true">{ve ? '✓' : '—'}</span>
                      {rotulo}
                    </span>
                  );
                })}
              </div>
              {/* Liberação por pessoa: só nas páginas que sabem receber indicante. */}
              {pagina.pagina && indicantes.length ? (
                <div className="acessos__pessoas">
                  {indicantes.map((u) => {
                    const ligada = ligadas.has(`${u.id}|${pagina.pagina}`);
                    return (
                      <label key={u.id} className="interruptor">
                        <input
                          type="checkbox"
                          checked={ligada}
                          onChange={() => alternar(u.id, pagina.pagina as Pagina, !ligada)}
                        />
                        <span>{u.nome}</span>
                      </label>
                    );
                  })}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="apoio configuracoes__nota">
        {usuarios.length} {usuarios.length === 1 ? 'conta ativa' : 'contas ativas'} — {contagem}.
      </p>
    </>
  );
}
