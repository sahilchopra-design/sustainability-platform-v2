# Tenant Engagement ESG
**Module ID:** `tenant-engagement-esg` · **Route:** `/tenant-engagement-esg` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Real estate tenant sustainability engagement platform enabling landlords to collaborate with tenants on energy efficiency, waste reduction and GRESB green building certification through green lease provisions.

> **Business value:** Split incentive between landlord capex and tenant energy savings has historically impeded real estate decarbonisation; green leases with data-sharing obligations are the primary solution adopted by leading REITs.

**How an analyst works this module:**
- Onboard tenants and establish data-sharing protocols under green lease
- Baseline tenant energy, water and waste performance
- Set joint improvement targets and action plans
- Monitor performance via smart metering and tenant reporting
- Submit tenant engagement data to GRESB and BREEAM In-Use

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BLDG_TYPES`, `CLAUSES`, `ENGAGEMENT_STAGES`, `SECTORS`, `STAGE_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CLAUSES` | `['Data Sharing','Fit-Out Standards','Waste Management','Renewable Energy','EV Charging','Indoor Air Quality','Water Conservation','Carbon Reporting','Green Procurement','Biodiversity'];` |
| `BLDG_TYPES` | `['Office','Retail','Mixed-Use'];` |
| `sector` | `SECTORS[Math.floor(s*SECTORS.length)];` |
| `buildingIdx` | `Math.floor(s2*50);` |
| `area` | `Math.floor(500+s3*9500);` |
| `employees` | `Math.floor(10+s4*490);` |
| `esgScore` | `Math.floor(20+s5*80);` |
| `clauses` | `CLAUSES.map((c,j)=>({clause:c,adopted:greenLeaseActive&&sr(i*31+j*7)>0.4,compliance:greenLeaseActive?Math.floor(40+sr(i*37+j*11)*60):0}));` |
| `energyConsumption` | `Math.floor(area*150*(0.5+s*0.8));` |
| `stageIdx` | `Math.floor(s*6);` |
| `satisfaction` | `Math.floor(50+s2*50);` |
| `renewablePerc` | `Math.floor(s3*60);` |
| `wasteRecycling` | `Math.floor(20+s4*70);` |
| `waterEfficiency` | `Math.floor(30+s5*60);` |
| `scope3Contribution` | `Math.floor(energyConsumption*0.21/1000);` |
| `reductionTarget` | `Math.floor(10+s6*40);` |
| `leaseExpiry` | `2025+Math.floor(s2*8);` |
| `quarterlyEngagement` | `Array.from({length:8},(_,i)=>({quarter:`Q${(i%4)+1} ${2024+Math.floor(i/4)}`,surveys:Math.floor(30+sr(i*17)*40),responses:Math.floor(20+sr(i*19)*30),satisfaction:Math.floor(60+sr(i*23)*30),greenLeases:Math.floor(15+i*3),` |
| `greenLeaseRate` | `useMemo(()=>Math.floor(tenants.filter(t=>t.greenLeaseActive).length/tenants.length*100),[]);` |
| `avgSatisfaction` | `useMemo(()=>Math.floor(filtered.reduce((s,t)=>s+t.satisfaction,0)/(filtered.length\|\|1)),[filtered]);` |
| `totalScope3` | `useMemo(()=>filtered.reduce((s,t)=>s+t.scope3Contribution,0),[filtered]);` |
| `avgEsgScore` | `useMemo(()=>Math.floor(filtered.reduce((s,t)=>s+t.esgScore,0)/(filtered.length\|\|1)),[filtered]);` |
| `clauseAdoption` | `useMemo(()=>CLAUSES.map(c=>({clause:c,adopted:filtered.filter(t=>t.clauses.find(cl=>cl.clause===c)?.adopted).length,total:filtered.length,rate:filtered.length?Math.floor(filtered.filter(t=>t.clauses.find(cl=>cl.clause===` |
| `sectorDist` | `useMemo(()=>SECTORS.map(s=>({sector:s,count:filtered.filter(t=>t.sector===s).length,avgEsg:Math.floor(filtered.filter(t=>t.sector===s).reduce((sum,t)=>sum+t.esgScore,0)/(filtered.filter(t=>t.sector===s).length\|\|1))})).fi` |
| `engagementFunnel` | `useMemo(()=>ENGAGEMENT_STAGES.map((stage,i)=>({stage,count:filtered.filter(t=>t.stageIdx>=i).length,current:filtered.filter(t=>t.stageIdx===i).length})),[filtered]);` |
| `selTenant` | `useMemo(()=>selectedTenant?tenants.find(t=>t.id===selectedTenant):null,[selectedTenant]);  const scope3BySector=useMemo(()=>SECTORS.map(s=>{const ts=filtered.filter(t=>t.sector===s);return{sector:s,scope3:ts.reduce((sum,t)=>sum+t.scope3Contribution,0),count:ts.length,avgTarget:ts.length?Math.floor(ts.reduce((sum,t)=>sum+t.reductionTarget,` |
| `scope3Trend` | `useMemo(()=>Array.from({length:8},(_,i)=>({year:2024+i,baseline:totalScope3,target:Math.floor(totalScope3*(1-0.05*i)),actual:i<3?Math.floor(totalScope3*(1-0.03*i)):null})),[totalScope3]);  const dataQualityDist=useMemo(()=>[{quality:'Actual',count:filtered.filter(t=>t.dataQuality==='Actual').length},{quality:'Estimated',count:filtered.fil` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BLDG_TYPES`, `CLAUSES`, `ENGAGEMENT_STAGES`, `SECTORS`, `STAGE_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Green Lease Coverage | — | Lease Database | Proportion of NLA under green lease provisions with ESG data-sharing obligations. |
| Avg Tenant Energy Reduction | — | Smart Metering | Mean energy intensity reduction achieved by tenants in active engagement programmes vs baseline. |
| GRESB Tenant Score | — | GRESB Submission | Tenant engagement module score in latest GRESB Real Estate Assessment. |
- **Green Lease Data, Smart Meter Feeds, Tenant ESG Surveys, GRESB Portal** → Engagement scoring + GRESB module mapping + energy intensity analytics → **GRESB submissions, tenant engagement reports, MEES compliance tracker**

## 5 · Intermediate Transformation Logic
**Methodology:** Tenant ESG Engagement Score
**Headline formula:** `TEES = Σ (Initiative Score × Tenant Weight) / Σ Tenant Weight`

Weighted aggregate of tenant-level ESG initiative scores; input to GRESB Health & Well-being and Tenant Engagement modules.

**Standards:** ['GRESB Real Estate Assessment 2023', 'BBP Green Lease Toolkit']
**Reference documents:** GRESB Real Estate Assessment Methodology 2023; Better Buildings Partnership Green Lease Toolkit; BREEAM In-Use Standard; UK MEES Minimum Energy Efficiency Standards

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula is `TEES = Σ(Initiative Score × Tenant
> Weight) / Σ Tenant Weight` — a weighted composite, with tenant floor area (NLA) as the implied
> weight. **The headline `avgEsgScore` is an unweighted arithmetic mean** of each tenant's
> independently `sr()`-seeded `esgScore` — the `area` field exists per tenant (500–10,000 sqm) but
> is never used as a weight anywhere in the 360-line file. One genuine formula does exist:
> `scope3Contribution`, a real energy-to-emissions conversion consistent with GHG Protocol Scope 3
> Category 13 (Downstream Leased Assets) methodology — documented in §7.3.

### 7.1 What the module computes

80 synthetic tenant companies (`tenants`) across 10 sectors, leasing space in 50 named buildings
(`buildingNames`, UK/Ireland/Germany/Netherlands cities), each independently `sr()`-seeded for
`area`, `employees`, `esgScore` (20–100), `greenLeaseActive` (boolean, ~65% true), 10 green-lease
clause adoption/compliance pairs (`clauses`), `energyConsumption`, `engagementStage` (6-stage funnel:
Awareness→Interest→Commitment→Implementation→Monitoring→Leadership), `satisfaction`,
`renewablePerc`, `wasteRecycling`, `waterEfficiency`, `scope3Contribution`, `reductionTarget`,
`dataQuality` (Actual/Estimated/No Data), `leaseExpiry`, and `fitOutStandard` (Gold/Silver/None,
conditional on green-lease status).

### 7.2 Genuine aggregation formulas

```js
greenLeaseRate  = count(greenLeaseActive) / tenants.length × 100
avgSatisfaction = mean(satisfaction) over filtered tenants                  // unweighted
avgEsgScore     = mean(esgScore) over filtered tenants                      // unweighted — guide wants area-weighted
totalScope3     = Σ scope3Contribution over filtered tenants
clauseAdoption[clause] = count(tenants where that clause is adopted) / filtered.length × 100
```

All correctly guarded (`||1` fallback on empty-filter means, avoiding NaN). None are weighted by
`area`, `employees`, or any other tenant-size proxy — every tenant, regardless of a 500 sqm boutique
office or a 10,000 sqm anchor tenant, contributes equally to `avgEsgScore`.

### 7.3 Scope 3 downstream-leased-assets formula (genuine)

```js
energyConsumption = floor(area × 150 × (0.5+s×0.8))            // kWh/yr, ~75-207 kWh/m²/yr intensity range
scope3Contribution = floor(energyConsumption × 0.21 / 1000)     // tCO2e/yr
```

This **is** a real, methodologically sound calculation: `energyConsumption` uses a plausible
commercial-office energy-intensity range (75–207 kWh/m²/yr, broadly consistent with UK/EU commercial
building benchmarks), and `0.21` is a grid-electricity emission factor in kgCO₂e/kWh (consistent with
several European national grid factors in recent years, e.g. UK grid ≈0.2 kgCO₂e/kWh as of recent
years), correctly applied then divided by 1000 to convert kg→tonnes. This maps directly onto GHG
Protocol **Scope 3 Category 13 (Downstream Leased Assets)** — a landlord's tenant energy use is
exactly the emissions category this formula computes.

### 7.4 Calculation walkthrough

1. **Tenant ESG Profile tab** — filterable/sortable table of all 80 tenants by sector, green-lease
   status, search term; KPIs (`greenLeaseRate`, `avgSatisfaction`, `avgEsgScore`) computed as above.
2. **Green Lease Tracker tab** — `clauseAdoption` computes real per-clause adoption rates across the
   10 green-lease clause types (Data Sharing, Fit-Out Standards, Waste Management, Renewable Energy,
   EV Charging, Indoor Air Quality, Water Conservation, Carbon Reporting, Green Procurement,
   Biodiversity) — correct percentage arithmetic over filtered tenants.
3. **Tenant Engagement Pipeline tab** — `engagementFunnel[stage] = {count: tenants with
   stageIdx≥i, current: tenants exactly at stage i}` — a genuine cumulative funnel construction
   (each stage count includes all tenants at or past that stage, standard funnel-chart semantics).
4. **Scope 3 Downstream tab** — `scope3BySector` groups `scope3Contribution` by sector;
   `scope3Trend` projects a synthetic 8-year baseline/target/actual series
   (`target=totalScope3×(1−0.05×i)`, a flat 5%/yr reduction glide path from the *current* total, not
   from a real base-year figure) — `actual` is populated only for the first 3 years
   (`i<3 ? totalScope3×(1-0.03×i) : null`), correctly leaving future years as `null` (not yet
   observed) rather than fabricating forward actuals.

### 7.5 Worked example

Tenant `i=0`: `area = floor(500+sr(23)×9500)`. `sr(23) = frac(sin(24)×10⁴)`; `sin(24 rad)≈-0.9056`,
×10⁴=-9056, frac (negative handled) ≈0.44 → `area ≈ floor(500+0.44×9500) = floor(4680) = 4680` sqm.
`energyConsumption = floor(4680×150×(0.5+s×0.8))` where `s=sr(3)`; `sr(3)=frac(sin(4)×10⁴)`,
`sin(4)≈-0.7568`, ×10⁴=-7568, frac≈0.32 → `energyConsumption = floor(4680×150×(0.5+0.32×0.8)) =
floor(4680×150×0.756) = floor(530,712) = 530,712` kWh/yr. `scope3Contribution =
floor(530712×0.21/1000) = floor(111.4) = 111` tCO₂e/yr — a plausible Scope 3 downstream-leased-
assets figure for a ~4,680 sqm tenant space at typical commercial energy intensity.

### 7.6 Data provenance & limitations

- **All 80 tenants and 50 buildings are `sr()`-seeded synthetic data.**
- The headline `avgEsgScore`/`avgSatisfaction` figures are unweighted means, not the guide's
  area-weighted TEES composite — a portfolio with a few very large, low-ESG tenants and many small,
  high-ESG tenants would show a misleadingly high average under the current unweighted formula.
- `scope3Trend`'s 5%/yr target glide path is a flat assumption applied uniformly, not derived from
  any tenant-level `reductionTarget` field (which exists per-tenant but isn't aggregated into the
  portfolio trend).
- `energyConsumption` and `scope3Contribution` are genuinely well-constructed formulas but are
  applied to synthetic `area` inputs — the calculation methodology is sound, the underlying data is
  not real.

**Framework alignment:** GRESB Real Estate Assessment's Tenant Engagement module and the Better
Buildings Partnership Green Lease Toolkit are correctly reflected in the 10-clause green-lease
structure (data sharing, fit-out standards, and the other clauses match real BBP toolkit categories).
GHG Protocol Scope 3 Category 13 is genuinely implemented in the energy→emissions conversion. UK MEES
(Minimum Energy Efficiency Standards) is named in the guide but has no corresponding EPC-rating field
or compliance check in the tenant data model — a gap between the referenced regulation and what's
actually tracked per tenant.

## 9 · Future Evolution

### 9.1 Evolution A — Area-weighted TEES and a real MEES/EPC compliance layer (analytics ladder: rung 1 → 2)

**What.** Two documented gaps define the scope. First, the guide's `TEES = Σ(Initiative Score × Tenant Weight) / Σ Tenant Weight` is implemented as an **unweighted** mean — the per-tenant `area` field (500–10,000 sqm) exists but is never used as a weight (§7 flag), so a few large low-ESG anchor tenants and many small high-ESG tenants produce a misleadingly high `avgEsgScore` (§7.6). Second, UK MEES is named in the guide but no EPC-rating field or compliance check exists in the tenant model. The module's genuine asset — a methodologically sound Scope 3 Category 13 conversion (`area × intensity × 0.21 kgCO₂e/kWh`, §7.3) — stays.

**How.** (1) Weight all headline aggregates by NLA: `avgEsgScore`, `avgSatisfaction`, and clause-adoption rates become area-weighted, with the unweighted variants retained as a secondary view. (2) Add `epcRating` (A–G) per tenancy and a MEES tracker: units below E (and the announced trajectory to C) flagged with lease-expiry cross-reference — `leaseExpiry` already exists per tenant, making "non-compliant at renewal" a computable list. (3) Derive `scope3Trend`'s glide path from the per-tenant `reductionTarget` fields (currently a flat 5%/yr assumption disconnected from the tenant data, §7.6) via area-weighted aggregation. (4) Wire the UK EPC register feed (the platform's data-sources wave-1 work already scoped EPC access, noting the changed auth) for real ratings on the 50 named buildings.

**Prerequisites.** EPC API credentials under the new auth regime; tenant records remain synthetic until a real lease dataset exists — weighting fixes the formula regardless. **Acceptance:** a constructed two-tenant test (large/low-ESG + small/high-ESG) shows the weighted mean tracking the large tenant; MEES tab lists sub-E units with renewal dates; portfolio trend equals the weighted sum of tenant targets.

### 9.2 Evolution B — Green-lease engagement copilot for asset managers (LLM tier 1)

**What.** The module's user runs tenant-by-tenant engagement. A copilot drafts the outreach: "which tenants should we prioritise this quarter?" answered from the engagement funnel (cumulative 6-stage construction, §7.4), clause-adoption gaps (which of the 10 BBP-toolkit clauses a tenant lacks), lease-expiry proximity (renewal is the green-lease negotiation window), and Scope 3 contribution — then drafts the tenant-specific proposal citing the relevant clauses.

**How.** Tier 1 on page state plus this Atlas record: the 10-clause structure matches real BBP Green Lease Toolkit categories (§7 framework note), so clause explanations are grounded reference content, and the §7.3 formula lets the copilot explain a tenant's emissions figure from its area and intensity honestly. Prioritisation logic is transparent arithmetic the copilot composes from existing fields (stage, expiry, scope3Contribution, adoption count) — it proposes a ranking with the formula shown, not an opaque score. GRESB Tenant Engagement module mapping ("which of our activities count toward the GRESB TE indicators?") is answerable from the clause/survey data with the caveat that no GRESB submission integration exists. All tenant data is synthetic (§7.6) and drafts must say so until real lease records land.

**Prerequisites.** None beyond corpus embedding; Evolution A's EPC layer upgrades MEES-risk prioritisation from impossible to computed. **Acceptance:** every prioritisation ranking reproduces from the stated fields and formula; clause citations match the 10-clause list verbatim; GRESB questions distinguish mapped evidence from unbuilt submission features.