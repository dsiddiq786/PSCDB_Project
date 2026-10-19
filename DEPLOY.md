# Deploying PSCDB to servio.servicesground.com

The site runs as three Docker containers: `web` (nginx serving the React build and forwarding `/api`), `api` (Node) and `mongo`. They share a private network. Only `web` is published, on `127.0.0.1:9000`, so nothing is reachable from outside except through the host's reverse proxy. Other projects on the server are not touched: the stack has its own Compose project name (`pscdb`), its own network and volumes, and a host nginx site that answers only for `servio.servicesground.com`.

## 1. DNS

Add an `A` record for `servio` in the `servicesground.com` zone that points to the server's public IP address. Wait until `dig +short servio.servicesground.com` returns that address.

## 2. Server prerequisites

- Docker Engine with the Compose plugin (`docker compose version`).
- nginx on the host as the reverse proxy, with certbot (`certbot --version`). If the server uses Caddy or Traefik instead, see the note at the end.
- Ports 80 and 443 open in the firewall (they already are if another site is served).

## 3. Get the code

```bash
sudo mkdir -p /opt/pscdb && sudo chown "$USER" /opt/pscdb
git clone -b feature/platform-redesign https://github.com/dsiddiq786/PSCDB_Project.git /opt/pscdb
cd /opt/pscdb
```

## 4. Configure

```bash
cp .env.production.example .env.production
chmod 600 .env.production
nano .env.production
```

- Make sure `WEB_PORT` is free: `ss -ltn | grep 9000` should print nothing. If it is taken, pick another port and use the same one in the nginx site file.
- Fill every secret with `openssl rand -hex 32`. The admin account is created on the first start from `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

## 5. Start the stack

```bash
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production ps
curl -s http://127.0.0.1:9000/api/v1/health
```

The last command should print `{"success":true}`.

## 6. Host nginx and HTTPS

```bash
sudo cp deploy/servio.servicesground.com.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/servio.servicesground.com.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d servio.servicesground.com
```

`nginx -t` must pass before reloading, so a mistake cannot take the other sites down. Certbot then adds HTTPS and the redirect from HTTP.

## 7. Stripe webhook (sandbox)

In the Stripe dashboard (test mode), add the endpoint `https://servio.servicesground.com/api/v1/payments/stripe/webhook` for the `checkout.session.completed` and `checkout.session.expired` events. Put its signing secret in `STRIPE_WEBHOOK_SECRET`, then run `docker compose --env-file .env.production up -d` again.

## Updating

```bash
cd /opt/pscdb
git pull
docker compose --env-file .env.production up -d --build
```

## Backups

```bash
docker compose --env-file .env.production exec -T mongo sh -c 'mongodump --archive --gzip -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin' > pscdb-$(date +%F).archive.gz
```

## If the server does not use nginx

Point the new domain at `http://127.0.0.1:9000`. For Caddy, the site block is:

```
servio.servicesground.com {
    reverse_proxy 127.0.0.1:9000
}
```
