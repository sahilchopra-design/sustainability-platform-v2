# Climate Sovereign Bonds
**Module ID:** `climate-sovereign-bonds` · **Route:** `/climate-sovereign-bonds` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses sovereign green, sustainability, and sustainability-linked bond issuances for use of proceeds alignment, NDC consistency, and credit-adjusted green premium (greenium) quantification.

> **Business value:** Provides fixed income investors and sovereign debt analysts with rigorous tools to evaluate climate sovereign bonds on both financial and impact dimensions, supporting green portfolio allocation decisions.

**How an analyst works this module:**
- Collect sovereign GSS bond prospectuses and use of proceeds frameworks
- Assess alignment with ICMA Green Bond Principles and NDC sectoral targets
- Compute greenium using interpolated yield curve comparison for matched-maturity conventional bonds
- Score issuer climate credibility: framework robustness, reporting quality, impact metrics

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BOND_TYPES`, `COLORS`, `CREDIT_RISK_DATA`, `GREENIUM_DATA`, `ISSUERS`, `KpiCard`, `MARKET_TREND`, `RATINGS`, `REGIONS`, `REGULATORY_STANDARDS`, `SDG_ALLOCATION`, `TABS`, `TYPES_F`, `YIELD_CURVE`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `BOND_TYPES` | 8 | `color`, `description` |
| `ISSUERS` | 31 | `region`, `rating`, `type`, `outstanding`, `yield`, `spread`, `greenPct`, `sdg`, `verifier`, `framework`, `renewTarget`, `climateScore`, `maturity`, `issued`, `couponPct`, `liquidity`, `creditOutlook`, `debtGdp` |
| `SDG_ALLOCATION` | 8 | `pct`, `count`, `amount` |
| `REGULATORY_STANDARDS` | 7 | `body`, `status`, `scope`, `key`, `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `YIELD_CURVE` | `['2Y', '3Y', '5Y', '7Y', '10Y', '15Y', '20Y', '30Y'].map((t, i) => ({` |
| `GREENIUM_DATA` | `ISSUERS.filter(b => b.rating.startsWith('AA') \|\| b.rating.startsWith('AAA')).slice(0, 14).map((b, i) => ({` |
| `CREDIT_RISK_DATA` | `ISSUERS.slice(0, 20).map((b, i) => ({` |
| `REGIONS` | `['All', 'Europe', 'Asia-Pacific', 'Latin America', 'Africa', 'North America'];` |
| `TYPES_F` | `['All', ...BOND_TYPES.map(b => b.type)];` |
| `kpis` | `useMemo(() => { const n = Math.max(1, filtered.length);` |
| `total` | `filtered.reduce((s, b) => s + b.outstanding, 0);` |
| `pfStats` | `useMemo(() => { const n = Math.max(1, pfHoldings.length);` |
| `csv` | `[keys.join(','), ...data.map(r => keys.map(k => `"${r[k]}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BOND_TYPES`, `COLORS`, `ISSUERS`, `RATINGS`, `REGIONS`, `REGULATORY_STANDARDS`, `SDG_ALLOCATION`, `TABS`, `TYPES_F`, `YIELD_CURVE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Sovereign Green Bond Issuance (2023) | — | OECD Green Bond Monitor 2023 | Total sovereign green, social, and sustainability bond issuance in 2023 across 40+ issuing governments. |
| Average Sovereign Greenium | — | BIS 2021 / OECD 2023 | Range of yield concession on sovereign green bonds versus conventional comparators across primary markets. |
- **Bond prospectuses, yield curve data, NDC frameworks, post-issuance impact reports** → Use of proceeds alignment scoring, greenium calculation, issuer credibility assessment → **Bond league tables, greenium time series, NDC alignment heat maps**

## 5 · Intermediate Transformation Logic
**Methodology:** Greenium
**Headline formula:** `Greenium = YTM(Conventional) – YTM(Green)`

Yield spread between a sovereign's conventional bond and its green bond of equivalent duration, reflecting market pricing of green credentials; negative greenium means green bond yields less.

**Standards:** ['BIS Working Paper 2021', 'OECD Green Bond Monitor 2023']
**Reference documents:** ICMA Green Bond Principles 2021; BIS Working Paper No. 923 (2021) Green Bonds and Carbon Emissions; OECD Green and Sustainable Finance Monitor 2023; Climate Bonds Initiative State of the Market 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The guide frames a **greenium** tool (`Greenium = YTM_conventional − YTM_green`). The code presents a
curated 31-issuer GSS-bond dataset with yield/spread/greenPct/climateScore fields and derives greenium,
credit-risk and yield-curve panels from those stored fields — it does not interpolate a real conventional
yield curve to compute matched-maturity greenium at runtime; the greenium is embedded in the seed data.

