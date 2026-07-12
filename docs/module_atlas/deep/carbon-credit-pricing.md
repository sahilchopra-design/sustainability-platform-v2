## 7 · Methodology Deep Dive

The Carbon Credit Pricing Engine implements the multi-factor fair-value model its guide describes
(`FairPrice = Base × Vintage × Method × Verif × Perm × Liq`), and crucially anchors the base price to
**real Ecosystem Marketplace 2023 VCM prices**. The multiplier logic is transparent and defensible; the
per-credit *attributes* (vintage, liquidity, quality, BeZero/Sylvera rating) are synthetic, so §8
specifies how those inputs should be sourced in production.

### 7.1 What the module computes

For 40 credits, a chained multi-factor price:

```js
price = methodBase × vintageAdj × permFactor × liqFactor × regPrem × verPrem × qualAdj
```

where the base is a real methodology average (from `VCM_AVG_PRICES`) with small dispersion, and each
factor is a bounded multiplier:

```js
vintageAdj = 1 + (vintage − 2017) × 0.04      // ±4%/yr from a 2017 anchor
permFactor = 0.75 + permanence/100 × 0.50      // 0.75–1.25, rises with permanence
liqFactor  = 0.88 + liquidity × 0.24           // 0.88–1.12
regPrem    = {Verra 1.00, Gold Std 1.18, ACR 0.96, CAR 0.93, Puro.earth 1.22}
verPrem    = {SCS 1.00, DNV 1.12, Bureau Veritas 1.08, EY 1.15, Deloitte 1.10}
qualAdj    = 0.70 + qualityScore/100 × 0.60    // 0.70–1.30
```

### 7.2 Parameterisation / provenance

**Base prices** (`VCM_AVG_PRICES`, sourced from `sovereignMacroSeed → VCM_CREDIT_PRICES_2023` —
**real Ecosystem Marketplace 2023**, with hard-coded fallbacks):

| Method | Base $/tCO₂ | Method | Base $/tCO₂ |
|---|---|---|---|
| REDD+ | 10.2 | Biochar | 195.0 |
| ARR | 14.1 | DAC | 420.8 |
| IFM | 16.8 | Soil Carbon | 28.1 |
| Cookstove | 13.8 | Blue Carbon | 25.4 |
| Renewable Energy | 3.2 | Waste Gas | 8.4 |
| CCS/BECCS | 180.4 | Mineralization | 280.0 |

**Permanence tiers** (real, methodology-appropriate): Renewable/Cookstove = 100 (avoidance, no reversal);
DAC/CCS/Mineralization = 95–100 (geologic); REDD+/IFM = 20–50 (reversal-prone forest); Biochar = 90–98.
**Buffer pool %** likewise tiered (REDD+/IFM 10–25%, ARR/Blue 8–20%, else 3–10%) — matching Verra's
non-permanence buffer logic. **Registry/verifier premia** encode real market quality perceptions
(Gold Standard and Puro.earth trade at premia; ACR/CAR at slight discounts).

**Synthetic attributes** (`sr()`-seeded): vintage (2010–2024), liquidity (0.05–0.95), qualityScore
(30–100), sylveraScore (20–100), bidAsk, dailyVolume. `bezeroRating` is *derived* from qualityScore:
`BEZERO_RATINGS[min(7, floor((1 − quality/100)×8))]` — so a 90 quality → AAA/AA band. Eligibility flags
(CORSIA, SBTi, CBAM) are rule-based on method + quality.

### 7.3 Calculation walkthrough

Each credit draws a method → real base price + dispersion → vintage/permanence/liquidity/registry/verifier/
quality factors → chained product → rounded price. Portfolio views compute volume-weighted average price,
average liquidity/bid-ask, top-15 by price, and per-method/per-registry statistics. Vintage-decay and
forward-curve panels model price erosion with age and a spot→forward spread.

### 7.4 Worked example (one REDD+ credit)

`method = REDD+`, base ≈ 10.2 (+dispersion, say 10.5). `vintage = 2021` → `vintageAdj = 1 + (2021−2017)×
0.04 = 1.16`. `permanence = 35` → `permFactor = 0.75 + 0.35×0.50 = 0.925`. `liquidity = 0.4` →
`liqFactor = 0.88 + 0.4×0.24 = 0.976`. `registry = Verra` → `regPrem = 1.00`. `verifier = DNV` →
`verPrem = 1.12`. `qualityScore = 68` → `qualAdj = 0.70 + 0.68×0.60 = 1.108`.

