# Sovereign ESG Scorer
**Module ID:** `sovereign-esg-scorer` · **Route:** `/sovereign-esg-scorer` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Sovereign ESG scoring model producing country-level pillar scores with underlying indicator weights, transparency into data sources, and portfolio sovereign ESG exposure reporting.

> **Business value:** Produces transparent, indicator-level sovereign ESG pillar scores enabling sovereign bond ESG integration and country comparison.

**How an analyst works this module:**
- Collect indicator data for each country from World Bank, UNDP, TI and ND-GAIN sources.
- Normalise indicators to 0–100 scale and apply pillar-defined indicator weights.
- Compute weighted pillar scores and combine into composite sovereign ESG score.
- Update scores on data refresh cycle and flag countries with material score changes.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHART_COLORS`, `COUNTRIES`, `COUNTRY_NAMES`, `ISO2`, `PORTFOLIO`, `PROVIDERS`, `PROVIDER_DATA`, `QUARTERS`, `RATING_BASE`, `RATING_TIERS`, `REGIONS`, `REGION_MAP`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Overview','E-Score','S-Score','G-Score','Trend Analysis','Provider Comparison','Portfolio Exposure'];` |
| `REGIONS` | `['Africa','Asia-Pacific','Europe','Latin America','Middle East','North America'];` |
| `QUARTERS` | `['Q1-22','Q2-22','Q3-22','Q4-22','Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24'];` |
| `COUNTRIES` | `COUNTRY_NAMES.map((name,i)=>{` |
| `baseE` | `Math.max(10,Math.min(98,90-(ratingIdx*12)+sr(s)*15-7));` |
| `baseS` | `Math.max(10,Math.min(98,88-(ratingIdx*11)+sr(s+3)*14-6));` |
| `baseG` | `Math.max(10,Math.min(98,86-(ratingIdx*10)+sr(s+6)*16-7));` |
| `totalEsg` | `+(eScore*0.33+sScore*0.33+gScore*0.34).toFixed(1);` |
| `gdpTrillions` | `regionIdx===5?+(sr(s+9)*20+0.5).toFixed(2):regionIdx===2?+(sr(s+10)*6+0.1).toFixed(2):+(sr(s+11)*3+0.05).toFixed(2);` |
| `population` | `regionIdx===1&&(name==='China'\|\|name==='India')?+(sr(s+12)*800+400).toFixed(0):+(sr(s+13)*100+5).toFixed(0);` |
| `co2PerCapita` | `+(2+sr(s+15)*18).toFixed(2);` |
| `renewableSharePct` | `+(10+sr(s+16)*70).toFixed(1);` |
| `corruptionIndex` | `+(20+sr(s+17)*70).toFixed(1);` |
| `pressureFreedomIndex` | `+(20+sr(s+18)*75).toFixed(1);` |
| `giniCoefficient` | `+(0.25+sr(s+19)*0.4).toFixed(3);` |
| `healthcareIndex` | `+(30+sr(s+20)*65).toFixed(1);` |
| `educationIndex` | `+(25+sr(s+21)*70).toFixed(1);` |
| `quarterlyTrend` | `QUARTERS.map((q,qi)=>({` |
| `providerScores` | `PROVIDERS.map((prov,pi)=>+(totalEsg+(sr(s+50+pi*11)-0.5)*16).toFixed(1));` |
| `_MACRO_MAP` | `Object.fromEntries((SOVEREIGN_MACRO_2024\|\|[]).map(c=>[c.country,c]));` |
| `_GAIN_MAP` | `Object.fromEntries((ND_GAIN_COUNTRY_SCORES\|\|[]).map(c=>[c.country,c]));` |
| `_IRENA_MAP` | `Object.fromEntries((IRENA_RENEWABLE_CAPACITY_2023\|\|[]).map(c=>[c.country,c]));` |
| `_EMDAT_MAP` | `Object.fromEntries((EMDAT_PHYSICAL_HAZARD_FREQUENCY\|\|[]).map(c=>[c.country,c]));` |
| `PROVIDER_DATA` | `COUNTRIES.slice(0,20).map(c=>({` |
| `top20` | `useMemo(()=>[...COUNTRIES].sort((a,b)=>b.totalEsg-a.totalEsg).slice(0,20),[]);` |
| `bottom20` | `useMemo(()=>[...COUNTRIES].sort((a,b)=>a.totalEsg-b.totalEsg).slice(0,20),[]);` |
| `rankingData` | `useMemo(()=>(showBottom?bottom20:top20).map(c=>({name:c.name.length>12?c.name.slice(0,12)+'..':c.name,esg:c.totalEsg,e:c.eScore,s:c.sScore,g:c.gScore})),[showBottom,top20,bottom20]);` |
| `scatterData` | `useMemo(()=>COUNTRIES.map(c=>({x:c.gdpTrillions,y:c.totalEsg,z:c.population,name:c.name,rating:c.esgRating,fill:ratingColor(c.esgRating)})),[]);` |
| `providerDivergence` | `useMemo(()=>{ return PROVIDER_DATA.map(p=>({name:p.name,...PROVIDERS.reduce((a,pr,pi)=>({...a,[pr]:p.scores[pi]}),{}),divergence:p.divergence}));` |
| `byRegion` | `REGIONS.map(r=>{` |
| `ratingDist` | `RATING_TIERS.map(r=>({name:r,count:COUNTRIES.filter(c=>c.esgRating===r).length,color:ratingColor(r)}));` |
| `eTop` | `([...COUNTRIES].sort((a,b)=>b.eScore-a.eScore).slice(0,15)).map(c=>({name:c.name.length>10?c.name.slice(0,10)+'..':c.name,e:c.eScore,re:c.renewableSharePct,co2:c.co2PerCapita}));` |
| `co2Scatter` | `COUNTRIES.map(c=>({x:c.co2PerCapita,y:c.eScore,name:c.name,rating:c.esgRating}));` |
| `renews` | `REGIONS.map(r=>{const rc=COUNTRIES.filter(c=>c.region===r);return {name:r.length>12?r.slice(0,12)+'..':r,renewable:+(rc.reduce((s,c)=>s+c.renewableSharePct,0)/ Math.max(1, rc.length)).toFixed(1),co2:+(rc.reduce((s,c)=>s+` |
| `sTop` | `([...COUNTRIES].sort((a,b)=>b.sScore-a.sScore).slice(0,15)).map(c=>({name:c.name.length>10?c.name.slice(0,10)+'..':c.name,s:c.sScore,health:c.healthcareIndex,edu:c.educationIndex}));` |
| `giniData` | `REGIONS.map(r=>{const rc=COUNTRIES.filter(c=>c.region===r);return {name:r.length>12?r.slice(0,12)+'..':r,gini:+(rc.reduce((s,c)=>s+c.giniCoefficient,0)/ Math.max(1, rc.length)).toFixed(3),press:+(rc.reduce((s,c)=>s+c.pre` |
| `gTop` | `([...COUNTRIES].sort((a,b)=>b.gScore-a.gScore).slice(0,15)).map(c=>({name:c.name.length>10?c.name.slice(0,10)+'..':c.name,g:c.gScore,corrupt:c.corruptionIndex}));` |
| `corruptScatter` | `COUNTRIES.map(c=>({x:c.corruptionIndex,y:c.gScore,name:c.name,rating:c.esgRating}));` |
| `areaData` | `QUARTERS.map((q,qi)=>({q,...topTrendCountries.reduce((a,c)=>({...a,[c.name.slice(0,6)]:c.quarterlyTrend[qi].esg}),{})}));` |
| `barData` | `PROVIDER_DATA.slice(0,10).map(p=>({name:p.name,...PROVIDERS.reduce((a,pr,pi)=>({...a,[pr]:p.scores[pi]}),{})}));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHART_COLORS`, `COUNTRY_NAMES`, `ISO2`, `PROVIDERS`, `QUARTERS`, `RATING_TIERS`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Indicators per Pillar | — | Scorer config | Number of underlying data indicators used to construct each ESG pillar score. |
| Data Vintage | — | Source databases | Range of data vintage years across underlying indicators; more recent data preferred. |
| Avg Score Spread | — | Calculated | Score range between highest and lowest country for each pillar, indicating discriminating power. |
- **WB WDI, UNDP HDI, TI CPI, ND-GAIN, Freedom House data** → Indicator normalisation, pillar weighting, composite aggregation → **Pillar scores, country scorecards, portfolio ESG exposure reports**

