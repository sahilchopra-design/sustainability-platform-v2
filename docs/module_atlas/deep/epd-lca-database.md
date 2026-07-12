## 7 · Methodology Deep Dive

This module is unusually well-grounded: it ships a **curated 120-record EPD database** with GWP and
co-indicator values taken from LCA literature, plus **live API integration** to the real EPD
International and EC3 registries. The guide's "EPD Carbon Factor Comparator" formula
(`CF_delta = (CF_incumbent − CF_alternative)/CF_incumbent × 100%`) is implemented essentially
verbatim. There is **no PRNG anywhere** in this module — no ⚠️ mismatch flag needed.

### 7.1 What the module computes

Four production calculations run on the EPD records:

```js
// Material-substitution reduction (Alternatives tab)
reduction   = round((1 − alt.gwp / max(1, sug.target.gwp)) × 100)      // % embodied-carbon saving

// Carbon payback (Energy products)
genKWh        = lifetime_generation_kwh || annual_energy_kwh × lifetime_years
avoidedPerYear= genKWh / lifetime_years × gridMix / 1000               // tCO₂e/yr avoided
yearsPayback  = gwp_kg_co2e / avoidedPerYear                           // years

// Circularity score (Industrial/packaging)
circScore = recyclable ? recycling_rate×100×(infinite_recyclability?1.5:1) : 5

// Category averages
avgGWP = mean(gwp of records with gwp≠null)   // per category and overall
```

`gridMix` is a user slider (default **400 gCO₂/kWh** — a global-average grid intensity proxy);
dividing by 1000 converts kg→tonnes. The Alternatives tab reads a hand-built `ALTERNATIVES` map of
15 incumbent→green pairs, each with a literature `reduction` %.

### 7.2 Parameterisation / data provenance

| Constant / field | Value | Provenance |
|---|---|---|
| Portland Cement (CEM I) GWP | 850 kgCO₂e/tonne | EN 15804 literature (≈0.85 tCO₂/t) |
| Structural steel (BOF) | 1,850 kgCO₂e/tonne | ÖKOBAUDAT hot-rolled reference |
| Green steel (H₂-DRI) | 400 kgCO₂e/tonne | H2 Green Steel EPD, "78% reduction" note |
| CLT timber | −700 kgCO₂e/m³ | biogenic carbon storage (negative GWP) |
| Beef (feedlot) | 27.0 kgCO₂e/kg; 15,400 L water | Poore & Nemecek 2018-class figures |
| Oat milk | 0.9 kgCO₂e/L; "3.5× lower than dairy" | LCA literature |
| Onshore wind 3 MW | 450 kgCO₂e/kW; payback 0.6 yr | Vestas EPD-class |
| PET packaging recycling rate | 0.30 | industrial-average recycling rate |
| `gridMix` default | 400 gCO₂/kWh | synthetic slider default (global-avg proxy) |
| `ALTERNATIVES` reduction % | 15–130% | per-pair literature deltas (curated) |

Data sources are real and enumerated in `EPD_LCA_SOURCES` (7 registries): EPD International, EC3
(Building Transparency, 100k+ EPDs), ÖKOBAUDAT (German Federal), openLCA Nexus, USDA LCA Commons,
INIES (French). Two have live API calls wired (`searchEPDInternational`, `searchEC3`) with a
localStorage cache (168 h TTL) and graceful fallback to `searchLocalEPD`.

### 7.3 Calculation walkthrough

1. `allEPDs = EPD_DATABASE ++ customEPDs` (user-added records get `id:CUSTOM_n`, `verified:false`).
2. Filter by category / free-text; sort by any indicator column (default GWP ascending).
3. **Category analytics**: `catAvgGWP` groups by category and averages GWP; `lowest`/`highest`
   sort the whole set to surface best/worst GWP records.
4. **Comparison radar**: `RADAR_METRICS = [gwp, water, ap_kg_so2e, pe_renewable, pe_nonrenewable]`
   normalised per-metric by `max(|a|,|b|)` so two products plot on a common 0–1 radar.
5. **Payback**: pick a product → compute `yearsPayback` from embodied GWP vs annual avoided emissions.
6. **Alternatives**: each pair looks up incumbent/green records and recomputes `reduction` live from
   the stored GWP (so the displayed % is derived, not just the static `reduction` field).

### 7.4 Worked example — Monocrystalline solar payback (EPD010)

`EPD010` carries `gwp=1200 kgCO₂e/kWp`, `lifetime_generation_kwh=45000`, `lifetime_years=30`.
With `gridMix=400 gCO₂/kWh`:

| Step | Computation | Result |
|---|---|---|
| genKWh | 45,000 (uses stored lifetime generation) | 45,000 kWh |
| avoidedPerYear | 45,000/30 × 400/1000 | 600 tCO₂e/yr… |
| (unit note) | 1,500 kWh/yr × 400 g = 600,000 g = **0.6 tCO₂e/yr** | 0.6 t/yr |
| yearsPayback | 1.2 kg-embodied-as-t? → 1200 kg / 600 kg-avoided/yr | **2.0 yr** |

Because `avoidedPerYear` is in tonnes but `gwp_kg_co2e` is in kg, the ratio `1200 / 600` (both read
as kg) yields **2.0 years** — close to the stored `carbon_payback_years:1.8` reference. The
Alternatives example — Structural Steel→Green Steel — recomputes `round((1 − 400/1850)×100) = 78%`,
matching the curated label exactly.

### 7.5 Circularity & substitution rubric

| Rule | Formula | Reading |
|---|---|---|
| Circularity score | `recyclable ? recycling_rate×100×(infinite?1.5:1) : 5` | glass (0.80, infinite) → 120; PET (0.30) → 30; non-recyclable → 5 |
| Substitution saving | `(1 − alt/incumbent)×100` | >100% possible where green product is carbon-negative (wood-fibre insulation → 130%) |

### 7.6 Data provenance & limitations

- **No synthetic PRNG** — every GWP is a literature/EPD value; this is the strongest data provenance
  in the atlas. However the records are *generic* ("Generic" manufacturer, single representative
  value) rather than product-specific verified EPDs, so they are indicative, not compliance-grade.
- Cross-product comparison ignores **declared-unit mismatch**: comparing a "1 tonne" cement record to
  a "1 m³" concrete record is dimensionally invalid; the UI leaves unit-normalisation to the user
  (the guide flags this as required but the code does not enforce it).
- Payback conflates kg and tonnes by construction (see §7.4); it lands near the reference only because
  `gridMix/1000` cancels the kg→t on one side — a production tool would carry explicit units.
- Live API responses are cached but not schema-validated against the local record shape, so a live
  hit may lack `ap_kg_so2e`/`water_l` fields used by the radar.

**Framework alignment:** **ISO 14025** (Type III EPD — third-party-verified declarations; the
`verified` flag proxies this) · **EN 15804+A2** (core PCR for construction; the `pcr` field and
A1–A3 product-stage scope) · **ISO 14040/44** (LCA method underpinning every GWP) · **GWP100**
(IPCC 100-yr characterisation factor, the single indicator carried for all records). The module
approximates these by carrying the headline GWP100 and a subset of CEN environmental indicators;
it does not model the full A1–C4 lifecycle-module breakdown that EN 15804 requires for whole-life
carbon (RICS) or LEED v4 MRc credit submissions.
