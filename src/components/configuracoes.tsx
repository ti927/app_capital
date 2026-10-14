'use client';

import { useState } from 'react';
import { Botao } from './ui/base';
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
 * "Acesso às páginas" é só de leitura, de propósito: no Bubble o painel tem
 * seletores por página, mas o que eles gravam (`tbl.config`) nunca é lido — o
 * menu esconde item só pelo nível da conta (documentacao-completa.md, 3.7 e
 * 3.8). Reproduzir os seletores aqui seria oferecer um controle que não
 * controla nada. Para o indicante a aba não existe e a consulta não sai.
 */
export function BotaoConfiguracoes({
  paginas,
  usuarios,
  master,
}: {
  paginas: PaginaDoAcesso[];
  usuarios: UsuarioDoAcesso[];
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
          <AcessoAsPaginas paginas={paginas} usuarios={usuarios} />
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

function AcessoAsPaginas({ paginas, usuarios }: { paginas: PaginaDoAcesso[]; usuarios: UsuarioDoAcesso[] }) {
  const contagem = NIVEIS.map(
    ({ chave, rotulo }) =>
    `${usuarios.filter((u) => u.nivel_acesso === chave).length} ${rotulo.toLowerCase()}`,
  ).join(' · ');

  return (
    <>
      <p className="apoio configuracoes__nota">
        Quem vê o quê vem do nível da conta, não de uma permissão por pessoa e por página. Para
        mudar o que alguém enxerga, muda-se o nível dessa pessoa.
      </p>

      <ul className="acessos">
        {paginas.map((pagina) => {
          const quemVe = usuarios.filter((u) => pagina.niveis.includes(u.nivel_acesso));
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
