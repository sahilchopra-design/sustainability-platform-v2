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
