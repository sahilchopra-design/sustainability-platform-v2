## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — the engine header comment is the methodology statement; nothing to reconcile.)*

### 7.1 What the module computes

`backend/services/mining_risk_calculator.py` (`calculate_mining_risk(inp, scenario, horizon_year)`) is a single-function **mining & extractives climate-risk calculator** returning seven risk blocks for one mining entity, persisted/retrieved via `api/v1/routes/mining.py` (`POST /calculate`, `GET /assessments`, `GET /assessments/{id}`, `GET /reference-data`):

1. **Tailings risk** — GISTM consequence class → annual failure probability × compliance factor × facility count.
2. **Water risk** — intensity vs ICMM-style benchmark + WRI Aqueduct stress + acid-mine-drainage add-on.
3. **Closure provisioning** — estimated closure cost, provision coverage %, funding gap.
4. **Social / FPIC risk** — consent score inverted + FPIC/modern-slavery penalties.
5. **Critical-minerals supply security** — HHI concentration proxy → geopolitical risk.
6. **Transition demand / stranding** — clean-energy demand exposure and stranded value.
7. **Carbon-cost exposure** — Scope 1+2 × NGFS-scenario carbon price.

These roll up into `overall_risk_score` (0–100), `revenue_at_risk_pct` and `adaptation_capex_eur`.

### 7.2 Parameterisation (reference tables with in-code source attributions)

**Carbon prices** (€/tCO₂e, "NGFS Phase 4 scenarios (IIASA REMIND-MAgPIE)"): 1.5C {2030: 100, 2040: 200, 2050: 350} · 2C {70, 120, 200} · 3C {30, 50, 75} · BAU {15, 20, 25}. Nearest horizon year is used.

**GISTM consequence classes** ("GISTM 2020, Table 1"): EXTREME (min FoS 1.50, annual review, p_fail 0.005) · VERY_HIGH (1.40, 2y, 0.003) · HIGH (1.30, 3y, 0.001) · LOW (1.20, 5y, 0.0003). Compliance factors: non_compliant ×2.5, developing ×1.5, advanced ×1.0, leading ×0.5. *(The real GISTM Table 1 classifies consequence by population/environmental/economic impact and does not publish failure probabilities or these safety factors — the numeric columns are platform calibrations attached to the GISTM class labels.)*

**Critical-minerals HHI** ("IEA Critical Minerals Market Review 2023" proxies, 0–1): rare_earth 0.85, gallium 0.80, tungsten 0.75, cobalt 0.72 (DRC), graphite 0.70 (China), lithium 0.52 … copper 0.15, iron_ore 0.12, coal 0.08. **Transition demand exposure** (share of demand from clean transition by 2030, "IEA NZE"): lithium 0.90, graphite 0.85, cobalt 0.75, nickel 0.60 … **coal −0.80** (negative = demand destruction). **Water intensity benchmarks** (ML/kt ore, "ICMM Water Stewardship Framework 2014 / industry benchmarks"): uranium 1.50, lithium 1.20, gold 0.80, cobalt 0.60 … coal 0.12; unknown commodity 0.35.

**Closure-cost factors** (€/kt annual production when no cost supplied): open_pit 8,000 · underground 12,000 · in_situ_leach 5,000 · placer 3,000.

### 7.3 Calculation walkthrough

```
failure_prob = p_class × compliance_factor × max(1, facility_count), capped 0.10
tail_risk    = failure_prob × 1000, ×2.0 if EXTREME / ×1.5 if VERY_HIGH, capped 100
water_risk   = (stress/5)×50 + (intensity_ratio − 1)×10 [+20 if AMD high/critical], clamp 0–100
social_risk  = 100 − consent_score, +30 if FPIC not_obtained / +15 if not_assessed
               or partial, +10 if modern-slavery high, capped 100
geo_risk     = HHI × 100
stranding    = critical if trans_demand < −0.5 (or coal under 1.5C/2C); high if < 0; else low
stranded_val = revenue × |trans_demand| × reserve_life × 0.15 (critical) / 0.10 (high);
               coal-scenario branch: revenue × reserve_life × 0.20
overall      = 0.25·tail + 0.20·water + 0.20·social + 0.15·geo
               + 0.20·(100 critical / 50 high / 0 low stranding)
rev_at_risk  = min(80, 0.6·overall + 0.4·(carbon_exposure/revenue×100))
adapt_capex  = 0.05·closure_cost + 500·production_kt
```

