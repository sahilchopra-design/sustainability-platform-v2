## 7 · Methodology Deep Dive

### 7.1 What the module computes

Like its sibling `solar-developer-carbon-finance`, this module uses **no `sr()` PRNG for its core data** —
6 named real Indian solar manufacturers (Waaree Energies, Adani Solar, Vikram Solar, Tata Power Solar,
Saatvik Solar, RenewSys India) carry hand-curated capacity, export %, PLI tranche, Scope 1/2/3 intensity
(kgCO₂e/kW), carbon-payback-year, and CBAM exposure (€/MW) figures. Three genuine calculation functions run
over this data:

```js
calcCbamCost({ carbonIntensityKgW, euEtsPrice, mwExport, cbamPct }) {
  tco2PerMw = carbonIntensityKgW × 1000 / 1000            // kg→t unit pass-through (net: kgCO2/kW ≡ tCO2/MW)
  gross     = tco2PerMw × euEtsPrice × mwExport × (cbamPct/100)
}
calcPliIncentive({ capGwAnnual, incentiveRsW, tenure }) {
  incentiveCr = capGwAnnual × 1e6 × incentiveRsW / 1e7     // GW→W×₹/W→₹Cr (1 Cr = 1e7)
  total       = incentiveCr × tenure
}
calcCarbonPayback({ systemKwp, gridEf, annGenMwh, moduleCI }) {
  systemTco2Embed  = systemKwp × moduleCI / 1e6
  annDisplacedTco2 = annGenMwh × gridEf
  payback = systemTco2Embed / annDisplacedTco2              // years, guarded for annDisplacedTco2>0
}
```

### 7.2 Parameterisation

| Parameter | Value | Provenance |
|---|---|---|
| `CBAM_TIMELINE` | 2023-25 transitional (0% charge, 100% free allocation) → 2026 phase-in begins (25% CBAM, 93% free) → 2030 full CBAM (100%, 25% free) → 2034 full phase-out (0% free) | consistent with the real EU CBAM Regulation (EU) 2023/956 definitive-period phase-in structure |
| `PLI_TRANCHES` | Tranche 1: ₹1.5/W (≥20% mono eff.), Tranche 2: ₹2.0/W (integrated wafer+cell+module), Additional: ₹2.5/W (TOPCon/HJT ≥22.5%) | matches India's real PLI (Production Linked Incentive) scheme for high-efficiency solar PV modules, tiered by technology/efficiency |
| `GRID_EF_ROADMAP` | 0.82 (2024) → 0.47 tCO₂/MWh (2030), RE share 23%→58% | consistent with CEA's published decarbonisation trajectory (matches the developer-finance module's grid EF series) |
| `SCOPE_BREAKDOWN` | Scope 3 (polysilicon/wafer 53.2% + cell 23.4% + module 7.1% + logistics 9.2%) dominates at 92.9% of embodied carbon; Scope 1+2 only 7.1% | consistent with published solar-module LCA literature showing upstream polysilicon/wafer as the dominant emissions hotspot |
| `CARBON_INTENSITY_BENCHMARK` | India coal grid 750 gCO₂eq/W, India RE mix 480 (2030), China 510, EU 280, IEA NZ target 120 (2050) | plausible cross-country ordering (EU lowest due to nuclear/renewables-heavy grid, India coal-grid highest) |
| `euEtsPrice` (default) | €68/tCO₂ | plausible EU ETS spot-price assumption at time of data curation |

### 7.3 Calculation walkthrough

- **CBAM Exposure tab**: `cbamCalc = calcCbamCost({ carbonIntensityKgW: mfr.scope1+scope2, euEtsPrice,
  mwExport, cbamPct: cbamRow.cbamPct })` — correctly uses **only Scope 1+2** (direct + purchased electricity)
  as the CBAM-relevant embedded emissions, consistent with the EU CBAM Regulation's scope (CBAM currently
  covers direct + indirect electricity emissions, not full Scope 3 upstream). This is a methodologically
  sound choice, distinct from — and correctly narrower than — the `SCOPE_BREAKDOWN` LCA figures used
  elsewhere in the module for footprint reporting.
