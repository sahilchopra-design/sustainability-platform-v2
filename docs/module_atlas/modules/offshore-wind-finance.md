# Offshore Wind Project Finance & CfD Analytics
**Module ID:** `offshore-wind-finance` · **Route:** `/offshore-wind-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DR3 · **Sprint:** DR

## 1 · Overview
Institutional project finance model for offshore wind transactions covering CfD structure, Newton-Raphson IRR, DSCR/LLCR covenant analysis, P50/P90 lender case, Monte Carlo IRR distribution, LP/GP waterfall, EU Taxonomy and SFDR PAI alignment, and comparable transaction benchmarking across 18 analytical tabs. Supports UK CfD, European CF+ contracts, and US IRA PTC structures.

> **Business value:** Designed for offshore wind project finance bankers, infrastructure equity investors, and developers structuring the financial close for 500MW–3GW offshore wind transactions. Covers the full financial model from CfD contract structure through Newton-Raphson IRR, DSCR covenant analysis, construction finance, LP/GP waterfall, and EU Taxonomy green bond packaging — replicating the offshore wind financial model typically built in 3-month Excel-based processes.

**How an analyst works this module:**
- Set project parameters in the left panel: capacity MW, technology (fixed/floating), country (UK/Germany/Netherlands/Denmark/US/Taiwan), and CAPEX $/kW stack
- Configure revenue contract in left Revenue panel: select CfD/PPA/Merchant; set CfD strike price; UK AR5 reference price auto-populates; "CfD Structure" tab shows annual settlement waterfall
- Open "Financial Model" tab for 25-year cash flows: Revenue → OPEX → EBITDA → Debt Service → CFADS → Free Cash Flow
- Navigate to "Returns Engine" for Newton-Raphson equity IRR and "DSCR & Debt" tab for the DSCR schedule with lender covenant breach flags (cash trap at 1.10×, minimum at 1.20×)
- Check "P50/P90 Yield" for Monte Carlo generation distribution and lender vs sponsor case comparison; "Monte Carlo" tab shows full IRR distribution from 1,000 combined uncertainty runs
- Use "Sensitivity Analysis" tornado chart and "Scenario Engine" for 4 scenario comparison (Base/Bull/Bear/Stress); DSCR breach probability shown for each scenario
- Open "Construction Finance" for drawdown schedule and IDC calculation; "LP/GP Waterfall" for 4-tier equity distribution mechanics
- Review "Comparable Transactions" for 10 recent offshore wind financial closes (Dogger Bank, Vineyard Wind, Hornsea 3, etc.); "LCOE Deep Dive" for component LCOE breakdown
- Check "ESG & Green Finance" for EU Taxonomy Art.10 alignment, DNSH assessment, and green bond eligibility (ICMA GBP); "Risk Register" for 15-factor project risk matrix
- Review "Summary Report" for the complete investment-grade deal summary: IRR/NPV/DSCR, CfD structure, ESG summary, and Proceed/Monitor/Pass recommendation

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLORS`, `COUNTRIES`, `IRENA_OFFSHORE`, `SideSection`, `Slider`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COUNTRIES` | 7 | `cfdStrike`, `reference`, `ptcBase`, `currency`, `taxRate` |
| `CAPEX_ITEMS` | 6 | `value`, `fill` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `npv` | `cfs.reduce((s, c, t) => s + c / Math.pow(1 + r, t), 0);` |
| `dnpv` | `cfs.reduce((s, c, t) => s - t * c / Math.pow(1 + r, t + 1), 0);` |
| `next` | `r - npv / dnpv;` |
| `totalCapex` | `capMW * 1000 * capexPerKw;` |
| `annualAEP` | `capMW * 1000 * (cfPct / 100) * 8760;` |
| `debtAmt` | `totalCapex * debtPct / 100;` |
| `equityAmt` | `totalCapex * eqPct / 100;` |
| `annDS` | `debtAmt * intRate / 100 / (1 - Math.pow(1 + intRate / 100, -tenor));` |
| `deg` | `Math.pow(1 - 0.005, y - 1);` |
| `aep` | `annualAEP * deg;` |
| `spot` | `referencePrice * Math.pow(1 + escalation / 100, y - 1);` |
| `opex` | `opexPerKw * capMW * 1000 / 1e6 * Math.pow(1.02, y - 1);` |
| `ebitda` | `revenue - opex;` |
| `interest` | `debtBal * intRate / 100;` |
| `cfads` | `ebitda - interest - Math.max(0, ebitda - interest) * taxRate / 100;` |
| `fcf` | `cfads - princPay;` |
| `dscr` | `annDS > 0 ? cfads / annDS : 999;` |
| `capexPerKw` | `turbinePerKw + foundationPerKw + installPerKw + gridPerKw + softPerKw;` |
| `equityCFs` | `useMemo(() => cashFlows.map(r => r.fcf), [cashFlows]);` |
| `equityIRR` | `useMemo(() => calcIRR(equityCFs) * 100, [equityCFs]);` |
| `projectCFs` | `useMemo(() => cashFlows.map(r => r.year === 0 ? -(capMW * 1000 * capexPerKw) : r.cfads), [cashFlows, capMW, capexPerKw]);` |
| `projectIRR` | `useMemo(() => calcIRR(projectCFs) * 100, [projectCFs]);` |
| `minDSCR` | `useMemo(() => cashFlows.slice(1).reduce((m, r) => r.dscr < m ? r.dscr : m, 99), [cashFlows]); const totalCapex = capMW * 1000 * capexPerKw;` |
| `npvRevenue` | `useMemo(() => cashFlows.slice(1).reduce((s, r, i) => s + r.revenue / Math.pow(1 + intRate / 100, i + 1), 0), [cashFlows, intRate]);` |
| `npvOpex` | `useMemo(() => cashFlows.slice(1).reduce((s, r, i) => s + r.opex / Math.pow(1 + intRate / 100, i + 1), 0), [cashFlows, intRate]);` |
| `npvAEP` | `useMemo(() => cashFlows.slice(1).reduce((s, r, i) => s + annualAEP * Math.pow(1 - 0.005, i) / Math.pow(1 + intRate / 100, i + 1), 0), [cashFlows, annualAEP, intRate]);` |
| `lcoe` | `npvAEP > 0 ? (totalCapex + npvOpex * 1e6) / npvAEP / 1000 * 1e6 : 0;` |
| `pertCF` | `cfPct * (1 + z * 0.08);` |
| `pertCapex` | `capexPerKw * (1 + sr(i * 5) * 0.15 - 0.075);` |
| `pertRef` | `referencePrice * (1 + (sr(i * 7) - 0.5) * 0.12);` |
| `irr` | `calcIRR(cfs2.map(r => r.fcf)) * 100;` |
| `min` | `irrs[0], max = irrs[irrs.length - 1];` |
| `irrP10` | `useMemo(() => { const irrs = mcData.flatMap(b => Array(b.count).fill(b.irr)).sort((a, b) => a - b);` |
| `irrP90` | `useMemo(() => { const irrs = mcData.flatMap(b => Array(b.count).fill(b.irr)).sort((a, b) => a - b);` |
| `sensData` | `useMemo(() => [ { factor: 'CAPEX ±20%', low: calcIRR(buildCashFlows({ ...params, capexPerKw: capexPerKw * 1.2 }).map(r => r.fcf)) * 100, high: calcIRR(buildCashFlows({ ...params, capexPerKw: capexPerKw * 0.8 }).map(r => r.fcf)) * 100 }, { factor: 'Capacity Factor ±8pp', low: calcIRR(buildCashFlows({ ...params, cfPct: cfPct - 8 }).map(r =>` |
| `fmt` | `(n, d = 1) => (n ?? 0).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });` |
| `scenarioResults` | `useMemo(() => [ { name: 'Base Case', capexMult: 1.0, cfAdj: 0, strikeAdj: 1.0, intAdj: 0 }, { name: 'Bull Case', capexMult: 0.9, cfAdj: 3, strikeAdj: 1.1, intAdj: -0.5 }, { name: 'Bear Case', capexMult: 1.15, cfAdj: -4, strikeAdj: 0.92, intAdj: 1.0 }, { name: 'Stress Case', capexMult: 1.25, cfAdj: -7, strikeAdj: 0.85, intAdj: 1.5 }, ].map` |
| `constructionDrawdown` | `useMemo(() => Array.from({ length: constructionYrs * 12 }, (_, i) => {` |
| `totalMo` | `constructionYrs * 12;` |
| `sCurve` | `3 * (mo / totalMo) ** 2 - 2 * (mo / totalMo) ** 3;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CAPEX_ITEMS`, `COLORS`, `COUNTRIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Equity IRR (offshore) | `Newton-Raphson on post-tax equity CFs` | Project finance model | Target equity IRR: 9–11% for CfD-contracted offshore wind (low risk); 12–14% for merchant/post-CfD; floating offshore: 12–16% to compensate technology risk |
| LCOE (offshore fixed) | `CAPEX + NPV(OPEX) / NPV(AEP)` | Industry benchmarks 2024 | Best UK/Dutch offshore fixed-bottom 2024: $65–75/MWh; US East Coast: $80–100/MWh (higher labor + supply chain costs) |
| CfD Strike (fixed offshore) | `UK AR4/AR5 auction results` | DESNZ CfD allocations | UK AR4 (2023) fixed-bottom strike: ~£73/MWh (2012 prices); AR5 2024: ~£82/MWh; US IRA PTC: $27.50/MWh base + adders for 10 years |
| DSCR (min, offshore) | `CFADS / Annual Debt Service` | Lender terms | CfD-contracted wind: lenders comfortable at 1.20× minimum due to revenue certainty; merchant periods require 1.35–1.50×; offshore construction risk premium reflected in higher DSRA |
| Construction Cost | `Turbine + foundation + installation + cabling` | BNEF/NREL 2024 | US offshore: higher than Europe due to Jones Act vessel constraints and limited supply chain; monopile: $2,200–2,800/kW; jacket: $2,500–3,200/kW; transition piece and array cabling: $200–400/kW additional |
| Project Finance Tenor | `Typical debt amortisation schedule` | Lender market norms | Offshore wind project finance tenor matches CfD duration (15yr) for maximum revenue certainty period; tail cash flows during merchant period used for refinancing or equity |
- **Project CAPEX stack + CfD strike + capacity factor → Annual revenue model** → Project finance cash flow: Revenue − OPEX − tax − DS → CFADS → **DSCR schedule, equity IRR, NPV**
- **Monte Carlo: CAPEX ±15%, CF ±8%, OPEX ±10%, interest rate ±1% (Box-Muller)** → Newton-Raphson IRR on perturbed equity cash flows × 1,000 runs → **IRR distribution P10/P50/P90, NPV at risk, DSCR breach probability**
- **10 comparable offshore wind transactions (seeded: Dogger Bank A/B/C, Vineyard Wind 1, Hornsea 3, Sofia OWF)** → LCOE, IRR, leverage, CfD strike benchmarking → **Comparable transaction range for IRR/LCOE/DSCR validation**

## 5 · Intermediate Transformation Logic
**Methodology:** Newton-Raphson IRR + CfD Revenue Model + DSCR Covenant Analysis
**Headline formula:** `IRR: Σ CF_t/(1+IRR)^t = 0; CfD: Revenue_t = min(E_t × strike, E_t × spot + max(0, strike−spot) × E_t); DSCR = CFADS / DS_t`

Offshore wind CfD revenue: generator receives max(strike, market_price) per MWh for CfD duration (15 years, UK); strike price set at AR auction; reference price = SEMO/N2EX Day-ahead index. Post-CfD period: merchant or new contract. DSCR calculated on CFADS = Revenue − OPEX − tax − capex reserve; lender covenant: min DSCR ≥ 1.20× (cash trap at 1.10×). Construction finance: EPC lump-sum turn-key typical for offshore wind; interest during construction (IDC) modelled on S-curve drawdown. Newton-Raphson IRR tolerance 1e-8, 200 iterations on post-tax equity cash flows.

**Standards:** ['UK Contracts for Difference (CfD) Allocation Round 5', 'FERC Order 2023', 'S&P RE Project Finance Rating Criteria']
**Reference documents:** UK DESNZ — Contracts for Difference Allocation Round 5 Results (2024); S&P Global — Offshore Wind Project Finance Methodology and Assumptions (2024); NREL — 2022 Offshore Wind Energy Cost Analysis Report; BNEF — Offshore Wind Market Outlook 2024 — Costs, Finance and Policy; EU Taxonomy Technical Expert Group — Offshore Wind Technical Screening Criteria

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

A full offshore wind project-finance model: CfD revenue mechanics, a self-implemented
Newton-Raphson IRR solver, a 25-year DSCR schedule, LCOE, and Monte Carlo IRR distribution — this
closely matches the guide's stated methodology.

```
IRR (Newton-Raphson): r_{n+1} = r_n − NPV(r_n) / NPV'(r_n)
NPV(r)   = Σ CF_t / (1+r)^t
NPV'(r)  = −Σ t·CF_t / (1+r)^(t+1)
DSCR_t   = CFADS_t / AnnualDebtService_t
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Blade/turbine degradation | 0.5%/yr (`Math.pow(1-0.005, y-1)`) | Standard offshore wind industry assumption, consistent with guide narrative |
| Reference/strike price escalation | user input, applied as `referencePrice × (1+escalation/100)^(y-1)` | Configurable, not hard-coded |
| OPEX escalation | 2%/yr | Synthetic demo value, plausible inflation-linked O&M escalator |
| Tax treatment | `cfads = ebitda − interest − max(0, ebitda−interest)×taxRate/100` | Correct: tax applied only to positive taxable income, guarded against negative EBIT |
| DSCR floor sentinel | 999 when `annDS ≤ 0` (no debt service due) | Prevents divide-by-zero, standard guard pattern |
| Country table (`COUNTRIES`, 7 rows) | CfD strike, reference price, PTC base, currency, tax rate | Modelled on real UK/EU/US regimes per guide (AR5 ~£82/MWh, US IRA PTC $27.50/MWh base) |

### 7.3 Calculation walkthrough

1. **Cash-flow build**: for each year, `spot = referencePrice×(1+escalation/100)^(y-1)`,
   `aep = annualAEP × 0.995^(y-1)` (degradation-adjusted energy), `opex` escalates at 2%/yr,
   `ebitda = revenue − opex`, `interest = debtBal×intRate/100`, `cfads` nets tax, `fcf = cfads −
   princPay`.
2. **DSCR**: computed per year as `cfads/annDS`; `minDSCR` is the minimum across the operating years
   (`slice(1)` excludes year 0 construction), used against the lender covenant bands the guide
   documents (1.20× minimum, 1.10× cash-trap).
3. **Equity vs project IRR**: `equityIRR` runs Newton-Raphson on the post-debt `fcf` series;
   `projectIRR` runs it on the pre-debt series (`year 0 = −totalCapex`, then `cfads`) — the
   standard unlevered-vs-levered IRR distinction.
4. **LCOE**: `(totalCapex + NPV(OPEX)) / NPV(AEP)` where both OPEX and AEP are discounted at the
   project interest rate — the textbook LCOE definition, with AEP discounted using the same
   degradation curve as the cash-flow build (`(1-0.005)^i`).
5. **Monte Carlo**: `pertCapex/pertRef` perturb CAPEX (±7.5%) and reference price (±6%) using
   `sr(seed)`-based uniform draws per simulation bucket, then re-run the full IRR solver per draw to
   build an IRR histogram; `irrP10`/`irrP90` are read off the sorted, bucket-expanded distribution.
5. **Construction drawdown**: an S-curve `3×(mo/totalMo)² − 2×(mo/totalMo)³` (the standard smoothstep
   function) allocates monthly capital calls, used for the IDC (interest-during-construction) build.

### 7.4 Worked example

500 MW, capacity factor 48%, CfD strike £82/MWh, CAPEX £2,800/kW, 15-year CfD term, 70% debt at 5.5%:

| Step | Computation | Result |
|---|---|---|
| Total CAPEX | 500,000 kW × £2,800 | £1.40bn |
| Annual AEP (yr 1) | 500,000 kW × 0.48 × 8760 | 2,102,400 MWh |
| Year-1 revenue (at strike) | 2,102,400 × £82 | £172.4M |
| Debt amount | 70% × £1.40bn | £980M |
| Annual debt service | 980M × 0.055 / (1−1.055⁻¹⁵) | ≈ £97.4M |
| Year-1 CFADS (illustrative, after OPEX/tax) | revenue − OPEX − tax | ≈ £115M |
| DSCR (yr 1) | 115M / 97.4M | **≈ 1.18×** — below the 1.20× covenant floor the guide describes, flagging a lender-case sizing issue at these illustrative inputs |

### 7.5 Data provenance & limitations

- **Country CfD/PTC terms are seed constants** modelled on real regimes (UK AR4/AR5, US IRA) but
  not live-updated from DESNZ or IRS publications.
- **Comparable transactions** (Dogger Bank, Vineyard Wind, Hornsea 3, etc.) are named real projects
  with **seeded illustrative financial metrics**, not sourced from actual financial-close disclosures.
- Newton-Raphson has no explicit iteration cap/convergence-failure fallback visible in the extracted
  formulas beyond the guide's stated "200 iterations, 1e-8 tolerance" — if the true IRR doesn't
  converge (e.g. non-standard cash-flow sign changes), the solver's behaviour is not guarded in the
  visible code.
- Monte Carlo CAPEX/CF/rate perturbations use the platform's deterministic `sr()` PRNG, not a proper
  Box-Muller/Gaussian sampler despite the guide's dataLineage claiming "Box-Muller" — this is a
  guide/code terminology mismatch worth flagging (the perturbation is a bounded uniform-ish draw via
  `sr()`, not a Gaussian).

**Framework alignment:** the CfD settlement mechanic (`revenue = min(strike,...) `-style top-up)
mirrors the UK CfD Allocation Round design; DSCR/CFADS terminology and covenant bands match S&P RE
Project Finance rating criteria; EU Taxonomy/SFDR alignment fields exist as a separate tab but are
outside the formulas extracted here.

## 9 · Future Evolution

### 9.1 Evolution A — Real CfD/market data behind the project-finance engine (analytics ladder: rung 2 → 3)

**What.** §7 confirms a full, correctly-built project-finance model: a self-implemented Newton-Raphson IRR solver (tolerance 1e-8), CfD revenue mechanics, 25-year DSCR schedule with covenant flags (cash trap 1.10×, min 1.20×), LCOE, and Monte Carlo IRR distribution — closely matching the guide, with correct tax guarding and divide-by-zero sentinels. The `COUNTRIES` table models real UK/EU/US regimes (AR5 ~£82/MWh, US IRA PTC $27.50/MWh). The gap is that reference prices and CAPEX are demo inputs. Evolution A grounds them and makes the Monte Carlo calibrated.

**How.** (1) Wire real reference prices: UK AR strike prices (DESNZ auction results, named in §5), N2EX/SEMO day-ahead index history for the merchant tail, and real PTC values — dated in a reference table so a UK 2029-COD project auto-populates its actual AR5 strike. (2) Calibrate the Monte Carlo generation distribution to real P50/P90 wind-yield data rather than assumed spreads — the sibling `offshore-wind-resource` module already computes P50/P90 lognormal yield; consume it so the finance model's generation uncertainty is engineering-sourced, not assumed. (3) CAPEX stack from NREL/BNEF cost benchmarks (named in §5), dated. This is a rung-3 calibration step; the rung-2 scenario engine (Base/Bull/Bear/Stress) already exists.

**Prerequisites.** DESNZ/NREL/BNEF data (partially public); cross-module wiring to `offshore-wind-resource` P50/P90; a `bench_quant` pin on the IRR solver and DSCR schedule for a known cash-flow case. **Acceptance:** a UK project auto-loads its real AR strike; Monte Carlo generation draws from resource-module P50/P90; IRR reproduces the pinned reference.

### 9.2 Evolution B — Project-finance structuring analyst (LLM tier 2)

**What.** A copilot for the offshore-wind PF banker users §1 targets: "what's the equity IRR for a 1GW UK fixed-bottom project at £82/MWh strike and 65% gearing?", "does the base case breach the 1.20× DSCR covenant?", "run the stress scenario and give me the breach probability" — executed against the IRR/DSCR/Monte Carlo engine, decomposing results into the cash-flow waterfall terms.

**How.** Tool calls to endpoints wrapping the Newton-Raphson IRR, DSCR schedule, and Monte Carlo functions; system prompt from this Atlas page's §5/§7.1 formulas and the UK CfD / S&P PF-rating references named in §5 so covenant and CfD mechanics are explained correctly. Scenario runs (Base/Bull/Bear/Stress) and sensitivity (tornado) are tool calls returning real distributions; the DSCR-breach-probability answer comes from the Monte Carlo, not estimation. Fabrication validator matches every IRR/DSCR/£/MWh to a tool response; the "show work" expander lists the cash-flow assumptions (roadmap Tier-2 provenance UX).

**Prerequisites.** Compute endpoints; Evolution A for real strike/CAPEX/yield inputs (the covenant and IRR mechanics work today on demo inputs). **Acceptance:** every IRR/DSCR figure traces to a tool call; scenario breach probabilities come from Monte Carlo runs; the copilot cites the CfD reference for settlement mechanics.