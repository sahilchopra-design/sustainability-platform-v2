# Api::Regulatory_Reports
**Module ID:** `api::regulatory_reports` · **Route:** `/api/v1/regulatory-reports` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/regulatory-reports/compile/tcfd` | `compile_tcfd` | api/v1/routes/regulatory_reports.py |
| POST | `/api/v1/regulatory-reports/compile/sfdr` | `compile_sfdr` | api/v1/routes/regulatory_reports.py |
| POST | `/api/v1/regulatory-reports/compile/gri305` | `compile_gri305` | api/v1/routes/regulatory_reports.py |
| POST | `/api/v1/regulatory-reports/compile/sec-climate` | `compile_sec_climate` | api/v1/routes/regulatory_reports.py |
| POST | `/api/v1/regulatory-reports/compile/issb` | `compile_issb` | api/v1/routes/regulatory_reports.py |
| POST | `/api/v1/regulatory-reports/compile/apra-cpg229` | `compile_apra_cpg229` | api/v1/routes/regulatory_reports.py |
| POST | `/api/v1/regulatory-reports/compile/brsr` | `compile_brsr` | api/v1/routes/regulatory_reports.py |
| GET | `/api/v1/regulatory-reports/frameworks` | `list_frameworks` | api/v1/routes/regulatory_reports.py |
| GET | `/api/v1/regulatory-reports/ref/tcfd-structure` | `ref_tcfd` | api/v1/routes/regulatory_reports.py |
| GET | `/api/v1/regulatory-reports/ref/sfdr-pai` | `ref_sfdr_pai` | api/v1/routes/regulatory_reports.py |
| GET | `/api/v1/regulatory-reports/ref/gri305` | `ref_gri305` | api/v1/routes/regulatory_reports.py |
| GET | `/api/v1/regulatory-reports/ref/sec-climate` | `ref_sec_climate` | api/v1/routes/regulatory_reports.py |
| GET | `/api/v1/regulatory-reports/ref/brsr-framework` | `ref_brsr_framework` | api/v1/routes/regulatory_reports.py |

### 2.3 Engine `regulatory_report_compiler` (services/regulatory_report_compiler.py)
| Function | Args | Purpose |
|---|---|---|
| `RegulatoryReportCompiler.compile_tcfd` | entity_data, period_start, period_end | Compile TCFD 11-recommendation structured disclosure. |
| `RegulatoryReportCompiler._auto_populate_tcfd` | rec_id, data | Auto-populate TCFD data points from platform engines. |
| `RegulatoryReportCompiler._tcfd_recommendations` | sections |  |
| `RegulatoryReportCompiler.compile_sfdr_periodic` | fund_data, period_start, period_end | Compile SFDR periodic disclosure (Annex III Art.8 / Annex IV Art.9). |
| `RegulatoryReportCompiler._compile_pai_indicators` | fund_data | Compile SFDR PAI mandatory indicators. |
| `RegulatoryReportCompiler._sfdr_recommendations` | sections, article |  |
| `RegulatoryReportCompiler.compile_gri305` | entity_data, period_start, period_end | Compile GRI 305 emissions disclosure. |
| `RegulatoryReportCompiler._gri305_recommendations` | sections |  |
| `RegulatoryReportCompiler.compile_sec_climate` | entity_data, period_start, period_end | Compile SEC Climate-Related Disclosures (Reg S-K Subpart 1500). |
| `RegulatoryReportCompiler._sec_recommendations` | sections |  |
| `RegulatoryReportCompiler.compile_issb` | entity_data, period_start, period_end | Compile IFRS S1 (General) + S2 (Climate) disclosure. |
| `RegulatoryReportCompiler._issb_recommendations` | sections |  |
| `RegulatoryReportCompiler.compile_apra_cpg229` | entity_data, period_start, period_end | Compile APRA CPG 229 Climate Change Financial Risks assessment. |
| `RegulatoryReportCompiler.compile_brsr` | entity_data, period_start, period_end | Compile SEBI BRSR + BRSR Core with GRI and ESRS cross-reference. Assesses entity data against: - Section A: General Disclosures (26 fields) - Section B: Management and Process (3 blocks x 9 principles) - Section C: 9 NGRBC Principles (Essential + Leadership) - BRSR Core: 9 quantitative ESG attributes Returns CompiledReport with GRI + ESRS mappings embedded in each section. |
| `RegulatoryReportCompiler._brsr_recommendations` | sections, core_pct, principle_pct | Generate BRSR-specific recommendations. |
| `RegulatoryReportCompiler.render_html` | report | Render a CompiledReport to a self-contained HTML string. Produces a submission-ready HTML document that can be: - Displayed in browser (no external assets — all CSS is inline) - Passed to render_pdf_bytes() for WeasyPrint PDF conversion - Embedded in an email or portal page E4: HTML is the intermediate format before PDF — structurally complete so WeasyPrint renders correctly with page breaks, head |
| `RegulatoryReportCompiler.render_pdf_bytes` | report | Render a CompiledReport to PDF bytes via WeasyPrint. Requirements: pip install weasyprint (not a hard dependency — graceful fallback) Returns: PDF bytes if WeasyPrint is available. Raises ImportError with installation hint if WeasyPrint is absent. Usage: compiler = RegulatoryReportCompiler() rpt = compiler.compile_tcfd(entity_data, "2024-01-01", "2024-12-31") pdf = RegulatoryReportCompiler.render_ |
| `RegulatoryReportCompiler.get_supported_frameworks` |  | Return list of supported regulatory frameworks. |
| `RegulatoryReportCompiler.get_tcfd_structure` |  | Return TCFD 11 recommendations structure. |
| `RegulatoryReportCompiler.get_sfdr_pai_template` |  | Return SFDR 14 mandatory PAI indicator template. |
| `RegulatoryReportCompiler.get_gri305_template` |  | Return GRI 305 disclosure template. |
| `RegulatoryReportCompiler.get_sec_climate_template` |  | Return SEC climate disclosure items. |
| `RegulatoryReportCompiler.get_brsr_framework` |  | Return complete BRSR / BRSR Core framework structure with GRI + ESRS mappings. Includes: - BRSR Core 9 attributes (quantitative KPIs) - BRSR 9 NGRBC Principles (Essential + Leadership) - Section A (General Disclosures) - Section B (Management and Process) - Full GRI-BRSR-ESRS cross-reference map |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/regulatory-reports/frameworks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['frameworks'], 'n_keys': 1}`