- **PLI Carbon Nexus tab**: `pliCalc = calcPliIncentive(...)` computes the total ₹-crore PLI subsidy a
  manufacturer would receive for a given annual capacity addition and tranche.
- **Carbon Payback tab**: compares embedded manufacturing carbon (Scope 1+2+3 per kW) against the annual
  displaced grid emissions from operating the panel, under a toggleable grid scenario (current 0.82
  tCO₂/MWh vs 2030 target 0.47).

### 7.4 Worked example (Waaree Energies, CBAM 2028)

`scope1KgW=18`, `scope2KgW=32` → `carbonIntensityKgW=50`; `euEtsPrice=€68`; `exportMw=500`; CBAM 2028
(`cbamPct=75`, per `CBAM_TIMELINE`):

| Step | Computation | Result |
|---|---|---|
| tCO₂/MW | 50×1000/1000 | 50 tCO₂/MW |
| Gross CBAM cost | 50 × 68 × 500 × 0.75 | **€1,275,000** |

**Carbon payback** (Waaree, current grid `gridEf=0.82`, `moduleCI = 18+32+700 = 750` kgCO₂e/kW,
`annGenMwh=1.6` per kWp assumption):

| Step | Computation | Result |
|---|---|---|
| Embedded tCO₂ | 1×750/1e6 | 0.00075 tCO₂/kWp |
| Annual displaced tCO₂ | 1.6×0.82 | 1.312 tCO₂/yr |
| Payback | 0.00075/1.312 | **≈0.00057 yr** — implausibly short; see limitations below |

The worked payback figure is far shorter than the module's own displayed `carbonPaybackYr` field (1.1 years
for Waaree) — indicating the `calcCarbonPayback` function's fixed `systemKwp:1, annGenMwh:1.6` calibration
in the interactive tab does not reconcile with the per-manufacturer `carbonPaybackYr` constant shown in the
Manufacturer Dashboard; the two payback figures are **not cross-consistent** within the module.

### 7.5 Data provenance & limitations

- **Manufacturer figures are hand-curated, single-point-in-time estimates** for real, named companies — not
  live-sourced, will drift from actual reported PLI/capacity/export data over time.
- **Internal inconsistency**: the interactive Carbon Payback calculator's fixed assumptions (`systemKwp=1`,
  `annGenMwh=1.6`) produce a materially different payback period than the static `carbonPaybackYr` field
  shown per manufacturer elsewhere in the UI — see the worked example above.
- CBAM cost calculation correctly scopes to Scope 1+2 only, but does not yet model the free-allocation
  offset (`freeAlloc` field exists in `CBAM_TIMELINE` but is not subtracted from the `gross` CBAM cost
  calculation — the true net CBAM certificate liability should be `gross × (1 − freeAlloc/100)`, which the
  code does not compute).
- PLI incentive calculation assumes the full sanctioned rate applies uniformly to `capGwAnnual`; real PLI
  disbursement is milestone- and audit-gated, not a simple linear multiple.

### 7.6 Framework alignment

- **EU CBAM Regulation (EU) 2023/956** — the phase-in timeline and Scope 1+2 CBAM cost scoping are
  methodologically correct; the missing free-allocation offset (noted above) means the module currently
  **overstates gross CBAM liability** relative to the actual net certificate obligation a manufacturer would
  face during the 2026–2034 phase-in.
- **India PLI Scheme for High Efficiency Solar PV Modules** — tranche structure (efficiency-tiered
  incentive rates, capacity caps) is a faithful representation of the real scheme's tiering logic.
- **IEA-PVPS Task 12 LCA Guidelines / ISO 14044** — the `SCOPE_BREAKDOWN` upstream-dominance finding (>90%
  of embodied carbon in Scope 3 polysilicon/wafer/cell stages) is consistent with the published LCA
  literature these guidelines are based on.
