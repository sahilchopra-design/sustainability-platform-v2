## 7 · Methodology Deep Dive

### 7.1 What the module computes

The page (`ClimatePolicyPage.jsx`) is a **curated 30-country climate policy database** plus a
16-jurisdiction carbon-pricing map, with derived gap and coverage metrics. Unlike most platform
modules there is **no seeded PRNG anywhere** — every row is a hand-entered constant reflecting
real policy facts (e.g. Germany: `carbon_price_usd:45`, `ndc_reduction_pct:65`,
`net_zero_year:2045`, `climate_law_name:'Federal Climate Change Act 2021'`, `coal_phaseout_year:2038`).

Headline computations, quoted from code:

```js
pctOf = (arr, fn) => arr.length ? ((arr.filter(fn).length / arr.length) * 100).toFixed(0) : '0'
carbonPricingCoverage = CARBON_PRICING.reduce((s,c) => s + c.coverage_pct_global, 0)   // ≈ 16.6% of global GHG
avgCarbonPrice = mean of carbon_price_usd over countries with price > 0
gap = c.ndc_reduction_pct - c.ndc_progress_pct                                          // implementation gap, pp
renewableGap = parseInt(renewable_target_2030) - renewable_current_pct                  // pp to 2030 RE target
```

KPI booleans use `pctOf`: `% with net-zero law`, `% Paris-aligned (ndc_progress_pct ≥ 40)`,
`% coal phase-out ≤ 2040`, `% EV mandate`, `% CBAM-applicable`, `% taxonomy-applicable`, and total
`climate_finance_pledge_bn` (sums to ≈ $59.7Bn across pledging countries).

The route is backed by a substantive **backend engine** (`climate_policy_tracker_engine.py`,
tier A, exposed at `/api/v1/climate-policy/*`) with 40 jurisdiction profiles, the EU Fit-for-55
package (13 regulations), 26 IRA tax credits, the IEA NZE carbon-price corridor and 4 NGFS policy
scenarios. Note the page currently renders from its own frontend constants; the engine endpoints
(`/ref/jurisdictions`, `/ref/ngfs-policy-scenarios`, `/ref/carbon-price-corridor`, ...) serve the
reference layer and are not yet the page's data source.

### 7.2 Parameterisation

**Frontend country schema** (30 rows): `carbon_price_usd`, `carbon_pricing_type`,
`ets_coverage_pct`, `ndc_target/base_year/target_year/reduction_pct/progress_pct`, `net_zero_year`,
`net_zero_law`, `climate_law(_name)`, `renewable_target_2030`, `renewable_current_pct`,
`coal_phaseout_year`, `ev_mandate`, `cbam_applicable`, `taxonomy_applicable`,
`climate_finance_pledge_bn`. Values are consistent with public sources (World Bank Carbon Pricing
Dashboard price levels; UNFCCC NDC registry targets) but are static snapshots, not live feeds.

**Backend engine constants (provenanced in code comments):**

| Constant | Value | Source cited in code |
|---|---|---|
| `IEA_NZE_CARBON_PRICE` (AE) | $40 (2022) → $130 (2030) → $250 (2050) | IEA WEO 2023 NZE corridor |
| `IEA_NZE_CARBON_PRICE` (EMDE) | $25 → $90 → $200 | IEA WEO 2023 NZE corridor |
| `PARIS_15C_BENCHMARK_PCT_FROM_2010` | 43% | IPCC AR6 median 1.5°C reduction by 2030 |
| NGFS scenario carbon prices | e.g. Orderly AE 2030 = $200; Hot House 2030 = $20 | NGFS policy scenarios (stylised) |
| Ambition thresholds | tier high ≥70 / medium ≥45 / low ≥25; Paris-1.5°C ≥65, 2°C ≥45 | internal heuristic |

**Engine ambition score** (`_compute_ambition_score`, 0–100):

```
target_score = min(70, target_pct / 55 × 70)                 // 55% NDC ⇒ full 70 pts
status_bonus = {first:0, updated:5, enhanced:10}
nz_bonus     = 15 if net_zero ≤ 2050; 8 if ≤ 2060; else 3
penalty      = max(0, (base_year − 2010) × 0.3)              // older base years inflate headline %
score        = clip(target_score + status_bonus + nz_bonus − penalty, 0, 100)
```

