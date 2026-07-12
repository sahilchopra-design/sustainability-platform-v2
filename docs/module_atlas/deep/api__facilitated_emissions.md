## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is grounded solely in
`backend/services/facilitated_emissions_engine.py` and
`backend/api/v1/routes/facilitated_emissions.py`.)*

### 7.1 What the domain computes

`FacilitatedEmissionsEngine` implements two PCAF accounting streams that sit *outside* classic
financed emissions:

**Part C — facilitated emissions** (capital-markets services). Per deal:

```
facilitated_tCO2e = AF × issuer_emissions          (per scope; scope 3 only if include_scope3)
```

with the attribution factor `AF` keyed to deal type (`_compute_attribution_factor`):

| Deal type | AF formula (from code) | ÷3 time factor? |
|---|---|---|
| bond / convertible underwriting | `underwritten / total_issuance × 1/3` | yes (`_PCAF_TIME_FACTOR = 0.333333`) |
| equity placement / IPO | `placed × (1 + overallotment%/100) / market_cap × 1/3` | yes (green-shoe grossed up) |
| securitisation | `tranche_held / total_pool` | **no** (method string: "no ÷3 time factor") |
| syndicated loan (arranger) | `arranged / total_facility` | no |
| advisory (M&A / restructuring) | `AF = 0` — disclosure-only per PCAF 2022 guidance | — |

**Part B — insurance-associated emissions.** Per policy, routed by line of business:

- **Motor:** `vehicles × annual_km × gCO₂/km ÷ 10⁶` → tCO₂e; scope split by fuel (BEV/H₂ → all
  scope 2; PHEV → 50/50; combustion → all scope 1). `vehicles = max(count, 1)`.
- **Property:** `area_m² × kgCO₂/m²(EPC) ÷ 1000`; split 40% scope 1 (heating) / 60% scope 2
  (electricity); premium-based LoB proxy fallback when area is missing.
- **Commercial:** `insured_revenue × sector_intensity`; split 60/40; premium×LoB-factor fallback.
- **Life/Health:** disclosure-only — `GWP × 5 tCO₂e/$M` proxy, split 30/70, with a warning.
- Any line with direct policyholder scope 1/2 data bypasses proxies (`AF = 1.0`).

The routes persist every calculated deal/policy to DB tables (created on demand via
`_ensure_tables`), so `GET /deals`, `GET /insurance` and the two `/summary` endpoints serve the
accumulated stored records, aggregated by `_aggregate_facilitated` / `_aggregate_insurance`
(totals by scope, by deal type / LoB, green-bond counts, average PCAF DQS).

### 7.2 Parameterisation

**Sector emission intensities** (tCO₂e/$M revenue, GICS): Energy 820, Utilities 950,
Materials 410, Industrials 180, Consumer Staples 110, Real Estate 95, Cons. Discretionary 85,
Health Care 55, IT 28, Comm. Services 22, Financials 12, Sovereign 320 (per $M GDP), Unknown 150.
Order-of-magnitude consistent with CDP/MSCI sector medians; no inline source citation —
treat as **platform calibration**.

**Vehicle factors** (gCO₂/km · default km/yr): petrol 170·12,000; diesel 155·18,000; hybrid
105·12,000; PHEV 60·12,000; BEV 0·12,000; LPG 145·15,000; CNG 135·15,000; H₂-FCEV 0.
**Building factors** by EPC (kgCO₂/m²·yr): A+ 8, A 15, B 30, C 50, D 75, E 100, F 135, G 180.
**Insurance LoB factors** (tCO₂e/$M premium): motor personal 42, motor commercial 85, property
resi 28 / comm 55, liability 35, marine 120, energy 450, other 65, life/health 5.

**DQS derivation** (`derive_dqs`): source map direct_measurement→1, audited_report→2,
self_reported→3, sector_average→4, estimated→5; upgraded to ≤2 when scope 1+2 present *and*
verified, ≤3 when present but unverified; explicit 1–5 override wins.

