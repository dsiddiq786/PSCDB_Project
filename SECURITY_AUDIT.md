# PSCDB Security and Code Audit

Date: 19 Oct 2026 · Scope: the whole repository (website, admin panel, API, Docker deployment) and the production server at pscdb.org.

Method: a line-by-line code review of every reachable route and component, dependency audits (`npm audit`), an import graph to find unused code, and automated tests run against the fixed code:

| Test suite | Checks |
|---|---|
| Admin features | 60 |
| Profiles | 32 |
| Security regressions | 18 |
| Payment edge cases | 9 |
| **Total** | **119, all passing** |

Production was re-verified after deployment.

## Summary

| Severity | Found | Fixed | Needs the owner |
|---|---|---|---|
| High | 4 | 3 | 1 (git history purge) |
| Medium | 7 | 7 | 0 |
| Low | 11 | 9 | 2 (off-server backups, residual proxy risk) |

## High

| # | Finding | Status |
|---|---|---|
| H1 | A student's photo and education documents were committed to git (`Backend/uploads`) and pushed to GitHub. | **Partly fixed.** The files are no longer tracked and `Backend/uploads/` is git-ignored. They are **still in the git history** of both GitHub repositories; purging needs a history rewrite and force-push, which is the owner's decision. |
| H2 | A canceled booking left the Stripe checkout payable, so a student could be charged with no booking and the payment ignored. | **Fixed.** Canceling now closes the Stripe checkout first. A late payment takes a free seat or is marked **Refund Due** for staff; payments are never dropped. Async payment events are handled. |
| H3 | Stripe test keys could run on the public site, letting anyone "pay" with test cards. | **Fixed.** The API refuses to start with test keys in production unless `STRIPE_TEST_MODE_ACK=true`, requires the webhook secret whenever a key is set, and refuses test-mode events in production. |
| H4 | Unused student login and LMS routes were still live: no rate limits, a brute-forceable OTP, OTPs printed to logs, email bombing, account lockout abuse and user enumeration. | **Fixed.** The routes and all their code were removed (`/api/v1/auth/*` and `/api/v1/lms/*` now return 404), along with the `nodemailer` and `pdf-parse` dependencies. |

## Medium

| # | Finding | Status |
|---|---|---|
| M1 | Admin sessions survived a password change and sign-out. | **Fixed.** Sessions carry a version, which is raised by any change to password, role or access, and by sign-out. Every other session ends immediately. |
| M2 | Five wrong passwords locked any account for everyone (lockout abuse); response timing and status revealed which emails exist. | **Fixed.** Failures are counted per email and IP address, and unknown, wrong and blocked sign-ins return identical answers in similar time. |
| M3 | CSV exports could carry spreadsheet formulas from public inquiry text. | **Fixed.** Cells starting with `= + - @` or control characters are neutralized. |
| M4 | Anonymous bookings could hold every seat in a batch without paying. | **Fixed.** Each person can hold one unpaid booking at a time, and unpaid holds are capped at a fifth of a batch. |
| M5 | Admin enrollment edits could race with payments or expiring holds and overbook a batch. | **Fixed.** Edits apply only if the booking has not changed since it was read; seat moves are rolled back otherwise. |
| M6 | The API used the database root account. | **Fixed.** The API now uses `pscdb_app`, which can only read and write the `pscdb` database (created on production). |
| M7 | The website had no Content-Security-Policy, and nginx dropped some headers on some paths. | **Fixed.** A strict CSP and the full header set apply to every response. Hidden files and source maps are not served. |

## Low

| # | Finding | Status |
|---|---|---|
| L1 | A missing webhook secret would silently stop payment confirmation. | Fixed: startup check. |
| L2 | A failed student link could not be repaired by a webhook retry. | Fixed. |
| L3 | API responses with personal data could be cached. | Fixed: `Cache-Control: no-store` on all API responses. |
| L4 | The lowest role could bulk-export student CNICs and phone numbers. | Fixed: exports are for managers and above, and every export is in the audit log. |
| L5 | Containers on the server's shared proxy network can reach the website container directly and forge client IP addresses (affects rate limits and audit IPs only). | **Residual.** It requires access to another project on the same server. A dedicated server or a separate proxy network removes it. |
| L6 | The legacy upload code kept photo metadata (GPS) and had broken saves. | Fixed by removal. New profile pictures are decoded, re-encoded, stripped of metadata and served only to signed-in staff. |
| L7 | No graceful shutdown: redeploys could cut payment webhooks mid-request. | Fixed: in-flight requests finish before exit. |
| L8 | Containers had no limits or log rotation. | Fixed: memory limits, log rotation, no-new-privileges, all capabilities dropped and a read-only filesystem for the API, nginx 1.28. |
| L9 | Backups were manual and kept only on the same server. | **Partly fixed.** A nightly backup of the database and pictures runs at 02:30 with 14 days kept in `/var/backups/pscdb` (root-only). Copying them off the server is the owner's step. |
| L10 | The first-admin password stayed in the server's environment. | Fixed: cleared on production. Accounts are managed with `scripts/set-admin-password.js`. |
| L11 | A build-only dependency advisory (Tailwind's `source-map-js`). | Fixed: build tools moved to dev dependencies. `npm audit` reports 0 vulnerabilities for both apps. |

Also fixed: a deprecated database option that would break on the next Mongoose upgrade.

## Leftover AI-Generated, Placeholder and Dead Content

| Finding | Status |
|---|---|
| Dead code from an earlier student portal (`Frontend/Auth`, `Frontend/Context`, `Frontend/Modules/LMS`, unused components and enrollment drafts), including Roman-Urdu comments, debug `console.log` calls that printed passwords and OTPs, a fake "submit" that only logged data, "To be provided" bank details and placeholder emails | Removed |
| Vite template leftovers: the README, logos and icons | Removed or replaced |
| Unused images served publicly (about 13 MB, including original portraits and downloaded `.jfif` files) | Removed |
| A hand-off note in the leadership data | Removed |
| Links to `lms.pscdb.org`, which does not exist yet | Hidden. They return when the address is set in `Frontend/Modules/Config/institute.js`. |
| Hero and lab images described as real students | Alt text now says they are illustrations |
| A hard-coded "50 students" | Replaced with wording that stays true when capacity changes |
| A garbled meta description ("…labs, tracks and admissions") | Rewritten |

The live code has no TODOs, stubs, lorem ipsum, fake names or placeholder data.

## Still Needed from PSCDB

1. **Purge the student files from git history** of `AzharSultan985/PSCDB_Project` and `dsiddiq786/PSCDB_Project`. That means a `git filter-repo` run, a force-push, and asking GitHub to clear cached views. Then notify the student if your policy requires it.
2. **Stripe:** add live keys and the webhook secret before accepting payments (see `DEPLOY.md`).
3. **Off-server backups:** copy `/var/backups/pscdb` to another location regularly and test a restore.
4. **Content the client must confirm,** because these claims cannot be verified from the code:
   - Who sets and certifies the professional skills exam, and what the certificate is.
   - The partnerships and employer relationships mentioned on the About and Careers pages.
   - The "every student agrees to these commitments" and "written rules of engagement" statements.
   - Admissions help with travel documents for international students.
   - The leadership names and titles.
5. **Missing information:**
   - A public phone number.
   - Written fee terms and a refund policy (the enrollment form links to the Fees page for them).
   - Real photographs of the Sahiwal labs to replace the illustrations.
