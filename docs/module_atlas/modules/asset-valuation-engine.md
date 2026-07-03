# Asset Valuation Engine
**Module ID:** `asset-valuation-engine` · **Route:** `/asset-valuation-engine` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Climate-adjusted DCF and NAV engine incorporating stranded asset write-downs, transition risk premiums in WACC, and physical risk-adjusted terminal values. Supports 5 NGFS scenarios across 8 asset classes and generates regulatory-grade IFRS 13 fair value disclosures. Integrates carbon price trajectories, energy transition capex, and stranded asset half-life models.

> **Business value:** Climate-adjusted valuation is increasingly required for IFRS 13 fair value disclosures as regulators expect material climate assumptions to be incorporated into goodwill impairment tests and investment property valuations. The engine provides auditable scenario-weighted NAVs that withstand scrutiny from external auditors and climate disclosure assurance providers.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACQUIRERS`, `COMPS_DATA`, `COMP_NAMES`, `SECTORS`, `SECTOR_COLORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `call` | `S * normCDF(d1) - K * Math.exp(-r * Tm) * normCDF(d2);` |
| `put` | `K * Math.exp(-r * Tm) * normCDF(-d2) - S * normCDF(-d1);` |
| `gamma` | `Math.exp(-d1 * d1 / 2) / (S * sigma * Math.sqrt(Tm) * Math.sqrt(2 * Math.PI));` |
| `vega` | `S * Math.exp(-d1 * d1 / 2) * Math.sqrt(Tm) / Math.sqrt(2 * Math.PI);` |
| `theta` | `-(S * Math.exp(-d1 * d1 / 2) * sigma) / (2 * Math.sqrt(Tm)) - r * K * Math.exp(-r * Tm) * normCDF(d2);` |
| `cpInterp` | `inputs.carbonPrice2030 + (inputs.carbonPrice2050 - inputs.carbonPrice2030) * (yr / inputs.projYears);` |
| `carbonCost` | `rev * (inputs.emissionsIntensity / 1000) * cpInterp / 1000;` |
| `adaptCost` | `rev * 0.003 * (yr / inputs.projYears);` |
| `ebitda` | `rev * (inputs.opMargin / 100) - carbonCost - physRisk - adaptCost;` |
| `tax` | `Math.max(0, ebitda * inputs.taxRate / 100);` |
| `fcf` | `(ebitda - tax) - rev * 0.05;` |
| `lastFCF` | `cashFlows[cashFlows.length - 1].fcf;` |
| `pvTV` | `tv / Math.pow(1 + dr, inputs.projYears);` |
| `sectorIdx` | `Math.floor(sr(i * 3 + 1) * SECTORS.length);` |
| `waccVals` | `[dcfInputs.wacc - 2, dcfInputs.wacc, dcfInputs.wacc + 2];` |
| `tgVals` | `[dcfInputs.terminalGrowth - 1, dcfInputs.terminalGrowth, dcfInputs.terminalGrowth + 1];` |
| `revShock` | `0.85 + sr(i * 7 + 1) * 0.3;` |
| `cpShock` | `0.6 + sr(i * 13 + 2) * 0.8;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ACQUIRERS`, `COMP_NAMES`, `SECTORS`, `SECTOR_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate-Adjusted NAV | `Σ(FCF_t / (1+WACC_adj)^t) – Stranded` | DCF model | Net asset value after applying transition risk premium and stranded write-downs |
| Transition Risk Premium | `β_transition × RP_carbon` | Market calibration | Additional WACC component reflecting carbon price and policy risk exposure |
| Physical Risk Terminal Value Haircut | `Scenario damage function` | NGFS/IPCC | Reduction in terminal value due to chronic and acute physical climate risk |
- **NGFS carbon price and macro scenario data** → Overlay carbon cost trajectories on company FCF projections; adjust WACC by carbon beta → **Climate-adjusted NAV per asset under 5 scenarios with sensitivity ranges**
- **Physical hazard models (IPCC/RMS)** → Apply damage functions to terminal value by asset location and hazard type → **Physical risk terminal value haircuts and scenario-weighted expected NAV**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-adjusted DCF with transition risk WACC
**Headline formula:** `NAV_climate = Σ_t[FCF_t / (1+WACC_adj)^t] – StrandedWriteDown; WACC_adj = WACC_base + β_transition × RP_carbon`
**Standards:** ['NGFS Phase 5', 'IFRS 13 Fair Value', 'IASB Climate Commitments']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).