**GET /api/v1/regulatory-reports/ref/brsr-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['brsr_framework'], 'n_keys': 1}`

**GET /api/v1/regulatory-reports/ref/gri305** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['gri305_template'], 'n_keys': 1}`

**GET /api/v1/regulatory-reports/ref/sec-climate** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sec_climate_template'], 'n_keys': 1}`

**GET /api/v1/regulatory-reports/ref/sfdr-pai** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sfdr_pai_template'], 'n_keys': 1}`

**GET /api/v1/regulatory-reports/ref/tcfd-structure** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['tcfd_structure'], 'n_keys': 1}`

**POST /api/v1/regulatory-reports/compile/apra-cpg229** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/regulatory-reports/compile/brsr** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `regulatory_report_compiler` — extracted transformation lines:**
```python
comp_pct = (disclosed / total_guidance * 100) if total_guidance else 0
overall_pct = (total_disclosed / total_guidance_points * 100) if total_guidance_points else 0
completeness_pct=round(inv_disclosed / len(fields) * 100, 1),
completeness_pct=min(100.0, len(top_inv) / 15 * 100),
overall_pct = sum(s.completeness_pct for s in sections) / len(sections) if sections else 0
completeness_pct=round(reported_unique / unique_pais * 100, 1),
overall = sum(s.completeness_pct for s in sections) / len(sections) if sections else 0
overall = sum(s.completeness_pct for s in sections) / len(sections) if sections else 0
comp = (disclosed / len(fields) * 100) if fields else 0
comp = (disclosed / len(fields) * 100) if fields else 0
overall = sum(s.completeness_pct for s in sections) / len(sections) if sections else 0
comp = (disclosed / total * 100) if total else 0
overall = sum(s.completeness_pct for s in sections) / len(sections) if sections else 0
a_pct = (a_disclosed / a_total_fields * 100) if a_total_fields else 0
b_pct = (b_disclosed / b_total * 100) if b_total else 0
comp = (disclosed / total_indicators * 100) if total_indicators else 0
overall_pct = sum(s.completeness_pct for s in all_sections) / len(all_sections)
core_pct = (total_core_disclosed / total_core_params * 100) if total_core_params else 0
principle_pct = (total_principle_disclosed / total_principle_items * 100) if total_principle_items else 0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`backend/services/regulatory_report_compiler.py` (`RegulatoryReportCompiler`) is a
**disclosure-completeness engine**: it holds machine-readable skeletons of ten regulatory
frameworks (TCFD, SFDR periodic, GRI 305, SEC Reg S-K 1500, ISSB S1/S2, UK TCFD, APRA CPG 229,
SEBI BRSR, BRSR Core, CSRD/ESRS) and scores caller-supplied entity/fund data against each
framework's required fields. There is no financial modelling — the universal computation is:

