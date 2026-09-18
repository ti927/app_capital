'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { Botao, Campo } from '@/components/ui/base';
import { SeletorMultiploPopup, SeletorPopup } from '@/components/ui/seletor-popup';
import {
  IconeDeletar,
  IconeEditar,
  IconeFechar,
  IconeMais,
  IconeSalvar,
} from '@/components/ui/icones';
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
        <>
          {/*
            Group X do Bubble (:2001): o toggle fica no pé do diálogo, ao lado
            do botão Cadastrar/Salvar. Lá ele **exibe** `fee (yes/no)` e
            **grava** `Estruturação em Andamento` (dívida documentada em
            :2271) — aqui exibe e grava o mesmo campo.

            O `form=` é o que faz o checkbox viajar no submit estando fora
            da <form>.
          */}
          <Interruptor
            nome="estruturacao_em_andamento"
            rotulo="Estruturação em Andamento"
            inicial={operacao?.estruturacao_em_andamento}
            form="forma-operacao"
          />
          <Botao variante="primary" type="submit" form="forma-operacao" disabled={gravando}>
            {nova ? 'Cadastrar' : 'Salvar'}
          </Botao>
        </>
      }
    >
      <form id="forma-operacao" action={agir} className="grade">
        <input type="hidden" name="id" value={operacao?.id ?? ''} />

        {/* "Escolher cliente:" só aparece quando a operação é nova. */}
        {nova ? (
          <SeletorPopup
            className="grade__inteiro"
            rotulo="Escolher cliente:"
            nome="cliente_id"
            opcoes={clientes.map((c) => ({ valor: c.id, rotulo: c.nome_razao }))}
          />
        ) : (
          <input type="hidden" name="cliente_id" value={operacao?.cliente_id ?? ''} />
        )}

        <Campo rotulo="Identificador" nome="identificador" valorInicial={operacao?.identificador ?? ''} placeholder="Digite aqui" />
        <SeletorPopup
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

        {/* Texto livre: veio do cliente na migração, mas edita-se aqui. */}
        <Campo rotulo="Faturamento anual" nome="faturamento_anual" valorInicial={operacao?.faturamento_anual ?? ''} placeholder="Digite aqui" />
        <Campo rotulo="Comissão" nome="comissao" valorInicial={operacao?.comissao ?? ''} placeholder="Digite aqui" />

        {/* Group VZ do Bubble: Comissão e Destino do recurso lado a lado. */}
        <Campo rotulo="Destino do recurso" nome="destino_recurso" valorInicial={operacao?.destino_recurso ?? ''} placeholder="Digite aqui" />

        <Campo className="grade__inteiro campo-alto" rotulo="Parecer da operação" nome="parecer" multilinha linhas={11} valorInicial={operacao?.parecer ?? ''} placeholder="Digite aqui" />

        {/* Rótulos como no Bubble (Group S / JZZ, documentacao-completa.md:2011–2016). */}
        <div className="grade__inteiro linha" style={{ gap: 'var(--space-6)', flexWrap: 'wrap' }}>
          <Interruptor nome="tem_fee" rotulo="Com fee" inicial={operacao?.tem_fee} />
          <Interruptor nome="nda_assinado" rotulo="NDA assinado com o Cliente" inicial={operacao?.nda_assinado} />
          <Interruptor nome="mandato_assinado" rotulo="Mandato assinado pelo cliente" inicial={operacao?.mandato_assinado} />
          <Interruptor
            nome="mandato_assinado_fornecedor"
            rotulo="Mandato assinado com o fundo"
            inicial={operacao?.mandato_assinado_fornecedor}
          />
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

function Interruptor({
  nome,
  rotulo,
  inicial,
  form,
}: {
  nome: string;
  rotulo: string;
  inicial?: boolean;
  /** Id da <form> quando o interruptor fica fora dela (rodapé do diálogo). */
  form?: string;
}) {
  return (
    <label className="interruptor">
      <input type="checkbox" name={nome} defaultChecked={inicial} form={form} />
      <span>{rotulo}</span>
    </label>
  );
}

/* -------------------------------------------------------------- declínios -- */

