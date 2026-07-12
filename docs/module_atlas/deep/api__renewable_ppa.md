## 7 · Methodology Deep Dive

### 7.1 What the module computes

Two engines back `/api/v1/renewable-ppa`:

- **`renewable_project_engine.py`** (`RenewableProjectEngine`) — Weibull-based wind yield,
  GHI-based solar yield (both with P50/P75/P90), LCOE via capital-recovery factor, and full
  project IRR/NPV with and without carbon revenue (`POST /wind-yield`, `/solar-yield`, `/lcoe`,
  `/project-assess`).
- **`ppa_risk_scorer.py`** (`PPARiskScorer`) — a 5-dimension weighted PPA risk score with
  bankability rating (`POST /ppa-risk`). Nine `GET /ref/*` endpoints serve the underlying
  lookup tables.

Formulas quoted from code:

```
mean wind speed = λ · Γ(1 + 1/k)                                  # Weibull mean
CF_gross = [F(rated) − F(cut_in)]·0.45 + [F(cut_out) − F(rated)]·1.0 ,  F(v)=1−e^−(v/λ)^k ; cap 65%
CF_net   = CF_gross × (1 − wake%) × availability%
P50 = capacity × CF_net × 8760 ;  P75 = P50×(1 − 0.674σ) ;  P90 = P50×(1 − 1.282σ)
solar specific yield = GHI × PR_effective ,  PR_eff = PR × (1 − |−0.35%|×15°C)
LCOE = (capex × CRF + opex) / E ,   CRF = r(1+r)^n / ((1+r)^n − 1)
LCOE_degraded = [capex + Σ opex/(1+r)^t] / [Σ E₁(1−d)^(t−1)/(1+r)^t]   # NREL/IEA canonical form
PPA composite = Σ dimension_score × weight  (weights .25/.25/.15/.20/.15)
```

### 7.2 Parameterisation

**Wind:** 5 turbine classes (onshore 2/4 MW, offshore 5/8/12 MW) with cut-in/rated/cut-out
speeds, capex €1,100–3,200/kW, opex €30–90/kW/yr, life 25–30y (IRENA 2024 cost ranges cited in
docstring); 15 Weibull resource regions (k 1.7–2.2, λ 6.0–10.5 m/s — e.g. North Sea k=2.1,
λ=10.5). Wind uncertainty σ = 7% of annual energy (in-code comment "~6-10% std"); the 0.45
partial-power fraction is a stated simplification of the power curve. **Solar:** GHI table for
20 countries (DE 1,100 … SA 2,200 kWh/m²/yr); defaults capex €750/kWp, opex €12/kWp/yr,
PR 0.82, degradation 0.5%/yr, life 30y, temperature coefficient −0.35%/°C at +15 °C above STC;
σ = 5% inter-annual variability. **PPA scorer tables** (0–100, higher = riskier): credit
AAA 5 → CCC 70 (unrated 40); price structure feed-in-tariff 8 / fixed 10 / CfD 12 →
full merchant 80, plus `+0.5 × merchant_exposure%`; tenor <5y = 40, 5–15y = 20, >15y = 10;
curtailment low 10 → very_high 75; regulatory stable 10 → very_high 70, +20 if subsidy
dependence >50%. Risk bands: ≤20 low, ≤35 moderate, ≤55 high, else critical. Bankability:
composite ≤25 **and** credit ≤25 ⇒ bankable; composite ≤40 ⇒ conditionally bankable; else
non-bankable.

### 7.3 Calculation walkthrough

`assess_project` picks the technology leg (wind: yield from turbine + region + turbine-count;
solar: from country GHI + kWp), derives capex/opex from the class defaults unless overridden,
computes LCOE at the P50 energy, then: revenue = P50 × PPA price; CO₂ avoided = P50 ×
grid EF (default 0.4 tCO₂/MWh); carbon revenue = CO₂ × carbon price (default €80/t); NPV =
−capex + Σ(revenue − opex)/(1+r)^t; IRR by Newton-Raphson **with bisection fallback** on
[−capex, cf, …, cf] (the code comment records that this replaced a MOIC^(1/n) proxy that
"materially understates the return"); payback = capex / annual cash flow. `score_ppa` builds
the five `PPARiskDimension`s, accumulates narrative `risk_factors` and `mitigation_suggestions`
when a dimension breaches its trigger (e.g. credit ≥40 → "obtain parent company guarantee"),
and returns the weighted composite.

