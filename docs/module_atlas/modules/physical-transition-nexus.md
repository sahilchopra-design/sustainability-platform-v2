# Physical-Transition Nexus
**Module ID:** `physical-transition-nexus` · **Route:** `/physical-transition-nexus` · **Tier:** B (frontend-computed) · **EP code:** EP-CG1 · **Sprint:** CG

## 1 · Overview
Combined physical+transition CVaR with dynamic sector-specific correlation and 20 NGFS×SSP scenario combinations.

**How an analyst works this module:**
- Select NGFS scenario and SSP combination
- Integrated Risk Dashboard shows decomposition
- Double-Hit Stress Test applies worst-case simultaneous shocks
- Sector Interaction Matrix shows ρ by sector

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERTS`, `NGFS`, `SECTORS`, `SSP`, `TABS`, `WATCHLIST`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SECTORS` | 9 | `physScore`, `transScore`, `rho`, `cvarPhys`, `cvarTrans`, `weight` |
| `ALERTS` | 6 | `sector`, `msg`, `sev`, `ts` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Integrated Risk Dashboard','Physical-Transition Correlation','Compound Scenario Builder','Double-Hit Stress Test','Sector Interaction Matrix','Portfolio Risk Decomposition'];` |
| `SSP` | `['SSP1-2.6','SSP2-4.5','SSP3-7.0','SSP5-8.5'];` |
| `sectorData` | `useMemo(() => SECTORS.map(sec => {` |
| `rho` | `sec.rho * rhoAdj;` |
| `intCvar` | `sec.cvarTrans + sec.cvarPhys + rho * Math.sqrt(sec.cvarTrans * sec.cvarPhys);` |
| `lossM` | `intCvar / 100 * aum * 1000 * sec.weight / 100;` |
| `totalCvar` | `useMemo(() => { const w = sectorData.reduce((s, d) => s + d.weight * d.intCvar, 0) / 100;` |
| `radarData` | `sectorData.map(d => ({ sector: d.name, physical: d.physScore, transition: d.transScore, integrated: Math.min(100, d.intCvar * 6) }));` |
| `decompData` | `sectorData.map(d => ({ name: d.name, physical: d.cvarPhys * d.weight / 100, transition: d.cvarTrans * d.weight / 100, interaction: (d.intCvar - d.cvarPhys - d.cvarTrans) * d.weight / 100 }));` |
| `sum` | `d.physLoss + d.transLoss;` |
| `amp` | `sum > 0 ? (d.intLoss / sum).toFixed(2) : '-';` |
| `tot` | `d.physical + d.transition + d.interaction;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALERTS`, `NGFS`, `SECTORS`, `SSP`, `TABS`, `WATCHLIST`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Integrated CVaR | `Trans+Phys+ρ·Inter` | Model | Combined risk higher than sum of parts due to interaction |
| ρ Energy Sector | `Sector-specific` | ECB CST | Highest interaction between transition and physical risk |
| Scenario Combinations | `5 NGFS × 4 SSP` | Framework | Full matrix of transition × physical scenarios |

## 5 · Intermediate Transformation Logic
**Methodology:** Integrated CVaR with dynamic correlation
**Headline formula:** `IntCVaR = CVaR_trans + CVaR_phys + ρ_dynamic × √(CVaR_trans × CVaR_phys)`

ρ_dynamic varies by sector: Energy has highest interaction (0.35) as both transition policy and physical drought affect operations. Technology has lowest (0.08). Double-hit stress test applies simultaneous worst-case transition + physical scenarios.

**Standards:** ['NGFS', 'IPCC AR6', 'ECB CST']
**Reference documents:** NGFS Phase 5; IPCC AR6 WGI; ECB Climate Stress Test 2024

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Partial guide↔code note.** The guide and the page agree on the headline formula
> (`IntCVaR = CVaR_trans + CVaR_phys + ρ×√(CVaR_trans×CVaR_phys)`) and this **is** genuinely
> computed in code. What is **not** implemented is the page's own in-app claim that "ρ_dynamic
> [is] estimated via DCC-GARCH on physical hazard index vs carbon price returns" (tab 2 reference
> box). There is no GARCH model anywhere in the code — `ρ` is a static per-sector constant
> multiplied by a user-controlled slider. Treat the interaction-CVaR arithmetic as real; treat the
> "DCC-GARCH" attribution as descriptive flavour text, not implemented methodology.

