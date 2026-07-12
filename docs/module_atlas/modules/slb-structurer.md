# Slb Structurer
**Module ID:** `slb-structurer` · **Route:** `/slb-structurer` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `CheckChip`, `DEFAULT_MACC`, `DEFAULT_MULTI_KPIS`, `Kpi`, `Lbl`, `ModelNote`, `RAG_STYLE`, `RunBtn`, `VERDICT_STYLE`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DEFAULT_MULTI_KPIS` | 4 | `name`, `unit`, `by`, `bv`, `ty`, `tv`, `sector`, `step` |
| `DEFAULT_MACC` | 7 | `name`, `cost`, `kt` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtNum` | `(v, d = 2) => (v == null \|\| isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });` |
| `updMk` | `(i, key, v) => setMkpis((prev) => prev.map((k, j) => (j === i ? { ...k, [key]: v } : k)));` |
| `kpis` | `mkpis.filter((k) => k.on).map((k) => ({` |
| `updCall` | `(id, key, v) => setCalls((prev) => prev.map((c) => (c.id === id ? { ...c, [key]: v } : c)));` |
| `addCall` | `() => setCalls((prev) => [...prev, { id: prev.length ? Math.max(...prev.map((c) => c.id)) + 1 : 1, yr: 3, px: 100.0 }]);` |
| `updHist` | `(id, key, v) => setHist((prev) => prev.map((h) => (h.id === id ? { ...h, [key]: v } : h)));` |
| `addHist` | `() => setHist((prev) => [...prev, { id: prev.length ? Math.max(...prev.map((h) => h.id)) + 1 : 1, year: 2026, value: 280 }]);` |
| `updMacc` | `(id, key, v) => setMacc((prev) => prev.map((m) => (m.id === id ? { ...m, [key]: v } : m)));` |
| `addMacc` | `() => setMacc((prev) => [...prev, { id: prev.length ? Math.max(...prev.map((m) => m.id)) + 1 : 1, name: 'New measure', cost: 50, kt: 50 }]);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/slb-structuring/ref/pathways` | `ref_pathways` | api/v1/routes/slb_structuring.py |
| GET | `/api/v1/slb-structuring/ref/spo-checklist` | `ref_spo_checklist` | api/v1/routes/slb_structuring.py |
| POST | `/api/v1/slb-structuring/calibrate` | `calibrate` | api/v1/routes/slb_structuring.py |
| GET | `/api/v1/slb-structuring/ref/step-up-benchmarks` | `ref_step_up_benchmarks` | api/v1/routes/slb_structuring.py |
| POST | `/api/v1/slb-structuring/structure-multi` | `structure_multi` | api/v1/routes/slb_structuring.py |
| POST | `/api/v1/slb-structuring/step-down-call` | `step_down_call` | api/v1/routes/slb_structuring.py |
| POST | `/api/v1/slb-structuring/calibrate-history` | `calibrate_history` | api/v1/routes/slb_structuring.py |
| POST | `/api/v1/slb-structuring/ambition-analytics` | `ambition_analytics` | api/v1/routes/slb_structuring.py |
| POST | `/api/v1/slb-structuring/spo-preassessment` | `spo_preassessment` | api/v1/routes/slb_structuring.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `GET`, `__future__` *(shared)*, `datetime` *(shared)*, `fastapi` *(shared)*, `observation`, `public` *(shared)*, `published` *(shared)*, `pydantic` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `DEFAULT_MACC`, `DEFAULT_MULTI_KPIS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **11** other module(s).

| Connected module | Shared via |
|---|---|
| `maturity-wall-monitor` | table:public |
| `vcm-cross-registry-tracker` | table:public |
| `vcm-registry-analytics` | table:public |
| `just-transition-finance-hub` | table:public |
| `just-transition-adaptation` | table:public |
| `just-transition-intelligence` | table:public |
| `sovereign-corporate-bridge` | table:public |
| `just-transition` | table:public |
| `just-transition-finance` | table:public |
| `ppa-xva-engine` | table:published |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

SLB Structurer (NX2-05) is a sustainability-linked-bond structuring desk. All math runs in the
backend engine, `backend/api/v1/routes/slb_structuring.py` (1,200 lines, six POST endpoints + three
GET reference endpoints); the 1,084-line frontend page (`SlbStructurerPage.jsx`) is a pure
API-driven display — every number on the page traces to a live backend call, with no independent
frontend arithmetic (confirmed by reading the full page: every KPI, chart and table is populated
straight from a `POST`/`GET` response, and the "Idle/Live/Demo" badges gate on the request status
rather than falling back to a client-side estimate).

| Endpoint | Purpose |
|---|---|
| `POST /calibrate` | Single-KPI SPT ambition vs sector pathway + coupon step-up valuation |
| `POST /structure-multi` | Up to 3 KPIs, each with its own SPT/pathway/step-up; independent-sum and joint-trigger valuation |
| `POST /step-down-call` | Two-way (step-up/step-down) coupon structure + issuer call-to-avoid-step-up incentive |
| `POST /calibrate-history` | Data-driven p(miss) from the issuer's own KPI history (ln-OLS trend), blended with the logistic ambition mapping |
| `POST /ambition-analytics` | Cost-of-ambition sweep, greenium × step-up combined economics, MACC-linked capex sensitivity |
| `POST /spo-preassessment` | Structured ICMA SLBP five-component pre-screen → RAG score |
| `GET /ref/pathways`, `/ref/spo-checklist`, `/ref/step-up-benchmarks` | Hand-authored, labeled reference tables |

### 7.2 SPT ambition assessment

The implied annual reduction rate is the geometric (CAGR) rate from baseline to SPT:
```
r_spt = [1 − (SPT_value / baseline_value)^(1 / (target_year − baseline_year))] × 100      (%/yr)
gap   = r_spt − sector_pathway_slope                                                      (pp/yr)
```
`gap ≥ +0.5 pp/yr → "ahead"`, `gap ≤ −0.5 pp/yr → "behind"`, else `"aligned"` (band is a request
parameter, default 0.5 pp/yr). The sector pathway slope comes from a hand-authored, cited table
(`SECTOR_PATHWAYS`, 12 sectors, each row citing a published source — IEA NZE 2023, SBTi SDA/CSA/FLAG,
CRREM v2, IMO 2023 GHG Strategy, TPI, EU fleet standards) or a user override.

### 7.3 The logistic p(miss) mapping — formula and worked example

This is the module's central **labeled model assumption** (not market data, stated in both the
docstring and every response payload):
```
p_miss = p_floor + (p_cap − p_floor) / (1 + exp(−(gap − midpoint_pp) / slope_pp))
```
Defaults: `p_floor=0.05, p_cap=0.95, midpoint_pp=1.0, slope_pp=0.75` — all four exposed and editable
in every endpoint that uses it. It is monotonically increasing in the ambition gap: a harder target
(more ambitious than the sector pathway) maps to a higher probability the issuer misses it, which is
the correct sign for a step-up option (harder target → more valuable contingent coupon feature). At
`gap=0` the formula evaluates to ≈0.238 miss probability and at `gap=+2pp/yr` to ≈0.762 — both cited
in the docstring as consistent with published SLB step-up trigger studies showing a "minority-but-
material" share of targets missed.

**Worked example** (values independently recomputed from the exact formula, not copied from the
docstring): a power-generation issuer, baseline 2023 = 320 tCO2e/GWh, SPT 2030 = 180 tCO2e/GWh
(`n_years = 7`, `ratio = 180/320 = 0.5625`):

| Step | Computation | Result |
|---|---|---|
| r_spt | `1 − 0.5625^(1/7)` × 100 = `1 − 0.92110` × 100 | **7.8908 %/yr** |
| sector slope (power_generation) | from `SECTOR_PATHWAYS` (IEA NZE 2023 / SBTi SDA) | 7.0 %/yr |
| gap | 7.8908 − 7.0 | **+0.8908 pp/yr** → verdict "ahead" (≥ 0.5 band) |
| z | (0.8908 − 1.0) / 0.75 | −0.14566 |
| p_miss | 0.05 + 0.90/(1+exp(0.14566)) = 0.05 + 0.90/2.1568 | **0.4673** |

### 7.4 Step-up valuation — digital-option annuity

```
PV(step-up per 100 face) = p_miss × (step_up_bp/100) × A_stepped
A_stepped = Σ DF(t_i) over coupon dates whose payment calendar year falls STRICTLY AFTER
            spt_target_year + 1  (target observed at year-end, verified, then applied)
