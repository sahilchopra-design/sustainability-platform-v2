# Landfill & Wastewater Methane Credits
**Module ID:** `cc-landfill-wastewater` · **Route:** `/cc-landfill-wastewater` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Methane capture and destruction credit quantification for landfill gas (LFG) and wastewater treatment plants under CDM ACM0001, AMS-III.G, and EPA Landfill Methane Outreach Program. Models first-order decay, gas collection efficiency, and methane oxidation.

> **Business value:** Annual ER = collected CH₄ × (1–oxidation fraction) × GWP100. Collection efficiency and L₀ are primary uncertainty drivers; combined CV typically 15–25%.

**How an analyst works this module:**
- Select waste facility type: municipal landfill or wastewater plant
- Waste Data tab inputs waste-in-place and composition
- Gas Generation Model shows first-order decay curve
- Collection System tab sets efficiency and flaring/utilization split
- Credit Calculator computes annual tCO₂e with uncertainty discount

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `DualInput`, `Kpi`, `PROJECTS`, `Section`, `TIP`, `TabBar`, `WASTE_FRACTIONS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `WASTE_FRACTIONS` | 7 | `name`, `doc`, `k`, `share_default`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtK` | `n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':fmt(n);` |
| `ch4_captured` | `ch4_gen * collection_eff;` |
| `ch4_destroyed` | `ch4_captured * destruction_eff;` |
| `tco2e` | `ch4_destroyed / 1000 * 27.2; // IPCC AR6 WGI Table 7.SM.7: CH4 GWP100 = 27.2 (fossil); AR5 value 28 retired` |
| `net` | `tco2e * (1 - buffer_pct/100);` |
| `ch4_bl` | `organic_load * b0 * mcf_bl * 365 / 1000; // tonnes CH4/yr` |
| `ch4_pj` | `organic_load * b0 * mcf_pj * (1 - capture_eff) * 365 / 1000;` |
| `ch4_avoided` | `ch4_bl - ch4_pj;` |
| `tco2e_bl` | `ch4_bl * 27.2; // IPCC AR6 CH4 GWP100 = 27.2 (fossil)` |
| `tco2e_pj` | `ch4_pj * 27.2;` |
| `gross` | `ch4_avoided * 27.2;` |
| `total` | `Object.values(next).reduce((a,b)=>a+b,0);` |
| `docWeighted` | `useMemo(() => { return WASTE_FRACTIONS.reduce((s,w)=>s + w.doc * (shares[w.id]\|\|0), 0);` |
| `fodData` | `useMemo(() => calcFOD({...fod, doc_weighted:docWeighted}), [fod, docWeighted]); const fodTotal = useMemo(() => fodData.length > 0 ? fodData[fodData.length-1].cumulative : 0, [fodData]);` |
| `fodPeak` | `useMemo(() => fodData.reduce((mx,d)=>d.net>mx?d.net:mx, 0), [fodData]);` |
| `wwResult` | `useMemo(() => calcWastewater(ww), [ww]);  /* Aggregate KPIs */ const totalAvoided = useMemo(() => PROJECTS.reduce((s,p)=>s+p.ch4_avoided_tco2e,0), []);` |
| `landfillCount` | `useMemo(() => PROJECTS.filter(p=>p.type==='Landfill').length, []);  /* Gas collection calcs */ const gcCalcs = useMemo(() => { const area_per_well = Math.PI * (gc.well_spacing_m/2)**2;` |
| `wells_per_ha` | `10000 / area_per_well;` |
| `extraction_rate` | `gc.flow_m3h * gc.suction_kpa * 0.6; // simplified` |
| `ch4_content` | `0.50; // typical 50% CH4` |
| `ch4_flow` | `gc.flow_m3h * ch4_content;` |
| `energy_mwh` | `ch4_flow * 9.97 / 1000; // MWh thermal approx` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`, `WASTE_FRACTIONS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| L₀ (Methane Potential) | `DOC × DOCf × MCF × F` | IPCC 2019 Waste | Methane generation potential per tonne of waste in place |
| First-Order Decay k | `Climate-dependent rate constant` | IPCC / EPA AP-42 | Decay constant; higher in wet tropical climates |
| Collection Efficiency | `Gas flow measurement` | Plant monitoring | Fraction of generated LFG collected before surface emission |
| GWP100 CH₄ | `IPCC AR6 Table 7.SM.7` | IPCC AR6 | 100-year global warming potential of methane |
- **Waste acceptance records** → Waste-in-place + composition → L₀ → **Methane generation potential**
- **Gas flow meters** → Collected gas volume → ER calculation → **Annual tCO₂e credits**