```
price = 10.5 × 1.16 × 0.925 × 0.976 × 1.00 × 1.12 × 1.108
      = 10.5 × 1.16 = 12.18 → ×0.925 = 11.27 → ×0.976 = 11.00 → ×1.12 = 12.32 → ×1.108 = $13.65/tCO₂
```

The low permanence (35 → 0.925) and mid quality (68 → 1.108) roughly offset; the DNV verifier premium and
recent vintage push the price above the ~$10 REDD+ base — a plausible fair value.

### 7.5 Data provenance & limitations

- **Base prices are real** (Ecosystem Marketplace 2023); registry/verifier premia and permanence/buffer
  tiers are realistic market conventions.
- **Per-credit attributes are synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`) — vintage, liquidity, and
  especially the quality/BeZero/Sylvera scores are generated, not sourced from the rating agencies.
- The factor model is multiplicative and static — no supply/demand equilibrium, no term structure beyond
  a linear vintage decay, no correlation between factors (e.g. high-permanence removals are also low
  liquidity in reality; here the factors are independent draws).

**Framework alignment:** ICVCM Core Carbon Principles — the quality dimension; ICVCM assesses CCP-eligibility
at the *program* and *methodology-category* level against 10 principles (additionality, permanence, robust
quantification, no double counting, independent verification…), which the `qualityScore`/permanence/buffer
fields approximate · BeZero & Sylvera — independent carbon-rating agencies whose letter (BeZero AAA–D) and
0–100 (Sylvera) scales the module reproduces, deriving BeZero from its own quality proxy · CORSIA / SBTi /
CBAM — eligibility gates applied by methodology and quality threshold · Verra buffer-pool mechanism — the
non-permanence buffer % by methodology. See §8 for the production fair-value model.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The factor structure is sound but its quality/
rating inputs are synthetic; this specifies a fair-value model with real inputs.

### 8.1 Purpose & scope
Produce a fair-value price and confidence interval per VCM credit and per project archetype, for buyers,
traders, and portfolio marks, decomposing price into methodology base, quality, permanence, vintage, and
liquidity components with sourced inputs.

### 8.2 Conceptual approach
Hedonic multi-factor pricing (as in real-estate and credit-rating pricing) calibrated on transacted VCM
prices, benchmarked against Ecosystem Marketplace/AlliedOffsets transaction data and BeZero/Sylvera rating-
to-price relationships. A cross-sectional regression estimates factor coefficients from observed trades
rather than assuming multiplier ranges.

### 8.3 Mathematical specification

```
ln P_i = β0 + β1·ln Base_method + β2·Quality_i + β3·Permanence_i + β4·(Vintage_age_i)
             + β5·Liquidity_i + β6·Registry_i + β7·Verifier_i + ε_i
FairPrice_i = exp( X_i β̂ )                          fitted value
CI_95       = exp( X_i β̂ ± 1.96·se_pred )           prediction interval
QualityScore_i = f(BeZero_rating, Sylvera_score, ICVCM_CCP_flag, additionality, over-crediting risk)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Factor coefficients | β | OLS on Ecosystem Marketplace / AlliedOffsets transactions |
| Base by method | Base | Ecosystem Marketplace 2023 (already in seed) |
| Quality score | Quality | BeZero (AAA–D) + Sylvera (0–100) + ICVCM CCP |
| Permanence / buffer | — | Verra/GS methodology buffer tables |
| Registry/verifier | — | dummy-coded, estimated premia |

### 8.4 Data requirements
Transacted prices with credit attributes (method, vintage, registry, verifier, geography), BeZero &
Sylvera ratings (licensed), ICVCM CCP-eligibility flags, buffer %. Platform already holds real base prices,
registry/verifier premia, permanence tiers; missing: transaction panel and licensed rating feeds.

### 8.5 Validation & benchmarking plan
Out-of-sample R²/RMSE on held-out trades; residual analysis by method and vintage. Reconcile fitted prices
against BeZero/Sylvera implied ranges and AlliedOffsets marks. Backtest fair-value vs realised transaction
prices over rolling windows.

### 8.6 Limitations & model risk
VCM is thin and heterogeneous — coefficient stability is the main risk, especially for high-price removals
(DAC/biochar) with few trades; widen prediction intervals and flag low-liquidity archetypes. Ratings can
move sharply on integrity news (e.g. REDD+ over-crediting studies), so quality inputs must be timestamped
and the model re-estimated frequently.
