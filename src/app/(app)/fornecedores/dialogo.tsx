'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { Botao, Campo } from '@/components/ui/base';
import { SeletorMultiploPopup, SeletorPopup } from '@/components/ui/seletor-popup';
import { Dialogo } from '@/components/ui/dialogo';
import { STATUS_FORNECEDOR, type Fornecedor, type TabelaApoio } from '@/lib/dominio';
import { gravarFornecedor } from './acoes';
import type { VinculoTipo } from './page';

/**
 * Diálogo de fornecedor. Ordem de produção — design/design-system/20-dialogos.md.
 *
 * O nome do fundo é o título editável no topo do corpo, não um campo comum.
 * A régua separa os dados cadastrais dos quatro seletores de tipo de operação.
 */
export function DialogoFornecedor({
  aberto,
  fornecedor,
  tipos,
  vinculos,
  aoFechar,
}: {
  aberto: boolean;
  fornecedor: Fornecedor | null;
  tipos: TabelaApoio[];
  vinculos: VinculoTipo[];
  aoFechar: () => void;
}) {
  const [estado, agir, gravando] = useActionState(gravarFornecedor, null as { erro?: string; ok?: boolean } | null);

  const inicial = (papel: VinculoTipo['papel']) =>
    vinculos.filter((v) => v.papel === papel).map((v) => String(v.tipo_operacao_id));

  const [naoAtendidas, setNaoAtendidas] = useState<string[]>(inicial('nao_atende'));

  useEffect(() => {
    setNaoAtendidas(vinculos.filter((v) => v.papel === 'nao_atende').map((v) => String(v.tipo_operacao_id)));
  }, [vinculos]);

  useEffect(() => {
    if (estado?.ok) aoFechar();
  }, [estado, aoFechar]);

  // 1ª e 2ª Linha só oferecem tipos que não estão em "não atendidas".
  const disponiveis = useMemo(
    () => tipos.filter((t) => !naoAtendidas.includes(String(t.id))),
    [tipos, naoAtendidas],
  );

  const editando = Boolean(fornecedor?.nome_fundo);

  return (
    <Dialogo
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={editando ? 'Editar fundo' : 'Novo fundo'}
      largura="md"
      rodape={
        <Botao variante="primary" type="submit" form="forma-fornecedor" disabled={gravando}>
          {editando ? 'Salvar' : 'Cadastrar'}
        </Botao>
      }
    >
      <form id="forma-fornecedor" action={agir} className="grade">
        <input type="hidden" name="id" value={fornecedor?.id ?? ''} />

        {/* 1 — o nome do fundo é o título editável do corpo */}
        <div className="grade__inteiro">
          <input
            name="nome_fundo"
            defaultValue={fornecedor?.nome_fundo ?? ''}
            placeholder="Digite aqui"
            aria-label="Nome do fundo"
            className="titulo-editavel"
          />
        </div>

        {/* 2 */}
        <Campo className="grade__inteiro" rotulo="Cidade" nome="cidade" valorInicial={fornecedor?.cidade ?? ''} placeholder="Digite aqui" />

        {/* 3 */}
        <Campo rotulo="Número" nome="numero" valorInicial={fornecedor?.numero ?? ''} placeholder="Digite aqui" />
        <Campo rotulo="Email" nome="email" tipo="email" valorInicial={fornecedor?.email ?? ''} placeholder="Digite aqui" />

        {/* 4 */}
        <Campo rotulo="Contato" nome="contato" valorInicial={fornecedor?.contato ?? ''} placeholder="Digite aqui" />
        <Campo rotulo="PF ou PJ" nome="pf_ou_pj" valorInicial={fornecedor?.pf_ou_pj ?? ''} placeholder="Digite aqui" />

        {/* 5 */}
        <Campo className="grade__inteiro" rotulo="Fee" nome="fee" valorInicial={fornecedor?.fee ?? ''} placeholder="Digite aqui" />

        {/* 6 */}
        <Campo className="grade__inteiro campo-alto" rotulo="Parecer" nome="parecer" multilinha linhas={9} valorInicial={fornecedor?.parecer ?? ''} placeholder="Digite aqui" />

        {/* 7 */}
        <SeletorPopup
          rotulo="Status"
          nome="status"
          placeholder="Escolha uma opção"
          valorInicial={fornecedor?.status ?? ''}
          opcoes={STATUS_FORNECEDOR.map((s) => ({ valor: s, rotulo: s }))}
        />
        <Campo rotulo="Link de Indicação" nome="link_indicacao" valorInicial={fornecedor?.link_indicacao ?? ''} placeholder="Link" />

        <hr className="grade__regua" />

        {/* 8 */}
        <SeletorMultiploPopup
          className="grade__inteiro"
          rotulo="Tipos de operações"
          nome="tipos_operacoes"
          inicial={inicial('atende')}
          opcoes={tipos.map((t) => ({ valor: String(t.id), rotulo: t.rotulo }))}
        />

        {/* 9 — só o que não está em "não atendidas" */}
        <SeletorMultiploPopup
          rotulo="1º Linha"
          nome="linha_1"
          inicial={inicial('linha_1')}
          opcoes={disponiveis.map((t) => ({ valor: String(t.id), rotulo: t.rotulo }))}
        />
        <SeletorMultiploPopup
          rotulo="2º Linha"
          nome="linha_2"
          inicial={inicial('linha_2')}
          opcoes={disponiveis.map((t) => ({ valor: String(t.id), rotulo: t.rotulo }))}
        />

        {/* 10 — tags em vermelho, como no original */}
        {/* Fichas em vermelho, como no original. */}
        <SeletorMultiploPopup
          className="grade__inteiro"
          negativo
          rotulo="Tipos de operações não atendidas"
          nome="nao_atendidas"
          inicial={naoAtendidas}
          aoMudar={setNaoAtendidas}
          opcoes={tipos.map((t) => ({ valor: String(t.id), rotulo: t.rotulo }))}
        />

        {/* 11 */}
        <Campo rotulo="Faturamento mínimo" nome="faturamento_minimo" valorInicial={fornecedor?.faturamento_minimo ?? ''} placeholder="Digite aqui" />
        <Campo rotulo="Operação mínima" nome="operacao_minima" valorInicial={fornecedor?.operacao_minima ?? ''} placeholder="Digite aqui" />

        {/* 12 */}
        <Campo rotulo="Segmento foco" nome="segmento_foco" valorInicial={fornecedor?.segmento_foco ?? ''} placeholder="Digite aqui" />
        <Campo rotulo="Segmento que não atua" nome="segmento_nao_atua" valorInicial={fornecedor?.segmento_nao_atua ?? ''} placeholder="Digite aqui" />

        {estado?.erro ? (
          <p className="lc-field__msg grade__inteiro" role="alert">
            {estado.erro}
          </p>
        ) : null}
      </form>
    </Dialogo>
  );
}
