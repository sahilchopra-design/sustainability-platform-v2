## 7 · Methodology Deep Dive

### 7.1 What the domain computes

`/api/v1/scenarios` is the platform's **scenario lifecycle engine**: it (a) syncs a library of 8
NGFS scenario definitions into the `Scenario` table (`ngfs_sync_service.py`), (b) manages custom
scenario creation / versioning / approval / publication (`scenario_builder_service.py`), and
(c) previews scenario impact on a portfolio as an expected-loss delta
(`scenario_impact_service.py`):

```
EL_baseline = Σ_h  PD(rating_h) × LGD × EAD_h                       LGD = 0.45
EL_scenario = Σ_h  min(1, PD × sectorMult × tempFactor × gdpFactor) × min(LGD×1.1, 0.9) × EAD_h
ΔEL % = (EL_scenario − EL_baseline) / EL_baseline × 100
```

### 7.2 Parameterisation

**NGFS scenario library** (embedded in `NGFSSyncService.NGFS_SCENARIOS`; code comments cite NGFS
Phase IV plus Phase V 2024 recalibrations "per post-AR6 NiGEM model"; carbon prices USD/tCO₂, GDP
impact % deviation from baseline):

| Scenario | Phase | Carbon price 2030→2050 | Temp 2050 | GDP 2050 | Phys. mult 2050 | Trans. mult 2050 |
|---|---|---|---|---|---|---|
| Net Zero 2050 | V | 173 → 735 | 1.4 °C | −1.6 % | 1.1 | 1.2 |
| Delayed Transition | V | 110 → 1,200 | 1.7 °C | −4.8 % | 1.2 | 2.0 |
| Below 2 °C | IV | 120 → 490 | 1.6 °C | −2.3 % | 1.3 | 1.1 |
| NDCs | IV | 60 → 200 | 2.3 °C | −3.0 % | 1.8 | 0.9 |
| Current Policies | IV | 25 → 60 | 3.0 °C | −5.0 % | 2.8 | 0.2 |
| Fragmented World | IV | 80 → 500 | 2.8 °C | −6.5 % | 2.2 | 1.5 |
| Low Demand (new) | V | 90 → 360 | 1.4 °C | −1.1 % | 1.0 | 0.8 |
| Divergent Net Zero (new) | V | 140 → 590 | 1.5 °C | −2.1 % | 1.2 | 1.4 |

Extras: Low Demand carries `demand_reduction_pct` (5→32 % by 2050, citing IPCC AR6 WG3 Ch.5);
Divergent Net Zero carries `cbam_friction_factor = 1.35` (carbon-border amplification).

**Cross-scenario constants** stored into every synced scenario's `parameters`:

| Table | Values | Provenance |
|---|---|---|
| `SECTORAL_MULTIPLIERS` | energy 1.8, utilities 1.6, transport 1.5, materials 1.4, industrials 1.3, real_estate 1.2, cons. disc. 1.1, cons. staples 1.0, financials 1.0, healthcare 0.9, technology 0.8 | Synthetic; comment: "energy sector has highest exposure" |
| `PHYSICAL_RISK_FACTORS` | wildfire 1.20, storm 1.18, flood 1.15, sea-level 1.14, heatwave 1.12, drought 1.10 | Synthetic demo values |
| Rating→PD map | AAA 0.1 % … BBB 2 % … B 20 % … CCC- 90 %; unrated → 2 % | Stylised "standard PD mapping", not a named agency table |
| `BASELINE_LGD` | 0.45 | Close to the 45 % Basel foundation-IRB senior-unsecured LGD |

### 7.3 Calculation walkthrough

1. **Sync** (`POST /ngfs/sources` → `sync_ngfs_scenarios`): upserts one `Scenario` row per
   NGFS type keyed on `(source=NGFS, type, version)`, auto-`APPROVED` and published (code comment:
   "NGFS scenarios are pre-approved"). A SHA-256 hash of the definitions supports change detection.
   Note: despite the docstring's "downloading" language, **no download occurs** — definitions are
   embedded constants.
