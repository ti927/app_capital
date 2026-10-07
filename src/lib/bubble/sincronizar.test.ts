import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ResultadoBusca } from './api.ts';
import type { Linha, Mapa } from './mapeamento.ts';
import { podeSincronizar } from './permissao.ts';
import {
  diferencas,
  FILHAS,
  iguais,
  sincronizar,
  soNovos,
  type Banco,
  type Fonte,
  type TabelaFilha,
  type TipoLido,
} from './sincronizar.ts';

/**
 * A regra que se testa: a sincronização **espelha o Bubble** (sentido único).
 * Existente é atualizado, novo entra, o que sumiu do Bubble é arquivado (só
 * com leitura completa), o que nasceu aqui não é tocado e nada é apagado —
 * exceto filho marcado `origem_bubble` que saiu do Bubble.
 *
 * O banco é um dublê em memória que implementa `Banco`. Grava cada chamada
 * de escrita, para o teste afirmar o que foi pedido, não só o resultado.
 */

type Tabelas = Record<string, Linha[]>;

function bancoFalso(inicial: Tabelas = {}) {
  const tabelas: Tabelas = structuredClone(inicial);
  const chamadas: Array<{ tabela: string; operacao: string; linhas: unknown[] }> = [];
  let seq = 0;
  const de = (t: string) => (tabelas[t] ??= []);
  const mesmaChave = (t: TabelaFilha, a: Linha, b: Linha) =>
    [FILHAS[t].pai, ...FILHAS[t].chave].every((c) => a[c] === b[c]);

  const banco: Banco = {
    async atuais(t) {
      return new Map(de(t).filter((l) => l.bubble_id).map((l) => [String(l.bubble_id), { ...l }]));
    },
    async catalogo(t) {
      const fixos: Record<string, Array<[string, number]>> = {
        tipo_operacao: [['FIDC', 1]],
        status_operacao: [['Em andamento', 1]],
        status_etapa: [['Contrato assinado', 1]],
      };
      return new Map(fixos[t]);
    },
    async perfisPorEmail() {
      return new Map([['ana@exemplo.com', 'perfil-ana']]);
    },
    async quadros() {
      return new Map(de('funil_quadro').map((l) => [String(l.nome), String(l.id)]));
    },
    async inserirQuadros(nomes) {
      chamadas.push({ tabela: 'funil_quadro', operacao: 'inserir', linhas: nomes });
      const saida: Mapa = new Map();
      for (const nome of nomes) {
        const id = `q${++seq}`;
        de('funil_quadro').push({ id, nome });
        saida.set(nome, id);
      }
      return saida;
    },
    async inserirNovos(t, linhas) {
      chamadas.push({ tabela: t, operacao: 'inserir', linhas });
      const saida: Mapa = new Map();
      for (const l of linhas) {
        // ON CONFLICT (bubble_id) DO NOTHING
        if (de(t).some((x) => x.bubble_id === l.bubble_id)) continue;
        const id = `${t}-${++seq}`;
        de(t).push({ ...l, id });
        saida.set(String(l.bubble_id), id);
      }
      return saida;
    },
    async atualizar(t, mudancas) {
      chamadas.push({ tabela: t, operacao: 'atualizar', linhas: mudancas });
      for (const { id, valores } of mudancas) {
        const alvo = de(t).find((l) => l.id === id);
        assert.ok(alvo, `atualizar só pode mirar linha existente (${t} ${id})`);
        assert.ok(alvo.bubble_id, 'e só linha que veio do Bubble');
        Object.assign(alvo, valores);
      }
      return mudancas.length;
    },
    async arquivar(t, ids) {
      chamadas.push({ tabela: t, operacao: 'arquivar', linhas: ids });
      for (const id of ids) {
        const alvo = de(t).find((l) => l.id === id);
        assert.ok(alvo?.bubble_id, 'arquivar só linha que veio do Bubble');
        alvo.arquivado = true;
      }
      return ids.length;
    },
    async filhosDe(t, paiIds) {
      return de(t)
        .filter((l) => paiIds.includes(String(l[FILHAS[t].pai])))
        .map((l) => ({ ...l }));
    },
    async inserirFilhos(t, linhas) {
      chamadas.push({ tabela: t, operacao: 'inserirFilhos', linhas });
      de(t).push(...linhas.map((l) => ({ ...l, ...(FILHAS[t].temId ? { id: ++seq } : {}) })));
      return linhas.length;
    },
    async atualizarFilhos(t, linhas) {
      chamadas.push({ tabela: t, operacao: 'atualizarFilhos', linhas });
      for (const l of linhas) {
        const alvo = de(t).find((x) =>
          FILHAS[t].temId && l.id !== undefined ? x.id === l.id : mesmaChave(t, x, l),
        );
        assert.ok(alvo, 'atualizarFilhos só mira filho existente');
        Object.assign(alvo, l);
      }
      return linhas.length;
    },
    async removerFilhos(t, linhas) {
      chamadas.push({ tabela: t, operacao: 'removerFilhos', linhas });
      for (const l of linhas) {
        assert.equal(l.origem_bubble, true, 'só remove o que veio do Bubble');
        const i = de(t).findIndex((x) => (FILHAS[t].temId ? x.id === l.id : mesmaChave(t, x, l)));
        de(t).splice(i, 1);
      }
      return linhas.length;
    },
  };
  return { banco, tabelas, chamadas };
}

