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
