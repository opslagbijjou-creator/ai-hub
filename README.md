# AI Hub (Call-Only MVP 2.0)

Call-only SaaS voor AI telefoon-assistenten.

Stack:
- Frontend: Vite + React
- Backend: Express (API layer)
- Data: Supabase
- Voice/AI: OpenAI + ElevenLabs
- Telephony: Twilio

WhatsApp is volledig uit scope gehaald.

## 1) Supabase SQL

Run in Supabase SQL Editor:

- `server/sql/call_assistant_migration.sql`

## 2) Lokale run

Terminal 1 (backend):

```bash
cd server
npm install
npm run dev
```

Terminal 2 (frontend):

```bash
npm install
npm run dev
```

## 3) Environment variables

### Backend (`server/.env`)

Verplicht:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (sterk aangeraden)

Aanbevolen voor AI/voice:
- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY`

Voor live telefonie:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`

Overig:
- `PORT` (default `3001`)
- `PUBLIC_API_BASE_URL` (bijv. `https://jouw-backend.onrender.com`)
- `ADMIN_APPROVAL_KEY` (voor endpoint `/api/admin/approve-payment`)
- `ALLOW_SIMULATED_PROVISIONING=true` (default; zet op `false` als je alleen echte Twilio live provisioning wilt)

### Frontend (root `.env`)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL` (productie: je backend URL)

## 4) Deploy

- Frontend: Netlify
- Backend: Render (of Railway/Fly)

Belangrijk: Netlify host alleen de frontend. De API draait apart.

## 5) Kernfeatures MVP 2.0

- Wizard onboarding (bedrijf, voice, nummer, plan)
- Web call test in browser met states: Listening / Thinking / Speaking / Idle
- Factuuraanvraagflow (`invoice_sent`)
- Admin approval endpoint (`paid_approved`)
- Auto provisioning endpoint naar `live` (Twilio of simulatie)
- Usage summary met inbegrepen limieten + overage indicatie
- Publieke pagina's: `/`, `/pricing`, `/info`

## 6) Pakketten (huidig model)

- `Launch` – €299/mnd – 180 min – overage €1.15/min
- `Growth` – €499/mnd – 420 min – overage €1.05/min
- `Scale` – €799/mnd – 900 min – overage €0.95/min
- `Enterprise` – €1199/mnd – 1600 min – overage €0.85/min

De pakketten zijn afgestemd op stijgende absolute winst per pakket en een netto marge-doel boven 60% op basis van de cost assumptions in `src/lib/pricing.js`.

## 7) GitHub

```bash
git push origin main
```
