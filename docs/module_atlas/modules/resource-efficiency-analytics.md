# Resource Efficiency Analytics
**Module ID:** `resource-efficiency-analytics` · **Route:** `/resource-efficiency-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-DL4 · **Sprint:** DL

## 1 · Overview
Analyses corporate resource efficiency performance across energy, water, materials, and waste. Models resource productivity trends, efficiency investment ROI, and climate-resource nexus risks. Integrates EU Resource Efficiency Scoreboard, WBCSD metrics, and Science Based Targets for Nature.

> **Business value:** Directly applicable to corporate sustainability officers, industrial companies managing resource costs, and ESG analysts assessing operational efficiency. Provides SBTN nature target guidance and EU Resource Efficiency Scoreboard benchmarking for investor engagement and disclosure.

**How an analyst works this module:**
- Input company resource consumption data by type
- Calculate resource intensity vs sector benchmarks
- Model efficiency investment portfolio with ROI
- Assess SBTN freshwater and land target implications
- Generate EU Scoreboard-aligned resource efficiency report

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COMPANIES`, `COUNTRIES`, `EFFICIENCY_TIERS`, `KpiCard`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `EFFICIENCY_TIERS` | `['Laggard','Standard','Efficient','Best-in-Class'];` |
| `sector` | `SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];` |
| `country` | `COUNTRIES[Math.floor(sr(i * 11) * COUNTRIES.length)];` |
| `resourceEfficiencyScore` | `Math.round(20 + sr(i * 5) * 76);` |
| `avgScore` | `(filtered.reduce((s, c) => s + c.resourceEfficiencyScore, 0) / n).toFixed(1);` |
| `totalSavings` | `filtered.reduce((s, c) => s + c.resourceCostSavings, 0);` |
| `avgEnergyProd` | `(filtered.reduce((s, c) => s + c.energyProductivity, 0) / n).toFixed(1);` |
| `pctIso` | `((filtered.filter(c => c.iso50001).length / n) * 100).toFixed(0);` |
| `totalCapex` | `filtered.reduce((s, c) => s + c.efficiencyCapex, 0);` |
| `sectorEffData` | `SECTORS.map(sec => {` |
| `countryEnergyData` | `COUNTRIES.map(cn => {` |
| `sectorWaterData` | `SECTORS.map(sec => {` |
| `scatterData` | `filtered.map(c => ({ x: c.efficiencyCapex, y: c.resourceCostSavings, name: c.name }));` |
| `roiData` | `filtered.map(c => ({` |
| `avgWI` | `cs.length ? (cs.reduce((s, c) => s + c.wasteIntensity, 0) / cs.length).toFixed(1) : '0';` |
| `clr` | `tier === 'Best-in-Class' ? T.green : tier === 'Efficient' ? T.blue : tier === 'Standard' ? T.amber : T.red;` |
| `avgProd` | `cs.length ? (cs.reduce((s, c) => s + c.energyProductivity, 0) / cs.length).toFixed(1) : '0';` |
| `pct` | `n > 0 ? (cnt / n) * 100 : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `EFFICIENCY_TIERS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Resource Use | — | IRP Global Resources Outlook 2019 | Global material extraction 92 billion tonnes/yr — tripled since 1970, projected to double again by 2060 |
| Resource Productivity | — | EU Resource Efficiency Scoreboard 2023 | EU resource productivity at €2.4 GDP per kg domestic material consumption — improving 30% since 2000 |
| Industrial Symbiosis Savings | — | UNIDO Industrial Symbiosis 2023 | Industrial symbiosis (waste exchange between industries) reduces energy 20–40% and water 30–50% |
- **Energy and utility consumption data by site/process** → Resource intensity calculation → **Resource intensity by product, site, and category vs benchmark**
- **Efficiency project inventory with capex and savings** → ROI portfolio analysis → **Ranked efficiency investments by payback and IRR**
- **Water and material consumption + local stress data** → SBTN nature target assessment → **Resource use vs SBTN-defined local water/land boundaries**

## 5 · Intermediate Transformation Logic
**Methodology:** Resource Efficiency ROI
**Headline formula:** `EfficiencyROI = (ResourceSavings × ResourcePrice + CarbonSavings × CarbonPrice) / EfficiencyInvestment; ResourceIntensity = ResourceConsumption / RevenueOrProduction`

Resource intensity normalised by revenue tracks decoupling; efficiency ROI combines direct resource cost savings with carbon cost savings from reduced energy/material use

