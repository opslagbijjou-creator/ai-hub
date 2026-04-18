# AI Hub

Frontend (Vite/React) + backend (Express + whatsapp-web.js) + Supabase opslag.

## 1) Supabase SQL

Run deze 2 scripts in je Supabase SQL Editor:

- `server/sql/ai_settings_migration.sql`
- `server/sql/whatsapp_sync_migration.sql`

## 2) Lokale run

Terminal 1:

```bash
cd server
npm install
npm run dev
```

Terminal 2:

```bash
npm install
npm run dev
```

## 3) Vereiste env vars

`server/.env`:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `PORT` (optioneel, default `3001`)
- `WWEBJS_DATA_PATH` (optioneel, pad voor persistente WhatsApp sessiedata)

Root `.env` (frontend build):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL` (in productie: URL van je backend, bv `https://api-jouwdomein.com`)

## 4) Hosting uitleg (belangrijk)

Netlify host alleen de frontend.  
De WhatsApp backend kan niet betrouwbaar op Netlify Functions draaien (persistente browser/sessie nodig).

Dus productie-opzet:

1. Backend deployen op een persistente host (bijv. Render/Railway/VPS).
2. Frontend deployen op Netlify.
3. In Netlify env var zetten: `VITE_API_BASE_URL=https://<jouw-backend-url>`.
4. Redeploy frontend.

## 5) GitHub

```bash
git push origin main
```

Repo: `https://github.com/opslagbijjou-creator/ai-hub`
