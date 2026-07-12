# Offset Portfolio Tracker
**Module ID:** `offset-portfolio-tracker` · **Route:** `/offset-portfolio-tracker` · **Tier:** B (frontend-computed) · **EP code:** EP-CN5 · **Sprint:** CN

## 1 · Overview
25 credit positions with mark-to-market valuation, retirement schedule, performance tracking, and compliance reporting.

**How an analyst works this module:**
- Portfolio Dashboard shows holdings with MTM values
- Retirement Schedule aligns retirements to emission targets
- Compliance Reporting generates SFDR/CSRD offset disclosure

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BENCHMARK_INDEX`, `BEZERO`, `COLORS`, `COUNTERPARTIES`, `COUNTRIES`, `HOLDINGS`, `METHOD_BENCHMARKS`, `OffsetPortfolioTrackerPage`, `PRICE_HISTORY`, `QUALITY_TIERS`, `REGIONS`, `REGISTRIES`, `RETIREMENT_SCHEDULE`, `SDGS`, `TABS`, `TRANSACTION_LOG`, `TYPES`, `VERIFIERS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `QUALITY_TIERS` | 5 | `min`, `max`, `description` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `font` | `"'DM Sans','SF Pro Display',system-ui,sans-serif";` |
| `TYPES` | `['REDD+','ARR','IFM','Cookstove','DAC','Biochar','Renewable','Blue Carbon','Soil','CCS','Peatland','Waste','Mineralization','Methane'];` |
| `typeIdx` | `Math.floor(sr(i * 3) * TYPES.length);` |
| `vintage` | `2015 + Math.floor(sr(i * 7 + 1) * 10);` |
| `tonnes` | `Math.round(1000 + sr(i * 11 + 2) * 49000);` |
| `costBasis` | `Math.round((baseMult + sr(i * 13 + 3) * baseMult * 0.4) * 100) / 100;` |
| `priceMove` | `1 + (sr(i * 17 + 4) - 0.4) * 0.3;` |
| `currentPrice` | `Math.round(costBasis * priceMove * 100) / 100;` |
| `retiredPct` | `sr(i * 19 + 5) * 0.6;` |
| `retired` | `Math.round(tonnes * retiredPct);` |
| `scheduledPct` | `sr(i * 23 + 6) * 0.4;` |
| `scheduledRetire` | `Math.round((tonnes - retired) * scheduledPct);` |
| `registry` | `REGISTRIES[Math.floor(sr(i * 29 + 7) * REGISTRIES.length)];` |
| `qualityScore` | `Math.round(40 + sr(i * 31 + 8) * 60);` |
| `bezIdx` | `Math.min(BEZERO.length - 1, Math.floor((100 - qualityScore) / 10));` |
| `bufferPct` | `Math.round(5 + sr(i * 37 + 9) * 25);` |
| `reversalRisk` | `Math.round((1 + sr(i * 41 + 10) * 30) * 10) / 10;` |
| `planned` | `Math.round(3000 + sr(i * 61 + 20) * 4000);` |
| `actual` | `Math.round(planned * (0.7 + sr(i * 67 + 21) * 0.5));` |
| `base` | `12 + sr(i * 71 + 30) * 3;` |
| `type` | `txTypes[Math.floor(sr(i * 83 + 50) * txTypes.length)];` |
| `hIdx` | `Math.floor(sr(i * 89 + 51) * HOLDINGS.length);` |
| `price` | `Math.round((h.currentPrice * (0.9 + sr(i * 101 + 53) * 0.2)) * 100) / 100;` |
| `METHOD_BENCHMARKS` | `TYPES.map((t, i) => ({` |
| `COUNTERPARTIES` | `['CompanyA', 'CompanyB', 'BrokerX', 'RegistryDirect', 'CarbonTrader', 'GreenCorp', 'EcoFund', 'NatCapital'].map((cp, i) => ({` |
| `totalTonnes` | `HOLDINGS.reduce((a, h) => a + h.tonnes, 0);` |
| `totalMTM` | `HOLDINGS.reduce((a, h) => a + h.mtm, 0);` |
| `totalCost` | `HOLDINGS.reduce((a, h) => a + h.costTotal, 0);` |
| `totalPnL` | `HOLDINGS.reduce((a, h) => a + h.pnl, 0);` |
| `totalRetired` | `HOLDINGS.reduce((a, h) => a + h.retired, 0);` |
| `totalScheduled` | `HOLDINGS.reduce((a, h) => a + h.scheduledRetire, 0);` |
| `wtdQuality` | `HOLDINGS.length ? HOLDINGS.reduce((a, h) => a + h.qualityScore * h.tonnes, 0) / totalTonnes : 0;` |
| `retireCoverage` | `totalTonnes > 0 ? ((totalRetired + totalScheduled) / totalTonnes * 100) : 0;` |
| `TABS` | `['Portfolio Dashboard', 'Holdings Deep-Dive', 'P&L Attribution', 'Vintage & Maturity', 'Retirement Tracker', 'Performance vs Benchmark', 'Quality & Risk', 'Geographic Exposure', 'Transaction Ledger', 'Compliance & Report` |
| `fmt` | `v => v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(0)}k` : `$${v.toFixed(0)}`;` |
| `fmtT` | `v => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}k` : `${v}`;` |
| `pct` | `(n, d) => d > 0 ? (n / d * 100).toFixed(1) : '0.0';` |
| `portReturn` | `i === 0 ? 0 : ((p.avgPrice - PRICE_HISTORY[i - 1].avgPrice) / PRICE_HISTORY[i - 1].avgPrice * 100);` |
| `benchReturn` | `i === 0 ? 0 : ((BENCHMARK_INDEX[i].index - BENCHMARK_INDEX[i - 1].index) / BENCHMARK_INDEX[i - 1].index * 100);` |
| `avg` | `(fn) => f.length ? f.reduce((a, h) => a + fn(h), 0) / f.length : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BEZERO`, `COLORS`, `COUNTERPARTIES`, `COUNTRIES`, `QUALITY_TIERS`, `REGISTRIES`, `SDGS`, `TABS`, `TYPES`, `VERIFIERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Positions | — | Portfolio | Across multiple credit types and vintages |
| Total MTM Value | — | Market pricing | Current portfolio market value |

## 5 · Intermediate Transformation Logic
**Methodology:** Portfolio mark-to-market
**Headline formula:** `MTM = Σ(holdings_i × current_price_i)`

Vintage distribution and retirement schedule aligned to corporate emission targets. SFDR/CSRD offset disclosure requirements tracked.

**Standards:** ['Market data', 'PCAF']
**Reference documents:** PCAF Standard; SFDR RTS; CSRD ESRS E1

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

25 synthetic carbon-credit holdings are generated across 14 offset types (`TYPES`), each carrying a
vintage, tonnage, cost basis, current price, retirement schedule, registry, quality score, and
buffer/reversal metadata, all seeded via `sr(i*k)`. The core portfolio-accounting formulas are
genuine mark-to-market mechanics:

```
MTM               = Σ holdings.tonnes_remaining × currentPrice
P&L               = Σ (currentPrice − costBasis) × tonnes
retireCoverage    = (totalRetired + totalScheduled) / totalTonnes × 100
wtdQuality        = Σ(qualityScore × tonnes) / totalTonnes
```

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `vintage` | 2015–2024 | Synthetic demo value |
| `tonnes` | 1,000–50,000 | Synthetic demo value |
| `costBasis` | type-dependent base × 0.6–1.4 | Synthetic demo value |
| `priceMove` | 1 + (sr−0.4)×0.3 → ~0.88–1.18× cost | Synthetic demo value (simulates mark-to-market drift) |
| `qualityScore` | 40–100 | Synthetic demo value, feeds a BeZero-style rating bucket via `bezIdx` lookup |
| `bufferPct` | 5–30% | Synthetic demo value |
| `reversalRisk` | 1–31% | Synthetic demo value |
| `registry` | Verra/Gold Standard/ACR/etc. (`REGISTRIES`) | Real registry names, randomly assigned per holding |

### 7.3 Calculation walkthrough

1. **Holdings generation**: each of 40 (HOLDINGS array size implied by `hIdx` lookups) synthetic
   positions gets type, vintage, tonnage, cost/current price, retirement split (`retired` +
   `scheduledRetire`), registry, quality score, and a BeZero-style quality bucket (`bezIdx`) derived
   from `(100 − qualityScore)/10`, i.e. lower quality maps to a worse rating tier.
2. **MTM & P&L**: `totalMTM`, `totalCost`, `totalPnL` sum straightforwardly across holdings; no
   discounting, no bid/offer spread — a spot mark, consistent with the guide's stated methodology
   (`MTM = Σ holdings_i × current_price_i`).
3. **Retirement coverage**: `(totalRetired+totalScheduled)/totalTonnes×100` — the SFDR/CSRD-facing
   metric the guide references; guarded by `Math.max(1, filtered.length)` patterns elsewhere in the
   file.
4. **Vintage & maturity / geographic exposure / benchmark vs performance**: `PRICE_HISTORY` and
   `BENCHMARK_INDEX` seed series drive period-over-period `portReturn`/`benchReturn` (simple
   percentage change), used in the "Performance vs Benchmark" tab.
5. **Method benchmarks & counterparties**: `METHOD_BENCHMARKS` (per credit type) and `COUNTERPARTIES`
   (8 named counterparties) are static seed tables joined onto holdings for exposure concentration
   views, not independently computed risk scores.

### 7.4 Worked example

Given a holding: `tonnes=20,000`, `costBasis=$8.40/t`, `currentPrice=$9.65/t`,
`retired=6,000t`, `scheduledRetire=3,500t`:

| Metric | Computation | Result |
|---|---|---|
| MTM | 20,000 × 9.65 | **$193,000** |
| Cost total | 20,000 × 8.40 | **$168,000** |
| P&L | 193,000 − 168,000 | **+$25,000 (+14.9%)** |
| Retirement coverage | (6,000+3,500)/20,000×100 | **47.5%** |

Portfolio-level `wtdQuality` weights each holding's `qualityScore` by tonnage, so large low-quality
positions pull the average down proportionally more than small ones — a correct capital-weighted
average, standard for carbon-credit desk reporting.

### 7.5 Quality tier rubric

| Tier | Score range | Source |
|---|---|---|
| `QUALITY_TIERS` (5 bands) | seed-defined score bands with descriptive labels | Seed table, not tied to any named rating agency's exact cutoffs (no BeZero/Sylvera/Calyx methodology reproduced) |

### 7.6 Data provenance & limitations

- **All 25+ holdings, prices, and quality scores are synthetic demo data** generated by `sr(seed)`;
  registry names are real (Verra, Gold Standard, ACR, CAR, Puro.earth) but assigned randomly, not
  pulled from a live registry API.
- No transaction-cost or bid/offer treatment in MTM; no forward curve for scheduled retirements
  (all valued at spot).
- The BeZero-style quality bucket (`bezIdx`) is a linear re-mapping of the synthetic `qualityScore`,
  not an independently-sourced third-party rating.
- Counterparty exposure concentration (8 named counterparties) has no credit-risk overlay (no PD/
  settlement-risk scoring on counterparties despite the "Compliance & Reporting" tab implying
  regulatory rigor).

**Framework alignment:** PCAF Standard is cited for Scope 3 Cat.15 offset disclosure context but is
not computed in this module (no financed-emissions attribution here — that lives in the PCAF
modules); SFDR/CSRD offset-disclosure alignment is represented only as the `retireCoverage` %
against corporate targets, a reasonable proxy for "committed vs retired" disclosure but not a full
SFDR RTS Annex I indicator.

## 9 · Future Evolution

### 9.1 Evolution A — Real holdings and mark-to-market prices (analytics ladder: rung 1 → 3)

**What.** §7 confirms the portfolio-accounting math is genuine: MTM (`Σ tonnes_remaining × currentPrice`), P&L (`Σ(currentPrice − costBasis) × tonnes`), retirement coverage, and tonnage-weighted quality are all correct mark-to-market mechanics. The gap is the data layer — all 25 holdings are `sr()`-seeded (vintage, tonnage, cost basis, `priceMove = 1 + (sr−0.4)×0.3`, quality score feeding a BeZero-style bucket), and `currentPrice` is simulated drift rather than a real quote. Real registry names are used but randomly assigned. Evolution A gives the correct engine real positions and prices.

**How.** (1) Persist actual holdings in a `carbon_credit_holdings` table (analyst-entered or imported), replacing the seeded 25-position generator — this also fixes the platform's random-as-data concern. (2) Mark to real prices: pull category-level VCM price indications (CDR.fyi, Xpansiv CBL settlement data, or Verra issuance-weighted medians) into a dated price reference, so `currentPrice` is a sourced quote not `costBasis × priceMove`. (3) Wire `qualityScore` to real BeZero/Sylvera ratings where available (the `BEZERO` bucket structure already exists) rather than a seeded 40–100 draw; keep the SFDR/CSRD offset-disclosure output (§1) but generate it from real holdings.

**Prerequisites.** A holdings-entry/import path; VCM price data (partially public — honest-null where a category has no quote); rating-provider data access (BeZero/Sylvera are subscription-gated — accept sparse coverage, label unrated). **Acceptance:** MTM/P&L compute over real entered holdings; prices trace to a dated market source; no `sr()` in holdings or prices; retirement coverage reflects real retirement schedule.

### 9.2 Evolution B — Carbon-book management copilot (LLM tier 2)

**What.** A copilot for the portfolio workflows §1 describes: "what's my book's mark-to-market and P&L?", "am I on track to retire enough credits for my 2030 target?", "what's my tonnage-weighted quality and which holdings drag it down?", "draft the CSRD E1 offset disclosure" — executed against the MTM engine over real holdings, with every figure a computed output.

**How.** Tool calls to portfolio-accounting endpoints wrapping the real MTM/P&L/coverage/quality functions; system prompt from this Atlas page's §5/§7.1 formulas and the PCAF/SFDR/ESRS E1 references named in §5. Retirement-target alignment is a coverage computation against the user's emission target; the CSRD disclosure draft templates ESRS E1 offset fields from real holdings with per-figure provenance, and the fabrication validator matches every tonne/dollar to a tool response. Mutating actions (recording a retirement) gate behind confirmation + RBAC per the roadmap's Tier-2 pattern.

**Prerequisites (hard).** Evolution A — a copilot reporting MTM/P&L over the current seeded holdings would present fictional portfolio values as real financials; the disclosure-drafting use especially cannot run on synthetic data. **Acceptance:** every MTM/P&L/quality figure traces to a tool call over real holdings; the CSRD draft cites real positions; retirement-coverage answers reflect the actual schedule.