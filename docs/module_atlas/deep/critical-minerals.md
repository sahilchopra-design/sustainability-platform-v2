## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *Critical Mineral
> Demand Projection Model* — `Demand(t) = Σ_tech Deployment(t) × MineralIntensity(tech) × (1 −
> RecyclingRate(t))`, IEA scenario pathways, supply gaps and investment gaps. **The React page
> implements none of that.** The frontend (`CriticalMineralsPage.jsx`) fabricates every score with a
> seeded PRNG and never calls the demand-projection formula. Ironically a *real* IEA-calibrated
> reference dataset exists in the backend engine (`critical_minerals_engine.py`) — 15 minerals with
> genuine HHI, top-3 country shares, demand-growth multipliers and recycling rates — but the page
> does **not** consume it: it fires one fire-and-forget `POST /assess` whose response is discarded
> ("`API fallback to seed data`"). The sections below document the page as it actually behaves and
> flag where the engine's real numbers should replace the PRNG.

### 7.1 What the module computes

Five tabs, each derived from the selected `mineral` via the platform PRNG
`seed(s) = frac(sin(s+1)×10⁴)` seeded on the mineral's 1-based index `mi`:

```js
// IEA criticality — 4 sub-scores averaged
subScores = [demand_growth, supply_concentration, geopolitical_risk, substitutability]
composite = round(Σ subScores.value / 4)
tier      = composite≥80 Critical | ≥65 High | ≥50 Medium | else Low

// Supply-chain HHI on 5 tech exposures (this IS a real formula, on fake inputs)
total = Σ exposures.value
hhi   = total>0 ? round(Σ (value/total)² × 10000) : 0     // Herfindahl-Hirschman
```

Only the EU CRMA Annex-I/II strategic/critical flags and the HHI arithmetic are genuine; every
numeric magnitude fed into them is synthetic.

### 7.2 Parameterisation / scoring rubric

| Quantity | Formula (from code) | Provenance |
|---|---|---|
| IEA demand growth | `round(seed(mi×7)×40+55)` → 55–95 | synthetic seeded |
| IEA supply concentration | `round(seed(mi×11)×35+50)` → 50–85 | synthetic seeded |
| IEA geopolitical risk | `round(seed(mi×13)×38+45)` → 45–83 | synthetic seeded |
| IEA substitutability | `round(seed(mi×17)×30+40)` → 40–70 | synthetic seeded |
| EU strategic flag | `EU_CRMA_ANNEX_I_STRATEGIC.has(mineral)` | **real** — Reg (EU) 2024/1252 Annex I |
| EU critical flag | `EU_CRMA_ANNEX_II_CRITICAL.has(mineral)` | **real** — Annex II |
| CRM compliance | `round(seed(mi×29)×35+50)` → 50–85 | synthetic seeded |
| IRMA 6 areas | `round(seed(mi×5x)×~30+~47)` | synthetic seeded |
| Supply-disruption prob | `round(seed(mi×107)×35+15)` → 15–50% | synthetic seeded |
| Top-3 country share | `round(seed(mi×109)×30+55)` → 55–85% | synthetic seeded |

The IEA framework reference card (Demand 30%, Concentration 30%, Geopolitical 25%,
Substitutability 15%) is displayed as static text but the composite is a flat 4-way average, so the
displayed weights are **not applied**.

### 7.3 Calculation walkthrough