2. **Builder lifecycle**: custom scenarios start `DRAFT` (version 1); parameter updates increment
   `current_version` and append a `ScenarioVersion` snapshot; state machine is
   DRAFT → PENDING_APPROVAL → APPROVED → published (REJECTED returns to editable). Forking deep-
   copies parameters; a forked NGFS scenario becomes source `HYBRID`, otherwise `CUSTOM`.
3. **Impact preview** (`GET /{scenario_id}/preview/{portfolio_id}`): pulls scenario `parameters`
   (or an override), then per holding:
   - `tempFactor = 1 + (temp_2050 − 1.0) × 0.15` — comment: "15 % PD increase per degree above 1 °C"
   - `gdpFactor = 1 + \|gdp_2050\| × 0.05` — "5 % PD increase per 1 % GDP decline"
   - `PD_scenario = min(1, PD_base × sectorMult × tempFactor × gdpFactor)`
   - `LGD_scenario = min(0.45 × 1.1, 0.9) = 0.495`
   Results are cached in `ScenarioImpactPreview` (upsert per scenario × portfolio,
   `calculation_version = "1.0"`).

### 7.4 Worked example — Current Policies on the sample energy holding

Holding h1: Energy Corp A, EAD $50M, rating BBB (PD 2.0 %), sector energy (mult 1.8). Current
Policies: temp 2050 = 3.0 °C, GDP 2050 = −5.0 %.

| Step | Computation | Result |
|---|---|---|
| Baseline EL | 0.02 × 0.45 × 50,000,000 | **$450,000** |
| Temp factor | 1 + (3.0 − 1.0) × 0.15 | 1.30 |
| GDP factor | 1 + 5.0 × 0.05 | 1.25 |
| Scenario PD | 0.02 × 1.8 × 1.30 × 1.25 | 5.85 % |
| Scenario LGD | min(0.45 × 1.1, 0.9) | 49.5 % |
| Scenario EL | 0.0585 × 0.495 × 50,000,000 | **$1,447,875** |
| ΔEL | 1,447,875 / 450,000 − 1 | **+221.75 %** |

### 7.5 Internal inconsistency worth knowing

The sector and rating **breakdown tables do not reuse the headline formula**: `by_sector` uses
`scenario_el = baseline_el × sectorMult × 1.5` and `by_rating` uses a flat `× 1.8` (both marked
"Simplified factor/multiplier" in comments). So the by-sector/by-rating panels will not sum to the
headline `scenario_expected_loss`, and the by-rating change is a constant +80 % for every rating
band. Top-impacted holdings use the same simplified ×1.5 sector formula, ranked by `change_pct`.

### 7.6 Data provenance & limitations

- **Portfolio holdings are hard-coded sample data** — `_get_portfolio_holdings` ignores
  `portfolio_id` and always returns the same 5 demo counterparties ($165M total). The docstring
  says "In production, query the holdings table." No `sr()` PRNG is used; the fabrication is a
  fixed literal list.
- Scenario parameter *shapes* follow NGFS publications, but the specific numbers are
  hand-embedded approximations of NGFS Phase IV/V outputs, not ingested IIASA data (the ingested
  series live in the separate `api::scenario_data` domain).
- Single-horizon (2050 values only) EL; no discounting, no PD term structure, no correlation.
  The 0.15/°C and 0.05/%GDP sensitivities are unattributed modelling choices.
- LGD stress is scenario-invariant (always ×1.1 capped at 90 %).

### 7.7 Framework alignment

- **NGFS Phases IV/V** — the scenario taxonomy, names, and the Phase V additions (Low Demand,
  Divergent Net Zero) match the real NGFS 2023/2024 releases; NGFS derives these with three IAMs
  (GCAM, MESSAGEix-GLOBIOM, REMIND-MAgPIE) plus the NiGEM macro model — here the outputs are
  summarised into 4-point paths per variable.
- **IFRS 9 §5.5.17** — the EL = PD × LGD × EAD kernel is the standard expected-credit-loss form;
  no staging/SICR logic exists in this domain (that lives in climate-credit modules).
- **Model-risk governance (SR 11-7 style)** — the builder's draft/approve/publish workflow with
  immutable version snapshots mirrors supervisory expectations for scenario change control.
- **EU CBAM** — Divergent Net Zero's `cbam_friction_factor` gestures at carbon-border adjustment
  costs; it is stored but not consumed by the impact calculator.
