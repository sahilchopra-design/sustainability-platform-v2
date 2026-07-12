## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain. The sections below document
`backend/services/dcm_engine.py` — the "DCM Engine — Complete Carbon Credit Methodology
Calculator" — exposed at `/api/v1/dcm` via `backend/api/v1/routes/dcm.py`.)*

### 7.1 What the module computes

A **dispatcher over ~53 named carbon-crediting methodology calculators** spanning CDM
(ACM/AM/AMS families), Verra VCS (VM00xx), Gold Standard (ICS/WASH/AGRI/WW), engineered CDR
(DACCS/BECCS/ERW/OAE/biochar), Article 6.4 ITMO accounting, and CORSIA. Every calculator is a
pure function `CODE(inputs: dict) -> dict` and every result flows through one canonical
identity (`_result`):

```
emission_reductions = baseline_emissions − project_emissions − leakage
net_climate_benefit = emission_reductions + emission_removals        (all tCO₂e)
```

API surface: `GET /methodologies` (filterable catalogue), `GET /methodologies/{code}`,
`GET /sectors`, `GET /standards`, `GET /ref/*` (Article 6 guidance, CDR pathways, project
types), and `POST /batch` → `batch_calculate([{methodology_code, inputs}...])` with per-item
ok/error status. Unknown codes raise a `ValueError` listing available codes.

### 7.2 Parameterisation — shared physical constants

| Constant block | Contents | Provenance |
|---|---|---|
| `GWP` | CO₂ 1 · CH₄ 27.9 · N₂O 273 · HFC-23 14,600 · SF₆ 25,200 … | IPCC **AR6** GWP-100 values (code comment) |
| `IPCC_FUELS` | EF (kgCO₂/GJ) + NCV per fuel: natural gas 56.1/48.0, diesel 74.1, bituminous coal 94.6, lignite 101.0…; biomass/charcoal/biogas EF 0 (biogenic) | IPCC 2006 Tier-1 defaults (labelled "IPCC AR6 Tier 1") |
| `GRID_EF` | Combined-margin grid factors tCO₂e/MWh for 25 countries (CN 0.581, IN 0.687, FR 0.049, ZA 0.907…) + global 0.4753 | typical published CM values, hard-coded |
| `BIOME_CARBON` | Above/below/soil/dead stocks (tCO₂e/ha) for 14 biomes — tropical moist 180/36/60/10 … tropical peatland soil 2,000, mangrove soil 450 | IPCC-style biome defaults, engine-curated |

Each calculator also carries methodology-specific defaults (every input has one, so the API is
demo-runnable with an empty `inputs`): e.g. wastewater `B0 = 0.25 m³CH₄/kg COD`, CH₄ density
0.67–0.716 kg/m³; truck transport 0.062 kgCO₂e/t·km; SMR grey-hydrogen 9.3 tCO₂e/tH₂; kerosene
2.543 kgCO₂/l; non-renewable-biomass wood EF 1.83 tCO₂e/t; root-shoot expansion 1.26, biomass
expansion factor 1.4, carbon fraction 0.47, C→CO₂ 44/12; REDD leakage 10–20% of baseline;
CORSIA Jet-A 3.16 kgCO₂/kg fuel and an optional radiative-forcing multiplier (default 2.0).

### 7.3 Calculation walkthrough — family patterns

- **Methane destruction** (ACM0004, ACM0019, AMS-III.A/R, GS-WW): CH₄ mass from
  COD/manure/flow × conversion factor → baseline = CH₄ × GWP; project = undestroyed residual;
  displaced grid electricity from biogas is *netted off project emissions* (floored at 0).
- **Grid displacement** (ACM0018, AMS-I.B/E/F, AM0026): MWh generated × grid EF = baseline;
  small auxiliary/project factors; biomass transport as leakage.
- **Efficiency deltas** (ACM0021, AMS-II.A/B/C/F): before/after energy × fuel-or-grid EF.
- **AFOLU stocks/flows** (VM family): avoided-deforestation baselines = area-loss × biome
  carbon stock, with % leakage (activity shifting 10–20%) and small monitoring project terms;
  sequestration methods report `emission_removals` (SOC gain, biomass increment × 1.26 × CF ×
  44/12) instead of reductions.
- **CDR**: removals = capacity × permanence (DACCS 0.999) or feedstock × yield × stable-C ×
  44/12 (biochar) or tonnage × removal factor × dissolution efficiency (ERW 0.30 × 0.65, OAE
  1.25 × 0.60); project = fossil-energy/processing/transport overheads; baseline = 0.
