## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a **Just Transition Score**
> (`JTS = w_r·Rights + w_e·Equity + w_c·Community + w_g·Governance`) built on UNDRIP/ILO/LSE-Grantham
> justice dimensions, FPIC documentation scores, gender-equity indices and benefit-sharing rates.
> **That four-pillar JTS does not exist in the code.** What the module actually implements is an
> **Equitable Earth carbon-credit quality & issuance engine**: a 5-pillar weighted quality score
> (Ecological / Community / Additionality / Permanence / MRV) feeding a full credit-issuance waterfall
> (gross → leakage → buffer → uncertainty → quality-adjusted → co-benefit). "Community Outcomes" and
> FPIC survive as *one* of the five pillars, which is likely the source of the guide confusion. The
> issuance maths is genuine and grounded in VCS/AFOLU accounting; only the demo *inputs* are seeded.

### 7.1 What the module computes

**(a) Pillar quality score** (`calcPillarScores`): each of 5 pillars aggregates 5 sub-indicators by
fixed sub-weights, then pillars roll up by pillar weight:

```js
scores[p] = clamp(Σ_i inputs[key_i] × subWeight_i, 0, 100)
overall   = Σ_p scores[p] × weight_p          // weights sum to 1.00
tier      = overall≥85 Gold · ≥70 Silver · ≥55 Bronze · else Ineligible
```

**(b) Credit issuance waterfall** (`calcCredits`) — the real accounting core:

```js
netRate  = max(0, baselineRate − projectRate)        // no phantom credits if project > baseline
grossAnnual = netRate × area                          // tCO₂e/yr
grossTotal  = grossAnnual × creditingPeriod
afterLeakage= grossTotal × (1 − leakagePct/100)
afterBuffer = afterLeakage × (1 − bufferPct/100)
netCredits  = max(0, afterBuffer × (1 − uncertaintyPct/100))
qualityMultiplier = pillarResult.overall / 100        // couples quality → issuance
adjustedCredits   = round(netCredits × qualityMultiplier)
cobCredits        = round(adjustedCredits × cobenefitMult)
```

