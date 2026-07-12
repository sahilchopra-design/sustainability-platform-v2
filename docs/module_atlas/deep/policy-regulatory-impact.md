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