- **Article 6.4**: `net ITMOs = gross ER × CA% − 5% share-of-proceeds − 2% adaptation levy`,
  reporting host-NDC adjustment and receiving-NDC reduction separately.
- **CORSIA**: fleet fuel burn × Jet-A EF (SAF share at lifecycle EF), × RFM, then
  `offset = max(total − 2019-baseline, 0) × 15%` sectoral-growth factor.

### 7.4 Worked example — GS-ICS improved cookstoves (engine defaults)

50,000 households, 4.5 kg wood/hh/day, fNRB = 0.70, 55% fuel savings, wood EF 1.83 tCO₂e/t:

| Step | Computation | Result |
|---|---|---|
| Baseline wood | 50,000 × 4.5 × 365 | 82,125 t/yr |
| Non-renewable share | 82,125 × 0.70 | 57,487.5 t |
| Baseline emissions | 57,487.5 × 1.83 | **105,202.13 tCO₂e** |
| Residual wood (45%) | 82,125 × 0.45 × 0.70 | 25,869.4 t NRB |
| Project combustion | 25,869.4 × 1.83 | 47,340.96 |
| + stove manufacture | 50,000 × 0.002 | 100.00 |
| Project emissions | | **47,440.96 tCO₂e** |
| Emission reductions | 105,202.13 − 47,440.96 − 0 | **57,761.17 tCO₂e/yr** |

This mirrors the Gold Standard ICS logic: credits scale with fuel saved × the fraction of
non-renewable biomass (fNRB) — the parameter real GS projects must justify from national data.

### 7.5 Data provenance & limitations

- **No PRNG and no DB** — deterministic formula evaluation only; but **all default inputs are
  synthetic demo values** (e.g. 200,000 daily BRT riders, 50,000 tHCFC-22). Results with empty
  `inputs` are illustrative project archetypes, not assessments.
- Calculators are **first-order simplifications** of the real methodologies: single-year
  steady-state (no crediting-period dynamics, no buffer-pool deductions for AFOLU
  non-permanence), fixed percentage leakage instead of modelled activity-shifting, and rough
  unit bridges flagged in code comments ("rough", e.g. ACM0011's TJ→tCO₂e conversion and
  GS-WW's m³CH₄→MWh chain). AMS-III.E contains a self-cancelling term
  (`× ch4_fraction / ch4_fraction`), leaving the landfill-gas CH₄ share inert.
- Some names/labels drift from the official registries (e.g. VM0037 is labelled "Mesospheric
  Cooling" in the function name but implements forest restoration; VM0015's real Verra title is
  avoided *unplanned deforestation*, here used for coastal ecosystems). Codes should be treated
  as platform identifiers inspired by, not certified reproductions of, registry documents.
- AM0075 counts captured industrial CO₂ as `emission_removals` — under most standards CCS on a
  fossil point source is a *reduction*, not a removal; only the sign convention differs.
- GWP set is AR6-consistent (CH₄ 27.9 fossil value); actual CDM/VCS projects may still credit
  under AR4/AR5 GWPs depending on version — a version-vintage caveat for any reconciliation.

### 7.6 Framework alignment

- **UNFCCC CDM** — ACM/AM/AMS structure mirrors the real methodology families (consolidated,
  approved, small-scale) including canonical parameters (MCF, B₀, EF₁ = 0.01 kgN₂O-N/kgN from
  IPCC, combined-margin grid EFs per the CDM grid-emission-factor tool).
- **Verra VCS** — VM-series AFOLU logic (baseline stocks × loss rate, leakage belts, IFM
  increment accounting); real VCS adds VVB validation and buffer-pool contributions not
  modelled here.
- **Gold Standard** — ICS thermal-efficiency crediting via fNRB (the fraction of woodfuel
  harvested unsustainably), WASH avoided-boiling, agri soil-carbon.
- **Article 6.4 / 6.2 (Paris Agreement)** — corresponding adjustments, 5% share of proceeds to
  the Adaptation Fund and the mechanism's overall-mitigation cancellation, per the CMA rulebook.
- **ICAO CORSIA** — route-based fuel MRV, SAF lifecycle credit against the ~89 gCO₂e/MJ fossil
  benchmark, and offsetting of growth above the (revised 2019-based) sectoral baseline.
- **IPCC 2006 Guidelines / AR6** — Tier-1 emission factors, GWP-100, first-order-decay concepts
  for waste methane.
- **ISO 14064-2 / Puro.earth / IC-VCM** — cited as the standards frame for the engineered-CDR
  calculators (permanence fractions, stable-carbon accounting per H:C_org-style biochar QA).
