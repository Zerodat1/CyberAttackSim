# Nginx + Let's Encrypt

This directory wires up the `nginx` and `certbot` services from
`docker-compose.prod.yml`.

## One-time setup on a fresh server

1. Point two DNS A records at the server's public IP: one for your API domain
   (e.g. `api.yourdomain.com`) and one for the admin dashboard
   (e.g. `admin.yourdomain.com`).
2. Add to `backend/.env`:
   ```
   API_DOMAIN=api.yourdomain.com
   ADMIN_DOMAIN=admin.yourdomain.com
   LETSENCRYPT_EMAIL=you@yourdomain.com
   ```
3. Run `./deploy/nginx/init-letsencrypt.sh` once. It bootstraps a temporary
   self-signed cert (so nginx can start), then swaps it for a real
   Let's Encrypt certificate covering both domains.
4. From then on, bring the stack up normally:
   ```
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```
   The `certbot` service renews the certificate automatically every 12h;
   nginx picks up renewed certs on its next reload (a weekly cron entry
   calling `docker compose exec nginx nginx -s reload` is enough — see
   `deploy/backup/` for the pattern used for the DB backup cron).

## Files

- `templates/app.conf.template` — rendered by nginx's own docker-entrypoint
  envsubst step into `/etc/nginx/conf.d/app.conf` on container start,
  substituting `${API_DOMAIN}` / `${ADMIN_DOMAIN}`.
- `init-letsencrypt.sh` — the one-time bootstrap described above.
