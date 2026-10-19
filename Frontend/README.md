# PSCDB Frontend

The public website and admin panel of the Professional Skills and Community Development Board (pscdb.org).

- React 19, React Router 7, Vite and Tailwind CSS 4.
- Public pages live in `Components/` and `Modules/`; the admin panel is in `Modules/Admin/` and loads separately at `/admin`.
- Design rules, colors, typography and components are documented in `../BRANDBOOK.md`.

```bash
npm install
npm run dev     # http://localhost:5173, with /api proxied to the API on port 3002
npm run build
npm run lint
```

See `../RUNNING.md` for local setup and `../DEPLOY.md` for production.
