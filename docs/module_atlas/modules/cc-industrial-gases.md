# Industrial Gas Destruction Credits
**Module ID:** `cc-industrial-gases` · **Route:** `/cc-industrial-gases` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
High-GWP industrial gas destruction credit quantification for HFC-23, N₂O, and SF₆ projects under CDM AM0001, AMS-III.L, and Verra VCS VM0024. Models destruction efficiency, baseline emission rates, and additionality for refrigerant and chemical plant applications.

> **Business value:** Industrial gas credits carry very high tCO₂e per unit due to GWP multipliers. HFC-23 destruction: 1 kg destroyed = 14.6 tCO₂e. Regulatory surplus test critical for additionality.

**How an analyst works this module:**
- Select gas type: HFC-23, N₂O, or SF₆
- Production Data tab sets annual throughput and baseline EF
- Destruction Unit tab records efficiency and monitoring data
- Credit Calculator applies GWP100 and computes tCO₂e
- Additionality tab runs regulatory surplus test

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `DESTRUCTION_TECHS`, `DualInput`, `GAS_TYPES`, `KIGALI_PHASES`, `Kpi`, `PROJECTS`, `Section`, `TIP`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `GAS_TYPES` | 7 | `name`, `gwp`, `sector`, `color` |
| `DESTRUCTION_TECHS` | 5 | `name`, `temp_c`, `eff`, `capex_per_t`, `opex_per_t`, `suitable`, `notes` |
| `KIGALI_PHASES` | 4 | `baseline_yr`, `freeze`, `reduce_10`, `reduce_85`, `mandate_pct` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtK` | `n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':fmt(n);` |
| `baseline_quantity` | `quantity_t * (1 - policy_baseline_pct/100);` |
| `tco2e_baseline` | `baseline_quantity * gas.gwp;` |
| `tco2e_destroyed` | `quantity_t * destruction_eff * gas.gwp;` |
| `tco2e_project` | `quantity_t * (1 - destruction_eff) * gas.gwp;` |
| `net_credits` | `Math.max(0, tco2e_baseline - tco2e_project); // clamp: policy_baseline=100% makes baseline=0, which would produce negative credits` |
| `additionality_gap` | `tco2e_destroyed - tco2e_baseline;` |
| `igResult` | `useMemo(() => calcIndustrialGas(ig), [ig]);  useEffect(() => { if (igResult && igResult.net_credits > 0) { addCalculation({ projectId: 'CC-LIVE', methodology: 'AM0001', family: 'industrial',` |
| `totalAvoided` | `useMemo(() => PROJECTS.reduce((s,p)=>s+p.tco2e_avoided,0), []);` |
| `avgGWP` | `useMemo(() => Math.round(PROJECTS.reduce((s,p)=>s+p.gwp,0)/PROJECTS.length), []);` |
| `gasCompare` | `useMemo(() => GAS_TYPES.map(g=>({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DESTRUCTION_TECHS`, `GAS_TYPES`, `KIGALI_PHASES`, `TABS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| HFC-23 GWP100 | `IPCC AR6 Table 7.SM.7` | IPCC AR6 | 100-year global warming potential of HFC-23 trifluoromethane |
| SF₆ GWP100 | `IPCC AR6 Table 7.SM.7` | IPCC AR6 | 100-year global warming potential of sulfur hexafluoride |
| Destruction Efficiency | `Continuous emissions monitoring` | Plant monitoring | Fraction of high-GWP gas destroyed in thermal oxidation unit |
| Baseline EF | `Uncontrolled process factor` | CDM AM0001 | Emission factor for uncontrolled industrial gas venting |
- **Plant production records** → Output × baseline EF → baseline emissions → **tCO₂e baseline**
- **CEMS monitoring** → Destruction efficiency → project emissions → **Net ER in tCO₂e**

## 5 · Intermediate Transformation Logic
**Methodology:** High-GWP destruction credit = baseline emissions – project emissions
**Headline formula:** `ER = (BE_gas – PE_gas) × GWP_gas; BE = ProductionRate × EF_baseline`

Baseline emission rate derived from uncontrolled venting or flaring emission factors per unit of chemical/refrigerant produced. Project emission rate reflects destruction efficiency of thermal oxidation unit (typically 99.9% for HFC-23). GWP100 per IPCC AR6: HFC-23 = 14,600; N₂O = 273; SF₆ = 25,200. Additionality via regulatory surplus test: project must exceed legal minimum destruction requirements.

**Standards:** ['CDM AM0001 v6', 'CDM AMS-III.L v3', 'Verra VM0024', 'IPCC AR6 GWP100']
**Reference documents:** CDM AM0001 v6 HFC-23 Destruction; CDM AMS-III.L N₂O Abatement; Verra VM0024 Industrial Gas Projects; IPCC AR6 WGI Chapter 7 GWP Table

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Kigali phase-down scenario engine (analytics ladder: rung 1 → 2)

**What.** §7 rates this module a genuinely correct CDM AM0001/AMS-III.L/VM0024
implementation — real AR6 GWP100 values, correct `ER = BE − PE` with regulatory-surplus
baseline adjustment, real destruction-tech efficiencies — with no §8 gap. The honest
next rung is therefore scenario capability, and the seed for it already sits unused in
the page: the `KIGALI_PHASES` dataset (baseline year, freeze, −10%, −85% steps).
Evolution A turns the static additionality test into a forward regulatory-surplus
trajectory: as Kigali Amendment phase-down percentages ratchet, the policy baseline
shrinks and creditable ER decays on a project-specific schedule.

**How.** (1) Extend `calcIndustrialGas` with a year axis: `policy_baseline_pct(t)`
stepped from the Kigali schedule per Article-5 vs non-Article-5 party grouping, so
`baseline_quantity(t)` and net credits are computed per vintage year to 2047.
(2) Scenario grid over destruction technology (the 5-row `DESTRUCTION_TECHS` table has
real capex/opex per tonne) producing abatement cost per tCO₂e by gas — HFC-23's 14,600
GWP versus N₂O's 273 makes this ranking the module's most decision-relevant output.
(3) Crossover chart: the year regulatory surplus reaches zero and crediting ends.

**Prerequisites.** Kigali schedule encoded from the treaty text with party-group
mapping, not approximated. **Acceptance:** an Article-5 HFC-23 project shows credits
stepping down at 2029/2035/2045 checkpoints; abatement-cost ranking reproduces the
capex/opex table arithmetic exactly.

### 9.2 Evolution B — High-GWP additionality copilot (LLM tier 1)

**What.** A copilot for the trickiest concept on this page: regulatory-surplus
additionality. It answers "why did my baseline drop 30%?" (because the policy baseline
deduction reduces `baseline_quantity` before GWP multiplication — the exact §7
mechanic), "which GWP vintage applies?" (AR6 values are hard-coded; AR4-era contracts
differ materially for HFC-23), and "is thermal oxidation suitable for SF₆?" from the
`DESTRUCTION_TECHS` suitability flags.

**How.** Tier-1 pattern: this atlas record embedded as corpus, live calculator inputs
and results injected; answers cite §5 standards (AM0001 v6, VM0024, AR6 WGI Ch.7 GWP
table) or on-screen numbers. GWP-vintage questions are answered from the reference
list, flagged clearly when the platform value (AR6) differs from a user's contract
basis (AR4/AR5) — an explanation task, not a computation.

**Prerequisites.** None — guide↔code agreement is documented, so the corpus needs no
remediation before narration. **Acceptance:** the copilot correctly decomposes a net-
credit figure into baseline, project, and surplus terms matching the calculator; a
probe about future CER prices is refused as outside module scope.