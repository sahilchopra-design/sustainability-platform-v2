# Api::Sfdr_Annex
**Module ID:** `api::sfdr_annex` · **Route:** `/api/v1/sfdr-annex` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/sfdr-annex/ref/pai-indicators` | `ref_pai_indicators` | api/v1/routes/sfdr_annex.py |
| GET | `/api/v1/sfdr-annex/ref/template-fields` | `ref_template_fields` | api/v1/routes/sfdr_annex.py |
| GET | `/api/v1/sfdr-annex/ref/frameworks` | `ref_frameworks` | api/v1/routes/sfdr_annex.py |

### 2.3 Engine `sfdr_annex_engine` (services/sfdr_annex_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `SFDRannexEngine.generate_annex_i` | fund, report_date | Generate Annex I — PAI Statement (entity-level, Art 4 SFDR). Published on the firm's website; covers all principal adverse impacts on sustainability factors at entity level. |
| `SFDRannexEngine.generate_annex_ii` | fund, report_date | Generate Annex II — Art 8 Pre-contractual Disclosure. Inserted into fund prospectus / KID. |
| `SFDRannexEngine.generate_annex_iii` | fund, report_date | Generate Annex III — Art 8 Periodic Disclosure Report. Published post-period alongside fund annual report. |
| `SFDRannexEngine.generate_annex_iv` | fund, report_date | Generate Annex IV — Art 9 Pre-contractual Disclosure. Inserted into prospectus / KID for sustainable investment objective funds. |
| `SFDRannexEngine.generate_annex_v` | fund, report_date | Generate Annex V — Art 9 Periodic Disclosure Report. Published post-period alongside fund annual report. |
| `SFDRannexEngine.validate_disclosure` | fund, annex_id | Validate completeness and RTS compliance of a disclosure without generating the full output. Returns field-level validation results. |
| `SFDRannexEngine._build_periodic_sections` | fund, is_art9, annex |  |
| `SFDRannexEngine._build_asset_allocation` | fund | Build the RTS-required pie chart data for asset allocation section. |
| `SFDRannexEngine._build_pai_table` | indicators, mandatory_only | Render PAI indicators into the RTS table format. |
| `SFDRannexEngine._check_fields` | content, required_keys |  |
| `SFDRannexEngine._finalise` | run_id, annex_id, annex_title, fund, report_date, sections, mandatory_fields, optional_fields |  |

**Engine `sfdr_annex_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `ANNEX_I_MANDATORY_FIELDS` | `['entity_name', 'statement_date', 'reference_period_start', 'reference_period_end', 'total_investments_covered_eur', 'pai_policy_description', 'pai_consideration_summary', 'indicator_1_scope1_2_ghg_intensity', 'indicator_2_carbon_footprint', 'indicator_3_ghg_intensity_eevalue', 'indicator_4_fossil_f` |
| `ANNEX_I_OPTIONAL_FIELDS` | `['indicator_11_emissions_to_water', 'indicator_12_hazardous_waste_ratio', 'indicator_13_uunadjusted_gender_pay_gap', 'indicator_17_executive_pay_ratio', 'indicator_18_co2_emissions_real_estate', 'selected_additional_climate_indicators', 'selected_additional_social_indicators', 'future_targets_descri` |
| `ANNEX_II_MANDATORY_FIELDS` | `['fund_name', 'legal_entity_identifier', 'sfdr_classification', 'isin', 'summary_esg_characteristics', 'no_significant_harm_statement', 'dnsh_methodology', 'environmental_characteristics', 'social_characteristics', 'investment_strategy_description', 'proportion_sustainable_investments_pct', 'proport` |
| `ANNEX_II_OPTIONAL_FIELDS` | `['reference_benchmark_name', 'reference_benchmark_alignment_explanation', 'taxonomy_objectives_targeted', 'minimum_taxonomy_alignment_commitment', 'sovereign_supranational_exclusions_rationale', 'derivatives_use_explanation', 'best_effort_taxonomy_note']` |
| `ANNEX_III_MANDATORY_FIELDS` | `['fund_name', 'isin', 'reference_period_start', 'reference_period_end', 'sfdr_classification', 'esg_characteristics_attained', 'esg_characteristics_summary', 'top_investments_list', 'asset_allocation_pct_breakdown', 'proportion_sustainable_pct_achieved', 'taxonomy_aligned_pct_achieved', 'pai_summary` |
| `ANNEX_III_OPTIONAL_FIELDS` | `['taxonomy_contribution_details', 'historical_comparison_table', 'sector_breakdown_table', 'geography_breakdown_table']` |
| `ANNEX_IV_OPTIONAL_FIELDS` | `['benchmark_methodology_url', 'impact_measurement_methodology', 'carbon_reduction_pathway']` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `Taxonomy`, `__future__` *(shared)*, `fastapi` *(shared)*, `fund`, `pydantic` *(shared)*, `services` *(shared)*, `sustainable` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sfdr-annex/ref/frameworks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['frameworks', 'reference'], 'n_keys': 2}`

**GET /api/v1/sfdr-annex/ref/pai-indicators** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['mandatory_count', 'optional_count', 'mandatory_indicators', 'optional_indicators', 'reference'], 'n_keys': 5}`

