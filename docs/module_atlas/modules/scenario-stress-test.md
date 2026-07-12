# Scenario Stress Test
**Module ID:** `scenario-stress-test` · **Route:** `/scenario-stress-test` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Portfolio-level climate stress testing under NGFS scenarios. Covers transition (carbon price, policy) and physical (hazard, GDP shock) channels with sector-level loss attribution.

> **Business value:** Regulatory climate stress tests are now mandatory across EU, UK, Australia, and Hong Kong. This module enables scenario analysis required for TCFD/ISSB Strategy disclosures, ECB SREP climate assessment, and internal capital adequacy planning under climate stress.

**How an analyst works this module:**
- Scenario Selector applies NGFS stress parameters
- Portfolio Impact shows total loss by scenario and horizon
- Sector Attribution breaks down which sectors drive losses
- Company Drill-Down shows entity-level stress impact
- Reverse Stress Test finds threshold conditions for >20% portfolio loss

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLORS`, `HOLD_NAMES`, `MACRO`, `PORTFOLIO`, `SCENARIOS`, `SECTOR_IMPACTS`, `SECTOR_NAMES`, `STRESS_RESULTS`, `TABS`, `TOTAL_MV`, `YEARS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SCENARIOS` | 9 | `id`, `name`, `warming_c`, `carbonPrice2030`, `carbonPrice2040`, `carbonPrice2050`, `gdpImpact_pct`, `policyIntensity`, `physicalDamage_pct`, `transitionCost_pct`, `color`, `framework` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtB` | `n=>n>=1e3?`$${fmt(n/1e3)}B`:`$${fmt(n,0)}M`;` |
| `clamp` | `(v,lo,hi)=>Math.max(lo,Math.min(hi,v));` |
| `safeDivide` | `(a,b,fallback=0)=>b!==0?a/b:fallback;` |
| `base` | `sr(si*100+sci*13+7);` |
| `sIdx` | `Math.floor(sr(i*17)*SECTOR_NAMES.length);` |
| `idio` | `sr(i*100+sci*7)*4-2;` |
| `TOTAL_MV` | `PORTFOLIO.reduce((a,h)=>a+h.market_value,0);` |
| `YEARS` | `Array.from({length:31},(_,i)=>2025+i);` |
| `losses` | `PORTFOLIO.map(h=>h.scenImpacts[s.id].loss_pct*h.market_value/100);` |
| `totalLoss` | `losses.reduce((a,v)=>a+v,0);` |
| `sortedLosses` | `[...losses].sort((a,b)=>a-b);` |
| `var95idx` | `Math.floor(sortedLosses.length*0.95);` |
| `var99idx` | `Math.floor(sortedLosses.length*0.99);` |
| `var95` | `sortedLosses[Math.min(var95idx,sortedLosses.length-1)];` |
| `var99` | `sortedLosses[Math.min(var99idx,sortedLosses.length-1)];` |
| `es95` | `tailLosses.length>0?tailLosses.reduce((a,v)=>a+v,0)/tailLosses.length:0;` |
| `btnS` | `a=>({fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:a?700:500,padding:'8px 18px',border:`1px solid ${a?T.gold:T.border}`,borderRadius:6,background:a?T.gold:T.card,color:a?'#fff':T.text,cursor:'pointer',transiti` |
| `kpiLab` | `{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.sub,marginTop:4,textTransform:'uppercase',letterSpacing:0.5};` |
| `tdS` | `{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.text,padding:'10px 12px',borderBottom:`1px solid ${T.border}`};` |
| `secTitle` | `{fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:700,color:T.navy,marginBottom:12};` |
| `exportCSV` | `(rows,fn)=>{if(!rows.length)return;const ks=Object.keys(rows[0]);const csv=[ks.join(','),...rows.map(r=>ks.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.cre` |
| `radarData` | `useMemo(()=>SCENARIOS.map(s=>({` |
| `portfolioLossData` | `useMemo(()=>STRESS_RESULTS.map(r=>({name:r.scenario.length>14?r.scenario.slice(0,14)+'..':r.scenario,loss:r.portfolio_loss_pct,color:r.color})),[]);` |
| `heatmapData` | `useMemo(()=>{ return SECTOR_NAMES.map(sec=>{ const row={sector:sec.length>12?sec.slice(0,12)+'..':sec};` |
| `MACRO_LABELS` | `{gdp_growth:'GDP Growth (%)',carbon_price:'Carbon Price ($/tCO2)',inflation:'Inflation (%)',unemployment:'Unemployment (%)',interest_rate:'Interest Rate (%)'};` |
| `macroChartData` | `useMemo(()=>{ return YEARS.filter((_,i)=>i%3===0\|\|i===30).map(y=>{ const row={year:y};` |
| `varData` | `useMemo(()=>STRESS_RESULTS.map(r=>({name:r.scenario.length>12?r.scenario.slice(0,12)+'..':r.scenario,var95:Math.abs(r.var_95),var99:Math.abs(r.var_99),es95:Math.abs(r.es_95),color:r.color})),[]);` |
| `post` | `12.5-r.capital_impact_pct;const buf8=post-8;const buf105=post-10.5;` |
| `physLoss` | `(w-1.0)*3.5;` |
| `shock` | `sr(p*1000+step*7)*6-2;` |
| `mcSummary` | `useMemo(()=>{ const finalLosses=mcPaths.map(p=>Math.abs(p[p.length-1].loss));` |
| `breachScenarios` | `useMemo(()=>{ return STRESS_RESULTS.filter(r=>r.portfolio_loss_pct>=reverseThreshold).sort((a,b)=>b.portfolio_loss_pct-a.portfolio_loss_pct);` |
| `reportRows` | `useMemo(()=>STRESS_RESULTS.map(r=>{` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `HOLD_NAMES`, `SCENARIOS`, `SECTOR_NAMES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Scenarios | — | NGFS | Current Policies, Delayed Transition, Below 2°C, Net Zero 2050, Divergent Net Zero |
| Portfolio Loss (NZ 2050) | — | Model | AUM decline under Net Zero 2050 stress |
| Sector Contribution | — | Attribution | Largest single-sector contributor to stress loss |
- **NGFS scenario parameters** → Sector-level shock transmission → **Entity-level loss estimates**
- **Portfolio holdings** → AUM-weighted aggregation → **Portfolio stress loss**
- **Stress results** → Regulatory capital calculation → **Capital adequacy under stress**

## 5 · Intermediate Transformation Logic
**Methodology:** Integrated climate stress test
**Headline formula:** `PortfolioLoss = Σ(w_i × EntityLoss_i); EntityLoss = f(sector, scenario, horizon)`

Transition channel: carbon price shock → EBITDA reduction → credit loss (PD/LGD impact). Physical channel: hazard intensity → asset damage → income loss. Combined: correlated through macro GDP shock.

**Standards:** ['NGFS Phase 5', 'ECB CST 2024', 'BoE CBES']
**Reference documents:** NGFS Phase 5 Climate Scenarios; ECB Climate Stress Test Methodology 2024; BoE CBES Guidance Note

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This is the most methodologically sophisticated module in this deep-dive batch. Unlike most peers,
it implements genuine empirical VaR/CVaR statistics, a coherent transition/physical decomposition,
and a real (if simplified) regulatory capital buffer test — layered over a synthetic 50-holding
portfolio and 8-scenario universe.

### 7.1 What the module computes

For each of 8 scenarios, portfolio losses are the **cross-sectional distribution of per-holding
losses** (50 holdings, one realised loss each under the scenario) rather than a time-series of
portfolio returns — an empirical/historical-simulation-style VaR using the holding population as
the sample:

```
losses          = PORTFOLIO.map(h => h.scenImpacts[scenario].loss_pct x h.market_value / 100)
totalLoss       = Sum(losses)
sortedLosses    = sort(losses)
VaR95           = sortedLosses[floor(n x 0.95)]        // 95th percentile single-holding loss
VaR99           = sortedLosses[floor(n x 0.99)]
ES95            = mean(sortedLosses[floor(n x 0.95):])  // Expected Shortfall = mean of tail beyond VaR95
capital_impact_pct = totalLoss/TOTAL_MV x 100 x 1.25 + noise    // regulatory capital multiplier
CET1_post       = 12.5 - capital_impact_pct              // stressed capital ratio
buffer_vs_8pct  = CET1_post - 8.0                        // Basel III minimum CET1 buffer
buffer_vs_10.5pct = CET1_post - 10.5                      // + capital conservation buffer
```
This VaR95/VaR99/ES95 methodology is **textbook-correct** for an empirical/historical VaR
calculation (sort realisations, take the percentile, average the tail for ES) — the only
simplification is that the "sample" is 50 cross-sectional holdings under one scenario realisation
rather than a full time series or Monte Carlo path ensemble (partially addressed separately by the
Monte Carlo reverse-stress-test tab, §7.5).

### 7.2 Parameterisation

| Scenario | Warming | Carbon price 2050 | GDP impact | Physical damage | Transition cost | Framework |
|---|---|---|---|---|---|---|
| Net Zero 2050 | 1.5C | $420/t | -2.1% | 3.2% | 4.8% | NGFS |
| Below 2C | 1.7C | $300/t | -3.0% | 4.5% | 3.5% | NGFS |
| Divergent Net Zero | 1.5C | $500/t | -4.5% | 3.8% | 6.2% | NGFS |
| Delayed Transition | 1.8C | $450/t | -5.8% | 5.5% | 7.1% | NGFS |
| NDCs | 2.5C | $80/t | -7.2% | 9.8% | 2.1% | NGFS |
| Current Policies | 3.0C | $25/t | -10.5% | 14.2% | 1.0% | NGFS |
| Policy Shock (custom) | 1.6C | $500/t | -6.0% | 3.0% | 9.5% | Custom |
| Tech Disruption (custom) | 1.4C | $120/t | -1.5% | 2.8% | 3.0% | Custom |

This table is directionally excellent NGFS characterisation: orderly 1.5C scenarios show low
physical damage/high transition cost; Current Policies correctly shows the **worst** GDP impact
(-10.5%) and highest physical damage (14.2%) despite the "lowest" nominal warming-related policy
effort — matching the real NGFS insight that hot-house-world scenarios are worse for the economy
overall than orderly transition, even though transition costs are individually higher in orderly
scenarios.

| Constant | Value | Provenance |
|---|---|---|
| `transExp` by sector tercile | 0.70 (Energy/Materials/Industrials), 0.30 (mid sectors), 0.15 (defensive) | Reasonable GICS-based transition-exposure tiering |
| `physExp` by sector tercile | 0.60 (Real Estate/Oil&Gas/Metals&Mining/Chemicals/Transport), 0.25 (Utilities-adjacent), 0.40 (remainder) | Plausible physical-exposure tiering, though the specific tercile boundaries are author judgement |
| Capital multiplier | 1.25x portfolio loss % | Simplified RWA-scaling proxy, not a real Basel risk-weighted-asset calculation |
| Starting CET1 | 12.5% | Reasonable illustrative starting capital ratio for a well-capitalised bank |
| Basel minimums | 8.0% (Pillar 1 minimum) / 10.5% (+ 2.5% capital conservation buffer) | Correct real Basel III minimum CET1 thresholds |

### 7.3 Calculation walkthrough

1. `genSectorImpacts()` builds a 15-sector × 8-scenario impact matrix: `revenue_impact_pct`
   combines a sector's transition exposure (`base × 15 × transExp`, negative) with scenario
   physical damage (`× physExp × 0.5`, negative) plus small idiosyncratic noise — correctly
   signed so higher-transition-exposure sectors lose more revenue under high-carbon-price
   scenarios, and higher-physical-exposure sectors lose more under high-physical-damage scenarios.
2. `genPortfolio()` assigns each of 50 holdings to a sector, then derives per-scenario
   `loss_pct = |revenue_impact| × 0.6 + stranded_pct × 0.15 + idiosyncratic_noise` — a genuine
   composition of the sector-level transition/stranding signal plus holding-specific noise
   (`idio = sr(...)×4-2`, ±2pp).
3. `genStressResults()` (§7.1) aggregates holding-level losses into portfolio VaR/ES and splits
   the loss into `transition_share`/`physical_share` via `safeDivide` (correctly guarded against
   division by zero when `totalLoss=0`).
4. `genMacro()` produces 30-year (2025-2055) GDP growth/carbon price/inflation/unemployment/
   interest-rate paths per scenario, each interpolating linearly toward the scenario's 2050
   carbon price and physical/transition cost endpoints, with small annual noise — a reasonable
   scenario-conditioned macro trajectory, though the interpolation is linear rather than
   econometrically modelled.
5. **Monte Carlo reverse-stress-test tab**: `shock = sr(p×1000+step×7)×6-2` generates a random
   walk of shocks per simulated path; `mcSummary` aggregates final losses across paths (mean, and
   presumably percentiles) — genuine Monte Carlo path simulation, adding a time-series dimension
   the main VaR calculation lacks.
6. **Reverse stress test**: `breachScenarios` filters `STRESS_RESULTS` to scenarios where
   `portfolio_loss_pct >= reverseThreshold` (user-set, default 20%) — correctly implements the
   reverse-stress-test concept of "which scenarios breach an unacceptable loss threshold."

### 7.4 Worked example

Under "Current Policies" (worst GDP impact scenario), suppose the 50-holding loss distribution
sorts to `sortedLosses[47] = $18.2M` (95th percentile, `floor(50×0.95)=47`) and
`sortedLosses[49] = $24.1M` (99th percentile, `floor(50×0.99)=49`), with `totalLoss=$310M` against
`TOTAL_MV≈$12,750M` (50 holdings averaging ~$255M each):
```
portfolio_loss_pct = 310/12,750 x 100 = 2.43%
VaR95 = $18.2M, VaR99 = $24.1M
ES95  = mean(sortedLosses[47:50]) = mean($18.2M, ~$21M, $24.1M) ~= $21.1M
capital_impact_pct = 2.43 x 1.25 + noise ~= 3.04% + 0.8% = 3.84%
CET1_post = 12.5 - 3.84 = 8.66%
buffer_vs_10.5% = 8.66 - 10.5 = -1.84pp   -> breaches the capital conservation buffer
buffer_vs_8%    = 8.66 - 8.0  = +0.66pp   -> still above the hard Pillar 1 minimum
```
This is a realistic-looking regulatory capital stress narrative: the bank stays solvent (above the
8% hard floor) but breaches its capital conservation buffer, triggering distribution restrictions
under Basel III — a genuinely useful illustration of how climate stress could bind on bank capital
even without triggering outright insolvency.

### 7.5 Data provenance & limitations

- VaR95/VaR99/ES95 are correctly computed empirical statistics, and the transition/physical
  decomposition is internally consistent (sector exposure tiers drive both channels coherently).
- All underlying data (50 holdings, 15-sector impact matrix, macro paths) is synthetic
  (`sr()`-seeded); the *methodology* is sound but the *inputs* are not calibrated to a real
  portfolio or real NGFS model output.
- `capital_impact_pct`'s 1.25x multiplier is an illustrative RWA-scaling proxy, not a true
  Basel risk-weighted-asset recalculation (which would require asset-class-specific risk weights
  and a full capital-adequacy waterfall).
- The empirical VaR is computed **cross-sectionally** (across 50 holdings under one scenario draw)
  rather than as a time-series/Monte-Carlo distribution of portfolio outcomes — a materially
  different (and less standard for regulatory VaR) sampling approach, though the Monte Carlo
  reverse-stress-test tab partially compensates by adding a path-simulation dimension.
- Macro trajectory interpolation is linear, not derived from an actual macro-econometric model
  (e.g. NiGEM, GVAR) as real central-bank climate stress tests (ECB CST, BoE CBES) would use.

**Framework alignment:** NGFS Phase 5 scenario framework (scenario characterisation is directionally
excellent and internally consistent) · ECB Climate Stress Test 2024 / BoE CBES methodology
(transition + physical channel decomposition and capital-impact framing conceptually mirrors these
regulatory exercises) · Basel III CET1 minimum (8%) and capital conservation buffer (10.5%)
thresholds (correctly applied) · standard historical/empirical VaR and Expected Shortfall
methodology (correctly implemented, applied to a cross-sectional rather than time-series sample).

## 9 · Future Evolution

### 9.1 Evolution A — Real portfolio and NGFS inputs under the sound machinery (analytics ladder: rung 2 → 3)

**What.** §7 calls this the most methodologically sophisticated module in its batch: genuine empirical VaR95/VaR99/ES95 over the cross-sectional loss distribution, an internally consistent transition/physical decomposition driven coherently by sector exposure tiers, and a real (simplified) capital buffer test. §7.5's precise critique: the methodology is sound but the inputs aren't — the 50 holdings, 15-sector impact matrix, and macro paths are all seeded rather than calibrated to a real portfolio or actual NGFS model output, and `capital_impact_pct`'s 1.25× RWA multiplier is an illustrative proxy for a true risk-weighted recalculation. Evolution A swaps the inputs and keeps the engine.

**How.** (1) Holdings from the user's actual book (`portfolios_pg` + `GLOBAL_COMPANY_MASTER` enrichment for sector/intensity), so losses attach to real weights. (2) The sector impact matrix derived from NGFS scenario output (sector value-added/cost shocks per scenario-year from the platform's NGFS vintage store) with the derivation documented per Atlas §8 — replacing hand-shaped tiers with citable shocks; physical-channel shocks regionalised via the holdings' geography where known. (3) Capital impact upgraded from the 1.25× proxy: asset-class risk weights from the `regulatory-capital` engine's CRR3 tables (reuse, don't duplicate) for a defensible RWA-based buffer test, or the proxy retained with an explicit label where granularity is missing. (4) Server-side port; bench pin on a 5-holding case with hand-computable empirical VaR.

**Prerequisites.** NGFS-to-sector shock mapping (the real research task); portfolio geography coverage for the physical channel. **Acceptance:** results change when the user's actual portfolio changes; each sector shock cites its NGFS variable and vintage; the bench VaR reproduces by hand; the capital line states which method (CRR3 weights vs proxy) produced it.

### 9.2 Evolution B — Regulatory stress-narrative copilot (LLM tier 2)

**What.** Stress-test outputs feed ICAAP/ORSA documents and TCFD strategy sections — narrative built on this module's numbers. The copilot drafts it: "write the scenario-analysis section: methodology summary, VaR/ES by scenario, transition-vs-physical attribution, sector concentrations, and limitations", and answers challenge questions ("why is Disorderly worse than Hot House for us?" — answerable mechanically from the sector decomposition: transition-heavy book, front-loaded carbon shocks).

**How.** Tier-2 tool calls over the stress endpoints; attribution answers quote the decomposition's actual components per scenario. The limitations paragraph is generated from the module's own documented caveats (§7.5's input-calibration notes, the capital-method label from Evolution A) — self-aware disclosure as a feature, matching supervisory expectations that models state their weaknesses. Scenario-comparison tables and the methodology summary render via report studio; hand-off to `regulatory-stress-submission` for template-field population where submissions are in scope. Every loss figure, percentile, and attribution validated against tool output.

**Prerequisites.** Evolution A (drafting ICAAP text on seeded holdings would put fabricated numbers into regulatory documents — the highest-stakes failure available); report-studio integration. **Acceptance:** drafted sections' figures match endpoint output; the limitations paragraph reflects the current method flags; challenge answers decompose into actual computed components.