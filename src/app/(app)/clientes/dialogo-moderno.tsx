'use client';

import { useEffect, useState, useTransition, type ComponentProps } from 'react';
import { Botao, Campo } from '@/components/ui/base';
import {
  IconeCliente,
  IconeEmail,
  IconeFechar,
  IconeFornecedor,
  IconeFunil,
  IconeLocal,
  IconeMais,
  IconeNota,
  IconeOlho,
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
  Segmentado,
  useAtalhosDaFicha,
  useFicha,
} from '@/components/ui2/ficha';
import { STATUS_CLIENTE } from '@/lib/dominio';
import { gravarCliente, removerEmail } from './acoes';
import { DialogoAdicionarEmail, DialogoCliente, PuxarDoFunil, QuemVisualiza } from './dialogo';
import type { CartaoDoFunil, EmailCliente } from './tela';

/**
 * Pop-up de cliente, UI moderna ("ficha" — design/ui2-popups.md, 2.1).
 *
 * Contrato com a clássica (`dialogo.tsx`): mesma ordem de campos
 * (`campos.ts`), mesmos `name=`, mesma action, mesmo salvar otimista e mesmas
 * mensagens. Só a casca muda.
 */
export function DialogoClienteModerno(props: ComponentProps<typeof DialogoCliente>) {
  const sessao = useSessaoDoDialogo(props.aberto);
  return <CorpoDialogoClienteModerno key={sessao} {...props} />;
}

const FORMA = 'forma-cliente';