### 7.1 What the module computes

For 8 sectors, each with a static `(physScore, transScore, ρ_base, cvarPhys, cvarTrans, weight)`
tuple, the page computes an **interaction-adjusted integrated CVaR**:

```js
ρ = ρ_base × rhoAdj                                    // rhoAdj: user slider, 0.5×–2.0×
intCVaR = cvarTrans + cvarPhys + ρ × √(cvarTrans × cvarPhys)
lossM = intCVaR/100 × AUM×1000 × sectorWeight/100       // $M loss at given AUM
totalCVaR = Σ(sectorWeight × intCVaR) / 100             // portfolio-level, weight-normalised
```

### 7.2 Parameterisation

| Sector | physScore | transScore | ρ_base | cvarPhys % | cvarTrans % | weight % |
|---|---|---|---|---|---|---|
| Oil & Gas | 72 | 88 | 0.65 | 4.2 | 8.1 | 12 |
| Utilities | 68 | 75 | 0.58 | 3.8 | 6.2 | 15 |
| Mining | 65 | 70 | 0.52 | 3.5 | 5.8 | 8 |
| Agriculture | 82 | 45 | 0.38 | 5.1 | 2.9 | 6 |
| Real Estate | 78 | 55 | 0.45 | 4.8 | 3.6 | 18 |
| Transport | 50 | 68 | 0.48 | 2.6 | 5.5 | 10 |
| Manufacturing | 58 | 62 | 0.42 | 3.1 | 4.8 | 20 |
| Technology | 30 | 25 | 0.22 | 1.2 | 1.5 | 11 |

All 8 rows are hard-coded constants (synthetic demo values labelled illustrative, not fitted to an
observed loss series), with the qualitative ordering (Energy highest ρ, Technology lowest) matching
plausible economic intuition — Energy sits at the intersection of transition policy exposure and
physical (drought/heat) exposure, so a genuinely high interaction coefficient is directionally
reasonable even though the specific value (0.65) is not empirically estimated.

### 7.3 Calculation walkthrough

1. User sets AUM ($1–50B slider) and correlation-adjustment multiplier (0.5×–2.0×).
2. Each sector's ρ scales linearly with the multiplier; `intCVaR` recomputes via the square-root
   interaction formula (this is the CVaR analogue of `Var(X+Y) = Var(X)+Var(Y)+2ρ·Cov`, applied to
   CVaR magnitudes rather than variances — a common practitioner approximation, not a rigorously
   derived CVaR additivity result).
3. `totalCVaR` = weight-blended sum across all 8 sectors.
4. **Double-hit stress test** (tab 4): 5 hard-coded scenario rows (Baseline → Tail Risk) each list a
   `physLoss`, `transLoss`, `intLoss` — the amplification factor `intLoss/(physLoss+transLoss)`
   ranges 1.0 (additive) to ~1.6× (Tail Risk), illustrating super-additive compounding.
5. **Portfolio decomposition** (tab 6) uses Euler-style attribution: `interaction_i = intCVaR_i -
   cvarPhys_i - cvarTrans_i`, weighted by sector weight — mathematically consistent with the §7.1
   formula (the interaction term is exactly the `ρ×√(...)` component).

### 7.4 Worked example

Oil & Gas at default settings (`rhoAdj=1.0`, AUM=$10B):
`ρ = 0.65`. `intCVaR = 8.1 + 4.2 + 0.65×√(8.1×4.2) = 12.3 + 0.65×5.836 = 12.3 + 3.79 = **16.09%**`.
`lossM = 16.09/100 × 10×1000 × 12/100 = 0.1609 × 10000 × 0.12 = **$193.1M**` expected sector loss
contribution at $10B total AUM.
Sum-of-parts (physLoss+transLoss) = 12.3%; amplification factor = 16.09/12.3 = **1.31×** — the
interaction term adds 31% on top of the additive baseline, driven entirely by the 0.65 correlation
assumption.

