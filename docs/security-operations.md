# Security Operations Runbook

## Scope
- Productiefrontend draait via Netlify.
- Productie-API draait via Supabase Edge Function `call-api`.
- `server/` geldt alleen nog als legacy of lokale referentie en is geen ondersteund productiepad.

## Secret Rotation
1. Roteer Twilio, OpenAI, ElevenLabs en andere vendor secrets direct in hun eigen dashboard.
2. Werk daarna Supabase Edge Function secrets bij.
3. Herdeploy `call-api` na iedere secretrotatie.
4. Controleer dat oude secrets zijn ingetrokken en niet meer werken.
5. Leg datum, verantwoordelijke en reden van rotatie vast in het interne changelog.

## Admin Onboarding
1. Voeg de gebruiker toe aan `public.admin_users` met `active = true` en een passende `role`.
2. Laat de gebruiker opnieuw inloggen zodat de server-side admincheck de nieuwe rol ziet.
3. Test minimaal `/admin/overview`, `/admin/approve-payment` en `/admin/provision-run`.
4. Verwijder bootstrap fallback via `ADMIN_USER_IDS` zodra database-rollen actief zijn.

## Admin Offboarding
1. Zet `active = false` voor de gebruiker in `public.admin_users`.
2. Forceer een nieuwe login of revoke actieve sessies via Supabase Auth.
3. Controleer dat adminroutes daarna `403` geven.
4. Review open provisioning- of billingtaken die aan die beheerder gekoppeld waren.

## Webhook Key Rotation
1. Roteer `TWILIO_AUTH_TOKEN` in Twilio en Supabase secrets.
2. Herdeploy `call-api`.
3. Verifieer dat `/twilio/voice`, `/twilio/turn` en `/twilio/status` geldige signatures accepteren en ongeldige `403` geven.
4. Controleer of Twilio-nummers nog naar de Supabase Edge URLs wijzen.

## Commerce Integrations
1. Vraag klanten alleen metadata aan: `provider`, `storeUrl`, `contactEmail`, `setupNotes`.
2. Accepteer geen plaintext credentials in de app-database.
3. Markeer oude of onveilige koppelingen als `pending_setup` totdat fase 2 voor encrypted secret management klaar is.
4. Houd live orderstatus lookup uitgeschakeld totdat er een veilig geheimbeheerpad is.

## Incident Response
1. Classificeer het incident: beschikbaarheid, datalek, ongeautoriseerde toegang, vendor issue.
2. Stop het lek of de foutbron eerst: key intrekken, admin uitschakelen, webhook blokkeren of deploy rollback voorbereiden.
3. Verzamel minimale forensische data: timestamps, betrokken systemen, user IDs, call SIDs en relevante logs.
4. Meld privacy-incidenten direct intern aan de privacyverantwoordelijke via `privacy@belliq.ai`.
5. Beoordeel meldplicht aan klanten en toezichthouders volgens AVG-tijdslijnen.
6. Leg oorzaak, impact, genomen acties en vervolgstappen vast.

## Retention Review
1. Review maandelijks of transcript- en sessiedata volgens bewaartermijnen wordt opgeschoond.
2. Controleer dat `web_test_turns.audio_data_url` niet persistent wordt opgeslagen.
3. Verifieer dat geen plaintext integratie-secrets in `commerce_integrations` staan.
4. Valideer dat call transcripts, metadata en billingdata nog binnen het afgesproken schema vallen.