/** Quais fornecedores recusaram a operação. Desabilitado para indicante. */
function Declinios({ fornecedores, escolhidos }: { fornecedores: Fundo[]; escolhidos: string[] }) {
  return (
    <SeletorMultiploPopup
      className="grade__inteiro"
      rotulo="Declínios"
      nome="declinios"
      inicial={escolhidos}
      opcoes={fornecedores.map((f) => ({ valor: f.id, rotulo: f.nome_fundo }))}
    />
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
          <IconeMais tamanho={14} /> Adicionar
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
                <IconeDeletar tamanho={14} />
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
 * Os três status que saem da lista principal e formam a segunda tabela
 * (documentacao-completa.md:1839 — `tbl.etapas` exclui os três,
 * `tbl.etapas copy 2` mostra só eles).
 */
const STATUS_DECLINADOS = new Set([
  'ja_cliente_do_fundo',
  'declinado_pelo_fundo',
  'declinado_pelo_cliente',
]);

/**
 * Cada célula tem duas formas: texto em leitura, campo em edição. A edição é
 * **por linha**, acionada pelo lápis; as ações são salvar · editar · deletar.
 *
 * O estado de edição mora aqui, e não na grade, porque as duas grades — a
 * principal e a dos declinados — compartilham a mesma linha em edição.
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

  const cancelar = () => {
    setEditando(null);
    setRascunho(null);
  };

  const salvar = () => {
    if (!editando || !rascunho) return;
    transicao(() => void atualizarEtapa(editando, rascunho));
    cancelar();
  };

  const mudarRascunho = (parcial: Partial<DadosEtapa>) =>
    setRascunho((r) => (r ? { ...r, ...parcial } : r));

  const excluir = (id: string) => transicao(() => void excluirEtapa(id));

  const declinada = (e: EtapaOperacao) => {
    const st = e.status_id ? statusPorId.get(e.status_id) : undefined;
    return st ? STATUS_DECLINADOS.has(st.chave) : false;
  };

  const principais = etapas.filter((e) => !declinada(e));
  const declinadas = etapas.filter(declinada);

  const ferramentas = {
    fornecedores,
    tipos,
    statusEtapa,
    editando,
    rascunho,
    mudarRascunho,
    abrirEdicao,
    cancelar,
    salvar,
    excluir,
  };

  return (
    <section>
      {/* A tabela some quando não há nenhuma etapa — a grade devolve null. */}
      <GradeDeEtapas titulo="Lista de Etapas" linhas={principais} {...ferramentas} />

      {/* Linha de criação de etapa — só na primeira tabela, só master. */}
      <div className="criar-etapa">
        <SeletorPopup
          key={`novo-tipo-${nova.tipo_operacao_id ?? 'vazio'}`}
          placeholder="Tipo de operação"
          valorInicial={nova.tipo_operacao_id ? String(nova.tipo_operacao_id) : ''}
          opcoes={tipos.map((t) => ({ valor: String(t.id), rotulo: t.rotulo }))}
          aoEscolher={(v) => setNova((n) => ({ ...n, tipo_operacao_id: v ? Number(v) : null }))}
        />

        <SeletorPopup
          key={`novo-fundo-${nova.fornecedor_id ?? 'vazio'}`}
          placeholder="Fundo"
          valorInicial={nova.fornecedor_id ?? ''}
          opcoes={fornecedores.map((f) => ({ valor: f.id, rotulo: f.nome_fundo }))}
          aoEscolher={(v) => setNova((n) => ({ ...n, fornecedor_id: v || null }))}
        />

        <SeletorPopup
          key={`novo-status-${nova.status_id ?? 'vazio'}`}
          placeholder="Status"
          valorInicial={nova.status_id ? String(nova.status_id) : ''}
          opcoes={statusEtapa.map((s) => ({
            valor: String(s.id),
            rotulo: s.rotulo,
            cor: `var(--${tokenDoStatus(s.chave)})`,
          }))}
          aoEscolher={(v) => setNova((n) => ({ ...n, status_id: v ? Number(v) : null }))}
        />

        {/* No Bubble "Na mão de" é MultiLineInput (:1979). */}
        <Campo
          multilinha
          linhas={2}
          placeholder="Na mão de"
          valor={nova.na_mao_de ?? ''}
          aoMudar={(v) => setNova((n) => ({ ...n, na_mao_de: v || null }))}
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
          <IconeMais tamanho={15} />
        </Botao>
      </div>

      {/* Declinados: mesma estrutura, logo abaixo, e some quando a lista é vazia. */}
      {declinadas.length ? (
        <>
          <GradeDeEtapas titulo="Etapas declinadas" linhas={declinadas} {...ferramentas} />
          <p className="etapas-nota apoio">
            Status referentes à: Já cliente do fundo, Recusado pelo Cliente, Recusado pelo Fundo.
          </p>
        </>
      ) : null}
    </section>
  );
}

