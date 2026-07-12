## 7 · Methodology Deep Dive

This is a **central-bank climate-supervision reference dashboard**, not a quantitative stress model.
The MODULE_GUIDES entry frames it as a "macro-financial climate transmission" engine
(`FinStability = Σ Sector·Shock·Exposure`) — that transmission sum is **not implemented as a live
computation**; the module instead curates a rich, largely-real dataset of 41 central banks (NGFS
status, stress-test history, prudential frameworks, green-QE volumes) with real macro wiring, and
plots comparisons. The scenario/sector-impact figures are hard-coded expert values, not modelled.

### 7.1 What the module computes

Aggregations and derived views over the reference tables (no per-obligor risk calculation):
- `policyScore` = mean of a per-bank radar's dimension values.
- `compChart` = per-framework banks/horizon/sectors.
- `spreadData` = per-sector spread change and green-tilt impact (from `SECTOR_IMPACT`).
- CSV export of the 41-bank table.
- **Real macro join:** `SOVEREIGN_MACRO_2024` is merged into each bank by country name, attaching
  `gdp`, `inflation`, `debtGdp` (GAP-006 wiring).

### 7.2 Parameterisation / data rubric

| Element | Value | Provenance |
|---|---|---|
| 41 central banks (ECB, BoE, Fed, PBoC, MAS, RBI…) | NGFS status, stress-test year, capital add-on bps, green-QE €bn, coverage $tn | Hard-coded **real supervisory facts** (ECB Member since 2017, Fed "Emerging" mandate, RBI no stress test) |
| Macro (gdp, inflation, debt/GDP) | per country | **`sovereignMacroSeed` (SOVEREIGN_MACRO_2024)** — real macro data |
| Stress frameworks (ECB 2022, BoE CBES 2021, Fed pilot 2023…) | banks tested, horizon, loss projection, key finding | Hard-coded **real stress-test results** |
| NGFS scenarios (7) | temp, phys/trans risk, GDP 2050, carbon price 2030 | Hard-coded NGFS-consistent |
| Carbon-price scenarios, collateral haircuts, sector impact | prices, spreads, tilts | Hard-coded expert values |
| Quarterly trends (NGFS_GROWTH, GREEN_QE_TREND…) | trend + `sr()` noise | **Synthetic** time-series overlays |

### 7.3 Calculation walkthrough

The 41-bank table is filterable by region, NGFS status, and mandate. On load, real 2024 sovereign
macro is joined by country. Comparison charts re-slice the framework and sector-impact tables; a radar
scores a selected bank across policy dimensions and averages them into `policyScore`. The quarterly
NGFS-membership, green-QE and green-bond-demand series are generated as trend-plus-`sr()` overlays for
visual continuity. No NGFS shock is propagated to a modelled bank-loss number — loss projections shown
are the central banks' own published figures, hard-coded per framework.

### 7.4 Worked example (framework comparison)

The ECB 2022 climate stress test row hard-codes: 104 banks, 30-yr horizon, 22 sectors, "+EUR 70bn in
Hot House", €25tn coverage. The BoE CBES 2021 row: 19 banks, "+GBP 45bn worst case". `compChart`
plots these side by side; `policyScore` for the ECB radar averages its dimension scores (e.g. mandate,
stress-test, disclosure, green-QE, prudential) into a single 0–100 index. These are curated facts, not
outputs of a transmission model.

### 7.5 Data provenance & limitations
- The bank roster, stress-framework results, and macro join are **real reference data**; only the
  quarterly trend overlays carry `sr()` synthetic noise.
- The guide's `Σ Sector·Shock·Exposure` transmission and the "10–30% ECL uplift / 5–15% repricing"
  figures are **descriptive**, taken from published scenario analysis, not computed here.
- No bank-level exposure data, so no bottom-up loss modelling; the module is a supervisory landscape
  and disclosure-alignment tool.

**Framework alignment:** **NGFS Scenarios for Central Banks and Supervisors** — the scenario set,
temperatures and carbon-price paths follow NGFS phases. **BCBS 530** (Principles for the effective
management and supervision of climate-related financial risks) — the 9-principle supervisory alignment
view. **FSB Climate Roadmap** and **BIS** frame the cross-jurisdiction comparison. The green-collateral
haircuts and capital add-ons reflect ECB/BoE (SS3/19) practice. The related module
`climate-credit-integration` implements the *actual* NGFS-conditioned PD/LGD/ECL transmission this
dashboard only describes.
