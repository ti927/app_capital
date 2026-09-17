'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { Botao, Campo } from '@/components/ui/base';
import { SeletorMultiploPopup, SeletorPopup } from '@/components/ui/seletor-popup';
import { IconeFechar, IconeMais } from '@/components/ui/icones';
import { Dialogo } from '@/components/ui/dialogo';
import { STATUS_CLIENTE, type Cliente } from '@/lib/dominio';
import { adicionarEmail, gravarCliente, removerEmail } from './acoes';
import type { EmailCliente } from './tela';

/**
 * Diálogo de cliente — o mesmo para criar e para editar.
 *
 * Regra do design system: mostra todos os campos, sempre, na mesma ordem.
 * Nada esconde por estar vazio nem muda de lugar. O que muda entre criar e
 * editar é só o rótulo do botão: "Cadastrar" vira "Salvar" quando o nome já
 * está preenchido.
 *
 * A ordem dos campos é a de produção — design/design-system/20-dialogos.md.
 */
export function DialogoCliente({
  aberto,
  cliente,
  emails,
  usuarios,
  visualizadores,
  podeEditarVisualizadores,
  aoFechar,
}: {
  aberto: boolean;
  cliente: Cliente | null;
  emails: EmailCliente[];
  usuarios: Array<{ id: string; nome: string }>;
  visualizadores: string[];
  podeEditarVisualizadores: boolean;
  aoFechar: () => void;
}) {
  const [estado, agir, gravando] = useActionState(gravarCliente, null as { erro?: string; ok?: boolean } | null);
  const [emailAberto, setEmailAberto] = useState(false);

  useEffect(() => {
    if (estado?.ok) aoFechar();
  }, [estado, aoFechar]);

  const editando = Boolean(cliente?.nome_razao);

  return (
    <>
      <Dialogo
        aberto={aberto}
        aoFechar={aoFechar}
        titulo={editando ? cliente?.nome_razao : 'Novo cliente'}
        largura="md"
        rodape={
          <Botao variante="primary" type="submit" form="forma-cliente" disabled={gravando}>
            {editando ? 'Salvar' : 'Cadastrar'}
          </Botao>
        }
      >
        <form id="forma-cliente" action={agir} className="grade">
          <input type="hidden" name="id" value={cliente?.id ?? ''} />

          {/* 1 */}
          <Campo rotulo="Nome/razão social" nome="nome_razao" valorInicial={cliente?.nome_razao ?? ''} placeholder="Digite aqui" />
          <Campo rotulo="CNPJ" nome="cnpj" valorInicial={cliente?.cnpj ?? ''} placeholder="Digite aqui" />

          {/* 2 — e-mails: a lista some quando vazia, como no original */}
          <div className="grade__inteiro">
            <div className="linha" style={{ justifyContent: 'space-between' }}>
              <span className="lc-field__label">Email</span>
              <Botao
                variante="tertiary"
                tamanho="sm"
                onClick={() => setEmailAberto(true)}
                disabled={!cliente}
                title={cliente ? 'Adicionar e-mail' : 'Cadastre o cliente primeiro'}
              >
                <IconeMais tamanho={14} /> Adicionar
              </Botao>
            </div>
            {emails.length > 0 ? <ListaDeEmails emails={emails} /> : null}
          </div>

          {/* 3 */}
          <Campo className="grade__inteiro" rotulo="Diretor/gerente" nome="diretor_gerente" valorInicial={cliente?.diretor_gerente ?? ''} placeholder="Digite aqui" />

          {/* 4 */}
          <Campo rotulo="Cidade" nome="cidade" valorInicial={cliente?.cidade ?? ''} placeholder="Digite aqui" />
          <Campo rotulo="Telefone" nome="telefone" valorInicial={cliente?.telefone ?? ''} placeholder="Digite aqui" />

          {/* 5 */}
          <Campo className="grade__inteiro" rotulo="Atividade da CIA" nome="atividade_cia" valorInicial={cliente?.atividade_cia ?? ''} placeholder="Digite aqui" />

          {/* 6 — texto livre: o banco guarda "R$ 2MM", "2.000.000", "dois milhões" */}
          <Campo rotulo="Faturamento anual" nome="faturamento_anual" valorInicial={cliente?.faturamento_anual ?? ''} placeholder="Digite aqui" />
          <Campo rotulo="Margem líquida" nome="margem_liquida" valorInicial={cliente?.margem_liquida ?? ''} placeholder="Digite aqui" />

          {/* 7 */}
          <Campo rotulo="Ativos" nome="ativos" valorInicial={cliente?.ativos ?? ''} placeholder="Digite aqui" />
          <Campo rotulo="Passivo oneroso" nome="passivo_oneroso" valorInicial={cliente?.passivo_oneroso ?? ''} placeholder="Digite aqui" />

          {/* 8 */}
          <Campo rotulo="Quem indicou" nome="quem_indicou" valorInicial={cliente?.quem_indicou ?? ''} placeholder="Digite aqui" />
          <QuemVisualiza
            usuarios={usuarios}
            escolhidos={visualizadores}
            desabilitado={!podeEditarVisualizadores || !cliente}
          />

          {/* 9 */}
          <Campo rotulo="Demanda" nome="demanda" valorInicial={cliente?.demanda ?? ''} placeholder="Digite aqui" />
          <Campo rotulo="Estimativa de faturamento" nome="estimativa_faturamento" valorInicial={cliente?.estimativa_faturamento ?? ''} placeholder="Digite aqui" />

          {/* 10 */}
          <Campo className="grade__inteiro" rotulo="Parecer" nome="parecer" multilinha linhas={6} valorInicial={cliente?.parecer ?? ''} placeholder="Digite aqui" />

          {/* 11 */}
          <SeletorPopup
            className="grade__inteiro"
            rotulo="Status cliente"
            nome="status"
            valorInicial={cliente?.status ?? ''}
            opcoes={STATUS_CLIENTE.map((s) => ({ valor: s, rotulo: s }))}
          />

          {estado?.erro ? (
            <p className="lc-field__msg grade__inteiro" role="alert">
              {estado.erro}
            </p>
          ) : null}
        </form>
      </Dialogo>

      {cliente ? (
        <DialogoAdicionarEmail
          aberto={emailAberto}
          clienteId={cliente.id}
          aoFechar={() => setEmailAberto(false)}
        />
      ) : null}
    </>
  );
}