## 5 · Intermediate Transformation Logic
**Methodology:** Pillar Score
**Headline formula:** `Σ (Indicator_i × Weight_i) ÷ Σ Weight_i`

Weighted mean of normalised indicator values within each ESG pillar, producing a 0–100 pillar score per country.

**Standards:** ['World Bank', 'UNDP', 'ND-GAIN', 'Transparency International']
**Reference documents:** World Bank Development Indicators 2024; Transparency International Corruption Perceptions Index 2023; UNDP Human Development Report 2024; Notre Dame ND-GAIN Index 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes an indicator-level pillar
> model ("E:12, S:10, G:8 indicators", `Σ(Indicator_i × Weight_i) ÷ ΣWeight_i`, sourced from World
> Bank WDI / UNDP HDI / Transparency International CPI / ND-GAIN). **The code does not build E/S/G
> scores from indicators at all.** Each country's E/S/G score is a single noisy function of its
> hand-assigned sovereign credit-rating tier (`ratingIdx`, 0–6) — better-rated sovereigns get a
> higher baseline pillar score, with a fixed per-pillar random perturbation. Underlying "indicator"
> fields shown elsewhere on the page (CO₂/capita, renewables %, corruption index, Gini, healthcare/
> education indices) are separately generated and **not fed back into the E/S/G formula** — they are
> descriptive companions, not model inputs. Real public data (World Bank macro, ND-GAIN, IRENA,
> EM-DAT) is overlaid onto a handful of display fields (GDP, renewables %, hazard score) but never
> touches the E/S/G/ESG score itself. Sections below document what the code actually computes.