function fonteFalsa(
  dados: Partial<Record<TipoLido, Array<Record<string, unknown>>>>,
  erros: Partial<Record<TipoLido, number>> = {},
): Fonte {
  return async (tipo): Promise<ResultadoBusca> =>
    erros[tipo] ? { ok: false, status: erros[tipo] as number } : { ok: true, linhas: dados[tipo] ?? [] };
}

const linha = (r: Awaited<ReturnType<typeof sincronizar>>, tabela: string) => {
  const l = r.tabelas.find((t) => t.tabela === tabela);
  assert.ok(l, `tabela ${tabela} no resultado`);
  return l;
};

/* ------------------------------------------------------ funções puras -- */

test('soNovos deixa passar só _id que não existe aqui', () => {
  const existentes: Mapa = new Map([['a', 'uuid-a']]);
  const saida = soNovos([{ _id: 'a' }, { _id: 'b' }, { _id: 'c' }], existentes);
  assert.deepEqual(saida.map((r) => r._id), ['b', 'c']);
});

test('soNovos descarta _id repetido no lote e registro sem _id', () => {
  const saida = soNovos([{ _id: 'b' }, { _id: 'b' }, { nome: 'sem id' }], new Map());
  assert.deepEqual(saida.map((r) => r._id), ['b']);
});

test('iguais: coluna date x ISO completo, Date x timestamptz, nulo x ausente', () => {
  assert.equal(iguais(new Date('2026-09-15T03:00:00.000Z'), '2026-09-15'), true);
  assert.equal(iguais(new Date('2026-09-15T12:00:00.000Z'), '2026-09-15T12:00:00+00:00'), true);
  assert.equal(iguais(undefined, null), true);
  assert.equal(iguais('a', 'b'), false);
  assert.equal(iguais({ x: 1 }, { x: 1 }), true);
});

test('diferencas ignora criado_em/bubble_id e referência não resolvida', () => {
  const atual = { id: 'x', bubble_id: 'b', nome: 'A', cliente_id: 'cli-1', criado_em: '2020-01-01' };
  const d = diferencas({ bubble_id: 'b', nome: 'B', cliente_id: null, criado_em: new Date() }, atual);
  assert.deepEqual(d, { nome: 'B' });
});

/* ---------------------------------------------------------- sincronizar -- */

const ANTIGO = {
  cliente: [{ id: 'cli-antigo', bubble_id: 'c1', nome_razao: 'Nome daqui', arquivado: false }],
  operacao: [{ id: 'op-antiga', bubble_id: 'o1', identificador: 'Op daqui', arquivado: false }],
};

