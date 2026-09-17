'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { Botao, Vazio } from '@/components/ui/base';
import { IconeMais } from '@/components/ui/icones';
import { Tabela } from '@/components/ui/tabela';
import { TopoDaTela } from '@/components/ui/casca';
import { AcoesLinha, BlocoArquivados, Busca, ConfirmarExclusao } from '@/components/listas';
import type { Fornecedor, TabelaApoio } from '@/lib/dominio';
import { arquivarFornecedor, excluirFornecedor } from './acoes';
import { DialogoFornecedor } from './dialogo';
import type { VinculoTipo } from './page';

type Aba = 'fornecedores' | 'tipos';

/** Colunas da aba Fornecedores, na ordem de produção. */
const COLUNAS = [
  { chave: 'nome', rotulo: 'Nome', largura: '22%' },
  { chave: 'tipos', rotulo: 'Tipos de operação', largura: '26%', simples: true },
  { chave: 'faturamento', rotulo: 'Faturamento minimo', largura: '15%', simples: true },
  { chave: 'operacao', rotulo: 'Operação minima', largura: '15%', simples: true },
  { chave: 'segmento', rotulo: 'Segmento foco', largura: '15%', simples: true },
  { chave: 'acoes', rotulo: '', largura: '7%', simples: true },
];

export function TelaFornecedores({
  fornecedores,
  arquivados,
  tipos,
  vinculos,
}: {
  fornecedores: Fornecedor[];
  arquivados: Fornecedor[];
  tipos: TabelaApoio[];
  vinculos: VinculoTipo[];
}) {
  const [aba, setAba] = useState<Aba>('fornecedores');
  const [busca, setBusca] = useState('');
  const [emEdicao, setEmEdicao] = useState<Fornecedor | null>(null);
  const [criando, setCriando] = useState(false);
  const [aExcluir, setAExcluir] = useState<Fornecedor | null>(null);
  const [, transicao] = useTransition();

  const filtrar = useCallback(
    (lista: Fornecedor[]) => {
      const alvo = busca.trim().toUpperCase();
      if (!alvo) return lista;
      return lista.filter((f) => f.nome_fundo.toUpperCase().includes(alvo));
    },
    [busca],
  );

  const visiveis = useMemo(() => filtrar(fornecedores), [fornecedores, filtrar]);
  const arquivadosVisiveis = useMemo(() => filtrar(arquivados), [arquivados, filtrar]);

  const rotuloDoTipo = useMemo(() => new Map(tipos.map((t) => [t.id, t.rotulo])), [tipos]);

  /** Tipos que o fornecedor atende, como lista separada por vírgula. */
  const tiposDe = useCallback(
    (id: string) =>
      vinculos
        .filter((v) => v.fornecedor_id === id && v.papel === 'atende')
        .map((v) => rotuloDoTipo.get(v.tipo_operacao_id))
        .filter(Boolean)
        .join(', '),
    [vinculos, rotuloDoTipo],
  );

  const linhas = (lista: Fornecedor[], arquivado: boolean) =>
    lista.map((f) => ({
      id: f.id,
      nome: (
        <button type="button" className="celula-abrir" onClick={() => setEmEdicao(f)}>
          {f.nome_fundo}
        </button>
      ),
      tipos: <span className="apoio">{tiposDe(f.id)}</span>,
      faturamento: f.faturamento_minimo,
      operacao: f.operacao_minima,
      segmento: f.segmento_foco,
      acoes: (
        <AcoesLinha
          rotuloArquivar={arquivado ? 'Desarquivar' : 'Arquivar'}
          aoArquivar={() => transicao(() => void arquivarFornecedor(f.id, !arquivado))}
          aoExcluir={() => setAExcluir(f)}
          aoEditar={() => setEmEdicao(f)}
        />
      ),
    }));

  return (
    <>
      {/* Duas abas, nesta ordem: Fornecedores · Tipo Operações. */}
      <div className="abas" role="tablist">
        <button
          type="button"
          role="tab"
          className="abas__item"
          aria-selected={aba === 'fornecedores'}
          onClick={() => setAba('fornecedores')}
        >
          Fornecedores
        </button>
        <button
          type="button"
          role="tab"
          className="abas__item"
          aria-selected={aba === 'tipos'}
          onClick={() => setAba('tipos')}
        >
          Tipo Operações
        </button>
      </div>

      <TopoDaTela>
        <Busca valor={busca} aoMudar={setBusca} placeholder="Buscar fornecedores" />
        <Botao variante="primary" onClick={() => setCriando(true)}>
          <IconeMais tamanho={15} /> Novo Fundo
        </Botao>
      </TopoDaTela>

      {aba === 'fornecedores' ? (
        <>
          <Tabela
            colunas={COLUNAS}
            linhas={linhas(visiveis, false)}
            semLinhas={
              <div className="vazio-tela">
                <Vazio
                  titulo={fornecedores.length ? 'Nenhum fundo com esse nome' : 'Nenhum fundo ainda'}
                  escondidos={fornecedores.length - visiveis.length || undefined}
                  aoLimpar={busca ? () => setBusca('') : undefined}
                />
              </div>
            }
          />
          <BlocoArquivados quantidade={arquivadosVisiveis.length}>
            <Tabela colunas={COLUNAS} linhas={linhas(arquivadosVisiveis, true)} />
          </BlocoArquivados>
        </>
      ) : (
        <MatrizDeTipos tipos={tipos} fornecedores={fornecedores} vinculos={vinculos} />
      )}

      <DialogoFornecedor
        aberto={criando || emEdicao !== null}
        fornecedor={emEdicao}
        tipos={tipos}
        vinculos={emEdicao ? vinculos.filter((v) => v.fornecedor_id === emEdicao.id) : []}
        aoFechar={() => {
          setCriando(false);
          setEmEdicao(null);
        }}
      />

      <ConfirmarExclusao
        aberto={aExcluir !== null}
        entidade="Fornecedor"
        nome={aExcluir?.nome_fundo ?? ''}
        aoFechar={() => setAExcluir(null)}
        aoConfirmar={() => aExcluir && transicao(() => void excluirFornecedor(aExcluir.id))}
      />
    </>
  );
}

