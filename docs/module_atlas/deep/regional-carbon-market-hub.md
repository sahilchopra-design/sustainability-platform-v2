## 7 · Methodology Deep Dive

### 7.1 What the module computes

Unlike most modules in this batch, the three-market dataset (EU ETS, India CCTS, Japan GX-ETS) is
**curated, named-source market data** — real prices, caps, sector coverage, and reform timelines —
not `sr()`-seeded fabrication. The module's own calculations on top of that data are thin (spread/
revenue arithmetic) and contain two identifiable arithmetic defects (§7.4).

```js
arbitrageSpread  = dst.price2025 - src.price2025          // naive price difference
arbitrageRevenue = arbitrageSpread × carbonQty             // $ revenue for a hypothetical arbitrage trade
cbamCostUsdM     = carbonPrice × exportVolumeMt × 1000 × co2IntensityT / 1e6   // (4 of 5 rows)
```

### 7.2 Parameterisation — the 3-market dataset

| Market | 2025 price | Currency shown | Cap (Mt) | Free allocation | Mechanism |
|---|---|---|---|---|---|
| EU ETS | €68 | EUR | 1,290 | 43% (declining) | Absolute cap-and-trade, LRF −4.3%/yr, CBAM 2026 |
| India CCTS | $9 (est.) | USD | n/a (PAT-sector based) | intensity benchmark | Intensity-based PAT → CCTS (EC Amendment Act 2022) |
| Japan GX-ETS | $12 | USD (J-Credit) | 600 | 100% (phasing out 2026) | Voluntary GX League → mandatory GX-ETS 2026 |

Price histories (2019–2025) and forward curves (2025–2030) are hand-entered per market, plausible
against real published trajectories (EU EUA ~€25 in 2019/2020 rising to ~€80 in 2022 then settling
~€60-70 — matches known EU ETS price history direction and rough magnitude).

### 7.3 Calculation walkthrough

1. **Market Overview tab**: 5 static KPI cards (hardcoded, not derived from `MARKETS` object,
   e.g. "€68/t" is typed directly rather than read from `MARKETS.eu.price2025`) plus the combined
   3-market price-history and forward-curve line charts (straight zip of each market's own arrays
   by year index).
2. **Cross-Market Compare tab**: `CROSS_MARKET_COMPARE`, a static 8-row table (current price,
   2030 forecast, coverage, mechanism type, free allocation, offset eligibility, CBAM exposure
   direction, Article 6 status) — all hand-curated text/numbers, no computation.
3. **India PAT/CCTS Sectors tab**: `INDIA_PAT_SECTORS`, 6 static rows with `overachieve =
   achieved2024 − targetMtoe` pre-computed as a stored field (not live-calculated) — Iron & Steel
   shows `overachieve: -0.14` (missed target, `escertEarned: 0`), correctly reflecting that
   under-target sectors earn zero Energy Saving Certificates under India's PAT scheme logic.
4. **CBAM Exposure (India) tab**: `CBAM_EXPOSURE`, 5 sector rows each with a **pre-computed
   `cbamCostUsdM` field baked directly into the array literal** — see §7.4 for the arithmetic
   defects found in this field.
5. **JCM Corridors tab**: `JCM_CORRIDORS`, 4 static bilateral offset corridors (India→Japan,
   India→EU, India→Korea, India→Singapore) with ITMO price ranges and 2025 volumes — descriptive.
6. **Price Convergence tab**: `combinedPriceHistory`/`combinedForward` — simple year-index zip of
   the three markets' own series (no convergence *test* is computed — e.g. no cointegration or
   spread-stationarity check, despite the tab's name).
7. **Arbitrage Snapshot tab**: user selects source/destination market and a notional
   `carbonQty`; `arbitrageSpread = dst.price2025 − src.price2025` and `arbitrageRevenue =
   spread × carbonQty` — see §7.4 for the currency-mismatch issue.

### 7.4 Identified calculation defects

**(a) CBAM cost formula — three latent bugs in the hardcoded `CBAM_EXPOSURE` array:**

```js
// Steel row (as coded):
cbamCostUsdM: 2024 * 2.4 * 1000 * 1.85 / 1e9
// Aluminium/Cement/Fertiliser/Solar rows (as coded):
cbamCostUsdM: 68 * exportToEU_Mt * 1000 * co2IntensityT / 1e6
```

- The **Steel row uses the literal `2024`** (apparently a stray reference to the compliance year)
  **instead of the €68 carbon price** used in every other row, and divides by `1e9` instead of
  `1e6` — two independent typos compounding into a wildly different (and wrong) result.
