# Sovereign Debt Sustainability
**Module ID:** `sovereign-debt-sustainability` · **Route:** `/sovereign-debt-sustainability` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Climate-adjusted debt sustainability analysis incorporating physical damage costs, transition expenditure, and stranded asset losses into IMF DSA framework projections for sovereign issuers.

> **Business value:** Integrates physical and transition climate shocks into sovereign debt sustainability analysis to identify climate-driven fiscal vulnerabilities.

**How an analyst works this module:**
- Apply NGFS physical risk GDP shocks to IMF baseline debt sustainability projections.
- Add climate adaptation and mitigation expenditure to fiscal financing requirements.
- Estimate stranded asset revenue losses for fossil-fuel-dependent economies under transition scenarios.
- Produce climate-adjusted debt trajectory and assess breach of IMF sustainability thresholds.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COST_COLORS`, `COST_TYPES`, `COUNTRIES`, `COUNTRIES_RAW`, `CustomTooltip`, `DebtTrajectoryTab`, `FiscalClimateTab`, `InvestmentTab`, `REGIONS`, `SCENARIOS`, `SHORT_YEARS`, `TABS`, `VULN_DIMS`, `VulnerabilityTab`, `YEARS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SCENARIOS` | 5 | `label`, `color`, `dash` |
| `COUNTRIES_RAW` | 61 | `id`, `name`, `region`, `group`, `gdpT`, `pop`, `debtGdp`, `rating`, `fiscalBal`, `co2Mt` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `base` | `c.debtGdp + t * (4 + s * 3) * (c.debtGdp > 80 ? 1.3 : 1);` |
| `orderly` | `base + t * (1.5 + s * 2);` |
| `disorderly` | `base + t * (4 + s * 5) + (yr > 2035 ? (yr - 2035) * 0.8 : 0);` |
| `hothouse` | `base + t * (6 + s * 8) + (yr > 2030 ? (yr - 2030) * 1.2 : 0);` |
| `debtScore` | `Math.min(100, (c.debtGdp / 2.5) + s * 10);` |
| `climExp` | `isSids ? 85 + s * 15 : isLdc ? 65 + s * 20 : 25 + s * 30;` |
| `fiscalSpace` | `100 - Math.min(100, Math.abs(c.fiscalBal) * 8 + s * 15);` |
| `instCap` | `c.group === 'Advanced' ? 75 + s * 20 : isLdc ? 20 + s * 25 : 40 + s * 25;` |
| `extSupport` | `isSids ? 55 + s * 20 : isLdc ? 45 + s * 20 : c.group === 'Advanced' ? 80 + s * 15 : 35 + s * 25;` |
| `COUNTRIES` | `COUNTRIES_RAW.map((c, i) => ({` |
| `sHeader` | `{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 };` |
| `sTitle` | `{ fontSize:22, fontWeight:700, color:T.navy, letterSpacing:'-0.02em' };` |
| `sCardTitle` | `{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:12, fontFamily:T.mono, letterSpacing:'-0.01em' };` |
| `sChip` | `(color) => ({ display:'inline-block', padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600, fontFamily:T.mono, background:color+'18', color });` |
| `pct` | `(v) => v == null ? '\u2014' : v.toFixed(1) + '%';` |
| `csv` | `[hdr.join(','), ...rows.map(r => hdr.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type:'text/csv' });` |
| `peak` | `Math.max(...data.map(d => Math.max(d.baseline, d.orderly, d.disorderly, d.hothouse)));` |
| `dsaBaseline` | `dsaLight(c.debtGdp, data[data.length - 1].baseline);` |
| `dsaHothouse` | `dsaLight(c.debtGdp, data[data.length - 1].hothouse);` |
| `costOverlay` | `c.fiscalCosts.map(f => ({` |
| `allCountrySummary` | `useMemo(() => countries.map(cc => {` |
| `last` | `cc.debtTrajectory[cc.debtTrajectory.length - 1];` |
| `row2050` | `data[data.length - 1];` |
| `peakVal` | `Math.max(...data.map(d => d[sc.key]));` |
| `gdpRow` | `gdpData.find(g => g.year === 2050) \|\| gdpData[gdpData.length - 1];` |
| `stackedData` | `costs.map(r => ({` |
| `totalByYear` | `stackedData.map(r => ({` |
| `carbonRevenue` | `(carbonPriceSlider / 100) * (c.gdpT > 1 ? 1.8 : 0.6) * (1 + sr(cIdx * 700) * 0.3);` |
| `subsidyRev` | `(subsidyRemoval / 100) * (c.gdpT > 1 ? 0.8 : 0.2) * (1 + sr(cIdx * 800) * 0.3);` |
| `greenBondRev` | `(greenBondShare / 100) * c.debtGdp * 0.02;` |
| `concFinance` | `isSids ? 0.8 + sr(cIdx * 810) * 0.4 : isLdc ? 0.5 + sr(cIdx * 820) * 0.3 : 0.1 + sr(cIdx * 830) * 0.1;` |
| `totalRevenue` | `carbonRevenue + subsidyRev + greenBondRev + concFinance;` |
| `totalCost` | `costBreakdownForYear.reduce((a, b) => a + b.value, 0);` |
| `netPosition` | `totalRevenue - totalCost;` |
| `crossCountryFiscal` | `useMemo(() => { return countries.map(cc => { const row = cc.fiscalCosts.find(r => r.year === costYear) \|\| cc.fiscalCosts[3];` |
| `total` | `row.adaptation + row.mitigation + row.disasterLoss + row.health + row.strandedAssets;` |
| `totalW` | `wKeys.reduce((a, k) => a + weights[k], 0);` |
| `ranked` | `useMemo(() => { const list = countries.map(c => { const composite = wKeys.reduce((acc, k) => { const w = weights[k] / (totalW \|\| 1);` |
| `inverted` | `(k === 'fiscalSpace' \|\| k === 'instCap' \|\| k === 'extSupport') ? (100 - raw) : raw;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COST_COLORS`, `COST_TYPES`, `COUNTRIES_RAW`, `REGIONS`, `SCENARIOS`, `SHORT_YEARS`, `TABS`, `VULN_DIMS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Countries in DSA | — | IMF/World Bank | Sovereign issuers with active climate-adjusted debt sustainability analysis. |
| Avg Climate Debt Add | — | Climate DSA model | Average addition to debt/GDP ratio from cumulative climate fiscal shocks under RCP 4.5 by 2035. |
| DSA Breach Rate | — | Calculated | Share of sovereign issuers breaching IMF high-risk debt thresholds after applying climate adjustment. |
- **IMF DSA baselines, NGFS GDP shocks, stranded asset revenue estimates** → Climate shock overlays, debt trajectory simulation, threshold breach analysis → **Climate-adjusted debt paths, DSA breach flags, scenario comparison reports**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-Adjusted Debt/GDP
**Headline formula:** `(Baseline Debt + Climate Shock) ÷ (GDP × (1 – GDP Impact))`

Debt-to-GDP ratio adjusted for climate-related fiscal shocks including disaster costs, stranded assets and transition expenditures.

**Standards:** ['IMF DSA Framework', 'NGFS Macro-Financial', 'World Bank CCDR']
**Reference documents:** IMF Debt Sustainability Analysis Framework 2022; NGFS Climate Scenarios for Central Banks 2023; World Bank Sovereign Climate Debt Guidance; IMF World Economic Outlook 2024

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Real IMF debt-dynamics equation replacing the hand-tuned trajectories (analytics ladder: rung 2 → 3)

**What.** This tier-B module is better than most: `COUNTRIES_RAW` (61 real countries with real 2024 macro data, no `sr()` for the base layer) drives four scenario generators with genuinely differentiated logic by country group (SIDS > LDC > Advanced severity), and the NGFS scenario timing (disorderly back-loaded post-2035, hot-house physical damages front-loaded post-2030) is directionally faithful. Its limits (§7.6) are that the debt trajectory uses hand-tuned linear overlays with a `debtGdp>80 → ×1.3` amplifier rather than IMF's actual debt-dynamics equation, and the vulnerability sub-scores carry `sr()` noise. Evolution A grounds the trajectory in the real DSA math.

**How.** (1) Implement the IMF debt-dynamics identity: `Δ(debt/GDP) = (r−g)/(1+g)·debt/GDP − primary_balance + stock-flow adjustment`, with climate shocks entering through `g` (physical GDP damage), the primary balance (adaptation/disaster spending), and stranded-asset revenue loss — replacing the linear `base + t×(4+s×3)` overlays. (2) Differentiate market-access vs LIC-DSF thresholds per IMF's actual two-track framework (the guide only applies a generic threshold). (3) Source the climate GDP shocks from NGFS macro-financial variable paths rather than the monotonic hand-tuned severity. (4) Remove `sr()` noise from vulnerability sub-scores — compute them from the real macro/climate-exposure inputs.

**Prerequisites.** IMF r−g projections and NGFS GDP-damage paths per country; the LIC-DSF vs MAC-DSA classification per country. **Acceptance:** the debt trajectory reproduces from the r−g identity with climate terms; a change in the growth-damage assumption moves the path through the equation; threshold breaches use the country's correct DSA track.

### 9.2 Evolution B — Climate-DSA analyst copilot (LLM tier 1)

**What.** A copilot for the sovereign-risk / development-finance user: "how does the hot-house scenario change this country's debt trajectory?", "which SIDS breach the IMF sustainability threshold under disorderly transition?", "decompose the climate fiscal cost into adaptation vs disaster vs stranded assets" — answered from the computed trajectories and the 5-category fiscal-cost breakdown, decomposing debt dynamics into their drivers.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/sovereign-debt-sustainability/ask`, corpus = this Atlas record (the scenario-generator logic, the fiscal-cost categories, IMF DSA / NGFS framework notes) plus live page state. Trajectory explanations attribute debt movement to growth damage, fiscal cost, and stranded-asset loss; threshold-breach answers narrate the computed classification. Scenario comparisons narrate the NGFS timing differences. Refusal for countries outside the 61-country set.

**Prerequisites.** Evolution A's r−g equation so the copilot's decomposition reflects real debt dynamics rather than hand-tuned overlays. **Acceptance:** every debt/GDP figure in an answer traces to the computed trajectory; fiscal-cost decompositions sum to the total; a country outside coverage returns a refusal.