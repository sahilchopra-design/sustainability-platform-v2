## 7 · Methodology Deep Dive

The `pcaf_sovereign` domain (`/api/v1/pcaf-sovereign`) implements **PCAF Part D — Sovereign
Bonds and Loans (2023)**: GDP/debt-based attribution of national GHG inventories to sovereign
holdings. Engine: `pcaf_sovereign_engine.py`, with a 40-country reference dataset.

### 7.1 What the module computes

The core PCAF Part D attribution identity (`calculate_attribution`):

```
government_debt_bn = gdp_bn × government_debt_pct_gdp / 100
attribution_factor = (outstanding_mn / 1000) / government_debt_bn     # both in €/$ bn
attributed_emissions_tco2e = attribution_factor × (ghg_inventory_MtCO2e × 1e6)
```

Plus optional LULUCF adjustment, a deterministic Data Quality Score, NDC-alignment
classification, and exposure-weighted portfolio aggregation.

### 7.2 Parameterisation / scoring rubric

**Sovereign profiles** (`SOVEREIGN_COUNTRY_PROFILES`, 40 countries) carry GDP 2022, debt %/GDP,
GHG inventory MtCO₂e, LULUCF net, NDC target vs 2010, S&P rating, and Annex status. Sample:

| Country | GDP €bn | Debt %/GDP | GHG MtCO₂e | NDC vs 2010 | Annex |
|---|---|---|---|---|---|
| US | 25,464 | 122.5 | 5,801 | −50% | annex1 |
| Germany | 4,082 | 66.3 | 762 | −55% | annex2 |
| China | 17,963 | 51.5 | 13,000 | (intensity) | non_annex1 |
| India | 3,387 | 81.7 | 3,360 | (intensity) | non_annex1 |

**Provenance:** UNFCCC national inventories (2022), World Bank (GDP/debt), NDCI database — real
published figures encoded as constants.

**DQS** (`_determine_dqs`, PCAF Part D 1-4): deterministic from reporting obligation — Annex I
parties (annual inventories) → **DQS 1**; non-Annex I (biennial BUR) → **DQS 2**; a caller may
pass `dqs_override`. Never randomised.

**NDC alignment thresholds** (`_assess_ndc_alignment`): gap ≤5% → aligned; ≤20% → partial;
>20% → misaligned. Requires a **caller-supplied trajectory gap** — with none it returns
`"insufficient_data"` (never fabricated); no NDC target → `"no_target"`.

### 7.3 Calculation walkthrough

`assess(country, outstanding_mn, …)`: looks up the profile, derives `government_debt_bn`,
converts inventory to tCO₂e, calls `calculate_attribution`, optionally recomputes with
`(ghg + lulucf)` for the LULUCF variant, determines DQS from Annex status, classifies NDC
alignment from the supplied trajectory gap, and normalises: `attributed_per_mn_invested`,
`carbon_intensity = ghg_tco2e / gdp_bn`. `assess_portfolio` aggregates exposure-weighted DQS
and carbon intensity, an NDC-alignment distribution, and an Annex exposure breakdown.

### 7.4 Worked example

Holding: €200M of German sovereign bonds.

- **Debt:** `4,082 × 66.3 / 100 = €2,706.4 bn`.
- **Attribution:** `(200/1000) / 2706.4 = 0.2 / 2706.4 = 7.390×10⁻⁵`.
- **Inventory:** `762 MtCO₂e × 1e6 = 762,000,000 tCO₂e`.
- **Attributed:** `7.390×10⁻⁵ × 762,000,000 = 56,312 tCO₂e`.
- **DQS:** Germany annex2 → **DQS 1** (annual UNFCCC inventory).
- **Carbon intensity:** `762,000,000 / 4,082 = 186,673 tCO₂e/€bn GDP`.
- **NDC:** target −55% exists; without a supplied trajectory gap → **"insufficient_data"** (the
  engine refuses to invent alignment).

If instead a caller supplies `current_trajectory_gap_pct = 8`, the classification is
`partial` (5 < 8 ≤ 20).

### 7.5 Data provenance & limitations

- Country data is **real published reference data** (UNFCCC/World Bank/NDCI), not seeded random
  values — there is no `sr()` PRNG anywhere in this engine.
- NDC alignment is deliberately **honest-null** unless a real trajectory source (Climate Action
  Tracker / NGFS) supplies the gap; the engine does not fabricate a trajectory.
- LULUCF is excluded by default (PCAF-recommended) and only included on explicit request.
- Attribution assumes total central-government debt as the denominator; sub-sovereign/municipal
  exposures are explicitly out of scope (Part E).

**Framework alignment:** **PCAF Global GHG Accounting Standard Part D (2023) §3.2** — the
GDP/debt attribution formula and the ~1.0 sum-to-unity property across debt holders are
implemented verbatim, including the MtCO₂e→tCO₂e conversion and the recommended LULUCF-exclusion
default. **PCAF Part D DQS 1-4** maps to UNFCCC reporting cadence (Annex I annual vs non-Annex I
biennial). **NDC alignment** references each country's Paris NDC 2030 target vs 2010 baseline,
classified against a real emissions trajectory. **ND-GAIN** is cited for the adaptation context
in the country profiles.
