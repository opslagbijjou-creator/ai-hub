import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Calculator, Moon, Sun } from 'lucide-react';
import {
  COST_ASSUMPTIONS,
  PRICING_PLANS,
  PRICING_VENDOR_BENCHMARKS,
  estimatePlanMetrics,
  getPlanByKey
} from '../lib/pricing';
import { useAppContext } from '../context/AppContext';
import './LandingPage.css';

const PricingPage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useAppContext();
  const [selectedPlanKey, setSelectedPlanKey] = useState(PRICING_PLANS[1].key);
  const [minutes, setMinutes] = useState(PRICING_PLANS[1].includedMinutes);
  const [tasks, setTasks] = useState(PRICING_PLANS[1].includedTasks);

  const selectedPlan = getPlanByKey(selectedPlanKey);

  const calculator = useMemo(() => {
    const overageMinutes = Math.max(0, minutes - selectedPlan.includedMinutes);
    const overageTasks = Math.max(0, tasks - selectedPlan.includedTasks);

    const base = selectedPlan.monthlyPriceEur;
    const overage = overageMinutes * selectedPlan.overageMinuteEur + overageTasks * selectedPlan.overageTaskEur;
    const revenue = base + overage;

    const cogs =
      COST_ASSUMPTIONS.fixedMonthlyCostEur +
      minutes * COST_ASSUMPTIONS.minuteVendorCostEur +
      tasks * COST_ASSUMPTIONS.taskVendorCostEur;

    const preTaxProfit = revenue - cogs;
    const netProfit = preTaxProfit * (1 - COST_ASSUMPTIONS.corpTaxRate);
    const netMarginPct = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      overageMinutes,
      overageTasks,
      revenue: Number(revenue.toFixed(2)),
      cogs: Number(cogs.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      netMarginPct: Number(Math.max(netMarginPct, 0).toFixed(1))
    };
  }, [minutes, selectedPlan, tasks]);

  return (
    <div className="landing-container marketing-page">
      <div className="marketing-grid"></div>

      <nav className="landing-nav glass-panel">
        <button className="nav-logo" onClick={() => navigate('/')}>
          <span className="font-heading">AI Hub Voice</span>
        </button>

        <div className="nav-links">
          <button onClick={() => navigate('/info')}>Info</button>
          <button className="active-link" onClick={() => navigate('/pricing')}>
            Pricing
          </button>
          <button onClick={() => navigate('/login')}>Dashboard</button>
        </div>

        <div className="nav-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === 'dark-mode' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="btn-primary" onClick={() => navigate('/setup-wizard')}>
            Start setup <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      <section className="pricing-hero">
        <h1>Pricing die op marge stuurt, niet op gokken</h1>
        <p>
          Pakketten zijn opgezet voor oplopende absolute winst per klant, inclusief buffer voor inkoop, operationele
          kosten en belastingdruk.
        </p>
      </section>

      <section className="pricing-grid">
        {PRICING_PLANS.map((plan) => {
          const metrics = estimatePlanMetrics(plan);
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

              <div className="plan-metrics">
                <span>Geschatte netto marge</span>
                <strong>{metrics.netMarginPct}%</strong>
              </div>
            </article>
          );
        })}
      </section>

      <section className="calculator-panel glass-panel">
        <div className="calculator-head">
          <h2>
            <Calculator size={20} /> Marge calculator
          </h2>
          <p>Speel met usage en zie direct omzet, kosten en netto marge op basis van het gekozen pakket.</p>
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
            <span>Verwachte omzet</span>
            <strong>€{calculator.revenue}</strong>
          </div>
          <div>
            <span>Geschatte kosten</span>
            <strong>€{calculator.cogs}</strong>
          </div>
          <div>
            <span>Netto winst na belasting</span>
            <strong>€{calculator.netProfit}</strong>
          </div>
          <div>
            <span>Netto marge</span>
            <strong>{calculator.netMarginPct}%</strong>
          </div>
        </div>

        <p className="calculator-meta">
          Aannames: vaste kosten €{COST_ASSUMPTIONS.fixedMonthlyCostEur}/mnd, variabele kost
          €{COST_ASSUMPTIONS.minuteVendorCostEur.toFixed(2)}/min en €{COST_ASSUMPTIONS.taskVendorCostEur.toFixed(2)} per
          task, vennootschapsbelasting {Math.round(COST_ASSUMPTIONS.corpTaxRate * 100)}%.
        </p>
      </section>

      <section className="sources-panel glass-panel">
        <h2>Bronnen en benchmarks</h2>
        <p className="text-muted">Gecontroleerd op 18 april 2026. Herijk dit bij vendor price changes.</p>
        <ul>
          {PRICING_VENDOR_BENCHMARKS.map((item) => (
            <li key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <a href={item.source} target="_blank" rel="noreferrer">
                bron
              </a>
            </li>
          ))}
        </ul>
      </section>

      <footer className="marketing-footer">
        <p>Wil je direct live testen? Start de wizard en voer een web call test uit.</p>
        <button className="btn-primary" onClick={() => navigate('/setup-wizard')}>
          Ga naar wizard <ArrowRight size={16} />
        </button>
      </footer>
    </div>
  );
};

export default PricingPage;
