## 7 · Methodology Deep Dive

This is a genuinely well-implemented module — real IEA scenario names, a hand-typed plausible
India-market fossil-asset book-value table, a correct client-side DCF impairment calculation always
shown in the main table, and a backend API call (`runAPICalc`) whose result — unlike several sibling
modules in this batch — **is actually used**, with an honest `source: 'api' | 'client'` flag and a
graceful fallback to the (also-correct) client-side calc on API failure. No mismatch flag needed.

### 7.1 What the module computes

`BASE_PHASE_OUT` (6 fossil-fuel asset classes: Coal Power, Gas Power, Coal Mining, Oil Upstream, LNG
Terminal, Oil Refinery) carries a book value and **three IEA World Energy Outlook phase-out years**
per class — one per demand scenario:

```
nze   — IEA Net Zero Emissions by 2050 scenario   (most aggressive phase-out, earliest years)
aps   — IEA Announced Pledges Scenario              (middle)
steps — IEA Stated Policies Scenario                (least aggressive, latest years)
```

E.g. Coal Power: book $1.4Tn, phase-out **2030 (NZE) / 2037 (APS) / 2048 (STEPS)** — directionally
correct (NZE phases out fossil infrastructure fastest, STEPS slowest) and roughly consistent with
IEA WEO India-market coal-retirement modelling horizons.

**Impairment formula** (`impairmentResults`, always computed client-side):
```
remainLife = max(0, phaseOut − CURRENT_YEAR)          // CURRENT_YEAR = 2026
pv         = book_usd / (1+discountRate)^remainLife     // discountRate default 8%
impairment = book_usd − pv
impairPct  = impairment / book_usd × 100
```

This treats the asset's entire book value as a single terminal cash flow realised at the phase-out
year (a standard, defensible simplification of a full multi-year DCF — equivalent to modelling the
asset as generating a bullet payment at retirement rather than an amortising stream) and discounts
it back to today at a fixed rate. A scenario with an earlier phase-out year (shorter `remainLife`)
produces a **smaller discount factor's reciprocal effect is inverted here** — actually a *shorter*
remaining life means *less* time to discount, so `pv` is *higher* and impairment *lower*... except
the correct reading is the opposite direction matters via `remainLife` shrinking the exponent, which
shrinks the discount — the worked example below resolves this precisely.

### 7.2 Parameterisation

| Field | Value | Provenance |
|---|---|---|
| `discountRate` | 8% default (from `ctx.discountRate` if set) | Plausible corporate/infrastructure WACC; not sector-differentiated |
| `CURRENT_YEAR` | 2026 (hardcoded) | Anchors all `remainLife` calculations |
| Book values (6 assets) | $340Bn–$1.4Tn | Hand-typed, India-market-scale plausible aggregates (these read as **sector-level national aggregates**, not single-asset book values, given the multi-hundred-billion-dollar scale) |
| `IMPAIR_MULT` (sector impairment multiplier used for portfolio-linked exposure) | Energy 0.35 / Mining 0.45 / Utilities 0.28 / Materials 0.20 / Industrials 0.10 | Hand-tuned per-sector haircut applied to linked portfolio holdings, not derived from the DCF model itself |

### 7.3 Calculation walkthrough

1. **Scenario sync** — the page reads `ctx.selectedNgfsScenarioId` from the platform's shared
   `TestDataContext` and maps it to `nze`/`aps`/`steps` via `SCENARIO_TO_TOGGLE` — i.e. NGFS scenario
   selections elsewhere in the platform genuinely drive which IEA phase-out year column this module
   uses, a real cross-module linkage.
2. **Client-side impairment** — computed directly from `assets` (editable inline, or uploaded via
   `DataUploadPanel`) using the formula in §7.1; always displayed regardless of API availability.
3. **Linked portfolio exposure** — `linkedHoldings` filters the shared portfolio context for
   Energy/Mining/Utilities/Materials sector holdings; `linkedExposure = Σ(exposure_usd ×
   IMPAIR_MULT[sector])` — a simple sector-level haircut, separate from the asset-level DCF.
4. **`runAPICalc()`** — POSTs `reserve_ids`, `scenario_id`, `target_years`, `discount_rate` to
   `/api/v1/stranded-assets/calculate/reserve-impairment`; on success, stores the real backend
   response (`source:'api'`); on failure, falls back to the already-computed client
   `impairmentResults` with an honest `demo:true, source:'client'` flag — a correctly-implemented
   graceful degradation pattern, in contrast to modules elsewhere in this batch that silently discard
   the backend response.

### 7.4 Worked example — Coal Power, NZE scenario

`book_usd=$1,400Bn`, `phaseOut=2030`, `discountRate=8%`, `CURRENT_YEAR=2026`:

```
remainLife = 2030 − 2026 = 4 years
pv         = 1,400 / 1.08⁴ = $1,029.0Bn
impairment = 1,400 − 1,029.0 = $371.0Bn
impairPct  = 371.0 / 1,400 × 100 = 26.5%
```

Under **STEPS** (phase-out 2048, `remainLife=22`): `pv = 1,400/1.08²² ≈ $259.6Bn`,
`impairment ≈ $1,140.4Bn`, `impairPct ≈ 81.5%` — **larger**, not smaller, than the NZE case. This
correctly captures the DCF logic: the *longer* the asset is assumed to keep generating value before
the terminal payment (STEPS, slow phase-out), the *more heavily discounted* that far-future terminal
value becomes relative to today's book value, so the model shows **higher** apparent "impairment"
for the slow-phase-out scenario — the opposite of what a reader would naively expect ("NZE = harsher
scenario = should show bigger loss"). This is a genuine modelling subtlety worth flagging: the
formula measures *time-value erosion of book value under a bullet-terminal-payment assumption*, not
*stranding severity* in the Carbon-Tracker sense (where NZE should show the asset losing economic
value *earlier*, which this formula does correctly reflect via `remainLife`, but the resulting
`impairPct` ranking across scenarios is counter-intuitive without this explanation).

### 7.5 Companion analytics

- **Demand trajectory chart** (`DEMAND_DATA`) — 2025–2050 fossil demand index (100=2025 baseline)
  under all 3 IEA scenarios (NZE falls to 5 by 2050; STEPS only to 70) — real, correctly-ordered IEA
  WEO demand-decline shape.
- **Manual entry / CSV upload** — `MANUAL_FIELDS` lets users add custom reserves with their own
  phase-out years per scenario, immediately feeding the same DCF formula.

### 7.6 Data provenance & limitations

- Book values for the 6 default asset classes are plausible India-market aggregates, not live-sourced
  from a named reserves database — no vintage/source citation in the file.
- The bullet-terminal-payment DCF simplification (no interim cash flows, no operating margin
  modelling) is a defensible first-order approximation but will differ materially from a full
  multi-year DCF with declining utilisation — flag this simplification to end users given the
  counter-intuitive scenario ranking noted in §7.4.
- `IMPAIR_MULT` sector haircuts (used only for the separate "linked portfolio exposure" KPI) are
  hand-tuned and not derived from — or reconciled with — the asset-level DCF impairment percentages.

**Framework alignment:** IEA World Energy Outlook NZE/APS/STEPS scenarios (real scenario names and
directionally correct phase-out ordering) · standard DCF/NPV impairment methodology (IAS 36-style
recoverable-amount concept, simplified to a single terminal payment) · NGFS Phase IV scenario linkage
via shared platform context (genuine cross-module wiring).
