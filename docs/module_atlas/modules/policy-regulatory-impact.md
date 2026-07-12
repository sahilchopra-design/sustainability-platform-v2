# Policy & Regulatory Impact
**Module ID:** `policy-regulatory-impact` · **Route:** `/policy-regulatory-impact` · **Tier:** B (frontend-computed) · **EP code:** EP-CB3 · **Sprint:** CB

## 1 · Overview
6 policy instrument deep-dives: EU ETS price trajectory, CBAM cumulative liability model, UK MEES/EPC building standards, US IRA green tax credits, EU Taxonomy alignment, and ICAO CORSIA aviation offsetting.

**How an analyst works this module:**
- Policy Landscape tab shows all 6 instruments with jurisdiction and effective date
- EU ETS Deep-Dive shows historical and forecast price trajectory
- CBAM Impact models cumulative liability 2024-2034 by sector
- IRA Green Acceleration shows tax credit breakdown and investment impact
- Building Standards shows EPC band distribution and MEES compliance
- Portfolio Exposure aggregates policy impact across all holdings

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `POLICIES`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `POLICIES` | 30 | `name`, `type`, `jurisdiction`, `icon`, `color`, `status`, `effective`, `sectors`, `price_floor`, `price_ceiling`, `current_price`, `allowance_traj`, `year`, `allowances`, `price` |
| `ETS_PRICE_DATA` | 13 | `price` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Policy Landscape', 'EU ETS Deep-Dive', 'CBAM Impact', 'IRA Green Acceleration', 'Building Standards', 'Portfolio Exposure'];` |
| `totalRevImpact` | `POLICIES.reduce((s, p) => s + p.revenue_impact_bn, 0);` |
| `totalCostImpact` | `POLICIES.reduce((s, p) => s + p.cost_impact_bn, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ETS_PRICE_DATA`, `POLICIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EU ETS Price (2030) | `Supply-demand model` | EC DG CLIMA | Projected EU ETS allowance price based on Market Stability Reserve |
| CBAM Liability (portfolio) | `Import volume × embedded carbon` | EU CBAM Registry | Annual CBAM cost for portfolio companies importing into EU |
| IRA Solar Credit | `Production Tax Credit` | US IRA 2022 | Per-kWh tax credit for solar electricity generation |
| UK MEES Risk | `Below EPC C threshold` | MHCLG | Properties at risk of non-compliance with minimum energy standards |

## 5 · Intermediate Transformation Logic
**Methodology:** Policy instrument impact modelling
**Headline formula:** `CBAM_liability = Σ(ImportVolume_i × EmbeddedCarbon_i × (EU_ETS_price - Origin_carbon_price_i))`

Each policy instrument modelled with jurisdiction-specific parameters. EU ETS: allowance supply-demand balance drives price trajectory. CBAM: 6 sectors (steel, cement, aluminium, fertilizers, electricity, hydrogen) with embedded carbon calculation. IRA: tax credits per unit ($0.0275/kWh solar, $3/kg H₂, $7,500/EV, $180/t DAC).

**Standards:** ['EU ETS Directive', 'CBAM Regulation 2023/956', 'IRA 2022']
**Reference documents:** EU ETS Directive 2003/87/EC (Phase IV); CBAM Regulation (EU) 2023/956; US Inflation Reduction Act 2022; UK MEES Regulations 2015; ICAO CORSIA Standards

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide gives a computed CBAM formula
> (`CBAM_liability = Σ(ImportVolume_i × EmbeddedCarbon_i × (EU_ETS_price − Origin_carbon_price_i))`).
> **This formula is not evaluated anywhere in the code.** The CBAM liability trajectory
> (`$0.8B→$4.2B→$18.6B→$34.2B`, 2024→2034) is a hard-coded array inside the `POLICIES[1]` object,
> not the output of any import-volume × carbon-price calculation. All 6 policy instruments follow
> the same pattern: real, well-sourced reference figures presented as static constants rather than
> as formula outputs.

### 7.1 What the module computes

The only genuinely computed quantities are portfolio-wide sums over the 6 static policy objects:

```js
totalRevImpact  = Σ POLICIES.revenue_impact_bn
totalCostImpact = Σ POLICIES.cost_impact_bn
strandedCount   = POLICIES.filter(p => p.stranded_trigger).length
```
Every other number — EU ETS allowance/price trajectory, CBAM sector liability, IRA credit rates,
MEES EPC penalty schedule, EU Taxonomy alignment %, CORSIA offset volumes — is a literal constant
in the `POLICIES` array, entered by hand from public sources.

### 7.2 Parameterisation

| Instrument | Key cited figures | Provenance |
|---|---|---|
| EU ETS | Cap 1,350Mt(2024)→450Mt(2030); price €65(2024)→€130(2030); LRF 4.3%/yr | EU ETS Directive Phase IV parameters — real, correctly stated |
| CBAM | 6 sectors; liability €0.8B(2024)→€34.2B(2034) | Regulation (EU) 2023/956 — sector list correct; liability trajectory is an illustrative projection, not derived from any import-volume dataset |
| UK MEES/EPC | EPC E(2018)→D(2027)→C(2030)→B(2035); penalties £150k→£300k | UK MEES Regulations 2015 — correctly stated real thresholds |
| US IRA | Solar PTC $0.0275/kWh; Wind PTC $0.0265/kWh; EV credit $7,500; 45Q $85/t (geological)/$180/t (DAC) | IRA 2022 — genuine, correctly stated statutory rates |
| EU Taxonomy | Aligned % 12(2024)→35(2030) | Illustrative adoption-curve projection, not tied to real portfolio taxonomy alignment data |
| ICAO CORSIA | Coverage 40%(2024)→85%(2030); offset need 48Mt→280Mt | CORSIA phase schedule — correctly characterised |

### 7.3 Calculation walkthrough

1. Each policy card computes nothing beyond the two portfolio-wide sums (§7.1); selecting a policy
   just filters which static `allowance_traj` array feeds the tab's chart.
2. **EU ETS Deep-Dive** (tab 1): a separate hard-coded `ETS_PRICE_DATA` array (2019–2030) — note it
   does **not** match `POLICIES[0].allowance_traj`'s embedded price field exactly at overlapping
   years (both are illustrative but independently authored, so the two views can show slightly
   different €/t figures for the same year — a minor internal inconsistency).
3. **Portfolio Exposure** (tab 5): bar chart of all 6 policies' `revenue_impact_bn`/`cost_impact_bn`
   — a real chart over static inputs, no additional weighting by actual portfolio holdings.

### 7.4 Worked example

`totalRevImpact = -18.4 (ETS) + -4.8 (CBAM) + -2.2 (MEES) + 48.0 (IRA) + 15.2 (Taxonomy) + -1.8
(CORSIA) = +$36.0B`. `totalCostImpact = 24.8+12.4+8.9-8.2+3.8+4.2 = $45.9B`. `strandedCount` = 2
(ETS and MEES flag `stranded_trigger: true`) → displayed as "2/6".

### 7.5 Data provenance & limitations

- All figures are **static illustrative reference constants**, several of them genuine published
  statutory rates (IRA credits, MEES penalty caps) and others illustrative projections (CBAM
  liability trajectory, EU Taxonomy alignment curve) — the deep-dive table above separates the two
  categories.
- No portfolio-holdings integration: "Revenue Impact"/"Cost Impact" are instrument-level global
  aggregates, not computed against any specific user portfolio.
- ETS price series inconsistency between tab 0/1 (§7.3.2) should be reconciled to a single source
  array.

## Framework alignment

**EU ETS Directive (Phase IV)** — correctly parameterised (LRF, cap trajectory, sector coverage).
**CBAM Regulation (EU) 2023/956** — correct sector list and phase-in timeline; liability figure is
illustrative, not computed from the regulation's actual embedded-carbon formula. **US IRA 2022** —
statutory credit rates are accurate as of the Act's published schedule. **UK MEES Regulations 2015**
— EPC band timeline and penalty caps match the regulation.

## 9 · Future Evolution

### 9.1 Evolution A — Compute the CBAM liability and policy impacts from real portfolio data (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide gives a computed CBAM formula (`CBAM_liability = Σ(ImportVolume × EmbeddedCarbon × (EU_ETS_price − Origin_carbon_price))`), but the liability trajectory (€0.8B→€34.2B, 2024–2034) is a hard-coded array in `POLICIES[1]`, not a calculation. All 6 instruments follow this pattern — genuinely well-sourced, correctly-stated real reference figures (EU ETS cap/price/LRF, IRA statutory rates $0.0275/kWh solar / $3/kg H₂ / $7,500 EV / 45Q $85–180/t, UK MEES EPC bands and penalties) presented as static constants. The only computed quantities are portfolio-wide sums over the static objects. Evolution A turns the accurate reference data into live per-portfolio impact.

**How.** (1) Implement the documented CBAM formula against a real portfolio's import exposure: `import_volume × embedded_carbon × (EU_ETS_price − origin_price)` per the 6 covered sectors (steel/cement/aluminium/fertiliser/electricity/hydrogen), using the real ETS price path and origin carbon prices — so CBAM liability responds to actual holdings, not a hard-coded array. (2) IRA credit value computed from a portfolio's eligible assets × the (correctly-stated) statutory rates. (3) MEES exposure from a real-estate portfolio's EPC-band distribution against the D(2027)/C(2030)/B(2035) thresholds. (4) The Portfolio Exposure tab (§1) then aggregates real per-instrument impacts, not sums of static constants. The reference figures are already correct — connect them to portfolio data.

**Prerequisites.** Portfolio import/asset exposure data (analyst-entered or sourced); the policy parameters are already real and correctly stated — reuse them as the rate/threshold layer. Keep the accurate reference tables. **Acceptance:** CBAM liability reproduces from real import volumes × the documented formula; IRA/MEES impacts respond to actual portfolio composition; the Portfolio Exposure tab reflects computed per-holding impact.

### 9.2 Evolution B — Policy-impact copilot for regulatory analysts (LLM tier 1 → 2)

**What.** A copilot for the workflow §1 describes: "what's my CBAM liability on steel imports under €90/t ETS?", "how much IRA credit does this solar portfolio qualify for?", "when does MEES band C bite and what are the penalties?", "compare EU ETS and UK ETS trajectories" — grounded in the accurate policy reference data and the EU ETS Directive / CBAM Regulation / IRA references named in §5.

**How.** Tier 1 is strong immediately because the reference figures are real and correctly stated: system prompt from this Atlas page's `POLICIES` data (§7.2); the copilot answers policy-parameter questions (ETS caps, IRA rates, MEES thresholds, CBAM sectors) with citations to the actual regulation. Tier 2, post-Evolution-A: liability and credit calculations become tool calls to the CBAM/IRA/MEES engines over real portfolio exposure, with the fabrication validator matching every €/liability figure to outputs. The copilot must distinguish the correctly-stated statutory parameters (real) from the current hard-coded liability trajectories (illustrative) until Evolution A makes them computed.

**Prerequisites.** Tier 1 works on the accurate reference data; portfolio-specific liability needs Evolution A. **Acceptance:** policy-parameter answers cite the correct regulation; liability/credit figures (post-Evolution-A) trace to tool calls over real exposure; the copilot flags illustrative-vs-computed figures.