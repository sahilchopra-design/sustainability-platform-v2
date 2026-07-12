## 7 · Methodology Deep Dive

This is a **tier-A module** backed by a genuinely rigorous engine, `green_hydrogen_engine.py`, which
implements EU RFNBO law (Delegated Regs 2023/1184 + 2023/1185), IEA LCOH methodology, and ISO 14040/44
GHG-intensity accounting. The frontend `GreenHydrogenPage` can call the engine (`POST /api/v1/green-
hydrogen/assess | /lcoh | /rfnbo-compliance`) but **also runs its own client-side approximations that add
seeded noise** — e.g. `ghgIntensity = ef·kwhPerKgH2/1000 + r(5)·0.3`. Sections below document both the
authoritative engine and the lighter frontend path, and flag where the frontend diverges from the engine.

### 7.1 What the module computes

**Backend engine (authoritative):**
```
GHG intensity (well-to-gate, ISO 14040/44):
  total_ghg = kwh_per_kgH2 · electricity_EF + water_treatment(0.05) + compression(0.15)   kgCO₂/kgH2
  below_threshold = total_ghg < 3.38    (RFNBO threshold, 70% cut vs 94 gCO₂/MJ fossil comparator)
LCOH (IEA):
  CRF = r / (1 − (1+r)^−n)
  annual_H2_kg = capacity_MW·1000·CF·8760 · efficiency_LHV / 33.33
  LCOH = (CAPEX·CRF + CAPEX·opex% + stack_annual)/annual_H2 + (annual_kWh/1000·elec_price)/annual_H2
RFNBO compliance: 4 criteria (GHG, additionality, temporal, geographical), each scored 0–1,
  composite = mean of 4; rfnbo_eligible = ALL four compliant.
```
**Frontend (this page):** approximates `kwhPerKgH2 = 33.3/efficiency`, `ghgIntensity = ef·kwhPerKgH2/1000
+ r(5)·0.3`, an LCOH-component reduction, a country-comparison, and a CfD strike/duration view — several
of these use the seeded `r()`/`hashStr()` PRNG rather than the engine.

### 7.2 Parameterisation (engine constants — authoritative)

| Constant | Value | Provenance |
|---|---|---|
| RFNBO GHG threshold | 3.38 kgCO₂/kgH2 | EU 2023/1184 Art. 3 (70% cut vs 94 gCO₂/MJ) |
| Water treatment / compression | 0.05 / 0.15 kgCO₂/kgH2 | engine constants (well-to-gate scope) |
| H2 LHV / HHV | 33.33 / 39.39 kWh/kg; 120 MJ/kg | physical constants |
| Electrolyser kWh/kgH2 | PEM 55, ALK 60, SOEC 45, AEM 58 | IEA / manufacturer benchmarks |
| Electrolyser CAPEX 2024 | PEM 900–1500, ALK 600–1000, SOEC 2000–4000 $/kW | IEA Global Hydrogen Review 2023 |
| Grid EFs | e.g. Germany 0.38, France 0.06, Norway 0.02, Poland 0.72 kgCO₂/kWh | national grid data (20 countries) |
| Dedicated-RE EFs | wind 0.009, solar PV 0.025, nuclear 0.012, biomass 0.230 (RFNBO-excluded) | ISO 14040/44 lifecycle |
| Additionality 36-month rule; ≥90% RE-grid; hourly matching from 2030 | — | EU 2023/1185 Arts. 4–6 |
| IEA cost trajectory | 2024 $3–6, 2030 $2–4, 2050 $1–2 /kgH2 | IEA Global Hydrogen Review |

Frontend `r()`/`hashStr()` noise terms are **synthetic** overlays on these real anchors.

### 7.3 Calculation walkthrough (engine)

Facility inputs → `_get_electricity_ef` resolves the EF (grid vs dedicated RE, per country) → GHG intensity
→ C1 (GHG) score; `_assess_additionality/temporal/geographical` score C2–C4 against the Delegated-Reg
routes → composite + `rfnbo_eligible`. In parallel `calculate_lcoh` builds the four LCOH components. The
facility rating (A–D) is cut on the composite score (A ≥ 0.90, B ≥ 0.70, C ≥ 0.50, else D). CfD indicative
support = `clip(LCOH_eur − ng_parity(2.5), 0, max_support 4.0)`.

### 7.4 Worked example (engine, PEM in Germany on grid)

PEM, Germany grid (EF 0.38), CF 0.45, CAPEX mid = (900+1500)/2 = $1200/kW, r 8%, n 20, elec $45/MWh,
100 MW:
- `kwh_per_kgH2 = 55`; `ghg_electrolysis = 55·0.38 = 20.9`; `+0.05+0.15 = 21.1 kgCO₂/kgH2` → far above
  3.38 → **C1 fails** (grid-powered PEM in Germany is not RFNBO-eligible — correct).
- `CRF = 0.08/(1−1.08^−20) = 0.08/0.7855 = 0.1019`.
- `annual_H2 = 100·1000·0.45·8760·0.65/33.33 = 394,200,000·0.65/33.33 ≈ 7.69M kg`.
- `LCOH_capex = (1200·100·1000·0.1019)/7.69e6 = (120,000,000·0.1019)/7.69e6 = 12.23M/7.69M ≈ $1.59/kg`.
- `LCOH_elec = (100·1000·0.45·8760/1000·45)/7.69e6 = (394,200·45)/7.69e6 = 17.74M/7.69M ≈ $2.31/kg`.
- With opex + stack, `LCOH_total ≈ $4.2–4.5/kg` — squarely in the IEA 2024 $3–6 band. Electricity is the
  largest single component (~50%), matching the guide's "biggest driver" claim.

### 7.5 Data provenance & limitations

- **Engine constants are real and authoritative** (EU law, IEA, ISO); this is one of the platform's
  best-grounded modules.
- **The frontend adds seeded `r()`/`hashStr()` noise** to GHG intensity, capacity factor, stack lifetime
  and CfD terms — so the on-page numbers can drift from the deterministic engine output. A production
  build should render engine results directly, not the noisy client approximation.
- Well-to-gate scope only (excludes transport/storage/end-use); single-EF marginal-electricity method, not
  full hourly counterfactual.

**Framework alignment:** EU RFNBO Delegated Regulations 2023/1184 (GHG, 3.38 threshold) + 2023/1185
(additionality 36-mo, temporal hourly-from-2030, geographical bidding-zone) — implemented criterion by
criterion; ISO 14040/44 lifecycle GHG; IEA Global Hydrogen Review (LCOH + cost trajectory); EU H2 Bank /
H2 CfD (strike-vs-market support). EU Taxonomy RFNBO threshold (<3.38) is the eligibility gate.

*(No §8 model specification required — the production model is implemented in `green_hydrogen_engine.py`.
The only remediation is to remove the frontend's seeded-noise overlay and display engine output directly.)*
