# Api::Sasb_Industry
**Module ID:** `api::sasb_industry` · **Route:** `/api/v1/sasb` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sasb/assess-industry` | `assess_industry` | api/v1/routes/sasb_industry.py |
| POST | `/api/v1/sasb/assess-materiality` | `assess_materiality` | api/v1/routes/sasb_industry.py |
| POST | `/api/v1/sasb/compare-peers` | `compare_peers` | api/v1/routes/sasb_industry.py |
| GET | `/api/v1/sasb/ref/sics-sectors` | `ref_sics_sectors` | api/v1/routes/sasb_industry.py |
| GET | `/api/v1/sasb/ref/industry-codes` | `ref_industry_codes` | api/v1/routes/sasb_industry.py |
| GET | `/api/v1/sasb/ref/materiality-map/{code}` | `ref_materiality_map` | api/v1/routes/sasb_industry.py |
| GET | `/api/v1/sasb/ref/issb-s2-mapping` | `ref_issb_s2_mapping` | api/v1/routes/sasb_industry.py |
| GET | `/api/v1/sasb/ref/gri-mapping` | `ref_gri_mapping` | api/v1/routes/sasb_industry.py |
| GET | `/api/v1/sasb/ref/esrs-mapping` | `ref_esrs_mapping` | api/v1/routes/sasb_industry.py |
| GET | `/api/v1/sasb/ref/sector-benchmarks` | `ref_sector_benchmarks` | api/v1/routes/sasb_industry.py |

### 2.3 Engine `sasb_industry_engine` (services/sasb_industry_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `SASBIndustryEngine.assess_industry` | entity_name, sasb_industry_code, reporting_year, reported_metrics | Full SASB industry assessment for an entity. Args: entity_name: Legal entity name sasb_industry_code: SASB SICS code (e.g. 'FN-CB') reporting_year: Fiscal year reported_metrics: {metric_code: {value_numeric, value_text, unit, dqs, methodology}} Returns: SASBIndustryAssessment with completeness, materiality, peer comparison, gaps |
| `SASBIndustryEngine.assess_materiality` | entity_name, sasb_industry_code, reporting_year, entity_overrides | SASB materiality assessment for a specific industry. Args: entity_name: Legal entity name sasb_industry_code: SASB SICS code reporting_year: Fiscal year entity_overrides: {topic_code: "likely_material"/"not_material"} overrides Returns: SASBMaterialityResult with topic-level materiality, risk exposure, recommendations |
| `SASBIndustryEngine.compare_to_peers` | entity_name, sasb_industry_code, reporting_year, entity_metrics | Peer comparison for SASB metrics against sector medians. Args: entity_name: Legal entity name sasb_industry_code: SASB SICS code reporting_year: Fiscal year entity_metrics: {metric_name: value} for peer comparison Returns: SASBPeerComparisonResult with metric-level comparison |
| `SASBIndustryEngine._get_industry_info` | code | Look up industry info from SICS registry. |
| `SASBIndustryEngine._get_sics_sector` | code | Get SICS sector label for an industry code. |
| `SASBIndustryEngine._compute_peer_summary` | code, reported, completeness | Quick peer summary for the industry assessment. |
| `SASBIndustryEngine.get_sics_sectors` |  | Full SICS sector and industry registry. |
| `SASBIndustryEngine.get_industry_codes` |  | Flat list of all SASB industry codes for UI dropdowns. |
| `SASBIndustryEngine.get_materiality_map` | sasb_industry_code | Materiality map for a specific industry. |
| `SASBIndustryEngine.get_issb_s2_mapping` |  | SASB-to-ISSB S2 cross-framework mapping. |
| `SASBIndustryEngine.get_gri_mapping` |  | SASB topic-to-GRI disclosure mapping. |
| `SASBIndustryEngine.get_esrs_mapping` |  | SASB topic-to-ESRS standard mapping. |
| `SASBIndustryEngine.get_sector_benchmarks` |  | Sector median benchmarks for peer comparison. |
| `asdict_safe` | obj | Convert dataclass or dict to dict. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sasb/ref/esrs-mapping** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['esrs_mapping'], 'n_keys': 1}`

**GET /api/v1/sasb/ref/gri-mapping** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['gri_mapping'], 'n_keys': 1}`

**GET /api/v1/sasb/ref/industry-codes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['industry_codes'], 'n_keys': 1}`

