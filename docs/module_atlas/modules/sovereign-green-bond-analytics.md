# Sovereign Green Bond Analytics
**Module ID:** `sovereign-green-bond-analytics` · **Route:** `/sovereign-green-bond-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-DH6 · **Sprint:** DH

## 1 · Overview
Analyses sovereign green, social, sustainability, and sustainability-linked bond (GSSSB) markets. Evaluates green bond framework quality, use-of-proceeds alignment, greenium quantification, and sovereign issuer climate credibility scoring using second-party opinion methodologies.

> **Business value:** Essential for sovereign debt fund managers, fixed income ESG analysts, and central bank reserve managers. Provides systematic framework quality assessment (ICMA GBP), greenium calculation for relative value trading, and sovereign climate credibility scoring to support engagement with government debt management offices.

**How an analyst works this module:**
- Browse sovereign green bond frameworks by country
- Assess framework quality against ICMA GBP categories
- Calculate greenium versus conventional sovereign curve
- Evaluate eligible expenditure categories and impact reporting
- Generate CBI-aligned second-party opinion analysis

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `BONDS`, `CURRENCIES`, `ISSUERS`, `PROCEEDS`, `REGIONS`, `TABS`, `VERIFIERS`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalVolume` | `filtered.reduce((a, b) => a + b.size, 0);` |
| `avgGreenium` | `filtered.length ? filtered.reduce((a, b) => a + b.greenium, 0) / filtered.length : 0;` |
| `avgOversubscription` | `filtered.length ? filtered.reduce((a, b) => a + b.oversubscription, 0) / filtered.length : 0;` |
| `parisAlignedPct` | `filtered.length ? (filtered.filter(b => b.parisAligned).length / filtered.length * 100).toFixed(1) : '0.0';` |
| `cumIssuanceData` | `YEARS.map(yr => {` |
| `greeniumByProceeds` | `PROCEEDS.map(p => ({` |
| `issuanceByRegion` | `REGIONS.map(r => ({` |
| `sizeVsOversubScatter` | `filtered.map(b => ({ x: b.size, y: b.oversubscription, name: b.name }));` |
| `tenorData` | `[5, 10, 15, 20, 30].map(t => ({` |
| `verifierData` | `VERIFIERS.map(v => ({` |
| `vol` | `filtered.filter(b => b.useOfProceeds === p).reduce((a, b) => a + b.size, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CURRENCIES`, `ISSUERS`, `PROCEEDS`, `REGIONS`, `TABS`, `VERIFIERS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Sovereign GSS Bond Market | — | Climate Bonds Initiative 2024 | Total sovereign GSS bonds outstanding globally — 60+ sovereign issuers including Germany, France, UK, Chile |
| Average Greenium | — | Deutsche Bank Green Bond Research 2023 | Average yield discount for sovereign green bonds vs conventional — compressed from -5 to -12 bps in 2021 |
| GSSSB Share of Sovereign Issuance | — | OECD Sovereign GSS Bond Report 2023 | GSS bonds now 8% of all sovereign bond issuance — doubling from 4% in 2020 |
- **Bloomberg GSSSB issuance database** → Market size and trend analysis → **Sovereign GSS bond volumes by country, currency, tenor**
- **Sovereign green bond frameworks + SPO reports** → Framework quality scoring → **ICMA GBP alignment score by category**
- **Conventional sovereign yield curve data** → Greenium calculation → **Green premium (bps) by issuer and maturity**

## 5 · Intermediate Transformation Logic
**Methodology:** Sovereign Greenium Model
**Headline formula:** `Greenium = YieldConventional - YieldGreen (same issuer, similar maturity); FrameworkScore = Σ [w_i × CategoryScore_i] where categories: UoP quality, reporting, impact, governance`

Greenium (yield differential) reflects investor demand for green paper; framework quality score assesses ICMA GBP alignment, impact reporting transparency, and environmental ambition of eligible expenditure categories

**Standards:** ['ICMA Green Bond Principles 2021', 'Climate Bonds Standard v3.0', 'OECD Sovereign Green Bond Market Framework 2023', 'BloombergNEF GSSSB Market Tracker']
**Reference documents:** ICMA Green Bond Principles 2021; Climate Bonds Initiative Sovereign Green Bond Guidance 2023; OECD Sovereign Green and Sustainability Bond Market Development 2023; IMF Sovereign Green Bonds — Current Trends and Future Directions (2022)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes two computed metrics: `Greenium =
> YieldConventional − YieldGreen` (a yield differential against a matched conventional curve) and
> `FrameworkScore = Σ[w_i × CategoryScore_i]` (ICMA GBP-category-weighted framework quality score).
> **Neither exists in the code.** There is no conventional-bond yield curve anywhere in the module —
> `greenium` is drawn directly from a uniform-ish synthetic range per bond, and there is no
> `FrameworkScore` computation or ICMA-category breakdown at all. What the page actually implements
> is a **filterable catalogue of 65 synthetic sovereign green/sustainability bonds** with independent
> per-field random attributes (size, greenium, oversubscription, verifier, Paris-alignment flag) and
> aggregate/cross-tab views over the filtered set.

### 7.1 What the module computes

`BONDS` is a fixed array of 65 synthetic sovereign bonds, each attribute independently seeded off
`i` (0–64) via `sr(s) = frac(sin(s+1)×10⁴)`:

```
issuanceYear = 2016 + floor(sr(i×7)×9)                    // 2016–2024
size ($Bn)   = 0.5 + sr(i×11)×14.5                          // $0.5–15.0Bn
tenor (yr)   = round(5 + sr(i×13)×25)                       // 5–30yr
greenium(bp) = −2 + sr(i×17)×22                              // −2 to +20bp (sign convention: positive = green pays MORE, i.e. discount)
oversubscription = 1.2 + sr(i×19)×6.8                        // 1.2×–8.0×
secondPartyOpinion = sr(i×23) > 0.2                          // ~80% true
parisAligned        = sr(i×29) > 0.35                        // ~65% true
postIssuanceReport  = sr(i×31) > 0.25                        // ~75% true
```

`country`, `region`, `useOfProceeds`, `verifier`, `currency` are assigned by `i % length` cycling
through fixed lists (65 issuers, 6 regions, 5 use-of-proceeds categories, 5 verifiers, 7 currencies)
— deterministic round-robin, not sampled.

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `size` | $0.5–15.0Bn | Synthetic demo value; broadly consistent with real sovereign GSS tranche sizes |
| `greenium` | −2 to +20bp | Synthetic; wider than the guide's own cited real-world range (Deutsche Bank Green Bond Research 2023: −3 to −8bp) — the code's range is not calibrated to that reference |
| `tenor` | 5–30yr | Synthetic |
| `oversubscription` | 1.2×–8.0× | Synthetic |
| Boolean flags (SPO / Paris / post-issuance report) | ~65–80% true via `sr()>threshold` | Synthetic — thresholds are arbitrary, not derived from actual SPO/ICMA compliance statistics |

No ICMA GBP category scoring, no framework-quality rubric, and no yield-curve or benchmark-spread
computation exist anywhere in the file — the "Greenium Analysis" and "Framework" language in the
guide describes a methodology the module does not implement.

### 7.3 Calculation walkthrough

1. **Filter** — the user narrows `BONDS` by region, use-of-proceeds, issuance year range, minimum
   greenium, and minimum size (`filtered`).
2. **Headline KPIs** — `totalVolume` (Σ size), `avgGreenium` (mean of `greenium` over `filtered`,
   guarded `filtered.length ? … : 0`), `avgOversubscription` (mean), `parisAlignedPct` (share of
   filtered bonds with `parisAligned===true`).
3. **Cross-tabs** — `cumIssuanceData` (cumulative + annual volume by year), `greeniumByProceeds`
   (mean greenium per use-of-proceeds category, guarded `Math.max(1, …)`), `issuanceByRegion`
   (volume by region), `tenorData` (count/volume binned into 5/10/15/20/30yr buckets, ±2yr tolerance),
   `verifierData` (count/volume by the 5 SPO providers).
4. All aggregates are recomputed client-side from `filtered` on every render via `useMemo`; there is
   no backend call and no persisted state — this is a pure static-data explorer.

### 7.4 Worked example

Bond `i=0`: `France-SGB-2016`. `sr(0×7)=sr(0)=frac(sin(1)×10⁴)`.

```
sin(1) = 0.841471 → ×10⁴ = 8414.71 → frac = 0.71
issuanceYear = 2016 + floor(0.71×9) = 2016 + 6 = 2022
sr(0×11)=sr(0)=0.71  → size = 0.5 + 0.71×14.5 ≈ 10.80  ($10.80Bn)
sr(0×17)=sr(0)=0.71  → greenium = −2 + 0.71×22 ≈ 13.6bp
sr(0×19)=sr(0)=0.71  → oversubscription = 1.2 + 0.71×6.8 ≈ 6.03×
```

(Note: because `i=0` makes every `i×k = 0`, several fields for the very first bond all resolve from
`sr(0)` — a minor artefact of the seeding scheme that only affects row 0; all other rows use
distinct multipliers per field.)

### 7.5 Companion analytics

- **Verifier Landscape** — count/volume by the 5 named SPO providers (S&P, Moody's, Sustainalytics,
  CICERO, ISS) — real-world verifier names, synthetic assignment.
- **Paris Alignment** — a flat boolean per bond with no underlying temperature-alignment or
  emissions-pathway computation (contrast with the platform's dedicated `paris-alignment` module,
  which does compute an ITR).
- **Oversubscription vs. Size scatter** — descriptive only; no statistical fit or regression line.

### 7.6 Data provenance & limitations

- **100% synthetic dataset.** All 65 bonds and every numeric field are generated by the seeded PRNG
  `sr(seed)=frac(sin(seed+1)×10⁴)`; no real ICMA-registered green bond framework, SPO report, or
  yield data is ingested.
- The guide's headline dataPoints ("$290Bn outstanding", "-3 to -8bps average greenium", "8% of
  global sovereign issuance") are real 2023–24 market facts cited for context but are **not**
  reproduced by or reconciled against the synthetic dataset — the module's own aggregates (e.g.
  mean greenium over 65 random bonds) will not match those cited figures.
- No conventional-bond benchmark curve exists, so a true greenium (yield differential vs. a matched
  conventional issue) cannot currently be computed even in principle from this module's data model.
- No ICMA Green Bond Principles category scoring (Use of Proceeds / Process for Evaluation /
  Management of Proceeds / Reporting) is implemented despite being named in the guide.

**Framework alignment:** ICMA Green Bond Principles — referenced in the guide as the scoring basis
but not implemented (see §8 for the missing model). Climate Bonds Initiative sovereign GSS
guidance and OECD Sovereign GSS market reports are cited as narrative context (dataPoints) rather
than computed against.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Give fixed-income ESG analysts and sovereign debt managers two real, decision-useful metrics per
green bond: (a) a **yield-curve-based greenium** versus the issuer's own conventional curve, and
(b) an **ICMA GBP framework-quality score** — replacing the current fully-synthetic per-bond fields.

### 8.2 Conceptual approach

Mirror **Deutsche Bank / Barclays green bond research desks**, which compute greenium by
interpolating the issuer's conventional yield curve to the green bond's maturity and taking the
spread (matched-maturity curve-interpolation method), and **Climate Bonds Initiative / ICMA SPO
methodology**, which scores frameworks against the four GBP pillars using a checklist-derived
category score. Both are the standard sell-side/CBI approaches and require no proprietary model —
just clean conventional-curve data and a documented SPO scoring rubric.

### 8.3 Mathematical specification

```
Greenium (bp):
  y_conv(T) = linear_interp(ConventionalCurve, T)        // T = green bond's maturity/tenor
  Greenium  = y_conv(T) − y_green_observed                // positive = green trades tighter (rich)

