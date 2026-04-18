# AI Hub (Call-Only MVP 2.0)

Call-only SaaS voor AI telefoon-assistenten.

Stack:
- Frontend: Vite + React
- API + Data: Supabase (Edge Functions + Postgres + Auth)
- Voice/AI: OpenAI + ElevenLabs
- Telephony: Twilio

WhatsApp is volledig uit scope gehaald.

## 1) Supabase SQL

Run in Supabase SQL Editor:

- `server/sql/call_assistant_migration.sql`

## 2) Frontend run (optioneel lokaal)

```bash
npm install
npm run dev
```

## 3) Environment variables

### Frontend (root `.env`)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL` (optioneel; alleen nodig als je toch een eigen backend wilt)

Snelle start:

```bash
cp .env.example .env
```

### Supabase Edge Function secrets

In Supabase -> Edge Functions -> Secrets:

- `OPENAI_API_KEY` (optioneel maar aanbevolen)
- `ELEVENLABS_API_KEY` (optioneel)
- `TWILIO_ACCOUNT_SID` (optioneel)
- `TWILIO_AUTH_TOKEN` (optioneel)
- `ADMIN_APPROVAL_KEY` (aanbevolen)
- `ALLOW_SIMULATED_PROVISIONING=true`

## 4) Deploy (Supabase-only)

Deploy de Edge Function:

```bash
supabase functions deploy call-api --project-ref <project-ref>
```

of via dashboard/CI.

- Frontend: Netlify
- API: Supabase Edge Functions (`call-api`)

### Online-only checklist (zonder lokaal)

1. Netlify env vars:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_BASE_URL` leeg laten (of verwijderen) voor Supabase-only mode
2. Supabase -> Authentication -> URL Configuration:
   - `Site URL=https://jouw-frontend-url`
   - Additional Redirect URLs:
     - `https://jouw-frontend-url/login`
     - `https://jouw-frontend-url/dashboard`
3. Supabase -> Authentication -> Providers -> Google:
   - Authorized redirect URI in Google Cloud:
     - `https://<project-ref>.supabase.co/auth/v1/callback`
4. Supabase -> Edge Functions:
   - `call-api` moet gedeployed zijn
   - secrets moeten gezet zijn

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

De pakketten zijn afgestemd op oplopende capaciteit per pakket en een voorspelbaar kostenmodel op basis van de assumptions in `src/lib/pricing.js`.

## 7) GitHub

```bash
git push origin main
```
