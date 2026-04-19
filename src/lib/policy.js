export const policyConfig = {
  brandName: 'Belliq',
  legalEntity: 'Belliq (juridische entiteit bevestigen voor publieke launch)',
  registeredAddress: ['Herengracht 450', '1017 CA Amsterdam', 'Nederland'],
  supportEmail: 'support@belliq.ai',
  privacyEmail: 'privacy@belliq.ai',
  securityEmail: 'security@belliq.ai',
  dsarEmail: 'privacy@belliq.ai',
  lastUpdated: '19 april 2026',
  subprocessors: [
    {
      name: 'Supabase',
      purpose: 'Authenticatie, Postgres database en Edge Functions',
      location: 'EU-regio waar beschikbaar; internationale doorgifte alleen met contractuele waarborgen'
    },
    {
      name: 'OpenAI',
      purpose: 'Genereren van assistent-antwoorden en onboarding-suggesties',
      location: 'Verenigde Staten of andere ondersteunde regio\'s onder contractuele waarborgen'
    },
    {
      name: 'ElevenLabs',
      purpose: 'Tijdelijke tekst-naar-spraak output voor webtests',
      location: 'Verenigde Staten of andere ondersteunde regio\'s onder contractuele waarborgen'
    },
    {
      name: 'Twilio',
      purpose: 'Telefonienummers, webhook delivery en live call events',
      location: 'Internationale infrastructuur met contractuele waarborgen voor doorgifte'
    },
    {
      name: 'Netlify',
      purpose: 'Hosting van de publieke frontend en deploy headers',
      location: 'Verenigde Staten of andere ondersteunde regio\'s onder contractuele waarborgen'
    }
  ],
  retentionSchedule: [
    { label: 'Web test transcripts', value: '30 dagen' },
    { label: 'Call transcripts', value: '30 dagen' },
    { label: 'Call- en sessiemetadata', value: '180 dagen' },
    { label: 'Security- en auditlogs', value: '180 dagen' },
    { label: 'Facturen en fiscale billingdata', value: '7 jaar' }
  ],
  transferMechanism:
    'Wanneer leveranciers buiten de EER verwerken, baseren we die doorgifte op passende contractuele waarborgen zoals standaardcontractbepalingen en aanvullende beveiligingsmaatregelen waar nodig.',
  callDisclosure:
    'Als live telefonie actief is, kunnen gesprekstranscripten en call metadata worden verwerkt voor servicelevering, kwaliteitscontrole, beveiliging en support. Gebruik van opnames of transcriptie moet je ook zelf duidelijk aan bellers communiceren wanneer jouw proces dat vereist.',
  launchNotice: [
    'Bevestig vóór publieke launch de juridische entiteit, het postadres en eventuele registratienummers.',
    'Controleer of de subprocessor-lijst volledig is voor jouw productieomgeving.',
    'Werk sectorspecifieke compliance-eisen apart uit wanneer jouw use case extra wetgeving raakt.'
  ]
};
