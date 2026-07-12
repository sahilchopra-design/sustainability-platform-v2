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
