'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { Botao } from '@/components/ui/base';
import { Vazio } from '@/components/ui/base';
import { TopoDaTela } from '@/components/ui/casca';
import { AcoesLinha, BlocoArquivados, Busca, ConfirmarExclusao, ItemDaLista } from '@/components/listas';
import type { Cliente, NivelAcesso } from '@/lib/dominio';
import { arquivarCliente, excluirCliente } from './acoes';
import { DialogoCliente } from './dialogo';

export interface EmailCliente {
  id: number;
  cliente_id: string;
  email: string;
}

export function TelaClientes({
  nivel,
  clientes,
  arquivados,
  emails,
  usuarios,
  vinculos,
}: {
  nivel: NivelAcesso;
  clientes: Cliente[];
  arquivados: Cliente[];
  emails: EmailCliente[];
  usuarios: Array<{ id: string; nome: string }>;
  vinculos: Array<{ cliente_id: string; perfil_id: string }>;
}) {
  const [busca, setBusca] = useState('');
  const [emEdicao, setEmEdicao] = useState<Cliente | null>(null);
  const [criando, setCriando] = useState(false);
  const [aExcluir, setAExcluir] = useState<Cliente | null>(null);
  const [, transicao] = useTransition();

  const filtrar = useCallback(
    (lista: Cliente[]) => {
      const alvo = busca.trim().toUpperCase();
      if (!alvo) return lista;
      return lista.filter((c) => c.nome_razao.toUpperCase().includes(alvo));
    },
    [busca],
  );

  const visiveis = useMemo(() => filtrar(clientes), [clientes, filtrar]);
  const arquivadosVisiveis = useMemo(() => filtrar(arquivados), [arquivados, filtrar]);
  const escondidos = clientes.length - visiveis.length;

  const emailsDe = (id: string) => emails.filter((e) => e.cliente_id === id);
  const visualizadoresDe = (id: string) =>
    vinculos.filter((v) => v.cliente_id === id).map((v) => v.perfil_id);

  return (
    <>
      {/* Busca à esquerda e "Novo Cliente" à direita, no alto — antes da lista. */}
      <TopoDaTela>
        <Busca valor={busca} aoMudar={setBusca} placeholder="Buscar clientes" />
        <Botao variante="primary" onClick={() => setCriando(true)}>
          Novo Cliente
        </Botao>
      </TopoDaTela>

      {visiveis.length === 0 ? (
        <div className="vazio-tela">
          <Vazio
            titulo={clientes.length ? 'Nenhum cliente com esse nome' : 'Nenhum cliente ainda'}
            escondidos={escondidos || undefined}
            aoLimpar={busca ? () => setBusca('') : undefined}
          />
        </div>
      ) : (
        <ul className="lista">
          {visiveis.map((c) => (
            <ItemDaLista
              key={c.id}
              aoAbrir={() => setEmEdicao(c)}
              rotuloAbrir={`Editar ${c.nome_razao}`}
              acoes={
                <AcoesLinha
                  aoArquivar={() => transicao(() => void arquivarCliente(c.id, true))}
                  aoExcluir={() => setAExcluir(c)}
                  aoEditar={() => setEmEdicao(c)}
                />
              }
            >
              {/* Cada linha mostra só o nome/razão. O nome inteiro abre a edição. */}
              <span className="lista__nome">{c.nome_razao}</span>
            </ItemDaLista>
          ))}
        </ul>
      )}

      {nivel === 'master' ? (
        <BlocoArquivados quantidade={arquivadosVisiveis.length}>
          <ul className="lista">
            {arquivadosVisiveis.map((c) => (
              <ItemDaLista
                key={c.id}
                aoAbrir={() => setEmEdicao(c)}
                rotuloAbrir={`Editar ${c.nome_razao}`}
                acoes={
                  <AcoesLinha
                    rotuloArquivar="Desarquivar"
                    aoArquivar={() => transicao(() => void arquivarCliente(c.id, false))}
                    aoExcluir={() => setAExcluir(c)}
                    aoEditar={() => setEmEdicao(c)}
                  />
                }
              >
                <span className="lista__nome">{c.nome_razao}</span>
              </ItemDaLista>
            ))}
          </ul>
        </BlocoArquivados>
      ) : null}

      {/* Um diálogo só para criar e editar — o botão é que muda de rótulo. */}
      <DialogoCliente
        aberto={criando || emEdicao !== null}
        cliente={emEdicao}
        emails={emEdicao ? emailsDe(emEdicao.id) : []}
        usuarios={usuarios}
        visualizadores={emEdicao ? visualizadoresDe(emEdicao.id) : []}
        podeEditarVisualizadores={nivel === 'master'}
        aoFechar={() => {
          setCriando(false);
          setEmEdicao(null);
        }}
      />

      <ConfirmarExclusao
        aberto={aExcluir !== null}
        entidade="Cliente"
        nome={aExcluir?.nome_razao ?? ''}
        aoFechar={() => setAExcluir(null)}
        aoConfirmar={() => aExcluir && transicao(() => void excluirCliente(aExcluir.id))}
      />
    </>
  );
}