DF(t) = (1 + discount_rate)^-t
bp_running_equivalent = PV_per_100 / (0.01 × A_full)
```
Continuing the worked example above with `coupon_step_up_bp=25`, `discount_rate=4%`,
`bond_tenor=8yrs`, `observation_date=2024-01-01` (`obs_year_frac=2024.0`), `spt_target_year=2030`
(so the step-up window opens for coupons paid in calendar years **after 2031**):

| Period | Pay year | DF | In step-up window? |
|---|---|---|---|
| 1–7 | 2025–2031 | 0.9615 → 0.7599 | No (2031 is not *after* 2031) |
| 8 | 2032 | 0.73069 | **Yes** |

`A_full = 6.73274`, `A_stepped = 0.73069` (only period 8 qualifies). `PV_per_100 = 0.4673 × 0.25 ×
0.73069 = 0.08536`. On a $500M issue: `value_mn = 0.08536/100 × 500 = $0.4268M`;
`bp_running_equivalent = 0.08536/(0.01×6.73274) = 1.268 bp` — the step-up feature is worth roughly
1.27bp of running spread over the bond's full remaining life.

### 7.5 Historical-trajectory calibration and the OLS-vs-logistic blend

`POST /calibrate-history` adds a **second, data-driven** p(miss) estimate from the issuer's own KPI
history, then blends it with the logistic ambition mapping at a **visible user weight**:
```
1. ln-OLS on the KPI history:  ln(KPI) = a + b·year   (closed-form; b<0 = declining/good KPI)
   trend_pct/yr = (e^b − 1) × 100
