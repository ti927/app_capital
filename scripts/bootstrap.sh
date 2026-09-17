#!/usr/bin/env bash
# Inicializa o repositório e publica no GitHub.
#   bash scripts/bootstrap.sh [nome-do-repo]
set -euo pipefail

REPO="${1:-lure-capital}"

command -v git >/dev/null || { echo "git não encontrado."; exit 1; }
command -v gh  >/dev/null || { echo "GitHub CLI (gh) não encontrado: https://cli.github.com"; exit 1; }

gh auth status >/dev/null 2>&1 || { echo "Rode 'gh auth login' primeiro."; exit 1; }

if [ -d .git ]; then
  echo "Já existe um repositório git aqui. Nada a fazer."
  exit 0
fi

# Confere que o .gitignore está no lugar antes do primeiro add
[ -f .gitignore ] || { echo ".gitignore ausente. Não vou commitar sem ele."; exit 1; }
grep -q '^\.env$' .gitignore || { echo ".gitignore não ignora .env. Corrija antes."; exit 1; }

echo "Inicializando..."
git init -b main
git add .

# Rede de segurança: nada de segredo no primeiro commit
if git diff --cached --name-only | grep -Eq '(^|/)\.env$|\.pem$|id_rsa'; then
  echo "ERRO: arquivo sensível no staging. Abortado."
  git diff --cached --name-only
  exit 1
fi

git commit -m "chore: documentação de migração, esquema inicial e configuração"

echo "Criando repositório privado '$REPO' no GitHub..."
gh repo create "$REPO" --private --source=. --push

echo
echo "Pronto: $(gh repo view --json url -q .url)"
echo
echo "Próximo passo:"
echo "  claude          # aceite o diálogo de confiança da pasta"
echo "  e cole docs/primeiro-prompt.md"
