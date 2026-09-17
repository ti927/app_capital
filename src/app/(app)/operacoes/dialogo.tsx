'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { Botao, Campo, Seletor } from '@/components/ui/base';
import { Dialogo } from '@/components/ui/dialogo';
import {
  dataCurta,
  tokenDoStatus,
  type EtapaOperacao,
  type Fornecedor,
  type Operacao,
  type TabelaApoio,
} from '@/lib/dominio';
import {
  adicionarObservacao,
  atualizarEtapa,
  criarEtapa,
  excluirEtapa,
  excluirObservacao,
  gravarOperacao,
  type DadosEtapa,
} from './acoes';
import type { ClienteResumo, Observacao } from './page';

type Fundo = Pick<Fornecedor, 'id' | 'nome_fundo'>;

/**
 * Diálogo de operação — o mais pesado do sistema.
 *
 * Blocos na ordem de design/design-system/20-dialogos.md. Atenção: esse
 * inventário está marcado lá como **ainda não capturado** — veio do documento
 * de design e precisa de conferência contra a tela do Bubble.
 */
export function DialogoOperacao({
  aberto,
  operacao,
  clientes,
  fornecedores,
  tipos,
  statusEtapa,
  statusOperacao,
  etapas,
  observacoes,
  declinios,
  parecerCliente,
  aoFechar,
}: {
  aberto: boolean;
  operacao: Operacao | null;
  clientes: ClienteResumo[];
  fornecedores: Fundo[];
  tipos: TabelaApoio[];
  statusEtapa: TabelaApoio[];
  statusOperacao: TabelaApoio[];
  etapas: EtapaOperacao[];
  observacoes: Observacao[];
  declinios: string[];
  parecerCliente: string | null;
  aoFechar: () => void;
}) {
  const [estado, agir, gravando] = useActionState(gravarOperacao, null as { erro?: string; ok?: boolean } | null);

  useEffect(() => {
    if (estado?.ok) aoFechar();
  }, [estado, aoFechar]);

  const nova = !operacao;
  const temCliente = Boolean(operacao?.cliente_id);

  return (
    <Dialogo
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={nova ? 'Nova Operação' : 'Editar operação'}
      contexto={operacao?.identificador ?? undefined}
      largura="lg"
      rodape={
        <Botao variante="primary" type="submit" form="forma-operacao" disabled={gravando}>
          {nova ? 'Cadastrar' : 'Salvar'}
        </Botao>
      }
    >
      <form id="forma-operacao" action={agir} className="grade">
        <input type="hidden" name="id" value={operacao?.id ?? ''} />

        {/* "Escolher cliente:" só aparece quando a operação é nova. */}
        {nova ? (
          <Seletor
            className="grade__inteiro"
            rotulo="Escolher cliente:"
            nome="cliente_id"
            opcoes={clientes.map((c) => ({ valor: c.id, rotulo: c.nome_razao }))}
          />
        ) : (
          <input type="hidden" name="cliente_id" value={operacao?.cliente_id ?? ''} />
        )}

        <Campo rotulo="Identificador" nome="identificador" valorInicial={operacao?.identificador ?? ''} placeholder="Digite aqui" />
        <Seletor
          rotulo="Status Atual da Operação"
          nome="status_operacao_id"
          valorInicial={operacao?.status_operacao_id ? String(operacao.status_operacao_id) : ''}
          opcoes={statusOperacao.map((s) => ({ valor: String(s.id), rotulo: s.rotulo }))}
        />

        <Campo className="grade__inteiro" rotulo="Garantias sugeridas" nome="garantias_sugeridas" valorInicial={operacao?.garantias_sugeridas ?? ''} placeholder="Digite aqui" />
        <Campo className="grade__inteiro" rotulo="Limites/fundos assinados" nome="limites_fundos_assinados" valorInicial={operacao?.limites_fundos_assinados ?? ''} placeholder="Digite aqui" />

        <Declinios fornecedores={fornecedores} escolhidos={declinios} />

        <Campo rotulo="PMTS" nome="pmts" valorInicial={operacao?.pmts ?? ''} placeholder="Digite aqui" />
        <Campo rotulo="Prazo" nome="prazo" valorInicial={operacao?.prazo ?? ''} placeholder="Digite aqui" />
        <Campo rotulo="Carência" nome="carencia" valorInicial={operacao?.carencia ?? ''} placeholder="Digite aqui" />

        {/* Texto livre: o banco guarda "40MM", "40.000.000", "quarenta milhões". */}
        <Campo rotulo="Demanda em R$" nome="demanda_inicial" valorInicial={operacao?.demanda_inicial ?? ''} placeholder="Digite aqui" />
        <Campo rotulo="Demanda final" nome="demanda_final" valorInicial={operacao?.demanda_final ?? ''} placeholder="Digite aqui" />

        {/* Faturamento anual vem do cliente: calculado, não editável aqui. */}
        <Campo rotulo="Faturamento anual" calculado valorInicial={operacao?.faturamento_anual ?? ''} />
        <Campo rotulo="Comissão" nome="comissao" valorInicial={operacao?.comissao ?? ''} placeholder="Digite aqui" />

        <Campo className="grade__inteiro" rotulo="Parecer da operação" nome="parecer" multilinha linhas={5} valorInicial={operacao?.parecer ?? ''} placeholder="Digite aqui" />

        <div className="grade__inteiro linha" style={{ gap: 'var(--space-6)', flexWrap: 'wrap' }}>
          <Interruptor nome="tem_fee" rotulo="Fee (yes/no)" inicial={operacao?.tem_fee} />
          <Interruptor nome="nda_assinado" rotulo="NDA assinado" inicial={operacao?.nda_assinado} />
          <Interruptor nome="mandato_assinado" rotulo="Mandato assinado" inicial={operacao?.mandato_assinado} />
        </div>

        {estado?.erro ? (
          <p className="lc-field__msg grade__inteiro" role="alert">
            {estado.erro}
          </p>
        ) : null}
      </form>

      {/* O bloco de observações some quando não há cliente. */}
      {temCliente && operacao ? (
        <>
          <hr className="grade__regua" />
          <BlocoObservacoes operacaoId={operacao.id} observacoes={observacoes} />
        </>
      ) : null}

      {/* A tabela de etapas some quando não há nenhuma etapa. */}
      {operacao ? (
        <>
          <hr className="grade__regua" />
          <TabelaDeEtapas
            operacaoId={operacao.id}
            etapas={etapas}
            fornecedores={fornecedores}
            tipos={tipos}
            statusEtapa={statusEtapa}
          />
        </>
      ) : null}

      {/* "Parecer Cliente" some quando não há cliente. Vem do cadastro dele. */}
      {temCliente ? (
        <>
          <hr className="grade__regua" />
          <Campo rotulo="Parecer Cliente" calculado multilinha linhas={4} valorInicial={parecerCliente ?? ''} />
        </>
      ) : null}
    </Dialogo>
  );
}

