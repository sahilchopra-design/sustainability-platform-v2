## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — the engine docstring ("Nature-RE Integration Engine") is the methodology statement; nothing to reconcile.)*

### 7.1 What the module computes

`backend/services/nature_re_integration_engine.py` (class `NatureREIntegrationEngine`) **bridges TNFD nature-risk outputs into real-estate valuation adjustments**, exposed via `api/v1/routes/nature_re_integration.py` (`POST /assess` single property, `POST /portfolio`; `GET /ref/{haircut-table, water-noi, bio-cap-rate, bng-costs, eu-tax-dnsh}`). For one property it produces a nature-adjusted value via three independent adjustment channels plus a BNG capex estimate and EU Taxonomy DNSH screen:

```
adjusted_NOI    = NOI × (1 + water_noi_adj_pct/100)
adjusted_caprate = cap_rate_pct + bio_cap_rate_bps/100
income_value    = adjusted_NOI / (adjusted_caprate/100)
nature_adj_value = income_value × (1 − nature_haircut_pct/100)
total_discount  = (1 − nature_adj_value / market_value) × 100
```

### 7.2 Parameterisation (property-type × risk-band lookup tables — platform calibrations)

**Nature haircut %** (`NATURE_HAIRCUT_TABLE`, keyed by LEAP-score band), showing industrial as most nature-exposed and single-family least:

| Property type | low | medium_low | medium | medium_high | high | critical |
|---|---|---|---|---|---|---|
| office | 0 | 0.5 | 1.5 | 3.0 | 5.0 | 8.0 |
| retail | 0 | 0.5 | 1.5 | 3.5 | 6.0 | 10.0 |
| industrial | 0 | 1.0 | 2.5 | 5.0 | 8.0 | 14.0 |
| multifamily | 0 | 0.3 | 1.0 | 2.0 | 4.0 | 7.0 |
| hotel | 0 | 0.5 | 2.0 | 4.0 | 7.0 | 12.0 |
| single_family | 0 | 0.2 | 0.8 | 1.5 | 3.0 | 5.0 |

**Water NOI adjustment %** (`WATER_NOI_ADJUSTMENT`, WRI Aqueduct bands, all negative), e.g. industrial extremely_high −10%, office −5%, single_family −2%. **Biodiversity cap-rate schedule** (`BIODIVERSITY_CAP_RATE_BPS`): score 0–1 → 0 bps, 1–2 → 5, 2–3 → 15, 3–4 → 30, 4–5 → 50 (wider cap rate = lower value). **BNG unit costs** (`BNG_UNIT_COSTS`, DEFRA Metric 4.0, GBP/unit): grassland £18k, woodland £25k, wetland £30k, hedgerow £15k/km, urban £20k, default £22k. **EU Taxonomy nature DNSH** (`EU_TAX_NATURE_DNSH`): max water stress 3.0, max biodiversity impact 2.0, EIA required if impact > 2, no net deforestation, 50 m wetland buffer.

**Score bands:** nature score → low ≤ 1, medium_low ≤ 2, medium ≤ 3, medium_high ≤ 3.5, high ≤ 4, else critical. Water score → low < 1, low_medium < 2, medium_high < 3, high < 4, else extremely_high. **Composite weights:** LEAP 0.50, water 0.30, biodiversity 0.20.

### 7.3 Calculation walkthrough

