import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * Cifra o refresh token do Google antes de ir para `google_conexao`.
 *
 * A tabela já é fechada por GRANT (db/010), mas o token dá acesso à agenda de
 * uma pessoa: se um dia a tabela vazar — backup, dump, um GRANT devolvido por
 * engano —, o que vaza é texto cifrado. AES-256-GCM, que também acusa
 * adulteração. Formato: `v1.<iv>.<tag>.<cifrado>`, tudo base64url.
 *
 * A chave vem por parâmetro para o teste não depender do ambiente; quem chama
 * passa `process.env.GOOGLE_TOKEN_CHAVE`.
 */

function chaveDe(base64: string | undefined) {
  if (!base64) throw new Error('GOOGLE_TOKEN_CHAVE ausente');
  const chave = Buffer.from(base64, 'base64');
  if (chave.length !== 32) throw new Error('GOOGLE_TOKEN_CHAVE precisa ter 32 bytes em base64');
  return chave;
}

export function cifrar(texto: string, chaveBase64: string | undefined) {
  const iv = randomBytes(12);
  const cifra = createCipheriv('aes-256-gcm', chaveDe(chaveBase64), iv);
  const cifrado = Buffer.concat([cifra.update(texto, 'utf8'), cifra.final()]);
  return ['v1', ...[iv, cifra.getAuthTag(), cifrado].map((p) => p.toString('base64url'))].join('.');
}

export function decifrar(guardado: string, chaveBase64: string | undefined) {
  const [versao, iv, tag, cifrado] = guardado.split('.');
  if (versao !== 'v1' || !iv || !tag || !cifrado) throw new Error('token guardado em formato desconhecido');
  const decifra = createDecipheriv('aes-256-gcm', chaveDe(chaveBase64), Buffer.from(iv, 'base64url'));
  decifra.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decifra.update(Buffer.from(cifrado, 'base64url')), decifra.final()]).toString('utf8');
}
