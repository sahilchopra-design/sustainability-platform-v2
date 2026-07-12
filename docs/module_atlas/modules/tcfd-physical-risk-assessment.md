# TCFD Physical Risk Assessment
**Module ID:** `tcfd-physical-risk-assessment` · **Route:** `/tcfd-physical-risk-assessment` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Comprehensive TCFD physical risk assessment covering both chronic hazards (sea level rise, heat stress, precipitation change, drought) and acute hazards (riverine flood, coastal flood, wildfire, storm surge, cyclone/typhoon). Produces Overall Risk Ratings (ORR), asset-level exposure mapping, and financial materiality quantification per TCFD recommendations.

> **Business value:** Used by real estate investors, infrastructure funds, corporate treasury, and insurance underwriters to systematically quantify and disclose physical climate risk exposure per TCFD recommendations.

**How an analyst works this module:**
- Upload asset portfolio with geolocation data
- Select hazard types, time horizons (2030/2050/2100), and SSP scenarios
- Review ORR heat map and individual asset risk profiles
- Generate TCFD physical risk disclosure narrative and financial impact summary

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DEFAULTS`, `HORIZONS`, `PRICE_PATHS`, `SECTORS`, `STATES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `elast` | `TRANSITION_ELASTICITY[sector] ?? -0.05;` |
| `rows` | `useMemo(() => s.assets.map(a => {` |
| `rarAfter` | `rar * (1 - s.adaptBenefitPct / 100);` |
| `portRar` | `rows.reduce((x, r) => x + r.rar, 0) / Math.max(1, rows.length);` |
| `portRarAfter` | `rows.reduce((x, r) => x + r.rarAfter, 0) / Math.max(1, rows.length);` |
| `rarDollar` | `s.ebitda * (portRar / 100);` |
| `rarDollarAfter` | `s.ebitda * (portRarAfter / 100);` |
| `transDollar` | `s.ebitda * (transPct / 100); // negative for loss, positive for gain` |
| `totalImpactPct` | `portRar - transPct; // physical RaR% minus transition% (transPct negative = loss, so subtract negative = add positive = larger loss)` |
| `combinedLossPct` | `portRar + Math.max(0, -transPct); // physical + (transition loss if negative elast)` |
| `combinedDollar` | `s.ebitda * (combinedLossPct / 100);` |
| `dscrBase` | `s.debtSvc > 0 ? s.ebitda / s.debtSvc : 0;` |
| `dscrStress` | `s.debtSvc > 0 ? Math.max(0, s.ebitda - combinedDollar) / s.debtSvc : 0;` |
| `dscrAdapt` | `s.debtSvc > 0 ? Math.max(0, s.ebitda - rarDollarAfter - s.adaptOpex + Math.min(0, transDollar) + oppUplift()) / s.debtSvc : 0;` |
| `adoptFrac` | `s.opportunityAdoption / 100;` |
| `avoidedLoss15yr` | `(rarDollar - rarDollarAfter) * 15;` |
| `roi` | `s.adaptCapex > 0 ? (avoidedLoss15yr - s.adaptOpex * 15) / s.adaptCapex : 0;` |
| `rarAvg` | `s.assets.reduce((x, a) => x + rarFor(a, ssp, y), 0) / Math.max(1, s.assets.length);` |
| `physLoss` | `portRar * rarMult * (1 - benefit / 100);` |
| `trans` | `transitionImpactPct(s.sector, carbonPrice * priceMult, s.intensity);` |
| `torn` | `useMemo(() => tornado( { rar: portRar, price: carbonPrice, elast: TRANSITION_ELASTICITY[s.sector] ?? -0.05, intensity: s.intensity, benefit: s.adaptBenefitPct }, (v) => { const phys = v.rar * (1 - v.benefit / 100);` |
| `checklistPct` | `(Object.values(s.checklist).filter(Boolean).length / IFRS_S2_CHECKLIST.length) * 100;` |
| `oppRows` | `CLIMATE_OPPORTUNITIES.map(o => {` |
| `totalNpv` | `s.ebitda * (o.npvPctEbitda / 100);` |
| `adopted` | `totalNpv * (s.opportunityAdoption / 100);` |
| `hot` | `[...rows].sort((a, b) => b.rar - a.rar).slice(0, 3);` |
| `tempRise` | `{ 'Orderly (1.5°C)': 0.5, 'Disorderly (late action)': 1.5, 'Hot house (3°C+)': 3.0, 'Current policies (2.8°C)': 2.0 }[n] ?? 1.5;` |
| `pct` | `Math.min(d.maxLoss, d.beta * tempRise);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `HORIZONS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Physical Risk ORR | `max(chronic_ORR, acute_ORR) weighted by exposure` | TCFD Technical Supplement framework | ORR 4-5 (High/Critical) triggers TCFD mandatory disclosure under UK TCFD rules and CSRD ESRS E1-4; requires quantitative financial impact estimate. |
| 100-Year Flood Loss (% asset value) | `expected_flood_damage / asset_replacement_value × 100` | JBA/Fathom flood model + AIR damage functions | Loss >5% of asset value at 100-year return period is considered material for property and infrastructure assets under TCFD guidance. |
| Climate Financial Exposure (USD) | `asset_value × hazard_intensity × vulnerability_factor × (1 − insurance_coverage)` | Physical risk × financial model | Uninsured climate financial exposure is the key metric for TCFD Strategy section; aggregated to portfolio level for sector/geography heat maps. |
- **Asset geolocation data + JBA/Fathom/RMS hazard databases + IPCC AR6 climate projections** → Hazard overlay → vulnerability assessment → financial exposure modelling → ORR scoring → **TCFD-compliant physical risk assessment with asset-level ORRs and financial materiality quantification**

