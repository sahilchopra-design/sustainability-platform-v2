## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry defines stranding as
> `Stranding_year = first t where intensity(t) > CRREM_pathway(t)` using CRREM v2 country ×
> property-type pathways, plus EU Taxonomy Article 7 screening and a portfolio map. **The code does
> not solve a pathway crossing.** Stranding year is assigned by a *ratio bucket rule* with random
> jitter (§7.3), the "CRREM pathways" are synthetic straight lines (not CRREM v2 data, no country
> dimension), there is no EU Taxonomy tab or map, and EPC ratings are drawn independently of energy
> intensity (an EPC-A building can carry worst-quartile intensity). The 4 real tabs are Building
> Portfolio / CRREM Pathway Analysis / Energy Efficiency / MEES & Regulation. The sections below
> document the code as it behaves.

### 7.1 What the module computes

For 150 synthetic European buildings (6 types × 15 cities), per building
(`BuildingEnergyPerformancePage.jsx:14-32`):

```js
intensity     = floor(baseIntensity[type] × (0.5 + s×0.8))      // 50–130% of type base
crremTarget   = floor(baseIntensity[type] × 0.35)               // fixed 65% cut vs base
strandingYear = intensity > 2×target ? 2026 + ⌊s2×4⌋            // 2026–2029
              : intensity > target   ? 2030 + ⌊s3×5⌋            // 2030–2034
              :                        2040 + ⌊s4×10⌋           // 2040–2049
annualEnergy  = floor(intensity × area / 1000)                  // MWh/yr
annualCost    = floor(annualEnergy × 0.15 × 1000)               // £ at £0.15/kWh
co2           = floor(annualEnergy × 0.21)                      // tCO₂e at 0.21 kg/kWh
meesCompliant = epcIdx ≤ 3                                      // EPC A–D
```

Portfolio KPIs (avg intensity, total CO₂, CRREM-aligned count = stranding ≥ 2040, value, MEES
non-compliant count), a per-building pathway chart, a retrofit ROI simulator, and a MEES
cost-of-compliance view.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Base intensity (kWh/m²/yr) | Office 180 · Retail 220 · Residential 120 · Industrial 280 · Logistics 150 · Mixed-Use 200 | Synthetic; plausible vs CIBSE/Better Buildings benchmarks, uncited |
| CRREM target ratio | 0.35 × base (e.g. Office 63) | Authorial; also hard-coded per type in the benchmark tab |
| Electricity price | £0.15/kWh | Synthetic demo value |
| Emission factor | 0.21 kgCO₂e/kWh | Consistent with UK grid electricity (DEFRA 2023 ≈ 0.207) but uncited in code |
| Capital value (£/m²) | Office 4,500 · Retail 3,200 · Resi 5,500 · Industrial 1,800 · Logistics 2,100 · Mixed 3,800 (±20%) | Synthetic demo value |
| Retrofit cost | £25–100/m² | Synthetic demo value |
| "1.5 °C pathway" | linear: base − k×(yr−2023), k = 5.2 (office) … 8.1 (industrial) | Synthetic linearisation — real CRREM curves are convex |
| "2 °C pathway" | shallower slopes (3.8 office … 5.9 industrial) | Synthetic |
| MEES timeline | 2025 min-E · 2027 min-C · 2030 min-B | Approximates UK MEES: EPC E already binding since April 2023; C-2027/B-2030 were consultation proposals |
| Autonomous decarb rate | `intensity × e^(−0.03×(yr−2023))`, −3%/yr | Authorial assumption |
| Retrofit uplift | trajectory × 0.65 (35% cut) | Authorial assumption |

`retrofitOptions` gives 10 technologies with seeded `costPerSqm` (£15–135), `energySaving`
(5–30 kWh/m²/yr), payback (1.5–9.5y) and per-type applicability — all synthetic.

### 7.3 Calculation walkthrough

1. **Portfolio tab** — filter by type/EPC/city/search, sortable table, EPC distribution and
   type-mix charts. Note EPC is an independent draw (`floor(s2×7)`), so EPC and intensity are
   uncorrelated — visible if you filter EPC A and sort by intensity.
