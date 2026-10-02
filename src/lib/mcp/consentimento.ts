/**
 * Quem pode receber acesso pela tela `/oauth/consent` (specs/12).
 *
 * O registro dinâmico de cliente OAuth deixa qualquer um cadastrar um "app"
 * com o nome que quiser. A defesa é olhar para onde o código de autorização
 * vai voltar: só o Claude (claude.ai / claude.com) e programas locais
 * (Claude Code e Desktop, que voltam em localhost). Qualquer outro destino é
 * recusado sem nem oferecer o botão de aprovar.
 */
const DOMINIOS = ['claude.ai', 'claude.com'];
const LOCAIS = ['localhost', '127.0.0.1', '[::1]'];

export function redirecionamentoPermitido(uri: string | null | undefined) {
  if (!uri) return false;
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    return false;
  }
  if (LOCAIS.includes(url.hostname)) return url.protocol === 'http:' || url.protocol === 'https:';
  if (url.protocol !== 'https:') return false;
  return DOMINIOS.some((d) => url.hostname === d || url.hostname.endsWith(`.${d}`));
}
