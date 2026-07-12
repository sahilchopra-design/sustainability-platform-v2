## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a **Policy Ambition Score**
> `PAS = Σ wᵢ × Policyᵢ / MaxScore` — a weighted composite of NDC targets, carbon-price level,
> sectoral coverage and enforcement track record. **No composite score is computed anywhere in this
> page.** Every country-level score (`policyStringency`, `ndcAmbition`, `ndcProgress`, ...) is an
> independent draw from the platform's seeded PRNG, not a weighted function of the others. The
> guide also claims 190+ country coverage; the code holds exactly 50 countries. A genuine
> jurisdiction-scoring implementation *does* exist in the shared backend engine
> (`climate_policy_tracker_engine.py`, documented under `climate-policy`), but this page does not
> call it. The sections below document the code as it behaves.

### 7.1 What the module computes

`ClimatePolicyIntelligencePage.jsx` (135 lines) renders a 50-country policy screening table, a
15-mechanism carbon-pricing table, and dashboard aggregates. The country dataset is generated at
module load:

```js
sr = (s) => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };   // platform PRNG
policyStringency = Math.round(15 + sr(i*7)  * 80)      // 15–95
carbonPrice      = Math.round(     sr(i*11) * 180)     // $0–180/t
ndcAmbition      = Math.round(10 + sr(i*13) * 85)      // 10–95
ndcProgress      = Math.round( 5 + sr(i*17) * 90)      // 5–95 %
renewableTarget  = Math.round(10 + sr(i*19) * 80)
emissionsGt      = sr(i*59)*12 + 0.1                   // 0.1–12.1 Gt
netZeroYear      = 2030 + floor(sr(i*71)*30)           // 2030–2059
tempTarget       = sr(i*67)<0.3 ? '1.5C' : sr(i*67)<0.7 ? '2.0C' : 'Insufficient'
parisAligned     = sr(i*7) > 0.5 ? 'Yes' : 'No'
```

Note the **seed reuse**: `parisAligned` uses seed `i*7`, the same as `policyStringency` — so a
country is "Paris Aligned" exactly when its stringency exceeds ~55. This is the only (accidental)
internal consistency in the dataset; ambition, progress and emissions are mutually independent.

### 7.2 Parameterisation

| Dataset | Rows | Nature |
|---|---|---|
| `COUNTRIES` | 50 (real names, continents, World-Bank income groups) | All numeric fields `sr()`-synthetic |
| `CARBON_PRICING` | 15 mechanisms | Hand-curated, plausible vs World Bank CPD (EU ETS $85/40% coverage, Sweden tax $137, China ETS $9) |
| `TREND` | 24 months | `avgPrice = 30 + 2i + sr(i*7)*15` — a deterministic +$2/month drift plus noise; `stringency = 35 + 0.8i + noise` |

Badge thresholds `[25, 50, 70]` colour-code stringency/ambition (red < 25 ≤ amber < 50 ≤ gold <
70 ≤ green) — display heuristics with no external provenance.

### 7.3 Calculation walkthrough

1. **Screening** — text/continent/income filters, sortable columns, 15-per-page pagination; row
   expansion shows the 12 detail fields plus a per-country radar (note `Finance` is plotted as
   `climateFinance*5` and `Adaptation` as `adaptationSpend*7` to stretch $0–20Bn values onto the
   0–100 radar axis).
2. **KPIs** — arithmetic means over all 50 countries: `avgStringency`, `avgNdc`; counts of ETS
   (`etsActive==='Yes'`), carbon-tax and Paris-aligned countries.
3. **Continental chart** — group-by continent, mean stringency and ambition per group.
4. **Temperature-target pie** — frequency count of the `tempTarget` label (expected split ≈ 30%
   1.5C / 40% 2.0C / 30% Insufficient by construction of the thresholds).
5. **NDC Tracker tab** — top-20 slice by ambition (note: `COUNTRIES.slice(0,20).sort(...)` sorts
   the *first 20 by id*, not the global top 20) and a top-15 emitters area chart.

### 7.4 Worked example — country i = 0 (United States)

| Field | Formula | Value |
|---|---|---|
| policyStringency | 15 + sr(0)·80; sr(0)=frac(sin(1)·10⁴)=frac(8414.71)=0.7098 | 15+56.8 → **72** |
| parisAligned | sr(0)=0.7098 > 0.5 | **Yes** (consistent: stringency 72 > 55) |
| carbonPrice | sr(0·11)=sr(0)=0.7098 → 0.7098·180 | **$128/t** (US actual: no federal price — illustrates synthetic nature) |
| ndcAmbition | 10 + sr(0·13)·85 = 10+0.7098·85 | **70** |

