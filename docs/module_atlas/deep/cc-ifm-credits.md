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
