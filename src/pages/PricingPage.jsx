import React, { useMemo, useState } from 'react';
import { Calculator, CheckCircle2, ReceiptText, ShieldCheck, Sparkles } from 'lucide-react';
import { PRICING_PLANS, getPlanByKey } from '../lib/pricing';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import './LandingPage.css';

const pricingHighlights = [
  {
    icon: Sparkles,
    title: 'Gratis opbouwen en testen',
    copy: 'Je kunt je assistent configureren en in de browser testen voordat er een nummer live wordt gezet.'
  },
  {
    icon: ReceiptText,
    title: 'Abonnement start bij livegang',
    copy: 'Facturatie hoort bij activatie. Tot dat moment hou je de keuze om eerst bij te sturen.'
  },
  {
    icon: ShieldCheck,
    title: 'Duidelijke overage',
    copy: 'Extra minuten en AI-taken zijn zichtbaar per pakket, zodat kosten voorspelbaar blijven.'
  }
];

const faqs = [
  {
    question: 'Wanneer betaal ik echt?',
    answer: 'Het betaalde abonnement start zodra je een nummer en live telefonie activeert. Daarvoor kun je bouwen en testen in de browser.'
  },
  {
    question: 'Zijn stemmen, prompt en dashboard inbegrepen?',
    answer: 'Ja. De onboarding, promptopbouw, stemkeuze, browser-test en usage-inzichten horen bij elk pakket.'
  },
  {
    question: 'Wat gebeurt er bij extra minuten?',
    answer: 'Zodra je boven je bundel komt, zie je per pakket het duidelijke tarief per extra minuut en per AI-taak.'
  },
  {
    question: 'Kan ik later van pakket wisselen?',
    answer: 'Ja. De structuur is juist gemaakt om klein te starten en later op te schalen zodra je volume groeit.'
  }
];

const PricingPage = () => {
  const defaultPlan = PRICING_PLANS[1] || PRICING_PLANS[0];
  const [selectedPlanKey, setSelectedPlanKey] = useState(defaultPlan.key);
  const [minutes, setMinutes] = useState(defaultPlan.includedMinutes);
  const [tasks, setTasks] = useState(defaultPlan.includedTasks);

  const selectedPlan = getPlanByKey(selectedPlanKey);

  const calculator = useMemo(() => {
    const overageMinutes = Math.max(0, minutes - selectedPlan.includedMinutes);
    const overageTasks = Math.max(0, tasks - selectedPlan.includedTasks);

    const base = selectedPlan.monthlyPriceEur;
    const overage = overageMinutes * selectedPlan.overageMinuteEur + overageTasks * selectedPlan.overageTaskEur;
    const total = base + overage;

    return {
      overageMinutes,
      overageTasks,
      base: Number(base.toFixed(2)),
      overage: Number(overage.toFixed(2)),
      total: Number(total.toFixed(2))
    };
  }, [minutes, selectedPlan, tasks]);

  return (
    <div className="landing-container marketing-page">
      <div className="marketing-grid"></div>
      <PublicHeader active="pricing" />

      <section className="pricing-hero">
        <span className="section-eyebrow centered">Prijzen</span>
        <h1>Duidelijke pakketten voor teams die eerst willen testen en daarna pas live gaan</h1>
        <p>
          Geen vage activatiekosten vooraf. Je bouwt je assistent op, test hem in de browser en activeert pas daarna het pakket dat past bij je volume.
        </p>
      </section>

      <section className="pricing-intro-grid">
        {pricingHighlights.map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.title} className="glass-panel intro-card">
              <div className="icon-wrapper subtle">
                <Icon size={20} color="var(--primary)" />
              </div>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          );
        })}
      </section>

      <section className="pricing-grid">
        {PRICING_PLANS.map((plan) => {
          const isActive = plan.key === selectedPlanKey;

          return (
            <article
              key={plan.key}
              className={`pricing-card glass-panel ${isActive ? 'active' : ''}`}
              onClick={() => {
                setSelectedPlanKey(plan.key);
                setMinutes(plan.includedMinutes);
                setTasks(plan.includedTasks);
              }}
            >
              <p className="plan-tag">{plan.tag}</p>
              <h3>{plan.name}</h3>
              <div className="plan-price">€{plan.monthlyPriceEur}</div>
              <p className="plan-sub">per maand excl. btw, vanaf live activatie</p>

              <ul>
                <li>
                  <CheckCircle2 size={16} /> {plan.includedMinutes} belminuten inbegrepen
                </li>
                <li>
                  <CheckCircle2 size={16} /> {plan.includedTasks} AI-taken inbegrepen
                </li>
                <li>
                  <CheckCircle2 size={16} /> €{plan.overageMinuteEur.toFixed(2)} per extra minuut
                </li>
                <li>
                  <CheckCircle2 size={16} /> €{plan.overageTaskEur.toFixed(2)} per extra taak
                </li>
                <li>
                  <CheckCircle2 size={16} /> Ideaal voor: {plan.idealFor}
                </li>
              </ul>
            </article>
          );
        })}
      </section>

      <section className="calculator-panel glass-panel">
        <div className="calculator-head">
          <h2>
            <Calculator size={20} /> Kosten calculator
          </h2>
          <p>Pas je verwachte volume aan en zie meteen wat dit per maand betekent voor het gekozen pakket.</p>
        </div>

        <div className="calculator-controls">
          <label>
            Belminuten per maand: <strong>{minutes}</strong>
            <input
              type="range"
              min="50"
              max="2500"
              step="10"
              value={minutes}
              onChange={(event) => setMinutes(Number(event.target.value))}
            />
          </label>

          <label>
            AI-taken per maand: <strong>{tasks}</strong>
            <input
              type="range"
              min="100"
              max="8000"
              step="25"
              value={tasks}
              onChange={(event) => setTasks(Number(event.target.value))}
            />
          </label>
        </div>

        <div className="calculator-stats">
          <div>
            <span>Abonnement</span>
            <strong>€{calculator.base}</strong>
          </div>
          <div>
            <span>Extra kosten</span>
            <strong>€{calculator.overage}</strong>
          </div>
          <div>
            <span>Extra minuten</span>
            <strong>{calculator.overageMinutes}</strong>
          </div>
          <div>
            <span>Totaal per maand</span>
            <strong>€{calculator.total}</strong>
          </div>
        </div>
      </section>

      <section className="sources-panel glass-panel">
        <h2>Wat zit standaard in elk pakket?</h2>
        <ul>
          <li>
            <span>Onboarding wizard met bedrijfscontext, openingstijden en tone of voice</span>
            <strong>Inbegrepen</strong>
          </li>
          <li>
            <span>Browser-test met microfoon, AI states en transcript feedback</span>
            <strong>Inbegrepen</strong>
          </li>
          <li>
            <span>Dashboard voor usage, factuurstatus, integraties en instellingen</span>
            <strong>Inbegrepen</strong>
          </li>
          <li>
            <span>Live activatie op nummer zodra je daar klaar voor bent</span>
            <strong>Inbegrepen</strong>
          </li>
        </ul>
      </section>

      <section className="faq-grid">
        {faqs.map((faq) => (
          <article key={faq.question} className="glass-panel faq-card">
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </article>
        ))}
      </section>

      <PublicFooter />
    </div>
  );
};

export default PricingPage;
