import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

// eslint-config-next ainda é config antiga (eslintrc). FlatCompat faz a ponte
// para o formato plano do ESLint 9.
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

export default [
  { ignores: ['.next/**', 'node_modules/**', 'design/**', 'dados/**', 'scripts/**', 'db/**'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
];
