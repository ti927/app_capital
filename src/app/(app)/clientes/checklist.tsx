'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type SyntheticEvent } from 'react';
import { LogoGoogleDrive } from '@/components/ui/logos-google';
import { ROTULO_DO_STATUS, proximoStatus, type ItemDaChecklist, type StatusDoItem } from '@/lib/checklist/itens';
import type { RespostaChecklist } from '@/lib/checklist/servico';
import {
  adicionarItemNaChecklist,
  checklistDoCliente,
  marcarItemDaChecklist,
  removerItemDaChecklist,
} from './checklist-acoes';
import './checklist.css';

/**
 * Aba Checklist do cliente (specs/18): os documentos que a Lure pede, com o
 * status à direita. Clique no status anda Não recebido → Recebido → Parcial →
 * Não se aplica. O que a varredura do Drive achou já vem "recebido"; marcação
 * à mão sempre ganha. Abaixo, itens extras deste cliente.
 */
export function AbaChecklist({ clienteId, ehMaster }: { clienteId: string; ehMaster: boolean }) {
  const [resposta, setResposta] = useState<RespostaChecklist | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setResposta(await checklistDoCliente(clienteId));
    setCarregando(false);
  }, [clienteId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const trocarItens = (f: (itens: ItemDaChecklist[]) => ItemDaChecklist[]) =>
    setResposta((r) => (r?.ok ? { ...r, itens: f(r.itens) } : r));

  async function alternar(item: ItemDaChecklist) {
    const novo = proximoStatus(item.status);
    setErro(null);
    trocarItens((itens) => itens.map((i) => (i.ref === item.ref ? { ...i, status: novo, fonte: 'app' } : i)));
    const r = await marcarItemDaChecklist(clienteId, item.ref, novo);
    if (r.erro) {
      trocarItens((itens) => itens.map((i) => (i.ref === item.ref ? item : i)));
      setErro(`Não salvou "${item.titulo}": ${r.erro}`);
    }
  }

  async function remover(item: ItemDaChecklist) {
    setErro(null);
    trocarItens((itens) => itens.filter((i) => i.ref !== item.ref));
    const r = await removerItemDaChecklist(clienteId, item.ref);
    if (r.erro) {
      setErro(`Não removeu "${item.titulo}": ${r.erro}`);
      void carregar();
    }
  }

  async function adicionar(titulo: string) {
    setErro(null);
    const r = await adicionarItemNaChecklist(clienteId, titulo);
    if (r.erro || !r.id) {
      setErro(`Não adicionou: ${r.erro ?? 'erro inesperado'}`);
      return false;
    }
    const novo: ItemDaChecklist = {
      ref: r.id,
      titulo: titulo.trim().replace(/\s+/g, ' '),
      extra: true,
      status: 'nao_recebido',
      fonte: 'nenhuma',
      observacao: null,
      arquivos: [],
    };
    trocarItens((itens) => [...itens, novo]);
    return true;
  }

  if (!resposta) {
    return (
      <section className="ck" aria-busy="true">
        <ul className="ck__lista" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <li key={i} className="ck__linha ck__linha--esqueleto" />
          ))}
        </ul>
      </section>
    );
  }
  if (!resposta.ok) {
    return (
      <section className="ck" aria-busy="false">
        <div className="docs__estado docs__estado--erro" role="alert">
          <p className="docs__estado-titulo">Não deu para abrir a checklist</p>
          <p className="apoio">{resposta.erro}</p>
        </div>
      </section>
    );
  }

  const { itens, varredura } = resposta;
  const contam = itens.filter((i) => i.status !== 'nao_se_aplica');
  const recebidos = contam.filter((i) => i.status === 'recebido').length;
  const parciais = contam.filter((i) => i.status === 'parcial').length;
  const progresso = contam.length ? (recebidos + parciais / 2) / contam.length : 0;

  return (
    <section className="ck" aria-busy={carregando}>
      <header className="ck__topo">
        <div className="ck__resumo">
          <p className="ck__contagem">
            <strong>{recebidos}</strong> de {contam.length} recebidos
            {parciais ? (
              <span className="ck__parciais">
                {' '}
                · {parciais} parcia{parciais > 1 ? 'is' : 'l'}
              </span>
            ) : null}
          </p>
          <div
            className="ck__barra"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progresso * 100)}
            aria-label="Documentos recebidos"
          >
            <span style={{ transform: `scaleX(${progresso})` }} />
          </div>
        </div>
        <p className="ck__varredura apoio">
          <LogoGoogleDrive tamanho={14} />
          <Varredura varredura={varredura} ehMaster={ehMaster} />
          <button type="button" className="ck__revarrer" onClick={() => void carregar()} disabled={carregando}>
            {carregando ? 'Varrendo…' : 'Varrer de novo'}
          </button>
        </p>
      </header>

      {erro ? (
        <p className="ck__erro" role="alert">
          {erro}
        </p>
      ) : null}

      <ul className="ck__lista">
        {itens.map((item) => (
          <Linha
            key={item.ref}
            clienteId={clienteId}
            item={item}
            aoAlternar={() => void alternar(item)}
            aoRemover={item.extra ? () => void remover(item) : undefined}
          />
        ))}
      </ul>

      <NovoItem aoAdicionar={adicionar} />
    </section>
  );
}

