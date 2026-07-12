# Impact Investing Hub
**Module ID:** `impact-hub` · **Route:** `/impact-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides an integrated impact measurement framework covering theory of change documentation, impact KPI tracking, additionality assessment, and IMP five dimensions of impact analysis. Supports impact-first and blended finance investors in managing, measuring, and reporting impact across diverse asset classes and SDG themes.

> **Business value:** Provides impact investors and fund managers with a rigorous framework for measuring, managing, and reporting impact across diverse asset classes, enabling credible impact claims, SDG alignment reporting, and blended finance structuring decisions grounded in evidence of additionality.

**How an analyst works this module:**
- Define the theory of change for each investment, mapping activities to outputs, outcomes, and impact for the target beneficiary population.
- Select IRIS+ impact metrics aligned to the investment's primary SDG theme and configure the data collection cadence.
- Run the additionality assessment using the IMP counterfactual framework to determine whether impact is additional to baseline.
- Generate the IMP five dimensions report (what, who, how much, contribution, risk) for investor reporting.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Btn`, `KPI`, `LS_BOND`, `LS_FI`, `LS_IRIS`, `LS_IWA`, `LS_PORT`, `LS_VERI`, `MODULES`, `ModuleCard`, `PIE_COLORS`, `REGS`, `SDGS_17`, `Section`, `ThCell`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MODULES` | 6 | `name`, `path`, `icon`, `color`, `description` |
| `REGS` | 6 | `articles`, `coverage`, `status` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SDGS_17` | `Array.from({length:17},(_,i)=>({ id:i+1, name:['No Poverty','Zero Hunger','Good Health','Quality Education','Gender Equality','Clean Water','Affordable Energy','Decent Work','Industry & Innovation','Reduced Inequalities'` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `pct` | `(n) => n == null ? '\u2014' : `${Math.round(n)}%`;` |
| `fmtMn` | `(n) => n >= 1000 ? `$${(n/1000).toFixed(1)}Bn` : `$${Math.round(n)}Mn`;` |
| `iwaEnvMn` | `Math.round(seed(s * 11) * 40 - 8);` |
| `iwaEmplMn` | `Math.round(seed(s * 13) * 25 - 5);` |
| `iwaProdMn` | `Math.round(seed(s * 17) * 30 + 2);` |
| `iwaTotalMn` | `iwaEnvMn + iwaEmplMn + iwaProdMn;` |
| `irisMetrics` | `Math.ceil(seed(s * 19) * 12 + 3);` |
| `bondImpactMn` | `Math.round(seed(s * 23) * 50 + 5);` |
| `ghgAvoided` | `Math.round(seed(s * 29) * 15000 + 500);` |
| `beneficiaries` | `Math.round(seed(s * 31) * 50000 + 2000);` |
| `evidenceTier` | `Math.min(5, Math.max(1, Math.ceil(seed(s * 37) * 5)));` |
| `impWashFlags` | `Math.floor(seed(s * 41) * 4);` |
| `blendedMn` | `Math.round(seed(s * 43) * 30);` |
| `leverageRatio` | `Math.round((1 + seed(s * 47) * 4) * 10) / 10;` |
| `additionalityScore` | `Math.round(40 + seed(s * 53) * 55);` |
| `impactROI` | `Math.round(-10 + seed(s * 59) * 35);` |
| `sdgsContrib` | `Array.from({length:17},(_,j) => Math.round(seed(s * 61 + j) * 100 * (seed(s * 67 + j) > 0.5 ? 1 : 0)));` |
| `financialReturn` | `Math.round(-5 + seed(s * 71) * 25);` |
| `iwaScore` | `Math.round(30 + seed(s * 73) * 65);` |
| `irisScore` | `Math.round(25 + seed(s * 79) * 70);` |
| `verificationStatus` | `seed(s * 83) > 0.65 ? 'Verified' : seed(s * 87) > 0.35 ? 'Partial' : 'Unverified';` |
| `sdgAligned` | `Math.ceil(seed(s * 89) * 6);` |
| `holdings` | `useMemo(() => { if (!portfolioRaw.length) return GLOBAL_COMPANY_MASTER.slice(0, 40).map((c, i) => enrichHub(c, i));` |
| `agg` | `useMemo(() => { const tw = holdings.reduce((s, h) => s + (h.weight \|\| 1), 0) \|\| 1;` |
| `wAvg` | `fn => holdings.reduce((s, h) => s + fn(h) * (h.weight \|\| 1), 0) / tw;` |
| `totalImpactMn` | `holdings.reduce((s, h) => s + h.iwaTotalMn, 0);` |
| `envImpactMn` | `holdings.reduce((s, h) => s + h.iwaEnvMn, 0);` |
| `emplImpactMn` | `holdings.reduce((s, h) => s + h.iwaEmplMn, 0);` |
| `prodImpactMn` | `holdings.reduce((s, h) => s + h.iwaProdMn, 0);` |
| `irisTracked` | `holdings.reduce((s, h) => s + h.irisMetrics, 0);` |
| `bondImpactTotal` | `holdings.reduce((s, h) => s + h.bondImpactMn, 0);` |
| `ghgTotal` | `holdings.reduce((s, h) => s + h.ghgAvoided, 0);` |
| `benefTotal` | `holdings.reduce((s, h) => s + h.beneficiaries, 0);` |
| `totalFlags` | `holdings.reduce((s, h) => s + h.impWashFlags, 0);` |
| `blendedTotal` | `holdings.reduce((s, h) => s + h.blendedMn, 0);` |
| `sdgAgg` | `SDGS_17.map(sdg => {` |
| `contrib` | `holdings.reduce((s, h) => s + h.sdgsContrib[sdg.id - 1], 0);` |
| `iwaComplete` | `Math.round(holdings.filter(h => Math.abs(h.iwaTotalMn) > 0).length / (holdings.length \|\| 1) * 100);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MODULES`, `PIE_COLORS`, `REGS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Impact Multiple of Money (IMM) | — | IMP / BlueMark impact analysis | Ratio of total social/environmental value created per €1 invested; private equity impact funds target IMM of 3× or above for market-rate strategies. |
| SDG Alignment Score | — | IRIS+ / GIIN | Average number of SDGs materially addressed per portfolio company; concentrated impact strategies average 2â€“3; broad ESG funds average 5+. |
| Additionality Rating | — | IMP additionality framework | Composite rating assessing enterprise additionality (whether the investee would have achieved impact without impact capital) and investor additionality (whether the capital enabled additional impact). |
| Impact Integrity Score | — | BlueMark / GIIN IRIS+ | Assessment of impact management system quality covering strategy, execution, learning, and accountability dimensions. |
- **Investment portfolio data with SDG classification** → Map to IRIS+ metrics, define theory of change per investment → **Impact framework database**
- **Impact KPI data from investees (annual)** → Validate against third-party sources, apply monetisation coefficients → **Monetised impact value by investment**
- **Counterfactual baseline data** → Assess additionality using IMP enterprise and investor contribution framework → **Additionality scores by investment**

## 5 · Intermediate Transformation Logic
**Methodology:** Impact Weighted Return
**Headline formula:** `IWR = Financial_return + Σ_k (ImpactKPI_k × Monetisation_k × Attribution_k)`

Augments financial return with monetised impact value by weighting each impact KPI by its social or environmental monetisation coefficient (e.g. tCO2e averted at social cost of carbon, lives improved at VSL-equivalent) and discounting by attribution to investor contribution versus baseline. Provides a unified return metric combining financial and impact performance.

**Standards:** ['IMP Five Dimensions Framework', 'Harvard Impact Weighted Accounts', 'GIIN IRIS+ Metrics Catalogue']
**Reference documents:** Impact Management Project â€” Five Dimensions of Impact (2019); GIIN â€” IRIS+ Metrics Catalogue (2024); Harvard Business School â€” Impact Weighted Accounts (2021); BlueMark â€” Making the Mark Impact Benchmark (2022)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

An **impact-investing hub** dashboard: it enriches each portfolio holding with impact-weighted-account
figures, IRIS+ metric counts, additionality, blended-finance leverage, SDG contribution vectors and an
impact-washing flag count, then aggregates portfolio KPIs. The guide describes an *Impact-Weighted
Return* `IWR = Financial_return + Σ(ImpactKPI × Monetisation × Attribution)`; the code does **not**
compute that — it draws every impact quantity from the seeded PRNG. Flagged below.

> ⚠️ **Guide↔code mismatch flag.** The guide's headline formula `IWR = Financial_return +
> Σ_k(ImpactKPI_k × Monetisation_k × Attribution_k)` (monetised, attribution-discounted impact) is
> **not implemented**. There are no monetisation coefficients and no attribution discount in the code:
> each holding's environmental/employment/product impact ($Mn), additionality score, leverage ratio and
> SDG contributions are independent `seed()` draws. The hub is a synthetic aggregation layer over the
> real sub-modules (impact-weighted-accounts, impact-verification, blended-finance), not a live IWR model.

### 7.1 What the module computes

Per holding, via `enrichHub(company, i)` using `seed(s)=frac(sin(s+1)×10⁴)`:

```js
iwaEnvMn   = round(seed(s·11)·40 − 8)         // −8 … +32 $Mn (env impact, can be negative)
iwaEmplMn  = round(seed(s·13)·25 − 5)
iwaProdMn  = round(seed(s·17)·30 + 2)
iwaTotalMn = iwaEnvMn + iwaEmplMn + iwaProdMn
additionalityScore = round(40 + seed(s·53)·55)        // 40–95
leverageRatio      = round((1 + seed(s·47)·4)·10)/10  // 1.0–5.0× blended-finance leverage
evidenceTier       = min(5, max(1, ceil(seed(s·37)·5)))
impWashFlags       = floor(seed(s·41)·4)              // 0–3 flags
sdgsContrib[j]     = round(seed(s·61+j)·100 · (seed(s·67+j)>0.5 ? 1 : 0))   // sparse SDG vector
```

Portfolio aggregation is weighted by `h.weight`:

```js
tw   = Σ weight ;  wAvg(fn) = Σ fn(h)·weight / tw
totalImpactMn = Σ iwaTotalMn ;  ghgTotal = Σ ghgAvoided ;  totalFlags = Σ impWashFlags
```

### 7.2 Parameterisation / scoring rubric

| Quantity | Range | Provenance |
|---|---|---|
| `iwaEnvMn` | −8 … +32 $Mn | Synthetic (IWA env impact proxy) |
| `additionalityScore` | 40–95 | Synthetic |
| `leverageRatio` | 1.0–5.0× | Synthetic (blended-finance mobilisation) |
| `evidenceTier` | 1–5 | Synthetic (RCT→anecdotal hierarchy label) |
| `impWashFlags` | 0–3 | Synthetic count |
| `sdgsContrib` | 0–100 per SDG, ~50% sparse | Synthetic; `SDGS_17` labels are real |
| `ghgAvoided` | 500–15 500 tCO₂e | Synthetic |

The frameworks referenced (IMP five dimensions, Harvard IWA, IRIS+, blended finance) are real; all
per-holding numbers are PRNG.

### 7.3 Calculation walkthrough

`holdings` = either the user portfolio (from `portfolioRaw`) or the first 40 `GLOBAL_COMPANY_MASTER`
companies, each passed through `enrichHub`. `agg` computes weighted averages of the enriched scores.
Scalar totals (`totalImpactMn`, `envImpactMn`, `ghgTotal`, `benefTotal`, `totalFlags`, `blendedTotal`)
are simple sums. `sdgAgg` sums each holding's `sdgsContrib[sdg.id−1]` across the portfolio to rank SDG
coverage. `iwaComplete` = share of holdings with non-zero IWA total.

### 7.4 Worked example (one holding)

`iwaEnvMn = −5`, `iwaEmplMn = 8`, `iwaProdMn = 12`, `weight = 2.0`, `additionalityScore = 70`,
`leverageRatio = 3.2×`, `blendedMn = 15`:

| Step | Computation | Result |
|---|---|---|
| iwaTotalMn | −5 + 8 + 12 | **$15Mn** net positive impact |
| Contribution to `totalImpactMn` | +15 | |
| Weighted additionality | 70 × 2.0 / tw | into wAvg |
| Mobilised capital | blendedMn × leverageRatio = 15 × 3.2 | **$48Mn** catalysed (concept) |

### 7.5 Data provenance & limitations

- **All impact figures are synthetic** (`seed`), applied over real company names from
  `GLOBAL_COMPANY_MASTER` or the user's uploaded portfolio.
- The guide's **IWR monetisation×attribution model is absent** — no social-cost coefficients, no
  attribution discount. The hub is an aggregation shell wiring together the (also largely synthetic)
  impact sub-modules.
- SDG contributions are a random sparse vector; additionality and leverage are unanchored draws.

**Framework alignment:** IMP *Five Dimensions of Impact* · Harvard *Impact-Weighted Accounts* ·
GIIN *IRIS+* · blended-finance *mobilisation/leverage* (Convergence). All are named and their
taxonomies used for labelling; the quantitative IWR the guide specifies is not implemented — its full
monetisation model is documented in the `impact-weighted-accounts` §8 spec, which this hub would consume.

## 9 · Future Evolution

### 9.1 Evolution A — From synthetic aggregation shell to live cross-module rollup (analytics ladder: rung 1 → 2)

**What.** The §7 flag is clear: the hub's promised `IWR = Financial_return + Σ(ImpactKPI × Monetisation × Attribution)` is absent — every per-holding figure (`iwaEnvMn`, `additionalityScore`, `leverageRatio`, sparse `sdgsContrib` vectors, `impWashFlags`) is a `seed()` draw applied over real company names from `GLOBAL_COMPANY_MASTER`. But the hub's architecture points at its own fix: it is designed as an aggregation layer over the impact sub-modules (`MODULES` links to impact-weighted-accounts, impact-verification, blended finance, IRIS metrics). Evolution A makes it a *true* rollup: the hub stops generating numbers and instead reads each sub-module's computed/entered data, aggregating only what genuinely exists downstream.

**How.** (1) Define a hub contract: per holding, the IWA total comes from the impact-weighted-accounts vertical (whose §8 monetisation spec the deep-dive already references as the authoritative model), verification status from impact-verification's records, blended leverage from actual deal structures, IRIS+ counts from stored metric selections. (2) A thin `GET /impact-hub/rollup?portfolio_id=` endpoint joining these sources with per-field provenance and honest nulls — `iwaComplete` then measures real data coverage rather than PRNG sparsity. (3) The IWR headline computes only over holdings with monetised KPIs, labeled with coverage %. (4) Delete `enrichHub`'s seeded generation.

**Prerequisites (hard).** The sub-modules must have real data paths first — the deep-dive notes they are "also largely synthetic"; the hub cannot be more honest than its sources, so this evolution sequences *after* impact-weighted-accounts' own §8 implementation. **Acceptance:** every hub KPI traceable to a sub-module record; a holding with no downstream data shows nulls in the hub, not invented impact.

### 9.2 Evolution B — Impact-desk orchestrator across the impact module family (LLM tier 3)

**What.** The hub is the natural seat for a cross-module impact desk: "assess this holding's impact story" should walk IWA monetisation → IRIS+ metric coverage → verification status → additionality → impact-washing flags, each from its owning module, and synthesize an evidence-graded answer. That is the roadmap's tier-3 pattern, scoped to the impact family the hub already links.

**How.** Routing via the `MODULES` map and the Atlas interconnection data; per-module tool schemas from the sub-modules' endpoints as they gain them (Evolution A's rollup endpoint is the first). The orchestrator's signature behaviour is evidence discipline borrowed from the hub's own `evidenceTier` concept: every claim in a synthesized impact memo carries the tier of its supporting evidence, and claims without downstream data are stated as gaps ("no verified GHG-avoided figure exists for this holding") rather than filled in — the LLM analogue of the platform's honest-nulls convention. Output renders through the report studio for LP-facing memos.

**Prerequisites.** Evolution A's rollup (tier 3 without real sub-module data would orchestrate fabrications); tier-2 infrastructure on at least impact-weighted-accounts and impact-verification. **Acceptance:** a generated memo's every figure carries a module-of-origin citation; coverage gaps are enumerated explicitly; zero numerics fail the no-fabrication validator.