## 5 · Intermediate Transformation Logic
**Methodology:** First-order decay landfill methane generation
**Headline formula:** `Q_CH4(t) = L₀ × R × exp(-k×t); ER = Q_captured × (1–OxFrac) × GWP_CH4 × (1–Unc)`

Landfill methane generation follows first-order decay model: L₀ = waste-in-place × methane generation potential (DOC×DOCf×MCF×F×16/12). Collection efficiency typically 70–85% for active collection systems. Oxidation fraction at soil surface: 10% default (IPCC). GWP100 CH₄ = 29.8 (IPCC AR6). Uncertainty discount 5–10%. Wastewater: methane generation from COD removal × B₀ factor.

**Standards:** ['CDM ACM0001 v14', 'CDM AMS-III.G v8', 'EPA LMOP', 'IPCC 2019 Waste Volume']
**Reference documents:** CDM ACM0001 v14 Landfill Gas Recovery; CDM AMS-III.G Wastewater Methane; EPA LMOP Landfill Gas Energy Program; IPCC 2019 Refinement Waste Volume Ch.3

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (minor, quantitative).** The MODULE_GUIDES entry repeatedly
> states **GWP100 CH₄ = 29.8 (IPCC AR6)**. The code uses **27.2** everywhere (`ch4_destroyed/1000*27.2`,
> `ch4_bl*27.2`), which is the AR6 GWP100 for **fossil-origin** methane (Table 7.SM.7); 29.8 is the
> AR6 value for **non-fossil/biogenic** methane. Landfill and wastewater CH₄ is biogenic, so the
> guide's 29.8 is arguably the *more* defensible choice — the code is conservative by ~9%. The guide
> also names the primary standard as **ACM0001** and **AMS-III.G**; the code files the landfill
> calculation under `methodology:'ACM0001'` but labels the UI "AMS-III.G / AMS-III.H". Otherwise the
> code faithfully implements the described first-order-decay (FOD) landfill model and a COD/B₀
> wastewater model. Sections below document the code as written.

### 7.1 What the module computes

Two independent emission-reduction engines plus a gas-collection design calculator.

**FOD landfill gas** (`calcFOD`) — the IPCC 2019 first-order decay model, summed year by year:

```
CH4_gen(t) = Σ_{x=0}^{t-1} [ MCF · DOC_w · DOCf · F · waste_tpa · e^(−k(t−x)) · (1 − e^(−k)) ]
CH4_captured  = CH4_gen · collection_eff
CH4_destroyed = CH4_captured · destruction_eff
tCO2e(t)      = CH4_destroyed / 1000 · 27.2      // GWP100 fossil CH4
net(t)        = tCO2e(t) · (1 − buffer_pct/100)
```

**Wastewater** (`calcWastewater`) — B₀/MCF avoided-methane accounting:

```
CH4_bl = organic_load · B0 · MCF_bl · 365 / 1000      // t CH4/yr baseline (lagoon)
CH4_pj = organic_load · B0 · MCF_pj · (1 − capture_eff) · 365 / 1000
gross  = (CH4_bl − CH4_pj) · 27.2
net    = gross · (1 − buffer_pct/100)
```

### 7.2 Parameterisation / scoring rubric