```
section completeness % = disclosed_fields / required_fields × 100
section status          = complete (≥90%) | partial (>0%) | incomplete (0%)
overall completeness    = mean of section percentages   (TCFD: disclosed guidance points / total)
overall status          = complete ≥90 | partial >0 | draft
```

Every compile method returns a `CompiledReport` (sections, per-gap strings, rule-based
recommendations, metadata) which `render_html()` turns into a self-contained submission-ready
HTML document and `render_pdf_bytes()` converts via WeasyPrint. Routes
(`api/v1/routes/regulatory_reports.py`): `POST /compile/apra-cpg229`, `POST /compile/brsr`,
`GET /frameworks`, and template refs `/ref/tcfd-structure`, `/ref/sfdr-pai`, `/ref/gri305`,
`/ref/sec-climate`, `/ref/brsr-framework`.

### 7.2 Framework skeletons (the parameterisation)

| Registry | Contents | Basis cited in code |
|---|---|---|
| `TCFD_RECOMMENDATIONS` | 11 disclosures (GOV-a/b, STR-a/b/c, RM-a/b/c, MT-a/b/c), each with 2–4 guidance points | TCFD Final Report (June 2017) + Annex |
| `SFDR_MANDATORY_PAI` | 14 mandatory PAI indicators (18 metric rows — PAI 1 has 4 scope rows) with units | SFDR Delegated Reg (EU) 2022/1288 Annex I Table 1 |
| `GRI_305_DISCLOSURES` | 305-1 … 305-7 with required fields (gross tCO₂e, gases, base year, EF source…) | GRI 305: Emissions 2016 |
| `SEC_CLIMATE_ITEMS` | Items 1502–1507 (governance, strategy, scenario, risk mgmt, S1/S2 emissions, targets) | SEC Release 33-11275 (Mar 2024) |
| `APRA_CPG229_SECTIONS` | 4 sections with paragraph ranges (Governance 14–21, RMF 22–36, Disclosure 37–45, Capital 46–52) | APRA CPG 229 (Nov 2021) |
| `BRSR_PRINCIPLES` / `BRSR_SECTION_A/B` / `BRSR_CORE_ATTRIBUTES` | 9 NGRBC principles (essential + leadership indicators), 26 Section-A fields, 3 Section-B blocks × 9 principles, 9 BRSR Core quantitative attributes with measurement + assurance notes | SEBI BRSR 2023 Annexure I/II, BRSR-GRI Linkage 2023 |
| `BRSR_GRI_ESRS_MAPPING` | BRSR ↔ GRI ↔ ESRS cross-reference rows | SEBI linkage doc + EFRAG ESRS Set 1 |

The only numeric thresholds anywhere are the 90% "complete" cut-off, SFDR-specific rules
(PAI section complete when all 14 unique PAIs reported; top-investments completeness =
`min(100, n/15×100)`, complete at ≥10; investment-proportions complete at ≥3 of 5 fields), and
the BRSR recommendation triggers (core <50 / <90, principles <30).

### 7.3 Calculation walkthrough