**Standards:** ['EU Resource Efficiency Scoreboard 2023', 'WBCSD Resource Productivity Framework', 'Ellen MacArthur Foundation Material Economics 2018', 'Science Based Targets for Nature (SBTN) 2023']
**Reference documents:** IRP — Global Resources Outlook 2019 (UNEP); EU Resource Efficiency Scoreboard 2023 — European Commission; WBCSD Resource Productivity — A Business Imperative; Science Based Targets for Nature (SBTN) Step 3 Guidance 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine states two formulas:
> `EfficiencyROI = (ResourceSavings × ResourcePrice + CarbonSavings × CarbonPrice) /
> EfficiencyInvestment` and `ResourceIntensity = ResourceConsumption / RevenueOrProduction`.
> **Neither is implemented as described.** There is no `revenue`, `production`, or `carbonPrice`
> field anywhere in the code (`grep revenue` returns nothing) — "resource intensity" as a
> revenue-normalised ratio does not exist on the page. The ROI actually computed is the simpler
> `roi = (resourceCostSavings / efficiencyCapex) × 100`, a single-term payback ratio with **no
> carbon-savings/carbon-price component** despite the guide's two-term formula.

### 7.1 What the module computes

70 synthetic companies, each with an independently seeded `resourceEfficiencyScore` (20–96) that
buckets into 4 tiers (`Laggard <35`, `Standard <55`, `Efficient <75`, `Best-in-Class ≥75`):

```
roi = efficiencyCapex > 0 ? (resourceCostSavings / efficiencyCapex) × 100 : 0
avgScore   = Σ resourceEfficiencyScore / n
totalSavings = Σ resourceCostSavings
pctIso50001  = (companies with iso50001=true / n) × 100
```

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `resourceEfficiencyScore` | 20–96 | Synthetic demo |
| `wasteIntensity` | 2.0–50.0 (t/$M, implied) | Synthetic demo |
| `energyProductivity` | 5.0–60.0% (5yr improvement, implied) | Synthetic demo |
| `iso50001` | boolean, `sr(i×31) > 0.45` → ~55% certified | Synthetic demo |
| `efficiencyCapex` | $1–100M | Synthetic demo |
| `resourceCostSavings` | $0.5–50M | Synthetic demo, independently seeded from `efficiencyCapex` — i.e. a company can show savings exceeding its own capex (ROI > 100%) purely by chance, not because of a modelled payback relationship |
| Tier thresholds (35/55/75) | — | Author-chosen breakpoints, not calibrated to any published resource-productivity benchmark |

### 7.3 Calculation walkthrough

1. `COMPANIES` (70 rows) built once at load; all fields independently seeded via `sr(i×k)`.
2. `filtered` subsets by sector/country/tier selectors; all KPI aggregates (`avgScore`,
   `totalSavings`, `avgEnergyProd`, `pctIso`, `totalCapex`) recompute over the filtered set.
3. `sectorEffData`/`countryEnergyData`/`sectorWaterData` are per-sector or per-country group-by
   means of `resourceEfficiencyScore`, `energyProductivity`, and `wasteIntensity` respectively.
4. `scatterData` plots `efficiencyCapex` (x) vs `resourceCostSavings` (y) per company — the
   "efficiency ROI" scatter the guide describes, but since both axes are independent PRNG draws,
   any visible trend line would be spurious.
5. `roiData` computes the per-company single-term ROI ratio (§7.1) and ranks companies by it.

### 7.4 Worked example

Company with `efficiencyCapex = $42M`, `resourceCostSavings = $18M`:
`roi = (18/42) × 100 = 42.9%` — i.e. the company recovers 43% of its efficiency investment in
**cost savings alone** (not annualised — the code does not specify a payback period, so this ratio
cannot be read as an annual return or IRR without an implicit assumption about the savings horizon
that the page never states).

### 7.5 Companion analytics

- **Efficiency tier distribution** — count of companies per `EFFICIENCY_TIERS` bucket
  (Laggard/Standard/Efficient/Best-in-Class), coloured `T.red/T.amber/T.blue/T.green`.
- **Sector/country cuts** — mean score, energy productivity, and waste intensity by `SECTORS` and
  `COUNTRIES` group-bys.
