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
