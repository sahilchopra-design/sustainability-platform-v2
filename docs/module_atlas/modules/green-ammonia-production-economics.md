# Green Ammonia Production Economics
**Module ID:** `green-ammonia-production-economics` · **Route:** `/green-ammonia-production-economics` · **Tier:** B (frontend-computed) · **EP code:** EP-EE1 · **Sprint:** EE

## 1 · Overview
Green ammonia LCOA analysis. Models electrolyser+Haber-Bosch project economics, decomposes LCOA into capital, operating, and electricity cost components, tracks green premium vs grey ammonia, and projects pathway to cost-competitive $300/t target by 2030.

> **Business value:** Used by green hydrogen/ammonia developers, DFIs, commodity traders, fertilizer companies, and shipping companies evaluating green ammonia investment and pathway to cost parity with grey ammonia.

**How an analyst works this module:**
- Review project portfolio for LCOA distribution by country and RE source
- Use LCOA decomposition for electricity/CAPEX/OPEX sensitivity
- Examine electrolyser economics for PEM vs alkaline cost trajectory
- Run pathway analysis to $300/t LCOA by 2030

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CRF`, `KpiCard`, `NH3_ELEC_CONSUMPTION`, `PROJECTS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PROJECTS` | 21 | `country`, `electrolyserGw`, `asuCapacity_tpd`, `hbCapacity_tpd_nh3`, `electrolyserCapex_usd_kw`, `asuCapex_bn`, `hbCapex_bn`, `electricityCost_usd_mwh`, `capacity_factor_pct`, `lcoa_usd_t`, `grey_ammonia_cost_usd_t` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CRF` | `0.08; // capital recovery factor ~8%` |
| `NH3_ELEC_CONSUMPTION` | `10; // MWh/t NH3` |
| `TABS` | `['LCOA Engine', 'Electrolysis Cost Breakdown', 'Haber-Bosch Economics', 'Sensitivity Analysis', 'Scale Effects', 'Grey vs Green Parity'];` |
| `countries` | `useMemo(() => ['All', ...Array.from(new Set(PROJECTS.map(p => p.country)))], []);` |
| `avgLcoa` | `useMemo(() => filtered.length ? filtered.reduce((a, b) => a + b.lcoa_usd_t, 0) / filtered.length : 0, [filtered]);` |
| `avgGrey` | `useMemo(() => filtered.length ? filtered.reduce((a, b) => a + b.grey_ammonia_cost_usd_t, 0) / filtered.length : 0, [filtered]);` |
| `avgCF` | `useMemo(() => filtered.length ? filtered.reduce((a, b) => a + b.capacity_factor_pct, 0) / filtered.length : 0, [filtered]);` |
| `totalCapacity` | `useMemo(() => filtered.reduce((a, b) => a + b.hbCapacity_tpd_nh3, 0), [filtered]);` |
| `annualOutput` | `capexOverride * 1000 * 8760 * 0.5 / NH3_ELEC_CONSUMPTION;` |
| `capexAnnual` | `capexOverride * 1000 * CRF;` |
| `opexFixed` | `capexOverride * 0.02 * 1000;` |
| `lcoa` | `annualOutput > 0 ? (capexAnnual + opexFixed + elecCost) / 1 : 0;` |
| `scaleData` | `useMemo(() => [...PROJECTS] .sort((a, b) => a.electrolyserGw - b.electrolyserGw) .map(p => ({ name: p.project.slice(0, 12), gw: p.electrolyserGw, lcoa: p.lcoa_usd_t })), []);` |
| `costBreakdown` | `useMemo(() => filtered.slice(0, 8).map(p => ({ name: p.project.slice(0, 10), electrolyser: Math.round(p.electrolyserCapex_usd_kw * p.electrolyserGw * 1000 * CRF / (p.hbCapacity_tpd_nh3 * 365 * p.capacity_factor_pct / 100) * 1000) / 10, electricity: Math.round(p.electricityCost_usd_mwh * NH3_ELEC_CONSUMPTION), asuHb: Math.round((p.asuCapex` |
| `parityData` | `useMemo(() => [...PROJECTS].sort((a, b) => a.lcoa_usd_t - b.lcoa_usd_t).map(p => ({ name: p.project.slice(0, 10), green: p.lcoa_usd_t, grey: p.grey_ammonia_cost_usd_t, premium: p.lcoa_usd_t - p.grey_ammonia_cost_usd_t, })), []);` |
| `hbData` | `useMemo(() => filtered.slice(0, 10).map(p => ({ name: p.project.slice(0, 10), hbCapex: Math.round(p.hbCapex_bn * 1000), asuCapex: Math.round(p.asuCapex_bn * 1000), tpdNH3: p.hbCapacity_tpd_nh3, })), [filtered]);` |
| `carbonPriceNeeded` | `Math.round(p.premium / 1.8);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PROJECTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| LCOA ($/tonne NH3) | `LCOA = (CAPEX×CRF + OPEX + E_cost×10) / output_t` | IRENA / BNEF Green Ammonia Tracker 2024 | At $20/MWh RE, electricity = $200/t; at $50/MWh = $500/t; key lever is cheap renewable electricity. |
| Green Premium ($/tonne) | `LCOA_green - LCOA_grey` | CRU Group Ammonia Price Analytics | Grey NH3 FOB $200-300/t; green premium needs to close to <$100/t for commercial viability without subsidies. |
| Electrolyser Capacity Factor (%) | `Operating hours / total hours per year` | IEA Green Hydrogen Cost Analysis | Higher CF reduces CAPEX per tonne; 50% CF (intermittent wind) doubles CAPEX vs 90% CF (24/7 hydro). |
- **RE electricity cost + electrolyser cost + Haber-Bosch CAPEX + O&M benchmarks** → LCOA model (CRF + OPEX + electricity) + green premium calculator + cost trajectory → **Green ammonia project investment: site selection, offtake pricing, subsidy optimization**

## 5 · Intermediate Transformation Logic
**Methodology:** LCOA Decomposition & Electrolyser Cost Model
**Headline formula:** `LCOA = (CAPEX × CRF + OPEX + E_price × 10 MWh/t) / NH3_output_t; CRF = r(1+r)^n/((1+r)^n-1)`

Green NH3: 178 kg H2/tonne, 10 MWh electricity/tonne, 0.8 t N2/tonne. LCOA 2024: $400-1200/t green vs $200-350/t grey. Cost breakdown: electrolysis 60-70%, Haber-Bosch 15-20%, CAPEX financing 15-25%.

**Standards:** ['IEA Ammonia Technology Roadmap 2021', 'IRENA Green Hydrogen Cost Scaling 2020', 'BNEF Green Ammonia Market Outlook 2024']
**Reference documents:** IEA Ammonia Technology Roadmap 2021; IRENA Green Hydrogen Cost Reduction: Scaling Up Electrolysers 2020; BNEF Green Ammonia Market Outlook 2024

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

20 named real projects (NEOM, Murchison, HyDeal Ambition, etc.) each carry hand-entered technical
and cost parameters. The headline metric is Levelised Cost of Ammonia (LCOA, $/tonne NH₃), computed
per the guide's formula and cross-checked against a **hard-coded `grey_ammonia_cost_usd_t`** field
per project (not derived — entered directly, 245–310 $/t range):

```
LCOA = (CAPEX × CRF + OPEX + E_price × 10 MWh/t) / Annual_NH3_output_t
CRF  = 0.08   (flat 8% capital recovery factor, not amortised via r(1+r)^n/((1+r)^n−1) despite
               the guide's stated formula — the code uses a constant, not the interest/lifetime
               annuity formula)
