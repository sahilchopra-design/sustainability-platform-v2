## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry (EP-EB1) claims an *MRV compliance
> scoring* engine — `MRV Score = 0.3×Monitoring + 0.3×Reporting + 0.25×Verification +
> 0.15×Additionality` with Verra/GS/ACR methodology compliance inputs. **That formula does not
> appear anywhere in the code.** The page actually implements a broader and different toolkit:
> an interactive **ICVCM CCP weighted scorer** (10 principles, user sliders), a **three-agency
> composite rating** (Sylvera/BeZero/Calyx), **vintage discounting**, **buffer-adjusted volume**,
> a **Monte Carlo credit-revenue NPV** engine, portfolio quality aggregation, plus reference
> tables (VCMI tiers, A6.4 methodologies, MRV technology stack, forward curve with implied vol,
> correlation matrix). Sections below document the code as written.

### 7.1 What the module computes

```
ICVCM score      = Σᵢ scoreᵢ·weightᵢ / Σᵢ 100·weightᵢ × 100        // 10 sliders, default = benchmark
Composite rating = 0.4·num(Sylvera) + 0.4·num(BeZero) + 0.2·num(Calyx)
                   num: AAA=7 AA=6 A=5 BBB=4 BB=3 B=2 C=1 D=0; Calyx A=5 B=3.5 C=2 D=1 E=0
                   ≥5.5 'Investment Grade' · ≥3.5 'Acceptable' · ≥2 'Marginal' · else 'Avoid'
VintageDiscount  = ≤2019: 45% · ≤2022: 30% · ≤2024: 12% · newer: 0%
BufferNetVolume  = volume × (1 − buffer%/100)
MC NPV (1,000 sims): yearPrice_y = P₀·(1 + 0.05(y−1))·(1 + N(0, σ)) ;
                   PV = Σ_y volume·max(0,yearPrice_y)/(1+r)^y  → report P10/P50/P90/mean
Portfolio        : volume-weighted price; CCP/CORSIA/durable % by user weights; avg buffer
```

`N(0,σ)` is an Irwin–Hall sum-of-12-uniforms normal approximation using **`Math.random()`**
(non-seeded — MC results change every render), unlike the seeded `sr()` used for the MRV
satellite time series.

### 7.2 Parameterisation

| Block | Values | Provenance |
|---|---|---|
| ICVCM CCP weights | Gov: 10/8/8/9 · Impact: 12/10/12/10 · SD: 8/13 (sum 100) | **Synthetic** — ICVCM publishes 10 CCPs but no numeric weights; benchmarks 70–90 also synthetic |
| VCMI tiers | Silver/Gold/Platinum with `discount` 0/15/30 | Tier names & claim ladder real (VCMI Claims Code); the % "discount" is a module invention |
| Ratings agencies table | Sylvera 6,200 proj · BeZero 4,800 · Calyx 3,200 · Renoster · "S&P TruCost VCM" | Coverage counts and `pricingBps` are illustrative; agencies real (S&P entry speculative) |
| `PROJECT_PORTFOLIO` 9 rows | India-focused book: NTPC solar 1.2 MtCO₂e @$18 … Hyderabad DAC 10 kt @$580 | Synthetic but internally consistent (durable CDR priced 30–60× avoidance) |
| Vintage discounts 45/30/12/0% | — | Synthetic; directionally matches observed older-vintage discounts |
| `VINTAGE_DURABILITY` price matrix | <100yr NbS $3→$12; durable CDR $180→$480 across vintages | Synthetic; ordering consistent with CDR.fyi / Ecosystem Marketplace patterns |
| `BUFFER_DEFAULTS` | ARR tropical 18%, REDD project 25%, mangrove 30%, DAC 1% | Mirrors Verra AFOLU risk-tool magnitudes (10–40% NbS; minimal engineered) |
| MC defaults | vol 500k t/yr, P₀ $18, σ 35%, 7 yrs, disc 10%, +5%/yr drift | Synthetic demo values |
| Forward curve + IV | EUA spot 72 (IV 28%) → 10Y 125 (38%); VCS 9 (62%) | Static seeds; IV levels plausible vs EUA options history |

### 7.3 Calculation walkthrough

1. **CCP tab** — sliders (default = per-principle benchmark) → weighted score; with defaults the
   score is Σ(benchmark·w)/100 = 7,974/10,000 → **79.7/100**.
2. **Ratings tab** — per selected project, composite = 0.4/0.4/0.2 blend → label.
3. **Vintage/Buffer** — user buffer slider recomputes net sellable volume; vintage discount
   applied to displayed price.
4. **Monte Carlo** — 1,000 paths of 7-year revenue; sorted PV array indexed at 10/50/90th
   percentiles, reported in $M.
5. **Portfolio** — weight sliders (init 1/9 each) → weighted volume, price, CCP%, CORSIA%,
   durable%, avg buffer.

### 7.4 Worked example (composite rating + buffer, project IND-MNG-004)

Sundarbans Mangrove: `sylvera:'BBB', bezero:'BBB', calyx:'B', volume 180 ktCO₂e, buffer 35%`:

