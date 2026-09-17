'use client';

import { useCallback, useMemo, useState } from 'react';
import { Botao, Vazio } from '@/components/ui/base';
import { TopoDaTela } from '@/components/ui/casca';
import { Busca } from '@/components/listas';
import type { Operacao, TabelaApoio } from '@/lib/dominio';
import { DialogoEsteira } from './dialogo';
import type { EtapaEsteira, ItemChecklist } from './page';

type OperacaoResumo = Pick<Operacao, 'id' | 'identificador' | 'cliente_id'>;

export function TelaEsteira({
  operacoes,
  clientes,
  fornecedores,
  tipos,
  etapas,
  checklist,
  instrumentos,
}: {
  operacoes: OperacaoResumo[];
  clientes: Array<{ id: string; nome_razao: string }>;
  fornecedores: Array<{ id: string; nome_fundo: string }>;
  tipos: TabelaApoio[];
  etapas: EtapaEsteira[];
  checklist: ItemChecklist[];
  instrumentos: Array<{ etapa_id: string; tipo_operacao_id: number }>;
}) {
  const [busca, setBusca] = useState('');
  const [aberta, setAberta] = useState<OperacaoResumo | null>(null);

  const nomeCliente = useMemo(() => new Map(clientes.map((c) => [c.id, c.nome_razao])), [clientes]);
  const rotuloTipo = useMemo(() => new Map(tipos.map((t) => [t.id, t.rotulo])), [tipos]);

  /**
   * Cada linha traz **tipo de operação + " - " + nome do cliente** — o tipo
   * primeiro, em tom de apoio; o cliente depois, em negrito. O tipo vem das
   * etapas: o campo da operação está vazio em toda a base.
   */
  const tipoDe = useCallback(
    (op: OperacaoResumo) => {
      const rotulos = etapas
        .filter((e) => e.operacao_id === op.id && e.tipo_operacao_id)
        .map((e) => rotuloTipo.get(e.tipo_operacao_id as number))
        .filter((r): r is string => Boolean(r));
      return [...new Set(rotulos)].join(' / ');
    },
    [etapas, rotuloTipo],
  );

  const clienteDe = (op: OperacaoResumo) =>
    (op.cliente_id && nomeCliente.get(op.cliente_id)) || op.identificador || '—';

  const visiveis = useMemo(() => {
    const alvo = busca.trim().toUpperCase();
    if (!alvo) return operacoes;
    return operacoes.filter(
      (op) => clienteDe(op).toUpperCase().includes(alvo) || tipoDe(op).toUpperCase().includes(alvo),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operacoes, busca, tipoDe]);

  return (
    <>
      {/* Busca sublinhada no alto da área de conteúdo. */}
      <TopoDaTela>
        <Busca valor={busca} aoMudar={setBusca} placeholder="Buscar" />
      </TopoDaTela>

      {visiveis.length === 0 ? (
        <div className="vazio-tela">
          <Vazio
            titulo={operacoes.length ? 'Nenhuma operação com esse nome' : 'Nenhuma operação em estruturação'}
            escondidos={operacoes.length - visiveis.length || undefined}
            aoLimpar={busca ? () => setBusca('') : undefined}
          />
        </div>
      ) : (
        <ul className="lista">
          {visiveis.map((op) => (
            <li key={op.id} className="lista__item">
              <span className="lista__texto">
                {tipoDe(op) ? <span className="lista__apoio">{tipoDe(op)} - </span> : null}
                <span className="lista__nome">{clienteDe(op)}</span>
              </span>
              {/* Um único ícone: o lápis. Não há lixeira nem arquivar aqui. */}
              <Botao
                variante="tertiary"
                tamanho="row"
                title="Abrir esteira"
                aria-label={`Abrir esteira de ${clienteDe(op)}`}
                onClick={() => setAberta(op)}
              >
                <span aria-hidden="true">✎</span>
              </Botao>
            </li>
          ))}
        </ul>
      )}

      {aberta ? (
        <DialogoEsteira
          aberto
          operacao={aberta}
          rotuloOperacao={`${tipoDe(aberta)}${tipoDe(aberta) ? ' - ' : ''}${clienteDe(aberta)}`}
          fornecedores={fornecedores}
          tipos={tipos}
          etapas={etapas.filter((e) => e.operacao_id === aberta.id)}
          checklist={checklist}
          instrumentos={instrumentos}
          aoFechar={() => setAberta(null)}
        />
      ) : null}
    </>
  );
}
