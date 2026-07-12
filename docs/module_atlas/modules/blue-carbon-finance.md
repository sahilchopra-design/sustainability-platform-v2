# Blue Carbon Finance
**Module ID:** `blue-carbon-finance` · **Route:** `/blue-carbon-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DJ2 · **Sprint:** DJ

## 1 · Overview
Evaluates blue carbon ecosystem investment — mangroves, seagrasses, tidal marshes — for carbon sequestration, coastal protection co-benefits, and biodiversity credits. Models carbon credit revenue under Verra VM0033, coastal protection value avoided damage, and community benefit sharing.

> **Business value:** Applicable to conservation finance investors, coastal development banks, corporate nature strategy teams (TNFD), and governments with significant mangrove/seagrass assets. Blue carbon provides dual revenue from carbon credits and coastal protection co-benefits, making projects economically compelling.

**How an analyst works this module:**
- Select blue carbon ecosystem type and location
- Calculate carbon sequestration under VM0033 baseline
- Model coastal protection co-benefit value
- Structure carbon credit revenue and community sharing
- Generate CBI Blue Carbon Standard-aligned project prospectus

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COBENEFITS`, `ECO_COLORS`, `ECO_TYPES`, `KpiCard`, `PROJECTS`, `PROJECT_NAMES`, `REGIONS`, `STANDARDS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `standard` | `STANDARDS[Math.floor(sr(i * 7) * 3)];` |
| `cobenefit` | `COBENEFITS[Math.floor(sr(i * 11) * 4)];` |
| `areaHa` | `Math.round(500 + sr(i * 3) * 49500);` |
| `seq` | `+(1 + sr(i * 13) * 9).toFixed(2);` |
| `totalAreaMha` | `(filtered.reduce((a, p) => a + p.areaHa, 0) / 1e6).toFixed(2);` |
| `totalCredits` | `filtered.reduce((a, p) => a + p.creditsIssued, 0).toFixed(1);` |
| `totalProjectValue` | `filtered.reduce((a, p) => a + p.projectValue, 0).toFixed(1);` |
| `seqByType` | `ECO_TYPES.map(t => {` |
| `priceByStandard` | `STANDARDS.map(s => {` |
| `cobenefitData` | `COBENEFITS.map(cb => ({` |
| `scatterData` | `filtered.map(p => ({` |
| `permanenceData` | `filtered.slice(0, 20).map(p => ({` |
| `pipelineData` | `filtered.slice(0, 15).map(p => ({` |
| `area` | `ps.reduce((a, p) => a + p.areaHa, 0);` |
| `avgSeq` | `ps.length ? (ps.reduce((a, p) => a + p.carbonSequestration, 0) / ps.length).toFixed(2) : '0';` |
| `total` | `ps.reduce((a, p) => a + p.creditsIssued, 0).toFixed(1);` |
| `revenue` | `ps.reduce((a, p) => a + p.creditsIssued * p.creditPrice, 0).toFixed(0);` |
| `avgAdd` | `ps.length ? (ps.reduce((a, p) => a + p.additionality, 0) / ps.length).toFixed(1) : '—';` |
| `avgPerm` | `ps.length ? (ps.reduce((a, p) => a + p.permanenceRisk, 0) / ps.length).toFixed(1) : '—';` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COBENEFITS`, `ECO_TYPES`, `PROJECT_NAMES`, `REGIONS`, `STANDARDS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Mangrove Sequestration Rate | — | Blue Carbon Initiative 2023 | Mangroves sequester 6–8 tCO2e/ha/yr — 3–5× more per ha than temperate forests |
| Mangrove Loss Rate | — | Global Mangrove Alliance 2023 | Annual mangrove loss rate — primary threat is aquaculture, coastal development, and sea level rise |
| Coastal Protection Co-benefit | — | Nature Conservancy Blue Carbon 2022 | Annual coastal protection value of intact mangroves — often 10× carbon revenue, justifying conservation finance |
- **Mangrove/seagrass extent and condition mapping (NASA/JAXA)** → Carbon stock baseline → **Above/below-ground biomass and soil carbon per ha**
- **Coastal hazard data + asset exposure** → Protection co-benefit valuation → **Annual storm damage avoided by ecosystem hectare**
- **VCM blue carbon credit prices** → Revenue modelling → **Project NPV under various credit price scenarios**

## 5 · Intermediate Transformation Logic
**Methodology:** Blue Carbon Credit Economics
**Headline formula:** `BlueCarbon_credits = (Baseline_seq - Project_seq) / tCO2e_factor × ProjectArea; CoastalProtectionValue = Σ [P(storm) × DamageAvoided × PopProtected] / DiscountRate`

Carbon sequestration rate for mangroves 6–8 tCO2e/ha/yr (10× terrestrial forests); coastal protection value monetises avoided storm damage — often exceeds carbon revenue

**Standards:** ['Verra VM0033 Methodology for Tidal Wetland and Seagrass Restoration', 'IPCC Wetlands Supplement 2014', 'Blue Carbon Initiative (IUCN/CI/IOC-UNESCO)', 'GS4GG Blue Carbon Protocol']
**Reference documents:** Verra VM0033 — Tidal Wetland and Seagrass Restoration 2015; Howard et al. (2014) Coastal Blue Carbon Methods for Assessing CO2 Stocks and Emissions; Blue Carbon Initiative — State of Blue Carbon Science 2023; Nature Conservancy Coastal Resilience Platform

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

A blue-carbon project explorer over 55 synthetic projects (mangrove, seagrass,
saltmarsh, kelp). The one physical calculation is the credit-issuance identity:

```js
areaHa            = round(500 + sr(i×3)×49500)                  // 500–50,000 ha
seq               = 1 + sr(i×13)×9                              // tCO₂/ha/yr, 1–10
creditsIssued     = areaHa × seq × 0.001                        // ktCO₂ (×0.001 = ha·t → kt)
creditPrice       = 8 + sr(i×17)×42                             // $8–50/tCO₂
projectValue      = 0.5 + sr(i×19)×49.5                         // $M
additionality     = 3 + sr(i×23)×7                              // 3–10 score
permanenceRisk    = 1 + sr(i×29)×9                              // 1–10 score
```

Portfolio roll-ups: total area (Mha), total credits, total project value, mean
sequestration/additionality/permanence, and category means by ecosystem type,
standard and co-benefit.

### 7.2 Parameterisation

| Element | Value | Provenance |
|---|---|---|
| Ecosystem types | Mangrove, Seagrass, Saltmarsh, Kelp Forest | Real blue-carbon habitats |
| Standards | VCS, Gold Standard, Plan Vivo | Real credit standards |
| Sequestration | 1–10 tCO₂/ha/yr (synthetic) | Guide cites 6–8 for mangroves (Blue Carbon Initiative) |
| Credit price | $8–50/tCO₂ (synthetic) | Broadly VCM blue-carbon band |
| Credits factor | area × seq × 0.001 | Unit conversion (ha·t → kt); implies 100% creditable, no buffer |
| Additionality / permanence | 3–10 / 1–10 (synthetic) | Qualitative scores, not risk-discounted |

`PROJECT_NAMES` are 55 named real-world locations (Borneo, Sundarbans, Belize,
Posidonia, California Kelp). Regions map to 8 coastal zones.

### 7.3 Calculation walkthrough

1. Generate 55 projects with seeded area/seq/price/scores.
2. `seqByType`/`priceByStandard` average sequestration and price by category.
3. Credit market tab: revenue `Σ creditsIssued × creditPrice`.
4. Permanence and additionality scatters plot the seeded scores; investment-pipeline
   tab slices the top projects by value.

### 7.4 Worked example

Mangrove project, `areaHa = 20,000`, `seq = 7 tCO₂/ha/yr`, `creditPrice = $25`:

| Step | Computation | Result |
|---|---|---|
| Credits issued | 20,000 × 7 × 0.001 | 140 ktCO₂ |
| Annual credit revenue | 140,000 × $25 | **$3.5M/yr** |

At 7 tCO₂/ha/yr the mangrove sequestration sits in the Blue Carbon Initiative's
6–8 band, and the ×0.001 factor makes `creditsIssued` a straight ha×rate conversion —
but note it credits **100% of gross sequestration** with no buffer deduction,
baseline netting, or permanence discount (see §8).

### 7.5 Data provenance & limitations

- All 55 projects are **synthetic** (`sr()` PRNG); only place names, ecosystem types
  and standard names are real.
- `creditsIssued` omits the VM0033 baseline-vs-project netting, the buffer-pool
  deduction, and any leakage/permanence discount — so it overstates saleable credits.
- The guide's coastal-protection co-benefit ($/ha avoided storm damage) is described
  but **not computed**; co-benefit is a categorical label here.
- Additionality and permanence are 1–10 seeded scores, not tied to risk factors or
  buffer sizing.

**Framework alignment:** Verra VM0033 (Tidal Wetland & Seagrass Restoration — the
intended crediting methodology: net GHG benefit = project − baseline − leakage, minus
buffer) · IPCC 2014 Wetlands Supplement (carbon-stock accounting) · Blue Carbon
Initiative (6–8 tCO₂/ha/yr mangrove rate) · Plan Vivo / Gold Standard (community
benefit-sharing). The page represents the *scale* of these but not their conservative
accounting.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Estimate saleable blue-carbon credits and dual-value (carbon
+ coastal protection) NPV for a restoration project under VM0033 conservative
accounting — for conservation-finance investors and coastal development banks.

**8.2 Conceptual approach.** A **VM0033 net-GHG-benefit** crediting model (the
authoritative blue-carbon methodology) with buffer/leakage deductions, plus an
**InVEST/Natural Capital-style coastal-protection** avoided-damage valuation,
benchmarked against **Verra registered blue-carbon issuances** and **TNC coastal
resilience** studies.

**8.3 Mathematical specification.**
```
Net_seq_t = (C_project,t − C_baseline,t) − Leakage_t
Creditable_t = Net_seq_t · (1 − buffer_pct)                     buffer from AFOLU non-permanence tool
CarbonRev_t = Creditable_t · P_carbon,t
CoastalValue = Σ_storms P(storm) · DamageAvoided(habitat_extent) discounted
DamageAvoided = f(wave attenuation, population & assets protected)   (InVEST coastal vuln.)
NPV = Σ_t (CarbonRev_t + CoastalValue_t − Cost_t)/(1+r)^t
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Sequestration rate | C_project | IPCC Wetlands Supplement; field cores (Howard 2014) |
| Baseline / leakage | — | VM0033 baseline scenario |
| Buffer % | buffer | Verra AFOLU non-permanence risk tool |
| Storm probability | P(storm) | EM-DAT / IBTrACS return periods |
| Avoided damage | — | InVEST coastal vulnerability; asset exposure |

**8.4 Data requirements.** Habitat extent & condition (NASA/JAXA mangrove maps),
soil-carbon cores, baseline land-use, storm-hazard return periods, coastal asset
exposure, buffer risk factors. Platform holds none of these at project level.

**8.5 Validation & benchmarking.** Reconcile creditable tonnes against Verra-issued
VCUs for comparable registered projects; validate coastal-protection value against
peer-reviewed TNC estimates; sensitivity on buffer % and storm return period.

**8.6 Limitations & model risk.** Soil-carbon flux is uncertain and site-specific;
permanence is threatened by sea-level rise and aquaculture conversion; coastal-
protection value is exposure-dependent. Conservative fallback: apply the maximum
AFOLU buffer, exclude soil carbon below measurement depth, and treat coastal value as
co-benefit upside, not base-case revenue.

## 9 · Future Evolution

### 9.1 Evolution A — VM0033 sequestration and coastal-protection valuation from real inputs (analytics ladder: rung 1 → 2)

**What.** The page explores 55 synthetic blue-carbon projects (real named locations — Sundarbans, Belize, Posidonia) but every quantity is a seeded draw: `seq = 1 + sr()×9` tCO₂/ha/yr, `creditsIssued = area × seq × 0.001` (which §7.2 flags as implying **100% creditable, no buffer**), credit price, additionality and permanence as uniform-random scores. The guide's two real formulas — VM0033 baseline-minus-project sequestration and the coastal-protection avoided-damage value (`Σ P(storm) × damage_avoided × pop_protected / discount`) — are stated but not computed. Evolution A implements them, as this module's first backend vertical.

**How.** (1) VM0033 credit calculation: `net = (baseline_seq − project_seq) × area`, applying an actual buffer/reversal deduction (VCS non-permanence buffer pools are 10–20%+) instead of the current 100%-creditable factor — the missing buffer is the module's most material methodological gap. (2) Sequestration rates from IPCC Wetlands Supplement 2014 / Blue Carbon Initiative values per ecosystem type (mangrove 6–8, seagrass, saltmarsh) rather than a 1–10 uniform draw. (3) Coastal-protection co-benefit computed from the platform's cyclone/sea-level hazard grids (the physical-risk digital twin) crossed with exposed population/assets — turning the guide's avoided-damage formula into a real calculation and delivering the "often 10× carbon revenue" insight the module claims. (4) Permanence/additionality as risk-discount factors, not display scores. Rung 2: credit-price scenario NPV.

**Prerequisites.** Ecosystem-extent inputs per project (NASA/JAXA mangrove maps the guide cites); the physical-risk hazard grids for coastal protection (already populated per platform memory); a VCS buffer-rate table. **Acceptance:** credits reflect a non-permanence buffer deduction; sequestration varies by ecosystem type per sourced rates; coastal-protection value derives from real hazard × exposure, not a seeded co-benefit.

### 9.2 Evolution B — Blue-carbon project-structuring copilot (LLM tier 2)

**What.** Blue carbon's investment case is the dual revenue (credits + coastal protection) plus community benefit sharing — a structuring narrative an LLM assembles well once the numbers are real. "Structure a 5,000 ha mangrove restoration in the Sundarbans under VM0033" runs the Evolution-A sequestration and coastal-protection engines, reports net creditable tonnes (after buffer), credit revenue, and the avoided-damage co-benefit, and drafts a CBI Blue Carbon Standard-aligned prospectus — every figure tool-traced.

**How.** Tool schemas over the Evolution-A routes; grounding corpus is this Atlas record plus the VM0033 / Blue Carbon Initiative references in §5. The copilot's key honesty duty is the buffer and permanence framing: it reports net-of-buffer credits and states permanence risk as a discount, never the gross tonnage — the "no buffer" defect is exactly the credibility failure blue-carbon projects face. Community benefit-sharing structuring cites the applicable standard's requirements. Coastal-protection value is presented with its hazard-model provenance and uncertainty.

**Prerequisites (hard).** Evolution A — a copilot narrating gross seeded sequestration as creditable tonnes would overstate every project's carbon revenue. **Acceptance:** every tonne, dollar, and co-benefit figure traces to a tool response; credits are reported net of buffer with the rate stated; coastal-protection values carry hazard-model provenance.