## 5 · Intermediate Transformation Logic
**Methodology:** Dual-Hazard Physical Risk Assessment
**Headline formula:** `ORR = max(chronic_risk_score, acute_risk_score) × exposure_weight × financial_sensitivity`

Chronic risk scores aggregate multi-decade climate projections for temperature, precipitation, and sea level change at asset location coordinates, normalised to IPCC AR6 RCP/SSP scenario pathways. Acute risk scores use return-period loss modelling (100yr, 200yr, 1000yr events) from catastrophe model databases (JBA flood, RMS wildfire, AIR tropical cyclone). Financial materiality is estimated by multiplying hazard intensity by asset replacement value, adaptation cost discount, and insurance coverage haircut.

**Standards:** ['TCFD Technical Supplement: Physical Risks (2017)', 'IPCC AR6 WGI Physical Climate Basis', 'NGFS Physical Risk Assessment Scenarios']
**Reference documents:** TCFD Technical Supplement: Physical Risks and Opportunities (2017); IPCC AR6 WGI Summary for Policymakers; NGFS Physical Climate Risk Assessment Methodology (2024)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `AdvisoryReference`, `AdvisoryToolkit`

## 7 · Methodology Deep Dive

This is another **AdvisoryToolkit-family** tool (shared `_shared/AdvisoryReference.js` data layer, no
backend engine) and one of the stronger modules in this batch — genuine multi-hazard weighted risk
scoring, transition-risk elasticity, DSCR stress testing, adaptation ROI, Monte Carlo, and tornado
sensitivity, all wired to real reference data (Indian state hazard baselines cited to IMD/WRI
Aqueduct/IPCC AR6, IFRS S2 paragraph-numbered checklist, NGFS carbon-price paths). The one
methodology gap: the guide's formula is `ORR = max(chronic_risk, acute_risk) × exposure_weight ×
financial_sensitivity` — a **max-of-two-channels** design — but the code computes a single
**weighted sum across five hazards** (mixing chronic and acute together) with no explicit
chronic/acute split or max operator.

### 7.1 What the module computes

For a configurable renewable-energy portfolio (default: 8 assets across Indian states + one Oman
hub), the tool computes a physical-risk-at-risk (RaR) % of EBITDA per asset, blends it with a
transition-risk EBITDA impact from a carbon-price path, stress-tests debt service coverage (DSCR),
and models adaptation-investment ROI, opportunity NPV uplift, Monte Carlo loss distribution, and
IFRS S2 disclosure-readiness.

### 7.2 Core physical-risk formula (RaR)

```js
RaR(asset, ssp, year) = min(40, 0.6 × (heat×1.2 + water×1.5 + cyclone×2.0 + flood×1.8 + dust×0.8) × SSP_MULT[ssp][year])
```

Five hazard scores (0–10 scale, from `IN_HAZARD_BASELINE`, sourced to IMD/WRI Aqueduct/IPCC AR6
regional chapters) are weighted (cyclone highest at 2.0×, dust lowest at 0.8×, reflecting relative
acute-event severity), summed, scaled by 0.6, multiplied by an SSP/year-specific escalation factor,
and capped at 40% of EBITDA — a sensible ceiling preventing runaway extrapolation. This **is** the
guide's "exposure_weight" concept in spirit (per-hazard weights standing in for exposure), but it
combines chronic hazards (heat, water stress, dust) and acute hazards (cyclone, flood) into one
additive sum rather than computing separate chronic/acute channels and taking their `max` as the
guide specifies — a methodologically defensible alternative (aggregate hazard exposure), but a
different number than a max-of-two-channels ORR would produce, since summing rather than taking the
max of comparable-magnitude terms will generally yield a *higher* combined score.

### 7.3 SSP-scenario scaling

| SSP scenario | 2030 | 2040 | 2050 | 2070 |
|---|---|---|---|---|
| SSP1-2.6 | 1.00 | 1.10 | 1.15 | 1.20 |
| SSP2-4.5 | 1.10 | 1.30 | 1.55 | 1.90 |
| SSP3-7.0 | 1.15 | 1.45 | 1.85 | 2.45 |
| SSP5-8.5 | 1.20 | 1.60 | 2.20 | 3.10 |

A genuine escalation table — multipliers increase with both SSP severity and time horizon, correctly
ordered (SSP5-8.5/2070 is the most severe cell at 3.10×). Provenance for the exact multiplier values
is not cited beyond "IPCC AR6 regional chapters" in the surrounding comments — treat as an
internally-calibrated escalation curve consistent with, but not literally reproducing, a specific
IPCC table.

### 7.4 Transition-risk formula

```js
transitionImpactPct(sector, price, intensity) = elasticity[sector] × (price/100) × intensity × 100
```

`elasticity` (EBITDA sensitivity per $100/t carbon price) is sector-specific and directionally
correct: Oil & Gas upstream most negative (-0.35), Steel (-0.28) and Cement (-0.22) next (both
carbon-intensive hard-to-abate sectors), Utilities-Renewables **positive** (+0.04, renewables
*benefit* from rising carbon prices as fossil competitors get more expensive), Real Estate/Banks
least sensitive. `intensity` is a 0–2 multiplier around sector-average (1.0). `price` comes from one
of 6 real NGFS/IEA carbon-price scenario paths (`CARBON_PRICE_PATHS`, e.g. NGFS Orderly 1.5°C:
$80→$400/t 2025→2050).

### 7.5 Combined loss, DSCR stress test, and adaptation ROI

```js
combinedLossPct = portRar + max(0, −transPct)            // physical loss + transition loss (transition gains don't offset)
dscrBase   = ebitda / debtSvc
dscrStress = max(0, ebitda − combinedLoss$) / debtSvc      // post-shock DSCR
dscrAdapt  = max(0, ebitda − rarAfter$ − adaptOpex + min(0,transDollar) + oppUplift) / debtSvc