- Even the "correct-pattern" rows (Aluminium etc.) have a **unit-conversion bug**: `exportToEU_Mt`
  is in *million* tonnes, so converting to tonnes requires `×1e6`, not `×1000`. The coded formula
  `price × Mt × 1000 × intensity / 1e6` simplifies to `price × Mt × intensity / 1000` — **1,000×
  too small**.
- Correct formula: `cbamCostUsdM = carbonPrice($/t) × (exportToEU_Mt × 1e6 t) × co2IntensityT(t/t)
  / 1e6($M) = carbonPrice × exportToEU_Mt × co2IntensityT`. For the Aluminium row:
  `68 × 0.8 × 8.20 = **$446.1M**`, not the `68×0.8×1000×8.20/1e6 = $0.446M` the code actually
  produces — again **1,000× understated**.
- For Steel with the correct formula and the intended €68 price: `68 × 2.4 × 1.85 = **$302.0M**`
  — the code's actual output (`2024×2.4×1000×1.85/1e9 ≈ $0.0090M`) is off by a factor of roughly
  **33,500×**.

**(b) Currency mismatch in arbitrage calculation:** the Market Overview KPI cards display EU ETS
in **€** and India CCTS/Japan J-Credit in **$**, but `arbitrageSpread = dst.price2025 −
src.price2025` subtracts these `price2025` numeric fields directly with no FX conversion — an
EU↔India or EU↔Japan arbitrage calculation silently mixes EUR and USD as if they were the same
currency, overstating or understating the true USD-equivalent spread by whatever the EUR/USD rate
is (~1.05–1.10 in recent periods, i.e. a ~5-10% distortion, though the deeper problem is that the
formula treats the two numbers as directly comparable at all).

### 7.5 Worked example — corrected CBAM cost (Aluminium)

| Step | Formula | Result |
|---|---|---|
| Export volume | 0.8 Mt = 800,000 t | — |
| CO2 intensity | 8.20 tCO2/t | — |
| EU carbon price | €68/tCO2 | — |
| **Correct CBAM cost** | `68 × 800,000 × 8.20 / 1e6` | **$446.1M** |
| **Code's actual output** | `68 × 0.8 × 1000 × 8.20 / 1e6` | **$0.446M** (1,000× too low) |

### 7.6 Companion analytics

Market Overview, EU ETS/India CCTS/Japan GX-ETS deep dives (static profile pages per market),
Cross-Market Compare, India PAT/CCTS Sectors, CBAM Exposure, JCM Corridors, Price Convergence,
Arbitrage Snapshot, plus shared `Apr2026CarbonAnalytics`/`IndiaAdvancedAnalytics`/
`IndiaGreenHybridFinance` components (external to this file, not reviewed here).

### 7.7 Data provenance & limitations

- **Market profile data (prices, caps, sector coverage, reform timelines) is curated**, not
  `sr()`-seeded — directionally consistent with known EU ETS/India CCTS/Japan GX-ETS market facts,
  though this deep dive cannot independently verify every figure's currency (spot check the price
  history shape against ICAP/World Bank published series before using in any external report).
- **The CBAM cost figures are materially wrong** (§7.4) — any dashboard number pulled from the
  `CBAM Exposure (India)` tab should not be used for decision-making until the `×1000` vs `×1e6`
  unit bug and the Steel-row `2024`/`1e9` typo are both fixed.
- **The arbitrage spread mixes EUR and India/Japan USD-denominated prices without FX conversion**
  — any cross-market EU arbitrage figure from this tab needs a currency correction before use.
- `overachieve`/`escertEarned`/`ccertEarned` in the PAT sectors table are hand-entered, not derived
  from `achieved2024 − targetMtoe` live in the code (though the stored values are internally
  consistent with that formula where checked).

**Framework alignment:** ICAP Emissions Trading Worldwide — market classification (cap-and-trade
vs intensity-based vs voluntary→mandatory) is correctly represented · EU CBAM Regulation
(2023/956) — sector coverage (Steel, Aluminium, Cement, Fertilisers, and, from 2026, downstream
goods like solar panel components) is correctly named, but the actual CBAM certificate cost
calculation is broken (§7.4) · India Energy Conservation (Amendment) Act 2022 / PAT Scheme — the
target-vs-achieved / ESCert-vs-CCert distinction is correctly modelled structurally · UNFCCC
Article 6.2 (ITMOs) — JCM/bilateral corridor framing matches the real mechanism (India as NDC
surplus seller, Japan as JCM host buyer).
