'use client';

import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { useSalvarOtimista } from '@/components/ui/salvar-otimista';
import { Botao, Campo } from '@/components/ui/base';
import { SeletorPopup } from '@/components/ui/seletor-popup';
import {
  IconeAlvo,
  IconeAssinatura,
  IconeEscudo,
  IconeFornecedor,
  IconeLista,
  IconeMoeda,
  IconeNota,
  IconeOperacao,
  IconeRelogio,
} from '@/components/ui/icones';
import { Dialogo } from '@/components/ui/dialogo';
import {
  CabecaDaFicha,
  DICA_SALVAR,
  EstadoDoRodape,
  IndiceDaFicha,
  PilulaInterruptor,
  Rotulo,
  Secao,
  useAtalhosDaFicha,
  useFicha,
  usePulso,
  type DefinicaoSecao,
} from '@/components/ui2/ficha';
import { tokenDoStatus } from '@/lib/dominio';
import { gravarOperacao } from './acoes';
import {
  BlocoObservacoes,
  Declinios,
  Interruptor,
  PrintsParaEmail,
  TabelaDeEtapas,
  ordenarPtBr,
  type DialogoOperacao,
} from './dialogo';
import { DialogoEmail } from './email';

type Props = ComponentProps<typeof DialogoOperacao>;

const FORMA = 'forma-operacao';

/**
 * Pop-up de operação, UI moderna ("ficha" — design/ui2-popups.md, 2.3).
 *
 * Contrato com a clássica (`dialogo.tsx`): mesma ordem (`campos.ts`, os pares
 * na mesma linha), mesmos `name=`, mesma action, mesmo salvar otimista e
 * mesmas mensagens. Observações, declínios, etapas e e-mail de status são os
 * componentes da clássica — só a casca muda. PMTS, Comissão e Demanda final
 * não aparecem; `gravarOperacao` só grava o que vem no formulário.
 */
