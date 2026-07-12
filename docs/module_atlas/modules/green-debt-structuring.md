# Green Debt Structuring Analytics
**Module ID:** `green-debt-structuring` · **Route:** `/green-debt-structuring` · **Tier:** B (frontend-computed) · **EP code:** EP-DD2 · **Sprint:** DD

## 1 · Overview
Green debt structuring analytics for green bonds, green loans, and sustainability-linked loans. Models coupon step-up/down mechanics, second-party opinion costs, post-issuance reporting burden, and greenium analysis. Covers ICMA GBP and GLP frameworks.

> **Business value:** Provides rigorous green debt structuring analytics quantifying greenium benefit against SPO and reporting costs, enabling corporate treasurers to optimise green financing instrument selection.

**How an analyst works this module:**
- Model green bond structure: use-of-proceeds allocation, ICMA GBP four-component compliance, SPO provider selection
- Calculate greenium benefit using comparable conventional bond yield and current demand technicals
- Assess net financial benefit: greenium savings minus SPO, verification, and annual reporting costs
- Structure SLL margin ratchet: KPI selection, SPT calibration, verification agent, step-up/step-down symmetry

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CURRENCIES`, `FRAMEWORKS`, `INSTRUMENTS`, `REGIONS`, `SDG_TAGS`, `SECTORS`, `SECTOR_COLORS`, `TABS`, `TYPES`, `TYPE_COLORS`, `VERIFIERS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TYPES` | `['Green Bond', 'Sustainability-Linked Bond', 'Transition Bond', 'Blue Bond', 'SDG Bond', 'Social Bond', 'Sustainability Bond'];` |
| `notional` | `0.2 + sr(i * 7) * 4.8;` |
| `greenium` | `-(2 + sr(i * 11) * 20);` |
| `kpiTarget` | `20 + sr(i * 13) * 60;` |
| `kpiActual` | `kpiTarget * (0.6 + sr(i * 17) * 0.7);` |
| `coupon` | `1.5 + sr(i * 19) * 4;` |
| `oversubRatio` | `1.2 + sr(i * 23) * 4.8;` |
| `sdgCount` | `2 + Math.floor(sr(i * 29) * 4);` |
| `TYPE_COLORS` | `{ 'Green Bond': '#059669', 'Sustainability-Linked Bond': '#2563eb', 'Transition Bond': '#d97706', 'Blue Bond': '#0891b2', 'SDG Bond': '#7c3aed', 'Social Bond': '#db2777', 'Sustainability Bond': '#65a30d' };` |
| `filtered` | `useMemo(() => INSTRUMENTS.filter(d => (filterType === 'All' \|\| d.type === filterType) && (filterSector === 'All' \|\| d.sector === filterSector)), [filterType, filterSector]);  const totalNotional = filtered.reduce((s, d) => s + d.notional, 0);` |
| `avgGreenium` | `filtered.length ? filtered.reduce((s, d) => s + d.greenium, 0) / filtered.length : 0;` |
| `avgOverSub` | `filtered.length ? filtered.reduce((s, d) => s + d.oversubRatio, 0) / filtered.length : 0;` |
| `totalImpact` | `filtered.reduce((s, d) => s + d.climateImpact, 0);` |
| `kpiOnTrack` | `filtered.filter(d => d.kpiActual >= d.kpiTarget * (kpiMiss / 100)).length;` |
| `typeBreakdown` | `useMemo(() => TYPES.map(t => {` |
| `sectorBreakdown` | `useMemo(() => SECTORS.map(s => {` |
| `kpiStepCalc` | `useMemo(() => filtered.slice(0, 12).map(d => {` |
| `miss` | `Math.max(0, d.kpiTarget - d.kpiActual) / Math.max(0.1, d.kpiTarget) * 100;` |
| `stepUp` | `miss > 0 ? +(miss * carbonStepUp / 100).toFixed(2) : 0;` |
| `stepDown` | `d.kpiActual > d.kpiTarget ? +(((d.kpiActual - d.kpiTarget) / Math.max(0.1, d.kpiTarget)) * 100 * 0.3).toFixed(2) : 0;` |
| `greeniumBySector` | `useMemo(() => SECTORS.map(s => {` |
| `demandCurve` | `useMemo(() => Array.from({ length: 10 }, (_, i) => ({ yield: +(1.5 + i * 0.4).toFixed(1), demand: +(8 - i * 0.7 + sr(i * 11) * 0.5).toFixed(1), supply: +(3 + i * 0.3).toFixed(1), })), []);` |
| `reportingMetrics` | `useMemo(() => [ { metric: 'Renewable Energy Capacity', value: +(filtered.filter(d => d.sector === 'Energy').reduce((s, d) => s + d.notional * 0.8, 0)).toFixed(1), unit: 'GW financed', change: '+12%' }, { metric: 'GHG Emissions Avoided', value: +(totalImpact * 0.4).toFixed(0), unit: 'ktCO₂e/yr', change: '+18%' }, { metric: 'Clean Transport` |
| `pct` | `(count / INSTRUMENTS.length * 100).toFixed(0);` |
| `spoScore` | `60 + sr(d.id * 11) * 35;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CURRENCIES`, `FRAMEWORKS`, `REGIONS`, `SDG_TAGS`, `SECTORS`, `TABS`, `TYPES`, `VERIFIERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Greenium vs Conventional | `Yield differential for green vs conventional bond by matched issuer/maturity/rating` | Bloomberg BVAL / ICMA market survey | Average greenium -5 to -8 bps in EUR investment grade; USD market smaller (-2 to -4 bps); high-yield minimal |
| Net Green Bond Benefit | `Coupon saving from greenium - SPO cost - annual reporting cost × 5` | ICMA and CBI issuance cost survey | SPO cost $50-150k; annual reporting $30-80k; greenium saving typically covers costs for bonds >€200M |
| SLL Margin Ratchet | `Coupon adjustment range for meeting/missing sustainability performance targets` | LMA Green Loan Principles survey | Market convention ±5-10 bps; symmetric ratchet required by ICMA to avoid tokenism; tied to externally verified KPIs |
- **Bloomberg BVAL green bond pricing data** → Real-time and historical green vs conventional yield spreads → greenium calculation → **Net financial benefit analysis**
- **ICMA/CBI SPO and reporting cost surveys** → SPO provider fees and annual reporting cost benchmarks → total cost of green issuance → **Break-even analysis by deal size**
- **LMA SLL market survey data** → Margin ratchet size, KPI types, verification agent market practice → SLL structure benchmarking → **SLL term sheet optimisation**

## 5 · Intermediate Transformation Logic
**Methodology:** Green Debt Pricing & Structure Analytics
**Headline formula:** `Greenium = Yield(conventional) - Yield(green) in bps; Net Benefit = Greenium Savings - SPO Cost - Reporting Cost over bond life`

Pricing model comparing greenium benefit against incremental green debt costs (SPO, ongoing reporting) to determine net financial attractiveness

**Standards:** ['ICMA Green Bond Principles 2021', 'LMA/APLMA/LSTA Green Loan Principles 2023', 'Climate Bonds Initiative Certification Standard v4.0']
**Reference documents:** ICMA (2021) Green Bond Principles — Voluntary Process Guidelines; LMA/APLMA/LSTA (2023) Green Loan Principles; Climate Bonds Initiative (2023) CBI Certification Standard v4.0; ICMA (2023) Green, Social, Sustainability Bond Market Survey

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The MODULE_GUIDES entry (EP-DD2) describes green-debt structuring: greenium, net-benefit vs SPO/reporting
cost, and SLL margin-ratchet mechanics. The code implements the **coupon step-up/step-down ratchet**
faithfully from seeded KPI target/actual pairs, and displays greenium/oversubscription/impact analytics —
but the greenium and all instrument fields are **seeded**, and the guide's "net benefit = greenium savings
− SPO cost − reporting cost" is not computed as a P&L in code. Sections below document the ratchet (the
real calculation) and flag the seeded pricing; §8 specifies the net-benefit pricing model.

### 7.1 What the module computes

Instruments seed notional, greenium, coupon, oversubscription, and a KPI target/actual pair. The live
ratchet logic:
```js
miss     = max(0, kpiTarget − kpiActual) / max(0.1, kpiTarget) · 100     // % shortfall
stepUp   = miss > 0 ? +(miss · carbonStepUp/100).toFixed(2) : 0           // coupon step-up (bps-scaled)
stepDown = kpiActual > kpiTarget                                          // outperformance reward
           ? +(((kpiActual − kpiTarget)/max(0.1,kpiTarget))·100·0.3).toFixed(2) : 0
kpiOnTrack = count(kpiActual ≥ kpiTarget · kpiMiss/100)                   // # meeting threshold
```
Portfolio KPIs: `totalNotional`, AUM… `avgGreenium = mean(greenium)`, `avgOverSub`, `totalImpact`.
`spoScore = 60 + sr(id·11)·35` proxies second-party-opinion quality.

### 7.2 Parameterisation / provenance

| Field | Generator | Provenance |
|---|---|---|
| `type` | 7 labels (Green/SLB/Transition/Blue/SDG/Social/Sustainability) | ICMA label set |
| `notional` | `0.2 + sr·4.8` ($B) | synthetic |
| `greenium` | `−(2 + sr·20)` bps | synthetic (−2 to −22 bps; consistent with ICMA ranges) |
| `kpiTarget` | `20 + sr·60` | synthetic SPT |
| `kpiActual` | `kpiTarget·(0.6 + sr·0.7)` | synthetic realised (60–130% of target) |
| `coupon` | `1.5 + sr·4` % | synthetic |
| `oversubRatio` | `1.2 + sr·4.8` | synthetic order-book cover |
| `carbonStepUp` slider | user | ratchet sensitivity |
| step-down factor | 0.3 | code constant — outperformance reward is 30% of the miss-scaling |

The ratchet **is** the model here: symmetric-ish (asymmetric 0.3× on the downside) coupon adjustment tied
to KPI achievement — the mechanic ICMA's SLB Principles require.

### 7.3 Calculation walkthrough

Seed instruments → filter (type/sector) → aggregate greenium/oversubscription/impact. The ratchet view
(`kpiStepCalc`, first 12 instruments): compute `miss` = shortfall vs target; if missing, apply a step-up
proportional to `carbonStepUp`; if outperforming, a smaller step-down (0.3×). `kpiOnTrack` counts
instruments meeting a `kpiMiss`-scaled threshold. `demandCurve` and `reportingMetrics` are illustrative.

### 7.4 Worked example

SLB with `kpiTarget = 50`, `kpiActual = 42`, slider `carbonStepUp = 25`:
`miss = max(0, 50−42)/max(0.1,50)·100 = 8/50·100 = 16%`;
`stepUp = 16·25/100 = 4.00` → a **+4.00 bps** coupon step-up for missing the SPT.
If instead `kpiActual = 58`: `stepUp = 0`; `stepDown = ((58−50)/50)·100·0.3 = 16·0.3 = 4.80` → a
**−4.80 bps** reward. So the structure penalises a 16% miss with +4 bps and rewards a 16% beat with −4.8 bps
— the asymmetry from the 0.3× factor makes outperformance rewards larger per unit here, which is a design
choice (real SLBs typically feature step-ups only, or symmetric ±bps).

### 7.5 Data provenance & limitations

- All instruments are **synthetic**, seeded by `sr(seed)=frac(sin(seed+1)·10⁴)`; greenium is a random
  draw, not a spread differential.
- The guide's net-benefit P&L (greenium saving − SPO − reporting cost) is **not computed**; SPO cost and
  reporting cost do not appear as cash items.
- The ratchet scales KPI shortfall by a slider, not by a documented bps ladder tied to verified KPIs.

**Framework alignment:** ICMA Green Bond Principles 2021 (four components; label set) and Sustainability-
Linked Bond Principles (the KPI/SPT/step-up mechanic implemented here — real SLBs define a *coupon step-up*
that triggers if verified KPIs miss the SPT at the observation date); LMA/APLMA/LSTA Green Loan Principles;
CBI Certification Standard v4.0. The greenium concept traces to Bloomberg BVAL / ICMA market surveys. §8
adds the net-benefit pricing the guide claims.

## 8 · Model Specification — Green-Debt Net-Benefit & Greenium Pricing Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Decide whether a green/SLB structure is financially net-beneficial to the issuer: does the greenium (and
demand premium) outweigh the incremental cost of an SPO, verification, and post-issuance reporting over the
bond's life? Coverage: primary issuance structuring for corporate treasurers.

### 8.2 Conceptual approach
A break-even present-value model benchmarked against **ICMA/CBI issuance-cost surveys** and Bloomberg-BVAL
greenium estimates: value the coupon saving from the greenium against the fixed and recurring costs of the
green label, plus the SLB coupon-step contingent cash flow, discounted over the term.

### 8.3 Mathematical specification
```
GreeniumSaving (PV) = Σ_t (Greenium_bps/1e4 · Notional) / (1+r)^t                (coupon saving)
GreenCost (PV)      = SPO_cost + Σ_t ReportingCost_t/(1+r)^t + VerifCost_t/(1+r)^t
NetBenefit          = GreeniumSaving − GreenCost
SLB expected step (PV) = Σ_obs P(miss_obs)·StepUp_bps/1e4·Notional/(1+r)^{t_obs}
                       − Σ_obs P(beat_obs)·StepDown_bps/1e4·Notional/(1+r)^{t_obs}
Greenium (market)   = Yield_conventional_matched − Yield_green   (from green-bond-portfolio-analytics §8)
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `Greenium_bps` | new-issue concession | Bloomberg BVAL / ICMA surveys |
| `SPO_cost` | second-party opinion fee | ICMA/CBI cost survey ($50–150k) |
| `ReportingCost_t` | annual reporting burden | CBI survey ($30–80k) |
| `StepUp/Down_bps` | ratchet size | term sheet / LMA SLL survey (±5–10 bps) |
| `P(miss/beat)` | KPI achievement probability | issuer KPI trajectory model |
| `r` | issuer funding rate | curve |

### 8.4 Data requirements
Deal: notional, tenor, coupon, greenium estimate, SPO/reporting cost quotes, KPI/SPT schedule and
achievement odds. Sources: ICMA/CBI cost surveys, BVAL greenium, issuer sustainability plan. The module
seeds greenium, KPI target/actual and step sizes — replace with deal data and a real greenium engine.

### 8.5 Validation & benchmarking plan
Reconcile net-benefit break-even size against ICMA's "covers costs for bonds > €200M" rule of thumb;
validate greenium against BVAL; back-test KPI-achievement probabilities against realised SLB step events;
sensitivity to greenium and reporting cost.

### 8.6 Limitations & model risk
Greenium is small, noisy and regime-dependent; net benefit can flip sign with a few bps. SLB step
probabilities are hard to estimate and subject to KPI gaming. Conservative fallback: present net benefit as
a range across greenium scenarios and exclude the contingent SLB step from the base case (report it as a
sensitivity).

## 9 · Future Evolution

### 9.1 Evolution A — Real net-benefit model with curve-derived greenium (analytics ladder: rung 1 → 2)

**What.** §7 documents that the guide's structuring economics — `Greenium = Yield(conventional) − Yield(green)` in bps and `Net Benefit = Greenium Savings − SPO Cost − Reporting Cost over bond life` — sit over `sr()`-seeded instruments where greenium is a random draw rather than a spread differential. The live SLL ratchet logic (coupon step-up/down on KPI target/actual) is genuine, but the greenium and net-benefit inputs are synthetic. Evolution A grounds the economics: derive greenium from a matched conventional-vs-green curve (reusing the FRED comp curves the sibling `green-bond-pricing-desk` already pulls), and compute net benefit as greenium savings over the bond's life minus real SPO and post-issuance reporting costs — so an issuer sees whether labelling actually pays.

**How.** (1) Greenium computed as the yield differential against a matched conventional curve, not a seeded field. (2) Net benefit = Σ(greenium bps × notional over tenor) − SPO cost − annual reporting burden, all as parameterised inputs. (3) Keep the working SLL ratchet; add the coupon step economics into the net-benefit calculation. (4) Instruments user-supplied or sourced, replacing the seeded panel.

**Prerequisites.** A conventional-curve source (shared with the pricing-desk sibling); SPO/reporting cost benchmarks; seeded instruments replaced. **Acceptance:** greenium derives from a curve differential (not `sr()`); net benefit reproduces the §5 formula and can go negative when SPO/reporting exceed savings; the SLL ratchet remains correct.

### 9.2 Evolution B — Green-debt structuring copilot (LLM tier 2)

**What.** A copilot for DCM/treasury teams: "does labelling this €500M 7-year bond as green pay after SPO and reporting costs, and how should I set the SLL coupon ratchet?" tool-calls the Evolution A greenium/net-benefit and ratchet endpoints, narrating the structuring trade-off under ICMA GBP/GLP frameworks.

**How.** Tier-2 tool-calling over the net-benefit and ratchet endpoints; the grounding corpus is §5/§7 (ICMA GBP/GLP, greenium mechanics, SPO/reporting-cost economics, SLL step-up/down). The copilot's value is the cost-benefit of labelling and optimal ratchet calibration. Guardrail, pre-Evolution-A: greenium is seeded, so it must refuse net-benefit figures and answer only on framework structure. Every bps and net-benefit figure validated against tool output.

**Prerequisites.** Evolution A (seeded greenium today); conventional-curve data; corpus embedding. **Acceptance:** post-Evolution-A, every greenium and net-benefit figure traces to a tool call; the ratchet recommendation reproduces the step economics; pre-Evolution-A the copilot declines net-benefit claims.