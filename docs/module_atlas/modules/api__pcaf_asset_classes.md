# Api::Pcaf_Asset_Classes
**Module ID:** `api::pcaf_asset_classes` · **Route:** `/api/v1/pcaf` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/pcaf/listed-equity` | `assess_listed_equity` | api/v1/routes/pcaf_asset_classes.py |
| POST | `/api/v1/pcaf/business-loans` | `assess_business_loans` | api/v1/routes/pcaf_asset_classes.py |
| POST | `/api/v1/pcaf/project-finance` | `assess_project_finance` | api/v1/routes/pcaf_asset_classes.py |
| POST | `/api/v1/pcaf/commercial-real-estate` | `assess_commercial_real_estate` | api/v1/routes/pcaf_asset_classes.py |
| POST | `/api/v1/pcaf/mortgages` | `assess_mortgages` | api/v1/routes/pcaf_asset_classes.py |
| POST | `/api/v1/pcaf/vehicle-loans` | `assess_vehicle_loans` | api/v1/routes/pcaf_asset_classes.py |
| POST | `/api/v1/pcaf/sovereign-bonds` | `assess_sovereign_bonds` | api/v1/routes/pcaf_asset_classes.py |
| POST | `/api/v1/pcaf/portfolio-aggregate` | `aggregate_portfolio` | api/v1/routes/pcaf_asset_classes.py |
| GET | `/api/v1/pcaf/asset-classes` | `list_asset_classes` | api/v1/routes/pcaf_asset_classes.py |
| GET | `/api/v1/pcaf/methodology` | `get_methodology` | api/v1/routes/pcaf_asset_classes.py |
| GET | `/api/v1/pcaf/sector-emission-factors` | `list_sector_emission_factors` | api/v1/routes/pcaf_asset_classes.py |
| GET | `/api/v1/pcaf/epc-benchmarks` | `list_epc_benchmarks` | api/v1/routes/pcaf_asset_classes.py |
| GET | `/api/v1/pcaf/vehicle-benchmarks` | `list_vehicle_benchmarks` | api/v1/routes/pcaf_asset_classes.py |
| GET | `/api/v1/pcaf/sovereign-data` | `list_sovereign_data` | api/v1/routes/pcaf_asset_classes.py |
| GET | `/api/v1/pcaf/dqs-improvement-guidance` | `dqs_improvement_guidance` | api/v1/routes/pcaf_asset_classes.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `EDGAR` *(shared)*, `EPC`, `IMF`, `annual` *(shared)*, `asset` *(shared)*, `borrower` *(shared)*, `building`, `data` *(shared)*, `datetime` *(shared)*, `energy` *(shared)*, `fastapi` *(shared)*, `generation` *(shared)*, `installed`, `investee` *(shared)*, `manufacturer`, `national` *(shared)*, `owned`, `physical`, `purchased`, `pydantic` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/pcaf/asset-classes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['standard', 'publisher', 'effective_date', 'asset_classes', 'data_quality_scores', 'uncertainty_bands'], 'n_keys': 6}`

**GET /api/v1/pcaf/dqs-improvement-guidance** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['principle', 'priority_order', 'data_sources_by_dqs'], 'n_keys': 3}`

**GET /api/v1/pcaf/epc-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['unit', 'source', 'note', 'ratings'], 'n_keys': 4}`

**GET /api/v1/pcaf/methodology** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['standard', 'attribution_factors', 'data_quality', 'scope_boundaries', 'regulatory_alignment', 'sector_emission_factors', 'temperature_alignment'], 'n_keys': 7}`

**GET /api/v1/pcaf/sector-emission-factors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['unit', 'source', 'note', 'factors'], 'n_keys': 4}`

**GET /api/v1/pcaf/sovereign-data** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'countries'], 'n_keys': 2}`

**GET /api/v1/pcaf/vehicle-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['unit', 'source', 'types'], 'n_keys': 3}`

