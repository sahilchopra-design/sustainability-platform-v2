# Shipping Decarbonisation Finance
**Module ID:** `shipping-decarbonisation` · **Route:** `/shipping-decarbonisation` · **Tier:** B (frontend-computed) · **EP code:** EP-DJ1 · **Sprint:** DJ

## 1 · Overview
Models the financial pathways for decarbonising international shipping under IMO 2050 strategy — ammonia, methanol, hydrogen, LNG, and wind propulsion economics. Calculates fleet transition costs, carbon levy exposure, and green shipping corridor investment requirements.

> **Business value:** Directly applicable to shipping banks (Poseidon Principles signatories), shipping company CFOs planning fleet transition, and green bond issuers financing zero-emission vessels. Provides IMO CII compliance analytics and fuel transition investment economics for ship finance decisions.

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
**Standards:** ['IMO 2023 Strategy on GHG Reduction', 'Poseidon Principles Climate Alignment', 'Getting to Zero Coalition', 'UMAS/UCL Zero Emission Vessels 2021']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).