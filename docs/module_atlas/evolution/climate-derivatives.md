## 9 · Future Evolution

### 9.1 Evolution A — Station-observed burn analysis with climate-trend adjustment (analytics ladder: rung 3 → 4)

**What.** §7 rates this a genuinely quantitative tier-A module: burn-analysis weather
pricing (`fair_value = mean(payouts)×(1+loading)` with Φ-based Greeks), Black-76 EUA
options, expected-loss cat-bond layering, live POST `/price-weather`, and five passing
ref endpoints. Its honest limitation: burn analysis samples `N(annual_mean, std_dev)`
from *user-supplied* normal parameters — the module's own overview says climate change
is shifting baselines and "repricing these products", but nothing in the engine
estimates that shift. Evolution A grounds and de-trends: HDD/CDD season histories
computed from observed station temperatures (the platform's NASA POWER / Open-Meteo
integrations cover the 9 `CITY_STATIONS`), a fitted linear/loess warming trend per
station, and pricing offered on both bases — stationary historical vs trend-adjusted —
with the fair-value difference surfaced as the climate-repricing signal the module's
thesis promises.

**How.** (1) `ref_degree_day_history(station, season, hdd, cdd, year)` built from the
weather feeds (30+ seasons); `price_weather_derivative` gains a `basis` parameter:
empirical resampling of observed seasons vs trend-adjusted resampling.
(2) Greeks unchanged (they operate on the payout distribution); bench pins extended
with a station-based reference case alongside the existing parametric one.
(3) EUA option path upgraded to pull spot/vol context from the `ref/eua-market`
endpoint it already serves.

**Prerequisites.** Station-history backfill via the existing weather ingesters;
distribution-fit diagnostics published per §8 (normality fails for some stations —
show it, use empirical resampling). **Acceptance:** trend-adjusted HDD fair value for
a warming station prices warm-winter floors above the stationary basis, with the
delta displayed; parametric fixture pricing is regression-pinned unchanged.

### 9.2 Evolution B — Weather-hedge structuring analyst (LLM tier 2)

**What.** This module has the platform's cleanest tier-2 substrate: a working pricing
POST plus five reference GETs. The analyst assistant runs structuring conversations:
"price a Chicago HDD floor at 5,800 strike, $5k/HDD tick, Nov–Mar", "how does the
hedge change if we move to a collar?", "is this product CCP-eligible and how is it
classified?" (the `/ref/ccp-eligibility` and `/classify-regulatory` endpoints exist
precisely for this) — every premium, Greek, and eligibility verdict from tool calls.

**How.** Tool schemas auto-generated from this module's OpenAPI routes per the atlas
endpoint map; the no-fabrication validator ties every $ and Greek to a logged
response; hedge-design reasoning (cap vs collar vs swap) grounded in the §5
product-template corpus; "show work" lists engine version and seed for the burn
simulation so any quote is reproducible.

**Prerequisites.** None hard — engine and endpoints are real today; Evolution A
upgrades quote quality but does not block. REQUIRE_AUTH posture for POST access
applies. **Acceptance:** a quoted fair value reproduces byte-identically via direct
endpoint call with the stated parameters; the assistant refuses to quote perils
outside the engine's product templates.
