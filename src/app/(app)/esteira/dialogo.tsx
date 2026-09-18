'use client';

import { useActionState, useEffect, useMemo, useState, useTransition } from 'react';
import { Aviso, Botao, Campo } from '@/components/ui/base';
import { Dialogo } from '@/components/ui/dialogo';
import type { Operacao, TabelaApoio } from '@/lib/dominio';
import { acrescentarEtapa, gravarEtapaDaEsteira } from './acoes';
import { ITENS_CHECKLIST } from './checklist';
import type { EtapaEsteira, ItemChecklist } from './page';

type OperacaoResumo = Pick<Operacao, 'id' | 'identificador' | 'cliente_id'>;

/**
 * Blocos condicionados pelo instrumento — três, mutuamente exclusivos.
 * Só aparecem depois de escolher o instrumento.
 */
const BLOCOS = [
  {
    titulo: 'FIDC, FIAGRO, FII, SLB',
    quando: ['FIDC Proprietário', 'FIAGRO', 'FII', 'SLB'],
    campos: [
      ['gestor', 'Gestor'],
      ['administrador', 'Admnistrador'],
      ['dtvm', 'DTVM'],
      ['assessoria_legal', 'Assessoria Legal'],
    ],
  },
  {
    titulo: 'CRA, CRI, CR',
    quando: ['CRA', 'CRI', 'CR'],
    campos: [
      ['securitizadora', 'Securitizadora'],
      ['dtvm', 'DTVM'],
      ['agente_fiduciario', 'Agente Fiduciário'],
      ['custodiante', 'Custodiante'],
    ],
  },
  {
    titulo: 'Debêntures',
    quando: ['Debêntures'],
    campos: [
      ['emissor', 'Emissor'],
      ['estruturador', 'Estruturador'],
      ['agente_fiduciario', 'Agente Fiduciário'],
      ['dtvm', 'DTVM'],
    ],
  },
] as const;

/**
 * Os instrumentos que a esteira conhece — a união do `quando` dos três blocos.
 *
 * São os mesmos da expressão do Bubble (`documentacao-completa.md:1614`), que
 * filtra `All tipo operação op` por CRA, CRI, CR, FIDC Proprietário, FIAGRO,
 * FII, SLB e Debêntures. A tela mostrava os 31 tipos de operação, inclusive
 * M&A, Câmbio e Vendor, que não têm estruturação nenhuma para acompanhar aqui.
 */
const INSTRUMENTOS: ReadonlySet<string> = new Set(BLOCOS.flatMap((b) => [...b.quando]));

