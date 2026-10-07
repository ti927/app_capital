#!/usr/bin/env node
/**
 * A mesma sincronização do botão "Sincronizar com o Bubble"
 * (specs/10-sincronizacao-bubble.md), pela linha de comando:
 *
 *   npx tsx scripts/sincronizar-bubble.mts            live (padrão)
 *   npx tsx scripts/sincronizar-bubble.mts version-test
 *
 * Mesmo código de src/lib/bubble — só troca a sessão do usuário pela
 * service_role do .env, porque aqui não há navegador logado. Imprime o
 * resultado por tabela (novos, atualizados, arquivados, removidos) e os erros.
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { sincronizar } from '../src/lib/bubble/sincronizar';
import { bancoSupabase } from '../src/lib/bubble/banco-supabase';
import { buscarTipo, urlDaRaiz, type RaizBubble } from '../src/lib/bubble/api';

const env = Object.fromEntries(
  fs
    .readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);

const raiz = (process.argv[2] === 'version-test' ? 'version-test' : 'live') as RaizBubble;
const url = urlDaRaiz(env.BUBBLE_APP_URL.replace(/\/+$/, ''), raiz);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const inicio = Date.now();
const resultado = await sincronizar(bancoSupabase(supabase), (tipo) => buscarTipo(url, env.BUBBLE_API_KEY, tipo));
console.log(`Bubble ${raiz} → app novo, ${((Date.now() - inicio) / 1000).toFixed(1)}s`);
console.log(JSON.stringify(resultado, null, 2));