Conditional NDCs are haircut ×0.85. The 55%-anchor and bonus weights are **internal heuristics**,
not published CAT weights.

### 7.3 Calculation walkthrough

1. **Filter/sort** — region + text filters over `CLIMATE_POLICIES`; sortable table (spread-before-
   sort, no mutation).
2. **KPIs** — the `pctOf` share metrics and coverage sum described in §7.1, computed once
   (`useMemo`, `[]` deps) over the full 30-country database (not the filtered view).
3. **NDC charts** — `ndcProgressData` (target vs progress per country), `netZeroTimeline` (count of
   countries per net-zero year), `renewableGapData` sorted by target-minus-current gap.
4. **Portfolio policy risk** — loads the user's portfolio from `localStorage['ra_portfolio_v1']`
   (fallback: first 30 rows of `GLOBAL_COMPANY_MASTER`), maps each holding's country to its policy
   row, and flags **CBAM-exposed** holdings: companies *outside* CBAM countries whose sector
   matches `/energy|material|industrial|cement|steel|alumin/i`.
5. **Engine path** (API) — `assess_jurisdiction_policy` returns NDC ambition, carbon-price gap
   `max(NZE_2030 − current_price, 0)`, stringency and reversal risk; `calculate_carbon_price_gap`
   adds a GDP-risk proxy `gap_2030/50 × 1%` (halved for EMDE); `assess_policy_portfolio_impact`
   computes weighted transition risk with a sector modifier `1 + 0.05 × policy-overlap count`,
   tiering the portfolio (very_high ≥ 0.70 … low < 0.25).

### 7.4 Worked example — Germany, engine ambition score

Germany profile: NDC −65% vs 1990, status *enhanced*, net-zero 2045.

| Step | Computation | Result |
|---|---|---|
| Target score | min(70, 65/55 × 70) = min(70, 82.7) | 70.0 |
| Status bonus | enhanced | +10 |
| Net-zero bonus | 2045 ≤ 2050 | +15 |
| Base-year penalty | max(0, (1990−2010)×0.3) | 0 |
| **Ambition score** | 70 + 10 + 15 | **95.0 → tier "high", 1.5°C-consistent (≥65)** |
| Carbon-price gap | NZE AE 2030 $130 − $45 (frontend) / $65 (EU profile) | $85 / $65 gap |
| Frontend implementation gap | 65 − 52 | **13 pp** |

### 7.5 Companion analytics

- **Carbon Pricing tab** — 16 instruments sorted by price ($130 Sweden/Switzerland → $2 Japan/
  Indonesia); global coverage sums each instrument's `coverage_pct_global`.
- **Climate finance** — pledge league table ($11.6Bn UK, $11.4Bn US, $7.5Bn JP ...).
- **Exports** — CSV/JSON of the full database; cross-navigation to `/sovereign-esg`.

### 7.6 Data provenance & limitations

- Frontend data is **hand-curated, static, real-world-plausible** (prices, NDC targets and law
  names check out against World Bank CPD 2024 / UNFCCC), but has no refresh mechanism and no
  citation per row; `ndc_progress_pct` is an editorial estimate, not a UNFCCC-reported figure.
- The guide's "AmbitionGap = NDC_target − Science_pathway" exists **only in the backend engine**
  (`gap_vs_15c = adjusted_43%_benchmark − target_pct`); the page itself shows the *implementation*
  gap (target − progress). The CAT four-band rating language in the guide maps loosely onto the
  engine's `ambition_tier`, but the engine's scoring weights are proprietary heuristics, not CAT's
  published fair-share/modelled-pathways method.
- `pctOf(db, c => c.ndc_progress_pct >= 40)` labels countries "Paris-aligned" on progress ≥40% —
  a display shorthand with no scientific basis.
- Frontend and engine carbon prices disagree for some jurisdictions (page DE $45 vs engine EU $65)
  because they were curated at different dates.

**Framework alignment:** UNFCCC Paris Agreement Art. 4 (NDC cycle — targets and 5-year updates are
the raw inputs) · IPCC AR6 WGIII (the 43%-below-2010-by-2030 1.5°C benchmark the engine uses) ·
IEA WEO NZE (carbon-price corridor) · NGFS policy scenarios (orderly/disorderly/hot-house price
paths) · World Bank State & Trends of Carbon Pricing (instrument coverage/price data model) ·
EU CBAM Reg. 2023/956 (portfolio exposure screen). Climate Action Tracker, referenced by the
guide, derives its ratings by comparing NDCs and policies against modelled domestic pathways and
fair-share equity ranges — the engine approximates this with a points rubric instead.

