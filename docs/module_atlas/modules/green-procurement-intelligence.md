# Green Procurement Intelligence
**Module ID:** `green-procurement-intelligence` · **Route:** `/green-procurement-intelligence` · **Tier:** B (frontend-computed) · **EP code:** EP-DN6 · **Sprint:** DN

## 1 · Overview
Provides analytics for public and corporate green procurement — lifecycle cost analysis, green product market intelligence, environmental label verification, and EU Green Public Procurement criteria compliance. Models total cost of ownership for green alternatives and procurement carbon reduction potential.

> **Business value:** Essential for public procurement authorities, corporate sustainability procurement teams, and supply chain sustainability managers. Provides EU GPP criteria compliance checking, TCO green premium analysis, and procurement carbon reduction quantification for CSRD value chain reporting.

**How an analyst works this module:**
- Select procurement category for green alternatives analysis
- Compare TCO of green vs conventional options
- Check EU GPP criteria compliance for tender specifications
- Calculate carbon reduction from green procurement
- Generate ISO 20400-aligned sustainable procurement report

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Bar`, `CATEGORIES`, `KpiCard`, `PROGRAMMES`, `REGIONS`, `STANDARDS`, `STATUS`, `StatusBadge`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `STATUS` | `['Compliant', 'Partial', 'Non-Compliant', 'In Progress', 'Pending Review'];` |
| `colors` | `{ Compliant: T.green, Partial: T.amber, 'Non-Compliant': T.red, 'In Progress': T.blue, 'Pending Review': T.textSec };` |
| `totalSpend` | `useMemo(() => PROGRAMMES.reduce((a, p) => a + p.totalSpendMn, 0), []);` |
| `totalGreenSpend` | `useMemo(() => PROGRAMMES.reduce((a, p) => a + p.greenSpendMn, 0), []);` |
| `totalCo2Saved` | `useMemo(() => PROGRAMMES.reduce((a, p) => a + p.co2SavedT, 0), []);` |
| `totalSavings` | `useMemo(() => PROGRAMMES.reduce((a, p) => a + p.costSavingsMn, 0), []);` |
| `compliantCount` | `useMemo(() => PROGRAMMES.filter(p => p.status === 'Compliant').length, []); const avgGreenPct = useMemo(() => PROGRAMMES.reduce((a, p) => a + p.greenSpendPct, 0) / Math.max(1, PROGRAMMES.length), []);` |
| `standardBreakdown` | `useMemo(() => STANDARDS.map(std => {` |
| `totalGS` | `progs.reduce((a, p) => a + p.greenSpendMn, 0);` |
| `avgScore` | `progs.length ? progs.reduce((a, p) => a + p.certScore, 0) / progs.length : 0;` |
| `categoryBreakdown` | `useMemo(() => CATEGORIES.map(cat => {` |
| `totalS` | `progs.reduce((a, p) => a + p.totalSpendMn, 0);` |
| `co2` | `progs.reduce((a, p) => a + p.co2SavedT, 0);` |
| `savings` | `progs.reduce((a, p) => a + p.costSavingsMn, 0);` |
| `savingsAnalysis` | `useMemo(() => [ { lever: 'Energy Efficiency in Facilities', saving: Math.round(totalSavings * 0.28 * 100) / 100, co2: Math.round(totalCo2Saved * 0.25) }, { lever: 'Fleet Electrification', saving: Math.round(totalSavings * 0.22 * 100) / 100, co2: Math.round(totalCo2Saved * 0.20) }, { lever: 'Sustainable Packaging Switch', saving: Math.roun` |
| `top10Programmes` | `useMemo(() => [...PROGRAMMES].sort((a, b) => b.co2SavedT - a.co2SavedT).slice(0, 10), []);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATEGORIES`, `REGIONS`, `STANDARDS`, `STATUS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EU GPP Market | — | European Commission GPP Monitoring 2023 | Only 14% of EU public procurement meets Green Public Procurement criteria — large gap vs 50% target |
| GPP Carbon Reduction Potential | — | IPCC AR6 WGIII Chapter 13 | Green public procurement could reduce public sector emissions by 25% vs conventional procurement |
| Green Premium (procurement) | — | EU GPP Cost-Benefit Analysis 2022 | Green procurement premium averages 0–15% upfront — often neutral or positive on TCO basis |
- **Procurement category data + supplier product specs** → TCO comparison → **Green vs conventional TCO by procurement category**
- **EU GPP criteria documents by product group** → Compliance checking → **Procurement specifications aligned with EU GPP requirements**
- **Life cycle emission factor data (ecoinvent, EPDs)** → Carbon reduction calculation → **Annual procurement carbon footprint reduction from green alternatives**

## 5 · Intermediate Transformation Logic
**Methodology:** Green Procurement TCO
**Headline formula:** `GreenTCO = CapEx_green + Σ [(OpEx_green_t + ExternalCost_green_t) / (1+r)^t]; CarbonProcurementReduction = Σ [Spend_i × (ConvEmFactor_i - GreenEmFactor_i)]`

TCO includes external carbon cost (shadow price) for true cost comparison; carbon reduction potential aggregates emission factor differentials across green vs conventional procurement categories

**Standards:** ['EU Green Public Procurement Criteria 2023', 'ISO 20400:2017 Sustainable Procurement', 'OECD Green Public Procurement Report 2023', 'UN Sustainable Development Goals Procurement Framework']
**Reference documents:** EU Green Public Procurement Criteria (by product group) 2023; ISO 20400:2017 Sustainable Procurement — Guidance; OECD Green Public Procurement: Current Practice and Future Potential (2023); UN SDG Procurement Framework — SDG 12 Target 7

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry (EP-DN6) advertises a **Green Procurement TCO**
> (`GreenTCO = CapEx + Σ(OpEx + ExternalCost)/(1+r)^t`) and a **carbon-reduction** aggregation
> (`Σ[Spend_i·(ConvEF − GreenEF)]`). **Neither the discounted TCO nor the emission-factor differential is
> computed in the code.** The `co2SavedT` and `costSavingsMn` figures are **pre-tabulated fields** on the
> static `PROGRAMMES` array; the page sums them. This is a **green-procurement portfolio dashboard** —
> spend, green-spend %, CO₂ saved, savings, and standards/category breakdowns — over static data. §8
> specifies the TCO and carbon-differential model.

### 7.1 What the module computes

Pure aggregation over the static `PROGRAMMES` set:
```js
totalSpend      = Σ totalSpendMn
totalGreenSpend = Σ greenSpendMn
totalCo2Saved   = Σ co2SavedT
totalSavings    = Σ costSavingsMn
avgGreenPct     = Σ greenSpendPct / max(1, N)
compliantCount  = count(status == 'Compliant')
```
Breakdowns: `standardBreakdown` (green spend + avg cert score per standard), `categoryBreakdown` (spend,
CO₂, savings per category), a savings-lever allocation (`savingsAnalysis`, e.g. 28% of savings to energy
efficiency), and `top10Programmes` by `co2SavedT`.

### 7.2 Parameterisation / provenance

| Field | Nature | Provenance |
|---|---|---|
| `PROGRAMMES` (per-programme) | totalSpendMn, greenSpendMn, greenSpendPct, co2SavedT, costSavingsMn, certScore, status | static; curated/illustrative |
| `STATUS` | Compliant/Partial/Non-Compliant/In Progress/Pending | categorical labels |
| `savingsAnalysis` split | 28% energy efficiency, fleet, etc. | **hard-coded allocation** of total savings |
| `STANDARDS`, `CATEGORIES` | grouping keys | ISO 20400 / EU GPP framing |

No PRNG. The `co2SavedT` and `costSavingsMn` are inputs, not derived — the module trusts them rather than
computing them from spend × emission-factor differentials.

### 7.3 Calculation walkthrough

`PROGRAMMES` → sum spend/green-spend/CO₂/savings → KPI cards. `standardBreakdown` groups by standard and
means `certScore`; `categoryBreakdown` groups by category and sums spend/CO₂/savings. `savingsAnalysis`
apportions `totalSavings`/`totalCo2Saved` across named levers by fixed fractions. `top10Programmes` sorts by
`co2SavedT`. Every output is a reduction or grouping of static fields.

### 7.4 Worked example

Three programmes with `co2SavedT` = 4,000 / 2,500 / 1,500 t and `costSavingsMn` = 3.0 / 2.0 / 1.0:
`totalCo2Saved = 8,000 t`, `totalSavings = $6.0M`. The energy-efficiency lever = `totalSavings·0.28 =
6.0·0.28 = $1.68M` and `totalCo2Saved·0.25 = 8,000·0.25 = 2,000 t`. These are display allocations of
pre-supplied totals — the module cannot say *why* a programme saved 4,000 t, because the saving is an
input, not a spend×EF-differential output.

### 7.5 Data provenance & limitations

- **All programme data is static** and curated; CO₂ saved and cost savings are **given, not computed**.
- The guide's discounted **GreenTCO** (with external carbon shadow price) is **absent** — no life-cycle
  cost comparison of green vs conventional alternatives.
- The carbon-reduction differential (`Σ Spend·(ConvEF − GreenEF)`) is **absent** — CO₂ saved is not tied to
  emission factors, so it can't be audited against spend.
- Savings-lever splits are hard-coded fractions, not derived from the programme mix.

**Framework alignment:** EU Green Public Procurement Criteria (2023) — the compliance-status and green-spend
framing; ISO 20400:2017 sustainable procurement; OECD GPP; UN SDG procurement. Real GPP TCO accounting nets
capex, opex and an external carbon cost at a shadow price over the asset life — specified in §8.

## 8 · Model Specification — Green-Procurement TCO & Carbon-Reduction Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compare green vs conventional procurement on a true total-cost-of-ownership basis (including an external
carbon cost) and compute auditable procurement-carbon reduction from spend and emission factors — for
public/corporate procurement decisions.

### 8.2 Conceptual approach
Life-cycle TCO with a carbon shadow price (the EU GPP / ISO 20400 method), benchmarked against **EU GPP
cost-benefit analysis** and **OECD GPP** guidance: discount capex + opex + externalised carbon over the
asset life; the carbon reduction is a spend-weighted emission-factor differential.

### 8.3 Mathematical specification
```
GreenTCO = CapEx_green + Σ_t (OpEx_green,t + EF_green·Activity_t·CarbonPrice_t)/(1+r)^t
ConvTCO  = CapEx_conv  + Σ_t (OpEx_conv,t  + EF_conv·Activity_t·CarbonPrice_t)/(1+r)^t
TCO_advantage = ConvTCO − GreenTCO
CarbonReduction = Σ_i Spend_i · (ConvEF_i − GreenEF_i)/UnitPrice_i        (tCO₂e)
CostSaving      = Σ_t (OpEx_conv,t − OpEx_green,t)/(1+r)^t
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `EF_green/conv` | emission factors by category | DEFRA/EPA/ecoinvent EFs |
| `CarbonPrice_t` | shadow/market price | EU ETS / internal shadow price |
| `OpEx` paths | running cost by option | vendor quotes / benchmarks |
| `r` | discount rate | public discount rate (e.g. HM Treasury Green Book) |

### 8.4 Data requirements
Per category: green & conventional capex, opex, emission factors, activity/consumption, spend. Sources:
procurement records (spend), DEFRA/EPA EFs (free), vendor quotes, carbon-price policy. The module holds
spend and pre-computed CO₂/savings; replace with EF-driven computation.

### 8.5 Validation & benchmarking plan
Reconcile carbon reduction against EF-based bottom-up estimates; validate TCO advantage against EU GPP
cost-benefit case studies; sensitivity to carbon price and discount rate; audit CO₂ saved against spend×EF.

### 8.6 Limitations & model risk
Emission factors and opex paths are category- and region-specific; shadow carbon price is a policy choice
that swings TCO. Conservative fallback: report TCO advantage across low/central/high carbon-price and
discount-rate scenarios, and derive CO₂ saved from EFs rather than accepting supplied totals.

## 9 · Future Evolution

### 9.1 Evolution A — Build the discounted TCO and emission-factor differential (analytics ladder: rung 1 → 2)

**What.** §7 flags that neither headline model is computed: the guide's `GreenTCO = CapEx_green + Σ(OpEx_green + ExternalCost_green)/(1+r)^t` (with a carbon shadow price for true cost) and `CarbonProcurementReduction = Σ[Spend_i·(ConvEF_i − GreenEF_i)]` are absent — `co2SavedT` and `costSavingsMn` are pre-tabulated fields on the static `PROGRAMMES` set, and the page merely aggregates them (§8 marked "not yet implemented"). Evolution A builds both: a discounted total-cost-of-ownership model comparing green vs conventional procurement (capex + discounted opex + externalised carbon cost at a shadow price), and a carbon-reduction aggregation from emission-factor differentials across procurement categories — turning a static display into the TCO and abatement tool the guide describes.

**How.** (1) A backend route computing `GreenTCO` per the §5 formula from capex, opex path, discount rate, and a carbon shadow price; the green-vs-conventional TCO gap becomes a computed decision metric. (2) `CarbonProcurementReduction` from category spend × (conventional EF − green EF), using real emission factors (the platform's reference EF layer). (3) EU GPP criteria compliance flags per category.

**Prerequisites.** Emission factors by procurement category (reference EF layer); a carbon shadow-price input; the static `co2SavedT`/`costSavingsMn` reframed as model outputs. **Acceptance:** GreenTCO recomputes per §5 and responds to discount rate and shadow price; carbon reduction derives from EF differentials × spend; no pre-tabulated saving is presented as computed.

### 9.2 Evolution B — Procurement-decision copilot (LLM tier 2)

**What.** A copilot for public/corporate procurement teams: "over a 10-year horizon at €80/t shadow carbon, does the green fleet option beat conventional on TCO, and what's the carbon reduction?" tool-calls the Evolution A TCO and carbon-reduction endpoints, narrating the lifecycle cost comparison and EU GPP compliance.

**How.** Tier-2 tool-calling over the TCO/carbon endpoints; the grounding corpus is §5/§7 (Green Procurement TCO with external carbon cost, EU GPP criteria, emission-factor differentials). The copilot's value is true-cost procurement decisions incorporating externalised carbon. Guardrail, pre-Evolution-A: the TCO is unbuilt and savings pre-tabulated, so it must refuse TCO and carbon-reduction figures and answer only on GPP criteria facts. Every figure validated against tool output.

**Prerequisites.** Evolution A (no TCO model today); emission-factor data; corpus embedding. **Acceptance:** post-Evolution-A, every TCO and carbon-reduction figure traces to a tool call reproducing the §5 formulae; the shadow-price what-if moves the TCO; pre-Evolution-A the copilot declines quantitative TCO claims.