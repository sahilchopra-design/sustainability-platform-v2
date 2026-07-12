## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *Circular Economy Value
> Model* (`CircularValue = ResaleRevenue + MaterialRecoveryValue + CustomerRetentionUplift −
> ReverseLogisticsCost − RemanufacturingCost`) and a circularity score defined as
> `MaterialsRetained / TotalMaterialsInput`. **Neither formula exists in this module's code.**
> The page (`CircularEconomyFinancePage.jsx`) renders 65 synthetic companies whose every metric —
> including the 0–100 circularity score — is drawn from the seeded PRNG `sr()`, then aggregated
> with means/sums. The domain's *real* deterministic methodology lives in
> `backend/services/circular_economy_engine.py` (EMF MCI, WBCSD CTI, ESRS E5, EPR, CRM, LCA) and
> is exposed via `/api/v1/circular-economy/*` routes — **but this page never calls those
> endpoints** (no fetch/axios in the file). Sections below document both layers.

### 7.1 What the frontend actually computes

65 companies are fabricated at module load: `sector = SECTORS[⌊sr(i·7)·8⌋]`, `country =
COUNTRIES[⌊sr(i·13)·10⌋]`, and per-company metrics all follow `lo + sr(i·k)·range`:

| Field | Formula | Range |
|---|---|---|
| `circularityScore` | `Math.round(20 + sr(i·3)·75)` | 20–95 |
| `materialEfficiency` | `40 + sr(i·5)·55` | 40–95 % |
| `wasteRecoveryRate` | `30 + sr(i·9)·65` | 30–95 % |
| `productLifeExtension` | `1 + sr(i·17)·8` | 1–9 yr |
| `revenueFromCircular` | `10 + sr(i·23)·490` | $10–500M |
| `circularCapex` | `5 + sr(i·29)·295` | $5–300M |
| `carbonSaving` | `500 + sr(i·31)·49500` | 500–50,000 tCO₂e/yr |
| `circularBondIssued` | `sr(i·43) > 0.6` | ~40 % true |

Tier is a threshold rubric on the score: `<35 Emerging, <55 Developing, <75 Advanced, else
Leader`. Derived headline outputs are straight aggregations over the filter set:
`avgCircularity = Σscore/n`, `totalCarbonSaving = Σ`, `pctBonds = issued/n·100`, and the one
what-if calculation `carbonValueM = totalCarbonSaving × carbonPrice / 10⁶` driven by the
carbon-price slider ($20–200/t, default $65 — close to the 2024–25 EU ETS range). The
`materialCostMultiplier` slider (×1.0–3.0) is displayed as a caption on the Capex KPI but is
**not multiplied into any number** — it is cosmetic.

### 7.2 The backend engine (real, deterministic — currently unwired to this page)

`circular_economy_engine.py` (E55) is explicitly "no metric fabricated with a random draw":

- **MCI (EMF v1.3):** `utility_factor = 1/lifetime_multiplier`; `MCI = min(1, (RIF + WRF)/2 ×
  utility_factor)` where RIF = recycled input fraction, WRF = waste recovery fraction. Sector
  benchmarks table (`MCI_BENCHMARKS`): metals 0.55, automotive 0.45, chemicals 0.40,
  construction 0.35, electronics 0.30, plastics 0.28, textiles 0.25, food 0.20.
  *Note:* this is a simplified proxy of EMF's published MCI (`MCI = 1 − LFI·F(X)`, with
  `LFI = (V+W)/(2M + (W_F−W_C)/2)` and utility `X = (L/L_av)(U/U_av)`); the code replaces the
  Linear Flow Index with a symmetric mean of RIF and WRF.
- **WBCSD CTI v4.0:** composite = weighted mean of 4 dimensions — circular product design 0.30,
  waste recovery 0.25, recycled content 0.25, product lifetime 0.20 — with weight renormalisation
  when dimensions are unreported; tiers A ≥80, B ≥60, C ≥40, D otherwise.