/* ------------------------------------------------------------ interruptor -- */

function Interruptor({ nome, rotulo, inicial }: { nome: string; rotulo: string; inicial?: boolean }) {
  return (
    <label className="interruptor">
      <input type="checkbox" name={nome} defaultChecked={inicial} />
      <span>{rotulo}</span>
    </label>
  );
}

/* -------------------------------------------------------------- declínios -- */

/** Quais fornecedores recusaram a operação. Desabilitado para indicante. */
function Declinios({ fornecedores, escolhidos }: { fornecedores: Fundo[]; escolhidos: string[] }) {
  return (
    <div className="lc-field grade__inteiro">
      <label className="lc-field__label" htmlFor="declinios">
        Declínios
      </label>
      <select
        id="declinios"
        name="declinios"
        multiple
        defaultValue={escolhidos}
        className="lc-field__input"
        style={{ height: 'auto', minHeight: 'var(--control-h-lg)', padding: 'var(--space-2)' }}
      >
        {fornecedores.map((f) => (
          <option key={f.id} value={f.id}>
            {f.nome_fundo}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ----------------------------------------------------------- observações --- */

function BlocoObservacoes({ operacaoId, observacoes }: { operacaoId: string; observacoes: Observacao[] }) {
  const [nova, setNova] = useState('');
  const [, transicao] = useTransition();

  return (
    <section>
      <div className="linha" style={{ justifyContent: 'space-between' }}>
        <span className="lc-field__label">Observações</span>
        <Botao
          variante="tertiary"
          tamanho="sm"
          disabled={!nova.trim()}
          onClick={() => {
            transicao(() => void adicionarObservacao(operacaoId, nova));
            setNova('');
          }}
        >
          + Adicionar
        </Botao>
      </div>

      <Campo multilinha linhas={2} valor={nova} aoMudar={setNova} placeholder="Escreva a observação" />

      {observacoes.length ? (
        <ul className="lista" style={{ marginTop: 'var(--space-3)' }}>
          {observacoes.map((o) => (
            <li key={o.id} className="lista__item" style={{ alignItems: 'flex-start' }}>
              <span className="lista__texto">
                <span className="lista__meta">Modificado em: {dataCurta(o.criado_em)}</span>
                {o.texto}
              </span>
              <Botao
                variante="tertiary"
                tamanho="row"
                title="Excluir observação"
                aria-label="Excluir observação"
                onClick={() => transicao(() => void excluirObservacao(o.id))}
              >
                <span aria-hidden="true">🗑</span>
              </Botao>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------- tabela de etapas -- */

/**
 * Cada célula tem duas formas: texto em leitura, campo em edição. A edição é
 * **por linha**, acionada pelo lápis; as ações são salvar · editar · deletar.
 */
function TabelaDeEtapas({
  operacaoId,
  etapas,
  fornecedores,
  tipos,
  statusEtapa,
}: {
  operacaoId: string;
  etapas: EtapaOperacao[];
  fornecedores: Fundo[];
  tipos: TabelaApoio[];
  statusEtapa: TabelaApoio[];
}) {
  const [editando, setEditando] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState<DadosEtapa | null>(null);
  const [nova, setNova] = useState<DadosEtapa>({
    fornecedor_id: null,
    tipo_operacao_id: null,
    na_mao_de: null,
    status_id: null,
  });
  const [, transicao] = useTransition();

  const nomeFundo = new Map(fornecedores.map((f) => [f.id, f.nome_fundo]));
  const rotuloTipo = new Map(tipos.map((t) => [t.id, t.rotulo]));
  const statusPorId = new Map(statusEtapa.map((s) => [s.id, s]));

  const abrirEdicao = (e: EtapaOperacao) => {
    setEditando(e.id);
    setRascunho({
      fornecedor_id: e.fornecedor_id,
      tipo_operacao_id: e.tipo_operacao_id,
      na_mao_de: e.na_mao_de,
      status_id: e.status_id,
    });
  };

  const salvar = () => {
    if (!editando || !rascunho) return;
    transicao(() => void atualizarEtapa(editando, rascunho));
    setEditando(null);
    setRascunho(null);
  };

  return (
    <section>
      <span className="lc-field__label">Lista de Etapas</span>

      {etapas.length ? (
        <table className="lc-table" style={{ marginTop: 'var(--space-3)' }}>
          <colgroup>
            <col style={{ width: '24%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '8%' }} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Fundo</th>
              <th scope="col">Tipo de operação</th>
              <th scope="col">Na mão de</th>
              <th scope="col">Status</th>
              <th scope="col" />
              <th scope="col">Alterado em:</th>
            </tr>
          </thead>
          <tbody>
            {etapas.map((e) => {
              const emEdicao = editando === e.id;
              const st = e.status_id ? statusPorId.get(e.status_id) : undefined;

              return (
                <tr key={e.id}>
                  <td style={{ fontWeight: 600 }}>
                    {emEdicao ? (
                      <select
                        className="lc-field__input"
                        value={rascunho?.fornecedor_id ?? ''}
                        onChange={(ev) => setRascunho((r) => r && { ...r, fornecedor_id: ev.target.value || null })}
                      >
                        <option value="">—</option>
                        {fornecedores.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.nome_fundo}
                          </option>
                        ))}
                      </select>
                    ) : (
                      (e.fornecedor_id && nomeFundo.get(e.fornecedor_id)) || '-'
                    )}
                  </td>

                  <td>
                    {emEdicao ? (
                      <select
                        className="lc-field__input"
                        value={rascunho?.tipo_operacao_id ?? ''}
                        onChange={(ev) =>
                          setRascunho((r) => r && { ...r, tipo_operacao_id: ev.target.value ? Number(ev.target.value) : null })
                        }
                      >
                        <option value="">—</option>
                        {tipos.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.rotulo}
                          </option>
                        ))}
                      </select>
                    ) : (
                      (e.tipo_operacao_id && rotuloTipo.get(e.tipo_operacao_id)) || '-'
                    )}
                  </td>

                  <td>
                    {emEdicao ? (
                      <input
                        className="lc-field__input"
                        value={rascunho?.na_mao_de ?? ''}
                        onChange={(ev) => setRascunho((r) => r && { ...r, na_mao_de: ev.target.value || null })}
                      />
                    ) : (
                      e.na_mao_de || '-'
                    )}
                  </td>

                  <td>
                    {emEdicao ? (
                      <select
                        className="lc-field__input"
                        value={rascunho?.status_id ?? ''}
                        onChange={(ev) =>
                          setRascunho((r) => r && { ...r, status_id: ev.target.value ? Number(ev.target.value) : null })
                        }
                      >
                        <option value="">—</option>
                        {statusEtapa.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.rotulo}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ color: st ? `var(--${tokenDoStatus(st.chave)}-ink)` : undefined, fontWeight: 600 }}>
                        {st?.rotulo || '-'}
                      </span>
                    )}
                  </td>

                  <td>
                    <span className="lc-table__actions">
                      {emEdicao ? (
                        <Botao variante="tertiary" tamanho="row" onClick={salvar} title="Salvar" aria-label="Salvar">
                          <span aria-hidden="true">✓</span>
                        </Botao>
                      ) : null}
                      <Botao
                        variante="tertiary"
                        tamanho="row"
                        onClick={() => (emEdicao ? setEditando(null) : abrirEdicao(e))}
                        title={emEdicao ? 'Cancelar' : 'Editar'}
                        aria-label={emEdicao ? 'Cancelar' : 'Editar'}
                      >
                        <span aria-hidden="true">{emEdicao ? '✕' : '✎'}</span>
                      </Botao>
                      <Botao
                        variante="tertiary"
                        tamanho="row"
                        onClick={() => transicao(() => void excluirEtapa(e.id))}
                        title="Deletar"
                        aria-label="Deletar"
                      >
                        <span aria-hidden="true">🗑</span>
                      </Botao>
                    </span>
                  </td>

                  <td className="mono apoio">{dataCurta(e.atualizado_em)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}

      {/* Linha de criação de etapa — só master. */}
      <div className="criar-etapa">
        <select
          className="lc-field__input"
          aria-label="Tipo de operação sugerido"
          value={nova.tipo_operacao_id ?? ''}
          onChange={(e) => setNova((n) => ({ ...n, tipo_operacao_id: e.target.value ? Number(e.target.value) : null }))}
        >
          <option value="">Tipo de operação</option>
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.rotulo}
            </option>
          ))}
        </select>

        <select
          className="lc-field__input"
          aria-label="Fundo sugerido"
          value={nova.fornecedor_id ?? ''}
          onChange={(e) => setNova((n) => ({ ...n, fornecedor_id: e.target.value || null }))}
        >
          <option value="">Fundo</option>
          {fornecedores.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome_fundo}
            </option>
          ))}
        </select>

        <select
          className="lc-field__input"
          aria-label="Status"
          value={nova.status_id ?? ''}
          onChange={(e) => setNova((n) => ({ ...n, status_id: e.target.value ? Number(e.target.value) : null }))}
        >
          <option value="">Status</option>
          {statusEtapa.map((s) => (
            <option key={s.id} value={s.id}>
              {s.rotulo}
            </option>
          ))}
        </select>

        <input
          className="lc-field__input"
          placeholder="Na mão de"
          aria-label="Na mão de"
          value={nova.na_mao_de ?? ''}
          onChange={(e) => setNova((n) => ({ ...n, na_mao_de: e.target.value || null }))}
        />

        <Botao
          variante="secondary"
          title="Adicionar etapa"
          aria-label="Adicionar etapa"
          disabled={!nova.fornecedor_id && !nova.tipo_operacao_id}
          onClick={() => {
            transicao(() => void criarEtapa(operacaoId, nova));
            setNova({ fornecedor_id: null, tipo_operacao_id: null, na_mao_de: null, status_id: null });
          }}
        >
          +
        </Botao>
      </div>
    </section>
  );
}
