# ACT Assessment
**Module ID:** `act-assessment` · **Route:** `/act-assessment` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Scores corporate low-carbon transition credibility using the ACT (Assessing low-Carbon Transition) methodology across 10 sector-specific indicators. Combines quantitative performance metrics with qualitative policy signals to produce an overall ACT score and track record rating. Benchmarks companies against sector decarbonisation pathways aligned with a 1.5°C scenario.

> **Business value:** ACT scores translate qualitative climate commitments into a comparable 0–1 metric, enabling fund managers to distinguish genuine transition leaders from laggards. Pathway gap analysis highlights which companies are decarbonising at a pace consistent with limiting global warming to 1.5°C, providing direct stewardship and engagement evidence.

**How an analyst works this module:**
- Select company and sector to load ACT indicator set
- Review each indicator score against sector benchmark
- Pathway Alignment tab compares intensity trajectory to 1.5°C curve
- Scenario overlay shows gap under Current Policies vs NZ2050
- Export ACT scorecard as PDF for CDP/investor disclosure

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANIES`, `DIMENSIONS`, `FLAG_TYPES`, `GRADES`, `GRADE_COLORS`, `GRADE_LABELS`, `SECTORS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DIMENSIONS` | 7 | `label`, `weight`, `desc` |
| `FLAG_TYPES` | 11 | `name`, `severity` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sector` | `SECTORS[Math.floor(sr(i*13+5)*SECTORS.length)];` |
| `dimScores` | `DIMENSIONS.map((_d,di) => {` |
| `base` | `sr(i*31+di*17)*16 + sr(i*11+di*7)*4;` |
| `weighted` | `dimScores.reduce((a,sc,di) => a + sc * DIMENSIONS[di].weight, 0) / 100;` |
| `flags` | `FLAG_TYPES.filter((_f,fi) => sr(i*41+fi*23) > 0.55).map(f => f.id);` |
| `histGrades` | `[2022,2023,2024,2025].map(yr => {` |
| `drift` | `sr(i*53+yr*7)*3-1;` |
| `adjW` | `Math.max(0, Math.min(20, weighted + drift));` |
| `country` | `countries[Math.floor(sr(i*17+11)*countries.length)];` |
| `scope1` | `Math.round(sr(i*29+3)*4500+200);` |
| `scope2` | `Math.round(sr(i*37+7)*2200+100);` |
| `scope3` | `Math.round(sr(i*43+13)*28000+2000);` |
| `carbonIntensity` | `Math.round((scope1+scope2+scope3)/(sr(i*19+2)*80+5)*10)/10;` |
| `sbtiStatus` | `sr(i*61+9) > 0.6 ? 'Committed' : sr(i*61+9) > 0.3 ? 'Target Set' : 'None';` |
| `netZeroYear` | `sr(i*71+4) > 0.5 ? 2050 : sr(i*71+4) > 0.25 ? 2040 : 0;` |
| `brownCapExPct` | `Math.round(sr(i*47+17)*65+5);` |
| `supplierEngPct` | `Math.round(sr(i*59+21)*80+5);` |
| `boardClimateOversight` | `sr(i*67+33) > 0.4;` |
| `internalCarbonPrice` | `sr(i*73+41) > 0.5 ? Math.round(sr(i*79+47)*120+20) : 0;` |
| `cdpScore` | `['A','A-','B','B-','C','C-','D','D-'][Math.floor(sr(i*83+53)*8)];` |
| `radarData` | `DIMENSIONS.map((d,i) => ({` |
| `sectorHeatmap` | `useMemo(() => SECTORS.map(sec => {` |
| `avg` | `cos.length ? cos.reduce((a,c)=>a+c.weighted,0)/cos.length : 0;` |
| `flagHeatmap` | `useMemo(() => COMPANIES.map(c => ({` |
| `sectorCos` | `useMemo(() => COMPANIES.filter(c=>c.sector===benchSector).sort((a,b)=>b.weighted-a.weighted), [benchSector]);` |
| `sectorAvg` | `useMemo(() => { if(!sectorCos.length) return DIMENSIONS.map(()=>0);` |
| `header` | `['Company','Sector','ACT Score','Grade',...DIMENSIONS.map(d=>d.label)].join(',');` |
| `rows` | `sectorCos.map(c =>` |
| `blob` | `new Blob([header+'\n'+rows.join('\n')], {type:'text/csv'});` |
| `impact` | `Math.round(gap * d.weight / 100 * 100)/100;` |
| `peers` | `COMPANIES.filter(c=>c.sector===company.sector).sort((a,b)=>b.weighted-a.weighted);` |
| `rank` | `peers.findIndex(p=>p.id===company.id)+1;` |
| `avgScore` | `filtered.length?(filtered.reduce((a,c)=>a+c.weighted,0)/filtered.length).toFixed(1):'0';` |
| `medianScore` | `filtered.length?filtered.map(c=>c.weighted).sort((a,b)=>a-b)[Math.floor(filtered.length/2)].toFixed(1):'0';` |
| `sbtiPct` | `filtered.length?Math.round(filtered.filter(c=>c.sbtiStatus!=='None').length/filtered.length*100):0;` |
| `nzPct` | `filtered.length?Math.round(filtered.filter(c=>c.netZeroYear>0).length/filtered.length*100):0;` |
| `avgGreenCapEx` | `filtered.length?Math.round(filtered.reduce((a,c)=>a+c.greenCapExPct,0)/filtered.length):0;` |
| `worst` | `sectorCos[sectorCos.length-1];` |
| `gapFromBest` | `sectorCos[0] ? Math.round((sectorCos[0].dimScores[i] - sectorAvg[i])*10)/10 : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DIMENSIONS`, `FLAG_TYPES`, `GRADES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ACT Score | — | ACT Initiative | Higher scores denote stronger transition credibility across all 10 indicators |
| Pathway Gap | `Actual_intensity – Benchmark_intensity(t)` | IEA sector pathway | Deviation from IEA 1.5°C sector benchmark in tCO₂e/$M revenue |
- **Company CDP disclosure** → Map responses to ACT indicators; score 0–1 per indicator → **ACT composite score and sector pathway gap**
- **IEA sector pathway data** → Interpolate benchmark intensity by year → **Pathway gap chart and outperformance flags**

## 5 · Intermediate Transformation Logic
**Methodology:** ACT weighted indicator scoring
**Headline formula:** `ACT_score = Σ(w_i × Indicator_i) / Σ(w_i); Pathway_gap = Actual_intensity – Benchmark_intensity(t)`

Each sector applies a tailored indicator set scored 0–1 and weighted by materiality. Physical and transition benchmark intensities are derived from IEA sector pathways. A negative pathway gap indicates outperformance; positive gap signals misalignment with 1.5°C trajectory.

**Standards:** ['ACT Methodology v3', 'CDP Questionnaire', 'SBTi SDA']
**Reference documents:** ACT Methodology v3 (ADEME/CDP); CDP Climate Questionnaire 2024; SBTi Sectoral Decarbonisation Approach; IEA Net Zero by 2050

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes an ACT score on a **0–1
> scale across "10 sector-specific indicators"** plus a **pathway-gap metric**
> (`Actual_intensity − Benchmark_intensity(t)` vs IEA 1.5°C sector pathways) with scenario
> overlays and PDF export. The code implements neither the 0–1 scale nor any pathway/IEA
> benchmark logic. What it *does* implement is closer to the real ACT rating: a **0–20 weighted
> performance score over 6 ACT performance dimensions** with an A–E maturity grade, credibility
> flags, grade-migration history and sector benchmarking. Sections below document the code.

### 7.1 What the module computes

For 100 synthetic companies across 15 sectors, the module computes an ACT-style composite:

```
weighted = Σ(dimScore_i × weight_i) / 100        // dimScore ∈ [0, 20]
grade    = A if weighted ≥ 16 · B ≥ 12 · C ≥ 8 · D ≥ 4 · else E
```

Six dimensions mirror six of the real ACT performance modules (weights sum to 100):

| Dimension | Weight | Description (inline `desc`) |
|---|---|---|
| Targets | 15 | Alignment of emission reduction targets with Paris Agreement |
| Material Investment | 20 | CapEx allocation toward low-carbon assets and technologies |
| Intangible Investment | 15 | R&D spending on decarbonisation and clean technology |
| Sold Product Performance | 20 | Carbon intensity of sold products relative to benchmarks |
| Management | 15 | Governance, climate oversight, and internal carbon pricing |
| Supplier Engagement | 15 | Scope 3 upstream engagement and supplier decarbonisation |

Grade labels: A "Advanced", B "Progressing", C "Building Momentum", D "Starting",
E "Not Aligned".

### 7.2 Seed generation & credibility-flag rubric

Every company attribute is drawn from the platform PRNG `sr(s) = frac(sin(s+1)×10⁴)`:

- `dimScore = clamp(0, 20, sr(i·31+di·17)·16 + sr(i·11+di·7)·4)` — two independent draws, so
  the max attainable is 20 and the distribution is centre-light.
- Emissions: scope1 = `sr·4500+200`, scope2 = `sr·2200+100`, scope3 = `sr·28000+2000` (ktCO₂e-
  scale demo numbers); `carbonIntensity = (S1+S2+S3)/(sr·80+5)` — the same draw `sr(i·19+2)`
  doubles as revenue in $B, so intensity is emissions per $B revenue.
- Policy signals: `sbtiStatus` (Committed >0.6 / Target Set >0.3 / None), `netZeroYear`
  (2050 / 2040 / none), `brownCapExPct = sr·65+5` with `greenCapExPct = 100 − brown`,
  `internalCarbonPrice` present with p=0.5 at $20–140/t, `cdpScore` uniform over A…D-.

**Credibility flags** (10 types, each independently triggered when `sr(i·41+fi·23) > 0.55`,
i.e. ~45% incidence): severity-5 — Net-Zero Without Near-Term Targets, No Scope 3 Coverage,
Greenwashing Risk; severity-4 — High Brown CapEx Ratio, Inconsistent Lobbying; severity-3 —
Offset-Heavy Strategy, Missing Board Climate Oversight, Declining R&D; severity-2 — No Internal
Carbon Price, Supplier Engagement < 20%. A company's `totalSeverity = Σ severity(flags)` ranks
the flag heatmap. Note the flags are drawn **independently of the dimension scores**, so an
A-graded company can carry severe flags — a demo artefact, not a modelling statement.

### 7.3 Calculation walkthrough

1. **Scoring engine (Tab 1):** sliders override the six `dimScores`; `calcGrade` recomputes
   `weighted` and grade live. Radar overlays a peer line `sr(i·41+99)·12+4` (synthetic, not a
   true peer mean).
2. **Maturity distribution (Tab 2):** grade histogram, sector heatmap of mean `weighted`
   (re-graded on the same 16/12/8/4 cut-offs), and a 2022–25 grade-trend built from
   `histGrades`: each year re-grades `weighted + drift` with `drift = sr(i·53+yr·7)·3 − 1`
   (a ±1…+2 point random walk). A **migration matrix** cross-tabulates 2023 grade vs 2025 grade.
3. **Sector benchmarking (Tab 4):** companies in the chosen sector sorted by `weighted`;
   `sectorAvg` per dimension; CSV export of the scorecard; per-company **improvement plan**
   ranks dimensions by `impact = (20 − dimScore) × weight / 100` — the exact composite-score
   gain available from maxing that dimension.

### 7.4 Worked example — grade computation

Company with dimScores `[14.0, 9.5, 12.0, 7.0, 16.0, 11.0]`:

| Dimension | Score | Weight | Contribution |
|---|---|---|---|
| Targets | 14.0 | 15 | 2.100 |
| Material Investment | 9.5 | 20 | 1.900 |
| Intangible Investment | 12.0 | 15 | 1.800 |
| Sold Product Performance | 7.0 | 20 | 1.400 |
| Management | 16.0 | 15 | 2.400 |
| Supplier Engagement | 11.0 | 15 | 1.650 |
| **weighted** | | Σ/100 | **11.25** |

11.25 < 12 → grade **C** ("Building Momentum"). Improvement plan: the largest single-dimension
gain is Sold Product Performance, `impact = (20 − 7) × 20/100 = 2.60` points — enough alone to
reach 13.85 (grade B).

### 7.5 Data provenance & limitations

- **All 100 companies are synthetic**, generated by the seeded PRNG; names are fictional and
  every metric (emissions, CapEx splits, CDP scores, flags, history) is a deterministic random
  draw. No real ACT assessments, CDP data or IEA pathways are ingested.
- Simplifications vs the real ACT methodology: real ACT applies **sector-specific** indicator
  sets and weightings (e.g. Electric Utilities weights sold-product intensity via SDA pathway
  alignment); here one generic 6-dimension weighting applies to all 15 sectors. Real ACT issues
  a three-part rating (performance score /20, narrative rating A–E, trend +/=/−); the code
  reproduces score and letter but derives the letter from fixed thresholds rather than analyst
  judgement, and the trend is a random walk. No 1.5°C pathway-gap computation exists.
- Flags, dimension scores and disclosure metrics are mutually independent draws, so internal
  consistency (e.g. "No Internal Carbon Price" flag vs a non-zero `internalCarbonPrice`) is not
  enforced.

### 7.6 Framework alignment

- **ACT (Assessing low-Carbon Transition), ADEME/CDP** — the real methodology scores companies
  on up to 9 performance modules (targets, material investment, intangible investment, sold
  product performance, management, supplier engagement, client engagement, policy engagement,
  business model) with sector-specific weights, yielding a performance score out of 20 plus an
  A–E narrative rating. The module implements 6 of the 9 modules with fixed weights and maps
  the /20 score to A–E via thresholds — a reasonable structural approximation.
- **SBTi** — `sbtiStatus` mimics the SBTi commitment ladder (Committed → Target Set); real SBTi
  validation checks target ambition against sectoral decarbonisation pathways, which is not
  modelled.
- **CDP Climate** — `cdpScore` reproduces CDP's A…D- letter bands (CDP scores disclosure →
  awareness → management → leadership); here it is an independent random draw.
- **TCFD/ISSB governance pillar** — `boardClimateOversight` and internal carbon price are the
  standard governance datapoints those frameworks require; used as flag inputs only.

## 9 · Future Evolution

### 9.1 Evolution A — Sector-weighted ACT engine with real pathway-gap math (analytics ladder: rung 1 → 2)

**What.** Today the module is tier-B frontend-only: 100 PRNG-generated companies
(`sr(seed)` draws for every dimension score, emission figure and CDP grade), one generic
6-dimension weighting applied to all 15 sectors, and — per the §7 mismatch flag — none of
the pathway-gap logic (`Actual_intensity − Benchmark_intensity(t)`) the guide promises.
Evolution A builds the first backend vertical: an `act_assessments` table holding real
company inputs, **sector-specific indicator sets and weights** as the ACT v3 methodology
actually prescribes (e.g. Electric Utilities weighting sold-product intensity via SDA
alignment), and a genuine pathway-gap computation against stored IEA NZE sector
intensity benchmarks.

**How.** New route pair `POST /api/v1/act/score` and `GET /api/v1/act/benchmarks/{sector}`;
the engine ports the page's `weighted = Σ(dimScore·w)/100` composite and A–E thresholds
(16/12/8/4), then adds per-sector weight tables and a benchmark-intensity interpolation for
the pathway tab. Rung 2 lands via scenario overlays: gap under Current Policies vs NZ2050
trajectories, matching what the guide already describes. Credibility flags become **derived
from** inputs (e.g. "No Internal Carbon Price" only when the field is absent), closing the
documented internal-consistency gap where flags are drawn independently of scores.

**Prerequisites.** IEA/SDA sector benchmark curves seeded into a reference table with
citations; the synthetic 100-company book either replaced by user-entered assessments or
clearly labelled demo fixtures. **Acceptance:** the §7.4 worked example still yields 11.25 →
grade C under generic weights; two sectors with different weight tables produce different
composites from identical dimension scores; a company with intensity below its sector
benchmark shows a negative pathway gap.

### 9.2 Evolution B — Transition-credibility copilot with flag rationale (LLM tier 1)

**What.** A chat panel on the ACT page answering "why is this company grade C?", "which
single dimension improvement moves it to B?", and "what does the Greenwashing Risk flag
mean here?" grounded in the page's computed state — the live `weighted` score, the
improvement-plan `impact = (20 − dimScore) × weight/100` ranking, and the flag rubric with
severities. The copilot must disclose that companies are currently synthetic demo entities
and that grade trends are a seeded random walk, not observed migrations — never presenting
the migration matrix as market history.

**How.** Tier-1 pattern from the roadmap: this Atlas page (§7.1 scoring formula, §7.2 flag
rubric, §7.5 limitations) embedded as the module corpus in `llm_corpus_chunks`; page state
(selected company's dimScores, flags, peer rank) passed as structured context; served via
`POST /api/v1/copilot/act-assessment/ask` with the mandatory refusal path for questions
outside scope (e.g. "what is this company's real CDP score?"). After Evolution A, the same
panel graduates to tier 2 by tool-calling `POST /act/score` for slider what-ifs in natural
language ("set Material Investment to 15 and re-grade").

**Prerequisites.** Atlas corpus embedded (roadmap D3); the guide↔code mismatch note must be
in the grounding corpus so the copilot describes the 0–20/6-dimension implementation, not
the guide's phantom 0–1/10-indicator scheme. **Acceptance:** every numeric cited traces to
page state or an Atlas section; asking for a company's 1.5°C pathway gap before Evolution A
ships produces a refusal stating the module does not compute it.