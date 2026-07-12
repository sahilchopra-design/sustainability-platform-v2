## 7 · Methodology Deep Dive

The Carbon Capture Finance module models CCUS project economics broadly in line with its guide (capture
cost by technology, 45Q credits, carbon-market revenue, payback/NPV). The technology parameters are real;
the project instances and several derived quantities are synthetic or heuristic — the NPV/IRR treatment is
below investor grade, so §8 specifies the production model.

### 7.1 What the module computes

For 40 synthetic CCUS projects, revenue-and-return economics:

```js
captureCost  = tech.costRange[0] + sr·(range)          // $/tCO2, bounded by technology
capex        = captureRate × captureCost × 0.12 + sr·50 // $M  (heuristic 0.12 scalar)
opex         = captureRate × captureCost × 0.04 + sr·5   // $M/yr (heuristic 0.04 scalar)
creditRevenue= captureRate × carbonPx / 1000            // carbonPx = $80/t baseline
eorPremium   = storage==='EOR' ? captureRate × 30/1000 : 0   // $30/t EOR uplift
q45Credit    = region==='North America' ? captureRate × 85/1000 : 0  // 45Q $85/t geologic
totalRevenue = creditRevenue + eorPremium + q45Credit
annualNet    = totalRevenue − opex
payback      = capex / annualNet
npv20        = annualNet × 12 − capex + sr·10           // ⚠ NOT discounted
irr          = 8 + (annualNet/capex)×80 + sr·8          // heuristic, not a real IRR solve
```

A separate `npvSensitivity` panel *does* discount properly:
`npv = annNet × (1 − (1+r)^−20)/r − capex` (20-yr annuity present-value), and a `costTrajectory` applies
learning-curve cost declines by technology to 2050.

### 7.2 Parameterisation

**Technology cost/readiness** (`TECH_TYPES` — provenance: IEA CCUS / DAC cost ranges, real):

| Tech | Capture cost $/tCO₂ | TRL | CO₂ purity |
|---|---|---|---|
| Post-Combustion | 50–100 | 9 | 99% |
| Pre-Combustion | 40–80 | 8 | 98% |
| Oxyfuel | 55–90 | 7 | 99.5% |
| BECCS | 80–150 | 6 | 98% |
| DAC (solid sorbent) | 200–400 | 6 | 99.9% |
| DAC (liquid solvent) | 300–600 | 5 | 99.9% |

These ranges match published IEA figures (DAC $300–600/t; point-source $50–100/t). **Policy constants are
real**: 45Q geologic-storage credit **$85/tCO₂**, EOR premium **$30/t**, baseline carbon price **$80/t**.

**Per-project draws are synthetic** (`sr()`): technology, region, storage type, capture rate
(50–1000 ktCO₂/yr), and the noise on capex/opex/NPV. The capex scalar (0.12) and opex scalar (0.04) are
**heuristic** — they make capex ≈ 12% of lifetime capture-cost×rate, which has no cited basis.

### 7.3 Calculation walkthrough

Each project: pick a technology (sets cost range + TRL), draw a capture rate, compute a per-tonne cost →
heuristic capex/opex → revenue from carbon credit + EOR (if EOR storage) + 45Q (if North America) → net
of opex → payback and an undiscounted `npv20`. The IRR is a heuristic mapping of the net-revenue/capex
ratio, not a root-solve of the cash-flow series. The `npvSensitivity` tab re-runs a proper discounted
20-year annuity across a carbon-price grid, so the module *contains* a correct DCF but does not use it for
the headline per-project `npv20`.

### 7.4 Worked example (one North American DAC project)

Tech = Post-Combustion (cost range 50–100), `captureCost = 75 $/t`, `captureRate = 500 ktCO₂/yr`,
region = North America, storage = Saline Aquifer:
- `capex = 500 × 75 × 0.12 = $4,500M` (+noise) — note this is very large because the scalar multiplies
  *annual* capture rate by per-tonne cost; a modelling artefact.
- `opex = 500 × 75 × 0.04 = $1,500M/yr`.
- `creditRevenue = 500 × 80 / 1000 = $40M/yr`; `q45Credit = 500 × 85 / 1000 = $42.5M/yr`; EOR = 0.
- `totalRevenue = $82.5M/yr`; `annualNet = 82.5 − 1500 = −$1,417.5M/yr` → `payback = 99` (sentinel),
  `npv20 = −1417.5×12 − 4500 < 0`.

The negative economics here expose the heuristic-scalar problem: opex at 4% of `rate×cost` (=$1.5bn/yr)
dwarfs revenue. A production model (see §8) would size capex/opex from $/tonne-of-*capacity* and per-tonne
opex, not from `rate×cost×scalar`.

