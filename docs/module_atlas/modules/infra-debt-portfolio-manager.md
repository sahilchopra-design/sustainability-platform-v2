# Infra Debt Portfolio Manager
**Module ID:** `infra-debt-portfolio-manager` · **Route:** `/infra-debt-portfolio-manager` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_SPREAD_IDS`, `BUCKET_SERIES`, `Badge`, `CLASS_COLOR`, `CURRENT_YEAR`, `DEFAULT_POSITIONS`, `FALLBACK_SERIES`, `Kpi`, `LETTER_COLOR`, `MIG_MATRIX`, `MIG_STATES`, `PD_TABLE`, `PD_TENORS`, `RATINGS`, `SCENARIO_COLOR`, `SECTORS`, `SECTOR_COLOR`, `SECTOR_TRANSITION`, `SENIORITIES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DEFAULT_POSITIONS` | 13 | `name`, `sector`, `country`, `rating`, `notionalM`, `couponPct`, `maturityYear`, `seniority`, `contractedPct`, `amortPct`, `intensity` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `RATINGS` | `['BBB+', 'BBB', 'BBB-', 'BB+', 'BB', 'BB-', 'B+', 'B'];` |
| `disc` | `cf / Math.pow(1 + y, t);` |
| `fmtM` | `(v) => ((v == null \|\| isNaN(v)) ? '—' : `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`);` |
| `fmtNum` | `(v, d = 1) => ((v == null \|\| isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: 0 }));` |
| `fmtBps` | `(v, d = 0) => ((v == null \|\| isNaN(v)) ? '—' : `${v >= 0 ? '+' : ''}${Number(v).toFixed(d)} bps`);` |
| `fmtT` | `(v) => ((v == null \|\| isNaN(v)) ? '—' : `${Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })} t`);` |
| `updatePosition` | `(id, key, value) => setPositions((prev) => prev.map((p) => (p.id === id ? { ...p, [key]: value } : p)));` |
| `lgd` | `Math.min(100, Math.max(0, parseFloat(lgdPct) \|\| 0)) / 100;` |
| `rows` | `valid.map((p) => {` |
| `ttm` | `Math.max(1, parseInt(p.maturityYear, 10) - CURRENT_YEAR);` |
| `pdClimate` | `pd * (1 + (score / 100) * (climateMult - 1));` |
| `elClimate` | `(pdClimate / 100) * lgd * notional;` |
| `totalNotional` | `rows.reduce((s, r) => s + r.notional, 0);` |
| `totalMV` | `rows.reduce((s, r) => s + r.mv, 0);` |
| `wMac` | `rows.reduce((s, r) => s + r.mac * r.mv, 0) / totalMV;` |
| `wMod` | `rows.reduce((s, r) => s + r.mod * r.mv, 0) / totalMV;` |
| `wCoupon` | `rows.reduce((s, r) => s + r.coupon * r.notional, 0) / totalNotional;` |
| `wContracted` | `rows.reduce((s, r) => s + (parseFloat(r.contractedPct) \|\| 0) * r.notional, 0) / totalNotional;` |
| `totalEL` | `rows.reduce((s, r) => s + r.el, 0);` |
| `totalELMig` | `rows.reduce((s, r) => s + r.elMig, 0);` |
| `totalELClimate` | `rows.reduce((s, r) => s + r.elClimate, 0);` |
| `bySector` | `SECTORS.map((sec) => ({` |
| `byRating` | `RATINGS.map((rt) => ({` |
| `hhiSector` | `bySector.reduce((s, d) => s + Math.pow(d.pct, 2), 0);` |
| `oasBps` | `mkt.oasPp * 100;` |
| `bookSprBps` | `(r.coupon - base) * 100;` |
| `wGap` | `withGap.length ? withGap.reduce((s, r) => s + r.gapBps * r.notional, 0) / withGap.reduce((s, r) => s + r.notional, 0) : null;` |
| `elChartData` | `useMemo(() => (book ? book.rows.map((r) => ({` |
| `pts` | `engine.data.positions.map((p) => ({` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/fred-spreads/status` | `status` | api/v1/routes/fred_spreads.py |
| GET | `/api/v1/fred-spreads/catalog` | `catalog` | api/v1/routes/fred_spreads.py |
| GET | `/api/v1/fred-spreads/series` | `series` | api/v1/routes/fred_spreads.py |
| POST | `/api/v1/infra-portfolio/ngfs-overlay` | `ngfs_overlay` | api/v1/routes/infra_portfolio_analytics.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `Acklam`, `FRED` *(shared)*, `__future__` *(shared)*, `datetime` *(shared)*, `fastapi` *(shared)*, `from`, `functools` *(shared)*, `in`, `maps` *(shared)*, `math`, `pathlib` *(shared)*, `pydantic` *(shared)*, `sector` *(shared)*, `terms`, `to`, `typing` *(shared)*
**Frontend seed datasets:** `DEFAULT_POSITIONS`, `MIG_STATES`, `PD_TENORS`, `RATINGS`, `SECTORS`, `SENIORITIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **14** other module(s).

| Connected module | Shared via |
|---|---|
| `maturity-wall-monitor` | table:FRED, table:maps |
| `credit-spread-climate-monitor` | table:FRED, table:maps |
| `green-bond-pricing-desk` | table:FRED, table:maps |
| `energy-transition-credit-portal` | table:functools, table:pathlib |
| `module-navigator` | table:functools, table:pathlib |
| `green-bond-portfolio-optimizer` | table:FRED |
| `green-bond-portfolio-analytics` | table:FRED |
| `sanctions-climate-finance` | table:pathlib |
| `platform-analytics` | table:pathlib |
| `sanctions-trade-monitor` | table:pathlib |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`infra-debt-portfolio-manager` (NX2-03) is a book-level infra private-debt engine built on
one deterministic backend route, `backend/api/v1/routes/infra_portfolio_analytics.py` (679
lines, docstring: "all deterministic, no PRNG anywhere"), fronted by a 986-line React page
(`InfraDebtPortfolioManagerPage.jsx`) that also runs a lighter-weight, closed-form "quick
view" directly in the browser (its own duration/EL/migration calculations, kept for
instant feedback while the user edits the ledger — see §7.7 for how the two relate).

| Endpoint | What it does |
|---|---|
| `POST /analyze` | Full book analytics: per-position cash-flow projection (coupon + straight-line amortisation) + portfolio cash-flow ladder; reinvestment horizon-return; analytic one-factor Vasicek/ASRF credit VaR (EL, VaR99, VaR99.9, UL, capital multiple); HHI concentration (sector/country/single-name); migration-adjusted pricing alpha vs a live-OAS join; PCAF-proxy financed emissions + intensity-vs-spread OLS + classification mix |
| `POST /ngfs-overlay` | Reads the seeded NGFS Phase 5 extract, maps each scenario's carbon price + GDP impact at an anchor year into sector-level PD multipliers (documented, labeled), reprices EL/VaR99/VaR99.9 for all six NGFS scenarios |
| `GET /ref/mappings` | Every hand-authored table used by the engine (PD table, NGFS sector sensitivities, PCAF-proxy intensities, sector classification), each with its stated basis |

### 7.2 Cash-flow projection and horizon return

```
outstanding(0) = notional_m
amort = min(amort_pct_per_yr/100, 1/ttm)                     # capped so principal can't fully repay before maturity
coupon_t   = outstanding(t-1) × coupon_pct/100
principal_t = notional_m × amort   (t < ttm)   or   remaining outstanding   (t = ttm)
MV_0 = Σ_t (coupon_t + principal_t) / (1+discount_rate)^t

Horizon value (documented reinvestment convention):
  V_H = Σ_{t≤H} CF_t · (1+reinvestment_rate)^(H-t)  +  Σ_{t>H} CF_t / (1+discount_rate)^(t-H)
Horizon return (annualised) = (V_H / MV_0)^(1/H) − 1
```
This is a stated "flat-curve screening convention; defaults are priced separately in the
credit block" — the cash-flow view carries no default risk itself; PD/LGD are applied
downstream in the Vasicek/ASRF block (§7.3).

### 7.3 Credit VaR — one-factor Vasicek / Basel ASRF, precisely

Verbatim from the module docstring:
```
PD_q = Phi( (Phi^-1(PD) + sqrt(rho) * Phi^-1(q)) / sqrt(1 - rho) )
VaR_q = sum_i EAD_i x LGD x PD_q,i
EL    = sum_i EAD_i x LGD x PD_i
UL_q  = VaR_q - EL
capital multiple = UL_99.9 / EL
```
implemented exactly as `_vasicek_conditional_pd` / `_asrf_block`
(`infra_portfolio_analytics.py:241,368`):
```python
def _vasicek_conditional_pd(pd, rho, q):
    pd = min(max(pd, 1e-9), 0.999999)
    return _norm_cdf((_inv_norm(pd) + math.sqrt(rho) * _inv_norm(q)) / math.sqrt(1.0 - rho))
```
- `Phi` (`_norm_cdf`) is the standard normal CDF via `math.erf` (double precision, exact to
  machine epsilon).
- `Phi^-1` (`_inv_norm`) is **Peter Acklam's rational approximation** — the docstring cites
  "max relative error ~1.15e-9... the same accuracy class as Wichura's AS-241 (PPND16)."
- **Single asset correlation `rho`, default 0.24** — labeled explicitly: "Basel-convention
  asset correlation for project finance / specialised lending (upper corporate band;
  supervisory slotting treats PF near the 24% high-correlation end)." User-adjustable
  (`0 < rho < 1`).
- **Conditional PD** at confidence `q` is the fraction of obligors that default when the
  single systematic factor is at its `q`-quantile — this is the Basel **ASRF** (Asymptotic
  Single Risk Factor) closed form, which assumes an **infinitely granular** book (no
  single-name concentration). The engine is explicit about this: the `/analyze` response
  pairs the VaR block with a `granularity_note` and the HHI concentration block (§7.5),
  stating "single-name concentration ADDS unmodeled UL... a first-order granularity
  adjustment scales with HHI/10000 (Gordy)."
- **Cumulative PD source**: `PD_TABLE`, a hand-authored rating×tenor grid (linear
  interpolation between tenors 1/3/5/7/10), labeled "consistent with Moody's PF bank-loan
  and S&P annual PF default studies — APPROXIMATE."
- **LGD default 25%** ("Moody's PF ultimate recoveries ~75-80% senior secured").

### 7.4 Worked example — Vasicek VaR99 / VaR99.9, hand-traced

Position: **Borealis Offshore Wind TL** (one of the platform's own `DEFAULT_POSITIONS`),
rating **BBB**, notional **$120M**, maturity 2036. As-of year 2026 ⇒ `ttm = 10`; the
engine's default `horizon_years = 5` ⇒ `h = min(5, 10) = 5` — exactly a `PD_TENORS` grid
point, so **no interpolation is needed**: `PD_TABLE["BBB"][tenor=5] = 1.30%`. Use the
defaults `LGD = 25%`, `rho = 0.24`.

```
EAD = 120,  LGD = 0.25,  PD = 0.013,  rho = 0.24
EL  = EAD × LGD × PD = 120 × 0.25 × 0.013 = $0.390M
```
Standard-normal quantiles (from tables — the engine computes the same values internally via
`math.erf`/Acklam to ~1e-9 precision; hand-table values below match those to 4 significant
figures, confirmed by direct computation):
```
Φ⁻¹(PD) = Φ⁻¹(0.013)  ≈ −2.226        (engine: −2.22621)
Φ⁻¹(0.99)              ≈ 2.326        (engine:  2.32635 — standard 99th-percentile z)
Φ⁻¹(0.999)              ≈ 3.090        (engine:  3.09023 — standard 99.9th-percentile z)
√ρ = √0.24 = 0.4899,   √(1-ρ) = √0.76 = 0.8722
```
**Conditional PD at q = 0.99:**
```
numerator  = −2.226 + 0.4899 × 2.326 = −2.226 + 1.1397 = −1.0863
PD_99      = Φ(−1.0863 / 0.8722) = Φ(−1.2456) ≈ 0.1064  (10.64%; engine-exact: 10.632%)
VaR_99     = EAD × LGD × PD_99 = 120 × 0.25 × 0.1064 = $3.192M
UL_99      = 3.192 − 0.390 = $2.802M
```
**Conditional PD at q = 0.999:**
```
numerator  = −2.226 + 0.4899 × 3.090 = −2.226 + 1.5139 = −0.7121
PD_99.9    = Φ(−0.7121 / 0.8722) = Φ(−0.8165) ≈ 0.2071  (20.71%; engine-exact: 20.694%)
VaR_99.9   = 120 × 0.25 × 0.2071 = $6.213M
UL_99.9    = 6.213 − 0.390 = $5.823M
capital multiple = UL_99.9 / EL = 5.823 / 0.390 = 14.93×
```
(Direct machine computation of the exact formula — `math.erf`-based `Φ` with a bisection
inverse — gives `EL=$0.390M, VaR99=$3.1896M, VaR99.9=$6.2082M, UL99=$2.7996M,
UL99.9=$5.8182M, capital multiple=14.919×`, confirming the hand trace to 3–4 significant
figures.)

**Reading the result:** a BBB obligor's *unconditional* PD is only 1.30%, but at ρ = 0.24
(the Basel high-correlation band for project finance) the systematic-factor tail pushes the
**conditional** PD to 10.6% at the 99th percentile and 20.7% at the 99.9th — an 8× and 16×
multiple of the base PD respectively. This is the Vasicek "tail-fattening" effect that
justifies holding materially more capital than a simple EL calculation would suggest, and is
exactly why the capital multiple (`UL99.9/EL ≈ 14.9×`) is large even for a single
investment-grade-rated position. Note the capital multiple is **invariant to EAD and LGD** —
`(VaR_999 − EL)/EL = (PD_999 − PD)/PD`, a pure function of `(PD, ρ)` — a useful internal
consistency check when sanity-testing the engine across differently-sized positions.

### 7.5 Concentration (HHI)

```
HHI = Σ_i (share_i_pct)^2                    (0-10000 scale on notional shares)
```
computed by sector, country, and single-name (`_concentration`,
`infra_portfolio_analytics.py:388`); bands are "DoJ-style screening bands, labeled": >2500
concentrated, 1500–2500 moderate. `effective_n = 10000/HHI` (single-name). This block is
explicitly paired with the ASRF VaR as the documented correction for the ASRF's infinite-
granularity assumption (§7.3).

### 7.6 Migration-adjusted pricing alpha and financed emissions

```
book spread_bp = (coupon_pct - base_rate_pct) × 100                          # funding-curve proxy
alpha_bp = book spread_bp − rating_implied_oas_bp                            # rating_implied = live OAS bucket join
financed_emissions_i = notional_$M × intensity_tco2e_per_musd                # PCAF-proxy, attribution factor 1.0 (LABELED)
intensity-vs-spread OLS: y = spread_bp, x = intensity      → "does the book price carbon risk?"
```
Sector default intensities (`SECTOR_INTENSITY_TCO2E_PER_MUSD`) are "hand-authored
order-of-magnitude conventions" (solar 15, wind 20, transmission 45, social 30, toll road
220, airport 550 tCO2e/$M) — explicitly labeled "NOT reporting-grade." The PCAF proxy sets
the attribution factor to 1.0 on the instrument because "private PF capital structures are
rarely public" — a stated, deliberate simplification versus true PCAF (which divides
borrower emissions by EVIC/total debt).

### 7.7 NGFS Phase 5 scenario overlay — climate × credit

```
PD multiplier(sector, scenario) = clip( 1 + beta_cp × CP(s, anchor)/100 + beta_gdp × max(0, -GDP(s, anchor)), 0.4, 4.0 )
stressed_PD = min(base_PD × multiplier, 0.99)
```
`CP` (carbon price, USD/tCO2e) and `GDP` (impact, %) come from the seeded NGFS Phase 5
extract (IIASA Scenario Explorer, CC BY 4.0) at a user-selected anchor year/region.
`beta_cp`/`beta_gdp` (`NGFS_SECTOR_SENSITIVITY`) are hand-authored, LABELED MODEL ASSUMPTIONS:
demand-exposed fossil-adjacent transport (airport `beta_cp=0.22`, toll road `0.12`) carries
the largest positive carbon-price beta; contracted renewables (wind/solar `beta_cp=-0.05`)
carry a small **negative** beta ("carbon pricing lifts merchant tails / re-contracting
values"); every sector carries a positive macro (`beta_gdp`) beta. Stressed PDs re-run
through the **same** `_asrf_block` used in §7.3/§7.4 — i.e. the NGFS overlay is not a
separate risk model, it is the identical Vasicek machinery fed a stressed PD. Explicitly
"Transition risk only — physical/chronic risk is NOT modeled here."

**Note on the frontend's parallel "quick view" climate stress.** The React page computes its
own instant, client-side climate multiplier for the always-visible Position Analytics table
(`pdClimate = pd × (1 + (score/100) × (climateMult − 1))`, where `score` is a hand-authored
0–100 `SECTOR_TRANSITION` exposure score and `climateMult` is a user slider 1–3×) — this is a
**different, simpler mechanism** from the backend's NGFS-scenario carbon-price/GDP mapping
in `/ngfs-overlay`. Both are legitimately documented and labeled, but a reader should not
conflate the in-page "climate stress multiplier" slider with the backend's six-scenario NGFS
overlay — they answer different questions (a generic sensitivity dial vs a scenario-specific
repricing) and are not reconciled against each other in the UI. This is a companion-analytics
duality, not a bug — parallel to how `ppa-structuring-desk`'s Panel 1 generation case and
Panel 8 bankability score are separate services from the route under review.

### 7.8 Data provenance & limitations

- **All 12 default positions are hand-authored illustrative project-finance debt** — the
  frontend labels them explicitly: "hand-authored illustrative positions (fictional projects,
  typical asset-class terms), not live holdings," fully editable.
- **PD table** (`PD_TABLE`, rating × tenor) is hand-authored, "consistent with" (not sourced
  from) Moody's PF bank-loan and S&P annual PF default studies — labeled APPROXIMATE;
  per-position `pd_pct` override supported for licensed study data.
- **Asset correlation ρ = 0.24** is a labeled Basel-convention default for project
  finance/specialised lending, user-adjustable.
- **NGFS sector sensitivities and PCAF-proxy intensities are both LABELED MODEL ASSUMPTIONS**,
  not calibrated/fitted parameters — `GET /ref/mappings` serves every one with its basis
  text.
- **Migration-adjusted pricing alpha requires the live OAS join** (`bucket_oas_pp`) — without
  it, `alpha_bp` is `null` and the response says so ("Supply bucket_oas_pp... to enable
  rating-implied pricing alpha").
- **Public corporate OAS is an imperfect proxy for private infra debt** — stated model
  assumption (illiquidity premium not split out).
- **Financed-emissions attribution factor is fixed at 1.0** on the instrument, not divided by
  EVIC/total debt as true PCAF requires — an explicit, labeled proxy.
- **The ASRF VaR assumes an infinitely granular portfolio** — genuinely paired with an HHI
  concentration block and granularity note rather than silently ignored.

## 8 · Model Specification

**Status: implemented.**

**8.1 Purpose & scope.** Book-level analytics for a private infrastructure-debt portfolio:
cash-flow projection and reinvestment horizon return, analytic Vasicek/ASRF credit VaR (EL,
VaR99/99.9, UL, capital multiple), multi-axis HHI concentration, migration-adjusted pricing
alpha against live rating-bucket OAS, PCAF-proxy financed emissions, and an NGFS Phase 5
six-scenario climate-transition repricing overlay — for infra private-debt portfolio and risk
management teams.

**8.2 Conceptual approach.** Per-position annual cash flows (coupon on amortising
outstanding) drive both a discounted mark-to-market/horizon-return view and, independently, a
credit-risk view: a hand-authored rating×tenor cumulative-PD table feeds a single-factor
Vasicek/Basel ASRF closed form that converts each position's unconditional PD into a
99%/99.9%-confidence **conditional** PD via the systematic-factor tail, aggregated into
portfolio EL/VaR/UL. The same ASRF machinery is reused, unmodified, for the NGFS overlay —
only the input PDs change (stressed by a documented sector-sensitivity mapping to scenario
carbon price/GDP), so base-case and climate-stressed risk are directly comparable apples-to-
apples. Concentration (HHI) and financed-emissions/OLS blocks are independent closed-form
aggregations over the same position ledger.

**8.3 Mathematical specification.**
```
Cash flows : coupon_t = outstanding(t-1)·coupon_pct; principal_t = notional·min(amort_pct,1/ttm) (bullet at maturity)
Horizon    : V_H = Σ_{t≤H} CF_t(1+r_reinv)^(H-t) + Σ_{t>H} CF_t/(1+r_disc)^(t-H);  return=(V_H/MV_0)^(1/H)-1
Credit VaR : PD_q = Φ( (Φ⁻¹(PD) + √ρ·Φ⁻¹(q)) / √(1-ρ) )
             EL = Σ EAD·LGD·PD ;  VaR_q = Σ EAD·LGD·PD_q ;  UL_q = VaR_q - EL ;  cap. mult. = UL_99.9/EL
Concentration : HHI = Σ share_i²  (sector / country / single-name, 0-10000 scale)
Pricing alpha : alpha_bp = (coupon - base_rate)×100 - rating_bucket_OAS_bp
Financed CO2e : Σ notional_$M × intensity_tCO2e_per_$M  (attribution factor 1.0, PCAF-proxy)
NGFS overlay  : PD_mult(sector,scenario) = clip(1 + β_cp·CP/100 + β_gdp·max(0,-GDP), 0.4, 4.0); stressed_PD = min(PD·mult, 0.99)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Cumulative PD table | `PD_TABLE` (rating × tenor 1/3/5/7/10) | Hand-authored, "consistent with" Moody's PF bank-loan & S&P PF default studies |
| Asset correlation | ρ (default 0.24) | Basel-convention high band, project finance / specialised lending |
| LGD | (default 25%) | Moody's PF ultimate recoveries ~75–80% senior secured |
| Inverse normal | Acklam rational approximation | Max rel. error ~1.15e-9, AS-241/PPND16 accuracy class |
| NGFS sector sensitivities | β_cp, β_gdp | Hand-authored LABELED MODEL ASSUMPTION |
| PCAF-proxy intensities | tCO2e/$M by sector | Hand-authored order-of-magnitude screening convention |
| HHI concentration bands | 1500 / 2500 | DoJ-style screening bands, labeled |

**8.4 Data requirements.** A positions ledger (name, sector, country, rating, notional,
coupon, maturity, amortisation, optional per-position PD/intensity/classification
overrides); a discount/reinvestment rate and horizon; LGD and asset correlation; an optional
live rating-bucket OAS map for pricing alpha; and, for the NGFS overlay, an anchor
year/region against the seeded NGFS Phase 5 extract.

**8.5 Validation & benchmarking.** §7.4 hand-traces the Vasicek/ASRF formula for a real
default position (Borealis Offshore Wind TL, BBB, $120M, 5-year horizon landing exactly on a
PD-table grid point) and confirms the hand-computed VaR99/VaR99.9/capital-multiple figures
against a direct machine evaluation of the identical closed form to 3–4 significant figures.
The capital-multiple invariance to EAD/LGD (§7.4) is a built-in internal consistency check.
External validation would compare the PD table against licensed PF default studies and the
NGFS sector sensitivities against an econometric transition-risk PD model.

**8.6 Limitations & model risk.** The ASRF formula assumes an infinitely granular book —
single-name concentration is not priced into VaR itself (only flagged via HHI); the PD table,
NGFS sensitivities, and PCAF-proxy intensities are all hand-authored labeled conventions, not
fitted/licensed data; financed-emissions attribution is fixed at 1.0 on the instrument rather
than true PCAF's EVIC/total-debt division; public corporate OAS is an imperfect liquidity
proxy for private infra debt; and the NGFS overlay is transition-risk only (no physical/
chronic climate risk channel).

## 9 · Future Evolution

### 9.1 Evolution A — Granularity-adjusted VaR and calibrated PD/attribution inputs (analytics ladder: rung 3 → 4)

**What.** This is a mature tier-A engine — deterministic Vasicek/ASRF credit VaR hand-traced to 3–4 significant figures (§7.4), NGFS Phase 5 overlay reusing the identical machinery, every assumption labeled and served via `GET /ref/mappings`. Its own §7.8 limitations define the next rung: the ASRF assumes infinite granularity (single-name concentration is *flagged* via HHI but not *priced* into VaR); the PD table is hand-authored "consistent with" Moody's/S&P PF studies rather than calibrated; financed-emissions attribution is fixed at 1.0 instead of true PCAF EVIC/total-debt division; and the frontend's slider-based `pdClimate` multiplier and the backend's NGFS overlay are two unreconciled climate mechanisms. Evolution A: implement the Gordy granularity adjustment the engine's own `granularity_note` already names (UL add-on scaling with HHI/10000), calibrate the PD grid against licensed PF default-study data via the per-position `pd_pct` override path, compute real attribution factors where capital-structure data exists, and render the in-page climate slider as an explicitly-labeled approximation of the NGFS overlay with a reconciliation view.

**How.** (1) `_asrf_block` gains an optional granularity add-on term with the Gordy reference documented; VaR reported both raw-ASRF and granularity-adjusted. (2) A PD-calibration path: fit the rating×tenor grid to uploaded study data, version-stamped. (3) The §7.4 Borealis hand-trace (VaR99 $3.19M, capital multiple 14.9×) pins in bench_quant as the regression anchor before any formula change. (4) Rung 4 entry: migration simulation over the `MIG_MATRIX` for multi-year horizon EL paths, replacing the single-period conditional-PD view.

**Prerequisites.** Licensed default-study data (or a documented public proxy); the capital-multiple invariance check (§7.4) retained as an internal test. **Acceptance:** granularity-adjusted VaR strictly exceeds raw ASRF for concentrated books and converges as effective-n grows; Borealis pin unchanged; both climate mechanisms produce a displayed, explained delta.

### 9.2 Evolution B — Portfolio-risk analyst over the analyze/overlay routes (LLM tier 2)

**What.** The engine's response payloads are dense (EL/VaR/UL, HHI by three axes, pricing alpha, intensity-vs-spread OLS, six NGFS scenarios) — precisely the surface a tool-calling analyst compresses: "why is our capital multiple 15×?", "which scenario hurts the airport exposure most and why?" (answer citing `beta_cp = 0.22` from `/ref/mappings`), "what happens to VaR99.9 if we add a $80M BB toll road?", "is the book pricing carbon risk?" (the OLS block answers this directly).

**How.** Tier 2: tool schemas over `POST /analyze`, `POST /ngfs-overlay`, `GET /ref/mappings` and the FRED spread routes — all live, Pydantic-typed, deterministic; this is one of the platform's most tool-ready modules. What-if positions submit modified ledgers to `/analyze` and diff the response. Discipline rules inherit from the module's own labeling culture: every assumption the copilot cites must quote the `/ref/mappings` basis text ("hand-authored, NOT reporting-grade" for PCAF intensities; "Basel-convention" for ρ=0.24); the transition-only scope of the NGFS overlay ("physical risk is NOT modeled here") is repeated whenever climate results are quoted; and the ASRF granularity caveat accompanies any VaR figure for a book with HHI > 2500. The Vasicek explainer draws on §7.4's tail-fattening narrative — the 8×/16× conditional-PD multiples — which is already written for exactly this purpose.

**Prerequisites.** Phase 2 tool-calling infrastructure only — no backend work needed. **Acceptance:** every risk figure matches a logged response; assumption citations reproduce `/ref/mappings` basis text verbatim; what-if answers show the ledger diff submitted.