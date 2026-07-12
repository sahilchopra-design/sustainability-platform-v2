# Blended Finance Structurer
**Module ID:** `blended-finance-structurer` · **Route:** `/blended-finance-structurer` · **Tier:** A (backend vertical) · **EP code:** EP-CQ3 · **Sprint:** CQ

## 1 · Overview
5 deal templates with tranche design (first-loss/mezzanine/senior), DFI catalytic ratio, and impact-return frontier.

**How an analyst works this module:**
- Structure Builder designs tranche waterfall
- DFI Catalytic Ratio shows leverage achieved
- Impact-Financial Frontier shows risk-return by tranche

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CATALYTIC_TREND`, `DEALS`, `FRONTIER_DATA`, `TABS`, `TRANCHES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DEALS` | 6 | `type`, `totalMn`, `firstLoss`, `mezzanine`, `senior`, `catalytic`, `irr`, `impact`, `stage` |
| `TRANCHES` | 4 | `returnPct`, `riskLevel`, `protectionPct` |
| `CATALYTIC_TREND` | 7 | `ratio` |
| `FRONTIER_DATA` | 8 | `financial` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Structure Builder','Tranche Designer','Risk-Return by Layer','DFI Catalytic Ratio','Impact-Financial Frontier','Deal Pipeline'];` |

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
**Frontend seed datasets:** `CATALYTIC_TREND`, `DEALS`, `FRONTIER_DATA`, `TABS`, `TRANCHES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Deal Templates | — | Convergence | Sector-specific structures |
| Catalytic Ratio | — | DFI data | $1 concessional → $3-8 commercial |

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
**Methodology:** Tranche-based structuring
**Headline formula:** `CatalyticRatio = Commercial_mobilized / Concessional_deployed`

5 templates: renewable energy, NbS, adaptation infrastructure, clean transport, energy efficiency. First-loss (DFI/philanthropy) absorbs initial risk, enabling commercial senior tranche. Typical catalytic ratio: $1 concessional mobilizes $3-8 commercial.

**Standards:** ['Convergence', 'DFI Working Group']
**Reference documents:** Convergence Blended Finance Database; DFI Working Group on Blended Finance

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
| `blended-finance` | engine:blended_finance_engine, table:Convergence, table:exc, table:portfolio |
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

This is the thinnest of the three blended-finance pages: a 6-tab visual structurer
(`Structure Builder`, `Tranche Designer`, `Risk-Return by Layer`, `DFI Catalytic
Ratio`, `Impact-Financial Frontier`, `Deal Pipeline`) over static seed tables. There
is essentially no live calculation in the page's `computed` block beyond the tab
list — the displayed numbers are read directly from the seed arrays.

The one methodological identity the module illustrates is the catalytic ratio:

```
CatalyticRatio = Commercial_mobilised / Concessional_deployed
```

which appears as a pre-tabulated `CATALYTIC_TREND` series and a per-deal `catalytic`
field, not as a formula evaluated on user input.

### 7.2 Parameterisation

| Seed table | Fields | Rows | Role |
|---|---|---|---|
| `DEALS` | type, totalMn, firstLoss, mezzanine, senior, catalytic, irr, impact, stage | 6 | Deal templates (renewable, NbS, adaptation infra, clean transport, energy efficiency) |
| `TRANCHES` | returnPct, riskLevel, protectionPct | 4 | First-loss / mezzanine / senior / TA layer designer |
| `CATALYTIC_TREND` | ratio | 7 | Time series of $1 concessional → $x commercial |
| `FRONTIER_DATA` | financial | 8 | Impact-vs-financial-return scatter points |

Per the guide, the intended catalytic band is **$1 concessional → $3–8 commercial**,
consistent with Convergence and DFI Working Group figures. All values are hand-set
demo data; the module shares the `/api/v1/blended-finance/ref/*` endpoints with its
siblings and could pull the engine's `CONVERGENCE_BENCHMARKS` and `DFI_PROFILES`
(IFC 5.0×, MIGA 6.0×, EBRD 4.5×, ADB 3.8×) for live benchmarking.

### 7.3 Calculation walkthrough

1. Pick a deal template → its tranche split (first-loss / mezzanine / senior) and
   headline catalytic ratio, IRR and impact score are displayed from `DEALS`.
2. Tranche Designer shows the four-layer waterfall with return/protection %.
3. Catalytic Ratio tab plots `CATALYTIC_TREND`; the frontier tab plots impact vs
   `financial` return from `FRONTIER_DATA`.

### 7.4 Worked example

A renewable-energy template with `totalMn = 200`, `firstLoss = 30`, `senior = 150`,
`catalytic = 5.0`: the $30M concessional first-loss is shown as unlocking $150M
senior commercial capital, i.e. a **5.0× catalytic ratio** ($1 → $5) — inside the
$3–8 band. Because the value is stored, changing the first-loss size on this page
does not recompute the ratio (that dynamic sizing lives in the engine's
`assess_blended_structure`).

### 7.5 Data provenance & limitations

- Every displayed number is **static seed data**; the catalytic ratio is presented,
  not derived from a loss-allocation or hurdle-rate calculation.
- No first-loss sizing, no IRR solve, no additionality/ODA logic on the page — all of
  which the backend `blended_finance_engine.py` implements but the page does not call.

**Framework alignment:** Convergence Blended Finance leverage benchmarks · DFI Working
Group on Blended Concessional Finance (cascade / minimum-concessionality) · OECD DAC
Blended Finance Principles. The catalytic ratio is the standard mobilisation metric
(private capital mobilised per unit of concessional capital), here shown rather than computed.

## 8 · Model Specification

**Status: specification — not yet implemented in the page.** The production model is
the shared blended-finance structuring model (see `blended-finance.md` §8 and the
backend `blended_finance_engine.py`): first-loss sizing to a target senior IRR,
tranche-waterfall loss allocation, Convergence-benchmarked leverage, and
MDB-Harmonised-Framework additionality. This page should render that engine's
`model_concessional_layers` and `calculate_mobilisation_metrics` outputs instead of
static `DEALS`/`CATALYTIC_TREND` seeds. Key equations, parameters, data requirements,
validation and limitations are as documented in `blended-finance.md` §8; nothing
additional is required for the structurer view beyond binding its six tabs to the
engine response (tranche sizes → `tranches[]`, catalytic ratio → `leverage_ratio`,
frontier → per-tranche `return_target_pct` vs impact metrics).

## 9 · Future Evolution

### 9.1 Evolution A — Replace seeded deal tables with live engine calls (analytics ladder: rung 1 → 2)

**What.** This module registers the same substantive `blended_finance_engine` as `blended-finance`, but its frontend is thinner and fully seeded: `DEALS` (6 rows), `TRANCHES`, `CATALYTIC_TREND`, and `FRONTIER_DATA` are all static/PRNG arrays, and its three visible tabs (Structure Builder, Tranche Designer, Impact-Financial Frontier) render them without calling the engine — the harness confirms the POSTs are `skipped`. Its distinct contribution versus the sibling is the tranche-designer and catalytic-ratio framing, so Evolution A makes those two views engine-backed.

**How.** (1) The Structure Builder and Tranche Designer post to `model_concessional_layers` (senior/mezzanine/first-loss/grant shares, per-tier return targets, blended IRR) so `TRANCHES` becomes computed output; the catalytic ratio (`commercial_mobilized / concessional_deployed`, the module's headline formula) comes from `calculate_mobilisation_metrics` rather than the seeded `CATALYTIC_TREND`. (2) The Impact-Financial Frontier plots real per-tranche risk/return from the engine instead of `FRONTIER_DATA`. (3) The five deal templates become parameterised presets that pre-fill the engine call, not static rows. (4) Rung 2: the frontier sweep over tranche shares becomes a genuine what-if, which the engine's parameterised `tranche_shares` input already supports. Coordinate with `blended-finance` and `blended-finance-structuring` so the three sibling pages don't diverge in how they present the shared engine.

**Prerequisites.** POST-failure triage (shared with the sibling modules); a decision on module-boundary — three modules over one engine should specialise, not duplicate. **Acceptance:** the tranche designer's IRR waterfall matches `/concessional-layers` output; the catalytic ratio is engine-computed from supplied finance amounts; the POSTs pass the harness.

### 9.2 Evolution B — Tranche-design copilot (LLM tier 2)

**What.** Scoped to this module's strength — tranche architecture — the copilot answers "what first-loss share gets commercial investors to a 10% hurdle on this deal?" by iterating `model_concessional_layers` and reporting the resulting waterfall, and "what catalytic ratio does that achieve?" from `calculate_mobilisation_metrics`. It narrates the risk-return frontier per layer from real engine output, never the seeded `FRONTIER_DATA`.

**How.** Tool schemas over the shared engine routes (same OpenAPI surface as `blended-finance`); grounding corpus is this Atlas record plus the DFI Working Group / Convergence methodology notes in §5. The engine's honest-null contract carries through: per-tranche figures require supplied structuring inputs, so the copilot gathers tranche shares and return targets before calling, and reports `None` where the caller hasn't specified them. Because this and the sibling modules share the engine, the copilot's tool layer should be a single blended-finance tool set the desk orchestrator can route to, not three overlapping ones.

**Prerequisites (hard).** Evolution A's engine wiring — the seeded `DEALS`/`TRANCHES` are not tool-callable and narrating them would fabricate deal economics. **Acceptance:** every tranche size, IRR, and catalytic ratio traces to an engine response; inverse hurdle-rate searches state their grid; missing structuring inputs prompt a request, not a default.