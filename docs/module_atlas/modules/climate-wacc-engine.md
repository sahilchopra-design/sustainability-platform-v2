# Climate-Adjusted WACC Engine
**Module ID:** `climate-wacc-engine` · **Route:** `/climate-wacc-engine` · **Tier:** B (frontend-computed) · **EP code:** EP-DD1 · **Sprint:** DD

## 1 · Overview
Climate-adjusted WACC engine for corporate valuation. Estimates carbon beta, decomposes climate risk premium into physical and transition components, applies sector-specific WACC uplift, and enables IFRS S2 cost of capital disclosure.

> **Business value:** Provides sector-specific climate-adjusted WACC calculation decomposing carbon beta, physical risk, and transition risk premiums, enabling IFRS S2-compliant cost of capital disclosures.

**How an analyst works this module:**
- Estimate carbon beta using 3-year rolling regression of equity returns against EUA carbon price changes
- Decompose climate WACC uplift into physical risk premium (asset impairment) and transition risk premium (stranded assets, carbon cost)
- Apply sector-specific calibration using ECB/NGFS scenario analysis
- Generate IFRS S2-compliant cost of capital disclosure with sensitivity analysis

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COMPANIES`, `COUNTRIES`, `OUTLOOKS`, `RATINGS`, `SECTORS`, `SECTOR_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `baseWacc` | `0.06 + sr(i * 7) * 0.06;` |
| `climateRiskPremium` | `(sec === 'Energy' \|\| sec === 'Utilities' \|\| sec === 'Materials') ? sr(i * 11) * 0.025 + 0.01 : sr(i * 11) * 0.012;` |
| `greenDiscount` | `sr(i * 13) * 0.015;` |
| `esgScore` | `30 + sr(i * 17) * 60;` |
| `beta` | `0.7 + sr(i * 19) * 1.3;` |
| `marketCap` | `2 + sr(i * 23) * 198;` |
| `taxRate` | `0.18 + sr(i * 29) * 0.12;` |
| `debtWeight` | `0.2 + sr(i * 31) * 0.4;` |
| `equityCost` | `baseWacc * 1.3 + climateRiskPremium;` |
| `debtCost` | `baseWacc * 0.6 + sr(i * 37) * 0.02;` |
| `carbonIntensity` | `sec === 'Energy' ? 200 + sr(i * 41) * 800 : sec === 'Materials' ? 100 + sr(i * 41) * 400 : 10 + sr(i * 41) * 190;` |
| `TABS` | `['WACC Dashboard', 'Equity Cost Model', 'Debt Cost Model', 'Sector Analysis', 'Scenario Comparison', 'Peer Benchmarking', 'Capital Optimizer', 'ESG-CAPM'];` |
| `filtered` | `useMemo(() => selectedSector === 'All' ? COMPANIES : COMPANIES.filter(c => c.sector === selectedSector), [selectedSector]);  const avgAdjWacc = filtered.length ? (filtered.reduce((s, c) => s + c.adjustedWacc, 0) / filtered.length * 100) : 0;` |
| `avgBaseWacc` | `filtered.length ? (filtered.reduce((s, c) => s + c.baseWacc, 0) / filtered.length * 100) : 0;` |
| `avgEsg` | `filtered.length ? (filtered.reduce((s, c) => s + c.esgScore, 0) / filtered.length) : 0;` |
| `avgCarbonIntensity` | `filtered.length ? (filtered.reduce((s, c) => s + c.carbonIntensity, 0) / filtered.length) : 0;` |
| `sectorSummary` | `useMemo(() => SECTORS.map(sec => {` |
| `carbonAdjustedWacc` | `useMemo(() => filtered.map(c => ({` |
| `scatterData` | `useMemo(() => filtered.map(c => ({` |
| `scenarioData` | `ngfsScenarios.map(s => ({` |
| `capmData` | `useMemo(() => filtered.slice(0, 30).map(c => ({` |
| `carbonLiability` | `c.carbonIntensity * cp / 1000000;` |
| `optDebt` | `Math.min(0.7, c.debtWeight + carbonLiability * 0.3);` |
| `optWacc` | `optEquity * c.equityCost + optDebt * c.debtCost * (1 - c.taxRate);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `OUTLOOKS`, `RATINGS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Carbon Beta | `Regression of stock return vs EUA carbon price return over 3yr rolling window` | Bloomberg EUA price data + company equity returns | Beta>0.5 indicates high carbon price sensitivity (utilities, cement); <0.2 low sensitivity (tech, healthcare); negative possible for clean energy |
| Climate WACC Uplift | `Total climate risk premium added to conventional WACC` | ECB climate stress test framework | Uplift ranges 30-200 bps by sector; oil & gas 120-180 bps; utilities 60-90 bps; real estate coastal 80-150 bps |
| Transition Risk Premium | `Additional cost of capital from stranded asset risk and regulatory transition costs` | NGFS transition scenario implied equity risk premia | Dominant component for high-emitters; decomposed from scenario analysis of stranded asset NPV impact on enterprise value |
- **Bloomberg equity returns and EUA price time series** → Daily returns for carbon beta regression → systematic climate risk component → **Carbon beta by company**
- **NGFS climate scenarios (orderly, disorderly, hot house)** → GDP impact, carbon price, stranded asset trajectories → transition risk premium calibration → **Climate WACC uplift by scenario**
- **IPCC physical risk data and asset exposure** → Physical hazard by location and RCP scenario → physical risk premium by asset geography → **Total climate WACC decomposition**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Risk Premium Decomposition
**Headline formula:** `Climate WACC = WACC_base + Carbon Beta × (Rm - Rf) + Physical Risk Premium + Transition Risk Premium; Carbon Beta = Cov(Return, Carbon Price) / Var(Return)`

