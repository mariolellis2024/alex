#!/bin/sh
set -e

echo "Pushing database schema..."
npx prisma db push --skip-generate

echo "Starting Next.js..."
exec "$@"