**GET /api/v1/sfdr-annex/ref/template-fields** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['annex_I', 'annex_II', 'annex_III', 'annex_IV', 'annex_V', 'reference'], 'n_keys': 6}`

**POST /api/v1/sfdr-annex/generate/annex-i** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sfdr-annex/generate/annex-ii** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sfdr-annex/generate/annex-iii** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sfdr-annex/generate/annex-iv** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sfdr-annex/generate/annex-v** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `sfdr_annex_engine` — extracted transformation lines:**
```python
sus_env = max(fund.pct_sustainable_environmental - tax_aligned, 0)
other = max(100 - tax_aligned - sus_env - sus_soc, 0)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the domain computes

`/api/v1/sfdr-annex` (engine E9, `sfdr_annex_engine.py`) is a **disclosure template engine**, not a
metrics calculator: it maps caller-supplied fund data into the section structure of the five SFDR
RTS templates (Delegated Regulation (EU) 2022/1288), and scores **completeness**, not
performance. The only quantitative outputs are:

```
completeness_pct     = populated mandatory sections / total mandatory sections × 100
compliance_status    = compliant (≥95) | partial (≥60) | non_compliant (<60)
pai_coverage_pct     = populated mandatory PAI indicators / 14 × 100
asset allocation pie = {taxonomy_aligned, other_environmental, sustainable_social, other}
```

One generator per annex: **I** PAI statement (Art 4, entity-level, 5 sections) · **II** Art 8
pre-contractual (8 sections) · **III** Art 8 periodic (6 sections) · **IV** Art 9 pre-contractual
(Annex II sections + 2 Art 9 sections) · **V** Art 9 periodic (Annex III sections + DNSH/good-
governance confirmation). `validate_disclosure` reruns a generator and returns field-level gaps.

### 7.2 Parameterisation — mandatory-field registries and the PAI registry

Each annex carries a mandatory/optional field list (e.g. `ANNEX_II_MANDATORY_FIELDS` has 16 fields:
fund identifiers, DNSH statement/methodology, E/S characteristics, strategy, sustainable- and
taxonomy-proportions, asset-allocation categories, engagement policy, data sources/limitations,
due diligence). Annexes IV/V are supersets of II/III, adding the sustainable-investment objective,
minimum-percentage commitments, DNSH binding criteria, good-governance methodology, and (V) the
achieved-results confirmations — mirroring the real RTS delta between Art 8 and Art 9 templates.

