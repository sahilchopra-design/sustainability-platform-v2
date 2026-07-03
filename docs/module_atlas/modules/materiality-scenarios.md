# Materiality Scenarios
**Module ID:** `materiality-scenarios` · **Route:** `/materiality-scenarios` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Forward-looking materiality assessment engine that evaluates how ESG topic materiality evolves under different regulatory, market, and climate scenarios. Integrates CSRD double materiality, ISSB financial materiality, and SASB sector standards with scenario-specific impact and likelihood adjustments. Enables dynamic materiality mapping that anticipates regulatory shifts and stakeholder expectation changes over 5–10 year horizons.

> **Business value:** Enables sustainability managers and auditors to build defensible, forward-looking materiality assessments that anticipate regulatory change and satisfy CSRD ESRS 1 and ISSB S1 requirements for dynamic, scenario-informed topic selection.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ESRS_TOPICS`, `KpiCard`, `LS_KEY_CUSTOM`, `LS_KEY_PORTFOLIO`, `MATERIALITY_SCENARIOS`, `MATERIAL_THRESHOLD`, `MaterialityScenariosPage`, `NavBtn`, `Pill`, `SECTORS`, `SECTOR_WEIGHTS`, `Section`, `SortableTable`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `hashStr` | `s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) \| 0, 0);` |
| `seededRandom` | `seed => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };` |
| `delta` | `Math.abs((scores[t.id]?.financial \|\| 0) - baseline[t.id].financial);` |
| `portfolioImpact` | `(reclassCount * 2.3 + newMaterial * 3.1).toFixed(1);` |
| `mostAffected` | `Object.entries(sectorVulnerability).sort((a, b) => b[1] - a[1])[0];` |
| `scatterBaseline` | `useMemo(() => ESRS_TOPICS.map(t => ({ ...t, x: baseline[t.id].financial, y: baseline[t.id].impact, cls: classify(baseline[t.id].financial, baseline[t.` |
| `topTopic` | `ESRS_TOPICS[Math.abs(seed) % ESRS_TOPICS.length];` |
| `sector` | `c.sector \|\| SECTORS[Math.abs(seed) % SECTORS.length];` |
| `materialityShift` | `Math.round(adj * (0.6 + sr(seed, 3) * 0.8));` |
| `csv` | `[keys.join(','), ...data.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `blob` | `new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });` |
| `blob` | `new Blob([md], { type: 'text/markdown' });` |
| `newFin` | `Math.min(100, Math.max(0, baseline[t.id].financial + adj));` |
| `newCls` | `classify(newFin, Math.min(100, Math.max(0, baseline[t.id].impact + Math.round(adj * 0.8))));` |
| `expected` | `Math.round(MATERIALITY_SCENARIOS.reduce((s, sc, i) => {` |
| `expectedCls` | `classify(expected, Math.round(expected * 0.85));` |
| `gap` | `MATERIAL_THRESHOLD - baseline[t.id].financial;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ESRS_TOPICS`, `MATERIALITY_SCENARIOS`, `SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Topics Above Materiality Threshold (%) | — | Scenario-adjusted DMA output | Share of assessed ESG topics meeting materiality threshold in the analysis scenario |
| Regulatory Scenario Probability (%) | — | Expert elicitation / regulatory pipeline | Assigned probability of the regulatory scenario materialising within the assessment horizon |
| Materiality Score Variance (Δ) | — | Cross-scenario comparison | Absolute difference in materiality score for a topic between the base and the most adverse scenario |
| Topic Emergence Lead Time (yrs) | — | Trend extrapolation model | Estimated years until a currently sub-threshold topic crosses the materiality threshold under the trend scenar |
- **Prior DMA stakeholder survey results** → Score topics on impact significance and financial significance scales; apply ESRS 1 thresholds → **Base-year materiality assessment matrix**
- **Regulatory scenario pipeline database** → Assign probability and impact adjustment to each pending regulation per scenario → **Scenario-specific ΔLikelihood and ΔImpact per regulatory topic**
- **SASB sector materiality benchmarks** → Cross-reference entity sector against SASB peer materiality consensus; adjust priors → **Sector-informed base materiality priors for scenario adjustment calibration**

## 5 · Intermediate Transformation Logic
**Methodology:** Scenario-Adjusted Materiality Score
**Headline formula:** `SMSᵢₛ = Materialityᵢ × (1 + ΔLikelihoodᵢₛ + ΔImpactᵢₛ)`
**Standards:** ['CSRD ESRS 1 Double Materiality Standard 2023', 'ISSB IFRS S1 Materiality Guidance 2023', 'SASB Materiality Map 2023', 'TCFD Scenario Analysis Guidance 2021']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).