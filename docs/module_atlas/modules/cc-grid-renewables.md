# Grid Renewable Energy Credits
**Module ID:** `cc-grid-renewables` · **Route:** `/cc-grid-renewables` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Emission reduction quantification for grid-connected renewable energy projects under CDM AMS-I.D and ACM0002. Models combined margin (CM) emission factor, capacity factor projections, additionality via barrier analysis, and RECcertificate issuance.

> **Business value:** Annual ER = net renewable generation × combined margin EF. CM = 0.5×OM + 0.5×BM; project-specific weighting allowed under ACM0002.

**How an analyst works this module:**
- Select technology: Solar PV, Wind, Hydro, Geothermal
- Grid Data tab sets OM and BM emission factors by country
- Generation Model shows capacity factor and net output
- ER Calculator applies CM factor to net generation
- REC Issuance tab exports I-REC or TIGR certificates

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `DualInput`, `GRID_EF_PLANTS`, `GRID_REGIONS`, `HOURLY_PROFILES`, `Kpi`, `PROJECTS`, `Section`, `TECH_TYPES`, `TECH_WEIGHTS`, `TIP`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `GRID_EF_PLANTS` | 9 | `type`, `ef`, `share`, `dispatch` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtK` | `n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':fmt(n);` |
| `GRID_REGIONS` | `['South Asia','Southeast Asia','East Asia','Sub-Saharan Africa','Latin America','MENA','Eastern Europe','Central Asia','OECD Europe','North America','Pacific Islands','Central America'];` |
| `names` | `[`${countries[i]} Solar Farm Alpha`,`${countries[i]} Wind Park Delta`,`${countries[i]} Offshore Array`,`${countries[i]} Run-of-River`,`${countries[i]} Dam Retrofit`,`${countries[i]} Geothermal Plant`,`${countries[i]} Sol` |
| `capacity` | `Math.round(20+sr(i*7)*480);` |
| `aux` | `parseFloat((2+sr(i*13)*6).toFixed(1));` |
| `netGen` | `Math.round(capacity*8760*cf*(1-aux/100));` |
| `omEF` | `parseFloat((0.4+sr(i*17)*0.6).toFixed(3));` |
| `bmEF` | `parseFloat((0.2+sr(i*19)*0.5).toFixed(3));` |
| `HOURLY_PROFILES` | `TECH_TYPES.map((tech,ti)=>` |
| `setPlantShare` | `(idx,val)=>setGridPlants(prev=>prev.map((pl,i)=>i===idx?{...pl,share:val}:pl));` |
| `cmResult` | `useMemo(()=>{ const netGenCalc=Math.round(p.capacity*8760*p.cf*(1-p.aux/100));` |
| `sensOM` | `[0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0].map(om=>{` |
| `sensBM` | `[0.1,0.2,0.3,0.4,0.5,0.6].map(bm=>{` |
| `dispatchData` | `useMemo(()=>{ const thermal=100-dispatchRenewShare;` |
| `demand` | `dispatchDemand*(0.6+0.4*Math.sin((h-6)*Math.PI/12));` |
| `coal` | `Math.max(0,(demand-renew)*0.55);` |
| `gas` | `Math.max(0,(demand-renew)*0.35);` |
| `other` | `Math.max(0,demand-renew-coal-gas);` |
| `avgMargEF` | `parseFloat((hours.reduce((s,h)=>s+h.marginalEF,0)/24).toFixed(3));` |
| `gridEFResult` | `useMemo(()=>{ const totalShare=gridPlants.reduce((s,pl)=>s+pl.share,0);` |
| `weightedEF` | `gridPlants.reduce((s,pl)=>s+pl.ef*(pl.share/Math.max(totalShare,1)),0);` |
| `sortedByDispatch` | `[...gridPlants].sort((a,b)=>a.dispatch-b.dispatch);` |
| `buildMargin` | `sortedByDispatch.filter(pl=>pl.share>0).slice(-3);` |
| `portStats` | `useMemo(()=>{ const totalBE=PROJECTS.reduce((s,pr)=>s+pr.be,0);` |
| `totalCredits` | `PROJECTS.reduce((s,pr)=>s+pr.credits,0);` |
| `totalCap` | `PROJECTS.reduce((s,pr)=>s+pr.capacity,0);` |
| `avgCM` | `parseFloat((PROJECTS.reduce((s,pr)=>s+pr.cm,0)/PROJECTS.length).toFixed(3));` |
| `byTech` | `TECH_TYPES.map(t=>{const ps=PROJECTS.filter(pr=>pr.tech===t);return {tech:t,count:ps.length,be:ps.reduce((s,pr)=>s+pr.be,0),credits:ps.reduce((s,pr)=>s+pr.credits,0),avgCM:ps.length?parseFloat((ps.reduce((s,pr)=>s+pr.cm,` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `GRID_EF_PLANTS`, `GRID_REGIONS`, `TABS`, `TECH_COLORS`, `TECH_TYPES`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Operating Margin EF | `Weighted dispatch data` | Grid operator | Average EF of existing grid generation mix weighted by output |
| Build Margin EF | `5-yr avg of new capacity` | Grid operator | Average EF of recently commissioned capacity |
| Combined Margin EF | `0.5×OM + 0.5×BM` | CDM ACM0002 | Default combined margin for ER calculation |
| Net Generation | `Gross – auxiliary consumption` | Plant metering | Electricity delivered to grid after station use deduction |
| Annual ER | `NetGen × EF_CM` | Model output | Verified emission reductions from RE displacing grid electricity |
- **Grid operator dispatch data** → Generation × EF → OM calculation → **Operating margin EF**
- **Plant SCADA** → Net generation → ER → **Annual tCO₂e credits**

## 5 · Intermediate Transformation Logic
**Methodology:** Combined Margin (CM) grid emission factor
**Headline formula:** `EF_CM = (EF_OM × w_OM) + (EF_BM × w_BM); ER = NetGen × EF_CM`

Operating Margin (OM) reflects the average emission factor of existing dispatched power plants weighted by generation. Build Margin (BM) reflects the 5-year average EF of recently commissioned capacity or the 20% most recent additions. Combined margin weights OM at 50% and BM at 50% by default (project-specific adjustment allowed). Net generation = gross generation minus auxiliary consumption.

**Standards:** ['CDM ACM0002 v19', 'AMS-I.D v18', 'GHG Protocol Scope 2', 'I-REC Standard']
**Reference documents:** CDM ACM0002 v19 Grid-Connected RE; CDM AMS-I.D Small-scale RE; GHG Protocol Scope 2 Guidance 2015; I-REC Standard v1.5

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

Guide and code align: a CDM ACM0002 / AMS-I.D grid-connected renewable-energy emission-reduction
model built on the Combined Margin (OM + BM) grid emission factor, with a dispatch model and a
build-your-own grid-EF tool. The calculators are real; the 12-project registry is synthetic.

### 7.1 What the module computes

**Combined Margin** (`calcCombinedMargin`, lines 77–81):

```js
cm = omEF × omWeight + bmEF × bmWeight        // combined-margin emission factor (tCO2/MWh)
be = netGen × cm                              // baseline emissions displaced
netGen = capacity × 8760 × cf × (1 − aux/100) // net generation to grid
netCredits = round(be × 0.92)                 // 8% buffer
```

**Grid EF builder** (`gridEFResult`): a share-weighted average EF across 8 plant types
`weightedEF = Σ ef_i × (share_i / Σshare)`, plus a dispatch-order "build margin" from the last 3
dispatched plants.

**Dispatch model** (`dispatchData`): hourly demand `demand = D × (0.6 + 0.4·sin((h−6)π/12))`, a
solar-shaped renewable slice, residual met by coal (55%) / gas (35%) / other, with an hourly
marginal EF flagged 0.55 (gas-marginal) or 0.85 (coal-marginal).

### 7.2 Parameterisation

| Parameter | Value | Provenance |
|---|---|---|
| OM/BM weights | default 0.75 / 0.25; per-tech `TECH_WEIGHTS` | ACM0002 allows project-specific weighting; 50/50 default in methodology, here tech-varied |
| `omEF` / `bmEF` | 0.65 / 0.35 tCO₂/MWh default | Operating/build margin factors (illustrative regional) |
| `cf` (capacity factor) | 0.28 default; 0.15–0.60 across projects | Solar ~0.15–0.25, wind ~0.30–0.45, geothermal high |
| `aux` (auxiliary) | 4.0% default | Station self-consumption |
| Buffer | ×0.92 (8%) | Conservativeness proxy |
| Grid EF plant factors | Coal-sub 1.10 · Coal-super 0.85 · CCGT 0.40 · OCGT 0.55 · Oil 0.75 · Diesel 0.90 · Biomass 0.05 · Nuclear 0.01 tCO₂/MWh | `GRID_EF_PLANTS` — standard technology EFs |
| Default grid mix | Coal 35/20 · gas 25/8 · oil 5 · diesel 2 · biomass 3 · nuclear 2 % | Illustrative emerging-market mix |

### 7.3 Calculation walkthrough

1. Net generation from nameplate × 8,760 h × capacity factor × (1 − auxiliary).
2. Combined margin = OM×w_OM + BM×w_BM; baseline emissions = netGen × CM; ×0.92 → net credits.
3. Sensitivities sweep OM (0.3–1.0) and BM (0.1–0.6) holding the other fixed.
4. **Grid EF builder** computes a share-weighted operating margin and derives a build margin from the
   three most-recently-dispatched plants (`sortedByDispatch.slice(-3)`).
5. **Dispatch model** stacks renewables then coal/gas to meet an hourly demand curve, exposing the
   marginal EF by hour and its 24-h average.
6. Result pushed to `CarbonCreditContext` as methodology `ACM0002`, family `energy`.

### 7.4 Worked example — Combined Margin Calculator

Defaults: capacity 50 MW, cf 0.28, aux 4.0%, omEF 0.65, bmEF 0.35, omW 0.75, bmW 0.25:

| Step | Computation | Result |
|---|---|---|
| Net generation | 50 × 8,760 × 0.28 × (1 − 0.04) | 117,734 MWh |
| Combined margin | 0.65 × 0.75 + 0.35 × 0.25 | 0.575 tCO₂/MWh |
| Baseline emissions (be) | 117,734 × 0.575 | 67,697 tCO₂ |
| Net credits | 67,697 × 0.92 | **≈62,281 tCO₂e** |

### 7.5 Data provenance & limitations

- **Calculators are real; 12 `PROJECTS`, hourly wind/hydro profiles, and vintages are synthetic**
  (PRNG `sr(seed)=frac(sin(seed+1)×10⁴)`; solar hourly profile is a deterministic sine).
- OM/BM factors are user inputs, not derived from published national grid emission-factor tools
  (e.g. CDM Tool 07 / IGES grid-EF database).
- Build margin in the grid-EF builder is a "last-3-dispatched" heuristic, not the ACM0002 "20% most
  recent additions or 5 latest units" definition.
- Buffer is a flat 8%; additionality (`additionality` field) is a synthetic 40–95 score, not a
  barrier/investment analysis.

**Framework alignment:** **CDM ACM0002 v19** (grid-connected RE) — the CM = w_OM·OM + w_BM·BM identity
is the methodology's core; **AMS-I.D** for small-scale · **GHG Protocol Scope 2** grid EF concept ·
**I-REC Standard** referenced for REC eligibility. In the real methodology, OM is computed from
dispatch/generation data (simple, dispatch-data, or average methods) and BM from recent capacity
additions; the module reproduces the combining step and lets the user supply OM/BM directly.

## 9 · Future Evolution

### 9.1 Evolution A — Published grid emission factors and hourly marginal signal (analytics ladder: rung 1 → 3)

**What.** §7 confirms the Combined Margin engine is real (`cm = omEF×w_OM + bmEF×w_BM`,
`netGen = capacity × 8760 × cf × (1−aux)`), but the OM/BM inputs come from seeded
`GRID_REGIONS` values and the dispatch model is a stylised sine-curve demand with fixed
coal/gas splits and hard-coded marginal EFs (0.55/0.85). Evolution A grounds both: a
reference table of published grid EFs (UNFCCC harmonized IFI dataset + national CDM
standardized baselines) keyed by country/grid and vintage, and an hourly marginal-EF
series derived from the ENTSO-E generation-mix feed the platform already ingests for
European grids.

**How.** (1) `ref_grid_emission_factors(grid, om_ef, bm_ef, cm_ef, source, vintage)`
via the refdata pattern; the Grid Data tab selects from it with source displayed.
(2) For ENTSO-E-covered grids, compute hourly marginal EF from the actual dispatch
stack rather than the synthetic `demand = D×(0.6+0.4·sin(...))` profile; keep the
synthetic path clearly labelled as illustrative for uncovered grids. (3) Solar/wind
capture-weighted EF: weight the hourly marginal series by the technology's generation
shape, which materially changes solar ER in gas-marginal grids.

**Prerequisites.** EF source licensing check (IFI dataset is public); vintage handling
so 2021 factors are never silently applied to 2026 issuance. **Acceptance:** selecting
India vs Norway pulls different, cited CM factors; a solar project's capture-weighted
ER differs from the flat-CM ER and the delta is displayed.

### 9.2 Evolution B — ACM0002 methodology copilot (LLM tier 1 → 2)

**What.** A copilot answering "why is my CM factor 0.71?", "when can I deviate from
50/50 OM/BM weighting?" (ACM0002 v19 rules are in the §5 reference list), and "what
happens to ER if auxiliary consumption rises to 8%?" — the last executed by re-invoking
the page's real `calcCombinedMargin` and grid-EF-builder functions with LLM-proposed
inputs, since this module has no backend routes to call.

**How.** Tier 1: atlas §5/§7 corpus plus live page state (selected region, OM/BM
values, dispatch chart). Tier 2 (client-side tools): schemas over `calcCombinedMargin`
and `gridEFResult`; the no-fabrication validator matches every tCO₂ figure against a
logged invocation. REC-issuance questions route to the standards text (I-REC v1.5),
never to invented registry balances.

**Prerequisites.** Evolution A's cited EF table, so the copilot attributes factors to
UNFCCC/IFI sources instead of seed values. **Acceptance:** a weighting-deviation
question is answered with the ACM0002 citation; every numeric in a what-if answer
matches a tool return; "what's the I-REC spot price?" is refused.