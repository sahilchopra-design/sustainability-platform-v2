## 7 · Methodology Deep Dive

Grounded in two DB-backed services — `backend/services/cbam_calculator.py` (embedded-emissions,
cost projection, compliance scoring) and `backend/services/cbam_service.py` (seed data + simple
cost helpers) — behind `api/v1/routes/cbam.py`. This is the EU Carbon Border Adjustment Mechanism
engine: it computes Specific Embedded Emissions, projects certificate costs under free-allocation
phase-out, and scores supplier compliance readiness.

### 7.1 What the domain computes

```
SEE = (direct_attributed + indirect_attributed) / production_volume       (Art. 7)
SEE_total = (SEE_direct + SEE_indirect) × (1 + default_markup)             (Art. 4 markup)
net_CBAM_cost = max(0, emissions×ETS_price − emissions×domestic_price − gross×free_alloc%)
```

- **`CBAMEmissionsCalculator`** — direct emissions = `Σ(activity × EF × oxidation) + process`;
  indirect = electricity × grid EF (country-specific or global 0.436 tCO₂/MWh); default-value
  markup 30% (both defaults) or 10% (partial) per Art. 4(3).
- **`CBAMCostProjector`** — year-by-year net cost using an ETS price scenario and the
  free-allocation phase-out schedule, with linear price interpolation.
- **`CBAMComplianceScorer`** — weighted 0–100 readiness score (verification 30% + data
  completeness 30% + domestic pricing 20% + country risk 20%).
- **`CBAMTransitionParams` / `get_cbam_carbon_exposure`** — a forward-looking NGFS/IEA-priced
  exposure used by the transition-risk engine.

### 7.2 Parameterisation (cited to CBAM Regulation 2023/956 + Implementing Reg)

**Free allocation phase-out** (% free, `CBAMCostProjector`): 2025 100% (transitional, reporting
only) → 2026 97.5 → 2027 95.0 → 2028 90.0 → 2029 77.5 → 2030 51.5 → 2031 39.0 → 2032 26.5 →
2033 14.0 → 2034 0. This matches the EU CBAM legislative schedule.

**ETS price scenarios** (EUR/tCO₂, sampled): current_trend 2025 €70 → 2050 €210; ambitious €80 →
€520; conservative €60 → €135. Constants: default markup full 0.30 / partial 0.10; CO₂/C ratio
3.664; global grid EF 0.436 (IEA 2023).

