# Private Credit Climate Risk
**Module ID:** `private-credit-climate` · **Route:** `/private-credit-climate` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Climate risk analytics for private credit portfolios, assessing physical exposure, transition risk, and PCAF-aligned financed emissions at deal level.

> **Business value:** Brings PCAF-compliant financed emissions accounting and NGFS climate risk analytics to private credit portfolios, supporting TCFD and net-zero commitments.

**How an analyst works this module:**
- Map portfolio companies to PCAF asset class.
- Source or estimate Scope 1+2 emissions by data quality tier.
- Compute financed emissions with EVIC attribution.
- Overlay physical and transition climate risk scores by deal.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLORS`, `DATA`, `PAGE_SIZE`, `RATINGS`, `RISK_LEVELS`, `SECTORS`, `STRATEGIES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt1` | `n=>Number(n).toFixed(1);const fmt0=n=>Number(n).toFixed(0);const fmtM=n=>n>=1000?`$${(n/1000).toFixed(1)}B`:`$${n}M`;` |
| `sector` | `SECTORS[Math.floor(s1*SECTORS.length)];` |
| `strategy` | `STRATEGIES[Math.floor(s2*STRATEGIES.length)];` |
| `rating` | `RATINGS[Math.floor(s3*RATINGS.length)];` |
| `region` | `['North America','Europe','Asia Pacific','LATAM','Middle East','Africa'][Math.floor(s4*6)];` |
| `riskLevel` | `RISK_LEVELS[Math.floor(s5*RISK_LEVELS.length)];` |
| `notional` | `Math.floor(10+s6*490);` |
| `spread` | `Math.floor(150+s7*650);` |
| `ltv` | `Number((30+s8*45).toFixed(1));` |
| `maturity` | `Math.floor(1+s9*9);` |
| `climateScore` | `Math.floor(15+s10*80);` |
| `transRisk` | `Math.floor(10+sr(i*71+41)*85);` |
| `physRisk` | `Math.floor(5+sr(i*73+43)*80);` |
| `carbonFp` | `Math.floor(20+sr(i*79+47)*480);` |
| `waterStress` | `Math.floor(5+sr(i*83+53)*90);` |
| `stranded` | `Number((sr(i*89+59)*35).toFixed(1));` |
| `lgd` | `Number((20+sr(i*101+67)*60).toFixed(1));` |
| `expectedLoss` | `Number((pd*lgd/100).toFixed(2));` |
| `covenant` | `sr(i*103+71)>0.6?'Pass':sr(i*107+73)>0.3?'Watch':'Breach';` |
| `badgeS` | `(bg)=>({display:'inline-block',padding:'2px 10px',borderRadius:99,fontSize:11,fontWeight:600,fontFamily:T.mono,background:bg+'18',color:bg,border:`1px solid ${bg}33`});` |
| `exportCSV` | `(rows,fn)=>{if(!rows.length)return;const ks=Object.keys(rows[0]);const csv=[ks.join(','),...rows.map(r=>ks.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.cre` |
| `paged` | `useMemo(()=>filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),[filtered,page]);` |
| `totalPages` | `Math.ceil(filtered.length/PAGE_SIZE);` |
| `kpis` | `useMemo(()=>{const d=filtered;if(!d.length)return{count:0,totalExp:0,avgClimate:0,avgPd:0,avgSpread:0,highRisk:0};return{count:d.length,totalExp:d.reduce((a,r)=>a+r.notional,0),avgClimate:d.reduce((a,r)=>a+r.climateScore` |
| `sectorExp` | `useMemo(()=>{const m={};filtered.forEach(r=>{m[r.sector]=(m[r.sector]\|\|0)+r.notional;});return Object.entries(m).map(([name,value])=>({name:name.length>14?name.slice(0,14)+'..':name,value})).sort((a,b)=>b.value-a.value);` |
| `ratingDist` | `useMemo(()=>RATINGS.map(r=>({name:r,value:filtered.filter(l=>l.rating===r).length})).filter(d=>d.value>0),[filtered]);` |
| `strategyDist` | `useMemo(()=>{const m={};filtered.forEach(r=>{m[r.strategy]=(m[r.strategy]\|\|0)+r.notional;});return Object.entries(m).map(([name,value])=>({name:name.length>12?name.slice(0,12)+'..':name,value})).sort((a,b)=>b.value-a.val` |
| `riskDist` | `useMemo(()=>RISK_LEVELS.map(l=>({name:l,value:filtered.filter(r=>r.riskLevel===l).length})),[filtered]);` |
| `climateVsCredit` | `useMemo(()=>filtered.map(r=>({name:r.name,climate:r.climateScore,pd:r.pd,notional:r.notional})),[filtered]);` |
| `radarData` | `useMemo(()=>{if(!filtered.length)return[];const avg=k=>filtered.reduce((a,r)=>a+r[k],0)/filtered.length;return[{axis:'Climate',value:avg('climateScore')},{axis:'Env',value:avg('envScore')},{axis:'Social',value:avg('socSc` |
| `scenarioData` | `useMemo(()=>['Orderly (1.5C)','Disorderly (2C)','Hot House (3C+)'].map((name,i)=>({name,loss:filtered.reduce((a,r)=>a+[r.scenarioLoss1,r.scenarioLoss2,r.scenarioLoss3][i],0)/(filtered.length\|\|1)})),[filtered]);` |
| `trendData` | `useMemo(()=>['Q1','Q2','Q3','Q4'].map((q,i)=>({quarter:q,climate:filtered.reduce((a,r)=>a+[r.q1,r.q2,r.q3,r.q4][i],0)/(filtered.length\|\|1)})),[filtered]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `RATINGS`, `RISK_LEVELS`, `SECTORS`, `STRATEGIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Financed Emissions (tCO₂e) | — | PCAF Attribution | Total Scope 1+2 emissions attributed to private credit portfolio. |
| Physical Risk Exposure (%) | — | Hazard Engine | Share of portfolio exposure to high or extreme physical climate hazard. |
| Avg Data Quality Score | — | PCAF DQ Framework | Mean data quality score across portfolio using PCAF 5-tier DQ scale. |
- **Loan register + borrower financials + emissions data** → PCAF attribution; DQ scoring; physical/transition risk overlay → **Deal-level and portfolio-level climate risk and financed emissions outputs**

## 5 · Intermediate Transformation Logic
**Methodology:** PCAF Financed Emissions (Private Debt)
**Headline formula:** `FE = (Outstanding / EVIC) × SCOPE1+2; DQ weighted`

Attribution of borrower Scope 1+2 emissions to lender based on outstanding loan balance as proportion of enterprise value.

**Standards:** ['PCAF Standard Part A (2022)', 'TCFD']
**Reference documents:** PCAF The Global GHG Accounting Standard Part A: Financed Emissions (2022); NGFS Physical Risk Scenarios

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes **PCAF financed-emissions for
> private debt**: `FE = (Outstanding / EVIC) × (Scope1+2)`, a DQ-weighted data-quality score, a
> headline "2.4M tCO₂e portfolio financed emissions", and an "avg DQ 3.1/5". **None of this exists in
> the code.** There is no EVIC field, no emissions attribution, no PCAF DQ scoring, no financed-
> emissions figure anywhere on the page. What the module actually ships is a **50-loan synthetic
> private-credit book** with per-deal climate/credit scores, a point-estimate expected loss, and
> three seeded "scenario losses". Sections below document the code.

### 7.1 What the module computes

All 50 loans are generated by `genLoans(50)`; every attribute is a seeded draw. The only genuine
arithmetic is a one-line expected loss:

```js
pd            = 0.1 + sr(i·97+61)·9.9            // 0.1–10.0 %
lgd           = 20  + sr(i·101+67)·60            // 20–80 %
expectedLoss  = pd · lgd / 100                   // = PD × LGD, expressed per-100 notional
```

Everything else is a labelled random field:

```js
notional   = 10 + s6·490          // $10–500M
spread     = 150 + s7·650         // 150–800 bps
climateScore = 15 + s10·80        // 15–95
transRisk  = 10 + sr(i·71+41)·85  physRisk = 5 + sr(i·73+43)·80
carbonFp   = 20 + sr(i·79+47)·480 waterStress = 5 + sr(i·83+53)·90
stranded   = sr(i·89+59)·35        (% stranded-asset risk)
scenarioLoss1/2/3 = sr(·)·15 / ·25 / ·40   // Orderly / Disorderly / Hot House loss %
covenant   = sr>0.6 'Pass' : sr>0.3 'Watch' : 'Breach'
```

Portfolio outputs are simple aggregates over the filtered book: `avgClimate`, `avgPd`, `avgSpread`,
total notional, a 6-axis ESG/climate radar (`100 − transRisk`, `100 − physRisk` are "inverted"
goodness axes), a rating distribution, and the three-scenario average-loss bar.

### 7.2 Parameterisation / provenance

| Quantity | Formula | Provenance |
|---|---|---|
| PD | `0.1 + sr()·9.9` | **synthetic seeded** |
| LGD | `20 + sr()·60` | **synthetic seeded** |
| Expected loss | `PD × LGD / 100` | correct EL identity on synthetic inputs |
| Scenario loss (Orderly) | `sr()·15` | synthetic; label "1.5 °C" |
| Scenario loss (Disorderly) | `sr()·25` | synthetic; label "2 °C" |
| Scenario loss (Hot House) | `sr()·40` | synthetic; label "3 °C+" |
| climate/trans/phys/carbon | seeded ranges | synthetic |

The **only** structural signal is that the three scenario-loss ceilings increase (15 < 25 < 40),
loosely encoding "hotter scenario = larger loss" — but each deal's three losses are independent
draws, so a deal can show a *smaller* hot-house loss than its orderly loss.

### 7.3 Calculation walkthrough

1. `genLoans(50)` seeds 50 deals from `sr()` indices spaced by distinct prime multipliers.
2. Filters (search / sector / strategy / risk) subset the book.
3. `kpis` averages PD, climate score, spread over the filtered set; sums notional.
4. `scenarioData` averages each of the three seeded loss fields across the book → 3-bar stress chart.
5. `radarData` averages the six ESG/climate axes; `trendData` averages the four seeded quarterly
   climate scores q1–q4 into a "trend" (note: these are independent draws, not a real time series).

### 7.4 Worked example (one seeded deal, i = 0)

For `i = 0`: `sr(97·0+61)=sr(61)`, `sr(101·0+67)=sr(67)`. With the platform PRNG
`sr(s)=frac(sin(s+1)×10⁴)`:

- `sr(61) = frac(sin(62)×10⁴)`; suppose it yields ≈0.40 → `pd = 0.1 + 0.40×9.9 = 4.06%`.
- `sr(67) = frac(sin(68)×10⁴)`; suppose ≈0.55 → `lgd = 20 + 0.55×60 = 53.0%`.
- `expectedLoss = 4.06 × 53.0 / 100 = 2.15` (i.e. 2.15% of notional expected loss).

The arithmetic is faithful, but the inputs are noise: there is no rating→PD calibration (the `rating`
field is an independent `sr()` draw and does **not** drive PD), so a CCC deal can show a lower PD
than a AAA deal.

### 7.5 Data provenance & limitations

- **Every value on the page is synthetic**, seeded by `sr(seed)=frac(sin(seed+1)×10⁴)`. There are no
  real counterparties, no emissions data, no scenario model.
- The guide's PCAF financed-emissions engine, EVIC attribution, and DQ 5-tier scoring are **entirely
  absent** — the page cannot produce the "2.4M tCO₂e" or "3.1/5 DQ" it advertises.
- PD, LGD, rating, climate score, and scenario losses are mutually independent draws → internally
  inconsistent (rating ⊥ PD; orderly loss can exceed hot-house loss).
- "Quarterly trend" is four independent draws, not an autocorrelated series.

**Framework alignment:** The page *names* **PCAF Part A (2022)** and **TCFD/NGFS** but implements
none of their math. For reference, PCAF private-debt attribution is `outstanding / (total
debt+equity)` × borrower Scope 1+2, DQ-scored 1 (verified) to 5 (proxy). NGFS scenarios (Orderly /
Disorderly / Hot House) would supply calibrated macro-financial loss paths — here they are only
labels on random numbers. A production build needs §8.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Produce, per private-credit deal and at portfolio level: (a) PCAF-aligned
financed emissions with a data-quality score, and (b) NGFS-scenario-conditioned expected credit loss.
Coverage: all direct-lending / mezzanine / unitranche facilities with borrower financials.

**8.2 Conceptual approach.** Two coupled models. (i) **PCAF financed emissions** (Part A private
debt), the industry standard for attributing borrower emissions to a lender. (ii) **Climate-
conditioned IFRS-9 ECL**, mirroring Moody's climate-adjusted EDF and Aladdin Climate transition
repricing — the PD is scaled by a borrower carbon-intensity × scenario-carbon-price channel, exactly
as in the platform's own `climate-credit-integration` engine.

**8.3 Mathematical specification.**
Financed emissions: `FE_c = (Outstanding_c / (Debt_c + Equity_c)) × (Scope1_c + Scope2_c)`;
`DQ_c ∈ {1..5}` per PCAF data hierarchy; portfolio `FE = Σ FE_c`, `avgDQ = Σ(FE_c·DQ_c)/Σ FE_c`.
Climate-conditioned PD: `PD_adj = min(1, PD_base × [1 + (m_s−1)·(carbonInt_c/800)] × [1 + (m_s−1)·(physScore_c/100)·0.3])`,
where `m_s` is the NGFS scenario PD multiplier. `ECL_adj = PD_adj × LGD_adj × EAD`, `LGD_adj = LGD_base × ℓ_s`.

| Parameter | Symbol | Calibration source |
|---|---|---|
| PD multiplier by scenario | `m_s` | NGFS Phase IV (Orderly 1.08 → Current Policies 1.58) |
| LGD multiplier | `ℓ_s` | NGFS / EBA stress LGD add-ons |
| Carbon-intensity anchor | 800 tCO₂e/GWh | IEA supercritical-coal ceiling |
| Emissions | Scope 1+2 | CDP / sector EF (EPA/IEA) with PCAF DQ tier |
| Base PD/LGD | – | internal rating scale (rating→PD master) |

**8.4 Data requirements.** Per deal: outstanding, borrower debt+equity, Scope 1+2 (or sector proxy +
DQ tier), sector, internal rating→PD, LGD by seniority. Sources: loan register, CDP/sector EF,
NGFS scenario tables (`climate_scenario_variables`, migration 088 — already in platform).

**8.5 Validation & benchmarking.** Reconcile portfolio FE against PCAF-reported peers; backtest
ECL_adj vs realised private-credit losses across cycles; sensitivity of ECL to scenario multiplier
and carbon anchor; benchmark PD conditioning against Moody's climate-adjusted EDF ordering.

**8.6 Limitations & model risk.** Private-borrower emissions are sparse → high DQ tiers dominate;
rating→PD mapping for unrated private borrowers is judgemental. Conservative fallbacks: sector-median
emissions at DQ 5; if scenario data stale, report base ECL and suppress scenario deltas rather than
emit synthetic losses.

## 9 · Future Evolution

### 9.1 Evolution A — Actually compute PCAF financed emissions (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag is blunt: the guide promises `FE = (Outstanding/EVIC) × Scope1+2` with PCAF DQ scoring, but no EVIC field, no attribution, and no financed-emissions figure exists — the page is a 50-loan `sr()`-seeded book whose only real arithmetic is `expectedLoss = pd × lgd / 100`, and `transRisk`/`physRisk`/`carbonFp`/`scenarioLoss1-3` are labelled random draws. Evolution A implements the missing methodology. Notably the sibling `private-credit` module already computes the correct PCAF private-debt attribution factor (`min(drawn/(equity+debt),1)`) — this module should share that logic, not duplicate it.

**How.** (1) Backend `POST /api/v1/private-credit-climate/financed-emissions`: per-loan attribution × borrower Scope 1+2, with the PCAF 5-tier data-quality ladder implemented as declared estimation cascades (reported emissions → sector-average intensity × revenue → asset-turnover proxy), each tier stamped on the row. (2) Sector-average emission factors seeded from the refdata layer (OWID/EPA intensity tables already in `reference_data`). (3) Scenario losses re-derived: NGFS scenario × sector transition exposure replacing the three seeded `scenarioLoss` fields. (4) The loan book becomes a persisted table with borrower financials (revenue, debt+equity) so attribution has a denominator.

**Prerequisites.** The §7 fabrication acknowledged in release notes (headline "2.4M tCO₂e" was never computed); borrower emissions/financials schema agreed with `private-credit`'s facility model to avoid a second register. **Acceptance:** portfolio FE equals the hand-summed per-loan attributions in a bench case; every loan reports its PCAF DQ tier; deleting a borrower's reported emissions demotes it to a lower tier rather than silently keeping the number.

### 9.2 Evolution B — TCFD reporting copilot for the credit book (LLM tier 1 → 2)

**What.** The module's consumers are net-zero and TCFD reporting teams. Evolution B adds a copilot that turns the computed book into disclosure-grade narrative: "draft our private-credit financed-emissions paragraph with DQ-tier caveats", "which sectors drive our high-physical-risk exposure and what changed vs Q1?" — grounded in the module's endpoints and the PCAF Part A text.

**How.** Tier 1 ships against the Atlas record plus PCAF Standard extracts in the pgvector corpus; the copilot's core competence is DQ-honesty — every emissions figure it quotes must carry its tier ("Tier 4 estimate, sector-average proxy"), mirroring PCAF's own disclosure requirement. Tier 2 adds tool calls to `/financed-emissions` and the scenario endpoint for interactive drill-downs ("re-attribute assuming 20% amortization"). The no-fabrication validator applies; the copilot must not exist on the page before Evolution A lands, since today's figures are seeded.

**Prerequisites (hard).** Evolution A complete — narrating the current random `carbonFp` fields would be fabrication with citations. **Acceptance:** a generated TCFD paragraph's every tCO₂e figure traces to a tool response including its DQ tier, and the copilot refuses Scope 3 questions (the module computes Scope 1+2 only).