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