test('existente é atualizado com o valor do Bubble; novo entra', async () => {
  const { banco, tabelas, chamadas } = bancoFalso(ANTIGO);
  const r = await sincronizar(
    banco,
    fonteFalsa({
      cliente: [
        { _id: 'c1', 'nome/razão': 'Nome mudado no Bubble' },
        { _id: 'c2', 'nome/razão': 'Cliente Novo' },
      ],
    }),
  );

  assert.equal(linha(r, 'cliente').novos, 1);
  assert.equal(linha(r, 'cliente').atualizados, 1);
  const c1 = tabelas.cliente.find((l) => l.bubble_id === 'c1');
  assert.equal(c1?.nome_razao, 'Nome mudado no Bubble', 'o Bubble ganha');
  assert.equal(c1?.id, 'cli-antigo', 'mesma linha, não duplicou');
  assert.equal(tabelas.cliente.length, 2);
  const pedido = chamadas.find((c) => c.tabela === 'cliente' && c.operacao === 'atualizar');
  assert.ok(pedido);
  assert.ok(!('criado_em' in (pedido.linhas[0] as { valores: Linha }).valores), 'não mexe em criado_em');
});

test('registro criado só aqui (sem bubble_id) nunca é tocado, nem arquivado', async () => {
  const { banco, tabelas, chamadas } = bancoFalso({
    cliente: [
      { id: 'local', bubble_id: null, nome_razao: 'Só aqui', arquivado: false },
      { id: 'cli-antigo', bubble_id: 'c1', nome_razao: 'X', arquivado: false },
    ],
  });
  await sincronizar(banco, fonteFalsa({ cliente: [{ _id: 'c1', 'nome/razão': 'X' }] }));

  const local = tabelas.cliente.find((l) => l.id === 'local');
  assert.deepEqual(local, { id: 'local', bubble_id: null, nome_razao: 'Só aqui', arquivado: false });
  assert.equal(chamadas.filter((c) => c.tabela === 'cliente').length, 0, 'nem pedido de escrita');
});

test('sumiu do Bubble com leitura completa: arquiva, não apaga', async () => {
  const { banco, tabelas } = bancoFalso({
    cliente: [
      { id: 'a', bubble_id: 'c1', nome_razao: 'Fica', arquivado: false },
      { id: 'b', bubble_id: 'c9', nome_razao: 'Sumiu', arquivado: false },
    ],
    funil_cartao: [{ id: 'k-velho', bubble_id: 'k9', empresa: 'Sumiu', arquivado: false }],
    etapa_operacao: [{ id: 'e-velha', bubble_id: 'e9', operacao_id: 'op-antiga' }],
  });
  const r = await sincronizar(
    banco,
    fonteFalsa({ cliente: [{ _id: 'c1', 'nome/razão': 'Fica' }], funilcartao: [{ _id: 'k1', Empresa: 'Outro' }] }),
  );

  assert.equal(linha(r, 'cliente').arquivados, 1);
  assert.equal(tabelas.cliente.length, 2, 'nada apagado');
  assert.equal(tabelas.cliente.find((l) => l.id === 'b')?.arquivado, true);
  assert.equal(tabelas.cliente.find((l) => l.id === 'a')?.arquivado, false);
  assert.equal(tabelas.funil_cartao.find((l) => l.id === 'k-velho')?.arquivado, true);
  assert.equal(tabelas.etapa_operacao.length, 1, 'etapa não tem arquivado: fica como está');
  assert.equal(linha(r, 'etapa_operacao').arquivados, 0);
});

test('tipo que deu erro (404 ou 500) não arquiva nada daquele tipo', async () => {
  const inicial = {
    cliente: [{ id: 'a', bubble_id: 'c9', nome_razao: 'X', arquivado: false }],
    operacao: [{ id: 'o', bubble_id: 'o9', identificador: 'Y', arquivado: false }],
    fornecedor: [{ id: 'f', bubble_id: 'f9', nome_fundo: 'Z', arquivado: false }],
  };
  const { banco, tabelas } = bancoFalso(inicial);
  const r = await sincronizar(banco, fonteFalsa({ fornecedor: [{ _id: 'f1' }] }, { cliente: 404, opera__o: 500 }));

  assert.equal(tabelas.cliente[0].arquivado, false);
  assert.equal(tabelas.operacao[0].arquivado, false);
  assert.equal(tabelas.fornecedor.find((l) => l.id === 'f')?.arquivado, true, 'o que leu bem arquiva');
  assert.deepEqual(r.naoExpostos, ['cliente']);
  assert.equal(r.erros.length, 1);
  assert.match(r.erros[0], /operação.*500/);
});