**GET /api/v1/sasb/ref/issb-s2-mapping** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['issb_s2_mapping'], 'n_keys': 1}`

**GET /api/v1/sasb/ref/materiality-map/{code}** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sasb_industry_code', 'materiality_map'], 'n_keys': 2}`

**GET /api/v1/sasb/ref/sector-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector_benchmarks'], 'n_keys': 1}`

**GET /api/v1/sasb/ref/sics-sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sics_sectors'], 'n_keys': 1}`

**POST /api/v1/sasb/assess-industry** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `sasb_industry_engine` — extracted transformation lines:**
```python
ratio = val_num / bv
bench_pctl = min(max((1.0 - ratio) * 50 + 50, 0), 100)
completeness_pct = (reported_count / total_applicable * 100) if total_applicable > 0 else 0.0
materiality_coverage = (material_reported / len(material_topics) * 100) if material_topics else 0.0
avg_dqs = (dqs_sum / dqs_count) if dqs_count > 0 else 5.0
total_omitted_metrics=total_applicable - reported_count,
issb_alignment = (total_material / max(len(topics), 1)) * 100
pct_diff = ((bench_val - entity_val) / bench_val * 100) if bench_val != 0 else 0
pct_diff = ((entity_val - bench_val) / bench_val * 100) if bench_val != 0 else 0
total_compared = above + below + at_median
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`backend/services/sasb_industry_engine.py` (`SASBIndustryEngine`) assesses an entity's
disclosures against its SASB industry standard — the industry-specific requirement IFRS S1
para 55 points reporters to. Three computations, exposed via `api/v1/routes/sasb_industry.py`
(`POST /assess-industry` plus 8 `GET /ref/*` registries):

```
completeness %          = reported_metrics / applicable_metrics × 100
materiality coverage %  = likely_material topics with ≥1 reported metric / likely_material topics × 100
avg DQS                 = mean of caller-supplied per-metric DQS (1=best … 5), default 5
IFRS S1 ¶55 compliant   = completeness ≥ 60% AND materiality coverage ≥ 70%
benchmark percentile    = clamp((1 − value/median) × 50 + 50, 0, 100)      # lower-is-better metrics
peer rank               = leader ≥70% above-median · above_average ≥50% · laggard ≥70% below · else average
```

`assess_materiality` additionally classifies topics (with entity overrides) and raises
double-materiality flags; `compare_to_peers` scores entity metrics against sector medians.

### 7.2 Parameterisation

**SICS registry** (`SICS_SECTORS`): 7 sectors / 20 industries implemented (of SASB's 11/77 —
the docstring states the target coverage), each with topic counts and key topics: Extractives
(EM-CO, EM-EP, EM-MD, EM-RM, EM-MM), Infrastructure (IF-EU, IF-GU, IF-RE, IF-EN), Financials
(FN-CB, FN-IN, FN-AC), Transportation (TR-AU, TR-TR, TR-MT, TR-AL), Chemicals (RT-CH), Food &
Beverage (FB-AG, FB-PF), Renewables (RR-RE).

**Materiality map** (`SASB_MATERIALITY_TOPICS`): per-industry topic entries carrying the real
SASB topic codes (e.g. `EM-CO-110a` GHG Emissions) with metric ids (`EM-CO-110a.1`…),
materiality level (`likely_material | potentially_material | not_likely_material`) and category
(environment / social_capital / human_capital / business_model / governance) — transcribed from
the SASB Materiality Map (2023 revision, per docstring).

**Cross-walks:** `SASB_ISSB_S2_MAPPING` (industry → IFRS S2 Appendix B cross-industry metrics),
`SASB_GRI_MAPPING` (topic → GRI disclosures, e.g. GHG Emissions → GRI 305), `SASB_ESRS_MAPPING`
(topic → ESRS E1–E5/S1/G1).

**Sector benchmark medians** (`SECTOR_BENCHMARK_MEDIANS`, 7 industries): e.g. EM-CO scope-1
intensity 1,250 tCO₂e/kt, TRIR 1.8, completeness 65%; IF-EU 0.45 tCO₂e/MWh, renewable share
35%; FN-CB financed-emissions 85 tCO₂e/€M, climate VaR 3.5%; TR-AU fleet 120 gCO₂/km, EV share
18%. The in-code comment marks the percentile formula as a "simple percentile estimation
(production: DB-driven)" — these medians are **synthetic demo benchmarks**, plausible but not
sourced to a named dataset.

### 7.3 Calculation walkthrough

`assess_industry` flattens the industry's topic→metric catalogue, marks each metric
reported/omitted from the caller's `reported_metrics` dict (which carries value, unit, DQS,
methodology), attaches GRI/ESRS equivalents per topic and a benchmark percentile where a
median key contains the topic slug. It then rolls up: completeness, materiality coverage,
average DQS, per-topic scores, a quick peer summary (entity completeness vs the sector's
median completeness; leader at +15pp, average within −5pp, else below_average), gap records
(severity `critical` when *all* metrics of a likely-material topic are omitted, else `high`),
and threshold-triggered recommendations (<50% completeness → "Critical… IFRS S1 para 55";
coverage <80%; avg DQS >3.0 → "Target DQS 2.0 for IFRS S2 attestation readiness"). Assessment
ids are deterministic `sha256(entity:industry:year)[:16]` — reproducible, not random.
`assess_materiality` applies caller overrides per topic code, counts the three materiality
buckets, tallies likely-material topics per category, and flags **double materiality** for
likely-material environment/social_capital topics (with a CSRD/ESRS relevance note). Note
`issb_alignment_pct` is computed as `material_topics/total_topics × 100` — despite its name it
measures materiality density, not coverage of the ISSB S2 Appendix B metric list (the
`issb_metrics` variable is fetched but unused).

### 7.4 Worked example — Commercial Bank (FN-CB)

Suppose FN-CB has 5 topics / 9 metrics, of which 3 topics are likely_material (7 metrics).
Entity reports 6 metrics covering all 3 material topics, DQS = {2,2,3,3,2,4}.

| Output | Computation | Result |
|---|---|---|
| Completeness | 6/9 × 100 | **66.7%** |
| Materiality coverage | 3/3 × 100 | **100%** |
| Avg DQS | (2+2+3+3+2+4)/6 | **2.67** |
| IFRS S1 ¶55 | 66.7 ≥ 60 and 100 ≥ 70 | **compliant** |
| Peer summary | 66.7 vs FN-CB median 60.0 → within +15/−5 band | "average" |
| Financed-emissions percentile | entity 70 vs median 85 → (1 − 70/85)×50+50 | **58.8th pctile** |

`compare_to_peers` with `{financed_emissions_intensity_tco2e_per_m_eur: 70, esg_integration_pct: 62}`:
intensity is lower-is-better (name contains "intensity") → above_median (+17.6%); integration
is higher-is-better → above_median (+12.7%); 2/2 above ⇒ **"leader"**.

### 7.5 Reference endpoints

`GET /ref/sics-sectors`, `/ref/industry-codes`, `/ref/materiality-map/{code}`,
`/ref/issb-s2-mapping`, `/ref/gri-mapping`, `/ref/esrs-mapping`, `/ref/sector-benchmarks`
expose the registries verbatim, letting frontend modules and other engines (e.g. ISSB/CSRD
pages) share the same topic catalogue and cross-walks.

### 7.6 Data provenance & limitations

- **No PRNG** — ids are content hashes; all metric values come from the caller. The registries
  are transcriptions: topic/metric codes follow the published SASB standards, but only 20 of 77
  industries are populated, and unlisted industries silently resolve to an empty topic list
  (completeness 0, and `assess_industry` would index `materiality_topics[0]` — empty-industry
  calls need the guard upstream).
- Sector medians are synthetic single-point demo values; the percentile formula is a linear
  proxy, not an empirical distribution (flagged in-code as production-DB territory).
- The 60/70 IFRS S1 compliance thresholds and the peer-rank cut-offs are platform rubrics —
  IFRS S1 itself has no numeric completeness test.
- `lower_is_better` is inferred from substring matching on metric names ("intensity", "trir",
  "risk", "var") — robust for the shipped benchmark keys, fragile for arbitrary caller keys.
- Double-materiality flags are a stated "simplified heuristic" (financial + impact both "high"
  for env/social topics), not a CSRD-grade IRO assessment.

### 7.7 Framework alignment

- **SASB Standards (IFRS Foundation, consolidated 2023)** — SASB defines 77 industry standards
  under SICS, each with disclosure topics and quantitative/qualitative metrics; materiality is
  pre-assessed at industry level via the Materiality Map. The engine reproduces this structure
  (topic codes like `EM-CO-110a` are the real SASB identifiers) for a 20-industry subset.
- **IFRS S1 para 55** — requires an entity to "refer to and consider the applicability of" the
  SASB disclosure topics for its industry; the engine operationalises this as the
  completeness/coverage compliance test (thresholds are the platform's own).
- **IFRS S2 Appendix B** — industry-based guidance derived from SASB climate topics; mapped per
  industry in `SASB_ISSB_S2_MAPPING`; the DQS ≤2 recommendation references S2 assurance
  readiness.
- **GRI & ESRS cross-walks** — topic-level equivalences (e.g. GHG Emissions ↔ GRI 305 ↔ ESRS
  E1) supporting multi-framework reporters; double-materiality flags point CSRD-scope entities
  to ESRS.
- **PCAF DQS convention** — the 1–5 data-quality scale (1 = best) is borrowed from PCAF's data
  quality scoring, applied here per SASB metric.

## 9 · Future Evolution

### 9.1 Evolution A — Benchmark against real peer medians and expand SICS coverage (analytics ladder: rung 2 → 3)

**What.** `SASBIndustryEngine` assesses an entity against its SASB industry standard (the
industry-specific requirement IFRS S1 ¶55 points to): `completeness = reported/applicable × 100`,
`materiality coverage = material-topics-reported/material-topics × 100`, IFRS-S1-¶55-compliant at
≥60% completeness AND ≥70% materiality coverage, plus a benchmark percentile
(`clamp((1−value/median)×50+50, 0, 100)`) and peer ranking. The honest limits: only 7 sectors /
20 industries of the full SICS taxonomy are implemented, and `compare_to_peers` scores against
sector *medians* that are static reference values, not a live peer distribution. Evolution A
grounds the benchmarks.

**How.** (1) Replace the static sector medians with real distributions computed from the platform's
`financial_data`/CSRD-extracted peer set, so a percentile reflects an actual cohort with a stated
n and as-of date — the current percentile is only as good as the hardcoded median. (2) Expand SICS
coverage beyond the 20 implemented industries toward the full 77 (the reference registries scaffold
this). (3) Grade DQS from evidence rather than the caller-supplied per-metric DQS defaulting to 5.
(4) Bench-pin completeness, materiality coverage, and the percentile formula.

**Prerequisites.** A peer-disclosure dataset for live medians (via `financial_data`/`peer_benchmark`);
expanded SICS industry definitions. **Acceptance:** benchmark percentiles derive from a real cohort
with n and as-of date, not a static median; SICS coverage materially expanded; DQS evidence-graded;
formulas bench-pinned.

### 9.2 Evolution B — SASB disclosure copilot with cross-framework mapping (LLM tier 2)

**What.** A copilot that runs `/assess-industry` and explains the verdict — "you're not IFRS S1
¶55 compliant: completeness is 58% (below 60%) and you're missing 2 of 5 likely-material topics;
here they are, and here's how they map to your ISSB S2 and ESRS disclosures" — each figure
tool-sourced.

**How.** Three POST endpoints (`/assess-industry`, `/assess-materiality`, `/compare-peers`) plus
eight `/ref/*` registries (SICS sectors, industry codes, materiality map, and ISSB-S2/GRI/ESRS
mappings) — a rich, self-contained grounding corpus. The cross-framework mapping endpoints let the
copilot answer "we already report under ISSB — what SASB metrics does that cover?", reducing double
work. Peer comparison drives competitive-positioning narratives. Cross-links to `issb_s2`, `gri`,
and `peer_benchmark` copilots.

**Prerequisites.** None hard — engine is honest and reference-rich; peer answers are far stronger
after Evolution A's real medians. **Acceptance:** every completeness, coverage, and percentile
figure traces to a tool response; the copilot uses the real ISSB/GRI/ESRS mapping endpoints for
cross-framework claims; it discloses when a benchmark rests on a static median (pre-Evolution-A)
and refuses to assert IFRS S1 compliance beyond the ¶55 rule the engine computes.