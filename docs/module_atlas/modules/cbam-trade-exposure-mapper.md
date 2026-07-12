# Cbam Trade Exposure Mapper
**Module ID:** `cbam-trade-exposure-mapper` · **Route:** `/cbam-trade-exposure-mapper` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `CBAM_API`, `CBAM_SECTORS`, `CBAM_TIMELINE`, `COMTRADE_API`, `DATA_LABEL`, `DECLARANT_OBLIGATIONS`, `ETS_SCENARIOS_FALLBACK`, `FLAG_STYLE`, `FREE_ALLOC_FALLBACK`, `FlagChips`, `KpiCard`, `LiveBadge`, `LiveComtradeVerificationPanel`, `SECTOR_HS_QUERY`, `SectionH`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CBAM_SECTORS` | 60 | `name`, `hs`, `unit`, `intensityUnit`, `scope`, `color`, `euComparator`, `label`, `value` |
| `CBAM_TIMELINE` | 11 | `title`, `detail`, `status` |
| `DECLARANT_OBLIGATIONS` | 5 | `items` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `CBAM_API` | ``${API}/api/v1/cbam`;` |
| `COMTRADE_API` | ``${API}/api/v1/un-comtrade`;` |
| `years` | `Object.keys(prices).map(Number).sort((a, b) => a - b);` |
| `frac` | `(year - prev) / (next - prev);` |
| `gross` | `emissionsT * etsPrice;` |
| `domCredit` | `emissionsT * domesticPrice;` |
| `freeRed` | `gross * (freePct / 100);` |
| `DATA_LABEL` | `'Real trade-pattern extract (UN Comtrade / Eurostat COMEXT aggregates, ~2023-24, hand-compiled approximations) — refresh from CEPII BACI bulk for production precision';` |
| `embeddedT` | `(sector, o) => o.volume * cbamIntensity(sector, o) * 1e6;` |
| `unitValueEur` | `(o) => (o.volume > 0 ? (o.tradeEurBn * 1e9) / (o.volume * 1e6) : 0);` |
| `TABS` | `['Exposure Matrix', 'CBAM Cost Projection 2026-34', 'Origin Substitution Analyzer', 'Importer Checklist', 'Methodology & Data Notes'];` |
| `sched` | `Object.fromEntries(Object.entries(schedRes.data \|\| {}).map(([y, v]) => [Number(y), v]));` |
| `scen` | `Object.fromEntries(Object.entries(scenRes.data \|\| {}).map(([name, path]) => [` |
| `YEARS` | `useMemo(() => Object.keys(freeAlloc).map(Number).sort((a, b) => a - b), [freeAlloc]);` |
| `sectorSummaries` | `useMemo(() => CBAM_SECTORS.map(s => {` |
| `totTrade` | `sectorSummaries.reduce((a, s) => a + s.tradeEurBn, 0);` |
| `totLiable` | `sectorSummaries.reduce((a, s) => a + s.liableTradeEurBn, 0);` |
| `totEmbedded` | `sectorSummaries.reduce((a, s) => a + s.embeddedMt, 0);` |
| `totExempt` | `sectorSummaries.reduce((a, s) => a + s.exemptEurBn, 0);` |
| `matrixRows` | `useMemo(() => CBAM_SECTORS .filter(s => matrixSector === 'All' \|\| s.key === matrixSector) .flatMap(s => s.origins.map(o => ({ sector: s.name, sectorKey: s.key, color: s.color, unit: s.unit, intensityUnit: s.intensityUnit, scope: s.scope, ...o, cbamInt: cbamIntensity(s, o), embeddedMt: isExempt(o) ? 0 : embeddedT(s, o) / 1e6, })))` |
| `projection` | `useMemo(() => YEARS.map(year => {` |
| `row` | `{ year, etsPrice: Math.round(price * 100) / 100, cbamFactorPct: Math.round((100 - freePct) * 10) / 10 };` |
| `perUnit` | `o.volume > 0 ? net / (o.volume * 1e6) : 0; // €/t or €/MWh` |
| `results` | `await Promise.all(subSector.origins.map(o => {` |
| `subChart` | `useMemo(() => (subResults \|\| []) .map(r => ({ ...r, fill: r.flags.includes('exempt') ? '#94a3b8' : (r.pctOfValue >= uncompThreshold ? T.red : subSector.color) })) .sort((a, b) => b.perUnit - a.perUnit), [subResults, uncompThreshold, subSector]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CBAM_SECTORS`, `CBAM_TIMELINE`, `DECLARANT_OBLIGATIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Auto-atlas coverage gap flag.** The current auto-generated
> `docs/module_atlas/modules/cbam-trade-exposure-mapper.md` shows no backend
> section and "Blast radius: 0 other modules." That is incomplete: the page
> genuinely calls the real platform CBAM engine (`backend/services/cbam_service.py`
> via `backend/api/v1/routes/cbam.py`) for `GET /free-allocation-schedule`,
> `GET /ets-price-scenarios`, and `POST /calculate-cost` — the atlas's static
> extractor likely missed this because the calls use a template-literal base URL
> (`` `${CBAM_API}/...` ``) rather than a literal string it can pattern-match. This
> deep-dive documents the real wiring; the module genuinely shares logic with
> whatever else calls `cbam_service.py` (confirmed present: `backend/api/v1/routes/
> cbam.py`'s `/calculate-cost`, `/free-allocation-schedule`, `/ets-price-scenarios`,
> plus the more advanced `/calculate-emissions`, `/project-costs`,
> `/portfolio-exposure`, `/supplier-risk/{id}` endpoints backed by
> `services/cbam_calculator.py`, which this page does not call).

### 7.1 What the module computes

CBAM Trade Exposure Mapper maps EU import exposure under the Carbon Border
Adjustment Mechanism (Regulation (EU) 2023/956) across its 6 covered sectors (iron
& steel, aluminium, cement, fertilisers, hydrogen, electricity), using a
**hand-compiled real trade-pattern extract** (UN Comtrade / Eurostat COMEXT
aggregates, ~2023-24) crossed with the **live/real CBAM cost-projection engine**
already used elsewhere on the platform. It is genuinely wired to a backend, not a
purely frontend-computed page.

### 7.2 Data source — trade-pattern extract + real CBAM engine

**Trade data** (`CBAM_SECTORS`, 6 sectors × 4-11 origins each): hand-compiled,
labeled `DATA_LABEL = 'Real trade-pattern extract (UN Comtrade / Eurostat COMEXT
aggregates, ~2023-24, hand-compiled approximations) — refresh from CEPII BACI bulk
for production precision'`. Each origin row carries `tradeEurBn`, `volume`,
`intensityDirect`/`intensityTotal` (tCO2/t or tCO2/MWh), `carbonPriceEur`
(effective, post-free-allocation origin-scheme carbon price), a textual `basis`
(e.g. "≈70% EAF scrap route... Turkish ETS pilot planned ~2026"), and status flags
(`exempt`, `exempt-pending`, `sanction`, `note`) grounded in real policy facts (EEA/
EFTA ETS linkage, the May-2025 EU-UK ETS linkage-in-principle, Russia sanctions
packages).

**Engine data** — genuinely live, not mirrored-only:
```js
const [schedRes, scenRes] = await Promise.all([
  axios.get(`${CBAM_API}/free-allocation-schedule`),   // -> FREE_ALLOC_SCHEDULE
  axios.get(`${CBAM_API}/ets-price-scenarios`),        // -> ETS_PRICE_SCENARIOS
]);
```
Backend (`backend/services/cbam_service.py`):
```python
FREE_ALLOC_SCHEDULE = {2026: 97.5, 2027: 95.0, 2028: 90.0, 2029: 77.5, 2030: 51.5,
                       2031: 39.0, 2032: 26.5, 2033: 14.0, 2034: 0.0}
ETS_PRICE_SCENARIOS = {"Current Trend": {2025:70,2026:75,2027:80,2028:85,2030:95,
                       2035:120,2040:150,2050:200}, "Ambitious": {...}, "Conservative": {...}}

def calculate_cbam_cost(emissions_tco2, eu_ets_price, domestic_carbon_price=0, free_allocation_pct=0):
    gross_cost = emissions_tco2 * eu_ets_price
    domestic_credit = emissions_tco2 * domestic_carbon_price
    free_reduction = gross_cost * (free_allocation_pct / 100)
    net_cost = max(0, gross_cost - domestic_credit - free_reduction)
    return {gross_cost_eur, domestic_credit_eur, free_allocation_reduction_eur, net_cbam_cost_eur}
```
The frontend's `localCbamCost()` and `interpPrice()` are byte-for-byte formula
mirrors of this backend function (used only as an offline fallback when the live
POST fails — the comment says so explicitly: "Local fallbacks mirror the engine
formula exactly"). Tab 2 (Origin Substitution Analyzer) calls
`POST /api/v1/cbam/calculate-cost` **live, once per origin**, falling back to the
local mirror only on network failure — confirmed by reading both the `try` (axios
calls) and `catch` (local `localCbamCost` calls with an identical formula) branches.

### 7.3 CBAM cost formula (Art. 9 deduction + free-allocation phase-out)

```
gross_cost   = E × P_ETS
domestic_credit = E × P_domestic        (Art. 9: carbon price effectively paid in origin, deductible)
free_reduction   = gross_cost × freeAlloc%
net_cbam_cost    = max(0, gross_cost − domestic_credit − free_reduction)
```
`freeAlloc%` follows `FREE_ALLOC_SCHEDULE` (EU ETS free-allocation phase-out for
CBAM sectors under Art. 31, 97.5% in 2026 down to 0% in 2034); `CBAM factor % =
100 − freeAlloc%` is the complementary "how much of the gross cost is actually
liable" figure shown throughout the UI (2.5% in 2026 rising to 100% in 2034).

`interpPrice()` linearly interpolates between the sparse `{year: price}` scenario
knots:
```js
frac = (year - prev) / (next - prev);
price = prices[prev] + frac * (prices[next] - prices[prev]);
```

Scope correctness (`cbamIntensity`): iron/steel, aluminium and hydrogen use
**direct-only** intensity per Annex II (indirect inclusion deferred pending
Commission review); cement, fertilisers and electricity use **direct + indirect**
— the matrix table shows both columns so the pending-review contingent exposure is
visible (e.g. Indian aluminium: 1.9 direct vs 18.5 total tCO2/t, almost entirely
from a coal-heavy captive power grid that sits outside CBAM's current scope).

### 7.4 Worked example — Turkish steel, Current Trend scenario, 3 vintages

Turkey/steel origin row: `volume = 5.5` Mt, `intensityDirect = 0.8` tCO2/t (scope =
`direct` for steel), `carbonPriceEur = 0` (no effective carbon price paid).
`embeddedT = volume × intensity × 1e6 = 5.5 × 0.8 × 1,000,000 = 4,400,000 tCO2`.

| Year | ETS price (Current Trend) | Free alloc % | CBAM factor % | Gross cost | Free reduction | **Net CBAM cost** |
|---|---|---|---|---|---|---|
| 2026 | €75/t (exact knot) | 97.5% | 2.5% | 4.4M×75 = €330.0M | 330.0M×0.975 = €321.75M | **€8.25M** |
| 2030 | €95/t (exact knot) | 51.5% | 48.5% | 4.4M×95 = €418.0M | 418.0M×0.515 = €215.27M | **€202.73M** |
| 2034 | interpolated: prev=2030(€95), next=2035(€120); frac=(2034-2030)/(2035-2030)=0.8; price=95+0.8×(120-95)=**€115/t** | 0% | 100% | 4.4M×115 = €506.0M | 0 | **€506.0M** |

Hand-check for 2026: `gross = 4,400,000 × 75 = 330,000,000`; `domestic_credit = 0`
(Turkey's `carbonPriceEur=0`); `free_reduction = 330,000,000 × 0.975 = 321,750,000`;
`net = max(0, 330,000,000 − 0 − 321,750,000) = 8,250,000` → **€8.25M**, matching the
table (and matching the CBAM factor of 2.5% applied to the €330M gross figure:
€330M × 2.5% = €8.25M exactly, confirming the free-allocation-complement identity
`net = gross × (1 − freeAlloc%)` when the domestic credit is zero).

This demonstrates the phase-in's real bite: the same 4.4 MtCO2 embedded emissions
produce a **61x larger** net CBAM bill by 2034 (€506.0M) than in 2026 (€8.25M) —
almost entirely the free-allocation phase-out, not the ETS price rise (which only
grew from €75 to €115/t, a 1.5x increase, over the same period).

### 7.5 Origin Substitution Analyzer (Tab 2) — live per-origin engine calls

```js
subResults = await Promise.all(origins.map(o =>
  axios.post(`${CBAM_API}/calculate-cost`, {
    emissions_tco2: embeddedT(sector, o), eu_ets_price: certPrice,
    domestic_carbon_price: o.carbonPriceEur, free_allocation_pct: freeAlloc[year],
  })));
perUnit = net_cbam_cost_eur / (volume × 1e6);          // €/t or €/MWh landed premium
pctOfValue = perUnit / unitValueEur(o) × 100;           // competitiveness threshold test
```
`unitValueEur(o) = (tradeEurBn × 1e9) / (volume × 1e6)` derives an implied €/unit
trade price directly from the extract's own trade-value and volume fields (not a
separate price assumption) — origins are flagged "uncompetitive" when the CBAM
landed premium exceeds a user-adjustable percentage (default 10%) of that implied
unit value.

### 7.6 Companion analytics

- **Exposure matrix** (Tab 0): sector×origin table with embedded-emissions
  ranking, exempt/sanction/pending flag chips, and hover-revealed intensity `basis`
  text per row.
- **Importer checklist** (Tab 3): a real regulatory timeline (transitional period
  from 1 Oct 2023 through full CBAM on 1 Jan 2034), including the 2025 "Omnibus I"
  simplification amendment (50t/yr de minimis, 31 Aug declaration deadline, 50%
  quarterly certificate-holding, Feb 2027 certificate-sales start) — labeled as
  needing verification against the final consolidated legal text.

### 7.7 Data provenance & limitations

- **Trade flows/intensities are a hand-compiled, order-of-magnitude-correct
  extract** from UN Comtrade / Eurostat COMEXT aggregates (~2023-24) — the module
  itself recommends CEPII BACI bulk download for production precision.
- **The phase-in schedule, ETS scenarios, and cost formula are the platform's real
  CBAM engine**, live-fetched, not re-derived or approximated independently by this
  page (the local copies exist purely as an offline-fallback mirror).
- Effective domestic carbon prices ("carbon price effectively paid") are
  conservative estimates after origin-scheme free allocation — not headline scheme
  prices, and would need documented evidence for a real CBAM filing (Art. 9).
- Hydrogen sector rows are explicitly labeled corridor **placeholders** — merchant
  cross-border H2 trade into the EU is described as "NEGLIGIBLE today (<€50m/yr)."
- Substitution verdicts assume full CBAM cost pass-through to landed price with a
  static origin mix — no supply-response/re-sourcing model.

## 8 · Model Specification

**Status: implemented** (both the trade-exposure extract and the wired CBAM cost
engine are real, functioning code — see mismatch flag re: atlas under-detection of
the backend wiring).

**8.1 Purpose & scope.** Give a trade-compliance/procurement risk team an HS-code-
level view of EU import exposure to CBAM, sized against the platform's real
CBAM phase-in schedule and cost formula, with an origin-substitution
competitiveness screen.

**8.2 Conceptual approach.** A hand-compiled trade-pattern reference dataset
(volume, intensity, effective carbon price, policy flags per origin) is combined
with a live backend engine implementing the CBAM Art. 9/Art. 31 net-cost formula
and free-allocation phase-out schedule; the frontend performs no independent
re-derivation of the cost math beyond an identical offline fallback mirror.

**8.3 Mathematical specification.**
```
embedded_tCO2(sector, origin) = volume × cbam_scope_intensity(sector, origin) × 1e6
net_cbam_cost = max(0, E×P_ETS − E×P_domestic − E×P_ETS×freeAlloc%)
CBAM_factor%  = 100 − freeAlloc%
price(year)   = linear interpolation between nearest scenario knots (flat-extrapolated at the ends)
per_unit_premium = net_cbam_cost / (volume × 1e6)
pct_of_unit_value = per_unit_premium / (trade_value / volume) × 100
```
| Parameter | Value | Calibration source |
|---|---|---|
| Free-allocation schedule | 97.5%→0% (2026→2034) | EU ETS Art. 31 CBAM sectors free-allocation phase-out (real regulation dates) |
| ETS price scenarios | Current Trend / Ambitious / Conservative | Platform CBAM engine (`services/cbam_service.py`), not derived here |
| CBAM scope | direct-only (steel/aluminium/H2) vs direct+indirect (cement/fertilisers/electricity) | Regulation (EU) 2023/956 Annex II |
| Trade/intensity extract | ~2023-24 approximations | UN Comtrade / Eurostat COMEXT, hand-compiled |

**8.4 Data requirements.** The live engine needs no external key (it's the
platform's own service); trade-pattern precision would benefit from a CEPII BACI
bulk-data refresh at HS-6 granularity (stated explicitly as a known gap).

**8.5 Validation & benchmarking.** The frontend/backend cost-formula equivalence
was confirmed line-by-line in §7.2 (`localCbamCost` vs `calculate_cbam_cost`); the
Turkey/steel worked example in §7.4 was hand-computed against the real
`FREE_ALLOC_SCHEDULE` and `ETS_PRICE_SCENARIOS["Current Trend"]` constants
end-to-end across three vintages, including the linear-interpolation branch for a
non-knot year (2034), and reconciles to the CBAM-factor identity
`net = gross × (1 − freeAlloc%)` when the domestic credit is zero.

**8.6 Limitations & model risk.** Trade-pattern rows are approximate,
order-of-magnitude figures, not verified transaction-level Comtrade/BACI pulls;
domestic carbon-price "effectively paid" figures are conservative estimates
requiring documentary evidence for real filings; hydrogen rows are pure corridor
placeholders with zero current trade; the substitution analyzer assumes static
origin mix and full cost pass-through, with no re-sourcing elasticity modeled.

## 9 · Future Evolution

### 9.1 Evolution A — Live Comtrade/BACI refresh replacing the hand-compiled extract (analytics ladder: rung 2 → 3)

**What.** This is the most production-ready of the three CBAM modules: it genuinely calls the real platform CBAM engine (`cbam_service.py` via `/free-allocation-schedule`, `/ets-price-scenarios`, `/calculate-cost`) and a live UN Comtrade endpoint, over 60 CBAM sector×HS rows across the 6 covered sectors. Crucially, it is *honest about its data provenance*: `DATA_LABEL` explicitly states the trade extract is "hand-compiled approximations (UN Comtrade / Eurostat COMEXT ~2023-24) — refresh from CEPII BACI bulk for production precision." So the model and engine wiring are real; only the trade-flow snapshot is a manual approximation. Evolution A closes exactly the gap the module itself names.

**How.** (1) Replace the hand-compiled `CBAM_SECTORS` origins with a live Comtrade/CEPII BACI pull (the `LiveComtradeVerificationPanel` and `COMTRADE_API` wiring already exist — the module is built for this) so exposure reflects current EU import patterns per HS code and origin. (2) Wire the more advanced `cbam_calculator.py` endpoints the page doesn't yet call (`/calculate-emissions`, `/project-costs`, `/portfolio-exposure`, `/supplier-risk/{id}`) — the backend already exceeds the frontend. (3) The exemption/liable-trade logic (`isExempt`, `liableTradeEurBn`) validated against the actual CBAM scope definitions. (4) Rung 3: the origin-substitution analyzer (which ranks origins by CBAM-cost-per-unit) benchmarked against real supplier carbon prices. This module is the natural consolidation point for the CBAM trio — its backend is the fullest.

**Prerequisites.** CEPII BACI bulk access (or scaled Comtrade); the advanced `cbam_calculator.py` endpoints exposed to the frontend. **Acceptance:** trade flows refresh from a live bulk source (not hand-compiled); the advanced calculator endpoints are wired; exemptions match CBAM scope; substitution analysis uses real supplier carbon prices.

### 9.2 Evolution B — CBAM trade-strategy and supplier-risk copilot (LLM tier 2)

**What.** Procurement and trade teams ask "which origins minimise our CBAM cost per tonne of steel?", "what's our exposure matrix across all 6 sectors?", "how does our 2026-2034 cost projection ramp?", "which suppliers carry the highest CBAM risk?" — the copilot runs the Evolution-A exposure, cost-projection, substitution, and supplier-risk tools over live trade data, every figure tool-traced.

**How.** Tool schemas over the real `cbam_service.py`/`cbam_calculator.py` routes (the fullest CBAM backend on the platform); grounding corpus is this Atlas record plus the CBAM Regulation references. The copilot's honesty duty: it states the trade-data vintage (CBAM exposure shifts with import patterns) and the ETS-price scenario per projection, and the origin-substitution advice accounts for whether a lower-CBAM origin's carbon price is documented (the deduction requires evidence). Supplier-risk answers cite the `/supplier-risk` engine output. This is the CBAM tool set the Tier-3 trade/compliance desk orchestrator routes to.

**Prerequisites.** Evolution A's live trade refresh and the advanced endpoints wired — the current hand-compiled snapshot is honest but static, and a copilot should quote current exposure. **Acceptance:** every exposure, cost, and supplier-risk figure traces to a tool response; each states the trade-data vintage and ETS scenario; substitution advice notes the origin-carbon-price evidence requirement.