### 7.1 What the module computes

The page is dataset-driven (`ISSUERS`, 31 rows). Derived views:
```js
YIELD_CURVE   : map of ['2Y'..'30Y'] tenors → representative yields
GREENIUM_DATA : ISSUERS filtered to AA/AAA, first 14 → greenium display
CREDIT_RISK_DATA : first 20 issuers → spread/rating/outlook
kpis          : n = max(1, filtered.length); portfolio averages (yield, greenPct, climateScore, spread)
total         : Σ outstanding (issuance volume)
pfStats       : portfolio-holdings roll-up (weighted metrics)
```
Greenium per issuer is the stored `spread`/yield differential vs its conventional comparator; the guide's
negative-greenium convention (green yields less) is reflected in the seeded `spread`/`greenPct` fields.

### 7.2 Parameterisation / scoring rubric

| Seed schema | Key fields | Provenance |
|---|---|---|
| `ISSUERS` (31) | rating, yield, spread, greenPct, sdg, verifier, framework, climateScore, debtGdp | curated demo (sovereign GSS market) |
| `BOND_TYPES` (8) | color, description | Green/Social/Sustainability/SLB taxonomy |
| `SDG_ALLOCATION` (8) | pct, count, amount | use-of-proceeds SDG mapping |
| `REGULATORY_STANDARDS` (7) | body, status, scope | ICMA GBP / EU GBS / CBI reference |

Interpretation anchors from guide: sovereign issuance ~$150B (2023, OECD); average greenium −1 to −5 bp
(BIS 2021 / OECD 2023).

### 7.3 Calculation walkthrough

Region/type filters subset `ISSUERS` → `kpis` compute averages with an `n = max(1, length)` divide-guard →
`total` sums outstanding → `GREENIUM_DATA` restricts to AA/AAA for cleaner greenium comparison →
`CREDIT_RISK_DATA` shows spread/outlook for the top 20 → CSV export quotes all fields. Portfolio tab
(`pfStats`) weights holdings.

### 7.4 Worked example

A sovereign green bond with `yield = 3.10%` and a matched conventional comparator at `3.14%`:
```
Greenium = YTM_conventional − YTM_green = 3.14 − 3.10 = +0.04% = 4 bp
```
By the guide's sign convention this is a **−4 bp greenium** (green bond yields 4 bp *less*), inside the BIS/
OECD −1 to −5 bp range — the investor accepts a small yield concession for the green label. Averaged across
the 14 AA/AAA issuers in `GREENIUM_DATA`, the portfolio greenium KPI reports the mean concession.

### 7.5 Data provenance & limitations

- The 31-issuer dataset is **curated demo data**, not live prospectus/EMMA feeds; greenium is embedded in
  the stored yield/spread, not computed by interpolating a real conventional curve to matched maturity.
- No use-of-proceeds verification, no NDC-alignment scoring engine — `sdg`/`framework`/`climateScore` are
  stored attributes, not assessed outputs.
- `YIELD_CURVE` is a representative tenor grid, not bootstrapped from the issuer set.