2. **CRREM tab** — for the selected building, plots the synthetic 1.5 °C or 2 °C line vs a
   `current` trajectory (exponential −3%/yr decay of today's intensity) and a `withRetrofit`
   trajectory (65% of current). The chart *can* show a crossing, but the headline stranding year
   still comes from the §7.1 bucket rule, so chart and badge can disagree. A stranding timeline
   counts buildings with `strandingYear ≤ y` for 11 milestones (2025–2050); a what-if scenario
   recomputes `newInt = intensity × factor` and re-runs the bucket rule with shifted year bases
   (2026+/2032+/2045+).
3. **Energy Efficiency tab** — retrofit selector; year-by-year 20-year ROI:
   `annualSaving(£k) = Σ_selected energySaving × area × 0.15 / 1000`, one-off
   `cumCost = Σ costPerSqm × area`, `netBenefit = cumSaving − cumCost`.
4. **MEES tab** — pick 2025/2027/2030; affected = buildings with `epcIdx > indexOf(minEPC)`;
   compliance CapEx = Σ their `retrofitCost`.

### 7.4 Worked example

Office, area 10,000 m², draw s = 0.75: intensity = ⌊180×(0.5+0.6)⌋ = **198 kWh/m²/yr**; target =
⌊180×0.35⌋ = **63**. Ratio test: 198 > 126 (2×63) → stranding bucket 2026–2029; with s2 = 0.4 →
2026+⌊1.6⌋ = **2027**. Energy = ⌊198×10,000/1000⌋ = **1,980 MWh**; cost = 1,980×0.15×1000 =
**£297,000/yr**; CO₂ = ⌊1,980×0.21⌋ = **415 t**. Retrofit LED (say cost £40/m², saving
18 kWh/m²): annual saving = 18×10,000×0.15/1000 = **£27k/yr** vs £400k CapEx → simple payback
14.8y; ROI chart's `netBenefit` turns positive in year 15. If a what-if scenario applies factor
0.6: newInt = 118 < 126 but > 63 → re-bucketed to 2032–2037.

### 7.5 Data provenance & limitations

- **All 150 buildings are synthetic** (`sr(seed) = frac(sin(seed+1)×10⁴)`); the emission factor
  and MEES thresholds are the only near-real constants.
- **Unit conflation**: `intensity` is generated as an energy intensity (kWh/m²) but is compared
  against "CRREM" targets — real CRREM pathways are *carbon* intensities (kgCO₂e/m²) and separate
  energy-intensity pathways; the module never converts.
- Stranding is bucketed, not solved; alignment counts (`strandingYear ≥ 2040`) therefore reflect
  the ratio rule, not pathway maths. No country dimension despite 15 cities in 5 countries; the
  MEES rule (UK regulation) is applied to Paris/Frankfurt/Madrid assets too.
- Retrofit savings are additive with no interaction/diminishing returns and no discounting in ROI.

### 7.6 Framework alignment

- **CRREM v2** — publishes country × property-type decarbonisation pathways (GHG intensity and
  energy intensity) derived from a 1.5 °C/2 °C global carbon budget allocated to real estate via
  SDA; stranding = first year the asset's projected intensity exceeds its pathway. The module
  mimics the vocabulary with linear proxies and a bucket rule.
- **UK MEES (Energy Efficiency (Private Rented Property) Regulations 2015)** — EPC E minimum for
  continued commercial lettings since 1 Apr 2023; EPC C (2027) and B (2030) are consultation
  proposals, correctly labelled "Proposed" in the code's timeline.
- **EPBD recast (EU/2024/1275)** — minimum energy performance standards for non-residential stock;
  referenced by the guide but not implemented.
- **GRESB / EU Taxonomy Art. 7 (buildings)** — named in the guide only; no screening logic exists.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Quantify transition (stranding) risk and retrofit economics for a commercial real-estate equity/
debt portfolio, producing per-asset stranding years, CRREM gap, and CapEx-to-align — the inputs
lenders need for green-loan eligibility and CRREM-aligned disclosure.

### 8.2 Conceptual approach
Implement the **CRREM v2 methodology** directly (the industry standard adopted by GRESB, INREV,
PCAF real-estate guidance) with asset-level projection, benchmarked against (1) CRREM's own Excel
tool outputs and (2) MSCI Real Estate Climate VaR stranding logic (pathway-crossing with
market-value haircut).

### 8.3 Mathematical specification

```
CI_a(t) = [ E_elec,a(t) × EF_grid,c(t) + E_fuel,a(t) × EF_fuel ] / GFA_a       kgCO₂e/m²/yr
E_x,a(t) = E_x,a(t₀) × (1 − r_a)^(t−t₀) × w(t)                                 asset energy path
Stranding_a = min { t : CI_a(t) > P_type,c^scenario(t) }                        pathway crossing
Gap_a(t) = max(0, CI_a(t) − P(t));   Excess_a = Σ_t Gap_a(t) × GFA_a           cumulative excess
CapEx_align,a = min over retrofit bundles B { Cost(B) : CI_a^B(t) ≤ P(t) ∀ t ≤ 2050 }
```

| Parameter | Value / source |
|---|---|
| `P_type,c(t)` pathways | CRREM v2 global pathways (1.5 °C, 2 °C), country × 8 property types — free download |
| `EF_grid,c(t)` | national grid factors with forward decarbonisation, IEA WEO Stated Policies / Announced Pledges |
| `EF_fuel` | DEFRA 2024 / IPCC 2006 GL fuel factors |
| `r_a` autonomous efficiency | 0.5–1%/yr, CRREM default assumptions |
| `w(t)` weather normalisation | HDD/CDD projection per CRREM climate files |
| Retrofit bundle costs/savings | CRREM retrofit library; UK BEES survey; vendor cost curves (e.g. Arcadis) |
| Value-at-stranding haircut | `ΔV = D × Σ discounted carbon-excess cost`, carbon price from NGFS Phase IV net-zero path |

EPC linkage: map measured intensity to EPC bands per national methodology (SAP/SBEM for UK) rather
than independent draws; MEES exposure = assets below the statutory band per jurisdiction with
effective dates.

### 8.4 Data requirements
Per asset: GFA, type, country, metered electricity/fuel (or EPC-derived estimates with a PCAF-style
data-quality score 1–5), lease structure (landlord vs tenant energy), asset value. Sources: energy
audits/smart meters (client), national EPC registers (free: UK EPC open data), CRREM pathway files
(free), IEA grid factors (platform already ingests OWID/IEA energy data in `reference_data`).

### 8.5 Validation & benchmarking plan
Reconcile stranding years against the official CRREM tool for a 20-asset test set (target: exact
year match given identical inputs); sensitivity: ±10% intensity, ±1 EF revision, scenario switch —
stranding year shifts must be monotone; back-check CapEx-to-align vs realised retrofit projects;
annual pathway-version regression tests when CRREM updates.

### 8.6 Limitations & model risk
Pathway allocation (SDA) is convention, not physics — disclose scenario/version; grid-factor
forecasts dominate late-horizon results (report gross vs market-based Scope 2 variants); estimated
(non-metered) intensities carry ±30% error — propagate to a stranding-year range, not a point;
retrofit optimisation is combinatorial — use greedy marginal-abatement ordering as the conservative
fallback and label optimality accordingly.
