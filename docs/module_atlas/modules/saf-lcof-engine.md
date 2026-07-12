# SAF Levelised Cost of Fuel Engine
**Module ID:** `saf-lcof-engine` · **Route:** `/saf-lcof-engine` · **Tier:** B (frontend-computed) · **EP code:** EP-EF1 · **Sprint:** EF

## 1 · Overview
Comprehensive LCOF analysis for all six ASTM D7566 sustainable aviation fuel pathways. Models HEFA-UCO, HEFA-Tallow, AtJ-Cellulosic, FT-MSW, FT-Agricultural, and PtL-DAC including feedstock cost, CAPEX learning curves (Wright's Law), IRA §40B tax credit ($1.25–$1.75/gal), and 24 seeded project benchmarks.

> **Business value:** Used by SAF project developers, airlines procuring sustainable fuel, investors evaluating SAF projects, and policy analysts assessing IRA §40B credit impacts on pathway economics.

**How an analyst works this module:**
- Review LCOF overview for pathway benchmarks and CI reduction
- Use pathway comparison for side-by-side LCOF, capex, and opex
- Examine feedstock economics for supply cost sensitivity
- Run IRA §40B calculator for annual credit value by pathway and volume

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FEEDSTOCKS`, `KpiCard`, `PATHWAYS`, `PROJECTS`, `Pill`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PATHWAYS` | 7 | `name`, `feedstock`, `maturity`, `lcof`, `capex`, `yield`, `ci`, `cert` |
| `FEEDSTOCKS` | 7 | `price`, `avail`, `ci`, `risk` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `capMt` | `parseFloat((0.05 + sr(i * 11 + 2) * 0.95).toFixed(2));` |
| `lcof` | `parseFloat((pw.lcof * (0.88 + sr(i * 13 + 3) * 0.28)).toFixed(2));` |
| `country` | `['USA', 'EU', 'UK', 'Japan', 'Australia', 'Singapore', 'UAE', 'Brazil'][Math.floor(sr(i * 17 + 4) * 8)];` |
| `status` | `['Operating', 'Construction', 'FID', 'Engineering', 'Development'][Math.floor(sr(i * 19 + 5) * 5)];` |
| `irr` | `parseFloat((7 + sr(i * 23 + 6) * 14).toFixed(1));` |
| `corsia` | `sr(i * 29 + 7) > 0.5;` |
| `map` | `{ Operating: T.green, Construction: T.blue, FID: T.indigo, Engineering: T.amber, Development: T.sub, Commercial: T.green, 'Early Comm.': T.blue, 'Demo/Scale': T.amber, Demo: T.amber, Pilot: T.sub };` |
| `countries` | `useMemo(() => ['ALL', ...new Set(PROJECTS.map(p => p.country))], []);` |
| `avgLcof` | `useMemo(() => filtered.length ? (filtered.reduce((s, p) => s + p.lcof, 0) / filtered.length).toFixed(2) : '—', [filtered]);` |
| `avgIrr` | `useMemo(() => filtered.length ? (filtered.reduce((s, p) => s + p.irr, 0) / filtered.length).toFixed(1) : '—', [filtered]);` |
| `corsiaShare` | `useMemo(() => filtered.length ? Math.round(filtered.filter(p => p.corsia).length / filtered.length * 100) : 0, [filtered]);` |
| `pathwayChart` | `PATHWAYS.map(pw => ({ name: pw.id.split('-')[0], lcof: pw.lcof, capex: pw.capex / 100, ci: Math.abs(pw.ci) }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FEEDSTOCKS`, `PATHWAYS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| HEFA LCOF ($/gal) | `CAPEX_CRF + Feedstock_UCO + Opex − §40B` | NREL SAF Pathways 2023 | UCO feedstock $0.60–1.20/gal; CAPEX $2–3/gal amortised; IRA §40B reduces by $1.25–1.75/gal. |
| PtL LCOF ($/gal) | `Electricity_cost × 1.8 kWh/gal_H2 + CO2_capture + synthesis` | IEA Net Zero by 2050 | Electricity 60–70% of cost; requires <$20/MWh green power for competitiveness by 2035. |
| IRA §40B Credit ($/gal) | `Base $1.25 × SAF_multiplier (1.0–1.4 for CI < 50)` | IRS Notice 2023-06 | Minimum 50% CI reduction vs petroleum jet; expires end 2027; replaced by §45Z. |
- **NREL LCOF benchmarks + ICAO CI values + IRA §40B statute** → Six-pathway LCOF model + learning curves + §40B calculator + sensitivity waterfall → **SAF developers, airlines, investors, and policy teams benchmarking pathway economics**

## 5 · Intermediate Transformation Logic
**Methodology:** SAF LCOF Calculation ($/gal)
**Headline formula:** `LCOF = (CAPEX×CRF + OPEX) / Annual_Production + Feedstock_Cost − IRA_§40B_Credit`

HEFA: $2.5–4.0/gal (2024); PtL: $8–15/gal (2024) declining to $3–5/gal by 2035. Wright's Law learning rate: 15–20% per doubling.

**Standards:** ['ICAO CORSIA Default Life Cycle Values', 'NREL SAF Pathways Cost Analysis 2023', 'IEA Sustainable Aviation Fuel Report 2024']
**Reference documents:** NREL (2023) – SAF Pathways Cost Benchmarking; IEA (2024) – Sustainable Aviation Fuels Report; ICAO CORSIA Default Life Cycle Values 2023–2024

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Partial guide↔code mismatch.** The guide's formula is
> `LCOF = (CAPEX x CRF + OPEX) / AnnualProduction + FeedstockCost - IRA_S40B_Credit` — a genuine
> bottom-up levelised-cost build. **The code does not run this calculation.** Each of the 6
> `PATHWAYS` carries a **hard-coded `lcof` value** (e.g. HEFA-UCO $1.85/gal, PtL-DAC $6.80/gal);
> the cost-component waterfall chart (feedstock/capex/opex/other) is a **fixed percentage split of
> that hard-coded number** (52%/28%/12%/8%), not four independently computed cost lines that sum to
> the total. No CRF (capital recovery factor), discount rate, or feedstock-price-to-LCOF linkage
> exists in the code.

### 7.1 What the module computes

```
lcof_project = pathway.lcof x (0.88 + sr(i x 13 + 3) x 0.28)     // +/-12%/+16% spread per project
learningCurve[tech][year] = base_lcof x decayRate^(year - 2024)  // annual geometric decay, per tech
sensitivity: base = $3.50/gal +/- feedstock/capex/carbon-price sliders (independent additive terms)
netLcof = max(0, gross_lcof - iraCredit x 0.264)                 // IRA S40B credit per pathway
```

### 7.2 Parameterisation

| Pathway | `lcof` ($/gal) | `capex` ($M/Mt/yr) | `ci` (gCO2eq/MJ) | Maturity |
|---|---|---|---|---|
| HEFA-UCO | 1.85 | 320 | 28 | Commercial |
| HEFA-Tallow | 2.10 | 340 | 35 | Commercial |
| AtJ-Cellulosic | 3.20 | 580 | 12 | Early Commercial |
| FT-MSW | 3.80 | 720 | 5 | Demo/Scale |
| FT-Agricultural | 4.10 | 780 | 8 | Demo |
| PtL-DAC | 6.80 | 1,400 | -70 | Pilot |

All six are **hand-set constants**. HEFA-UCO's $1.85/gal sits *below* the guide's own cited
$2.5-4.0/gal HEFA LCOF range — an internal inconsistency between the atlas guide text and the code's
seed value. Capex figures ($320-1,400M per Mt/yr nameplate) and maturity labels are qualitatively
consistent with published SAF techno-economic literature (NREL/IEA cost curves place PtL 3-4x HEFA
capex intensity, matching the 1,400/320≈4.4x ratio here) even though not derived from a live model.

| Learning-curve decay rate (annual) | HEFA 3% | AtJ 8% | FT 10% | PtL 15% |
|---|---|---|---|---|
Applied as `lcof_2024 x rate^n` for year `2024+n` — a simple annual geometric decay, **not**
Wright's Law in its proper form (`cost = cost_0 x (cumulative_production / production_0)^-b`,
which indexes against production doublings, not calendar years). The decay-rate ordering
(PtL fastest, HEFA slowest) is directionally consistent with the guide's "15-20% per doubling"
claim for immature technologies learning faster, but the per-year rates are not derived from an
assumed production-growth trajectory that would translate a doubling-based learning rate into an
annual one.

### 7.3 Calculation walkthrough

1. `PROJECTS` (24 rows) sample a `PATHWAYS` entry and perturb its hard-coded `lcof` by a synthetic
   +/-12-16% band via `sr()`, plus independently seeded `capMt`, `irr` (7-21%), and `corsia`
   eligibility (~50/50 coin flip).
2. `avgLcof`/`avgIrr`/`corsiaShare` are simple means/proportions over the filtered project set.
3. `learningCurve` projects each of the 4 pathway families (HEFA/AtJ/FT/PtL) 10 years forward via
   the fixed annual decay rate.
4. Cost-waterfall chart: `feed = lcof x 0.52`, `cap = lcof x 0.28`, `op = lcof x 0.12`,
   `other = lcof x 0.08` for every pathway — an **identical percentage split applied uniformly
   across all 6 pathways**, despite pathways having very different feedstock-to-capex cost ratios
   in reality (e.g. PtL is capex/electricity-dominated, HEFA is feedstock-dominated).
5. IRA §40B calculator: `netLcof = max(0, grossLcof - iraCredit x 0.264)` — converts a $/gal credit
   to $/L via the 0.264 gal/L conversion factor (correct unit conversion), then nets it off the
   hard-coded gross LCOF.

### 7.4 Worked example

HEFA-UCO learning curve at year 2029 (`n=5`): `lcof = 1.85 x 0.97^5 = 1.85 x 0.8587 = $1.588/gal`.
PtL-DAC at year 2029: `lcof = 6.80 x 0.85^5 = 6.80 x 0.4437 = $3.017/gal` — a much steeper decline
(56% cost reduction by 2029 vs HEFA's 14%), consistent with the guide's claim that PtL falls from
$8-15/gal toward $3-5/gal by 2035, though the code's PtL base ($6.80) already starts below the
guide's own cited $8-15/gal 2024 range.

### 7.5 Data provenance & limitations

- All `lcof`/`capex` figures are hard-coded constants, not computed from a CRF/OPEX/feedstock
  bottom-up build as the guide's formula implies — changing a feedstock price slider elsewhere on
  the platform would not flow through to this page's LCOF figures.
- The cost-component waterfall applies one fixed percentage split to every pathway, which is not
  defensible given real SAF pathways have materially different feedstock vs capex cost structures.
- The annual-decay learning curve is a reasonable *illustrative* proxy for Wright's Law but is not
  indexed to a cumulative-production trajectory, so it cannot be validated against an assumed
  market-growth scenario.
- Internal inconsistency: HEFA-UCO's hard-coded $1.85/gal undercuts the guide's own $2.5-4.0/gal
  citation for the same pathway family.

**Framework alignment:** NREL SAF Techno-Economic Analysis and IEA SAF Report 2024 (cited as the
LCOF/capex benchmark source; code's constants are directionally consistent but not derived from a
live NREL TEA model) · ICAO CORSIA default LCA values (via the `ci` field, cross-consistent with
the companion `saf-carbon-credits` module's `ciByPathway` table) · IRS Notice 2023-06 §40B credit
(unit conversion correct, credit-scaling-by-CI-reduction formula from the companion
`saf-policy-mandate` module not reused here).

## 9 · Future Evolution

### 9.1 Evolution A — Bottom-up LCOF that the guide already specifies (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's genuine levelised-cost build — `LCOF = (CAPEX×CRF + OPEX)/AnnualProduction + FeedstockCost − §40B` — is not what runs: each pathway carries a hard-coded `lcof` (HEFA-UCO $1.85/gal, PtL-DAC $6.80/gal), the cost waterfall is one fixed 52/28/12/8 percentage split applied to every pathway (indefensible given pathways' materially different feedstock-vs-capex structures, per §7.5), no CRF or discount rate exists, feedstock prices don't flow through, and HEFA-UCO's $1.85 undercuts the guide's own $2.5–4.0/gal range. Evolution A implements the formula with pathway-specific cost structures.

**How.** (1) `POST /api/v1/saf-lcof/compute`: the four cost lines built independently per pathway — CAPEX×CRF (the platform's standard annuity factor, reused from the renewable engines), fixed/variable OPEX, feedstock cost from `saf-feedstock-supply-chain`'s reference prices (finally linking the sibling modules' data), minus the CI-scaled §40B from the shared credit service the SAF-credits evolution establishes — summing to LCOF rather than splitting a preset total. (2) Wright's Law properly indexed: learning rate applied to cumulative-production trajectories per deployment scenario, replacing the un-anchored annual decay. (3) The hard-coded pathway values become validation targets: the bottom-up build should land within published ranges (ICAO/IEA SAF cost studies), with the HEFA-UCO discrepancy resolved against those sources. (4) The 24 project benchmarks recompute from project-specific inputs.

**Prerequisites.** Pathway cost-structure research (capex per gal-capacity, opex shares — public techno-economic studies exist for all six ASTM D7566 pathways); sibling-module price linkage. **Acceptance:** waterfall components sum to LCOF and differ across pathways; a feedstock-price change propagates to LCOF; the bench HEFA case lands inside the cited published range.

### 9.2 Evolution B — Pathway-economics copilot for developers and airlines (LLM tier 2)

**What.** The module's users compare pathways under policy uncertainty: "at what UCO price does AtJ-Cellulosic beat HEFA in 2030, with and without §40B?", "explain PtL's $6.80/gal — which cost line dominates and what learning-rate assumption halves it by 2035?", "draft the offtake-committee comparison of three supply options". Each is a compute-endpoint tool call; crossover points are solved by parameter sweep, not model arithmetic.

**How.** Tier-2 tool schemas over `/compute` and the learning-curve endpoint; crossover and sensitivity answers enumerate the actual sweep calls behind them. Explanations decompose into the four computed cost lines with their input citations (feedstock price source, capex study). Policy-dependency statements (§40B expiry, mandate trajectories) route to `saf-policy-mandate`'s data rather than being restated from memory — the SAF module cluster is a natural early desk-orchestration pilot, and this copilot should reference, not duplicate. All $/gal figures validated against tool output.

**Prerequisites (hard).** Evolution A's bottom-up engine — narrating fixed percentage splits as cost structure would mislead investment decisions; sweep tooling. **Acceptance:** crossover answers reproduce from enumerated sweeps; decompositions sum to the quoted LCOF; policy claims cite the sibling module's data.