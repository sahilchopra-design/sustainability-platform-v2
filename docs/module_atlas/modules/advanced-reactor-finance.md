# Advanced Reactor Finance
**Module ID:** `advanced-reactor-finance` · **Route:** `/advanced-reactor-finance` · **Tier:** A (backend vertical) · **EP code:** EP-DU6 · **Sprint:** DU

## 1 · Overview
Financial analytics for Generation IV and fusion reactor concepts covering MSR, HTGR, fast reactors and fusion (ITER/Commonwealth Fusion), including TRL assessment, commercialisation timelines, capital cost uncertainty and DOE ARDP grant structures.

> **Business value:** Gen IV and fusion finance requires TRL-adjusted NPV frameworks given $80–$160M DOE ARDP grants, ±50–100% capital cost uncertainty and commercialisation windows of 2035–2050; industrial heat and hydrogen revenues are key value diversifiers.

**How an analyst works this module:**
- Classify reactor concept by TRL (1–9) and assign probability of commercial success
- Model capital cost range with explicit uncertainty band
- Size government grant contribution (DOE ARDP, EU Horizon) and residual private capital
- Assess industrial heat and hydrogen market revenue diversification

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ARDP_COMPANIES`, `GEN4_TYPES`, `KpiCard`, `LCOE_COMPARISON`, `PROCESS_HEAT_APPS`, `Slider`, `TABS`, `TRISO_DATA`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `GEN4_TYPES` | 7 | `abbr`, `temp`, `eta`, `fuelCycle`, `vendors`, `trl`, `targetCap`, `lcoe2040`, `color` |
| `ARDP_COMPANIES` | 7 | `type`, `award`, `partner`, `status`, `location`, `power` |
| `TRISO_DATA` | 9 | `value` |
| `PROCESS_HEAT_APPS` | 7 | `tempC`, `mktGW`, `readiness`, `pairing` |
| `LCOE_COMPARISON` | 12 | `lcoe`, `note` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `capexAnn` | `capexKw * w / (1 - Math.pow(1 + w, -lt));` |
| `idc` | `Math.pow(1 + w, cy / 2);` |
| `annMwh` | `cf0 / 100 * 8760;` |
| `lcoe` | `useMemo(() => calcLcoe({ capexKw: capexPerKw, opex: opexFixed, wacc, cf, lt: lifetime, constructYr }), [capexPerKw, opexFixed, wacc, cf, lifetime, constructYr]);  const npv = useMemo(() => { const annMwh = cf / 100 * 8760 * capexPerKw / 1000;` |
| `blendRev` | `annMwh * (elecPrice * (1 - heatPct / 100) + heatPrice * heatPct / 100) / 1000;` |
| `capex` | `capexPerKw * 1000;` |
| `decommPV` | `capex * 0.15 / Math.pow(1 + w, lifetime);` |
| `cashFlows` | `useMemo(() => { const annMwh = cf / 100 * 8760 * capexPerKw / 1000;` |
| `annual` | `(blendRev - opexFixed) / 1e3;` |
| `trlRadar` | `GEN4_TYPES.map(g => ({` |
| `timelineData` | `useMemo(() => Array.from({ length: 20 }, (_, i) => ({ year: 2025 + i, htgr: i >= 3 ? +(sr(i * 3) * 5 + i * 0.8).toFixed(1) : 0, sfr:  i >= 4 ? +(sr(i * 5) * 4 + i * 0.5).toFixed(1) : 0, msr:  i >= 6 ? +(sr(i * 7) * 3 + (i - 6) * 0.3).toFixed(1) : 0, lfr:  i >= 7 ? +(sr(i * 9) * 2 + (i - 7) * 0.2).toFixed(1) : 0, })), []);` |
| `investData` | `useMemo(() => [ { investor: "DOE (USA)", committed: 3.8, pipeline: 5.0, focus: "ARDP + CVF" }, { investor: "NRCan (Canada)", committed: 0.5, pipeline: 1.2, focus: "SMR Action Plan" }, { investor: "NIA (UK)", committed: 0.7, pipeline: 1.5, focus: "GBN + AMR" }, { investor: "EU Euratom", committed: 0.3, pipeline: 0.8, focus: "ITER + Gen IV"` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/pcaf/advanced/securities` | `assess_securities` | api/v1/routes/pcaf_advanced.py |
| POST | `/api/v1/pcaf/advanced/fund` | `assess_fund` | api/v1/routes/pcaf_advanced.py |
| POST | `/api/v1/pcaf/advanced/portfolio` | `assess_portfolio` | api/v1/routes/pcaf_advanced.py |
| GET | `/api/v1/pcaf/advanced/indices` | `list_indices` | api/v1/routes/pcaf_advanced.py |
| GET | `/api/v1/pcaf/advanced/indices/{index_key}` | `get_index_profile` | api/v1/routes/pcaf_advanced.py |
| POST | `/api/v1/pcaf/advanced/compare-to-index` | `compare_portfolio_to_index` | api/v1/routes/pcaf_advanced.py |
| GET | `/api/v1/pcaf/advanced/gics-sub-sectors` | `list_gics_sub_sectors` | api/v1/routes/pcaf_advanced.py |
| GET | `/api/v1/pcaf/advanced/sovereign-coverage` | `list_sovereign_coverage` | api/v1/routes/pcaf_advanced.py |
| GET | `/api/v1/pcaf/advanced/nze-pathways` | `list_nze_pathways` | api/v1/routes/pcaf_advanced.py |
| GET | `/api/v1/pcaf/advanced/nace-gics-mapping` | `list_nace_gics_mapping` | api/v1/routes/pcaf_advanced.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `EDGAR` *(shared)*, `MSCI` *(shared)*, `active` *(shared)*, `broad` *(shared)*, `core` *(shared)*, `data` *(shared)*, `datetime` *(shared)*, `energy` *(shared)*, `fastapi` *(shared)*, `instrument_type` *(shared)*, `investee` *(shared)*, `pydantic` *(shared)*, `security` *(shared)*, `typing` *(shared)*, `underlying` *(shared)*
**Frontend seed datasets:** `ARDP_COMPANIES`, `COLORS`, `GEN4_TYPES`, `LCOE_COMPARISON`, `PROCESS_HEAT_APPS`, `TABS`, `TRISO_DATA`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| DOE ARDP Grant Size | `Grant = DOE Share × Total Project Cost (50/50 cost-share)` | DOE ARDP Awards 2020–2022 | Advanced Reactor Demonstration Program awards to TerraPower and X-energy. |
| Commercialisation Timeline | `Based on TRL progression rate and regulatory review duration` | DOE / Fusion Industry Association | Gen IV commercial deployment 2035–2040; fusion pilot plant 2040–2050. |
| Capital Cost Uncertainty Band | `CAPEX Range = Base Estimate × (1 ± Uncertainty Factor)` | IAEA Advanced Reactor Design Review | Wide uncertainty reflects pre-FOAK status; shrinks with ARDP demonstration results. |
- **DOE ARDP grant data + TRL assessments** → TRL-adjusted NPV model + cost uncertainty simulation → **Advanced reactor investment viability dashboard**

## 5 · Intermediate Transformation Logic
**Methodology:** TRL-Adjusted NPV
**Headline formula:** `TRL-NPV = Σ[P(success|TRL) × CF_t / (1+r)^t] − I₀`

Probability-weighted NPV adjusting commercial cash flows by TRL-conditional success probability.

**Standards:** ['DOE Technology Readiness Assessment Guide', 'Fusion Industry Association — Global Fusion Industry 2023']
**Reference documents:** DOE — Advanced Reactor Demonstration Program Award Summaries; IAEA — Advances in Small Modular Reactor Technology Developments 2022; Fusion Industry Association — Global Fusion Industry in 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **3** other module(s).

| Connected module | Shared via |
|---|---|
| `advanced-report-studio` | table:EDGAR, table:MSCI, table:active, table:broad, table:core, table:data |
| `benchmark-analytics` | table:EDGAR |
| `financial-modeling-studio` | table:data |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry (EP-DU6) headlines a **TRL-adjusted
> NPV**: `TRL-NPV = Σ[P(success|TRL) × CF_t / (1+r)^t] − I₀`. **No probability-of-success
> weighting exists in the code.** The page's NPV is a plain deterministic DCF; TRL appears only
> descriptively (per-type TRL badges and a radar). Fusion (ITER/Commonwealth) is mentioned in
> one investor row, not modelled. The guide's ARDP grant sizing and capital-cost uncertainty
> bands are represented as static tables, not calculations. Sections below document the code.

### 7.1 What the module computes

Ten tabs on Generation-IV reactor finance. The quantitative core is an interactive **LCOE +
NPV + cash-flow model** driven by nine sliders (CAPEX $/kWe 3,000–12,000; WACC 4–15%; capacity
factor 70–95%; lifetime 30–80y; construction time 3–8y; fixed O&M; electricity price; heat
price; heat revenue share 0–100%):

```
LCOE:  w        = WACC/100
       capexAnn = capexKw·w / (1 − (1+w)^−lifetime)          // $/kW-yr capital annuity
       idc      = (1+w)^(constructYr/2)                       // interest during construction
       annMwh   = CF/100 × 8760                               // kWh per kW-yr
       LCOE     = (capexAnn·idc + opex) / annMwh × 1000       // $/MWh
```

```
NPV:   annMwh   = CF/100 × 8760 × capexPerKw/1000
       blendRev = annMwh × (elecPrice·(1−heatPct/100) + heatPrice·heatPct/100) / 1000
       capex    = capexPerKw × 1000
       PV       = Σ_{yr=1..lifetime} blendRev/(1+w)^yr
       decommPV = capex × 0.15 / (1+w)^lifetime               // 15% decommissioning provision
       NPV($M)  = (PV − capex − decommPV) / 10⁶
```

The blended-revenue term is the page's genuinely novel element: Gen-IV economics are modelled
as a **co-generation play** where a `heatPct` share of output is sold as industrial process
heat at a separate price.

### 7.2 Parameterisation — static reference tables

**GEN4_TYPES** (6 Gen IV Forum designs):

| Type | Temp °C | η | TRL | LCOE 2040E $/MWh | Vendors (first two) |
|---|---|---|---|---|---|
| MSR | 700 | 0.45 | 4 | 90 | Terrestrial Energy, Moltex |
| SFR | 550 | 0.40 | 6 | 95 | TerraPower Natrium, ARC-100 |
| HTGR | 950 | 0.50 | 7 | 85 | X-Energy Xe-100, USNC |
| GFR | 850 | 0.48 | 2 | 110 | Framatome Gen IV |
| LFR | 480 | 0.40 | 3 | 105 | Newcleo, ALFRED |
| VHTR | 1000 | 0.52 | 5 | 88 | GA-EMS, INL |

**ARDP_COMPANIES** — 6 real awards (TerraPower Natrium $2.0B, X-Energy $1.2B, Kairos $629M,
Oklo $5M, Terrestrial C$20M, Moltex C$50M) with status/location/power — consistent with public
DOE ARDP and Canadian announcements circa 2024. **LCOE_COMPARISON** — 11 benchmark rows with
named anchors ("Vogtle benchmark" 95, "Hinkley Point C" 110, NuScale NOAK 80, UK CfD offshore
wind 70, utility solar+BESS 65, CCGT at $3/MMBtu 60). **TRISO_DATA** — 8 fuel-property rows
(HALEU ≤19.75%, 4 coating layers, >1600°C failure temp, $8–15k/kgU cost est.).
**PROCESS_HEAT_APPS** — 6 heat markets with temperature requirement, market size (GW-thermal)
and reactor pairing.

### 7.3 Calculation walkthrough

1. Sliders → `calcLcoe` recomputes on every change; IDC uses half-construction-period
   compounding — the standard simple approximation for capitalised interest.
2. The same sliders drive `npv` and `cashFlows`; year-0 row is `−capex`, years 1..min(40,
   lifetime) accrue `annual = (blendRev − opexFixed)/1e3` into a cumulative payback line.
3. `trlRadar` normalises each design: TRL×10, temp/10 (cap 100), η×100, `130 − lcoe2040`
   (cost attractiveness), TRL×12 ("CostMaturity").
4. `timelineData` builds a 2025–2044 deployment fan: each technology starts at a staggered
   year (HTGR i≥3, SFR i≥4, MSR i≥6, LFR i≥7) and grows as `sr(i·k)·scale + slope·i` — a
   seeded random growth curve, not a diffusion model.

### 7.4 Worked example — default slider settings

CAPEX $5,000/kWe, WACC 8%, CF 90%, lifetime 60y, construction 4y, O&M 120, elec $90/MWh,
heat $40/MWh, heat share 30%:

| Step | Computation | Result |
|---|---|---|
| Capital annuity | 5000×0.08 / (1−1.08⁻⁶⁰) | $404.15/kW-yr |
| IDC factor | 1.08^(4/2) | 1.1664 |
| Annual output | 0.90 × 8760 | 7,884 kWh/kW-yr |
| **LCOE** | (404.15×1.1664 + 120)/7884 × 1000 | **≈ $75.0/MWh** |
| Blended price | 90×0.7 + 40×0.3 | $75/MWh |
| `annMwh` (NPV path) | 0.9×8760×5000/1000 | 39,420 MWh |
| `blendRev` | 39,420×75/1000 | 2,956.5 ($k/yr) |
| PV of revenue (60y @8%) | 2,956.5k × 12.376 | ≈ $36.6M |
| decommPV | 5.0M×0.15/1.08⁶⁰ | ≈ $7.4k |
| **NPV** | 36.6 − 5.0 − 0.007 | **≈ +$31.6M** |

Note the NPV branch omits O&M from the discounted stream (O&M only enters the undiscounted
cash-flow chart) and its revenue coincidentally scales with CAPEX-per-kW (see §7.5).

### 7.5 Data provenance & limitations

- Reference tables (GEN4_TYPES, ARDP awards, LCOE benchmarks, TRISO, process heat) are
  hand-authored from public sources named inline (DOE ARDP, vendor estimates, UK CfD); LCOE
  2040 estimates are explicitly labelled "E" — projections, not data.
- The deployment timeline uses the platform PRNG `sr(seed)=frac(sin(seed+1)×10⁴)` —
  **synthetic**, deterministic decoration.
- **Dimensional inconsistencies in the NPV/cash-flow branch:** plant capacity is implicitly
  `capexPerKw/1000` MW (so raising unit CAPEX *raises revenue*), the discounted PV excludes
  O&M, and `blendRev` ($k) is netted against `opexFixed` (a $/kW-yr slider) in the cash-flow
  chart. The LCOE branch is internally consistent; the NPV branch should be read as
  illustrative only.
- No TRL-conditional success probabilities, no CAPEX uncertainty simulation, no FOAK→NOAK
  learning curve — all named in the guide but absent from code.

### 7.6 Framework alignment

- **DOE Technology Readiness Assessment Guide** — TRL 1–9 scale used for classification; DOE
  practice attaches maturation plans and risk levels to TRL, which here surface only as badge
  colours (≥6 green, ≥4 amber, else red).
- **DOE ARDP** — real cost-share demonstration awards (50/50 for the two demos) are tabulated
  with actual award values; the module does not compute grant sizing.
- **LCOE convention (IEA/NEA Projected Costs of Generating Electricity)** — the annuity-based
  LCOE with an IDC multiplier is the standard simplified levelised-cost formula used in
  IEA/NEA and Lazard-style comparisons.
- **Gen IV International Forum** — the six-technology taxonomy (MSR/SFR/HTGR/GFR/LFR/VHTR)
  matches the GIF portfolio exactly, including representative coolant temperatures and
  efficiency ranges.
- **IAEA ARIS/SMR booklet** — vendor/design pairings and power ratings are consistent with
  IAEA's advanced-reactor listings as of ~2024.

## 9 · Future Evolution

### 9.1 Evolution A — Real TRL-adjusted NPV with fixed dimensional model (analytics ladder: rung 1 → 2)

**What.** The page's LCOE branch is internally consistent, but §7.5 documents that the NPV
branch is illustrative only: plant capacity is implicitly `capexPerKw/1000` MW so raising
unit CAPEX *raises revenue*, O&M is omitted from the discounted stream, and `blendRev`
($k) is netted against a $/kW-yr slider. Meanwhile the guide's headline
`TRL-NPV = Σ[P(success|TRL)·CF_t/(1+r)^t] − I₀` is not implemented at all — TRL appears
only as badges. Evolution A delivers both: a dimensionally correct DCF with an explicit
`capacity_mw` input, O&M in the discounted stream, and TRL-conditional success
probabilities (DOE TRA-style P(success) table per TRL band) weighting the cash flows,
plus a CAPEX uncertainty band (±50–100% pre-FOAK per the IAEA framing) swept as scenarios.

**How.** Port `calcLcoe` and the corrected NPV into a small backend engine
(`gen4_finance_engine`) with `POST /api/v1/gen4/npv` and `GET /api/v1/gen4/reference`
serving GEN4_TYPES/ARDP/LCOE_COMPARISON as cited reference data; the 2025–2044 deployment
fan — currently a seeded-random growth curve (`sr(i·k)·scale + slope·i`), documented as
decoration — is replaced by a logistic diffusion parameterised per technology's TRL and
first-deployment year, or removed.

**Prerequisites.** Purge the `sr()` timeline per the platform's no-fabricated-random
guardrail; note the §2.2 endpoint table currently lists `pcaf_advanced.py` routes that are
not this module's vertical. **Acceptance:** the §7.4 LCOE case still yields ≈$75.0/MWh;
doubling CAPEX/kWe at fixed capacity now *lowers* NPV; TRL 4 vs TRL 7 designs with
identical cash flows produce different probability-weighted NPVs.

### 9.2 Evolution B — Reactor-economics copilot on the slider model (LLM tier 1)

**What.** A chat panel that explains the live slider state — "why did LCOE jump when I
moved construction time from 4 to 8 years?" (IDC factor `(1+w)^(cy/2)` compounding),
"which Gen IV design fits a 950 °C process-heat offtake?" (join of GEN4_TYPES temperatures
against PROCESS_HEAT_APPS requirements), "what did X-Energy actually get from ARDP?"
($1.2B, from the seeded awards table). Grounded strictly in this Atlas page and current
slider values; it must volunteer that the NPV branch is illustrative (per §7.5) until
Evolution A ships, and that LCOE-2040 figures are labelled projections.

**How.** Tier-1 roadmap pattern: §7.1 formulas, §7.2 reference tables and §7.5 limitations
embedded as the module corpus; slider state passed as structured context so the copilot
decomposes the actual on-screen LCOE into capital annuity, IDC and O&M terms rather than
recomputing. Served via `POST /api/v1/copilot/advanced-reactor-finance/ask`; refusal path
for questions the module cannot answer (e.g. fusion economics — §7 notes fusion appears in
one investor row and is not modelled). After Evolution A, graduate to tier 2: "run the NPV
at TRL 5 with a −30% CAPEX case" becomes a tool call to `POST /gen4/npv`.

**Prerequisites.** Atlas corpus embedded (roadmap D3 pgvector). **Acceptance:** the copilot
reproduces the §7.4 worked decomposition ($404.15/kW-yr annuity × 1.1664 IDC) from page
state; asking for a probability-of-success-weighted NPV before Evolution A returns a
refusal citing the guide↔code mismatch.