**Framework alignment:** ICMA Green Bond Principles 2021 (use-of-proceeds, verifier, framework fields) ·
BIS WP-923 (2021) and OECD Green Bond Monitor 2023 (greenium magnitude) · Climate Bonds Initiative State of
the Market (issuance context) · sovereign NDC alignment (guide's intended overlay).

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Compute a statistically clean matched-maturity greenium per sovereign GSS bond and
an issuer climate-credibility score, for green fixed-income allocation.

**8.2 Conceptual approach.** **Nelson-Siegel-Svensson yield-curve fitting** on each sovereign's conventional
curve, then greenium as the green bond's yield residual to the fitted curve — the BIS/ECB green-bond-pricing
method — plus a use-of-proceeds credibility score from framework/verification quality (CBI second-party-
opinion practice).

**8.3 Mathematical specification.**
```
Fit conventional curve:  y(τ) = β0 + β1·f1(τ,λ1) + β2·f2(τ,λ1) + β3·f3(τ,λ2)   (NSS)
Greenium_bond = y_green(τ_bond) − y_hat_conventional(τ_bond)     (basis points, matched maturity)
Credibility = w1·FrameworkRobustness + w2·ReportingQuality + w3·ImpactMetricCoverage + w4·NDCAlignment
Controls: match currency, seniority, liquidity (bid-ask), issue size before comparing
```

| Parameter | Source |
|---|---|
| NSS β, λ | least-squares fit to conventional sovereign bonds (EMMA/refinitiv) |
| Framework/reporting weights | ICMA GBP + CBI SPO rubric |
| NDC alignment | country NDC sectoral targets (UNFCCC registry) |

**8.4 Data requirements.** Full conventional + green bond price/yield curves per sovereign; issue
characteristics; framework/SPO documents; NDC data. Free: EMMA, UNFCCC NDC registry; vendor: Bloomberg
BVAL, CBI database.

**8.5 Validation & benchmarking.** Reconcile fitted greenium against BIS/OECD −1 to −5 bp; liquidity-control
robustness; backtest greenium persistence in secondary market.

**8.6 Limitations & model risk.** Sparse conventional comparators for some sovereigns; liquidity confounds
greenium; framework quality subjective. Fallback: nearest-maturity spread differential with liquidity flag
when curve fit is under-identified.

## 9 · Future Evolution

### 9.1 Evolution A — Runtime greenium from interpolated conventional curves (analytics ladder: rung 1 → 3)

**What.** Today the greenium is *embedded* in the curated 31-row `ISSUERS` seed — §7 is
explicit that the page "does not interpolate a real conventional yield curve to compute
matched-maturity greenium at runtime", and `YIELD_CURVE` is a representative tenor grid,
not bootstrapped. Evolution A makes `Greenium = YTM_conventional − YTM_green` an actual
computation: interpolate each sovereign's conventional curve at the green bond's
maturity and report the spread with a confidence band, then benchmark the distribution
against the BIS WP-923 / OECD −1 to −5 bp range the module already cites.

**How.** (1) First backend vertical `GET /api/v1/sovereign-gss/greenium/{issuer}`:
store per-issuer conventional bond points (tenor, YTM) and GSS bond terms in two new
tables (`sovereign_bond_curve`, `sovereign_gss_issue`), seeded initially from published
central-bank/OECD curve data; monotone cubic interpolation at matched maturity.
(2) The AA/AAA restriction the page applies to `GREENIUM_DATA` becomes a documented
credit-matching rule rather than a display filter. (3) Calibration payload: computed
portfolio greenium vs the BIS/OECD literature band, shown per §8's validation approach.
(4) Frontend keeps `SDG_ALLOCATION` and `REGULATORY_STANDARDS` panels as curated
reference — they are genuinely reference content.

**Prerequisites.** A curve data source (ECB/FRED sovereign yields are free and
keyless — consistent with the NX batch's free-data constraint); no PRNG defect exists
here to purge. **Acceptance:** the §7.4 worked example (3.14% vs 3.10% → −4 bp)
reproduces through the interpolator; issuers whose computed greenium falls outside
−10..+5 bp are flagged, not silently averaged into the KPI.

### 9.2 Evolution B — Framework-credibility copilot over prospectus corpora (LLM tier 1 → 2)

**What.** The stated workflow starts with "collect sovereign GSS bond prospectuses and
assess ICMA GBP / NDC alignment" — currently impossible in-module because `framework`,
`sdg`, and `climateScore` are stored attributes, not assessed outputs (§7.5). Evolution
B uses an LLM where it genuinely adds capability: ingest an issuer's green bond
framework PDF and produce a structured ICMA GBP four-pillar assessment (use of
proceeds, project evaluation, management of proceeds, reporting) with clause-level
citations, plus an NDC-consistency comparison against the issuer's stated sectoral
targets.

**How.** Tier-1 grounding is this Atlas record plus the ICMA GBP 2021 text (already a
cited reference document); the assessment prompt outputs the module's existing field
schema (`framework`, `verifier`, SDG mapping) so results slot into the `ISSUERS` table
with provenance flipped from `curated` to `document-assessed`. Tier 2 adds tool calls
to the Evolution A greenium endpoint so an analyst can ask "does the market reward this
issuer's framework quality?" and get computed greenium next to the credibility score.

**Prerequisites.** Document upload path (the platform's data-intake route family
exists); every extracted claim must carry a page/clause citation — no un-cited scores.
**Acceptance:** on 3 public sovereign frameworks (e.g. Germany, Chile, India), the
copilot's pillar assessments cite retrievable clauses; fields it cannot evidence are
returned null, honoring the platform's honest-nulls convention.