| Step | Computation | Result |
|---|---|---|
| Sylvera num | BBB → 4 | 4 |
| BeZero num | BBB → 4 | 4 |
| Calyx num | B → 3.5 | 3.5 |
| Composite | 0.4·4 + 0.4·4 + 0.2·3.5 | **3.90 → "Acceptable"** |
| Vintage discount | vintage 2024 → ≤2024 bucket | **12%** |
| Buffer-adjusted volume (portfolio default slider 20%) | 180,000 × (1−0.20) | **144,000 t** |
| At project's own 35% buffer | 180,000 × 0.65 | **117,000 t sellable** |

### 7.5 Data provenance & limitations

- Project book, prices, ratings, CCP benchmarks and the MRV satellite series are **synthetic**
  (the time series uses `sr(seed)=frac(sin(seed+1)×10⁴)`); the MC engine additionally uses
  non-seeded `Math.random()`, so NPV percentiles are non-reproducible run to run.
- The MC price process is arithmetic drift + i.i.d. normal shocks (can go negative before the
  `max(0,·)` floor; no mean reversion, no vol term structure) — adequate for illustration, not
  for pricing.
- ICVCM weights/VCMI discounts are inventions the UI presents with real framework names — the
  main integrity risk of this module.
- No backend integration despite mapped `carbon_calculator.py`/`methodology_engine.py`.

**Framework alignment:** ICVCM Core Carbon Principles — real assessment operates at *program*
level (CCP-Eligible) and *methodology category* level (CCP-Approved) through the ICVCM Expert
Panel, yielding a binary label, not a weighted 0–100 score · VCMI Claims Code — Silver/Gold/
Platinum claims scale with the share of remaining emissions retired in CCP-labelled credits
(module's tier table paraphrases this correctly; its numeric "discount" is invented) · Sylvera/
BeZero/Calyx rating scales rendered faithfully · Verra VCS AFOLU buffer mechanics (pooled buffer
account) reflected in `calcBufferAdjustedVolume` · Article 6.4 (PACM) methodology pipeline table
is a plausible forward-looking fiction (real A6.4 methodologies were still emerging as of 2025).

## 8 · Model Specification — Credit Portfolio Valuation under Integrity Risk

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** A production replacement for the MC NPV: value a carbon-credit
portfolio with integrity-linked haircuts (reversal, invalidation, rating migration) — the
quantity a treasury or procurement desk needs before committing offtake capital.

**8.2 Conceptual approach.** Risk-adjusted DCF with three stochastic layers, benchmarking
(i) Sylvera/BeZero rating-conditional delivery-risk practice, (ii) cat-model-style reversal
frequency–severity for NbS (Verra buffer logic made explicit), and (iii) commodity-desk OU price
dynamics as used for EUA curves in bank XVA/commodity models (Marquee/BarraOne style).

**8.3 Mathematical specification.**

```
Price      : dlnP = κ(ln P̄_t − lnP)dt + σ dW,  P̄_t = scenario ridge (NGFS or VCM analyst curve)
Delivery   : Q_y^eff = Q_y · d(rating) · (1 − L_reversal,y),  d(AAA…C) ∈ {0.98,0.95,0.90,0.80,0.65,0.50,0.30}
Reversal   : L_y ~ Bernoulli(p_type)·Sev,  p_type from buffer calibration: p ≈ buffer%/D_horizon
Invalidation: one-shot prob q_meth (methodology re-baselining, e.g. REDD+ VM0048 transition)
NPV        = E[ Σ_y (P_y·Q_y^eff − c_MRV·Q_y) / (1+r)^y ] − q_meth·PV(book)
Report     : P5/P50/P95, CVaR₉₅ of NPV; integrity-adjusted breakeven price
```

| Parameter | Calibration source |
|---|---|
| κ, σ per credit class | MLE on Platts/Viridios CORSIA & N-GEO price histories; EUA via ICE settlements |
| p_type, Sev | Verra buffer pool draw history (public registry documents); wildfire reversal literature |
| d(rating) delivery factors | Calibrate to BeZero rating vs issuance-shortfall studies; conservative defaults above |
| q_meth | Registry methodology-revision event frequency (Verra/GS public notices) |
| c_MRV | Module's own MRV_STACK cost tiers ($0.05–0.35/credit total) as starting point |

**8.4 Data requirements.** Portfolio positions (already the module's `PROJECT_PORTFOLIO` schema:
volume, price, ratings, buffer, vintage, type), price histories (vendor: Platts/Xpansiv;
free proxy: Ecosystem Marketplace annual medians — already among the platform's seed files),
registry buffer events. Backend home: extend `carbon_credit_quality_engine.py`.

**8.5 Validation & benchmarking.** Backtest delivery factors on 2019–2024 issuance vs forecast
for a public Verra cohort; MC convergence (P50 stable to <1% at 10k paths, seeded RNG);
reconcile P50 NPV against deterministic DCF with expected-value inputs; challenge pricing vs
observed CCP-labelled premium (~30–40% per Ecosystem Marketplace 2024).

**8.6 Limitations & model risk.** VCM price history is short and structurally broken (2022–23
integrity repricing) — regime-weight recent data; reversal probabilities for engineered CDR are
essentially priors; rating agencies disagree materially (use worst-of-two for conservatism);
correlation between price and invalidation events (both driven by integrity news) should be
stressed jointly, not independently.