type Ok = Extract<RespostaChecklist, { ok: true }>;

function Varredura({ varredura, ehMaster }: { varredura: Ok['varredura']; ehMaster: boolean }) {
  switch (varredura.estado) {
    case 'ok':
      return (
        <span>
          {varredura.arquivos} arquivo{varredura.arquivos === 1 ? '' : 's'} varrido{varredura.arquivos === 1 ? '' : 's'} em{' '}
          <strong>{varredura.pasta.nome}</strong>.
        </span>
      );
    case 'sem-drive':
      return (
        <span>
          Drive não conectado — valem só as marcações à mão.
          {ehMaster ? (
            <>
              {' '}
              <Link href="/conta/conexoes">Conectar</Link>
            </>
          ) : null}
        </span>
      );
    case 'sem-pasta':
      return (
        <span>
          Nenhuma pasta com o nome <strong>{varredura.buscado}</strong> no Drive — valem só as marcações à mão.
        </span>
      );
    case 'erro':
      return <span>{varredura.erro}</span>;
  }
}

const FONTE: Record<ItemDaChecklist['fonte'], string | null> = {
  app: null,
  mcp: 'Marcado pelo Claude',
  drive: 'Achado no Drive',
  nenhuma: null,
};

function Linha({
  clienteId,
  item,
  aoAlternar,
  aoRemover,
}: {
  clienteId: string;
  item: ItemDaChecklist;
  aoAlternar: () => void;
  aoRemover?: () => void;
}) {
  const fonte = FONTE[item.fonte];
  const temMeta = Boolean(fonte || item.arquivos.length || item.observacao);
  return (
    <li className={`ck__linha ck__linha--${item.status}`}>
      <div className="ck__corpo">
        <span className="ck__texto">{item.titulo}</span>
        {temMeta ? (
          <span className="ck__meta">
            {fonte ? <span className="ck__fonte">{fonte}</span> : null}
            {item.arquivos.slice(0, 2).map((a) => (
              <a
                key={a.id}
                className="ck__arquivo"
                href={`/api/drive/${encodeURIComponent(clienteId)}/${encodeURIComponent(a.id)}`}
                target="_blank"
                rel="noopener noreferrer"
                title={a.caminho}
              >
                {a.nome}
              </a>
            ))}
            {item.arquivos.length > 2 ? <span>+{item.arquivos.length - 2}</span> : null}
            {item.observacao ? <span className="ck__obs">{item.observacao}</span> : null}
          </span>
        ) : null}
      </div>
      {aoRemover ? (
        <button
          type="button"
          className="ck__remover"
          onClick={aoRemover}
          aria-label={`Remover "${item.titulo}"`}
          data-dica="Remover item"
        >
          <IconeLixeira />
        </button>
      ) : null}
      <BotaoStatus status={item.status} titulo={item.titulo} aoClicar={aoAlternar} />
    </li>
  );
}