Framework score (0–100):
  UoP_i        = eligibility-category clarity score (0–100), weight 0.30
  ProcessEval_i = project selection process transparency, weight 0.20
  ProceedsMgmt_i = ring-fencing / tracking mechanism, weight 0.20
  Reporting_i   = allocation + impact report existence & granularity, weight 0.30
  FrameworkScore = 0.30×UoP + 0.20×ProcessEval + 0.20×ProceedsMgmt + 0.30×Reporting
```

| Parameter | Calibration source |
|---|---|
| GBP pillar weights (0.30/0.20/0.20/0.30) | ICMA Green Bond Principles 2021 — 4 core components, Reporting and UoP given primary emphasis per CBI SPO convention |
| Conventional curve interpolation | Standard fixed-income practice (linear or cubic spline on par yields) |
| Greenium sign convention | Negative greenium = greater investor demand (greenium interpreted as tighter yield) per Deutsche Bank/ICMA usage |

### 8.4 Data requirements

| Field | Source (free/vendor) | Already in platform? |
|---|---|---|
| Sovereign conventional yield curve | Refinitiv/Bloomberg (vendor); ECB/national treasury published curves (free, EU sovereigns) | No |
| Green bond secondary-market yield | Bloomberg/Refinitiv (vendor) | No |
| SPO report scoring inputs | Public SPO PDFs from Sustainalytics/CICERO/ISS/Moody's (free, per-issuance) | No — would need manual/NLP extraction pipeline |
| ICMA GBP checklist | ICMA published principles (free) | No |

### 8.5 Validation & benchmarking plan

- Backtest computed greenium against published academic/desk estimates (e.g. Deutsche Bank Green
  Bond Research series, Climate Bonds Initiative greenium reports) for the same issuer-tenor pairs;
  target mean absolute error < 3bp for liquid EUR/USD sovereign green bonds.
- Cross-check FrameworkScore ranking against actual CBI Certification status (binary) for bonds that
  are CBI-certified — certified bonds should systematically score higher.
- Sensitivity: vary GBP pillar weights ±10pp, confirm framework-score rank order is stable.

### 8.6 Limitations & model risk

- Matched-maturity curve interpolation breaks down for illiquid tenors or newly-issued curves with
  few points — flag low-confidence greenium estimates.
- SPO-derived framework scores are inherently subjective; without standardised machine-readable SPO
  data, category scoring requires either manual analyst input or an NLP extraction step with
  material model risk (mis-parsed report language).
- Real greenium is time-varying (tightens/widens with market green-demand cycles) — a point-in-time
  score should be refreshed at least monthly, not treated as a static bond characteristic.

## 9 · Future Evolution

### 9.1 Evolution A — Build the two real metrics: greenium vs a conventional curve and ICMA framework scoring (analytics ladder: rung 1 → 3)

**What.** The §7 flag identifies that the module's two headline deliverables **don't exist in code**: there is no conventional-bond yield curve, so the greenium (`YieldConventional − YieldGreen`) can't be computed even in principle — `greenium` is a synthetic per-bond draw; and there is no `FrameworkScore = Σ[wᵢ × CategoryScoreᵢ]` or ICMA GBP category breakdown at all. The 65-bond catalogue is fully synthetic with round-robin issuer/verifier assignment, and the guide's cited market facts ($290Bn outstanding, −3 to −8bp average greenium) are context, not reproduced. Evolution A builds the two metrics that are the module's entire reason to exist.

**How.** (1) Ingest real sovereign green bonds and, critically, each issuer's **conventional** curve so greenium is a genuine matched-maturity yield differential — the free sources are limited, but government DMO issuance data and the ICMA/CBI sovereign bond databases provide the instruments; a matched-pair methodology (green bond vs interpolated conventional yield at equal maturity) delivers the real greenium the guide promises. (2) Implement `FrameworkScore` as the ICMA GBP four-component weighted assessment (Use of Proceeds / Process for Evaluation / Management of Proceeds / Reporting), scoring each real framework against the SPO and post-issuance report. (3) Replace synthetic bonds with the real issued universe, reconciling aggregates against the cited market facts.

**Prerequisites.** Conventional-curve data per sovereign issuer is the hard input (needed even in principle for greenium); ICMA-category scoring needs the framework documents. **Acceptance:** greenium is a matched-maturity yield differential reproducible from two real bonds; `FrameworkScore` decomposes into the four ICMA categories; portfolio aggregates reconcile to real market figures.

### 9.2 Evolution B — Sovereign-GSSSB framework and relative-value copilot (LLM tier 2)

**What.** A tool-calling analyst for the sovereign-debt-fund / reserve-manager users: "score this country's green bond framework against ICMA GBP", "what's the greenium on this bond versus the conventional curve?", "which sovereign GSS bonds screen as Paris-aligned with credible reporting?" — calling the (Evolution-A) greenium and framework-scoring endpoints and reading the SPO documents, never inventing yields or scores.

**How.** Tier-2 pattern once the metrics are real: greenium and framework-score become tools; the copilot narrates the four-component ICMA breakdown and the matched-maturity greenium, citing the SPO/CBI verification for each framework claim. The framework-quality assessment (reading the SPO text) is an LLM extraction task feeding the deterministic category scores. The no-fabrication validator checks every basis-point and score against tool output.

**Prerequisites (hard).** Evolution A — with no conventional curve and no framework scorer, the copilot could only restate synthetic draws as if they were market greeniums, exactly the fabrication risk the §7 flag warns of. **Acceptance:** every greenium traces to a matched-pair calculation; framework scores decompose to ICMA categories with SPO citations; a bond lacking a conventional-curve match returns "greenium not computable," not a number.