import React, { useMemo, useState } from 'react';
import { CheckCircle2, Calculator } from 'lucide-react';
import { PRICING_PLANS, getPlanByKey } from '../lib/pricing';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import './LandingPage.css';

const PricingPage = () => {
  const [selectedPlanKey, setSelectedPlanKey] = useState(PRICING_PLANS[1].key);
  const [minutes, setMinutes] = useState(PRICING_PLANS[1].includedMinutes);
  const [tasks, setTasks] = useState(PRICING_PLANS[1].includedTasks);

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
        <h1>Eerlijke en duidelijke pakketten</h1>
        <p>
          Kies het pakket dat past bij je belvolume. Je ziet meteen wat inbegrepen is en wat extra minuten kosten.
        </p>
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
              <p className="plan-sub">per maand (excl. btw)</p>

              <ul>
                <li>
                  <CheckCircle2 size={16} /> {plan.includedMinutes} belminuten inbegrepen
                </li>
                <li>
                  <CheckCircle2 size={16} /> {plan.includedTasks} AI tasks inbegrepen
                </li>
                <li>
                  <CheckCircle2 size={16} /> Overage: €{plan.overageMinuteEur.toFixed(2)}/min
                </li>
                <li>
                  <CheckCircle2 size={16} /> Overage: €{plan.overageTaskEur.toFixed(2)}/task
                </li>
              </ul>
            </article>
          );
        })}
      </section>

      <section className="calculator-panel glass-panel">
        <div className="calculator-head">
          <h2>
            <Calculator size={20} /> Maandelijkse kosten calculator
          </h2>
          <p>Pas je verwachte gebruik aan en zie direct je geschatte maandbedrag.</p>
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
            AI tasks per maand: <strong>{tasks}</strong>
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
        <h2>Wat krijg je bij elk pakket?</h2>
        <ul>
          <li>
            <span>Onboarding wizard en AI prompt op maat</span>
            <strong>Inbegrepen</strong>
          </li>
          <li>
            <span>Web call test met live status</span>
            <strong>Inbegrepen</strong>
          </li>
          <li>
            <span>Dashboard met usage en factuurstatus</span>
            <strong>Inbegrepen</strong>
          </li>
          <li>
            <span>Live zetten op telefoonnummer na approval</span>
            <strong>Inbegrepen</strong>
          </li>
        </ul>
      </section>

      <PublicFooter />
    </div>
  );
};

export default PricingPage;
