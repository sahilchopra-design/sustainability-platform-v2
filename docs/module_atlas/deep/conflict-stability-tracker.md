## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (formula not implemented).** The MODULE_GUIDES entry (EP-CV4) states an
> asset-proximity model `ProximityRisk = f(distance_to_conflict, conflict_intensity)` and describes an
> "assets within 100km of conflict zones" computation. **No such function exists in the code.** Every
> risk field — the asset `risk` band (CRITICAL/HIGH/MEDIUM/LOW), `insurance` status, `coup_risk`,
> `backsliding` — is a **hard-coded curated value**, not derived from distance × intensity. The page is a
> presentation layer over an editorially-assembled conflict dataset with threshold-based colouring. The
> underlying figures (FSI scores, event counts) track real ACLED / Fund-for-Peace data closely, so this
> is not a synthetic-PRNG module; it is a *static curated dashboard*. §8 specifies the proximity model.

### 7.1 What the module computes

Almost nothing is derived. The only arithmetic is portfolio roll-ups and sort/threshold display logic:

```js
totalEvents  = Σ HOTSPOTS.events_2025                              // KPI
deteriorating = |HOTSPOTS.trend == 'deteriorating'|               // KPI
assetsAtRisk  = |ASSET_PROXIMITY.risk ∈ {CRITICAL, HIGH}|          // KPI
earlyWarning  = [...HOTSPOTS].sort((a,b) ⇒ b.coup_risk − a.coup_risk)   // ranked table
```
Colour thresholds only: coup risk red>30 / amber>15 / green; backsliding red>40 / amber>20; asset risk
maps to `RISK_COLORS`; insurance to `INS_COLORS`. The insurance "Coverage Assessment" text is a literal
switch on the pre-set `insurance` string (Unavailable → "consider MIGA", High Premium → "200–500bp", …).

### 7.2 Parameterisation / scoring rubric

| Field | Values | Provenance |
|---|---|---|
| `fsi` | 72.5–111.8 | Fund for Peace Fragile States Index (curated, tracks real FSI) |
| `events_2025`, `fatalities` | curated counts | ACLED-style (curated, labelled "ACLED 2025") |
| `stability` | 2–12 (WGI-style) | World Bank WGI Political Stability percentile (curated) |
| `coup_risk` %, `backsliding` % | curated | Editorial estimate — no cited model |
| `insurance` | Unavailable/Restricted/High Premium/Available | PRI market intelligence (curated) |
| `distance_km`, `conflict_events`, `risk` | per asset, curated | **`risk` is assigned, not computed** |

`HOTSPOTS` holds 15 countries; `FSI_TOP20` is a 20-row fragility ranking; `ASSET_PROXIMITY` holds 8
portfolio assets with a *pre-labelled* risk band. Coloured thresholds are hard-coded display conventions.

### 7.3 Calculation walkthrough

1. `HOTSPOTS` / `FSI_TOP20` / `STABILITY_TREND` / `ASSET_PROXIMITY` are module-level constants.
2. `filtered = countryFilter=='All' ? HOTSPOTS : HOTSPOTS.filter(...)` — the only reactive transform.
3. Four KPI cards sum/count over the full `HOTSPOTS`; six tabs each render one constant as a chart or
   table. The Early-Warning tab sorts by `coup_risk`; the Insurance tab renders the fixed `insurance`
   string plus canned advisory text.

### 7.4 Worked example

Sudan Gold Mine (`distance_km = 8`, `conflict_events = 120`) is displayed as **CRITICAL** — but the code
does not derive that band from 8 km and 120 events; `risk:'CRITICAL'` is a literal in the data. By
contrast, a genuine proximity model (§8) would compute e.g. `intensity_decay = exp(−8/25) = 0.726`, times
a normalised event count `120/120 = 1.0` → high score → CRITICAL — reproducing the label but from inputs.
The Sudan country row shows `coup_risk = 45%` → red (>30), `backsliding = 35%` → amber bar (>20), all by
threshold colouring of the stored values.

### 7.5 Companion analytics on the page

Six tabs: Conflict Event Map (events × fatalities scatter), Political Stability Trends (5-yr WGI-style
line), Fragile States Index (FSI_TOP20 bars), Asset Proximity (table with risk bands), Early Warning
(coup/backsliding/FSI table), Insurance Implications (PRI coverage table + provider list). No backend
engine or route (`engines: []`, `route_files: []`); no interconnection feeds other modules.

