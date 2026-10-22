import { clienteAdmin } from '@/lib/supabase/admin';
import { cifrar, decifrar } from './cripto';
import { escaparConsulta, idDaPasta, ordenarCandidatas, termoDeBusca } from './drive-busca';

/**
 * O Drive compartilhado da Lure (specs/17-google-drive-documentos.md). Uma
 * conexão só, da empresa, em `google_drive_conexao` (db/016) — fechada para a
 * sessão do usuário: tudo aqui é `service_role`. Só leitura (`drive.readonly`).
 *
 * Quem chama confere ANTES se a pessoa enxerga o cliente (RLS de `cliente`);
 * daqui para frente o Drive inteiro da conta conectada está à mão, então a
 * segunda trava — o arquivo está dentro da pasta do cliente — é `dentroDe`.
 */

const API = 'https://www.googleapis.com/drive/v3';
const TODOS_OS_DRIVES = 'supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives';
export const MIME_PASTA = 'application/vnd.google-apps.folder';

export class ErroDrive extends Error {}

/* --------------------------------------------------------------- conexão -- */

export interface EstadoDoDrive {
  conectado: boolean;
  caiu: boolean;
  emailGoogle: string | null;
  pastaRaiz: { id: string; nome: string | null } | null;
}

export async function estadoDoDrive(): Promise<EstadoDoDrive> {
  const { data } = await clienteAdmin()
    .from('google_drive_conexao')
    .select('email_google, caiu_em, pasta_raiz_id, pasta_raiz_nome')
    .eq('id', 1)
    .maybeSingle();
  return {
    conectado: Boolean(data && !data.caiu_em),
    caiu: Boolean(data?.caiu_em),
    emailGoogle: (data?.email_google as string | null) ?? null,
    pastaRaiz: data?.pasta_raiz_id
      ? { id: data.pasta_raiz_id as string, nome: (data.pasta_raiz_nome as string | null) ?? null }
      : null,
  };
}

/** Reconectar mantém a pasta raiz: só troca a conta e o token. */
export async function gravarConexaoDrive(perfilId: string, refreshToken: string, emailGoogle: string | null) {
  const { error } = await clienteAdmin()
    .from('google_drive_conexao')
    .upsert({
      id: 1,
      conectado_por: perfilId,
      email_google: emailGoogle,
      refresh_token_cifrado: cifrar(refreshToken, process.env.GOOGLE_TOKEN_CHAVE),
      caiu_em: null,
    });
  if (error) throw new Error(`não consegui gravar a conexão com o Drive: ${error.message}`);
}

