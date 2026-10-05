import { ImageResponse } from 'next/og';
import type { EtapaDoEmail, ObservacaoDoEmail } from './status-operacao';

/**
 * As "fotos" que o Bubble anexava ao e-mail de status (plugin Convert To PNG,
 * `documentacao-completa.md:2216–2219`): o bloco de observações (`obs`), a
 * tabela de fundos (`ops-table`) e a cópia resumida dela (`ops-table2`).
 *
 * Aqui não se fotografa a tela: o servidor desenha a mesma tabela em PNG com
 * `next/og`, que já vem no Next. Sai igual para todo mundo, independente de
 * navegador, tamanho de janela ou tema.
 */

const LARGURA = 1000;
const COR = { borda: '#d9d9d9', cabeca: '#f2f2f2', texto: '#1a1a1a', apoio: '#666666', marca: '#ffd600' };

const data = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date(iso)) : '-';

interface Coluna {
  titulo: string;
  /** Fração da largura. */
  peso: number;
}

/** Altura estimada de uma linha: o texto mais longo, quebrado pela largura da coluna. */
function alturaDaLinha(celulas: string[], colunas: Coluna[]) {
  const total = colunas.reduce((s, c) => s + c.peso, 0);
  const linhas = celulas.map((t, i) => {
    const largura = ((LARGURA - 64) * colunas[i].peso) / total - 20;
    const porLinha = Math.max(8, Math.floor(largura / 8.2));
    return Math.max(1, Math.ceil((t || '-').length / porLinha));
  });
  return 16 + Math.max(...linhas) * 21;
}

async function tabelaEmPng(titulo: string, subtitulo: string, colunas: Coluna[], linhas: string[][]) {
  const alturas = linhas.map((l) => alturaDaLinha(l, colunas));
  const altura = 32 + 70 + 40 + alturas.reduce((s, a) => s + a, 0) + 32;

  const celula = (texto: string, peso: number, chave: string, cabeca = false) => (
    <div
      key={chave}
      style={{
        display: 'flex',
        flex: peso,
        padding: '8px 10px',
        borderRight: `1px solid ${COR.borda}`,
        background: cabeca ? COR.cabeca : '#ffffff',
        fontWeight: cabeca ? 700 : 400,
        fontSize: 16,
        lineHeight: 1.3,
        color: COR.texto,
      }}
    >
      {texto || '-'}
    </div>
  );

  const resposta = new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: '#ffffff',
          padding: 32,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', width: 6, height: 26, background: COR.marca }} />
            <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, color: COR.texto }}>{titulo}</div>
          </div>
          <div style={{ display: 'flex', fontSize: 15, color: COR.apoio, marginTop: 6, marginLeft: 18 }}>{subtitulo}</div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderTop: `1px solid ${COR.borda}`,
            borderLeft: `1px solid ${COR.borda}`,
          }}
        >
          <div style={{ display: 'flex', borderBottom: `1px solid ${COR.borda}` }}>
            {colunas.map((c, j) => celula(c.titulo, c.peso, `c${j}`, true))}
          </div>
          {linhas.map((l, i) => (
            <div key={i} style={{ display: 'flex', borderBottom: `1px solid ${COR.borda}`, minHeight: alturas[i] }}>
              {l.map((t, j) => celula(t, colunas[j].peso, `${i}-${j}`))}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: LARGURA, height: Math.min(Math.max(altura, 200), 6000) },
  );
  return Buffer.from(await resposta.arrayBuffer());
}

export interface Imagem {
  /** Também é o `content_id` do anexo: o corpo do e-mail aponta `cid:<id>`. */
  id: string;
  arquivo: string;
  titulo: string;
  png: Buffer;
}

export async function desenharImagens(entrada: {
  cliente: string | null;
  identificador: string | null;
  observacoes: ObservacaoDoEmail[];
  etapas: EtapaDoEmail[];
  incluir: { observacoes: boolean; fundos: boolean; resumo: boolean };
}): Promise<Imagem[]> {
  const subtitulo = [entrada.cliente, entrada.identificador].filter(Boolean).join(' · ');
  const imagens: Imagem[] = [];

  if (entrada.incluir.observacoes && entrada.observacoes.length) {
    imagens.push({
      id: 'observacoes',
      arquivo: 'observacoes.png',
      titulo: 'Observações',
      png: await tabelaEmPng(
        'Observações',
        subtitulo,
        [
          { titulo: 'Data', peso: 1 },
          { titulo: 'Observação', peso: 6 },
        ],
        entrada.observacoes.map((o) => [data(o.criadoEm), o.texto]),
      ),
    });
  }

  if (entrada.incluir.fundos && entrada.etapas.length) {
    imagens.push({
      id: 'fundos',
      arquivo: 'fundos.png',
      titulo: 'Fundos',
      png: await tabelaEmPng(
        'Fundos',
        subtitulo,
        [
          { titulo: 'Fundo', peso: 3 },
          { titulo: 'Tipo de operação', peso: 2 },
          { titulo: 'Status', peso: 2 },
          { titulo: 'Na mão de', peso: 2 },
          { titulo: 'Alterado em', peso: 1.3 },
        ],
        entrada.etapas.map((e) => [e.fundo, e.tipo ?? '-', e.status ?? '-', e.naMaoDe ?? '-', data(e.atualizadoEm)]),
      ),
    });
  }

  if (entrada.incluir.resumo && entrada.etapas.length) {
    imagens.push({
      id: 'fundos-resumo',
      arquivo: 'fundos-resumido.png',
      titulo: 'Fundos (resumido)',
      png: await tabelaEmPng(
        'Fundos',
        subtitulo,
        [
          { titulo: 'Fundo', peso: 3 },
          { titulo: 'Status', peso: 2 },
          { titulo: 'Na mão de', peso: 2 },
        ],
        entrada.etapas.map((e) => [e.fundo, e.status ?? '-', e.naMaoDe ?? '-']),
      ),
    });
  }

  return imagens;
}