## 8 · Model Specification — NDC Ambition & Implementation Gap Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Support sovereign-risk and transition-risk decisions (sovereign bond tilts, country exposure caps)
with a defensible, reproducible country policy score replacing the current points heuristic.
Coverage: the ~198 Paris parties, assessed annually plus event-driven (NDC resubmission, major law).

### 8.2 Conceptual approach

Two-gap architecture per Climate Action Tracker and UNEP Emissions Gap Report practice:
(i) **ambition gap** = country 2030 NDC emissions vs a 1.5°C-consistent modelled domestic pathway;
(ii) **implementation gap** = current-policy projected emissions vs the NDC level. Benchmarks:
Climate Action Tracker country assessments (modelled domestic pathways + fair share) and the
World Bank Carbon Pricing Dashboard for the pricing pillar; policy-stringency mirrors the OECD
Environmental Policy Stringency index construction.

### 8.3 Mathematical specification

```
E_NDC     = E_base × (1 − r_NDC)                        # NDC-implied 2030 emissions, MtCO2e
E_1.5     = E_2010 × (1 − 0.43) × φ_c                   # IPCC AR6 43% cut, φ_c = country effort-share
E_CP      = E_now × (1 + g_CP)^(2030−t_now)             # current-policy projection
AmbitionGap_pp        = max(0, (E_NDC − E_1.5) / E_base × 100)
ImplementationGap_pp  = max(0, (E_CP − E_NDC) / E_base × 100)
CarbonPriceGap        = max(0, P_NZE(track, 2030) − P_eff),  P_eff = Σ_i price_i × coverage_i
PAS = 100 − w₁·min(AmbitionGap_pp,40)/40×100·w₁ − w₂·min(ImplGap_pp,30)/30×100 − w₃·CarbonPriceGap/130×100
      with weights w = (0.45, 0.35, 0.20)
Rating bands (CAT-style): PAS ≥ 80 "1.5°C compatible"; 60–79 "almost sufficient";
                          40–59 "insufficient"; < 40 "critically insufficient"
```

| Parameter | Calibration source |
|---|---|
| `E_base`, `E_2010`, `E_now` | UNFCCC GHG inventories; OWID CO₂ dataset (already in platform `reference_data`) |
| `r_NDC` | UNFCCC NDC Registry (unconditional target) |
| `φ_c` effort share | CAT modelled domestic pathways or IPCC AR6 regional pathways |
| `g_CP` current-policy growth | Climate Action Tracker / PBL Climate Pledge scenarios |
| `P_NZE` corridor | IEA WEO NZE ($130 AE / $90 EMDE, 2030) — already coded in engine |
| price_i, coverage_i | World Bank Carbon Pricing Dashboard (annual CSV, free) |

### 8.4 Data requirements

Country GHG series (OWID — ingested), NDC registry text + machine-readable targets (UNFCCC, free),
carbon pricing instruments (World Bank CPD API), policy inventories (Climate Change Laws of the
World, Grantham — free), IEA NZE corridor (already hardcoded). Platform assets reusable: the
engine's `JURISDICTION_PROFILES`, `G20_CARBON_PRICING`, and `reference_data` OWID tables.

### 8.5 Validation & benchmarking plan

Reconcile PAS rating bands against published CAT ratings for the ~40 CAT-covered countries
(target: ≥80% same-band agreement); backtest implementation gap projections against realised
inventories with 2-year lag; sensitivity: ±10pp on `φ_c` and ±20% on `g_CP` must not move >15% of
countries across bands (stability test per SR 11-7 ongoing-monitoring expectations).

### 8.6 Limitations & model risk

Effort-sharing (`φ_c`) is normative — publish both fair-share and cost-effective variants;
current-policy projections carry high uncertainty for EMDEs; carbon-price effectiveness ignores
non-pricing regulation (mandates, standards) — mitigate with the stringency pillar; conservative
fallback: where projections are unavailable, floor the rating at "insufficient" rather than
imputing.
