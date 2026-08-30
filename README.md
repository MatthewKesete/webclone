# TITDB Webclone

This project contains a React frontend and Express + SQLite API for the TIT database app.

## Structure

- `frontend/` — Vite React app
- `api/` — Express API using SQLite
- `db/` — SQLite database files
- `netlify/functions/` — Netlify serverless wrapper for the API

## Local development

```bash
cd webclone/api
npm install
npm run dev
```

In another terminal:

```bash
cd webclone/frontend
npm install
cp .env.example .env
npm run dev
```

The frontend expects the API at `http://localhost:5000/api` unless you set `VITE_API_URL` in `.env`.

## Deploy to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

## Deploy to Netlify

1. Push this folder to GitHub.
2. In Netlify, choose Import from Git.
3. Select the GitHub repo.
4. Keep the build settings as:
   - Build command: `npm install --prefix api && npm install --prefix frontend && npm run build --prefix frontend`
   - Publish directory: `frontend/dist`
   - Functions directory: `netlify/functions`
5. Deploy the site.
6. Your app will be available at the Netlify URL, and the API will be served through `/api/*`.

> Note: SQLite data in serverless Netlify functions is not as durable as a dedicated database service. For a production app with frequent writes, use a managed database like Supabase, PlanetScale, Postgres, or a dedicated Node host.
