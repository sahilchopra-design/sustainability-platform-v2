# BECCS Project Finance Analytics
**Module ID:** `beccs-project-finance` · **Route:** `/beccs-project-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DX2 · **Sprint:** DX

## 1 · Overview
BECCS project finance analytics covering negative emissions credit revenue, CCS CAPEX/OPEX, biomass supply chain risk, 45Q tax credit (USA), and EU ETS interaction for carbon-negative bioenergy projects.

> **Business value:** Enables rigorous BECCS project finance modelling incorporating 45Q incentives, RED II sustainability constraints, and full supply chain carbon accounting to determine project viability and LCONE.

**How an analyst works this module:**
- Model BECCS plant CAPEX (CCS component $800-1,200/kW additional) and OPEX structure
- Calculate 45Q tax credit eligibility and IRA direct pay option value over project life
- Assess biomass supply chain GHG intensity against RED II sustainability criteria
- Compute LCONE sensitivity to CO2 storage capacity, electricity price, and carbon credit prices

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BECCS_PROJECTS`, `CCS_TECHNOLOGIES`, `FINANCING_STRUCTURES`, `POLICY_ROADMAP`, `REVENUE_STREAMS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CCS_TECHNOLOGIES` | 5 | `name`, `capexMtCO2`, `opexMtCO2`, `captureRate`, `energyPenalty`, `maturity`, `feedstock`, `applications` |
| `BECCS_PROJECTS` | 7 | `country`, `capacityMtyr`, `statusPct`, `capexBn`, `power`, `feedstock`, `ccsType`, `support`, `irr`, `co2Price`, `energyRev`, `firstRevYear` |
| `REVENUE_STREAMS` | 8 | `range`, `certainty`, `contractType`, `driver` |
| `FINANCING_STRUCTURES` | 6 | `equity`, `seniorDebt`, `grant`, `dscr`, `rating`, `example` |
| `POLICY_ROADMAP` | 8 | `event` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `netPowerMw` | `powerMw * (1 - energyPenaltyPct / 100);` |
| `annMwh` | `netPowerMw * (cf / 100) * 8760;` |
| `annCaptureMt` | `annMwh * biomassCo2tMwh * (captureRatePct / 100) / 1e6;` |
| `energyRevMyr` | `annMwh * energyRevMwh / 1e6;` |
| `cdRevMyr` | `annCaptureMt * co2PriceT;` |
| `totalRevMyr` | `energyRevMyr + cdRevMyr;` |
| `totalCapexM` | `capexBn * 1e3 + annCaptureMt * ccsCapexMtCO2;` |
| `annuity` | `w / (1 - Math.pow(1 + w, -lifetime));` |
| `capexAnnM` | `totalCapexM * annuity;` |
| `cfs` | `[-totalCapexM, ...Array.from({ length: lifetime }, () => totalRevMyr - opexMyr - capexAnnM * 0)];` |
| `projectIrr` | `irr([-totalCapexM, ...Array.from({ length: lifetime }, () => totalRevMyr - opexMyr)]);` |
| `dscr` | `(totalRevMyr - opexMyr) / (capexAnnM * 0.7);` |
| `co2Sensitivity` | `useMemo(() => [20, 40, 60, 85, 100, 130, 160, 200].map(price => {` |
| `projectChart` | `useMemo(() => BECCS_PROJECTS.map(p => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BECCS_PROJECTS`, `CCS_TECHNOLOGIES`, `FINANCING_STRUCTURES`, `POLICY_ROADMAP`, `REVENUE_STREAMS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| LCONE | `(CAPEX×CRF + OPEX - Energy Rev - 45Q) / Net CO2 negative` | IEA BECCS cost database | Current LCONE $80-200/tCO2; 45Q credit ($85-180/t) can make projects cash-positive; EU ETS drives additional revenue |
| 45Q Tax Credit Value | `IRA 2022 enhanced 45Q for captured and geologically stored CO2` | US IRS 45Q guidance | IRA raised 45Q from $50 to $85/t geological; $60/t utilisation; direct pay option available for 5 years |
| Biomass Supply Chain Emissions | `Well-to-gate lifecycle emissions per MWh biomass input` | RED II lifecycle methodology | Must be below 70% GHG saving vs fossil baseline per RED II; typically 0.1-0.3 tCO2/MWh for sustainable sources |
- **IEA BECCS cost database** → Technology cost assumptions by feedstock and CCS type → CAPEX/OPEX model inputs → **LCONE calculation**
- **US IRS 45Q guidance and IRA text** → Credit rates, eligible technologies, direct pay rules → tax credit revenue stream → **After-tax project IRR**
- **RED II biomass sustainability registry** → Feedstock sustainability certification → lifecycle GHG calculation and net negativity verification → **Net CO2 removal per MWh**

## 5 · Intermediate Transformation Logic
**Methodology:** BECCS Levelised Cost of Negative Emissions
**Headline formula:** `LCONE = (CAPEX × CRF + OPEX - Electricity Revenue - 45Q) / Annual Net CO2 Negative Emissions; Net Emissions = CO2 Stored - Biomass Supply Chain Emissions`

Levelised cost of negative emissions accounting for energy revenue, policy credits, and full supply chain carbon accounting

**Standards:** ['IEA BECCS in Clean Energy Transitions 2021', 'US 45Q Tax Credit (IRA 2022 enhanced)', 'EU ETS Article 7 — Biogenic CO2']
**Reference documents:** IEA (2021) BECCS in Clean Energy Transitions; US IRS (2023) 45Q Credit for Carbon Oxide Sequestration — IRA Updated Guidance; EU RED II Directive 2018/2001 — Biomass Sustainability Criteria; Global CCS Institute (2023) State of the CCS Industry Report

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (partial).** The MODULE_GUIDES entry's headline metric —
> **LCONE** (`(CAPEX×CRF + OPEX − Electricity Revenue − 45Q) / Annual Net CO₂ Negative`) — is
> **never computed in code**; no $/t levelised cost appears anywhere. The guide's other two
> pillars are also absent as calculations: there is no 45Q tax-credit revenue stream (the CDR
> credit price is one generic `co2Price` slider, with $85 appearing only as a sensitivity point)
> and no biomass supply-chain emission netting (the guide's 0.18 tCO₂/MWh RED II deduction) —
> capture is treated as 100% net-negative. What the code *does* implement is a clean interactive
> **BECCS project cash-flow model** with Newton–Raphson IRR, CO₂-price sensitivity, and DSCR.

### 7.1 What the module computes

A single-project BECCS model (`calcBeccs`) driven by 10 sliders + a CCS-technology selector:

```js
netPowerMw   = powerMw × (1 − energyPenalty/100)
annMwh       = netPowerMw × (cf/100) × 8760
annCaptureMt = annMwh × 0.85 × (captureRate/100) / 1e6     // biomassCo2tMwh = 0.85 t/MWh
energyRev    = annMwh × energyRevMwh / 1e6                  // $M/yr
cdrRev       = annCaptureMt × co2Price                      // $M/yr
totalCapexM  = capexBn × 1e3 + annCaptureMt × ccsCapexMtCO2 // plant + CCS ($M per Mt/yr basis)
annuity      = w / (1 − (1+w)^−lifetime)                    // CRF
IRR          = NewtonRaphson([−capex, (rev−opex) × lifetime years])
DSCR         = (rev − opex) / (0.7 × annualised capex)      // assumes 70% debt share
```

`irr()` is a real Newton–Raphson solver (200 iterations, |Δr| < 1e-8 convergence, derivative-based
step) — not a lookup.

### 7.2 Parameterisation

| Parameter | Default | Provenance |
|---|---|---|
| Gross power / CF | 500 MW / 85% | synthetic demo defaults |
| Plant capex | $2.5B | synthetic (Drax-scale magnitude) |
| Biogenic CO₂ intensity | 0.85 tCO₂/MWh | hard-coded; plausible for wood-pellet steam plant |
| Capture rate / energy penalty | 90% / 20% | defaults mirror the post-combustion row |
| Energy revenue / CO₂ price | $80/MWh / $65/t | synthetic demo defaults |
| Opex | $45M/yr | synthetic |
| Lifetime / WACC | 25 yr / 8% | synthetic |
| CCS technologies (4 rows) | post-combustion capex $85/t·yr, opex $32/t, 90%/22%; pre-combustion 92/28/85%/18%; oxy-fuel 78/24/95%/16%; chemical looping 65/20/97%/12% | curated technology benchmarks (Global CCS Institute-style magnitudes) |
| Debt share in DSCR | 70% (`× 0.7`) | hard-coded assumption |
| Financing structures (5 rows) | equity/debt/grant splits with DSCR 1.25–1.55 and real examples (Drax, Stockholm Exergi green bond) | curated editorial |
| Reference projects (7 rows) | Drax 8.0 Mt/yr, capex $2.8B, IRR 9.4% … | curated editorial |

### 7.3 Calculation walkthrough

1. Sliders → `calcBeccs` → KPI cards (net MW, Mt captured, both revenue streams, IRR, DSCR).
2. **Dual revenue stack** — energy vs CDR-credit bar; the module's central economics message is
   the revenue split.
3. **CO₂-price sensitivity** — IRR recomputed at prices {20, 40, 60, 85, 100, 130, 160, 200} $/t
   (85 = the IRA 45Q geological-storage rate, present as a grid point, not a modelled credit).
4. **Financing structures / policy roadmap / project comparison** — curated display tabs
   (capital-stack bars, 2025–2050 policy milestones, capacity-vs-capex-vs-IRR chart).

One code quirk: `capexAnnM × 0` appears in the (unused) `cfs` array — annualised capex is
deliberately excluded from the IRR cash flows (correct, since the upfront −capex is already
period 0) but the dead term suggests an abandoned levelised-cost path — likely the missing LCONE.

### 7.4 Worked example — default inputs

| Step | Computation | Result |
|---|---|---|
| Net power | 500 × (1 − 0.20) | 400 MW |
| Generation | 400 × 0.85 × 8,760 | 2,978,400 MWh/yr |
| CO₂ captured | 2.9784M × 0.85 × 0.90 | **2.28 MtCO₂/yr** |
| Energy revenue | 2,978,400 × $80 /1e6 | $238.3M/yr |
| CDR revenue | 2.28 × $65 | $148.1M/yr |
| Total capex | 2,500 + 2.28 × 85 | $2,694M |
| CRF (8%, 25y) | 0.08 / (1 − 1.08⁻²⁵) | 0.0937 |
| Annualised capex | 2,694 × 0.0937 | $252.4M/yr |
| Net cash flow | 386.4 − 45 | $341.4M/yr |
| Project IRR | solve Σ 341.4/(1+r)ᵗ = 2,694 | **≈ 11.9%** |
| DSCR | 341.4 / (0.7 × 252.4) | **1.93×** |

At $20/t CO₂ the CDR stream falls to $45.6M and IRR drops to ≈ 9.6%; the sensitivity tab shows
this near-linear IRR-vs-price relationship (each +$10/t adds ≈ $22.8M/yr ≈ +0.5–0.7 pp IRR).

### 7.5 Data provenance & limitations

- Slider defaults, technology table, financing structures and the 7 reference projects are
  **curated demo values** (no PRNG in the core model; magnitudes echo IEA/Global CCS Institute
  publications named in the guide, uncited in code).
- **No net-negativity accounting**: biomass supply-chain emissions (cultivation, transport,
  pellet processing — typically 0.1–0.3 tCO₂/MWh) are not deducted, so "CO₂ captured" is
  overstated as "CO₂ removed" by roughly 15–35%.
- **No LCONE**, no tax modelling, no 45Q direct-pay schedule, no EU ETS biogenic interaction —
  the CDR price slider abstracts all policy revenue into one number.
- Flat annual cash flows (no degradation, no price escalation); DSCR uses a fixed 70% notional
  debt share rather than an actual debt schedule.
- IRR Newton–Raphson can diverge for pathological slider combos (no bracketing fallback), though
  defaults are well-behaved.

### 7.6 Framework alignment

- **US 45Q (IRA 2022)** — $85/t for geologically stored CO₂ from point-source capture ($60/t for
  utilisation), with 5-year direct pay; present only as the $85 sensitivity grid point. A faithful
  model would layer 45Q (12-year credit window) on top of voluntary CDR sales.
- **IEA BECCS / NZE** — the policy roadmap tab quotes IEA NZE milestones (0.5 Gt/yr BECCS by 2030,
  ~3.8 Gt/yr biogenic capture mid-century) as editorial content.
- **EU RED II (2018/2001)** — sustainability criteria requiring ≥ 70–80% lifecycle GHG savings
  for biomass power; the guide's 0.18 tCO₂/MWh supply-chain figure belongs to this framework and
  is absent from code.
- **EU Carbon Removal Certification Framework (CRCF)** — named in the 2026–2027 roadmap rows;
  CRCF certifies removals as (captured − released − supply-chain emissions), which is exactly the
  netting step the model omits.
- **Project-finance conventions** — CRF-annuitised capex, DSCR ≈ 1.25–1.55× targets in the
  financing-structure table are standard limited-recourse benchmarks.

## 9 · Future Evolution

### 9.1 Evolution A — LCONE with 45Q streams and RED II netting (analytics ladder: rung 2 → 3)

**What.** The code has a genuinely clean core — a slider-driven BECCS cash-flow model with real Newton–Raphson IRR (200 iterations, 1e-8 convergence), CO₂-price sensitivity, and DSCR — but §7's mismatch flag lists the three promised pieces that don't exist: **LCONE is never computed** (no $/t levelised cost anywhere), there is no 45Q tax-credit stream (a generic `co2Price` slider stands in; $85 appears only as a sensitivity point), and capture is treated as 100% net-negative with no biomass supply-chain deduction (the RED II ~0.1–0.3 tCO₂/MWh well-to-gate emissions). Evolution A completes the model it advertises.

**How.** (1) LCONE per the guide's own formula: `(CAPEX×CRF + OPEX − energy revenue − 45Q) / annual net-negative tonnes` — the CRF annuity and all components already exist in `calcBeccs`; it is an assembly gap. (2) Net negativity: `net = captured − biomass_chain_emissions`, with a feedstock-intensity input (pellet vs residue vs energy crop) checked against the RED II 70%-saving threshold and surfaced as a pass/fail. (3) 45Q as a distinct revenue stream: $85/t geological storage, 12-year credit window, direct-pay option for the first 5 years — modelled as a finite-tenor stream separate from voluntary CDR credit sales, because their stacking rules and tenors differ (a real structuring question the current single slider hides). (4) DSCR's hard-coded 70% debt share becomes an input tied to the `FINANCING_STRUCTURES` presets.

**Prerequisites.** A sourced feedstock-intensity mini-table (RED II Annex VI values are published); decide 45Q/voluntary-credit stacking treatment explicitly and document it — this is contested policy ground and the model must state its assumption. **Acceptance:** LCONE for the default project lands in the guide's cited $80–200/t band with components itemised; a high-intensity feedstock flips the RED II check to fail and reduces net tonnes; the 45Q stream terminates at year 12 in the cash-flow table.

### 9.2 Evolution B — BECCS deal-screening copilot (LLM tier 2)

**What.** BECCS viability hinges on policy-stacking arithmetic that analysts routinely get wrong — which credit applies, for how long, against which tonnes. Evolution B is a copilot that runs the Evolution-A model as tools: "is a 300 MW pellet plant with pre-combustion capture viable at $65/t voluntary plus 45Q?" triggers the cash-flow engine with the named parameters and narrates IRR, DSCR, LCONE, and the RED II verdict — then stress-tests via the CO₂-price sensitivity endpoint, with the copilot contributing only the structuring narrative (toll-style offtake vs merchant CDR sales, from `REVENUE_STREAMS` certainty labels).

**How.** Backend extraction of `calcBeccs` (pure function; small) plus the LCONE/45Q additions as `POST /api/v1/beccs/model`; tool schemas from that route. Grounding corpus: this Atlas record — §7.2's parameter provenance table lets the copilot label every default honestly ("plant capex $2.5B: synthetic Drax-scale default, not a quote") and §7's mismatch history prevents it from citing LCONE before Evolution A ships. The 7 real reference projects in `BECCS_PROJECTS` (Drax, Stockholm Exergi) serve as named comparators, with their curated-editorial status disclosed.

**Prerequisites (hard).** The backend extraction; Evolution A's 45Q/RED II mechanics — a copilot narrating "45Q value" from a model with no 45Q stream would fabricate the module's central policy claim. **Acceptance:** every IRR/DSCR/LCONE figure traces to a model response; parameter provenance is stated per assumption; stacking-rule assumptions are quoted verbatim from the model's documented treatment.