### 7.5 Scenario framework
20 combinations (5 NGFS scenarios × 4 SSP pathways) are selectable via header dropdowns; only NGFS
scenario index and SSP index feed the **illustrative** 6-year impact path chart (tab 3) via
arithmetic `physical = 1.2 + i×(ssp+1)×0.4`, `transition = 0.8 + i×(4-ngfs)×0.6` — these are linear
placeholder trajectories, not scenario-conditioned outputs of the sector CVaR table.

### 7.6 Data provenance & limitations

- **All sector CVaR/ρ/score constants are static synthetic values** — labelled "illustrative"
  throughout this deep dive; there is no live hazard-index or carbon-price return series behind them
  despite the DCC-GARCH claim in the UI reference box.
- Correlation-time-series chart (tab 2) uses `Math.sin`/`Math.cos` waveforms seeded by month index,
  not any statistical estimator.
- The √(CVaR_trans×CVaR_phys) interaction term is a standard risk-aggregation heuristic (analogous
  to portfolio variance combination) but has no published citation validating its applicability to
  CVaR magnitudes specifically — CVaR is not sub-additive in general, so this approximation should
  be flagged to model validation.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce a defensible sector-level integrated physical-transition CVaR for climate stress-testing
and capital allocation, replacing the current static 8-row constant table.

### 8.2 Conceptual approach
Estimate `ρ_sector` empirically via a **DCC-GARCH(1,1)** model (Engle 2002) on sector physical-hazard
index returns vs. sector carbon-price-exposure returns — matching the methodology the UI already
claims to use, and consistent with ECB's 2024 Climate Stress Test double-hit correlation approach
and Battiston et al. (2017) climate-financial network risk framework (2 named benchmarks). Feed
sector `cvarPhys`/`cvarTrans` from the platform's own hazard engine (physical) and a carbon-price ×
sector carbon-intensity pass-through model (transition), rather than hard-coded constants.

### 8.3 Mathematical specification
```
r_hazard,t = Δ(sector physical hazard index_t)
r_carbon,t = Δ(carbon price × sector carbon intensity)_t
DCC-GARCH: H_t = D_t R_t D_t,  R_t dynamically estimated (Engle 2002)
ρ_sector,t = R_t[hazard, carbon]
CVaR_phys,sector = 99%-CVaR of hazard-driven asset value shocks (Monte Carlo or historical sim)
CVaR_trans,sector = 99%-CVaR of carbon-price-driven margin/valuation shocks
IntCVaR = CVaR_trans + CVaR_phys + ρ_sector × √(CVaR_trans × CVaR_phys)
```
| Parameter | Source |
|---|---|
| Hazard index series | NGFS/IPCC AR6 downscaled hazard projections, or ND-GAIN time series |
| Carbon price series | EU ETS / EEX historical settlement (already used elsewhere on the platform) |
| Sector carbon intensity | CDP/EPA sector emission factors (already in `reference_data`) |
| GARCH parameters | Estimated via MLE on ≥5yr history; refit quarterly |

### 8.4 Data requirements
Historical hazard-index and carbon-price time series (5+ years, monthly); sector carbon-intensity
reference data (already ingested); a GARCH estimation library (e.g. `arch` in Python) on the
backend — none of this exists in the platform today for this module.

### 8.5 Validation & benchmarking plan
Backtest realised sector losses in known compound-shock periods (e.g. 2021-22 European energy
crisis) against model-implied IntCVaR; compare ρ_sector estimates against ECB CST 2024 published
double-hit correlation ranges; stability-test GARCH parameters across rolling windows.

### 8.6 Limitations & model risk
DCC-GARCH requires substantial clean time-series history that does not yet exist on the platform;
CVaR is not strictly sub-additive, so the √(CVaR_trans×CVaR_phys) interaction term should be
validated against a full joint-distribution Monte-Carlo CVaR estimate before use in binding capital
calculations, not treated as exact.

## Framework alignment

