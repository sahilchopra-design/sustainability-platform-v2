# Green Bond Portfolio Analytics
**Module ID:** `green-bond-portfolio-analytics` · **Route:** `/green-bond-portfolio-analytics` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides comprehensive analytics for green, social, sustainability, and sustainability-linked bond (GSS+) portfolios including use-of-proceeds tracking, impact reporting, greenium quantification, and ICMA Principles alignment. Enables portfolio managers to monitor labelled bond allocation, verify impact claims, and produce investor impact reports.

> **Business value:** Enables fixed income portfolio managers to demonstrate use-of-proceeds integrity, quantify the greenium cost of green bond allocation, and produce ICMA-aligned impact reports satisfying SFDR sustainable investment disclosures and EU Green Bond Standard requirements.

**How an analyst works this module:**
- Load the GSS+ bond portfolio and classify each holding by bond type (green, social, sustainability, SLB) and ICMA Principles version.
- Run greenium analysis to compute Z-spread differentials against matched conventional bonds for each holding.
- Review the use-of-proceeds tracker to verify project category allocations and identify unallocated or misallocated proceeds.
- Generate the investor impact report aggregating financed renewable energy, emissions avoided, and social beneficiaries across all holdings.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BONDS`, `BONDS_N`, `BOND_TYPES`, `COUNTRIES_GB`, `GB_COUNTRY_ISSUANCE`, `GB_COUNTRY_MAP`, `GB_MARKET`, `GB_SECTORS`, `GB_TOTAL_2023`, `ICMA_CATEGORIES`, `KpiCard`, `REPORTING_STATUSES`, `TABS`, `VERIFIERS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `type` | `BOND_TYPES[Math.floor(sr(i * 7 + 1) * BOND_TYPES.length)];` |
| `nominal` | `sr(i * 11 + 2) * 500 + 50;` |
| `coupon` | `sr(i * 13 + 3) * 0.06 + 0.005;` |
| `ytm` | `coupon + (sr(i * 17 + 4) * 0.01 - 0.005);` |
| `greenium` | `sr(i * 19 + 5) * 0.0025 - 0.005;` |
| `dur` | `sr(i * 23 + 6) * 12 + 1;` |
| `impactPerM` | `type === 'Green' ? sr(i * 29 + 7) * 8 + 0.5 : type === 'Social' ? sr(i * 31 + 8) * 2000 + 100 : sr(i * 37 + 9) * 5 + 0.2;` |
| `sec` | `GB_SECTORS[Math.floor(sr(i * 41 + 10) * GB_SECTORS.length)];` |
| `verifier` | `VERIFIERS[Math.floor(sr(i * 43 + 11) * VERIFIERS.length)];` |
| `reporting` | `REPORTING_STATUSES[Math.floor(sr(i * 47 + 12) * 3)];` |
| `GB_COUNTRY_MAP` | `Object.fromEntries(GB_MARKET.map(c=>[c.iso3, c]));` |
| `GB_TOTAL_2023` | `GB_MARKET.reduce((s,c)=>s+c.issuance_usd_bn,0).toFixed(0);` |
| `GB_COUNTRY_ISSUANCE` | `GB_MARKET.slice(0,12).map(c=>({name:c.country, iso:c.iso3, value:c.issuance_usd_bn, yoy:c.yoy_change_pct, sovereign:c.sovereign_green_bond}));` |
| `totalNominal` | `BONDS.reduce((s, b) => s + b.nominal, 0);` |
| `BONDS_N` | `BONDS.map(b => ({ ...b, aumWeight: b.nominal / totalNominal }));` |
| `filteredNominal` | `useMemo(() => filtered.reduce((s, b) => s + b.nominal, 0), [filtered]);` |
| `totN` | `filtered.reduce((s, b) => s + b.nominal, 0);` |
| `avgImpact` | `useMemo(() => filtered.length ? filtered.reduce((s, b) => s + b.aumWeight * b.blendedImpact, 0) / (filtered.reduce((s, b) => s + b.aumWeight, 0) \|\| 1) : 0, [filtered]);` |
| `reportingCoverage` | `useMemo(() => filtered.length ? filtered.filter(b => b.reportingStatus === 'Reported').length / filtered.length * 100 : 0, [filtered]);` |
| `sectorGreenium` | `useMemo(() => { return GB_SECTORS.map(sec => { const subs = filtered.filter(b => b.issuerSector === sec);` |
| `reportingByMonth` | `useMemo(() => { return Array.from({ length: 12 }, (_, i) => ({ month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i], reported: Math.floor(sr(i * 7 + 1) * 8) + 2, pending: Math.floor(sr(i * 11 + 2) * 4) + 1, missing: Math.floor(sr(i * 13 + 3) * 2), }));` |
| `typeTotals` | `BOND_TYPES.map(t => secBonds.filter(b => b.type === t).reduce((s, b) => s + b.nominal, 0));` |
| `rowTotal` | `typeTotals.reduce((s, x) => s + x, 0);` |
| `pct` | `filtered.length > 0 ? (count / filtered.length * 100).toFixed(1) : '0.0';` |
| `aum` | `bds.reduce((s, b) => s + b.nominal, 0);` |
| `avgC` | `bds.reduce((s, b) => s + b.coupon, 0) / n;` |
| `avgY` | `bds.reduce((s, b) => s + b.yieldToMaturity, 0) / n;` |
| `avgD` | `bds.reduce((s, b) => s + b.duration, 0) / n;` |
| `avgG` | `bds.reduce((s, b) => s + b.greenium, 0) / n;` |
| `dnshPct` | `bds.filter(b => b.dnshCompliant).length / n * 100;` |
| `taxPct` | `bds.filter(b => b.taxonomyAligned).length / n * 100;` |
| `avgImp` | `bds.reduce((s, b) => s + b.blendedImpact, 0) / n;` |
| `typeCounts` | `BOND_TYPES.map(t => filtered.filter(b => b.verifier === ver && b.type === t).length);` |
| `total` | `typeCounts.reduce((s, x) => s + x, 0);` |
| `sorted` | `[...filtered].sort((a, b) => a.greenium - b.greenium);` |
| `idx` | `Math.floor(sorted.length * pct / 100);` |
| `sliceEnd` | `Math.floor(sorted.length * Math.min(100, pct + 25) / 100);` |
| `avgAum` | `slice.reduce((s, b) => s + b.nominal, 0) / slice.length;` |
| `avgESG` | `slice.reduce((s, b) => s + b.esgScore.charCodeAt(0), 0) / slice.length;` |
| `avgDur` | `slice.reduce((s, b) => s + b.duration, 0) / slice.length;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/green-bond-analytics/curve-spreads` | `curve_spreads` | api/v1/routes/green_bond_analytics.py |
| POST | `/api/v1/green-bond-analytics/relative-value` | `relative_value` | api/v1/routes/green_bond_analytics.py |
| POST | `/api/v1/green-bond-analytics/dual-tranche` | `dual_tranche` | api/v1/routes/green_bond_analytics.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `FRED` *(shared)*, `__future__` *(shared)*, `datetime` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `typing` *(shared)*, `zero` *(shared)*
**Frontend seed datasets:** `BOND_TYPES`, `COUNTRIES_GB`, `GB_SECTORS`, `ICMA_CATEGORIES`, `REPORTING_STATUSES`, `TABS`, `VERIFIERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Greenium (bps) | — | Bloomberg / ICMA | Weighted average greenium across GSS+ holdings; negative values indicate green bonds trade richer, reducing yield but reflecting market ESG premium. |
| Use-of-Proceeds Allocation (%) | — | Issuer allocation reports | Percentage of green bond proceeds allocated to eligible green projects per issuer reports; unallocated proceeds above 5% flag monitoring concern. |
| Impact: Renewable Energy Capacity (MW) | — | Issuer impact reports | Aggregate renewable energy capacity financed across portfolio's green bond holdings, reported per €1M invested. |
| CBI Certification Rate (%) | — | Climate Bonds Initiative | Share of GSS+ portfolio holdings carrying third-party CBI certification; higher rates indicate stronger use-of-proceeds integrity. |
- **GSS+ bond universe (Bloomberg / ICE)** → Classify by ICMA type, extract use-of-proceeds categories → **Labelled bond classification database**
- **Issuer green bond allocation and impact reports** → Aggregate impact metrics by project category, normalise per €1M → **Portfolio impact report**
- **Conventional bond curves by issuer** → Fit spline, compute Z-spread differential → **Greenium by holding in basis points**

## 5 · Intermediate Transformation Logic
**Methodology:** Greenium Quantification (Z-spread)
**Headline formula:** `Greenium_i = ZSpread_conventional_matched - ZSpread_green_i`

Estimates greenium by computing the Z-spread differential between each green bond and a matched conventional bond from the same issuer with equivalent maturity and seniority. Where no exact match exists, a synthetic conventional yield is fitted using a cubic spline on the issuer's conventional bond curve.

**Standards:** ['ICMA Green Bond Principles 2021', 'EU Green Bond Standard (EuGBS)', 'Climate Bonds Initiative Taxonomy']
**Reference documents:** ICMA Green Bond Principles (2021); EU Green Bond Standard Regulation (2023); Climate Bonds Initiative Taxonomy (V3.0); Bloomberg BNEF â€” Green Bond Market Outlook (2024)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **5** other module(s).

| Connected module | Shared via |
|---|---|
| `green-bond-portfolio-optimizer` | table:FRED, table:zero |
| `green-bond-pricing-desk` | table:FRED, table:zero |
| `maturity-wall-monitor` | table:FRED |
| `infra-debt-portfolio-manager` | table:FRED |
| `credit-spread-climate-monitor` | table:FRED |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry advertises a **Z-spread greenium engine**
> (`Greenium_i = ZSpread_conventional_matched − ZSpread_green_i`, with a *cubic spline fitted on each
> issuer's conventional bond curve* where no exact maturity match exists). **No Z-spread, no spline,
> and no matched-conventional-bond logic exist in the code.** Each bond's greenium is a single seeded
> draw: `greenium = sr(i·19+5)·0.0025 − 0.005` (a value in `[−0.50, −0.25]`% i.e. −50 to −25 bps),
> assigned before any market data touches it. The module is a **portfolio-analytics and impact-reporting
> dashboard over 100 synthetic labelled bonds**, not a greenium pricing engine. When India mode is on it
> swaps in `getIndiaGreenBonds()`. Sections below document the code; §8 specifies the real Z-spread model.

### 7.1 What the module computes

The page builds 100 synthetic GSS+ bonds (`_DEFAULT_BONDS`), each carrying nominal, coupon, YTM,
duration, greenium, ICMA use-of-proceeds category, verifier, ESG rating, taxonomy/DNSH flags and a
`blendedImpact` score. Portfolio KPIs are AUM-weighted (weight = `nominal / Σnominal`):

```js
portfolioGreenium = Σ (nominal_i / Σnominal) · greenium_i        // AUM-weighted greenium (bps)
avgImpact         = Σ aumWeight_i · blendedImpact_i / Σ aumWeight_i
reportingCoverage = count(reportingStatus == 'Reported') / N · 100    // %
```

Per-sector greenium (`sectorGreenium`) repeats the AUM-weighting within each of 8 issuer sectors, and
`typeSplit` aggregates nominal by the 6 ICMA bond types.

### 7.2 Parameterisation / seed rubric

| Field | Generator | Range | Provenance |
|---|---|---|---|
| `type` | `BOND_TYPES[⌊sr·6⌋]` | Green/Social/Sustainability/SLB/Blue/Transition | synthetic; ICMA label taxonomy |
| `nominal` | `sr·500+50` | $50–550M | synthetic demo value |
| `coupon` | `sr·0.06+0.005` | 0.5–6.5% | synthetic demo value |
| `ytm` | `coupon + (sr·0.01−0.005)` | coupon ±50 bps | synthetic demo value |
| `greenium` | `sr·0.0025−0.005` | −50 to −25 bps | synthetic; guide claims Z-spread |
| `duration` | `sr·12+1` | 1–13 yr | synthetic demo value |
| `impactPerM` | type-dependent (Green `sr·8+0.5`; Social `sr·2000+100`) | — | synthetic; units differ by label |
| `taxonomyAligned` | `sr·71+17 > 0.4` | ~60% aligned | synthetic threshold |
| `dnshCompliant` | `sr·101+23 > 0.25` | ~75% compliant | synthetic threshold |
| `blendedImpact` | `sr·80+20` | 20–100 | synthetic composite score |

The only externally-sourced constants are the **real country-issuance figures** wired from
`GREEN_BOND_ISSUANCE_2023` (`GB_MARKET`): `GB_TOTAL_2023` (Σ issuance, USD bn) and the top-12
country bar (`value`, `yoy_change_pct`, `sovereign_green_bond`) — labelled in-code "CBI Annual Report 2023".

### 7.3 Calculation walkthrough

Inputs (100 seeded bonds) → user filters (type, sector, country, greenium band, duration band, DNSH,
reporting status, verifier, taxonomy) produce `filtered`. `filteredNominal = Σ nominal`. Every headline
KPI is a reduction over `filtered`:
- Portfolio greenium = nominal-weighted mean greenium.
- Avg impact = aumWeight-weighted mean `blendedImpact`.
- Reporting coverage = % of holdings marked `Reported`.
- The greenium-percentile view sorts `[...filtered]` by greenium and slices deciles, computing per-slice
  average nominal, ESG (via `charCodeAt(0)` on the letter rating) and duration.

### 7.4 Worked example

Two-bond filtered portfolio: Bond A `nominal=$400M, greenium=−0.30%`; Bond B `nominal=$100M,
greenium=−0.45%`.

| Step | Computation | Result |
|---|---|---|
| Σnominal | 400 + 100 | 500 |
| weight A / B | 400/500 · 100/500 | 0.80 / 0.20 |
| Portfolio greenium | 0.80·(−0.30) + 0.20·(−0.45) | **−0.33% (−33 bps)** |

If Bond A is `Reported` and Bond B `Pending`, reporting coverage = 1/2 = **50%**. These are simple
weighted means — faithful to code, but the greenium inputs are seeded, not priced.

### 7.5 Companion analytics

- **Bond Universe** — filterable table of all 100 holdings.
- **Regulatory & Taxonomy** — `dnshPct` / `taxPct` = share of a group that is DNSH-compliant / taxonomy-aligned.
- **Reporting Monitor** — `reportingByMonth` is *itself* re-seeded per month (`Math.floor(sr(i·7+1)·8)+2`
  reported), so the monitor chart is decorative synthetic data, not a rollup of the bond set.
- **Country issuance** — the one real-data panel (`GB_COUNTRY_ISSUANCE`).

### 7.6 Data provenance & limitations

- **All 100 bonds are synthetic**, generated by the seeded PRNG `sr(seed)=frac(sin(seed+1)·10⁴)`.
  Greenium is a random draw, not a spread differential; taxonomy/DNSH flags are threshold coin-flips.
- Only the country-issuance bar reflects real market data (CBI 2023 via `publicDataSeed`).
- `impactPerM` mixes incompatible units across labels (MW-scale for Green, beneficiary-count for Social)
  and is not normalised before aggregation into portfolio impact.
- No curve construction, no matched-conventional pairing, no new-issue-concession decomposition.

**Framework alignment:** ICMA Green Bond Principles 2021 (the four components — use of proceeds,
project evaluation, proceeds management, reporting — mirrored as `icmaCategory`, `verifier`,
`secondPartyOpinion`, `reportingStatus`); EU Green Bond Standard (taxonomy-alignment flag);
Climate Bonds Initiative Taxonomy (label set + the real issuance seed). The greenium concept traces to
ICMA/Bloomberg green-bond pricing studies, but the module does not implement their spread methodology.

## 8 · Model Specification — Green-Bond Greenium (Z-spread) Engine

**Status: specification — not yet implemented in code.** The guide's headline metric requires a real
new-issue-concession / greenium model; below is the production design.

### 8.1 Purpose & scope
Quantify, per labelled bond and at portfolio level, the yield the market forgoes for the green label
(the "greenium"), net of liquidity and credit differences, to (a) support relative-value decisions and
(b) evidence SFDR "sustainable investment" pricing. Coverage: all fixed-rate GSS+ bonds with an
identifiable conventional comparator curve from the same issuer/guarantor.

### 8.2 Conceptual approach
Adopt the **matched-curve Z-spread differential** used by Bloomberg BVAL green-bond analytics and by
academic greenium studies (Zerbib 2019; ICMA market surveys): for each green bond, discount its cash
flows off the issuer's *conventional* zero curve to find the constant spread (Z-spread) that reprices it,
then compare to the Z-spread of the green bond itself. Where the issuer has too few conventional points,
fit a Nelson-Siegel-Svensson (NSS) curve — the same parametric family central banks (ECB, BoE) use for
sovereign curves — rather than an unconstrained cubic spline, to avoid overfitting at the long end.

### 8.3 Mathematical specification
Green bond price `P_g` with cash flows `CF_t` at times `t`; issuer conventional zero rates `z(t)`:
```
P_g = Σ_t CF_t · exp(−(z(t) + ZS_g)·t)          → solve ZS_g  (green Z-spread)
Fit z(t) via NSS: z(t) = β0 + β1·((1−e^{−t/τ1})/(t/τ1)) + β2·(((1−e^{−t/τ1})/(t/τ1)) − e^{−t/τ1})
                            + β3·(((1−e^{−t/τ2})/(t/τ2)) − e^{−t/τ2})
