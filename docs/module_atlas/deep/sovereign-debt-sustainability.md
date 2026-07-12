## 7 · Methodology Deep Dive

### 7.1 What the module computes

`COUNTRIES_RAW` (61 real, named countries spanning G20/EU/SIDS/LDC/EMDE/Frontier/Advanced groups) carries
real 2024-era macro data (GDP $T, population, debt/GDP, S&P-style rating, fiscal balance %, CO₂ Mt) — **no
`sr()` for this base layer**. Four `sr()`-seeded generator functions then build scenario-dependent time
series per country, each with genuinely differentiated logic by country group (SIDS/LDC/Advanced), not flat
random noise:

```js
// Debt trajectory: baseline + 3 climate scenario overlays, amplified for high-debt countries
base       = debtGdp + t×(4+s×3)×(debtGdp>80 ? 1.3 : 1.0)      // t = years-from-2024 fraction
orderly    = base + t×(1.5+s×2)
disorderly = base + t×(4+s×5) + (yr>2035 ? (yr−2035)×0.8 : 0)   // late acceleration post-2035
hothouse   = base + t×(6+s×8) + (yr>2030 ? (yr−2030)×1.2 : 0)   // earlier acceleration, post-2030

// Fiscal costs (5 categories): SIDS > LDC > other baseline severity
adaptationBase = isSids ? 4.5 : isLdc ? 3.2 : 1.2   (× (1+t×1.5), % of GDP)
disasterLoss   = (isSids ? 3.0 : isLdc ? 1.8 : 0.5) × (1+t×2)

// Vulnerability sub-scores (5 dimensions, later weighted-composited)
debtScore    = min(100, debtGdp/2.5 + noise)
climExp      = isSids ? 85+noise : isLdc ? 65+noise : 25+noise
fiscalSpace  = 100 − min(100, |fiscalBal|×8 + noise)
instCap      = group==='Advanced' ? 75+noise : isLdc ? 20+noise : 40+noise
extSupport   = isSids ? 55+noise : isLdc ? 45+noise : group==='Advanced' ? 80+noise : 35+noise
```

### 7.2 Parameterisation

| Element | Value | Provenance |
|---|---|---|
| High-debt amplifier | ×1.3 multiplier if `debtGdp>80` at baseline | hand-set threshold, plausible non-linearity (debt-servicing costs compound faster past a high-debt threshold), not fit to IMF's own debt-dynamics equations |
| Scenario acceleration timing | disorderly kicks in post-2035, hothouse post-2030 | correctly encodes the NGFS narrative that hot-house-world physical damages compound earlier while disorderly-transition costs are back-loaded (late abrupt policy) |
| SIDS/LDC differentiated base rates | SIDS adaptation 4.5% GDP, LDC 3.2%, other 1.2% | directionally consistent with real climate-finance-needs literature showing SIDS facing disproportionate adaptation costs relative to GDP |
| Vulnerability composite weights (`ranked` calc) | user-adjustable sliders (`weights` object) across the 5 dimensions | genuinely interactive — user can re-weight debt/climate/fiscal/institutional/external dimensions and see rankings update live |
| `spreadBps` | `50 + (1−groupFactor)×400 + noise` where groupFactor: Advanced 0.8, SIDS 0.2, other 0.45 | correctly orders sovereign spread by credit-quality tier (Advanced lowest spread, SIDS highest) |

### 7.3 Calculation walkthrough

- **Debt Trajectory tab**: plots the 4-scenario debt/GDP path per country to 2050 against `SCENARIOS`
  (baseline/orderly/disorderly/hothouse) — correctly monotonic (hothouse > disorderly > orderly > baseline
  at any given year, by construction of the additive overlay terms).
- **`dsaLight()` (light-touch IMF DSA classifier)**: `scenario2050 > 120 → High Risk (red)`, `>80 → Medium
  Risk (amber)`, else `Low Risk (green)` — a simplified proxy for the IMF's own debt-sustainability risk
  rating thresholds (real IMF DSA uses more nuanced country-specific benchmarks, e.g. differentiated by
  market-access status), but directionally in the right range (IMF LIC-DSF flags >70-120% debt/GDP zones
  depending on debt-carrying capacity).