avoidedLoss15yr = (rarDollar − rarDollarAfter) × 15         // 15-year NPV-free avoided-loss horizon
roi = (avoidedLoss15yr − adaptOpex×15) / adaptCapex
```

The DSCR stress test is a genuine lender-relevant metric: `combinedLossPct` deliberately only
subtracts transition **losses** (`max(0,−transPct)`), not gains — a conservative modelling choice
that avoids transition upside masking physical-risk downside in a stress scenario. `dscrAdapt` layers
in adaptation opex cost, any transition-gain benefit, and opportunity NPV uplift to show the
post-adaptation, post-opportunity DSCR — a coherent three-scenario waterfall (base → stress →
adapted). The 15-year avoided-loss ROI is undiscounted (no `(1+r)^t` term), a simplification worth
flagging for a lender-facing deliverable.

### 7.6 Monte Carlo and tornado

```js
MC: physLoss = portRar × rarMult × (1−benefit/100);  trans = elasticity×(carbonPrice×priceMult/100)×intensity×100
    loss$ = (physLoss + max(0,−trans)) × ebitda/100
    rarMult ~ Tri(0.75,1.00,1.35);  benefit ~ Tri(benefit−15, benefit, benefit+15);  priceMult ~ Tri(0.6,1.0,1.6)
