## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine states `Tainted Flow Ratio = Σ
> Climate Finance to Sanctioned Entities / Total Climate Finance x 100`. **This ratio is not
> computed anywhere in the code.** There is no aggregation of "total climate finance" against
> which a tainted-flow percentage could be expressed. What the code actually computes is (1) a
> per-company `exposureScore` (0-100, seeded PRNG) used for compliance triage, and (2) a real sum
> of blocked-project **redirected finance flows** by destination country. Both are useful compliance
> analytics, but neither is the ratio the guide describes.

### 7.1 What the module computes

```
exposureScore  = floor(sr(seed) x 100)                       // per company, 0-100
redirectedFlows[country] = Sum(valueMn) over CLIMATE_PROJECTS
                            where redirected includes country  // real aggregation
sectorExposure[sector].totalExposure = Sum(exposureScore) over companies in sector
```
16 named blocked/restricted climate-finance projects (`CLIMATE_PROJECTS`, e.g. "Russia Gas
Transition Program" $4.5Bn blocked under OFAC SDN, redirected to Turkey/India) and 100 synthetic
companies (`COMPANIES_100`) with sanctions-list match flags (`sdnMatch`, `euSanctioned`,
`ukSanctioned`, `unSanctioned`) and a seeded `exposureScore`/`revenue`.

### 7.2 Parameterisation

| Component | Content | Provenance |
|---|---|---|
| `CLIMATE_PROJECTS` (16 rows) | Named blocked/restricted renewable & adaptation projects with `valueMn`, `regime`, `redirected` destination, `emissions` avoided-lost estimate | Illustrative composite scenarios (plausible categories — gas-to-renewable, solar mega-parks, hydropower, grid modernisation — under real sanction regimes OFAC/EU/UN/UK) rather than actual named, verifiable deals |
| `COMPANIES_100` fields | `exposureScore = floor(sr(seed)x100)`, `revenue = floor(sr(seed2)x500+10)x100` | Synthetic demo |
| `DUAL_USE_TECH` (16 rows) | tech, category, control regime, China/Russia restriction flags, green application flag, price impact | Static reference table, plausible categorisation of dual-use export-control-listed clean technologies (e.g. advanced batteries, certain semiconductors) |
| Sanctions-list match flags | `sdnMatch`, `euSanctioned`, `ukSanctioned`, `unSanctioned` | Boolean flags per company — seeded, not screened against a live sanctions-list feed |

### 7.3 Calculation walkthrough

1. `redirectedFlows` is the module's one genuine aggregation: for every blocked/restricted project
   with a non-"None"/"N/A" `redirected` field, it splits the destination string on `/` (handling
   multi-destination redirects like "Turkey/India") and sums `valueMn` per destination country —
   correctly showing which jurisdictions absorb capital diverted from sanctioned climate projects.
2. `sectorExposure` groups `COMPANIES_100` by sector, summing `exposureScore` and counting
   companies per sanctions regime match — a real aggregation, but over synthetic underlying scores.
3. `radarData` counts, per sanctions regime (OFAC SDN/EU Restrictive/UK/UN), how many of the 100
   companies match that regime's flag — a genuine count over the boolean fields.
4. CSV export and the paginated company table are direct pass-throughs of `COMPANIES_100`, no
   further transformation.

### 7.4 Worked example

`redirectedFlows` for "Turkey": sourced from Russia Gas Transition Program ($4,500M, redirected to
"Turkey/India" — splits evenly attributed in code to both, i.e. Turkey gets credited the full
$4,500M not a 50/50 split since the code sums the **full** `valueMn` per listed destination) plus
Libya Grid Stabilization ($1,100M, redirected to Turkey) = `4,500 + 1,100 = $5,600M` total flow
redirected to Turkey across the 16-project universe — illustrating that sanctions on original
project geographies do not eliminate the underlying capital, they reroute it.

### 7.5 Data provenance & limitations

- `CLIMATE_PROJECTS` are illustrative composite scenarios under real sanction-regime names; a user
  should not treat the 16 rows as verified individual deals.
- `exposureScore`/`revenue` for the 100-company screening universe are synthetic PRNG output, not
  screened against a live OFAC/EU/UN/UK consolidated list — a production version would need a real
  sanctions-list API/feed and fuzzy entity-matching (as the guide's own user-interaction text
  describes: "map transaction flow networks... generate compliance alerts").
- The headline "Tainted Flow Ratio" metric the guide describes does not exist; there is no
  aggregate "total climate finance" denominator computed anywhere on the page.
- `redirectedFlows` double-attributes full project value to every listed redirect destination
  rather than splitting it proportionally, so summing the chart series across countries would
  overstate total redirected capital relative to the sum of blocked project values.

**Framework alignment:** OFAC SDN List, UN Security Council Consolidated Sanctions List, EU
Financial Sanctions Files (named correctly as the boolean match flags' source regimes, not wired
to a live feed) · FATF Guidance on Green Finance and AML 2023 (context only, no AML transaction-
network graph algorithm implemented despite the guide's description) · export-control dual-use
technology lists (Wassenaar Arrangement-style categorisation, reproduced qualitatively in
`DUAL_USE_TECH`).