The `max(0, …)` guards are deliberate (inline comment: *"projects exceeding baseline yield 0 credits,
not phantom positive credits"*) — a correct additionality safeguard.

### 7.2 Parameterisation / scoring rubric

**Pillar weights** (sum = 1.00):

| Pillar | Weight | Sub-weights |
|---|---|---|
| Ecological Preservation (EP) | 0.28 | 0.30/0.25/0.20/0.15/0.10 |
| Community Outcomes (CO) | 0.24 | 0.30/0.25/0.20/0.15/0.10 (FPIC 0.30) |
| Additionality & Causality (AC) | 0.22 | 0.30/0.25/0.20/0.15/0.10 |
| Permanence & Risk Buffer (PM) | 0.16 | 0.25/0.25/0.20/0.15/0.15 |
| MRV & Data Quality (MV) | 0.10 | 0.30/0.25/0.20/0.15/0.10 |

**Standard-specific accounting parameters** (6 EE methodologies — real AFOLU archetypes):

| Standard | baseline / project rate (tCO₂e/ha/yr) | leakage | buffer | uncertainty | co-benefit × |
|---|---|---|---|---|---|
| EE Native Forests (REDD+) | 18.5 / 2.1 | 10% | 15% | 8% | 1.12 |
| EE Agroforestry/Reforestation (A/R) | 3.2 / −8.5 | 8% | 20% | 12% | 1.08 |
| EE Blue Carbon – Seagrass | 6.8 / 0.4 | 5% | 25% | 18% | 1.15 |
| EE Peatland Mosaic | 55.0 / 5.2 | 12% | 18% | 10% | 1.10 |
| EE Soil Carbon – Grasslands | 1.2 / −2.8 | 6% | 22% | 20% | 1.05 |
| EE Mangrove Complex | 22.4 / 1.8 | 7% | 20% | 14% | 1.13 |

Provenance: baseline/project rates and buffer/uncertainty defaults are curated per-methodology
(REDD+ high baseline, peatland very high, soil carbon low), consistent with VCS/AFOLU literature; the
`baseline_method` fields cite real methodologies (VCS JNR, VM0033, IPCC Tier 3). Negative project
rates (A/R, soil) correctly encode net *sequestration* → higher net credit rate. Buffer % is a
non-permanence pool (VCS AFOLU practice); uncertainty % a deduction (per VCS uncertainty rules).

### 7.3 Calculation walkthrough

1. User sets 25 pillar sub-indicator sliders (default 70) → `calcPillarScores` → `overall`, `tier`.
2. User selects a methodology → loads its default `area`, `creditingPeriod`, baseline/project rates,
   leakage/buffer/uncertainty and co-benefit multiplier into `calcParams`.
3. `calcCredits` runs the waterfall; `qualityMultiplier = overall/100` scales net credits by the
   pillar-quality score, tightly coupling the two engines.
4. A waterfall chart plots Gross → −Leakage → −Buffer → −Uncertainty → Net → quality → co-benefit.
5. A synthetic project book (`base = std.score + (sr(i*13)−0.5)×20`) demonstrates the score
   distribution across ~N sample projects.

### 7.4 Worked example — Native Forests, 50,000 ha, pillar score 78

Inputs: EE Native Forests defaults (baseline 18.5, project 2.1, leakage 10%, buffer 15%,
uncertainty 8%, co-benefit 1.12), area 50,000 ha, crediting period 30 yr, pillar `overall = 78`.

| Step | Computation | Result |
|---|---|---|
| netRate | max(0, 18.5 − 2.1) | 16.4 tCO₂e/ha/yr |
| grossAnnual | 16.4 × 50,000 | 820,000 tCO₂e/yr |
| grossTotal | 820,000 × 30 | 24,600,000 |
| afterLeakage | ×(1−0.10) | 22,140,000 |
| afterBuffer | ×(1−0.15) | 18,819,000 |
| netCredits | ×(1−0.08) | 17,313,480 |
| qualityMultiplier | 78/100 | 0.78 |
| adjustedCredits | 17,313,480 × 0.78 | 13,504,514 |
| cobCredits | ×1.12 | **15,125,056 tCO₂e** |

Every step is deterministic; the pillar score directly shaves ~22% of net credits, which is the
module's design intent (low-quality projects issue fewer credits).

### 7.5 Data provenance & limitations

- **Accounting parameters are curated, not synthetic** — baseline/project rates, buffer/uncertainty
  defaults per methodology reflect real AFOLU archetypes. The only PRNG use is the *demo project book*
  `base = std.score + (sr(i*13)−0.5)×20` (`sr(s)=frac(sin(s+1)×10⁴)`), used purely to populate an
  illustrative score distribution.
- The `cobenefitMult` (1.05–1.15) inflates issuance for co-benefits — this is a design choice, not a
  VCS convention; real registries do *not* increase tonnage for co-benefits (they add labels/premia).
- Baseline is a flat rate × area × period; production REDD+ uses a *dynamic* baseline with
  activity-shifting leakage and jurisdictional nesting, which the module simplifies.
- `qualityMultiplier = overall/100` linearly discounts tonnage by quality — a defensible platform
  convention but not a registry-standard mechanic.

**Framework alignment:** the module operationalises core carbon-integrity concepts — **additionality**
(baseline vs project, financial/activity/barrier tests in `additionality` field), **leakage**
(deduction %), **permanence / non-permanence buffer pools** (VCS AFOLU buffer, `permanenceYrs`
15–50 yr), and **uncertainty deductions** (VCS uncertainty rules). Its 5-pillar quality score
mirrors the **ICVCM Core Carbon Principles** intent — ICVCM assesses ~10 CCPs (additionality,
permanence, robust quantification/MRV, no double counting, sustainable-development safeguards) at the
*program* and *methodology-category* level to award the CCP label; here EP/AC/PM/MV/CO pillars map
onto those same CCP themes, and FPIC/community reflects the **VCMI** claims-integrity and
safeguards dimension. Blue-carbon methodologies cite real standards (**VM0033** tidal wetland,
IPCC Tier 3 peat EFs).
