# Industrial Ccs
**Module ID:** `industrial-ccs` · **Route:** `/industrial-ccs` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `SOURCES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SOURCES` | 9 | `name`, `sector`, `purity`, `capexM`, `fixedOmM`, `varOmPerT`, `energyGjPerT`, `captureRate`, `flueCO2Tpa` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `co2Captured` | `src.flueCO2Tpa * src.captureRate;` |
| `annualCapex` | `src.capexM * 1e6 * crf(r, n);` |
| `annualFixedOm` | `src.fixedOmM * 1e6;` |
| `annualEnergy` | `src.energyGjPerT * co2Captured * pEnergy;` |
| `annualVarOm` | `src.varOmPerT * co2Captured;` |
| `lcoc` | `(annualCapex + annualFixedOm + annualEnergy + annualVarOm) / co2Captured;` |
| `denom` | `Math.max(0.01, src.captureRate * efBaseline);` |
| `abatementCost` | `(lcoc + tsCost - avoidedValue) / denom;` |
| `netCost` | `abatementCost - credit45q - etsPrice;` |
| `rows` | `useMemo(() => SOURCES.map(src => {` |
| `avgLcoc` | `rows.length ? rows.reduce((s, x) => s + x.lcoc, 0) / rows.length : 0;` |
| `totalFlueCO2Mtpa` | `rows.reduce((s, x) => s + x.flueCO2Tpa, 0) / 1e6;` |
| `avgCaptureRate` | `rows.length ? rows.reduce((s, x) => s + x.captureRate, 0) / rows.length : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `SOURCES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Unimplemented module.** This atlas record (`industrial-ccs`, route `/industrial-ccs`) has
> **no source files, no engine, no route file and no MODULE_GUIDES entry.** The feature directory
> `frontend/src/features/industrial-ccs/` exists but is **empty** (only an empty `pages/` folder), and
> a repository-wide search for `industrial-ccs` in `frontend/src` returns **no references** — it is not
> lazy-imported, not routed and not linked from any navigation group. There is nothing to ground a
> methodology description in; the sections below therefore document the *intended* module and specify
> the model it should run, clearly labelled as not-yet-built.

### 7.1 What the module computes

**Nothing is implemented.** Based on the id and title ("Industrial CCS"), the intended scope is the
finance and MRV economics of **industrial carbon capture and storage** — capture cost per tonne,
transport & storage (T&S) cost, capture rate, and the abatement economics of retrofitting CCS onto hard-
to-abate industrial point sources (cement, steel, chemicals, refining, waste-to-energy).

No constants, seed datasets or derived-value computations exist to quote.

### 7.2 Parameterisation / scoring rubric

Not applicable — no code. A production version would parameterise capture cost by source concentration
(high-purity ammonia/ethanol vs dilute cement flue gas), capture rate (85–95%), T&S cost, and policy
support (45Q, EU ETS, IPCEI).

### 7.3 Calculation walkthrough

Not applicable — no inputs or outputs are wired.

### 7.4 Worked example

Not applicable — no formulas exist to trace.

### 7.5 Data provenance & limitations

- **The module does not exist in code.** There is no synthetic data, no PRNG, no engine — the atlas
  entry is a placeholder id with no backing implementation.
- Adjacent, *implemented* CCS/CCUS capability lives elsewhere on the platform (e.g. CDR/BECCS finance
  modules, `cc-industrial-gases`); a reader seeking industrial-CCS analytics should be routed there.

## 8 · Model Specification — Industrial CCS Abatement & Finance Model

**Status: specification — not yet implemented in code.** (This entire module is unbuilt.)

### 8.1 Purpose & scope
Support the retrofit-CCS investment decision for industrial point sources: levelised cost of CO₂
captured (LCOC), delivered abatement cost after T&S, and net cost after policy credits — across cement,
steel, chemicals, refining and WtE.

### 8.2 Conceptual approach
A bottom-up capture-plus-T&S cost model, mirroring the **IEAGHG** / **Global CCS Institute** cost
frameworks and **NETL** techno-economic methodology, with abatement cost benchmarked against carbon
price and 45Q/EU-ETS support. Two benchmarks: IEAGHG capture-cost curves by source, and the IEA CCUS in
Clean Energy Transitions cost ranges.

### 8.3 Mathematical specification
```
LCOC_capture = (CAPEX·CRF + FixedO&M + Energy·P_energy + VariableO&M) / (CO2_captured_tpa)
CO2_captured = FlueCO2_tpa · CaptureRate
AbatementCost = (LCOC_capture + T&S_cost − avoidedEmissionsValue) / (CaptureRate·EF_baseline)
NetCost = AbatementCost − Credit_45Q − ETS_price
CRF = r(1+r)^N/((1+r)^N − 1)
```

