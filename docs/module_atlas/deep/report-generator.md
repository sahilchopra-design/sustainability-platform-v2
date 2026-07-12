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
