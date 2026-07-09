#!/bin/sh
set -e

echo "Aplicando schema no banco (prisma db push)..."
i=0
until npx prisma db push --accept-data-loss; do
  i=$((i + 1))
  if [ "$i" -ge 12 ]; then
    echo "ERRO: banco de dados inacessivel apos 12 tentativas. Verifique a variavel DATABASE_URL (host deve ser <projeto>_app-postgres no EasyPanel)." >&2
    exit 1
  fi
  echo "Banco indisponivel, nova tentativa em 5s... ($i/12)"
  sleep 5
done

echo "Starting Next.js..."
exec "$@"
