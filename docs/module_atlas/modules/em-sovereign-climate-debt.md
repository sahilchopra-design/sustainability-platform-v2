# EM Sovereign Climate Debt Analytics
**Module ID:** `em-sovereign-climate-debt` · **Route:** `/em-sovereign-climate-debt` · **Tier:** B (frontend-computed) · **EP code:** EP-DH1 · **Sprint:** DH

## 1 · Overview
Analyses the intersection of climate vulnerability and sovereign debt sustainability for emerging market countries. Models climate-adjusted debt service capacity, Paris-aligned debt restructuring mechanisms, and climate debt swap frameworks using IMF DSA with climate overlays.

> **Business value:** Critical for EM sovereign debt investors pricing climate risk into emerging market bonds, multilateral creditors designing debt relief mechanisms, and finance ministries of climate-vulnerable countries seeking fiscal space for adaptation. Directly addresses V20 agenda and IMF Climate-Debt nexus work.

**How an analyst works this module:**
- Select EM country and review climate vulnerability profile
- Apply IMF DSA with climate-adjusted growth trajectory
- Calculate climate-adjusted spread premium
- Model debt-for-climate swap feasibility and savings
- Generate V20-aligned climate debt sustainability report

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `NAMES`, `RATINGS`, `RATING_BUCKET_MAP`, `REGIONS`, `SOVEREIGNS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['Sub-Saharan Africa', 'South Asia', 'East Asia & Pacific', 'Latin America', 'MENA', 'Eastern Europe & CA', 'Caribbean'];` |
| `RATINGS` | `['AAA-AA', 'A-BBB', 'BB-B', 'CCC-C', 'Distressed'];` |
| `ratingIdx` | `Math.floor(sr(i * 7) * RATINGS.length);` |
| `gdpBn` | `+(20 + sr(i * 11) * 980).toFixed(1);` |
| `debtGdpPct` | `+(35 + sr(i * 13) * 95).toFixed(1);` |
| `climateVulnerabilityIndex` | `Math.round(20 + sr(i * 17) * 75);` |
| `totalGreenBond` | `filtered.reduce((a, s) => a + s.greenBondIssuance, 0);` |
| `avgVuln` | `filtered.length ? filtered.reduce((a, s) => a + s.climateVulnerabilityIndex, 0) / filtered.length : 0;` |
| `totalAdaptGap` | `filtered.reduce((a, s) => a + s.adaptationFinanceGap, 0);` |
| `dnEligiblePct` | `filtered.length ? (filtered.filter(s => s.debtForNatureSwapEligible).length / filtered.length * 100).toFixed(1) : '0.0';` |
| `greenBondByRegion` | `REGIONS.map(r => ({` |
| `scatterData` | `filtered.map(s => ({ x: s.debtGdpPct, y: s.climateVulnerabilityIndex, name: s.name }));` |
| `top15AdaptGap` | `[...filtered].sort((a, b) => b.adaptationFinanceGap - a.adaptationFinanceGap).slice(0, 15).map(s => ({` |
| `defaultByRegion` | `REGIONS.map(r => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `NAMES`, `RATINGS`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate-Vulnerable EM Debt | — | IMF Climate and Sovereign Debt 2023 | EM sovereign debt at elevated risk due to climate vulnerability — V20 countries average 250 bps climate premium |
| V20 Climate Premium | — | V20 Climate Vulnerability Monitor 2023 | Climate-vulnerable countries pay 117 bps more on sovereign bonds than climate-resilient peers, controlling for macro |
| Climate Debt Swap Market | — | Debt Relief for Green Recovery Initiative | Debt-for-climate/nature swaps executed globally — growing mechanism to free fiscal space for adaptation |
- **IMF WEO sovereign fiscal + growth data** → Climate-adjusted DSA → **Climate-adjusted debt service ratio by scenario/decade**
- **Climate vulnerability indices (ND-GAIN, INFORM)** → Spread premium calculation → **Climate component of sovereign bond spread**
- **Debt swap deal database + creditor terms** → Swap feasibility modelling → **Debt service savings and climate investment unlocked per swap structure**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-Adjusted Debt Sustainability
**Headline formula:** `ClimateAdjustedDSR = DebtService / (GDPgrowth_base - GDPloss_climate × β_climate); ClimatePremium_spread = BaseSpread × (1 + PhysicalVuln × 0.5 + TransitionRisk × 0.3)`

Climate-adjusted GDP growth reduces debt service capacity; sovereign spread premium adds climate vulnerability component to traditional credit risk model

**Standards:** ['IMF Debt Sustainability Analysis Framework', 'V20 Vulnerable Twenty Climate & Debt Initiative', 'Climate Bonds Initiative Sovereign Debt Framework', 'UNFCCC High Level Champion Resilience Finance']
**Reference documents:** IMF Staff Discussion Note 2021/005 — Climate Change and Sovereign Risk; V20 Climate Vulnerability Monitor 2023; Climate Bonds Initiative Sovereign Climate Framework 2023; UNFCCC Sharm el-Sheikh Loss and Damage Fund

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry promises a *climate-adjusted IMF Debt
> Sustainability Analysis* engine — `ClimateAdjustedDSR = DebtService / (GDPgrowth_base −
> GDPloss_climate × β_climate)` and a spread premium `BaseSpread × (1 + PhysicalVuln × 0.5 +
> TransitionRisk × 0.3)`. **Neither formula exists in the code.** No debt-service ratio, no
> GDP-growth trajectory, no spread-premium calculation, no scenario/decade projection is computed
> anywhere in `EMSovereignClimateDebtPage.jsx`. What the page actually does is generate 60 synthetic
> sovereigns with independent random attributes and present them through 8 descriptive dashboards
> (tables, scatter plots, bar charts) plus two toy linear "what-if" multipliers. The sections below
> document the code as written; §8 specifies the DSA model the guide describes.

### 7.1 What the module computes

The entire dataset is 60 rows built by one `Array.from` loop. Every economic attribute is an
**independent draw** from the platform PRNG `sr(s) = frac(sin(s+1)×10⁴)`, seeded by the row index
times a distinct prime — there is no cross-attribute causal structure:

```js
region  = REGIONS[i % 7]
gdpBn                     = 20  + sr(i*11) * 980        // $20–1,000B
debtGdpPct                = 35  + sr(i*13) * 95         // 35–130%
climateVulnerabilityIndex = round(20 + sr(i*17) * 75)  // 20–95
greenBondIssuance         = 0.1 + sr(i*19) * 8.9        // $0.1–9.0B
adaptationFinanceGap      = 0.5 + sr(i*23) * 19.5       // $0.5–20B/yr
debtRestructuringRisk     = 1   + sr(i*29) * 9          // 1–10
ndcAmbition               = 2   + sr(i*31) * 8          // 2–10
climateOdaReceived        = 0.05+ sr(i*37) * 2.95       // $0.05–3B
defaultProbability        = 1   + sr(i*41) * 29         // 1–30%
debtForNatureSwapEligible = sr(i*43) > 0.45            // boolean
sovereignCreditRating     = RATINGS[floor(sr(i*7)*5)]  // AAA-AA … Distressed
```

The only *derived* numbers on the page are portfolio aggregates over the filtered set and two
cosmetic what-if scalars (§7.3). Notably `defaultProbability` is drawn **independently** of the
credit rating, so a "AAA-AA" sovereign can display a 28% default probability — the rating and the PD
are not reconciled.

### 7.2 Parameterisation / scoring rubric

| Constant | Value | Provenance |
|---|---|---|
| `REGIONS` | 7 EM regions | Editorial taxonomy |
| `RATINGS` | AAA-AA · A-BBB · BB-B · CCC-C · Distressed | 5-bucket ratings ladder |
| `RATING_BUCKET_MAP` | IG = {AAA-AA, A-BBB}; HY = {BB-B}; Distressed = {CCC-C, Distressed} | Filter grouping only |
| `debtGdpPct` range 35–130% | synthetic | Plausible EM band, but random not sourced |
| `defaultProbability` 1–30% | synthetic | Not tied to rating or debt ratio |
| D4N eligibility threshold | `sr(i*43) > 0.45` | ≈55% of sovereigns flagged eligible — arbitrary |
| KPI colour break: vuln > 65 red, > 45 amber | display heuristic | Not a published index band |

No external constant (V20 117 bps premium, IMF DSA thresholds, ND-GAIN scores) named in the guide
appears in code.

### 7.3 Calculation walkthrough

Headline KPIs, all over the **filtered** subset:

```
totalGreenBond = Σ greenBondIssuance
avgVuln        = Σ climateVulnerabilityIndex / n          (guarded: n=0 → 0)
totalAdaptGap  = Σ adaptationFinanceGap
dnEligiblePct  = 100 × count(eligible) / n                (guarded)
```

Two "what-if" widgets apply flat linear scalars to portfolio totals — these are the only response to
the Carbon-Price and Debt-Relief sliders:

- **Adaptation-gap sensitivity (Tab 4):** `gapReduction = carbonPrice × 0.02 × totalAdaptGap`. At
  $25/tCO₂ this asserts a 50% gap reduction — a made-up 2%-per-dollar elasticity with no citation.
- **Nature finance unlocked (Tab 5):** `natureFinance = debtRelief × 0.35`. A flat 35% conversion of
  relief dollars to nature finance, independent of any country's debt stock or swap structure.

### 7.4 Worked example

Take synthetic row **i = 10** (Bangladesh). Seeds: `sr(110)`, `sr(130)`, `sr(170)`… Evaluating the
PRNG: `sr(110)=frac(sin(111)×10⁴)`. sin(111 rad) ≈ −0.8940, ×10⁴ = −8939.7, frac → 0.30 (taking the
positive fractional part as the code does via `x − floor(x)`). So:

| Field | Formula | Value |
|---|---|---|
| debtGdpPct | 35 + sr(130)·95 | ≈ 35 + 0.51·95 ≈ **83.9%** |
| climateVulnerabilityIndex | round(20 + sr(170)·75) | ≈ **71** |
| adaptationFinanceGap | 0.5 + sr(230)·19.5 | ≈ **$7.4B/yr** |

Now the Tab-4 what-if with `carbonPrice = 25` and a filtered `totalAdaptGap` of, say, $410B:
`gapReduction = 25 × 0.02 × 410 = $205B`. The widget therefore claims a $25 carbon price closes
half the adaptation gap — illustrating that this figure is a demonstration scalar, not a model
output. (Exact PRNG digits depend on the JS float; the mechanism is what matters.)

### 7.5 Companion analytics on the page

- **Debt Sustainability (Tab 1):** scatter of `debtGdpPct` (x) vs `climateVulnerabilityIndex` (y) —
  purely descriptive since the two axes are independent random draws; plus a per-region mean
  `defaultProbability` bar (divisor guarded with `Math.max(1, …)`).
- **Green Bond Market / Vulnerability / NDC Ambition:** rank-and-slice bar charts over the filtered
  set (top-15/top-20).
- **MDB Engagement (Tab 7):** climate-ODA-by-region bar + a `debtRestructuringRisk × ndcAmbition`
  scatter.

No data leaves this module; there are no engines or API routes (`engines: []`, `route_files: []`).

### 7.6 Data provenance & limitations

- **All 60 sovereigns are synthetic**, generated by the seeded PRNG `sr(seed)=frac(sin(seed+1)×10⁴)`.
  Stable across renders but not real countries — `NAMES[i]` labels are cosmetic and the attributes
  behind, e.g., "Nigeria" are random, not Nigeria's actuals.
- No causal linkage between fields: rating, PD, debt ratio and vulnerability are orthogonal draws, so
  the scatter/correlation views cannot reveal real relationships.
- The two sliders drive only linear cosmetic scalars (×0.02, ×0.35); there is **no DSA, no spread
  model, no GDP trajectory** despite the guide's headline formulas.

**Framework alignment:** The module *references* but does not implement: **IMF DSA** (sustainability
assessed via projected debt/GDP and gross-financing-needs paths under baseline + shocks); **V20
Climate Vulnerability Monitor** (empirically finds ≈117 bps excess spread for climate-vulnerable
sovereigns); **debt-for-nature/climate swaps** (face-value debt exchanged for conservation spending,
e.g. Belize 2021, Ecuador 2023). The page is a descriptive shell around these concepts.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Support EM-sovereign bond pricing and MDB debt-relief design by producing, per sovereign, (i) a
climate-conditioned debt-sustainability verdict and (ii) a decomposed sovereign-spread premium
attributable to physical and transition climate risk. Coverage: hard-currency sovereign issuers in
the 7 EM regions, projected over a 10-year DSA horizon in annual steps.

### 8.2 Conceptual approach
Two coupled sub-models, mirroring the guide's intent and leading practice:
1. **Climate-conditioned DSA** — the IMF/World Bank debt-dynamics identity with the primary-balance
   and growth inputs shocked by NGFS-scenario climate GDP losses. Benchmarks: **IMF Sovereign Risk
   and Debt Sustainability Framework (SRDSF, 2022)** and **NGFS Phase IV** country GDP-impact paths.
2. **Climate spread premium** — a reduced-form panel model regressing the sovereign CDS/bond spread
   on macro controls plus climate covariates, benchmarked to the **V20 Climate Vulnerability
   Monitor** finding (~117 bps) and **Beirne–Renzhi–Volz (2021)** cost-of-capital estimates.

### 8.3 Mathematical specification
Debt dynamics (share of GDP, annual t):
```
d_t = d_{t−1} · (1 + r_t) / (1 + g_t) − pb_t
g_t = g_base,t − β_c · L_clim,t(s)          // climate GDP drag, scenario s
L_clim,t(s) = physScore·δ_phys(s,t) + transScore·δ_trans(s,t)
Sustainable ⇔ d_{t+10} ≤ d_t  AND  GFN_t ≤ GFN_threshold (15% EM benchmark)
```
Spread premium (basis points):
```
spread_i = α + γ·d_i + Σφ·macro_i + λ_phys·PhysVuln_i + λ_trans·TransRisk_i + ε_i
climate_bps_i = λ_phys·PhysVuln_i + λ_trans·TransRisk_i
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Real effective rate | `r_t` | IMF WEO sovereign yield curves |
| Baseline growth | `g_base,t` | IMF WEO / World Bank GEP |
| Climate GDP elasticity | `β_c` | NGFS Phase IV country GDP damage functions |
| Physical/transition drag | `δ_phys, δ_trans` | NGFS scenario GDP deltas by decade |
| Vulnerability inputs | `PhysVuln, TransRisk` | ND-GAIN, INFORM Risk Index |
| GFN sustainability threshold | 15% of GDP | IMF SRDSF EM benchmark |
| Spread climate loadings | `λ_phys, λ_trans` | Panel regression; prior ≈117 bps total (V20) |

