# Renewable Energy LCA and EPD Analytics
**Module ID:** `renewable-lca-epd` · **Route:** `/renewable-lca-epd` · **Tier:** B (frontend-computed) · **EP code:** EP-CrossSprint · **Sprint:** Cross-Sprint

## 1 · Overview
Lifecycle assessment and Environmental Product Declaration analytics for renewable energy technologies covering carbon footprint by technology, ISO 14040/44 compliance, carbon payback period and EPD database integration.

> **Business value:** Renewable energy lifecycle carbon intensities are 10-100× lower than fossil fuels: solar PV 20-50 gCO2e/kWh, wind 7-15, nuclear 4-12 versus gas 400-490 and coal 800-1050; carbon payback periods of 0.5-4 years confirm strong climate benefit over 25-30 year project lifetimes per NREL and JRC harmonised LCA data.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUNTRIES`, `DEFAULTS`, `DEPLOY_COUNTRIES`, `EOL_MULT`, `TRANSPORT_MODES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `bomRows` | `useMemo(() => s.bom.map(b => ({ ...b, ef: EF_LIB[b.material] \|\| 0, kgCO2: (EF_LIB[b.material] \|\| 0) * b.kgPerKw })), [s.bom]);` |
| `bomKgCO2` | `bomRows.reduce((x, r) => x + r.kgCO2, 0);` |
| `mfgKgCO2` | `s.mfgElec * s.gridEF;` |
| `totalBomKg` | `bomRows.reduce((x, r) => x + r.kgPerKw, 0);` |
| `transKgCO2` | `(totalBomKg / 1000) * transDist * transEf;` |
| `cradleToGate` | `bomKgCO2 + mfgKgCO2 + transKgCO2;` |
| `moduleKgCO2PerKw` | `cradleToGate * eolMult;` |
| `assetRows` | `useMemo(() => s.assets.map(a => {` |
| `lifetimeKwh` | `a.mw * 1000 * a.yieldKwhPerKw * s.lifetimeYears * (1 - a.degPct / 100 * s.lifetimeYears / 2);` |
| `totalKgCO2` | `moduleKgCO2PerKw * a.mw * 1000;` |
| `gco2PerKwh` | `lifetimeKwh > 0 ? (totalKgCO2 * 1000) / lifetimeKwh : 0;` |
| `embodiedKwh` | `s.mfgElec * a.mw * 1000;` |
| `annualKwh` | `a.mw * 1000 * a.yieldKwhPerKw;` |
| `epbtYrs` | `annualKwh > 0 ? embodiedKwh / annualKwh : 0;` |
| `totalMwPortfolio` | `Math.max(1, assetRows.reduce((x, r) => x + r.mw, 0));` |
| `wtdGco2` | `assetRows.reduce((x, r) => x + r.gco2PerKwh * r.mw, 0) / totalMwPortfolio;` |
| `wtdEpbt` | `assetRows.reduce((x, r) => x + r.epbtYrs * r.mw, 0) / totalMwPortfolio;` |
| `bestPeer` | `Math.min(...s.peers.map(p => p.gco2PerKwh));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DEPLOY_COUNTRIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Solar PV Carbon Intensity | `LCA boundary: Si purification through decommissioning` | NREL Harmonised LCA 2021 | Variation driven by grid mix for manufacturing (c-Si monocrystalline lower than polycrystalline); improving wi |
| Wind Carbon Intensity | `LCA: steel + concrete + blades + installation + O&M` | JRC 2021 | Onshore wind 7-11 gCO2e/kWh; offshore 8-15 gCO2e/kWh due to marine installation and cable; tower material domi |
| Carbon Payback Period | `CPP = Manufacturing_CO2 / Annual_CO2_displacement` | Ecoinvent 3.9 / NREL 2022 | Solar PV CPP 1-4yr depending on irradiation and grid mix displaced; wind CPP 0.5-1yr; nuclear CPP 1-2yr includ |
- **Ecoinvent database** → → LCA model → **Background process emissions by region**
- **NREL LCA Harmonisation** → → technology benchmarks → **gCO2e/kWh by technology and year**

## 5 · Intermediate Transformation Logic
**Methodology:** Lifecycle Carbon Intensity
**Headline formula:** `LCA_CI(gCO2e/kWh) = Σ(lifecycle_stage_emissions) / Total_lifetime_generation`
**Standards:** ['ISO 14040:2006 LCA Principles', 'ISO 14044:2006 LCA Requirements', 'JRC Science for Policy: LCA of Electricity Generation']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `AdvisoryReference`, `AdvisoryToolkit`