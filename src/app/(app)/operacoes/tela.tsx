'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { Botao, Vazio } from '@/components/ui/base';
import { TopoDaTela } from '@/components/ui/casca';
import { AcoesLinha, BlocoArquivados, ConfirmarExclusao } from '@/components/listas';
import { tokenDoStatus, type EtapaOperacao, type Fornecedor, type Operacao, type TabelaApoio } from '@/lib/dominio';
import { arquivarOperacao, excluirOperacao } from './acoes';
import { DialogoOperacao } from './dialogo';
import type { ClienteResumo, Declinio, Observacao, Visualizador } from './page';

type Aba = 'cliente' | 'fornecedor' | 'status';

export function TelaOperacoes(props: {
  operacoes: Operacao[];
  arquivadas: Operacao[];
  clientes: ClienteResumo[];
  fornecedores: Array<Pick<Fornecedor, 'id' | 'nome_fundo'>>;
  tipos: TabelaApoio[];
  statusEtapa: TabelaApoio[];
  statusOperacao: TabelaApoio[];
  etapas: EtapaOperacao[];
  observacoes: Observacao[];
  declinios: Declinio[];
  perfis: Array<{ id: string; nome: string }>;
  visualizadores: Visualizador[];
}) {
  const { operacoes, arquivadas, clientes, tipos, statusEtapa, statusOperacao, etapas } = props;

  const [aba, setAba] = useState<Aba>('cliente');
  const [emEdicao, setEmEdicao] = useState<Operacao | null>(null);
  const [criando, setCriando] = useState(false);
  const [aExcluir, setAExcluir] = useState<Operacao | null>(null);
  const [, transicao] = useTransition();

  const nomeCliente = useMemo(
    () => new Map(clientes.map((c) => [c.id, c.nome_razao])),
    [clientes],
  );
  const rotuloTipo = useMemo(() => new Map(tipos.map((t) => [t.id, t.rotulo])), [tipos]);
  const nomePerfil = useMemo(() => new Map(props.perfis.map((p) => [p.id, p.nome])), [props.perfis]);

  /**
   * O tipo da operação. No Bubble o campo `tipo operação` de `opera__o` está
   * vazio em toda a base — quem carrega o tipo são as etapas. Então deriva-se
   * das etapas quando a operação não tem o seu.
   */
  const tipoDaOperacao = useCallback(
    (op: Operacao) => {
      if (op.status_operacao_id && rotuloTipo.get(op.status_operacao_id)) {
        // nunca acontece hoje; mantido para quando o campo passar a ser usado
      }
      const daEtapa = etapas
        .filter((e) => e.operacao_id === op.id && e.tipo_operacao_id)
        .map((e) => rotuloTipo.get(e.tipo_operacao_id as number))
        .filter((r): r is string => Boolean(r));
      return [...new Set(daEtapa)].join(' / ');
    },
    [etapas, rotuloTipo],
  );

  /** Nomes de quem enxerga o cliente da operação — a linha em itálico. */
  const quemVisualiza = useCallback(
    (op: Operacao) => {
      if (!op.cliente_id) return '';
      return props.visualizadores
        .filter((v) => v.cliente_id === op.cliente_id)
        .map((v) => nomePerfil.get(v.perfil_id))
        .filter(Boolean)
        .join(', ');
    },
    [props.visualizadores, nomePerfil],
  );

  const itemDaLista = (op: Operacao, arquivado: boolean) => (
    <li key={op.id} className="lista__item">
      <span className="lista__texto">
        <span className="lista__nome">{op.cliente_id ? nomeCliente.get(op.cliente_id) : op.identificador}</span>
        {tipoDaOperacao(op) ? <span className="lista__apoio"> - {tipoDaOperacao(op)}</span> : null}
        {quemVisualiza(op) ? <span className="lista__meta">{quemVisualiza(op)}</span> : null}
      </span>
      <AcoesLinha
        rotuloArquivar={arquivado ? 'Desarquivar' : 'Arquivar'}
        aoArquivar={() => transicao(() => void arquivarOperacao(op.id, !arquivado))}
        aoExcluir={() => setAExcluir(op)}
        aoEditar={() => setEmEdicao(op)}
      />
    </li>
  );

  return (
    <>
      <TopoDaTela titulo="Detalhes da operação" />

      <div className="abas" role="tablist">
        <button type="button" role="tab" className="abas__item" aria-selected={aba === 'cliente'} onClick={() => setAba('cliente')}>
          Cliente
        </button>
        <button type="button" role="tab" className="abas__item" aria-selected={aba === 'fornecedor'} onClick={() => setAba('fornecedor')}>
          Fornecedor
        </button>
        <button type="button" role="tab" className="abas__item" aria-selected={aba === 'status'} onClick={() => setAba('status')}>
          Status
        </button>
        <div className="abas__acoes">
          <Botao variante="primary" onClick={() => setCriando(true)}>
            Nova Operação
          </Botao>
        </div>
      </div>

      {aba === 'cliente' ? (
        <>
          {operacoes.length === 0 ? (
            <div className="vazio-tela">
              <Vazio titulo="Nenhuma operação ainda" />
            </div>
          ) : (
            <ul className="lista">{operacoes.map((op) => itemDaLista(op, false))}</ul>
          )}
          <BlocoArquivados quantidade={arquivadas.length}>
            <ul className="lista">{arquivadas.map((op) => itemDaLista(op, true))}</ul>
          </BlocoArquivados>
        </>
      ) : null}

      {aba === 'fornecedor' ? (
        <AbaFornecedor
          fornecedores={props.fornecedores}
          etapas={etapas}
          operacoes={[...operacoes, ...arquivadas]}
          nomeCliente={nomeCliente}
          rotuloTipo={rotuloTipo}
          statusEtapa={statusEtapa}
        />
      ) : null}

      {aba === 'status' ? (
        <AbaStatus
          operacoes={operacoes}
          statusOperacao={statusOperacao}
          nomeCliente={nomeCliente}
          tipoDaOperacao={tipoDaOperacao}
        />
      ) : null}

      <DialogoOperacao
        aberto={criando || emEdicao !== null}
        operacao={emEdicao}
        clientes={clientes}
        fornecedores={props.fornecedores}
        tipos={tipos}
        statusEtapa={statusEtapa}
        statusOperacao={statusOperacao}
        etapas={emEdicao ? etapas.filter((e) => e.operacao_id === emEdicao.id) : []}
        observacoes={emEdicao ? props.observacoes.filter((o) => o.operacao_id === emEdicao.id) : []}
        declinios={emEdicao ? props.declinios.filter((d) => d.operacao_id === emEdicao.id).map((d) => d.fornecedor_id) : []}
        parecerCliente={null}
        aoFechar={() => {
          setCriando(false);
          setEmEdicao(null);
        }}
      />

      <ConfirmarExclusao
        aberto={aExcluir !== null}
        entidade="Operação"
        artigo="a"
        nome={(aExcluir?.cliente_id && nomeCliente.get(aExcluir.cliente_id)) || aExcluir?.identificador || ''}
        aoFechar={() => setAExcluir(null)}
        aoConfirmar={() => aExcluir && transicao(() => void excluirOperacao(aExcluir.id))}
      />
    </>
  );
}

