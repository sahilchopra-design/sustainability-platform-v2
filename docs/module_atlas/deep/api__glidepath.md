## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is grounded in
`backend/services/pcaf_time_series_engine.py`, `backend/services/data_hub_client.py`, and
`backend/api/v1/routes/glidepath.py`. A sibling read-only domain, `glidepath_serve`, serves the
Data-Hub-stored pathway tables that this engine consumes.)*

### 7.1 What the domain computes

Three analytics over portfolio decarbonisation:

**1. Sector glidepath tracking** (`GET /sector/{sector}`, `/portfolio/{pid}/status-grid`):
portfolio **WACI** per sector-year is compared to an NZBA/IEA-NZE reference pathway with a
red-amber-green rule:

```
WACI(sector, yr) = Σᵢ (exposureᵢ / Σexposure) × (scope1ᵢ + scope2_marketᵢ) / net_turnover_M€ᵢ
deviation = (actual − glidepath) / glidepath
RAG: GREEN if deviation ≤ 0 · AMBER if ≤ +10% · RED if > +10% · GREY if target = 0 or no data
IEA NZE reference = NZBA target × 0.90    (code comment: "slightly more ambitious")
```

Targets between anchor years are **linearly interpolated** (`interpolate_glidepath`), clamped at
the endpoints.

**2. CRREM real-estate stranding** (`GET /crrem/{asset_type}`, `/crrem/asset/{asset_id}`): asset
kgCO₂/m² vs a CRREM-style pathway; **stranding year** = first year the asset goes RED, reset to
`None` if a later year returns to GREEN/AMBER (i.e. only a *persistent* terminal breach counts).

**3. PCAF data-quality score** (`GET /dqs/{pid}`, `/dqs/{pid}/improve`): exposure-weighted DQS
with a prioritised improvement roadmap:

```
weighted_DQS = Σ exposureᵢ × dqsᵢ / Σ exposureᵢ
dqsᵢ = pcaf_dqs column if 1–5, else 3 (reported scope 1) / 4 (LEI → Data Hub lookup) / 5 (sector avg)
improvement impact of asset i = exposureᵢ × (dqsᵢ − (dqsᵢ − 1)) / Σ exposure
```

### 7.2 Parameterisation — reference pathways

**NZBA fallback glidepaths** (WACI tCO₂e/M€ revenue; code cites NZBA 2021 Guidelines + IEA WEO
2023; used when the Data Hub pathway tables are offline):

| Sector | 2020 | 2030 | 2040 | 2050 | Sector | 2020 | 2030 | 2040 | 2050 |
|---|---|---|---|---|---|---|---|---|---|
| Power | 220 | 80 | 10 | 0 | Aviation | 850 | 600 | 250 | 0 |
| Oil & Gas | 680 | 460 | 200 | 0 | Cement | 620 | 400 | 140 | 0 |
| Steel | 1850 | 1200 | 400 | 0 | Aluminium | 1100 | 650 | 200 | 0 |
| Shipping | 1120 | 750 | 300 | 0 | Real Estate | 55 | 32 | 12 | 0 |
| Other | 300 | 190 | 80 | 0 | | | | | |

**CRREM fallback** (kgCO₂/m²·yr, "European office" style): Office 45→25→9→1.5,
Retail 55→30→11→2.0, Residential 40→20→6→0.5, Industrial 60→34→12→1.8, Hotel 65→36→14→2.5
(2020→2030→2040→2050).

**Thresholds:** AMBER band +10%; DQS improvement priority HIGH if weighted-impact > 0.05,
MEDIUM > 0.01; roadmap upgrades one DQS notch per asset, skips assets already at DQS ≤ 2, caps
the plan at top-20 and the "potential DQS" at the top-5 actions.

### 7.3 Calculation walkthrough

