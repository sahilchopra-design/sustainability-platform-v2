## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine is a **Template Coverage Score**
> (`TCS = Populated Fields / Required Fields × 100`, "below 80% triggers completion alert"). **No
> such score, no field-population tracking, and no completion-alert logic exist anywhere in this
> 882-line file.** What the module actually is: a genuine **report-template CRUD manager** — create,
> edit, duplicate, import/export, and browse ESG report templates with branding configuration
> (colours, fonts, logo position, section list, page layout), backed by `localStorage` persistence.
> This is a real, functional tool for its actual purpose; it simply does not compute the coverage
> metric the guide describes.

### 7.1 What the module computes

5 real default templates (`DEFAULT_TEMPLATES`: Classic Corporate, Modern Minimal, Regulatory
Compliance, Board Dashboard, Client Quarterly), each with a genuine branding schema (primaryColor,
secondaryColor, fontFamily, logoPosition, headerStyle, footerText, coverStyle), a `sections` array
(drawn from `SECTION_LIBRARY`, 29 real report-section definitions across categories like Structure/
Content/Regulatory), a `pageLayout` (margins, header/footer heights), and a `usageCount` integer.
Users can create custom templates (persisted to `localStorage` under `LS_TEMPLATES`), duplicate
existing ones, import/export as JSON, and export a CSV summary across all templates.

### 7.2 The only computed aggregates

```js
allTemplates = [...DEFAULT_TEMPLATES, ...customTemplates]
totalReportsGenerated = Σ allTemplates.usageCount
usageData[template] = { usage: template.usageCount||0, sections: template.sections.length }
sortedByUsage = [...allTemplates].sort(desc by usageCount)
```

These are simple sums/sorts over `usageCount` — a real integer field seeded with plausible starting
values (Classic Corporate: 42, Modern Minimal: 28, Regulatory Compliance: 19, Board Dashboard: 15,
Client Quarterly: 35) at template creation, but **never incremented anywhere in this file** —
`usageCount` does not actually track "reports published" as a live counter; it is a static seed value
for any default template, and starts at 0 for newly-created templates with no code path that
increments it when a template is actually used to generate a report.

### 7.3 Calculation walkthrough

1. **Gallery tab** — browses `allTemplates`, showing each template's branding preview, section count,
   and usage count.
2. **Editor** — creates/edits a template's branding, section list (drag/toggle from
   `SECTION_LIBRARY`), and page layout; on save, sets `usageCount: editMode ? previous : 0` —
   correctly preserves usage history when editing an existing template, resets to 0 for a new one.
