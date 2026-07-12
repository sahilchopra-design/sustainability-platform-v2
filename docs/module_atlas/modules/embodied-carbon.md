# Embodied Carbon Analytics
**Module ID:** `embodied-carbon` · **Route:** `/embodied-carbon` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Tracks and analyses lifecycle embodied carbon across construction materials, building projects, and manufactured products using Environmental Product Declaration data. Covers upfront carbon (Modules A1â€“A5), use-stage emissions (B1â€“B7), and end-of-life impacts (C1â€“C4) in accordance with EN 15978 and ISO 14044. Supports whole-life carbon optimisation, EPD benchmarking, and supply chain material substitution analysis.

> **Business value:** Supports architects, developers, and lenders in achieving net-zero whole-life carbon targets, meeting LETI/RIBA 2030 benchmarks, and satisfying green loan eligibility criteria requiring embodied carbon disclosure.

**How an analyst works this module:**
- Upload bill of materials or link to project model to auto-populate material quantities.
- Match each material to an EPD record or default ICE v3 factor; review EPD coverage score.
- Review A1â€“A5 carbon hotspot chart and apply material substitution scenarios (e.g., timber vs. concrete frame).
- Export whole-life carbon certificate and RICS-format report for planning submission or green finance compliance.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BLDG_TYPES`, `RIBA_2030`, `STAGES`, `STAGE_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `BLDG_TYPES` | `['Office','Residential','Retail','Education','Healthcare','Industrial','Mixed-Use','Warehouse'];` |
| `STAGES` | `['A1-A3 Product','A4-A5 Construction','B1-B5 Use','C1-C4 End-of-Life','D Reuse/Recycle'];` |
| `RIBA_2030` | `{Office:300,Residential:250,Retail:280,Education:270,Healthcare:350,Industrial:200,'Mixed-Use':290,Warehouse:180};` |
| `names` | `['Concrete (OPC)','Concrete (30% GGBS)','Concrete (50% GGBS)','Steel (Virgin)','Steel (Recycled)','Timber (Softwood)','CLT (Cross-Laminated)','Glulam','Aluminium (Virgin)','Aluminium (Recycled)','Brick (Standard)','Brick` |
| `type` | `BLDG_TYPES[Math.floor(s*8)];` |
| `gfa` | `Math.floor(1000+s2*49000);const stories=Math.floor(2+s3*30);` |
| `a13` | `Math.floor(ribaTarget*(0.3+s*0.8));const a45=Math.floor(a13*0.15*(0.5+s2));` |
| `b15` | `Math.floor(a13*0.08*(0.5+s3));const c14=Math.floor(a13*0.12*(0.5+s4));` |
| `dStage` | `Math.floor(-a13*0.1*(0.3+s5*0.5));` |
| `totalEmbodied` | `a13+a45+b15+c14+dStage;` |
| `operationalCarbon` | `Math.floor(gfa*0.05*(0.5+s2));const designLife=50+Math.floor(s3*10);` |
| `totalWholeLife` | `totalEmbodied+operationalCarbon*designLife;` |
| `calcResult` | `useMemo(()=>{ const stagePerc={a13:0.65,a45:0.1,b15:0.08,c14:0.12,d:-0.05};` |
| `timberReduction` | `calcTimber*0.008;` |
| `adjustedBase` | `base*(1-timberReduction);` |
| `perSqm` | `Math.floor(adjustedBase*(0.7+sr(BLDG_TYPES.indexOf(calcType)*3)*0.6));` |
| `total` | `perSqm*calcGFA/1000;` |
| `materialBreakdown` | `calcMaterials.map(m=>{` |
| `qty` | `Math.floor(calcGFA*(m.typicalQty[calcType]\|\|0.2)*(m.name==='Timber'?calcTimber/100*3:1));` |
| `matCategories` | `useMemo(()=>[...new Set(materials.map(m=>m.category))],[]);` |
| `stageBreakdown` | `useMemo(()=>{ return STAGES.map((stage,i)=>{ const keys=['a13','a45','b15','c14','d'];` |
| `embodiedVsOperational` | `useMemo(()=>{ return BLDG_TYPES.map(t=>{ const ps=filteredProjects.filter(p=>p.type===t);` |
| `circularData` | `useMemo(()=>{ return filteredProjects.map(p=>({ name:p.name,wastePerc:p.wastePerc,recycledContent:p.recycledContent,reuseScore:p.reuseScore, circularScore:Math.floor((100-p.wastePerc)*0.3+p.recycledContent*0.35+p.reuseScore*0.35), demolitionWaste:Math.floor(p.gfa*0.15*(1-p.recycledContent/100)), materialPassport:p.reuseScore>50?'Yes':'Par` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BLDG_TYPES`, `STAGES`, `STAGE_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Upfront Embodied Carbon (kgCO2e/m²) | — | EPD Database / ICE v3.0 | A1-A5 emissions intensity; LETI 2030 target for offices is <300 kgCO2e/m² GIA. |
| Global Warming Potential (kgCO2e) | — | EPD / ISO 14025 | Product-level GWP100 from EPD; primary indicator for material comparison and substitution. |
| Biogenic Carbon (kgCO2e) | — | EN 15804+A2 | Separately reported biogenic carbon stored in timber and bio-based products; must not net against fossil GWP. |
| Carbon Hotspot Ratio (%) | — | ICE/EPD blend | Percentage of WLC attributable to top-3 material categories; drives substitution prioritisation. |
- **EPD database (ECO Platform / EPD International)** → Parse GWP100 values by lifecycle module and material category → **Material-level embodied carbon factor (kgCO2e/kg or m²)**
- **Project bill of materials** → Quantity take-off matched to EPD records; gaps filled with ICE v3 defaults → **Project total WLC by lifecycle stage**
- **LETI/RIBA benchmark targets** → Compare project intensity to sector percentile bands → **Carbon performance rating and gap-to-target**

