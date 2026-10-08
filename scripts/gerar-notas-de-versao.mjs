#!/usr/bin/env node
/**
 * Converte docs/notas-de-versao.md em src/lib/notas-de-versao.ts.
 *
 * Roda no `prebuild`/`predev` (package.json), então o arquivo .md nunca
 * precisa existir em tempo de execução na Vercel — as notas viajam dentro do
 * bundle como dado TypeScript. O .ts gerado é versionado, para o typecheck e
 * os testes funcionarem sem rodar o script.
 *
 * Formato lido: "## dd/mm/aaaa — título" abre uma rodada, "### grupo" abre um
 * grupo, "- item" é item (com continuação indentada; "  - " é subitem) e
 * linha solta é parágrafo. O preâmbulo antes da primeira "##" é ignorado.
 */
import fs from 'node:fs';

const ORIGEM = 'docs/notas-de-versao.md';
const DESTINO = 'src/lib/notas-de-versao.ts';

const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function converter(markdown) {
  const rodadas = [];
  let rodada = null;
  let grupo = null;
  let ultimo = null;

  for (const bruta of markdown.split(/\r?\n/)) {
    const linha = bruta.replace(/\s+$/, '');
    const r = linha.match(/^##\s+(\d{2})\/(\d{2})\/(\d{4})\s+[—-]\s+(.+)$/);
    if (r) {
      const [, dd, mm, aaaa, titulo] = r;
      rodada = { id: `${aaaa}-${mm}-${dd}-${slug(titulo)}`, data: `${dd}/${mm}/${aaaa}`, titulo, grupos: [] };
      rodadas.push(rodada);
      grupo = null;
      ultimo = null;
      continue;
    }
    if (!rodada) continue;
    const g = linha.match(/^###\s+(.+)$/);
    if (g) {
      grupo = { titulo: g[1], itens: [] };
      rodada.grupos.push(grupo);
      ultimo = null;
      continue;
    }
    if (linha === '' || linha === '---') {
      ultimo = null;
      continue;
    }
    if (!grupo) {
      grupo = { titulo: '', itens: [] };
      rodada.grupos.push(grupo);
    }
    const sub = linha.match(/^\s+[-*]\s+(.+)$/);
    const item = linha.match(/^[-*]\s+(.+)$/);
    if (sub) {
      ultimo = { tipo: 'sub', texto: sub[1] };
      grupo.itens.push(ultimo);
    } else if (item) {
      ultimo = { tipo: 'item', texto: item[1] };
      grupo.itens.push(ultimo);
    } else if (/^\s+\S/.test(linha) && ultimo) {
      ultimo.texto += ' ' + linha.trim();
    } else {
      // Parágrafo. A linha seguinte sem indentação continua o mesmo parágrafo.
      if (ultimo && ultimo.tipo === 'texto') ultimo.texto += ' ' + linha.trim();
      else {
        ultimo = { tipo: 'texto', texto: linha.trim() };
        grupo.itens.push(ultimo);
      }
    }
  }
  return rodadas;
}

{
  const rodadas = converter(fs.readFileSync(ORIGEM, 'utf8'));
  const saida = `// GERADO por scripts/gerar-notas-de-versao.mjs a partir de ${ORIGEM}.
// Não edite à mão: edite o .md e rode \`npm run notas\` (o build já roda).

export interface ItemDeNota {
  tipo: 'item' | 'sub' | 'texto';
  /** Markdown simples: só **negrito** e \`código\`. */
  texto: string;
}
export interface GrupoDeNota {
  titulo: string;
  itens: ItemDeNota[];
}
export interface RodadaDeNotas {
  /** "aaaa-mm-dd-slug" — é o que fica gravado em perfil.notas_vistas. */
  id: string;
  data: string;
  titulo: string;
  grupos: GrupoDeNota[];
}

/** Mais recente primeiro, como no .md. */
export const NOTAS_DE_VERSAO: RodadaDeNotas[] = ${JSON.stringify(rodadas, null, 2)};
`;
  fs.writeFileSync(DESTINO, saida);
  console.log(`${DESTINO}: ${rodadas.length} rodadas`);
}