Matched conventional spread ZS_c = z-curve spread of a synthetic conventional bond, same t and coupon.
Greenium_i = ZS_g − ZS_c                          (bps; typically negative)
Liquidity adjustment: Greenium*_i = Greenium_i − λ·(bid_ask_g − bid_ask_c)
Portfolio greenium = Σ (MV_i/ΣMV_i) · Greenium*_i
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `β0..β3, τ1, τ2` | NSS curve params per issuer | fit to issuer conventional bonds (least squares) |
| `λ` | liquidity haircut coefficient | regress spread on bid-ask over comparators; MarketAxess/TRACE |
| bid_ask | quoted spread | vendor (Bloomberg BVAL, MarketAxess) |
| `MV_i` | market value weight | portfolio accounting |

### 8.4 Data requirements
Per bond: full cash-flow schedule, coupon, day-count, call features, ISIN, issuer/guarantor id, ESG
label, bid-ask. Per issuer: universe of conventional bonds (for curve fit). Sources: Bloomberg BVAL or
ICE green-bond pricing (vendor); TRACE/MarketAxess for liquidity (semi-free). The platform already holds
label taxonomy and the CBI issuance seed; curve/pricing data is **not** yet present and must be sourced.

### 8.5 Validation & benchmarking plan
Backtest fitted greenium against realised new-issue concession (final vs guided spread) on primary
deals; reconcile portfolio greenium against ICMA semi-annual market-survey ranges (−2 to −9 bps IG).
Stability: re-fit NSS daily and monitor β-parameter drift; sensitivity of greenium to ±1 comparator bond.
Cross-check against Bloomberg BVAL green-bond spread where available.

