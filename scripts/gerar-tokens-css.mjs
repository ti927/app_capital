#!/usr/bin/env node
// Gera src/app/tokens.css a partir de design/design-system/tokens.json.
//   npm run tokens
//
// O tokens.json e a fonte da verdade — este arquivo nao se edita a mao.
// Rode de novo quando o design system for atualizado.
import fs from 'node:fs';

const ORIGEM = 'design/design-system/tokens.json';
const DESTINO = 'src/app/tokens.css';

const t = JSON.parse(fs.readFileSync(ORIGEM, 'utf8'));

const linhas = [];
const claro = [];
const escuro = [];

// --- cor: valor simples ou { light, dark } ---------------------------------
for (const tk of t.color.tokens) {
  if (typeof tk.value === 'string') {
    claro.push(`  --${tk.name}: ${tk.value};`);
  } else {
    claro.push(`  --${tk.name}: ${tk.value.light};`);
    escuro.push(`  --${tk.name}: ${tk.value.dark};`);
  }
}

// --- escalas sem tema ------------------------------------------------------
for (const grupo of ['spacing', 'radius', 'shadow', 'size', 'borderWidth', 'opacity', 'zIndex']) {
  for (const tk of t[grupo]?.tokens ?? []) {
    claro.push(`  --${tk.name}: ${typeof tk.value === 'string' ? tk.value : tk.value.light};`);
    if (typeof tk.value !== 'string') escuro.push(`  --${tk.name}: ${tk.value.dark};`);
  }
}

// --- familias tipograficas -------------------------------------------------
// next/font injeta --fonte-sans e --fonte-mono; o fallback e a pilha do design system.
claro.push(`  --font-sans: var(--fonte-sans), ${t.type.families.sans};`);
claro.push(`  --font-mono: var(--fonte-mono), ${t.type.families.mono};`);

linhas.push('/* Gerado por scripts/gerar-tokens-css.mjs a partir de');
linhas.push(' * design/design-system/tokens.json. Nao edite a mao. */');
linhas.push('');
linhas.push(':root {');
linhas.push(...claro);
linhas.push('}');
linhas.push('');
linhas.push('@media (prefers-color-scheme: dark) {');
linhas.push('  :root:not([data-theme="light"]) {');
linhas.push(...escuro.map(l => '  ' + l));
linhas.push('  }');
linhas.push('}');
linhas.push('');
linhas.push(':root[data-theme="dark"] {');
linhas.push(...escuro);
linhas.push('}');
linhas.push('');

// --- estilos de texto como classes utilitarias -----------------------------
linhas.push('/* Estilos de texto. O nome da classe e o nome do estilo no design system. */');
for (const grupo of t.type.groups) {
  const familia = grupo.family === 'mono' ? 'var(--font-mono)' : 'var(--font-sans)';
  for (const e of grupo.styles) {
    const props = [`  font-family: ${familia};`, `  font-size: ${e.fontSize};`];
    if (e.lineHeight) props.push(`  line-height: ${e.lineHeight};`);
    if (e.fontWeight) props.push(`  font-weight: ${e.fontWeight};`);
    if (e.letterSpacing) props.push(`  letter-spacing: ${e.letterSpacing};`);
    if (e.textTransform) props.push(`  text-transform: ${e.textTransform};`);
    linhas.push(`.t-${e.name} {`);
    linhas.push(...props);
    linhas.push('}');
  }
}
linhas.push('');

fs.mkdirSync('src/app', { recursive: true });
fs.writeFileSync(DESTINO, linhas.join('\n'));

const nCor = t.color.tokens.length;
const nTexto = t.type.groups.reduce((n, g) => n + g.styles.length, 0);
console.log(`${DESTINO}: ${nCor} tokens de cor, ${nTexto} estilos de texto, ${escuro.length} sobrescritas no tema escuro.`);

// --- copia o CSS dos componentes do design system --------------------------
const CSS_COMPONENTES = 'design/design-system/components/bundle.css';
fs.copyFileSync(CSS_COMPONENTES, 'src/app/design-system.css');
console.log('src/app/design-system.css: copiado de ' + CSS_COMPONENTES);
