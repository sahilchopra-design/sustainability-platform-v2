## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes an **automated report-assembly platform**
> that "draws from live platform data," auto-populates fields via a "field-mapping configuration
> layer," runs "AI-assisted drafting," computes an "ISSB S1/S2 Alignment Score" from a real
> requirements checklist, auto-fills ~500 CDP questionnaire fields, and automates SFDR
> pre-contractual disclosure completeness. **None of this is implemented.** The page ingests no
> canonical ESG data at all (no props, no API calls, no context imports) — it is a **static
> report-planning and methodology-blueprint tool**: 30 report-type reference rows, a 9-section
> disclosure blueprint with word/page ranges, a content-mix designer, a stakeholder-package guide,
> chart recommendations, and a project timeline. The one place a "framework alignment" figure
> appears (`frameworkMatrix`), it is **`sr()`-seeded random noise** (40–100 range), not a
> requirements-met/total calculation. Sections below document the planning tool as built.

### 7.1 What the module computes

10 tabs (`TABS`) covering: Report Type Selector (30 reference report types — CSRD/ESRS, ISSB, SEC
Reg S-K, BRSR, GRI, TCFD, CDP, plus 20 more jurisdiction-specific formats, each with a static
page-range, complexity, section-count, and iXBRL-required flag), Section Blueprint (9 disclosure
sections each with a 5W1H content-planning template — who/what/when/where/why plus page/word ranges
and a data/narrative/semi-narrative/visual content-mix percentage split), Component Mix Designer,
Content Density Planner, Stakeholder Package Builder (5 audience-tailored section-priority lists),
Drafting Workspace, Framework Alignment Checker, Visual Design Guide (recommended chart types per
section), Digital Publishing Planner (ESEF/iXBRL/PDF-A/accessibility requirements), and Timeline &
Milestones (8-phase, 26-week project plan).

### 7.2 The only two live calculations

```js
densityMultiplier = [0.6, 1.0, 1.4, 1.8][densityLevel]        // Light/Balanced/High/Maximum
totalWords = Σ_sections round(wordRange.max × densityMultiplier)
totalPages = Σ_sections round(pageRange.max × densityMultiplier)

frameworkMatrix[section][framework] = round(40 + sr(seed) × 60)     // seed = si×100 + fi×7 + 5000
```

`densityMultiplier` scales every section's **maximum** stated word/page count by a single factor
(0.6×–1.8×) selected from a 4-level slider — a report-length planning aid, not a content
recalculation. `frameworkMatrix`'s "coverage" cells are pure pseudo-random values in [40,100] keyed
by `section_index×100 + framework_index×7 + 5000` — structurally identical to every other synthetic
`sr()` field in this codebase, with no relationship to any actual CSRD/ISSB/GRI/TCFD/BRSR/SASB
requirement text.

### 7.3 Reference data structure

| Table | Rows | What it contains |
|---|---|---|
| `REPORT_TYPES` | 30 | Real-world report format names (CSRD/ESRS, ISSB S1/S2, SEC Reg S-K, BRSR, GRI, TCFD, CDP, IR, SFDR, EU Taxonomy, UK SDR, TNFD, SBTi, SASB, CBAM, CSDDD, EUDR, ASRS, SSBJ, SGX, HKEX, K-ESG, CVM, plus internal formats) with jurisdiction, required-flag, audience, page range, complexity tier, section count, iXBRL flag |
| `SECTIONS` | 9 | CEO Letter, Corporate Overview, Strategy/Governance/Risk, Materiality, Environmental (E1-E5), Social (S1-S4), Governance (G1), Benchmarking, Appendices/Assurance — each with a 5W1H template and a data/narrative/semi/visual % split summing to 100 |
| `STAKEHOLDER_PACKAGES` | 5/6 | Investor/Employee/Customer/Regulator/Community audience packages with section priority ordering |
| `CHART_RECOMMENDATIONS` | 9 | Recommended chart types and count range per section |
| `DIGITAL_REQS` | 8 | ESEF/iXBRL, SEC XBRL, PDF/A, interactive HTML, API feed, multi-language, WCAG, social-media summary — mandatory flags by jurisdiction |
| `MILESTONES` | 8 | Planning → Data Collection → Materiality → Drafting → Design → Assurance → Digital Prep → Publication, with week ranges |

