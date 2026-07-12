# Sector Sustainability Benchmarking
**Module ID:** `sector-sustainability-benchmark` · **Route:** `/sector-sustainability-benchmark` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Benchmarks portfolio companies against GICS sector peers on a comprehensive set of ESG KPIs including carbon intensity, energy intensity, water use, waste generation, gender diversity, board independence, and supply chain audit coverage. Draws on MSCI ESG, S&P Global CSA, and CDP sector-level benchmarks.

> **Business value:** Used by portfolio managers, sustainability analysts, and corporate strategy teams to identify sector-relative ESG strengths and weaknesses and set science-based improvement targets.

**How an analyst works this module:**
- Select portfolio companies or upload company list
- Choose GICS sector classification and KPI weighting scheme
- Review benchmark heatmap and identify underperforming KPIs
- Download sector benchmark report and set KPI improvement targets

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BEST_PRACTICES`, `COMPANIES`, `ESG_DIMS`, `IQR_METRICS`, `MATURITY_DIMS`, `MATURITY_LEVELS`, `REGIONS`, `SECTORS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SECTORS` | 15 | `companies`, `materialTopics`, `esrsPriority`, `region`, `benchmarks`, `ghgIntensity`, `renewable`, `water`, `sustainableRev`, `wasteDiversion` |
| `IQR_METRICS` | 7 | `label` |
| `BEST_PRACTICES` | 11 | `practice`, `company`, `detail` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `si * 100 + ci * 37 + 2000;` |
| `pos` | `(sortedArr.length - 1) * q;` |
| `REGIONS` | `['EU Leaders','North America','Asia-Pacific','India','LatAm & Africa'];` |
| `sectorChartData` | `useMemo(() => SECTORS.map((s,i) => ({` |
| `radarData` | `useMemo(() => { return ESG_DIMS.map((dim, di) => { const obj = { dimension: dim };` |
| `sectorRadarData` | `useMemo(() => SECTORS.map((s, si) => {` |
| `sorted` | `sectorComps.map(c => c[key]).slice().sort((a, b) => a - b);` |
| `regionData` | `useMemo(() => { return REGIONS.map((r, ri) => { const seed = ri * 300 + 4000;` |
| `avgMaturity` | `useMemo(() => { const vals = MATURITY_DIMS.map(d => getMaturity(d));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BEST_PRACTICES`, `COLORS`, `ESG_DIMS`, `IQR_METRICS`, `MATURITY_DIMS`, `MATURITY_LEVELS`, `REGIONS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Carbon Intensity Percentile | `company tCO2e/M$ revenue vs peer distribution` | CDP + MSCI ESG data | Above 75th percentile (lower intensity) indicates best-in-class climate performance; used in SBTi sector pathways. |
| ESG Composite Benchmark Score | `weighted avg of normalised KPI scores across E/S/G pillars` | MSCI ESG + S&P CSA combined | Overall relative ESG performance within the sector; <40 signals laggard status, >70 signals sector leader. |
| Supply Chain Audit Coverage | `tier_1_suppliers_audited / tier_1_suppliers_total × 100` | Company-reported supply chain data | Reflects operational visibility and supply chain ESG risk management maturity; sector benchmark varies 20–80% by industry. |
- **MSCI ESG + S&P CSA + CDP sector data → peer KPI distributions** → IQR normalisation → SASB materiality weighting → composite score → **Company vs peer benchmark scorecard with percentile rankings**

## 5 · Intermediate Transformation Logic
**Methodology:** Normalised ESG KPI Benchmarking
**Headline formula:** `benchmark_score = (company_kpi − peer_p25) / (peer_p75 − peer_p25) × 100`

Each ESG KPI is normalised within the GICS sub-industry peer group using an interquartile range scaling so that scores reflect relative positioning (0=P25, 100=P75). Environmental KPIs are revenue-normalised (tCO2e/$M revenue, GJ/$M revenue) to remove size effects. Social KPIs use headcount normalisation. Combined benchmark scores weight KPIs by their materiality within each GICS sector based on SASB materiality map.

**Standards:** ['MSCI ESG Research Sector Benchmarks', 'S&P Global Corporate Sustainability Assessment (CSA)', 'CDP Technical Notes Sector-Specific Guidance']
**Reference documents:** SASB Materiality Map by Industry; S&P Global CSA Methodology 2024; MSCI ESG Ratings Key Issues by Sector

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry states the calculation engine as
> `benchmark_score = (company_kpi − peer_p25) / (peer_p75 − peer_p25) × 100` (IQR/interquartile
> normalisation, 0=P25, 100=P75) with SASB-materiality-weighted composite scoring. **No IQR normalisation,
> percentile computation, or SASB-weighted composite score exists anywhere in this file.** The code instead
> presents (a) a fixed lookup table of **descriptive benchmark strings** per sector (e.g. `ghgIntensity:
> '0.45 tCO2e/t product'`) that are never parsed into numbers or compared against anything, (b) a separate
> `sr()`-seeded synthetic company-profile array unrelated to those strings, and (c) a **user-driven
> self-assessment slider** (Maturity Assessment tab) with no computed peer comparison at all. What follows
> documents what the code actually renders.

### 7.1 What the module computes

`SECTORS` (14 real-world sector definitions — Chemicals, Banking, Technology, Automotive, Consumer Goods,
Energy, Mining, Insurance, Telecom, Real Estate, Healthcare, India Leaders, Aviation & Shipping,
Agriculture) each carry real named example companies (BASF, HSBC, Microsoft, Tesla, etc.), a
`materialTopics` list, `esrsPriority` codes, and a `benchmarks` object of **hand-authored descriptive
strings** (not numbers): `{ ghgIntensity:'0.45 tCO2e/t product', renewable:'35%', water:'2.1 ML/t',
sustainableRev:'28%', wasteDiversion:'72%' }`. Separately, `COMPANIES` generates one synthetic numeric
profile per named company via `sr(seed)=frac(sin(seed+1)×10⁴)`:

```js
ghgIntensity      = 5 + sr(seed+1)×150                        // tCO2e, arbitrary unit vs benchmarks.ghgIntensity string
renewablePct      = round(15 + sr(seed+2)×75)
waterIntensity    = 0.1 + sr(seed+3)×5
sustainableRevPct = round(5 + sr(seed+4)×50)
esgScore          = round(40 + sr(seed+5)×55)
sbtiTarget/tcfdAligned/tnfdAligned = sr(seed+n) > threshold    // independent booleans
```

These two data sources (string benchmarks vs. numeric company profiles) are **never joined or compared** —
a company's synthetic `ghgIntensity` number is not benchmarked against its sector's `benchmarks.ghgIntensity`
string anywhere in the calculation logic.

### 7.2 Parameterisation

| Sector | `benchmarks.ghgIntensity` (descriptive, unparsed) | `esrsPriority` |
|---|---|---|
| Chemicals | "0.45 tCO2e/t product" | E1, E2, E5, S1 |
| Banking & Financial Services | "62 tCO2e/$M financed" | E1, G1, S1, S4 |
| Technology | "8.2 tCO2e/$M rev" | E1, E5, S4, G1 |
| Energy (O&G+Renewables) | "18 kgCO2e/BOE" | E1, E4, S1, S3 |
| Mining & Metals | "2.8 tCO2e/t ore" | E1, E3, E4, S3 |

These per-sector benchmark strings use real, sector-appropriate units (tCO₂e/t product for materials
processors, tCO₂e/$M financed for banks, kgCO₂e/BOE for oil & gas) — directionally faithful to how each
industry actually reports intensity, but presented as static reference text with **no source citation** and
no code path that parses or compares against them.

| `MATURITY_LEVELS` (5-point scale) | Ad Hoc → Developing → Defined → Managed → Optimizing | Matches the standard CMMI-style maturity-model convention |
| `MATURITY_DIMS` (8) | GHG Management, Water Stewardship, Circular Economy, Social Impact, Governance, Disclosure Quality, Target Setting, Assurance | User self-scores 1–5 per dimension via slider |

### 7.3 Calculation walkthrough

1. **Sector Overview / Deep-Dive / Company Profiles / Cross-Sector Comparison** tabs display the two
   independent data sources side by side — descriptive `benchmarks` strings and synthetic `COMPANIES`
   numbers — as separate tables/cards, not a joined comparison.
2. `sectorRadarData` (ESG 8-dimension radar per sector) is defined as
   `const sectorRadarData = useMemo => SECTORS.map(...)` — **this is a coding bug**: `useMemo` (the React
   hook imported at the top of the file) is used as a parameter name for an arrow function, so
   `sectorRadarData` is actually *a function* (`(useMemo) => array`), not the computed array itself. It is
   never invoked anywhere else in the file — this is dead, non-functional code, confirmed by a full-file
   search finding zero other references to `sectorRadarData`.
3. **Regional Benchmarking** (`regionData`): 5 regions × `sr()`-seeded synthetic metrics, independent of the
   14-sector data.
4. **Maturity Assessment** (Tab 9): a genuinely interactive tool — user sets a 1–5 slider per of the 8
   `MATURITY_DIMS`; `avgMaturity = mean(8 slider values)`. This is a self-assessment input tool, not a
   peer-benchmarked score — there is no external "target maturity" or peer-average line to compare against.
5. **Best Practice Showcase** — 10 hardcoded real-company practices (Microsoft SBTi, Novo Nordisk internal
   carbon price $150/tCO₂e, Unilever Scope 3 CDP A-List, Apple circular design, HSBC TNFD LEAP, etc.) —
   accurate, real-world sustainability leadership examples used as static reference cards, not computed
   rankings.

### 7.4 Worked example

Maturity Assessment: user sets sliders to
`[GHG:4, Water:3, Circular:2, Social:3, Governance:4, Disclosure:3, Targets:4, Assurance:2]`:

| Step | Computation | Result |
|---|---|---|
| Sum | `4+3+2+3+4+3+4+2` | 25 |
| `avgMaturity` | `25/8` | **3.1** → nearest label "Defined (Level 3)" per `MATURITY_LEVELS[round(3.1)-1]` |

No sector-peer comparison line exists to contextualise whether 3.1 is high or low for the user's sector.

### 7.5 Companion analytics on the page

- **Gap Analysis tab** — compares each sector's descriptive benchmark strings against generic industry
  commentary; not a computed numeric gap (consistent with the string-only nature of `benchmarks`).
- **Improvement Roadmap tab** — presents generic maturity-improvement guidance text, not a company-specific
  computed roadmap.

### 7.6 Data provenance & limitations

- **Sector `benchmarks` are hand-authored descriptive strings**, not sourced or parsed — despite plausible,
  industry-appropriate units, treat every value as an illustrative placeholder, not a citation-backed
  reference figure.
- **`COMPANIES` numeric profiles are entirely synthetic** (`sr()`-seeded) and are never reconciled against
  the sector `benchmarks` strings — the two views of "sector performance" on this page can visually
  contradict each other.
- **`sectorRadarData` is dead code with a naming bug** (parameter shadows the `useMemo` import) — it
  computes nothing that is ever rendered; if a future edit tries to call it expecting an array, it will
  receive a function instead and likely throw.
- **No IQR/percentile normalisation exists**, contrary to the guide — a real implementation would need
  numeric per-company KPI data (not currently collected in a comparable, parseable form) plus P25/P75
  computation per GICS sub-industry peer group.
- Maturity Assessment is a pure self-report tool with no external validation or peer benchmark line.

**Framework alignment:** SASB Materiality Map (named in guide as the source of KPI weighting — not
implemented) · S&P Global CSA and MSCI ESG Research sector benchmarks (named as data sources for the
descriptive `benchmarks` strings — not parsed or numerically compared) · CMMI-style 5-level maturity model
convention (genuinely reflected in `MATURITY_LEVELS`/`MATURITY_DIMS` naming and structure) · real
sustainability-leadership case studies (Microsoft, Novo Nordisk, Unilever, Apple, HSBC, Nestlé, TotalEnergies,
L'Oréal, Reliance) accurately reflect each company's actual publicly disclosed practices as of the guide's
authoring.

## 9 · Future Evolution

### 9.1 Evolution A — Implement the promised IQR benchmarking and join the two disconnected datasets (analytics ladder: rung 1 → 3)

**What.** The §7 mismatch flag is unambiguous: the guide promises `benchmark_score = (company_kpi − peer_p25)/(peer_p75 − peer_p25) × 100` with SASB-weighted composites, but no IQR normalisation, percentile computation, or weighted score exists in the file. Worse, the page carries two data sources that are never joined — hand-authored descriptive benchmark strings (`ghgIntensity: '0.45 tCO2e/t product'`) and a separate `sr()`-synthetic numeric company array — so its two views of sector performance can visually contradict each other. Evolution A converts the benchmark strings into a parseable numeric reference table and implements the guide's formula for real.

**How.** (1) Restructure `SECTORS[].benchmarks` into `{metric, value, unit, source, percentile}` rows (a `ref_sector_esg_benchmarks` seed, citing S&P CSA / CDP technical notes per metric). (2) Implement `iqrScore(company_kpi, p25, p75)` with clamping and an explicit n-per-peer-group display. (3) Weight composites by the SASB materiality map — the guide already names it; encode it as a sector × KPI weight matrix. (4) Delete or repair the §7.6-documented dead code `sectorRadarData` (parameter shadows the `useMemo` import) before extending — any future caller receives a function, not an array.

**Prerequisites.** Sourcing pass to attach citations to each benchmark value; the synthetic `COMPANIES` generator must be replaced or clearly quarantined as demo data. **Acceptance:** for a company with kpi = p25 the score renders 0 and at p75 renders 100; benchmark table and company view use the same numeric source.

### 9.2 Evolution B — Evidence-guided maturity assessor (LLM tier 1)

**What.** The Maturity Assessment tab is currently a pure self-report slider with no validation. Evolution B turns it into an evidence-guided interview: the copilot walks the user through each `MATURITY_DIMS` dimension, asks for concrete evidence ("describe your Scope 3 data collection process"), and proposes a CMMI-style level with a rationale tied to the `MATURITY_LEVELS` rubric the page already encodes — the user confirms or overrides, and the divergence between self-score and evidence-implied score is displayed.

**How.** Tier-1 pattern with structured elicitation: `POST /api/v1/copilot/sector-sustainability-benchmark/ask`, grounding corpus = this Atlas record plus the maturity rubric and the real leadership case studies the page carries (Microsoft, Novo Nordisk, Unilever et al., which §7.6 notes accurately reflect public disclosures). The copilot cites the specific rubric sentence that justifies each proposed level; it never asserts a level without user-provided evidence text.

**Prerequisites.** None hard — the rubric and case studies are already sound; a session-persistence table for assessment drafts is desirable. **Acceptance:** every proposed level quotes a rubric criterion; empty evidence input yields "insufficient evidence," never a default score.