### 8.4 Data requirements
Per sovereign: debt/GDP stock, maturity profile, primary balance, real growth, effective interest
rate, CDS/EMBI spread, ND-GAIN vulnerability + readiness sub-scores, INFORM hazard exposure, NGFS
country GDP-impact table. Free sources: IMF WEO, World Bank IDS/GEP, ND-GAIN, NGFS scenario portal,
JP Morgan EMBI (proxy via public benchmarks). Platform already has the `reference_data` layer
(World Bank live pulls) and NGFS scenario constants used elsewhere (climate-credit-integration).

### 8.5 Validation & benchmarking plan
Backtest the DSA verdict against realised distress events (Sri Lanka 2022, Zambia 2020, Ghana 2022)
— the model should have flagged unsustainable paths pre-default. Reconcile the spread-premium
loadings against the V20 ~117 bps and published sovereign climate-risk-premium studies. Sensitivity:
vary `β_c` ±50% and confirm ordinal stability of the sustainability ranking.

### 8.6 Limitations & model risk
Reduced-form spread regression cannot capture regime shifts (sudden-stop dynamics); NGFS GDP damage
functions are contested at the tail; ND-GAIN scores update slowly. Conservative fallback: when
climate covariates are missing, default `climate_bps` to the V20 regional median rather than zero, so
absence of data does not understate risk.

