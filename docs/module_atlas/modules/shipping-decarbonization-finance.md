# Shipping Decarbonisation Finance Analytics
**Module ID:** `shipping-decarbonization-finance` · **Route:** `/shipping-decarbonization-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DZ4 · **Sprint:** DZ

## 1 · Overview
Shipping decarbonisation finance analytics covering Poseidon Principles alignment, CII rating, IMO GHG Strategy carbon levy, alternative fuel investment (methanol, ammonia, LNG), and OPEX/CAPEX trade-off modelling.

> **Business value:** Delivers shipping decarbonisation investment analytics integrating Poseidon Principles alignment, IMO carbon levy exposure, and alternative fuel CAPEX/OPEX modelling to guide fleet transition financing.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALT_FUELS`, `CII_TRANSITION`, `FINANCE_INSTRUMENTS`, `FLEET_SEGMENTS`, `IMO_TRAJECTORY`, `Kpi`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Overview', 'Fleet Segments', 'Alternative Fuels', 'IMO 2050 Trajectory', 'CII/EEXI Compliance', 'Finance Instruments', 'Retrofit Calculator', 'Posei` |
| `totalSaving` | `annFuelSaving + carbonPriceSaving;` |
| `carbonPriceSaving` | `calcCarbonLevy({ co2Tonnes: vesselCo2 * 0.3, levyPerTonne: carbonPrice }) / 1e6;` |
| `payback` | `calcRetrofitPayback({ vesselValue: seg.transitionCapex * 0.6, retrofitCost: retrofitCapex, annFuelSaving, carbonPriceSaving });` |
| `totalFleetCo2` | `FLEET_SEGMENTS.reduce((s, f) => s + f.co2MtYear, 0);` |
| `avgEexiCompliance` | `FLEET_SEGMENTS.length > 0 ? FLEET_SEGMENTS.reduce((s, f) => s + f.eexiCompliant, 0) / FLEET_SEGMENTS.length : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALT_FUELS`, `CII_TRANSITION`, `FINANCE_INSTRUMENTS`, `FLEET_SEGMENTS`, `IMO_TRAJECTORY`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Poseidon Principles Alignment Score | `Vessel AER vs Poseidon Principles climate trajectory for vessel type (% above/below)` | Poseidon Principles annual alignment report | Negative = above trajectory (worse); aligned banks require fleets to converge to 0% by 2050; ESRS disclosure r |
| CII Rating | `Carbon Intensity Indicator annual rating (A-E) vs IMO reference line` | IMO MEPC.354(78) CII guidelines | D or E rating for 3 consecutive years triggers corrective action plan; lenders increasingly requiring B or bet |
| Alternative Fuel CapEx Premium | `Incremental cost of methanol-ready dual-fuel newbuild vs conventional` | Clarkson Research / DNV fuel-ready ship cost data | Ammonia $25-35M premium; LNG $8-15M; methanol $15-25M; fuel availability and price spread determine payback pe |
- **IMO GISIS ship registry and CII data** → Vessel DWT, type, fuel consumption, voyage data → CII calculation → **Fleet alignment and CII ratings**
- **Poseidon Principles annual alignment reports** → Trajectory benchmarks by vessel type and year → alignment gap calculation → **Lender disclosure and portfolio alignment score**
- **DNV / Clarksons fuel price scenarios** → Alternative fuel cost projections (methanol, ammonia, green hydrogen) → NPV sensitivity → **Fuel switching investment case**

## 5 · Intermediate Transformation Logic
**Methodology:** Shipping Decarbonisation Investment Analytics
**Headline formula:** `CII Score = AER or cgDIST / Reference Line; Decarbonisation CAPEX NPV = ΔFuel Cost × OPEX Savings - Retrofit CAPEX + Carbon Levy Avoidance`
**Standards:** ['IMO GHG Strategy 2023 (MEPC 80)', 'Poseidon Principles v3.0 — Ship Finance Alignment', 'SEA-LNG / Ammonia Energy Association fuel cost benchmarks']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).