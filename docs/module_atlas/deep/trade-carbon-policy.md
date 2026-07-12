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
