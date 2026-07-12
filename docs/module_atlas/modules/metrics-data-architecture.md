# ESG Metrics Data Architecture
**Module ID:** `metrics-data-architecture` · **Route:** `/metrics-data-architecture` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Platform canonical ESG data model defining the entity-metric-value-source-period architecture for time-series ESG data management. Covers unit harmonisation (MWh to GJ, tCO2e to kgCO2e), provider-agnostic schema, version control for reported vs restated values, and data lineage from raw source to published KPI.

> **Business value:** Used by ESG data engineers, CDOs, and sustainability reporting leads to ensure data consistency, auditability, and provider-agnostic portability across the ESG reporting technology stack.

**How an analyst works this module:**
- Browse canonical metric library and map to reporting standard requirements
- Review data model schema and unit conversion rules
- Track restatement history and version control for audited metrics
- Export canonical ESG dataset for reporting tool integration

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CONTEXT_DIMS`, `CROSSWALK`, `INTEROP_METRICS`, `KPI`, `KPI_TEMPLATE_FIELDS`, `L1_STRATEGIC`, `L2_SECTIONS`, `TABS`, `TOTAL_L3`, `TOTAL_L4`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `L1_STRATEGIC` | 9 | `name`, `desc`, `color`, `l2Count` |
| `INTEROP_METRICS` | 9 | `esrs`, `gri`, `issb`, `brsr`, `sasb`, `tcfd` |
| `KPI_TEMPLATE_FIELDS` | 16 | `desc`, `example` |
| `CROSSWALK` | 41 | `esrs`, `gri`, `issb`, `brsr`, `sasb`, `status` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `li * 100 + si * 11 + 300;` |
| `TOTAL_L3` | `L2_SECTIONS.reduce((s, l) => s + l.l3Count, 0);` |
| `TOTAL_L4` | `L2_SECTIONS.reduce((s, l) => s + l.metricCount, 0);` |
| `avg` | `secs.length > 0 ? Math.round(secs.reduce((s, x) => s + x.qualityScore, 0) / secs.length) : 0;` |
| `score` | `Math.round(40 + sr(seed) * 60);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CONTEXT_DIMS`, `CROSSWALK`, `INTEROP_METRICS`, `KPI_TEMPLATE_FIELDS`, `L1_STRATEGIC`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Schema Coverage Rate | `mapped_ESG_metrics / total_platform_ESG_metrics × 100` | Internal schema registry | Target >95% coverage; gaps indicate data model gaps requiring new metric definitions or source integration. |
| Unit Harmonisation Accuracy | `correctly_converted_values / total_unit_conversion_operations × 100` | Test suite against reference conversions | Must be 100% for regulatory disclosure; unit errors are the most common data quality failure in ESG reporting. |
| Restatement Frequency | `COUNT(restatement_events) per entity per year` | Version control log | High restatement frequency (>3/year) indicates immature data collection processes; tracked as a data quality governance metric. |
- **Multiple ESG data providers + company disclosures → raw ingestion** → Entity matching → unit harmonisation → version control → canonical schema → **Provider-agnostic ESG time-series database for regulatory reporting and analytics**

## 5 · Intermediate Transformation Logic
**Methodology:** Canonical ESG Data Model
**Headline formula:** `normalised_value = raw_value × conversion_factor / intensity_denominator`

The canonical model uses a star schema: entity (LEI, ISIN, SEDOL) → metric (GHG Protocol category, ESRS datapoint, ISSB metric) → value (magnitude, unit, decimal precision) → source (provider, methodology, DQ tier) → period (fiscal year, calendar year, quarterly). Unit harmonisation uses SI base units as canonical form with conversion factors from ISO 80000. Restatement versioning tracks original reported value, restatement reason code (boundary change, methodology change, correction), and restatement date.

**Standards:** ['GHG Protocol Corporate Standard 2015', 'ISO 14064-1 GHG Reporting', 'XBRL ESG Taxonomy (IFRS Foundation)']
**Reference documents:** GHG Protocol Corporate Standard v15; ISO 14064-1:2018 GHG Reporting; IFRS Foundation XBRL ESG Taxonomy 2024; GRI Universal Standards GRI 1 (2021)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry states
> `normalised_value = raw_value × conversion_factor / intensity_denominator` as the module's unit
> harmonisation formula. **No such conversion logic exists anywhere in the code** — there is no unit
> table, no SI base-unit mapping, no restatement-versioning engine. More importantly, the 40-row
> **Framework Crosswalk** table (Tab 5) — which presents itself as ESRS/GRI/ISSB/BRSR/SASB regulatory
> datapoint mappings for metrics like "Green Revenue %", "EU Taxonomy Alignment", and "SFDR PAI #1" —
> generates its ESRS/GRI/ISSB/BRSR codes **with the seeded PRNG**, not from any real taxonomy. Codes
> such as `E3-7` or `312-4` are algorithmically fabricated and could be mistaken for genuine
> regulatory citations. (The smaller, separate 8-row Interoperability Matrix on Tab 3 *is*
> hand-curated with real codes — see §7.3.) Sections below document what the code does.

### 7.1 What the module computes

A 4-level metric hierarchy is generated once from static L1 categories and a seeded L2/L3 layer:

```js
L1_STRATEGIC = 8 fixed categories (Climate & Carbon, Natural Capital, Social & Human Capital, …)
L2_SECTIONS  = L1.flatMap(l1 => l1.l2Count sections), seed = li*100 + si*11 + 300
  l3Count       = floor(3 + sr(seed)*5)         // 3–8 subsections
  metricCount   = floor(10 + sr(seed+1)*25)     // 10–35 metrics
  assuranceLevel= pick(sr(seed+2), [None,Limited,Reasonable,High])
  dataFreshness = pick(sr(seed+3), [Real-time,Monthly,Quarterly,Annual])
  qualityScore  = round(50 + sr(seed+4)*50)     // 50–100