```

`lcoa_usd_t` itself is a **static input field** per project (400–1,200 range), not computed live —
the "LCOA Engine" tab displays these pre-set values; only the derived breakdown charts (cost
breakdown, sensitivity, scale effects) perform live arithmetic.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `CRF` | 0.08 | Comment: "capital recovery factor ~8%" — a flat approximation of the annuity factor, not solved from a discount rate/lifetime pair |
| `NH3_ELEC_CONSUMPTION` | 10 MWh/t NH₃ | Matches guide's stated "10 MWh electricity/tonne" benchmark (IEA Ammonia Technology Roadmap) |
| Per-project `electrolyserCapex_usd_kw` | 580–950 $/kW | Named real developers; plausible 2024 PEM/alkaline CAPEX range, not sourced to a specific citation per project |
| Per-project `electricityCost_usd_mwh` | 14 (Somalia) – 42 (Japan, import case) | Reflects known RE-resource quality differentials (MENA/Australia cheap, Japan/Denmark expensive) |
| `grey_ammonia_cost_usd_t` | 245–310 | Matches guide's "$200–350/t grey" range |

### 7.3 Calculation walkthrough

1. **Cost breakdown** (`costBreakdown`, live per-project calc): correctly annualises CAPEX using
   `CRF` against actual annual output —
   `electrolyser_$/t = electrolyserCapex_$/kW × GW × 1000 × CRF / (tpd × 365 × CF%)` — a genuine
   CRF-based unit-cost derivation, applied separately to electrolyser CAPEX, electricity
   (`elecCost_$/MWh × 10`), and combined ASU+HB CAPEX.
2. **Sensitivity Analysis tab** — computes `annualOutput`, `capexAnnual`, `opexFixed`, `elecCost`,
   and even a `lcoa` variable using the CRF formula, **then discards all of it** and returns
   `lcoa: Math.round(400 + e×12 + capexOverride×0.08)` — a simple linear approximation unrelated to
   the computed values in the same block. **This is dead code**: the "sensitivity" chart the user
   sees is not driven by the CRF math directly above it.
3. **Scale Effects tab**: plots `electrolyserGw` vs `lcoa_usd_t` across all 20 projects sorted by
   size — a genuine (if simple) scale-economics scatter using the static `lcoa_usd_t` field, not a
   fitted curve.
4. **Grey vs Green Parity tab**: `premium = lcoa_usd_t − grey_ammonia_cost_usd_t` per project,
   sorted ascending by LCOA — direct subtraction of two static fields.
5. **Carbon price needed to close the gap** (`carbonPriceNeeded`): `premium / 1.8` — dividing the
   green premium by 1.8 tCO₂/t NH₃ (the stoichiometric/typical grey-ammonia carbon intensity),
   i.e. solving `carbonPrice × 1.8 = premium` for the breakeven carbon price.

### 7.4 Worked example

Project "ACME Green Ammonia" (Chile): `electrolyserCapex_usd_kw=720`, `electrolyserGw=1.8`,
`hbCapacity_tpd_nh3=1050`, `capacity_factor_pct=50`, `electricityCost_usd_mwh=20`,
`asuCapex_bn=0.6`, `hbCapex_bn=0.9`, `lcoa_usd_t=530` (static), `grey_ammonia_cost_usd_t=270`.

| Step | Computation | Result |
|---|---|---|
| Annual NH₃ output | `1050 × 365 × 0.50` | 191,625 t/yr |
| Electrolyser $/t | `720 × 1.8 × 1000 × 0.08 / 191,625 × 1000` | ≈ $541/t (matches code's `×1000/(...)×1000` unit juggling) |
| Electricity $/t | `20 × 10` | $200/t |
| ASU+HB $/t | `(0.6+0.9)×1e9×0.08 / 191,625 × 1000` | ≈ $501/t |
| Green premium | `530 − 270` | $260/t |
| Breakeven carbon price | `260 / 1.8` | **$144/tCO₂** |

The electrolyser + ASU/HB unit costs computed here (≈$541+$501=$1,042/t before electricity) exceed
the *static* `lcoa_usd_t=530` field by a wide margin — confirming the cost-breakdown chart and the
headline LCOA figure are **not internally reconciled**; the breakdown is a separate live
calculation layered on top of a hand-entered headline number, not a decomposition of it.

### 7.5 Companion analytics

- **Haber-Bosch Economics tab**: `hbCapex_bn`/`asuCapex_bn` per project scaled ×1000 to $M, plotted
  against `tpdNH3` capacity — a capital-intensity comparison, no further derivation.

### 7.6 Data provenance & limitations

- All 20 projects are **hand-entered static data**, not `sr()`-generated — but cross-field
  consistency is not enforced: the static `lcoa_usd_t` and the live cost-breakdown calculation can
  diverge substantially (see §7.4), and the Sensitivity Analysis tab silently substitutes a
  disconnected linear formula for the CRF-based one computed in the same code block.
- `CRF = 0.08` is a flat constant rather than solved from `(WACC, lifetime)` — despite the guide
  citing the full annuity formula `r(1+r)^n/((1+r)^n−1)`, no discount rate or asset life parameter
  exists in this module (contrast with `green-hydrogen-lcoh`, which does implement the full annuity
  formula).
- Carbon-price breakeven (`premium/1.8`) assumes a fixed 1.8 tCO₂/t grey-ammonia emission factor
  uniformly across all countries/production routes, ignoring regional grid-emission-factor
  variation in grey ammonia production.

**Framework alignment:** IEA Ammonia Technology Roadmap 2021 (10 MWh/t electricity benchmark,
correctly used) · IRENA Green Hydrogen Cost Reduction 2020 (capacity-factor/CAPEX scaling context)
· BNEF Green Ammonia Market Outlook 2024 (cost trajectory framing). The CRF methodology named in
the guide is only partially implemented (flat 8% vs full annuity formula).

## 9 · Future Evolution

### 9.1 Evolution A — Reconcile static LCOA with the live calc and add electrolyser learning (analytics ladder: rung 2 → 3)

**What.** §7 confirms this is the analytical core of the ammonia cluster: 20 named real projects (NEOM, Murchison, HyDeal Ambition) with hand-entered parameters, and a genuine LCOA decomposition (`LCOA = (CAPEX·CRF + OPEX + E_price·10 MWh/t)/NH3_output_t`, CRF the standard capital-recovery factor). Its flagged defect is a consistency gap: each project's static `lcoa_usd_t` and the live cost-breakdown calculation can diverge — two numbers for the same quantity. Evolution A resolves this by making the live calc authoritative (deriving `lcoa_usd_t` from the components rather than storing it separately), and adds a benchmarked electrolyser-cost learning curve so the pathway-to-$300/t-by-2030 projection is computed from a learning rate rather than asserted.

**How.** (1) Delete the stored `lcoa_usd_t`; compute it from CAPEX/CRF/OPEX/electricity per project so the two can't diverge. (2) An electrolyser CAPEX learning curve (`cost(cum) = cost₀·(cum/cum₀)^(−b)`) driving the 2024→2030 cost decline, replacing a hard-coded trajectory. (3) Sensitivity of LCOA to electricity price (the dominant 60–70% term) and electrolyser efficiency, with the 10 MWh/t and 178 kg H₂/t stoichiometry documented per §8.

**Prerequisites.** Electrolyser deployment/cost reference series; the stored-vs-computed LCOA reconciled. **Acceptance:** every project's LCOA equals its component build-up (no divergent stored value); the cost-decline pathway responds to the learning rate; electricity-price sensitivity reproduces the §5 formula.

### 9.2 Evolution B — LCOA structuring copilot (LLM tier 1 → 2)

**What.** A copilot for developers and investors: "what's the LCOA for a 2 GW project at $30/MWh renewable power, and what electricity price gets us to $300/t?" narrates the LCOA decomposition and green-vs-grey premium from the atlas corpus, with tier-2 running the Evolution A LCOA and sensitivity endpoints so cost what-ifs are computed.

**How.** Tier 1 grounds on §5/§7 (the LCOA formula, cost-component shares, the $300/t 2030 target are documented), and since the LCOA calc is already genuine, an explainer over rendered page state ships first. Tier 2 tool-calls the LCOA endpoint with electricity-price/CAPEX/efficiency parameters, so the "what price hits $300/t" goal-seek is engine-computed. Every $/t figure validated against tool output; the copilot foregrounds the electricity-cost dominance.

**Prerequisites.** Evolution A's reconciled LCOA for consistent answers; corpus embedding. **Acceptance:** every LCOA and premium figure traces to a tool call or rendered state; the goal-seek returns an electricity price reproducing the $300/t target from the formula; the copilot never quotes a stored LCOA that conflicts with the computed one.