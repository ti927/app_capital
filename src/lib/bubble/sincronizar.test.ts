import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ResultadoBusca } from './api.ts';
import type { Linha, Mapa } from './mapeamento.ts';
import { podeSincronizar } from './permissao.ts';
import { soNovos, sincronizar, type Banco, type Fonte, type TipoLido } from './sincronizar.ts';

/**
 * A regra que se testa: a sincronização **só insere o que é novo**.
 * Registro cujo `_id` já existe aqui não é tocado; filho só entra pendurado
 * num pai que acabou de entrar; nada é atualizado nem apagado.
 *
 * O banco é um dublê em memória que implementa `Banco` — a mesma interface
 * do adaptador Supabase, que não tem update nem delete. O dublê ainda grava
 * cada chamada, para o teste afirmar o que foi pedido, não só o resultado.
 */

type Tabelas = Record<string, Linha[]>;

function bancoFalso(inicial: Tabelas = {}) {
  const tabelas: Tabelas = structuredClone(inicial);
  const chamadas: Array<{ tabela: string; linhas: Linha[] }> = [];
  let seq = 0;
  const de = (t: string) => (tabelas[t] ??= []);

  const banco: Banco = {
    async idsPorBubble(t) {
      return new Map(de(t).filter((l) => l.bubble_id).map((l) => [String(l.bubble_id), String(l.id)]));
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
      chamadas.push({ tabela: 'funil_quadro', linhas: nomes.map((nome) => ({ nome })) });
      const saida: Mapa = new Map();
      for (const nome of nomes) {
        const id = `q${++seq}`;
        de('funil_quadro').push({ id, nome });
        saida.set(nome, id);
      }
      return saida;
    },
    async inserirNovos(t, linhas) {
      chamadas.push({ tabela: t, linhas });
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
    async inserirFilhos(t, linhas) {
      chamadas.push({ tabela: t, linhas });
      de(t).push(...linhas);
      return linhas.length;
    },
  };
  return { banco, tabelas, chamadas };
}

function fonteFalsa(dados: Partial<Record<TipoLido, Array<Record<string, unknown>>>>, erros: Partial<Record<TipoLido, number>> = {}): Fonte {
  return async (tipo): Promise<ResultadoBusca> =>
    erros[tipo] ? { ok: false, status: erros[tipo] as number } : { ok: true, linhas: dados[tipo] ?? [] };
}

const novos = (r: Awaited<ReturnType<typeof sincronizar>>, tabela: string) =>
  r.novos.find((n) => n.tabela === tabela)?.quantidade;

/* -------------------------------------------------------------- soNovos -- */

test('soNovos deixa passar só _id que não existe aqui', () => {
  const existentes: Mapa = new Map([['a', 'uuid-a']]);
  const saida = soNovos([{ _id: 'a' }, { _id: 'b' }, { _id: 'c' }], existentes);
  assert.deepEqual(saida.map((r) => r._id), ['b', 'c']);
});

test('soNovos descarta _id repetido no lote e registro sem _id', () => {
  const saida = soNovos([{ _id: 'b' }, { _id: 'b' }, { nome: 'sem id' }], new Map());
  assert.deepEqual(saida.map((r) => r._id), ['b']);
});

/* ---------------------------------------------------------- sincronizar -- */

const ANTIGO = {
  cliente: [{ id: 'cli-antigo', bubble_id: 'c1', nome_razao: 'Nome daqui' }],
  operacao: [{ id: 'op-antiga', bubble_id: 'o1', identificador: 'Op daqui' }],
};

test('cliente que já existe não é atualizado; só o novo entra', async () => {
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

  assert.equal(novos(r, 'cliente'), 1);
  const pedido = chamadas.find((c) => c.tabela === 'cliente');
  assert.deepEqual(pedido?.linhas.map((l) => l.bubble_id), ['c2'], 'nem chega a pedir o c1');
  const c1 = tabelas.cliente.find((l) => l.bubble_id === 'c1');
  assert.equal(c1?.nome_razao, 'Nome daqui', 'o que já existe fica como estava');
  assert.equal(tabelas.cliente.length, 2);
});

test('filho só entra pendurado em pai novo', async () => {
  const { banco, tabelas } = bancoFalso(ANTIGO);
  const r = await sincronizar(
    banco,
    fonteFalsa({
      user: [{ _id: 'u1', authentication: { email: { email: 'Ana@Exemplo.com' } } }],
      cliente: [
        { _id: 'c1', 'quem visualiza': ['u1'] },
        { _id: 'c2', 'quem visualiza': ['u1'] },
      ],
      tbl_infocliente: [
        { qualcliente: 'c1', emailcliente: 'velho@cliente.com' },
        { qualcliente: 'c2', emailcliente: 'novo@cliente.com' },
      ],
      opera__o: [{ _id: 'o1', 'observação ': ['obs na antiga'] }],
      tbl_observa__es: [{ 'cpo.qualoperação': 'o1', 'cpo.observação': 'avulsa na antiga' }],
    }),
  );

  const c2 = tabelas.cliente.find((l) => l.bubble_id === 'c2')?.id;
  assert.deepEqual(tabelas.cliente_email, [{ cliente_id: c2, email: 'novo@cliente.com' }]);
  assert.deepEqual(tabelas.cliente_visualizador, [{ cliente_id: c2, perfil_id: 'perfil-ana' }]);
  assert.equal(novos(r, 'operacao'), 0);
  assert.equal(tabelas.operacao_observacao, undefined, 'operação antiga não ganha observação');
});

test('ordem de dependência: operação e etapa novas apontam para os ids daqui', async () => {
  const { banco, tabelas } = bancoFalso(ANTIGO);
  await sincronizar(
    banco,
    fonteFalsa({
      cliente: [{ _id: 'c2', 'nome/razão': 'Novo' }],
      opera__o: [
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
  assert.deepEqual(tabelas.etapa_instrumento, [{ etapa_id: etapas[0].id, tipo_operacao_id: 1 }]);
  assert.equal(tabelas.etapa_checklist_item.length, 1);
});

test('rodar duas vezes não traz nada na segunda', async () => {
  const { banco, chamadas } = bancoFalso();
  const fonte = fonteFalsa({
    fornecedor: [{ _id: 'f1', 'nome do fundo': 'Fundo', 'tipos de operações': ['FIDC'] }],
    cliente: [{ _id: 'c1' }],
    funilcartao: [{ _id: 'k1', Quadro: 'Comercial', Empresa: 'X' }],
  });
  const primeira = await sincronizar(banco, fonte);
  assert.equal(novos(primeira, 'fornecedor'), 1);
  assert.equal(novos(primeira, 'fornecedor_tipo_operacao'), 1);
  assert.equal(novos(primeira, 'funil_quadro'), 1);
  assert.equal(novos(primeira, 'funil_cartao'), 1);

  const antes = chamadas.length;
  const segunda = await sincronizar(banco, fonte);
  assert.ok(segunda.novos.every((n) => n.quantidade === 0), 'zero em todas as tabelas');
  assert.equal(chamadas.length, antes, 'nem pede inserção');
});

test('data type fora da API vira erro, e o resto segue', async () => {
  const { banco, tabelas } = bancoFalso(ANTIGO);
  const r = await sincronizar(
    banco,
    fonteFalsa(
      { fornecedor: [{ _id: 'f1' }], etapas_opera__o: [{ _id: 'e9', 'qual operação etapa': 'o1' }] },
      { cliente: 404, opera__o: 404 },
    ),
  );

  assert.equal(r.erros.length, 2);
  assert.match(r.erros[0], /404/);
  assert.equal(novos(r, 'fornecedor'), 1);
  // A operação o1 já existe aqui: a etapa nova acha o pai mesmo com operação fora da API.
  assert.equal(tabelas.etapa_operacao[0].operacao_id, 'op-antiga');
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