### 7.1 What the module computes

For a fixed universe of 80 sovereigns (`COUNTRY_NAMES`), each country `i` gets a seed
`s = i×13 + 5` and a hand-curated credit-rating ordinal `ratingIdx ∈ {0..6}` (0=AAA-tier,
6=CCC-tier, from the `RATING_BASE` lookup table) mapped to `RATING_TIERS =
['AAA','AA','A','BBB','BB','B','CCC']`. Pillar scores:

```
E = clamp(10,98, 90 − ratingIdx×12 + sr(s)  ×15 − 7)
S = clamp(10,98, 88 − ratingIdx×11 + sr(s+3)×14 − 6)
G = clamp(10,98, 86 − ratingIdx×10 + sr(s+6)×16 − 7)
totalEsg = E×0.33 + S×0.33 + G×0.34
```

where `sr(s) = frac(sin(s+1)×10⁴)` is the platform's seeded PRNG (deterministic, not real data).
The `−7/−6/−7` offsets and `×15/14/16` noise ranges are hand-tuned constants with no external
source — they exist purely to spread scores realistically around the rating-implied baseline.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Pillar weights | E 0.33 / S 0.33 / G 0.34 | Arbitrary near-equal split (guide claims full indicator aggregation instead) |
| `ratingIdx` baseline slope | −12 (E), −11 (S), −10 (G) points per rating notch-tier | Synthetic — encodes "better credit ⇒ better ESG" prior, not calibrated to any published correlation study |
| Noise amplitude | 15 / 14 / 16 points | Synthetic demo value |
| Clamp bounds | [10, 98] | Synthetic — keeps scores in a plausible 0–100 range |
| `RATING_BASE` per-country ordinal | 0 (Norway…) to 6 (Ethiopia, Myanmar…) | Hand-curated approximation of real sovereign credit ratings, not sourced from a rating agency feed |
| Provider divergence noise | `totalEsg + (sr()−0.5)×16` per of 6 providers | Synthetic — the 6 "providers" (S&P, Sustainalytics, Moody's ESG, MSCI, ISS, Bloomberg) are the same centroid ± noise, not distinct methodologies |
| Quarterly trend drift | `(qi−6)×0.2–0.3` per quarter + noise | Synthetic linear drift centred on the 12-quarter window's midpoint |

### 7.3 Calculation walkthrough

1. **Country generation** — `COUNTRIES = COUNTRY_NAMES.map(...)` builds the full 80-row table once
   at module load: E/S/G/composite scores, GDP, population, CO₂/capita, renewable share,
   corruption index, press-freedom index, Gini, healthcare/education indices — all independently
   seeded off `s` (no cross-field dependency other than the shared rating-tier baseline for E/S/G).
2. **Real-data overlay (GAP-005/006)** — after generation, the code looks up each country in four
   public reference tables (`SOVEREIGN_MACRO_2024`, `ND_GAIN_COUNTRY_SCORES`,
   `IRENA_RENEWABLE_CAPACITY_2023`, `EMDAT_PHYSICAL_HAZARD_FREQUENCY`) and **overwrites** `gdpTrillions`,
   `renewableSharePct`, and adds `ndGainVulnerability/Readiness`, `compositeHazardScore` — real data
   replaces synthetic display fields but the ESG scores themselves are untouched.
3. **Provider comparison** — `PROVIDER_DATA` (top 20 by ESG) attaches 6 synthetic provider scores per
   country and a `divergence = max − min` across providers, driving the "Provider Comparison" tab.
4. **Portfolio exposure** — 30 synthetic holdings sample `COUNTRIES` with random weights/exposures/
   benchmark deviations (`activeWeight = weight − benchmarkWeight`), feeding the "Portfolio Exposure"
   tab's active-risk view.
5. **Trend Analysis** — `quarterlyTrend` gives each country a 12-quarter path with a small linear
   drift term, letting the UI plot "improving/deteriorating" trajectories that are cosmetic, not
   estimated from any transition model.

### 7.4 Worked example — India

India is index `i=47` (0-based) in `COUNTRY_NAMES`, seed `s = 47×13+5 = 616`, `ratingIdx = 4` (from
`RATING_BASE['India']`).

| Step | Formula | Value |
|---|---|---|
| `sr(s)` | `frac(sin(617)×10⁴)` | 0.01277 |
| `sr(s+3)` | `frac(sin(620)×10⁴)` | 0.76324 |
| `sr(s+6)` | `frac(sin(623)×10⁴)` | 0.52185 |
| E | `90 − 4×12 + 0.01277×15 − 7` | **35.2** |
| S | `88 − 4×11 + 0.76324×14 − 6` | **48.7** |
| G | `86 − 4×10 + 0.52185×16 − 7` | **47.3** |
| totalEsg | `35.2×0.33 + 48.7×0.33 + 47.3×0.34` | **43.8** |

India (BB-equivalent, `ratingIdx=4`) lands at composite ESG 43.8/100, well below the AAA-tier
countries (`ratingIdx=0`) whose baseline floor before noise is already ≈90/88/86 — the model's
structural design guarantees a strong rank correlation between the hand-assigned credit tier and
the "ESG" score, since the tier *is* the dominant input.

### 7.5 Companion analytics

- **E-Score / S-Score / G-Score tabs** — rank countries by pillar and cross-plot against a
  correlated descriptive indicator (CO₂/capita for E, healthcare/education for S, corruption index
  for G); these correlated indicators are cosmetically plausible (both are driven by the same
  `ratingIdx`-conditioned generation) but not causally linked in the formula.
- **Provider Comparison** — bar/line chart of the 6 synthetic provider scores per country and a
  "divergence" KPI, illustrating (without real vendor data) the well-known real-world phenomenon of
  low ESG-rating-agency correlation (Berg, Kölbel & Rigobon 2022 documented ~0.54 average pairwise
  correlation across real raters).
- **Portfolio Exposure** — active-weight vs. benchmark table across 30 synthetic sovereign bond
  holdings.

### 7.6 Data provenance & limitations

- **All E/S/G/composite scores, provider scores, and portfolio holdings are synthetic**, generated
  by `sr(seed) = frac(sin(seed+1)×10⁴)` — deterministic across renders but not derived from any
  actual ESG dataset.
- Real public data (World Bank sovereign macro, ND-GAIN vulnerability/readiness, IRENA renewable
  capacity, EM-DAT hazard frequency) is wired into **display-only** fields, not into the scoring
  formula — a materially different situation from the guide's claim of indicator-weighted
  aggregation.
- No normalisation methodology (min-max, z-score, percentile rank) is applied to real indicators;
  the guide's named standards (WDI, CPI, HDI, ND-GAIN) are referenced but not computed against.
- `RATING_BASE` is a hand-typed approximation of real sovereign ratings as of some point in time;
  it is not refreshed from a rating-agency feed and will drift out of date.

**Framework alignment:** the module's *presentation* aligns with common sovereign ESG dashboards
(World Bank WDI, UNDP HDI, Transparency International CPI, ND-GAIN are all referenced as sources in
the guide and appear as separate descriptive fields), but the **actual composite ESG score is not
an indicator-weighted aggregation** as claimed — it is a rating-tier-conditioned synthetic score.
A production sovereign ESG model (e.g. MSCI Sovereign ESG, LGIM sovereign framework) genuinely
normalises 20–40 indicators per pillar to a common 0–100/percentile scale and applies documented
category weights; see §8 below for the specification this module would need to match that bar.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Support sovereign bond credit/ESG research and portfolio tilting decisions by producing a
defensible, auditable 0–100 composite ESG score per sovereign issuer, decomposed into E/S/G
pillars with full indicator-level traceability — replacing the current rating-tier-conditioned
synthetic score with an indicator-based model as the guide already claims exists.

### 8.2 Conceptual approach

Adopt a **normalised indicator-aggregation model**, the industry-standard design used by MSCI
Sovereign ESG Ratings, LGIM's Sovereign ESG framework, and RepRisk's Country ESG Risk model: for
each pillar, collect authoritative public indicators, winsorise and min-max (or z-score) normalise
each to 0–100 within the country universe, then combine via a documented weight vector. This mirrors
(1) **MSCI Sovereign ESG Ratings**, which score ~20 environmental/social/governance indicators per
country normalised against global peer distributions, and (2) **World Bank CPIA / Worldwide
Governance Indicators**, which use percentile-rank normalisation across ~210 economies for
comparability — the same normalisation discipline this module should apply instead of the current
rating-tier heuristic.

### 8.3 Mathematical specification

```
Indicator normalisation (per indicator k, country c):
  Z_{k,c} = clamp( (X_{k,c} − P5_k) / (P95_k − P5_k), 0, 1 ) × 100      // winsorised min-max, 5th/95th pctile

Pillar score:
  Pillar_p = Σ_k w_{p,k} × Z_{k,c}     ,  Σ_k w_{p,k} = 1   (weights below)

Composite:
  ESG_c = 0.35×E_c + 0.35×S_c + 0.30×G_c
```

| Pillar | Indicator (weight) | Calibration source |
|---|---|---|
| E (0.35 total) | CO₂/capita, inverse (0.30); Renewable share of energy (0.25); ND-GAIN vulnerability, inverse (0.25); Forest cover change (0.20) | World Bank WDI CO₂; IRENA renewable capacity; ND-GAIN Index; FAO forest data |
| S (0.35 total) | HDI (0.30); Gini, inverse (0.20); Healthcare access index (0.25); ILO labour-rights compliance (0.25) | UNDP HDI; World Bank Gini; WHO UHC index; ILO EPLEX |
| G (0.30 total) | Transparency Intl CPI (0.35); World Bank WGI Rule of Law (0.35); Press Freedom Index, inverse (0.30) | TI CPI; World Bank WGI; RSF Press Freedom Index |

Pillar and indicator weights above are a proposed calibration (equal-ish, standards-referenced);
production deployment should validate against MSCI/Sustainalytics published weight disclosures
where available.

### 8.4 Data requirements

| Field | Source (free / vendor) | Already in platform? |
|---|---|---|
| CO₂/capita, renewables % | World Bank WDI (free) / IRENA (free) | Yes — `publicDataSeed.js`, `IRENA_RENEWABLE_CAPACITY_2023` |
| ND-GAIN vulnerability/readiness | Notre Dame GAIN Index (free) | Yes — `ND_GAIN_COUNTRY_SCORES` |
| HDI, Gini | UNDP HDR / World Bank PovcalNet (free) | Partial — sovereign macro seed has some fields |
| CPI (corruption) | Transparency International (free, annual) | Not currently ingested as reference_data |
| WGI Rule of Law/Voice&Accountability | World Bank WGI (free) | Not currently ingested |
| Sovereign credit rating (for cross-check, not input) | S&P/Moody's/Fitch (vendor; free issuer-level via press releases) | Partial — `RATING_BASE` hand-curated only |

### 8.5 Validation & benchmarking plan

- **Cross-sectional backtest:** compare model composite rank order against MSCI Sovereign ESG
  Ratings and Sustainalytics Country Risk Ratings for the ~40 overlapping large sovereigns;
  target Spearman rank correlation ≥ 0.6 (realistic given real-world inter-provider divergence
  documented by Berg/Kölbel/Rigobon, ~0.5–0.7).
- **Sensitivity test:** perturb pillar weights ±10pp and confirm top/bottom quartile membership is
  stable (rank-order Kendall's τ ≥ 0.85 across weight perturbations).
- **Indicator staleness check:** flag any country where >30% of indicators are >24 months old.
- **Reconciliation:** annually re-benchmark against World Bank CPIA scores for IDA-eligible
  countries as an independent governance cross-check.

### 8.6 Limitations & model risk

- Public indicator coverage is uneven for small/low-income sovereigns — missing data must be
  imputed (regional-median fallback) and flagged, not silently dropped.
- Percentile normalisation is sensitive to the reference universe; expanding/shrinking the 80-country
  universe changes every score — freeze the universe per publication vintage.
- No indicator is forward-looking (all are lagging annual/biennial releases) — the score is a
  snapshot of past conditions, not a transition-risk forecast; pair with the platform's separate
  NGFS-scenario sovereign physical/transition risk modules for forward-looking views.
- Equal-ish weighting is a simplifying starting point; production use should disclose weights and
  allow client-specific weight overrides (as MSCI and Sustainalytics both permit).

## 9 · Future Evolution

### 9.1 Evolution A — Build the indicator-weighted pillar model the guide describes (analytics ladder: rung 1 → 3)

**What.** The §7 flag is blunt: the guide promises an indicator-level pillar model (E:12, S:10, G:8 indicators; `Σ(Indicator×Weight)/ΣWeight` from WDI/HDI/CPI/ND-GAIN), but the code builds each country's E/S/G score as a **noisy function of its hand-assigned credit-rating ordinal** (`E = 90 − ratingIdx×12 + sr()×15 − 7`). Real public data (World Bank macro, ND-GAIN, IRENA, EM-DAT) is wired into display-only fields and never touches the score. It is, in effect, a rating-tier proxy dressed as an indicator model — the platform's least-grounded sovereign-ESG module, and the page even carries a §8 spec for the real thing. Evolution A builds the promised model.

**How.** (1) Ingest the named indicators for all 80 sovereigns: World Bank WDI (macro, emissions, renewables), UNDP HDI, Transparency International CPI, ND-GAIN vulnerability/readiness, IRENA, EM-DAT — all free public sources. (2) Normalise each to 0–100 via documented percentile-rank or min-max scaling (the guide names normalisation; none exists today). (3) Compute pillar scores as the real indicator-weighted means with the E:12/S:10/G:8 structure and documented category weights, and the composite from those. (4) Delete the `ratingIdx`-conditioned synthetic formula and the hand-tuned `−7/−6/−7` offsets. (5) Add the data-refresh-cycle and material-change flagging the workflow describes.

**Prerequisites.** Multi-source indicator ingestion and a normalisation reference (percentile baselines per indicator); this is a substantial build — the module currently has essentially no real scoring. **Acceptance:** an E/S/G score recomputes when any constituent indicator changes; the rating ordinal no longer appears in the scoring path; scores are reproducible from documented indicator weights.

### 9.2 Evolution B — Indicator-transparency copilot (LLM tier 1)

**What.** The module's stated value is *transparent* sovereign ESG — "transparency into data sources," "indicator-level pillar scores." Evolution B delivers that conversationally: "which indicators drive this country's governance score?", "how would reweighting toward environmental change the ranking?", "what's the data vintage behind this HDI value?" — answered from the real indicator set and weights, decomposing each pillar to its constituent indicators.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/sovereign-esg-scorer/ask`, corpus = this Atlas record plus the indicator catalogue and source citations. Score explanations enumerate the weighted indicators and their normalised values; reweighting answers recompute the deterministic composite under user weights; source questions cite the WDI/HDI/CPI/ND-GAIN vintage. Refusal for indicators or countries outside coverage.

**Prerequisites (hard).** Evolution A — there are no indicators feeding the score today, so "which indicators drive this score?" has no honest answer; the copilot would have to expose the rating-tier proxy, which contradicts the module's transparency promise. **Acceptance:** every indicator contribution in an explanation matches the computed pillar; a reweight recomputes correctly; asking for an indicator not in the model returns "not tracked," not a fabricated value.