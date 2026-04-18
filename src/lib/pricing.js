export const COST_ASSUMPTIONS = {
  fixedMonthlyCostEur: 35,
  minuteVendorCostEur: 0.12,
  taskVendorCostEur: 0.01,
  corpTaxRate: 0.19
};

export const PRICING_PLANS = [
  {
    key: 'plan_150',
    name: 'Launch',
    tag: 'Snel live',
    monthlyPriceEur: 299,
    includedMinutes: 180,
    includedTasks: 450,
    overageMinuteEur: 1.15,
    overageTaskEur: 0.08,
    idealFor: 'Lokale bedrijven met lage tot middelhoge callvolume'
  },
  {
    key: 'plan_275',
    name: 'Growth',
    tag: 'Beste keuze',
    monthlyPriceEur: 499,
    includedMinutes: 420,
    includedTasks: 1100,
    overageMinuteEur: 1.05,
    overageTaskEur: 0.07,
    idealFor: 'Teams met meerdere locaties of drukke receptie'
  },
  {
    key: 'plan_500',
    name: 'Scale',
    tag: 'Hoge capaciteit',
    monthlyPriceEur: 799,
    includedMinutes: 900,
    includedTasks: 2500,
    overageMinuteEur: 0.95,
    overageTaskEur: 0.06,
    idealFor: 'Dienstverleners met structureel hoog callverkeer'
  },
  {
    key: 'plan_850',
    name: 'Enterprise',
    tag: 'Maximale marge',
    monthlyPriceEur: 1199,
    includedMinutes: 1600,
    includedTasks: 4500,
    overageMinuteEur: 0.85,
    overageTaskEur: 0.05,
    idealFor: 'Schaalbedrijven met meerdere teams en piekbelasting'
  }
];

export const PRICING_VENDOR_BENCHMARKS = [
  {
    label: 'Twilio NL voice (pay-as-you-go)',
    value: 'Local call $0.0179/min, inbound mobile $0.0100/min, number +$7.70/mnd',
    source: 'https://www.twilio.com/en-us/voice/pricing/nl'
  },
  {
    label: 'OpenAI gpt-4o-mini-transcribe',
    value: '$0.003/min (pricing table)',
    source: 'https://developers.openai.com/api/docs/pricing'
  },
  {
    label: 'ElevenLabs TTS billing model',
    value: 'Billed per character (Flash/Turbo $0.05 per 1K chars)',
    source: 'https://elevenlabs.io/pricing/api'
  },
  {
    label: 'NL vennootschapsbelasting 2026',
    value: '19.0% tot EUR 200.000 winst',
    source:
      'https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/vennootschapsbelasting/tarieven_vennootschapsbelasting'
  }
];

export const estimatePlanMetrics = (plan, assumptions = COST_ASSUMPTIONS) => {
  const estimatedCogs =
    assumptions.fixedMonthlyCostEur +
    plan.includedMinutes * assumptions.minuteVendorCostEur +
    plan.includedTasks * assumptions.taskVendorCostEur;

  const preTaxProfit = plan.monthlyPriceEur - estimatedCogs;
  const preTaxMargin = plan.monthlyPriceEur > 0 ? preTaxProfit / plan.monthlyPriceEur : 0;
  const netProfit = preTaxProfit * (1 - assumptions.corpTaxRate);
  const netMargin = plan.monthlyPriceEur > 0 ? netProfit / plan.monthlyPriceEur : 0;

  return {
    estimatedCogsEur: Number(Math.max(estimatedCogs, 0).toFixed(2)),
    preTaxMarginPct: Number((Math.max(preTaxMargin, 0) * 100).toFixed(1)),
    netMarginPct: Number((Math.max(netMargin, 0) * 100).toFixed(1)),
    netProfitEur: Number(Math.max(netProfit, 0).toFixed(2))
  };
};

export const getPlanByKey = (planKey) =>
  PRICING_PLANS.find((plan) => plan.key === planKey) || PRICING_PLANS[0];
