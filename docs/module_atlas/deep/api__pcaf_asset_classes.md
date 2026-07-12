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
