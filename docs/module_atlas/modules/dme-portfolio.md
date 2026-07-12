# DME Portfolio
**Module ID:** `dme-portfolio` · **Route:** `/dme-portfolio` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Portfolio-level aggregation of Dynamic Materiality Engine scores with exposure-weighted materiality calculation, topic attribution, and risk decomposition. Enables portfolio managers to understand how entity-level ESG materiality translates into portfolio-level risk concentration. Supports TCFD portfolio-level disclosure and SFDR PAI reporting.

> **Business value:** Gives portfolio managers a dynamic, evidence-based view of aggregate ESG materiality risk, replacing static ESG ratings with continuously updated scores. Enables proactive portfolio risk management and supports TCFD and SFDR portfolio-level disclosures.

**How an analyst works this module:**
- Select the portfolio from the portfolio picker and confirm position weights are current
- Review the portfolio materiality score and trend vs. the prior quarter
- Use topic attribution to identify which ESG themes drive the largest score contributions
- Identify high-materiality positions and initiate engagement or portfolio rebalancing analysis

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COLORS`, `KpiCard`, `LS_PORT`, `NGFS_SCENARIOS`, `REGIME_COLORS`, `Section`, `Sel`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `NGFS_SCENARIOS` | 7 | `name`, `temp`, `category`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `pct` | `(n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `totalWeight` | `holdings.reduce((s, h) => s + (h.weight \|\| 0), 0) \|\| 100;` |
| `weighted` | `holdings.reduce((s, h) => s + (h.weight / totalWeight) * (regimeScores[h.regime] \|\| 1), 0);` |
| `selection` | `(holdingDMI - benchmarkDMI) * holdingWeight;` |
| `allocation` | `(holdingWeight - benchmarkWeight) * (benchmarkDMI - portfolioDMI);` |
| `interaction` | `(holdingWeight - benchmarkWeight) * (holdingDMI - benchmarkDMI);` |
| `dmi` | `master.dmi_score \|\| clamp(40 + sRand(s) * 50, 10, 98);` |
| `velocity` | `(sRand(s + 1) - 0.5) * 20;` |
| `scope1` | `master.ghg_scope1_tco2e \|\| Math.round(5000 + sRand(s + 2) * 500000);` |
| `scope2` | `master.ghg_scope2_tco2e \|\| Math.round(2000 + sRand(s + 3) * 200000);` |
| `scope3` | `master.ghg_scope3_tco2e \|\| Math.round(10000 + sRand(s + 4) * 2000000);` |
| `evic` | `master.market_cap_usd_mn ? master.market_cap_usd_mn * 1e6 : (50 + sRand(s + 5) * 5000) * 1e6;` |
| `weight` | `h.weight \|\| parseFloat(h.allocation) \|\| (100 / Math.max(rawHoldings.length, 1));` |
| `outstandingAmt` | `evic * weight / 100;` |
| `portDMI` | `useMemo(() => Math.round(portfolioWeightedDMI(holdings) * 10) / 10, [holdings]);` |
| `portHHI` | `useMemo(() => Math.round(portfolioHHI(holdings)), [holdings]);` |
| `portRegime` | `useMemo(() => portfolioRegime(holdings), [holdings]); const totalWeight = useMemo(() => holdings.reduce((s, h) => s + (h.weight \|\| 0), 0) \|\| 100, [holdings]);` |
| `waci` | `useMemo(() => { return Math.round(holdings.reduce((s, h) => s + (h.weight / totalWeight) * (h.ghg_intensity \|\| 0), 0));` |
| `impliedTemp` | `useMemo(() => { const t = holdings.reduce((s, h) => s + (h.weight / totalWeight) * (h.temperature \|\| 2.0), 0);` |
| `portfolioVaR` | `useMemo(() => { const baseVaR = portDMI * 0.15 + portHHI * 0.002;` |
| `expectedLoss` | `useMemo(() => { return Math.round(portfolioVaR * 0.4 * 100) / 100;` |
| `scenarioResults` | `useMemo(() => { return NGFS_SCENARIOS.map(sc => { const s = seed(sc.id);` |
| `avgTaxonomy` | `useMemo(() => { const sum = holdings.reduce((s, h) => s + (h.taxonomy_alignment \|\| 0), 0);` |
| `pcafData` | `useMemo(() => { const totalFinanced = holdings.reduce((s, h) => s + (h.financed_emissions \|\| 0), 0);` |
| `totalFinancedEmissions` | `useMemo(() => pcafData.reduce((s, p) => s + p.financed_total, 0), [pcafData]);` |
| `sfdrClassification` | `useMemo(() => { const avgESG = holdings.reduce((s, h) => s + (h.esg_score \|\| 0), 0) / (holdings.length \|\| 1);` |
| `pctImprover` | `classificationCounts.IMPROVER / (holdings.length \|\| 1) * 100;` |
| `drift` | `(i - 6) * 0.3 + sRand(seed(m)) * 4;` |
| `concentrationAnalysis` | `useMemo(() => { const sorted = [...holdings].sort((a, b) => b.weight - a.weight);` |
| `top5Weight` | `sorted.slice(0, 5).reduce((s, h) => s + h.weight, 0);` |
| `top10Weight` | `sorted.slice(0, 10).reduce((s, h) => s + h.weight, 0);` |
| `maxSectorName` | `Object.entries(sectorConc).sort((a, b) => b[1] - a[1])[0]?.[0] \|\| '---';` |
| `criticalWeight` | `(regimeConc.Critical \|\| 0) + (regimeConc.Extreme \|\| 0);` |
| `emissionsByScope` | `useMemo(() => { const totalS1 = holdings.reduce((s, h) => s + (h.scope1 \|\| 0), 0);` |
| `totalS2` | `holdings.reduce((s, h) => s + (h.scope2 \|\| 0), 0);` |
| `totalS3` | `holdings.reduce((s, h) => s + (h.scope3 \|\| 0), 0);` |
| `total` | `totalS1 + totalS2 + totalS3;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `NGFS_SCENARIOS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Materiality Score | — | DME portfolio aggregation | Exposure-weighted composite materiality score across all portfolio positions on a 0–100 scale |
| Top Contributing Topic | — | Topic attribution engine | ESG topic contributing the largest share of the portfolio materiality score |
| High-Materiality Positions | — | Entity score filter | Count of portfolio positions with entity materiality score above the high-materiality threshold of 70 |
| Portfolio Score Trend (12M) | — | Trend engine | Change in portfolio materiality score over the trailing 12 months, indicating rising aggregate ESG risk |
- **DME entity materiality scores (all portfolio entities)** → Exposure-weight calculation using current market values from portfolio management system → **Exposure-weighted PfMS with topic attribution breakdown**
- **Portfolio position data (holdings, weights, market values)** → Position data import and reconciliation against entity universe coverage → **Coverage report flagging entities without DME scores**
- **Topic attribution engine** → Marginal contribution analysis: each entity's contribution to topic-level portfolio score → **Topic waterfall chart and top-10 contributors per topic**

## 5 · Intermediate Transformation Logic
**Methodology:** Portfolio Materiality Score
**Headline formula:** `PfMS = Σᵢ (EMSᵢ × wᵢ)`

The portfolio materiality score is the exposure-weighted average entity materiality score. Weight wᵢ equals entity i's market value divided by total portfolio value. Topic-level attribution decomposes the portfolio score into contributions from each ESG topic, enabling thematic risk management.

**Standards:** ['TCFD Portfolio Alignment Methodology', 'SFDR Article 7 PAI Aggregation', 'ESRS E1/S1 Portfolio Metrics']
**Reference documents:** TCFD (2021) Portfolio Alignment Guidance for Asset Managers; SFDR (2019) Article 7 â€” Principal Adverse Impact Aggregation; ESRS E1/S1 (2023) Portfolio-Level Disclosure Metrics; PRI (2023) Active Ownership Engagement on Material ESG Topics

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The DME Portfolio module aggregates entity-level DME signals to the portfolio: a weight-weighted DMI,
Herfindahl concentration, a weighted regime, **Brinson-style attribution** (selection/allocation/
interaction), and **PCAF financed emissions** via an attribution factor. Holdings come from LocalStorage
(user portfolio) enriched against `GLOBAL_COMPANY_MASTER`, with `sr()` fallbacks. No guide record was
supplied, so no mismatch flag — the caveat is on synthetic fallback data.

### 7.1 What the module computes

```js
// Weighted portfolio DMI (weights normalised to their own sum)
portfolioDMI = Σ (wᵢ/Σw)·dmiᵢ
// Concentration (Herfindahl on % weights)
HHI = Σ ((wᵢ/Σw)·100)²
// Weighted regime (Normal=1…Extreme=4) → banded
weighted = Σ (wᵢ/Σw)·regimeScoreᵢ ;  ≥3.5 Extreme | ≥2.5 Critical | ≥1.5 Elevated | else Normal
// Brinson attribution vs benchmark
selection   = (dmiᵢ − benchDMI)·wᵢ
allocation  = (wᵢ − benchWᵢ)·(benchDMI − portfolioDMI)
interaction = (wᵢ − benchWᵢ)·(dmiᵢ − benchDMI)
total = selection + allocation + interaction
// PCAF financed emissions
attributionFactor = outstanding / EVIC          (0 if EVIC≤0)
financedEmissions = AF·(scope1 + scope2 + scope3)
```

### 7.2 Parameterisation / scoring rubric

| Object / constant | Value | Provenance |
|---|---|---|
| Regime scores | Normal 1 / Elevated 2 / Critical 3 / Extreme 4 | ordinal encoding |
| Regime bands | ≥1.5 / ≥2.5 / ≥3.5 | midpoint thresholds |
| DMI→regime (holding) | >80 Extreme, >60 Critical, >35 Elevated | `enrichHoldings` |
| Velocity classification | vel>3 DECLINER, <−3 IMPROVER, else STABLE | heuristic |
| NGFS scenarios | 6 (NZ2050 1.5°C … Current Policies 3.0°C) | NGFS Phase IV labels + temps |

Fallback enrichment (only when the master lacks the field), via `sRand(seed)=frac(sin(seed+1)×10⁴)`:
`dmi 40–90`, `velocity −10…+10`, `scope1 5k–505k`, `scope2 2k–202k`, `scope3 10k–2.01M tCO₂e`,
`EVIC = marketCap or (50–5050)·$1M`, `weight = allocation or equal-weight`.

### 7.3 Calculation walkthrough

1. Load the user's holdings from `ra_portfolio_v1` (LocalStorage); if empty, a demo set is used.
2. `enrichHoldings` matches each holding to `GLOBAL_COMPANY_MASTER` by name/ticker, filling DMI, regime,
   emissions and EVIC (real where present, seeded otherwise).
3. Portfolio KPIs: weighted DMI, HHI, weighted regime, total financed emissions (Σ AF·emissions),
   weighted-average carbon intensity.
4. Attribution tab decomposes portfolio-vs-benchmark DMI into selection/allocation/interaction.
5. NGFS tab applies scenario overlays to portfolio risk.

### 7.4 Worked example (2-holding portfolio)

Holdings: A (weight 60, DMI 70, regime Critical=3), B (weight 40, DMI 45, regime Elevated=2). Σw=100.
```
portfolioDMI = 0.6·70 + 0.4·45 = 42 + 18 = 60.0
HHI = (60)² + (40)² = 3600 + 1600 = 5200            // moderately concentrated (2-name)
weighted regime = 0.6·3 + 0.4·2 = 1.8 + 0.8 = 2.6 → Critical (≥2.5)
```
PCAF for A: outstanding $600M, EVIC $3000M → AF = 0.20; emissions (S1+S2+S3)=500 000 tCO₂e →
financedEmissions = 0.20·500 000 = **100 000 tCO₂e**.
Brinson (A) vs bench (benchW 50, benchDMI 55): selection=(70−55)·0.6=9.0; allocation=(0.6−0.5)·(55−60)=−0.5;
interaction=(0.6−0.5)·(70−55)=1.5; total = **10.0**.

### 7.5 Data provenance & limitations

- Holdings can be **real** (user-entered, matched to master) but any missing DMI/emissions/EVIC field is
  **synthetic** via `sRand`. Emissions fallbacks span wide ranges, so unmatched names produce arbitrary
  financed-emissions figures.
- HHI uses percentage weights, so it ranges 0–10 000 (not the 0–1 normalised form) — read against the
  10 000 = single-name maximum.
- Regime ordinal averaging treats the 4 regimes as equally spaced, which understates tail (Extreme)
  concentration.
- The attribution is a single-period Brinson-Fachler analogue on DMI, not returns.

**Framework alignment:** **PCAF** financed-emissions (attribution factor = outstanding/EVIC, then
AF×(S1+S2+S3)) — PCAF's Global GHG Accounting Standard for listed equity/corporate debt; **Brinson-Fachler
attribution** (selection + allocation + interaction) applied to an ESG score rather than return;
**Herfindahl-Hirschman** concentration; **NGFS Phase IV** scenario set for portfolio transition overlays.

---

## 8 · Model Specification

**Status: specification — not yet implemented in code (fallback data + PCAF DQ).**

### 8.1 Purpose & scope
Portfolio-level climate & materiality analytics: weighted DMI, concentration, financed emissions with
PCAF data-quality scoring, and scenario-conditioned portfolio loss — for the user's actual book.

### 8.2 Conceptual approach
Replace `sr()` fallbacks with a **PCAF-compliant financed-emissions engine** (attribution by EVIC/total
equity+debt, DQ-scored 1–5) and a **scenario-repricing overlay** per NGFS pathway. Benchmarks: PCAF
Global GHG Accounting Standard, MSCI/Trucost portfolio carbon, NGFS Phase IV, TCFD portfolio alignment.

### 8.3 Mathematical specification
```
Attribution: AF = outstandingᵢ / EVICᵢ  (listed equity/corporate debt asset class)
Financed emissions = Σᵢ AFᵢ · (S1ᵢ+S2ᵢ+S3ᵢ) ; WACI = Σᵢ wᵢ·(emissionsᵢ/revenueᵢ)
Data-quality score DQ_i ∈ {1..5} by data source (reported→estimated); portfolio DQ = Σ wᵢ·DQᵢ
Scenario loss = Σᵢ wᵢ · Valueᵢ · repricingFactor_s(sectorᵢ)   (NGFS transition path)
Portfolio DMI, HHI, Brinson as in §7 but on validated inputs
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| EVIC / outstanding | — | issuer financials, position data |
| Emissions S1–S3 | — | CDP, company reports (DQ-scored) |
| PCAF DQ scores | 1–5 | PCAF standard |
| Repricing factors | — | NGFS Phase IV sector paths |

### 8.4 Data requirements
Position-level holdings (already from LocalStorage), issuer EVIC and Scope 1–3 emissions with source
provenance, revenue for WACI, sector mapping. Free: CDP, SBTi; platform holds `GLOBAL_COMPANY_MASTER`
and NGFS labels.

### 8.5 Validation & benchmarking plan
Reconcile financed emissions against a PCAF-audited calculation; check WACI vs a vendor portfolio-carbon
report; verify HHI and Brinson decomposition sum-to-total; scenario loss sensitivity to NGFS notch.

### 8.6 Limitations & model risk
Scope 3 emissions are highly uncertain and double-count across the value chain; EVIC volatility distorts
attribution factors intra-year. Conservative fallback: assign worst-case DQ (5) and flag unmatched
holdings rather than seeding plausible emissions.

## 9 · Future Evolution

### 9.1 Evolution A — Real holdings, honest fallbacks, and a defensible portfolio VaR (analytics ladder: rung 2 → 3)

**What.** The aggregation math is sound — exposure-weighted DMI, HHI, Brinson-style selection/allocation/interaction attribution, PCAF financed emissions with attribution factors, WACI, implied temperature — but three things undermine it: holdings live in LocalStorage rather than the platform DB, every missing field silently falls back to `sRand()` (seeded scope 1–3 emissions, seeded DMI), and `portfolioVaR = portDMI·0.15 + portHHI·0.002` is an ad-hoc heuristic presented alongside genuine PCAF numbers. Evolution A grounds all three.

**How.** (1) Holdings from `portfolios_pg` (the platform's critical-rule table — LocalStorage becomes a cache, not the source of truth) via a new `api/v1/routes/dme_portfolio.py`; coverage reporting per the §4 lineage sketch — positions without company-master matches surface in a coverage report instead of getting seeded emissions. (2) Replace `sRand()` fallbacks with honest nulls and PCAF data-quality tier disclosure (the PCAF standard literally has a 1–5 quality score for this exact situation — use it). (3) Retire the heuristic VaR in favor of the dme-financial-risk engine's historical-simulation VaR over the same holdings, or delete the tile until that lands. (4) Rung 3: pin the Brinson decomposition and PCAF attribution arithmetic into `bench_quant.py`; 12-month trend reads persisted portfolio-score snapshots, not `(i−6)·0.3 + sRand()` drift.

**Prerequisites.** dme-entity's `dme_topic_scores` for real EMS inputs; the D0 demo portfolio (200–500 holdings) so aggregation is exercised at realistic scale. **Acceptance:** a fixture portfolio's PfMS, HHI, and financed emissions reproduce by hand; every holding shows either real data or a disclosed PCAF quality tier — zero seeded values.

### 9.2 Evolution B — Portfolio-review analyst for SFDR/TCFD reporting cycles (LLM tier 2)

**What.** A tool-calling analyst for the PM's quarterly loop: "what drove our portfolio materiality score this quarter, which PAIs deteriorated, and what should we engage on?" It chains Evolution A's endpoints — score trend, Brinson attribution, topic attribution, PCAF/WACI aggregates, SFDR classification counts — and drafts the portfolio-level TCFD/SFDR narrative with each figure traced, plus an engagement shortlist of the high-materiality positions the overview's workflow ends with.

**How.** Tool schemas from the new portfolio route; grounding corpus = this Atlas record's §5 (PfMS formula, attribution definitions) and the PCAF/SFDR reference docs cited there. Attribution explanations quote the actual decomposition terms (`selection = (holdingDMI − benchmarkDMI) × weight`), preventing the classic LLM failure of explaining Brinson from memory instead of from the implemented variant. Coverage gaps are first-class: the draft discloses what share of AUM lacks scores, sourced from the coverage endpoint.

**Prerequisites (hard).** Evolution A — an SFDR PAI narrative over seeded scope-3 fallbacks would put fabricated emissions into a regulated disclosure. **Acceptance:** every figure in a golden-portfolio draft matches a tool response; positions without coverage appear in the disclosed-gaps section, never with imputed numbers.