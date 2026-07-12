# Wind Energy Finance Analytics
**Module ID:** `wind-energy-finance` · **Route:** `/wind-energy-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DO2 · **Sprint:** DO

## 1 · Overview
Models onshore and offshore wind project economics — turbine CapEx, capacity factor analysis, wake losses, cable/grid connection costs, O&M curves, and levelised cost of energy. Calculates project IRR, DSCR, and optimises turbine configuration for site-specific conditions.

> **Business value:** Essential for wind project developers, bank project finance teams, and infrastructure investors. Provides bankable energy yield analysis with P50/P90 confidence intervals for debt sizing and equity IRR modelling aligned with IEA/IRENA benchmarks.

**How an analyst works this module:**
- Input wind site data (wind atlas, Weibull distribution)
- Calculate capacity factor and P50/P90 yield
- Model turbine layout and wake loss optimisation
- Calculate LCOE, project IRR, and debt metrics
- Stress-test under curtailment and grid connection scenarios

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CFD_TECHS`, `KpiCard`, `MARKETS`, `MiniBar`, `PROJECTS`, `TABS`, `WIND_TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `type` | `WIND_TYPES[Math.floor(sr(i * 7 + 1) * WIND_TYPES.length)];` |
| `market` | `MARKETS[Math.floor(sr(i * 11 + 2) * MARKETS.length)];` |
| `cfd` | `CFD_TECHS[Math.floor(sr(i * 13 + 3) * CFD_TECHS.length)];` |
| `capacityMw` | `type === 'Offshore Fixed' ? Math.round(100 + sr(i*3+1)*900) : type === 'Offshore Floating' ? Math.round(50+sr(i*5+2)*350) : Math.round(30+sr(i*7+3)*270);` |
| `lcoe` | `type === 'Offshore Fixed' ? parseFloat((55 + sr(i*31+7)*45).toFixed(1)) : type === 'Offshore Floating' ? parseFloat((80 + sr(i*37+8)*60).toFixed(1)) : parseFloat((25 + sr(i*41+9)*30).toFixed(1));` |
| `irr` | `parseFloat((7 + sr(i*43+1)*12).toFixed(2));` |
| `cfdStrike` | `parseFloat((60 + sr(i*47+2)*80).toFixed(1));` |
| `merchantPct` | `parseFloat((sr(i*53+3)*35).toFixed(1));` |
| `capex` | `type === 'Offshore Fixed' ? parseFloat((2.8+sr(i*59+4)*2.2).toFixed(2)) : type === 'Offshore Floating' ? parseFloat((4.5+sr(i*61+5)*3.5).toFixed(2)) : parseFloat((1.1+sr(i*67+6)*0.8).toFixed(2));` |
| `dscr` | `parseFloat((1.1+sr(i*71+7)*1.5).toFixed(2));` |
| `wake` | `parseFloat((3+sr(i*73+8)*10).toFixed(1));` |
| `status` | `['Operational','Construction','Consent Granted','Planning','Development'][Math.floor(sr(i*79+9)*5)];` |
| `avgIrr` | `filtered.reduce((s, p) => s + p.irr, 0) / n;` |
| `avgCf` | `filtered.reduce((s, p) => s + p.cf, 0) / n;` |
| `totalGw` | `filtered.reduce((s, p) => s + p.capacityMw, 0) / 1000;` |
| `avgLcoe` | `filtered.reduce((s, p) => s + p.lcoe, 0) / n;` |
| `avgCfdStrike` | `filtered.reduce((s, p) => s + p.cfdStrike, 0) / n;` |
| `avgMerchant` | `filtered.reduce((s, p) => s + p.merchantPct, 0) / n;` |
| `byType` | `WIND_TYPES.map(t => {` |
| `avgS` | `PROJECTS.filter(p=>p.cfd===cfd).reduce((s,p)=>s+p.cfdStrike,0) / Math.max(1, cnt);` |
| `vals` | `[...arr.map(p=>p.cf)].sort((a,b)=>a-b);` |
| `p50` | `vals[Math.floor(vals.length*0.5)] \|\| 0;` |
| `p90` | `vals[Math.floor(vals.length*0.1)] \|\| 0;` |
| `avgI` | `arr.length ? arr.reduce((s,p)=>s+p.irr,0)/arr.length : 0;` |
| `avgCfd` | `arr.reduce((s,p)=>s+p.cfdStrike,0)/n2;` |
| `avgMerc` | `arr.reduce((s,p)=>s+p.merchantPct,0)/n2;` |
| `avgCap` | `arr.reduce((s,p)=>s+p.capex,0)/n2;` |
| `avgWake` | `arr.reduce((s,p)=>s+p.wake,0)/n2;` |
| `avgDscr2` | `arr.reduce((s,p)=>s+p.dscr,0)/n2;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CFD_TECHS`, `MARKETS`, `TABS`, `WIND_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Onshore Wind LCOE 2023 | — | IRENA Renewable Power Costs 2023 | Onshore wind LCOE at $0.033/kWh — cheapest new-build electricity generation in history |
| Offshore Wind CapEx | — | BloombergNEF Offshore Wind 2024 | Offshore wind CapEx range — rising in 2023 from supply chain pressure; floating adds 50–100% premium |
| Global Wind Additions 2023 | — | GWEC Global Wind Report 2024 | Record 116 GW of wind capacity added globally in 2023 — 60% onshore, 40% offshore |
- **Wind resource data (ERA5, MERRA-2, met mast)** → Wind energy assessment → **Annual energy production P50/P90 with uncertainty analysis**
- **Turbine cost database (BloombergNEF, MAKE)** → LCOE calculation → **Project economics by turbine model and site conditions**
- **Grid connection cost estimates + curtailment risk** → Interconnection modelling → **Net project economics after grid connection costs**

## 5 · Intermediate Transformation Logic
**Methodology:** Wind Project LCOE
**Headline formula:** `LCOE_wind = (CapEx × CRF + OpEx_annual) / (8760 × CapacityFactor × InstalledCapacity); WakeEffect = 1 - (1 - CT/(4A)) for Betz limit considerations`

LCOE strongly driven by capacity factor (wind class) and CapEx; wake losses from array layout modelled using Jensen/Gaussian wake models; offshore adds submarine cable and foundation costs

**Standards:** ['IRENA Renewable Power Generation Costs 2023', 'IEA Wind TCP Task 26 — Wind Cost Study', 'WindEurope Market Outlook 2024', 'DTU Wind Energy Atlas (WAsP)']
**Reference documents:** IRENA Renewable Power Generation Costs in 2023; Global Wind Energy Council — Global Wind Report 2024; IEA Wind TCP Task 26 — Cost of Wind Energy 2019; WindEurope Market and Economic Analysis 2024

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide gives an explicit LCOE formula
> (`LCOE_wind = (CapEx×CRF + OpEx_annual) / (8760×CapacityFactor×InstalledCapacity)`) and a wake-loss
> formula referencing the Betz limit. **Neither is computed.** `lcoe` is an independent random draw
> per project (range depends only on turbine `type`, not on the project's own `capex`, `capacityMw`,
> or `dscr`), and `wake` is a flat random percentage unconnected to any turbine-layout or Jensen/
> Gaussian wake model. P50/P90 energy-yield figures are computed as **rank-order percentiles of
> capacity factor across projects**, not from a wind-resource probability distribution as the P50/P90
> convention actually requires.

### 7.1 What the module computes

Synthetic project pipeline across 3 turbine types (Offshore Fixed, Offshore Floating, Onshore),
independently seeded per project:

```js
capacityMw = type==='Offshore Fixed' ? 100+sr(i·3+1)×900 : type==='Offshore Floating' ? 50+sr(i·5+2)×350 : 30+sr(i·7+3)×270
lcoe       = type==='Offshore Fixed' ? 55+sr(i·31+7)×45 : type==='Offshore Floating' ? 80+sr(i·37+8)×60 : 25+sr(i·41+9)×30
irr        = 7 + sr(i·43+1)×12
cfdStrike  = 60 + sr(i·47+2)×80
merchantPct = sr(i·53+3)×35
capex      = type-dependent range, $M/MW-ish
dscr       = 1.1 + sr(i·71+7)×1.5
wake       = 3 + sr(i·73+8)×10
```

Portfolio/type aggregations (`avgIrr`, `avgCf`, `totalGw`, `avgLcoe`, `avgCfdStrike`, `avgMerchant`,
`byType`) are simple means/sums over `filtered` projects — genuinely computed, but over inputs that
are themselves random.

```js
// "P50/P90" — actually rank-order percentiles of the capacity-factor field across projects
vals = [...arr.map(p=>p.cf)].sort((a,b)=>a-b)
p50  = vals[floor(vals.length×0.5)]
p90  = vals[floor(vals.length×0.1)]     // note: index 0.1, i.e. the 10th-percentile-by-rank value
```

### 7.2 Parameterisation

| Turbine type | `capacityMw` range | `lcoe` range ($/MWh) | Provenance |
|---|---|---|---|
| Offshore Fixed | 100–1,000 | 55–100 | Consistent order-of-magnitude with guide's cited $0.033/kWh onshore vs offshore CapEx premium framing, but not derived from `capex` |
| Offshore Floating | 50–400 | 80–140 | Highest LCOE — consistent with the guide's floating "50-100% premium" framing |
| Onshore | 30–300 | 25–55 | Cheapest, matches IRENA's "$0.033/kWh global avg" cited figure directionally |

### 7.3 Calculation walkthrough

1. Filters reduce `PROJECTS` to `filtered`; simple means computed for KPI cards.
2. `byType` groups `WIND_TYPES` and computes per-type averages of `irr`/`cf`/`lcoe` etc.
3. **P50/P90 tab**: the code sorts the *cross-sectional* capacity-factor field across all projects
   and reports the 50th/10th rank-order values as "P50"/"P90" — this conflates cross-project variance
   (different sites having different average CF) with the *actual* P50/P90 convention, which describes
   the probability distribution of a **single project's own annual energy yield** across weather years
   (i.e. P90 = the yield level exceeded 90% of the time for that one project, used by lenders to size
   debt conservatively). The code's version cannot answer "what's the 1-in-10 bad-wind-year outcome
   for this specific project," which is what P90 is actually used for in project finance.
4. `avgS` (average CfD strike price by CfD technology band) and `avgCfd`/`avgMerc`/`avgCap`/`avgWake`/
   `avgDscr2` all group `PROJECTS` by `cfd` technology classification.

### 7.4 Worked example

If `filtered` (Offshore Fixed only, say 8 projects) has capacity factors
`[38, 41, 43, 45, 47, 49, 51, 53]` (sorted), the code's "P50" = `vals[⌊8×0.5⌋] = vals[4] = 47`, and
"P90" = `vals[⌊8×0.1⌋] = vals[0] = 38`. A genuine P90 for a *specific* offshore project (say, the one
with average CF=45%) would instead require that project's own inter-annual wind-resource variability
(e.g. from ERA5/MERRA-2 reanalysis) to derive the 90%-exceedance yield for that site — a materially
different (and site-specific) calculation from "the lowest-CF project in a cross-sectional sample."

### 7.5 Data provenance & limitations

- **All projects, LCOE, IRR, DSCR, and wake-loss figures are synthetic** (`sr()`-seeded), calibrated
  by turbine type to land within the guide's cited IRENA/BNEF/GWEC ranges but not derived from any
  cash-flow, wind-resource, or wake-loss model.
- **The P50/P90 labelling is a genuine methodology error**, not just a missing-formula gap — the
  metric computed (cross-project rank order) answers a different question than the one lenders
  actually use P50/P90 for (single-project inter-annual yield distribution). This should be renamed
  (e.g. "cross-portfolio CF percentile") or replaced with a genuine per-project yield-distribution
  calculation before being used in any real debt-sizing context.
- No Jensen/Gaussian wake model, Weibull wind-speed distribution, or Betz-limit calculation exists
  despite being named in the guide's formula and references (DTU Wind Energy Atlas / WAsP).

**Framework alignment:** IRENA Renewable Power Generation Costs 2023 and GWEC Global Wind Report 2024
(named in the guide) inform the plausible calibration ranges but are not connected to a live data feed
or an actual LCOE calculation. IEA Wind TCP Task 26 cost-of-wind-energy methodology and DTU WAsP wind-
atlas modelling are named but entirely unimplemented.

## 9 · Future Evolution

### 9.1 Evolution A — Real LCOE build-up and genuine per-project P50/P90 (analytics ladder: rung 1 → 2)

**What.** Two documented problems, one of them a genuine methodology error. First,
the advertised LCOE formula (`(CapEx×CRF + OpEx)/(8760×CF×Capacity)`) is never
computed — `lcoe` is a type-banded random draw independent of the same project's own
`capex` and `capacityMw`, and `wake` is a flat random % with no Jensen/Gaussian model.
Second, §7.3/§7.4 flag that "P50/P90" is computed as cross-project rank-order
percentiles of the CF field — answering a different question than the lender
convention (single-project inter-annual yield distribution) and unusable for debt
sizing as labelled. Evolution A derives LCOE from each project's own capex/CF/opex
via the stated CRF formula, renames the current metric "cross-portfolio CF
percentile", and implements true per-project P50/P90: inter-annual CF variability
from reanalysis data (the platform already ingests NASA POWER / Open-Meteo weather
series from data-sources wave 1; ERA5 is the upgrade path), giving
`P90 = P50 × (1 − 1.282σ_IAV)` under the standard normal-yield assumption, with σ
reported per site.

**How.** Backend `wind_finance_engine` (module is Tier B, EP-DO2) with `POST /lcoe`
and `POST /yield-distribution`; a first wake-loss slice using the Jensen model needs
only turbine spacing and thrust-curve constants. Sibling reuse: the
`wind-repowering-intelligence` module's correct `calcIRR`/DCF machinery is the
pattern for any IRR work here.

**Prerequisites.** The mislabelled P50/P90 renamed immediately (cheap, independent of
the rest); weather-series coverage check for project geographies. **Acceptance:**
LCOE recomputes when a project's capex changes; a specific project's P90 < P50 with σ
disclosed; the old cross-sectional metric no longer carries the P90 label anywhere.

### 9.2 Evolution B — Debt-sizing copilot for project finance teams (LLM tier 2)

**What.** The module's stated audience is bank project-finance teams, whose core
workflow is P90-based debt sizing: "size senior debt for this 400MW offshore fixed
project at 1.35× DSCR on P90 revenue with a £73/MWh CfD strike." Evolution B is a
tool-calling analyst over Evolution A's endpoints: it runs `POST /yield-distribution`
for the site's P50/P90, `POST /lcoe` for cost benchmarking against the type-banded
portfolio distribution, computes the debt capacity from tool outputs, and drafts the
credit-memo yield section — explicitly stating the P90 basis and σ source, which is
exactly the assumption chain credit committees interrogate.

**How.** Tier-2 stack: tool schemas from the new OpenAPI operations; grounding corpus
is this Atlas page — §7.3's explanation of why cross-sectional percentiles are not
P90 goes into the system prompt verbatim, so the copilot can explain the distinction
when asked (a genuinely common analyst confusion). The no-fabrication validator
checks every MWh, £/MWh, and ratio against tool outputs.

**Prerequisites (hard).** Evolution A — a debt-sizing copilot on the current
mislabelled P90 would propagate the exact error the deep-dive warns against into
credit decisions; DSCR conventions parameterised, not hardcoded. **Acceptance:** memo
debt capacity reproduces from the cited P90 and DSCR inputs; asked for P99 or a
site-specific wake study the engine lacks, the copilot names what it can compute and
refuses the rest.