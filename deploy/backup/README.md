# Automated backups

`backup.sh` dumps the PostgreSQL database (via `pg_dump -Fc`, PostgreSQL's
custom compressed format) and archives the `uploads` volume (only relevant
when object storage isn't configured — see `backend/src/storage`), keeping
`BACKUP_RETENTION_DAYS` (default 14) days locally, with an optional S3/R2
sync.

## One-time setup on the server

```
sudo mkdir -p /opt/code/backups
sudo cp deploy/backup/code-backup.service deploy/backup/code-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now code-backup.timer
```

Check it's scheduled: `systemctl list-timers code-backup.timer`.
Run it once by hand to verify: `sudo systemctl start code-backup.service`
then check `journalctl -u code-backup.service`.

If you'd rather use cron instead of systemd:
```
0 3 * * * /opt/code/deploy/backup/backup.sh >> /var/log/code-backup.log 2>&1
```

## Off-server copies (recommended)

Set these in the environment the timer/cron runs with (e.g. in
`/etc/systemd/system/code-backup.service.d/override.conf` or the crontab
itself) to also push each backup to an S3/R2 bucket, so a full disk/server
loss doesn't take the backups with it:
```
BACKUP_REMOTE_BUCKET=my-backups-bucket
BACKUP_REMOTE_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com   # omit for real AWS S3
```
Requires the `aws` CLI to be installed and configured with credentials that
can write to that bucket.

## Restoring

```
./deploy/backup/restore.sh /opt/code/backups/db-20260101-030000.dump
```
This drops and recreates the `code` database, so it asks for confirmation
unless you pass `--yes`. To restore the uploads archive, just extract it
into the `code_backend_uploads` volume's mount point (or `docker cp` it in).
