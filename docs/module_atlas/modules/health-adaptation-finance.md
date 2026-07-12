# Health Adaptation Finance
**Module ID:** `health-adaptation-finance` · **Route:** `/health-adaptation-finance` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses climate adaptation investments in health infrastructure and systems, quantifying co-benefits, adaptation returns on investment, and alignment with WHO climate-health nexus frameworks. Covers heat stress resilience, vector disease surveillance, climate-resilient hospitals, and health system capacity building in climate-vulnerable regions.

> **Business value:** Supports climate finance institutions and development banks in prioritising health system adaptation investments, demonstrating economic co-benefits to governments, and meeting emerging climate-health disclosure requirements under WHO-UNFCCC health adaptation frameworks.

**How an analyst works this module:**
- Select the geographic focus (country or region) and health system investment category (hospital infrastructure, surveillance, cooling, vector control).
- Input adaptation investment parameters and compute the AROI using WHO VSL and regional DALY estimates.
- Review the climate health vulnerability map to prioritise intervention areas by disease burden and adaptation deficit.
- Generate the adaptation co-benefits report quantifying lives saved, DALY reduction, and economic productivity gains.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUNTRIES`, `COUNTRY_NAMES`, `EARLY_WARNING_TYPES`, `FINANCE_TYPES`, `INFRA_CATEGORIES`, `QUARTERS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `QUARTERS` | `['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];` |
| `FINANCE_TYPES` | `['Green Bond','Social Bond','Sustainability-Linked','Blended Finance','MDB Programme','Sovereign Health Bond','Impact Fund','Concessional Loan'];` |
| `adaptSpendM` | `Math.floor(s1*2000+20);` |
| `mitigSpendM` | `Math.floor(adaptSpendM*1.5+s2*1000);` |
| `healthAdaptPct` | `+(adaptSpendM/(adaptSpendM+mitigSpendM)*100).toFixed(1);` |
| `donorCommitM` | `Math.floor(s3*3000+50);` |
| `financingGapM` | `Math.floor(s4*5000+200);` |
| `popM` | `+(s5*150+2).toFixed(1);` |
| `infraScores` | `INFRA_CATEGORIES.map((_,ci)=>({category:INFRA_CATEGORIES[ci],score:Math.floor(sr(i*31+ci*7+413)*100),investNeedM:Math.floor(sr(i*37+ci*11+417)*500+10)}));` |
| `earlyWarning` | `EARLY_WARNING_TYPES.map((_,ei)=>({type:EARLY_WARNING_TYPES[ei],coveragePct:Math.floor(sr(i*41+ei*13+419)*100),effectivenessPct:Math.floor(sr(i*43+ei*17+421)*100),investNeedM:Math.floor(sr(i*47+ei*7+423)*100+5)}));` |
| `qTrend` | `QUARTERS.map((_,qi)=>({q:QUARTERS[qi],adaptSpend:Math.floor(adaptSpendM*(0.8+qi*0.03+sr(i*53+qi*11)*0.1)),gapClosure:Math.floor(sr(i*59+qi*7)*10+qi*2)}));` |
| `financingInstruments` | `FINANCE_TYPES.map((_,fi)=>({type:FINANCE_TYPES[fi],amountM:Math.floor(sr(i*61+fi*11+425)*800+10),tenorYrs:Math.floor(sr(i*67+fi*13+427)*15+3),rateSpread:+(sr(i*71+fi*7+429)*3+0.5).toFixed(2)}));` |
| `fmt` | `(n)=>n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n);` |
| `globalKPIs` | `useMemo(()=>{ const totalAdapt=COUNTRIES.reduce((s,c)=>s+c.adaptSpendM,0);` |
| `totalMitig` | `COUNTRIES.reduce((s,c)=>s+c.mitigSpendM,0);` |
| `totalDonor` | `COUNTRIES.reduce((s,c)=>s+c.donorCommitM,0);` |
| `totalGap` | `COUNTRIES.reduce((s,c)=>s+c.financingGapM,0);` |
| `infraAgg` | `useMemo(()=>INFRA_CATEGORIES.map(cat=>{` |
| `scores` | `COUNTRIES.map(c=>c.infraScores.find(x=>x.category===cat));` |
| `avgScore` | `Math.floor(scores.reduce((s,x)=>s+(x?.score\|\|0),0)/ Math.max(1, scores.length));` |
| `totalNeed` | `scores.reduce((s,x)=>s+(x?.investNeedM\|\|0),0);` |
| `ewsAgg` | `useMemo(()=>EARLY_WARNING_TYPES.map(ew=>{` |
| `items` | `COUNTRIES.map(c=>c.earlyWarning.find(x=>x.type===ew));` |
| `avgCov` | `Math.floor(items.reduce((s,x)=>s+(x?.coveragePct\|\|0),0)/ Math.max(1, items.length));` |
| `avgEff` | `Math.floor(items.reduce((s,x)=>s+(x?.effectivenessPct\|\|0),0)/ Math.max(1, items.length));` |
| `totalInvest` | `items.reduce((s,x)=>s+(x?.investNeedM\|\|0),0);` |
| `finInstrumentAgg` | `useMemo(()=>FINANCE_TYPES.map(ft=>{` |
| `totalM` | `items.reduce((s,x)=>s+x.amountM,0);` |
| `avgTenor` | `items.length?+(items.reduce((s,x)=>s+x.tenorYrs,0)/items.length).toFixed(1):0;` |
| `avgSpread` | `items.length?+(items.reduce((s,x)=>s+x.rateSpread,0)/items.length).toFixed(2):0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `COUNTRY_NAMES`, `EARLY_WARNING_TYPES`, `FINANCE_TYPES`, `INFRA_CATEGORIES`, `QUARTERS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate-Related DALY Burden (per 100k) | — | WHO Global Health Observatory | Disability-adjusted life years lost per 100,000 population attributable to climate-sensitive diseases (malaria, dengue, diarrhoea, heat stress); highest in sub-Saharan Africa and South Asia. |
| Health Adaptation Finance Gap ($ bn/yr) | — | Lancet Countdown 2023 | Annual funding shortfall for climate-resilient health systems in LMICs relative to assessed needs; current adaptation finance to health is under $5bn/yr. |
| Climate-Resilient Hospital Index | — | WHO Safe Hospitals Framework | Composite index assessing hospital structural resilience, backup power, water security, and surge capacity for climate-related health emergencies. |
| Heat Mortality Adaptation Benefit | — | Gasparrini et al. 2023 | Estimated reduction in heat-attributable mortality from urban heat island mitigation and cooling centre deployment in high-heat-risk cities. |
- **WHO climate health burden data (DALY/mortality)** → Regionalise by climate hazard type (heat, floods, vector disease) → **Climate health vulnerability scores by geography**
- **Health infrastructure investment data** → Apply AROI formula with WHO VSL and regional DALY costs → **Adaptation ROI by investment type**
- **Climate scenario projections (IPCC AR6)** → Map hazard intensification trajectories to health burden projections → **Future health burden under climate scenarios**