function CorpoDialogoClienteModerno({
  aberto,
  cliente,
  emails,
  usuarios,
  visualizadores,
  podeEditarVisualizadores,
  cartoesDoFunil,
  aoFechar,
}: ComponentProps<typeof DialogoCliente>) {
  const [emailAberto, setEmailAberto] = useState(false);
  const [doFunil, setDoFunil] = useState<CartaoDoFunil | null>(null);

  useEffect(() => {
    if (!aberto) setDoFunil(null);
  }, [aberto]);

  const editando = Boolean(cliente?.nome_razao);

  const salvar = useSalvarOtimista(gravarCliente, {
    existente: Boolean(cliente?.id),
    id: cliente?.id,
    mensagem: editando ? 'Cliente salvo' : 'Cliente cadastrado',
    oQue: 'o cliente',
    aoFechar,
    validar: (d) => (String(d.get('nome_razao') ?? '').trim() ? null : 'O nome/razão social é obrigatório.'),
  });

  const cartao = cliente ? null : doFunil;
  const de = (doCartao: string | null | undefined, doCliente: string | null | undefined) =>
    doCartao ?? doCliente ?? '';

  // A faixa-chave espelha os campos ao vivo.
  const inicial = {
    nome: de(cartao?.empresa, cliente?.nome_razao),
    cnpj: cliente?.cnpj ?? '',
    faturamento: de(cartao?.faturamento, cliente?.faturamento_anual),
    demanda: cliente?.demanda ?? '',
    estimativa: cliente?.estimativa_faturamento ?? '',
    status: cliente?.status ?? '',
  };
  const { sujo, valores } = useFicha(
    FORMA,
    (d) => ({
      nome: String(d.get('nome_razao') ?? ''),
      cnpj: String(d.get('cnpj') ?? ''),
      faturamento: String(d.get('faturamento_anual') ?? ''),
      demanda: String(d.get('demanda') ?? ''),
      estimativa: String(d.get('estimativa_faturamento') ?? ''),
      status: String(d.get('status') ?? ''),
    }),
    inicial,
  );
  useAtalhosDaFicha(FORMA, aberto);

  return (
    <>
      <Dialogo
        aberto={aberto}
        aoFechar={aoFechar}
        titulo={editando ? cliente?.nome_razao : 'Novo cliente'}
        largura="tela"
        className="ui2-dialogo"
        cabecalho={
          <CabecaDaFicha
            icone={<IconeCliente tamanho={22} />}
            tituloId="ui2-cliente-titulo"
            titulo={valores.nome.trim() || (editando ? cliente?.nome_razao : 'Novo cliente')}
            contexto={valores.cnpj.trim() ? `CNPJ ${valores.cnpj.trim()}` : editando ? 'Cliente' : 'Novo cliente'}
            status={valores.status ? { rotulo: valores.status, token: 'st-etapa-inicio' } : null}
            faixa={[
              { rotulo: 'Faturamento anual', valor: valores.faturamento },
              { rotulo: 'Demanda', valor: valores.demanda },
              { rotulo: 'Estimativa de faturamento', valor: valores.estimativa },
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
        <form key={cartao?.id ?? 'vazio'} id={FORMA} ref={salvar.ref} onSubmit={salvar.aoEnviar} className="ui2-forma">
          <input type="hidden" name="id" value={cliente?.id ?? ''} />
          {cartao ? <input type="hidden" name="cartao_id" value={cartao.id} /> : null}

          {!cliente ? (
            <div className="ui2-puxar">
              <span className="ui2-puxar__icone" aria-hidden="true">
                <IconeFunil tamanho={16} />
              </span>
              <PuxarDoFunil cartoes={cartoesDoFunil} escolhido={cartao} aoEscolher={setDoFunil} />
            </div>
          ) : null}

          <Secao id="ui2-cliente-identificacao" ordem={0} icone={<IconeCliente tamanho={16} />} titulo="Identificação">
            <Campo className="ui2-c8" rotulo="Nome/razão social" nome="nome_razao" valorInicial={de(cartao?.empresa, cliente?.nome_razao)} placeholder="Digite aqui" />
            <Campo className="ui2-c4" rotulo="CNPJ" nome="cnpj" valorInicial={cliente?.cnpj ?? ''} placeholder="Digite aqui" />
          </Secao>

          <Secao id="ui2-cliente-contato" ordem={1} icone={<IconeEmail tamanho={16} />} titulo="Contato">
            <div className="ui2-c12 lc-field">
              <span className="lc-field__label">
                <Rotulo icone={<IconeEmail tamanho={14} />}>Email</Rotulo>
              </span>
              <ChipsDeEmail
                emails={emails}
                podeAdicionar={Boolean(cliente)}
                aoAdicionar={() => setEmailAberto(true)}
              />
            </div>
            <Campo className="ui2-c6" rotulo="Diretor/gerente" nome="diretor_gerente" valorInicial={de(cartao?.contato, cliente?.diretor_gerente)} placeholder="Digite aqui" />
            <Campo className="ui2-c3" rotulo={<Rotulo icone={<IconeLocal tamanho={14} />}>Cidade</Rotulo>} nome="cidade" valorInicial={cliente?.cidade ?? ''} placeholder="Digite aqui" />
            <Campo className="ui2-c3" rotulo={<Rotulo icone={<IconeTelefone tamanho={14} />}>Telefone</Rotulo>} nome="telefone" valorInicial={cliente?.telefone ?? ''} placeholder="Digite aqui" />
          </Secao>

          <Secao id="ui2-cliente-empresa" ordem={2} icone={<IconeFornecedor tamanho={16} />} titulo="Empresa">
            <Campo className="ui2-c12" rotulo="Atividade da CIA" nome="atividade_cia" valorInicial={de(cartao?.segmento, cliente?.atividade_cia)} placeholder="Digite aqui" />
            <Campo className="ui2-c3" rotulo="Faturamento anual" nome="faturamento_anual" valorInicial={de(cartao?.faturamento, cliente?.faturamento_anual)} placeholder="Digite aqui" />
            <Campo className="ui2-c3" rotulo="Margem líquida" nome="margem_liquida" valorInicial={cliente?.margem_liquida ?? ''} placeholder="Digite aqui" />
            <Campo className="ui2-c3" rotulo="Ativos" nome="ativos" valorInicial={cliente?.ativos ?? ''} placeholder="Digite aqui" />
            <Campo className="ui2-c3" rotulo="Passivo oneroso" nome="passivo_oneroso" valorInicial={cliente?.passivo_oneroso ?? ''} placeholder="Digite aqui" />
          </Secao>

          <Secao id="ui2-cliente-relacionamento" ordem={3} icone={<IconeOlho tamanho={16} />} titulo="Relacionamento">
            <Campo className="ui2-c5" rotulo="Quem indicou" nome="quem_indicou" valorInicial={de(cartao?.indicante, cliente?.quem_indicou)} placeholder="Digite aqui" />
            <div className="ui2-c7">
              <QuemVisualiza usuarios={usuarios} escolhidos={visualizadores} desabilitado={!podeEditarVisualizadores} />
            </div>
            <Campo className="ui2-c6" rotulo="Demanda" nome="demanda" valorInicial={cliente?.demanda ?? ''} placeholder="Digite aqui" />
            <Campo className="ui2-c6" rotulo="Estimativa de faturamento" nome="estimativa_faturamento" valorInicial={cliente?.estimativa_faturamento ?? ''} placeholder="Digite aqui" />
          </Secao>

          <Secao id="ui2-cliente-parecer" ordem={4} icone={<IconeNota tamanho={16} />} titulo="Parecer">
            <Campo className="ui2-c12 ui2-campo-texto" rotulo="Parecer" nome="parecer" multilinha linhas={10} valorInicial={de(cartao?.parecer, cliente?.parecer)} placeholder="Digite aqui" />
            <Segmentado
              className="ui2-c12"
              rotulo="Status cliente"
              nome="status"
              valorInicial={cliente?.status ?? ''}
              opcoes={[...STATUS_CLIENTE]}
            />
          </Secao>
        </form>
      </Dialogo>

      {cliente ? (
        <DialogoAdicionarEmail aberto={emailAberto} clienteId={cliente.id} aoFechar={() => setEmailAberto(false)} />
      ) : null}
    </>
  );
}

/** E-mails do cliente como fichas removíveis, com "Adicionar" no fim da fileira. */
function ChipsDeEmail({
  emails,
  podeAdicionar,
  aoAdicionar,
}: {
  emails: EmailCliente[];
  podeAdicionar: boolean;
  aoAdicionar: () => void;
}) {
  const [, transicao] = useTransition();
  return (
    <ul className="ui2-chips">
      {emails.map((e) => (
        <li key={e.id} className="ui2-chip">
          <span className="ui2-chip__texto">{e.email}</span>
          <button
            type="button"
            className="ui2-chip__remover"
            title="Remover e-mail"
            aria-label={`Remover ${e.email}`}
            onClick={() => transicao(() => void removerEmail(e.id))}
          >
            <IconeFechar tamanho={12} />
          </button>
        </li>
      ))}
      <li>
        <Botao
          variante="tertiary"
          tamanho="sm"
          onClick={aoAdicionar}
          disabled={!podeAdicionar}
          title={podeAdicionar ? 'Adicionar e-mail' : 'Cadastre o cliente primeiro'}
        >
          <IconeMais tamanho={14} /> Adicionar
        </Botao>
      </li>
    </ul>
  );
}