export async function apagarConexaoDrive() {
  const { data } = await clienteAdmin()
    .from('google_drive_conexao')
    .select('refresh_token_cifrado')
    .eq('id', 1)
    .maybeSingle();
  if (data?.refresh_token_cifrado) {
    const refresh = decifrar(data.refresh_token_cifrado as string, process.env.GOOGLE_TOKEN_CHAVE);
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refresh)}`, { method: 'POST' }).catch(
      () => {},
    );
  }
  await clienteAdmin().from('google_drive_conexao').delete().eq('id', 1);
}

async function accessToken(): Promise<string> {
  const admin = clienteAdmin();
  const { data } = await admin
    .from('google_drive_conexao')
    .select('refresh_token_cifrado, caiu_em')
    .eq('id', 1)
    .maybeSingle();
  if (!data || data.caiu_em) throw new ErroDrive('o Google Drive não está conectado');

  const resposta = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      refresh_token: decifrar(data.refresh_token_cifrado as string, process.env.GOOGLE_TOKEN_CHAVE),
      grant_type: 'refresh_token',
    }),
  });
  const corpo = (await resposta.json().catch(() => ({}))) as { access_token?: string; error?: string };
  if (corpo.error === 'invalid_grant') {
    await admin.from('google_drive_conexao').update({ caiu_em: new Date().toISOString() }).eq('id', 1);
    throw new ErroDrive('o Google recusou a conexão do Drive — um master precisa reconectar');
  }
  if (!resposta.ok || !corpo.access_token) {
    throw new ErroDrive(`o Google não liberou o acesso ao Drive (${corpo.error ?? resposta.status})`);
  }
  return corpo.access_token;
}

async function chamar<T>(caminho: string, token?: string): Promise<T> {
  const resposta = await fetch(`${API}${caminho}`, {
    headers: { Authorization: `Bearer ${token ?? (await accessToken())}` },
  });
  if (!resposta.ok) {
    const erro = (await resposta.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new ErroDrive(erro?.error?.message ?? `o Drive respondeu ${resposta.status}`);
  }
  return resposta.json() as Promise<T>;
}

/* ------------------------------------------------------------ pasta raiz -- */

/** A pasta onde ficam as pastas dos clientes. Link ou id; vazio tira. */
export async function definirPastaRaiz(linkOuId: string): Promise<{ erro?: string }> {
  const admin = clienteAdmin();
  if (!linkOuId.trim()) {
    await admin.from('google_drive_conexao').update({ pasta_raiz_id: null, pasta_raiz_nome: null }).eq('id', 1);
    return {};
  }
  const id = idDaPasta(linkOuId);
  if (!id) return { erro: 'Não reconheci o link. Cole o endereço de uma pasta do Drive.' };
  try {
    const pasta = await chamar<{ id: string; name: string; mimeType: string }>(
      `/files/${encodeURIComponent(id)}?fields=id,name,mimeType&supportsAllDrives=true`,
    );
    if (pasta.mimeType !== MIME_PASTA) return { erro: 'Esse link é de um arquivo, não de uma pasta.' };
    await admin.from('google_drive_conexao').update({ pasta_raiz_id: pasta.id, pasta_raiz_nome: pasta.name }).eq('id', 1);
    return {};
  } catch (e) {
    return { erro: e instanceof ErroDrive ? `O Drive não abriu essa pasta: ${e.message}.` : 'Erro inesperado no Drive.' };
  }
}

/* ------------------------------------------------------ pasta do cliente -- */

export interface ItemDoDrive {
  id: string;
  nome: string;
  mimeType: string;
  ehPasta: boolean;
  tamanho: number | null;
  modificadoEm: string | null;
}

interface ArquivoDaApi {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  parents?: string[];
}

const CAMPOS = 'id,name,mimeType,size,modifiedTime,parents';

const paraItem = (f: ArquivoDaApi): ItemDoDrive => ({
  id: f.id,
  nome: f.name,
  mimeType: f.mimeType,
  ehPasta: f.mimeType === MIME_PASTA,
  tamanho: f.size ? Number(f.size) : null,
  modificadoEm: f.modifiedTime ?? null,
});

/**
 * A pasta do cliente pelo nome. Busca larga no Google (uma palavra) e a
 * escolha em `drive-busca.ts`. `outras` traz os nomes das candidatas que sobraram.
 */
export async function pastaDoCliente(
  nomeCliente: string,
): Promise<{ pasta: { id: string; nome: string } | null; outras: string[] }> {
  const { pastaRaiz } = await estadoDoDrive();
  const termo = escaparConsulta(termoDeBusca(nomeCliente));
  const q = [
    `mimeType = '${MIME_PASTA}'`,
    'trashed = false',
    `name contains '${termo}'`,
    pastaRaiz ? `'${escaparConsulta(pastaRaiz.id)}' in parents` : null,
  ]
    .filter(Boolean)
    .join(' and ');

  const { files } = await chamar<{ files: ArquivoDaApi[] }>(
    `/files?q=${encodeURIComponent(q)}&fields=files(${CAMPOS})&pageSize=50&${TODOS_OS_DRIVES}`,
  );
  const ordem = ordenarCandidatas(
    files.map((f) => ({ id: f.id, nome: f.name })),
    nomeCliente,
  );
  return { pasta: ordem[0] ?? null, outras: ordem.slice(1).map((p) => p.nome) };
}

/** O conteúdo de uma pasta: pastas primeiro, depois arquivos, por nome. */
export async function listarPasta(pastaId: string): Promise<ItemDoDrive[]> {
  const token = await accessToken();
  const q = `'${escaparConsulta(pastaId)}' in parents and trashed = false`;
  const itens: ItemDoDrive[] = [];
  let pagina: string | undefined;
  do {
    const r = await chamar<{ files: ArquivoDaApi[]; nextPageToken?: string }>(
      `/files?q=${encodeURIComponent(q)}&fields=nextPageToken,files(${CAMPOS})&pageSize=200&orderBy=folder,name_natural&${TODOS_OS_DRIVES}${pagina ? `&pageToken=${pagina}` : ''}`,
      token,
    );
    itens.push(...r.files.map(paraItem));
    pagina = r.nextPageToken;
  } while (pagina && itens.length < 1000);
  return itens;
}

/**
 * O arquivo (ou pasta) está dentro de `pastaId`? Sobe os pais até 8 níveis.
 * É a trava que impede abrir pelo app um arquivo de fora da pasta do cliente.
 */
export async function dentroDe(itemId: string, pastaId: string): Promise<boolean> {
  if (itemId === pastaId) return true;
  const token = await accessToken();
  let atuais = [itemId];
  for (let nivel = 0; nivel < 8 && atuais.length; nivel++) {
    const pais = (
      await Promise.all(
        atuais.map((id) =>
          chamar<{ parents?: string[] }>(`/files/${encodeURIComponent(id)}?fields=parents&supportsAllDrives=true`, token)
            .then((f) => f.parents ?? [])
            .catch(() => [] as string[]),
        ),
      )
    ).flat();
    if (pais.includes(pastaId)) return true;
    atuais = pais;
  }
  return false;
}

/** Docs, Planilhas e Apresentações do Google não têm bytes: saem em PDF. */
const EXPORTAVEL = new Set([
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.spreadsheet',
  'application/vnd.google-apps.presentation',
  'application/vnd.google-apps.drawing',
]);

/** Os bytes do arquivo, prontos para a rota repassar. */
export async function baixarArquivo(
  arquivoId: string,
): Promise<{ corpo: ReadableStream<Uint8Array>; tipo: string; nome: string }> {
  const token = await accessToken();
  const meta = await chamar<ArquivoDaApi>(
    `/files/${encodeURIComponent(arquivoId)}?fields=${CAMPOS}&supportsAllDrives=true`,
    token,
  );
  if (meta.mimeType === MIME_PASTA) throw new ErroDrive('isso é uma pasta');

  const exporta = EXPORTAVEL.has(meta.mimeType);
  const url = exporta
    ? `${API}/files/${encodeURIComponent(arquivoId)}/export?mimeType=application/pdf`
    : `${API}/files/${encodeURIComponent(arquivoId)}?alt=media&supportsAllDrives=true`;
  const resposta = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!resposta.ok || !resposta.body) throw new ErroDrive(`o Drive não entregou o arquivo (${resposta.status})`);

  return {
    corpo: resposta.body,
    tipo: exporta ? 'application/pdf' : (resposta.headers.get('content-type') ?? meta.mimeType),
    nome: exporta ? `${meta.name}.pdf` : meta.name,
  };
}
