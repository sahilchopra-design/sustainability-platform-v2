## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes **Inventory Carbon Intensity Benchmarking**
> `CI_relative = (CI_holding − CI_benchmark)/CI_benchmark·100` against SBTi-FLAG / IEA sector pathways, for
> corporate treasury inventory holdings. **The page does not benchmark inventory against SBTi/IEA pathways.**
> It is a **supply-chain ESG/carbon traceability explorer**: for each commodity's multi-stage supply chain it
> aggregates country-level ESG risk, carbon intensity, water intensity, worker counts and country
> concentration (HHI) from a curated `SUPPLY_CHAINS` structure. There is no CI_relative, no benchmark
> pathway, and no inventory tonnage. The computations it *does* run (means, HHI, waterfall) operate on stored
> reference data, not seeded random numbers. §8 specifies the benchmarking model the guide names.

### 7.1 What the module computes

Over a commodity's supply-chain stages (each with a `countries` array carrying `esg_risk`,
`carbon_intensity_kg_per_t`, `share_pct`, `workers_est`):
```js
totalCountries = unique(iso2|name) across stages
avgESG(dim)  = round( Σ_countries esg_risk[dim] / count )        // env / social / governance
avgCarbon    = round( Σ carbon_intensity_kg_per_t / count )
hhi          = Σ (share_pct)²                                    // country-concentration (Herfindahl)
composite    = round( (Environmental + Social + (100 − Governance)) / 3 )   // ESG heat composite
reduction    = round( (1 − best_practice/cradle_to_gate_kg) · 100 )        // decarb potential
margin       = round( (avgPrice − prevAvgPrice)/prevAvgPrice · 100 )       // stage value-add
```
Carbon is accumulated across stages as a waterfall (`cum += stage avg`). Water intensity maps qualitative
labels ("Very High (10,000L/kg)", "High (irrigated)") to numeric scores.

### 7.2 Parameterisation / scoring rubric

| Quantity | Source | Provenance |
|---|---|---|
| `SUPPLY_CHAINS` / `COUNTRY_SC_DATABASE` (stages, countries, esg_risk, carbon, share_pct, workers) | dataset | curated real-flavoured reference data |
| `SC_REGULATIONS` (11: effective, enforcement, penalty, compliance_cost) | seed schema | curated (CSDDD/UFLPA/EUDR/LkSG…) |
| `SC_MATURITY` (17: traceability, certification, digitization, resilience) | seed schema | curated maturity scores |
| `CARBON_FOOTPRINT_COMPARISON` (16: cradle_to_gate, gate_to_grave, best_practice) | seed schema | curated LCA figures |
| `composite` ESG formula | `(Env + Soc + (100−Gov))/3` | heuristic (governance inverted) |
| Water label→score map | fixed dictionary | heuristic mapping |
| `confidence` | `clamp(40,95, 50 + count·3)` | heuristic (more data → higher) |

Note: governance is inverted in `composite` (`100 − Governance`), implying the stored governance field is a
*quality* score where higher = better, unlike env/social where higher = worse risk.

### 7.3 Calculation walkthrough

Select commodity → its supply-chain stages loaded → per-stage country arrays aggregated into `avgESG`,
`avgCarbon`, `totalWorkers`, `childLaborStages` (count of countries flagged) → `concentrationData` finds the
top country and its share per stage → `esgHeatmap` builds per-stage env/social averages → `carbonWaterfall`
accumulates stage carbon → `waterData` scores water intensity → `hhi` measures country concentration →
`priceStages`/`margin` trace value-add across stages → portfolio tab links holdings to exposed commodities.
JSON/CSV export of the full chain.

### 7.4 Worked example

A stage sourced from three countries with `share_pct = [55, 30, 15]`:
```
HHI = 55² + 30² + 15² = 3025 + 900 + 225 = 4150   (highly concentrated; >2500 = concentrated)
```
Carbon comparison for a commodity with `cradle_to_gate_kg = 8.0`, `best_practice = 5.0`:
```
reduction = round((1 − 5.0/8.0)·100) = round(37.5) = 38%   (decarbonisation potential via best tech)
```
ESG composite for a stage with `Environmental = 70`, `Social = 60`, `Governance = 80` (quality):
```
composite = round((70 + 60 + (100 − 80))/3) = round(150/3) = 50
```

### 7.5 Data provenance & limitations

- The supply-chain structure is **curated reference data** (country ESG risk, carbon intensity, worker
  estimates, shares) — richer and more real than most platform modules; the `seed()` PRNG is defined but
  barely used (a few fallback values). HHI, ESG means, carbon waterfall and margins are **real computations**
  on that stored data.
- The guide's inventory-CI-benchmarking (CI_relative vs SBTi-FLAG/IEA pathway) is **not implemented** — there
  is no inventory tonnage, no benchmark pathway, no relative-intensity score.
- Water-intensity mapping is a hand-coded label dictionary, not a WFN water-footprint calculation; the
  governance-inversion convention in `composite` should be documented for consistency.

**Framework alignment:** GHG Protocol Scope 3 Category 1 (carbon-intensity basis the module aggregates) ·
SBTi FLAG / IEA sector benchmarks (the guide's intended benchmark, not wired) · ISO 14064 (GHG quantification)
· supply-chain due-diligence regimes in `SC_REGULATIONS` (EU CSDDD, UFLPA, EUDR, German LkSG). Herfindahl HHI
is the standard concentration measure.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Benchmark physical inventory carbon intensity against science-based sector pathways
(the guide's stated purpose) and flag high-carbon holdings for procurement decarbonisation and CSRD/ISSB
Scope-3-Cat-1 reporting.

**8.2 Conceptual approach.** Supplier-specific emission factors where available, ecoinvent/regional fallback
otherwise, benchmarked against SBTi-FLAG (agri) and IEA (energy/metals) sector pathways — the standard
inventory-footprint + benchmark approach (PCAF-style DQ hierarchy applied to physical stocks).

**8.3 Mathematical specification.**
```
CI_holding = Σ_supplier volumeShare_s · EF_s   (EF supplier-specific → regional → global, PCAF DQ scored)
CI_benchmark = SBTi-FLAG or IEA sector pathway value at reporting year
CI_relative = (CI_holding − CI_benchmark)/CI_benchmark · 100
InventoryGHG = Σ_holding volume_t · CI_holding_t    (absolute Scope 3 Cat 1, ktCO₂e)
HighRiskShare = Σ_holding[ CI_holding > CI_benchmark + σ ] volume / Σ volume
```

| Parameter | Source |
|---|---|
| Emission factors EF | supplier data → ecoinvent 3.10 → IEA/DEFRA regional |
| DQ score | PCAF data-quality hierarchy (1–5) |
| Benchmark pathway | SBTi-FLAG (agri), IEA sector (energy/metals) |
| Standard deviation σ | cross-supplier EF dispersion |

**8.4 Data requirements.** Inventory volumes by commodity+supplier; EFs; SBTi/IEA benchmarks. Free: DEFRA
EFs, IEA summaries; vendor: ecoinvent, supplier primary data. Platform: supply-chain carbon data already in
this module's `SUPPLY_CHAINS`.

**8.5 Validation & benchmarking.** Reconcile CI_holding vs GHG-Protocol 0.8–3.2 tCO₂e/t range; DQ coverage
audit; CI_relative vs SBTi pathway; sensitivity to EF fallback tier.

**8.6 Limitations & model risk.** Supplier EF coverage typically 60–85%; benchmark-pathway country gaps;
allocation across co-products. Fallback: regional average EF with PCAF DQ=5 flag when supplier data is
missing.