**POST /api/v1/pcaf/business-loans** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['asset_class', 'asset_class_label', 'reporting_year', 'reporting_date', 'total_assets', 'total_outstanding_eur', 'total_financed_scope1_tco2e', 'total_financed_scope2_tco2e', 'total_financed_scope3_tco2e', 'total_financed_tco2e', 'total_financed_low_tco2e', 'total_finance`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The `pcaf_asset_classes` domain (`/api/v1/pcaf`) is an **investor-grade PCAF Part A financed-
emissions engine** covering all seven asset classes, implemented inline in
`pcaf_asset_classes.py` (no separate service module). It computes attribution factors,
auto-derives PCAF Data Quality Scores, applies DQS uncertainty bands, and aggregates to
portfolio carbon footprint, WACI and implied temperature.

### 7.1 What the module computes

Per holding: `attribution_factor` (asset-class specific), attributed Scope 1/2/3 emissions,
DQS-based low/central/high bands, and emission intensity. Per portfolio: total financed
emissions, carbon footprint, WACI and an implied temperature rise. The core financed-emissions
identity is:

```
financed_emissions = attribution_factor × investee_emissions
attribution_factor = outstanding / EVIC          (listed equity / corporate bonds)
low  = central × (1 − DQS_uncertainty)
high = central × (1 + DQS_uncertainty)
```

### 7.2 Parameterisation / scoring rubric

**DQS auto-derivation** (`_auto_dqs_corporate`, PCAF Tables 5.3-5.9) — a waterfall on data
provenance: verified emissions → 1, reported → 2, physical activity → 3, revenue → 4, else
sector proxy → 5. Sibling helpers exist for project finance, real estate and vehicle loans.

**DQS uncertainty multipliers** (`DQS_UNCERTAINTY`, PCAF Part A §5.2.3):

| DQS | ± band | Meaning |
|---|---|---|
| 1 | 10% | verified primary |
| 2 | 20% | unverified primary |
| 3 | 30% | physical-activity estimate |
| 4 | 45% | economic-activity / EEIO |
| 5 | 60% | proxy / extrapolated |

**Sector emission factors** (`SECTOR_EMISSION_FACTORS`, tCO₂e/€M revenue, source PCAF Table
5.4 / EXIOBASE 3.8): Energy S1 520 / S2 180 / S3 1800; Utilities 400/120/1100; Financials
3/8/85. **EPC factors** (`EPC_EMISSION_FACTORS`, kgCO₂/m²/yr, EU EPBD 2024 / CRREM v2.0): A+
5 → G 175. **Vehicle factors** (gCO₂/km, EU 2019/631 / ICCT 2023): BEV 0 → ICE petrol 155.
**Sovereign** emissions (EDGAR v8 / GCB 2023) and GDP-PPP (IMF WEO) drive
`SOVEREIGN_INTENSITY`. **WACI→temperature** (`WACI_TEMP_MAP`, TCFD 2021 / PACTA) is piecewise
linear: 30→1.5 °C, 200→2.0 °C, 800→3.2 °C, 2000→4.5 °C.

### 7.3 Calculation walkthrough

For listed equity (`POST /pcaf/financed-emissions`, per asset): DQS is taken from the caller
or auto-derived; `af = outstanding / EVIC`; company Scope 1/2 are used if present else
estimated via `sector_ef × revenue_€M`; Scope 3 (if `include_scope3`) similarly. Attributed
emissions `s1 = s1_company·af`, etc., `total = s1+s2+s3`. Uncertainty band
`total·(1±DQS_uncertainty)`. Emission intensity `= total / (outstanding/1e6)`. Data
completeness = fraction of 6 expected fields present. Portfolio WACI is revenue-weighted
intensity; `implied_temp = _waci_to_temp(WACI)` by interpolation.

### 7.4 Worked example

Listed-equity holding: `outstanding = €50M`, `EVIC = €500M`, verified Scope 1+2 = 40,000 +
10,000 tCO₂e, Scope 3 reported 200,000 tCO₂e (`include_scope3=True`), revenue €800M.

- **Attribution:** `af = 50 / 500 = 0.10`.
- **DQS:** verified emissions present → **DQS 1** → uncertainty ±10%.
- **Attributed:** S1 `40,000·0.10 = 4,000`; S2 `1,000`; S3 `20,000`; **total 25,000 tCO₂e**.
- **Band:** low `25,000·0.90 = 22,500`; high `27,500`.
- **Intensity:** `25,000 / (50) = 500 tCO₂e/€M invested`.
- If portfolio WACI ≈ 200 tCO₂e/€M revenue → implied temperature ≈ **2.0 °C** (map anchor).

### 7.5 Data provenance & limitations

- All emission factors, EPC/vehicle benchmarks and sovereign data are **cited public
  reference tables** (PCAF, EXIOBASE, EDGAR, IMF, ICCT, CRREM) hard-coded as constants — not
  a live data feed; vintages are 2022-2024.
- **No seeded-PRNG fabrication.** Missing investee emissions are estimated by transparent
  sector-factor × revenue formulas that raise explicit `DataGap` warnings, not random draws.
- Uncertainty bands are symmetric multiplicative factors, a simplification of PCAF's true
  uncertainty propagation.
- Implied temperature is a lookup, not a full PACTA/SBTi trajectory model.

**Framework alignment:** **PCAF Global GHG Accounting Standard v2.0 Part A** — attribution
factors (Tables 5.1-5.2), the DQS 1-5 hierarchy (Tables 5.3-5.9) and uncertainty (§5.2.3) are
implemented as written. **SFDR RTS Annex I** — the portfolio outputs are exactly PAI 1
(financed GHG), PAI 2 (carbon footprint = emissions/AUM) and PAI 3 (WACI). **EU Taxonomy
Art.8** — per-counterparty intensity supports GHG-intensity KPIs. **TCFD 2021** — carbon
footprint, WACI and implied temperature are the recommended portfolio metrics; the WACI→°C
map follows PACTA/TCFD portfolio-alignment guidance.

## 9 · Future Evolution

### 9.1 Evolution A — Data-sourced attribution and Monte Carlo uncertainty (analytics ladder: rung 3 → 4)

**What.** An investor-grade PCAF Part A financed-emissions engine covering all seven asset
classes: per holding it computes `financed_emissions = attribution_factor × investee_emissions`
(attribution = outstanding/EVIC for listed equity/bonds), auto-derives the PCAF Data Quality
Score via a provenance waterfall (`_auto_dqs_corporate`: verified→1, reported→2, physical→3,
revenue→4, sector proxy→5), applies DQS uncertainty bands (`low/high = central × (1 ∓
DQS_uncertainty)`), and aggregates to portfolio footprint, WACI, and implied temperature.
This is already rung-3 (benchmarked, PCAF-standard-aligned). The bands are deterministic
±multipliers rather than a real distribution, and EVIC/emissions are caller-supplied.
Evolution A raises it to predictive.

**How.** (1) Auto-source EVIC and investee emissions from the platform's `financial_data`
(yfinance EVIC extract) and EDGAR fundamentals, so attribution factors are computed from
stored market data with an `evidence_tier`, not hand-entered. (2) Replace the ±DQS-band
approximation with a Monte Carlo propagation: sample per-holding emissions from a
distribution whose width is set by the DQS, and report portfolio-level confidence intervals
(rung 4) — the QMC pattern the roadmap names. (3) Auto-derive DQS improvement pathways from
the `/dqs-improvement-guidance` waterfall (which data upgrade most cuts portfolio
uncertainty). (4) Bench-pin all seven asset-class attribution formulas.

**Prerequisites.** `financial_data` EVIC/emissions linkage (module exists); a DQS→variance
mapping for the Monte Carlo. **Acceptance:** attribution factors trace to stored market data
with an evidence tier; portfolio financed emissions carry a real confidence interval, not a
±band; the guidance endpoint ranks data upgrades by uncertainty reduction; bench pins pass.

### 9.2 Evolution B — Financed-emissions accounting copilot (LLM tier 2)

**What.** A copilot that runs the per-asset-class endpoints and portfolio aggregate, then
explains the number a bank actually reports — "your financed emissions are X tCO₂e at
portfolio DQS 3.2; the biggest uncertainty driver is the 40% of business loans on revenue
proxies; upgrading them to reported data cuts the band by Y" — each figure tool-sourced.

**How.** Eight POST endpoints (one per asset class + `/portfolio-aggregate`) plus reference
GETs (asset-classes, methodology, DQS-improvement-guidance, EPC-benchmarks) that ground every
PCAF constant. The DQS waterfall lets the copilot explain *why* a holding scored 4 and what
data would improve it. What-ifs ("what if we get verified emissions for our top-10 holdings?")
re-run statelessly. Cross-links to `pcaf_quality`, `pcaf_ecl_bridge`, and `financial_data`
copilots — a core node for a financial-institution desk.

**Prerequisites.** None hard — engine is PCAF-aligned and honest; stronger once Evolution A
sources data automatically. **Acceptance:** every attribution factor, DQS, and emissions
figure traces to a tool response; the copilot cites the specific PCAF table behind each DQS
from the reference endpoint; it presents implied temperature and bands as PCAF estimates with
their uncertainty, and refuses to assert a precision the DQS doesn't support.