**Missing-emissions fallback:** when an issuer reports no scope 1/2, the engine estimates
`revenue × sector_intensity` and splits it 60% scope 1 / 40% scope 2 (code comment: "assume
60/40 split"), recording a warning.

### 7.3 Calculation walkthrough

`POST /deals` → Pydantic input → engine dataclass → (1) emissions default/estimate, (2) AF by
deal type with a formula-bearing `methodology_note`, (3) DQS, (4) per-scope multiplication,
(5) persistence; the response embeds the audit trail (warnings + method string). Batch variants
map the same path and return the portfolio summary object.

### 7.4 Worked example — bond underwriting

Bank underwrites $250M of a $1,000M corporate bond; issuer reports scope 1 = 1.2 MtCO₂e,
scope 2 = 0.3 MtCO₂e (audited, unverified flag), scope 3 excluded.

| Step | Computation | Result |
|---|---|---|
| AF | (250 / 1000) × 0.333333 | **0.083333** |
| Facilitated scope 1 | 0.083333 × 1,200,000 | 100,000 tCO₂e |
| Facilitated scope 2 | 0.083333 × 300,000 | 25,000 tCO₂e |
| Facilitated total | 0.083333 × 1,500,000 | **125,000 tCO₂e** |
| DQS | audited_report → 2 | 2 |

Insurance cross-check: a 10,000-vehicle diesel fleet policy → 10,000 × 18,000 km × 155 g/km =
2.79 × 10¹⁰ g = **27,900 tCO₂e**, all scope 1; with GWP $12M the reported intensity is
27,900/12 = 2,325 tCO₂e/$M premium.

### 7.5 Semantics of the reported "attribution factor"

For Part C the AF is a true ownership-share fraction. For Part B proxy paths the field is
**overloaded**: motor returns `gCO₂/km ÷ 1000` (kg/km), property returns `kgCO₂/m² ÷ 1000`
(t/m²), commercial/life return the intensity factor itself (tCO₂e/$M). Consumers should read
`attribution_method` rather than compare AF values across lines.

### 7.6 Data provenance & limitations

- No `sr(seed)` PRNG anywhere — data is either caller-supplied or deterministic reference
  constants; but every factor table (sector intensities, vehicle, EPC, LoB) is an uncited
  platform calibration ("synthetic demo values" in atlas terms), not an official PCAF Annex.
- The ÷3 factor is hardcoded `0.333333`: PCAF's 2023 Part C standard adopted a 33% weighting for
  facilitated emissions — the engine matches that consensus; note PCAF applies it to *all*
  capital-markets facilitation, whereas this engine skips it for securitisation and syndicated
  arrangement (treating held tranches/arranged share as balance-sheet-like).
- Scope splits (60/40 corporate, 40/60 property, 30/70 life, 50/50 PHEV) are stated assumptions,
  not measured; BEV scope-2 uses the same g/km "0.0" table entry — i.e. BEV fleets currently
  compute **zero** emissions despite the scope-2 comment, because gCO₂/km is 0 for BEV.
- Life/health proxy contradicts PCAF's disclosure-only stance by producing a number
  (flagged via warning).
- Insurance-associated emissions under the real PCAF standard attribute
  `customer emissions × (premium / customer revenue)`; the engine's premium-factor and
  physical-asset approaches are simplified proxies of that.

### 7.7 Framework alignment

- **PCAF Part C (Facilitated Emissions, 2023)** — attribution = share of issuance × 33%
  weighting factor, exactly the debt/equity formulas coded; advisory excluded from attribution,
  matching PCAF's disclosure-only treatment.
- **PCAF Part B / Insurance-Associated Emissions Standard (2022)** — LoB-specific attribution;
  in the real standard IAE = attribution factor (premium ÷ customer revenue) × customer
  emissions for commercial lines and premium-share of vehicle emissions for motor; the engine
  approximates with activity-based (km, m², revenue) and premium-factor proxies plus the PCAF
  DQS 1–5 ladder.
- **GHG Protocol** — scope 1/2/3 taxonomy underlies all outputs; scope 3 inclusion is opt-in.
- **SFDR Delegated Regulation 2022/1288** — cited in the engine header as the disclosure
  destination (PAI 1–4 GHG indicators) for the aggregated outputs.
- **EU Taxonomy / green-bond tagging** — deals carry `use_of_proceeds` and
  `eu_taxonomy_aligned_pct` pass-through fields for the green-vs-general split in the summary.