1. **Nature haircut:** band the LEAP overall score → look up haircut % for the property type.
2. **Water NOI:** band the baseline water score → look up the (negative) NOI adjustment %.
3. **Biodiversity cap rate:** first schedule bucket containing the impact score → bps (≥ 5.0 forces 50 bps).
4. **BNG capex:** if no units supplied but impact > 2 and area > 0, auto-estimate `units = area_ha × 0.10 × (1 + impact × 0.1)` (Environment Act 2021's mandatory 10% BNG); `capex = units × unit_cost × 1.17` (GBP→EUR).
5. **Value assembly:** adjusted NOI ÷ adjusted cap rate = income value, then apply the nature haircut; `total_discount` vs original market value.
6. **Composite score & band;** **EU DNSH:** fails if water > 3.0, biodiversity > 2.0, or any direct protected-site overlap (each appends a flag).
7. **Forward-looking water bands** for 2030/2050, a generated narrative, and threshold-driven recommendations.

Portfolio mode aggregates value discounts, average composite score, DNSH pass/fail counts, total BNG capex, band distribution, and flags properties with composite ≥ 3.0 as high risk.

### 7.4 Worked example — industrial asset, elevated nature risk

Input: industrial, market value €50M, NOI €3.0M, cap rate 5.0%, LEAP 3.6 (→ high band), water baseline 3.5 (→ high), biodiversity impact 2.5 (→ 2–3 bucket), 1 direct overlap, site 4 ha default habitat.

| Step | Computation | Result |
|---|---|---|
| Nature haircut | industrial / high | 8.0% |
| Water NOI adj | industrial / high | −5.0% |
| Bio cap-rate bps | score 2.5 → bucket 2–3 | 15 bps |
| Adjusted NOI | 3.0M × (1 − 0.05) | €2.85M |
| Adjusted cap rate | 5.0 + 15/100 | 5.15% |
| Income value | 2.85M / 0.0515 | €55.34M |
| Nature-adj value | 55.34M × (1 − 0.08) | **€50.91M** |
| Total discount | (1 − 50.91/50.0) × 100 | **−1.82%** (value *rises*) |
| BNG units | 4 × 0.10 × (1 + 0.25) | 0.5 units |
| BNG capex | 0.5 × 22,000 × 1.17 | **€12,870** |
| Composite | 3.6×0.5 + 3.5×0.3 + 2.5×0.2 | **3.35** → medium_high |
| EU DNSH | water 3.5 > 3.0, bio 2.5 > 2.0, 1 overlap | **FAIL** (3 flags) |

Note the interaction quirk: because income-approach value (NOI/cap rate) can exceed the reported market value, the water/cap-rate channels here *raise* the derived value enough that the total discount is negative despite an 8% haircut — a structural feature of recomputing value from income rather than discounting the input market value directly.

### 7.5 Data provenance & limitations

- **No PRNG** — deterministic table lookups; but unlike the platform's newer nature engines this one does **not** use the insufficient-data contract: missing nature scores default to 0.0 (→ "low"/no adjustment), silently treating "not assessed" as "no risk".
- All haircut/NOI/cap-rate magnitudes are **unattributed platform calibrations** (the tables cite TNFD/WRI/DEFRA as the *framing*, not as sources for the specific percentages); property-type ordering (industrial > hotel > retail > office > multifamily > single_family) is a reasonable but judgemental risk ranking.
- The value engine mixes an income-approach recomputation with a haircut on that recomputed value, so `total_nature_discount_pct` measures discount vs the *input* market value and can be negative when the income approach implies a higher base — the number is not a pure "nature discount" and should be read alongside `nature_haircut_pct`.
- BNG auto-estimation and the 1.17 GBP→EUR factor are static; the Environment Act 10% BNG is England-specific and applied here regardless of jurisdiction.
- Water NOI, cap-rate and haircut are applied additively/independently with no correlation between water stress and biodiversity impact.

### 7.6 Framework alignment

- **TNFD LEAP (v1.0, 2023):** the LEAP overall risk score (Locate/Evaluate/Assess/Prepare) is the primary driver of the nature haircut and composite; this engine consumes upstream LEAP outputs rather than running LEAP itself.
- **WRI Aqueduct Water Risk Atlas:** the 0–5 baseline/2030/2050 water-stress scores map to the five Aqueduct bands (low → extremely high) and drive the NOI adjustment and DNSH water check.
- **DEFRA Biodiversity Metric 4.0 / Environment Act 2021:** habitat unit costs and the mandatory 10% Biodiversity Net Gain rule underpin the BNG capex estimate.
- **EU Taxonomy Regulation 2020/852, Article 11 (DNSH):** water-stress, biodiversity-impact and protected-area-overlap thresholds implement the "do no significant harm" nature criteria as a pass/fail gate on taxonomy alignment.
- **RICS VPGA 12:** the RICS Red Book ESG-in-valuation guidance is the professional basis cited for treating nature risk as a valuation input and for the disclosure recommendations.
- **IPBES Global Assessment / ENCORE:** cited as the dependency-materiality basis behind the property-type haircut ordering.
