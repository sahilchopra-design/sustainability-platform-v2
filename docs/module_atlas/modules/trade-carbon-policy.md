# Trade Carbon Policy
**Module ID:** `trade-carbon-policy` · **Route:** `/trade-carbon-policy` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Carbon border adjustment and trade policy analytics platform modelling CBAM impact on import costs, supply chain competitiveness and trade flow shifts under EU CBAM and emerging global equivalents.

> **Business value:** EU CBAM entered transitional phase in October 2023 with full financial obligations from 2026; affected imports represent ≊€69 billion annually; steel and aluminium sectors face the largest immediate exposures.

**How an analyst works this module:**
- Identify CBAM-covered goods in import supply chain
- Calculate embedded GHG emissions using CBAM methodology
- Determine carbon price paid in exporting country
- Compute CBAM liability at current and projected ETS prices
- Model supply chain restructuring to reduce CBAM exposure

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CBAM_IMPORTERS`, `CBAM_SECTORS`, `COLORS`, `COUNTRIES_40`, `COUNTRY_POLICIES`, `IMP_NAMES`, `TRADE_FLOWS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `COUNTRY_POLICIES` | `COUNTRIES_40.map((c,i)=>{` |
| `from` | `COUNTRIES_40[Math.floor(s1*20)+10];` |
| `sectorSummary` | `useMemo(()=>{ return CBAM_SECTORS.map(s=>{ const imps=CBAM_IMPORTERS.filter(c=>c.sector===s);` |
| `filteredImporters` | `useMemo(()=>{ let f=CBAM_IMPORTERS.map(c=>({...c,adjustedCost:+(c.cbamCostMn*(carbonPrice/80)).toFixed(1)}));` |
| `countryPolicySummary` | `useMemo(()=>{ return[{name:'Active CBAM',value:COUNTRY_POLICIES.filter(c=>c.carbonBorderMech.includes('Active')).length}, {name:'Planned/Proposed',value:COUNTRY_POLICIES.filter(c=>c.carbonBorderMech.includes('2027')\|\|c.carbonBorderMech.includes('Potential')\|\|c.carbonBorderMech==='Proposed').length}, {name:'Climate Club',value:COUNTRY_POLI` |
| `virtualCarbonBalance` | `useMemo(()=>{ return [...COUNTRY_POLICIES].sort((a,b)=>b.virtualCarbonBalance-a.virtualCarbonBalance).slice(0,20).map(c=>({ country:c.country,balance:c.virtualCarbonBalance,embeddedMn:c.embeddedCO2Mn }));` |
| `scatterData` | `useMemo(()=>{ return TRADE_FLOWS.map(f=>({x:f.tradeBn,y:f.carbonIntensity,z:f.embeddedMtCO2,name:`${f.from}→${f.to} (${f.sector})`}));` |
| `pagedImporters` | `filteredImporters.slice(compPage*PAGE_SIZE,(compPage+1)*PAGE_SIZE);` |
| `totalPages` | `Math.ceil(filteredImporters.length/PAGE_SIZE);` |
| `headers` | `['Company','Sector','Country','Volume Tons','Emissions tCO2/t','CBAM Cost $M','Default Value','Actual Emissions','Compliance','Reporting Gap','Cost Pass-Through %','Competitive'];` |
| `rows` | `filteredImporters.map(c=>[c.name,c.sector,c.country,c.importVolumeTons,c.embeddedEmissions,c.adjustedCost,c.defaultValue,c.actualEmissions,c.complianceStatus,c.reportingGap,c.costPassThrough,c.competitiveAdv].join(','));` |
| `blob` | `new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);` |
| `totalCost` | `CBAM_IMPORTERS.reduce((a,c)=>a+c.cbamCostMn*(p/80),0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CBAM_IMPORTERS`, `CBAM_SECTORS`, `COLORS`, `COUNTRIES_40`, `IMP_NAMES`, `TRADE_FLOWS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Estimated Annual CBAM Liability | — | CBAM Model | Projected annual carbon border adjustment cost on imports of CBAM-covered goods at current ETS prices. |
| CBAM-Exposed Import Value | — | Trade Data | Value of imports in CBAM-covered sectors (steel, cement, aluminium, fertilisers, electricity, hydrogen). |
| Origin Country Carbon Price Gap | — | ICAP Carbon Price Survey | Average gap between EU ETS price and carbon price paid in exporting countries; determines CBAM surcharge. |
- **Import Customs Data, Embedded Emissions Certificates, EU ETS Price Feed** → CBAM liability engine + supply chain restructuring model + trade flow analytics → **CBAM liability reports, supply chain optimisation scenarios, regulatory compliance filings**

## 5 · Intermediate Transformation Logic
**Methodology:** CBAM Liability
**Headline formula:** `CBAM = (Embedded CO2 – Carbon Price Paid) × EU ETS Price`

Import-level carbon border adjustment based on difference between embedded emissions and carbon price already paid in country of origin, multiplied by prevailing EU ETS carbon price.

**Standards:** ['EU CBAM Regulation 2023/956', 'EU ETS Directive 2003/87/EC']
**Reference documents:** EU CBAM Regulation (EU) 2023/956; EU ETS Directive 2003/87/EC as amended; ICAP Emissions Trading Worldwide Status Report 2023; WTO Compatibility Analysis of CBAM

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry states the CBAM liability formula as
> `CBAM = (Embedded CO2 − Carbon Price Paid) × EU ETS Price` — the real EU CBAM certificate
> mechanism. **The code does not compute this.** Each of the 100 synthetic importers is assigned an
> already-final `cbamCostMn` (a random $0.5M–$50.5M draw), and the on-page "CBAM Certificate Cost
> Calculator" merely rescales that pre-baked number linearly with a carbon-price slider
> (`cbamCostMn × (price/80)`). The `embeddedEmissions`, `defaultValue` and `actualEmissions` fields
> that the real formula would require are generated independently and never combined into a CBAM
> cost. The sections below document what the code actually computes.

### 7.1 What the module computes

The page is a static, client-generated dataset of 100 synthetic CBAM-exposed importers (6 CBAM
sectors: Cement, Iron & Steel, Aluminium, Fertilisers, Electricity, Hydrogen) plus a 40-country
carbon-border-policy landscape and a 30-flow trade matrix — all produced once at module load via the
seeded PRNG `sr(s)=frac(sin(s+1)×10⁴)` and then filtered/aggregated/re-scaled interactively. There
is no backend engine.

```js
adjustedCost(importer, price) = importer.cbamCostMn × (price / 80)   // linear rescale, base €80/tCO2
```

### 7.2 Parameterisation

| Field | Formula | Range | Provenance |
|---|---|---|---|
| `sector` | `CBAM_SECTORS[⌊s1×6⌋]` | 6 categories | Real EU CBAM Regulation (EU) 2023/956 Annex I sector list |
| `cbamCostMn` | `s5×50+0.5` | €0.5M–€50.5M | **Synthetic demo value — not derived from embedded emissions or carbon price** |
| `embeddedEmissions` | `s4×2.5+0.3` | 0.3–2.8 tCO₂/t | Synthetic demo value, unconnected to `cbamCostMn` |
| `defaultValue` | `s1×3+0.5` | 0.5–3.5 | Represents the CBAM "default value" fallback emissions factor concept; synthetic |
| `actualEmissions` | `s2×2.5+0.2` | 0.2–2.7 | Synthetic, unconnected to `cbamCostMn` |
| `complianceStatus` | `['Full','Partial','Transitional','Non-Compliant'][⌊s4×4⌋]` | 4 categories | Synthetic demo value |
| `costPassThrough` | `⌊s1×80⌋+10` | 10–90% | Synthetic demo value |
| `COUNTRY_POLICIES.carbonPrice` | `⌊s2×120⌋` | €0–120/tCO2 | Synthetic per-country carbon price |
| `COUNTRY_POLICIES.carbonBorderMech` | first 4 rows hard-coded (EU CBAM Active, UK CBAM 2027, US Potential CCA, Canada CBAM Study), rest random | — | First 4 reflect real, named policy status as of the platform's reference date; remainder synthetic |
| `virtualCarbonBalance` | `⌊s3×200⌋−100` | −100 to +100 | Synthetic "embodied carbon trade balance" proxy, not derived from actual trade-flow data in the same file |

### 7.3 Calculation walkthrough

1. **Importer generation** (100 rows): 5 independent PRNG draws per row assign sector, country,
   volume, embedded emissions, and a pre-baked `cbamCostMn` — none of these fields are combined via
   arithmetic; they sit side-by-side in the same record.
2. **Carbon price slider (€20–200/tCO2)**: `adjustedCost = cbamCostMn × (price/80)`. Because
   `cbamCostMn` was never actually a function of embedded emissions, this rescaling preserves the
   *relative* ranking of importers by cost but does not represent a real re-pricing of embedded
   carbon — a company with low embedded emissions but a high random `cbamCostMn` will still show a
   large CBAM bill.
3. **Sector summary** aggregates count, volume, mean embedded-emissions intensity, and both raw and
   price-adjusted total CBAM cost per of the 6 sectors.
4. **Country policy table** (40 countries): each row gets an independent policy-status draw except
   the first 4 (EU/UK/US/Canada), which are hard-coded to reflect real-world status; ETS activity,
   WTO compatibility, and climate-club membership are separate independent draws with no
   cross-consistency check (e.g. a country can show `etsActive:true` and `carbonPrice:€0` in the
   same row).
5. **Trade flow matrix** (30 synthetic bilateral flows): `cbamLiability = tradeBn × carbonIntensity
   × <implicit scale>` is not actually computed for the 30 rows — `cbamLiability = s1×s2×100` is a
   third independent random draw, unrelated to the row's own `tradeBn`/`carbonIntensity` fields.

### 7.4 Worked example (Importer #1, `i=0`, HeidelbergCement)

| Field | Computation | Result |
|---|---|---|
| Sector | `⌊sr(7)×6⌋=3` | **Fertilisers** |
| Country | `⌊sr(11)×20⌋=5` | **Egypt** |
| Import volume | `⌊sr(13)×500000⌋+10000` | **46,778 t** |
| Embedded emissions | `sr(17)×2.5+0.3` | **0.62 tCO₂/t** |
| CBAM cost (base) | `sr(19)×50+0.5` | **€23.1M** |
| Adjusted cost @ €150/tCO2 | `23.1 × (150/80)` | **€43.3M** |
| Compliance status | `⌊sr(17)×4⌋=0` | **Full** |
| Cost pass-through | `⌊sr(7)×80⌋+10` | **56%** |

Note the €23.1M "CBAM cost" and the 0.62 tCO₂/t "embedded emissions" for the same importer are two
independent random numbers — under the real CBAM formula, a company with 0.62 tCO₂/t embedded
intensity and near-zero carbon price paid at origin (Egypt has no ETS) would owe roughly
`0.62 tCO₂/t × 46,778 t × (EU ETS price, say €80) ≈ €2.3M`, an order of magnitude below the €23.1M
figure the module actually displays.

### 7.5 Companion analytics

- **CBAM Certificate Cost Calculator** — six preset carbon-price buttons (€20/50/80/100/150/200)
  recompute `Σ cbamCostMn × (price/80)` across all 100 importers.
- **Virtual carbon balance** — top-20 countries by `virtualCarbonBalance`, a synthetic net
  embedded-carbon trade position (positive = net carbon exporter equivalent).
- **Trade flow scatter** — `tradeBn` (x) vs `carbonIntensity` (y) vs `embeddedMtCO2` (bubble size)
  across the 30 synthetic flows.

### 7.6 Data provenance & limitations

- **All quantitative content is synthetic demo data** generated by `sr(s)=frac(sin(s+1)×10⁴)`.
  Sector taxonomy (6 CBAM goods categories) and the first 4 countries' policy status are the only
  real-world-anchored constants; every cost, emissions intensity, and compliance figure is a random
  draw.
- **No CBAM certificate formula is implemented** despite the guide's explicit claim — this is the
  module's most consequential gap, since a real CBAM liability calculator is a well-specified,
  reproducible formula (embedded emissions net of origin-country carbon price paid, at the weekly
  EU ETS average price) that the platform's own reference data (`CARBON_PRICES`, imported but
  apparently unused for this calculation) could support.
- Trade-flow `cbamLiability` is disconnected from the row's own `tradeBn`/`carbonIntensity`,
  meaning the scatter chart's bubble size and the liability figure are not mutually consistent.

### 7.7 Framework alignment

- **EU CBAM Regulation (EU) 2023/956**: sector coverage (cement, iron & steel, aluminium,
  fertilisers, electricity, hydrogen) is correct and matches Annex I; the certificate-cost mechanism
  itself (embedded emissions × EU ETS price, net of a verified carbon price already paid at origin)
  is described in the guide but not implemented in code.
- **EU ETS** (Directive 2003/87/EC): referenced only via the carbon-price slider concept; the
  platform's real `CARBON_PRICES` reference table is imported but not used to drive the CBAM
  calculation shown here.
- **WTO compatibility** and **carbon leakage risk** country flags reflect real ongoing policy
  debates (CBAM's WTO consistency is genuinely contested) but are randomly assigned per country
  rather than sourced from actual WTO dispute filings or leakage-risk assessments.

## 9 · Future Evolution

### 9.1 Evolution A — Implement the actual CBAM certificate formula (analytics ladder: rung 1 → 3)

**What.** The §7 flag is precise: the guide's real formula `CBAM = (Embedded CO₂ − Carbon Price Paid) × EU ETS Price` is not computed — each of 100 importers carries a pre-baked random `cbamCostMn` (€0.5–50.5M) that the "calculator" merely rescales linearly (`× price/80`), while `embeddedEmissions`, `defaultValue`, and `actualEmissions` are generated independently and never combined. §7.4 shows the consequence: HeidelbergCement's displayed €23.1M is an order of magnitude above the ~€2.3M the real formula gives for its own emissions/volume. §7.6 notes the platform's own `CARBON_PRICES` reference table is imported but unused. This is a well-specified, reproducible formula the module simply doesn't run.

**How.** (1) Compute liability per importer: `embeddedEmissions × importVolume × (EU_ETS_price − origin_carbon_price)`, using `actualEmissions` where verified and `defaultValue` as the CBAM fallback per Regulation 2023/956 — exactly the fields already generated, now combined. (2) Drive the EU ETS price from the imported `CARBON_PRICES` reference (weekly average per the real certificate mechanism) instead of the bare slider. (3) Wire origin-country carbon prices from real ICAP data (the module cites the ICAP survey) rather than the per-country random draw, fixing the documented `etsActive:true`/`carbonPrice:€0` inconsistency. (4) Recompute the 30 trade-flow liabilities from each row's own `tradeBn`/`carbonIntensity` (§7.3 point 5: currently a disconnected third random draw).

**Prerequisites.** Real import-volume and origin-emissions data eventually (UN Comtrade is already ingested per the data-sources wave); synthetic importers acceptable interim once the formula is real. **Acceptance:** HeidelbergCement's liability reproduces from its emissions × volume × price gap (§7.4's ~€2.3M, not €23.1M); no country shows ETS-active with zero price; the ETS slider drives the formula, not a rescale.

### 9.2 Evolution B — CBAM exposure copilot for trade/procurement teams (LLM tier 1 → 2)

**What.** A copilot for importers facing the 2026 CBAM financial phase: "what's our liability on Turkish steel at €90 ETS if Turkey introduces a €30 carbon price?", "which of our sourcing countries minimises CBAM exposure for aluminium?" — grounded in the correct Annex I sector coverage (§7.7 confirms it's accurate) and, post-Evolution-A, executing the certificate calculation as a tool call.

**How.** Tier 1 first: the module's real assets are the correct 6-sector CBAM taxonomy, the first-four countries' accurate policy status (EU CBAM Active, UK CBAM 2027, US potential CCA, Canada study), and the regulatory framing — the copilot explains the certificate mechanism and CBAM timeline from this Atlas record and the Regulation citations. It must disclose that all cost/emissions figures are synthetic pre-Evolution-A (§7.6). Tier 2 arrives with Evolution A's backend CBAM route: what-ifs over ETS price, origin carbon price, and sourcing country become tool calls with every euro traceable, and supply-chain-restructuring scenarios ("shift 40% of steel sourcing to an ETS-linked origin") are computed, not narrated.

**Prerequisites (hard).** Evolution A's formula — a copilot narrating today's rescaled random costs would confidently misstate liabilities by an order of magnitude (§7.4). **Acceptance:** every liability figure traces to the tool; sector-coverage answers match Annex I; policy-status claims cite the four hard-coded real rows and flag the rest as synthetic until sourced.