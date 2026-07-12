## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is grounded solely in
`backend/services/fund_structure_engine.py` and `backend/api/v1/routes/fund_management.py`.)*

### 7.1 What the domain computes

`FundStructureEngine.analyse_fund` takes a full fund definition (fund → share classes → holdings
→ benchmark holdings → LP investors) via `POST /api/v1/fund-management/analyse` and returns one
`FundAnalyticsResult` spanning five metric families:

```
NAV        = Σ nav_per_share × total_shares       (over share classes)
AUM        = fund.aum, falling back to NAV
WACI       = Σ (wᵢ/100) × carbon_intensityᵢ            [tCO₂e/M€ revenue]
FinancedE  = Σ (wᵢ/100) × CIᵢ × AUM / 10⁶
CarbonFP   = FinancedE / AUM × 10⁶                     (= WACI numerically, see §7.6)
ESG score  = Σ (wᵢ/100) × esg_scoreᵢ ;   Taxonomy% = Σ (wᵢ/100) × alignedᵢ
Sustainable% = Σ wᵢ where (esg ≥ 50 AND dnsh_compliant);  DNSH% = Σ wᵢ where dnsh
ActiveShare  = min(100, ½ Σ_ISIN ‖w_p − w_b‖)          (100 if no benchmark)
TE_est       = √(Σ_sector (w_p − w_b)²) × 0.20 / 100   (sector active weights × 20% vol proxy)
DPI = distributed / called ;  TVPI = (distributed + NAV_share) / called
```

Plus: asset-class breakdown, top-10 concentration, per-sector allocation with portfolio-vs-
benchmark carbon intensity, exclusion-breach listing, WACI/ESG deltas vs benchmark.
`GET /sfdr-summary` returns static SFDR Article 6/8/8+/9 reference descriptions and the six ESG
strategy labels (exclusion, best-in-class, integration, impact, engagement, thematic).

### 7.2 Parameterisation / thresholds

| Constant | Value | Provenance |
|---|---|---|
| Weight-normalisation tolerance | renormalise to 100% if `abs(Σw − 100) > 0.1` | code guard |
| Sustainable-investment test | `esg_score ≥ 50 AND dnsh_compliant` | synthetic proxy for the SFDR Art 2(17) test |
| Tracking-error vol proxy | 20% annualised, applied to √Σ(sector active wt²) | code comment: "rough proxy… real TE needs covariance matrix" |
| Active-share fallback | 100% when no benchmark supplied | code |
| Top-N concentration | top 10 holdings by weight | code |

There are no seeded datasets — every number comes from the request payload.

### 7.3 Calculation walkthrough

1. **Normalisation:** raw holding weights renormalised to 100% (in place) if they miss by > 0.1pp.
2. **NAV/AUM:** NAV summed from share classes; `AUM = fund.aum or NAV` — the carbon block uses AUM.
3. **Carbon:** WACI is TCFD-style revenue-intensity weighting. Financed emissions multiply that
   same intensity by AUM/10⁶ (i.e. treating €AUM×CI/M€ as tonnes) and carbon footprint divides
   straight back — see §7.6.
4. **Benchmark deltas:** benchmark WACI/ESG computed identically over `benchmark_holdings`;
   `waci_vs_benchmark = (WACI − WACI_b)/WACI_b × 100` (negative = greener than benchmark).
5. **Active share:** ISIN-keyed weight maps (holdings without ISIN are ignored on both sides),
   Cremers–Petajisto formula ½Σ|Δw|, capped at 100.
6. **LP waterfall summary:** commitment/called/distributed sums plus DPI and TVPI multiples
   (division guarded when called = 0).

### 7.4 Worked example — two-holding Art 8 fund

AUM €200M; holdings: H1 60% / CI 300 / ESG 70 / aligned 40% / DNSH ✓; H2 40% / CI 100 / ESG 40 /
aligned 10% / DNSH ✓. Benchmark: same two ISINs at 50/50 with CI 320/120.

