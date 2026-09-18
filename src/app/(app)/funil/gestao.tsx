'use client';

import { useState, useTransition } from 'react';
import { Botao, Campo } from '@/components/ui/base';
import { Dialogo } from '@/components/ui/dialogo';
import { IconeDeletar, IconeMais, IconeSalvar } from '@/components/ui/icones';
import {
  alternarColunaNoFluxo,
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

/** Paleta das tags. Cores da marca, para a tag não destoar do resto. */
const CORES = [
  'var(--st-etapa-fechado)',
  'var(--st-etapa-em-curso)',
  'var(--st-etapa-inicio)',
  'var(--st-etapa-terminal-negativo)',
  'var(--accent)',
  'var(--border-strong)',
];

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
  const [corNova, setCorNova] = useState(CORES[0]);
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

      <div className="gestao__nova">
        <Paleta valor={corNova} aoEscolher={setCorNova} />
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
  const [cor, setCor] = useState(tag.cor ?? CORES[0]);
  const [, transicao] = useTransition();

  const mudou = nome.trim() !== tag.nome || cor !== (tag.cor ?? CORES[0]);

  return (
    <li className="gestao__linha">
      <Paleta valor={cor} aoEscolher={setCor} />
      <Campo valor={nome} aoMudar={setNome} />
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

function Paleta({ valor, aoEscolher }: { valor: string; aoEscolher: (v: string) => void }) {
  return (
    <span className="gestao__paleta" role="group" aria-label="Cor da tag">
      {CORES.map((c) => (
        <button
          key={c}
          type="button"
          className={['gestao__cor', c === valor && 'gestao__cor--ativa'].filter(Boolean).join(' ')}
          style={{ background: c }}
          aria-label={`Cor ${CORES.indexOf(c) + 1}`}
          aria-pressed={c === valor}
          onClick={() => aoEscolher(c)}
        />
      ))}
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