Field matching is key-convention based: e.g. TCFD guidance point → key
`gp[:40].lower().replace(" ","_")` looked up inside `entity_data["tcfd_gov_a"]`-style blocks;
PAI values match `pai_{id}_{metric[:20]…}` or fall back to `pai_{id}`; BRSR indicators are
truncated-slug keys. A value present ⇒ "disclosed", absent ⇒ a named gap string. Three TCFD
sections auto-populate `data_points` from platform engine outputs when present in the payload
(MT-b: scope1/2/3/total/intensity; STR-c: scenario impacts + NZE alignment; MT-a: WACI,
carbon footprint, climate VaR, ITR) and tag the section "Platform auto-populated".
Recommendations are rule-based, framework-specific text (e.g. TCFD: "Critical: Scenario
analysis disclosure (STR-c) required"; SFDR Art 9: "ensure 100% sustainable"; BRSR: P6 and
BRSR-Core-1 GHG assurance nudges). `compile_brsr` additionally embeds GRI/ESRS mappings into
every section's `data_points` and caps gap lists (Section B: 20, overall: 50).

### 7.4 Worked example — SFDR Art 8 periodic compile

Fund payload: description present; PAI data for PAIs 1–10 only; investment proportions with 3
of 5 fields; taxonomy turnover-aligned % present; 12 top investments.

| Section | Rule | Completeness |
|---|---|---|
| SFDR-1 objective/characteristics | description present | 100.0 |
| SFDR-2 PAI | 10 of 14 unique PAIs | 71.4 (partial; 4 gap strings) |
| SFDR-3 proportions | 3/5 fields, ≥3 ⇒ complete | 60.0 |
| SFDR-4 taxonomy | turnover % present | 100.0 |
| SFDR-5 top investments | min(100, 12/15×100); ≥10 ⇒ complete | 80.0 |
| **Overall** | mean(100, 71.4, 60, 100, 80) | **82.3 → "partial"** |

Recommendations emitted: "Complete all 14 mandatory PAI indicators (currently 10/14)". Note the
mixed semantics: SFDR-3 can be status "complete" while contributing only 60 points to the mean.

### 7.5 Rendering & reference endpoints

`render_html` builds an inline-CSS document (status colour map, per-section completeness bars,
gap call-outs) so the output needs no external assets; `render_pdf_bytes` wraps WeasyPrint.
`get_supported_frameworks()` powers `GET /frameworks`; the `/ref/*` endpoints return the raw
skeleton registries so frontend disclosure modules render exactly the fields the compiler will
score.

### 7.6 Data provenance & limitations

- **No PRNG, no synthetic entity data** — the compiler only evaluates presence/absence of
  caller-supplied values; all constants are framework metadata.
- Completeness is **presence-based, not correctness-based**: any non-null value counts as
  disclosed; there is no validation of units, ranges or internal consistency (e.g. Scope 3
  category coverage).
- The slug-truncation key convention (`ind[:40]`, `r[:30]`) is brittle — a caller must
  reproduce the exact generated keys or fields silently register as gaps.
- `SFDR_MANDATORY_PAI` covers Table 1 indicators 1–14; the real Annex I Table 1 has 18 rows
  because PAIs 15–16 (sovereign) and 17–18 (real estate) apply to specific asset classes —
  these are absent here (consistent with the platform-wide PAI-15–18 gap noted in the UAT
  backlog for the SFDR frontend modules).
- Overall completeness is an unweighted mean of section percentages (except TCFD, which
  weights by guidance-point count), so small sections move the headline as much as large ones.
- SEC Release 33-11275 is currently stayed/withdrawn from enforcement in practice; the skeleton
  reflects the March 2024 adopted text.

### 7.7 Framework alignment

- **TCFD (2017)** — the 11-recommendation, 4-pillar structure is reproduced exactly; the
  completeness test mirrors the "comply and explain" disclosure-presence review used by the
  FCA and TCFD status reports.
- **SFDR Delegated Regulation (EU) 2022/1288** — periodic-report structure follows Annex III
  (Art 8) / Annex IV (Art 9); PAI Table 1 core indicators with SFDR units (tCO₂e/€M invested
  for PAI 2, tCO₂e/€M revenue for PAI 3).