/** Uma grade de etapas. Devolve `null` sem linha — as duas somem quando vazias. */
function GradeDeEtapas({
  titulo,
  linhas,
  fornecedores,
  tipos,
  statusEtapa,
  editando,
  rascunho,
  mudarRascunho,
  abrirEdicao,
  cancelar,
  salvar,
  excluir,
}: {
  titulo: string;
  linhas: EtapaOperacao[];
  fornecedores: Fundo[];
  tipos: TabelaApoio[];
  statusEtapa: TabelaApoio[];
  editando: string | null;
  rascunho: DadosEtapa | null;
  mudarRascunho: (parcial: Partial<DadosEtapa>) => void;
  abrirEdicao: (e: EtapaOperacao) => void;
  cancelar: () => void;
  salvar: () => void;
  excluir: (id: string) => void;
}) {
  if (!linhas.length) return null;

  const nomeFundo = new Map(fornecedores.map((f) => [f.id, f.nome_fundo]));
  const rotuloTipo = new Map(tipos.map((t) => [t.id, t.rotulo]));
  const statusPorId = new Map(statusEtapa.map((s) => [s.id, s]));

  return (
    <>
      <span className="lc-field__label">{titulo}</span>

      <table className="lc-table tabela-etapas" style={{ marginTop: 'var(--space-3)' }}>
        {/* "Na mão de" é texto corrido e precisa da maior fatia; Fundo cede. */}
        <colgroup>
          <col style={{ width: '20%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '26%' }} />
          <col style={{ width: '18%' }} />
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
          {linhas.map((e) => {
            const emEdicao = editando === e.id;
            const st = e.status_id ? statusPorId.get(e.status_id) : undefined;

            return (
              <tr key={e.id}>
                <td style={{ fontWeight: 600 }}>
                  {emEdicao ? (
                    <SeletorPopup
                      key={`fundo-${e.id}`}
                      valorInicial={rascunho?.fornecedor_id ?? ''}
                      placeholder="Escolha o fundo"
                      opcoes={fornecedores.map((f) => ({ valor: f.id, rotulo: f.nome_fundo }))}
                      aoEscolher={(v) => mudarRascunho({ fornecedor_id: v || null })}
                    />
                  ) : (
                    (e.fornecedor_id && nomeFundo.get(e.fornecedor_id)) || '-'
                  )}
                </td>

                <td>
                  {emEdicao ? (
                    <SeletorPopup
                      key={`tipo-${e.id}`}
                      valorInicial={rascunho?.tipo_operacao_id ? String(rascunho.tipo_operacao_id) : ''}
                      placeholder="Escolha o tipo"
                      opcoes={tipos.map((t) => ({ valor: String(t.id), rotulo: t.rotulo }))}
                      aoEscolher={(v) => mudarRascunho({ tipo_operacao_id: v ? Number(v) : null })}
                    />
                  ) : (
                    (e.tipo_operacao_id && rotuloTipo.get(e.tipo_operacao_id)) || '-'
                  )}
                </td>

                {/* Em leitura quebra linha e mostra tudo; em edição é textarea. */}
                <td className="na-mao-de">
                  {emEdicao ? (
                    <Campo
                      multilinha
                      linhas={2}
                      placeholder="Na mão de"
                      valor={rascunho?.na_mao_de ?? ''}
                      aoMudar={(v) => mudarRascunho({ na_mao_de: v || null })}
                    />
                  ) : (
                    e.na_mao_de || '-'
                  )}
                </td>

                <td>
                  {emEdicao ? (
                    <SeletorPopup
                      key={`status-${e.id}`}
                      valorInicial={rascunho?.status_id ? String(rascunho.status_id) : ''}
                      placeholder="Escolha o status"
                      opcoes={statusEtapa.map((s) => ({
                        valor: String(s.id),
                        rotulo: s.rotulo,
                        cor: `var(--${tokenDoStatus(s.chave)})`,
                      }))}
                      aoEscolher={(v) => mudarRascunho({ status_id: v ? Number(v) : null })}
                    />
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
                        <IconeSalvar />
                      </Botao>
                    ) : null}
                    <Botao
                      variante="tertiary"
                      tamanho="row"
                      onClick={() => (emEdicao ? cancelar() : abrirEdicao(e))}
                      title={emEdicao ? 'Cancelar' : 'Editar'}
                      aria-label={emEdicao ? 'Cancelar' : 'Editar'}
                    >
                      {emEdicao ? <IconeFechar /> : <IconeEditar />}
                    </Botao>
                    <Botao
                      variante="tertiary"
                      tamanho="row"
                      onClick={() => excluir(e.id)}
                      title="Deletar"
                      aria-label="Deletar"
                    >
                      <IconeDeletar />
                    </Botao>
                  </span>
                </td>

                <td className="mono apoio">{dataCurta(e.atualizado_em)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
