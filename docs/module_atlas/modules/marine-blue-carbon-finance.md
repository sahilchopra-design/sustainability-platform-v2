# Marine Blue Carbon Project Finance
**Module ID:** `marine-blue-carbon-finance` · **Route:** `/marine-blue-carbon-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DX6 · **Sprint:** DX

## 1 · Overview
Marine blue carbon project finance for mangrove, seagrass, and saltmarsh restoration. Models carbon sequestration rates (mangrove 6-8 tCO2/ha/yr), ICROA methodology compliance, coastal protection co-benefit valuation, and blue carbon credit market dynamics.

> **Business value:** Delivers rigorous blue carbon project finance modelling integrating IPCC-standard sequestration accounting, coastal protection co-benefit valuation, and VM0033 credit issuance scheduling.

**How an analyst works this module:**
- Map restoration site extent and classify by habitat type (mangrove, seagrass, saltmarsh)
- Apply IPCC 2013 Wetlands Supplement sequestration rates with site-specific adjustments
- Value coastal protection co-benefits using replacement cost or avoided damage approaches
- Model credit issuance schedule under Verra VM0033, apply buffer contribution, and compute project NPV/IRR

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CREDIT_MARKET`, `ECOSYSTEMS`, `Kpi`, `METHODOLOGIES`, `MPA_PROJECTS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ECOSYSTEMS` | 6 | `name`, `globalHaM`, `seqTco2HaYr`, `stockTco2Ha`, `lossRateYr`, `restorationCostHa`, `creditPriceUsd`, `creditQuality`, `verraApproved`, `cbcaAligned`, `cobenefits` |
| `MPA_PROJECTS` | 6 | `name`, `location`, `areaMha`, `financing`, `creditsMt`, `buyer`, `status`, `irr` |
| `CREDIT_MARKET` | 8 | `volumeMtco2`, `priceAvgUsd`, `revenueMusd` |
| `METHODOLOGIES` | 6 | `body`, `ecosystems`, `additionality`, `permanence`, `approved` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Overview', 'Ecosystems', 'MPA Finance', 'Credit Market', 'Methodologies', 'Additionality', 'Permanence', 'Project Valuation', 'Co-Benefits', 'Deal Structuring'];` |
| `capex` | `areaHa * restCostHa;` |
| `pvRevenue` | `lifeYrs > 0 && discountRate > 0 ? annRevenue * (1 - Math.pow(1 + discountRate / 100, -lifeYrs)) / (discountRate / 100) : annRevenue * lifeYrs;` |
| `totalGlobalSeq` | `ECOSYSTEMS.reduce((s, e) => s + e.globalHaM * 1e6 * e.seqTco2HaYr / 1e9, 0);` |
| `score` | `Math.round(60 + sr(i * 13) * 30);` |
| `riskDiscount` | `Math.round(5 + sr(i * 7) * 15);` |
| `adjPrice` | `Math.max(8, e.creditPriceUsd - riskDiscount * e.creditPriceUsd / 100);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CREDIT_MARKET`, `ECOSYSTEMS`, `METHODOLOGIES`, `MPA_PROJECTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Mangrove Sequestration Rate | `Above-ground + below-ground + soil organic carbon accumulation` | IPCC 2013 Wetlands Supplement defaults | Mangrove soil carbon (8-10× soil depth) drives high rates; seagrass 0.5-2 t/ha/yr; saltmarsh 1.5-3 t/ha/yr |
| Coastal Protection Co-benefit | `Avoided storm damage + avoided erosion based on replacement cost` | Natural Capital Project InVEST model | Often exceeds carbon revenue; enables project financing via coastal insurance premium reduction or municipal payment |
| Blue Carbon Credit Price | `Market price for Verra VM0033 or Gold Standard mangrove credits` | Ecosystem Marketplace 2023 | Blue carbon premium over standard forestry credits; limited supply; tightening MRV standards may compress issuance |
- **IPCC 2013 Wetlands Supplement** → Habitat-specific sequestration rates by region and soil type → carbon stock change calculations → **Annual carbon credit issuance estimate**
- **Natural Capital Project InVEST coastal model** → Wave attenuation, storm surge reduction by habitat type → coastal protection valuation → **Co-benefit revenue / avoided loss**
- **Ecosystem Marketplace blue carbon price data** → Historical transaction prices for blue carbon credits → price deck assumptions → **Project revenue sensitivity analysis**

## 5 · Intermediate Transformation Logic
**Methodology:** Blue Carbon Net Present Value
**Headline formula:** `Blue Carbon NPV = Σ[(Carbon Credits × Price + Coastal Protection Value) - Restoration Cost - Monitoring Cost] / (1+r)^t; Sequestration = Area × Rate × (1 - Buffer%)`

NPV model integrating blue carbon sequestration revenue with avoided coastal damage co-benefit value against restoration and monitoring costs

**Standards:** ['Verra VCS VM0033 Tidal Wetland and Seagrass Restoration', 'ICROA Blue Carbon Code of Best Practice', 'IPCC 2013 Wetlands Supplement']
**Reference documents:** Verra (2021) VCS Methodology VM0033 Tidal Wetland and Seagrass Restoration; IPCC (2013) 2013 Supplement to the 2006 IPCC Guidelines — Wetlands; IUCN (2020) Blue Carbon Initiative — Mangrove and Seagrass Restoration Guide; Ecosystem Marketplace (2023) Voluntary Carbon Markets Report

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Partial guide↔code mismatch.** The guide's NPV formula includes a coastal-protection
> co-benefit term: `NPV = Σ[(Credits×Price + Coastal Protection Value) − Restoration Cost −
> Monitoring Cost]/(1+r)^t`. **The code's actual `calcRestorationNpv` omits both the coastal-
> protection value and the monitoring-cost terms** — it computes NPV purely from carbon-credit
> revenue against restoration capex. The guide's headline co-benefit figure ("$8,400/ha/yr coastal
> protection") is referenced nowhere in the calculation. Sections below document the code as it
> actually behaves; unlike several sibling modules, the core financial math here is genuine and
> correctly implemented.

### 7.1 What the module computes

Two real, correctly-implemented financial formulas applied to a static 5-ecosystem reference table
(Mangroves, Seagrass Meadows, Salt Marshes, Kelp Forests, Coral Reef Ecosystem):

```js
annualCreditRevenue = areaHa × seqTco2HaYr × creditPriceUsd
restorationNPV = PV(annualRevenue, discountRate, lifeYrs) − (areaHa × restCostHa)
  where PV = annRevenue × (1 − (1+r)^−n) / r      // standard ordinary-annuity present value