/**
 * O status desliza: o ícone que sai vai para a esquerda e o novo entra pela
 * direita. O status anterior fica guardado só o tempo da animação — o padrão
 * do React de comparar com o render anterior, sem efeito para detectar a troca.
 */
function BotaoStatus({ status, titulo, aoClicar }: { status: StatusDoItem; titulo: string; aoClicar: () => void }) {
  const [giro, setGiro] = useState<{ visto: StatusDoItem; n: number; sai: StatusDoItem | null }>({
    visto: status,
    n: 0,
    sai: null,
  });
  if (giro.visto !== status) setGiro({ visto: status, n: giro.n + 1, sai: giro.visto });

  useEffect(() => {
    if (!giro.sai) return;
    const t = setTimeout(() => setGiro((g) => ({ ...g, sai: null })), 280);
    return () => clearTimeout(t);
  }, [giro.sai, giro.n]);

  const rotulo = ROTULO_DO_STATUS[status];
  return (
    <button
      type="button"
      className={`ck__status ck__status--${status}`}
      onClick={aoClicar}
      aria-label={`${titulo}: ${rotulo}. Clique para marcar como ${ROTULO_DO_STATUS[proximoStatus(status)].toLowerCase()}.`}
      data-dica={rotulo}
    >
      {/* O trilho recorta o deslize; o botão não, para a dica poder sair dele. */}
      <span className="ck__trilho" aria-hidden="true">
        {giro.sai ? (
          <span key={`sai-${giro.n}`} className={`ck__icone ck__icone--sai ck__cor--${giro.sai}`}>
            <IconeStatus status={giro.sai} />
          </span>
        ) : null}
        <span key={`entra-${giro.n}`} className={`ck__icone ck__cor--${status}${giro.n ? ' ck__icone--entra' : ''}`}>
          <IconeStatus status={status} />
        </span>
      </span>
    </button>
  );
}

function NovoItem({ aoAdicionar }: { aoAdicionar: (titulo: string) => Promise<boolean> }) {
  const [titulo, setTitulo] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: SyntheticEvent) {
    e.preventDefault();
    if (!titulo.trim() || enviando) return;
    setEnviando(true);
    if (await aoAdicionar(titulo)) setTitulo('');
    setEnviando(false);
  }

  return (
    // Não é <form>: a aba vive dentro do diálogo, e um form aninhado ao do
    // cadastro mandaria o Enter para o lugar errado.
    <div className="ck__novo" role="group" aria-label="Adicionar item à checklist">
      <input
        className="lc-field__input ck__novo-campo"
        placeholder="Outro documento para este cliente"
        value={titulo}
        maxLength={200}
        onChange={(e) => setTitulo(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void enviar(e);
        }}
        aria-label="Nome do novo item"
      />
      <button
        type="button"
        className="ck__novo-botao"
        onClick={(e) => void enviar(e)}
        disabled={!titulo.trim() || enviando}
        aria-label="Adicionar item"
        data-dica={titulo.trim() ? 'Adicionar item' : 'Escreva o nome do item'}
      >
        <IconeMais />
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- ícones -- */

function IconeStatus({ status }: { status: StatusDoItem }) {
  if (status === 'nao_se_aplica') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" focusable="false">
        <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" focusable="false">
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="4"
        fill={status === 'recebido' ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
      />
      {status === 'recebido' ? (
        <path
          d="M7.5 12.3l3 3 6-6.3"
          fill="none"
          stroke="var(--ck-sobre)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      {status === 'parcial' ? (
        <text
          x="12"
          y="16.4"
          textAnchor="middle"
          fontSize="12"
          fontWeight="800"
          fill="currentColor"
          fontFamily="var(--font-sans)"
        >
          P
        </text>
      ) : null}
    </svg>
  );
}

function IconeMais() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" focusable="false" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconeLixeira() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true">
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
    </svg>
  );
}
