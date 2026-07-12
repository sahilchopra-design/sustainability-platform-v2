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
