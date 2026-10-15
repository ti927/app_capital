'use client';

import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { Botao, Campo } from '@/components/ui/base';
import { SeletorMultiploPopup, SeletorPopup } from '@/components/ui/seletor-popup';
import {
  IconeAlvo,
  IconeEmail,
  IconeFornecedor,
  IconeLink,
  IconeLocal,
  IconeNota,
  IconeProibido,
  IconeTag,
  IconeTelefone,
} from '@/components/ui/icones';
import { Dialogo, useSessaoDoDialogo } from '@/components/ui/dialogo';
import { useSalvarOtimista } from '@/components/ui/salvar-otimista';
import {
  CabecaDaFicha,
  DICA_SALVAR,
  EstadoDoRodape,
  Rotulo,
  Secao,
  useAtalhosDaFicha,
  useFicha,
} from '@/components/ui2/ficha';
import { STATUS_FORNECEDOR } from '@/lib/dominio';
import { gravarFornecedor } from './acoes';
import type { DialogoFornecedor } from './dialogo';
import type { VinculoTipo } from './page';

type Props = ComponentProps<typeof DialogoFornecedor>;

/**
 * Pop-up de fornecedor, UI moderna ("ficha" — design/ui2-popups.md, 2.2).
 * O nome do fundo é o título editável do cabeçalho, como já era no corpo da
 * clássica; fica fora da `<form>` e entra no envio pelo `form=`.
 *
 * Contrato com a clássica (`dialogo.tsx`): mesma ordem (`campos.ts`), mesmos
 * `name=`, mesma action, mesmo salvar otimista e mesmas mensagens.
 */
export function DialogoFornecedorModerno(props: Props) {
  const sessao = useSessaoDoDialogo(props.aberto);
  return <CorpoDialogoFornecedorModerno key={sessao} {...props} />;
}

const FORMA = 'forma-fornecedor';