2. Extrapolate to the SPT year:  ln_hat = a + b·T ;  extrap = e^ln_hat
   prediction std error: s_proj = s·sqrt(1 + 1/n + (T−ȳear)²/Sxx)   (standard OLS prediction interval)
3. p_history = Φ((ln_hat − ln(SPT)) / s_proj)     via math.erf, closed-form normal CDF
   MODEL ASSUMPTION: log-normal residuals around the log-linear trend
4. p_blend = w·p_history + (1−w)·p_logistic(gap)      — gap computed vs the EARLIEST history point
```

**Worked example** using the page's own default 5-year history (2021: 365, 2022: 348, 2023: 320,
2024: 301, 2025: 288 tCO2e/GWh) and SPT 2030 = 180:

| Quantity | Computation | Result |
|---|---|---|
| ln-OLS slope b | closed-form on 5 points | −0.061897 |
| trend %/yr | (e^b − 1)×100 | **−6.00 %/yr** |
| extrapolated 2030 KPI | e^(a+b×2030) | **209.52** (vs SPT 180) |
| s_proj | s·sqrt(1+1/5+(2030−2023)²/Sxx) | 0.02874 |
| p_history | Φ((ln(209.52)−ln(180))/0.02874) | **≈1.0000** (0.99999994) |
| gap (baseline = earliest point, 2021=365) | r_spt=1−(180/365)^(1/9)... → gap = r_spt−7.0 | +0.5543 pp/yr |
| p_logistic | logistic(0.5543) | **0.3701** |
| p_blend (w=0.5, the page default) | 0.5×1.0000 + 0.5×0.3701 | **0.6850** |

This is a genuinely useful cross-check to surface: **the two legs disagree sharply** here
(p_history ≈ 1.0 vs p_logistic ≈ 0.37) because the historical linear trend (−6.00%/yr, extrapolating
to 209.5) still sits well above the 180 SPT even after 9 years of extrapolation, while the ambition-
gap logistic model only sees a modest +0.55pp/yr stretch over the sector pathway. The visible 50/50
blend (0.685) is a stated convention precisely so a desk user can see and adjust this divergence
rather than have it silently averaged away — the blend weight is the whole point of exposing both
legs. This is exactly the kind of surfaced model tension the module doctrine calls for: neither leg
is "wrong," but a large p_history/p_logistic gap is itself informative about how tightly the log-
linear trend fits versus how the SPT compares to the cited sector pathway.

### 7.6 Multi-KPI, step-down/call, MACC and SPO — brief treatment

- **Multi-KPI** (`/structure-multi`, up to 3 KPIs): independent mode sums each KPI's own
  `p_miss × step_up × A_stepped`; joint mode multiplies the per-KPI `p_miss` values under a
  **documented independence assumption** (`p_joint = Π p_i`), explicitly flagged as a conservative
  lower bound since real decarbonization KPIs are typically positively correlated. A structural
  check (`joint ≤ Σ independent`) is returned and always true by construction (`p_joint ≤ p_i` for
  every `i`).
- **Step-down + call** (`/step-down-call`): two-way expected cost
  `E[cost]/100 = p·(up_bp/100)·A_w − (1−p)·(down_bp/100)·A_w`; issuer call-to-avoid-step-up incentive
  `= p_miss × [(up_bp/100)·A_w(after k) − (call_price−100)·DF(k)]`, with YTC/YTM solved by bisection
  on the *stepped* (conditional-on-miss) coupon path.
- **Ambition analytics / MACC** (`/ambition-analytics`): a cost-of-ambition sweep re-runs the
  logistic at 13 SPT stringency levels; a merit-order MACC allocator funds abatement measures
  cheapest-$/t-first from an annualized capex budget, converts funded abatement to a
  `funded_reduction_pp` and subtracts it from the ambition gap before re-evaluating `p_miss` — a
  stated **planning convention**, not an engineering emissions model.
- **SPO pre-assessment** (`/spo-preassessment`): a weighted RAG score (materiality 25%, ambition 35%,
  verification 25%, structure/reporting 15%) against the ICMA SLBP five components, explicitly
  labeled "a desk pre-screen, not an SPO."

### 7.7 Data provenance & limitations

- **Hand-authored, cited reference tables**: `SECTOR_PATHWAYS` (12 rows, each citing IEA NZE 2023 /
  SBTi / CRREM v2 / IMO 2023 / TPI / EU fleet standards) and `SLB_STEP_UP_BENCHMARKS` (7 named,
  publicly reported SLB issues — Enel, Novartis, Chanel, Tesco, PPC, H&M — summarized from public
  disclosures, labeled "approximate, verify against the original prospectus").
- **Model assumptions, clearly labeled as such everywhere they surface**: the logistic p(miss)
  mapping (§7.3) and the log-normal residual assumption behind `p_history` (§7.5) are both explicitly
  flagged "MODEL ASSUMPTION, not market data" in the docstring and echoed in every relevant response.
- **User-supplied, non-fabricated**: all KPI baselines/targets/history, bond terms, MACC measure
  costs/potentials, and the four logistic parameters are request inputs with sensible defaults, never
  invented by the engine.
- **Independence assumption is flagged as conservative**: joint-trigger valuation explicitly states
  that positively-correlated real-world KPIs would raise `p_joint` toward `min(p_i)`, so the
  independent-product figure is a documented lower bound, not a best estimate.
- No guide↔code mismatch found: the frontend `ModelNote` components and the backend docstring
  describe the same formulas verified above.

## 8 · Model Specification

**Status: implemented.**

**8.1 Purpose & scope.** Structure and value a sustainability-linked bond's coupon step-up/step-down
feature end to end: calibrate SPT ambition against a cited sector decarbonization pathway, price the
contingent coupon adjustment as a probability-weighted annuity, stress it against issuer call
options and multi-KPI/joint-trigger structures, cross-check the miss probability against the
issuer's own historical trend, link it to a MACC-based capex program, and pre-screen it against the
ICMA SLBP for SPO readiness.

**8.2 Conceptual approach.** The core insight is that an SLB step-up is a **digital (binary) option**
on whether the issuer misses a discrete, observable trigger (the SPT at a stated observation date).
Its value is therefore `P(miss) × (payoff) × (annuity factor over the window the payoff applies)` —
exactly the standard binary-option annuity decomposition, with `P(miss)` supplied by an explicit,
parameterized logistic function of ambition rather than an implied-volatility surface (there is no
liquid market for SLB-KPI optionality to calibrate one). A second, independent data-driven estimate
(log-linear trend extrapolation with a normal prediction interval) is offered as a cross-check and
blended at a visible weight rather than silently overriding the ambition-based estimate.

**8.3 Mathematical specification.**
```
r_spt   = [1 − (SPT/baseline)^(1/n)] × 100 ;  gap = r_spt − pathway_slope
p_miss  = p_floor + (p_cap−p_floor) / (1+exp(−(gap−midpoint)/slope))                 [logistic]
PV/100  = p_miss × (step_bp/100) × A_stepped ,  A_stepped = Σ_{t: pay_yr>target+1} (1+y)^-t
p_hist  = Φ((ln(extrap) − ln(SPT)) / s_proj) ,  s_proj = s·sqrt(1+1/n+(T−ȳ)²/Sxx)   [ln-OLS + erf CDF]
p_blend = w·p_hist + (1−w)·p_logistic
p_joint = Π_i p_miss_i                                                              [independence assumption]
funded_pp = (Σ MACC-funded tCO2e/yr ÷ base_emissions × 100) / years_to_target ; residual = gap−funded_pp
```

**8.4 Data requirements.** KPI baseline/target values and years, sector (or a slope override), bond
terms (tenor, coupon, size, discount rate), the four logistic parameters, an optional actual-KPI
history (≥3 points), an optional MACC measure list (cost $/t, potential kt/yr), and optional call
schedule (years-from-observation, call price). All parameters are request-supplied; the only
persisted data are the two labeled reference tables (sector pathways, step-up benchmarks).

**8.5 Validation & benchmarking.** §7.3–§7.5 above are the independent hand-traces performed for
this deep-dive: the logistic formula, the digital-annuity PV, and the ln-OLS/normal-CDF blend were
each recomputed from the raw formulas in `slb_structuring.py` and matched the endpoint's own
arithmetic to within rounding. For production calibration, the natural next step is back-testing the
logistic's floor/cap/midpoint/slope against a larger sample of realized SLB step-up trigger outcomes
(the benchmark table currently has 7 named issues, not enough for a statistical fit) and validating
`p_history`'s log-normal residual assumption against longer KPI histories than the 5-year default.

**8.6 Limitations & model risk.** The logistic p(miss) is a stated, non-market-calibrated assumption
— useful for scenario/sensitivity work, not a substitute for an issuer-specific credit or ESG
research view. The joint-trigger independence assumption is a documented lower bound, understating
true joint-miss probability for positively correlated KPIs. The MACC-to-ambition-gap linkage
(§7.6) is an explicit "planning approximation, not an engineering model" — funded abatement in
tCO2e/yr is converted to a pp/yr ambition credit by simple division, ignoring measure lead times,
technology risk and interaction effects between measures. The SPO pre-assessment score is a stated
scoring convention, not an accredited second-party-opinion methodology, and is labeled as such in
every response.

## 9 · Future Evolution

### 9.1 Evolution A — History-calibrated p(miss) as the default, with correlated multi-KPI joint risk (analytics ladder: rung 3 → 4)

**What.** This is a flagship tier-A desk: all math runs in a 1,200-line backend (6 POST + 3 GET routes), the frontend does zero independent arithmetic, and the reference tables are hand-authored *and cited* (`SECTOR_PATHWAYS` rows cite IEA NZE 2023, SBTi SDA/CSA/FLAG, CRREM v2, IMO 2023, TPI). It already reaches rung 3 — the logistic ambition mapping is calibrated to sector pathways, and `POST /calibrate-history` derives a data-driven p(miss) from the issuer's own KPI history (ln-OLS trend). The gap to rung 4 is that the predictive path is optional and the multi-KPI joint mode uses an explicit independence assumption (`p_joint = Π p_i`) that §7.6 flags as a conservative lower bound because real decarbonisation KPIs are positively correlated.

**How. **(1) Make `/calibrate-history` the default whenever sufficient KPI history exists, falling back to the logistic mapping with a `calibration_basis` flag (mirrors the platform's resolution-tier honesty pattern). (2) Add a correlation parameter to `/structure-multi` joint mode — a Gaussian-copula or explicit correlation-matrix aggregation of per-KPI p(miss), so joint risk sits between the independence lower bound and the perfect-correlation upper bound, both reported. (3) Widen the historical calibration from single-issuer OLS to a sector-pooled prior (shrinkage) so thin issuer histories borrow strength. (4) Backtest realised SPT outcomes from the `SLB_STEP_UP_BENCHMARKS` named issues (Enel, Novartis, Chanel, Tesco) where public.

**Prerequisites.** Issuer KPI history is user-supplied today; a persisted `slb_kpi_history` table enables sector pooling. **Acceptance:** an issuer with history defaults to the empirical p(miss); joint multi-KPI risk under correlation ρ>0 exceeds the independence product and is bounded by min(p_i).

### 9.2 Evolution B — SLB structuring analyst over the nine endpoints (LLM tier 2)

**What.** A tool-calling structuring analyst that operates the whole desk: "calibrate a 30% SPT for this steel issuer against SBTi", "add a second water-intensity KPI and price the joint step-up", "run the cost-of-ambition sweep and tell me where the greenium offsets the step-up". Each is a call to `POST /calibrate`, `/structure-multi`, or `/ambition-analytics`; the analyst narrates the returned economics and the SPO pre-assessment RAG score, never computing coupons itself.

**How.** Tool schemas from the module's OpenAPI spec (6 POST + 3 GET, all compute/read-only); grounding corpus = this Atlas page (§7.2 SPT ambition math and the cited `SECTOR_PATHWAYS`). The `/spo-preassessment` output — a weighted RAG against ICMA SLBP five components, already labelled "a desk pre-screen, not an SPO" — becomes the copilot's structured verdict, with that caveat asserted in every answer. Provenance UX shows the endpoint calls and the cited pathway source per SPT.

**Prerequisites.** None hard — the backend is the platform's cleanest API-driven module; the copilot inherits its no-frontend-arithmetic discipline directly. **Acceptance:** every coupon, greenium, and p(miss) figure in an answer traces to a tool call in the session; the SPO score always carries its "not an SPO" disclaimer; asking for a sector outside the 12 `SECTOR_PATHWAYS` rows prompts a user-override request, not a fabricated slope.