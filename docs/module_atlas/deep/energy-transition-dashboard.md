## 7 · Methodology Deep Dive

This is an **executive rollup** dashboard aggregating the CU-sprint energy modules (asset registry,
segments, suppliers, revenue split, decommissioning). It matches its guide's intent (6 KPIs, portfolio
carbon-intensity aggregation, decarb pathway, peer ranking), but nearly all headline numbers are
**static, hand-authored KPI cards** rather than live computations from the sibling modules. The one
genuine calculation is the asset portfolio score. The named framework score — **Implied Temperature
Rise (2.2 °C)** — is displayed with no derivation in code; §8 specifies it.

### 7.1 What the module computes

The single live calculation is the count-weighted asset portfolio score:
```js
aggregateScore = round( Σ (score_i × count_i) / Σ count_i )
```
over 11 asset types (`ASSET_SCORES`), each with a transition `score` (0–100) and a `count`.

Everything else — the six executive KPIs, the decarb pathway series, supplier-risk breakdown, peer
ranking, and radar dimensions — is **stored data**, echoing values that originate in the sibling
CU modules (revenue-split 13.1% green revenue, decom $4.1B gap, supplier avg 51, ITR 2.2 °C).

### 7.2 Parameterisation / scoring rubric

Executive KPIs (static, hand-authored):

| KPI | Value | Target | Status | Source module |
|---|---|---|---|---|
| Green Revenue Ratio | 13.1% | 15% | amber | energy-revenue-split |
| CapEx Alignment | 41.6% | 50% (IEA NZE) | amber | energy-revenue-split |
| Portfolio Carbon Intensity | 285 tCO₂/GWh | <200 | red | energy-asset-registry |
| Decom Liability Gap | $4.1B | <$2B | red | energy-decommissioning-liability |
| Supplier Avg Score | 51/100 | >60 | amber | energy-supplier-network |
| Implied Temp Rise | 2.2 °C | <1.8 °C | red | (no computation) |

Asset scores (transition-readiness by type): Coal 18, Gas 52, Nuclear 75, Hydro 82, Wind 92, Solar 95,
Biomass 70, Refineries 28, LNG 45, Pipelines 35, Mines 15 — with `count` and a `contribution` (signed
weight to the portfolio score). Peer ranking: Equinor 72, Total 65, Shell 58, DemoCo 52, BP 48,
Eni 42 (realistic ordinal, editorial values).

### 7.3 Calculation walkthrough

Load static KPIs → compute `aggregateScore` from the count-weighted asset scores → render six tabs:
executive KPI grid (status-coloured), asset-portfolio-score bar (with signed contributions), decarb
pathway (actual vs NZE vs target intensity to 2050), supplier-risk categories, peer ranking, and a
board-report scaffold. The decarb pathway shows `actual` only through 2025 (nulls thereafter),
projecting NZE and company-target intensity to 2050.

### 7.4 Worked example

`aggregateScore` over the 11 asset types. Weighted sum = Σ score×count:
```
Coal 18×6=108, Gas 52×2=104, Nuclear 75×2=150, Hydro 82×2=164, Wind 92×4=368,
Solar 95×3=285, Biomass 70×2=140, Refineries 28×3=84, LNG 45×2=90,
Pipelines 35×3=105, Mines 15×2=30
Σ score×count = 1,628 ;  Σ count = 31
aggregateScore = round(1628 / 31) = round(52.5) = 53
```
A portfolio score of ≈53/100 reflects the drag from coal (6 plants at score 18) and mines/refineries
against the lift from wind/solar (7 assets at 92–95). The `contribution` column pre-attributes this:
coal −22, mines −18 vs wind +18, solar +15.

### 7.5 Companion analytics

- **Decarbonization pathway:** company carbon intensity (52.2 → 42.5 tCO₂/GWh actual 2020–2025) vs the
  IEA NZE pathway (to 0 by 2050) and an intermediate company target — the alignment gap widens post-2030.
- **Supplier risk:** 35% of suppliers below score 40, category HIGH/MEDIUM/LOW flags (echoes
  energy-supplier-network).
- **Peer ranking & radar:** DemoCo vs peer-average across 6 transition dimensions.
- **Board report:** a report scaffold, not generated content.

### 7.6 Data provenance & limitations

- **KPIs and most series are static editorial data** — they represent, but are not live-linked to,
  the sibling CU modules. The dashboard does not recompute them from source.
- Only `aggregateScore` is computed at runtime. The **ITR (2.2 °C) has no derivation** in code — it is
  a displayed figure.
- Peer values (Equinor 72, Shell 58…) are plausible-but-editorial.

**Framework alignment:** **IEA NZE 2050** — the decarb-pathway benchmark and the 50% green-capex bar;
**SBTi SDA (Sectoral Decarbonization Approach)** — the intended basis for the implied-temperature and
carbon-intensity convergence view. The **Implied Temperature Rise** metric (guide + KPI) maps a
portfolio's projected emissions pathway to the warming it implies if globally replicated — the method
specified in §8.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compute the displayed Implied Temperature Rise (ITR) for the energy company from its emissions pathway
vs a science-based benchmark, so the "2.2 °C" KPI is derived, not asserted.

### 8.2 Conceptual approach
Adopt the **SBTi / TCFD Portfolio Alignment Team** temperature-rating method: cumulative over/under-shoot
of the company's projected emissions vs an aligned sectoral pathway is converted to a warming outcome
via a Transient Climate Response to Cumulative Emissions (TCRE) coefficient. Benchmarks: **SBTi
Temperature Scoring**, **MSCI Implied Temperature Rise**, **CDP-WWF Temperature Rating**.

### 8.3 Mathematical specification
```
Overshoot = Σ_{t=base}^{2050} (E_company,t − E_aligned,t)        // cumulative GtCO₂ gap
ITR = T_benchmark + TCRE × Overshoot
E_aligned,t = SDA sectoral pathway (power/O&G) anchored to 1.5°C or WB2°C
TCRE ≈ 0.45 °C per 1000 GtCO₂ (IPCC AR6 central)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Company emissions pathway | `E_company,t` | company targets + BAU projection |
| Aligned sectoral pathway | `E_aligned,t` | SBTi SDA / IEA NZE power & O&G |
| TCRE | `TCRE` | IPCC AR6 (~0.45 °C/1000 GtCO₂) |
| Benchmark temperature | `T_benchmark` | 1.5 °C or 2 °C anchor |

### 8.4 Data requirements
Company Scope 1+2(+3) emissions history and forward targets, production forecast, sector code, and the
SBTi/IEA aligned pathway. Sources: company disclosures, SBTi target database, IEA NZE (free). Platform
already holds NZE milestones and grid-EF pathways (energy-transition engines).

### 8.5 Validation & benchmarking plan
Reconcile the ITR against SBTi's published temperature score for the same company (if rated) and
against MSCI ITR for peers; the peer ordinal (Equinor < Shell < BP) should be reproduced. Sensitivity:
vary TCRE ±0.1 and confirm ITR shifts <0.3 °C.

### 8.6 Limitations & model risk
ITR is highly sensitive to the Scope-3 boundary and the chosen benchmark pathway; small pathway
changes swing the rating across the 1.5/2 °C thresholds. Conservative fallback: absent a validated
company pathway, default to the sector-average temperature score (worse of company/sector), never the
optimistic tail.
