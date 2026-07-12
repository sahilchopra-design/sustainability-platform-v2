## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry claims a "PACT-aligned" methodology
> where `AvoidedEmissions = ReferenceScenario_emissions − Product_emissions`. Two problems:
> (1) the **frontend hub page computes no reference scenario at all** — each of its 150 companies
> gets *independent random* `emitted` and `avoided` values, so the displayed "avoided" numbers are
> not derived from any baseline comparison; and (2) the platform's real avoided-emissions
> methodology lives in `backend/services/avoided_emissions_engine.py` (which cites **GHG Protocol
> Scope 4 Guidance 2022 + SBTi BVCM + Paris Article 6**, not WBCSD PACT), and the page **never
> calls it** — no fetch/axios in the file despite the module's registered trace routes
> (`POST /api/v1/avoided-emissions/*`). Both layers are documented below.

### 7.1 What the module computes

**Frontend (hub):** a 150-company portfolio cockpit with 12 KPIs, 21 alerts, 9 board-report
sections and 5 sub-module cards. Company generation (per company `i`):

```js
emitted     = round(50 + s2×500)        // ktCO2e, s* = sr(seed) draws
avoided     = round(20 + s3×800)        // ktCO2e — independent of emitted
net         = avoided − emitted
credScore   = round(40 + s4×55)         // → High ≥80 / Medium ≥60 / Low
handprint   = round(10 + sr(i*19+2)×90);  enablement = round(5 + sr(i*23+4)×85)
scope4      = round(avoided × 0.85);      attribution = round(avoided × (0.5 + sr(i*43)×0.4))
```

**Backend (engine):** per-activity avoided emissions with real factor tables:

```python
avoided_per_unit = max(0, baseline_factor − solution_factor)          # kgCO2e/unit
total_avoided_tCO2e = avoided_per_unit × quantity × attribution_factor / 1000
```

plus additionality scoring, Article 6 ITMO eligibility, SBTi BVCM eligibility, and portfolio
aggregation with `net_benefit = total_avoided − own_S1+2+3` and
`avoidance_ratio = total_avoided / own_emissions` (both honestly `None` when own emissions are not
supplied).

### 7.2 Parameterisation

Backend baseline factors (kgCO₂e/unit, engine constants — standard emission-factor magnitudes):

| Baseline | EF | Solution | EF |
|---|---|---|---|
| coal_electricity_kwh | 0.820 | solar_kwh | 0.040 |
| grid_average_eu_kwh | 0.276 | wind_kwh | 0.011 |
| grid_average_us_kwh | 0.386 | ev_km | 0.050 |
| diesel_litre | 2.640 | heat_pump_kwh | 0.060 |
| steel_tonne_bof (t) | 2.200 | green_steel_tonne | 0.400 |
| beef_kg | 27.00 | plant_based_protein_kg | 2.000 |
| car_petrol_km | 0.192 | led/efficiency kwh_saved | 0.000 |

Rubrics: additionality = mean of *supplied* criterion scores over 5 criteria (regulatory surplus,
investment, technological, temporal, geographical); "strong" requires mean ≥ 70 **and** ≥ 4
criteria ≥ 60; unsupplied criteria stay unscored (no fabrication). Article 6 requires **all 5**
criteria (corresponding adjustment, authorization, participation, SD contribution,
real/permanent/additional) explicitly confirmed; `ITMO_potential = annual_avoided ×
attribution_factor` only when eligible. BVCM eligibility = **≥ 4 of 5** SBTi requirements.
Reporting-quality tiers: ≥80 verified / ≥60 assured / ≥40 reported / else estimated.

Frontend constants: period multipliers 0.25 (Q4 2025) / 0.75 (YTD) / 1.0 (FY); credibility tiers
80/60; 8 credibility methods radar (ISO 14064-2, GHG Protocol Scope 4, PCAF Avoided, EU Taxonomy
Art. 18, SBTi FLAG, ISSB S2 ¶29, Custom Internal, PAS 2080); scenario uplift
`net + net×(slider/100)×0.6`. All synthetic demo values.

### 7.3 Calculation walkthrough

1. **Frontend KPIs** — `totalAvoided = Σ avoided × pMul / 1000` (Mt), `avoidedRatio =
   totalAvoided/totalEmitted` (guarded), `netImpact = totalAvoided − totalEmitted`, averages for
   handprint/enablement/credibility/taxonomy, `solutionExp` = share of companies with
   solutionRev > 50%, `attrCoverage` = share with attribution > 0, top sector by avoided.