## 9 · Future Evolution

### 9.1 Evolution A — Build the climate-adjusted DSA the guide promises, on real WEO data (analytics ladder: rung 1 → 2)

**What.** The §7 flag is severe: the promised climate-adjusted IMF DSA (`ClimateAdjustedDSR = DebtService/(GDPgrowth_base − GDPloss_climate·β_climate)`) and spread premium formula exist nowhere in code — the page generates 60 synthetic sovereigns whose every attribute (GDP, debt/GDP, vulnerability, default probability, rating) is an independent `sr()` draw with "no cross-attribute causal structure." A country can seed a 130% debt load, AAA rating, and 1% default probability simultaneously. The §8 spec for the real DSA model already exists on this page; Evolution A implements it.

**How.** (1) `services/sovereign_climate_dsa_engine.py` implementing the §8/§5 formulas: debt-service trajectories from IMF WEO fiscal series (public API), climate GDP-loss paths from the NGFS damage functions already ingested for the Financial Modeling Studio, vulnerability from ND-GAIN — replacing all 60 synthetic rows with ~60 real V20-and-peers sovereigns. (2) Scenario dimension (rung 2): DSR projections per NGFS scenario per decade, plus the debt-for-climate swap module — swap feasibility computed from actual debt stock and the DNS deal terms curated in the sibling `em-debt-climate-risk` module. (3) Consolidation decision: this module and `em-debt-climate-risk` overlap heavily; the honest path is this module owns the *DSA/fiscal* lens, the sibling owns the *market-spread* lens, both reading one shared sovereign table.

