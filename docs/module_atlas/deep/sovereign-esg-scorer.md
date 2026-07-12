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
