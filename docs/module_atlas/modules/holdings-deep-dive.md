# Holdings Deep Dive
**Module ID:** `holdings-deep-dive` · **Route:** `/holdings-deep-dive` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides granular position-level ESG analytics with full look-through across fund of fund structures, enabling issuer-level attribution of ESG score, carbon footprint, controversy exposure, and PAI indicator contributions. Supports portfolio managers in identifying specific holdings driving portfolio-level ESG underperformance.

> **Business value:** Enables portfolio managers and ESG analysts to perform root-cause analysis of portfolio ESG scores at the individual holding level, prioritise engagement or divestment decisions based on ESG contribution and controversy risk, and produce granular SFDR PAI disclosures from position-level data.

**How an analyst works this module:**
- Load the full portfolio holdings file including fund look-through positions and select the ESG data provider.
- Review the ESG contribution waterfall to identify the top positive and negative ESG score contributors by position.
- Drill into individual holdings using the deep-dive card to review pillar-level scores, controversy flags, and PAI data.
- Export the position-level ESG attribution report for investment committee or client reporting.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Btn`, `CHART_COLORS`, `ChartTooltip`, `DataField`, `EngagementTag`, `HoldingsDeepDivePage`, `NavLink`, `ProgressBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `csv` | `[headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `pct` | `Math.min(100, Math.max(0, ((value \|\| 0) / max) * 100));` |
| `base` | `{ border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.15s', fontFamily: T.font };` |
| `dir` | `sortDir === 'asc' ? 1 : -1;` |
| `selectedHoldings` | `useMemo( () => selectedIds.map(id => holdings.find(h => (h.id \|\| h.company?.ticker) === id)).filter(Boolean), [selectedIds, holdings] );` |
| `portfolioTotalScope1` | `useMemo(() => holdings.reduce((s, h) => s + (h.company?.scope1_mt \|\| 0), 0), [holdings]);` |
| `portfolioTotalScope2` | `useMemo(() => holdings.reduce((s, h) => s + (h.company?.scope2_mt \|\| 0), 0), [holdings]);` |
| `portfolioTotalScope12` | `portfolioTotalScope1 + portfolioTotalScope2;` |
| `portfolioWACI` | `useMemo(() => holdings.reduce((s, h) => { const gi = ghgIntensity(h); return s + (gi !== null ? (h.weight \|\| 0) / 100 * gi : 0); }, 0), [holdings]);` |
| `headers` | `['Ticker', 'Name', 'Sector', 'Weight%', 'ESG Score', 'GHG Intensity', 'T-Risk', 'SBTi', 'NZ Year', 'Scope1 Mt', 'Scope2 Mt'];` |
| `rows` | `selectedHoldings.map(h => {` |
| `attrScope1` | `af !== null ? af * (c.scope1_mt \|\| 0) : null;` |
| `attrScope2` | `af !== null ? af * (c.scope2_mt \|\| 0) : null;` |
| `attrScope12` | `af !== null ? af * ((c.scope1_mt \|\| 0) + (c.scope2_mt \|\| 0)) : null;` |
| `waciContrib` | `gi !== null ? (h.weight \|\| 0) / 100 * gi : null;` |
| `pctScope12` | `portfolioTotalScope12 > 0 ? (((c.scope1_mt \|\| 0) + (c.scope2_mt \|\| 0)) / portfolioTotalScope12) * 100 : null;` |
| `pctWACI` | `portfolioWACI > 0 && waciContrib !== null ? (waciContrib / portfolioWACI) * 100 : null;` |
| `envScore` | `c.env_score ?? Math.round(esgScore * 0.9 + (sr(esgScore) * 2 - 1) * 5);` |
| `socScore` | `c.soc_score ?? Math.round(esgScore * 1.05 + (sr(esgScore + 500) * 2 - 1) * 3);` |
| `govScore` | `c.gov_score ?? Math.round(esgScore * 1.1 - (sr(esgScore * 5) * 2 - 1) * 4);` |
| `radarMetrics` | `['GHG Intensity', 'ESG Score', 'T-Risk', 'SBTi', 'Data Quality'];` |
| `values` | `selectedHoldings.map(row.fn);` |
| `best` | `numeric.length ? (row.lowerBetter ? Math.min(...numeric) : Math.max(...numeric)) : null;` |
| `ghgNorm` | `gi !== null ? Math.max(0, Math.min(100, 100 - (gi / 10))) : 50;` |
| `physNorm` | `c.physical_risk_score ? (100 - c.physical_risk_score) : 50;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHART_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG Score Range (portfolio) | — | MSCI ESG Ratings | Distribution of ESG scores across individual holdings; wide dispersion (>30 points range) indicates high stock-specific ESG risk concentration. |
| Top 5 Carbon Contributors (%) | — | PCAF / CDP data | Proportion of portfolio financed emissions attributable to the 5 largest carbon contributors; Pareto concentration typical in diversified equity portfolios. |
| Controversy Flag Rate (%) | — | RepRisk / Sustainalytics | Percentage of holdings with active high-severity ESG controversies; above 15% indicates elevated reputational risk concentration. |
| PAI Indicator Coverage (%) | — | SFDR portfolio reporting | Share of mandatory SFDR PAI indicators computable at holding level without estimation; higher coverage reduces PAI disclosure uncertainty. |
- **Portfolio holdings (IBOR/ABOR)** → Apply fund look-through, map to ISIN ESG database → **Position-level ESG scores and PAI data**
- **MSCI/Sustainalytics ESG data feeds** → Compute position ESG contributions vs portfolio average → **ESG contribution waterfall by holding**
- **Carbon emissions data (CDP/PCAF)** → Weight financed emissions by portfolio weight and EVIC → **Position-level carbon footprint contributions**

## 5 · Intermediate Transformation Logic
**Methodology:** Position ESG Contribution
**Headline formula:** `ESG_contribution_i = w_i × (ESG_i - ESG_portfolio) / ESG_portfolio × 100`

Decomposes the portfolio ESG score into position-level contributions by computing the weighted deviation of each holding's ESG score from the portfolio average. Positive contributors improve the portfolio score; negative contributors represent holdings whose ESG quality drags on the overall portfolio ESG rating.

**Standards:** ['MSCI ESG Fund Rating Methodology', 'SFDR Delegated Regulation Annex I', 'UNPRI Reporting Framework']
**Reference documents:** MSCI ESG Fund Rating and ESG Score Methodology (2023); SFDR Delegated Regulation (EU) 2022/1288; UNPRI Portfolio ESG Analysis (2021); PCAF Global Standard Part A (2022)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ✅ **Guide↔code: broadly faithful, with real formulas.** This module computes genuine position-level
> carbon/ESG attribution from actual portfolio holdings (`GLOBAL_COMPANY_MASTER` + user portfolio),
> using the standard PCAF/TCFD intensity and WACI formulas — not seeded data. The guide's
> `ESG_contribution = wᵢ×(ESGᵢ−ESG_port)/ESG_port×100` is a slightly different decomposition than the
> page's primary outputs (WACI contribution, financed-emissions attribution), but the substantive
> methodology is sound. The only `sr()` use is a fallback to *estimate* missing E/S/G pillar scores.

### 7.1 What the module computes

**GHG intensity** (PCAF-style, per $M revenue):
```js
ghgIntensity(h) = ((scope1_mt + scope2_mt) × 1e6) / revenue_usd_mn      // tCO₂e/$M
                  (null if revenue = 0)
```

**Portfolio WACI** (weighted-average carbon intensity, TCFD-recommended):
```js
portfolioWACI = Σ_h ( weight_h/100 × ghgIntensity(h) )                  // over holdings with GI
waciContrib_h = weight_h/100 × ghgIntensity(h)                          // position contribution
pctWACI_h     = waciContrib_h / portfolioWACI × 100                     // % of portfolio WACI
```

**Financed-emissions attribution** (attribution factor `af`):
```js
attrScope12 = af × (scope1_mt + scope2_mt)                              // attributed tCO₂e
pctScope12  = ((scope1_mt+scope2_mt)/portfolioTotalScope12) × 100       // share of portfolio emissions
```

**Temperature bucketing** (implied-temperature proxy from carbon intensity):
```js
tempBucket: <50 "<1.5°C aligned" | <150 "1.5–2°C" | <400 "2–3°C" | <800 "3–4°C" | else "4°C+"
```

### 7.2 Parameterisation

The temperature buckets (50 / 150 / 400 / 800 tCO₂e/$M thresholds) are the key rubric — a coarse
mapping of carbon intensity to an implied warming band. Pillar-score fallbacks (used only when
`env_score`/`soc_score`/`gov_score` are absent) apply a seeded jitter around the composite ESG score:
```js
envScore = c.env_score ?? round(esg×0.9 + (sr(esg)×2−1)×5)     // E slightly below composite
socScore = c.soc_score ?? round(esg×1.05 + (sr(esg+500)×2−1)×3)
govScore = c.gov_score ?? round(esg×1.1 − (sr(esg×5)×2−1)×4)
ghgNorm  = gi!==null ? max(0, min(100, 100 − gi/10)) : 50       // radar normalisation
physNorm = physical_risk_score ? (100 − score) : 50
```

### 7.3 Calculation walkthrough

Holdings come from the user's portfolio (props), enriched from `GLOBAL_COMPANY_MASTER` by ticker (real
scope1/scope2/revenue/ESG). The page computes portfolio totals (scope 1, scope 2, WACI) once, then per
selected holding: GHG intensity, WACI contribution and %, attributed emissions and %, temperature
bucket, and a 5-axis radar (GHG intensity, ESG, T-risk, SBTi, data quality). Comparison mode lets the
user select multiple holdings and highlights the best per metric (lower-better for intensity).

### 7.4 Worked example (two holdings, WACI contribution)

Holding A: weight 5%, scope1+2 = 2.0 Mt, revenue $4,000M → GI = 2.0e6×1e6/4000 wait —
GI = (2.0)×1e6/4000 = 500 tCO₂e/$M. Holding B: weight 3%, scope1+2 = 0.3 Mt, revenue $6,000M →
GI = 0.3×1e6/6000 = 50 tCO₂e/$M.

| Holding | weight | GHG intensity | WACI contrib = w×GI |
|---|---|---|---|
| A | 0.05 | 500 | 25.0 |
| B | 0.03 | 50 | 1.5 |

```
portfolioWACI (these two) = 25.0 + 1.5 = 26.5
pctWACI_A = 25.0 / 26.5 × 100 = 94.3%    // A drives the portfolio's carbon intensity
tempBucket_A = 500 → "3–4°C" ;  tempBucket_B = 50 → "1.5–2°C"
```

Holding A, though only 5% of weight, contributes 94% of the WACI and sits in the 3–4 °C bucket — exactly
the concentration insight the module is built to surface.

### 7.5 Data provenance & limitations

- **Real data path.** GHG intensity, WACI and financed-emissions attribution use actual scope1/scope2/
  revenue from `GLOBAL_COMPANY_MASTER` and the user's holdings/weights — not synthetic.
- **Seeded only as fallback.** E/S/G pillar scores are estimated with an `sr()` jitter around the
  composite *only when* the real pillar scores are missing; if present, real scores are used.
- The temperature bucket is a **carbon-intensity proxy**, not an implied-temperature-rise (ITR) model —
  it does not use SBTi/CRREM pathways or a warming-function; it is a threshold map on GI.
- Attribution factor `af` (EVIC-based) is taken as an input; the page does not compute EVIC itself.

### 7.6 Framework alignment

**PCAF Global Standard** — the financed-emissions attribution (`af × scope1+2`) and per-$M carbon
intensity follow PCAF's attribution-factor methodology; data-quality scoring (radar axis) mirrors PCAF's
1–5 DQ scale. **TCFD** — portfolio WACI is the TCFD-recommended carbon metric (Σ weight × intensity).
**SFDR PAI** — position-level scope emissions and intensities feed mandatory PAI indicators (the guide's
use case). **MSCI ESG** — the E/S/G pillar decomposition mirrors MSCI's pillar structure. The implied-
temperature bucket approximates what SBTi/CRREM derive rigorously (aligning a company's intensity
trajectory to a warming pathway) with a static threshold map — a documented simplification.

*(No §8 model spec required: the module's core outputs — WACI, financed-emissions attribution — are
standard PCAF/TCFD formulas computed on real data. The one heuristic (intensity→temperature bucket) is a
transparent threshold map, caveated in §7.5; a production implied-temperature model would live in the
`paris-alignment`/`portfolio-temperature-score` modules, not here.)*

## 9 · Future Evolution

### 9.1 Evolution A — From intensity buckets to a real implied-temperature and PAI engine (analytics ladder: rung 2 → 3)

**What.** This module is one of the healthier tier-B pages: WACI, GHG intensity and financed-emissions attribution are genuine PCAF/TCFD formulas over real `GLOBAL_COMPANY_MASTER` data, with `sr()` used only as a pillar-score fallback. Its two documented simplifications are the targets: (a) the temperature bucket is a static threshold map on carbon intensity (50/150/400/800 tCO₂e/$M), not an implied-temperature-rise model; (b) the PCAF attribution factor `af` is taken as input because the page cannot compute EVIC. Evolution A moves both server-side: an ITR calculation using company intensity *trajectories* against SBTi/CRREM sector pathways, and EVIC-based attribution computed from balance-sheet data, plus PAI indicator coverage scoring the §4 lineage promises.

**How.** (1) A backend `holdings_attribution` route accepting the holdings payload, returning per-position WACI contribution, attributed scope 1+2, ITR (trajectory vs sector decarbonisation pathway), and PCAF data-quality tier — the frontend's radar DQ axis becomes computed rather than displayed. (2) EVIC from the refdata layer's market/fundamentals tables where available; honest `resolution_tier` fallback to revenue-based intensity otherwise. (3) Pin the §7.4 worked example (holding A: GI 500, 94.3% of WACI) as a bench_quant reference case.

**Prerequisites.** Balance-sheet/EVIC coverage in the company master; the pillar-score `sr()` jitter replaced by explicit "estimated" flags so estimates are visible, not silent. **Acceptance:** ITR for a holding changes when its trajectory (not just level) changes; PCAF DQ tier reported per position; bucket map retired.

### 9.2 Evolution B — Engagement-targeting analyst over the attribution waterfall (LLM tier 2)

**What.** The module's purpose is root-cause analysis — "which holdings drive our ESG/carbon underperformance?" — which is inherently conversational. Evolution B: a tool-calling analyst that answers "why is holding A 94% of our WACI at 5% weight?", "which 5 divestments halve financed emissions with least tracking-error weight?", and "draft the PAI escalation list for IC" by calling the Evolution A attribution endpoint and the existing CSV-export data path, narrating only computed contributions.

**How.** Tier 2 per the roadmap: tool schemas from the new attribution route; system prompt grounded in this page's §7.1 formulas (WACI contribution, `pctScope12`, attribution factor) so explanations use the exact decomposition the page computes. The comparison-mode state (selected holdings) passes as context so "these three" resolves correctly. The no-fabrication validator checks every tCO₂e and percentage against tool output; engagement recommendations must cite the `engagementPriority`-style risk×weight arithmetic, not model intuition.

**Prerequisites.** Evolution A's backend route (the page is currently frontend-computed, so there is nothing to tool-call); copilot router from Phase 1. **Acceptance:** an IC-ready answer's every figure matches the attribution response; asked for Scope 3 attribution (not computed today), the analyst states the module doesn't compute it.