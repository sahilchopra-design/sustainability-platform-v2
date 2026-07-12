# Report Generator
**Module ID:** `report-generator` · **Route:** `/report-generator` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Automated ESG and climate report generation from configurable templates, combining platform analytics outputs with narrative and regulatory-aligned disclosure formatting.

> **Business value:** Automates the last mile of ESG reporting by combining platform data with configurable templates, dramatically reducing manual report production effort while ensuring regulatory alignment.

**How an analyst works this module:**
- Select report template and reporting period.
- Review auto-populated data fields and complete gaps.
- Add narrative commentary and approve sections.
- Export as PDF, DOCX, or XBRL-tagged filing.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_SECTIONS`, `COVERAGE_MATRIX`, `FW_COLORS`, `LS_HISTORY`, `LS_PORTFOLIO`, `LS_SCHEDULE`, `REPORT_TYPES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REPORT_TYPES` | 13 | `name`, `framework`, `sections`, `pages_est`, `audience`, `frequency`, `modules`, `icon` |
| `COVERAGE_MATRIX` | 13 | `TCFD`, `SFDR`, `CSRD`, `ISSB`, `TNFD`, `PCAF`, `PRI` |
| `TABS` | 11 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `pick` | `(arr, n) => arr[Math.floor(sRand(n) * arr.length)];` |
| `topCompanies` | `companies.slice(0, 5).map((c, i) => ({` |
| `portfolio` | `useMemo(() => loadLS(LS_PORTFOLIO) \|\| { name: 'Global ESG Fund', companies: GLOBAL_COMPANY_MASTER.slice(0, 30) }, []);  /* ── State ──────────────────────────────────────────────────────────── */ const [tab, setTab] = useState('types');` |
| `uniqueFrameworks` | `useMemo(() => ['All', ...new Set(REPORT_TYPES.map(r => r.framework))], []);` |
| `uniqueAudiences` | `useMemo(() => ['All', ...new Set(REPORT_TYPES.map(r => r.audience))], []);` |
| `uniqueFreqs` | `useMemo(() => ['All', ...new Set(REPORT_TYPES.map(r => r.frequency))], []);` |
| `blob` | `new Blob([content], { type: ext === 'html' ? 'text/html' : ext === 'json' ? 'application/json' : 'text/markdown' });` |
| `sectionsByReport` | `useMemo(() => REPORT_TYPES.map(r => ({ name: r.id.toUpperCase(), sections: r.sections.length, pages: r.pages_est })), []);` |
| `coverage` | `Math.round(60 + sRand(s) * 35);` |
| `records` | `Math.round(100 + sRand(s + 1) * 900);` |
| `quality` | `Math.round(70 + sRand(s + 2) * 25);` |
| `rows` | `[['Name','Framework','Sections','Pages','Audience','Frequency','Modules'].join(','), ...REPORT_TYPES.map(r => [r.name, r.framework, r.sections.length, r.pages_est, r.audience, r.frequency, r.modules.join(';')].join(','))` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALL_SECTIONS`, `COVERAGE_MATRIX`, `REPORT_TYPES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Report Templates Available | — | Template Library | Pre-built report templates covering TCFD, GRI, CSRD, SFDR, and CDP frameworks. |
| Avg Generation Time (min) | — | Performance Monitor | Mean time from report initiation to PDF/Word export completion. |
| Data Auto-Fill Rate (%) | — | Data Connector | Share of report data fields automatically populated from platform analytics without manual input. |
- **Platform analytics outputs + template library + user narrative inputs** → Data field mapping; narrative assembly; format rendering → **Published ESG report in PDF/DOCX/XBRL with version control and audit trail**

## 5 · Intermediate Transformation Logic
**Methodology:** Report Completeness Index
**Headline formula:** `RC = completed_sections / total_required_sections × 100`

Proportion of mandatory report sections with populated data and approved narrative content.

**Standards:** ['GRI Standards 2021', 'TCFD Recommendations', 'ESRS Set 1']
**Reference documents:** GRI Universal Standards 2021; TCFD Final Recommendations (2017); EFRAG ESRS Set 1 (2023); CDP Technical Note for Reporting (2024)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine states `RC = completed_sections /
> total_required_sections × 100` (Report Completeness Index). **No such ratio is computed
> anywhere in the code.** The page never tracks which sections a user has actually completed —
> every "coverage %", "records", and "quality %" figure on the page (e.g. the per-module coverage
> bars, the section-quality radar) is an **independently seeded PRNG value**
> (`Math.round(60 + sRand(seed)×35)` etc.), not a count of populated vs required disclosure fields.
> The module is, in practice, a **report template catalog + narrative/table generator**, not a
> completeness-scoring engine.

### 7.1 What the module computes

12 pre-built report templates (`REPORT_TYPES`) span TCFD, SFDR (PAI + periodic), CSRD ESRS E1,
ISSB IFRS S2, TNFD, PCAF, PRI stewardship, and 4 custom/client formats, each with a fixed
`sections[]` list, `pages_est`, `audience`, and `frequency`. For a selected template the page:

1. Generates narrative content per section via `generateSectionContent(sectionName, reportType,
   portfolio)` — pulls up to 5 portfolio holdings and fabricates `esg_score`, `emissions_tCO2`,
   and `weight_pct` per holding using `sRand(seed(sectionName+reportType.id) + offset)`.
2. Renders the assembled document to HTML, Markdown, or JSON via `renderHTML`/`renderMarkdown`,
   and offers CSV export of the coverage/report metadata.
3. Computes a static 12-requirement × 7-framework `COVERAGE_MATRIX` (hard-coded booleans, not
   derived from any data) to show which frameworks mandate which disclosure requirement.

### 7.2 Parameterisation

| Field | Formula / source | Provenance |
|---|---|---|
| `seed(s)` | djb2-style string hash: `h = ((h<<5)+h) ^ charCode` | Standard hash function, deterministic per section+template id |
| `sRand(n)` | `frac(sin(n+1)×10⁴)` | Platform-standard seeded PRNG |
| Per-module `coverage` | `60 + sRand(seed(m)+1)×35` → 60–95% | Synthetic demo value, no relation to actual data completeness |
| Per-module `records` | `100 + sRand(seed(m))×900` → 100–1,000 | Synthetic demo value |
| Per-module `quality` | `70 + sRand(seed(m)+2)×25` → 70–95% | Synthetic demo value |
| Template-status label | `coverage>80 → "Ready"`, `>50 → "Partial"`, else `"Missing"` | Threshold heuristic on the synthetic coverage % |
| `COVERAGE_MATRIX` | 12 disclosure requirements × 7 frameworks, hand-coded true/false | Author's domain judgement, cross-referenced against TCFD/SFDR/CSRD/ISSB/TNFD/PCAF/PRI requirement lists — a reasonable qualitative reference table, not calculated |
| `topCompanies.esg_score` | `45 + sRand(s+i×7)×40` | Synthetic demo value |
| `topCompanies.emissions_tCO2` | `10,000 + sRand(s+i×13)×90,000` | Synthetic demo value |

### 7.3 Calculation walkthrough

1. User selects a `REPORT_TYPES` entry → `reportType.sections[]` becomes the outline.
2. For each section, `generateSectionContent` seeds `s = seed(sectionName + reportType.id)`, pulls
   the first 5 companies from the active portfolio (localStorage `ra_portfolio_v1`, falling back to
   `GLOBAL_COMPANY_MASTER.slice(0,20)`), and fabricates ESG score/emissions/weight per holding plus
   4 narrative "key findings" bullets, each independently seeded off `s`.
3. `renderHTML`/`renderMarkdown` walk `report.sections` and assemble a styled document; the
   "Executive Summary" and section narratives are template strings with the fabricated numbers
   interpolated in — there is no LLM or NLP summarisation despite the polished prose tone.
4. The `qualityChecks` gate (§7.5) evaluates simple boolean readiness rules before allowing
   generation, unrelated to the coverage/records/quality PRNG values shown elsewhere on the page.

### 7.4 Worked example

For template `tcfd` and section `"Governance"`: `s = seed("Governancetcfd")` (djb2 hash, a large
integer, say `s = 8,432,901`). Key findings compute as:
```
ESG score      = round(50 + sRand(s)   × 30)   e.g. sRand(8432901)=0.61 → 68/100
Emissions int. = (40 + sRand(s+1)×60).toFixed(1) e.g. sRand=0.34 → 60.4 tCO2e/$M
SBTi share     = round(60 + sRand(s+2)×30)      e.g. sRand=0.72 → 82%
Physical-risk %= round(10 + sRand(s+3)×20)      e.g. sRand=0.19 → 14%
```
These four numbers are then dropped verbatim into the rendered "Key Findings" bullets — they are
illustrative placeholders regenerated identically every time the same section/template pair is
selected (stable seed), but bear no relationship to the actual selected portfolio's real metrics.

### 7.5 Companion analytics

- **Data readiness gate** (`qualityChecks`) — 3–5 boolean checks (e.g. `portfolio.companies.length
  >= 10`) that must all pass before the "Generate" button activates; independent of the coverage
  PRNG figures shown in the dashboard.
- **Coverage Matrix tab** — static requirement × framework grid (12×7), plus a `uniqueFrameworks`
  radar chart counting how many of the 12 requirements each framework covers (`COVERAGE_MATRIX
  .filter(r => r[fw]).length`) — this count IS a real aggregation of the hard-coded matrix, unlike
  the per-module coverage bars.
- **History / schedule tabs** — persisted to `localStorage` (`ra_report_history_v1`,
  `ra_report_schedule_v1`); purely a client-side activity log, no server-side audit trail.

### 7.6 Data provenance & limitations

- All quantitative content in generated documents (ESG scores, emissions, coverage %) is
  **fabricated via seeded PRNG**, not sourced from the platform's actual analytics engines or the
  selected portfolio's real holdings data — despite pulling company **names** from the real
  portfolio, the numeric values attached to them are synthetic.
- No completeness/coverage tracking exists as the guide describes; "Ready/Partial/Missing" status
  labels are driven by the same synthetic coverage number, not real section population state.
- No PDF/DOCX/XBRL export is implemented — only HTML, Markdown, JSON, and CSV blobs, despite the
  guide claiming "Export as PDF, DOCX, or XBRL-tagged filing."
- `COVERAGE_MATRIX` is a genuinely useful qualitative reference (framework requirement overlap) but
  is hand-authored, not computed from any live disclosure-tracking data.

**Framework alignment:** the 12 templates' section outlines are reasonably faithful to the real
TCFD 4-pillar structure, SFDR PAI Annex I indicator numbering, CSRD ESRS E1 sub-topics, and ISSB
IFRS S2 paragraph references (S2.5-6 Governance, S2.8-22 Strategy, etc.) — i.e. the **document
skeletons** are standards-accurate even though the **content populating them is synthetic**.

## 9 · Future Evolution

### 9.1 Evolution A — Engine-sourced numbers and a real completeness index (analytics ladder: rung 1 → 2)

**What.** §7 identifies the dangerous pattern: generated documents pull real company names from the portfolio but attach PRNG-fabricated `esg_score`/`emissions_tCO2` values — synthetic numbers wearing real labels in files users may circulate. The guide's Report Completeness Index (`completed/required sections`) is never computed (coverage bars are seeded), and the claimed PDF/DOCX/XBRL export doesn't exist (HTML/MD/JSON/CSV only). The 12-template catalog (TCFD, SFDR PAI, ESRS E1, IFRS S2, TNFD, PCAF) and hand-authored `COVERAGE_MATRIX` are genuinely useful structure. Evolution A replaces fabricated content with engine-sourced data and makes completeness real.

**How.** (1) `generateSectionContent` becomes a data-binding layer: each template section declares its required datapoints (emissions from scope3-engine outputs, portfolio metrics from `portfolios_pg` aggregations, scenario results from stored runs), resolved server-side via `POST /api/v1/report-generator/compose`; unpopulated datapoints render as explicit gaps — honest nulls in prose form — never as seeded numbers. (2) Completeness = populated/required datapoints per section, computed from the binding resolution — the guide's RC index, finally real, and the natural integration point with `regulatory-gap`'s requirement→artifact mapping. (3) DOCX export via the platform's document tooling (PDF later; drop the XBRL claim or scope it to the ESEF module). (4) `COVERAGE_MATRIX` stays as curated reference, marked as such.

**Prerequisites.** Datapoint-binding schema per template (the real design work); sibling engines exposing stable output shapes. **Acceptance:** a generated TCFD report's every numeric traces to a platform artifact ID; deleting the portfolio's scenario run flips the relevant section to "gap" and lowers RC; no PRNG remains in content generation.

### 9.2 Evolution B — The platform's LLM render layer (LLM tier 2 → 3)

**What.** The productization roadmap designates the report modules as the render layer for LLM-drafted, engine-sourced memos — this module is where that lands. Evolution B upgrades section narrative from template strings to LLM composition over bound data: "draft the ESRS E1 transition-plan narrative from our computed targets, gap assessment, and MACC outputs, in EFRAG's required structure" — prose written by the model, numbers injected from the Evolution-A bindings, structure enforced by the template.

**How.** Per-section generation calls carry the section's resolved datapoints plus the framework's drafting conventions (chunked EFRAG/TCFD guidance) as context; the no-fabrication validator greps every numeric in generated prose against the binding payload — the platform's core contract applied to document generation, where the stakes are highest. Tier-3 hook: desk-orchestrator outputs (counterparty memos, DD packs from other modules' copilots) render through the same compose pipeline, making this the shared last mile. Human review is structural: generated sections are drafts with per-section approve/edit state, and export requires all quantitative sections approved.

**Prerequisites (hard).** Evolution A's bindings (LLM prose over fabricated numbers would industrialize the exact failure §7.6 documents); validator integration; per-section review workflow. **Acceptance:** every numeric in exported prose exists in the binding payload (validator-enforced, logged); unapproved sections cannot export; a section regenerated with unchanged bindings produces unchanged numbers.