WACC adjustment framework decomposing climate risk into systematic carbon beta and idiosyncratic physical/transition premiums by sector

**Standards:** ['IFRS S2 Climate-related Disclosures 2023', 'ECB Guide on Climate and Environmental Risks 2020', 'Carney (2015) Breaking the Tragedy of the Horizon — Carbon Beta Framework']
**Reference documents:** IFRS S2 (2023) Climate-related Disclosures — Cost of Capital Disclosure Requirements; ECB (2020) Guide on Climate and Environmental Risks — WACC Section; NGFS (2023) Climate Scenarios for Central Banks and Supervisors — Macro-Financial Implications; Dietz et al. (2023) Carbon Beta and the Cost of Capital — Journal of Finance

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide promises an econometric carbon beta —
> `Carbon Beta = Cov(Return, Carbon Price) / Var(Return)` from a 3-year rolling regression of
> equity returns on EUA prices — plus a physical/transition premium decomposition calibrated to
> ECB/NGFS scenario analysis and IFRS S2 disclosure output. **None of this is implemented.** The
> code generates 80 synthetic companies with the platform PRNG and computes
> `adjustedWacc = baseWacc + climateRiskPremium − greenDiscount`, where the "climate risk premium"
> is itself a random draw with a sector bump. The "climate beta" shown in the ESG-CAPM tab is
> `beta × (1 + premium×10)` — a display transform, not a regression. Sections below document the
> code as it behaves.

### 7.1 What the module computes

For 80 seeded companies (8 sectors × 10, `ClimateWaccEnginePage.jsx`):

```
baseWacc          = 0.06 + sr(i·7)·0.06                       → 6–12%
climateRiskPremium = high-carbon sector? sr(i·11)·0.025 + 0.01 : sr(i·11)·0.012
                     (Energy/Utilities/Materials: 100–350 bps; others: 0–120 bps)
greenDiscount     = sr(i·13)·0.015                            → 0–150 bps
adjustedWacc      = baseWacc + climateRiskPremium − greenDiscount
equityCost        = baseWacc·1.3 + climateRiskPremium
debtCost          = baseWacc·0.6 + sr(i·37)·0.02
```

