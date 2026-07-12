## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a **geospatial** module —
> "geocoded supplier facility locations," an interactive map with "trade flows," and a formula
> `GERI = ESG Score × (1 + Country Risk Premium) × Physical Hazard Weight` referencing WRI Aqueduct
> and ND-GAIN. **None of this exists in the code.** There are no latitude/longitude fields, no map
> rendering library, no WRI/ND-GAIN data, and no `GERI` calculation anywhere in the 930-line file.
> What the page actually is: a **tabular supplier ESG/due-diligence registry** (150 suppliers, 11
> tabs — Overview, Registry, Risk Hotspots, Human Rights, Deforestation, Due Diligence, Regulatory,
> Tier Analysis, Carbon Trace, Certifications, Remediation) with `riskLevel` derived purely from a
> single ESG-score bucket. Sections below document the registry logic as implemented; the guide's
> geospatial GERI model is written up as a specification in §8.

### 7.1 What the module computes

150 synthetic suppliers (`SUPPLIERS`), sector assigned by deterministic round-robin (`i % 10` over
10 `SECTORS`), region drawn randomly from 16 countries via `sr(i*7)`. Each supplier carries an
`esgScore` (20–80, `sr(i*11)*60+20`) from which `riskLevel` is derived as a **direct bucket**, plus
independently-seeded `carbonIntensity`, `laborScore`, `envScore`, categorical `deforestRisk` /
`waterRisk` / `childLaborRisk` (High/Medium/Low via `sr()` threshold cuts), `humanRightsFlags`
(0–4 count), `ddStatus` (Audited/In Progress/Pending), `tier` (1–3), Scope 1/2 GHG, renewable-energy
%, and on-time-delivery %.

```js
riskLevel = RISK_LEVELS[min(4, floor((100 − esgScore) / 20))]
// RISK_LEVELS = ['Critical','High','Medium','Low','Very Low']
```

This is a **single-variable step function**: `esgScore` in [0,20)→Critical, [20,40)→High,
[40,60)→Medium, [60,80)→Low, [80,100]→Very Low. No other field (carbon intensity, human-rights
flags, deforestation risk, water risk) contributes to `riskLevel` despite being displayed alongside
it as if they were inputs to a composite risk rating.

### 7.2 Parameterisation

| Field | Range | Distribution | Provenance |
|---|---|---|---|
| `esgScore` | 20–80 | `sr(i*11)*60+20` | Synthetic demo value |
| `carbonIntensity` | 50–550 | `sr(i*13)*500+50` | Synthetic demo value |
| `deforestRisk`/`waterRisk`/`childLaborRisk` | Low/Med/High | `sr()<0.3→High, <0.6→Med, else Low` (or `<0.2/<0.5` for childLabor) | Synthetic demo thresholds, no cited base rate |
| `conflictMinerals` flag | boolean | `sr(i*61) < 0.15` → ~15% of suppliers flagged | Synthetic demo value |
| `tier` | 1–3 | `ceil(sr(i*37)*3)` | Synthetic demo value |
| Risk-level bucket width | 20 pts | `floor((100−esgScore)/20)` | Even 5-way split of the 0–100 ESG range |

The static reference tables — `DD_REGS` (10 real regulations: CSDDD, LkSG, French Duty of Vigilance,
UK MSA, US UFLPA, EU Conflict Minerals Reg., EUDR, SEC Climate Disclosure, Australia MSA, EU Battery
Reg.), `HR_HOTSPOTS` (10 country/issue pairs), `DEFOREST_COMMODITIES` (8 commodities with real
EUDR-scope flags and approximate exposure %) — are hand-authored descriptive content, not derived
from the supplier records.

### 7.3 Calculation walkthrough

1. **Filtering** — `filtered` applies sector, risk-level, region, and free-text search (name or
   region substring match) simultaneously.
2. **KPI roll-up** — `kpis` (line 205) computes count, `avgEsg` (mean), `critical` count, summed
   `hrFlags`, `audited` count, `conflictMinerals` count, and `totalSpend` — all unweighted
   sums/means over `filtered`, guarded by `Math.max(1, filtered.length)`.
