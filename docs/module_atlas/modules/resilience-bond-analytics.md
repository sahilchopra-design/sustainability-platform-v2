# Resilience Bond Analytics
**Module ID:** `resilience-bond-analytics` · **Route:** `/resilience-bond-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-EK4 · **Sprint:** EK

## 1 · Overview
CAT bond and climate adaptation bond analytics: 24-bond universe with peril/trigger/rating/coupon, parametric vs indemnity trigger comparison radar, ILS market issuance trend, KPI-linked coupon analytics, investor base ($Bn by type), and structuring guide.

> **Business value:** Used by ILS fund managers screening cat bond opportunities, sovereign debt officers structuring parametric bonds, MDB treasury teams issuing resilience bonds, and institutional investors allocating to adaptation ILS.

**How an analyst works this module:**
- Filter 24 bonds by peril type; sort by size, coupon, or tenor to analyse market structure
- Review parametric vs indemnity radar comparing payout speed, basis risk, transparency, and data requirements
- Analyse KPI-adjusted coupon spreads for bonds with resilience performance step-up/down mechanisms
- Review investor landscape by type with allocation, target coupon, and instrument preferences

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BONDS`, `COUPON_ANALYTICS`, `INVESTOR_TYPES`, `ISSUANCE_TREND`, `KpiCard`, `Pill`, `TABS`, `TRIGGER_COMPARISON`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ISSUANCE_TREND` | 8 | `catBond`, `climateAdapt`, `parametric` |
| `TRIGGER_COMPARISON` | 7 | `parametric`, `indemnity`, `modelledLoss`, `industryIndex` |
| `INVESTOR_TYPES` | 7 | `allocationBn`, `avgCoupon`, `preference` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sortedBonds` | `useMemo(() => [...filteredBonds].sort((a, b) => b[sortField] - a[sortField]), [filteredBonds, sortField]);` |
| `totalIssuance` | `BONDS.reduce((a, b) => a + b.size, 0);` |
| `avgCoupon` | `BONDS.reduce((a, b) => a + b.coupon, 0) / BONDS.length;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `INVESTOR_TYPES`, `ISSUANCE_TREND`, `TABS`, `TRIGGER_COMPARISON`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Cat bond market size 2024 | `Outstanding ILS including cat bonds` | Artemis Q1 2024 ILS Market Report | Record issuance driven by re/insurance capacity tightening post-hurricane losses; spread widening attracting new pension fund capital. |
| Parametric payout speed | `After trigger breach vs 6–18 months for indemnity` | CCRIF 2024 Report | CCRIF paid $135M to Caribbean governments within weeks of 2024 hurricane season; indemnity claims still settling 3 years later. |
| Climate adaptation bond CAGR | `2022–2024 issuance growth` | CBI Climate Bonds Initiative 2024 | Driven by World Bank/IBRD issuances, sovereign climate bonds, and SLBs with climate resilience KPIs. |
- **ICMA GBP + CBI Adaptation Criteria + Artemis ILS + World Bank Resilience Bond Framework + IBRD + CCRIF + Swiss Re** → 24-bond universe + trigger comparison + issuance trend + coupon analytics + investor base + structuring guide → **ILS fund managers, sovereign debt officers, MDB treasury teams, and cat bond structuring advisors**

## 5 · Intermediate Transformation Logic
**Methodology:** Cat Bond Pricing
**Headline formula:** `Spread = EL × LGD × (1 + RiskPremium); EL = AttachmentProbability × ExpectedLoss_given_attachment; KPI_adjusted_spread = BaseSpread ± ΔStep_up_down; Parametric_payout = Intensity × CoverageAmount × I(Trigger_breached)`

CAT bond market record $31Bn outstanding 2024; climate adaptation bonds growing 42% CAGR; parametric triggers dominate EM sovereign issuances for speed of payout.

**Standards:** ['ICMA Climate Bonds Initiative Adaptation Criteria', 'Swiss Re ILS Market Update 2024', 'World Bank Resilience Bonds Framework 2023']
**Reference documents:** Artemis (2024) – ILS Market Update Q1 2024; CBI (2024) – Climate Bonds Initiative Adaptation Finance Tracker; Swiss Re Institute (2024) – ILS Annual Review

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine states a real cat-bond pricing
> model: `Spread = EL × LGD × (1 + RiskPremium)`, `EL = AttachmentProbability × ExpectedLoss_given_
> attachment`, and a KPI-linked step-up/down formula. **None of these are computed in the code.**
> `grep` for `expectedLoss|attachProb|EL ` returns nothing. Every numeric field on all 24 bonds —
> `size`, `coupon`, `tenor`, `rating`, `couponStep`, `kpiMet` — is an **independent seeded PRNG
> draw** (`sr(i×k)×range+offset`), not a function of peril, attachment probability, or loss-given-
> attachment. The 24 bond **names** are real, recognisable instruments (World Bank Cat Bond 2024,
> Jamaica CAT 2023, CCRIF Parametric 2024, IBRD Pandemic Cat 2024) but every quantitative field
> attached to them is fabricated, not sourced from actual issuance terms.

### 7.1 What the module computes

```
size        = round(sr(i×7)×450 + 50)            // $50–500M
coupon      = (sr(i×11)×6 + 3).toFixed(2)         // 3.00–9.00%
tenor       = round(sr(i×5)×5 + 2)                // 2–7 years
couponStep  = round(sr(i×17)×100 + 25)            // 25–125 bps
kpiMet      = round(sr(i×19)×40 + 55)             // 55–95%
totalIssuance = Σ size                            // sum over all 24 bonds
avgCoupon     = Σ coupon / 24
effectiveSpread (COUPON_ANALYTICS) = baseSpread + kpiAdjustment
  where baseSpread = round(sr(i×7)×500+200), kpiAdjustment = round((sr(i×11)-0.5)×80)
