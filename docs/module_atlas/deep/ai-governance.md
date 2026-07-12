## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide headlines **SHAP-based explainability**
> (`SHAP_i = Σ ...·[f(S∪{i}) − f(S)]`) and a fairness gap `max_group(acc) − min_group(acc)`.
> **SHAP is not implemented anywhere** (neither the `ai_governance_engine.py` backend nor the
> page); the fairness logic is implemented differently — as a **disparate-impact-ratio (DIR)**
> bias assessment, not an accuracy-gap. Also note the React page is **disconnected from the
> backend**: it renders fully seeded synthetic AI systems and makes zero API calls, while the
> real methodology lives in the engine (exposed via `/api/v1/ai-governance/*`). Sections below
> document the engine (the substantive methodology) and flag the page.

### 7.1 What the module computes (backend engine, E77)

`AIGovernanceEngine.assess_ai_system` produces a per-system governance result combining four
scored frameworks, an energy footprint and a bias severity into an ESG composite:

```
ESG_composite = 0.35·Governance + 0.30·Environmental + 0.35·Social
Governance  = 0.50·EU_AI_Act_score + 0.50·NIST_RMF_score
Environmental = 100 − (annual_tCO2e/100)·100   (clamped 0–100; +10 if grid < 100 gCO₂/kWh)
Social      = 0.40·bias_score + 0.30·model_card_pct + 0.30·OECD_score
ESG tier    = leading ≥75 · advanced ≥55 · developing ≥35 · else initial
```

### 7.2 Parameterisation / scoring rubric

**EU AI Act tiering (`classify_eu_ai_act_risk`):** category → tier → base score —
social scoring → *unacceptable* (base 0, "must not be deployed"); any Annex III high-risk
category → *high_risk* (base 50); GPAI → high_risk (base 55); out-of-scope → *minimal* (90);
else *limited_risk* (75). For high-risk systems, `compliance_score = base + (met/total)·50`
over the 10 Art. 9–49 obligations, each met/unmet via a model-card provision map. 12 high-risk
categories carry real Annex III references (biometric ID, critical infrastructure, employment,
essential services incl. credit scoring, law enforcement, medical devices, GPAI-systemic
>10²⁵ FLOPs).

**NIST AI RMF (`score_nist_rmf`):** 4 functions (Govern/Map/Measure/Manage) each weighted 0.25;
`overall = Σ function_pct × 0.25`; tier advanced ≥80 / … / initial. Unassessed categories
default to 0 (conservative).

**OECD Principles (`score_oecd_principles`):** 5 principles × 20% weight, sub-indicators scored
1/0.5/0 (met/partial/not-met).

**Energy profiles (`MODEL_ENERGY_PROFILES`, cited Patterson 2021 / Samsi 2023):**

| Scale | Training MWh | Inference Wh/query |
|---|---|---|
| sub-1B | 0.5 | 0.0001 |
| 1B–10B | 5.0 | 0.001 |
| 10B–100B | 50.0 | 0.003 |
| >100B | 500.0 | 0.010 |

**Bias thresholds (`assess_algorithmic_bias`):** across 7 protected characteristics —
DIR = minority_rate/majority_rate; severity critical <0.60, high <0.70, medium <0.80 (the
EEOC **4/5 Rule**), else low; SPD < −0.10 and equalized-odds gap > 0.10 also flag. Bias→score:
critical 0, high 30, medium 60, low 90, none 70.

### 7.3 Calculation walkthrough

1. EU AI Act, NIST, OECD, energy and bias are computed independently.
2. Energy: `annual_MWh = training_MWh + daily_queries × Wh/query × 365 / 10⁶`;
   `Scope2_tCO2e = annual_MWh × 1000 × grid_gCO₂/kWh / 10⁶`; benchmarked against a 475 gCO₂/kWh
   EU-average grid.
3. Pillars combine per §7.1; ESG composite and tier returned per system.
4. `assess_portfolio` averages ESG/NIST across systems, sums energy, and distributes EU-AI-Act
   tiers.

### 7.4 Worked example — one high-risk system

Credit-scoring AI (essential_services → high-risk, base 50): 5 of 10 Art. obligations met →
`EU = 50 + (5/10)·50 = 75`. NIST overall 60. Grid 350 gCO₂/kWh, 10B–100B model, training
complete, 50,000 queries/day:

| Step | Computation | Result |
|---|---|---|
| Inference MWh | 50,000 × 0.003 × 365 / 10⁶ | 0.0548 MWh |
| Total MWh | 50 + 0.0548 | 50.05 MWh |
| Scope 2 | 50.05 × 1000 × 350 / 10⁶ | **17.52 tCO₂e/yr** |
| Environmental | 100 − (17.52/100)·100 | 82.5 |
| Governance | 0.5·75 + 0.5·60 | 67.5 |
| Social (bias medium 60, card 70%, OECD 55) | 0.4·60+0.3·70+0.3·55 | 61.5 |
| **ESG composite** | 0.35·67.5 + 0.30·82.5 + 0.35·61.5 | **69.9** → "advanced" |

### 7.5 The frontend page (disconnected)

`AIGovernancePage.jsx` does **not call the engine**. It generates synthetic AI systems from the
PRNG `sr(s)=frac(sin(s+1)×10⁴)` — `euScore = 20+sr·75`, `nistScore = 25+sr·70`,
`biasScore = 10+sr·80`, `energyMwh = 10+sr·2000`, `co2e = energyMwh·(0.2+sr·0.4)`, plus
incidents, vendors, TRL and documentation status. So the dashboard's numbers are random draws,
not the engine's computed scores; the two would need wiring for the page to reflect real
assessments. The route layer (`/api/v1/ai-governance/assess`, `/bias-assessment`,
`/energy-footprint`, `/eu-ai-act`, and four `ref/*` endpoints) exposes the engine to other
callers.

### 7.6 Data provenance & limitations

- **Backend engine:** methodology is real and standards-grounded; scores depend on caller-
  supplied audit evidence (model-card fields, NIST/OECD sub-scores, bias metric values).
  Unassessed inputs default to 0/conservative, so a system with no evidence scores low by design.
- **No SHAP:** neither layer computes Shapley explanations despite the guide; explainability is
  represented only as a model-card completeness percentage.
- **Frontend synthetic:** all page KPIs are seeded PRNG values, disconnected from the engine.
- Energy profiles are order-of-magnitude literature estimates; training energy is one-time and
  should be amortised (the engine notes this) but is added directly to the annual figure here.

### 7.7 Framework alignment

- **EU AI Act (Reg. (EU) 2024/1689)** — correct 4-tier structure (unacceptable/high/limited/
  minimal), Annex III high-risk categories, Art. 5 prohibitions, Art. 9–49 high-risk obligations,
  Art. 51/53/55 GPAI-systemic duties, and the real effective dates (prohibited 2025-02-02,
  high-risk 2026-08-02).
- **NIST AI RMF 1.0 (2023)** — the four Govern/Map/Measure/Manage functions with their
  sub-categories, equal-weighted to an overall profile score and maturity tier.
- **OECD AI Principles (2023)** — five value-based principles, sub-indicator scoring.
- **EEOC 4/5 Rule / EU non-discrimination** — disparate-impact ratio < 0.80 as the adverse-impact
  trigger; SPD and equalized-odds as supplementary fairness metrics (ISO/IEC 24027 referenced for
  external audit).
- **GHG Protocol Scope 2** — AI energy converted to location/market-based Scope 2 emissions with
  a grid carbon factor; ISO 42001:2023 (AI management systems) frames the governance pillar.