## 5 · Intermediate Transformation Logic
**Methodology:** Adaptation ROI (Health)
**Headline formula:** `AROI = (Lives_saved × VSL + DALY_averted × VSL_DALY - CapEx_adaptation) / CapEx_adaptation`

Computes the economic return on adaptation investment in health infrastructure by monetising lives saved and disability-adjusted life years averted using WHO-recommended value of statistical life (VSL) estimates adjusted for purchasing power parity. A positive AROI indicates adaptation investment exceeds its cost; WHO evidence suggests health adaptation yields 3â€“7× returns in vulnerable regions.

**Standards:** ['WHO HEARTS Climate Module', 'GFCR Health Adaptation Finance Standard', 'Lancet Countdown on Health and Climate Change']
**Reference documents:** WHO â€” Climate Change and Health (2021); Lancet Countdown on Health and Climate Change (Annual Report 2023); Global Commission on Adaptation â€” Health Adaptation (2019); Gasparrini et al. (2023) â€” Heat Mortality and Adaptation

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — First backend vertical: the AROI engine the guide promises (analytics ladder: rung 1 → 2)

**What.** This is a thin tier-B module whose §7 mismatch flag is blunt: the advertised `AROI = (Lives_saved×VSL + DALY_averted×VSL_DALY − CapEx)/CapEx` methodology has **no implementation** — every spend figure, financing gap, infrastructure score and instrument term across the 30 countries is `sr()`-seeded; the only genuine computation is the `healthAdaptPct` spend split. Evolution A builds the module's first backend vertical implementing the §8 cost-benefit model: lives saved and DALYs averted from baseline burden × intervention risk-reduction fractions, monetised with PPP-adjusted VSL, yielding AROI and BCR per country/intervention.

**How.** (1) Seed a reference table of climate-sensitive DALY burden per country from WHO Global Health Observatory (the 250–800/100k range §8.3 cites) plus intervention efficacy fractions from the literature the page already names (Gasparrini heat 15–40%). (2) New route `POST /health-adaptation/aroi` takes country, intervention category (the existing 8 `INFRA_CATEGORIES`), CapEx/OpEx and discount rate; returns Lives_saved, DALY_averted, Benefit, AROI, BCR with honest nulls where burden data is missing. (3) Replace the seeded country cards with engine output plus a scenario toggle (IPCC AR6 hazard intensification). (4) Validation: computed BCRs reconcile to the WHO/GCA 3–7× benchmark band.

**Prerequisites.** WHO GHO burden ingestion (public, keyless); removal of the `genCountries(30)` PRNG fabrication — the module currently fails the platform's no-fabricated-random standard in spirit. **Acceptance:** a Bangladesh cooling-centre case produces a BCR inside the published 3–7× band, reproducible from stored inputs; zero `sr()` calls remain in the page's financial fields.

### 9.2 Evolution B — Adaptation-finance copilot with a VSL-honesty guardrail (LLM tier 1)

**What.** A copilot for development-bank users answering "why is Nigeria tiered Critical?", "what does the 33% adaptation share mean?", and "what would an AROI here require?" — grounded in this Atlas page. Its most valuable near-term behaviour is candour: until Evolution A ships, it must state that dollar figures are illustrative synthetic placeholders (per §7.5) and explain what the WHO-VSL methodology *would* compute, citing §8.

**How.** Tier 1 RAG per the roadmap: atlas record embedded in `llm_corpus_chunks`; system prompt carries the §7 mismatch flag and the vulnerability-tier cutoffs ($3,000M/$1,500M/$500M gap) so tier assignments are explained mechanically. After Evolution A, upgrade to tier 2: the copilot calls the new `/aroi` endpoint for what-ifs ("recompute at LMIC VSL $1M vs HIC $5M") — a genuinely useful sensitivity given §8.6 notes VSL choice dominates and is ethically contested; the copilot must always surface which VSL was used.

**Prerequisites.** Copilot router + pgvector corpus (Phase 1); for tier 2, Evolution A. **Acceptance:** asked "is this real spend data?", the copilot answers no with a §7.5 citation; post-Evolution-A, every AROI it quotes matches a logged tool call including its VSL parameter.