#!/usr/bin/env bash
#
# Nightly backup of the PostgreSQL database and the uploaded-files volume
# (only relevant when object storage isn't configured and images fall back
# to local disk — see backend/src/storage/storage.service.ts). Keeps the
# last BACKUP_RETENTION_DAYS days locally; optionally syncs to S3/R2 if
# BACKUP_REMOTE_BUCKET is set (uses the aws CLI, works against R2 too via
# --endpoint-url).
#
# Intended to run via cron/systemd timer on the host, next to
# docker-compose.yml — see backup.timer / backup.service for the systemd
# wiring, or add a crontab entry like:
#   0 3 * * * /opt/code/deploy/backup/backup.sh >> /var/log/code-backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/../.."

BACKUP_DIR="${BACKUP_DIR:-/opt/code/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

echo "==> [$TIMESTAMP] Dumping PostgreSQL database"
docker compose exec -T postgres pg_dump -U code -Fc code > "$BACKUP_DIR/db-$TIMESTAMP.dump"

echo "==> [$TIMESTAMP] Archiving the uploads volume"
docker run --rm \
  -v code_backend_uploads:/uploads:ro \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf "/backup/uploads-$TIMESTAMP.tar.gz" -C / uploads

if [ -n "${BACKUP_REMOTE_BUCKET:-}" ]; then
  echo "==> [$TIMESTAMP] Syncing backups to remote bucket $BACKUP_REMOTE_BUCKET"
  aws s3 cp "$BACKUP_DIR/db-$TIMESTAMP.dump" "s3://$BACKUP_REMOTE_BUCKET/db-$TIMESTAMP.dump" \
    ${BACKUP_REMOTE_ENDPOINT:+--endpoint-url "$BACKUP_REMOTE_ENDPOINT"}
  aws s3 cp "$BACKUP_DIR/uploads-$TIMESTAMP.tar.gz" "s3://$BACKUP_REMOTE_BUCKET/uploads-$TIMESTAMP.tar.gz" \
    ${BACKUP_REMOTE_ENDPOINT:+--endpoint-url "$BACKUP_REMOTE_ENDPOINT"}
fi

echo "==> [$TIMESTAMP] Pruning local backups older than $RETENTION_DAYS days"
find "$BACKUP_DIR" -name "db-*.dump" -mtime +"$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -name "uploads-*.tar.gz" -mtime +"$RETENTION_DAYS" -delete

echo "==> [$TIMESTAMP] Backup complete: $BACKUP_DIR/db-$TIMESTAMP.dump"