- **ESRS E5:** disclosure completeness = share of reported components that are true (4
  quantitative + up to 3 caller-reported qualitative booleans); grades A ≥80, B 65–80, C 50–65,
  D <50; `recycled_outflows_pct = (outflows − waste)/outflows`.
- **EPR:** `cost = tonnes × rate(country)` with published PRO reference rates, e.g. packaging
  DE €130/t, FR €120/t; e-waste DE €550/t; battery EU €300/t (Dir 94/62/EC, WEEE 2012/19/EU,
  Batteries Reg (EU) 2023/1542).
- **CRM risk:** screen against the EU CRM Act 2023 34-material list; dependency = mean of
  caller-supplied supply-risk scores; ratings Critical ≥70, High ≥50, Medium ≥30.
- **LCA (ISO 14044):** cradle-to-gate sector factors (automotive 8,000 kgCO₂e/unit, metals
  3,000, construction 2,000…); cradle-to-cradle = gate × (1 − benefit%); annual saving in tCO₂.
- **Overall circularity:** `0.30·ESRS + 0.30·(MCI×100) + 0.20·CTI + 0.20·LCA_benefit%`, risk
  rating Low ≥70 / Medium ≥50 / High ≥30 / Critical; green-finance eligible if score ≥55 and
  LCA benefit ≥15%; EU-Taxonomy-aligned flag at score ≥60.

### 7.3 Calculation walkthrough (page)

Filters (sector/country/tier) → `filtered` → KPI aggregations (§7.1) → per-sector bar charts
(`sectorBarData`, `wasteBarData` = sector means of score / waste recovery), top-8 country
revenue totals (`countryRevData`), and a Capex-vs-carbon scatter
(`{x: circularCapex, y: carbonSaving/1000}`). Division guards: `n = Math.max(1,
filtered.length)` and a ternary on `pctBonds` prevent NaN on empty filters.

### 7.4 Worked example — company i = 2

`sr(s) = frac(sin(s+1)·10⁴)`. For i = 2: `sr(6) ≈ 0.5697` → sector = `SECTORS[⌊0.5697·8⌋=4]` =
Construction; `sr(4) ≈ 0.5892` → circularityScore = `round(20 + 0.5892·75)` = **64** →
tier **Advanced** (55 ≤ 64 < 75). If this company's carbonSaving were 25,000 tCO₂e and it were
the only row after filtering, the KPI row would show Avg Circularity 64.0 and carbon value
`25,000 × $65 / 10⁶ = $1.6M` at the default slider.

### 7.5 Data provenance & limitations

- **All 65 companies are synthetic**, generated by the platform PRNG
  `sr(seed) = frac(sin(seed+1)×10⁴)`; names are template combinations ("CircuTech AG"…). No
  real issuer data, no backend call, no reference_data usage.
- Frontend "circularity score" has no methodology — it is a random level, not the guide's
  `MaterialsRetained/TotalMaterialsInput` nor the engine's MCI.
- The material-cost slider is display-only; carbon value uses a single flat price with no
  discounting or vintage curve.
- The backend engine is methodologically sound but simplified: MCI omits the EMF linear-flow
  denominator `2M + (W_F−W_C)/2`; ESRS E5 scoring is completeness-based, not datapoint-level
  (EFRAG lists ~30 E5 datapoints); EPR rates are single reference points, not eco-modulated fee
  schedules.

### 7.6 Framework alignment

- **CSRD ESRS E5** — engine grades disclosure completeness across E5-1…E5-5 (policies, actions,
  targets, resource inflows, resource outflows); real E5 compliance is datapoint-level per EFRAG IG.
- **EMF MCI v1.3** — engine computes a simplified MCI; the authentic indicator combines virgin
  feedstock V, unrecoverable waste W and a utility factor X into `MCI = 1 − LFI·(0.9/X)`.
- **WBCSD CTI v4.0** — CTI's actual framework measures %-circular inflow/outflow, water and
  energy circularity; the engine approximates it with 4 weighted dimensions.
