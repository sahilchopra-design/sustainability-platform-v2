## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry defines a composite **"SCES" formula**
> (`SCES = Σ (Supplier ESG × Spend Weight × Tier Discount)`) as the module's calculation engine.
> **No such spend-weighted, tier-discounted composite is computed anywhere in the code.** The page
> instead (a) generates 200 independent synthetic suppliers with unrelated per-field random scores,
> (b) aggregates simple unweighted arithmetic means per KPI/tier/region, and (c) flags "high-risk"
> suppliers via an OR-combination of four hard thresholds — not a weighted product. The
> "ESG Risk Weight 30% / Deforestation 25% / Conflict Minerals 20% / Regulatory 20%" panel shown in
> the Board Report tab is **static display text**, not wired into any calculation. Sections below
> document what the code actually does; §8 specifies the SCES model the guide implies.

### 7.1 What the module computes

200 synthetic suppliers (`SUPPLIERS`, one row per `i` in `Array.from({length:200})`) each carry ~25
independently-drawn attributes — country, tier, category, `esgScore` (40–80), `scope3MtCO2e`
(10–510), `dqs` data-quality score (30–90), `deforestationRisk`/`mineralExposure` (0–100),
`resilienceScore` (40–90), certifications, EUDR/CRMA compliance flags, and disruption metrics. Every
field is drawn from the platform's seeded PRNG `sr(seed)=frac(sin(seed+1)×10⁴)` with a distinct seed
multiplier per field (`i*7` for country, `i*11` for tier, `i*17` for ESG score, …) so fields are
**mutually independent** — a supplier's ESG score has no causal link to its deforestation risk or
resilience score in this dataset.

The 12 headline KPIs (`buildKPIs`) are plain aggregates over the 200 rows: sums (`totalScope3`,
`openCorr`), unweighted means (`avgDqs = Σdqs/200`, `avgMineral`, `avgResilience`), and coverage
percentages (`eudrPct`, `certCov` = share of suppliers with ≥1 certification). A period selector
(`PERIODS`) does not re-slice the supplier data — it *cosmetically* shifts KPI values by
`period_index × small_constant` (e.g. `avgDqs + pi*0.8`) to simulate a trend without any underlying
time-series.

### 7.2 High-risk flag and derived scores

```js
highRisk = esgScore < 55 || deforestRisk > 70 || mineralExp > 75 || resilience < 50
```

This is a **Boolean OR of four independent thresholds**, not a weighted composite — a supplier with
a perfect ESG score of 80 but `deforestRisk = 71` is flagged exactly as high-risk as one scoring 40
on every dimension. `costAtRisk` (Cost-at-Risk KPI) sums `annualSpendM` only across flagged
suppliers — so it is spend *exposed to a binary flag*, not a probability-weighted expected loss.

| Threshold | Value | Provenance |
|---|---|---|
| ESG score floor | 55 | Synthetic demo value (no cited standard) |
| Deforestation risk ceiling | 70/100 | Synthetic demo value |
| Mineral exposure ceiling | 75/100 | Synthetic demo value |
| Resilience floor | 50/100 | Synthetic demo value |

### 7.3 Calculation walkthrough

1. **Generation** — 200 suppliers built once at module load from `SUPPLIERS` (module-level `const`,
   not per-render), each field independently seeded.
2. **Cross-tabs** — `regionDist`, `tierDist`, `catDist` filter+reduce `SUPPLIERS` by category to
   produce per-group counts and unweighted-mean ESG/Scope 3.
3. **Commodity/mineral traceability** — `COMMODITY_TRACE` and `MINERAL_CHAIN` filter suppliers whose
   `commodities`/`minerals` arrays include the row's item, then compute coverage % (EUDR-compliant
   count ÷ exposed count) and `concentration = 1/exposed.length × 100` — a simple inverse-count proxy
   for supplier concentration, not a Herfindahl-Hirschman Index despite occupying that conceptual
   role.
