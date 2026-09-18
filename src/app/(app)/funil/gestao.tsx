'use client';

import { useState, useTransition } from 'react';
import { Botao, Campo } from '@/components/ui/base';
import { Dialogo } from '@/components/ui/dialogo';
import { IconeDeletar, IconeMais, IconeSalvar } from '@/components/ui/icones';
import {
  alternarColunaNoFluxo,
  alternarTagAtiva,
  criarTag,
  excluirTag,
  gravarTag,
  renomearColuna,
} from './acoes';
import type { EtapaFunil, TagFunil } from './page';

/**
 * Os dois painéis do topo do funil — "Tags" e "Colunas no fluxo".
 *
 * Os botões existiam desde a primeira versão da tela e não faziam nada: a
 * única forma de mexer em tag ou de esconder uma coluna era no banco.
 */

/* ------------------------------------------------------------------ tags -- */

/**
 * Cor da tag nova. Qualquer cor serve — o seletor é o do próprio navegador,
 * como no original; esta é só a que já vem escolhida.
 */
const COR_PADRAO = '#22c55e';

/**
 * O `<input type="color">` só entende hexadecimal. As tags carregadas do
 * Bubble podem trazer outra notação (`rgb(...)`, nome de cor, token do design
 * system): nesse caso o quadradinho mostra a cor como ela é, e o seletor abre
 * numa cor neutra em vez de quebrar.
 */
const HEX = /^#[0-9a-f]{6}$/i;
const paraSeletor = (cor: string | null) => (cor && HEX.test(cor) ? cor : COR_PADRAO);

export function DialogoTags({
  aberto,
  quadroId,
  tags,
  aoFechar,
}: {
  aberto: boolean;
  quadroId: string;
  tags: TagFunil[];
  aoFechar: () => void;
}) {
  const [nova, setNova] = useState('');
  const [corNova, setCorNova] = useState(COR_PADRAO);
  const [, transicao] = useTransition();

  return (
    <Dialogo
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Tags do funil"
      largura="sm"
      rodape={
        <Botao variante="primary" onClick={aoFechar}>
          Pronto
        </Botao>
      }
    >
      <ul className="gestao__lista">
        {tags.map((t) => (
          <LinhaDaTag key={t.id} tag={t} />
        ))}
        {tags.length === 0 ? <li className="apoio">Nenhuma tag ainda.</li> : null}
      </ul>

      <p className="apoio">
        Desativar a tag esconde ela dos filtros <strong>sem perder o histórico</strong> dos
        cartões. Excluir remove a tag de todos os cartões.
      </p>

      <div className="gestao__nova">
        <Cor valor={corNova} aoEscolher={setCorNova} rotulo="Cor da tag nova" />
        <Campo valor={nova} aoMudar={setNova} placeholder="Nome da tag nova" />
        <Botao
          variante="secondary"
          disabled={!nova.trim()}
          title="Criar tag"
          aria-label="Criar tag"
          onClick={() => {
            transicao(() => void criarTag(quadroId, nova, corNova));
            setNova('');
          }}
        >
          <IconeMais tamanho={15} />
        </Botao>
      </div>
    </Dialogo>
  );
}

function LinhaDaTag({ tag }: { tag: TagFunil }) {
  const [nome, setNome] = useState(tag.nome);
  const [cor, setCor] = useState(tag.cor ?? COR_PADRAO);
  const [, transicao] = useTransition();

  const mudou = nome.trim() !== tag.nome || cor !== (tag.cor ?? COR_PADRAO);

  return (
    <li className="gestao__linha">
      <Cor valor={cor} aoEscolher={setCor} rotulo={`Cor da tag ${tag.nome}`} />
      <Campo valor={nome} aoMudar={setNome} className="gestao__nome" />
      <Botao
        variante="tertiary"
        tamanho="row"
        title="Salvar tag"
        aria-label={`Salvar tag ${tag.nome}`}
        disabled={!mudou || !nome.trim()}
        onClick={() => transicao(() => void gravarTag(tag.id, nome, cor))}
      >
        <IconeSalvar />
      </Botao>
      <label className="interruptor" title="Tag ativa">
        <input
          type="checkbox"
          checked={tag.ativo}
          aria-label={`Tag ${tag.nome} ativa`}
          onChange={(e) => transicao(() => void alternarTagAtiva(tag.id, e.target.checked))}
        />
      </label>
      <Botao
        variante="tertiary"
        tamanho="row"
        title="Excluir tag"
        aria-label={`Excluir tag ${tag.nome}`}
        onClick={() => transicao(() => void excluirTag(tag.id))}
      >
        <IconeDeletar />
      </Botao>
    </li>
  );
}

/** Quadradinho da cor: mostra a atual e abre o seletor do navegador. */
function Cor({
  valor,
  aoEscolher,
  rotulo,
}: {
  valor: string | null;
  aoEscolher: (v: string) => void;
  rotulo: string;
}) {
  return (
    <span className="gestao__cor" style={{ background: valor ?? COR_PADRAO }}>
      <input
        type="color"
        value={paraSeletor(valor)}
        aria-label={rotulo}
        onChange={(e) => aoEscolher(e.target.value)}
      />
    </span>
  );
}

/* -------------------------------------------------------- colunas no fluxo */

export function DialogoColunas({
  aberto,
  etapas,
  aoFechar,
}: {
  aberto: boolean;
  etapas: EtapaFunil[];
  aoFechar: () => void;
}) {
  return (
    <Dialogo
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Colunas no fluxo"
      largura="sm"
      rodape={
        <Botao variante="primary" onClick={aoFechar}>
          Pronto
        </Botao>
      }
    >
      <p className="apoio">
        Coluna fora do fluxo some do quadro e <strong>não perde cartão nenhum</strong> — eles
        continuam na etapa, e voltam quando a coluna voltar.
      </p>

      <ul className="gestao__lista">
        {[...etapas]
          .sort((a, b) => a.ordem - b.ordem)
          .map((e) => (
            <LinhaDaColuna key={e.id} etapa={e} />
          ))}
      </ul>
    </Dialogo>
  );
}

function LinhaDaColuna({ etapa }: { etapa: EtapaFunil }) {
  const [nome, setNome] = useState(etapa.nome);
  const [, transicao] = useTransition();

  return (
    <li className="gestao__linha">
      <label className="interruptor" title="Mostrar no quadro">
        <input
          type="checkbox"
          checked={etapa.no_fluxo}
          aria-label={`${etapa.nome} no fluxo`}
          onChange={(e) => transicao(() => void alternarColunaNoFluxo(etapa.id, e.target.checked))}
        />
      </label>
      <Campo valor={nome} aoMudar={setNome} />
      <Botao
        variante="tertiary"
        tamanho="row"
        title="Salvar nome"
        aria-label={`Salvar nome da coluna ${etapa.nome}`}
        disabled={nome.trim() === etapa.nome || !nome.trim()}
        onClick={() => transicao(() => void renomearColuna(etapa.id, nome))}
      >
        <IconeSalvar />
      </Botao>
    </li>
  );
}