```

A genuine triangular-distribution Monte Carlo (default 800 draws) varying hazard-multiplier,
adaptation-benefit uncertainty, and carbon-price-path uncertainty simultaneously — a real 3-factor
joint simulation, not a decorative label. The tornado sensitivity (`torn`) perturbs `rar`, `price`,
`elast`, `intensity`, `benefit` each ±20% one-at-a-time against the same combined-loss function,
correctly isolating each driver's individual contribution to output variance.

### 7.7 Worked example

Asset 'Rajasthan 50 MW' (state RJ: heat=8, water=9, cyclone=1, flood=2, dust=8), `ssp='SSP2-4.5'`,
`horizon=2040` (`SSP_MULT=1.30`): weighted hazard sum `= 8×1.2+9×1.5+1×2.0+2×1.8+8×0.8 = 9.6+13.5+2.0
+3.6+6.4 = 35.1`. `RaR = min(40, 0.6×35.1×1.30) = min(40, 27.4) = 27.4%` of EBITDA. At
`sector='Utilities — Power (renewables)'` (elasticity +0.04), `pricePath='NGFS Orderly (1.5°C)'` at
2040 (`price=$280/t`), `intensity=1.0`: `transPct = 0.04×(280/100)×1.0×100 = 0.04×2.8×100 = 11.2%` —
a **positive** 11.2% EBITDA gain from the transition (renewables benefiting from rising carbon
prices). `combinedLossPct = 27.4 + max(0,−11.2) = 27.4+0 = 27.4%` (the transition gain doesn't reduce
physical loss under the conservative combining rule). At `ebitda=$1,200M`: `combinedDollar =
1200×0.274 = $328.8M`. `dscrBase = 1200/420 = 2.86×`; `dscrStress = max(0,1200−328.8)/420 =
871.2/420 = 2.07×` — still comfortably above a typical 1.2× covenant, illustrating that even a
severe physical-risk scenario doesn't breach debt service coverage for this well-capitalised
portfolio, though the ~0.8x DSCR compression itself is material information for a lender.

### 7.8 Data provenance & limitations

- Indian state hazard baselines (`IN_HAZARD_BASELINE`) are cited to IMD, WRI Aqueduct, and IPCC AR6
  regional chapters — genuinely sourced reference data, not `sr()`-seeded.
- SSP escalation multipliers and the RaR weight vector (cyclone 2.0×, dust 0.8×, etc.) are internally
  calibrated, not directly reproducing a single external table — reasonable but not independently
  verifiable against one citation.
- Adaptation ROI is undiscounted over a flat 15-year horizon — a production credit-risk tool should
  discount avoided losses at the portfolio's WACC or lender's hurdle rate.
- The combined-loss formula's chronic/acute conflation (§7.2) means this module's "ORR" is not
  literally the guide's max-of-two-channels design — document this distinction if reconciling against
  a max-based benchmark model.

**Framework alignment:** TCFD Technical Supplement (Physical Risks, 2017) — asset-level exposure ×
financial-sensitivity framing is followed, though via weighted-sum rather than max(chronic,acute).
IFRS S2 — the 11-item checklist uses **real IFRS S2 paragraph numbers** (¶6a/6b Governance, ¶10/13/14/
22 Strategy, ¶25 Risk Management, ¶29a-d/33 Metrics & Targets), giving `checklistPct` genuine
regulatory-mapping value. NGFS — 6 real NGFS/IEA carbon-price scenario paths and the SSP framework are
correctly represented as scenario inputs.

## 9 · Future Evolution

### 9.1 Evolution A — Digital-twin hazard lookups and a discounted, chronic/acute-split ORR (analytics ladder: rung 2 → 3)

**What.** This AdvisoryToolkit module is already genuinely scenario-capable — SSP×horizon escalation table, 6 NGFS carbon-price paths, triangular-distribution Monte Carlo, tornado sensitivity, DSCR waterfall (§7.2–7.6). Its rung-3 gaps per §7.8: hazard scores come from a static `IN_HAZARD_BASELINE` table (Indian states + Oman only), the RaR weight vector and SSP multipliers are internally calibrated rather than externally verifiable, adaptation ROI is undiscounted, and the code's weighted-sum-of-five-hazards diverges from the guide's `max(chronic, acute)` ORR design.

**How.** (1) Swap the state-level baseline for per-coordinate lookups against the platform's populated hazard grids (`ref_*_zones`: earthquake/cyclone/wildfire/flood/sea-level, real USGS/IBTrACS/GWIS/OpenFEMA sources) with country-baseline fallback and a reported `resolution_tier` — the same cascade pattern as `physical-risk-pricing`, and it removes the India-only geography constraint. (2) Compute both aggregation conventions: the existing weighted sum and a chronic channel (heat/water/dust) vs acute channel (cyclone/flood) max — report both, since §7.2 notes the sum generally reads higher; let the user pick the disclosure convention. (3) Discount `avoidedLoss15yr` at a user WACC (§7.8 flags the flat 15× as unsuitable for lender-facing output). (4) Benchmark: reproduce the §7.7 Rajasthan worked example (RaR 27.4%, DSCR 2.86→2.07×) as a bench pin.

**Prerequisites.** Flood/sea-level grids are the digital twin's thinnest layers (48/152 rows) — coordinate resolution will fall back to baseline for many assets; the `resolution_tier` field keeps that honest. **Acceptance:** two same-state assets with different coordinates can differ in RaR; chronic/acute split renders alongside the sum; discounted ROI matches an independent spreadsheet check.

### 9.2 Evolution B — TCFD/IFRS S2 disclosure copilot with computed checklist evidence (LLM tier 1 → 2)

**What.** The module already holds an 11-item IFRS S2 checklist with real paragraph numbers (¶6a/6b, ¶10/13/14/22, ¶25, ¶29a-d/33 — §7 framework alignment) and computes `checklistPct`. The copilot turns assessment output into disclosure drafting: "write the ISSB S2 Strategy section for this portfolio" produces text citing the computed RaR per asset, the SSP scenario used, DSCR compression (2.86→2.07× in the worked example), and adaptation ROI — mapped paragraph-by-paragraph to the checklist items.

**How.** Tier 1 ships on page state: the AdvisoryToolkit family has no backend, so grounding is the live computed values plus this Atlas page (§7.2–7.7 formula walkthroughs are unusually complete grounding material). Each drafted paragraph carries its IFRS S2 paragraph tag and the source metric; the copilot explains modelling choices the deep-dive documents (why transition gains don't offset physical losses in `combinedLossPct`; why the ROI is undiscounted, pre-Evolution-A). Tier 2 arrives with Evolution A's backend route: what-ifs ("re-draft under SSP5-8.5 2070") become tool calls that re-run the assessment before drafting.

**Prerequisites.** None hard for tier 1; the checklist's paragraph references should be verified against the current IFRS S2 text vintage before drafts cite them externally. **Acceptance:** every numeric in a draft reproduces from the page's formulas for the stated inputs; each narrative claim maps to a checklist item; the copilot refuses to draft sections for hazards the model doesn't cover (e.g. riverine-vs-coastal flood split, which the 5-hazard vector doesn't distinguish).