| Metric | Computation | Result |
|---|---|---|
| WACI | 0.6×300 + 0.4×100 | **220 tCO₂e/M€** |
| Financed emissions | (0.6×300 + 0.4×100) × 200M/10⁶ | 44,000 t |
| Carbon footprint | 44,000 / 200M × 10⁶ | 220 (≡ WACI) |
| ESG score / Taxonomy | 0.6×70+0.4×40 / 0.6×40+0.4×10 | 58.0 / 28.0% |
| Sustainable % | only H1 passes esg ≥ 50 | 60.0% |
| Benchmark WACI / vs | 0.5×320+0.5×120 = 220 / (220−220)/220 | 220 / 0.0% |
| Active share | ½(‖60−50‖+‖40−50‖) | **10.0%** |
| TE estimate (same sector) | √((100−100)²)×0.2/100 | 0.0 |

DPI/TVPI: investors called €80M, distributed €20M, NAV share €90M → DPI 0.25, TVPI 1.375.

### 7.5 Companion outputs

- **Sector allocation table:** per-sector portfolio/benchmark weights, active weight, and
  weight-averaged carbon intensity on each side — the input for brown/green sector-tilt analysis.
- **Exclusion compliance:** any holding flagged `exclusion_flag` is listed with its reason;
  `exclusion_breach_count` is a headline KPI (the engine does not itself decide *what* is
  excluded — flags arrive set from the caller's screening policy).

### 7.6 Data provenance & limitations

- No synthetic PRNG; deterministic transformation of caller data. SFDR reference text is static
  editorial content.
- **Carbon footprint ≡ WACI by construction:** `carbon_fp = (Σw·CI·AUM/10⁶)/AUM×10⁶ = Σw·CI`.
  The TCFD/SFDR *carbon footprint* metric is defined as ownership-share financed emissions per
  €M **invested** (via value/EVIC attribution), which is a different quantity from
  revenue-intensity WACI. As coded, the two KPIs will always print the same number — a
  methodological simplification consumers should know.
- Financed emissions likewise use revenue intensity × AUM rather than PCAF EVIC attribution.
- "Sustainable investment %" (esg ≥ 50 + DNSH) is a coarse stand-in for the SFDR Art 2(17)
  three-part test (contribution + DNSH + good governance).
- Tracking error is a sector-active-weight proxy with a flat 20% vol and no correlations —
  admitted in the docstring; treat as indicative only.
- Active share silently drops ISIN-less holdings; a fund of unlabelled positions scores as fully
  overlapping only via the benchmark-missing fallback.
- LP DPI/TVPI are portfolio-level sums; there is no waterfall tiering (pref return, catch-up,
  carry) despite the module header naming "LP waterfall".

### 7.7 Framework alignment

- **SFDR (Reg. 2019/2088) + RTS Annex II/IV** — Article 6/8/8+/9 classification reference and
  the periodic-report metric set (taxonomy %, sustainable investment %) that `analyse_fund`
  approximates; the real Art 2(17) sustainable-investment definition requires contribution to an
  E/S objective, DNSH, and good governance — here proxied by score ≥ 50 + DNSH flag.
- **TCFD / ISSB metrics guidance** — WACI is implemented exactly per the TCFD annex formula
  (Σ portfolio-weight × issuer revenue carbon intensity).
- **EU Taxonomy Art 5–8** — weighted taxonomy-alignment % is the fund-level KPI those articles
  require in pre-contractual and periodic disclosures.
- **GIPS / Cremers–Petajisto** — active share follows the standard ½Σ|Δw| definition; tracking
  error deviates from GIPS-grade ex-post TE (needs return covariance) and is labelled an estimate.
- **INREV NAV Guidelines** — NAV aggregation across share classes echoes fund-level NAV
  reporting; no INREV-specific adjustments (deferred tax, set-up cost amortisation) are made.
