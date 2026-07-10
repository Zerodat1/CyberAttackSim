#!/usr/bin/env bash
#
# Restores a PostgreSQL dump produced by backup.sh. This is destructive —
# it drops and recreates the target database — so it asks for confirmation
# unless run with --yes.
#
# Usage: ./deploy/backup/restore.sh /opt/code/backups/db-20260101-030000.dump [--yes]
set -euo pipefail
cd "$(dirname "$0")/../.."

DUMP_FILE="${1:?Usage: restore.sh <dump-file> [--yes]}"
CONFIRM="${2:-}"

if [ ! -f "$DUMP_FILE" ]; then
  echo "Dump file not found: $DUMP_FILE" >&2
  exit 1
fi

if [ "$CONFIRM" != "--yes" ]; then
  read -r -p "This will DROP and recreate the 'code' database, replacing all current data. Continue? [y/N] " reply
  case "$reply" in
    y|Y) ;;
    *) echo "Aborted."; exit 1 ;;
  esac
fi

echo "==> Dropping and recreating the database"
docker compose exec -T postgres psql -U code -d postgres -c "DROP DATABASE IF EXISTS code;"
docker compose exec -T postgres psql -U code -d postgres -c "CREATE DATABASE code OWNER code;"

echo "==> Restoring from $DUMP_FILE"
docker compose exec -T postgres pg_restore -U code -d code --no-owner < "$DUMP_FILE"

echo "==> Restore complete."
