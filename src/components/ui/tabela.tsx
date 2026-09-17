import type * as React from 'react';

const cx = (...v: unknown[]) => v.filter((x): x is string => typeof x === 'string' && x !== '').join(' ');

export interface Coluna {
  /** Chave da propriedade em cada linha. */
  chave: string;
  rotulo: string;
  /** Alinha à direita, em mono com tabular-nums e nowrap. */
  numerica?: boolean;
  /** `table-layout` é fixed: declare todas as larguras. */
  largura?: string;
  /** `true` impede o negrito da primeira coluna. */
  simples?: boolean;
}

export interface TabelaProps {
  colunas: Coluna[];
  linhas: Array<Record<string, React.ReactNode>>;
  rodape?: Record<string, React.ReactNode>;
  /** O que mostrar em célula vazia. O original usa "-". */
  vazio?: React.ReactNode;
  /** Linha de 44px em vez de 32px. */
  folgada?: boolean;
  /** Renderizado no lugar do corpo quando não há linha nenhuma. */
  semLinhas?: React.ReactNode;
  className?: string;
}

/**
 * Tabela densa: 32px por linha, cabeçalho de 36px em `surface-sunken`,
 * `table-layout: fixed`. Espelha `DataTable` do design system.
 */
export function Tabela({
  colunas,
  linhas,
  rodape,
  vazio = '-',
  folgada,
  semLinhas,
  className,
}: TabelaProps) {
  if (!linhas.length && semLinhas) return <>{semLinhas}</>;

  return (
    <table className={cx('lc-table', folgada && 'lc-table--cozy', className)}>
      <colgroup>
        {colunas.map((c) => (
          <col key={c.chave} style={c.largura ? { width: c.largura } : undefined} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {colunas.map((c) => (
            <th key={c.chave} scope="col" style={c.numerica ? { textAlign: 'right' } : undefined}>
              {c.rotulo}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {linhas.map((linha, i) => (
          <tr key={(linha.id as string) ?? i}>
            {colunas.map((c, j) => {
              const valor = linha[c.chave];
              const preenchido = valor !== undefined && valor !== null && valor !== '';
              const primeira = j === 0 && !c.simples;
              return (
                <td
                  key={c.chave}
                  className={cx(c.numerica && 'mono')}
                  style={{
                    textAlign: c.numerica ? 'right' : undefined,
                    fontWeight: primeira ? 600 : undefined,
                    whiteSpace: c.numerica ? 'nowrap' : undefined,
                  }}
                >
                  {preenchido ? valor : vazio}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
      {rodape ? (
        <tfoot>
          <tr>
            {colunas.map((c) => (
              <td key={c.chave} className={cx(c.numerica && 'mono')} style={{ textAlign: c.numerica ? 'right' : undefined }}>
                {rodape[c.chave] ?? ''}
              </td>
            ))}
          </tr>
        </tfoot>
      ) : null}
    </table>
  );
}

/** Grupo de ações de uma linha de tabela ou de lista. */
export function AcoesDaLinha({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cx('lc-table__actions', className)}>{children}</span>;
}