3. **Sector/region risk counts** — `sectorRiskCount` counts suppliers per sector where
   `riskLevel ∈ {Critical, High}`; `regionCount` is a plain per-region tally — both simple
   `Object` accumulator patterns, safe against division by zero (no division involved).
4. **Tier analysis** (`TIER_ANALYSIS`) — per tier (1/2/3), computes count, mean ESG, count of
   Critical-risk suppliers, count Audited, summed HR flags, mean carbon intensity, count
   conflict-minerals-flagged, mean spend — same unweighted-aggregate pattern, `Math.max(1,n)`
   guarded.
5. **Carbon trace** (`CARBON_TRACE`) — per sector, sums Scope 1/2 GHG (÷1000 to convert to
   thousands of tCO₂e display units), means carbon intensity and renewable-energy %.
6. **CSV export** — `exportCSV` is a generic client-side Blob/anchor-download utility, applied to
   whichever table is active; no server round-trip.

### 7.4 Worked example

Supplier `i=42`: sector `= SECTORS[42%10] = SECTORS[2] = 'Textiles'`. `esgScore =
round(sr(42*11)*60+20) = round(sr(462)*60+20)`. `sr(462)=frac(sin(463)×10⁴)`; `sin(463 rad)` reduces
mod 2π — numerically `sin(463)≈-0.9998`, ×10⁴=-9998, `frac` via `x−floor(x)` on a negative gives
`≈0.02` → `esgScore=round(0.02×60+20)=round(21.2)=21`. Risk bucket:
`floor((100−21)/20)=floor(3.95)=3` → `RISK_LEVELS[3]='Low'`. Note the counter-intuitive naming: an
ESG score of just 21/100 (near the bottom of the range) still maps to the **'Low'** risk label
because `RISK_LEVELS` is ordered `[Critical, High, Medium, Low, Very Low]` and the bucket index
counts *down* from the top of the ESG range — a supplier needs `esgScore < 20` to be labelled
'Critical'. Given `esgScore` is drawn from `sr()*60+20`, i.e. always ≥20, **no synthetic supplier in
this dataset can ever reach 'Critical'** — the bucket is structurally unreachable given the
generator's range, even though the UI's risk filter offers 'Critical' as a selectable option.

### 7.5 Companion analytics

- **Regulatory tab** — hard-coded compliance-readiness percentages per regulation (e.g. EU Battery
  Regulation 28%, "Early Stage") are static, not computed from supplier `ddStatus`/certification
  fields.
- **Remediation tracker** (`REMEDIATION_DATA`) — 15 hand-authored remediation items with realistic
  cost figures ($8K–$180K) and priority/status/owner — illustrative case data, not generated from
  the supplier risk flags.
- **Certification registry** (`CERT_STANDARDS`) — 12 real standards (ISO 14001, SA8000, ISO 45001,
  FSC, RSPO, Rainforest Alliance, B Corp, Sedex/SMETA, CDP Climate A, GoodWeave, Fairtrade,
  ISO 50001) with `sr()`-seeded supplier-adoption counts, unrelated to the 150-row `SUPPLIERS` array.

### 7.6 Data provenance & limitations

- **100% synthetic supplier data**, `sr()`-seeded; the 10 DD regulations, 10 HR hotspots, 8
  deforestation commodities, and 12 certification standards are real-world reference content but
  disconnected from the supplier records (no supplier row references a specific regulation or
  hotspot by ID).
- No geocoding, no map component, no WRI Aqueduct/ND-GAIN data — the "map" in the module name and
  guide is not implemented; see §8 for what a real geospatial GERI would require.
- `riskLevel`'s 'Critical' bucket is unreachable given the ESG-score generator's floor of 20 — a
  structural artefact of the synthetic-data ranges, not a modelling decision.