2. **Trend** — 12 quarters with baked-in narrative: `emitted = 180 + noise − 4i` (declining),
   `avoided = 120 + noise + 8i` (rising) → net crosses positive mid-series by construction.
3. **Peer panel** — hard-coded ratios of own KPIs (Peer Avg = 0.82×avoided, Top Quartile = 1.15×).
4. **Backend full assessment** — activities → per-activity calc (§7.1) → additionality → Article 6
   → BVCM → portfolio aggregation; activities missing avoided totals contribute 0 and are counted
   in `activities_missing_avoided`.

### 7.4 Worked example — backend activity calc

Solar generation displacing coal power: `baseline = 0.820`, `solution = 0.040` kgCO₂e/kWh,
`quantity = 10,000,000 kWh`, investor `attribution_factor = 0.25`:

| Step | Computation | Result |
|---|---|---|
| Avoided per unit | max(0, 0.820 − 0.040) | 0.780 kgCO₂e/kWh |
| Gross avoided | 0.780 × 10⁷ / 1000 | 7,800 tCO₂e |
| Attributed | 7,800 × 0.25 | **1,950 tCO₂e** |
| Category | "solar_panels" ∈ enabled examples | enabled |
| Net benefit (own S1-3 = 5,000 t) | 1,950 − 5,000 | −3,050 t (net emitter) |
| Avoidance ratio | 1,950 / 5,000 | 0.39× |

Against the EU grid average instead of coal, the same activity yields
`(0.276 − 0.040) × 10⁷ × 0.25 / 1000 = 590 tCO₂e` — a 3.3× swing purely from baseline choice,
which is exactly why the guide's "reference scenario" question is the crux of Scope 4 credibility.

### 7.5 Companion analytics on the page

Sub-module cards (Scope 4 Calculator, Handprint Analytics, Enablement Mapping, Portfolio Lens,
Taxonomy Screening) surface single KPI stats; a methodology-compliance table computes per-method
`rate = compliant/companies × 100`; a 40-row synthetic audit trail and a configurable board report
(audience/date-range/section toggles) round out the page. CSV export writes the filtered company
table (10 columns).

### 7.6 Data provenance & limitations

- **Frontend data is 100% synthetic** (`sr(seed) = frac(sin(seed+1)×10⁴)`), and — critically —
  `avoided` is drawn independently of `emitted`, sector, or any baseline: the page demonstrates
  the *reporting surface* of Scope 4, not its calculation.
- The frontend/backend disconnect means the honest-null design of the engine (unscored criteria,
  None ratios) is invisible in the UI, which always shows fully-populated numbers.
- Backend factor tables are engine constants of standard magnitude (e.g. coal 0.820 kgCO₂e/kWh ≈
  IEA supercritical coal; beef 27 kg/kg ≈ Poore & Nemecek) but carry no vintage/source metadata in
  code — a production build should version them.
- No double-counting screen is computed anywhere (the guide's "Double-Count Screen" exists only as
  a red alert string in `INITIAL_ALERTS`).
- `scope4 = avoided × 0.85` and `attribution = avoided × (0.5–0.9)` are display heuristics.

### 7.7 Framework alignment

- **GHG Protocol (avoided emissions / "Scope 4")** — GHGP's *Estimating and Reporting Avoided
  Emissions* guidance requires a consequential comparison of the assessed product against the
  most-likely reference scenario, reported **separately** from Scope 1/2/3. The backend implements
  the comparative-EF core and the separate net-benefit reporting; the frontend does not.
- **SBTi BVCM (2023)** — beyond-value-chain mitigation must be additional to (not netted against)
  science-based targets; the engine's 5-requirement check (science-based, beyond boundary, no
  double counting, high quality, transparent reporting) mirrors the guidance and warns on boundary
  and double-counting failures.
- **Paris Agreement Article 6.2/6.4** — ITMOs require host-country authorization and corresponding
  adjustments so the same reduction isn't counted in two NDCs; the engine enforces all-criteria
  eligibility and flags `corresponding_adjustment_required: True` unconditionally.
- **WBCSD PACT (guide reference)** — PACT is primarily a *product carbon footprint data-exchange*
  initiative; the guide conflates it with WBCSD's separate Avoided Emissions Framework. Neither is
  cited in code.
- **ICVCM CCPs** — referenced as the "high_quality" BVCM requirement: the ICVCM assesses carbon-
  credit programs and methodology categories against 10 Core Carbon Principles (governance,
  additionality, permanence, robust quantification, etc.); here it is a caller-confirmed boolean,
  not an assessed score.
