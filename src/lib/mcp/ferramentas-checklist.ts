import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { STATUS } from '@/lib/checklist/itens';
import { adicionarItem, carregarChecklist, marcarItem, pastaDoClienteVisivel } from '@/lib/checklist/servico';
import { ErroDrive, conteudoDoArquivo, dentroDe, varrerPasta } from '@/lib/google/drive';
import type { ContextoMcp } from './ferramentas';

/**
 * Checklist de documentos e Drive do cliente pelo MCP (specs/18). As mesmas
 * travas da aba: o `supabase` da pessoa (RLS de cliente e da checklist) e,
 * para arquivo, "está dentro da pasta do cliente". Vale para master e
 * indicante — cada um nos clientes que enxerga.
 */

const responder = (dados: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(dados, null, 2) }],
});
const falhar = (mensagem: string) => ({
  content: [{ type: 'text' as const, text: mensagem }],
  isError: true,
});

const ROTULOS = 'nao_recebido, recebido, parcial (recebido parcial), nao_se_aplica';

export function registrarFerramentasChecklist(servidor: McpServer, ctx: ContextoMcp) {
  const { supabase, perfil, origem } = ctx;

  servidor.registerTool(
    'ver_checklist_do_cliente',
    {
      title: 'Ver checklist de documentos do cliente',
      description:
        'A checklist de documentos do cliente (BP, DRE, faturamento, contrato social, IRPF…) ' +
        'com o status de cada item e os arquivos do Drive que a varredura por NOME achou. ' +
        `Status: ${ROTULOS}. fonte: "drive" = achado pelo nome do arquivo (não conferido); ` +
        '"app"/"mcp" = marcado à mão, que sempre ganha. Para conferir o conteúdo, use ' +
        'listar_documentos_do_cliente e ler_documento_do_cliente; depois marcar_item_checklist.',
      inputSchema: { cliente_id: z.string().uuid().describe('id do cliente (de buscar_clientes).') },
    },
    async ({ cliente_id }) => {
      const r = await carregarChecklist(supabase, cliente_id);
      if (!r.ok) return falhar(r.erro);
      return responder({
        cliente: r.cliente,
        varredura: r.varredura,
        itens: r.itens.map((i) => ({
          item: i.ref,
          titulo: i.titulo,
          extra: i.extra,
          status: i.status,
          fonte: i.fonte,
          observacao: i.observacao,
          arquivos: i.arquivos.map((a) => ({ id: a.id, caminho: a.caminho })),
        })),
        link: `${origem}/clientes`,
      });
    },
  );

  servidor.registerTool(
    'listar_documentos_do_cliente',
    {
      title: 'Listar documentos do cliente no Drive',
      description:
        'Todos os arquivos da pasta do cliente no Drive da Lure, descendo as subpastas, ' +
        'com id, caminho e tipo. Use o id em ler_documento_do_cliente.',
      inputSchema: { cliente_id: z.string().uuid() },
    },
    async ({ cliente_id }) => {
      const p = await pastaDoClienteVisivel(supabase, cliente_id);
      if ('erro' in p) return falhar(p.erro);
      try {
        const arquivos = await varrerPasta(p.pasta.id);
        return responder({ pasta: p.pasta.nome, total: arquivos.length, arquivos });
      } catch (e) {
        return falhar(e instanceof ErroDrive ? `O Drive não respondeu: ${e.message}.` : 'Erro inesperado ao ler o Drive.');
      }
    },
  );

  servidor.registerTool(
    'ler_documento_do_cliente',
    {
      title: 'Ler documento do cliente',
      description:
        'O conteúdo de um arquivo da pasta do cliente. Documentos do Google saem em texto, ' +
        'Planilhas do Google em CSV; PDF, imagem e Office vêm como arquivo anexado (até 8 MB).',
      inputSchema: {
        cliente_id: z.string().uuid(),
        arquivo_id: z.string().min(5).describe('id do arquivo (de listar_documentos_do_cliente).'),
      },
    },
    async ({ cliente_id, arquivo_id }) => {
      const p = await pastaDoClienteVisivel(supabase, cliente_id);
      if ('erro' in p) return falhar(p.erro);
      try {
        if (!(await dentroDe(arquivo_id, p.pasta.id))) return falhar('Esse arquivo não está na pasta deste cliente.');
        const c = await conteudoDoArquivo(arquivo_id);
        const cabecalho = { type: 'text' as const, text: `${c.nome} (${c.mimeType}, ${c.tamanho} bytes)` };
        if (c.texto !== undefined) return { content: [cabecalho, { type: 'text' as const, text: c.texto }] };
        if (c.mimeType.startsWith('image/')) {
          return { content: [cabecalho, { type: 'image' as const, data: c.base64!, mimeType: c.mimeType }] };
        }
        return {
          content: [
            cabecalho,
            {
              type: 'resource' as const,
              resource: { uri: `${origem}/api/drive/${cliente_id}/${arquivo_id}`, mimeType: c.mimeType, blob: c.base64! },
            },
          ],
        };
      } catch (e) {
        return falhar(e instanceof ErroDrive ? `O Drive não entregou: ${e.message}.` : 'Erro inesperado ao ler o arquivo.');
      }
    },
  );

  servidor.registerTool(
    'marcar_item_checklist',
    {
      title: 'Marcar item da checklist',
      description:
        `Muda o status de um item da checklist do cliente (${ROTULOS}). ` +
        '"automatico" tira a marcação à mão e devolve o item à varredura do Drive. ' +
        'Use observacao para dizer o que falta (ex.: "BP só até setembro").',
      inputSchema: {
        cliente_id: z.string().uuid(),
        item: z.string().min(1).describe('O campo "item" de ver_checklist_do_cliente (ex.: "bp-2023", ou o id de um item extra).'),
        status: z.enum([...STATUS, 'automatico']),
        observacao: z.string().max(500).optional().describe('Vazio ("") apaga a observação.'),
      },
    },
    async ({ cliente_id, item, status, observacao }) => {
      const r = await marcarItem(
        supabase,
        perfil.id,
        cliente_id,
        item,
        status === 'automatico' ? null : status,
        'mcp',
        observacao,
      );
      return r.erro ? falhar(`Não consegui marcar: ${r.erro}`) : responder({ ok: true });
    },
  );

  servidor.registerTool(
    'adicionar_item_checklist',
    {
      title: 'Adicionar item à checklist',
      description: 'Acrescenta um documento extra à checklist deste cliente (só dele).',
      inputSchema: {
        cliente_id: z.string().uuid(),
        titulo: z.string().min(1).max(200),
        status: z.enum(STATUS).optional().describe('Padrão: segue a varredura do Drive.'),
      },
    },
    async ({ cliente_id, titulo, status }) => {
      const r = await adicionarItem(supabase, perfil.id, cliente_id, titulo, 'mcp', status ?? null);
      return r.erro ? falhar(`Não consegui adicionar: ${r.erro}`) : responder({ ok: true, item: r.id });
    },
  );
}