/* --------------------------------------------------------- aba Fornecedor -- */

/**
 * "Fundo parceiro:" e um seletor de largura inteira. Antes de escolher o fundo
 * não há tabela nenhuma — a área fica vazia, como em produção.
 */
function AbaFornecedor({
  fornecedores,
  etapas,
  operacoes,
  nomeCliente,
  rotuloTipo,
  statusEtapa,
}: {
  fornecedores: Array<Pick<Fornecedor, 'id' | 'nome_fundo'>>;
  etapas: EtapaOperacao[];
  operacoes: Operacao[];
  nomeCliente: Map<string, string>;
  rotuloTipo: Map<number, string>;
  statusEtapa: TabelaApoio[];
}) {
  const [fundo, setFundo] = useState('');

  const statusPorId = useMemo(() => new Map(statusEtapa.map((s) => [s.id, s])), [statusEtapa]);
  const operacaoPorId = useMemo(() => new Map(operacoes.map((o) => [o.id, o])), [operacoes]);

  const linhas = useMemo(
    () => (fundo ? etapas.filter((e) => e.fornecedor_id === fundo) : []),
    [etapas, fundo],
  );

  return (
    <>
      <div className="lc-field" style={{ marginBottom: 'var(--space-5)' }}>
        <label className="lc-field__label" htmlFor="fundo-parceiro">
          Fundo parceiro:
        </label>
        <select
          id="fundo-parceiro"
          className="lc-field__input"
          value={fundo}
          onChange={(e) => setFundo(e.target.value)}
        >
          <option value="">Escolha aqui</option>
          {fornecedores.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome_fundo}
            </option>
          ))}
        </select>
      </div>

      {!fundo ? null : (
        <table className="lc-table">
          <colgroup>
            <col style={{ width: '26%' }} />
            <col style={{ width: '17%' }} />
            <col style={{ width: '17%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Cliente</th>
              <th scope="col">Demanda inicial</th>
              <th scope="col">Demanda final</th>
              <th scope="col">Tipo de operação</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((e) => {
              const op = operacaoPorId.get(e.operacao_id);
              const st = e.status_id ? statusPorId.get(e.status_id) : undefined;
              return (
                <tr key={e.id}>
                  <td style={{ fontWeight: 600 }}>
                    {(e.cliente_id && nomeCliente.get(e.cliente_id)) || '-'}
                  </td>
                  <td>{op?.demanda_inicial || '-'}</td>
                  <td>{op?.demanda_final || '-'}</td>
                  <td>{(e.tipo_operacao_id && rotuloTipo.get(e.tipo_operacao_id)) || '-'}</td>
                  {/* Status é texto colorido, sem pílula — é assim em produção. */}
                  <td style={{ color: st ? `var(--${tokenDoStatus(st.chave)}-ink)` : undefined, fontWeight: 600 }}>
                    {st?.rotulo || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}

/* ------------------------------------------------------------- aba Status -- */

/** Quatro cartões lado a lado, cada um com faixa superior colorida própria. */
const FAIXA: Record<string, string> = {
  inicial: 'var(--st-etapa-inicio)',
  em_andamento: 'var(--st-etapa-em-curso)',
  operacao_aprovada: 'var(--st-etapa-fechado)',
  excluido_ou_paralisado: 'var(--st-etapa-terminal-negativo)',
};

/** "Soma:" aparece no rodapé destas duas colunas apenas. */
const COM_SOMA = new Set(['em_andamento', 'operacao_aprovada']);

function AbaStatus({
  operacoes,
  statusOperacao,
  nomeCliente,
  tipoDaOperacao,
}: {
  operacoes: Operacao[];
  statusOperacao: TabelaApoio[];
  nomeCliente: Map<string, string>;
  tipoDaOperacao: (op: Operacao) => string;
}) {
  return (
    <div className="painel-status">
      {statusOperacao.map((s) => {
        const itens = operacoes.filter((o) => o.status_operacao_id === s.id);
        return (
          <section key={s.id} className="painel-status__coluna">
            <div className="painel-status__faixa" style={{ background: FAIXA[s.chave] ?? 'var(--border-strong)' }} />
            <h2 className="painel-status__titulo t-section-title">{s.rotulo}</h2>

            <div className="painel-status__rotulos">
              <span>Operação</span>
              <span>Volume</span>
              <span>Fee</span>
            </div>

            <ul className="painel-status__itens">
              {itens.map((op) => (
                <li key={op.id} className="painel-status__item">
                  <span className="painel-status__cliente">
                    <span className="lista__nome">
                      {(op.cliente_id && nomeCliente.get(op.cliente_id)) || op.identificador || '—'}
                    </span>
                    <span className="lista__apoio painel-status__tipo">{tipoDaOperacao(op)}</span>
                  </span>
                  <span className="apoio mono">
                    {op.demanda_inicial || '-'} a {op.demanda_final || '-'}
                  </span>
                  <span className="apoio mono">{op.comissao || '-'}</span>
                </li>
              ))}
              {itens.length === 0 ? <li className="painel-status__vazio apoio">Nenhuma</li> : null}
            </ul>

            {COM_SOMA.has(s.chave) ? (
              <div className="painel-status__soma">
                <label className="lc-field__label" htmlFor={`soma-${s.chave}`}>
                  Soma:
                </label>
                <input id={`soma-${s.chave}`} className="lc-field__input" defaultValue="" />
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