TOTAL_L3 = Σ L2_SECTIONS.l3Count
TOTAL_L4 = Σ L2_SECTIONS.metricCount
```

The 8 L1 categories and their L2 section *names* (e.g. "Scope 1 Direct", "Board Composition", "CSRD
Readiness") are hand-written and map sensibly onto real ESG taxonomy areas; only the *counts and
quality scores* attached to each are PRNG-generated.

### 7.2 Parameterisation

| Structure | Values | Provenance |
|---|---|---|
| L1_STRATEGIC (8 categories) | fixed names/descriptions, `l2Count` 5–8 | Hand-authored, mirrors a genuine double-materiality topic taxonomy |
| L2_SECTIONS names | 55 total, per-L1 fixed name lists | Hand-authored, plausible ESRS/GRI topic-area names |
| `qualityScore`, `assuranceLevel`, `dataFreshness` | seeded 50–100%, 4-level enum, 4-level enum | 100% synthetic — no linkage to any actual assurance report or data-freshness log |
| INTEROP_METRICS (8 rows, Tab 3) | e.g. GHG Scope 1 → ESRS E1-6, GRI 305-1, ISSB S2.29a, BRSR P-VII-Q14 | **Hand-curated, accurate** real-world cross-framework codes |
| CROSSWALK (40 rows, Tab 5) | e.g. metric → `E${floor(sr×5)+1}-${floor(sr×9)+1}`, GRI `${300+floor(sr×100)}-${floor(sr×5)+1}` | **PRNG-fabricated** codes with the right *shape* (ESRS "E#-#", GRI "3##-#") but no correspondence to actual disclosure requirements |

### 7.3 Calculation walkthrough

1. **Hierarchy Explorer (Tab 0)** — expandable tree over `L1_STRATEGIC → L2_SECTIONS → synthetic L3
   rows` (`floor(2 + sr(seed)×8)` L4 metrics per L3, seed keyed off `l2.id.charCodeAt(3)`).
2. **Strategic Dashboard (Tab 1)** — bar chart of `l2Count` and `Σ metricCount` per L1; radar chart of
   `avg(qualityScore)` per L1; a 5×8 "context dimensions" table (`Magnitude/Trend/Target/Benchmark/
   Impact`) scored by yet another independent `sr(i*50+di*11+777)` draw per cell.
3. **Interoperability Matrix (Tab 3)** — static, accurate 8-row lookup table — the one part of this
   module that is genuinely trustworthy as regulatory reference data.
4. **Framework Crosswalk (Tab 5)** — the 40-row PRNG-fabricated table described above; filterable by
   metric-name substring search.
5. **Data Quality Scoring (Tab 6)** — histogram/pie of the synthetic `qualityScore`/`assuranceLevel`
   distribution across the 55 L2 sections; no real assurance-engagement data backs this.
6. **Context Generator (Tab 7)** — user types *any* free-text metric name; `generateContext` seeds
   `contextMetric.length×17+99` and fabricates five paragraphs of "Magnitude/Trend/Target/Benchmark/
   Impact" narrative (e.g. *"Current value: 743.2 units… Decreasing 8.3% year-over-year…"*) purely
   from string length — the output is entirely disconnected from the entered metric's real meaning.

### 7.4 Worked example

`generateContext("GHG Scope 1 Emissions")`: `contextMetric.length = 22` →
`seed = 22×17+99 = 473`. The magnitude sentence evaluates
`100 + sr(473)×900` and `sr(474)×5+0.5` — two more PRNG draws — to produce a specific-looking
number like *"Current value: 512.7 units. Represents 3.2% of total organizational footprint."* Typing
a *different* metric name of the *same length* (e.g. "Water Withdrawal Volume", 24 chars vs 22 —
different seed) would produce an unrelated but equally specific-looking number. The tool cannot
distinguish real metrics from typos or nonsense strings — it will fabricate a full 5-dimension
context report for any input.

### 7.5 Companion analytics

- **KPI Definition Builder (Tab 4)** — a genuinely useful static template (15 fields: KPI Name, Unit,
  Definition, Boundary, Data Source, Emission Factor, Base Year, Reporting Frequency, Assurance
  Level, Target, Framework Mapping, Data Quality Score, Materiality, Owner, Retention Period) with
  free-text input capture — no computation, but a legitimate governance checklist mirroring the
  guide's `KPI_TEMPLATE_FIELDS` intent.

### 7.6 Data provenance & limitations

- **Framework Crosswalk (Tab 5) fabricates regulatory citations.** This is the most consequential
  finding in this module: a user filtering for "EU Taxonomy Alignment" or "SFDR PAI #1" will see a
  plausible-looking ESRS/GRI/ISSB code that is not the real code — a genuine greenwashing/compliance
  risk if used to populate an actual disclosure without independent verification.
- **Context Generator (Tab 7) fabricates quantitative claims** (`% YoY change`, `3-year CAGR`, sector
  median, financial exposure `$M`) for arbitrary user-entered metric names with no underlying data
  source — the numbers are a function of string length, not of the metric.
- The 55-section hierarchy's `qualityScore`/`assuranceLevel`/`dataFreshness` fields are entirely
  synthetic and should not be read as reflecting this platform's actual data governance state.
- The 8-row Interoperability Matrix (Tab 3) is the one reliable artefact in the module — its codes
  match real ESRS/GRI/ISSB/BRSR/TCFD cross-references as of the 2023–24 standards vintage.

**Framework alignment:** GHG Protocol Corporate Standard, ISO 14064-1, XBRL ESG Taxonomy (IFRS
Foundation) — named in the guide and genuinely reflected in the *hand-curated* Tab 3 table; **not**
reflected in the PRNG-fabricated Tab 5 crosswalk or the Tab 7 context generator, which should not be
presented as standards-aligned output.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Replace the PRNG-fabricated Framework Crosswalk (Tab 5) and Context Generator (Tab 7) with a genuine,
auditable metric-to-standard mapping and metric contextualisation engine, serving ESG data engineers
and CDOs who need trustworthy cross-framework references for regulatory disclosure preparation.

### 8.2 Conceptual approach
Build a static, versioned **crosswalk lookup table** sourced from the standard-setters' own published
mapping documents (EFRAG's ESRS–GRI–ISSB interoperability tables, IFRS Foundation's ISSB–TCFD
mapping, NGFS/GRI correspondence tables) — the same approach XBRL taxonomy vendors (Workiva, CoreFiling)
use for their commercial crosswalk products — rather than generating codes algorithmically.

### 8.3 Mathematical specification
No formula is needed for the crosswalk itself (it is a lookup, not a computation); the **Context
Generator** should instead compute its five dimensions from real time-series data:

```
Magnitude_m  = latest_value(m) ; ShareOfFootprint_m = latest_value(m) / total_relevant_denominator(m)
Trend_m      = (latest_value(m) − value_(t−1yr)(m)) / value_(t−1yr)(m)
CAGR_3yr(m)  = (latest_value(m) / value_(t−3yr)(m))^(1/3) − 1
Benchmark_m  = percentile_rank(latest_value(m), peer_group_distribution(m))
Impact_m     = materiality_assessment(m)   // from the platform's existing DME materiality engine
```

| Parameter | Calibration source |
|---|---|
| Crosswalk mappings | EFRAG ESRS–GRI–ISSB Interoperability tables (2023–24), IFRS ISSB–TCFD mapping, official BRSR Core circular |
| Peer benchmark distribution | Platform's existing company universe (`GLOBAL_COMPANY_MASTER`) |
| Materiality tagging | Platform's existing DME (Dynamic Materiality Engine) — already integrated elsewhere in the platform |

### 8.4 Data requirements
A static crosswalk table (one-time ingestion of EFRAG/IFRS mapping PDFs into a `framework_crosswalk`
reference table — similar effort to the platform's existing SBTi/Verra/CBAM reference-data pulls) and
per-entity metric time series (already the platform's core data model) to power a real Context
Generator.

### 8.5 Validation & benchmarking plan
Spot-check the crosswalk table against EFRAG's published interoperability guidance for at least the
40 metrics currently in the fabricated `CROSSWALK` array; validate Context Generator outputs against
manually-verified figures for a sample of well-known companies before enabling free-text lookup.

### 8.6 Limitations & model risk
Cross-framework mappings are not always 1:1 (e.g. ESRS E1-6 gross Scope 1/2/3 vs GRI 305's separate
disclosures have subtly different boundaries) — the crosswalk should carry a confidence/exactness
flag per mapping rather than presenting all codes as equally precise, and the Context Generator must
refuse to fabricate output for metrics it has no underlying time series for for, rather than
generating plausible-looking numbers from the input string's length as it does today.

## 9 · Future Evolution

### 9.1 Evolution A — Purge the fabricated regulatory codes; document the platform's real data model (analytics ladder: rung 1 → 2)

**What.** §7 flags this module's most dangerous defect class: the 40-row Framework Crosswalk **fabricates regulatory citations with the PRNG** — codes like `E3-7` and `312-4` generated with the right *shape* (ESRS "E#-#", GRI "3##-#") but no correspondence to actual disclosure requirements, presented as compliance mappings a user could paste into a filing. Meanwhile the 8-row Interoperability Matrix on Tab 3 proves the right approach exists in the same file: hand-curated, *accurate* real codes (GHG Scope 1 → ESRS E1-6, GRI 305-1, ISSB S2.29a). The unit-harmonisation formula and restatement engine the guide promises don't exist, and the L2/L3 counts and quality scores are seeded. Evolution A: (1) **delete or correct the fabricated crosswalk immediately** — extend the accurate 8-row curation to the 40 metrics with citations (this shares work with materiality-hub's cross-walk evolution; one curated table should serve both); (2) implement the unit-conversion service (`normalised = raw × factor / denominator`) over an ISO-80000-based factor table with a 100%-accuracy test suite per the §4.1 requirement; (3) point the architecture views at the *platform's actual data model* — this module claims to document canonical ESG data architecture while the platform genuinely has 577 tables, a refdata layer and lineage traces; the L1–L4 hierarchy should describe real platform structures with real counts, not seeded ones.

**How.** (1) The crosswalk correction is a curation sprint with a validation rule: every code must resolve against the official taxonomy lists (EFRAG datapoint list, GRI index). (2) The conversion service becomes shared infrastructure (invoice-parser and iot-emissions evolutions both need it). (3) Quality scores re-derived from the lineage harness's actual provenance classes per module — the platform measures this already.

**Prerequisites.** Fabricated-code deletion treated as a P1 (regulatory-citation fabrication is the worst-in-class variant of the random-as-data defect); taxonomy source lists obtained. **Acceptance:** every crosswalk code resolves against its official list; conversion tests pass at 100%; hierarchy counts match queryable platform reality.

### 9.2 Evolution B — Data-model navigator copilot for ESG data engineers (LLM tier 2)

**What.** The module's stated users (data engineers, CDOs) need schema navigation: "where does Scope 2 market-based live in the canonical model, and which frameworks consume it?" (the corrected crosswalk answers this), "what's the conversion path from MMBtu to GJ and its factor source?", "show the restatement history convention for audited metrics and which platform tables implement it." The copilot becomes the platform data model's front door — grounded in the corrected crosswalk, the conversion-factor table, and the Atlas's own lineage artifacts.

**How.** Tier 2 over the crosswalk/conversion routes plus the platform's lineage-trace data: framework-mapping answers quote validated codes with taxonomy-list citations (the anti-fabrication rule is absolute here — this module's history is the cautionary tale); conversion answers show factor, source and the test-suite status; schema questions join the module's documented model to actual table definitions. Restatement-convention answers describe the versioning schema (original value, reason code, date per §5) and its implementation state honestly — specified vs built. The copilot refuses to emit any framework code it cannot resolve against the validated table.

**Prerequisites (hard).** Evolution A's purge and validation (a copilot fluently citing fabricated ESRS codes would industrialise the defect); Phase 2 tooling. **Acceptance:** zero unresolvable framework codes in any answer; conversion answers carry factor provenance; schema claims match live table definitions.