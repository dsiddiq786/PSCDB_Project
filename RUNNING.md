# Running PSCDB locally

## What is in this repository

| Part | Folder | Purpose |
|---|---|---|
| Website and admin panel | `Frontend/` | React + Vite. Public pages, enrolment flow and the admin panel at `/admin`. |
| API | `Backend/` | Express + MongoDB. Courses, fees, seats, enrolments, payments, enquiries and admin. |

## First run

1. Install dependencies:

   ```bash
   cd Backend && npm install
   cd ../Frontend && npm install
   ```

2. Create `Backend/.env` from `Backend/.env.example`. For local development:
   - Leave `MONGODB_URI` empty to use an in-memory database (data resets on restart).
   - Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (12 characters or more). The first superadmin is created on startup.
   - Set `ADMIN_JWT_SECRET` to a long random string (`openssl rand -hex 32`).
   - Set `ALLOW_SIMULATED_PAYMENTS=true` to test enrolment without Stripe.

3. Start both servers in separate terminals:

   ```bash
   cd Backend && npm run dev
   cd Frontend && npm run dev
   ```

4. Open http://localhost:5173 for the website. The admin panel is at http://localhost:5173/superadmin (or /admin). It is deliberately not linked from the public site.

   In production, serve the admin panel on its own address, for example `admin.pscdb.org`, and restrict access by network or VPN if possible.

   Students sign in to the learning platform at https://lms.pscdb.org. The website links there from the header, the footer and the enrolment confirmation page.

## Payments with Stripe test mode

1. In the Stripe dashboard, switch to test mode and copy the secret key (`sk_test_...`) into `STRIPE_SECRET_KEY`.
2. Forward webhooks to the local API with the Stripe CLI:

   ```bash
   stripe listen --forward-to localhost:3002/api/v1/payments/stripe/webhook
   ```

3. Copy the webhook signing secret it prints (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`, then restart the API.
4. Enrol in a course and pay with Stripe's test card `4242 4242 4242 4242`, any future expiry date and any CVC.

When Stripe keys are set, simulated payments are switched off automatically. They are also always off when `NODE_ENV=production`.

## How seats and payments work

- Each course has a morning batch and an evening batch, each with its own seat count.
- Seats are reserved atomically, so two students cannot book the last seat.
- A reserved seat is held for 30 minutes. If payment is not completed, the seat is released automatically.
- Fees are stored in US cents and always calculated on the server. The browser never sends a price.
- Rupee amounts use the exchange rate set by an administrator under Admin → Settings.

## Admin roles

| Role | Can do |
|---|---|
| Superadmin | Everything, including fees, exam fee switch, seats, timings and the exchange rate. |
| Staff | View enrolments, courses and settings, and manage enquiries. |

## Before going live

- Use a managed MongoDB (`MONGODB_URI`) with backups.
- Set `NODE_ENV=production`, `TRUST_PROXY` and a real `CLIENT_URL`.
- Use live Stripe keys only after the merchant account is approved.
- Replace illustrative lab images with real photographs when the labs are ready.
- Publish a refund and batch-transfer policy and a privacy notice.