### 7.4 Worked example — 10 × 2 MW onshore, N-Europe (k=2.0, λ=7.5), PPA €60/MWh

| Step | Computation | Result |
|---|---|---|
| Weibull CDF values | F(3)=1−e^−0.16=0.148; F(12)=1−e^−2.56=0.923; F(25)=1−e^−11.1≈1.000 | — |
| CF gross | (0.923−0.148)×0.45 + (1.000−0.923)×1.0 = 0.349+0.077 | 42.6% |
| CF net | 0.426 × 0.92 × 0.97 | **38.0%** |
| P50 | 20 MW × 0.380 × 8760 | **66,600 MWh** |
| P90 | 66,600 × (1 − 1.282×0.07) | 60,624 MWh |
| Capex / opex | 20,000 kW × €1,200 / ×€35 | €24.0M / €0.70M/yr |
| CRF (6%, 25y) | 0.06×1.06²⁵/(1.06²⁵−1) | 0.078227 |
| LCOE | (24.0M×0.078227 + 0.70M)/66,600 | **€38.7/MWh** |
| Annual CF | 66,600×60 − 700,000 | €3.296M |
| NPV @6% | −24.0M + 3.296M×12.7834 | **+€18.1M** |
| CO₂ avoided / carbon rev | 66,600×0.4 = 26,640 t → ×€80 | €2.13M/yr |

(Annuity factor 12.7834 = (1−1.06⁻²⁵)/0.06.) IRR solves ≈13.2%; with carbon revenue the annual
CF rises to €5.43M and IRR ≈22%.

### 7.5 PPA scoring example

Offtaker BBB (20), fixed-escalation (15), 12y tenor (20), moderate curtailment (30), stable
regulatory (10): composite = 20×0.25 + 15×0.25 + 20×0.15 + 30×0.20 + 10×0.15 =
5 + 3.75 + 3 + 6 + 1.5 = **19.25 → "low" band**; credit 20 ≤ 25 and composite ≤ 25 ⇒
**bankable**. One mitigation emitted (curtailment ≥30 → storage co-location note).

### 7.6 Data provenance & limitations

- **No PRNG** — deterministic engineering formulas over registry constants; P75/P90 come from
  fixed normal-quantile scalings (0.674σ/1.282σ), not simulation.
- Turbine capex/opex, Weibull parameters, GHI values and all PPA dimension scores are
  transcribed reference constants (IRENA/DNV/Pexapark cited in docstrings) — indicative, not
  site-specific; a real EYA would integrate the actual power curve against measured wind
  distributions instead of the 0.45 partial-power fraction and 65% CF cap.
- Wind yield ignores air density, hub-height shear scaling and degradation; solar temperature
  loss is a single fixed adjustment; IRR/NPV use flat (non-escalating) revenue and opex, no
  tax, no debt structure (contrast `api::project_finance`, which layers debt but has its own
  unit bug).
- "CO₂ avoided" uses a single static grid EF (0.4 default) — a marginal-emissions or
  time-matched approach would differ materially.
- PPA weights and trigger thresholds are expert-judgement calibrations without cited studies.

### 7.7 Framework alignment

- **IEC 61400-12** — cited basis for wind power-performance treatment; the Weibull-CDF
  capacity-factor construction is the standard simplified yield method.
- **P50/P75/P90 exceedance convention (DNV energy-yield practice)** — quantiles derived from a
  normal uncertainty of annual energy, matching independent-engineer report structure.
- **IRENA Renewable Power Generation Costs 2024** — capex/opex anchors and the LCOE/CRF
  formulation (IRENA and NREL both publish LCOE this way); the degradation-aware LCOE follows
  the canonical discounted-energy denominator.
- **GHG Protocol project accounting** — avoided-emissions logic (generation × grid EF), albeit
  with an average rather than build-margin/operating-margin EF.
- **EFET / IRENA corporate-PPA risk practice / Pexapark** — the five scored dimensions
  (counterparty, price structure, tenor, curtailment, regulatory) mirror the standard European
  PPA bankability checklist.
