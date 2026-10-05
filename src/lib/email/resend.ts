/**
 * Envio pela API do Resend (specs/13-email.md). Só servidor: a chave é
 * `RESEND_API_KEY`, sem `NEXT_PUBLIC_` (CLAUDE.md, regra 2). Sem biblioteca —
 * é um POST.
 */

export interface Mensagem {
  para: string[];
  copiaOculta?: string[];
  responderPara?: string;
  assunto: string;
  html: string;
  texto: string;
}

export class ErroDeEnvio extends Error {}

/** O que falta configurar, em português, ou `null` se está tudo lá. */
export function faltaConfigurar() {
  if (!process.env.RESEND_API_KEY) return 'a chave do Resend (RESEND_API_KEY) não está configurada';
  if (!process.env.EMAIL_REMETENTE) return 'o remetente (EMAIL_REMETENTE) não está configurado';
  return null;
}

export async function enviar(m: Mensagem): Promise<{ id: string }> {
  const falta = faltaConfigurar();
  if (falta) throw new ErroDeEnvio(falta);

  const resposta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_REMETENTE,
      to: m.para,
      bcc: m.copiaOculta?.length ? m.copiaOculta : undefined,
      reply_to: m.responderPara,
      subject: m.assunto,
      html: m.html,
      text: m.texto,
    }),
  });

  const corpo = (await resposta.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!resposta.ok || !corpo.id) {
    throw new ErroDeEnvio(corpo.message ?? `o Resend respondeu ${resposta.status}`);
  }
  return { id: corpo.id };
}
