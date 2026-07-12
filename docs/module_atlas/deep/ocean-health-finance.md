## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide defines an ocean ecosystem-service valuation formula
> (`OceanESV = Σ[FisheriesRevenue + ShippingService + CoastalProtection + TourismRevenue +
> CarbonSeq×CarbonPrice]`) and an acidification-loss formula
> (`AcidificationLoss = ΔpH × CorrosionSensitivity × BiologicalStock`). **Neither formula appears in
> code.** There is no fisheries-revenue, shipping-service, coastal-protection, or tourism-revenue
> field anywhere in the file, and `acidificationLevel` is a bare independent PRNG draw, not a
> product of pH change, corrosion sensitivity, and biological stock. The module is a 50-region
> synthetic ocean-health screening table with real region names attached to entirely fabricated
> metrics.

### 7.1 What the module computes

`OCEAN_REGIONS` — 50 rows, each assigned a real named marine region (Great Barrier Reef, Bering
Sea, Norwegian Sea, Arabian Sea, Red Sea, Ross Sea, Gulf of Mexico, Sulu Sea, …, cycling through 10
`REGIONS` ocean-basin categories) with 11 independently `sr()`-seeded metrics:
`seaTemperatureAnomaly`, `acidificationLevel`, `coralBleachingRisk`, `fisheryCollapseProbability`,
`marineProtectedAreaPct`, `plasticPollutionIndex`, `oceanHealthIndex` (OHI), `conservationInvestment`,
`blueEconomyGdpPct`, `oxygenMinimumZoneExpansion`, `carbonSinkCapacity`. Two derived categoricals:
`riskLevel = getRiskLevel(ohi)` (Critical<40, High<60, Medium<75, else Low) and
`mpaStatus = getMpaStatus(mpa%)` (Exceeds 30×30 ≥30%, On Track ≥20%, Partial ≥10%, else Below
Target) — both simple threshold bands on their respective PRNG-seeded input, not composites.

### 7.2 Parameterisation

| Field | Formula | Range |
|---|---|---|
| `oceanHealthIndex` | `round(20+sr(i×7)×75)` | 20–95 |
| `acidificationLevel` | `-0.05-sr(i×5)×0.25` | −0.05 to −0.30 pH units |
| `coralBleachingRisk` | `1+sr(i×13)×9` | 1–10 |
| `fisheryCollapseProbability` | `3+sr(i×17)×67` | 3–70% |
| `marineProtectedAreaPct` | `2+sr(i×11)×48` | 2–50% |
| `conservationInvestment` | `5+sr(i×23)×495` | $5–500M |
| `blueEconomyGdpPct` | `0.5+sr(i×29)×14.5` | 0.5–15% |
| `carbonSinkCapacity` | `0.01+sr(i×37)×0.49` | 0.01–0.50 (units unlabelled in code) |

`riskLevel`/`mpaStatus` threshold bands (40/60/75 for OHI; 10/20/30 for MPA%) are hand-picked
cut-points; the 30% MPA threshold correctly references the real **30×30** Global Biodiversity
Framework target.

### 7.3 Calculation walkthrough

1. Filter `OCEAN_REGIONS` by ocean basin, risk level, MPA status.
2. **KPI strip** — `avgOhi`, `avgCoral`, `totalConserv` (sum), `avgMpa` — arithmetic means/sums over
   the filtered synthetic set; legitimate aggregation mechanics over fabricated inputs.
