# Blended Finance Structuring
**Module ID:** `blended-finance` · **Route:** `/blended-finance` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
MDB and DFI risk-layering analytics for blended finance structures covering first-loss tranche sizing, concessional capital IRR subsidy calculations, and commercial co-investor returns across 5 deal archetypes. Applies OECD Blended Finance Principles and DFI Working Group models to structure climate and development finance transactions.

> **Business value:** Blended finance is the primary mechanism for mobilising private capital into climate-vulnerable and emerging market projects that cannot meet commercial return thresholds unaided. Rigorous first-loss sizing and cascade discipline ensure that concessional capital is used only where necessary, maximising its leverage effect and preserving DFI financial sustainability.

**How an analyst works this module:**
- Select deal archetype from 5 templates (climate, health, agri, infrastructure, SME)
- Capital Stack tab configures MDB, DFI, concessional, and commercial tranche sizes
- IRR Waterfall shows returns per tranche under base and stress scenarios
- Cascade Check tests commercial-only viability before applying concessionality
- Impact Analytics quantifies development outcomes per $ deployed
- Term Sheet Export generates OECD-aligned blended finance summary

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BF_INSTRUMENTS`, `Badge`, `BlendedFinancePage`, `Btn`, `Card`, `KPI`, `PIE_COLORS`, `SAMPLE_DEALS`, `SDG_COLORS`, `SDG_NAMES`, `Section`, `Slider`, `SortHeader`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `BF_INSTRUMENTS` | 7 | `name`, `description`, `typical_rate`, `risk_absorption`, `providers`, `color`, `avgRate`, `dealRange` |
| `SAMPLE_DEALS` | 16 | `project`, `sector`, `geography`, `totalSize`, `concPct`, `commPct`, `grantPct`, `eqPct`, `sdgs`, `status`, `dfi`, `leverage`, `year` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `sliderTotal` | `Object.values(sliders).reduce((s, v) => s + v, 0);` |
| `allDeals` | `useMemo(() => [...SAMPLE_DEALS, ...customDeals], [customDeals]); const sectors = useMemo(() => ['All', ...new Set(allDeals.map(d => d.sector))], [allDeals]);` |
| `statuses` | `useMemo(() => ['All', ...new Set(allDeals.map(d => d.status))], [allDeals]);` |
| `totalDealValue` | `useMemo(() => allDeals.reduce((s, d) => s + d.totalSize, 0), [allDeals]);` |
| `totalConcessional` | `useMemo(() => allDeals.reduce((s, d) => s + d.totalSize * d.concPct / 100, 0), [allDeals]);` |
| `totalCommercial` | `useMemo(() => allDeals.reduce((s, d) => s + d.totalSize * d.commPct / 100, 0), [allDeals]);` |
| `avgLeverage` | `useMemo(() => allDeals.length ? (allDeals.reduce((s, d) => s + d.leverage, 0) / allDeals.length) : 0, [allDeals]);` |
| `allSdgs` | `useMemo(() => { const s = new Set(); allDeals.forEach(d => d.sdgs.forEach(x => s.add(x))); return s; }, [allDeals]); const allGeos = useMemo(() => new Set(allDeals.map(d => d.geography)), [allDeals]);` |
| `mobilizationMultiple` | `useMemo(() => { const conc = sliders.concessional + sliders.guarantees + sliders.firstLoss + sliders.ta;` |
| `comm` | `sliders.commercial + sliders.equity;` |
| `costCompare` | `useMemo(() => [ { name:'Blended', cost: +avgBlendedCost }, { name:'Pure Commercial', cost: 8.0 }, { name:'Pure Concessional', cost: 3.0 }, { name:'Current Sliders', cost: +avgBlendedCost }, ], [avgBlendedCost]);` |
| `dfis` | `d.dfi.split(/\s*\+\s*/);` |
| `riskWaterfall` | `useMemo(() => [ { layer:'Technical Assistance', pct: sliders.ta, risk:'De-risking / Grant', cumulative: sliders.ta, color:'#d97706' }, { layer:'First-Loss Equity', pct: sliders.firstLoss, risk:'Absorbs first losses', cumulative: sliders.ta + sliders.firstLoss, color:'#7c3aed' }, { layer:'Concessional Debt', pct: sliders.concessional, risk` |
| `rows` | `allDeals.map(d => `${d.id},${d.project},${d.sector},${d.geography},${d.totalSize},${d.concPct},${d.commPct},${d.grantPct},${d.eqPct},${d.leverage},${d.sdgs.join(';')},${d.status},${d.dfi},${d.year}`);` |
| `blob` | `new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });` |
| `chartData` | `Object.entries(sectorData).sort((a,b) => b[1] - a[1]).map(([k,v]) => ({ name:k, value:v }));` |
| `totalVal` | `deals.reduce((s,d) => s + d.totalSize, 0);` |
| `pctVal` | `allDeals.length ? (deals.length / allDeals.length * 100) : 0;` |
| `conc` | `Math.round(d.totalSize * d.concPct / 100);` |
| `grant` | `Math.round(d.totalSize * d.grantPct / 100);` |
| `cost` | `((d.concPct * 3 + d.grantPct * 0 + d.commPct * 8 + d.eqPct * 16) / 100).toFixed(1);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/blended-finance/structure` | `post_blended_structure` | api/v1/routes/blended_finance.py |
| POST | `/api/v1/blended-finance/dfi-standards` | `post_dfi_standards` | api/v1/routes/blended_finance.py |
| POST | `/api/v1/blended-finance/concessional-layers` | `post_concessional_layers` | api/v1/routes/blended_finance.py |
| POST | `/api/v1/blended-finance/mobilisation-metrics` | `post_mobilisation_metrics` | api/v1/routes/blended_finance.py |
| POST | `/api/v1/blended-finance/portfolio` | `post_blended_portfolio` | api/v1/routes/blended_finance.py |
| GET | `/api/v1/blended-finance/ref/mdb-profiles` | `get_mdb_profiles` | api/v1/routes/blended_finance.py |
| GET | `/api/v1/blended-finance/ref/instruments` | `get_instruments` | api/v1/routes/blended_finance.py |
| GET | `/api/v1/blended-finance/ref/dac-sectors` | `get_dac_sectors` | api/v1/routes/blended_finance.py |
| GET | `/api/v1/blended-finance/ref/convergence-benchmarks` | `get_convergence_benchmarks` | api/v1/routes/blended_finance.py |
| GET | `/api/v1/blended-finance/ref/ep-categories` | `get_ep_categories` | api/v1/routes/blended_finance.py |

### 2.3 Engine `blended_finance_engine` (services/blended_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_clamp` | v, lo, hi |  |
| `_mid` | rng_tuple | Midpoint of a documented model-config range (structuring assumption). |
| `_score_ifc_ps` | project_category, sector, reported_scores | Score the 8 IFC Performance Standards. IFC PS scores are entity-assessed E&S compliance figures. They are NOT modelled here: when the caller supplies ``reported_scores`` (a mapping of PS id -> 0-100 score from a real E&S assessment) the weighted average is computed deterministically; otherwise every score is returned as ``None`` with an ``insufficient_data`` status and no weighted average is fabri |
| `_es_risk_tier` | ifc_score, sector | E&S risk tier (EP4 A/B/C). Sector alone forces Category A; otherwise a real IFC score is required — returns None when the score is unavailable. |
| `_country_income_group` | country, reported_income_group | Resolve World Bank / UN income classification for ODA eligibility. Uses the caller-supplied ``reported_income_group`` when provided, else a real reference table (:data:`COUNTRY_INCOME_GROUPS`). Returns ``None`` for countries not in the table so ODA eligibility is not fabricated. |
| `assess_blended_structure` | entity_id, instrument_type, project_size_usd, sector, country, concessional_pct, first_loss_share_of_concessional, guarantee_coverage_pct | Assess a blended finance structure. Returns concessional layer sizing, MDB partner match, IFC PS compliance, mobilisation ratio benchmarks, OECD DAC ODA eligibility, SDG alignment. Structuring inputs (``concessional_pct``, ``first_loss_share_of_concessional``, ``guarantee_coverage_pct``, ``mobilisation_ratio``, ``return_enhancement_bps``) are DEAL-SPECIFIC: when omitted they are returned as ``None |
| `analyse_dfi_standards` | entity_id, dfi_partner, project_category, reported_ps_scores, grievance_score, grievance_channels, edge_energy_saving_pct, edge_water_saving_pct | Analyse DFI E&S standards compliance across 8 IFC PS categories. Returns IFC PS scores, E&S risk tier, EDGE criteria and DFI partner profile. All figures here are entity-assessed E&S metrics, not model outputs: IFC PS scores, the grievance-mechanism score/channels and EDGE savings percentages are only returned when supplied by the caller. When absent they are reported as ``None`` / ``insufficient_ |
| `model_concessional_layers` | entity_id, total_size_usd, sectors, tranche_shares, tranche_return_targets, tranche_ratings | Model tranche waterfall: senior / mezzanine / first-loss / grant. Returns return targets per tier, investor type mapping, blended IRR. The capital-stack shares and per-tranche return targets are structuring parameters. When ``tranche_shares`` / ``tranche_return_targets`` are supplied (keys: ``senior``/``mezzanine``/``first_loss``/``grant``) they drive the model directly; otherwise the midpoint of  |
| `calculate_mobilisation_metrics` | entity_id, public_finance_usd, private_co_finance_usd, sector, financial_additionality, es_additionality, knowledge_additionality, crowding_in_score | Calculate MDB mobilisation metrics, additionality and crowding assessment. Benchmarks per Convergence 2023; methodology per MDB Harmonised Framework. The direct mobilisation ratio and OECD DAC public share are computed directly from the supplied finance amounts. The achieved ratio is compared against each Convergence 2023 sector benchmark using the *actual* ratio (no per-sector figure is fabricate |
| `generate_blended_portfolio` | entity_id, instruments | Aggregate blended finance instruments into portfolio-level analytics. Returns risk-return frontier, SDG alignment, impact metrics, sector exposures and Convergence-style portfolio analytics. Portfolio totals (concessional layer, private mobilised, mobilisation ratio, sector exposures, average deal size) are computed directly from the supplied ``instruments``. Per-instrument concessional share and  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `Convergence` *(shared)*, `__future__` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `portfolio` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `BF_INSTRUMENTS`, `PIE_COLORS`, `SAMPLE_DEALS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| First-Loss Tranche Size | `Investment × (1 – comm_hurdle / project_IRR)` | OECD model | Concessional capital required to achieve commercial hurdle rate for co-investors |
| Commercial Investor IRR | `Residual FCF / Commercial equity` | DFI cascade model | Return achieved by commercial co-investors after absorbing first-loss support |
| Subsidy Efficiency | — | MDB/DFI impact metrics | Development outcomes (jobs, clean energy capacity) per million dollars of concessional capital |
- **Project cash flow projections** → Apply first-loss model to determine concessional tranche size; compute per-tranche IRR → **Capital stack configuration with IRR waterfall and subsidy efficiency metrics**
- **MDB/DFI deal database (Convergence)** → Benchmark structure against comparable historical blended finance transactions → **Peer structure comparison and market-standard concessional ratio benchmarks**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/blended-finance/ref/convergence-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['convergence_benchmarks'], 'n_keys': 1}`

**GET /api/v1/blended-finance/ref/dac-sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['dac_sector_codes'], 'n_keys': 1}`

**GET /api/v1/blended-finance/ref/ep-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ep4_categories', 'note'], 'n_keys': 2}`

**GET /api/v1/blended-finance/ref/instruments** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['instruments'], 'n_keys': 1}`

**GET /api/v1/blended-finance/ref/mdb-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['mdb_profiles'], 'n_keys': 1}`

**POST /api/v1/blended-finance/concessional-layers** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/blended-finance/dfi-standards** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/blended-finance/mobilisation-metrics** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** OECD first-loss tranche sizing model
**Headline formula:** `Commercial_IRR = (Project_FCF – Concessional_coupon × Conc_size) / Commercial_investment; FirstLoss_required = Investment × (1 – Commercial_hurdle_IRR / Project_IRR)`

First-loss size is calibrated to lift commercial tranche IRR to institutional hurdle rate (typically 8–12%). Cascade approach tests whether commercial-only financing is viable before applying concessional instruments. Subsidy efficiency metric = development impact / concessional capital deployed.

**Standards:** ['OECD Blended Finance Principles', 'DFI Working Group Cascade Approach', 'G20 MDB Capital Adequacy Framework']
**Reference documents:** OECD Blended Finance Principles (2019); DFI Working Group on Blended Concessional Finance 2017; G20 MDB Capital Adequacy Framework 2022; Convergence Blended Finance Deal Database

**Engine `blended_finance_engine` — extracted transformation lines:**
```python
weighted = round(weighted_num / weight_den, 1) if weight_den > 0 else None
concessional_usd = round(project_size_usd * conc_pct, 0) if conc_pct is not None else None
first_loss_pct = (conc_pct * fl_share) if (conc_pct is not None and fl_share is not None) else None
first_loss_usd = round(project_size_usd * first_loss_pct, 0) if first_loss_pct is not None else None
private_co_finance = (round(concessional_usd * mob_ratio, 0)
senior_pct = max(0.35, 1.0 - grant_pct - first_loss_pct - mezzanine_pct)
total_pct = grant_pct + first_loss_pct + mezzanine_pct + senior_pct
total = public_finance_usd + private_co_finance_usd
direct_ratio = private_co_finance_usd / public_finance_usd if public_finance_usd > 0 else 0.0
conc_usd = size * conc_pct
priv_mob = conc_usd * mob_ratio
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **55** other module(s).
**Shared engines (edits propagate!):** `blended_finance_engine` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `blended-finance-structuring` | engine:blended_finance_engine, table:Convergence, table:exc, table:portfolio |
| `blended-finance-structurer` | engine:blended_finance_engine, table:Convergence, table:exc, table:portfolio |
| `supply-chain-esg-hub` | table:exc |
| `carbon-accounting-ai` | table:exc |
| `green-hydrogen-lcoh` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `adaptation-finance` | table:exc |
| `modern-slavery-intel` | table:exc |
| `supply-chain-resilience` | table:exc |
| `crrem` | table:exc |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

The page is a deal explorer plus a capital-stack calculator sitting in front of the
real `blended_finance_engine.py` (E72). The **displayed deal economics are client-side
arithmetic**, not engine calls. Two headline computations:

```js
// weighted average cost of the blended stack (per deal)
cost = (concPct×3 + grantPct×0 + commPct×8 + eqPct×16) / 100      // % — fixed tranche rates

// mobilisation multiple from the slider mix
conc = ta + firstLoss + guarantees + concessional
comm = commercial + equity
mobilizationMultiple = comm / conc      (private mobilised per $ concessional)
```

Portfolio roll-ups over `allDeals = SAMPLE_DEALS + customDeals`: total deal value,
total concessional (`Σ size×concPct/100`), total commercial, average leverage.

### 7.2 Parameterisation

The cost model hard-codes indicative tranche rates: **concessional 3%, grant 0%,
commercial 8%, equity 16%**. `costCompare` benchmarks the blended cost against a
pure-commercial 8.0% and pure-concessional 3.0% anchor. `BF_INSTRUMENTS` (7 rows)
and `SAMPLE_DEALS` (16 rows: project, sector, geography, size, conc/comm/grant/eq %,
SDGs, DFI, leverage, year) are hand-built reference data. The `riskWaterfall` orders
tranches TA → First-Loss → Concessional → Mezzanine → Senior by loss-absorption.

The backend engine, by contrast, exposes calibrated reference data:
`CONVERGENCE_BENCHMARKS` (climate mean 4.2×, energy 5.1×, infra 5.5×, with p25/p75
bands), `DFI_PROFILES` (IFC target 5.0×, MIGA 6.0×, EBRD 4.5×, ADB 3.8×, AIIB 4.2×,
AfDB 3.2×) and `INSTRUMENT_CONFIGS` concessional-share/return-enhancement ranges.

### 7.3 Calculation walkthrough

1. Filter deals by sector/status; aggregate value, concessional, commercial, leverage.
2. Capital-stack sliders (concessional, guarantees, first-loss, TA, commercial,
   equity) → mobilisation multiple and blended cost.
3. `costCompare` places the blended cost between the two pure benchmarks.
4. CSV export dumps the deal table. The `/ref/*` API endpoints can pull the engine's
   Convergence and MDB reference data.

### 7.4 Worked example

A deal with `concPct=30, grantPct=10, commPct=50, eqPct=10`:

| Step | Computation | Result |
|---|---|---|
| Concessional cost | 30 × 3 | 90 |
| Grant cost | 10 × 0 | 0 |
| Commercial cost | 50 × 8 | 400 |
| Equity cost | 10 × 16 | 160 |
| Blended cost | (90+0+400+160)/100 | **6.5%** |

Versus 8.0% pure-commercial, the concessional layer buys a 150 bp weighted-cost
reduction. A slider mix of `conc(TA+firstLoss+guar+concessional)=25`,
`comm(commercial+equity)=75` gives a **mobilisation multiple of 3.0×** — inside the
OECD >3× target and the engine's climate benchmark band (2.5–5.8).

### 7.5 Data provenance & limitations

- `SAMPLE_DEALS` are illustrative, not sourced to Convergence transaction records;
  the tranche rates (3/0/8/16) are fixed heuristics, so blended cost is a *weighting
  demonstration*, not a priced structure.
- The page does **not** call the engine's `assess_blended_structure` /
  `model_concessional_layers`, which would return honest nulls where deal parameters
  are unknown and would apply IFC PS compliance and ODA eligibility.
- No first-loss *sizing* to a hurdle rate on this page (that logic is the engine's
  cascade), no waterfall loss simulation — the "IRR Waterfall" is descriptive.

**Framework alignment:** OECD DAC Blended Finance Principles (additionality,
mobilisation, transparency) · Convergence State of Blended Finance leverage
benchmarks (in the engine) · DFI Working Group cascade / MDB Harmonised Framework
for Additionality (engine `calculate_mobilisation_metrics`) · IFC Performance
Standards 1–8 (engine `_score_ifc_ps`, weights PS1 .18 … PS8 .10).

## 8 · Model Specification

**Status: specification — not yet implemented in the page** (the engine already
implements most of it; the gap is wiring + first-loss sizing).

**8.1 Purpose & scope.** Size the concessional/first-loss layer needed to lift a
commercial tranche to its hurdle IRR, and report the resulting mobilisation ratio,
subsidy efficiency and ODA/IFC-PS status — for DFIs and MDBs structuring climate deals.

**8.2 Conceptual approach.** A tranche-waterfall loss-allocation model with
**first-loss sizing to a target senior IRR** (the OECD cascade), benchmarked against
**Convergence 2023** leverage bands and the **MDB Harmonised Framework** additionality
scoring — exactly the design the backend engine follows.

**8.3 Mathematical specification.**
```
Expected_loss = Σ_s PD_s · LGD_s · EAD_s
FirstLoss_req = EAD · (1 − hurdle_IRR / project_IRR)          (OECD sizing)
Senior_IRR    = (FCF − Σ junior coupons) / Senior_capital
Blended_IRR   = Σ_t r_t · size_t / Σ_t size_t   (non-grant)
Leverage      = private_mobilised / concessional_deployed
Mobilisation vs benchmark: compare Leverage to Convergence sector mean/p25/p75
Subsidy_eff   = development_impact / concessional_$
```

| Parameter | Source |
|---|---|
| Sector leverage bands | Convergence 2023 (engine `CONVERGENCE_BENCHMARKS`) |
| Tranche return ranges | Engine `INSTRUMENT_CONFIGS` / `model_concessional_layers` |
| PD/LGD | Deal credit analysis / MDB internal ratings |
| Hurdle IRR | Institutional investor mandate (8–12%) |
| ODA eligibility | WB income group + OECD DAC (engine `COUNTRY_INCOME_GROUPS`) |

**8.4 Data requirements.** Project cash-flow projection, PD/LGD/EAD by tranche,
investor hurdle, DFI partner, country income group, IFC PS assessment scores.
Engine already accepts all of these; the page must POST them rather than seed.

**8.5 Validation & benchmarking.** Reconcile achieved leverage against Convergence
sector medians; back-test first-loss sizing against realised deal loss experience;
verify blended IRR and leverage are internally consistent; sensitivity on hurdle IRR
and expected loss.

**8.6 Limitations & model risk.** Expected loss on frontier-market projects is
data-poor; mobilisation ratios are self-reported; additionality is judgemental.
Conservative fallback (already in engine): return null rather than a config-midpoint
where a deal-specific structuring input is missing.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the structuring UI to the honest engine and exercise the write surface (analytics ladder: rung 1 → 2)

**What.** The backend `blended_finance_engine` is exemplary in its honesty: IFC PS scores, mobilisation ratios, ODA eligibility, and tranche parameters are all returned as `None`/`insufficient_data` when the caller doesn't supply them — nothing fabricated. But the frontend computes its own cost proxy client-side (`cost = (concPct×3 + commPct×8 + eqPct×16)/100`) over 16 seeded `SAMPLE_DEALS`, and the harness shows the five POST routes uncalled (GETs pass; POSTs `skipped`). Evolution A connects the page's sliders and capital-stack builder to the real engine.

**How.** (1) The Capital Stack tab's slider configuration posts to `/structure` and `/concessional-layers`; the IRR Waterfall renders `model_concessional_layers` output (senior/mezzanine/first-loss/grant return targets, blended IRR) instead of the local weighted-cost heuristic. (2) The Cascade Check ("commercial-only viability before concessionality" — the OECD principle) becomes a real computation via `assess_blended_structure`, which the current page only gestures at. (3) Mobilisation metrics from `/mobilisation-metrics` benchmarked against the real Convergence 2023 sector figures the engine already carries (the `/ref/convergence-benchmarks` GET passes). (4) Triage the skipped POSTs (REQUIRE_AUTH blocker vs payload) so the write path is harness-covered. (5) Rung 2: stress scenarios on the IRR waterfall (the engine's tranche model supports parameter sweeps).

**Prerequisites.** POST-failure triage; the `SAMPLE_DEALS` either become real Convergence-sourced deals or stay clearly labelled illustrative. **Acceptance:** the slider stack drives an engine `/structure` call whose IRR waterfall matches the UI; mobilisation ratio compares against the real Convergence benchmark; all five POSTs pass the harness; unsupplied E&S inputs surface as `insufficient_data`, not zeros.

### 9.2 Evolution B — Blended-structure design copilot honouring the honest-null contract (LLM tier 2)

**What.** The engine's conservative design makes it an ideal Tier-2 surface: "structure a $200M climate-infrastructure deal in a lower-middle-income country with 25% concessional and 40% first-loss share" runs `assess_blended_structure`, and the copilot narrates concessional sizing, MDB partner match, ODA eligibility, and mobilisation benchmark — relaying every `None` verbatim ("IFC PS scores: insufficient data — supply an E&S assessment") rather than inventing compliance figures. Term-sheet drafting composes into the OECD-aligned export the module promises.

**How.** Tool schemas from the 5 POST + 5 GET routes; grounding corpus is this Atlas record plus the ref endpoints' real content (MDB profiles, DAC sectors, EP4 categories, Convergence benchmarks — all harness-passing). The engine's expected-keys documentation drives the copilot's input-gathering: it asks for the deal-specific structuring parameters before calling, because the engine returns `None` without them and the copilot must not paper over that. The OECD Blended Finance Principles (cascade discipline — concessionality only where necessary) frame the copilot's advice, sourced from the module's methodology notes.

**Prerequisites.** Evolution A's POST triage. **Acceptance:** every ratio, tranche size, and eligibility verdict traces to an engine response; the copilot requests missing structuring inputs rather than defaulting them; an E&S question without a supplied assessment returns `insufficient_data`, never a fabricated PS score.