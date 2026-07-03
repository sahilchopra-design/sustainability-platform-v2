# Systemic Climate Risk
**Module ID:** `systemic-climate-risk` · **Route:** `/systemic-climate-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
System-wide climate risk contagion analytics modelling cascading transmission of physical and transition climate shocks across financial sectors, geographies and macroeconomic channels.

> **Business value:** The NGFS estimates disorderly transition could reduce global GDP by 4–5% through systemic financial channels; second-round amplification effects can triple direct sectoral losses.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AMPLIFIER_CHANNELS`, `CB_DOMAINS`, `CB_INDICATORS`, `CROSS_BORDER_MATRIX`, `FSOC_EW`, `KpiCard`, `MACRO_TOOLS`, `MC_SYSTEMIC_LOSSES`, `NETWORK`, `NGFS_SCENARIOS`, `REGIONS`, `SCENARIO_SECTOR_RISK`, `SCENARIO_SERIES`, `SECTORS`, `SECTOR_NAMES`, `SectionTitle`, `Swatch`, `TABS`, `TIME_POINTS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SECTORS` | `SECTOR_NAMES.map((name, i) => ({` |
| `NETWORK` | `SECTORS.map((_, i) =>` |
| `SCENARIO_SERIES` | `NGFS_SCENARIOS.map(sc =>` |
| `SCENARIO_SECTOR_RISK` | `NGFS_SCENARIOS.map((sc, si) =>` |
| `CB_DOMAINS` | `['All', ...Array.from(new Set(CB_INDICATORS.map(x => x.domain)))];` |
| `CROSS_BORDER_MATRIX` | `REGIONS.map((_, i) =>` |
| `base` | `5 + sr(i * 3 + 7) * 40;` |
| `fatTail` | `sr(i * 3 + 8) > 0.92 ? sr(i * 3 + 9) * 60 : 0;` |
| `totalW` | `SECTORS.reduce((s, x) => s + x.gdpWeight, 0);` |
| `scores` | `AMPLIFIER_CHANNELS.map((ch, ci) => ch.baseScore * ampIntensity[ci]);` |
| `avg` | `scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length);` |
| `domains` | `Array.from(new Set(CB_INDICATORS.map(x => x.domain)));` |
| `avg` | `inds.length ? inds.reduce((s, x) => s + x.value, 0) / inds.length : 0;` |
| `delta` | `toolLevels[i] - t.currentLevel;` |
| `gdpImpact` | `+(t.gdpImpactPerUnit * delta).toFixed(3);` |
| `creditImpact` | `+(t.creditImpactPerUnit * delta).toFixed(3);` |
| `riskReduction` | `+(t.riskReductionPerUnit * Math.abs(delta)).toFixed(2);` |
| `bins` | `Array.from({ length: 20 }, (_, i) => ({ bin: `${i * 5}-${(i + 1) * 5}`, count: 0 }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AMPLIFIER_CHANNELS`, `CB_DOMAINS`, `CB_INDICATORS`, `FSOC_EW`, `MACRO_TOOLS`, `NGFS_SCENARIOS`, `REGIONS`, `SECTOR_NAMES`, `TABS`, `TIME_POINTS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| System Stress Level | — | CCI Engine | Composite systemic stress indicator under 2°C disorderly transition scenario. |
| Most Exposed Sector | — | Contagion Model | Sector with highest combined direct and indirect climate risk after contagion propagation. |
| Second-Round Amplification | — | Network Model | Multiplier reflecting how initial sectoral shocks are amplified through financial network linkages. |
- **Sectoral Balance Sheets, Interbank Exposure Data, NGFS Scenario Pathways** → Contagion matrix construction + iterative shock propagation + stability analysis → **Systemic risk dashboard, contagion heatmap, macroprudential policy briefs**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Contagion Index
**Headline formula:** `CCI = Σ (Sector Shockᵢ × Contagion Matrixᵢⱼ) / N`
**Standards:** ['BIS CGFS 2021', 'NGFS Systemic Risk Report 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).