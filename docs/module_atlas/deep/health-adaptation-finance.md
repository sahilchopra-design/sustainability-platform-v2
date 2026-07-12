## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's methodology is an **Adaptation ROI**:
> `AROI = (Lives_saved×VSL + DALY_averted×VSL_DALY − CapEx)/CapEx`. **None of this is in the code.**
> There is no VSL, no DALY, no lives-saved, no AROI anywhere on the page. The module is a **seeded
> country adaptation-finance tracker**: 30 climate-vulnerable countries with `sr()`-generated spend,
> donor commitments, financing gaps, infrastructure scores, early-warning coverage and financing
> instruments. The only computed ratio is a spend split, not a return. Sections below document the
> code as it actually behaves.

### 7.1 What the module computes

`genCountries(30)` seeds every field per country (`sr(seed)=frac(sin(seed+1)×10⁴)`):

```js
adaptSpendM   = floor(s1×2000 + 20)                        // $20–2020M adaptation spend
mitigSpendM   = floor(adaptSpendM×1.5 + s2×1000)           // mitigation spend
healthAdaptPct= adaptSpendM/(adaptSpendM+mitigSpendM)×100  // the one real ratio
donorCommitM  = floor(s3×3000 + 50)
financingGapM = floor(s4×5000 + 200)                        // drives vulnerability tier
vulnerabilityTier = gap>3000 Critical | >1500 High | >500 Medium | else Low
```

Per country, 8 infrastructure categories (score 0–100 + invest need), 6 early-warning types (coverage
%, effectiveness %, invest need), a 12-quarter spend trend, and 8 financing instruments (amount, tenor,
rate spread) — all seeded.

### 7.2 Parameterisation

The only structural (non-seeded) inputs are the category and instrument lists and the 30 real country
names (Bangladesh, India, Nigeria, Kenya…, region-bucketed South Asia/Africa/LatAm). Vulnerability-tier
thresholds ($3,000M / $1,500M / $500M financing gap) are the only fixed numeric cutoffs. `healthAdaptPct`
is the sole genuine computation; every dollar figure is a PRNG draw.

### 7.3 Calculation walkthrough

Countries are filtered by search/region. Global KPIs sum seeded values: `totalAdapt`, `totalMitig`,
`totalDonor`, `totalGap`. Infrastructure and early-warning aggregates average the per-country seeded
scores across all 30 countries (`avgScore`, `avgCov`, `avgEff`, `totalInvest`). Financing-instrument
aggregates sum amounts and average tenor/spread.

### 7.4 Worked example (one country)

Suppose `adaptSpendM = 400`, `s2` yields `mitigSpendM = 800`:

```
healthAdaptPct = 400 / (400 + 800) × 100 = 33.3%
financingGapM  = 3,500  →  vulnerabilityTier = Critical (>3000)
```

The 33.3% adaptation share and Critical tier are the module's headline signals — both derived
transparently, but from synthetic spend figures, not reported climate-finance data.

### 7.5 Data provenance & limitations

- **Entirely synthetic.** Every spend, gap, donor commitment, infrastructure score and instrument term
  is `sr()`-seeded. Only the 30 country names and the category taxonomies are real.
- **No AROI model.** The guide's WHO-VSL / DALY adaptation-return methodology is absent — the page
  cannot answer "what return does this adaptation investment yield", only "how is (synthetic) spend
  split and where are the (synthetic) gaps".
- The 3–7× adaptation-return figure the guide cites (WHO) is not computed anywhere.

### 8 · Model Specification

**Status: specification — not yet implemented in code.** The AROI the guide describes has no
implementation; below is the model this module should run.

**8.1 Purpose & scope.** Compute the economic return on health-adaptation investment (hospital cooling,
surveillance, vector control, water/sanitation) by monetising avoided mortality and morbidity, for
development banks and climate-finance allocators.

**8.2 Conceptual approach.** A cost-benefit model monetising health outcomes with WHO-recommended VSL
and DALY costs, mirroring the WHO HEARTS climate module and the Global Commission on Adaptation's
benefit-cost ratios; hazard-conditioned burden projections from IPCC AR6 pathways.

**8.3 Mathematical specification.**
```
Lives_saved = Σ_hazard (Baseline_mortality_h × Population × RiskReduction_h(intervention))
DALY_averted = Σ (Baseline_DALY_h × Population × MorbidityReduction_h)
Benefit = Lives_saved × VSL_ppp + DALY_averted × VSL_DALY_ppp + ProductivityGain
AROI = (Benefit − CapEx − PV(OpEx)) / CapEx
BCR  = Benefit / (CapEx + PV(OpEx))
Future burden_h(t) = Baseline_h × HazardIntensification_h(scenario, t)   (IPCC AR6)
```

| Parameter | Source |
|---|---|
| VSL (PPP-adjusted) | WHO / OECD VSL; LMIC ~$1M, HIC ~$5M |
| DALY cost | WHO GBD / 1–3× GDP per capita |
| Climate DALY burden | WHO Global Health Observatory (250–800/100k) |
| Risk-reduction fractions | intervention efficacy literature (Gasparrini heat 15–40%) |
| Hazard intensification | IPCC AR6 SSP pathways |

**8.4 Data requirements.** Country baseline mortality/DALY by climate-sensitive disease, population,
intervention efficacy, CapEx/OpEx, discount rate, hazard projections. The page holds country/
infrastructure taxonomy but none of the epidemiological inputs.

**8.5 Validation.** Reconcile AROI/BCR against WHO HEARTS and Global Commission on Adaptation published
benefit-cost ratios (~3–7×); sensitivity on VSL and discount rate; back-test avoided-mortality against
Lancet Countdown estimates.

**8.6 Limitations & model risk.** VSL choice dominates and is ethically contested (LMIC vs HIC values);
efficacy fractions are uncertain; attribution of health outcomes to specific interventions is hard.
Conservative fallback: report DALY-averted and BCR ranges rather than a single AROI.

**Framework alignment:** WHO Climate Change and Health / HEARTS — the VSL/DALY monetisation; Lancet
Countdown — burden and heat-mortality indicators; IPCC AR6 WG2 Ch7 — hazard-to-health projections;
Global Commission on Adaptation — the benefit-cost benchmark the AROI reconciles against.