### 7.5 Companion analytics

- **Cost trajectory** — learning-curve declines to 2050 (post-combustion 75→~50, DAC-liquid 450→~180),
  directionally consistent with IEA DAC cost projections.
- **NPV sensitivity** — proper discounted annuity across carbon prices $40–200/t and a discount-rate input.

### 7.6 Data provenance & limitations

- **Technology cost ranges, TRLs, 45Q ($85/t), EOR ($30/t), and carbon baseline ($80/t) are real**; all
  per-project instances are synthetic (`sr(seed)=frac(sin(seed+1)×10⁴)`).
- The headline `npv20` is **undiscounted** and `irr` is a heuristic — neither is investor-grade; the
  capex/opex heuristics can produce implausible economics (§7.4).
- No project financing structure (debt/equity, DSCR), no permanence/leakage discount on CDR credits, no
  transport & storage cost separation.

**Framework alignment:** IEA *CCUS in Clean Energy Transitions* — technology cost ranges and the DAC vs
point-source split · US IRA §45Q — the $85/t geologic and (guide-referenced) $180/t DAC credit values ·
Global CCS Institute — capacity context (49 MtCO₂/yr operational) · SBTi CDR guidance — the permanence/CDR
credit-quality dimension named in the guide but not yet scored. See §8 for the production project-finance
model.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The per-project NPV/IRR is undiscounted/heuristic;
this specifies a proper CCUS project-finance model.

### 8.1 Purpose & scope
Value point-source CCS, BECCS, and DAC projects on a discounted-cash-flow basis with policy incentives,
carbon-market revenue, transport & storage costs, and permanence-adjusted CDR credit value, for developers
and infrastructure investors. Output: levelised cost of capture (LCOC), project NPV, equity IRR, DSCR.

### 8.2 Conceptual approach
Standard infrastructure project-finance DCF with a technology learning curve, benchmarked against IEA CCUS
cost models and Global CCS Institute project economics; credit revenue modelled on NGFS/IEA carbon-price
paths (as in `carbon-adjusted-valuation`). LCOC follows the levelised-cost formalism (as used for LCOE),
so projects are comparable per tonne.

### 8.3 Mathematical specification

```
LCOC   = [CRF·CAPEX + OPEX_fixed] / (CaptureRate·CF) + OPEX_var·(1/CF)   $/tCO2
CRF    = r(1+r)^n / ((1+r)^n − 1)                     capital recovery factor, n = life
Rev_t  = CaptureRate·CF·[ P_carbon,t·(1−leak) + 45Q_t + EOR_t − T&S_cost ]
FCF_t  = Rev_t − OPEX_t − Tax_t
NPV    = Σ_t FCF_t/(1+r)^t − CAPEX
IRR    : Σ_t FCF_t/(1+IRR)^t = CAPEX
DSCR_t = CFADS_t / DebtService_t
```

| Parameter | Symbol | Source |
|---|---|---|
| CAPEX ($/t-yr capacity) | — | IEA CCUS / GCCSI cost curves by tech |
| Fixed/var OPEX | OPEX | IEA (energy penalty, solvent, labour) |
| Capacity factor | CF | 0.85–0.95 (operational data) |
| 45Q credit | 45Q | $85/t geologic, $180/t DAC (IRA) |
| Carbon price path | P_carbon | NGFS Phase IV / IEA NZE |
| Permanence leakage | leak | geologic ~0.1%/100yr; buffer per methodology |
| Discount rate | r | project WACC 7–10% |
| T&S cost | — | $10–20/t (pipeline) per GCCSI |

### 8.4 Data requirements
Per project: technology, gross/net capture capacity, energy penalty, CAPEX/OPEX build-up, storage type &
T&S cost, region (for 45Q eligibility), financing structure. Platform holds tech cost ranges, 45Q/EOR
constants, and a discounted-annuity routine (`npvSensitivity`); missing: capacity-basis CAPEX, energy
penalty, financing terms, real project data.

### 8.5 Validation & benchmarking plan
Reconcile LCOC against IEA published capture costs per technology (±15%). Backtest revenue vs realised 45Q
uptake and EU ETS/voluntary prices. Sensitivity/tornado on carbon price, discount rate, CF, energy penalty.
Cross-check equity IRR against announced CCUS FID economics (e.g. Northern Lights, Stratos DAC).

### 8.6 Limitations & model risk
Energy penalty and T&S cost are the swing variables — conservative fallback uses high-end IEA OPEX and
$20/t T&S. DAC economics are pre-commercial (TRL 5–6) so cost estimates carry wide error bars; flag TRL and
present ranges, not point NPVs. Permanence risk on CDR credits must reduce sellable volume, not just price.
