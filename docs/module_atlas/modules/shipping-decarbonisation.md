# Shipping Decarbonisation Finance
**Module ID:** `shipping-decarbonisation` · **Route:** `/shipping-decarbonisation` · **Tier:** B (frontend-computed) · **EP code:** EP-DJ1 · **Sprint:** DJ

## 1 · Overview
Models the financial pathways for decarbonising international shipping under IMO 2050 strategy — ammonia, methanol, hydrogen, LNG, and wind propulsion economics. Calculates fleet transition costs, carbon levy exposure, and green shipping corridor investment requirements.

> **Business value:** Directly applicable to shipping banks (Poseidon Principles signatories), shipping company CFOs planning fleet transition, and green bond issuers financing zero-emission vessels. Provides IMO CII compliance analytics and fuel transition investment economics for ship finance decisions.

**How an analyst works this module:**
- Select vessel type and route for emissions baseline
- Compare alternative fuel options by LCOF
- Calculate IMO CII rating and compliance trajectory
- Model fleet decarbonisation cost under IMO strategy
- Assess Poseidon Principles alignment for shipping finance

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CII_COLORS`, `CII_RATINGS`, `COUNTRIES`, `FLEETS`, `FLEET_NAMES`, `FUEL_TYPES`, `KpiCard`, `SHIP_TYPES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ciiRating` | `CII_RATINGS[Math.floor(sr(i * 7) * 5)];` |
| `fuelType` | `FUEL_TYPES[Math.floor(sr(i * 11) * 5)];` |
| `eexi` | `+(3 + sr(i * 13) * 22).toFixed(2);` |
| `totalFleet` | `filtered.reduce((a, f) => a + f.fleetSize, 0);` |
| `totalRetrofitCapex` | `filtered.reduce((a, f) => a + f.retrofitCapex, 0).toFixed(0);` |
| `ciiDist` | `CII_RATINGS.map(r => ({ rating: r, count: filtered.filter(f => f.ciiRating === r).length }));` |
| `fuelMix` | `FUEL_TYPES.map(ft => ({` |
| `retrofitByType` | `SHIP_TYPES.map(t => ({` |
| `carbonCostData` | `filtered.slice(0, 20).map(f => ({` |
| `scatterData` | `filtered.map(f => ({` |
| `imoReadiness` | `filtered.slice(0, 15).map(f => ({` |
| `strandingData` | `filtered.slice(0, 20).map(f => ({` |
| `eexiData` | `filtered.slice(0, 20).map(f => ({` |
| `fuelPathways` | `FUEL_TYPES.map(ft => {` |
| `pct` | `filtered.length ? ((count / filtered.length) * 100).toFixed(1) : '0.0';` |
| `avgEexi` | `ships.length ? (ships.reduce((a, s) => a + s.eexi, 0) / ships.length).toFixed(2) : '—';` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CII_RATINGS`, `COUNTRIES`, `FLEET_NAMES`, `FUEL_TYPES`, `SHIP_TYPES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Shipping GHG Share | — | IMO GHG Study 4th Edition 2020 | International shipping emits 2.9% of global GHG — IMO targets net-zero by/around 2050 |
| Green Ammonia LCOF | — | UMAS Zero Emission Vessels 2021 | Green ammonia fuel cost range — needs to fall to $300–500/t for competitiveness with VLSFO at $600/t |
| Fleet Decarbonisation Cost | — | Getting to Zero Coalition 2023 | Cumulative investment in zero-emission vessels and fuels needed to decarbonise international shipping |
- **AIS vessel tracking + emission factor data** → Fleet emissions baseline → **CII rating distribution by vessel type and owner**
- **Green fuel price curves (ammonia, methanol, H2, LNG)** → LCOF comparison → **Cost competitiveness of each fuel option by scenario/year**
- **Poseidon Principles portfolio temperature score** → Paris alignment assessment → **Shipping portfolio alignment score vs IMO 2°C pathway**

## 5 · Intermediate Transformation Logic
**Methodology:** Shipping Fuel Transition Economics
**Headline formula:** `LCOF_green = (FuelCapEx + OpEx_annual) / AnnualFuelConsumed; IMO_CII_Compliance = EmissionsIntensity / ReferenceValue_vessel_type`

Levelised Cost of Fuel (LCOF) compares green fuels vs VLSFO; IMO CII rating (A–E) determines annual operational compliance — C/D/E triggers corrective action plan

**Standards:** ['IMO 2023 Strategy on GHG Reduction', 'Poseidon Principles Climate Alignment', 'Getting to Zero Coalition', 'UMAS/UCL Zero Emission Vessels 2021']
**Reference documents:** IMO 2023 Strategy on Reduction of GHG Emissions from Ships; Poseidon Principles — Climate Alignment Assessment 2023; Getting to Zero Coalition — State of the Sector 2023; UMAS/UCL Navigating Decarbonisation 2021

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

60 synthetic vessel fleets (`FLEETS`, seeded `sr(s)=frac(sin(s+1)×10⁴)`) named with a mix of real shipping
line styles ("Maersk Ocean," "MSC Adriatic," "CMA CGM Pacific") and thematic decarbonisation names ("Net
Zero Ship," "Hydrogen Wave," "Carbon Free I"), each carrying an IMO CII (Carbon Intensity Indicator) letter
rating, EEXI (Energy Efficiency Existing Ship Index) value, fuel type, and retrofit economics:

```js
eexi              = 3 + sr()×22                                // 3–25
retrofitCapex     = 5 + sr()×195                                // $5–200M
greenFuelReadiness = 1 + sr()×9                                 // 1–10 scale
carbonIntensity    = 2 + sr()×18                                // 2–20 gCO2/dwt-nm (unit implied)
stranded2030Risk   = 5 + sr()×70                                // 5–75%
imoAligned         = sr() > 0.45                                // ~55% aligned
```

Interactive carbon-cost calculator with user-adjustable `carbonPrice` ($/tCO₂, default 75) and `fuelPrice`
($/tonne, default 600) sliders:

```js
annualCarbonCost   = carbonIntensity × fleetSize × carbonPrice × 0.001
fuelCostPerVessel  = fuelPrice × eexi × 0.1
```

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| CII rating | A–E, `sr()`-assigned uniformly | Real IMO CII letter-grade system (A=best, E=worst, per IMO's 2023 Carbon Intensity Indicator regulation) |
| EEXI | 3–25 | Real IMO metric name (Energy Efficiency Existing Ship Index, mandatory from 2023); numeric range here is illustrative, not a certified EEXI calculation |
| Fuel types | HFO, LNG, Methanol, Ammonia, Hybrid | Real marine fuel categories reflecting the actual current/emerging bunker fuel landscape |
| `avgCII` (portfolio KPI) | `mean(CII_RATINGS.indexOf(rating))` | Converts letter to a 0–4 ordinal index and averages — a defensible way to get a numeric portfolio CII summary from letter grades, though it treats the A→E scale as evenly spaced, which the real IMO CII boundary bands are not (bands are vessel-type and size-specific, non-linear) |

### 7.3 Calculation walkthrough

1. `filtered` applies ship-type/country/CII-rating filters over the 60 fleets.
2. Guarded KPIs: `avgCII` and `imoAlignedPct` both check `filtered.length` before dividing, avoiding
   NaN/Infinity on an empty filter result.
3. `ciiDist`/`fuelMix`/`retrofitByType` are straightforward count/sum aggregations across the filtered set.
4. **Carbon cost calculator**: for the first 20 filtered fleets, computes per-fleet `annualCarbonCost` (a
   function of the fleet's own `carbonIntensity` and `fleetSize`, scaled by the user's `carbonPrice`
   slider) and `fuelCostPerVessel` (a function of `eexi`, scaled by the `fuelPrice` slider) — both formulas
   use simple linear scaling constants (`×0.001`, `×0.1`) whose calibration is not sourced to a real
   bunker-fuel-consumption or carbon-cost model (e.g. they do not derive from actual vessel fuel
   consumption in tonnes/day × voyage days × emission factor).
5. **Stranding-risk scatter**: `x=avgAgeYrs`, `y=carbonIntensity` — a plausible visual proxy for stranded-
   asset risk (older, higher-carbon-intensity vessels facing IMO 2030/2050 tightening are the most exposed),
   though `stranded2030Risk` itself is an independently `sr()`-seeded field, not computed from the
   age/intensity relationship shown in the scatter.

### 7.4 Worked example

Fleet with `carbonIntensity=12.4`, `fleetSize=18`, `carbonPrice=$75/tCO₂` (default slider):
`annualCarbonCost = 12.4 × 18 × 75 × 0.001 = 16.74` (units as coded — likely intended as $M, though the
scaling constant `0.001` is not derived from any stated unit conversion, e.g. gCO₂/dwt-nm → tCO₂/year would
require voyage-distance and deadweight inputs not present in this model).

For `eexi=14.2`, `fuelPrice=$600/tonne`: `fuelCostPerVessel = 600 × 14.2 × 0.1 = $852` (again, units
undocumented — the `×0.1` scaling constant has no stated derivation).

### 7.5 Companion analytics on the page

- **CII Ratings / Fuel Transition / EEXI Compliance tabs** — descriptive distributions of the fleet's
  regulatory-compliance posture.
- **Retrofit Economics tab** — `retrofitByType` sums `retrofitCapex` by ship type, useful for prioritising
  which vessel category needs the most capital.
- **Green Fuel Pathways / IMO Alignment / Stranding Risk tabs** — descriptive views of
  `greenFuelReadiness`/`imoAligned`/`stranded2030Risk`, all independently `sr()`-seeded fields.

### 7.6 Data provenance & limitations

- **All 60 fleets and every numeric field are synthetic**, generated via `sr(seed)=frac(sin(seed+1)×10⁴)`;
  fleet names blend real shipping-line naming conventions with invented vessel names.
- **Carbon-cost and fuel-cost formulas use unsourced scaling constants** (`×0.001`, `×0.1`) rather than a
  physically-derived unit conversion chain (fuel consumption tonnes/day → voyage distance → CO₂ emission
  factor → carbon price) — treat the calculator's dollar outputs as illustrative order-of-magnitude, not
  audit-ready cost estimates.
- `avgCII`'s letter-to-ordinal conversion treats the 5-band CII scale as evenly spaced, which understates
  how much worse an "E" rating is in practice relative to "D" under IMO's actual (non-linear, vessel-type-
  specific) CII boundary methodology.
- `stranded2030Risk` is independently random rather than derived from the fleet's own age, CII rating, and
  green-fuel-readiness fields shown elsewhere on the page — a production stranding-risk model should
  compute this as a function of those inputs.

**Framework alignment:** IMO Carbon Intensity Indicator (CII) — the A–E letter-grade system and its
year-over-year tightening trajectory (referenced conceptually) matches the actual IMO MEPC 79/80
regulation, effective 2023 · IMO EEXI (Energy Efficiency Existing Ship Index) — real, mandatory metric name
correctly referenced, though not certified-calculation-grade here · the 5 alternative marine fuel types
(HFO as baseline, LNG, Methanol, Ammonia, Hybrid) reflect the actual current shipping-fuel transition
landscape as tracked by DNV's Alternative Fuels Insight platform and IMO's GHG strategy.

## 9 · Future Evolution

### 9.1 Evolution A — Physically-derived cost chain and endogenous stranding risk (analytics ladder: rung 1 → 2)

**What.** The page's calculator already has scenario levers (carbon-price and fuel-price sliders) but §7.6 shows the math under them is not physical: `annualCarbonCost = carbonIntensity × fleetSize × carbonPrice × 0.001` and `fuelCostPerVessel = fuelPrice × eexi × 0.1` use unsourced scaling constants instead of a unit-consistent chain, `avgCII` treats the A–E scale as evenly spaced (IMO's real bands are non-linear and vessel-type-specific), and `stranded2030Risk` is an independent random draw despite the fleet's age, CII rating, and green-fuel-readiness sitting in the same record. Evolution A rebuilds the calculator on the physical chain and makes stranding risk a function of the module's own fields.

**How.** (1) Cost chain: fuel consumption (t/day, per ship type) × sailing days × fuel EF (tCO₂/t fuel, per `FUEL_TYPES`) → annual tCO₂ × carbon price; fuel cost = consumption × $/t. The sibling module `shipping-decarbonization-finance` already implements the genuine IMO CII formula (`attainedAER/referenceAER×100` per MEPC.354(78)) — port it here and replace the ordinal-average `avgCII` with reference-line ratios. (2) `stranded2030Risk = f(CII rating trajectory under the tightening Z-factor, fuel type, greenFuelReadiness)` — deterministic, explainable, and testable. (3) Keep the sliders; add IMO-strategy scenario presets (2030 checkpoint, 2040 indicative, levy on/off).

**Prerequisites.** Per-ship-type consumption and EF reference rows (DNV/IMO Fourth GHG Study values, citable); coordination with the sibling to share the CII helper rather than fork it. **Acceptance:** carbon-cost output is reproducible by hand from the stated unit chain; two fleets identical except CII rating get different stranding risk.

### 9.2 Evolution B — Fleet-transition copilot for ship-finance teams (LLM tier 1)

**What.** A copilot answering the Poseidon Principles questions this page is aimed at: "why is this fleet's CII trajectory misaligned?", "what does a $150 levy do to my tanker book?", "which retrofit options move a D-rated fleet to C?" — grounded in the page's computed state (post-Evolution-A: real CII ratios, derived stranding risk, scenario outputs) and this Atlas record's framework notes (IMO MEPC 79/80, EEXI, the five fuel pathways).

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/shipping-decarbonisation/ask`, corpus = this Atlas page plus live calculator state. What-if requests re-run the deterministic calculator with the requested slider values and narrate the delta — the LLM changes inputs, never invents outputs. Retrofit suggestions are constrained to the `FUEL_TYPES`/readiness options the page models, with a refusal for vessel classes outside the six ship types covered.

**Prerequisites.** Evolution A's honest unit chain — narrating the current `×0.001`-scaled dollar figures would dignify order-of-magnitude placeholders as costings. **Acceptance:** every dollar figure in an answer matches a calculator run reproducible from the stated inputs; asking about a vessel type not in `SHIP_TYPES` yields a scoped refusal.