/**
 * Aba Tipo Operações: a matriz tipo × fundos.
 * Colunas: Nome | 1º Linha | 2º Linha | Habilitados.
 * "Habilitados" é uma grade de várias colunas dentro da própria célula, com
 * rolagem horizontal quando não cabe — é assim em produção.
 */
function MatrizDeTipos({
  tipos,
  fornecedores,
  vinculos,
}: {
  tipos: TabelaApoio[];
  fornecedores: Fornecedor[];
  vinculos: VinculoTipo[];
}) {
  const nomeDe = useMemo(() => new Map(fornecedores.map((f) => [f.id, f.nome_fundo])), [fornecedores]);

  const fundosCom = (tipoId: number, papel: VinculoTipo['papel']) =>
    vinculos
      .filter((v) => v.tipo_operacao_id === tipoId && v.papel === papel)
      .map((v) => nomeDe.get(v.fornecedor_id))
      .filter((n): n is string => Boolean(n))
      .sort();

  return (
    <table className="lc-table matriz">
      <colgroup>
        <col style={{ width: '18%' }} />
        <col style={{ width: '18%' }} />
        <col style={{ width: '18%' }} />
        <col style={{ width: '46%' }} />
      </colgroup>
      <thead>
        <tr>
          <th scope="col">Nome</th>
          <th scope="col">1º Linha</th>
          <th scope="col">2º Linha</th>
          <th scope="col">Habilitados</th>
        </tr>
      </thead>
      <tbody>
        {tipos.map((t) => {
          const habilitados = fundosCom(t.id, 'atende');
          return (
            <tr key={t.id}>
              <td style={{ fontWeight: 600 }}>{t.rotulo}</td>
              <td className="apoio">{fundosCom(t.id, 'linha_1').join(', ') || '-'}</td>
              <td className="apoio">{fundosCom(t.id, 'linha_2').join(', ') || '-'}</td>
              <td>
                {habilitados.length ? (
                  <div className="matriz__grade">
                    {habilitados.map((n) => (
                      <span key={n} className="matriz__fundo">
                        {n}
                      </span>
                    ))}
                  </div>
                ) : (
                  '-'
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