test('Bubble devolve zero registros: não arquiva o banco inteiro, avisa', async () => {
  const { banco, tabelas } = bancoFalso(ANTIGO);
  const r = await sincronizar(banco, fonteFalsa({}));
  assert.equal(tabelas.cliente[0].arquivado, false);
  assert.ok(r.avisos.some((a) => /cliente.*zero registros/.test(a)));
});

test('data type fora da API vira "não exposto", sem erro, e o resto segue', async () => {
  const { banco, tabelas } = bancoFalso(ANTIGO);
  const r = await sincronizar(
    banco,
    fonteFalsa(
      { fornecedor: [{ _id: 'f1' }], etapas_opera__o: [{ _id: 'e9', 'qual operação etapa': 'o1' }] },
      { cliente: 404, tbl_infocliente: 404, opera__o: 404, tbl_observa__es: 404 },
    ),
  );

  assert.deepEqual(r.naoExpostos, ['cliente', 'tbl_infocliente', 'operação', 'tbl_observações']);
  assert.deepEqual(r.erros, []);
  assert.equal(linha(r, 'fornecedor').novos, 1);
  // A operação o1 já existe aqui: a etapa nova acha o pai mesmo com operação fora da API.
  assert.equal(tabelas.etapa_operacao[0].operacao_id, 'op-antiga');
});

test('filho novo em pai antigo entra (e-mail, visualizador, observação, declínio)', async () => {
  const { banco, tabelas } = bancoFalso({
    ...ANTIGO,
    fornecedor: [{ id: 'forn-1', bubble_id: 'f1', nome_fundo: 'F' }],
  });
  const r = await sincronizar(
    banco,
    fonteFalsa({
      user: [{ _id: 'u1', authentication: { email: { email: 'Ana@Exemplo.com' } } }],
      fornecedor: [{ _id: 'f1', 'nome do fundo': 'F' }],
      cliente: [
        { _id: 'c1', 'nome/razão': 'Nome daqui', 'quem visualiza': ['u1'] },
        { _id: 'c2', 'quem visualiza': ['u1'] },
      ],
      tbl_infocliente: [
        { qualcliente: 'c1', emailcliente: 'extra@cliente.com' },
        { qualcliente: 'c2', emailcliente: 'novo@cliente.com' },
      ],
      opera__o: [{ _id: 'o1', 'observação ': ['obs na antiga'], 'declínios ': ['f1'] }],
      tbl_observa__es: [{ 'cpo.qualoperação': 'o1', 'cpo.observação': 'avulsa na antiga' }],
    }),
  );

  const c2 = tabelas.cliente.find((l) => l.bubble_id === 'c2')?.id;
  assert.deepEqual(
    tabelas.cliente_email.map((e) => [e.cliente_id, e.email, e.origem_bubble]),
    [
      ['cli-antigo', 'extra@cliente.com', true],
      [c2, 'novo@cliente.com', true],
    ],
    'pai antigo (c1) ganha o e-mail',
  );
  assert.equal(
    tabelas.cliente_visualizador.some((v) => v.cliente_id === 'cli-antigo' && v.perfil_id === 'perfil-ana'),
    true,
  );
  assert.deepEqual(
    tabelas.operacao_observacao.map((o) => [o.operacao_id, o.texto]),
    [
      ['op-antiga', 'obs na antiga'],
      ['op-antiga', 'avulsa na antiga'],
    ],
  );
  assert.deepEqual(tabelas.operacao_declinio, [
    { operacao_id: 'op-antiga', fornecedor_id: 'forn-1', origem_bubble: true },
  ]);
  assert.equal(linha(r, 'cliente_email').novos, 2);
});