All of the above are hand-authored, accurate reference content (the report-type list, section
page/word ranges, and content-mix percentages are realistic for real disclosure documents) but are
**static** — none of it is generated from, or written back to, actual company ESG data.

### 7.4 Calculation walkthrough

1. **Report Type Selector** — filters the 30-row `REPORT_TYPES` table by jurisdiction and
   required/optional status; purely a lookup/filter, no scoring.
2. **Section Blueprint** — `getMix`/`setMix` let a user override a section's data/narrative/semi/
   visual percentage split in local component state (`mixOverrides`); overrides are never persisted
   or exported to an actual report document.
3. **Content Density Planner** — `totalWords`/`totalPages` recompute at 4 density levels, purely
   arithmetic scaling of the static max-range figures.
4. **Framework Alignment Checker** — renders `frameworkMatrix`'s random 40–100 "coverage" per
   section × framework cell as if it were a computed cross-framework requirement-mapping score.
5. **Timeline & Milestones** — `timelineData` parses each phase's `"W5-W12"`-style week-range string
   into `{start, duration}` for a Gantt-style bar chart — correct string-parsing arithmetic, applied
   to static phase definitions.

### 7.5 Worked example

At `densityLevel=2` ("High", multiplier 1.4): section 5 ("Environmental Performance E1-E5",
`wordRange:'5000-15000'`) contributes `round(15000×1.4) = 21000` words to `totalWords`, and
(`pageRange:'15-40'`) contributes `round(40×1.4) = 56` pages to `totalPages`. Summing the max-word
figures across all 9 sections at this density (CEO 2500, Overview 4000, Strategy 8000, Materiality
5000, Environmental 15000, Social 10000, Governance 5000, Benchmarking 4000, Appendices 10000 = 63,500
base words) gives `totalWords ≈ round(63500×1.4) = 88,900` words — illustrating that at "High"
density a fully-detailed CSRD-grade report is modelled at ~89,000 words (~250+ pages at typical
disclosure-document word density), consistent with the `REPORT_TYPES` table's own CSRD/ESRS entry
(`pages:'80-200'`) once cross-checked, though the two figures are computed independently and not
reconciled against each other in code.

### 7.6 Data provenance & limitations

- **No live ESG data ingestion.** Despite the guide's claim of drawing from "canonical ESG data,"
  the component takes no props, calls no API, and imports no platform context — every figure is
  either a static reference constant or `sr()`-seeded noise.
- The "ISSB S1/S2 Alignment Score," "CDP question-field auto-fill," "SFDR pre-contractual
  completeness," and "report_completeness = populated_fields/required_fields" formula named in the
  guide have **zero code presence** — no field-population tracking, no template engine, no export to
  PDF/XBRL exists in this file.
- `frameworkMatrix` coverage values are decorative random numbers dressed as a requirements-coverage
  heatmap; presenting them as-is to a user risks being read as a real compliance score.
- Section content-mix percentages (data/narrative/semi/visual splits) are plausible editorial
  guidance but are not derived from any analysis of actual published reports.

**Framework alignment:** the `REPORT_TYPES` and `SECTIONS` reference tables correctly name and
describe real disclosure regimes (CSRD/ESRS double materiality in Materiality section, ESRS E1-E5/
S1-S4/G1 structure in Environmental/Social/Governance sections, TCFD's 4-pillar structure implicit in
Strategy/Governance/Risk). This is accurate **planning-stage reference content** for a report team,
not an automated disclosure-generation engine — the module is best understood as a project-planning
and structuring aid, and the guide description should be rewritten to match.