## 5 · Intermediate Transformation Logic
**Methodology:** Whole-Life Carbon (WLC)
**Headline formula:** `WLC = Σ(EC_i × Q_i) + OC_use + EoL_carbon`

Sums embodied carbon contributions of each material quantity multiplied by EPD-sourced carbon factor. Operational carbon from energy use over the reference study period is added, plus end-of-life demolition and disposal emissions. All values expressed in kgCO2e per functional unit or per m² GIA.

**Standards:** ['EN 15978:2011', 'ISO 14044:2006', 'RICS Whole Life Carbon Assessment 2023']
**Reference documents:** EN 15978:2011 â€” Sustainability of Construction Works; ICE Database v3.0, University of Bath 2019; RICS Whole Life Carbon Assessment 2nd Ed. 2023; LETI Embodied Carbon Primer 2020; ISO 14044:2006 â€” Life Cycle Assessment Requirements

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The guide (Whole-Life Carbon per EN 15978 / RICS 2023) broadly matches the code's intent: the page
does structure carbon by RICS/EN 15978 lifecycle modules (A1–A3, A4–A5, B, C, D), benchmark against
RIBA 2030 intensity targets, and carry a real material carbon-factor table. The gap is quantitative,
not conceptual: the interactive **calculator does not sum EPD-factor × quantity** (`WLC = Σ EC_i×Q_i`);
it derives a per-m² intensity from a RIBA target scaled by a random spread, then *allocates* that
total to stages by fixed percentages. The material take-off is a **parallel, non-reconciled** view.
Sections below document the code as written.

### 7.1 What the module computes

Four datasets/engines:

**(a) Material library** — 30 materials with a hard-coded `carbonBase` array of embodied-carbon
factors (kgCO₂e/kg) that track the ICE v3 / EPD literature:

```
Concrete OPC 0.15 · Steel virgin 1.55 · Steel recycled 0.47 · Timber softwood 0.31 ·
CLT 0.42 · Aluminium virgin 8.24 · Aluminium recycled 1.81 · Straw bale 0.01 · Hempcrete 0.06 …
```
`isLowCarbon = kgCO2ePerKg < 0.5`. Cost, durability, recyclability, availability, circularScore are
seeded random.

**(b) Calculator** (the headline interactive):
```js
base          = RIBA_2030[type]                       // e.g. Office 300 kgCO₂e/m²
timberReduction = calcTimber × 0.008                  // 0.8% per timber-% point
adjustedBase  = base × (1 − timberReduction)
perSqm        = floor(adjustedBase × (0.7 + sr(idx·3)×0.6))   // ±random 0.7–1.3 spread
total (tCO₂e) = perSqm × calcGFA / 1000
vsRiba        = (perSqm / RIBA_2030[type] − 1) × 100
```
Stage split is applied to `total` by fixed shares `{A1-A3 0.65, A4-A5 0.10, B 0.08, C 0.12, D −0.05}`.