Derived views: `carbonAdjWACC% = adjWACC% + (CI/1000)·(carbonPrice/150)·0.5` (slider-driven),
`climateBeta = β·(1 + CRP·10)`, and a "Capital Optimizer" (§7.5).

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Base WACC band | 6–12% | synthetic demo value |
| High-carbon premium | 100–350 bps (Energy/Utilities/Materials) | synthetic; range loosely matches guide's "oil & gas 120–180 bps" claim |
| Green discount | 0–150 bps | synthetic |
| Equity multiplier ×1.3, debt ×0.6 of base WACC | heuristic capital-structure spread | synthetic |
| Carbon intensity | Energy 200–1,000; Materials 100–500; other 10–200 tCO₂/$M | synthetic, ordering plausible |
| NGFS ΔWACC overlay | NZ2050 −0.8 pp @ $200/t · B2C −0.3 @ $120 · NDC +0.2 @ $75 · CP +0.9 @ $30 · DNZ +0.5 @ $150 | hard-coded; sign convention: hot-house scenarios *raise* portfolio WACC |
| Tax rate 18–30%, debt weight 20–60%, β 0.7–2.0, ESG 30–90 | seeded uniform draws | synthetic |

### 7.3 Calculation walkthrough

1. Sector filter subsets the 80 companies; KPI cards average `adjustedWacc`, `baseWacc`, ESG, CI
   (all guarded for empty selection); "Climate Premium" KPI = avgAdj − avgBase.
2. **WACC waterfall** decomposes the selected company as Risk-Free = base×0.40,
   Market Premium = base×0.35, Credit Spread = debtCost×debtWeight, then ±climate items. Note the
   bars do not sum to the Final WACC bar (base×0.75 + debtCost×w_d ≠ base), so the waterfall is
   illustrative, not an identity.
3. **Carbon-adjusted WACC**: the $0–200/t slider adds `(CI/1000)·(P/150)·0.5` percentage points —
   at $150/t, a 1,000 tCO₂/$M company gets +0.5 pp.
4. **Scenario comparison** adds the fixed ΔWACC per NGFS scenario to the current sector-average
   base WACC.
5. **ESG-CAPM** plots `climateBeta` vs `standardBeta` vs equity cost for 30 names.

### 7.4 Worked example (company i = 0, "Alpha Energy Corp")

`sr(0)=frac(sin(1)·10⁴)=0.4147`, `sr(0·11)=sr(0)` etc. — for i=0 every seed collapses to
`sr(0)=0.4147`:

| Step | Computation | Result |
|---|---|---|
| baseWacc | 0.06 + 0.4147×0.06 | **8.49%** |
| climateRiskPremium (Energy) | 0.4147×0.025 + 0.01 | **2.04%** |
| greenDiscount | 0.4147×0.015 | **0.62%** |
| adjustedWacc | 8.49 + 2.04 − 0.62 | **9.91%** |
| equityCost | 8.49×1.3 + 2.04 | **13.07%** |
| debtCost | 8.49×0.6 + 0.4147×2 | **5.92%** |
| carbonAdj @ $100/t, CI = 200+0.4147×800 = 532 | 9.91 + (532/1000)(100/150)·0.5 | **10.09%** |
| climateBeta (β = 0.7+0.4147×1.3 = 1.24) | 1.24×(1 + 0.0204×10) | **1.49** |

(Seed-collision note: because every attribute of company *i* uses seeds `i·k`, company 0 draws the
*same* uniform 0.4147 for all attributes — a quirk of the `sr(i·k)` pattern at i = 0.)

### 7.5 Companion analytics — Capital Optimizer

```
carbonLiability = CI × carbonPrice / 10⁶          (e.g. 532×100/10⁶ = 0.0000532)
optDebt  = min(0.7, debtWeight + carbonLiability×0.3)
optWacc  = optEquity×equityCost + optDebt×debtCost×(1−tax)
saving   = adjustedWacc − optWacc
```

