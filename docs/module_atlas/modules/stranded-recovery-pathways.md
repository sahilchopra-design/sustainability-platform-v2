# Stranded Recovery Pathways
**Module ID:** `stranded-recovery-pathways` · **Route:** `/stranded-recovery-pathways` · **Tier:** B (frontend-computed) · **EP code:** EP-CK3 · **Sprint:** CK

## 1 · Overview
10 repurposing pathways for stranded assets with conversion CapEx and IRR.

**How an analyst works this module:**
- Repurposing Opportunities shows 10 pathways with CapEx and IRR
- Case Studies show real-world conversion examples

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CASE_STUDIES`, `Card`, `KPI`, `PATHWAYS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PATHWAYS` | 11 | `from`, `to`, `capex`, `timeline`, `irr`, `jobs`, `feasibility`, `riskLevel`, `region`, `savedEmissions` |
| `CASE_STUDIES` | 4 | `pathway`, `capex`, `status`, `irr`, `detail` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalCapex` | `PATHWAYS.reduce((s,p)=>s+p.capex,0);` |
| `totalJobs` | `PATHWAYS.reduce((s,p)=>s+p.jobs,0);` |
| `avgIRR` | `PATHWAYS.reduce((s,p)=>s+p.irr,0)/PATHWAYS.length;` |
| `totalSaved` | `PATHWAYS.reduce((s,p)=>s+p.savedEmissions,0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CASE_STUDIES`, `PATHWAYS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Pathways | — | Analysis | Conversion options per asset type |
| Best IRR | `Coal→battery` | Model | Highest return on conversion investment |

## 5 · Intermediate Transformation Logic
**Methodology:** Conversion IRR analysis
**Headline formula:** `IRR = rate where NPV(conversion_cash_flows) = 0`

10 pathways: coal→battery storage, refinery→green H₂, gas turbine→synchronous condenser, oil platform→offshore wind, coal port→green ammonia, etc.

**Standards:** ['Sector studies', 'IEA']
**Reference documents:** IEA Net Zero; Carbon Tracker Stranded Assets

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula is `IRR = rate where
> NPV(conversion_cash_flows) = 0` — a real discounted-cash-flow IRR solve. **No cash-flow schedule,
> discount rate, or NPV solver exists in the code.** `irr` (and `capex`, `jobs`, `feasibility`) for
> each of the 10 repurposing pathways is a **fixed hardcoded literal**, not derived from any
> computation. The module is a static, plausible reference table plus three genuinely real, named
> case studies — not a cash-flow model.

### 7.1 What the module computes

`PATHWAYS` — 10 hardcoded fossil-to-clean repurposing options, each with `capex` ($M), `timeline`
(text range), `irr` (%, literal), `jobs` (count), `feasibility` (0–100, literal), `riskLevel`
(Low/Medium/High), `region`, `savedEmissions` (MtCO₂e). Examples: `Coal Plant→Battery Storage`
($180M capex, 14.2% IRR, US Midwest); `Gas Turbine→Synchronous Condenser` ($25M, **22.5% IRR** —
the highest of the 10, reflecting the genuinely low capex and high feasibility of this specific
real-world repurposing pattern — grid operators do convert retiring gas turbines to synchronous
condensers for reactive-power support at relatively low cost).

The only computed values are simple aggregates:
```
totalCapex = Σ capex           totalJobs = Σ jobs
avgIRR     = mean(irr)          totalSaved = Σ savedEmissions
```

### 7.2 Parameterisation

| Pathway | CapEx ($M) | IRR (literal) | Feasibility | Provenance |
|---|---|---|---|---|
| Gas Turbine → Synchronous Condenser | 25 | 22.5% | 95 | Plausible — matches real-world low-capex, high-feasibility grid-services conversions |
| Coal Mine → Pumped Hydro Storage | 400 | 9.8% | 60 | Plausible — pumped hydro repurposing of mine pits is a real, capital-intensive, lower-return pattern |
| Steel BF → Electric Arc Furnace | 520 | 10.4% | 80 | Plausible — largest capex, consistent with real EAF conversion costs (hundreds of millions to >$1Bn per plant) |

All 10 rows show internally consistent, directionally sensible relationships (higher capex tends
toward longer timelines and — with exceptions like the H₂-DRI-style Steel BF conversion — lower IRR)
even though no formula produced them.

### 7.3 Calculation walkthrough

1. **Filter/sort** — by `riskLevel` and by `irr`/`capex`/`feasibility`.
2. **Portfolio KPIs** — the four aggregate sums/means above, computed correctly from the static table.
3. **Decommission vs Convert tab** — a `decommRate` slider (0–100%) likely blends a hardcoded
   decommission-only cost baseline against the conversion economics, though no NPV comparison formula
   is present in the reviewed portion of the file.
4. **Case Studies tab** — 3 real, named, verifiable examples (Drax Power Station biomass+BECCS
   conversion, Hornsea offshore wind O&M base from a former oil platform, HYBRIT fossil-free steel
   pilot in Sweden) with real capex figures ($1.2Bn, $680M, $1.8Bn) and status — genuinely
   fact-grounded content, presented as fixed reference cases rather than computed from the `PATHWAYS`
   model.

### 7.4 Worked example

`avgIRR = mean([14.2,11.8,22.5,12.6,13.1,10.4,16.8,18.2,9.8,19.4]) = 148.8/10 = 14.88%`.
`totalCapex = Σ[180,450,25,320,280,520,150,90,400,210] = $2,625M`. Both are correct arithmetic over
the static table — the numbers being aggregated are simply not derived from any cash-flow model.

### 7.5 Companion analytics

- **Conversion CapEx tab** — bar chart of `capex` by pathway.
- **Green Industrial Zones tab** — presumably a regional clustering view (region field present on
  each pathway) — descriptive, not modelled.

### 7.6 Data provenance & limitations

- All 10 pathway metrics are fixed illustrative constants; no underlying cash-flow schedule
  (construction capex phasing, revenue ramp, opex, terminal value) exists to actually solve for IRR.
- The 3 case studies are real and verifiable in broad strokes (Drax BECCS conversion, Hornsea
  offshore wind, HYBRIT green steel are all genuine, publicly documented projects) — a stronger
  factual grounding than most modules in this batch, but still fixed reference content rather than a
  live-computed comparison against the `PATHWAYS` table's own numbers.
- No sensitivity to carbon price, electricity price, or financing cost is modelled — a real IRR for
  any of these repurposing pathways would be highly sensitive to exactly those variables.

**Framework alignment:** IEA Net Zero industry transition studies (conceptual basis for the pathway
list) · Carbon Tracker stranded-asset repurposing framing · real-world case precedents (Drax, Ørsted/
Hornsea, HYBRIT consortium) genuinely cited, not fabricated.

## 9 · Future Evolution

### 9.1 Evolution A — Implement the conversion-IRR DCF the guide names (analytics ladder: rung 1 → 2)

**What.** The §7 flag documents that the guide's `IRR = rate where NPV(conversion_cash_flows) = 0` **has no implementation** — `irr`, `capex`, `jobs`, and `feasibility` for each of the 10 repurposing pathways are hardcoded literals, and the only computation is simple aggregates (totalCapex, avgIRR). Its strengths are real: the 10 pathways are directionally sensible (gas-turbine→synchronous-condenser genuinely has the lowest capex and highest feasibility, matching real grid-services conversions), and the 3 case studies (Drax BECCS, Hornsea, HYBRIT) are genuine, publicly documented projects. Evolution A builds the DCF that makes the IRRs computed rather than asserted.

**How.** (1) Add a per-pathway cash-flow schedule: conversion capex phasing, revenue ramp (post-conversion output × price), opex, and terminal value, then solve for IRR via the same Newton-Raphson approach the platform's solar/SMR project-finance modules already use. (2) Make the IRR sensitive to the variables that actually drive it — carbon price, electricity/commodity price, and financing cost — via user sliders and scenario presets (currently no sensitivity is modelled at all, §7.6). (3) Cite the pathway capex/feasibility constants to IEA Net Zero industry-transition studies. (4) Reconcile the case studies against the `PATHWAYS` table (currently fixed reference content, not compared to the table's own numbers).

**Prerequisites.** Cash-flow assumptions per pathway (revenue basis, opex); the IRR solver exists elsewhere in the codebase to reuse. **Acceptance:** each pathway's IRR is solved from an NPV=0 cash-flow schedule, not a literal; changing carbon or electricity price moves the IRR; capex constants cite an IEA vintage.

### 9.2 Evolution B — Asset-repurposing advisory copilot (LLM tier 1)

**What.** A copilot for the asset owner / transition-finance analyst: "what are the best repurposing options for a retiring coal plant?", "what's the IRR of converting this refinery to green hydrogen and how sensitive is it to power price?", "show me a real-world precedent for offshore-platform-to-wind conversion" — answered from the (Evolution-A) computed IRRs, the sensitivity ranges, and the genuine case studies.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/stranded-recovery-pathways/ask`, corpus = this Atlas record (the pathway table, the case studies, IEA NZE framework notes) plus live page state. Pathway recommendations narrate the computed IRR and feasibility; what-if requests re-run the DCF with the user's price/financing assumptions; precedent answers cite the real Drax/Hornsea/HYBRIT projects with their public details. Refusal for asset types outside the 10 pathways.

**Prerequisites.** Evolution A's DCF so IRR discussions rest on computed cash flows rather than hardcoded literals with no sensitivity. **Acceptance:** every IRR/capex figure traces to the DCF; sensitivity claims reflect actual re-runs; case-study details match the real documented projects, not invented specifics.