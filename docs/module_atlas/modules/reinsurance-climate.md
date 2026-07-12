# Reinsurance Climate Analyser
**Module ID:** `reinsurance-climate` · **Route:** `/reinsurance-climate` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Reinsurance treaty analysis incorporating climate-adjusted cat losses. Covers quota share, excess of loss, aggregate stop loss, and retrocession with climate premium adequacy assessment.

> **Business value:** Climate change is the dominant repricing pressure in global reinsurance markets. Treaties priced on historical loss experience are systematically underpriced for future hazard. This module enables actuarial assessment of climate adequacy for treaty pricing, purchasing, and capital optimisation.

**How an analyst works this module:**
- Treaty Structure shows attachment, limit, and share
- Cat Loss Model applies climate-adjusted hazard
- Loss Ratio Analysis compares modelled vs priced loss ratios
- Climate Adequacy flags treaties underpriced for future hazard
- Retrocession covers purchase of protection on reinsurance book

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CAT_BONDS`, `CLIMATE_UPLIFT_BY_PERIL`, `LOSS_HISTORY`, `PERILS`, `PERIL_COLORS`, `PIE_COLORS`, `REGIONS`, `REGION_UPLIFT`, `REINSURERS`, `RETRO_LAYERS`, `TABS`, `TREATIES`, `TREATY_TYPES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `RETRO_LAYERS` | 6 | `layer`, `attachment`, `limit`, `premium`, `expectedLoss`, `rateOnLine` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Treaty Portfolio','Climate-Adjusted Pricing','ILS & Cat Bond Market','Retrocession & Systemic Risk'];` |
| `reinsurer` | `REINSURERS[Math.floor(s1*REINSURERS.length)];` |
| `type` | `TREATY_TYPES[Math.floor(s2*TREATY_TYPES.length)];` |
| `peril` | `PERILS[Math.floor(s3*PERILS.length)];` |
| `region` | `REGIONS[Math.floor(s4*REGIONS.length)];` |
| `limit` | `Math.round(50+s5*450);` |
| `retention` | `Math.round(5+s6*limit*0.3);` |
| `premium` | `+(limit*0.02+s7*limit*0.07).toFixed(1);` |
| `technicalPrice` | `+(premium*(0.85+s8*0.3)).toFixed(1);` |
| `climateAdjPrice` | `+(technicalPrice*(1.05+s9*0.35)).toFixed(1);` |
| `historicalLR` | `+(0.3+s1*0.5).toFixed(2);` |
| `climateAdjLR` | `+(historicalLR*(1.1+s2*0.3)).toFixed(2);` |
| `rateOnLine` | `+(premium/limit*100).toFixed(2);` |
| `climateUplift` | `+(1.05+s3*0.40).toFixed(2);` |
| `yearsOnBook` | `Math.round(1+s4*15);` |
| `rating` | `['A++','A+','A','A-','B++','B+'][Math.floor(s5*6)];` |
| `collateral` | `Math.round(limit*0.3+s6*limit*0.5);` |
| `reinstatements` | `Math.floor(s7*3);` |
| `inception` | ``${2022+Math.floor(s8*3)}-${String(1+Math.floor(s9*12)).padStart(2,'0')}-01`;` |
| `totalLoss` | `regionEvs.reduce((s, e) => s + (e.total_losses_usd_bn   \|\| 0), 0);` |
| `insuredLoss` | `regionEvs.reduce((s, e) => s + (e.insured_losses_usd_bn \|\| 0), 0);` |
| `avgInsuredRatio` | `totalLoss > 0 ? insuredLoss / totalLoss : null;` |
| `triggerType` | `['Indemnity','Industry Loss','Parametric','Modelled Loss'][Math.floor(s3*4)];` |
| `size` | `Math.round(50+s4*450);` |
| `coupon` | `+(2+s5*8).toFixed(2);` |
| `expectedLoss` | `+(0.5+s6*5).toFixed(2);` |
| `spread` | `+(coupon+1+s7*3).toFixed(2);` |
| `climateRiskPremium` | `+(0.5+s1*3).toFixed(2);` |
| `maturity` | ``${2025+Math.floor(s2*4)}-${String(1+Math.floor(s3*12)).padStart(2,'0')}`;` |
| `attachmentProb` | `+(1+s5*8).toFixed(1);` |
| `exhaustionProb` | `+(0.2+s6*3).toFixed(1);` |
| `CLIMATE_UPLIFT_BY_PERIL` | `PERILS.map((p,i)=>({` |
| `REGION_UPLIFT` | `REGIONS.map((r,i)=>({` |
| `totalLimit` | `active.reduce((a,b)=>a+b.limit,0);` |
| `totalPremium` | `active.reduce((a,b)=>a+b.premium,0);` |
| `avgLR` | `+(active.reduce((a,b)=>a+b.historicalLR,0)/Math.max(1,active.length)).toFixed(2);` |
| `avgClimateAdj` | `+(active.reduce((a,b)=>a+b.climateUplift,0)/Math.max(1,active.length)).toFixed(2);` |
| `totalCatBonds` | `CAT_BONDS.filter(b=>b.status==='Outstanding').reduce((a,b)=>a+b.size,0);` |
| `treatyPages` | `Math.ceil(filteredTreaties.length/PAGE_SIZE);` |
| `pagedTreaties` | `filteredTreaties.slice(treatyPage*PAGE_SIZE,(treatyPage+1)*PAGE_SIZE);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PERILS`, `PERIL_COLORS`, `PIE_COLORS`, `REGIONS`, `REINSURERS`, `RETRO_LAYERS`, `TABS`, `TREATY_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate Loading | — | Model | Premium loading for future climate hazard increase |
| Attachment Probability | — | Contract | Frequency at which treaty attaches |
| Exhaustion Probability | — | Contract | Frequency at which limit is consumed |
- **Primary loss model** → Climate hazard adjustment → **Climate-adjusted cat loss**
- **Treaty structure** → Loss cession calculation → **Treaty loss distribution**
- **Treaty loss** → Pricing adequacy check → **Climate-adjusted combined ratio**

## 5 · Intermediate Transformation Logic
**Methodology:** Treaty performance under climate scenarios
**Headline formula:** `TreatyLoss = max(0, PortfolioLoss - Retention) × TreatyShare; LossRatio = TreatyLoss / Premium`

Climate adjustment: 1.5°C warming increases Atlantic hurricane losses by 10-15%, flood losses by 15-25% in many regions. Treaty pricing must incorporate forward-looking climate hazard change, not just historical experience.

**Standards:** ["Lloyd's of London", 'IAIS ICP 25', 'Swiss Re ClimateWise']
**Reference documents:** Swiss Re Institute Sigma Reports; IAIS ICP 25 Supervisory Standards on Insurance; Lloyd's Realistic Disaster Scenarios; ClimateWise Principles

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine is a **loss-cession waterfall**:
> `TreatyLoss = max(0, PortfolioLoss − Retention) × TreatyShare; LossRatio = TreatyLoss/Premium` —
> i.e. treaty loss should be *derived* from a simulated portfolio loss run through the treaty's
> attachment structure. **The code never computes a `PortfolioLoss` or applies a retention
> subtraction anywhere.** `historicalLR` and `climateAdjLR` are each independent seeded-random
> draws per treaty, not outputs of the retention/share waterfall the guide describes. The sections
> below document the independent-random-field pricing model the code actually implements.

### 7.1 What the module computes

For 60 synthetic reinsurance treaties across 8 reinsurers, 4 treaty types, and multiple perils/
regions:

```js
premium         = limit×0.02 + s7×limit×0.07                    // technical base premium
technicalPrice  = premium × (0.85 + s8×0.3)                     // actuarial repricing, ±15%/+15%
climateAdjPrice = technicalPrice × (1.05 + s9×0.35)              // climate loading, +5% to +40%
historicalLR    = 0.3 + s1×0.5                                   // 30–80%, independent draw
climateAdjLR    = historicalLR × (1.1 + s2×0.3)                  // scaled 10–40% above historical
rateOnLine      = premium / limit × 100
climateUplift   = 1.05 + s3×0.40                                 // 5–45% climate premium loading factor
```

`climateAdjPrice` and `climateAdjLR` are each independently derived from their own base value by a
*separate* random multiplier — they are not two views of the same underlying stochastic loss
process, so a treaty's priced climate loading and its modelled climate-adjusted loss ratio can
move in unrelated directions across renders of the same seed structure.

### 7.2 Parameterisation

| Constant | Range | Provenance |
|---|---|---|
| `premium` base rate | 2%–9% of limit | Synthetic — plausible rate-on-line order of magnitude for property cat XL |
| `technicalPrice` adjustment | 0.85×–1.15× premium | Synthetic actuarial repricing band |
| `climateAdjPrice` loading | 1.05×–1.40× technical price | Consistent with the guide's own cited "Climate Loading 5–25%" range at the low end, extending somewhat above it at the high end |
| `historicalLR` | 30%–80% | Synthetic — plausible cat-treaty loss-ratio range |
| `climateAdjLR` scaling | 1.10×–1.40× historical | Synthetic — directionally correct (climate-adjusted LR should exceed historical) |
| `collateral` | 30%–80% of limit | Synthetic — plausible ILS/collateralised-reinsurance collateral range |
| Rating scale | A++ through B+ | Real AM Best financial-strength rating scale, correctly ordered |

### 7.3 Calculation walkthrough

1. **Treaty Portfolio tab**: 60 synthetic treaties (reinsurer/type/peril/region/limit/retention/
   premium/technicalPrice/climateAdjPrice/historicalLR/climateAdjLR/rateOnLine/climateUplift/
   yearsOnBook/rating/collateral/reinstatements/inception), paginated table.
2. **Climate-Adjusted Pricing tab**: `CLIMATE_UPLIFT_BY_PERIL` and `REGION_UPLIFT` — per-peril and
   per-region average uplift factors, aggregated from the treaty-level `climateUplift` field.
3. **Portfolio aggregates** (on `active` — the currently filtered/selected treaty subset):
   `totalLimit = Σlimit`, `totalPremium = Σpremium`, `avgLR = Σ historicalLR / max(1,
   active.length)`, `avgClimateAdj = Σ climateUplift / max(1, active.length)` — the `Math.max(1,
   ·)` guard on both averages correctly prevents division by zero when a filter empties the
   selection (this matches the platform-wide REM-40/41 division-guard remediation pattern).
4. **ILS & Cat Bond Market tab**: separate synthetic cat-bond dataset (`triggerType`, `size`,
   `coupon`, `expectedLoss`, `spread = coupon+1+noise`, `climateRiskPremium`, `maturity`,
   `attachmentProb`, `exhaustionProb`) — `totalCatBonds = Σsize` for `status==='Outstanding'` bonds.
5. **Retrocession & Systemic Risk tab**: `RETRO_LAYERS`, 6 static layers (attachment/limit/
   premium/expectedLoss/rateOnLine) representing a retrocession programme tower — hand-specified,
   not derived from the treaty portfolio's aggregate exposure.
6. **Catastrophe event context** (`totalLoss`/`insuredLoss`/`avgInsuredRatio`): summed from what
   appears to be a real or curated regional catastrophe-loss event dataset (`regionEvs`, fields
   `total_losses_usd_bn`/`insured_losses_usd_bn`), with a correctly-guarded ratio
   (`totalLoss>0 ? insuredLoss/totalLoss : null`).

### 7.4 Worked example

Treaty with `limit=$300M`, seeds giving `s7=0.5`, `s8=0.5`, `s9=0.5`:

| Step | Formula | Result |
|---|---|---|
| `premium` | `300×0.02 + 0.5×300×0.07` | `6+10.5=` **$16.5M** |
| `technicalPrice` | `16.5×(0.85+0.5×0.3)` | `16.5×1.0=` **$16.5M** |
| `climateAdjPrice` | `16.5×(1.05+0.5×0.35)` | `16.5×1.225=` **$20.2M** |
| `rateOnLine` | `16.5/300×100` | **5.5%** |
| Climate loading implied | `(20.2−16.5)/16.5` | **+22.4%** |

This +22.4% loading is within, but near the top of, the guide's own cited "5–25%" climate-loading
range.

### 7.5 Rating & structure rubric

| Field | Values |
|---|---|
| Treaty type | Quota Share, Excess of Loss, Aggregate Stop Loss, and one more (4 total) |
| AM Best-style rating | A++, A+, A, A-, B++, B+ |
| ILS trigger type | Indemnity, Industry Loss, Parametric, Modelled Loss |

### 7.6 Companion analytics

Treaty Portfolio (60-row paginated table), Climate-Adjusted Pricing (peril/region uplift bars),
ILS & Cat Bond Market (bond table + outstanding total), Retrocession & Systemic Risk (6-layer
tower + catastrophe event loss/insured-ratio context).

### 7.7 Data provenance & limitations

- **All 60 treaties and the cat-bond dataset are synthetic**, `sr(seed)=frac(sin(seed+1)×10⁴)`;
  reinsurer names, treaty types, and perils are real taxonomy categories, individual treaty terms
  are fabricated.
- **No `PortfolioLoss`/retention waterfall exists** — the guide's `TreatyLoss = max(0,
  PortfolioLoss−Retention)×Share` formula is not implemented; `historicalLR`/`climateAdjLR` are
  independent random fields rather than outputs of a simulated loss-cession calculation, so the
  "attachment probability" and "exhaustion probability" fields cannot be interpreted as genuinely
  derived from the treaty's actual attachment/limit structure.
- `climateAdjPrice` and `climateAdjLR` (price loading vs loss-ratio impact) are independently
  seeded, so a treaty could show high climate price loading with a low climate-adjusted loss
  ratio or vice versa — an internal inconsistency a pricing actuary would need reconciled.
- Division guards (`Math.max(1, active.length)`) are correctly in place for the portfolio-average
  calculations, consistent with the platform-wide division-by-zero remediation.

**Framework alignment:** IAIS ICP 25 (climate risk supervision) / Swiss Re ClimateWise / Lloyd's
Realistic Disaster Scenarios — cited by the guide as standards context; the module's climate-
loading concept (5–40% premium uplift) is directionally consistent with published industry
commentary on climate repricing, but no RDS (Realistic Disaster Scenario) event set or ICP 25
supervisory capital methodology is actually implemented · ILS/Cat Bond structure (trigger types,
coupon, expected loss, spread) — correctly modelled taxonomy, values are illustrative.

## 9 · Future Evolution

### 9.1 Evolution A — A real loss-cession waterfall over simulated event losses (analytics ladder: rung 1 → 3)

**What.** §7 documents the missing core: the guide's `TreatyLoss = max(0, PortfolioLoss − Retention) × Share` waterfall is unimplemented — `historicalLR` and `climateAdjLR` are independent random draws, so attachment/exhaustion probabilities aren't derived from any treaty structure, and `climateAdjPrice` vs `climateAdjLR` are separately seeded (a treaty can show high climate loading with low climate-adjusted losses — an inconsistency §7.7 says a pricing actuary would need reconciled). Evolution A builds the actual actuarial chain: simulated annual portfolio losses run through each treaty's attachment/limit/share, with climate adjustment applied to event frequency/severity, not sprinkled on price.

**How.** (1) `api/v1/routes/reinsurance_climate.py`: `POST /treaty-analysis` — simulate annual aggregate losses (frequency Poisson × severity lognormal per peril/region, parameters seeded from the platform's ingested IBTrACS/OpenFEMA event data where available, documented defaults elsewhere), apply the cession waterfall per treaty type (QS pro-rata; XoL layer attachment; stop-loss on aggregate), and report loss ratio, attachment probability, and exhaustion probability as empirical simulation outputs — internally consistent by construction. (2) Climate adjustment as frequency/severity multipliers per scenario, so `climateAdjLR` and adequate price derive from the same simulation and can't diverge incoherently. (3) The 60-treaty book becomes an editable register; bench pin: a hand-computed XoL layer example.

**Prerequisites.** Frequency/severity parameterisation documented per peril (hazard-data reuse from the digital twin where possible); standard-PRNG convention for the simulation. **Acceptance:** an XoL treaty's attachment probability equals the empirical fraction of simulated years breaching retention; setting climate multipliers to 1.0 collapses climate-adjusted to historical outputs exactly.

### 9.2 Evolution B — Treaty-renewal pricing copilot (LLM tier 2)

**What.** Renewal season is comparative and argumentative: "is this treaty's quoted rate adequate against our climate-adjusted technical price?", "show the cedent-facing rationale for a 12% rate increase on the Florida wind layer — frequency trend, attachment erosion, capital cost", "compare our three retro options by exhaustion probability per premium dollar". The copilot runs these as `POST /treaty-analysis` tool calls and narrates the decomposition.

**How.** Tier-2 tool schemas over the simulation endpoint and treaty register; rate-adequacy answers decompose into the simulation's own terms (expected ceded loss, volatility load, climate multiplier applied) so every basis point in the rationale is traceable. The cedent-rationale draft is the LLM-shaped deliverable — turning simulation output into negotiation language — with the no-fabrication validator across all figures. Guardrails: parameter provenance (observed-data vs default) disclosed per peril; the copilot refuses to opine on market rates it has no data for, and simulation limitations (annual aggregate granularity, no clash modelling) appear in any pricing rationale per the §8 model-card convention.

**Prerequisites (hard).** Evolution A — a pricing copilot over independently seeded loss ratios would produce actuarially incoherent advice; golden Q&A from the bench XoL example. **Acceptance:** rationale figures reproduce from the tool response; parameter provenance is stated per peril; out-of-scope risks (clash, casualty) are declined.