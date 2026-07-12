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