`/sector/{sector}` first tries the Data-Hub pathway (`data_hub_client.get_glidepath`), falling
back to the hardcoded table (`glidepath_source` records which). Actuals come from
`_compute_waci_rows`: a SQL join of `assets_pg` (exposure, sector) → `csrd_entity_registry`
(net turnover) → `esrs_e1_ghg_emissions` (scope 1 + market-based scope 2), weighted by exposure
share **across the whole portfolio** (so sector WACIs are portfolio-weight scaled, not
renormalised within the sector). Data points span 2020–2050 in 5-year steps plus any reported
years; `current_rag` is the most recent year with an actual.

### 7.4 Worked example — Steel sector, 2027 actual

Portfolio steel WACI reported for 2027 = 1,500 tCO₂e/M€.

| Step | Computation | Result |
|---|---|---|
| Interpolated NZBA target 2027 | 1600 + (2027−2025)/(2030−2025) × (1200−1600) | **1,440** |
| IEA NZE reference | 1,440 × 0.90 | 1,296 |
| Deviation | (1500 − 1440)/1440 | **+4.2% → AMBER** |

DQS cross-check: assets €60M @ DQS 5, €40M @ DQS 2 → weighted DQS = (60×5+40×2)/100 = **3.8**;
the roadmap proposes upgrading the DQS-5 asset to 4 (impact = 60×1/100 = 0.60 → HIGH priority;
potential DQS 3.2) and flags "Add LEI codes … (DQS 5 → 4)"; the DQS-2 asset is skipped.

### 7.5 RAG semantics & stranding rubric

- GREEN means **at or below** pathway (any negative deviation), not merely "close" — matching
  NZBA target-setting practice where the pathway is a ceiling.
- `target = 0` (the 2050 endpoint) returns GREY, avoiding division by zero — so end-state years
  are never scored.
- CRREM stranding is *last-crossing* logic: temporary breaches that later recover do not strand;
  the true CRREM methodology defines stranding as the first crossing of the asset's intensity
  line with the decarbonisation pathway, so this implementation is more lenient for
  non-monotonic actuals.

### 7.6 Data provenance & limitations

- No `sr(seed)` PRNG. Actuals derive from stored CSRD/ESRS emissions and portfolio tables;
  pathway numbers are Data-Hub-served when available, otherwise the **hardcoded fallback tables
  above — stylised transcriptions of NZBA/IEA/CRREM shapes, not licensed CRREM v2 data**
  (real CRREM pathways are country × asset-type specific; the fallback is one European-style
  curve per type; `country` is accepted but unused in fallback mode).
- IEA NZE = NZBA × 0.90 is an admitted approximation, not an IEA series.
- WACI uses (S1 + market-based S2) only — no scope 3, and the join requires exact
  `legal_name = company_name` matches; unmatched assets silently drop from actuals.
- Sector WACI is weighted by *portfolio-wide* exposure share; a small sector's WACI is deflated
  relative to a within-sector weighting (affects RAG severity for small books).
- DQS ladder inference (3/4/5 from data availability) is a heuristic; PCAF's actual DQS depends
  on scorecard options per asset class. The status grid always uses fallback pathways (never
  Data Hub).

### 7.7 Framework alignment

- **NZBA (Net-Zero Banking Alliance, 2021 Guidelines)** — sectoral intensity glidepaths to 2050
  with 5-year interim points; NZBA requires 2030 intermediate targets on IEA-NZE-consistent
  pathways — precisely the shape of the fallback tables and the RAG deviation test.
- **IEA Net Zero Emissions by 2050** — referenced as the more ambitious overlay (approximated at
  90% of NZBA here); in the real NZE, sector trajectories come from the IEA scenario model, not
  a scalar of NZBA.
- **CRREM (Carbon Risk Real Estate Monitor)** — asset-level kgCO₂/m² decarbonisation pathways
  and the "stranding year" concept (year the asset's intensity exceeds its pathway); CRREM
  derives country/type pathways by downscaling a 1.5°C global budget via SDA — this module
  consumes stored or fallback curves rather than deriving them.
- **PCAF Global GHG Accounting Standard §4 (data quality)** — the 1–5 DQS ladder,
  exposure-weighted portfolio DQS, and the improvement-roadmap framing (PCAF encourages
  disclosing weighted DQS and improving it over time); WACI itself follows the TCFD/PCAF
  intensity formula.
