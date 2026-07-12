# Macro Transition Risk
**Module ID:** `macro-transition` · **Route:** `/macro-transition` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Macroeconomic transition risk analysis. Covers GDP growth impacts under NGFS scenarios, employment effects, sectoral output changes, trade flow shifts, and fiscal implications of carbon pricing.

> **Business value:** Macro transition risks are systemic — they affect entire economies, not just individual sectors. Understanding GDP, employment, and fiscal impacts enables policymakers, central banks, and investors to assess whether net-zero pathways are economically viable and politically sustainable.

**How an analyst works this module:**
- Macro Overview shows GDP and employment under 5 NGFS scenarios
- Sector Output shows production shifts by industry to 2050
- Fiscal Analysis shows carbon revenue, subsidy phase-out, and just transition spending
- Trade Flow shows changes in fossil fuel and clean tech export patterns
- Regional Divergence highlights unequal transition outcomes

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COUNTRY_TRANSITION`, `CRITICAL_MINERALS`, `Card`, `IEA_SCENARIOS`, `KpiCard`, `LS_KEY`, `PIE_COLORS`, `Section`, `SortTh`, `TABS`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `IEA_SCENARIOS` | 4 | `name`, `color`, `description`, `global_temp`, `coal_phaseout`, `oil_demand_2030_vs_2022`, `gas_demand_2030_vs_2022`, `renewables_2030_pct`, `ev_share_2030_pct`, `investment_clean_tn` |
| `COUNTRY_TRANSITION` | 21 | `country`, `coal_pct_generation`, `renewable_pct`, `nuclear_pct`, `fossil_pct`, `ev_sales_pct`, `clean_energy_investment_bn`, `fossil_subsidy_bn`, `grid_readiness`, `hydrogen_strategy`, `ccus_capacity_mt`, `critical_minerals_dependency`, `energy_import_dependency_pct`, `transition_jobs_created_k`, `transition_jobs_lost_k` |
| `CRITICAL_MINERALS` | 9 | `use`, `top_producers`, `supply_risk`, `demand_growth_2030_pct`, `recycling_rate_pct` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `renScore` | `Math.min(c.renewable_pct, 100) * 0.30;` |
| `evScore` | `Math.min(c.ev_sales_pct, 100) * 0.15;` |
| `gridScore` | `c.grid_readiness * 0.20;` |
| `investScore` | `Math.min((c.clean_energy_investment_bn / (c.clean_energy_investment_bn + c.fossil_subsidy_bn)) * 100, 100) * 0.20;` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `countriesWithScores` | `useMemo(() => COUNTRY_TRANSITION.map(c => ({ ...c, transition_readiness: computeTransitionReadiness(c) })), []);` |
| `avgReadiness` | `useMemo(() => Math.round(countriesWithScores.reduce((s, c) => s + c.transition_readiness, 0) / countriesWithScores.length), [countriesWithScores]);` |
| `totalFossilPct` | `useMemo(() => Math.round(countriesWithScores.reduce((s, c) => s + c.fossil_pct, 0) / countriesWithScores.length), [countriesWithScores]);` |
| `energyMixData` | `useMemo(() => Array.from({ length: 7 }, (_, i) => { const yr = 2020 + i * 5;` |
| `evData` | `useMemo(() => generateEVCurve(selectedScenario), [selectedScenario]);  /* country energy stacked bar */ const countryEnergyData = useMemo(() => countriesWithScores.slice().sort((a, b) => b.renewable_pct - a.renewable_pct).map(c => ({ country: c.iso2, Coal: c.coal_pct_generation, Renewable: c.renewable_pct, Nuclear: c.nuclear_pct, OtherFos` |
| `readinessRanked` | `useMemo(() => [...countriesWithScores].sort((a, b) => b.transition_readiness - a.transition_readiness).map(c => ({ country: c.iso2, readiness: c.transition_readiness, fill: c.transition_readiness >= 70 ? T.green : c.transition_readiness >= 50 ? T.gold : c.transition_readiness >= 30 ? T.amber : T.red, })), [countriesWithScores]);` |
| `investVsSubsidy` | `useMemo(() => countriesWithScores.map(c => ({ country: c.iso2, 'Clean Investment': c.clean_energy_investment_bn, 'Fossil Subsidies': c.fossil_subsidy_bn })), [countriesWithScores]);` |
| `jobsData` | `useMemo(() => countriesWithScores.map(c => ({ country: c.iso2, Created: c.transition_jobs_created_k, Lost: -c.transition_jobs_lost_k })), [countriesWithScores]);` |
| `hydrogenData` | `useMemo(() => countriesWithScores.filter(c => c.hydrogen_strategy).map(c => ({ country: c.iso2, ccus_mt: c.ccus_capacity_mt, grid: c.grid_readiness, invest: c.clean_energy_investment_bn })), [countriesWithScores]);` |
| `readiness` | `ctry ? computeTransitionReadiness(ctry) : Math.round(30 + seed(i + 99) * 50);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRY_TRANSITION`, `CRITICAL_MINERALS`, `IEA_SCENARIOS`, `PIE_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| GDP Change (Orderly NZ) | — | NGFS/IMF | Net GDP benefit of orderly transition vs delayed action |
| GDP Change (Disorderly) | — | NGFS | Disruption from abrupt policy shock |
| Green Jobs Created (2030) | — | IRENA | New jobs in clean energy across all sectors |
- **NGFS scenario parameters** → Macro model simulation → **GDP and employment paths**
- **Sector output changes** → Trade flow analysis → **Trade impact by commodity**
- **Carbon revenue** → Fiscal policy analysis → **Just transition financing capacity**

## 5 · Intermediate Transformation Logic
**Methodology:** Macro climate transition model
**Headline formula:** `GDP_impact = Direct + Indirect + Productivity_loss; Employment = Fossil_lost - Green_gained`

GDP effect: orderly transition = 1-3% GDP gain by 2050 vs baseline (green investment). Disorderly = -1 to -4% GDP disruption. Employment: net positive in most scenarios by 2030 (IRENA data) but regional displacement.

**Standards:** ['NGFS Macro Scenarios', 'IMF Climate Macro', 'Cambridge Econometrics E3ME']
**Reference documents:** NGFS Macro Economic Scenarios; IMF World Economic Outlook Climate Chapter; Cambridge Econometrics E3ME Model; ILO World Employment Social Outlook

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Partial guide↔code mismatch.** The guide's formula `GDP_impact = Direct + Indirect +
> Productivity_loss` is never computed — there is no GDP-impact figure anywhere in the code. The
> guide's `Employment = Fossil_lost − Green_gained` **is** present, but only as two independent static
> fields per country (`transition_jobs_created_k`, `transition_jobs_lost_k`) that are hand-authored,
> not derived from any employment multiplier model. What the module actually implements well is a
> **deterministic, weighted transition-readiness score** and two **real curve-fitting functions**
> (logistic EV-adoption S-curve, linear scenario-interpolated energy mix) — genuinely more rigorous
> than most sibling modules in this batch.

### 7.1 What the module computes

20 countries (Germany, US, China, Japan, India, UK, France, Brazil, South Korea, Australia, Canada,
Saudi Arabia, South Africa, Indonesia, Mexico, Norway, Sweden, Poland, UAE, Chile) each carry 13
**hand-authored, static** energy-transition attributes (coal/renewable/nuclear generation %, EV sales
%, clean-energy investment $Bn, fossil subsidy $Bn, grid readiness, hydrogen strategy flag, CCUS
capacity, critical-minerals dependency tier, energy import dependency %, transition jobs
created/lost). These feed a genuine deterministic composite:

```js
transitionReadiness = min(renewable_pct,100)×0.30
                     + min(ev_sales_pct,100)×0.15
                     + grid_readiness×0.20
                     + min(clean_investment/(clean_investment+fossil_subsidy)×100, 100)×0.20
                     + (hydrogen_strategy ? 15 : 0)
```

### 7.2 Parameterisation

| Construct | Detail | Provenance |
|---|---|---|
| `IEA_SCENARIOS` (3: NZE/APS/STEPS) | Global temp 1.5°C/1.7°C/2.5°C, coal phase-out year 2040/2050/2060, oil/gas demand deltas, renewables %, EV share %, clean investment $tn | **Real** — correctly matches actual IEA World Energy Outlook scenario definitions and directional figures (NZE requiring no new fossil projects, 90% clean electricity by 2035 is accurately described in the narrative text) |
| `COUNTRY_TRANSITION` (20 countries × 13 fields) | Static, plausible real-world-consistent figures (Germany 52% renewable/0% nuclear post-phaseout; France 65% nuclear/1% coal; Saudi Arabia 99% fossil/$42Bn subsidy; Norway 98% renewable/82% EV sales) | Hand-authored, directionally accurate to each country's known energy profile, though undated/unsourced inline |
| Readiness weights (30/15/20/20/15) | Author-defined composite, no external calibration cited | — |
| `CRITICAL_MINERALS` (8) | Real minerals (Lithium, Cobalt, Nickel, Rare Earths, Copper, Silicon, Platinum, Manganese) with correct top-producer countries (DRC/Indonesia/Russia for Cobalt; China/Myanmar/Australia for Rare Earths) and plausible supply-risk tiers | **Real**, correctly-sourced geopolitical/geological facts |
| Portfolio-exposure fallback | `Math.round(30 + seed(i+99)×50)` for holdings whose country can't be matched to `COUNTRY_TRANSITION` | Synthetic demo value, only used as a fallback |

### 7.3 Calculation walkthrough — genuine curve models

- **Energy mix generator** (`generateEnergyMix`): linear interpolation over `t=(year−2020)/30` from
  a 2020 baseline (coal 27%, oil 30%, gas 23%, nuclear 10%, renewables 10%) toward each scenario's
  2050 endpoint — e.g. under NZE, coal declines `27 − t×27` (reaching 0% by 2050), renewables rise
  `10 + t×80` (reaching 90%); under STEPS, coal only declines to a 17% floor and gas actually *rises*
  (`23 + t×5`) — correctly capturing the IEA's qualitative scenario contrast in a simple linear model.
- **EV adoption curve** (`generateEVCurve`): a genuine **logistic S-curve** —
  `pct = 2 + A / (1 + e^(−k(t−t₀)))` with scenario-specific saturation `A` (93/65/40 percentage
  points), steepness `k` (8/7/6), and inflection point `t₀` (0.4/0.45/0.5 of the 2020-2040 span) —
  correctly modelling the real S-shaped technology-adoption pattern (slow start → rapid middle
  growth → saturation) rather than a naive linear ramp.
- **Transition readiness score**: applied live to all 20 countries (`countriesWithScores`) and
  ranked/colour-coded (green ≥70, gold ≥50, amber ≥30, red <30) for the "Readiness Ranked" bar chart.

### 7.4 Worked example — transition readiness, Germany

`renewable_pct=52, ev_sales_pct=31, grid_readiness=78, clean_energy_investment_bn=36,
fossil_subsidy_bn=12, hydrogen_strategy=true`:
```
renScore   = min(52,100)×0.30 = 15.6
evScore    = min(31,100)×0.15 = 4.65
gridScore  = 78×0.20 = 15.6
investRatio = 36/(36+12) = 0.75 → min(75,100)×0.20 = 15.0
h2Score    = 15
readiness  = round(15.6+4.65+15.6+15.0+15) = round(65.85) = 66
```
Compare Saudi Arabia (`renewable_pct=1, ev_sales_pct=1, grid_readiness=30,
clean_investment=5, fossil_subsidy=42, hydrogen_strategy=true`):
```
renScore=0.3, evScore=0.15, gridScore=6.0, investRatio=5/47=0.106→2.13, h2Score=15
readiness = round(0.3+0.15+6.0+2.13+15) = round(23.58) = 24
```
Correctly places Germany in the "Moderate-High" (gold) band and Saudi Arabia in the "Low" (red) band
— the formula behaves sensibly at both extremes.

### 7.5 Companion analytics

- **Energy mix stacked bar** (per-country) — `Coal/Renewable/Nuclear/OtherFossil` bars sorted by
  renewable share, direct rendering of the static country fields.
- **Investment vs Subsidy chart** — `Clean Investment` vs `Fossil Subsidies` per country, both static
  fields, letting a user visually assess each country's public-capital allocation stance.
- **Jobs chart** — `Created` vs `−Lost` (negated for a diverging bar) per country, both static fields
  with no netting formula applied in the chart itself (netting, if shown, would be a simple
  subtraction the chart does not perform — it displays both bars separately).
- **Critical Minerals** — reference table with demand-growth-to-2030 % and recycling-rate %, both
  plausible real figures (Lithium +340% demand growth by 2030 is broadly consistent with IEA critical
  minerals outlook orders of magnitude).

### 7.6 Data provenance & limitations

- All 20-country attribute values are static and undated; a production version should refresh
  against IEA World Energy Balances / Ember electricity data annually.
- The transition-readiness weighting (30/15/20/20/15) is author-chosen; no sensitivity analysis or
  external validation is presented.
- No GDP-impact or employment-multiplier model exists despite the guide's stated formulas — jobs
  created/lost are static per-country point estimates, not derived from a sectoral employment model.
- Portfolio Exposure tab's fallback readiness score for unmatched holdings (`30+seed(i+99)×50`) is
  synthetic and should not be conflated with the real 20-country readiness scores.

**Framework alignment:** IEA WEO NZE/APS/STEPS scenario framework is accurately represented, both
narratively and in the interpolated energy-mix/EV-curve outputs. NGFS and Cambridge Econometrics
E3ME (named in the guide as the underlying macro model) are not implemented — this module is a
country-level transition-readiness scorecard, not a macroeconomic GDP/employment simulation.

## 9 · Future Evolution

### 9.1 Evolution A — Add the missing GDP-impact layer and source the country table (analytics ladder: rung 2 → 3)

**What.** §7 rates this above its siblings: a genuinely deterministic transition-readiness composite (weights 0.30/0.15/0.20/0.20 + hydrogen bonus 15, documented), real curve-fitting (logistic EV S-curve, scenario-interpolated energy mix), and 20 countries of hand-authored — not seeded — attributes. Its gaps: the guide's `GDP_impact = Direct + Indirect + Productivity_loss` is entirely absent; employment figures are static fields, not multiplier-model outputs; and the country attributes carry no citations despite being the kind of data IEA/IRENA/BNEF publish annually. Evolution A: (1) source the `COUNTRY_TRANSITION` table — coal/renewable generation shares from Ember/IEA (public), EV shares from IEA Global EV Outlook, clean investment from the platform's data layers, fossil subsidies from IMF's public subsidy database — each with vintage; (2) add the GDP-impact layer by joining the NGFS Phase 5 extract already seeded in-platform (GDP paths per scenario are what NGFS *is*), so the Macro Overview tab's scenario GDP claims become read data, not prose; (3) employment as `jobs × IRENA multipliers` per technology deployment, replacing static created/lost pairs.

**How.** (1) An annual-refresh ingester for the 3–4 public series; the readiness composite recomputes on refreshed data (its arithmetic already works). (2) `GET /macro-transition/scenario-impacts?country=&scenario=` serving NGFS GDP/employment paths with phase and vintage. (3) The seeded fallback for unmatched portfolio countries (`30 + seed(i+99)·50`) replaced with an honest no-match state. (4) Critical-minerals table cross-referenced to IEA's Critical Minerals Outlook with dates.

**Prerequisites.** Public-data ingestion slots; NGFS extract join (exists). **Acceptance:** each country attribute carries source+vintage; scenario GDP figures trace to NGFS records; readiness rankings recompute when the annual refresh lands; the fallback seed is gone.

### 9.2 Evolution B — Transition-macro briefing analyst for central-bank-style questions (LLM tier 2)

**What.** The module's audience (policymakers, central banks, allocators) asks synthesis questions across its tabs: "is Poland's transition politically sustainable — readiness score, jobs balance, fiscal exposure?", "what does Disorderly do to GDP for fossil-importing vs exporting countries in our panel?", "which countries' clean investment exceeds their fossil subsidies, and who's moving fastest?" Each is a computed comparison over the sourced table plus NGFS paths, narrated with the readiness decomposition shown.

**How.** Tier 2: tool schemas over the readiness and scenario-impact routes; comparative answers show the composite's five weighted terms per country (the formula is the module's genuine asset — the copilot exposes it rather than summarising it away). Scenario narratives cite NGFS phase/scenario/anchor-year; employment claims state whether they're multiplier-derived or reported; minerals-dependency answers quote the supply-risk tiers with their IEA vintage. Political-sustainability framing stays descriptive (jobs balance, subsidy exposure, readiness percentile) — the copilot surfaces the evidence for a judgement it does not make. Cross-references: country ESG composites to macro-esg-intelligence, JT mechanics to the just-transition family, with boundaries stated.

**Prerequisites.** Evolution A's sourcing and NGFS join (tier 1 explanation of the current curated table could ship earlier with uncited-data caveats); Phase 2 tooling. **Acceptance:** every figure carries source+vintage or an NGFS trace; readiness comparisons show term-level decomposition; no scenario number without a phase citation.