4. **Tier visibility gap** — `TIER_VISIBILITY` applies **hard-coded data-completeness rates**
   (Tier 1 = 94%, Tier 2 = 67%, Tier 3 = 38%) to each tier's supplier count — these are fixed
   constants, not derived from the `dqs` field.
5. **Regulatory compliance** — `regCompliance` maps CSDDD→`engaged`, EUDR→`eudrCompliant`,
   CRMA→`crmaCompliant`, UK MSA→`engaged` (reused) and reports `count/200` against a hard-coded
   target (CSDDD 80%, EUDR 100%, CRMA 95%, UK MSA 100%).
6. **Board report** — `REPORT_CONTENT` is **entirely static prose** per section with a hand-set
   `maturity` score (59–72); it does not recompute from live `SUPPLIERS` state when filters change.

### 7.4 Worked example

Take a supplier with seed index `i=0`: `country = COUNTRIES[⌊sr(7)×20⌋]`. Computing
`sr(7) = frac(sin(8)×10⁴)`: `sin(8) ≈ 0.9894`, ×10⁴ = 9894.0, frac ≈ 0.90 → index
`⌊0.90×20⌋ = 18` → `COUNTRIES[18] = 'Peru'`. Continuing the same pattern: `esgScore =
⌊sr(0)×40+40⌋`; `sr(0)=frac(sin(1)×10⁴)`, `sin(1)≈0.8415`, ×10⁴=8415.0, frac≈0.15 →
`esgScore=⌊0.15×40+40⌋=45`. With `esgScore=45 < 55`, this supplier is flagged `highRisk = true`
**regardless of its other three scores** — illustrating the OR-threshold's aggressiveness: roughly a
quarter of all suppliers breach at least one of the four independent thresholds by construction (each
threshold individually has a meaningful hit-probability over a uniform 0–100 draw).

### 7.5 Companion analytics

- **Engagement pipeline** — 60 synthetic engagements (`ENGAGEMENTS`) across 5 dimensions × 7 stages
  (`ENGAGEMENT_STAGES`), each with `effectiveness` (50–90) and `cost` ($5–55M) — independently seeded,
  no linkage between stage progression and effectiveness.
- **Alerts** — 25 synthetic alerts (`INIT_ALERTS`) drawn from 15 alert types × 4 severities, attached
  to a random supplier; dismissible client-side only (no backend persistence observed in this file).
- **Disruption scenarios** — 6 hard-coded geopolitical/climate scenarios (`DISRUPTION_SCENARIOS`)
  with fixed probability/impact/mitigation-status text — not derived from the supplier dataset.

### 7.6 Data provenance & limitations

- **100% synthetic demo data.** All 200 suppliers, all engagements, and all alerts are generated by
  `sr(seed)`. No real supplier names, spend, or ESG scores are present despite the realistic-looking
  city/company name list.
- The guide's SCES formula, the "risk factor weight" panel (ESG 30% / Deforestation 25% / Conflict
  Minerals 20% / Regulatory 20% / Resilience 5% — inferred from the displayed factors), and the
  spend-weighted composite it implies are **not implemented**; see §8.
- Tier data-completeness rates (94/67/38%) are fixed constants applied uniformly to any period/filter
  selection, not derived from live records.
- `concIdx` (Mineral Concentration KPI, labelled "HHI") is itself just `sr(pi*111)*0.3+0.45` — a
  period-seeded random number with no relationship to the mineral concentration table below it.

**Framework alignment:** GRI 308 (Supplier Environmental Assessment) and GRI 414 (Supplier Social
Assessment) are referenced in the guide as the scoring basis for `esgScore`, but the code does not
implement GRI indicator-level scoring — `esgScore` is a single random draw. EUDR (EU Deforestation
Regulation) and CRMA (Critical Raw Materials Act) compliance are represented as **binary flags**
(`eudrCompliant`, `crmaCompliant`) rather than the regulation's actual due-diligence-statement and
geolocation-traceability requirements. LkSG/CSDDD due-diligence coverage is approximated by reusing
the unrelated `engaged` flag.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Support procurement/sustainability decisions — supplier prioritisation, engagement budget allocation,
and CSDDD/LkSG due-diligence coverage reporting — by producing a defensible, auditable **Supply Chain
ESG Score (SCES)** per supplier and in aggregate, replacing the current independent-random-fields +
OR-threshold approach. Scope: all Tier 1–3 suppliers with recorded spend ≥ a materiality floor.

