# Deploying PSCDB to pscdb.org

Production runs on the Contabo server `173.212.243.194` in `/opt/pscdb` as three Docker containers:

- `web`: nginx serving the React build and forwarding `/api` to the API.
- `api`: the Node backend.
- `mongo`: MongoDB 8.2 with a root password. MongoDB 8.0 does not start on this server's Linux kernel (6.19 or newer).

The server already runs a shared `nginx-proxy` container with `nginx-proxy-acme` (Let's Encrypt). The `web` container joins that proxy's Docker network (`PROXY_NETWORK`) and declares `VIRTUAL_HOST` and `LETSENCRYPT_HOST` from `SITE_HOSTS`. The proxy then routes `pscdb.org` and `www.pscdb.org` to it and renews their certificates automatically. `web` is also published on `127.0.0.1:9000` for checks from the server itself. The API and MongoDB are only on the stack's private network.

Other projects on the server (`restaurant-voice-os` on servio.servicesground.com, `dr-shafiq-classroom`, `edge-8443`) are not touched.

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

## Stripe webhook (sandbox)

In the Stripe dashboard (test mode), add the endpoint `https://pscdb.org/api/v1/payments/stripe/webhook` for the `checkout.session.completed` and `checkout.session.expired` events. Put the secret key and the webhook signing secret in `.env.production`, then run `docker compose --env-file .env.production up -d` in `/opt/pscdb`.

## Backups

```bash
cd /opt/pscdb && docker compose --env-file .env.production exec -T mongo sh -c 'mongodump --archive --gzip -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin' > /root/pscdb-$(date +%F).archive.gz
```