3. **Duplicate** — `dup = {...tmpl, id:'custom_'+Date.now(), usageCount:0, ...}` — correctly resets
   usage count on a copy (a duplicated template hasn't itself been used yet), while deep-copying
   `sections` and `branding` to avoid mutating the source template's arrays/objects.
4. **Import** — deduplicates against `DEFAULT_TEMPLATES` by ID, assigning a new random suffix ID
   (`sr(_sc++)` — a counter-seeded PRNG call, ensuring uniqueness across an import batch) to any
   imported template lacking an ID.
5. **Analytics tab** (`usageData`) — bar chart of usage count and section count per template; a CSV
   export lists every template's name, description, section count, usage, font, primary colour, and
   creation date.

### 7.4 Worked example

Given the 5 default templates' seed `usageCount` values (42, 28, 19, 15, 35), `totalReportsGenerated
= 42+28+19+15+35 = 139` — a plausible-looking headline "Reports Using Templates" KPI. However,
because `usageCount` is never incremented by any actual report-generation action in this file, this
figure will remain frozen at 139 (plus whatever a user manually sets it to via editing) regardless of
how many reports the platform actually produces from these templates elsewhere — it does not reflect
live usage.

### 7.5 Companion analytics

- **29-item Section Library** — genuine, well-structured report-section catalogue (Cover, TOC,
  Executive Summary, Portfolio Overview, Climate Metrics, ESG Scores, Risk Attribution, Stewardship,
  SFDR PAI, EU Taxonomy, Regulatory Compliance, Methodology, Scenario Analysis, Governance,
  Benchmarking, Appendix, Disclaimer, and more) grouped into categories — real, useful reference
  content for report structuring.
- **6 Cover Styles** — background/text-colour presets for the report cover page.

### 7.6 Data provenance & limitations

- **No Template Coverage Score, no field-population tracking, and no 80%-threshold completion alert
  exist** — the guide's entire calculation-engine description does not correspond to any code in
  this file; see §8.
- `usageCount` is a static/manually-set integer, not a live-incrementing usage counter — any
  aggregate KPI built on it (total reports generated) is a point-in-time snapshot, not a running
  total.
- All template branding/section defaults are hand-authored, sensible, real configuration data — this
  layer of the module is genuinely production-quality even though the "coverage score" concept from
  the guide is absent.

**Framework alignment:** GRI Universal Standards, ESRS Set 1, TCFD, and SFDR are referenced in the
guide as the frameworks templates should map to; the actual `SECTION_LIBRARY` includes framework-
relevant sections (SFDR PAI, EU Taxonomy, Regulatory Compliance) confirming the tool's intended scope,
but no code path checks whether a template's populated sections actually satisfy any framework's
mandatory-disclosure-field list — that mapping and scoring logic is entirely absent.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Deliver the guide's intended Template Coverage Score (TCS) so report-production teams can see, before
publishing, whether a given template/report instance satisfies a target framework's mandatory
disclosure-field requirements — directly supporting the "below 80% triggers completion alert" UX the
guide describes.

### 8.2 Conceptual approach

Treat each framework (GRI, CSRD/ESRS, TCFD, SFDR) as a **required-field checklist** (the same pattern
already correctly implemented elsewhere in the platform — see `tcfd-physical-risk-assessment`'s
IFRS S2 paragraph-numbered checklist for a working example of this exact architecture) and compute
coverage as populated-vs-required field counts per template instance, mirroring how CSRD's own
digital-tagging (ESEF/iXBRL) validation works: every mandatory datapoint tag either is or isn't
present in the filed report.

### 8.3 Mathematical specification

```
RequiredFields(framework) = fixed checklist per framework (e.g. ESRS Set 1: ~1,100 datapoints,
                              of which a materiality-dependent subset is mandatory per entity)
PopulatedFields(template_instance) = count(sections in template.sections that map to a
                                            RequiredFields entry AND contain non-empty content)
TCS(template_instance) = PopulatedFields / RequiredFields(framework) × 100

CompletionAlert = TCS < 80   (guide's stated threshold)
```

| Parameter | Value | Calibration source |
|---|---|---|
| Completion alert threshold | 80% | Guide's stated convention; align with each framework's own "reasonable assurance" completeness bar if formally adopted |
| Field-to-section mapping | Many-to-one (a section can satisfy multiple required fields) | Needs a framework-specific mapping table per template section, analogous to `SECTION_LIBRARY` categories |

### 8.4 Data requirements

- A required-field checklist per framework (GRI Universal Standards 2021 index, ESRS Set 1 Annex,
  TCFD 11 recommendations, SFDR Level 2 RTS Annex II/III) — free, publicly published by each
  standard-setter.
- A section-to-field mapping table linking each `SECTION_LIBRARY` entry to the specific required
  fields it can satisfy.
- Per-report-instance content-population status (currently the template manager only tracks
  structural section *inclusion*, not field-level content completeness within a generated report).

### 8.5 Validation & benchmarking plan

Manually audit TCS against a sample of completed reports scored by a human reviewer against the same
framework checklist; target agreement within a few percentage points before trusting the automated
score for the "below 80%" alert threshold.

### 8.6 Limitations & model risk

Section-level "inclusion" is not the same as field-level "completeness" — a template can include the
"SFDR PAI" section while still leaving individual PAI indicators blank; TCS must be computed at the
field level, not the section level, to avoid false confidence from a template that merely has the
right section headings.
