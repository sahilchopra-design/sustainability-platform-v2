## 7 · Methodology Deep Dive

### 7.1 What the module computes

Unlike most modules in this family, `RecycledContentMarketsPage.jsx` is predominantly a **curated
reference-data display** — 10 materials, 20 brand buyers, 6 certification schemes, and a 36-month
price history are hard-coded arrays of researched-looking figures (not seeded-random), with only a
thin layer of derived arithmetic on top:

```js
gap              = buyer.rcTarget2025 - buyer.rcAchieved2024
avgRecycleRate   = mean(MATERIALS[*].recycleRate)
totalDemand2024  = Σ MATERIALS[*].demand2024
demand2027       = demand2024 × 1.4                    // straight-line interpolation guess
RC_Premium_Cost  = (recycledPrice − virginPrice) × RCVolume     [guide formula; not computed in code — no RCVolume field exists]
```

The guide's formula set (`RC_Premium_Cost`, `Demand_Gap`, `GHG_Saving`) describes per-transaction
cost/saving calculations that would require a volume input; the code implements only the simpler
`gap` (target − achieved, percentage points) and portfolio-level averages/sums — the multiplicative
cost/GHG formulas are not executed anywhere in the file.

### 7.2 Parameterisation — the 10-material dataset

| Material | Virgin $/t | Recycled $/t | Premium* | Recycle rate | CO₂ saving (t/t) |
|---|---|---|---|---|---|
| rPET (food-grade) | 1,080 | 940 | −13% | 58% | 1.8 |
| rHDPE | 1,140 | 920 | −19% | 34% | 1.6 |
| Recycled Aluminium | 2,650 | 1,980 | −25% | 76% | **8.4** |
| Recycled Steel (EAF) | 720 | 580 | −19% | 85% | 1.4 |
| rPP | 1,020 | 850 | −17% | 22% | 1.5 |
| Recycled Glass (cullet) | 180 | 95 | **−47%** | 75% | 0.3 |
| Recycled Paper/Cardboard | 680 | 520 | −24% | 72% | 0.8 |
| rPVC | 980 | 720 | −27% | 18% | 1.4 |
| Recycled Copper | 9,800 | 8,200 | −16% | 43% | 3.2 |
| Bio-based PLA | 2,100 | 1,650 | −21% | 12% | 2.1 |

\*Premium is a hard-coded field, not recomputed from the two price columns in every row (spot
check: rPET `(940−1080)/1080 = −13.0%` ✓ consistent; the field is pre-baked, not derived live).

**Provenance**: guide cites ICIS Recycled Plastics Price Report 2024, International Aluminium
Institute 2023, and Textile Exchange GRS Tracker 2024 as sources for the headline figures (rPET
−13% discount, rAl 8.4 tCO₂e/t saving, 5,800+ GRS chains) — these three numbers do match the
dataset (`rPET.premium=-13`, `rAl.co2Saving=8.4`, `CERTIFICATIONS[0].chains='5,800+'`), i.e. the
curated constants are internally consistent with the cited sources, though full source-to-value
traceability for every row cannot be independently verified from the code alone.

### 7.3 Calculation walkthrough

1. **Material table**: sortable by any numeric field (`sortField`); no aggregation beyond simple
   mean/sum for the two KPI cards (`avgRecycleRate`, `totalDemand2024`).
2. **Price history** (`PRICE_SERIES`, 36 months): `basePrice + sr(i×k)×noiseRange + i×drift` — a
   synthetic random-walk-with-drift series for rPET/rHDPE/rAl, layered on top of the (otherwise
   curated) material table; this is the one seeded-random series in the file.
3. **Brand buyer demand** (`BUYERS`, 20 named FMCG companies): `rcTarget2025`, `rcAchieved2024`,
   `annualVolumet`, `premiumPaid`, `certRequired` are all seeded-random (`sr(i×k)`), not real
   corporate disclosures, despite using real company names (Unilever, Nestlé, P&G, etc.) as
   labels. `gap = rcTarget2025 − rcAchieved2024` is the only derived field.
