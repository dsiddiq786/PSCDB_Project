# Deploying PSCDB to pscdb.org

Production runs on the Contabo server `173.212.243.194` in `/opt/pscdb` as three Docker containers:

- `web`: nginx serving the React build and forwarding `/api` to the API.
- `api`: the Node backend.
- `mongo`: MongoDB 8.2 with a root password. MongoDB 8.0 does not start on this server's Linux kernel (6.19 or newer).

The server already runs a shared `nginx-proxy` container with `nginx-proxy-acme` (Let's Encrypt). The `web` container joins that proxy's Docker network (`PROXY_NETWORK`) and declares `VIRTUAL_HOST` and `LETSENCRYPT_HOST` from `SITE_HOSTS`. The proxy then routes `pscdb.org` and `www.pscdb.org` to it and renews their certificates automatically. `web` is also published on `127.0.0.1:9000` for checks from the server itself. The API and MongoDB are only on the stack's private network.

Other projects on the server (`restaurant-voice-os` on servio.servicesground.com, `dr-shafiq-classroom`, `edge-8443`) are not touched.

## Security Setup

- The API connects to MongoDB with its own user (`MONGO_APP_USER`), which can only read and write the `pscdb` database. The root account is used only for backups. On a new server the user is created automatically by `deploy/mongo-init.js`; on an existing database create it once with `mongosh` (`db.getSiblingDB("pscdb").createUser({user, pwd, roles: [{role: "readWrite", db: "pscdb"}]})`).
- `ADMIN_PASSWORD` is only used to create the very first superadmin. Leave it empty afterwards, and manage accounts with `scripts/set-admin-password.js` or the admin panel.
- Stripe: live keys only. Test keys are refused in production unless `STRIPE_TEST_MODE_ACK=true`, and `STRIPE_WEBHOOK_SECRET` is required whenever a key is set.
- Containers run with no-new-privileges, memory limits and log rotation; the API container is read-only apart from the uploads volume.

## Admin Accounts

Run these on the server from `/opt/pscdb`. They ask for the password without showing it.

```bash
docker compose --env-file .env.production exec api node scripts/set-admin-password.js someone@example.org --create "Full Name"
docker compose --env-file .env.production exec api node scripts/set-admin-password.js someone@example.org
```

Changing a password signs that account out everywhere.

## Configuration

Settings and secrets live in `/opt/pscdb/.env.production` (mode 600, never committed). The template is `.env.production.example`. The superadmin account is created on first start from `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Changing those values later does not change an existing account.

## Deploying a new version

From the project folder on your Mac, package the committed code (without the uploads folder) and send it:

```bash
git archive --format=tar.gz -o /tmp/pscdb.tar.gz HEAD -- . ':(exclude)Backend/uploads' ':(exclude)node_modules' && ssh root@173.212.243.194 'cd /opt/pscdb && tar xzf - && docker compose --env-file .env.production up -d --build' < /tmp/pscdb.tar.gz
```

Then check:

```bash
curl -s https://pscdb.org/api/v1/health
```

The site may be unreachable for a few seconds while the proxy reloads.

## Stripe Webhook

In the Stripe dashboard, add the endpoint `https://pscdb.org/api/v1/payments/stripe/webhook` for these events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` and `checkout.session.expired`. Put the secret key and the webhook signing secret in `.env.production`, then run `docker compose --env-file .env.production up -d` in `/opt/pscdb`.

For a supervised test with sandbox keys, also set `STRIPE_TEST_MODE_ACK=true`, and set it back to `false` (with live keys) before real students pay. A payment that arrives after its booking expired or was canceled takes a seat if one is free; otherwise the booking is marked **Refund Due** in the admin panel.

## Backups

`deploy/backup.sh` saves the database and the uploaded pictures to `/var/backups/pscdb` every night and keeps 14 days. Install it once:

```bash
echo '30 2 * * * root /opt/pscdb/deploy/backup.sh >> /var/log/pscdb-backup.log 2>&1' > /etc/cron.d/pscdb-backup
```

Copy `/var/backups/pscdb` to another location (another server or cloud storage) regularly, and test a restore:

```bash
docker compose --env-file .env.production exec -T mongo sh -c 'mongorestore --archive --gzip --drop -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin' < /var/backups/pscdb/db-<date>.archive.gz
```