### 7.6 Data provenance & limitations

- **Curated static data, not synthetic-PRNG.** FSI scores, event counts, and WGI stability track real
  ACLED / Fund-for-Peace / World Bank figures as of a 2025 editorial snapshot — but they are frozen
  constants, not a live feed, so they age and cannot be refreshed in-app.
- `coup_risk` and `backsliding` percentages carry **no cited methodology** — treat as editorial estimates.
- The asset `risk` band and `insurance` status are **assigned, not modelled**; the guide's
  distance × intensity function is absent.

**Framework alignment:** *ACLED* (Armed Conflict Location & Event Data — geolocated event/fatality
counts) frames the event fields. *Fund for Peace Fragile States Index* (12 cohesion/economic/political/
social indicators, 0–120 scale, higher = more fragile) supplies `fsi`. *World Bank WGI* Political Stability
& Absence of Violence underlies `stability`. *JRC INFORM Risk Index* is referenced for hazard/vulnerability
scoring but not implemented. Political-risk-insurance references (MIGA, Lloyd's, DFC) are advisory context.

---

## 8 · Model Specification — Asset-Level Conflict Proximity Risk

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Score each portfolio asset for conflict exposure from its geolocation and the surrounding conflict field,
so that political-risk-insurance sizing and capital-at-risk overlays can be automated rather than
hand-labelled. Coverage: any georeferenced physical asset (terminals, mines, pipelines, plants).

### 8.2 Conceptual approach
Combine a **distance-decayed conflict-intensity kernel** (spatial-epidemiology / ACLED "conflict exposure"
convention) with a **country-fragility multiplier** (Fund for Peace FSI + World Bank WGI). This mirrors how
political-risk insurers (MIGA, Lloyd's) and index providers (Verisk Maplecroft, Control Risks) build
location risk: a local hazard field modulated by a national governance/fragility backdrop.

### 8.3 Mathematical specification
```
For asset a at location x_a, over conflict events e within radius R:
LocalIntensity_a = Σ_e  fatalities_e · exp( −dist(x_a, x_e) / λ )       (λ = decay length, km)
Exposure_a       = LocalIntensity_a / max_a LocalIntensity_a            (0–1 normalised)
Country mult     = 0.5 + 0.5 · (FSI_c / 120)                            (fragility overlay)
ProximityRisk_a  = clamp( Exposure_a · CountryMult_c , 0 , 1 ) × 100
Band: CRITICAL ≥75 · HIGH 50–75 · MEDIUM 25–50 · LOW <25
```
| Parameter | Symbol | Calibration source |
|---|---|---|
| Decay length | `λ` | 15–30 km (ACLED spatial studies of event spillover) |
| Search radius | `R` | 100 km (guide's stated proximity band) |
| Fragility scale | `FSI_c/120` | Fund for Peace FSI (0–120) |
| Governance overlay | — | World Bank WGI Political Stability percentile |
| Band cut-offs | — | Insurer market convention (align to PRI availability) |

### 8.4 Data requirements
Asset lat/long; a live ACLED event feed (date, location, fatalities) — ACLED offers a free API; country
FSI and WGI tables (free, annual). The platform already holds asset-country joins and FSI/WGI-style values
in `HOTSPOTS`; the new pieces are asset coordinates and the ACLED spatial feed.

### 8.5 Validation & benchmarking plan
Reconcile computed bands against the current hand-labels (should reproduce Sudan=CRITICAL, Ethiopia=LOW);
backtest whether high `ProximityRisk` precedes realised business-interruption or PRI claims; sensitivity on
`λ` and `R`. Benchmark against a commercial location-risk index (Verisk Maplecroft) on a sample of assets.

### 8.6 Limitations & model risk
Event geolocation is noisy and reporting-biased (under-counting in closed regimes inflates apparent
safety) — apply a country reporting-quality correction. The decay kernel is isotropic; real conflict
spreads along roads/borders. Fragility overlays are slow-moving and can lag coups. Conservative fallback:
floor any asset in an `insurance = Unavailable` country at HIGH regardless of local intensity.