| Constant | Value(s) | Provenance |
|---|---|---|
| GWP100 CH₄ | 27.2 | Code comment: IPCC AR6 WGI Table 7.SM.7, fossil CH₄ |
| DOCf (decomposable fraction) | 0.55 default | IPCC 2019 Waste default |
| F (CH₄ fraction of landfill gas) | 0.50 | IPCC default (managed anaerobic) |
| MCF (methane correction factor) | 0.60 default | IPCC — depends on site management |
| k (decay rate) | 0.02–0.06 per waste stream | `WASTE_FRACTIONS` (food 0.06, paper 0.04, wood 0.02) — IPCC/AP-42 climate-dependent |
| DOC per fraction | 0.15–0.44 | `WASTE_FRACTIONS`: paper 0.44, food 0.38, wood 0.43, textile 0.24 (IPCC Table) |
| collection_eff | 0.75 default | Plant monitoring; UI-adjustable |
| destruction_eff | 0.97 default | Flare/engine destruction efficiency |
| B₀ (wastewater) | 0.40 default | kg CH₄/kg COD max production capacity (IPCC 0.25 kg CH₄/kg BOD ↔ 0.6 COD) |
| MCF_bl / MCF_pj | 0.80 / 0.05 | Open anaerobic lagoon vs covered/aerated project |

The 10 portfolio `PROJECTS` (waste_tpa, ch4_avoided, collection_eff, buffer) are **synthetic**,
generated by `sr(seed)=frac(sin(seed+1)·10⁴)`.

### 7.3 Calculation walkthrough

`DOC_w` (weighted degradable organic carbon) is derived live from the composition sliders:
`DOC_w = Σ (DOC_fraction · share_fraction)`. This feeds `calcFOD`, whose inner loop accumulates
methane generation from all prior waste-acceptance cohorts under exponential decay. Collection and
destruction efficiencies convert generated → destroyed CH₄; ÷1000 converts kg→t; ×27.2 → tCO₂e;
a buffer haircut yields net. The headline KPIs are `fodPeak` (max annual net) and `fodTotal`
(cumulative over the horizon). Gas-collection design (`gcCalcs`) computes well spacing area
(`π·(spacing/2)²`), wells/ha, and a simplified thermal energy estimate (`ch4_flow·9.97/1000` MWh).

### 7.4 Worked example (FOD, first project year)

Defaults: `waste_tpa=100,000`, DOCf=0.55, F=0.50, k=0.05, MCF=0.60, collection=0.75,
destruction=0.97, buffer=12%. Composition defaults give DOC_w ≈ 0.38·0.35 + 0.44·0.25 + 0.43·0.10 +
0.24·0.08 + 0.20·0.15 + 0.15·0.07 ≈ **0.325**.

| Step | Computation | Result |
|---|---|---|
| Year-1 generation (single cohort x=0) | 0.60·0.325·0.55·0.50·100,000·e^(−0.05·1)·(1−e^(−0.05)) | ≈ 5,362·0.9512·0.0488 ≈ **249 kg?** |

Note the model works in tonnes waste × dimensionless DOC → the raw product `MCF·DOC_w·DOCf·F·waste_tpa`
= 0.60·0.325·0.55·0.50·100,000 ≈ **5,362 t** of degradable carbon-equivalent, scaled by the decay
term `e^(−0.05)·(1−e^(−0.05)) ≈ 0.0464` ⇒ ≈ **249 t CH₄** in year 1.
Captured 249·0.75 = 186.5; destroyed 186.5·0.97 = 181 t; ×27.2 = **4,925 tCO₂e**; net after 12%
buffer = **4,334 tCO₂e** in year 1, rising as the waste-in-place stock builds then declining as decay
dominates (the `fodPeak` is typically year 3–6).

### 7.5 Companion analytics
- **Waste composition** tab — sliders redistribute `shares`, auto-capping the total at 1.0.
- **Gas collection design** — well geometry → wells/ha and LFG-to-energy potential.
- Results push to `CarbonCreditContext` via `addCalculation({methodology:'ACM0001', family:'waste'})`.