- **GRI 305 / GHG Protocol** — required-field lists implement each 305-x disclosure's
  reporting requirements (gases, biogenic split, base year, consolidation approach).
- **SEC Reg S-K §§ 229.1500-1507** — item structure per the 2024 climate rule, including the
  conditional items (1504 scenario analysis "if used", 1507 targets "if adopted").
- **APRA CPG 229** — the four-section paragraph mapping matches the prudential practice guide;
  recommendations encode APRA's TCFD-minimum expectation.
- **SEBI BRSR & BRSR Core** — Sections A/B/C plus the 9 quantitative Core attributes with
  assurance flags mirror SEBI's 2023 circular (Core mandatory with reasonable assurance for the
  top listed entities, phased from FY 2023-24); GRI/ESRS cross-walks follow the SEBI linkage
  document.
- **ISSB IFRS S1/S2, UK FCA PS21/24, EFRAG ESRS** — additional compile targets using the same
  presence-scoring pattern.

## 9 · Future Evolution

### 9.1 Evolution A — Auto-populate disclosures from platform engines (analytics ladder: rung 1 → 2)

**What.** `RegulatoryReportCompiler` is a disclosure-completeness engine holding machine-readable
skeletons of ten frameworks (TCFD, SFDR periodic, GRI 305, SEC Reg S-K 1500, ISSB S1/S2, UK TCFD,
APRA CPG 229, SEBI BRSR, BRSR Core, CSRD/ESRS) and scoring caller-supplied data against each
framework's required fields: `section completeness = disclosed/required × 100`, rolled to an
overall status, rendered to submission-ready HTML/PDF (WeasyPrint). It's honest and deterministic
but entirely passive — it scores what the caller pastes in; it doesn't fetch the numbers the
platform already computes. Evolution A wires it to the engines.

**How.** (1) Auto-populate framework fields from the platform's own outputs: GRI 305 and SEC
climate emissions from the PCAF/GHG engines, ISSB S2 from the `issb_s2` module, SFDR PAI from
`pcaf_regulatory`, Taxonomy from `gar`/`pcaf_regulatory` — so a compile is pre-filled with
computed, sourced data and the completeness score reflects real coverage, not manual entry. (2)
Report a per-field provenance (engine-sourced vs caller-supplied vs missing) in the compiled
report. (3) Add cross-framework de-duplication so a metric disclosed once (e.g. Scope 1) satisfies
every framework that requires it. (4) Bench-pin the completeness aggregation per framework.

**Prerequisites.** Integration points to the emissions/PCAF/ISSB/SFDR engines; a canonical
per-entity disclosure store to pull from. **Acceptance:** a compile pre-fills fields from platform
engines with per-field provenance; completeness reflects auto-sourced data; a shared metric
satisfies all requiring frameworks; per-framework aggregation bench-pinned.

### 9.2 Evolution B — Multi-framework report-drafting copilot (LLM tier 2)

**What.** A copilot that compiles and explains a regulatory report — "your TCFD disclosure is 78%
complete; the Strategy pillar is the gap (scenario analysis and resilience undisclosed); here's the
draft and the specific missing fields" — calling the per-framework compile endpoints and narrating
the section gaps, then rendering the submission-ready document.

**How.** Seven+ `POST /compile/{framework}` endpoints plus template reference GETs that fully
describe each framework's required fields — a complete, self-contained grounding corpus. The
per-section completeness and gap strings drive a precise remediation narrative; the engine's
`render_html`/`render_pdf_bytes` become the copilot's output layer, composing into the report-studio
artifacts the roadmap describes for tier-3. Central node for a disclosure/reporting desk,
orchestrating the framework-specific copilots (ISSB, GRI, SFDR).

**Prerequisites.** None hard — engine is honest and template-complete; far more useful once
Evolution A auto-populates from platform data (otherwise the copilot narrates completeness of
manually-pasted input). **Acceptance:** every completeness %, section status, and named gap traces
to a compile response; the copilot distinguishes engine-sourced from caller-supplied fields; it
frames output as disclosure-completeness (not assurance or filing sign-off) and refuses to claim
regulatory acceptance.