**NGFS Phase 5 scenarios** — named correctly as the scenario taxonomy (5 transition pathways); the
carbon-price-by-2050 figures shown per scenario ($250/$180/$200/$120/$30 per tCO₂) are directionally
consistent with published NGFS scenario narratives (orderly scenarios carry higher carbon prices
than Current Policies). **IPCC AR6 WGI** — cited for SSP radiative-forcing context, used only as
scenario labels (SSP1-2.6…SSP5-8.5), not as an input to the loss arithmetic. **ECB Climate Stress
Test 2024** — cited as the source of "double-hit" methodology framing; the 5 stress scenarios in
tab 4 are illustrative constants inspired by, not reproduced from, ECB's published double-hit
results.

## 9 · Future Evolution

### 9.1 Evolution A — Replace static ρ with a real DCC-GARCH estimate (analytics ladder: rung 2 → 4)

**What.** §7's partial note is nuanced: the headline integrated-CVaR formula (`IntCVaR = CVaR_trans + CVaR_phys + ρ×√(CVaR_trans×CVaR_phys)`) *is* genuinely computed, and the per-sector `(physScore, transScore, ρ_base, cvarPhys, cvarTrans, weight)` tuples produce a real weight-normalised portfolio CVaR. What is *not* implemented is the page's own in-app claim that ρ is "estimated via DCC-GARCH on physical hazard index vs carbon price returns" — ρ is actually a static per-sector constant times a user slider. So the interaction arithmetic is real; the DCC-GARCH attribution is false flavour text. Evolution A makes the claim true.

**How.** (1) Actually estimate ρ_dynamic via DCC-GARCH (or a defensible simpler dynamic-correlation model) on real time series: a physical-hazard index (from the digital-twin/NatCat data) versus carbon-price returns (NGFS/market data) per sector — the `arch`/statsmodels tooling supports DCC-GARCH; this turns ρ from a slider constant into an estimated, time-varying quantity, the rung-4 predictive step. (2) Ground the per-sector CVaR components (`cvarPhys`, `cvarTrans`) in the sibling physical and transition modules' real outputs rather than static tuples — the physical-risk-portfolio and transition modules already compute these. (3) The double-hit stress test (§1) then applies real simultaneous shocks, not a uniform scaling.

**Prerequisites.** Time series for the DCC-GARCH fit (hazard index + carbon-price returns per sector — the hard input); the CVaR arithmetic is correct, so this is a data/estimation upgrade; document the GARCH model per Atlas §8. **Acceptance:** ρ is estimated from real return series, not a slider constant, and the in-app DCC-GARCH claim becomes accurate; sector CVaRs trace to the physical/transition modules; the interaction CVaR reproduces the §5 formula.

### 9.2 Evolution B — Integrated-risk copilot with tool-called stress (LLM tier 2)

**What.** A copilot for the compound-risk workflow §1 describes: "what's my integrated physical+transition CVaR under NGFS Disorderly × SSP5-8.5?", "which sectors have the highest interaction risk and why?", "run the double-hit stress test" — executed against the IntCVaR engine, decomposing the integrated CVaR into its transition, physical, and interaction terms per sector.

**How.** Tool calls to endpoints wrapping the IntCVaR computation and the double-hit stress test; system prompt from this Atlas page's §5 formula and the NGFS / IPCC AR6 / ECB CST references named in §5. The sector-interaction explanation cites the real ρ (post-Evolution-A: estimated; today: the static per-sector constant — the copilot must say which). Scenario combinations (20 NGFS×SSP) are tool calls; the fabrication validator matches every CVaR/ρ/loss figure to a response. Critically, the copilot must not repeat the false DCC-GARCH claim until Evolution A makes it true — it should describe ρ honestly as a static per-sector constant times a user adjustment in the current state.

**Prerequisites.** Compute endpoints; the IntCVaR arithmetic works today, but the copilot must not narrate the DCC-GARCH attribution until Evolution A. **Acceptance:** every CVaR figure traces to a tool call; ρ is described accurately for the current implementation state (static, not GARCH-estimated, pre-Evolution-A); double-hit results come from the stress endpoint.