`mineral` selector → `mi = index+1` → each tab's `get*Data(mineral)` reseeds the PRNG on `mi ×
prime`. Tiers are threshold cuts on the resulting composites. Producer-country table (China/DRC/
Australia/Chile/Russia) reseeds shares on `supply.total × prime`. The HHI is the only value that
propagates a computed quantity (`total`) into a downstream metric.

### 7.4 Worked example (lithium, `mi = 1`)

| Step | Computation | Result |
|---|---|---|
| Demand growth | `round(frac(sin(8)×10⁴)×40+55)` = round(0.848×40+55) | ≈ **89** |
| Supply conc. | `round(frac(sin(12)×10⁴)×35+50)` | ≈ **68** |
| Geo risk | `round(frac(sin(14)×10⁴)×38+45)` | ≈ **83** |
| Substitutability | `round(frac(sin(18)×10⁴)×30+40)` | ≈ **63** |
| Composite | `(89+68+83+63)/4` | **75.75 → 76** |
| Tier | 76 ≥ 65 | **High** |
| EU strategic | `'lithium' ∈ Annex I` | **Yes** |

The engine's *real* lithium record would instead report composite 88, HHI 7200, top-3 = Australia
47 / Chile 26 / China 15 — materially different and correctly sourced.

### 7.5 Backend engine (unused by page)

`assess_critical_minerals()` is a genuine multi-standard model: IEA composite (portfolio average of
real per-mineral scores), EU CRMA compliance (0.40 audit + 0.30 strategic + 0.30 concentration,
with the real 65% single-country breach test on `top3_country_share_pct`), IRMA weighted score
(Ch2 0.10 / Ch3 0.15 / Ch4 0.15 / Ch5 0.15 / Ch6 0.25 / Ch7 0.20 — matches IRMA v1.0 chapter
weights), OECD 5-step composite (0.20/0.20/0.25/0.20/0.15), and overall `crm_risk_score = IEA×0.40 +
OECD_gap×0.30 + concentration×0.30`. Where fields are absent it falls back to `_seed_float` (a
hash-based deterministic demo value) — so even the engine synthesises inputs, but its *reference
tables* (HHI, shares, recycling rates) are real IEA CRM 2024 values.

### 7.6 Data provenance & limitations

- **Frontend: 100% synthetic** via `seed()`; the real engine dataset is present but disconnected.
- Engine reference data (`IEA_CRITICAL_MINERALS_2024`, `EU_CRM_ACT_MINERALS`, IRMA/OECD tables) is
  authentic and citable; per-entity scores fall back to `_seed_float` hash when not supplied.
- No demand-projection time series exists anywhere — the guide's flagship formula is unimplemented.

**Framework alignment:** IEA *Critical Minerals Outlook 2024* (criticality dimensions) · EU Critical
Raw Materials Act, Reg (EU) 2024/1252 (Annex I strategic / Annex II critical; Art 5 10/40/25%
benchmarks + 65% concentration cap; Art 11/14 stockpiling & due-diligence) · IRMA Standard for
Responsible Mining v1.0 (6 chapters, tiered 50/70/85%) · OECD Due Diligence Guidance 5-step ·
Dodd-Frank §1502 / EU Reg 2017/821 (3TG conflict minerals). The engine encodes all of these
correctly; the page approximates them with seeded placeholders.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** (The page displays criticality, supply-gap
and disruption numbers with no model; the demand-projection model named in the guide does not exist.)

**8.1 Purpose & scope.** Project clean-energy critical-mineral demand, secondary (recycled) supply,
and the resulting supply–demand balance / investment gap per mineral, 2024–2050, under IEA scenario
pathways. Supports procurement diversification and transition-capex sizing for 15 minerals × 6
clean-energy technologies.

**8.2 Conceptual approach.** Bottom-up material-flow model, mirroring the **IEA Critical Minerals
demand model** and **BNEF Transition Metals Outlook**: technology deployment (GW, GWh) × material
intensity (t/unit) minus recycled secondary supply, netted against committed mine + refining
capacity. Concentration/geopolitical risk overlays follow **USGS Mineral Commodity Summaries** and
the **HHI** market-structure convention used by the EU CRMA supply-risk score.

**8.3 Mathematical specification.**
```
Demand_m(t) = Σ_tech  Deploy_tech(t) × Intensity_{m,tech}(t) × (1 − Recycle_m(t))
Recycle_m(t)= min(R_max,m , R0_m + k_m·(t − t0))        # linear recycling ramp
Supply_m(t) = Σ_projects Capacity_p · Ramp_p(t) · (1 − Attrition)
Gap_m(t)    = max(0, Demand_m(t) − Supply_m(t))
InvGap_m    = Σ_t Gap_m(t) · Capex_intensity_m · DF(t)   # $ needed to close gap
HHI_m       = Σ_country share²_{country,m}·10⁴ ;  SupplyRisk_m = f(HHI_m, GeoRisk_m)
```

| Parameter | Symbol | Value / source |
|---|---|---|
| Deployment path | `Deploy_tech(t)` | IEA WEO/NZE, BNEF NEO scenario GW/GWh |
| Material intensity | `Intensity` | IEA 2024 (e.g. NMC811 8.8 kg Ni/kWh) — engine `TRANSITION_TECHNOLOGY_MINERAL_INTENSITY` |
| Recycling ramp | `R0,R_max,k` | IEA CRM 2024 (battery 5%→40% by 2040) |
| Mine capacity | `Capacity_p` | S&P Global / USGS project pipeline |
| Capex intensity | `Capex_intensity_m` | World Bank *Minerals for Climate Action* |
| Country shares | `share_country,m` | USGS MCS 2024 — engine `top3_country_share_pct` (real) |

**8.4 Data requirements.** Deployment GW/GWh by tech-scenario-year; material-intensity matrix
(exists in engine); recycling-rate trajectories; mine/refinery capacity pipeline; capex-intensity;
country production shares (exist, real). Vendor: S&P Global Market Intelligence, Benchmark Mineral
Intelligence; free: IEA, USGS, World Bank. Platform already holds the intensity matrix and
country-share tables in `critical_minerals_engine.py`.

**8.5 Validation & benchmarking.** Backtest 2015–2024 demand vs USGS reported consumption; reconcile
2030/2040 demand to published IEA CRM 2024 headline figures (lithium ≈6.5× 2023→2040); sensitivity
on chemistry mix (NMC↔LFP) and recycling ramp; benchmark investment-gap against IEA's $360–500bn
2024–35 mining gap.

**8.6 Limitations & model risk.** Chemistry-substitution (LFP displacing Ni/Co) is the dominant
uncertainty; recycling ramps are policy-sensitive; single-scalar geopolitical overlays cannot
capture export-ban shocks (e.g. gallium/germanium). Conservative fallback: report demand ranges
across ≥3 scenarios rather than a point estimate.
