## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** A genuine, methodologically sound WRI Aqueduct 4.0 engine exists
> at `backend/services/water_risk_engine.py` (`WaterRiskEngine.assess_aqueduct_risk`), with weighted
> 7-indicator scoring and an explicit, honestly-documented proxy mechanism. **The frontend never calls
> it** — there is no `axios`/`fetch` call anywhere in `WaterRiskPage.jsx`. The page instead renders a
> fully synthetic 60-company directory built with the seeded PRNG, with no relationship to the
> backend's real indicator-weighting logic. This deep dive documents both: the real backend
> methodology (§7.2) and what the disconnected frontend actually shows (§7.3–7.4).

### 7.1 What the backend engine computes (not currently displayed)

```python
indicators[ind] = supplied[ind] if ind in supplied else country_base   # NEVER a random draw
overall = Σ indicators[k] × AQUEDUCT_WEIGHTS[k]                        # weighted composite, 7 indicators
risk_tier = band(overall)  # Low → Extremely High, with an explicit ≥4.0 override to "Extremely High"
```

Critically, when an indicator isn't supplied by the caller, the engine falls back to a **deterministic
country reference base-stress level** (`COUNTRY_STRESS[country] × 5`), explicitly documented in the
docstring as "never a random draw" — this is a materially more honest design than most sibling
modules' seeded-PRNG fallbacks, and the engine tracks which indicators were proxied (`proxied_indicators`)
so a caller can distinguish real Aqueduct lookups from country-level defaults.

### 7.2 Backend parameterisation

| Element | Detail |
|---|---|
| `AQUEDUCT_INDICATORS` | 7 WRI Aqueduct 4.0 physical indicators (water stress, groundwater decline, coastal eutrophication, untreated wastewater, etc.), each 0–5 |
| `AQUEDUCT_WEIGHTS` | Weighted combination for `overall_score` |
| `COUNTRY_STRESS` multipliers | 0.50 (unlisted default) up to ~1.90 ("Extreme") — used only as the deterministic proxy base |
| `risk_tier` bands | `RISK_TIER_BANDS` lookup + explicit `≥4.0 → "Extremely High"` override |
| `basin_specific_factors` | Rule-based flags (e.g. groundwater_decline > 3.0 → "Groundwater over-exploitation risk") |

### 7.3 What the frontend actually displays (disconnected synthetic data)

60 synthetic companies (`COMPANIES`), named after real corporates (Nestlé, Coca-Cola, BHP, Shell,
Thames Water, …) but with entirely random attributes: `waterWithdrawal`/`consumption`/`discharge`/
`intensity` (all independent `sr()` draws), `waterStressScore` (`sr(i·23)·100`, a flat 0–100 uniform,
unrelated to the company's `primaryBasin`), `physicalRisk`/`regulatoryRisk`/`reputationalRisk` (each
an independent random pick from the 6 `RISK_LEVELS`, so a company can show "Low" physical risk and
"Extremely High" regulatory risk with no logical linkage), `cdpScore` (random letter grade), `sbtnStatus`.
`BASIN_DATA` (15 named basins) is a second, entirely independent synthetic dataset — a company's
`primaryBasin` field never actually looks up `BASIN_DATA` for that basin's real stress level.

### 7.4 Worked example

If the backend engine assessed a company in India (`country_code='IN'`) with no supplied Aqueduct
indicators, `country_base = COUNTRY_STRESS['IN'] × 5` (a high multiplier given India's documented
water stress) would deterministically drive every one of the 7 proxied indicators to the same
elevated value, producing a consistent, explainable "Extremely High" tier with a `data_note` flagging
that all indicators were proxied. **The frontend, by contrast**, for the same nominal "India" company
(if `country` were even tracked, which it isn't in `COMPANIES`), would show a `waterStressScore`
drawn independently at `sr(i·23)·100` — potentially "Low" for an Indian company and "Extremely High"
for a Norwegian one, purely by chance of company index `i`, with no country signal at all.

### 7.5 Data provenance & limitations

- **The backend engine's country-stress proxying is a genuinely defensible design** (deterministic,
  documented, distinguishes real from proxied data) — but it is not reachable from this page.
- **The frontend's 60 companies and 15 basins are both fully synthetic and mutually disconnected** —
  no company's basin, sector, or stress score is derived from any real WRI Aqueduct value, despite
  real basin names (Ganges, Colorado, Murray-Darling, etc.) suggesting otherwise to a reader.
- The sibling module `water-risk-analytics` (see its own deep dive) *does* wire in real
  `WRI_AQUEDUCT_WATER_RISK` reference data for 40 named basins — that data source, or the backend
  engine here, would be the natural fix for this module's synthetic gap.

**Framework alignment:** WRI Aqueduct 4.0 (2023) — correctly weighted and deterministically proxied
in the **backend only**; CDP Water Security and Alliance for Water Stewardship (both named in the
guide) appear only as label/badge text in the frontend, with no scoring logic behind them.
**Recommended remediation:** call `WaterRiskEngine.assess_aqueduct_risk()` per company (using each
company's real country + sector) instead of generating `COMPANIES` client-side, and join `BASIN_DATA`
to `WRI_AQUEDUCT_WATER_RISK` (already available via the `water-risk-analytics` module) rather than
generating a second independent basin dataset.
