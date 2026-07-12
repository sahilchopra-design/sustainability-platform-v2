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