export function DialogoOperacaoModerno({
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
}: Props) {
  const salvar = useSalvarOtimista(gravarOperacao, {
    existente: Boolean(operacao?.id),
    id: operacao?.id,
    mensagem: operacao ? 'Operação salva' : 'Operação cadastrada',
    oQue: 'a operação',
    aoFechar,
  });

  const [emailAberto, setEmailAberto] = useState(false);
  const pulso = usePulso();

  // Faturamento vazio na operação: abre com o do cadastro do cliente (mesma
  // regra da clássica). Grava junto no próximo salvar com mudança.
  const doClienteDe = (id: string | null | undefined) =>
    (id ? clientes.find((c) => c.id === id)?.faturamento_anual : null) || '';
  const [clienteEscolhido, setClienteEscolhido] = useState(operacao?.cliente_id ?? '');
  const [faturamento, setFaturamento] = useState(
    () => operacao?.faturamento_anual || doClienteDe(operacao?.cliente_id) || '',
  );
  const veioDoCliente = !operacao?.faturamento_anual && Boolean(faturamento) && faturamento === doClienteDe(clienteEscolhido);

  const { pulsar } = pulso;
  useEffect(() => {
    if (operacao && !operacao.faturamento_anual && faturamento) pulsar();
    // Só na abertura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nova = !operacao;
  const temCliente = Boolean(operacao?.cliente_id);
  const nomeCliente = operacao?.cliente_id
    ? clientes.find((c) => c.id === operacao.cliente_id)?.nome_razao ?? null
    : null;

  const clientesOrdenados = useMemo(() => ordenarPtBr(clientes, (c) => c.nome_razao), [clientes]);
  const fundosOrdenados = useMemo(() => ordenarPtBr(fornecedores, (f) => f.nome_fundo), [fornecedores]);
  const tiposOrdenados = useMemo(() => ordenarPtBr(tipos, (t) => t.rotulo), [tipos]);

  const { sujo, valores } = useFicha(
    FORMA,
    (d) => ({
      identificador: String(d.get('identificador') ?? ''),
      status: String(d.get('status_operacao_id') ?? ''),
      demanda: String(d.get('demanda_inicial') ?? ''),
      prazo: String(d.get('prazo') ?? ''),
      declinios: d.getAll('declinios').length,
    }),
    {
      identificador: operacao?.identificador ?? '',
      status: operacao?.status_operacao_id ? String(operacao.status_operacao_id) : '',
      demanda: operacao?.demanda_inicial ?? '',
      prazo: operacao?.prazo ?? '',
      declinios: declinios.length,
    },
  );
  useAtalhosDaFicha(FORMA, aberto);

  const status = statusOperacao.find((s) => String(s.id) === valores.status);
  const nomeDoCliente = nomeCliente ?? (clienteEscolhido ? clientes.find((c) => c.id === clienteEscolhido)?.nome_razao : null);
  const contexto = [nomeDoCliente, valores.identificador.trim()].filter(Boolean).join(' · ');

  const secoes: DefinicaoSecao[] = [
    { id: 'ui2-op-operacao', titulo: 'Operação' },
    { id: 'ui2-op-credito', titulo: 'Crédito' },
    { id: 'ui2-op-pareceres', titulo: 'Pareceres' },
    { id: 'ui2-op-contratos', titulo: 'Contratos' },
    { id: 'ui2-op-acompanhamento', titulo: 'Acompanhamento' },
    ...(operacao ? [{ id: 'ui2-op-fundos', titulo: 'Fundos' }] : []),
  ];

  return (
    <>
      <Dialogo
        aberto={aberto}
        aoFechar={aoFechar}
        titulo={nova ? 'Nova Operação' : 'Editar operação'}
        largura="lg"
        className="ui2-dialogo ui2-dialogo--operacao dialogo-operacao"
        cabecalho={
          <CabecaDaFicha
            icone={<IconeOperacao tamanho={22} />}
            tituloId="ui2-operacao-titulo"
            titulo={nova ? 'Nova Operação' : 'Editar operação'}
            contexto={contexto || undefined}
            status={status ? { rotulo: status.rotulo, token: tokenDoStatus(status.chave) } : null}
            faixa={[
              { rotulo: 'Demanda', valor: valores.demanda },
              { rotulo: 'Prazo', valor: valores.prazo },
              { rotulo: 'Faturamento anual', valor: faturamento },
            ]}
            contadores={
              operacao
                ? [
                    `${etapas.length} ${etapas.length === 1 ? 'fundo' : 'fundos'}`,
                    `${valores.declinios} ${valores.declinios === 1 ? 'declínio' : 'declínios'}`,
                  ]
                : undefined
            }
          />
        }
        rodape={
          <>
            <EstadoDoRodape sujo={sujo} />
            {/* Fora da <form>: o `form=` leva o interruptor no envio. */}
            <Interruptor
              nome="estruturacao_em_andamento"
              rotulo="Estruturação em Andamento"
              inicial={operacao?.estruturacao_em_andamento}
              form={FORMA}
              className="rodape-toggle"
            />
            {operacao && temCliente ? (
              <Botao variante="secondary" onClick={() => setEmailAberto(true)}>
                Enviar Email
              </Botao>
            ) : null}
            <Botao variante="primary" type="submit" form={FORMA} title={DICA_SALVAR}>
              {nova ? 'Cadastrar' : 'Salvar'}
            </Botao>
          </>
        }
      >
        <IndiceDaFicha secoes={secoes} />

        <form id={FORMA} ref={salvar.ref} onSubmit={salvar.aoEnviar} className="ui2-forma">
          <input type="hidden" name="id" value={operacao?.id ?? ''} />

          <Secao id="ui2-op-operacao" ordem={0} icone={<IconeOperacao tamanho={16} />} titulo="Operação">
            {nova ? (
              <SeletorPopup
                className="ui2-c6"
                rotulo="Escolher cliente:"
                nome="cliente_id"
                opcoes={clientesOrdenados.map((c) => ({ valor: c.id, rotulo: c.nome_razao }))}
                aoEscolher={(id) => {
                  setClienteEscolhido(id);
                  // O faturamento do cadastro do cliente já vem para a operação
                  // (pedido de 08/10/2026) — e continua editável.
                  const doCliente = doClienteDe(id);
                  if (doCliente) {
                    setFaturamento(doCliente);
                    pulsar();
                  }
                }}
              />
            ) : (
              <>
                <input type="hidden" name="cliente_id" value={operacao?.cliente_id ?? ''} />
                <Campo
                  id="operacao-cliente"
                  className="ui2-c6 ui2-campo--leitura"
                  rotulo="Cliente"
                  somenteLeitura
                  valorInicial={nomeCliente ?? 'Sem cliente'}
                />
              </>
            )}
            <Campo className="ui2-c6" rotulo="Identificador" nome="identificador" valorInicial={operacao?.identificador ?? ''} placeholder="Digite aqui" />

            <div className={['ui2-c6', pulso.classe].filter(Boolean).join(' ')}>
              <Campo rotulo="Faturamento anual" nome="faturamento_anual" valor={faturamento} aoMudar={setFaturamento} placeholder="Digite aqui" />
              {veioDoCliente ? <p className="ui2-campo__nota">Do cadastro do cliente</p> : null}
            </div>
            <SeletorPopup
              className="ui2-c6"
              rotulo="Status Atual da Operação"
              nome="status_operacao_id"
              valorInicial={operacao?.status_operacao_id ? String(operacao.status_operacao_id) : ''}
              opcoes={statusOperacao.map((s) => ({
                valor: String(s.id),
                rotulo: s.rotulo,
                cor: `var(--${tokenDoStatus(s.chave)})`,
              }))}
            />
          </Secao>

          <Secao id="ui2-op-credito" ordem={1} icone={<IconeMoeda tamanho={16} />} titulo="Crédito">
            <Campo className="ui2-c6" rotulo={<Rotulo icone={<IconeMoeda tamanho={14} />}>Demanda</Rotulo>} nome="demanda_inicial" valorInicial={operacao?.demanda_inicial ?? ''} placeholder="Digite aqui" />
            <Campo className="ui2-c6" rotulo={<Rotulo icone={<IconeRelogio tamanho={14} />}>Prazo</Rotulo>} nome="prazo" valorInicial={operacao?.prazo ?? ''} placeholder="Digite aqui" />
            <Campo className="ui2-c6" rotulo={<Rotulo icone={<IconeEscudo tamanho={14} />}>Garantias sugeridas</Rotulo>} nome="garantias_sugeridas" valorInicial={operacao?.garantias_sugeridas ?? ''} placeholder="Digite aqui" />
            <Campo className="ui2-c6" rotulo={<Rotulo icone={<IconeRelogio tamanho={14} />}>Carência</Rotulo>} nome="carencia" valorInicial={operacao?.carencia ?? ''} placeholder="Digite aqui" />
            <Campo className="ui2-c12" rotulo={<Rotulo icone={<IconeAlvo tamanho={14} />}>Destino do recurso</Rotulo>} nome="destino_recurso" valorInicial={operacao?.destino_recurso ?? ''} placeholder="Digite aqui" />
          </Secao>

          <Secao id="ui2-op-pareceres" ordem={2} icone={<IconeNota tamanho={16} />} titulo="Pareceres">
            {temCliente ? (
              <Campo
                className="ui2-c6 ui2-campo-texto"
                rotulo="Parecer do cliente"
                nome="parecer_cliente"
                multilinha
                linhas={10}
                valorInicial={parecerCliente ?? ''}
                placeholder="Digite aqui"
              />
            ) : null}
            <Campo
              className={temCliente ? 'ui2-c6 ui2-campo-texto' : 'ui2-c12 ui2-campo-texto'}
              rotulo="Parecer da operação"
              nome="parecer"
              multilinha
              linhas={10}
              valorInicial={operacao?.parecer ?? ''}
              placeholder="Digite aqui"
            />
          </Secao>

          <Secao id="ui2-op-contratos" ordem={3} icone={<IconeAssinatura tamanho={16} />} titulo="Contratos">
            <div className="ui2-c12 ui2-interruptores">
              <PilulaInterruptor nome="tem_fee" rotulo="Com fee" inicial={operacao?.tem_fee} />
              <PilulaInterruptor nome="nda_assinado" rotulo="NDA assinado com o Cliente" inicial={operacao?.nda_assinado} />
              <PilulaInterruptor nome="mandato_assinado" rotulo="Mandato assinado pelo cliente" inicial={operacao?.mandato_assinado} />
              <PilulaInterruptor
                nome="mandato_assinado_fornecedor"
                rotulo="Mandato assinado com o fundo"
                inicial={operacao?.mandato_assinado_fornecedor}
              />
            </div>
          </Secao>

          <Secao id="ui2-op-acompanhamento" ordem={4} icone={<IconeLista tamanho={16} />} titulo="Acompanhamento">
            {temCliente && operacao ? (
              <div className="ui2-c12">
                <BlocoObservacoes operacaoId={operacao.id} observacoes={observacoes} />
              </div>
            ) : null}
            <Declinios fornecedores={fundosOrdenados} escolhidos={declinios} />
            <Campo className="ui2-c12" rotulo="Limites/fundos assinados" nome="limites_fundos_assinados" valorInicial={operacao?.limites_fundos_assinados ?? ''} placeholder="Digite aqui" />
          </Secao>
        </form>

        {/* Fora da <form>, como na clássica: a tabela grava etapa por etapa. */}
        {operacao ? (
          <Secao
            id="ui2-op-fundos"
            ordem={5}
            icone={<IconeFornecedor tamanho={16} />}
            titulo="Fundos"
            depoisDaGrade={
              <div className="ui2-etapas">
                <TabelaDeEtapas
                  operacaoId={operacao.id}
                  etapas={etapas}
                  fornecedores={fundosOrdenados}
                  tipos={tiposOrdenados}
                  statusEtapa={statusEtapa}
                />
              </div>
            }
          />
        ) : null}
      </Dialogo>

      {emailAberto && operacao ? (
        <PrintsParaEmail
          observacoes={observacoes}
          etapas={etapas}
          fornecedores={fornecedores}
          tipos={tipos}
          statusEtapa={statusEtapa}
        />
      ) : null}
      {emailAberto && operacao ? (
        <DialogoEmail
          operacaoId={operacao.id}
          cliente={nomeCliente}
          identificador={operacao.identificador ?? null}
          statusOperacao={statusOperacao.find((s) => s.id === operacao.status_operacao_id)?.rotulo ?? ''}
          contexto={[nomeCliente, operacao.identificador].filter(Boolean).join(' · ') || undefined}
          aoFechar={() => setEmailAberto(false)}
        />
      ) : null}
    </>
  );
}