4. **Certifications table**: 6 static rows (GRS, ISCC+, RecyClass, APR Design Guide, SCS, C2C) —
   purely descriptive, no calculation.
5. **Demand forecast**: `demand2027 = demand2024 × 1.4` for the first 6 materials — a flat 40%
   growth assumption applied uniformly regardless of material-specific growth drivers (contrast
   with `demand2030`, which is a distinct hard-coded figure per material implying materially
   different CAGRs by material — e.g. rPET 12.4→22.8 (2024→2030, ~10.7%/yr) vs rSteel 680→820
   (~3.2%/yr) — so the `×1.4` interpolation for 2027 is not consistent with each material's own
   2024→2030 trajectory).
6. **Radar** (`RADAR_DATA`): 6 static dimensions (Collection Rate, Quality Premium, Demand Growth,
   Regulatory Drive, Tech Readiness, GHG Abatement) scored 0–100 for 4 materials — hand-curated,
   not computed from the material table's own fields (e.g. "GHG Abatement" for rAl is 98, roughly
   consistent with its 8.4 t/t saving being the highest in the table, but the mapping is implicit).

### 7.4 Worked example

Buyer `i=0` (Unilever), `rcTarget2025 = round(sr(17)×35+15)`, `rcAchieved2024 =
round(sr(11)×28+8)`:

| Field | Formula | Illustrative result |
|---|---|---|
| `rcTarget2025` | `sr(17)≈0.66` → `round(0.66×35+15)` | **38%** |
| `rcAchieved2024` | `sr(11)≈0.66` → `round(0.66×28+8)` | **26%** |
| `gap` | `38−26` | **12 pts** shortfall vs 2025 target |
| Material cost signal (rPET, guide formula) | `(940−1080) × RCVolume` — no `RCVolume` field exists for this buyer, so this cannot be computed from the current schema | n/a — guide formula not executable as specified |

### 7.5 Certification recognition rubric

| Scheme | Scope | Chain-of-custody type |
|---|---|---|
| GRS | All materials, ≥20% recycled | Chain-of-custody |
| ISCC+ | Plastic + chemical recycling | Mass balance |
| RecyClass | Packaging recyclability | Design for recycling |
| APR Design Guide | US plastic packaging | Design guidance |
| SCS Recycled Content | All materials | Product certification |
| Cradle to Cradle | Multi-material | Material health + circular |

### 7.6 Companion analytics

Market Overview (KPI band + material table), Material Pricing (36-month price history line chart),
Brand Buyer Demand (20-buyer sortable table + gap analysis), Certifications (6-scheme reference
table), Demand Forecast (2024→2027→2030 bar), Investment Thesis (narrative text tab).

### 7.7 Data provenance & limitations

- **Material, buyer-target-range, and certification tables are curated constants**, not derived
  from a live data feed — genuinely closer to "real" reference data than most sibling modules
  (three headline figures verifiably match the cited sources), but not independently re-derivable
  or auditable from the code alone since the raw source documents are not embedded.
- **Buyer-level RC achievement/target/volume figures are synthetic** (`sr()`-seeded), despite
  being attributed to 20 real, named companies — these numbers do not represent actual disclosed
  Unilever/Nestlé/etc. recycled-content performance and should not be cited as such.
- 2027 demand interpolation (`×1.4` flat factor) is inconsistent with each material's own
  2024→2030 hard-coded growth path.
- No `RCVolume` field exists anywhere, so the guide's own `RC_Premium_Cost` and `GHG_Saving`
  formulas cannot be executed by this module as written — they would need a per-buyer or
  per-material volume input added to the schema.

**Framework alignment:** EU Packaging and Packaging Waste Regulation (PPWR) 2024 — referenced for
context (30% RC mandate by 2030) but not used to compute compliance gap against any buyer's actual
target trajectory · UK Plastic Packaging Tax 2022 — referenced, not computed · GRS v4.0 / ISCC+ /
RecyClass / APR / SCS / C2C — represented as a descriptive certification-scope table, not wired
into any buyer's certification-compliance calculation.