**Framework alignment:** CSDDD, LkSG, EUDR, UFLPA and the other `DD_REGS` entries are accurately
described (scope, focus, effective date) as static reference content, but the module does not map
individual suppliers against these regulations' actual due-diligence-tier requirements (e.g. CSDDD's
turnover/employee thresholds) — it only shows aggregate compliance percentages that are hard-coded,
not computed from the regulation's real applicability tests.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Deliver the geospatial ESG-risk capability the guide and module name promise: a facility-level
**Geospatial ESG Risk Index (GERI)** combining supplier ESG performance, host-country governance
risk, and physical climate-hazard exposure, to prioritise site visits, due-diligence spend, and
supplier diversification. Scope: all geocoded Tier 1–3 facility locations.

### 8.2 Conceptual approach

Benchmark against **Verisk Maplecroft's Environmental Risk Outlook** (country/site risk premium
layered onto a base ESG score) and **WRI Aqueduct's facility-level water-risk scoring
methodology** (grid-cell hazard lookup by lat/lng, aggregated to asset level) — both use the same
architecture: normalise a location-independent entity score, then multiply by location-dependent
hazard/governance multipliers so that identical suppliers in different geographies receive different
composite risk.

### 8.3 Mathematical specification

```
CountryRiskPremium(country) = 0.5·(1 − NDGAIN_Readiness(country)/100)
                             + 0.5·(1 − WGI_GovernanceScore(country)/100)     ∈ [0,1]

PhysicalHazardWeight(lat,lng) = max over hazards h∈{flood,water-stress,heat,cyclone} of
                                 AqueductScore_h(lat,lng) / 5                  ∈ [0,1]  (Aqueduct 0-5 scale)

GERI(facility) = ESGScore(supplier) × (1 + CountryRiskPremium) × (1 + PhysicalHazardWeight)
               ∈ [ESGScore, 4×ESGScore]   (bounded multiplicative uplift, both terms ≥0)
```

| Parameter | Value | Calibration source |
|---|---|---|
| CountryRiskPremium blend | 50/50 ND-GAIN + WGI | ND-GAIN Readiness sub-index (adaptive capacity) + World Bank Worldwide Governance Indicators — both free, country-year panel |
| PhysicalHazardWeight | max() not mean() | Conservative — a facility should be scored on its worst hazard, not diluted by hazards it doesn't face (WRI Aqueduct convention) |
| Hazard normalisation | ÷5 | WRI Aqueduct's native 0–5 water-risk scale |
| GERI multiplicative form | (1+premium)×(1+hazard) | Ensures GERI ≥ ESGScore always (risk overlay only adds risk, never subtracts) |

### 8.4 Data requirements

- Facility geocodes (lat/lng) per supplier site — needs supplier master-data enrichment (currently
  absent entirely).
- WRI Aqueduct 4.0 gridded hazard layers (flood, water stress, heat, cyclone) — free, downloadable
  raster/vector.
- ND-GAIN Country Index (Readiness + Vulnerability) — free, annual country panel.
- World Bank Worldwide Governance Indicators — free, annual country panel.
- Existing `esgScore` per supplier (already in `SUPPLIERS`, currently synthetic — needs real
  EcoVadis/CDP/Sustainalytics feed).

### 8.5 Validation & benchmarking plan

Reconcile country-level `CountryRiskPremium` output against Verisk Maplecroft's published country
risk rankings (rank-correlation target ρ>0.7 for overlapping countries); spot-check
`PhysicalHazardWeight` against WRI Aqueduct's own web tool for 20 sampled facility coordinates;
sensitivity-test the multiplicative form against an additive alternative to confirm ranking stability.

### 8.6 Limitations & model risk

Country-level premiums cannot capture sub-national variation (e.g. flood risk differs sharply within
China); facility-level Aqueduct lookups mitigate this for the physical term but the governance term
remains country-level unless a sub-national governance index is sourced. Multiplicative bounding at
4× ESGScore is an arbitrary design ceiling — validate against realised loss/disruption data once
available rather than treating the bound as calibrated.