- **EU CRM Act 2023** — 34 CRMs, 2030 targets (10% extraction / 40% processing / 25% recycling /
  ≤65% single-country) reproduced verbatim in `EU_CRM_2030_TARGETS`.
- **ISO 14044** — LCA sub-module follows the cradle-to-gate vs cradle-to-cradle comparison
  pattern with sector emission factors.

## 8 · Model Specification — Circular Economy Company Scoring & Value Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Replace the synthetic 65-company universe with a real scored universe supporting (i) circular
bond/loan screening and (ii) ESRS E5 client benchmarking. Coverage: listed corporates in the 8
page sectors, EU + OECD; annual refresh.

### 8.2 Conceptual approach

Two-block design mirroring **WBCSD CTI v4.0** (measured circularity) and the **Ellen MacArthur
/ Granta MCI** (product-material flow), with a financial overlay modelled on **ING's Circular
Economy Finance framework** and **S&P Trucost** resource-intensity data. The existing backend
engine already implements the score arithmetic — the model work is data-driven calibration and
wiring, not new math.

### 8.3 Mathematical specification

```
RIF_i = recycled_inflow_t / total_inflow_t              (from ESRS E5-4 disclosures)
WRF_i = recovered_outflow_t / total_outflow_t           (E5-5)
X_i   = (L_i/L_av)·(U_i/U_av)                           (EMF utility factor)
MCI_i = max(0, 1 − LFI_i · 0.9/X_i),  LFI_i = (V_i+W_i)/(2M_i + (W_Fi−W_Ci)/2)
CTI_i = 0.30·Design + 0.25·WRF·100 + 0.25·RIF·100 + 0.20·Lifetime   (engine weights)
Score_i = 0.30·ESRS_i + 0.30·MCI_i·100 + 0.20·CTI_i + 0.20·LCAbenefit_i   (engine §8 weights)
CircularValue_i = ResaleRev + MatRecovery·P_mat − RevLog − Reman        (guide formula, per EMF 2015)
CarbonValue_i = ΔtCO₂e_i × P_CO₂(s,t)                                    (scenario carbon price)
```

| Parameter | Calibration source |
|---|---|
| Sector MCI benchmarks | Circle Economy *Circularity Gap Report* (global 7.2–8.6%); EMF sector studies |
| `P_mat` recovered-material prices | LME/Fastmarkets scrap indices; EEX recycled-plastic futures |
| `P_CO₂(s,t)` | NGFS Phase IV scenario prices; EU ETS forward curve (ICE) |
| EPR fee schedules | National PRO published tariffs (e.g. CITEO FR, Der Grüne Punkt DE) — replaces single-point `EPR_COSTS` |
| LCA factors | ecoinvent v3.10 or EPA USEEIO (free) — replaces the 9 hard-coded `LCA_GATE_FACTORS` |

### 8.4 Data requirements

ESRS E5 quantitative datapoints (inflows/outflows/waste, from CSRD filings 2025+), company BoM
or Trucost material-intensity estimates, EPR registrations, recovered-material price feeds.
Already in platform: `circular_economy_engine` functions, `/api/v1/circular-economy/*` routes,
`reference_data` ingestion pattern (CEDA/OWID) reusable for ecoinvent-lite factors.

### 8.5 Validation & benchmarking plan

Reconcile MCI against EMF's published product case studies (tolerance ±0.05); benchmark company
scores against WBCSD CTI pilot disclosures and Circulytics archive; backtest the circular-bond
flag against actual CBI-labelled circular issuance 2021–25 (target AUC ≥ 0.7); sensitivity on
material prices ±30% and carbon price ±50%.

### 8.6 Limitations & model risk

CSRD E5 data availability is thin pre-2026 (first wave filings) — fallback to Trucost-style
sector estimates flagged with a PCAF-analogue data-quality score; recovered-material prices are
volatile and regionally fragmented; MCI is product-level while scoring is entity-level, so
aggregation across product lines needs revenue weights (disclosure-limited). Conservative
fallback: report score ranges (P25–P75) rather than point values when ≥2 inputs are estimated.