Two caveats: (a) the carbon liability term is numerically negligible (≈10⁻⁵), so "optimal" debt ≈
current debt + ε; (b) the "optimum" simply exploits the tax shield — more debt always lowers this
WACC expression because there is no distress-cost penalty, which no trade-off-theory model would
accept. The displayed "saving" is therefore an artefact of comparing `adjustedWacc` (which includes
the climate premium) against a WACC recomputed *without* it.

### 7.6 Data provenance & limitations

- **All 80 companies are synthetic**, generated by `sr(seed)=frac(sin(seed+1)×10⁴)`; names are
  Greek-letter placeholders. No market data, no EUA prices, no regressions.
- No IFRS S2 output artefact exists despite the guide's disclosure claim.
- Physical (`physicalRiskAdj`) and transition (`transitionRiskAdj`) adjustments are generated but
  *never enter* `adjustedWacc` — they appear only in the waterfall display.
- The NGFS overlay applies one portfolio-wide delta; no sector/issuer differentiation.

**Framework alignment:** CAPM — cost of equity is a scaled heuristic, not `r_f + β(E[R_m]−r_f)`;
the "ESG-CAPM" tab gestures at an extended CAPM with a climate factor (cf. Pastor–Stambaugh–Taylor
greenium literature) without estimating one · IFRS S2 — requires disclosure of climate effects on
cost of capital in financial-position terms; module has no report output · ECB Guide (2020)
expectation 7 (pricing climate risk into capital allocation) is the conceptual anchor for the
premium/discount split · NGFS scenarios are name-checked with plausible carbon prices but fixed
ΔWACC values are synthetic.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Estimate issuer-level climate-adjusted WACC for valuation (DCF discount rates), capital budgeting
hurdle rates, and IFRS S2 cost-of-capital disclosure. Coverage: listed corporates with ≥3y price
history; private issuers via sector betas.

