# Climate Benchmark Constructor
**Module ID:** `climate-benchmark-constructor` · **Route:** `/climate-benchmark-constructor` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Custom climate index and benchmark construction engine aligned with EU Climate Benchmarks Regulation (EU 2019/2089). Builds Paris-Aligned Benchmarks (PAB) and Climate Transition Benchmarks (CTB) with WACI reduction, fossil fuel exclusions, and green revenue tilts.

> **Business value:** PAB requires ≥50% WACI reduction vs parent at inception, then 7%/yr minimum. CTB requires ≥30% then 7%/yr. Fossil fuel revenue thresholds: >1% coal or >10% oil/gas triggers PAB exclusion.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CB_SECTORS`, `EU_BMR_RULES`, `KpiCard`, `PARENT_INDICES`, `TABS`, `UNIVERSE`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sec` | `CB_SECTORS[Math.floor(sr(i * 7 + 1) * CB_SECTORS.length)];` |
| `parent` | `PARENT_INDICES[Math.floor(sr(i * 11 + 2) * PARENT_INDICES.length)];` |
| `tot` | `subs.reduce((s, x) => s + x.weight_parent, 0);` |
| `parentAvgCI` | `useMemo(() => parentConstituents.length ? parentConstituents.reduce((s, x) => s + x.weight_norm * x.carbonIntensity, 0) : 0, [parentConstituents]);` |
| `targetCI` | `parentAvgCI * (1 - carbonReduction / 100);` |
| `benchmarkAvgCI` | `useMemo(() => benchmarkConstituents.length ? benchmarkConstituents.reduce((s, x) => s + x.benchWeight * x.carbonIntensity, 0) : 0, [benchmarkConstitue` |
| `actualReduction` | `useMemo(() => parentAvgCI > 0 ? (1 - benchmarkAvgCI / parentAvgCI) * 100 : 0, [parentAvgCI, benchmarkAvgCI]);` |
| `bmkVol` | `Math.sqrt(benchmarkConstituents.reduce((s, x) => s + Math.pow(x.benchWeight * (0.08 + sr(x.id * 7 + 1) * 0.2), 2), 0));` |
| `parVol` | `Math.sqrt(parentConstituents.reduce((s, x) => s + Math.pow(x.weight_norm * (0.08 + sr(x.id * 7 + 1) * 0.2), 2), 0));` |
| `greenYield` | `sr(i * 11 + 3) * 0.04 + 0.02;` |
| `brownYield` | `greenYield + (sr(i * 17 + 5) * 0.003 - 0.0015);` |
| `step3` | `step2 - (excludeControversy ? parentConstituents.filter(s => s.esgScore >= esgMin && s.controversyFlag).length : 0);` |
| `pCI` | `pW > 0 ? pSubs.reduce((s, x) => s + (x.weight_norm / pW) * x.carbonIntensity, 0) : 0;` |
| `bCI` | `bW > 0 ? bSubs.reduce((s, x) => s + (x.benchWeight / bW) * x.carbonIntensity, 0) : 0;` |
| `tot` | `subs.reduce((s, x) => s + x.weight_norm, 0);` |
| `taxPct` | `sh.filter(s => s.taxonomyAligned).length / sh.length * 100;` |
| `parisPct` | `sh.filter(s => s.parisAligned).length / sh.length * 100;` |
| `cleanPct` | `sh.filter(s => !s.controversyFlag).length / sh.length * 100;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CB_SECTORS`, `EU_BMR_RULES`, `PARENT_INDICES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| PAB WACI Reduction | `Σ(w_i×CI_i) / Σ(w_parent×CI_parent)` | EU 2019/2089 | Minimum weighted average carbon intensity reduction vs parent benchmark |
| Annual Decarbonisation Rate | `Year-on-year WACI reduction` | EU PAB standard | Required annual reduction in benchmark carbon intensity |
| Fossil Fuel Exclusion Threshold | `Revenue screen` | EU PAB Technical Standards | Revenue thresholds triggering exclusion from PAB universe |
| Green Revenue Tilt | `Company taxonomy screening` | EU Taxonomy Regulation | Upweight factor based on EU Taxonomy-aligned revenue fraction |
- **Parent index constituents** → Holdings → CI data → WACI → **Parent benchmark WACI**
- **EU Taxonomy database** → Company-level aligned revenue → tilt factors → **Green revenue upweights**

## 5 · Intermediate Transformation Logic
**Methodology:** EU PAB/CTB construction with WACI constraint
**Headline formula:** `w_i = w_parent_i × TiltFactor_i; WACI_bench = Σ(w_i × CI_i) ≤ 0.50 × WACI_parent (PAB)`
**Standards:** ['EU Climate Benchmarks Regulation 2019/2089', 'EBA PAB/CTB Technical Standards', 'MSCI Climate Benchmark Methodology', 'GHG Protocol Scope 1+2+3']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).