test('filho que saiu do Bubble é removido; o criado aqui e o da carga ficam', async () => {
  const { banco, tabelas } = bancoFalso({
    ...ANTIGO,
    cliente_email: [
      { id: 1, cliente_id: 'cli-antigo', email: 'saiu@cliente.com', origem_bubble: true },
      { id: 2, cliente_id: 'cli-antigo', email: 'local@cliente.com', origem_bubble: false },
      { id: 3, cliente_id: 'cli-antigo', email: 'fica@cliente.com', origem_bubble: true },
      { id: 4, cliente_id: 'cli-antigo', email: 'carga@cliente.com', origem_bubble: false },
    ],
  });
  const r = await sincronizar(
    banco,
    fonteFalsa({
      cliente: [{ _id: 'c1', 'nome/razão': 'Nome daqui' }],
      tbl_infocliente: [
        { qualcliente: 'c1', emailcliente: 'fica@cliente.com' },
        { qualcliente: 'c1', emailcliente: 'carga@cliente.com' },
      ],
    }),
  );

  assert.deepEqual(tabelas.cliente_email.map((e) => e.email).sort(), [
    'carga@cliente.com',
    'fica@cliente.com',
    'local@cliente.com',
  ]);
  assert.equal(linha(r, 'cliente_email').removidos, 1);
  assert.equal(
    tabelas.cliente_email.find((e) => e.email === 'carga@cliente.com')?.origem_bubble,
    true,
    'o Bubble ainda tem: passa a ser reconhecido como dele',
  );
});

test('sem ler a fonte do filho, nada é removido', async () => {
  const inicial = {
    ...ANTIGO,
    cliente_email: [{ id: 1, cliente_id: 'cli-antigo', email: 'a@cliente.com', origem_bubble: true }],
    cliente_visualizador: [{ cliente_id: 'cli-antigo', perfil_id: 'perfil-ana', origem_bubble: true }],
    operacao_observacao: [{ id: 5, operacao_id: 'op-antiga', texto: 'velha', origem_bubble: true }],
  };
  const { banco, tabelas } = bancoFalso(inicial);
  await sincronizar(
    banco,
    fonteFalsa(
      { cliente: [{ _id: 'c1' }], opera__o: [{ _id: 'o1' }] },
      { tbl_infocliente: 404, user: 404, tbl_observa__es: 404 },
    ),
  );

  assert.equal(tabelas.cliente_email.length, 1, 'tbl_infocliente fora da API: mantém');
  assert.equal(tabelas.cliente_visualizador.length, 1, 'user fora da API: mantém');
  assert.equal(tabelas.operacao_observacao.length, 1, 'metade da fonte das observações: mantém');
});

test('observações repetidas e checklist mudado no Bubble', async () => {
  const { banco, tabelas } = bancoFalso({
    ...ANTIGO,
    etapa_operacao: [{ id: 'et-1', bubble_id: 'e1', operacao_id: 'op-antiga' }],
    etapa_checklist_item: [
      {
        id: 10,
        etapa_id: 'et-1',
        chave: 'regulamento',
        rotulo: 'Regulamento',
        descricao: 'velho',
        valor: null,
        ordem: 8,
        origem_bubble: true,
      },
    ],
    operacao_observacao: [
      { id: 1, operacao_id: 'op-antiga', texto: 'igual', origem_bubble: true },
      { id: 2, operacao_id: 'op-antiga', texto: 'igual', origem_bubble: true },
    ],
  });
  const r = await sincronizar(
    banco,
    fonteFalsa({
      opera__o: [{ _id: 'o1', 'observação ': ['igual'] }],
      etapas_opera__o: [{ _id: 'e1', 'qual operação etapa': 'o1', RegulamentoDesc: 'novo' }],
    }),
  );

  assert.equal(tabelas.etapa_checklist_item[0].descricao, 'novo');
  assert.equal(linha(r, 'etapa_checklist_item').atualizados, 1);
  assert.equal(tabelas.operacao_observacao.length, 1, 'a segunda ocorrência saiu do Bubble');
  assert.equal(linha(r, 'operacao_observacao').removidos, 1);
});

