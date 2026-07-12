# Template Manager
**Module ID:** `template-manager` · **Route:** `/template-manager` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG report template library management system enabling organisations to create, version, manage and deploy standardised report templates across GRI, CSRD, TCFD, SFDR and custom frameworks.

> **Business value:** Standardised template management reduces ESG report production time by 40–60% and improves inter-period comparability; version control is mandatory for CSRD reasonable assurance.

**How an analyst works this module:**
- Create or import template from framework library (GRI, CSRD, TCFD, SFDR)
- Map data fields to internal data sources
- Set version control and approval workflow
- Populate template with live data via API connectors
- Publish finalised report and archive version for audit trail

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COVER_STYLES`, `DEFAULT_TEMPLATES`, `LS_PORTFOLIO`, `LS_TEMPLATES`, `SECTION_CATEGORIES`, `SECTION_LIBRARY`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SECTION_LIBRARY` | 29 | `name`, `category`, `description` |
| `COVER_STYLES` | 6 | `name`, `bg`, `textColor` |
| `DEFAULT_TEMPLATES` | 21 | `name`, `description`, `isDefault`, `branding`, `primaryColor`, `secondaryColor`, `fontFamily`, `logoPosition`, `headerStyle`, `footerText`, `coverStyle` |
| `TABS` | 9 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `SECTION_CATEGORIES` | `[...new Set(SECTION_LIBRARY.map(s => s.category))];` |
| `portfolio` | `useMemo(() => loadLS(LS_PORTFOLIO) \|\| { name: 'Global ESG Fund', companies: GLOBAL_COMPANY_MASTER.slice(0, 30) }, []);  /* ── State ──────────────────────────────────────────────────────────── */ const [tab, setTab] = useState('gallery');` |
| `allTemplates` | `useMemo(() => [...DEFAULT_TEMPLATES, ...customTemplates], [customTemplates]);  /* ── Persist custom templates ───────────────────────────────────────── */ useEffect(() => { saveLS(LS_TEMPLATES, customTemplates); }, [customTemplates]);` |
| `blob` | `new Blob([data], { type: 'application/json' });` |
| `customs` | `imported.filter(t => !DEFAULT_TEMPLATES.some(d => d.id === t.id)).map(t => ({ ...t, isDefault: false, id: t.id \|\| `imported_${Date.now()}_${sr(_sc++).toString(36).slice(2, 6)}` }));` |
| `usageData` | `useMemo(() => allTemplates.map(t => ({ name: t.name.length > 16 ? t.name.slice(0, 16) + '...' : t.name, usage: t.usageCount \|\| 0, sections: (t.sections \|\| []).length })), [allTemplates]);` |
| `rows` | `[['Name','Description','Sections','Usage','Font','Primary Color','Created'].join(','), ...allTemplates.map(t => [t.name, `"${t.description}"`, (t.sections \|\| []).length, t.usageCount \|\| 0, t.branding?.fontFamily, t.brand` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COVER_STYLES`, `DEFAULT_TEMPLATES`, `PIE_COLORS`, `SECTION_CATEGORIES`, `SECTION_LIBRARY`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Templates in Library | — | Template Database | Total managed templates across all frameworks, jurisdictions and reporting cycles. |
| Avg Coverage Score | — | TCS Engine | Mean mandatory field completion rate across all active report templates. |
| Templates Published (YTD) | — | Workflow Log | Number of finalised reports generated from managed templates in current reporting year. |
- **Framework Disclosure Requirements, Internal ESG Data APIs, Historical Reports** → Field mapping + coverage scoring + version control engine → **Published ESG reports, template library, audit trail, coverage analytics**

## 5 · Intermediate Transformation Logic
**Methodology:** Template Coverage Score
**Headline formula:** `TCS = Populated Fields / Required Fields × 100`

Percentage of mandatory disclosure fields populated in a given template; below 80% triggers completion alert.

**Standards:** ['GRI Universal Standards 2021', 'ESRS Set 1 2023']
**Reference documents:** GRI Universal Standards 2021; ESRS Set 1 Delegated Act 2023; TCFD Recommendations 2017; SFDR Level 2 RTS 2022

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Field-level Template Coverage Score per the §8 spec (analytics ladder: rung 1 → 2)

**What.** The module is a genuinely functional template CRUD manager (create/edit/duplicate/import/export with localStorage persistence, a production-quality 29-item `SECTION_LIBRARY`, correct deep-copy semantics on duplicate — §7.1–7.3), but the guide's advertised calculation — `TCS = Populated Fields / Required Fields × 100` with an 80% completion alert — has zero code presence (§7 flag), and `usageCount` is a frozen seed value (139 total forever) never incremented by any report-generation action (§7.4). Evolution A implements the §8 specification.

**How.** (1) Build the framework checklists §8.4 lists (GRI Universal Standards index, ESRS Set 1 datapoints, TCFD 11 recommendations, SFDR RTS Annex II/III — all freely published; the ESRS/GRI catalogs are already in the platform's refdata layer). (2) Author the section-to-field mapping table for the 29 library sections (many-to-one, per §8.3). (3) Compute TCS at **field level**, not section inclusion — §8.6's explicit warning: a template containing the "SFDR PAI" section heading with blank indicators must not score as covered. (4) Fire the <80% completion alert in the Editor and Gallery. (5) Move template persistence from localStorage to a backend table so `usageCount` can be incremented by actual report-generation events (from the report-builder modules that consume templates) instead of being a static literal.

**Prerequisites.** Per-report-instance content-population status — the manager currently tracks structural inclusion only (§8.4's third requirement is the real build). **Acceptance:** the §8.5 validation — TCS agrees with a human checklist audit on a sample of reports within a few points; the headline reports-generated KPI moves when a report is actually produced.

### 9.2 Evolution B — Template-assembly copilot over the section library (LLM tier 1)

**What.** A copilot in the Editor that assembles a fit-for-purpose template from intent: "quarterly client report for an Article 8 fund with EU Taxonomy exposure" → proposes a section list from the 29-item library (SFDR PAI, EU Taxonomy, Climate Metrics, Stewardship...), a cover style, and branding defaults — explaining each inclusion against the target framework's requirements.

**How.** Tier 1, grounded in the module's own genuinely-good reference content: `SECTION_LIBRARY` (name/category/description per section), `DEFAULT_TEMPLATES` as worked examples, and — post-Evolution-A — the framework checklists, which turn recommendations from taste into requirement citations ("ESRS E1 mandates transition-plan disclosure; adding the Scenario Analysis section covers datapoints X/Y"). Output is a draft template object the user saves through the existing create path — the copilot never writes storage directly, preserving the CRUD manager's audit trail. Pre-Evolution-A the copilot must not quote coverage percentages (none exist); post-Evolution-A it cites the computed TCS and flags the <80% alert with the specific missing fields.

**Prerequisites.** None for section-recommendation drafting; Evolution A for any coverage claim. **Acceptance:** every recommended section exists in the library verbatim; framework justifications cite checklist entries once available; asking "what's this template's coverage score?" before Evolution A yields "not yet computed," matching the §7 mismatch documentation.