| Parameter | Typical value | Source |
|---|---|---|
| Capture rate | 0.85–0.95 | IEAGHG |
| LCOC (cement) | $60–120/t | IEA CCUS; Global CCS Institute |
| LCOC (high-purity, e.g. NH₃) | $15–35/t | NETL |
| T&S cost | $10–30/t | IEAGHG onshore/offshore |
| 45Q credit | $85/t (saline storage) | US IRA §45Q |
| Energy penalty | 2.5–4 GJ/tCO₂ (amine) | NETL |
| `r, N` | 8%, 25 yr | Project-finance defaults |

### 8.4 Data requirements
Source flue-gas CO₂ concentration and volume, capture-technology capex/opex (amine, oxyfuel, calcium
looping), regional energy price, T&S network cost, storage capacity, policy credit eligibility. Platform
holds carbon-price contexts and some CCS references in CDR modules; industrial-source and T&S cost data
would need ingestion.

### 8.5 Validation & benchmarking plan
Reconcile LCOC by source against IEAGHG/IEA published ranges; validate high-purity sources (ammonia,
ethanol) show lowest LCOC and dilute cement flue gas highest; sensitivity of net cost to 45Q, ETS price
and energy penalty; benchmark against operating projects (Boundary Dam, Northern Lights).

### 8.6 Limitations & model risk
Capture cost is highly source-specific — a single scalar is misleading; always resolve by source purity.
T&S cost depends on network access (a stranded-source risk). First-of-a-kind projects overrun capex —
apply a FOAK premium and present a cost range, not a point estimate.

**Framework alignment:** IEAGHG / Global CCS Institute capture-cost methodology · NETL techno-economic
framework · IEA *CCUS in Clean Energy Transitions* · US IRA §45Q · EU ETS / IPCEI. None is implemented —
this module is a placeholder id awaiting a build; the specification above is the intended production model.

## 9 · Future Evolution

### 9.1 Evolution A — Calibrate the young LCOC calculator and add T&S network realism (analytics ladder: rung 2 → 3)

**What.** This module's atlas record is internally split: the §7 deep-dive was written against an empty feature directory and flags the module as unbuilt, but the §2 function map now documents a working page — a 9-row `SOURCES` table (sector, purity, capex, O&M, energy GJ/t, capture rate, flue CO₂) driving exactly the §8.3 formulas: `LCOC = (CAPEX·CRF + FixedOM + Energy·P + VarOM)/CO2_captured`, `AbatementCost = (LCOC + T&S − avoidedValue)/(captureRate·EF)`, `NetCost = AbatementCost − 45Q − ETS`. So the honest baseline is rung 2 (deterministic LCOC with price/rate what-ifs), not zero. Evolution A executes the §8.5 validation plan the spec already wrote: benchmark each source's LCOC against IEAGHG/IEA published ranges (high-purity ammonia $15–35/t lowest, dilute cement $60–120/t highest), and replace the scalar `tsCost` with a T&S network model — distance-to-hub and storage-access, since §8.6 names stranded-source risk as the key real-world failure mode.

**How.** (1) Refresh the §7 deep-dive to match the shipped code (the "unimplemented" flag is stale and misleading). (2) Add per-source provenance to the `SOURCES` rows and pin 2–3 LCOC reference cases in bench_quant against IEAGHG figures. (3) T&S becomes `f(distance_km, mode, storage_type)` with a FOAK capex premium toggle per §8.6. (4) Cross-link to the operating-project benchmarks §8.5 names (Boundary Dam, Northern Lights) as reality-check rows.

**Prerequisites.** Reconciling the atlas record (rerunning the builder is out of scope here, but the mismatch must be logged); IEAGHG/GCCSI cost-curve data collection. **Acceptance:** each source's computed LCOC lands within (or is flagged against) its published range; a source 300 km from storage prices differently than one at a hub; the deep-dive no longer claims the module is unbuilt.

### 9.2 Evolution B — CCS retrofit-screening copilot (LLM tier 1 → 2)

**What.** A copilot for industrial decarbonisation teams: "why is the ammonia plant's LCOC a quarter of the cement kiln's?" (answer: source purity — the concentration-to-cost relationship in the `SOURCES` table), "at what ETS price does this refinery retrofit go NPV-positive net of 45Q?", "what's the abatement cost if capture rate slips to 85%?" These are explanation and sweep questions over the page's deterministic calculator.

**How.** Tier 1 first: this Atlas page (§8's parameter table with the 45Q $85/t, energy-penalty 2.5–4 GJ/t anchors) plus current slider state (`r`, `pEnergy`, `tsCost`, `etsPrice`, `credit45q`) as context, so the copilot explains the on-screen rows. Tier 2 requires promoting the in-page math to a backend route (`POST /industrial-ccs/lcoc`) — currently frontend-only, so there is nothing to tool-call; once exposed, breakeven questions run as bisection tool-call loops. Discipline: policy-credit figures (45Q saline $85/t) must cite the parameter table with vintage, since IRA guidance evolves; the copilot routes users to the CDR/BECCS modules for non-industrial capture per the §7.5 pointer.

**Prerequisites.** Copilot infrastructure (Phase 1); route extraction for tier 2. **Acceptance:** every $/t figure matches page state or a logged tool call; purity-cost explanations reference the actual `purity` field of the named source row.