- **Fiscal Climate Costs tab**: stacks the 5 cost categories (`adaptation+mitigation+disasterLoss+health+
  strandedAssets`) per year, and separately computes a **revenue** side (`carbonRevenue`, `subsidyRev`,
  `greenBondRev`, `concFinance`) allowing a net fiscal position calculation
  (`netPosition = totalRevenue − totalCost`) — a genuinely two-sided fiscal model, not cost-only.
- **Vulnerability Ranking tab**: user-adjustable weighted composite across the 5 `genVulnScore` dimensions,
  with `inverted` handling for dimensions where higher raw value = better (fiscalSpace, instCap, extSupport
  are inverted so higher vulnerability score = worse across all 5 dimensions consistently).

### 7.4 Worked example (illustrative high-debt SIDS)

Maldives (`debtGdp=115`, SIDS group), year 2050 (`t=1.0`):

| Step | Computation | Result |
|---|---|---|
| Baseline (no climate) | 115 + 1.0×(4+s×3)×1.3 (debtGdp>80) | illustratively ≈115+7.8 ≈ **123%** |
| Hothouse | base + 1.0×(6+s×8) + (2050−2030)×1.2 | ≈123 + 12 + 24 ≈ **159%** |
| `dsaLight` classification | 159 > 120 | **High Risk (red)** |
| Adaptation cost 2050 | 4.5×(1+1.0×1.5) + noise | ≈11.25% of GDP/yr |

For a small-island economy, a fiscal adaptation burden approaching 11% of GDP annually alongside a debt/GDP
ratio pushing toward 160% under a hot-house scenario is a genuinely severe, policy-relevant combination —
correctly surfaced by the model's structure even though individual noise terms are synthetic.

### 7.5 Data provenance & limitations

- **The 61-country macro base layer (GDP, debt/GDP, rating, fiscal balance, CO₂) is hand-curated, real,
  plausible data** — not live IMF/World Bank feeds, but internally consistent and directionally accurate.
- **All time-series generators are `sr()`-seeded**, so specific year-by-year trajectory values are
  illustrative, not a genuine climate-macro simulation (e.g. no actual NGFS GDP-shock pathway or IMF DSA
  debt-dynamics equation — `debt_t = debt_{t-1}×(1+i-g)/(1+g) − primary_balance_t` — is implemented; the
  code instead applies additive scenario-severity terms directly to the debt ratio).
- `dsaLight()` is explicitly a simplified proxy (the function name itself signals this), not a reproduction
  of the IMF's actual differentiated (market-access vs LIC-DSF) risk-rating methodology.
- The revenue-side fiscal model (carbon pricing revenue, subsidy removal, green bond proceeds, concessional
  finance) is a reasonable conceptual structure but its specific multipliers (e.g. `carbonRevenue =
  (carbonPrice/100)×(gdpT>1?1.8:0.6)`) are illustrative, not calibrated to a specific carbon-pricing-revenue
  model.

### 7.6 Framework alignment

- **IMF Debt Sustainability Analysis (DSA) Framework** — the debt/GDP threshold classification and the
  general concept of scenario-conditioned debt trajectories are consistent with DSA's approach; the specific
  IMF debt-dynamics equation and country-differentiated (market-access vs LIC-DSF) thresholds are not
  reproduced.
- **NGFS Climate Scenarios** — the 4-scenario family (baseline, orderly, disorderly, hot-house) and their
  relative severity ordering/timing (disorderly back-loaded post-2035, hot-house physical damages
  front-loaded post-2030) are consistent with NGFS's own scenario narrative structure.
- **World Bank Sovereign Climate Debt Guidance / IMF WEO** — cited as sources for the SIDS/LDC differentiated
  adaptation-cost assumptions, which are directionally consistent with the real climate-finance-gap
  literature these institutions publish.