- **ISO 50001 certification split** — mean `energyProductivity` compared between certified and
  non-certified companies (`avgProd` by `iso50001` boolean) — the one comparison on the page that
  tests a real qualitative hypothesis (does certification correlate with productivity), though
  still against synthetic underlying data.

### 7.6 Data provenance & limitations

- All 70 companies and every numeric field are synthetic, seeded via `sr()`; no field is derived
  from another (score, waste intensity, capex, and savings are all independently drawn), so
  cross-field relationships shown in scatter/bar charts (capex vs savings, ISO cert vs
  productivity) are illustrative only and not evidence of any real efficiency-investment payoff.
- The guide's two-term ROI formula (resource savings + carbon savings, both priced) and the
  revenue-normalised resource-intensity metric are **not implemented** — a user cannot get a
  genuine "$ saved per $ invested including the carbon value of avoided energy/material use" from
  this page.
- `roi` as computed conflates a cumulative-to-date savings figure with an investment amount without
  specifying a time horizon, so it cannot be compared like-for-like across companies with different
  project vintages.

**Framework alignment:** EU Resource Efficiency Scoreboard 2023 (cited for the resource-
productivity concept, not implemented as a €GDP/kg-materials calculation) · WBCSD Resource
Productivity Framework (referenced qualitatively) · IRP Global Resources Outlook 2019 (context
figures only, not wired into any calculation) · SBTN Step 3 land/water guidance (named in
references, no SBTN target-gap logic present in code).

## 9 · Future Evolution

### 9.1 Evolution A — Time-normalised two-term ROI on entered consumption data (analytics ladder: rung 1 → 2)

**What.** §7 documents the gaps: no revenue/production field exists, so the guide's `ResourceIntensity = Consumption / Revenue` is uncomputable; the ROI drops the guide's carbon-savings term (`roi = savings/capex` only) and, worse, conflates cumulative savings with a point investment with no time horizon — non-comparable across project vintages (§7.6); and all 70 companies are independently seeded, so the capex-vs-savings scatter shows no real relationship. Evolution A implements the module's own workflow claim ("input company resource consumption data") with the two-term, time-normalised economics.

**How.** (1) Intake: per-entity annual consumption by resource type (energy MWh, water m³, materials t, waste t) plus revenue/production — the fields the intensity ratio needs; a `resource_efficiency_entries` table with period keys. (2) `POST /api/v1/resource-efficiency/roi`: annualised two-term ROI — `(annual resource savings × price + annual CO₂ savings × carbon price) / capex`, with resource prices from refdata (energy/water benchmarks) and the carbon price a scenario parameter; horizon explicit (simple payback and NPV variants), fixing the vintage-comparability defect. (3) Intensity trends computed per entity-year with EU Resource Efficiency Scoreboard benchmark bands as cited comparison lines. (4) The seeded 70-company book becomes a labelled demo fixture; SBTN guidance content stays as curated reference.

**Prerequisites.** Resource-price reference rows; carbon-intensity factors per resource type (refdata EF tables). **Acceptance:** a bench project's ROI reproduces by hand with both terms visible; intensity requires revenue and shows an honest null without it; two projects with equal savings but different horizons rank differently under the NPV variant.

### 9.2 Evolution B — Efficiency-investment case-builder copilot (LLM tier 2)

**What.** Sustainability officers pitch efficiency capex internally. The copilot builds the case: "we're replacing compressed-air systems at two sites — compute the ROI with carbon value at €85/t, compare our post-project intensity against the EU scoreboard band, and draft the CFO memo", each figure a tool call over the Evolution-A endpoints, the memo composed via report studio.

**How.** Tier-2 tool schemas over the ROI/intensity/benchmark endpoints; drafted memos carry the calculation's stated assumptions (prices, carbon price, horizon) in an assumptions box the copilot fills from the tool payload — decision documents without visible assumptions are the failure mode to design against. Benchmark claims cite the scoreboard vintage. SBTN questions answer from the curated guidance content at tier 1 (documentary, legitimately real today). Guardrails: no savings estimates the user hasn't entered or the engine hasn't computed; sensitivity ("ROI at €50–120/t carbon") runs as a parameter sweep tool call, not model interpolation.

**Prerequisites (hard).** Evolution A's entry data and engine — case-building on the current uncorrelated seeded book would fabricate payback evidence; benchmark vintage fields. **Acceptance:** memo figures match tool responses including the assumptions box; sweeps enumerate actual endpoint calls; benchmark comparisons carry the scoreboard year.