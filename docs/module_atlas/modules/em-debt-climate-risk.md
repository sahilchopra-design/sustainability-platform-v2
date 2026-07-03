# EM Debt Climate Risk
**Module ID:** `em-debt-climate-risk` · **Route:** `/em-debt-climate-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Prices climate transition and physical risk into emerging market sovereign and corporate debt spreads. Integrates NGFS scenario pathways with country-level vulnerability indices and issuer-level carbon intensity to derive climate-adjusted credit spreads. Supports portfolio construction, relative value analysis, and regulatory stress testing across EM fixed income universes.

> **Business value:** Enables fixed income portfolio managers to identify climate-mispriced EM debt, tilt allocations toward NDC-aligned issuers, and satisfy TCFD Pillar 2 disclosure requirements for climate risk in investment portfolios.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CustomTooltip`, `DNS_DEALS`, `EM_COUNTRIES`, `GREEN_BOND_ISSUANCES`, `KpiCard`, `RATING_COLORS`, `REGION_COLORS`, `SPREAD_COLORS`, `SPREAD_DATA`, `SectionHeader`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `["Overview","Debt Sustainability","Green Bond Market","Debt-for-Nature Swaps","Sovereign Credit Risk","Transition Finance","Country Profiles"];` |
| `dir` | `sortDir === "asc" ? 1 : -1;` |
| `scatterData` | `useMemo(() => EM_COUNTRIES.map(c => ({` |
| `totalGreenBonds` | `EM_COUNTRIES.reduce((s,c) => s+c.greenBondIssuedBnUSD, 0);` |
| `totalDNSMn` | `DNS_DEALS.reduce((s,d) => s+d.debtRelievedMnUSD, 0);` |
| `avgClimateRisk` | `(EM_COUNTRIES.reduce((s,c) => s+c.climateDebtRiskScore, 0)/ Math.max(1, EM_COUNTRIES.length)).toFixed(1);` |
| `totalNdcGap` | `EM_COUNTRIES.reduce((s,c) => s+c.ndcFinancingGapBnUSD, 0).toFixed(0);` |
| `totalCarbon` | `EM_COUNTRIES.reduce((s,c) => s+c.carbonRevenuePotentialBnUSD, 0).toFixed(0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DNS_DEALS`, `EM_COUNTRIES`, `GREEN_BOND_ISSUANCES`, `SPREAD_DATA`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate Risk Premium (bps) | — | NGFS/IMF | Incremental spread attributable to unpriced climate risk; high values signal mispriced sovereign paper. |
| NDC Alignment Score | — | UNFCCC NDC Registry | Measures issuer decarbonisation trajectory vs. Paris-compatible pathway; below 40 indicates high transition ri |
| Physical Vulnerability Index | — | ND-GAIN 2024 | Country-level composite of exposure, sensitivity, and adaptive capacity; above 0.7 triggers spread overlay. |
| Carbon Intensity (tCO2e/$M Rev) | — | Trucost/CDP | Corporate issuer emission intensity; benchmarked against sector median and 1.5Â°C budget ceiling. |
- **NGFS scenario database** → Map GDP and carbon price paths to country credit fundamentals → **Transition risk beta by country/sector**
- **ND-GAIN vulnerability scores** → Normalise to 0â€“1 scale and apply hazard-specific weights → **Physical risk premium overlay (bps)**
- **Issuer carbon intensity data (Trucost)** → Benchmark vs. sector 1.5Â°C budget; compute deviation → **Corporate climate spread adjustment**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-Adjusted Spread Model
**Headline formula:** `OAS_climate = OAS_base + β_trans × TransitionRisk + β_phys × PhysicalRisk`
**Standards:** ['NGFS Phase IV', 'TCFD', 'IMF Climate Spillovers 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).