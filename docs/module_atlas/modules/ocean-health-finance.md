# Ocean Health Finance Analytics
**Module ID:** `ocean-health-finance` · **Route:** `/ocean-health-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DJ4 · **Sprint:** DJ

## 1 · Overview
Analyses the financial value of ocean ecosystem services — fisheries, shipping lanes, coastal protection, carbon sequestration, tourism — and quantifies the economic cost of ocean health degradation from climate change, ocean acidification, and pollution.

> **Business value:** Essential for ocean-focused sustainable finance, blue bond issuers, fisheries finance institutions, and sovereign wealth funds of maritime nations. Provides SEEA Ocean-aligned natural capital accounting and financial quantification of ocean health risks for TNFD nature disclosure.

**How an analyst works this module:**
- Select ocean geography and service category
- Calculate ecosystem service value baseline
- Apply climate degradation scenarios (temperature, acidification, SLR)
- Model economic loss from ocean health deterioration
- Generate SEEA Ocean-aligned natural capital account

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `KpiCard`, `MPA_COLORS`, `OCEAN_REGIONS`, `REGIONS`, `REGION_NAMES`, `RISK_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ohi` | `Math.round(20 + sr(i * 7) * 75);` |
| `mpa` | `+(2 + sr(i * 11) * 48).toFixed(1);` |
| `totalConserv` | `filtered.reduce((a, r) => a + +r.conservationInvestment, 0);` |
| `ohiByRegion` | `REGIONS.map(r => {` |
| `tempVsAcid` | `filtered.map(r => ({` |
| `mpaByRegion` | `REGIONS.map(r => {` |
| `fisheryCollapse` | `[...filtered].sort((a, b) => b.fisheryCollapseProbability - a.fisheryCollapseProbability).slice(0, 15).map(r => ({` |
| `plasticData` | `[...filtered].sort((a, b) => b.plasticPollutionIndex - a.plasticPollutionIndex).slice(0, 15).map(r => ({` |
| `conservData` | `[...filtered].sort((a, b) => b.conservationInvestment - a.conservationInvestment).slice(0, 15).map(r => ({` |
| `carbonSinkData` | `[...filtered].sort((a, b) => b.carbonSinkCapacity - a.carbonSinkCapacity).slice(0, 15).map(r => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `REGIONS`, `REGION_NAMES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Ocean Economy | — | OECD Ocean Economy Outlook 2016 | Direct economic value of ocean — fisheries, shipping, offshore energy, tourism combined |
| Ocean Acidification Rate | — | IPCC SROCC 2019 | Ocean pH fallen 0.1 units (26% more acidic) — projected 0.3–0.4 units by 2100 under RCP8.5 |
| Marine Biodiversity Loss | — | IPCC SROCC 2019 | Half of coral reef systems face degradation or loss at 2°C warming — 70–90% at 1.5°C |
- **Ocean ecosystem extent and condition data (UNEP-WCMC)** → Natural capital baseline → **Ocean ecosystem service value by type and geography**
- **Climate projection data (SST, pH, deoxygenation)** → Degradation scenario modelling → **Economic loss from ocean health deterioration by 2030/2050/2100**
- **Fisheries catch and aquaculture production data** → Fisheries economic value → **Revenue at risk from stock depletion and species range shifts**

## 5 · Intermediate Transformation Logic
**Methodology:** Ocean Ecosystem Service Valuation
**Headline formula:** `OceanESV = Σ [FisheriesRevenue + ShippingService + CoastalProtection + TourismRevenue + CarbonSeq × CarbonPrice]; AcidificationLoss = ΔpH × CorrosionSensitivity × BiologicalStock`

Total economic value (TEV) framework aggregates direct and indirect ocean services; acidification loss estimates shell formation costs and calcite/aragonite saturation impacts on commercial species

**Standards:** ['OECD Ocean Economy Outlook 2016', 'IPCC Special Report on Ocean and Cryosphere 2019', 'High Level Panel for a Sustainable Ocean Economy 2020', 'SEEA Ocean Accounting Framework (UN)']
**Reference documents:** IPCC Special Report on the Ocean and Cryosphere in a Changing Climate (SROCC 2019); High Level Panel for a Sustainable Ocean Economy — The Blue Recovery 2020; SEEA Ocean Accounting Framework — UN System of Environmental Economic Accounting; OECD Ocean Economy in 2030 (2016)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Build the OceanESV and acidification-loss engine (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag is total: the guide defines an ocean ecosystem-service valuation (`OceanESV = Σ[Fisheries + Shipping + CoastalProtection + Tourism + CarbonSeq×CarbonPrice]`) and an acidification-loss formula (`ΔpH × CorrosionSensitivity × BiologicalStock`), but neither exists — there is no fisheries-revenue, shipping, coastal-protection, or tourism field, and `acidificationLevel` is a bare `sr()` draw. The 50 regions have real names (Great Barrier Reef, Bering Sea, Norwegian Sea) attached to 11 fully fabricated metrics. Evolution A builds the TEV engine the module is named for.

**How.** (1) Stand up `POST /api/v1/ocean-health/esv` computing the documented OceanESV sum from real service components: fisheries revenue (FAO/Sea Around Us catch-value data, public), shipping-lane value (UNCTAD maritime statistics), coastal-protection value (mangrove/reef area × avoided-damage rates, reusing the digital-twin hazard grids), tourism (regional marine-tourism data), and carbon sequestration × carbon price. (2) Implement the acidification-loss formula with real inputs: ΔpH from IPCC SROCC/AR6 projections (named in §5), corrosion sensitivity by calcifying-species group, and biological stock from fisheries data — replacing the seeded `acidificationLevel`. (3) SEEA-Ocean-aligned account output (§1) as the structured deliverable.

**Prerequisites.** This is greenfield — the current page has zero real computation; multiple data-source integrations (FAO, UNCTAD, SROCC projections); the digital-twin coastal hazard grids are thin for flood (48 rows) so coastal-protection coverage needs a caveat. **Acceptance:** OceanESV decomposes into the five named service terms from real data; acidification loss reproduces from ΔpH × sensitivity × stock; no `sr()` remains; a region's SEEA account reconciles to its service components.

### 9.2 Evolution B — Blue-economy valuation copilot (LLM tier 1 → 2, scoped honestly)

**What.** Given the page has no real computation today, the near-term LLM value is a framework-guidance copilot grounded in the SEEA Ocean, IPCC SROCC, and HLP Sustainable Ocean Economy references named in §5: "how does SEEA Ocean account for fisheries?", "what drives acidification loss for shellfisheries?", "what services make up ocean TEV?" It must not value the user's region until Evolution A exists.

**How.** Tier 1 over the standards corpus (roadmap `llm_corpus_chunks`): the copilot explains the OceanESV framework, SEEA Ocean accounting structure, and acidification impact pathways with citations. The system prompt must encode the module's honest current state so it refuses "value the Great Barrier Sea's ecosystem services" with a pointer to the (post-Evolution-A) ESV endpoint — a hard refusal, because the current 50-region table's numbers are fabricated and must not be narrated as valuations. Tier 2 arrives with Evolution A: tool calls to the ESV/acidification engine, fabrication validator matching every dollar figure to outputs.

**Prerequisites.** Standards ingestion; explicit current-capability statement in the system prompt. Any regional valuation is strictly gated on Evolution A. **Acceptance:** framework answers cite named references; asking the copilot to value or interpret the current 50-region metrics yields a refusal explaining they are placeholders.