(All seeds `i*k` collapse to `sr(0)` for i=0, so country #1's scores are perfectly correlated —
another seed-design artifact.)

### 7.5 Data provenance & limitations

- **All 50-country scores are synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`); only the country
  names, continents and income groups are real. The carbon-pricing mechanism table is curated and
  broadly accurate as of ~2024 but static.
- No composite PAS, no weighting, no enforcement/track-record input, no UNFCCC/Grantham data feed.
- The `TREND` series' upward drift is a design choice (carbon prices trending up), not data.
- i=0 seed collapse and the `i*7` seed reuse (§7.1) mean several columns are correlated by
  accident rather than by economics.
- The NDC Tracker's "top 20" is a slice-then-sort bug (shows first 20 ids, sorted).

**Framework alignment:** Climate Action Tracker (guide's named standard — CAT actually rates
countries by comparing policies/NDCs against modelled domestic pathways and fair-share equity
ranges, producing the critically-insufficient→1.5°C-compatible bands; nothing equivalent is
computed here) · World Bank Carbon Pricing Dashboard (the CARBON_PRICING table mirrors its
instrument/price/coverage schema) · UNFCCC NDC Registry (conceptual source of the tracked fields).

## 8 · Model Specification — Policy Ambition Score (PAS)

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Produce the composite Policy Ambition Score the guide promises, for ~120 jurisdictions with
adequate data, refreshed annually, to feed sovereign transition-risk tilts and the
`climate-policy` portfolio exposure screen.

### 8.2 Conceptual approach

Weighted multi-pillar index in the style of the **OECD Environmental Policy Stringency index**
(instrument-level scoring aggregated with fixed weights) cross-checked against **Climate Action
Tracker** ratings and the **Grantham Climate Change Laws of the World** legislation counts.
Pillars: (A) NDC ambition, (B) carbon pricing, (C) sectoral regulation coverage, (D) enforcement/
track record — exactly the four the guide names.

### 8.3 Mathematical specification

```
A = 100 × min(1, r_NDC / r_1.5(base_year))          # r_1.5 = 43% from 2010 (IPCC AR6), rebased
B = 100 × min(1, P_eff / 130) ,  P_eff = Σ_i price_i × coverage_i   # $130 = IEA NZE AE 2030
C = 100 × (Σ_s 1{sector s regulated} × share_s)     # s ∈ {power, industry, transport, buildings, AFOLU}, share_s = sector emission share
D = 100 × min(1, achieved_reduction / pledged_reduction_track_record)   # last completed pledge cycle
PAS = 0.35·A + 0.25·B + 0.25·C + 0.15·D
Bands: ≥75 leader · 55–74 advancing · 35–54 lagging · <35 minimal
```

| Parameter | Source |
|---|---|
| r_NDC, base years | UNFCCC NDC Registry |
| 43% / $130 anchors | IPCC AR6 WGIII SPM; IEA WEO NZE corridor (already in `climate_policy_tracker_engine.py`) |
| price_i, coverage_i | World Bank Carbon Pricing Dashboard annual data |
| sector regulation flags | Grantham CCLW + IEA Policies database |
| share_s | UNFCCC inventories / OWID sectoral emissions (in platform `reference_data`) |
| weights (0.35/0.25/0.25/0.15) | initial expert prior; re-fit by regressing on CAT numeric bands (§8.5) |

### 8.4 Data requirements

Per country-year: NDC target %, base/target year, instrument prices & coverage, sector regulation
dummies, sector emission shares, historical pledge outcomes. All free (UNFCCC, World Bank, CCLW,
OWID). Platform reuse: OWID reference tables, engine jurisdiction profiles, `useReferenceData`
hook for delivery to this page.

### 8.5 Validation & benchmarking plan

Rank-correlate PAS against OECD EPS (expect ρ > 0.7 on OECD members) and CAT ordinal ratings
(expect monotone band mapping); weight re-calibration by ordered logit on CAT bands; stability:
year-on-year PAS moves > 15 pts must trace to an identifiable policy event (audit log).

### 8.6 Limitations & model risk

Regulation dummies ignore stringency-within-instrument (a weak ETS scores as covered); enforcement
pillar is thin for countries with one pledge cycle; index weights are judgemental — publish
sensitivity fan (weights ±10pp). Fallback: where pillar D is missing, renormalise A–C weights and
flag coverage tier.
