# Improved Forest Management Credits
**Module ID:** `cc-ifm-credits` · **Route:** `/cc-ifm-credits` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Carbon credit quantification for Improved Forest Management (IFM) projects including extended rotation, reduced harvest, and conservation easements under Verra VCS VM0010/VM0012 and Climate Action Reserve Forest Protocol.

> **Business value:** Net IFM credits = (project – baseline C stock) – leakage – buffer. Extended rotation projects typically yield 1.5–4 tCO₂e/ha/yr net.

**How an analyst works this module:**
- Select IFM type: extended rotation, reduced harvest, or conservation
- Forest Growth Model tab shows baseline vs project stock trajectories
- Leakage Assessment tab quantifies activity-shifting deductions
- Buffer Calculation applies non-permanence risk rating
- Credit Schedule shows annual issuance to project end date

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `DualInput`, `HARVEST_SCHEDULE`, `IFM_TYPES`, `Kpi`, `PROJECTS_IFM`, `Section`, `TIP`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `IFM_TYPES` | 5 | `name`, `desc`, `default_harvest_reduction` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtK` | `n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':fmt(n);` |
| `bl_cs` | `initial_cs + annual_increment * t - harvest_rate_bl * t * cf;` |
| `pj_cs` | `initial_cs + annual_increment * t - harvest_rate_pj * t * cf;` |
| `cs_diff` | `(pj_cs - bl_cs); // tCO2e per ha difference` |
| `gross` | `Math.max(0, cs_diff * area_ha * (44/12));` |
| `mkt_leak` | `gross * (leakage_mkt_pct / 100);` |
| `act_leak` | `gross * (leakage_act_pct / 100);` |
| `total_leak` | `mkt_leak + act_leak;` |
| `after_leak` | `gross - total_leak;` |
| `buffer` | `after_leak * (buffer_pct / 100);` |
| `pre_unc` | `after_leak - buffer;` |
| `uncertainty_ded` | `pre_unc * (1 - uncertainty_factor); // VM0010: uncertainty deduction = (1 - UF)` |
| `net` | `Math.max(0, pre_unc - uncertainty_ded); // ≡ pre_unc × UF but expressed as explicit deduction` |
| `prior_cumulative` | `years.length > 0 ? years[years.length-1].cumulative : 0;` |
| `cumulative` | `prior_cumulative + net; // true running sum` |
| `result` | `useMemo(() => calcIFM(params), [params]);  useEffect(() => { if (result && result.total > 0) { addCalculation({ projectId: 'CC-LIVE', methodology: 'VM0010', family: 'nature',` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `IFM_TYPES`, `TABS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Baseline C Stock | `Forest growth model` | Yield tables / FVS | Carbon stock under business-as-usual harvest schedule |
| Project C Stock | `Extended rotation model` | Verra VM0010 | Carbon stock under improved management regime |
| Leakage Belt | `Activity-shifting analysis` | VM0010 guidance | Geographic area within which harvest displacement leakage is assessed |
| Buffer Pool % | `Non-permanence risk rating` | CAR Forest Protocol | Share of gross credits withheld for reversal insurance |
- **Yield table / FVS model** → Growth equations → carbon stock → **tCO₂e/ha by year**
- **Activity-shifting model** → Leakage belt harvest data → leakage deduction → **Net IFM credits**

## 5 · Intermediate Transformation Logic
**Methodology:** VM0010 IFM baseline-project carbon stock difference
**Headline formula:** `ER = (C_project – C_baseline) – Leakage – BufferContribution`

Baseline carbon stock modeled using forest growth and yield equations calibrated to local yield tables or FVS model runs. Project carbon stock reflects changed management (extended rotation adds 15–30% standing stock over 20 yr). Leakage via activity-shifting: harvesting displaced to other forests within leakage belt. Buffer pool from CAR/VCS non-permanence risk rating (typically 12–18% for temperate managed forests).

**Standards:** ['Verra VCS VM0010 v1.3', 'VM0012 v1.2', 'CAR Forest Protocol v4', 'IPCC LULUCF']
**Reference documents:** Verra VCS VM0010 v1.3 IFM; Verra VCS VM0012 v1.2 IFM; Climate Action Reserve Forest Protocol v4.1; USFS Forest Vegetation Simulator (FVS)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

Guide and code align: a Verra VCS VM0010 Improved Forest Management model computing the
project-minus-baseline carbon-stock difference, then deducting market + activity leakage, buffer,
and uncertainty. The calculator is real; the 10-project registry is synthetic.

### 7.1 What the module computes

`calcIFM(params)` steps year-by-year (lines ~35–58):

```js
bl_cs   = initial_cs + annual_increment×t − harvest_rate_bl×t×cf     // baseline stock trajectory
pj_cs   = initial_cs + annual_increment×t − harvest_rate_pj×t×cf     // project (reduced harvest)
cs_diff = pj_cs − bl_cs                                              // tCO2e/ha stock advantage
gross   = max(0, cs_diff × area_ha × (44/12))
mkt_leak + act_leak = gross × (leakage_mkt_pct + leakage_act_pct)/100
after_leak = gross − total_leak
buffer     = after_leak × buffer_pct/100
pre_unc    = after_leak − buffer
uncertainty_ded = pre_unc × (1 − uncertainty_factor)                 // VM0010: deduction = (1 − UF)
net        = max(0, pre_unc − uncertainty_ded)   ≡ pre_unc × UF
cumulative = prior_cumulative + net                                  // running sum
```

The `uncertainty_factor` (UF, default 0.90) is applied as an explicit `(1 − UF)` deduction — the
comment correctly notes `net ≡ pre_unc × UF`.

### 7.2 Parameterisation

| Parameter | Default | Provenance |
|---|---|---|
| `initial_cs` | 180 tCO₂e/ha | Standing stock of a managed temperate forest |
| `annual_increment` | 3.2 tCO₂e/ha/yr | Forest growth increment |
| `harvest_rate_bl` / `harvest_rate_pj` | 4.5 / 1.5 tC/ha/yr | Baseline vs reduced-harvest regimes |
| `cf` | 0.47 | IPCC carbon fraction of dry matter |
| `leakage_mkt_pct` | 20% | VM0010 market-leakage default (timber demand shifts elsewhere) |
| `leakage_act_pct` | 10% | Activity-shifting leakage |
| `buffer_pct` | 15% | AFOLU Non-Permanence Risk rating; temperate managed 12–18% |
| `uncertainty_factor` | 0.90 | Measurement UF (10% deduction) |
| `crediting_yrs` | 30 | VM0010 crediting period |
| IFM types | RIL, Extended Rotation, Harvest Deferral, Conservation Area | `IFM_TYPES` (4 activity types) |

### 7.3 Calculation walkthrough

1. Baseline and project stock trajectories diverge because `harvest_rate_pj < harvest_rate_bl`; the
   growing gap `cs_diff` is the sequestration advantage.
2. Per-hectare stock advantage × area × 44/12 → gross removal (floored at 0).
3. Market + activity leakage deducted, then buffer withholding, then the uncertainty deduction.
4. Net accumulates into `cumulative`; headline `total` is the final year.
5. Result pushed to `CarbonCreditContext` as methodology `VM0010`, family `nature`.

### 7.4 Worked example

Defaults: area 50,000 ha, harvest_bl 4.5, harvest_pj 1.5, cf 0.47, mkt leak 20%, act leak 10%,
buffer 15%, UF 0.90. Year t = 30:

| Step | Computation | Result |
|---|---|---|
| Stock difference | (4.5 − 1.5) × 30 × 0.47 | 42.3 tCO₂e/ha |
| Gross | 42.3 × 50,000 × 3.667 | 7.76 Mt |
| After leakage (−30%) | 7.76 × 0.70 | 5.43 Mt |
| After buffer (−15%) | 5.43 × 0.85 | 4.62 Mt |
| Net (×UF 0.90) | 4.62 × 0.90 | **≈4.15 Mt** |

### 7.5 Data provenance & limitations

- **Calculator is a real VM0010 model; the 10 `PROJECTS_IFM` and harvest schedule are synthetic**
  (PRNG `sr(seed)=frac(sin(seed+1)×10⁴)`).
- **Accounting subtlety (as in cc-arr-reforestation):** `cs_diff` is the *cumulative* stock gap at
  year t, yet `net` (the full year-t gap after deductions) is *summed* into `cumulative`. Rigorous
  VM0010 credits the *annual increment* in the stock difference, not the repeated full gap; summing
  full gaps overstates cumulative issuance. Flagged for validation.
- Baseline is a linear stock trajectory, not an FVS/yield-table growth-and-yield model.
- Buffer % is a slider, not a live AFOLU Non-Permanence Risk Tool score; leakage belt geography is
  not modelled (fixed % deductions).

**Framework alignment:** Verra VCS **VM0010 / VM0012** (IFM stock-difference accounting; the
market + activity leakage split and the `(1 − UF)` uncertainty deduction are methodology-specific) ·
**CAR Forest Protocol v4** (buffer pool from non-permanence risk) · **IPCC LULUCF** (0.47 carbon
fraction, 44/12 CO₂ conversion). In production, baseline and project stocks come from USFS FVS growth
simulation calibrated to inventory plots; the module replaces this with two linear harvest-adjusted
trajectories.

## 9 · Future Evolution

### 9.1 Evolution A — Nonlinear growth curves calibrated to yield tables (analytics ladder: rung 1 → 3)

**What.** §7 shows `calcIFM` is a faithful VM0010 pipeline (stock difference → market +
activity leakage → buffer → uncertainty deduction `net ≡ pre_unc × UF`), but both stock
trajectories are straight lines: `cs = initial + annual_increment×t − harvest_rate×t×cf`.
Real forests do not grow linearly over a 20–40 year crediting period, and the guide
itself cites FVS and local yield tables as the intended basis. Evolution A replaces the
linear increment with fitted growth functions (Chapman-Richards or von Bertalanffy) per
forest type, parameterised from published yield tables (USFS FIA for North America, the
CAR Forest Protocol assessment-area data the §5 reference list already names).

**How.** (1) `ref_forest_growth_params(forest_type, region, curve_params, mai_peak,
source)` reference table; the Forest Growth Model tab plots the fitted curve against
the current linear one so the change is auditable. (2) Age-dependent harvest scheduling
replaces constant `harvest_rate×t`, making extended-rotation projects (the module's
headline IFM type) show the characteristic late-rotation stock divergence. (3) The
uncertainty factor becomes a function of the growth-curve fit error rather than a flat
0.90 default.

**Prerequisites.** Yield-table licensing/attribution; the synthetic 10-project registry
labelled as demo fixtures. **Acceptance:** a 40-year extended-rotation run shows
nonlinear divergence (not a constant wedge); a bench case with known Chapman-Richards
parameters reproduces published MAI within 5%.

### 9.2 Evolution B — IFM structuring copilot (LLM tier 1 → 2)

**What.** A copilot that explains the deduction waterfall the engine actually computes
— "why did 100k gross tonnes become 61k net?" answered by walking gross → leakage →
buffer → uncertainty with the live numbers — and runs structuring what-ifs ("reduce
harvest 30% instead of 20%", "assume 18% buffer for fire-prone temperate") by
re-invoking `calcIFM` client-side, since the module exposes no backend endpoints.

**How.** Tier 1: this atlas page (§5 VM0010/VM0012/CAR standards, §7 waterfall) as RAG
corpus with page state injected. Tier 2: a tool schema over `calcIFM(params)`; the
validator requires every tCO₂e figure in an answer to match a logged invocation.
Buffer-rating questions answer from the CAR/VCS non-permanence rubric text, and the
copilot must refuse credit-price or offtake questions (not computed here).

**Prerequisites.** None hard for tier 1 — guide and code agree per §7, so the corpus
is trustworthy; Evolution A improves what-if realism but does not block. **Acceptance:**
the waterfall explanation reconciles exactly to on-screen figures; an adversarial
"what will these credits sell for?" yields a refusal citing module scope.