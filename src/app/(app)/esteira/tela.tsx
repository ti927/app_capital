'use client';

import { useMemo, useState } from 'react';
import { Botao, Vazio } from '@/components/ui/base';
import { TopoDaTela } from '@/components/ui/casca';
import { Busca, ItemDaLista } from '@/components/listas';
import { IconeEditar } from '@/components/ui/icones';
import { CarregarMais, useListaIncremental } from '@/components/ui/rolagem';
import type { Operacao, TabelaApoio } from '@/lib/dominio';
import { DialogoEsteira } from './dialogo';
import type { EtapaEsteira, ItemChecklist } from './page';

type OperacaoResumo = Pick<Operacao, 'id' | 'identificador' | 'cliente_id'>;

export function TelaEsteira({
  operacoes,
  statusContratoId,
  clientes,
  fornecedores,
  tipos,
  etapas,
  checklist,
  instrumentos,
}: {
  operacoes: OperacaoResumo[];
  statusContratoId: number | null;
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

  /**
   * Cada linha traz **identificador da operação + " - " + nome do cliente** —
   * o identificador em tom de apoio, o cliente em negrito. É o que o Bubble
   * mostra (documentacao-completa.md:1650): `txt.qual cliente copy` é o
   * identificador, invisível quando vazio, e `txt.qual cliente` é o " - " mais
   * o nome do cliente.
   *
   * Antes saía daqui a lista de tipos das etapas ("CPR / FGI / Capital de
   * Giro"). Não é o Bubble, e apagava justamente o que distingue duas
   * operações do mesmo cliente: as duas do Garcia Agronegócios viravam dois
   * rótulos quase iguais, uma delas idêntica ao identificador da outra.
   */
  const identificadorDe = (op: OperacaoResumo) => op.identificador?.trim() || '';

  const clienteDe = (op: OperacaoResumo) =>
    (op.cliente_id && nomeCliente.get(op.cliente_id)) || '—';

  const visiveis = useMemo(() => {
    const alvo = busca.trim().toUpperCase();
    if (!alvo) return operacoes;
    return operacoes.filter(
      (op) => clienteDe(op).toUpperCase().includes(alvo) || identificadorDe(op).toUpperCase().includes(alvo),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operacoes, busca]);

  /** A lista entra em lotes conforme rola — ver `ui/rolagem.tsx`. */
  const lista = useListaIncremental(visiveis);

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
        <>
          <ul className="lista">
            {lista.visiveis.map((op) => (
              <ItemDaLista
                key={op.id}
                aoAbrir={() => setAberta(op)}
                rotuloAbrir={`Abrir esteira de ${clienteDe(op)}`}
                acoes={
                  /* Um único ícone: o lápis. Não há lixeira nem arquivar aqui. */
                  <Botao
                    variante="tertiary"
                    tamanho="row"
                    title="Abrir esteira"
                    aria-label={`Abrir esteira de ${clienteDe(op)}`}
                    onClick={() => setAberta(op)}
                  >
                    <IconeEditar />
                  </Botao>
                }
              >
                {identificadorDe(op) ? (
                  <span className="lista__apoio">{identificadorDe(op)} - </span>
                ) : null}
                <span className="lista__nome">{clienteDe(op)}</span>
              </ItemDaLista>
            ))}
          </ul>
          <CarregarMais
            faltam={lista.faltam}
            aoCarregar={lista.carregarMais}
            substantivo="operações"
          />
        </>
      )}

      {aberta ? (
        <DialogoEsteira
          aberto
          operacao={aberta}
          rotuloOperacao={`${identificadorDe(aberta)}${identificadorDe(aberta) ? ' - ' : ''}${clienteDe(aberta)}`}
          statusContratoId={statusContratoId}
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