`PAI_INDICATOR_REGISTRY` defines 18 indicators. **Indicators 1–14 are flagged mandatory (Table 1)**
with the RTS metrics (e.g. #1 GHG Scope 1+2+3 in tCO₂e/€M EVIC; #4 % fossil-fuel exposure;
#12 unadjusted gender pay gap; #13 % female board members; #14 controversial weapons).
**15–18 are the Table 2 additional real-estate/climate indicators** (kgCO₂e/m², kWh/m², fossil
heating %, % EPC below C). Each supplied `PAIIndicatorValue` carries value, coverage %, source,
target, and a **PCAF-style DQS 1–5** (default 3).

Thresholds table:

| Constant | Value | Provenance |
|---|---|---|
| Mandatory PAI count | 14 | RTS Annex I Table 1 (the engine treats Table-1 social indicators 10–14 within the same list) |
| Compliant / partial cut-offs | 95 % / 60 % | Platform convention (synthetic) |
| Top investments cap | 15 | RTS "top 15 investments" table |
| Gaps / actions caps | 10 / 6 items | Presentation trimming |

### 7.3 Calculation walkthrough

1. Each generator builds `DisclosureSection` objects with `is_populated` predicates that check the
   relevant input fields (`_check_fields` treats `None`, `""`, `[]`, `{}` as missing).
2. `_build_pai_table` renders all registry indicators (mandatory or optional view), joining any
   caller-supplied values; unpopulated indicators appear as rows with `value: null,
   populated: false` — the template shape is always complete even when data is not.
3. `_build_asset_allocation` computes the RTS pie:
   `sus_env = max(pct_sustainable_environmental − taxonomy_aligned, 0)` (avoids double-counting
   taxonomy-aligned inside sustainable-environmental) and
   `other = max(100 − taxonomy − sus_env − sus_soc, 0)`.
4. `_finalise` counts populated mandatory sections (note: completeness is **section-based**, not
   field-based — the per-annex field registries are passed in but only used as documentation),
   derives the status band, aggregates gaps ("[II.2] dnsh_methodology") and priority actions, and
   attaches PAI coverage plus a metadata block citing the regulation set.

### 7.4 Worked example — Art 8 fund with partial data

Fund: Art 8, ISIN+LEI set, E/S characteristics set, strategy text set, AUM €500M,
taxonomy-aligned 12 %, sustainable-env 30 %, sustainable-social 5 %, **no DNSH methodology, no data
sources**, benchmark unset. `POST /generate/annex-ii`:

| Section | Populated? |
|---|---|
| II.1 Summary | yes (characteristics present) |
| II.2 DNSH | **no** (dnsh_methodology empty) |
| II.3 ESG characteristics | yes |
| II.4 Strategy | yes |
| II.5 Asset allocation | yes (AUM > 0) |
| II.6 Monitoring | no due-diligence text → counts populated only if engagement/due-diligence present — assume engagement set → yes, but `missing_fields=[monitoring_methodology]` |
| II.7 Methodologies | **no** (needs DNSH *and* data sources) |
| II.8 Benchmark (optional) | no |

Completeness = 5/7 mandatory = **71.4 % → "partial"**. Pie chart: taxonomy 12.0, other-env
max(30−12,0)=18.0, social 5.0, other 100−12−18−5 = **65.0 %**. Gaps include `[II.2]
dnsh_methodology`, `[II.7] dnsh`, `[II.7] data_sources` with matching priority actions.

### 7.5 Data provenance & limitations

- **No synthetic data and no PRNG** — the engine transforms caller inputs only; `run_id` uses
  `uuid4` (identifier, not data). All values in outputs are either caller-supplied or template
  metadata.
- The engine checks *presence*, not *correctness*: it does not validate that PAI values are
  plausible, that pie segments are internally consistent with holdings, or that taxonomy
  percentages are KPMG-auditable. `completeness_pct` is section-granular, so one populated field
  can satisfy a section containing several RTS sub-fields.
- Mandatory-field constant lists contain minor label drift vs the registry (e.g. Annex I list
  names "indicator_14_gender_pay_gap"/"indicator_15_board_gender_diversity" while the registry
  puts pay gap at #12 and board diversity at #13 — the RTS numbering); the registry, which drives
  the PAI table, uses the correct RTS numbering.
- Output is structured JSON "suitable for downstream rendering"; no iXBRL tagging is performed
  despite the docstring's mention (delegated to the reporting layer).

### 7.6 Framework alignment

- **SFDR (EU) 2019/2088** — Art 4 entity-level PAI transparency (Annex I), Art 8 "light green" and
  Art 9 "dark green" product disclosures; the engine's classification field accepts
  art6/art8/art8plus/art9.
- **RTS Delegated Regulation (EU) 2022/1288** — defines the exact Annex I–V templates the engine
  mirrors, including the 14 mandatory Table-1 PAI indicators (9 climate/environment + 5
  social/governance), the Table 2/3 opt-ins, the asset-allocation graphic, and the top-15
  investments table. The real Table 1 derivations: carbon footprint = Σ(investment/EVIC ×
  emissions)/€M invested; GHG intensity = weighted average of investee tCO₂e/€M revenue — the
  engine stores these as metric strings; computation lives in the PAI engines.
- **ESMA Q&A 2023/ESMA36-43-2498 and the ESAs' 2021 Joint Opinion** — cited in engine metadata as
  interpretation sources for template application.
- **PCAF data-quality scores** — the 1–5 DQS carried per indicator adopts PCAF's data-quality
  ladder as the disclosure's data-quality vocabulary.

## 9 · Future Evolution

### 9.1 Evolution A — Auto-populate the five RTS templates from platform-computed metrics (analytics ladder: rung 1 → 2)

**What.** The E9 `sfdr_annex_engine` is a disclosure *template* engine, not a metrics calculator: it
maps caller-supplied fund data into the five SFDR RTS templates (Delegated Reg (EU) 2022/1288 —
Annex I PAI statement, II/III Art 8 pre-contractual/periodic, IV/V Art 9) and scores completeness
(`compliant ≥95% / partial ≥60%`), PAI coverage (`populated/14 × 100`), and the asset-allocation pie
(`sus_env = max(pct_sustainable_env − tax_aligned, 0)`). Every number in a generated annex is
caller-typed; the platform computes most of them elsewhere. Evolution A wires the templates to the
engines.

**How.** (1) Auto-populate: PAI indicators from `pcaf_regulatory`/`pcaf_quality`, taxonomy-aligned %
from the taxonomy engines, WACI and sustainable-investment splits from `fund_management` and
`sfdr_exclusion`'s report generator — so a generate call pre-fills computed values with per-field
provenance (engine-sourced vs caller-supplied vs missing). (2) Cross-validate the asset-allocation
pie against the fund's actual holdings so the Annex II/IV commitments are consistent with the
portfolio. (3) Confirm the five `POST /generate/annex-*` endpoints (traced `skipped`) work under
the harness. (4) Bench-pin the completeness and PAI-coverage scoring.

**Prerequisites.** Integration points to the PCAF/taxonomy/fund engines; a per-fund data store to
draw from. **Acceptance:** a generate call pre-fills PAI and taxonomy fields from platform engines
with per-field provenance; the allocation pie reconciles with holdings; completeness scoring
bench-pinned; generate endpoints pass.

### 9.2 Evolution B — RTS-template drafting copilot (LLM tier 2)

**What.** A copilot that assembles an SFDR annex conversationally — "generate the Annex IV
pre-contractual for this Article 9 fund and tell me what's missing" — calling the generator,
narrating the field-level gaps `validate_disclosure` returns, and iterating until completeness
crosses the 95% compliant line.

**How.** Five `POST /generate/annex-*` endpoints plus `validate_disclosure` and three reference GETs
(pai-indicators with the mandatory/optional split, template-fields per annex, frameworks) — a
complete grounding corpus for the RTS structure, so the copilot cites which template section and
which of the 14 mandatory PAIs a gap belongs to. The copilot drafts narrative sections but every
quantitative field must come from the generator payload, never LLM-estimated. Core node for a fund
regulatory-reporting desk with `sfdr_product_reporting` and `pcaf_regulatory`.

**Prerequisites.** Evolution A's auto-population for a genuinely useful draft (otherwise the copilot
narrates completeness of hand-typed input); generate endpoints confirmed callable. **Acceptance:**
every completeness %, PAI coverage figure, and named gap traces to a generator/validator response;
quantitative template fields are engine-sourced or explicitly flagged caller-supplied; the copilot
refuses to invent a PAI value for an unpopulated indicator and reports it as a gap instead.