function CorpoDialogoFornecedorModerno({ aberto, fornecedor, tipos, vinculos, aoFechar }: Props) {
  const inicial = (papel: VinculoTipo['papel']) =>
    vinculos.filter((v) => v.papel === papel).map((v) => String(v.tipo_operacao_id));

  const [naoAtendidas, setNaoAtendidas] = useState<string[]>(inicial('nao_atende'));

  useEffect(() => {
    setNaoAtendidas(vinculos.filter((v) => v.papel === 'nao_atende').map((v) => String(v.tipo_operacao_id)));
  }, [vinculos]);

  const editando = Boolean(fornecedor?.nome_fundo);
  const salvar = useSalvarOtimista(gravarFornecedor, {
    existente: Boolean(fornecedor?.id),
    id: fornecedor?.id,
    mensagem: editando ? 'Fundo salvo' : 'Fundo cadastrado',
    oQue: 'o fundo',
    aoFechar,
    validar: (d) => (String(d.get('nome_fundo') ?? '').trim() ? null : 'O nome do fundo é obrigatório.'),
  });

  // 1ª e 2ª Linha só oferecem tipos que não estão em "não atendidas".
  const disponiveis = useMemo(
    () => tipos.filter((t) => !naoAtendidas.includes(String(t.id))),
    [tipos, naoAtendidas],
  );

  const { sujo, valores } = useFicha(
    FORMA,
    (d) => ({
      fee: String(d.get('fee') ?? ''),
      operacaoMinima: String(d.get('operacao_minima') ?? ''),
      faturamentoMinimo: String(d.get('faturamento_minimo') ?? ''),
      status: String(d.get('status') ?? ''),
      link: String(d.get('link_indicacao') ?? '').trim(),
    }),
    {
      fee: fornecedor?.fee ?? '',
      operacaoMinima: fornecedor?.operacao_minima ?? '',
      faturamentoMinimo: fornecedor?.faturamento_minimo ?? '',
      status: fornecedor?.status ?? '',
      link: fornecedor?.link_indicacao?.trim() ?? '',
    },
  );
  useAtalhosDaFicha(FORMA, aberto);

  const linkSeguro = /^https?:\/\//i.test(valores.link) ? valores.link : valores.link ? `https://${valores.link}` : '';

  return (
    <Dialogo
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={editando ? 'Editar fundo' : 'Novo fundo'}
      largura="tela"
      className="ui2-dialogo"
      cabecalho={
        <CabecaDaFicha
          icone={<IconeFornecedor tamanho={22} />}
          tituloId="ui2-fornecedor-titulo"
          titulo={
            <input
              name="nome_fundo"
              form={FORMA}
              defaultValue={fornecedor?.nome_fundo ?? ''}
              placeholder="Nome do fundo"
              aria-label="Nome do fundo"
              className="ui2-cabeca__titulo-editavel"
            />
          }
          contexto={editando ? 'Editar fundo' : 'Novo fundo'}
          status={valores.status ? { rotulo: valores.status, token: 'st-etapa-inicio' } : null}
          faixa={[
            { rotulo: 'Fee', valor: valores.fee },
            { rotulo: 'Operação mínima', valor: valores.operacaoMinima },
            { rotulo: 'Faturamento mínimo', valor: valores.faturamentoMinimo },
          ]}
        />
      }
      rodape={
        <>
          <EstadoDoRodape sujo={sujo} />
          <Botao variante="primary" type="submit" form={FORMA} title={DICA_SALVAR}>
            {editando ? 'Salvar' : 'Cadastrar'}
          </Botao>
        </>
      }
    >
      <form id={FORMA} ref={salvar.ref} onSubmit={salvar.aoEnviar} className="ui2-forma">
        <input type="hidden" name="id" value={fornecedor?.id ?? ''} />

        <Secao id="ui2-fornecedor-cadastro" ordem={0} icone={<IconeFornecedor tamanho={16} />} titulo="Cadastro">
          <Campo className="ui2-c4" rotulo={<Rotulo icone={<IconeLocal tamanho={14} />}>Cidade</Rotulo>} nome="cidade" valorInicial={fornecedor?.cidade ?? ''} placeholder="Digite aqui" />
          <Campo className="ui2-c4" rotulo={<Rotulo icone={<IconeTelefone tamanho={14} />}>Número</Rotulo>} nome="numero" valorInicial={fornecedor?.numero ?? ''} placeholder="Digite aqui" />
          <Campo className="ui2-c4" rotulo={<Rotulo icone={<IconeEmail tamanho={14} />}>Email</Rotulo>} nome="email" tipo="email" valorInicial={fornecedor?.email ?? ''} placeholder="Digite aqui" />
          <Campo className="ui2-c6" rotulo="Contato" nome="contato" valorInicial={fornecedor?.contato ?? ''} placeholder="Digite aqui" />
          <Campo className="ui2-c3" rotulo="PF ou PJ" nome="pf_ou_pj" valorInicial={fornecedor?.pf_ou_pj ?? ''} placeholder="Digite aqui" />
          <Campo className="ui2-c3" rotulo="Fee" nome="fee" valorInicial={fornecedor?.fee ?? ''} placeholder="Digite aqui" />
        </Secao>

        <Secao id="ui2-fornecedor-parecer" ordem={1} icone={<IconeNota tamanho={16} />} titulo="Parecer">
          <Campo className="ui2-c12 ui2-campo-texto" rotulo="Parecer" nome="parecer" multilinha linhas={8} valorInicial={fornecedor?.parecer ?? ''} placeholder="Digite aqui" />
          <SeletorPopup
            className="ui2-c6"
            rotulo="Status"
            nome="status"
            placeholder="Escolha uma opção"
            valorInicial={fornecedor?.status ?? ''}
            opcoes={STATUS_FORNECEDOR.map((s) => ({ valor: s, rotulo: s }))}
          />
          <div className="ui2-c6 ui2-com-acao">
            <Campo rotulo={<Rotulo icone={<IconeLink tamanho={14} />}>Link de Indicação</Rotulo>} nome="link_indicacao" valorInicial={fornecedor?.link_indicacao ?? ''} placeholder="Link" />
            {linkSeguro ? (
              <a
                className="lc-btn lc-btn--secondary lc-btn--md ui2-com-acao__botao"
                href={linkSeguro}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir link em nova aba"
                aria-label="Abrir link de indicação em nova aba"
              >
                <IconeLink tamanho={15} />
              </a>
            ) : null}
          </div>
        </Secao>

        <Secao id="ui2-fornecedor-tipos" ordem={2} icone={<IconeTag tamanho={16} />} titulo="Tipos de operação">
          <SeletorMultiploPopup
            todas
            className="ui2-c12"
            rotulo="Tipos de operações"
            nome="tipos_operacoes"
            inicial={inicial('atende')}
            opcoes={tipos.map((t) => ({ valor: String(t.id), rotulo: t.rotulo }))}
          />
          <SeletorMultiploPopup
            todas
            className="ui2-c6"
            rotulo="1º Linha"
            nome="linha_1"
            inicial={inicial('linha_1')}
            opcoes={disponiveis.map((t) => ({ valor: String(t.id), rotulo: t.rotulo }))}
          />
          <SeletorMultiploPopup
            todas
            className="ui2-c6"
            rotulo="2º Linha"
            nome="linha_2"
            inicial={inicial('linha_2')}
            opcoes={disponiveis.map((t) => ({ valor: String(t.id), rotulo: t.rotulo }))}
          />
          <div className="ui2-c12 ui2-nao-atendidas">
            <span className="ui2-nao-atendidas__icone" aria-hidden="true">
              <IconeProibido tamanho={14} />
            </span>
            <SeletorMultiploPopup
              todas
              negativo
              rotulo="Tipos de operações não atendidas"
              nome="nao_atendidas"
              inicial={naoAtendidas}
              aoMudar={setNaoAtendidas}
              opcoes={tipos.map((t) => ({ valor: String(t.id), rotulo: t.rotulo }))}
            />
          </div>
        </Secao>

        <Secao id="ui2-fornecedor-criterios" ordem={3} icone={<IconeAlvo tamanho={16} />} titulo="Critérios">
          <Campo className="ui2-c3" rotulo="Faturamento mínimo" nome="faturamento_minimo" valorInicial={fornecedor?.faturamento_minimo ?? ''} placeholder="Digite aqui" />
          <Campo className="ui2-c3" rotulo="Operação mínima" nome="operacao_minima" valorInicial={fornecedor?.operacao_minima ?? ''} placeholder="Digite aqui" />
          <Campo className="ui2-c3" rotulo="Segmento foco" nome="segmento_foco" valorInicial={fornecedor?.segmento_foco ?? ''} placeholder="Digite aqui" />
          <Campo className="ui2-c3" rotulo="Segmento que não atua" nome="segmento_nao_atua" valorInicial={fornecedor?.segmento_nao_atua ?? ''} placeholder="Digite aqui" />
        </Secao>
      </form>
    </Dialogo>
  );
}
