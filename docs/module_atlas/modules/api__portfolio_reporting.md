# Api::Portfolio_Reporting
**Module ID:** `api::portfolio_reporting` · **Route:** `/api` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/pcaf/financed-emissions` | `calculate_financed_emissions` | api/v1/routes/portfolio_reporting.py |
| POST | `/api/sfdr/pai/portfolio` | `sfdr_pai_portfolio` | api/v1/routes/portfolio_reporting.py |
| POST | `/api/ecl/portfolio-stress` | `ecl_portfolio_stress` | api/v1/routes/portfolio_reporting.py |
| GET | `/api/eu-taxonomy/portfolio-alignment` | `eu_taxonomy_portfolio_alignment` | api/v1/routes/portfolio_reporting.py |
| POST | `/api/paris-alignment/portfolio` | `paris_alignment_portfolio` | api/v1/routes/portfolio_reporting.py |
| GET | `/api/reports/sfdr-rts` | `sfdr_rts_report` | api/v1/routes/portfolio_reporting.py |
| POST | `/api/csrd/portfolio-materiality` | `portfolio_materiality` | api/v1/routes/portfolio_reporting.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `real-db`

**Database tables:** `CSRD` *(shared)*, `ESRS`, `ITR`, `MSCI` *(shared)*, `__future__` *(shared)*, `available`, `csrd_entity_registry` *(shared)*, `csrd_gap_tracker` *(shared)*, `csrd_kpi_values` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `holdings`, `numeric`, `pydantic` *(shared)*, `renewable` *(shared)*, `sector` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/eu-taxonomy/portfolio-alignment** — status `passed`, provenance ['real-db'], source tables: `csrd_entity_registry`, `csrd_kpi_values`
Output: `{'type': 'object', 'keys': ['portfolio_taxonomy_alignment_pct', 'portfolio_capex_alignment_pct', 'benchmark_pct', 'vs_benchmark_pp', 'by_entity', 'data_coverage_pct'], 'n_keys': 6}`

**GET /api/reports/sfdr-rts** — status `passed`, provenance ['real-db'], source tables: `csrd_entity_registry`, `csrd_gap_tracker`, `csrd_kpi_values`
Output: `{'type': 'object', 'keys': ['fund_id', 'reporting_year', 'generated_at', 'entity_count', 'sfdr_classification', 'outputs', 'filing_notes'], 'n_keys': 7}`

**POST /api/csrd/portfolio-materiality** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/ecl/portfolio-stress** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/paris-alignment/portfolio** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/pcaf/financed-emissions** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/sfdr/pai/portfolio** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The `portfolio_reporting` domain (prefix `/api`) is a **regulatory portfolio-reporting API**
(`portfolio_reporting.py`) that pulls entity data directly from the CSRD extraction pipeline
(`csrd_kpi_values` + `csrd_entity_registry`) and computes PCAF financed emissions, SFDR PAI
aggregation, NGFS climate-stress VaR, EU Taxonomy alignment, Paris temperature scores and CSRD
double-materiality — all without requiring separate GHG inputs.

### 7.1 What the module computes

Six endpoints, each resolving entities by full or 8-char-prefix UUID and reading their KPIs:

```
PCAF          financed = attribution × GHG_total(from CSRD KPIs)
SFDR PAI      14 mandatory indicators aggregated across holdings
ECL stress    portfolio VaR = Σ holding_value × NGFS_sector_var%
Paris ITR     weighted temperature = Σ (weight · entity_ITR)
Taxonomy      eligible/aligned turnover+capex from CSRD DB
Materiality   CSRD double-materiality aggregation
```

### 7.2 Parameterisation / scoring rubric

**ITR lookup** (`_ITR_LOOKUP`, keyed on 8-char entity UUID, MSCI-ITR proxy): BNP Paribas 1.9,
Ørsted 1.5, RWE 1.7 °C, with sector fallbacks (`_ITR_SECTOR_DEFAULT`): financial 2.05, energy
developer 1.80, mining 2.30, other 2.15.

**NGFS sector VaR** (`_NGFS_VAR`, % of holding value, [transition, physical]) — Phase-4-style:

| Scenario | Energy dev. (T/P) | FI (T/P) | Real estate (T/P) |
|---|---|---|---|
| Net Zero 2050 | −5.8 / −1.3 | −0.8 / −0.7 | −1.5 / −1.5 |
| Below 2 °C | −4.2 / −1.9 | −0.6 / −1.0 | −1.1 / −2.0 |
| Delayed Transition | −6.1 / −3.7 | −1.8 / −2.4 | −2.5 / −3.0 |
| Hot-House World | −1.6 / −18.5 | −0.4 / −9.0 | −0.5 / −12.0 |

Note the NGFS logic: transition losses peak in Delayed Transition; physical losses explode in
Hot-House World.

**14 SFDR PAIs** (`_PAI_INDICATORS`) mapped to CSRD ESRS KPI codes (e.g. PAI-1/3 →
`E1-6.GHGIntensityRevenue`, PAI-12 → `S1-16.GenderPayGapPct`). **Rev/EV ratios**
(`_REV_EV_RATIO`) proxy revenue from enterprise value for GHG estimation.

**Provenance:** ITR values are an MSCI-ITR/SBTi proxy; NGFS VaR are Phase-4-consistent
parameters; all entity KPIs come from real CSRD-extracted disclosures.

### 7.3 Calculation walkthrough

`_resolve_entity` matches the entity by `CAST(id AS text) LIKE prefix%` (tolerating partial
UUIDs). `_get_kpis` loads `{indicator_code: value}` and **excludes year-like values (2000-2100)**
that the extractor captured as target-year references rather than measurements. `_ghg_total_tco2e`
derives total GHG by priority: reported TotalGHGEmissions → Scope 1 + Scope 2 → GHG intensity ×
revenue proxy, returning the value plus a DQ score and the source method. PCAF then applies
attribution; ECL stress multiplies each holding value by its sector's NGFS VaR %; Paris ITR
weights entity temperatures by exposure.

### 7.4 Worked example

Portfolio: €100M in an energy-developer holding, under **Delayed Transition**.

- **ECL stress:** transition `−6.1%` + physical `−3.7%` = −9.8% → VaR `€100M × 0.098 = €9.8M`.
- If a second holding is BNP Paribas (financial, exposure €100M, ITR 1.9 °C from `_ITR_LOOKUP`)
  and the energy developer has sector-default ITR 1.80 °C, equal weights → **weighted ITR
  `(1.9 + 1.80)/2 = 1.85 °C`**.
- **SFDR PAI-1:** if BNP's CSRD KPI `E1-6.GHGIntensityRevenue` resolves, it feeds PAI-1
  directly; a year-like value (e.g. 2030) would be excluded as a target reference, not a
  measurement.

### 7.5 Data provenance & limitations

- Entity KPIs are **real CSRD-extracted disclosures**, but the ITR lookup and NGFS VaR
  parameters are **proxy/curated constants** (MSCI-ITR proxy, Phase-4-style VaR), not live
  vendor feeds.
- **No `sr()` PRNG.** GHG totals are derived by a documented priority waterfall with an explicit
  DQ score and source method; missing data lowers DQ rather than being fabricated.
- The year-value exclusion filter is a pragmatic guard against the extractor mis-capturing
  target years as intensities.
- ECL stress is a single-factor VaR (sector × scenario), not a full obligor-level PD/LGD model.

**Framework alignment:** **PCAF v2.0 Part A** (financed-emissions attribution); **SFDR RTS
Annex I + II (EU 2022/1288)** — the 14 mandatory PAIs and the Annex II RTS report structure;
**NGFS Phase 4** — the four-scenario sector VaR (Net Zero / Below 2 °C / Delayed Transition /
Hot-House) with transition + physical channels; **EU Taxonomy (2021/2139)** — eligible/aligned
turnover-capex; **MSCI/SBTi ITR methodology** — implied-temperature portfolio scoring; **CSRD
ESRS** — double-materiality aggregation and the ESRS KPI codes that back every indicator.

## 9 · Future Evolution

### 9.1 Evolution A — Replace the hardcoded ITR lookup and broaden CSRD-sourced coverage (analytics ladder: rung 2 → 3)

**What.** A regulatory portfolio-reporting API that pulls entity data directly from the CSRD
extraction pipeline (`csrd_kpi_values` + `csrd_entity_registry`) and computes six things without
separate GHG inputs: PCAF financed emissions, SFDR PAI aggregation, NGFS climate-stress VaR
(`Σ holding_value × NGFS_sector_var%`), EU Taxonomy alignment, Paris ITR (`Σ weight·entity_ITR`),
and CSRD double-materiality. The taxonomy and SFDR-RTS endpoints trace **real-db** (good), but
the ITR is a hardcoded `_ITR_LOOKUP` keyed on 8-char entity UUID (BNP 1.9, Ørsted 1.5…) with
sector fallbacks — a small hand-curated table, not a computed temperature. Evolution A grounds
the ITR and broadens coverage.

**How.** (1) Replace `_ITR_LOOKUP` with a computed implied temperature from the entity's actual
targets and pathway (wire to the `net_zero_targets` engine) or from a licensed ITR source,
labelling the provenance — presenting BNP's temperature as 1.9 from a hardcoded dict is the kind
of unanchored figure the platform's fabrication discipline targets. (2) Extend CSRD-sourced
coverage so more holdings resolve via `csrd_kpi_values` rather than falling to sector defaults,
reporting `data_coverage_pct` prominently. (3) Fix the `/ecl/portfolio-stress` (traces failed)
and `/csrd/portfolio-materiality` (skipped) endpoints. (4) Bench-pin the six aggregations.

**Prerequisites.** `net_zero_targets` ITR linkage or a licensed ITR feed; broader CSRD KPI
coverage. **Acceptance:** portfolio ITR derives from computed/sourced temperatures with
provenance, not a hardcoded dict; `data_coverage_pct` reflects real CSRD resolution; the
failed/skipped endpoints return `passed`; bench pins pass.

### 9.2 Evolution B — One-call regulatory portfolio-reporting copilot (LLM tier 2)

**What.** A copilot that produces a fund's regulatory pack conversationally — "give me our SFDR
RTS filing, Taxonomy alignment, and Paris temperature for 2024" — calling the six endpoints and
narrating the CSRD-sourced results, each figure traceable to a holding's KPI row.

**How.** Six endpoints reading the real CSRD tables form the tool set; because entities resolve
by UUID prefix against `csrd_entity_registry`, the copilot can report exactly which holdings
contributed and which fell to defaults. The `/reports/sfdr-rts` endpoint already emits a
filing-ready structure — the copilot's drafting layer renders it. This is a headline node for a
fund-reporting desk, composing into the report-studio artifacts the roadmap describes for tier-3.

**Prerequisites.** Evolution A's ITR fix — a copilot citing portfolio temperature from the
hardcoded lookup would present curated numbers as computed. **Acceptance:** every emissions, PAI,
alignment, and temperature figure traces to a tool response with its holding source; the copilot
reports `data_coverage_pct` and flags default-fallback holdings; it refuses to assert filing
compliance and frames output as the computed regulatory figures.