```

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `size` | $50–500M | Synthetic demo — plausible cat-bond tranche sizes but not real deal terms |
| `coupon` | 3.00–9.00% | Synthetic demo; loosely brackets real cat-bond coupon ranges (typically 4–15% depending on peril/attachment) but unrelated to peril or rating |
| `rating` | BB/BB+/BBB-/BBB/B+/B | Realistic cat-bond rating band (S&P/Moody's ILS ratings cluster sub-investment-grade), but assigned independently of `coupon`, so a B-rated bond can show a lower coupon than a BBB bond — inverted vs real credit-spread ordering |
| `couponStep` | 25–125 bps | Synthetic demo, illustrating KPI step-up/down mechanics qualitatively |
| `TRIGGER_COMPARISON` (6 metrics × 4 trigger types, 0–100 scale) | Speed of Payout, Basis Risk, Moral Hazard Protection, Transparency, Sovereign Suitability, Data Requirements | Hand-authored qualitative scoring, directionally consistent with known ILS market characteristics (e.g. parametric scores 95 on payout speed vs indemnity's 35, matching the CCRIF 2–4 week vs 6–18 month claim cited in the guide) — not calculated from any data |
| `ISSUANCE_TREND` (2018–2024, $Bn) | catBond 12.4→31.2, climateAdapt 1.2→11.2, parametric 2.8→15.8 | Static hand-entered series, directionally consistent with the guide's cited $31Bn 2024 Artemis figure |
| `INVESTOR_TYPES` (6 rows) | allocation $Bn, avg coupon, preference | Static hand-authored table |

### 7.3 Calculation walkthrough

1. `BONDS` (24 rows) built once at load from independent `sr(i×k)` seeds keyed to each field —
   there is no shared risk factor linking `peril`, `trigger`, `rating`, and `coupon` for a given
   bond, so the displayed universe cannot be used to study real peril/coupon or
   rating/coupon relationships despite superficially resembling a market screen.
2. `filteredBonds` subsets `BONDS` by `perilFilter`; `sortedBonds` sorts by the selected numeric
   field (`size`/`coupon`/`tenor`); `totalIssuance`/`avgCoupon` are always computed over the full
   24-bond universe (unaffected by the peril filter).
3. `COUPON_ANALYTICS` (20 synthetic rows) illustrates a KPI-linked step-up/down mechanic:
   `effectiveSpread = baseSpread + kpiAdjustment`, where a positive `kpiAdjustment` represents a
   coupon step-up (KPI missed) and negative represents step-down (KPI met) — the arithmetic is
   correct in form, but both terms are independently seeded, not derived from an actual resilience
   KPI trajectory.

### 7.4 Worked example

Bond index `i=3` (Philippines PCRAFI 2023): `size = round(sr(21)×450+50)`. `sr(21) = frac(sin(22)
×10⁴)`; `sin(22 rad)` ≈ −0.00885 (22 rad mod 2π ≈ 3.15 rad) → illustratively `sr(21) ≈ 0.42` →
`size ≈ round(0.42×450+50) = round(239) = $239M`. `coupon = (sr(33)×6+3).toFixed(2)`; if
`sr(33) ≈ 0.58` → `coupon = (0.58×6+3).toFixed(2) = 6.48%`. Neither figure has any relationship to
the Philippines' actual PCRAFI parametric cat-bond terms (a real World Bank-facilitated instrument)
— the name is accurate, the numbers are not.

### 7.5 Companion analytics

- **Trigger mechanics radar** — the one part of the page with defensible qualitative content:
  parametric scoring highest on speed/transparency/sovereign suitability, indemnity highest on
  basis-risk minimization — directionally matches how the ILS/CAT bond literature (and the guide's
  own CCRIF payout-speed citation) characterizes the trigger-type trade-off.
- **Structuring guide tab** — static reference text on trigger selection considerations; no
  calculation.

### 7.6 Data provenance & limitations

- Every quantitative field on the 24-bond universe is synthetic PRNG output attached to real bond
  **names**, which risks users mistaking fabricated coupons/sizes/ratings for actual market data on
  named, real-world instruments (World Bank, CCRIF, IBRD, Swiss Re bonds are real; their displayed
  terms here are not).
- No expected-loss, attachment-probability, or LGD calculation exists despite the guide's pricing
  formula — the module cannot answer "is this bond priced fairly for its risk," only display a
  random coupon.
- `TRIGGER_COMPARISON` and `ISSUANCE_TREND` are the module's most credible content: qualitative
  and directionally-sourced from real ILS market characteristics, even though not computed.

**Framework alignment:** ICMA/CBI Climate Bonds Initiative Adaptation Criteria (referenced for
bond category taxonomy, not implemented as a screening algorithm) · World Bank/IBRD Resilience
Bonds Framework and CCRIF parametric-trigger model (named accurately in bond identifiers, terms
not reproduced) · standard ILS cat-bond pricing convention (`Spread = EL×LGD×(1+RP)`, named in the
guide, absent from code).

## 9 · Future Evolution

### 9.1 Evolution A — Actual issuance terms plus an EL-based spread model (analytics ladder: rung 1 → 2)

**What.** §7.6 flags the citation hazard directly: 24 real, recognisable instrument names (World Bank Cat Bond 2024, Jamaica CAT 2023, CCRIF Parametric 2024) carrying entirely fabricated coupons, sizes, and ratings — users can mistake PRNG output for the terms of named instruments. The guide's pricing model (`Spread = EL × LGD × (1 + RiskPremium)` with EL from attachment probability) is absent (`grep` empty). Cat-bond terms are unusually recoverable: Artemis deal directories and issuer announcements publish size, coupon, trigger, and expected loss at issuance. Evolution A rebuilds the universe from actual terms and implements the spread decomposition.

**How.** (1) A `cat_bond_universe` table populated from public issuance data (size, coupon spread, EL at issuance, trigger type, peril, tenor) with source URL and date per bond; the seeded generator deleted — under the platform's fabrication guardrail, real names with fake terms is the worst variant. (2) `POST /api/v1/resilience-bonds/spread-model`: multiple-of-EL analytics (spread ÷ EL, the market's standard richness metric) and the guide's decomposition for user-structured hypothetical bonds, with the risk-premium multiple benchmarked against the ingested universe by peril and rating band. (3) KPI-linked step-up mechanics become a real calculator over user-defined KPI schedules. (4) The credible qualitative assets (`TRIGGER_COMPARISON`, structuring guide) stay as reference with citations.

**Prerequisites.** Issuance-data collection pass (public but manual; ~24 bonds is feasible); refresh cadence decision. **Acceptance:** every displayed bond term carries a source; spread-multiple rankings recompute from stored EL/spread pairs; a hypothetical bond's modelled spread decomposes to EL × multiple with the benchmark band cited.

### 9.2 Evolution B — ILS screening copilot for allocators (LLM tier 2)

**What.** ILS fund managers screen relative value: "which outstanding US-wind bonds trade rich to their EL multiple versus the peril average?", "compare parametric vs indemnity triggers for a Caribbean sovereign — basis risk, payout speed, pricing implications", "draft the IC one-pager for this new issuance against comparable deals". The copilot runs universe queries and the spread model as tools, and narrates trigger trade-offs from the curated comparison content.

**How.** Tier-2 tool schemas over the universe/spread endpoints; relative-value answers quote the computed multiple and its peer distribution, with the as-of date of the underlying terms (issuance terms, not live secondary marks — a distinction the copilot must state, since the platform has no secondary ILS pricing feed). Trigger explanations ground in the module's qualitative comparison table plus cited ICMA/CBI criteria. IC one-pagers compose deal terms, peer comparables, and the KPI step-up schedule through report studio. Hard rule: no terms for bonds absent from the sourced universe; no implied recommendations on named live instruments beyond computed metrics.

**Prerequisites (hard).** Evolution A's sourced universe — screening advice on fabricated terms attached to real bonds is reputationally disqualifying; date-stamped records. **Acceptance:** every term in a one-pager resolves to a sourced row; the issuance-vs-secondary caveat appears in relative-value answers; unsourced bonds are declined.