Water intensity ratio bands: < 0.8 below · ≤ 1.2 at · ≤ 2.0 above · > 2.0 significantly_above (with warning). Provision coverage < 50% and non-compliant EXTREME/VERY_HIGH tailings also emit warnings. When `water_use_ml_yr` is absent, the benchmark itself is used (ratio = 1 — i.e. neutral assumption, not flagged as missing data).

### 7.4 Worked example — coal miner, 2C scenario, 2050 horizon

Input: coal, open_pit, 10,000 kt/yr, revenue €800M, Scope 1+2 = 1.2 MtCO₂e, 2 tailings facilities HIGH class / developing compliance, water stress 3.5 (no water use supplied), consent 60, FPIC partially_obtained, reserve life 15y, provisions €30M (no closure cost supplied).

| Block | Computation | Result |
|---|---|---|
| Carbon | 1,200,000 × €200 (2C@2050) | **€240M** exposure |
| Tailings | 0.001 × 1.5 × 2 = 0.003 → ×1000 | p = 0.003, score **3.0** |
| Water | (3.5/5)×50 + (1−1)×10 | **35.0** (intensity "at", benchmark 0.12 assumed) |
| Closure | 10,000 × 8,000 = €80M; coverage 30/80 | 37.5% → gap **€50M** + warning |
| Social | 100 − 60 + 15 (FPIC partial) | **55.0** |
| Geo | HHI 0.08 × 100 | **8.0** |
| Stranding | coal under 2C branch | **critical**; stranded = 800M × 15 × 0.20 = **€2.4bn** + NZE warning |
| Overall | 0.25·3 + 0.20·35 + 0.20·55 + 0.15·8 + 0.20·100 | **39.95 ≈ 40.0** |
| Revenue at risk | min(80, 0.6·40 + 0.4·(240/800×100)) = 24 + 12 | **36.0%** |
| Adaptation capex | 0.05·80M + 500·10,000 | **€9.0M** |

### 7.5 Data provenance & limitations

- **No PRNG** — fully deterministic; but several inputs default silently (water intensity → benchmark, closure cost → per-kt factor), so unsupplied data yields sector-typical rather than flagged-missing results (unlike the platform's newer insufficient-data engines).
- Source attributions are genuine framework names (GISTM 2020, WRI Aqueduct 4.0, IEA CMR 2023, NGFS Phase 4, ICMM), but the numeric tables (failure probabilities, HHIs, demand shares, benchmarks, €/kt closure factors) are stylised platform encodings, not verbatim published data; NGFS carbon prices are of the right magnitude for REMIND pathways but rounded.
- Stranded value is a heuristic (revenue × reserve-life × 10–20% scalar), not a DCF of lost margins; failure probability treats facilities as additive and independent, capped arbitrarily at 10%/yr.
- Geopolitical risk = HHI×100 conflates supply concentration with the miner's own risk (a producer *benefits* from concentration it controls); the engine's own comment calls it a "simplified proxy".
- The route layer persists assessments (retrievable via `GET /assessments`), giving audit history.

### 7.6 Framework alignment

- **GISTM (2020):** the Global Industry Standard on Tailings Management classifies facilities into consequence classes (Low → Extreme) driving governance, review frequency and engineering requirements; the module reuses the class ladder and adds quantified failure probabilities and a compliance-maturity multiplier as its risk overlay.
- **WRI Aqueduct 4.0:** the 0–5 baseline water-stress index is consumed directly as `water_stress_index` and linearly weighted into water risk.
- **IEA Critical Minerals Market Review 2023 / NZE:** supply-concentration (HHI-style) and clean-energy demand-share concepts; the coal −0.80 demand-destruction entry and the "no new coal mines" warning reflect IEA NZE messaging.
- **NGFS Phase 4 (REMIND-MAgPIE):** scenario carbon-price trajectories by 2030/2040/2050 for the carbon-cost block.
- **UN Global Compact / FPIC:** Free, Prior and Informed Consent status as a stepped social-risk penalty — consistent with FPIC's role in IFC PS7 and ICMM position statements.
- **GHG Protocol (extractives):** Scope 1+2 boundary for the carbon-cost exposure; Scope 3 (use-phase, dominant for coal) is out of scope here.