### 7.6 Data provenance & limitations
- Portfolio rows are **synthetic seeded demo data** (`sr()` PRNG); calculator inputs are user-set.
- Single weighted-average `k` per composition is a simplification — IPCC multi-phase FOD assigns a
  distinct k per waste stream and sums cohorts per stream.
- No DOCf temperature adjustment, no lag-time (t_lag) before generation onset, no uncertainty
  discount applied to FOD (only a flat buffer); wastewater ignores N₂O and sludge-handling co-emissions.

**Framework alignment:** CDM **ACM0001** (landfill gas capture) & **AMS-III.G/H** (small-scale
landfill/wastewater) — the FOD stock-and-decay accounting and collection-efficiency deduction mirror
these methodologies. **IPCC 2019 Refinement, Waste Volume Ch.3** supplies DOC/DOCf/MCF/k defaults.
**EPA LMOP** is the operational analogue for collection-efficiency benchmarking. GWP100 per IPCC AR6.

## 9 · Future Evolution

### 9.1 Evolution A — GWP basis reconciliation and FOD calibration against EPA LMOP (analytics ladder: rung 1 → 3)

**What.** §7 confirms the first-order-decay engine (`calcFOD`) is a real IPCC 2019
year-by-year implementation, but flags a quantitative guide↔code mismatch: the guide
quotes GWP100 CH₄ = 29.8 (AR6 biogenic) while the code hard-codes 27.2 (AR6 fossil) —
a ~9% understatement for biogenic landfill gas. Evolution A fixes the GWP basis as an
explicit, selectable parameter (biogenic 27.0/27.2 vs the guide's 29.8, with the AR6
Table 7.SM.7 citation) and then calibrates the FOD parameters (k per waste fraction,
L₀, collection efficiency) against the EPA LMOP facility database the reference list
already names — LMOP publishes measured LFG collection for ~2,600 US landfills, giving
a real benchmark for the model's 70–85% collection assumption.

**How.** (1) GWP as a first-class input with basis label propagated into every tCO₂e
output. (2) `ref_lmop_facilities` ingest (public CSV); a calibration view comparing
FOD-predicted vs LMOP-reported collected CH₄ for matched waste-in-place, with error
distribution published per §8 model-card convention. (3) The 7-fraction
`WASTE_FRACTIONS` k-values checked against IPCC 2019 Vol.5 Ch.3 defaults.

**Prerequisites.** Resolve the documented 27.2-vs-29.8 discrepancy in one direction and
update the guide accordingly — the mismatch flag must clear. **Acceptance:** switching
GWP basis moves ER by exactly the ratio 29.8/27.2; calibration view reports median
prediction error against ≥100 LMOP facilities.

### 9.2 Evolution B — LFG methodology copilot (LLM tier 1 → 2)

**What.** A copilot explaining the FOD mechanics analysts actually ask about: "why do
credits decline every year even at constant waste intake?" (exponential decay of old
cohorts), "what does raising k for food waste do?", "why is my uncertainty discount 8%?"
— grounded in the atlas §5 formula and the live calculator state. Tier-2 what-ifs
("collection efficiency 78%, oxidation 15%") execute by re-invoking `calcFOD` and the
wastewater COD/B₀ engine client-side, since this module exposes no backend routes.

**How.** Tier 1: atlas record as RAG corpus, page state injected; answers cite ACM0001
v14 / AMS-III.G / IPCC 2019 Waste Volume from §5. Tier 2: tool schemas over the two
calculators with the no-fabrication validator matching answer numerics to logged
invocations.

**Prerequisites (hard).** The GWP mismatch must be resolved first — a copilot asked
"which GWP does this use?" today would have to explain that the guide and code
disagree; Evolution A's fix makes the answer clean. **Acceptance:** the decay-shape
question is answered with the §7 cohort-sum formula cited; every tCO₂e figure in a
what-if traces to a tool return.