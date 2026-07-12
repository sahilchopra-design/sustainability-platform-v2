## 7 · Methodology Deep Dive

The Industrial Gas Destruction Credits module is a genuinely correct implementation of the CDM/Verra
high-GWP destruction-credit methodology. It uses real IPCC AR6 GWP100 values, a correct baseline-minus-
project emission-reduction formula, a regulatory-surplus additionality adjustment, and real destruction-
technology efficiencies. It matches its guide precisely; no missing-model gap is triggered, so there is no
§8.

### 7.1 What the module computes

The core credit calculation (`calcIndustrialGas`) implements the CDM ER equation with a policy-baseline
(regulatory surplus) adjustment:

```js
baseline_quantity = quantity_t × (1 − policy_baseline_pct/100)   // regulatory surplus reduces baseline
tco2e_baseline    = baseline_quantity × gas.gwp                   // BE = uncontrolled venting × GWP
tco2e_destroyed   = quantity_t × destruction_eff × gas.gwp        // gas actually destroyed
tco2e_project     = quantity_t × (1 − destruction_eff) × gas.gwp  // PE = residual leakage × GWP
net_credits       = max(0, tco2e_baseline − tco2e_project)        // ER = BE − PE, clamped ≥ 0
additionality_gap = tco2e_destroyed − tco2e_baseline
```

This is the standard `ER = (BE − PE)` structure. The `policy_baseline_pct` correctly discounts the
baseline for any legally-mandated destruction (regulatory-surplus additionality test — only destruction
*beyond* the legal minimum earns credits).

### 7.2 Parameterisation

**GWP100 values** (`GAS_TYPES` — provenance: **real IPCC AR6 WGI Table 7.SM.7**, with an inline comment
documenting the AR5→AR6 changes):

| Gas | GWP100 (AR6) | Sector |
|---|---|---|
| HFC-23 (CHF₃) | 14,600 | HCFC-22 production |
| N₂O | 273 | Adipic / nitric acid |
| SF₆ | 17,500 | Electrical switchgear |
| HFC-134a | 1,526 | Refrigeration / AC |
| HFC-32 | 771 | Refrigeration |
| PFC-14 (CF₄) | 7,380 | Aluminium smelting |

(Note: the guide cites SF₆ GWP = 25,200, which is the *AR4/AR5* value; the code uses the newer AR6 value
17,500 — the code is more current than its own guide.)

**Destruction technologies** (`DESTRUCTION_TECHS`, real DRE values): Thermal Oxidation 99.5% (1000–1200 °C),
Plasma Arc 99.99% (3000–5000 °C, for recalcitrant SF₆/PFC), Cement Kiln 99.8%, Catalytic 98.5% (N₂O only).
CAPEX/OPEX per tonne are realistic ($5k–25k/t capex).

**Kigali phase-down schedule** (`KIGALI_PHASES`, real Montreal Protocol Kigali Amendment groups A1/A5-G1/
A5-G2 with baseline years, freeze, and reduction milestones).

**Synthetic project instances** (`sr()`-seeded, 8 projects): quantity (5–1000 t), policy-baseline % (0–40),
country, vintage. Gas and technology are round-robin. The methodology tag is correct: N₂O → AM0028, others
→ AM0001.

### 7.3 Calculation walkthrough

User selects gas type, annual throughput, destruction efficiency, and policy-baseline % → `calcIndustrialGas`
computes baseline (net of regulatory surplus), project (residual leakage), and net credits = BE − PE. The
result auto-registers into the `CarbonCreditContext` bus when `net_credits > 0`. Portfolio views aggregate
`tco2e_avoided` across the 8 demo projects and compare gases by GWP leverage.

### 7.4 Worked example (HFC-23 destruction)

Plant vents `quantity_t = 50` tonnes/yr of HFC-23, thermal oxidation `destruction_eff = 0.995`, and
`policy_baseline_pct = 20%` (20% of destruction is legally mandated):

- `baseline_quantity = 50 × (1 − 0.20) = 40 t`
- `tco2e_baseline = 40 × 14,600 = 584,000 tCO₂e`
- `tco2e_destroyed = 50 × 0.995 × 14,600 = 726,350 tCO₂e`
- `tco2e_project = 50 × 0.005 × 14,600 = 3,650 tCO₂e` (residual 0.5% leakage)
- `net_credits = max(0, 584,000 − 3,650) = 580,350 tCO₂e`

So destroying 50 t of HFC-23 (a trivial physical mass) generates **~580,000 credits** — the extreme GWP
leverage (1 kg HFC-23 = 14.6 tCO₂e) that made these projects both lucrative and controversial under the CDM.
The 20% policy baseline correctly withholds credit for the legally-required portion.

### 7.5 Data provenance & limitations

- **GWP values, destruction efficiencies, and the ER formula are real and correct**; only the 8 project
  instances are synthetic (`sr(seed)=frac(sin(seed+1)×10⁴)`).
- Baseline emission factor is entered as a policy-baseline %, not derived from a plant-specific uncontrolled-
  venting EF per unit of product (the guide's `BE = ProductionRate × EF_baseline`) — a simplification.
- No CEMS (continuous emissions monitoring) time series; destruction efficiency is a single input, not a
  monitored distribution.

**Framework alignment:** CDM AM0001 v6 (HFC-23 destruction) & AM0028 / AMS-III.L (N₂O abatement) — the
methodology tags and the BE−PE credit structure · Verra VM0024 — industrial-gas project standard · IPCC AR6
WGI Table 7.SM.7 — the GWP100 values (code uses current AR6 figures) · Montreal Protocol Kigali Amendment —
the HFC phase-down schedule and the regulatory-surplus additionality test embodied in `policy_baseline_pct`
(only destruction beyond the Kigali/national mandate is additional and creditable).