### 8.6 Limitations & model risk
Issuers with a single conventional line give unidentifiable curves — fall back to sector curve + issuer
OAS shift, flagged low-confidence. Greenium conflates label, scarcity and liquidity; the λ adjustment is
first-order only. Callable/floating structures need OAS not Z-spread. Conservative fallback: report
greenium as a *range* (curve-fit ± liquidity band) rather than a point when comparator depth < 3 bonds.

## 9 · Future Evolution

### 9.1 Evolution A — Build the Z-spread greenium engine the guide advertises (analytics ladder: rung 1 → 2)

**What.** §7 flags a total mismatch: the guide advertises a Z-spread greenium engine (`Greenium_i = ZSpread_conventional_matched − ZSpread_green_i`, with a cubic spline fitted on each issuer's conventional curve where no exact maturity match exists), but no Z-spread, no spline, and no matched-conventional logic exist — each bond's greenium is a single seeded draw, taxonomy/DNSH flags are threshold coin-flips, and `impactPerM` mixes incompatible units across labels (MW for green, beneficiary-count for social). Only the country-issuance bar reflects real CBI 2023 data. Evolution A builds the real greenium engine: compute Z-spreads for green bonds and matched conventional bonds, fit the issuer curve spline for synthetic matches, and derive greenium as the spread differential — plus a units-consistent impact model (normalise per-category impact metrics rather than summing MW and headcount).

**How.** (1) A backend route computing Z-spread from bond cash flows against a discount curve, matching each green bond to a conventional bond (same issuer/seniority/maturity) or the fitted cubic-spline synthetic yield. (2) Greenium = conventional Z-spread − green Z-spread, per §5. (3) Taxonomy/DNSH flags from real use-of-proceeds assessment, not coin-flips; impact reporting normalised per ICMA category (no cross-unit summation).

**Prerequisites.** A bond universe with cash flows and a conventional-curve source (the sibling `green-bond-pricing-desk` already pulls real FRED OAS curves — reuse); the seeded bonds replaced. **Acceptance:** greenium recomputes as a Z-spread differential reproducing §5; the spline handles unmatched maturities; impact metrics are unit-consistent; no seeded greenium remains.

### 9.2 Evolution B — GSS+ portfolio and impact-reporting copilot (LLM tier 2)

**What.** A copilot for green-bond PMs: "which holdings trade at a genuine greenium after matching to their conventional curve, and draft our use-of-proceeds impact report" tool-calls the Evolution A greenium and impact endpoints, narrating ICMA-aligned allocation and verified impact.

**How.** Tier-2 tool-calling over the greenium/impact endpoints; the grounding corpus is §5/§7 (ICMA GBP/SBP, Z-spread greenium methodology, use-of-proceeds categories). The copilot's value is distinguishing real greenium (curve-matched) from label premium, and drafting impact reports with unit-consistent metrics per category. Guardrail, pre-Evolution-A: because greeniums are seeded and impact units incompatible, it must refuse greenium and aggregate-impact claims. Every figure validated against tool output.

**Prerequisites.** Evolution A (no real greenium today); corpus embedding; conventional-curve data. **Acceptance:** post-Evolution-A, every greenium and impact figure traces to a tool call; the copilot reports impact per ICMA category without summing incompatible units; pre-Evolution-A it declines greenium claims.