**Prerequisites (hard).** The fabricated 60-row dataset removed in the same release the engine lands (it currently attributes default probabilities to nothing); WEO ingester built. **Acceptance:** a fixture sovereign's climate-adjusted DSR reproduces the §5 formula by hand from WEO inputs; attributes are jointly consistent (debt service derives from actual debt stock); zero `sr()` draws remain.

### 9.2 Evolution B — Debt-swap structuring assistant for finance ministries and creditors (LLM tier 2)

**What.** The workflow's most specialized step — "model debt-for-climate swap feasibility and savings" — as a tool-calling assistant: "structure a swap for a Caribbean sovereign with 85% debt/GDP: how much debt service could a TNC-style deal free, and what adaptation investment does that fund?" It calls Evolution A's DSA and swap-feasibility endpoints, benchmarks terms against the real executed-deal database (Belize/Ecuador/Gabon-style precedents from the sibling module's `DNS_DEALS`), and drafts the V20-aligned proposal memo.

**How.** Tools: `run_climate_dsa(country, scenario)`, `model_swap(country, haircut, conservation_commitment)`, `get_precedent_deals(filters)`. Grounding corpus = this Atlas record's §5 methodology plus the IMF SDN 2021/005 and V20 Monitor references it cites. Precedent citations come only from stored deal rows with year and partner; savings figures only from the swap model's output. The memo renders through report-studio; feasibility caveats (creditor composition, rating implications) are surfaced from the engine's own inputs, not asserted.

**Prerequisites (hard).** Evolution A end-to-end — a structuring memo derived from the current causally-incoherent synthetic sovereigns could reach a real finance-ministry audience with nonsense debt arithmetic. **Acceptance:** a golden swap memo's savings equal the swap endpoint's output; every precedent named exists in the deals table; asking about a sovereign outside the WEO-covered set refuses with the covered list.