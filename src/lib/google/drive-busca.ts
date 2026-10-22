/**
 * Regras puras de "qual pasta do Drive é a deste cliente"
 * (specs/17-google-drive-documentos.md). Sem rede — `drive-busca.test.ts`.
 *
 * O nome no cadastro e o nome da pasta raramente batem letra a letra:
 * "PRO REMEDIOS DISTRIBUIDORA DE PRODUTOS…" no cadastro, "Pro Remédios" no
 * Drive. Por isso a busca no Google é larga (uma palavra) e a escolha é aqui.
 */

/** Sem caixa, sem acento, sem pontuação, espaços simples. */
export function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Palavras que não identificam ninguém. */
const VAZIAS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'em', 'ltda', 'me', 'epp', 'sa', 's', 'eireli',
  'grupo', 'empresa', 'cia', 'companhia', 'comercio', 'industria',
]);

export function palavrasDe(texto: string) {
  return normalizar(texto)
    .split(' ')
    .filter((p) => p.length > 1 && !VAZIAS.has(p));
}

/** A palavra mais longa do nome — vai na busca do Google (`name contains`). */
export function termoDeBusca(nomeCliente: string) {
  const palavras = palavrasDe(nomeCliente);
  return palavras.sort((a, b) => b.length - a.length)[0] ?? normalizar(nomeCliente);
}

/** Aspas e barra escapadas para a `q` da API do Drive. */
export function escaparConsulta(texto: string) {
  return texto.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Nota da pasta para o cliente: 100 nome idêntico; 80 um contém o outro;
 * abaixo, a fração das palavras da pasta que estão no nome do cliente.
 * Zero: não serve.
 */
export function notaDaPasta(nomePasta: string, nomeCliente: string) {
  if (normalizar(nomePasta) && normalizar(nomePasta) === normalizar(nomeCliente)) return 100;
  // Daqui para baixo só contam as palavras que identificam: "Ltda" contido em
  // "Qualquer Ltda" não diz nada.
  const daPasta = palavrasDe(nomePasta);
  const p = daPasta.join(' ');
  const c = palavrasDe(nomeCliente).join(' ');
  if (!p || !c) return 0;
  if (p === c) return 100;
  if (` ${c} `.includes(` ${p} `) || ` ${p} `.includes(` ${c} `)) return 80;
  const doCliente = new Set(palavrasDe(nomeCliente));
  const comuns = daPasta.filter((w) => doCliente.has(w)).length;
  // Precisa de pelo menos metade das palavras da pasta, e de mais de uma
  // palavra quando o nome tem várias: "Agro" sozinho casaria com meio mundo.
  if (comuns === 0 || comuns / daPasta.length < 0.5 || (daPasta.length > 1 && comuns < 2)) return 0;
  return Math.round((comuns / daPasta.length) * 60);
}

/** As pastas que servem, da melhor para a pior. */
export function ordenarCandidatas<T extends { nome: string }>(pastas: T[], nomeCliente: string) {
  return pastas
    .map((p) => ({ pasta: p, nota: notaDaPasta(p.nome, nomeCliente) }))
    .filter((x) => x.nota > 0)
    .sort((a, b) => b.nota - a.nota || a.pasta.nome.localeCompare(b.pasta.nome, 'pt-BR'))
    .map((x) => x.pasta);
}

/** Id da pasta a partir do link colado (ou o próprio id). */
export function idDaPasta(linkOuId: string) {
  const t = linkOuId.trim();
  const doLink = t.match(/\/folders\/([A-Za-z0-9_-]{10,})/) ?? t.match(/[?&]id=([A-Za-z0-9_-]{10,})/);
  if (doLink) return doLink[1];
  return /^[A-Za-z0-9_-]{10,}$/.test(t) ? t : null;
}