**(c) Project portfolio** — 80 synthetic buildings. Here the stage numbers ARE built additively
from an A1–A3 anchor:
```js
a13 = floor(ribaTarget × (0.3 + s×0.8))     a45 = floor(a13 × 0.15 × (0.5+s2))
b15 = floor(a13 × 0.08 × (0.5+s3))          c14 = floor(a13 × 0.12 × (0.5+s4))
dStage = floor(−a13 × 0.1 × (0.3+s5×0.5))   // Module D credit (negative)
totalEmbodied = a13+a45+b15+c14+dStage
totalWholeLife = totalEmbodied + operationalCarbon × designLife
embodiedPerSqm = floor(totalEmbodied × 1000 / gfa)
```

**(d) Circular-economy score:** `circularScore = (100−wastePerc)×0.3 + recycledContent×0.35 + reuseScore×0.35`.

### 7.2 Parameterisation / scoring rubric

| Constant | Value | Provenance |
|---|---|---|
| `RIBA_2030` targets (kgCO₂e/m²) | Office 300, Resi 250, Retail 280, Educ 270, Health 350, Ind 200, Mixed 290, Warehouse 180 | RIBA 2030 Climate Challenge / LETI band (real published targets) |
| `carbonBase` (30 factors) | 0.01–8.24 kgCO₂e/kg | ICE v3 / EPD literature — realistic, hard-coded |
| Timber reduction | 0.8%/point | Design heuristic (frame substitution) — synthetic slope |
| Stage split A1-A3=65% | fixed | RICS-typical upfront share; hard-coded, not computed |
| Module D | −5% credit | EN 15978 reuse/recovery credit (reported separately per standard) |
| Operational proxy | `gfa × 0.05 × (0.5+s2)` per yr | synthetic — not an energy model |
| `co2ePerUnit` (calc materials) | Concrete 360/m³, Steel 1.55/kg, Timber 155/m³ … | EPD-typical |

### 7.3 Calculation walkthrough

Calculator input → output: pick building type → look up RIBA target → apply timber reduction →
multiply by a seeded 0.7–1.3 spread to get `perSqm` → scale by GFA for `total` → allocate to stages
and (separately) run a 6-material take-off (`qty × co2ePerUnit`). The `vsRiba` gauge compares `perSqm`
to the same RIBA target. Because `perSqm` derives from RIBA×(0.7–1.3), `vsRiba` lands within ±30% by
construction. The material take-off total is **not** reconciled back to `perSqm×GFA`.

### 7.4 Worked example

Calculator: **Office**, GFA = 5,000 m², Timber = 20%.
- `base = 300`; `timberReduction = 20 × 0.008 = 0.16`; `adjustedBase = 300 × 0.84 = 252`.
- Seed `idx = BLDG_TYPES.indexOf('Office') = 0`, so `sr(0·3)=sr(0)=frac(sin(1)×10⁴)`. sin(1)=0.8415,
  ×10⁴=8414.7, frac=0.7099. Spread `= 0.7 + 0.7099×0.6 = 1.126`.
- `perSqm = floor(252 × 1.126) = floor(283.7) = 283 kgCO₂e/m²`.
- `total = 283 × 5000 / 1000 = 1,415 tCO₂e`.
- `vsRiba = (283/300 − 1)×100 = −5.7% → −5%` (better than target).
- Stage A1-A3 = `floor(1415 × 0.65) = 919 tCO₂e`; Module D credit = `floor(1415 × 0.05) = 70 tCO₂e` shown negative.

A 20% timber content thus buys a 16% intensity cut before the random spread — the substitution lever
the tool is designed to demonstrate.

### 7.5 Companion analytics

- **Material comparison:** sorts the 30-material library by carbon/cost/circularScore; low-carbon
  flag at <0.5 kgCO₂e/kg.
- **Portfolio stage breakdown & embodied-vs-operational** by building type (mean over filtered set,
  divisor guarded `|| 1`).
- **Circular economy:** per-project `circularScore`, demolition-waste estimate `gfa×0.15×(1−recycled%)`,
  material-passport and end-of-life labels by `reuseScore` thresholds.

### 7.6 Data provenance & limitations

