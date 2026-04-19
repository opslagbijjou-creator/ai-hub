# AI Hub (Belliq Hardening Release)

Call-only SaaS voor AI telefoon-assistenten met Supabase-only productiebackend.

## Stack
- Frontend: Vite + React + Tailwind via Vite build
- API + data: Supabase Edge Functions + Postgres + Auth
- Voice/AI: OpenAI + ElevenLabs
- Telephony: Twilio
- Hosting: Netlify + Supabase

## Productie-architectuur
- Productie-API loopt alleen via `supabase/functions/call-api`.
- `server/` is legacy of lokale referentie en geen ondersteund productiepad.
- De legacy Express-server weigert productieverkeer standaard met `410 Gone`, tenzij `ALLOW_LEGACY_SERVER_IN_PRODUCTION=true` expliciet is gezet.
- `render.yaml` is verwijderd; Render hoort niet meer in de productieflow.
- Adminrechten komen server-side uit `public.admin_users`.
- Webshopkoppelingen zijn metadata-only totdat fase 2 voor encrypted secret management klaar is.

## 1. Database migratie
Run in Supabase SQL Editor:

- `server/sql/call_assistant_migration.sql`
- `server/sql/assistant_ai_plan_migration.sql` (alleen nodig als je schema al eerder is uitgerold)

Belangrijk in deze migratie:
- `admin_users` tabel voor server-side adminrollen
- plaintext integratie-secrets worden genuld
- bestaande self-service koppelingen gaan terug naar `pending_setup`
- persistente `web_test_turns.audio_data_url` blobs worden opgeschoond
- AI plan-opslag in `assistant_profiles.ai_plan*` voor achtergrondstrategie tijdens onboarding

## 2. Frontend lokaal starten
```bash
npm install
npm run dev
```

## 3. Frontend env vars (`.env`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Snelle start:
```bash
cp .env.example .env
```

Opmerking:
- `VITE_API_BASE_URL` wordt niet meer gebruikt voor productie. Alleen de legacy localhost API wordt nog automatisch gebruikt wanneer je lokaal zonder Supabase Functions werkt.
- `VITE_ADMIN_UIDS` is verwijderd. Admin UI volgt nu server-side `viewer.isAdmin`.

## 4. Supabase Edge Function secrets
Zet deze in Supabase -> Edge Functions -> Secrets:

- `OPENAI_API_KEY` (optioneel maar aanbevolen)
- `ELEVENLABS_API_KEY` (optioneel)
- `TWILIO_ACCOUNT_SID` (aanbevolen voor live telefonie)
- `TWILIO_AUTH_TOKEN` (aanbevolen voor live telefonie en webhook-validatie)
- `SUPABASE_SERVICE_ROLE_KEY` (verplicht voor admin, provisioning en webhooktaken)
- `ALLOWED_ORIGINS` (comma-separated lijst met frontend origins, bijvoorbeeld `https://app.belliq.ai,https://www.belliq.ai`)
- `ADMIN_USER_IDS` (optionele bootstrap fallback; alleen tijdelijk gebruiken)
- `ALLOW_SIMULATED_PROVISIONING=true` (alleen als je zonder Twilio wilt testen)

## 5. Admin setup
Voeg admins server-side toe via SQL:

```sql
insert into public.admin_users (user_id, role, active)
values ('<supabase-user-uuid>', 'owner', true)
on conflict (user_id)
do update set role = excluded.role, active = excluded.active, updated_at = now();
```

Gebruik `ADMIN_USER_IDS` alleen als tijdelijke bootstrap fallback. Verwijder die fallback zodra `admin_users` correct werkt.

## 6. Deploy
Deploy de Edge Function:

```bash
npx supabase@latest functions deploy call-api --project-ref <project-ref> --no-verify-jwt
```

Frontend deploy:
- Netlify build command: `npm run build`
- Publish directory: `dist`
- Security headers komen uit `public/_headers`

## 7. Productiechecklist
1. `call-api` is gedeployed.
2. `ALLOWED_ORIGINS` bevat alle frontend domains.
3. `admin_users` bevat de juiste beheerders.
4. Twilio-nummers wijzen naar:
   - `/twilio/voice`
   - `/twilio/turn`
   - `/twilio/status`
5. Publieke pagina's `/privacy`, `/terms`, `/compliance`, `/contact` zijn live en gecontroleerd.
6. `docs/security-operations.md` is intern bekend bij het team.

## 8. Wat nu bewust uit staat
- Self-service webshop credentials in frontend en admin
- Live orderstatus lookup via webshop-integraties
- Plaintext secretopslag in `commerce_integrations`
- Render/Express als productiebackend

## 9. Belangrijkste features van deze release
- Wizard onboarding voor assistentidentiteit, voice, nummer en bereikbaarheid
- Web call test in browser
- Admin console voor betaling, provisioning en concierge webshop-flow
- Twilio voice/status webhooks direct in Supabase Edge Function
- Server-side adminautorisatie
- Publieke privacy-, compliance- en voorwaardenpagina's met bewaartermijnen en subprocessorinfo

## 10. Operationeel runbook
Zie:
- `docs/security-operations.md`
