## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula is `S3_cat_i = ActivityData_i ×
> EmissionFactor_i; S3_total = Σ S3_cat_i (i=1..15); WACI_S3 = Σ[Revenue_weight_j × S3intensity_j]`
> — a 15-category GHG Protocol Scope 3 build-up with a revenue-weighted intensity aggregate. **None
> of this exists in the code.** There is no activity-data × emission-factor calculation, no 15-
> category breakdown (the `CATEGORIES` list here — Raw Materials, Manufacturing, Logistics,
> Packaging, Energy, Services, Agriculture, Chemicals — is a business-function taxonomy, not the
> GHG Protocol's numbered Scope 3 Categories 1–15), and no WACI aggregate. `scope1`, `scope2`, and
> `scope3Upstream` are independent `sr()` draws per supplier with no formula connecting them.

### 7.1 What the module computes

80 synthetic suppliers (`SUPPLIERS`), each independently seeded:

```
tier            = floor(sr(i×3)×6) + 1                        // Tier 1–6
category        = CATEGORIES[floor(sr(i×7+2)×8)]                // 8 business-function categories
sector          = SECTORS[floor(sr(i×11+1)×8)]
region          = REGIONS[floor(sr(i×5+4)×6)]
scope1          = round(sr(i×13+2)×5000 + 200)                  // 200–5,200 tCO2e
scope2          = round(sr(i×17+3)×3000 + 100)                  // 100–3,100 tCO2e
scope3Upstream  = round(sr(i×19+5)×15000 + 500)                 // 500–15,500 tCO2e
spendMn         = sr(i×23+6)×50 + 2                              // $2–52M
dataQuality     = sr(i×29+7)×4 + 1                                // PCAF DQ score 1.0–5.0
pathway         = PATHWAYS[floor(sr(i×31+8)×5)]                  // Science-Based | Net Zero 2040/2050 | Carbon Neutral | BAU
sbtiCommitted   = sr(i×37+9) > 0.5                                // ~50% true
reductionTarget = round(sr(i×41+10)×50 + 10)                     // 10–60%
engagementScore = round(sr(i×43+11)×100)                          // 0–100
```

No field is derived from another — `scope3Upstream` bears no relationship to `spendMn`, `sector`,
or `category`, so the implied emission intensity ($/tCO₂e) is effectively random per supplier rather
than driven by a sector-specific emission factor as the guide's formula would require.

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `scope3Upstream` | 500–15,500 tCO₂e | Synthetic, independent of spend/sector |
| `dataQuality` | 1.0–5.0 | Labelled "PCAF DQ" scale — the real PCAF 1–5 scoring convention (1=best/primary data, 5=worst/proxy) is correctly reproduced as a *range*, but the value is a random draw, not derived from any actual data-source hierarchy |
| `PATHWAYS` distribution | 5 categories, uniform via `sr()` | Real named pathway categories, uniformly randomly assigned rather than reflecting any actual supplier commitment data |
| `scenarioReductions` (4 fixed scenarios) | 1.5°C SBTi: 42% reduction/$38 cost/2030; Net Zero 2050: 65%/$55/2050 | Fixed reference constants, plausible relative ordering (deeper reduction targets cost more and take longer), not computed from `SUPPLIERS` |

### 7.3 Calculation walkthrough

1. **Supplier generation** — 80 suppliers as above.
2. **Portfolio aggregates** — `totalScope3 = Σ scope3Upstream`, `totalScope1 = Σ scope1`,
   `totalSpend = Σ spendMn`, `sbtiCount = count(sbtiCommitted)`, `avgDQ = mean(dataQuality)`.
3. **Tier breakdown** — for each of the 6 tiers, `count`, `emissions = Σ scope3Upstream`,
   `pct = emissions/totalScope3×100` — genuinely computed aggregation over the synthetic table.
4. **Category breakdown** — same pattern, by the 8 business-function categories, sorted descending
   by emissions (a real "hotspot ranking" mechanic, applied to synthetic inputs).
5. **Pathway breakdown** — per pathway, `count`, `emissions`, `avgTarget = mean(reductionTarget)`.
6. **Top-10 hotspots** — `[...SUPPLIERS].sort(desc by scope3Upstream).slice(0,10)`.
7. **Reduction Scenarios tab** — displays the 4 fixed `scenarioReductions` constants, not derived
   from the supplier-level data.

### 7.4 Worked example — Supplier A1 (index 0)

```
tier = floor(sr(0)×6)+1 = floor(0.7147×6)+1 = 4+1 = 5     ("Tier 5")
category = CATEGORIES[floor(sr(2)×8)] = "Manufacturing"
scope1 = round(sr(15)×5000+200) = 1,200 tCO2e
scope2 = round(sr(16)×3000+100) = 3,025 tCO2e
scope3Upstream = round(sr(18)×15000+500) = 13,175 tCO2e
spendMn = round(sr(19)×50+2,1) = $45.3M
dataQuality = round(sr(20)×4+1,1) = 3.3 (PCAF scale)

implied intensity = scope3Upstream / spendMn = 13,175/45.3 ≈ 291 tCO2e/$M
```

This 291 tCO₂e/$M figure has no connection to Supplier A1's `category` ("Manufacturing") or `sector`
— a real EEIO/activity-based model would derive intensity from the sector's actual emission factor,
not an independent random draw that happens to divide out to this number.

### 7.5 Companion analytics

- **Data Quality tab** — presumably a histogram of `dataQuality` scores across the 1–5 PCAF-style
  scale (the real PCAF convention — 1=best — is correctly reproduced structurally).
- **Engagement Tracker tab** — `engagementScore` per supplier, independent of tier/category/pathway.
- **Export tab** — full 80-supplier synthetic dataset export.

### 7.6 Data provenance & limitations

- 100% synthetic dataset; no EXIOBASE/MRIO emission factors, CDP supplier submissions, or SBTi
  validated-target registry data are ingested despite all three being named in the guide.
- No 15-category GHG Protocol Scope 3 breakdown exists — the module's own "category" taxonomy is a
  simplified 8-item business-function list, materially coarser than the real standard.
- No WACI (weighted-average carbon intensity) aggregate is computed despite being named as the
  guide's headline output metric.
- `sbtiCommitted` (boolean, ~50% true) is independent of `pathway` — a supplier can show
  `pathway='Business As Usual'` and `sbtiCommitted=true` simultaneously, an internally inconsistent
  combination a real SBTi-linked dataset would not produce.

**Framework alignment:** GHG Protocol Corporate Value Chain (Scope 3) Standard (15-category structure
named in guide, not implemented — 8-category business-function simplification used instead) · PCAF
Standard Part A Data Quality 1–5 scale (real scale range correctly reproduced, values randomly
assigned) · SBTi Corporate Manual (real target-setting concepts referenced, not computed from actual
supplier submission data) · EXIOBASE/MRIO (named as the intended emission-factor source, not
ingested).