- **Material carbon factors are realistic and hard-coded** (ICE v3 / EPD-consistent); this is the
  module's genuine external data. **Project and material secondary attributes are synthetic**, seeded
  by `sr(seed)=frac(sin(seed+1)×10⁴)`.
- The calculator does **not** perform a bottom-up `Σ EF×Q` sum; `perSqm` is a RIBA target × random
  spread. The 6-line material take-off is illustrative and unreconciled to the headline total.
- Operational carbon is a floor-area proxy, not an energy/EUI model; biogenic carbon (flagged in the
  guide, EN 15804+A2) is not separated from fossil GWP.

**Framework alignment:** **EN 15978 / RICS WLCA (2023)** — the A/B/C/D module structure and the
Module-D reuse credit mirror the standard's lifecycle stages; **RIBA 2030 Climate Challenge / LETI** —
the per-type kgCO₂e/m² targets are the real 2030 benchmark intensities; **ICE v3 (Bath, 2019)** — the
material factor magnitudes track this database; **ISO 14025 EPD** — referenced as the intended factor
source (a production build would bind each material to an EPD record rather than the static array).

## 9 · Future Evolution

### 9.1 Evolution A — Make the calculator actually sum EPD-factor × quantity (analytics ladder: rung 1 → 2)

**What.** §7 pinpoints the gap as "quantitative, not conceptual": the page correctly structures carbon by EN 15978 modules (A1–A3 through D), benchmarks against RIBA 2030 targets, and carries a credible 30-material factor library tracking ICE v3 (Concrete OPC 0.15, virgin steel 1.55, recycled aluminium 1.81 kgCO₂e/kg) — but the interactive calculator never computes `WLC = Σ EC_i×Q_i`. It back-derives a per-m² intensity from the RIBA target scaled by a seeded spread, allocates it to stages by fixed percentages, and keeps the material take-off as a parallel, non-reconciled view. Evolution A inverts the flow: quantities × factors drive the total; benchmarks are a comparison, not the source.

**How.** (1) Backend `api/v1/routes/embodied_carbon.py` with a `wlc_projects`/`wlc_bom_lines` schema: BoM upload → line-item matching against the factor library → per-module summation, with the RIBA/LETI comparison computed afterwards. (2) The factor library merges with the sibling `epd-lca-database` module's EPD records rather than duplicating them (one factor source, two consumers), with ICE v3 defaults as disclosed fallbacks and an EPD-coverage score per project. (3) Substitution scenarios become real (rung 2): swapping "Concrete OPC → 50% GGBS" recomputes affected BoM lines rather than applying the current `timberReduction = slider·0.008` heuristic. (4) Seeded material attributes (cost, durability, circularScore) become sourced fields or honest nulls.

**Prerequisites.** epd-lca-database coordination; a fixture BoM for testing (RICS worked examples are published). **Acceptance:** a fixture project's stage totals equal the line-item sums exactly (take-off and total reconcile by construction); substituting one material changes only its lines; bench-pinned worked example per the RICS 2023 method.

### 9.2 Evolution B — BoM ingestion and substitution advisor (LLM tier 2)

**What.** The workflow's first step — "upload bill of materials… match each material to an EPD record" — is a fuzzy-matching task LLMs handle well: a tool-calling assistant that reads messy BoM exports (free-text material descriptions, mixed units), proposes factor-library matches with confidence, flags unmatched lines for ICE defaults, then answers optimization questions: "where are my A1–A3 hotspots and what substitutions get me under the 300 kgCO₂e/m² LETI office target?" — running Evolution A's recompute endpoint per candidate swap and reporting the computed deltas.

**How.** Tools: `match_material(description)` (retrieval over the factor/EPD library), `compute_wlc(project)`, `run_substitution(project, swaps)`, `get_benchmark(building_type)`. Matches are proposals requiring analyst confirmation before entering the calculation — the LLM never assigns a carbon factor silently. Substitution advice quotes only computed deltas, with the biogenic-carbon caveat from the module's own lineage notes (biogenic storage "must not net against fossil GWP") enforced in the drafting prompt. Output: the RICS-format report draft through report-studio.

**Prerequisites (hard).** Evolution A — advising substitutions against the current non-reconciled calculator would report savings the model can't actually compute. **Acceptance:** on a golden 50-line BoM, ≥90% of lines match the hand-labeled reference (rest flagged); every kgCO₂e delta in the advice equals a `run_substitution` response; the report separates biogenic storage from fossil GWP.