3. **Temperature & Acidification tab** — scatter of `seaTemperatureAnomaly` vs. `acidificationLevel`
   per region; both independently seeded, so any visual correlation is coincidental, not modelled
   ocean chemistry (in reality, warming and acidification are correlated via shared CO2-uptake
   drivers, but that physical relationship isn't encoded here).
4. **Coral Reef Risk / Fisheries Health / Plastic Pollution / Carbon Sink Analytics tabs** — each
   ranks the top-15 filtered regions by its respective single PRNG-seeded field.
5. **Conservation Finance tab** — ranks by `conservationInvestment`; a `tempScenario` slider
   (1.5–4°C) and `conservInvest` slider exist in state but are not wired into any recomputation of
   the region table (no visible formula uses `tempScenario` to degrade `oceanHealthIndex` or any
   other field).

### 7.4 Worked example

Region `i=5` ("Great Barrier Reef", `region = REGIONS[5%10] = "Arctic"` — note the *real* region
name and its *categorical basin label* are independently indexed, so "Great Barrier Reef" here is
tagged basin "Arctic" purely by array-position coincidence, not its real Pacific/Coral-Sea
location): `ohi = round(20+sr(35)×75)`. `sr(35)`: `sin(36)=−0.9918`, ×10000=−9917.9,
`floor(−9917.9)=−9918`, `frac=0.0821` → `ohi = round(20+0.0821×75) = round(20+6.16) = 26` →
`riskLevel = getRiskLevel(26) = "Critical"` (< 40). The Great Barrier Reef — a real reef system with
genuine, well-documented bleaching stress — is flagged "Critical" here, but this is a PRNG artefact
of its array position, not an assessment of its actual 2024 condition (real GBR monitoring reports,
e.g. AIMS Long-Term Monitoring Program, show a more nuanced regional mosaic of recovery and
continued stress, not a single scalar).

### 7.5 Data provenance & limitations

- All 11 numeric fields per region are independent `sr()` draws — no ocean-science relationship
  (e.g. temperature↔acidification correlation, OHI↔MPA% relationship) is encoded despite these
  being juxtaposed in charts as if related.
- Real region names lend false precision — pairing "Great Barrier Reef" or "Red Sea" with fabricated
  risk scores is the platform's characteristic real-entity/fake-metric pattern.
- `tempScenario` slider exists but has no downstream effect — a dead control.
- No fisheries/shipping/tourism/coastal-protection revenue fields exist despite being the guide's
  headline valuation components.

**Framework alignment:** 30×30 / GBF Target 3 — the `mpaStatus` threshold correctly implements the
real 30% protected-area target · IPCC SROCC (2019) — cited in the guide for acidification/warming
context; the module's headline "50% of coral reefs at risk at 2°C" KPI text matches SROCC's real
topline finding, even though the per-region `coralBleachingRisk` scores are not derived from SROCC
data · SEEA Ocean Accounting — named as the intended natural-capital framework; not implemented as
an actual account structure (contrast with `nature-capital-accounting`'s SEEA-style asset/liability
table, which at least has the right shape).

## 8 · Model Specification — Ocean Ecosystem Service Value (OceanESV)

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Produce a defensible $ valuation of a marine region's ecosystem-service
flows (fisheries, shipping-lane access, coastal protection, tourism, carbon sequestration) and a
climate-degradation loss estimate, for blue-bond issuance due diligence and sovereign natural-capital
disclosure.

**8.2 Conceptual approach.** Sum service-specific revenue/avoided-cost streams per the guide's
formula, each estimated via an established valuation method — the same architecture OECD's *Ocean
Economy* reports and the World Bank's *Changing Wealth of Nations* ocean-asset accounts use:
fisheries via landed-catch value, shipping via freight-lane traffic value, coastal protection via
avoided-damage (replacement-cost) method, tourism via visitor spend, carbon via sequestration ×
carbon price.

**8.3 Mathematical specification.**
```
FisheriesRevenue_r   = CatchVolume_r × ExVesselPrice_r × (1 − OverfishingDiscount_r)
ShippingService_r    = TrafficDensity_r × ValuePerTransit  (proxy: freight tonnage × freight rate share attributable to safe passage)
CoastalProtection_r  = AvoidedDamage_r = ExpectedStormDamageNoReef_r − ExpectedStormDamageWithReef_r   (replacement-cost method, per Beck et al. 2018 reef-coastal-protection methodology)
TourismRevenue_r     = Visitors_r × AvgSpend_r × ReefAttributableShare_r
CarbonSeqValue_r     = CarbonSinkCapacity_r × CarbonPrice_t
OceanESV_r           = FisheriesRevenue_r + ShippingService_r + CoastalProtection_r + TourismRevenue_r + CarbonSeqValue_r

AcidificationLoss_r  = ΔpH_r × CorrosionSensitivity_species × BiologicalStock_r × UnitValue_species
```
| Parameter | Calibration source |
|---|---|
| `ExVesselPrice_r` | FAO FishStatJ landed-value data |
| `CoastalProtection` avoided-damage method | Beck et al. (2018) *The Global Flood Protection Savings Provided by Coral Reefs*, Nature Communications |
| `CorrosionSensitivity_species` | Ocean acidification dose-response literature (e.g. shellfish calcification rate vs. Ωaragonite) |
| `CarbonPrice_t` | EU ETS / voluntary market price, or SCC (Social Cost of Carbon, EPA/IWG) for public-policy use |
| `TrafficDensity_r` | AIS (Automatic Identification System) vessel-traffic data, e.g. Global Fishing Watch |

**8.4 Data requirements.** FAO fisheries statistics (free); Global Fishing Watch AIS traffic (free
API); reef/coastline geospatial layers for the Beck et al. coastal-protection method (public);
tourism visitor/spend data (national tourism boards, patchy coverage); NOAA/IPCC ocean pH monitoring
time series (free) for `ΔpH_r`.

**8.5 Validation & benchmarking plan.** Reconcile fisheries and tourism components against national
accounts (blue-economy GDP contribution, where published); benchmark coastal-protection value
against Beck et al.'s own published country-level results for overlapping reef regions.

**8.6 Limitations & model risk.** Ecosystem-service valuation is inherently method-sensitive
(replacement-cost vs. contingent-valuation vs. hedonic-pricing can differ 2–5× for the same
service) — always disclose the method and a sensitivity range, not a point estimate; shipping-lane
value attribution to "ocean health" specifically (vs. general maritime infrastructure) is
conceptually weak and should be scoped narrowly (e.g. only degraded-navigability scenarios) or
dropped from the headline sum.
