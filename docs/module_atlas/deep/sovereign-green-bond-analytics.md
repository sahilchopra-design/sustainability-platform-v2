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
