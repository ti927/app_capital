'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Botao } from '@/components/ui/base';
import { Dialogo } from '@/components/ui/dialogo';
import { criarClienteDoCartao, vincularCartaoACliente } from './acoes';
import type { CartaoDoFunil } from './page';

/** O de-para que a confirmação mostra: exatamente os seis campos do pedido. */
const DE_PARA: Array<{ de: keyof CartaoDoFunil; rotuloDe: string; para: string }> = [
  { de: 'empresa', rotuloDe: 'Empresa', para: 'Nome/razão social' },
  { de: 'contato', rotuloDe: 'Nome do contato', para: 'Diretor/gerente' },
  { de: 'faturamento', rotuloDe: 'Faturamento anual', para: 'Faturamento anual' },
  { de: 'segmento', rotuloDe: 'Segmento / atividade', para: 'Atividade da CIA' },
  { de: 'parecer', rotuloDe: 'Parecer', para: 'Parecer' },
  { de: 'indicante', rotuloDe: 'Indicante', para: 'Quem indicou' },
];

type Duplicado = { id: string; nome: string };

/**
 * "Cadastrar como cliente" — o caminho (a) do pedido.
 *
 * Mostra o de-para antes de criar: o usuário vê o que vai para onde em vez de
 * apertar um botão e descobrir depois. Quando o cartão já virou cliente, o
 * mesmo diálogo vira "Ver cliente".
 *
 * Nome repetido não cria em silêncio: avisa, e deixa escolher entre usar o
 * cliente que já existe ou criar assim mesmo (duas empresas podem ter o mesmo
 * nome; quem decide é quem conhece a carteira).
 */
export function DialogoVirarCliente({
  cartao,
  clientes,
  aoFechar,
}: {
  cartao: CartaoDoFunil | null;
  clientes: Array<{ id: string; nome_razao: string }>;
  aoFechar: () => void;
}) {
  const router = useRouter();
  const [duplicado, setDuplicado] = useState<Duplicado | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [emCurso, transicao] = useTransition();

  // Cada abertura começa limpa: o aviso do cartão anterior não segue para o próximo.
  useEffect(() => {
    setDuplicado(null);
    setErro(null);
  }, [cartao?.id]);

  if (!cartao) return null;

  const jaCliente = cartao.cliente_id
    ? (clientes.find((c) => c.id === cartao.cliente_id)?.nome_razao ?? 'cliente cadastrado')
    : null;

  const irParaClientes = () => {
    aoFechar();
    router.push('/clientes');
  };

  const responder = (r: Awaited<ReturnType<typeof criarClienteDoCartao>>) => {
    if ('duplicado' in r && r.duplicado) {
      setDuplicado(r.duplicado);
      return;
    }
    if ('erro' in r && r.erro) {
      setErro(r.erro);
      return;
    }
    aoFechar();
  };

  const criar = (forcar: boolean) =>
    transicao(async () => {
      setErro(null);
      responder(await criarClienteDoCartao(cartao.id, forcar));
    });

  const vincular = (clienteId: string) =>
    transicao(async () => {
      await vincularCartaoACliente(cartao.id, clienteId);
      aoFechar();
    });

  /* ------------------------------------------- o cartão já virou cliente -- */

  if (cartao.cliente_id) {
    return (
      <Dialogo
        aberto
        aoFechar={aoFechar}
        titulo="Este cartão já é cliente"
        contexto={cartao.empresa || 'Cartão em branco'}
        largura="sm"
        rodape={
          <>
            <Botao variante="secondary" onClick={aoFechar}>
              Fechar
            </Botao>
            <Botao variante="primary" onClick={irParaClientes}>
              Ver cliente
            </Botao>
          </>
        }
      >
        <p>
          O cartão está ligado ao cliente <strong>{jaCliente}</strong>. Editar o cadastro é na tela
          de clientes — o cartão não é mais a fonte.
        </p>
      </Dialogo>
    );
  }

  /* ----------------------------------------------------- criar o cliente -- */

  return (
    <Dialogo
      aberto
      aoFechar={aoFechar}
      titulo="Cadastrar como cliente"
      contexto={cartao.empresa || 'Cartão em branco'}
      largura="sm"
      rodape={
        duplicado ? (
          <>
            <Botao variante="secondary" onClick={aoFechar} disabled={emCurso}>
              Cancelar
            </Botao>
            <Botao variante="secondary" onClick={() => criar(true)} disabled={emCurso}>
              Criar mesmo assim
            </Botao>
            <Botao variante="primary" onClick={() => vincular(duplicado.id)} disabled={emCurso}>
              Usar o que já existe
            </Botao>
          </>
        ) : (
          <>
            <Botao variante="secondary" onClick={aoFechar} disabled={emCurso}>
              Cancelar
            </Botao>
            <Botao
              variante="primary"
              onClick={() => criar(false)}
              disabled={emCurso || !cartao.empresa.trim()}
              title={cartao.empresa.trim() ? undefined : 'O cartão precisa ter empresa'}
            >
              {emCurso ? 'Cadastrando…' : 'Cadastrar cliente'}
            </Botao>
          </>
        )
      }
    >
      {duplicado ? (
        <div className="lc-notice lc-notice--neutral" style={{ background: 'var(--warning-bg)' }}>
          <p className="lc-notice__title">Já existe um cliente com esse nome</p>
          <div className="lc-notice__body">
            <strong>{duplicado.nome}</strong> já está cadastrado. Ligue o cartão a ele, ou crie um
            segundo cadastro se forem empresas diferentes com o mesmo nome.
          </div>
        </div>
      ) : (
        <p className="apoio">
          O cliente nasce com estes seis campos. O cartão continua no funil, agora ligado ao
          cadastro.
        </p>
      )}

      <ul className="lista de-para" style={{ marginTop: 'var(--space-4)' }}>
        {DE_PARA.map(({ de, rotuloDe, para }) => {
          const valor = (cartao[de] as string | null) ?? '';
          return (
            <li key={de} className="lista__item de-para__linha">
              <span className="de-para__de apoio">{rotuloDe}</span>
              <span className="de-para__seta apoio" aria-hidden="true">
                →
              </span>
              <span className="de-para__para apoio">{para}</span>
              <span className={valor ? 'de-para__valor' : 'de-para__valor de-para__valor--vazio'}>
                {valor || 'vazio'}
              </span>
            </li>
          );
        })}
      </ul>

      {erro ? (
        <p className="lc-field__msg" role="alert">
          {erro}
        </p>
      ) : null}
    </Dialogo>
  );
}
