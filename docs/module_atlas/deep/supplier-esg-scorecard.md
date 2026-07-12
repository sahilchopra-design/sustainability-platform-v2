## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula is `SupplierESG = w_E×Environmental +
> w_S×Social + w_G×Governance`, with `Environmental = Climate×0.5 + Water×0.25 + Biodiversity×0.25`
> — a two-level weighted hierarchy mirroring EcoVadis's 4-theme methodology. **The code implements
> neither level.** `esgTotal = (eScore + sScore + gScore) / 3` is a flat, equal-weighted average of
> three top-level scores; there is no Climate/Water/Biodiversity sub-decomposition of the
> Environmental score anywhere in the file.

### 7.1 What the module computes

90 synthetic suppliers (`SUPPLIERS`), each independently seeded:

```
eScore = 20 + sr(i×11+4)×60        // 20–80
sScore = 20 + sr(i×13+5)×60        // 20–80
gScore = 20 + sr(i×17+6)×60        // 20–80
esgTotal = (eScore + sScore + gScore) / 3     // simple 1/3-1/3-1/3 average, NOT weighted
redFlags = up to 4 flags sampled (with de-duplication) from 7 real risk categories
           (No ESG Policy, Labour Violations, Deforestation Link, Greenwashing Risk,
            Conflict Minerals, Water Stress, Corruption Risk)
engagementStage = one of 6 real stages (Not Engaged → Initial Contact → Assessment Sent →
                   Data Received → Improvement Plan → Verified)
```

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| E/S/G scores | 20–80 | Synthetic, independent draws — no cross-dimension correlation |
| `esgTotal` weights | 1/3, 1/3, 1/3 | Contradicts the guide's `w_E/w_S/w_G` weighted scheme (EcoVadis-style weights typically favour Environmental and Social over Governance) |
| `RED_FLAGS` (7 categories) | Real CS3D/EcoVadis-relevant risk categories | Randomly assigned, 0–4 per supplier, not derived from the E/S/G scores (a supplier can show high `gScore` yet still carry "Corruption Risk") |
| `ENGAGEMENT_STAGES` (6 stages) | Real, sensible funnel | Randomly assigned per supplier, not tied to score or red-flag count |

### 7.3 Calculation walkthrough

1. **Supplier generation** — 90 suppliers as above, each with a `sector` (7 real sectors: Automotive,
   Electronics, Food & Bev, Apparel, Pharma, Chemicals, Logistics) and `spendMn`.
2. **`suppliersWithTotal`** — adds `esgTotal` and `redFlagCount` per supplier.
3. **Portfolio KPIs** — `avgESG` (mean `esgTotal`), `avgE`/`avgS`/`avgG` (mean per dimension),
   `redFlagTotal` (Σ `redFlagCount`), `highRiskCount` (`esgTotal<40`).
4. **Sector benchmarks** — per-sector `avgE`/`avgS`/`avgG`, `redFlagSups` count — all guarded with
   `sups.length ? … : 0`.
5. **Flag breakdown** — for each of the 7 `RED_FLAGS`, `count` (suppliers carrying it) and `spend`
   ($ exposure at suppliers carrying it) — a genuinely useful spend-at-risk view even though the
   underlying flag assignment is random.
6. **Engagement summary** — per-stage supplier counts across the 6-stage funnel.

### 7.4 Worked example

Supplier `i=0`: `eScore=round(20+sr(4)×60,1)`, `sScore=round(20+sr(5)×60,1)`,
`gScore=round(20+sr(6)×60,1)`. Using `sr(s)=frac(sin(s+1)×10⁴)`:

```
sr(4)=frac(sin(5)×10⁴)=frac(-9589.24)=0.7563  → eScore=20+0.7563×60=65.4
sr(5)=frac(sin(6)×10⁴)=frac(-2794.15)=0.8551  → sScore=20+0.8551×60=71.3
sr(6)=frac(sin(7)×10⁴)=frac(6569.87)=0.8657   → gScore=20+0.8657×60=71.9
esgTotal = (65.4+71.3+71.9)/3 = 69.5
```

Under the guide's own EcoVadis-style weighting (if, say, `w_E=0.35, w_S=0.35, w_G=0.30`, a common
real EcoVadis-adjacent split), this same supplier would score
`0.35×65.4+0.35×71.3+0.30×71.9 = 68.9` — close but not identical to the unweighted 69.5, illustrating
that the weighting choice does matter (more so for suppliers whose dimension scores diverge further
than this example's fairly clustered 65–72 range).

### 7.5 Companion analytics

- **Sector benchmark table** — average E/S/G and red-flag prevalence by sector — genuinely
  aggregated from supplier-level synthetic data.
- **CS3D coverage framing** — the guide's dataPoints (30% assessment coverage, 50% CDP response rate,
  12% cost reduction from high-ESG suppliers) are real 2023 industry statistics cited for context,
  not reproduced or validated by the synthetic 90-supplier dataset.

### 7.6 Data provenance & limitations

- 100% synthetic supplier data; no EcoVadis or CDP Supply Chain ratings are ingested.
- `esgTotal`'s equal-weighting (vs. the guide's stated hierarchical weighted formula) means sector
  and portfolio rankings in this module may differ materially from what an EcoVadis-methodology-
  faithful implementation would produce.
- Red flags and engagement stage are independent of the E/S/G scores — a supplier can simultaneously
  show a top-quartile `gScore` and a "Corruption Risk" flag, which a real due-diligence-linked model
  would treat as contradictory signals requiring reconciliation.

**Framework alignment:** EcoVadis Sustainability Rating Methodology (4-theme structure named in
guide, only a flattened 3-dimension equal-weighted average implemented) · CDP Supply Chain
Questionnaire (named, not ingested) · CS3D Annex adverse-impact criteria (the 7 `RED_FLAGS`
categories are a reasonable proxy set for CS3D-relevant risks, randomly assigned rather than
assessed) · GRI 2 supply-chain disclosure (conceptual only).