test('ordem de dependência: operação e etapa novas apontam para os ids daqui', async () => {
  const { banco, tabelas } = bancoFalso(ANTIGO);
  await sincronizar(
    banco,
    fonteFalsa({
      cliente: [{ _id: 'c1' }, { _id: 'c2', 'nome/razão': 'Novo' }],
      opera__o: [
        { _id: 'o1' },
        { _id: 'o2', 'qual cliente': 'c2', 'Status Atual da Operação': 'Em andamento' },
        { _id: 'o3', 'qual cliente': 'c1' },
      ],
      etapas_opera__o: [
        { _id: 'e1', 'qual operação etapa': 'o2', instrumento: ['FIDC'], RegulamentoDesc: 'ok' },
        { _id: 'e2', 'qual operação etapa': 'o1' },
        { _id: 'e3', 'qual operação etapa': 'nao-existe' },
      ],
    }),
  );

  const c2 = tabelas.cliente.find((l) => l.bubble_id === 'c2')?.id;
  const o2 = tabelas.operacao.find((l) => l.bubble_id === 'o2');
  const o3 = tabelas.operacao.find((l) => l.bubble_id === 'o3');
  assert.equal(o2?.cliente_id, c2, 'cliente novo, inserido antes');
  assert.equal(o2?.status_operacao_id, 1);
  assert.equal(o3?.cliente_id, 'cli-antigo', 'cliente que já existia');

  const etapas = tabelas.etapa_operacao;
  assert.deepEqual(etapas.map((e) => e.bubble_id), ['e1', 'e2'], 'etapa sem operação fica de fora');
  assert.equal(etapas[0].operacao_id, o2?.id);
  assert.equal(etapas[1].operacao_id, 'op-antiga', 'etapa nova em operação antiga entra');
  assert.deepEqual(tabelas.etapa_instrumento, [
    { etapa_id: etapas[0].id, tipo_operacao_id: 1, origem_bubble: true },
  ]);
  assert.equal(tabelas.etapa_checklist_item.length, 1);
});

test('rodar duas vezes: a segunda não escreve nada', async () => {
  const { banco, chamadas } = bancoFalso();
  const fonte = fonteFalsa({
    fornecedor: [{ _id: 'f1', 'nome do fundo': 'Fundo', 'tipos de operações': ['FIDC'] }],
    cliente: [{ _id: 'c1', 'nome/razão': 'Cli', 'quem visualiza': ['u1'] }],
    user: [{ _id: 'u1', authentication: { email: { email: 'ana@exemplo.com' } } }],
    funilcartao: [{ _id: 'k1', Quadro: 'Comercial', Empresa: 'X', DataKB: '2026-09-15T03:00:00.000Z' }],
  });
  const primeira = await sincronizar(banco, fonte);
  assert.equal(linha(primeira, 'fornecedor').novos, 1);
  assert.equal(linha(primeira, 'fornecedor_tipo_operacao').novos, 1);
  assert.equal(linha(primeira, 'cliente_visualizador').novos, 1);
  assert.equal(linha(primeira, 'funil_quadro').novos, 1);
  assert.equal(linha(primeira, 'funil_cartao').novos, 1);

  const antes = chamadas.length;
  const segunda = await sincronizar(banco, fonte);
  assert.ok(
    segunda.tabelas.every((t) => t.novos + t.atualizados + t.arquivados + t.removidos === 0),
    'zero em todas as tabelas',
  );
  assert.equal(chamadas.length, antes, 'nem pede escrita');
});

test('erro do banco numa tabela é relatado e não derruba as outras', async () => {
  const { banco } = bancoFalso();
  banco.inserirNovos = async (t) => {
    if (t === 'cliente') throw new Error('violates check constraint');
    return new Map();
  };
  const r = await sincronizar(banco, fonteFalsa({ cliente: [{ _id: 'c1' }], fornecedor: [{ _id: 'f1' }] }));
  assert.deepEqual(r.erros, ['cliente: violates check constraint']);
});

/* ------------------------------------------------------------ permissão -- */

const fabio = { email: 'Fabio.TI@exemplo.com', nivel_acesso: 'master', ativo: true };

test('só a conta de SINCRONIZACAO_EMAIL pode, e só se for master ativo', () => {
  assert.equal(podeSincronizar(fabio, 'fabio.ti@exemplo.com '), true);
  assert.equal(podeSincronizar({ ...fabio, email: 'outro@exemplo.com' }, 'fabio.ti@exemplo.com'), false);
  assert.equal(podeSincronizar({ ...fabio, nivel_acesso: 'indicante' }, 'fabio.ti@exemplo.com'), false);
  assert.equal(podeSincronizar({ ...fabio, ativo: false }, 'fabio.ti@exemplo.com'), false);
});

test('sem SINCRONIZACAO_EMAIL ninguém pode', () => {
  assert.equal(podeSincronizar(fabio, undefined), false);
  assert.equal(podeSincronizar(fabio, '  '), false);
  assert.equal(podeSincronizar({ ...fabio, email: '' }, ''), false);
});
