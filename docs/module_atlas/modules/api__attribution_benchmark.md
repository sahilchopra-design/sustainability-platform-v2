# Api::Attribution_Benchmark
**Module ID:** `api::attribution_benchmark` · **Route:** `/api/v1/attribution` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/attribution/esg-attribution` | `esg_attribution` | api/v1/routes/attribution_benchmark.py |
| POST | `/api/v1/attribution/benchmark-report` | `benchmark_report` | api/v1/routes/attribution_benchmark.py |
| GET | `/api/v1/attribution/pai-indicators` | `get_pai_indicators` | api/v1/routes/attribution_benchmark.py |

### 2.3 Engine `benchmark_analytics` (services/benchmark_analytics.py)
| Function | Args | Purpose |
|---|---|---|
| `BenchmarkAnalyticsService.compute_peer_rankings` | fund, peers | Rank a fund against peers on key ESG metrics. |
| `BenchmarkAnalyticsService.compute_period_comparison` | current, prior, directions | Compare current period metrics against prior period. |
| `BenchmarkAnalyticsService.check_climate_benchmark_compliance` | fund_waci, benchmark_waci, prior_waci, fossil_fuel_pct, controversial_weapons_pct | Check against EU Climate Benchmark Regulation: - CTB: 30% lower WACI than parent benchmark - PAB: 50% lower WACI + fossil fuel exclusions - Both require 7% annual decarbonisation trajectory |
| `BenchmarkAnalyticsService.generate_report` | fund, peers, current_metrics, prior_metrics, metric_directions, benchmark_waci, fossil_fuel_pct, controversial_weapons_pct | Generate comprehensive benchmark analytics report. |
| `BenchmarkAnalyticsService._rank_metric` | name, value, all_values, lower_is_better | Rank a single metric against a peer group. |

**Engine `benchmark_analytics` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `MANDATORY_PAI_INDICATORS` | `[{'id': 'PAI_1', 'name': 'GHG Emissions (Scope 1)', 'unit': 'tCO2e', 'direction': 'lower_is_better'}, {'id': 'PAI_2', 'name': 'GHG Emissions (Scope 2)', 'unit': 'tCO2e', 'direction': 'lower_is_better'}, {'id': 'PAI_3', 'name': 'GHG Emissions (Scope 3)', 'unit': 'tCO2e', 'direction': 'lower_is_better` |

### 2.3 Engine `esg_attribution_engine` (services/esg_attribution_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `PAIIndicator.delta` |  |  |
| `PAIIndicator.is_outperforming` |  |  |
| `ESGAttributionEngine.analyse` | inp | Run full ESG attribution and benchmark comparison. |
| `ESGAttributionEngine._brinson_fachler` | port, bench, metric_fn, metric_name, direction | Brinson-Fachler attribution by sector. For each sector s: Allocation = (w_p,s - w_b,s) * (M_b,s - M_b_total) Selection = w_b,s * (M_p,s - M_b,s) Interaction = (w_p,s - w_b,s) * (M_p,s - M_b,s) Total = Allocation + Selection + Interaction |
| `ESGAttributionEngine._aggregate_by_sector` | holdings, metric_fn | Aggregate holdings by sector: compute weight and weighted-average metric. |
| `ESGAttributionEngine._active_share` | port, bench | Active share = 0.5 * sum(/w_p - w_b/) using ISIN matching. |
| `ESGAttributionEngine._tracking_error_proxy` | port, bench | Simplified ex-ante TE: sqrt(sum(active_weight^2)) * vol_proxy. Real TE requires covariance matrix; this is a rough heuristic. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/attribution/pai-indicators** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['mandatory_pai_indicators'], 'n_keys': 1}`

**POST /api/v1/attribution/benchmark-report** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/attribution/esg-attribution** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `benchmark_analytics` — extracted transformation lines:**
```python
all_funds = [fund] + peers
abs_change = curr_val - prev_val
pct_change = (abs_change / prev_val * 100) if prev_val != 0 else 0.0
waci_reduction = (benchmark_waci - fund_waci) / benchmark_waci * 100
yoy_decarb = (prior_waci - fund_waci) / prior_waci * 100
rank = sorted_vals.index(value) + 1
percentile = (n - rank) / max(n - 1, 1) * 100
median = sorted_asc[n // 2] if n % 2 == 1 else (sorted_asc[n // 2 - 1] + sorted_asc[n // 2]) / 2.0
peer_mean=round(sum(all_values) / n, 4),
```

**Engine `esg_attribution_engine` — extracted transformation lines:**
```python
carbon_ir = carbon_excess / te if te > 0 else 0.0
esg_ir = esg_excess / te if te > 0 else 0.0
Allocation  = (w_p,s - w_b,s) * (M_b,s - M_b_total)
Selection   = w_b,s * (M_p,s - M_b,s)
Interaction = (w_p,s - w_b,s) * (M_p,s - M_b,s)
Total       = Allocation + Selection + Interaction
alloc = (pw - bw) / 100.0 * (bm - bench_total)
selec = bw / 100.0 * (pm - bm)
inter = (pw - bw) / 100.0 * (pm - bm)
total = alloc + selec + inter
active = port_total - bench_total
total_active_effect=round(total_alloc + total_selec + total_inter, 4),
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is written directly from
`backend/services/esg_attribution_engine.py`, `benchmark_analytics.py` and
`api/v1/routes/attribution_benchmark.py`. No guide↔code mismatch to report.)*

### 7.1 What the domain computes

Three endpoints over two deterministic engines:

| Endpoint | Engine | Output |
|---|---|---|
| `POST /esg-attribution` | `ESGAttributionEngine.analyse` | Brinson-Fachler decomposition of carbon/ESG/taxonomy gaps vs benchmark + active share, TE, information ratios, PAI comparison |
| `POST /benchmark-report` | `BenchmarkAnalyticsService.generate_report` | Peer rankings, period-over-period trends, EU CTB/PAB compliance check |
| `GET /pai-indicators` | reference list | the 18 SFDR Table 1 mandatory PAI indicators |

Both engines are **pure functions of caller-supplied holdings/peers** — no DB reads, no PRNG.

### 7.2 Parameterisation

- **`MANDATORY_PAI_INDICATORS` (18)** — SFDR RTS Annex I Table 1, correctly enumerated including
  the four often-missed final indicators: PAI-15 controversial weapons, PAI-16 sovereign GHG
  intensity, PAI-17 investee countries with social violations, PAI-18 real-estate fossil-fuel
  exposure. Each carries a `direction` (only PAI-14 board gender diversity is
  `higher_is_better`). Note units: PAI-4 carbon footprint is tCO₂e/**M**EUR invested — the
  Annex I convention (the frontend `sfdr-*` modules historically mislabelled this per $Bn; the
  backend list is the correct one.)
- **Brinson-Fachler formulas** (docstring-exact):
  `Allocation = (w_p,s − w_b,s)(M_b,s − M_b_total)` ·
  `Selection = w_b,s (M_p,s − M_b,s)` ·
  `Interaction = (w_p,s − w_b,s)(M_p,s − M_b,s)` — applied to three metrics: carbon intensity
  (lower better), ESG score and taxonomy-aligned % (higher better).
- **Active share** — `0.5 × Σ|w_p − w_b|` on ISIN-matched weights (100 % when no benchmark).
- **Tracking-error proxy** — `√Σ(sector active weight)² × 0.20 / 100`; the code comment is
  explicit that real TE needs a covariance matrix and this is "a rough heuristic" with a flat
  20 % vol proxy.
- **EU climate benchmark thresholds** (`check_climate_benchmark_compliance`):
  CTB ≥ 30 % WACI reduction vs parent; PAB ≥ 50 % reduction *plus* fossil-fuel exclusion
  (< 1 % exposure) *plus* controversial-weapons exclusion; both require ≥ 7 %/yr
  self-decarbonisation — the actual Level-2 requirements of the EU Benchmarks Regulation
  (Delegated Reg. 2020/1818).
- **Peer percentile** — `(N − rank)/(N − 1) × 100` where rank 1 = best per metric direction.

### 7.3 Calculation walkthrough

1. **Sector aggregation** — holdings roll up to sector weight and weighted-average metric
   (`Σ w·m / Σ w`); portfolio/benchmark totals are `Σ (w/100)·M_s`.
2. **Three attribution passes** — the same Brinson-Fachler kernel runs per metric; sector effects
   sum exactly to the active metric (`total_active_effect` is reported alongside `active_metric`
   as a reconciliation check). `is_outperforming` respects metric direction.
3. **Information ratios** — carbon IR uses `−(activeWACI)/TE` (sign-flipped so that a
   lower-carbon portfolio scores positive); ESG IR = active ESG / TE. These are *metric-unit*
   ratios, not return-based IRs.
4. **PAI comparison** — each supplied `PAIIndicator` computes `delta = port − bench` and an
   outperformance flag per direction; the result counts outperforming indicators out of the
   total supplied.
5. **YoY** — WACI and ESG percentage changes vs caller-supplied prior-period values (guarded
   for > 0).
6. **Benchmark report** — ranks the fund among peers on WACI (asc), ESG (desc), taxonomy (desc)
   and exclusion breaches (asc); builds period comparisons with `improved` per direction; runs
   the CTB/PAB check accumulating human-readable failure reasons (e.g. "YoY decarbonisation
   4.2 % < 7 % required"); overall peer percentile is the mean across metric percentiles.

### 7.4 Worked example (carbon attribution, two sectors)

Portfolio: Utilities 30 % @ WACI 400, Tech 70 % @ 50. Benchmark: Utilities 50 % @ 500, Tech 50 %
@ 60. Benchmark total = 0.5·500 + 0.5·60 = **280**; portfolio total = 0.3·400 + 0.7·50 = **155**.

| Sector | Allocation `(Δw)(M_b,s − 280)` | Selection `w_b(M_p,s − M_b,s)` | Interaction `(Δw)(ΔM)` | Total |
|---|---|---|---|---|
| Utilities | (−0.20)(500 − 280) = −44.0 | 0.50(400 − 500) = −50.0 | (−0.20)(−100) = +20.0 | −74.0 |
| Tech | (+0.20)(60 − 280) = −44.0 | 0.50(50 − 60) = −5.0 | (+0.20)(−10) = −2.0 | −51.0 |
| **Σ** | **−88.0** | **−55.0** | **+18.0** | **−125.0** |

Active WACI = 155 − 280 = **−125** ✓ (decomposition reconciles). Reading: −88 of the reduction
came from *underweighting* the high-carbon sector, −55 from *picking cleaner names within*
sectors. With TE proxy = √(0.20² + 0.20²)·0.20/100 ≈ 0.000566, carbon IR = 125/0.000566 ≈ 2.2×10⁵
— illustrating that the IR units are metric-per-TE, meaningful only for relative comparison.

### 7.5 Data provenance & limitations

- **No fabrication**: all numbers flow from request payloads; the only constants are the PAI
  list, the CTB/PAB thresholds, and the 20 % vol proxy.
- The TE proxy ignores correlations and single-name risk (sector-level only), making the
  information ratios scale-dependent; a production build would use a factor covariance model.
- Brinson-Fachler on *point-in-time* ESG/carbon levels attributes the current gap, not
  period *change* — there is no transaction/timing effect and no multi-period smoothing
  (Cariño/GRAP linking).
- CTB/PAB checking covers the headline quantitative screens; the full Delegated Regulation also
  requires activity-based exclusions (tobacco, UNGC violators), green/brown share ratios and
  equity-universe constraints not modelled here.
- Peer percentile uses `index()` on sorted values — ties resolve to the best rank among
  duplicates.

### 7.6 Framework alignment

- **Brinson, Hood & Beebower (1986) / Brinson-Fachler (1985)** — the engine implements the
  Fachler variant (allocation measured against the *total* benchmark metric, so overweighting an
  above-average sector scores negative for lower-is-better metrics), correctly cited in the
  docstring.
- **SFDR RTS Annex I** — the 18 mandatory Table 1 PAIs with correct directions/units; periodic
  benchmark comparison per RTS Art. 11 is the intended use of `PortfolioBenchmarkReport`.
- **EU Benchmarks Regulation (2016/1011 + Delegated Reg. 2020/1818)** — CTB/PAB minimum
  standards: 30 %/50 % carbon-intensity reduction vs the investable universe and a 7 % annual
  decarbonisation trajectory (derived from the IPCC 1.5 °C pathway), encoded verbatim.
- **TCFD Metrics & Targets** — WACI comparison and YoY decarbonisation tracking follow TCFD's
  recommended cross-industry metrics.
- **Active Share (Cremers & Petajisto 2009)** — standard `½ Σ|Δw|` on holdings overlap.

## 9 · Future Evolution

### 9.1 Evolution A — Covariance-based tracking error and multi-period attribution (analytics ladder: rung 1 → 3)

**What.** A clean tier-A domain: two deterministic engines implementing Brinson-Fachler ESG/carbon
attribution, active share, information ratios, the 18 SFDR Table-1 mandatory PAIs (correctly
enumerated, including the four often-missed PAI-15..18), and EU CTB/PAB compliance checks (30%/50%
WACI reduction + 7%/yr trajectory, verbatim from Delegated Reg. 2020/1818). No PRNG, no DB reads.
Its §7.5 limitations: the tracking-error proxy is `√Σ(sector active weight)² × 0.20` with a **flat
20% vol assumption and no correlations** (the code comment admits this is "a rough heuristic"),
making the information ratios scale-dependent; attribution is on *point-in-time* levels, not period
*change* (no timing/transaction effect, no Cariño/GRAP multi-period linking). Evolution A replaces
the TE proxy with a factor-covariance model and adds multi-period attribution linking.

**How.** `POST /esg-attribution` accepts an optional covariance/factor-model input so TE and the
carbon/ESG information ratios are risk-model-based, not a flat scalar; add a multi-period variant
that links single-period Brinson effects via Cariño smoothing. Rung 3: calibrate against realised
tracking error where return history is supplied. The Brinson-Fachler kernel (which already
reconciles exactly to active metric — §7.4 worked example sums to −125 ✓) is preserved.

**Prerequisites (hard).** Fix the lineage-harness failure — §4.2 shows `POST /benchmark-report`
**failed** and `/esg-attribution` **skipped**; outputs depend entirely on caller holdings, several
of which are synthetic-seeded frontend pages (§7.5) that need real data. **Acceptance:** the §7.4
carbon-attribution decomposition still reconciles to active WACI; information ratios become
scale-invariant under the covariance model; the currently-failing endpoints pass the harness.

### 9.2 Evolution B — Attribution analyst with tool-called decomposition (LLM tier 2)

**What.** A tool-calling analyst answering "decompose my portfolio's carbon gap vs benchmark"
(calls `/esg-attribution` → allocation/selection/interaction per sector), "am I a CTB or PAB?"
(calls `/benchmark-report` → EU climate-benchmark compliance with human-readable failure reasons
like "YoY decarbonisation 4.2% < 7% required"), and "how do I rank on PAIs vs peers?" — narrating
the engine's exact reconciling decomposition. The Fachler convention (overweighting an
above-average sector scores negative for lower-is-better metrics) is subtle and error-prone for
humans to explain; the copilot grounds every attribution claim in the engine output.

**How.** Tool schemas over the 3 endpoints; the `/pai-indicators` reference (18 SFDR PAIs with
correct directions/units — the backend list is authoritative where frontend `sfdr-*` modules
historically mislabelled PAI-4's per-MEUR unit) is ideal RAG grounding. The no-fabrication
validator checks every bps, percentile and reduction figure against tool output; the copilot
explains *why* a CTB/PAB check failed by surfacing the accumulated reason strings. Composable into
a Financial-desk orchestrator alongside the `am` engine.

**Prerequisites.** Evolution A's harness fixes (working endpoints for tool-calling); real caller
holdings; Atlas + PAI corpus embedded (roadmap D3). **Acceptance:** every attribution effect cited
reconciles to the active metric; a PAB-fail answer names the specific threshold breached; the PAI
count of outperforming indicators matches the engine's tally.