### 8.2 Conceptual approach

Adopt a **spend-weighted, tier-discounted linear composite**, the same architecture used by
EcoVadis' Supplier Scorecard aggregation and MSCI ESG's issuer-to-portfolio roll-up (score ×
weight, summed, normalised to 0–100), combined with **CDP Supply Chain's category weighting**
for the environmental sub-score. Tier discounting (Tier 2/3 suppliers weighted down relative to
Tier 1) mirrors PCAF's data-quality-score discount logic — indirect visibility justifies a lower
confidence weight, not exclusion.

### 8.3 Mathematical specification

```
SubScore_E,S,G(supplier) = Σ_k  w_k · indicator_k                (k = GRI 308/414 indicator, 0–100 each)
ESG_supplier = 0.4·E + 0.35·S + 0.25·G

TierDiscount(t) = { 1.00  Tier 1 ;  0.85  Tier 2 ;  0.65  Tier 3 }   (visibility-confidence discount)

SpendWeight(s) = annualSpend_s / Σ_all annualSpend                  (normalised to portfolio)

SCES = Σ_s  ESG_supplier(s) × SpendWeight(s) × TierDiscount(tier_s)   ∈ [0,100]

RiskScore(s) = clip(0,100, 100 − ESG_supplier(s)) 
             + λ_defo·max(0, deforestRisk_s−50) 
             + λ_min·max(0, mineralExposure_s−50)          (additive penalty overlay, not OR-flag)
HighRisk(s)  = RiskScore(s) > P80(RiskScore)                 (relative, percentile-based, not fixed cut)
```

| Parameter | Value | Calibration source |
|---|---|---|
| E/S/G blend weights | 0.40/0.35/0.25 | GRI 308 (env) + 414 (social) relative indicator counts; governance residual — align to CDP Supply Chain module weighting on adoption |
| Tier discount | 1.00/0.85/0.65 | Modelled on PCAF data-quality score discount steps (PCAF Global GHG Standard, Table 3) |
| λ_defo, λ_min | 0.5, 0.5 | Illustrative; calibrate via regression of realised supply disruptions vs. exposure once loss history exists |
| HighRisk percentile | P80 | Standard top-quintile flagging convention; avoids the OR-threshold's ~25%+ false-positive rate on independent fields |

### 8.4 Data requirements

- Supplier GRI 308/414 indicator responses (CDP Supply Chain questionnaire — free tier available for
  disclosing suppliers) or third-party ESG ratings (EcoVadis, Sustainalytics — vendor).
- Verified annual spend by supplier (existing `annualSpendM` field — currently synthetic, needs ERP
  procurement feed).
- Tier assignment from supplier master data (existing `tier` field).
- Deforestation/mineral exposure from EUDR geolocation data and RMI conformant smelter lists (both
  free, authoritative) — would replace the current random `deforestRisk`/`mineralExposure` draws.

### 8.5 Validation & benchmarking plan

Backtest `HighRisk` flags against realised 12-month supplier disruption/controversy events (precision/
recall); sensitivity-test SCES to ±10pp shifts in tier discount and E/S/G weights; reconcile aggregate
SCES trend against EcoVadis portfolio benchmark scores for overlapping suppliers as an external
validation anchor.

### 8.6 Limitations & model risk

Linear weighting cannot capture threshold effects (e.g. a single forced-labour finding should
dominate regardless of spend weight) — a production system should overlay hard exclusion rules for
sanctions/modern-slavery hits ahead of the continuous score. Spend-weighting can mask small-spend,
high-impact suppliers (e.g. sole-source rare-earth suppliers); pair SCES with the separate
single-source/concentration register (§7.5) rather than relying on SCES alone for prioritisation.