export function DialogoEsteira({
  aberto,
  operacao,
  rotuloOperacao,
  fornecedores,
  tipos,
  etapas,
  checklist,
  instrumentos,
  aoFechar,
}: {
  aberto: boolean;
  operacao: OperacaoResumo;
  rotuloOperacao: string;
  fornecedores: Array<{ id: string; nome_fundo: string }>;
  tipos: TabelaApoio[];
  etapas: EtapaEsteira[];
  checklist: ItemChecklist[];
  instrumentos: Array<{ etapa_id: string; tipo_operacao_id: number }>;
  aoFechar: () => void;
}) {
  const [estado, agir, gravando] = useActionState(gravarEtapaDaEsteira, null as { erro?: string; ok?: boolean } | null);
  const [etapaId, setEtapaId] = useState(etapas[0]?.id ?? '');
  const [, transicao] = useTransition();

  const etapa = etapas.find((e) => e.id === etapaId) ?? null;

  const escolhidos = useMemo(
    () => instrumentos.filter((i) => i.etapa_id === etapaId).map((i) => i.tipo_operacao_id),
    [instrumentos, etapaId],
  );
  const [instrumentoIds, setInstrumentoIds] = useState<number[]>(escolhidos);

  /** Só os instrumentos da esteira entram na lista de pílulas. */
  const tiposDeInstrumento = useMemo(() => tipos.filter((t) => INSTRUMENTOS.has(t.rotulo)), [tipos]);
  useEffect(() => setInstrumentoIds(escolhidos), [escolhidos]);

  const rotulosEscolhidos = useMemo(() => {
    const porId = new Map(tipos.map((t) => [t.id, t.rotulo]));
    return instrumentoIds.map((id) => porId.get(id)).filter((r): r is string => Boolean(r));
  }, [instrumentoIds, tipos]);

  const blocoAtivo = BLOCOS.find((b) => b.quando.some((q) => rotulosEscolhidos.includes(q)));

  const itensDaEtapa = useMemo(
    () => new Map(checklist.filter((c) => c.etapa_id === etapaId).map((c) => [c.chave, c])),
    [checklist, etapaId],
  );

  /** "Instituição Líder" é calculada: o fundo da etapa com contrato assinado. */
  const instituicaoLider = useMemo(() => {
    const nome = new Map(fornecedores.map((f) => [f.id, f.nome_fundo]));
    const comFundo = etapas.find((e) => e.fornecedor_id);
    return comFundo?.fornecedor_id ? (nome.get(comFundo.fornecedor_id) ?? '') : '';
  }, [etapas, fornecedores]);

  useEffect(() => {
    if (estado?.ok) aoFechar();
  }, [estado, aoFechar]);

  return (
    <Dialogo
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={null}
      largura="lg"
      rodape={
        <Botao variante="primary" type="submit" form="forma-esteira" disabled={gravando || !etapa}>
          {gravando ? 'Gravando…' : 'Gravar'}
        </Botao>
      }
    >
      <form id="forma-esteira" action={agir} className="pilha">
        <input type="hidden" name="etapa_id" value={etapaId} />

        {/* Sem etapa não há o que gravar: a esteira pendura tudo numa etapa.
            Sem este aviso o botão fica desabilitado e nada explica por quê. */}
        {!etapa ? (
          <Aviso
            tom="neutral"
            titulo="Esta operação ainda não tem etapa"
            corpo={
              <>
                A esteira registra o andamento <strong>por fundo</strong>, e cada fundo é uma etapa.
                Use &ldquo;Adicionar etapa&rdquo; abaixo para começar — até lá não há onde gravar.
              </>
            }
          />
        ) : null}

        {/* 1 — cabeçalho de leitura */}
        <p className="t-section-title" style={{ margin: 0 }}>
          <span className="apoio">Operação: </span>
          {rotuloOperacao}
        </p>

        {/* 2 — instrumento */}
        <div className="lc-field">
          <span className="lc-field__label">Instrumento:</span>
          {instrumentoIds.map((id) => (
            <input key={id} type="hidden" name="instrumento" value={id} />
          ))}
          <div className="tipos__lista">
            {tiposDeInstrumento.map((t) => {
              const marcado = instrumentoIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  className={['tipos__tag', marcado && 'tipos__tag--marcado'].filter(Boolean).join(' ')}
                  aria-pressed={marcado}
                  onClick={() =>
                    setInstrumentoIds((v) => (v.includes(t.id) ? v.filter((x) => x !== t.id) : [...v, t.id]))
                  }
                >
                  {t.rotulo}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3 */}
        <div className="linha">
          <span className="prefixo-moeda">R$</span>
          <Campo rotulo="Volume:" nome="volume" valorInicial={etapa?.volume ?? ''} className="cresce" placeholder="Digite aqui" />
        </div>

        {/* 4 — calculado */}
        <hr className="grade__regua" />
        <Campo rotulo="Instituição Líder:" calculado valorInicial={instituicaoLider} />

        {/* 5, 6 */}
        <div className="grade">
          <Campo rotulo="Inicio:" nome="dt_inicio" tipo="date" valorInicial={etapa?.dt_inicio ?? ''} />
          <label className="interruptor" style={{ alignSelf: 'end', height: 'var(--control-h-md)' }}>
            <input type="checkbox" name="ts_assinado" defaultChecked={etapa?.ts_assinado} />
            <span>Ts Assinado:</span>
          </label>
        </div>

        {/* 7 — lista de etapas, com o ícone de acrescentar ao lado do título */}
        <div className="linha" style={{ justifyContent: 'space-between' }}>
          <span className="lc-field__label">Lista de Etapas</span>
          <Botao
            variante="tertiary"
            tamanho="sm"
            title="Adicionar etapa"
            onClick={() => transicao(() => void acrescentarEtapa(operacao.id))}
          >
            + Adicionar etapa
          </Botao>
        </div>

        {etapas.length > 1 ? (
          <div className="tipos__lista">
            {etapas.map((e, i) => {
              const nome = fornecedores.find((f) => f.id === e.fornecedor_id)?.nome_fundo ?? `Etapa ${i + 1}`;
              return (
                <button
                  key={e.id}
                  type="button"
                  className={['tipos__tag', e.id === etapaId && 'tipos__tag--marcado'].filter(Boolean).join(' ')}
                  aria-pressed={e.id === etapaId}
                  onClick={() => setEtapaId(e.id)}
                >
                  {nome}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Blocos condicionados pelo instrumento */}
        {blocoAtivo ? (
          <section className="pilha">
            <hr className="grade__regua" />
            <p className="t-section-title" style={{ margin: 0 }}>
              {blocoAtivo.titulo}
            </p>
            <div className="grade">
              {blocoAtivo.campos.map(([nome, rotulo]) => (
                <Campo
                  key={nome}
                  rotulo={rotulo}
                  nome={nome}
                  valorInicial={(etapa?.[nome as keyof EtapaEsteira] as string | null) ?? ''}
                  placeholder="Digite aqui"
                />
              ))}
              <Campo className="grade__inteiro" rotulo="Demais" nome="demais" multilinha linhas={3} valorInicial={etapa?.demais ?? ''} placeholder="Digite aqui" />
            </div>
          </section>
        ) : null}

        {/* 8 — o checklist */}
        <hr className="grade__regua" />
        <div className="checklist">
          <div className="checklist__cabecalho">
            <span />
            <span />
            <span className="t-column-label">OBSERVAÇÕES</span>
          </div>

          {ITENS_CHECKLIST.map((item) => {
            const gravado = itensDaEtapa.get(item.chave);
            return (
              <ItemDoChecklist
                key={item.chave}
                chave={item.chave}
                rotuloFixo={item.livre ? null : item.rotulo}
                rotuloInicial={gravado?.rotulo ?? ''}
                valorInicial={gravado?.valor ?? 0}
                descricaoInicial={gravado?.descricao ?? ''}
              />
            );
          })}
        </div>

        {/* 9, 10 */}
        <hr className="grade__regua" />
        <div className="linha" style={{ gap: 'var(--space-6)' }}>
          <label className="interruptor">
            <input type="checkbox" name="op_de_pe" defaultChecked={etapa?.op_de_pe} />
            <span>Operação de pé:</span>
          </label>
          <label className="interruptor">
            <input type="checkbox" name="fee_recebido" defaultChecked={etapa?.fee_recebido} />
            <span>Fee Recebido:</span>
          </label>
        </div>

        {estado?.erro ? (
          <p className="lc-field__msg" role="alert">
            {estado.erro}
          </p>
        ) : null}
      </form>
    </Dialogo>
  );
}

/** Rótulo + slider de 0 a 100 + "%" + observação multilinha. */
function ItemDoChecklist({
  chave,
  rotuloFixo,
  rotuloInicial,
  valorInicial,
  descricaoInicial,
}: {
  chave: string;
  rotuloFixo: string | null;
  rotuloInicial: string;
  valorInicial: number;
  descricaoInicial: string;
}) {
  const [valor, setValor] = useState(valorInicial);

  return (
    <div className="checklist__item">
      <div className="checklist__rotulo">
        {rotuloFixo ? (
          <span>{rotuloFixo}</span>
        ) : (
          <input
            className="lc-field__input"
            name={`rotulo_${chave}`}
            defaultValue={rotuloInicial}
            placeholder="Digite aqui..."
            aria-label="Nome do item livre"
          />
        )}
      </div>

      <div className="checklist__slider">
        <input
          type="range"
          min={0}
          max={100}
          name={`valor_${chave}`}
          value={valor}
          onChange={(e) => setValor(Number(e.target.value))}
          aria-label={`Progresso de ${rotuloFixo ?? chave}`}
        />
        <span className="mono checklist__pct">{valor}%</span>
      </div>

      <textarea
        className="lc-field__input"
        name={`desc_${chave}`}
        defaultValue={descricaoInicial}
        rows={2}
        aria-label={`Observação de ${rotuloFixo ?? chave}`}
      />
    </div>
  );
}