function ListaDeEmails({ emails }: { emails: EmailCliente[] }) {
  const [, transicao] = useTransition();
  return (
    <ul className="lista" style={{ marginTop: 'var(--space-3)' }}>
      {emails.map((e) => (
        <li key={e.id} className="lista__item" style={{ minHeight: 'var(--row-h-compact)' }}>
          <span className="lista__texto">{e.email}</span>
          <Botao
            variante="tertiary"
            tamanho="row"
            title="Remover e-mail"
            aria-label={`Remover ${e.email}`}
            onClick={() => transicao(() => void removerEmail(e.id))}
          >
            <IconeFechar tamanho={14} />
          </Botao>
        </li>
      ))}
    </ul>
  );
}

function QuemVisualiza({
  usuarios,
  escolhidos,
  desabilitado,
}: {
  usuarios: Array<{ id: string; nome: string }>;
  escolhidos: string[];
  desabilitado: boolean;
}) {
  return (
    <SeletorMultiploPopup
      rotulo="Quem visualiza:"
      nome="quem_visualiza"
      placeholder="Escolha aqui"
      desabilitado={desabilitado}
      inicial={escolhidos}
      opcoes={usuarios.map((u) => ({ valor: u.id, rotulo: u.nome }))}
    />
  );
}

function DialogoAdicionarEmail({
  aberto,
  clienteId,
  aoFechar,
}: {
  aberto: boolean;
  clienteId: string;
  aoFechar: () => void;
}) {
  const [email, setEmail] = useState('');
  const [, transicao] = useTransition();

  return (
    <Dialogo
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Adicionar Email"
      largura="sm"
      rodape={
        <>
          <Botao variante="secondary" onClick={aoFechar}>
            Fechar
          </Botao>
          <Botao
            variante="primary"
            onClick={() => {
              transicao(() => void adicionarEmail(clienteId, email));
              setEmail('');
              aoFechar();
            }}
          >
            Salvar
          </Botao>
        </>
      }
    >
      <Campo rotulo="Email" tipo="email" valor={email} aoMudar={setEmail} placeholder="contato@empresa.com.br" />
    </Dialogo>
  );
}