```
This is a genuine capital-budgeting NPV calculation (annuity-PV of a level annual cashflow minus
upfront capex) — mathematically correct and consistent with standard project-finance practice, even
though it captures only the carbon-revenue side of the guide's stated multi-term formula.

### 7.2 Parameterisation

| Ecosystem | Seq. (tCO₂/ha/yr) | Stock (tCO₂/ha) | Restoration cost/ha | Credit price | Quality | Verra |
|---|---|---|---|---|---|---|
| Mangroves | 6.4 | 840 | $1,800 | $28 | HIGH | ✓ |
| Seagrass Meadows | 2.4 | 140 | $4,200 | $22 | MEDIUM | ✓ |
| Salt Marshes | 4.8 | 620 | $2,600 | $24 | HIGH | ✓ |
| Kelp Forests | 1.1 | 35 | $8,500 | $14 | EMERGING | ✗ |
| Coral Reef Ecosystem | 0.8 | 22 | $12,000 | $18 | EMERGING | ✗ |

- Mangrove sequestration (6.4 tCO₂/ha/yr) is close to the guide's cited 7.2 tCO₂/ha/yr and broadly
  consistent with published mangrove blue-carbon literature (mangroves are the highest-sequestering
  coastal wetland due to deep soil carbon accumulation).
- Salt marsh sequestration (4.8 tCO₂/ha/yr) **exceeds** both the guide's cited range (1.5–3 tCO₂/
  ha/yr) and typical published saltmarsh literature values — worth flagging as an internal
  inconsistency between the guide and the seed data, and against the cited IPCC 2013 Wetlands
  Supplement defaults more broadly.
- `METHODOLOGIES` (5 rows) — real named crediting methodologies: **VCS VM0033** (Verra, mangrove
  restoration), **VCS VM0024** (Verra, coastal blue carbon, multi-ecosystem), **Gold Standard Blue
  Carbon**, **CBCA Coastal Wetland Crediting** (correctly flagged `approved:false` — CBCA blue-carbon
  crediting is indeed still developing), **Plan Vivo Blue Carbon** — all genuine, correctly-named
  standards with accurate approval/permanence-mechanism descriptions.
- `MPA_PROJECTS` (5) — **real, identifiable** blue-carbon/MPA finance deals: the Seychelles debt-for-
  nature swap ($21.9M, a well-documented 2018 Nature Conservancy-brokered transaction), Brazilian
  "Blue Amazon" green bond, Coral Triangle Initiative (a real multilateral Indo-Pacific programme),
  Great Blue Wall (a real African Union-endorsed East African blue-bond initiative), Patagonia Marine
  Reserve — correctly categorised by financing instrument (debt swap, green bond, blended MDB+ODA,
  blue bond, endowment) though specific IRR/credits figures are illustrative.
- `CREDIT_MARKET` (2019-2025) — a static, hand-authored growth trend from $6M to $435M revenue,
  8x volume growth — directionally consistent with the real voluntary blue-carbon market's rapid
  early-stage growth, though the specific figures are not sourced inline.

### 7.3 Calculation walkthrough

- **Project Valuation tab** (interactive): user selects an ecosystem, sets `areaHa` (default 5,000),
  `discountRate` (default 8%), `lifeYrs` (default 30), `creditPrice` (default $25) — the two formulas
  in §7.1 recompute live. This is the module's only genuinely interactive calculation; every other
  tab renders the static reference tables.
- **Overview tab**: `totalGlobalSeq = Σ_ecosystems (globalHaM × 1e6 × seqTco2HaYr) / 1e9` — correctly
  converts each ecosystem's global area (million ha) × per-ha sequestration rate into a portfolio-wide
  GtCO₂/yr figure via consistent unit conversion (ha × tCO₂/ha = tCO₂, then /1e9 for Gt).
- **Methodologies / MPA Finance / Co-Benefits tabs**: reference-table renders of the static datasets,
  no further computation.

### 7.4 Worked example — default Mangrove valuation

`areaHa=5000, seqTco2HaYr=6.4, creditPriceUsd=25, restCostHa=1800, discountRate=8%, lifeYrs=30`:
```
annRevenue = 5000 × 6.4 × 25 = $800,000/yr
capex      = 5000 × 1800 = $9,000,000
annuityFactor = (1 − 1.08^−30) / 0.08 = (1 − 0.0994) / 0.08 = 0.9006/0.08 = 11.258
pvRevenue  = 800,000 × 11.258 = $9,006,000
NPV        = 9,006,000 − 9,000,000 = $6,000  (approximately break-even)
```
This shows the module's honest sensitivity: at default assumptions, a pure carbon-credit-financed
mangrove restoration project is barely NPV-positive — which is realistic and consistent with the
guide's own framing that co-benefit revenue (coastal protection, often exceeding carbon revenue) is
usually necessary to make blue-carbon projects bankable — even though that co-benefit term is not
actually added into this NPV calculation (§ mismatch flag above).

### 7.5 Data provenance & limitations

- **NPV formula is genuine and correctly implemented** (annuity-PV mathematics), a positive
  distinction from most sibling modules in this batch — but it is **narrower than the guide's stated
  formula**, omitting coastal-protection co-benefit value and monitoring cost, both of which the
  guide's own `dataPoints` table cites as material (coastal protection "$8,400/ha/yr... often exceeds
  carbon revenue").
- Salt marsh sequestration rate (4.8 tCO₂/ha/yr) appears inconsistent with both the guide's cited
  range and general published literature; should be reconciled against IPCC 2013 Wetlands Supplement
  region-specific defaults.
- `CREDIT_MARKET` and MPA project IRR/credit figures are illustrative estimates presented without
  inline source citation, despite corresponding to real, identifiable deals.
- No buffer-pool / permanence-risk discount is applied to credit revenue in the NPV calculation,
  despite the Methodologies tab correctly describing each standard's buffer-pool mechanism.

**Framework alignment:** Verra VCS VM0033/VM0024, Gold Standard Blue Carbon, and Plan Vivo are
real, correctly-described crediting methodologies with accurate additionality/permanence mechanism
summaries. IPCC 2013 Wetlands Supplement is named as the sequestration-rate source but the salt-marsh
figure in the seed data does not match its guide-cited range. The 5 MPA finance case studies are
real-world identifiable transactions, giving this module a stronger factual anchor than most peers in
this batch even where specific deal-level figures (IRR, credit volumes) remain illustrative.

## 9 · Future Evolution

### 9.1 Evolution A — Complete the NPV (co-benefits, monitoring, buffer) and fix the saltmarsh rate (analytics ladder: rung 2 → 3)

**What.** §7 finds the financial core genuine — a correct annuity-PV NPV (`PV(annRevenue) − capex`) over a mostly-defensible ecosystem table with authentic methodology records (VM0033/VM0024 correctly described, CBCA correctly flagged unapproved) — with three specific gaps: the implemented NPV **omits the coastal-protection co-benefit and monitoring-cost terms** the guide's formula includes (and §4.1 notes protection value "often exceeds carbon revenue", so the omission understates project economics materially); the buffer deduction (`Sequestration × (1−Buffer%)`) isn't applied in the credit-revenue chain; and the saltmarsh sequestration seed (4.8 tCO₂/ha/yr) exceeds both the guide's own 1.5–3 range and IPCC 2013 Wetlands Supplement defaults — a flagged data inconsistency. Evolution A completes the model: co-benefit valuation per the InVEST replacement-cost/avoided-damage approach the lineage names, monitoring opex per methodology requirements, Verra buffer contribution in issuance, and the ecosystem table reconciled to IPCC Wetlands Supplement defaults with citations.

**How.** (1) Extend `calcRestorationNpv` to the full §5 formula with each term displayed; the co-benefit defaults (wave attenuation value by habitat/exposure class) sourced from published InVEST coastal studies, labeled site-class estimates. (2) The saltmarsh correction logged as a data defect and fixed with the IPCC citation. (3) The seeded additionality `score = 60 + sr·30` and `riskDiscount` draws replaced with methodology-derived assessments (VM0033's additionality tests are checklist-able) or honest inputs. (4) A mangrove worked case pins in bench_quant covering credit issuance schedule + buffer + NPV.

**Prerequisites.** Co-benefit parameter sourcing; the two `sr()` draws removed; IPCC default table in refdata (shared with `land-use-carbon`'s five-pool work). **Acceptance:** NPV decomposes into carbon revenue + protection value − capex − monitoring, all visible; issuance reflects the buffer; saltmarsh rate matches its cited default.

### 9.2 Evolution B — Blue-carbon deal-structuring copilot (LLM tier 2)

**What.** The 10-tab breadth (ecosystems → methodologies → additionality → permanence → valuation → deal structuring) is a workflow a copilot can walk end-to-end: "structure a 3,000 ha mangrove restoration in Vietnam — methodology, buffer, issuance schedule, NPV at $28 credits", "why do kelp projects lack Verra approval and what does that mean for financing?", "how much coastal-protection value can we claim to a municipal co-funder, and on what basis?" Each quantitative element executes the Evolution A valuation route; methodology guidance quotes the curated (genuinely accurate) standards table.

**How.** Tier 2: tool schemas over the completed NPV/issuance routes; structuring answers show the full term decomposition with the co-benefit valuation basis stated (replacement cost vs avoided damage — the two InVEST approaches yield different numbers and funders care which). Methodology selection cites the `METHODOLOGIES` rows' ecosystem coverage and approval status — recommending an unapproved pathway for a bankable deal is the error the accurate `approved:false` flags exist to prevent. Buyer-market questions quote the `CREDIT_MARKET` series once it's sourced (currently static) with vintage. MPA project comparisons cite the curated `MPA_PROJECTS` records as precedents, not extrapolation bases.

**Prerequisites.** Evolution A's completed model (structuring advice on an NPV missing its largest revenue term would systematically misprice deals); Phase 2 tooling. **Acceptance:** every $/tCO₂ figure traces to a tool call with terms decomposed; methodology recommendations always carry approval status; co-benefit claims state their valuation basis.