'use client';

import { useState } from 'react';
import { Botao } from './ui/base';
import { Dialogo } from './ui/dialogo';
import { IconeConfiguracoes } from './ui/icones';
import type { NivelAcesso } from '@/lib/dominio';

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
 * Configurações — "Acesso às páginas".
 *
 * Só de leitura, de propósito: responde "quem consegue ver cada página".
 * No Bubble o painel tem seletores por página, mas o que eles gravam
 * (`tbl.config`) nunca é lido — o menu esconde item só pelo nível da conta
 * (documentacao-completa.md, 3.7 e 3.8). Reproduzir os seletores aqui seria
 * oferecer um controle que não controla nada.
 */
export function BotaoConfiguracoes({
  paginas,
  usuarios,
}: {
  paginas: PaginaDoAcesso[];
  usuarios: UsuarioDoAcesso[];
}) {
  const [aberto, setAberto] = useState(false);

  const contagem = NIVEIS.map(
    ({ chave, rotulo }) =>
      `${usuarios.filter((u) => u.nivel_acesso === chave).length} ${rotulo.toLowerCase()}`,
  ).join(' · ');

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
        titulo="Acesso às páginas"
        largura="md"
        rodape={
          <Botao variante="secondary" onClick={() => setAberto(false)}>
            Fechar
          </Botao>
        }
      >
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
                    return (
                      <span
                        key={chave}
                        className={`acessos__nivel${ve ? ' acessos__nivel--ve' : ''}`}
                        title={`${rotulo}: ${ve ? 'vê esta página' : 'não vê esta página'}`}
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
      </Dialogo>
    </>
  );
}