**Default product emissions** (`cbam_service.PRODUCT_CATEGORIES`, tCO₂/t): Portland cement
direct 0.525 / indirect 0.060; cement clinker 0.846; semi-finished steel 1.419/0.214; unwrought
aluminium 1.514/**6.800** (electricity-dominated); urea 1.578/0.180; hydrogen 9.000/2.500;
electricity 0.376. These are per-CN-code CBAM default values.

**Country risk seed** (20 countries): grid EF, domestic carbon price, risk score/category — e.g.
India (no carbon price, grid 0.708, Very High), Norway (€85, grid 0.017, Low), China (€12, 0.555,
High), Switzerland (€120, Low).

**Compliance sub-scores**: verification {verified 100, pending 50, unverified 10, expired 0};
data completeness = `(records − default_records)/records × 80 + 20`; carbon pricing 80/20;
country risk {Low 90, Medium 60, High 35, Very High 15}. Status: compliant ≥ 70, at_risk ≥ 40.

**Transition price paths** (`CBAMTransitionParams`, EUR/tCO₂): NGFS_Below2C 2025 €55 → 2050 €500;
NGFS_NZ2050 €65 → €600; NGFS_DelayedTrans €35 → €580; NGFS_CurrentPolicy €30 → €100; IEA_NZE €50
→ €400.

### 7.3 Calculation walkthrough

- **Embedded emissions:** if actual data supplied, direct = per-source-stream `Σ activity×EF×
  oxidation + process`, and indirect from electricity×grid-EF; else the product's default values
  are used and the Art. 4 markup (30% full / 10% partial) inflates SEE_total before multiplying
  by production volume.
- **Cost projection:** for each year, ETS price is interpolated from the scenario table; gross =
  emissions × ETS; domestic credit = emissions × supplier's domestic carbon price; free reduction
  = gross × free% ; net = max(0, gross − credit − free). Portfolio exposure sums per-supplier net
  costs for a single year.
- **Compliance scoring:** the four weighted sub-scores combine to the 0–100 readiness with
  targeted recommendations (verify data, replace defaults, source from carbon-priced countries,
  diversify supply chain).
- **Transition exposure:** covered = S1 + S2 (+ S3 if included); annual = covered × interpolated
  price × pass-through (default 0.85); cumulative = trapezoidal over the horizon using base and
  target prices.

### 7.4 Worked example (Indian steel supplier, 2030, current_trend)

100,000 t imports, specific total 1.767 tCO₂/t (flat-rolled default) → annual emissions 176,700
tCO₂. India domestic carbon price €0. 2030 ETS (current_trend) €95; free allocation 51.5%:

| Step | Computation | Result |
|---|---|---|
| Gross cost | 176,700 × 95 | €16.79M |
| Domestic credit | 176,700 × 0 | €0 |
| Free reduction | 16.79M × 0.515 | €8.65M |
| **Net CBAM cost** | max(0, 16.79M − 0 − 8.65M) | **≈ €8.14M** |

By 2034 (free allocation 0%) the same volume/price would cost the full gross — the phase-out is
the dominant cost driver. If the same supplier reported only default emission values, the SEE
would additionally carry a 30% Art. 4 markup, raising embedded emissions to ≈ 229,700 tCO₂.

### 7.5 Data provenance & limitations

- **Seeded reference data, not synthetic PRNG.** The product defaults, country-risk table and ETS
  scenarios are fixed seed data written to the DB by `seed_cbam_data`; supplier/emissions records
  are real operational rows queried at runtime. No `sr(seed)`/random fabrication anywhere.
- ETS price *scenarios* are illustrative trajectories, not live auction prices; the CBAM
  certificate price is modelled as equal to the ETS price (`cbam_certificate_price = eu_ets_price`),
  which matches the regulation's weekly-average design but not real-time settlement.
- Default emission values carry the regulatory markup, but the calculator does not model the
  Art. 9 domestic-carbon-price *rebate cap* or verification-status gating on default use.
- Grid emission factors are static country seeds (IEA-era), not year-varying.
- The transition-exposure cumulative uses a simple trapezoidal price average, not a full
  discounted year-by-year sum.

### 7.6 Framework alignment

- **EU CBAM Regulation (EU) 2023/956** — the mechanism itself: importers of cement, iron & steel,
  aluminium, fertilisers, electricity and hydrogen surrender certificates for embedded emissions.
- **Art. 7 (Specific Embedded Emissions)** — SEE = attributed direct + indirect emissions per
  tonne of product; implemented via source-stream `activity × EF × oxidation` + process emissions.
- **Art. 4 / Implementing Reg (EU) 2023/1773 (default values)** — default embedded-emission
  values with a 30% (full) / 10% (partial) markup when actual data is unavailable — implemented
  exactly as the markup constants.
- **Art. 21 (certificate cost)** — certificate price tied to the weekly average EU ETS auction
  price; here approximated by the ETS scenario price.
- **Art. 31 (free allocation phase-out)** — the 2026→2034 declining free-allocation schedule
  reduces the CBAM obligation in parallel with EU ETS free-allocation withdrawal; the schedule is
  reproduced exactly.
- **Art. 9 (domestic carbon price)** — a carbon price already paid in the country of production is
  credited against the CBAM liability (`domestic_credit`).
- **NGFS / IEA WEO** — the forward transition-price paths for the transition-risk integration.
