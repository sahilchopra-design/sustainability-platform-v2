# Solar Manufacturer Carbon Finance
**Module ID:** `solar-manufacturer-carbon-finance` · **Route:** `/solar-manufacturer-carbon-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EA3 · **Sprint:** EA

## 1 · Overview
Carbon finance analytics for solar module manufacturers covering product lifecycle LCA carbon footprint (20-50 gCO2e/kWh lifetime), EPD certification, CBAM export risk assessment, scope 3 upstream emissions (polysilicon, wafer, glass), and carbon credit eligibility for manufacturing decarbonisation projects.

> **Business value:** Used by solar manufacturers, ESG procurement teams, green bond structurers, and EU customs/trade compliance officers to manage carbon regulatory risk and demonstrate product sustainability credentials.

**How an analyst works this module:**
- Select module technology and production location
- Calculate lifecycle carbon footprint from LCA database or EPD
- Assess CBAM exposure for EU export scenarios
- Identify scope 3 hotspots and carbon reduction roadmap

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CARBON_INTENSITY_BENCHMARK`, `CBAM_TIMELINE`, `CCTS_SECTORS`, `EPD_STANDARDS`, `EXPORT_MARKETS`, `GRID_EF_ROADMAP`, `Kpi`, `MANUFACTURERS`, `PLI_TRANCHES`, `SCOPE_BREAKDOWN`, `SectionTitle`, `Tab`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MANUFACTURERS` | 7 | `hq`, `cap2024Gw`, `cap2030Gw`, `techFocus`, `listedBSE`, `exportPct`, `pliTranche`, `pliSanctionedCr`, `scope1KgW`, `scope2KgW`, `scope3KgW`, `carbonPaybackYr`, `cbamExposureEurMw`, `rec100`, `cctsSector`, `isoEnergy` |
| `CARBON_INTENSITY_BENCHMARK` | 8 | `gCO2eqPerW`, `year` |
| `CBAM_TIMELINE` | 10 | `phase`, `cbamPct`, `freeAlloc` |
| `PLI_TRANCHES` | 4 | `focus`, `incentiveRsW`, `durationYr`, `totalCapGw`, `capexSupportPct` |
| `SCOPE_BREAKDOWN` | 7 | `kgCO2eqPerKw`, `pct` |
| `GRID_EF_ROADMAP` | 8 | `ef`, `re_pct` |
| `CCTS_SECTORS` | 9 | `baseline`, `unit`, `ccertEligible` |
| `EXPORT_MARKETS` | 7 | `tariff2024Pct`, `cbamRisk`, `pricePremiuumUsdW`, `antidumpingRisk` |
| `EPD_STANDARDS` | 6 | `scope`, `mandatory`, `region`, `carbonLabel` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `tco2PerMw` | `carbonIntensityKgW * 1000 / 1000;` |
| `gross` | `tco2PerMw * euEtsPrice * mwExport * (cbamPct/100);` |
| `incentiveCr` | `capGwAnnual * 1e6 * incentiveRsW / 1e7;` |
| `total` | `incentiveCr * tenure;` |
| `systemTco2Embed` | `systemKwp * moduleCI / 1e6;` |
| `annDisplacedTco2` | `annGenMwh * gridEf;` |
| `cbamCalc` | `useMemo(() => calcCbamCost({ carbonIntensityKgW: mfr.scope1KgW + mfr.scope2KgW, euEtsPrice, mwExport: exportMw, cbamPct: cbamRow.cbamPct }), [mfr, euEtsPrice, exportMw, cbamRow]);` |
| `payback` | `calcCarbonPayback({ systemKwp: 1, gridEf: gridEfNow, annGenMwh: 1.6, moduleCI: (mfr.scope1KgW + mfr.scope2KgW + mfr.scope3KgW) });` |
| `tabs` | `['Overview','Manufacturer Dashboard','CBAM Exposure','PLI Carbon Nexus','Carbon Intensity','Scope 1-2-3 Breakdown','EPD & Standards','CCTS Compliance','Export Markets','Carbon Payback','Advanced Analytics'];` |
| `exp` | `m.cbamExposureEurMw * 500 / 1e6;` |
| `tco2` | `(v.intensity / 1000) * v.mw * 1e6;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CARBON_INTENSITY_BENCHMARK`, `CBAM_TIMELINE`, `CCTS_SECTORS`, `EPD_STANDARDS`, `EXPORT_MARKETS`, `GRID_EF_ROADMAP`, `MANUFACTURERS`, `PLI_TRANCHES`, `SCOPE_BREAKDOWN`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Module Carbon Footprint (gCO2e/kWh) | `(mfg_GHG + transport_GHG) / (AEP × 30yr)` | IEA-PVPS LCA database + EPD data | Best-in-class monocrystalline modules ~20-25 gCO2e/kWh; Chinese grid-powered production ~35-50 gCO2e/kWh. |
| CBAM Exposure (€/MW exported) | `embedded_tCO2e/MW × EU ETS carbon price` | EU ETS price + production emission intensity | Estimated annual CBAM cost for a 1GW manufacturer exporting to EU at €65/tCO2 and 35 tCO2e/MW module production: ~€2.3M/GW. |
| Scope 3 Upstream Intensity (kgCO2e/module) | `Σ(material_mass_i × emission_factor_i)` | Exiobase EEIO + supplier EPDs | Polysilicon and glass dominate upstream scope 3; value chain decarbonisation requires supplier energy transition. |
- **IEA-PVPS LCA database + Exiobase EEIO + EU ETS price + supplier EPDs** → Module LCA calculation → CBAM exposure model → scope 3 hotspot analysis → **Carbon footprint analytics for solar manufacturing decarbonisation and trade compliance**

## 5 · Intermediate Transformation Logic
**Methodology:** Solar Module LCA Carbon Footprint Analysis
**Headline formula:** `lifetime_CF = (mfg_emissions + BOS_emissions) / (AEP × system_lifetime_years)`

Manufacturing carbon footprint is driven primarily by upstream polysilicon energy intensity (Chinese grid: ~5.5 kgCO2e/kg Si vs EU grid: ~1.8 kgCO2e/kg Si). EPD (Environmental Product Declaration) certification under EN 15804 provides third-party verified product carbon footprint for procurement specifications. CBAM exposure is calculated on direct embedded emissions in exported modules for EU-destined shipments, applying the EU ETS carbon price at the point of export.

**Standards:** ['IEA-PVPS Task 12 LCA Guidelines', 'ISO 14044 Life Cycle Assessment', 'EU CBAM Regulation 2023/956']
**Reference documents:** IEA-PVPS Task 12 Methodology Guidelines for LCA of PV Systems (2020); ISO 14044:2006 Environmental Management – LCA; EU CBAM Regulation (EU) 2023/956

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `Apr2026CarbonAnalytics`, `IndiaAdvancedAnalytics`, `IndiaGreenHybridFinance`

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

## 9 · Future Evolution

### 9.1 Evolution A — Net CBAM liability with free-allocation offset and EPD-grade LCA inputs (analytics ladder: rung 1 → 2)

**What.** Like its developer sibling, this module uses no `sr()` for core data — 6 real named Indian manufacturers with hand-curated Scope 1/2/3 intensities, and three genuine calculation functions (`calcCbamCost`, `calcPliIncentive`, `calcCarbonPayback`). The `CBAM_TIMELINE`, `PLI_TRANCHES`, `GRID_EF_ROADMAP`, and `SCOPE_BREAKDOWN` (upstream polysilicon dominance at 92.9%) are all cited-accurate. But §7.6 flags a real quantitative error: `calcCbamCost` omits the free-allocation offset, so the module **overstates gross CBAM liability** relative to the net certificate obligation during the 2026–2034 phase-in — even though the correct free-allocation schedule (100%→25%→0%) is sitting right there in `CBAM_TIMELINE`. Evolution A fixes the CBAM math and upgrades the LCA inputs toward EPD grade.

**How.** (1) Correct `calcCbamCost` to net out free allocation by year: `net_liability = gross × (1 − free_allocation_pct[year])`, reading the schedule the module already carries — the single most impactful fix. (2) Add embedded-emissions determination per the CBAM methodology (default values vs verified installation-specific, which changes the liability materially). (3) Let module carbon intensity be sourced from an EPD (EN 15804) upload rather than a hand-set constant, supporting the procurement use case. (4) Scenario the EU ETS price path (the levy driver) so exporters see liability under a price range, not a point.

**Prerequisites.** CBAM default embedded-emission values need encoding; EPD parsing is a stretch input. **Acceptance:** CBAM cost for a 2027 shipment is lower than the current gross figure by exactly the free-allocation percentage; toggling verified vs default embedded emissions changes liability; ETS-price scenarios produce a liability band.

### 9.2 Evolution B — CBAM-compliance and decarbonisation-roadmap copilot (LLM tier 2)

**What.** A copilot for the manufacturer/procurement/trade-compliance users: "what's our net CBAM cost exporting 500MW to the EU in 2028?", "where are our Scope 3 hotspots and what reduces them most?", "does switching to RE-powered polysilicon change our CBAM exposure?" — calling `calcCbamCost`, `calcCarbonPayback`, and reading `SCOPE_BREAKDOWN`, narrating the results and the decarbonisation roadmap.

**How.** Tier-2 pattern: the three calculators become tools; the copilot passes user inputs, receives figures, and narrates CBAM liability, carbon-payback, and PLI incentives — with hotspot analysis driven by the real `SCOPE_BREAKDOWN` (polysilicon/wafer 53.2%). Roadmap suggestions are grounded in the `GRID_EF_ROADMAP` (manufacturing-grid decarbonisation) and the sibling LCA module's finding that manufacturing-site grid choice drives ~6× footprint variation. The no-fabrication validator checks every liability figure against tool output.

**Prerequisites (hard).** Evolution A's free-allocation fix — a copilot narrating the current `calcCbamCost` would confidently overstate every client's CBAM bill, an expensive error to put in an LLM's mouth. **Acceptance:** every CBAM and payback figure traces to a tool call using the corrected math; hotspot claims cite `SCOPE_BREAKDOWN` shares; a non-EU-export scenario yields "no CBAM exposure," correctly.