### 8.2 Conceptual approach
Two-factor extended CAPM with an estimated **carbon beta**, per the Dietz/Bolton–Kacperczyk carbon
premium literature and **MSCI Low Carbon Transition** factor design, plus a debt-side spread
adjustment from climate-conditioned PD (mirroring **Moody's EDF-based** spread mapping and
Aladdin Climate's discount-rate repricing).

### 8.3 Mathematical specification

```
Equity:  r_e,i = r_f + β_mkt,i·MRP + β_C,i·CRP_s
         β_C,i from OLS: R_i,t = α + β_mkt R_mkt,t + β_C ΔlnP_EUA,t + ε_t   (36m weekly, Newey–West)
         CRP_s = E[ΔlnP_EUA | scenario s] × λ    (λ = price of carbon risk, cross-sectional estimate)
Debt:    r_d,i = r_f + spread(PD_i^clim, LGD)     PD_i^clim from climate-credit module
WACC_i  = w_e·r_e,i + w_d·r_d,i·(1−τ)
Uplift_i = WACC_i(s) − WACC_i(base)
```

| Parameter | Calibration source |
|---|---|
| r_f | 10y sovereign (FRED/ECB SDW, free) |
| MRP | 5.0–5.5%, Damodaran implied ERP (public) |
| ΔlnP_EUA | ICE EUA futures; platform already seeds EEX/ICE data (sprint EA-hybrid-v3) |
| λ (carbon risk price) | Fama–MacBeth cross-section per Bolton & Kacperczyk (2021); refresh annually |
| Scenario carbon paths | NGFS Phase IV/V database |
| PD_i^clim | platform climate-credit-integration methodology (NGFS-conditioned PD) |
| τ | statutory + effective blend, OECD tax tables |

### 8.4 Data requirements
Equity total returns (vendor: Refinitiv/Bloomberg; free fallback: Stooq/Yahoo for demo), EUA
settlement prices (ICE; EEX public settlements), capital structure from filings (FMP/SEC EDGAR,
free), emissions for sorting portfolios (reference_data OWID/CDP seeds already ingested).

### 8.5 Validation & benchmarking plan
Cross-check β_C signs/magnitudes against published estimates (utilities > 0.4, tech < 0.1);
reconcile WACC uplifts with ECB CST sector ranges (30–200 bps); out-of-sample R² of the carbon
factor; stability test across 24/36/48-month windows; challenger model: implied cost of capital
from analyst forecasts (Gebhardt–Lee–Swaminathan).

### 8.6 Limitations & model risk
EUA is an EU-centric carbon proxy — use regional prices (CCA, UKA, CEA) for non-EU issuers or
accept basis risk. λ estimates are noisy and period-dependent; floor CRP at 0 to avoid negative
uplifts for brown firms in risk-on periods. Private-company betas inherit sector-mapping error;
disclose data-quality tiers per PCAF-style scoring.

## 9 · Future Evolution

### 9.1 Evolution A — Estimate carbon beta from real return/EUA series (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag is blunt: the promised
`Carbon Beta = Cov(Return, CarbonPrice)/Var(Return)` 3-year rolling regression, the
physical/transition premium decomposition, and the IFRS S2 disclosure output are all
unimplemented — the 80 companies are `sr()`-seeded, "climateBeta" is the display
transform `β × (1 + premium×10)`, and the generated `physicalRiskAdj`/`transitionRiskAdj`
never even enter `adjustedWacc`. Evolution A builds the estimator: rolling regressions
of sector equity returns on EUA price changes, feeding a WACC uplift whose components
actually sum.

**How.** (1) Backend vertical `POST /api/v1/climate-wacc/estimate`: statsmodels rolling
OLS of sector-index excess returns on EUA log-returns (EUA history is available via the
platform's market-data seed from the EA-hybrid-v3 sprint; sector indices from the same
layer), 36-month window, Newey-West errors. (2) Recompose the WACC identity so the
waterfall *is* an identity — §7.3 notes the current bars don't sum to the final bar —
with carbon beta entering through CAPM (`r_f + β_c·CRP`) and the physical/transition
premiums wired into `adjustedWacc` instead of display-only. (3) Fix or remove the
Capital Optimizer, whose carbon-liability term is numerically negligible (≈10⁻⁵) and
whose "optimum" is a tax-shield artifact with no distress cost (§7.5). (4) Benchmark
estimated sector betas against the Dietz et al. (2023) ranges §5 cites.

**Prerequisites (hard).** Purge the seeded 80-company universe from computed paths
(fabrication-guardrail conventions); EUA and sector return series must be in the DB
first. **Acceptance:** waterfall components sum to final WACC exactly; carbon beta
carries a t-statistic and window; high-carbon sector uplift lands inside (or is flagged
against) the guide's 120–180 bps oil-and-gas claim.

### 9.2 Evolution B — IFRS S2 cost-of-capital disclosure drafter (LLM tier 2)

**What.** The module's stated purpose — "IFRS S2-compliant cost of capital
disclosure" — has no output artifact today (§7.6). Evolution B closes that with an LLM
where drafting genuinely helps: after Evolution A computes the climate-adjusted WACC
and its decomposition, a tool-calling drafter produces the IFRS S2 paragraph-level
disclosure (current and anticipated effects of climate risk on cost of capital,
sensitivity table across the NGFS overlay scenarios), every figure pulled from the
`/estimate` response and the sensitivity grid, structured against the S2 requirement
text already ingestable via the refdata regulatory catalogs.

**How.** Tool schemas from Evolution A's endpoints; the drafter's system prompt maps
each S2 disclosure requirement to the module fields that evidence it, and emits
"insufficient data" for requirements the engine cannot support (e.g. anticipated
financing-cost effects beyond the modeled horizon) — honest-nulls carried into prose.
Rendering flows through the report-studio layer per the roadmap's output convention;
drafts are versioned with the engine version stamp for reproducibility.

**Prerequisites (hard).** Evolution A — drafting a regulatory disclosure from seeded
placeholder companies would be a compliance hazard, not a feature; S2 requirement text
in the corpus. **Acceptance:** a draft disclosure where every number matches a tool
output, every S2 requirement is either evidenced or explicitly marked unmet, and
regenerating with the same inputs yields the same figures.