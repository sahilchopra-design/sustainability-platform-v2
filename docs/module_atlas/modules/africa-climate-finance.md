# Africa Climate Finance
**Module ID:** `africa-climate-finance` · **Route:** `/africa-climate-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-CJ5 · **Sprint:** CJ

## 1 · Overview
Africa electrification pathways, climate finance flows vs $250B need, loss & damage, and green minerals opportunity.

**How an analyst works this module:**
- Electrification Pathways compares mini-grid vs grid extension
- Climate Finance Flows shows sources and gaps
- Green Minerals maps DRC cobalt, SA platinum, etc.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ADAPTATION_MATRIX`, `AFRICA_REGIONS`, `CLIMATE_FINANCE`, `ELECTRIFICATION`, `GREEN_MINERALS`, `LOSS_DAMAGE`, `REFERENCES`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `AFRICA_REGIONS` | 6 | `population`, `withoutElectricity`, `gdp`, `emissions`, `reCapacity`, `financeReceived` |
| `ADAPTATION_MATRIX` | 9 | `priority`, `investmentNeed`, `currentFinance`, `gap`, `readiness` |
| `GREEN_MINERALS` | 8 | `country`, `globalShare`, `reserves`, `use`, `investmentOpp`, `esgRisk` |
| `REFERENCES` | 7 | `title`, `url` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `badge` | `(c) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c + '18', color: c });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ADAPTATION_MATRIX`, `AFRICA_REGIONS`, `GREEN_MINERALS`, `REFERENCES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Without Electricity | — | IEA/World Bank | Primarily Sub-Saharan Africa |
| Finance Gap | — | UNEP | $250B need - $30B flow |

## 5 · Intermediate Transformation Logic
**Methodology:** Electrification economics
**Headline formula:** `LCOE_minigrid vs LCOE_grid_extension per location`

600M people without electricity. Mini-grid vs grid extension economics vary by population density and distance. Climate finance: $30B/yr flows vs $250B/yr need.

**Standards:** ['IRENA Africa', 'AfDB']
**Reference documents:** AfDB African Economic Outlook; IRENA Africa Energy Transition

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

A six-tab **descriptive dashboard** (EP-CJ5) over hand-authored African climate-finance data.
Unlike most platform modules there is almost no derived computation: the only interactive
calculation is the Adaptation Priority Matrix filter,
`ADAPTATION_MATRIX.filter(a => a.gap >= gapThreshold)` (slider $1–50B), and colour-threshold
badges. Everything else renders static seed tables directly:

| Tab | Dataset | Rows | Content |
|---|---|---|---|
| Continent Overview | `AFRICA_REGIONS` | 5 | population, no-electricity, GDP $T, emissions Gt, RE GW, finance $B |
| Electrification | `ELECTRIFICATION.pathways/economics` | 5 + 4 | grid/mini-grid/SHS connection pathway 2024–2035 vs 1,400M target; per-solution cost/connection |
| Finance Flows | `CLIMATE_FINANCE.flows/sources` | 6 + 5 | received vs needed 2018–23; source split |
| Loss & Damage | `LOSS_DAMAGE.events/fundStatus` | 5 + 5 | named disasters with losses/deaths/insured; L&D fund status cards |
| Adaptation Matrix | `ADAPTATION_MATRIX` | 8 | priority score, need, current finance, gap, readiness |
| Green Minerals | `GREEN_MINERALS` | 7 | global share, reserves, use case, opportunity $B, ESG risk |

The guide's formula `Adaptation_finance = Public_bilateral + MDB_adaptation + Private_tracked`
is represented **as data, not code**: the source-split table (MDBs 42%, bilateral 27%, GCF/GEF
17%, private 10%, domestic 5% of $30B) embodies that decomposition but no aggregation is
computed at runtime.

### 7.2 Parameterisation — the seeded numbers and their anchors

Header KPIs (hard-coded): **600M without electricity**, **$220B/yr finance gap**, **$103B
green-minerals opportunity**. Cross-checks against the seed tables: regional
`withoutElectricity` sums to exactly 600M ✓; the 2023 gap in `flows` is 250 − 30 = $220B ✓;
`GREEN_MINERALS.investmentOpp` sums to $103B ✓ — internally consistent, unlike some sibling
modules.

Notable data anchors (all hand-typed, plausibly sourced from the six listed references —
AfDB AEO 2024, IRENA/IEA Africa outlooks 2024, UNEP Adaptation Gap 2024, GCF portfolio, IEA
Critical Minerals):

- Finance flows: received $18.5B (2018) → $30B (2023) vs needed $200→250B — consistent with
  CPI/AfDB estimates that Africa receives ~$30B against ~$250B annual needs.
- Loss & damage: Cyclone Freddy $3.2B/1,434 deaths, Horn of Africa drought $8.5B/36M affected,
  each with an insured amount showing the protection gap (insurance $0.02–0.8B, i.e. ~1–20%
  insured); COP28 L&D fund $770M pledged / $120M disbursed; ARC parametric coverage $1.2B.
- Green minerals: DRC cobalt 73% global share, South Africa platinum 72%, Guinea bauxite 22% —
  consistent with USGS/IEA figures.

### 7.3 Calculation walkthrough

1. **Adaptation matrix (only live calc):** each sector row carries
   `gap = investmentNeed − currentFinance` (pre-computed in the seed; e.g. Agriculture
   45 − 5.2 = 39.8 ✓). The slider hides rows with `gap < threshold`; priority bars colour at
   >85 red, >70 amber, else green; readiness badges High/Medium/Low.
2. **Insurance-gap colouring:** event insurance < $0.5B renders red — a visual protection-gap
   flag.
3. **Charts:** stacked area for electrification pathway vs the 1,400M universal-access
   reference line; composed bar+line for received-vs-needed; stacked current+gap bars per
   adaptation sector; minerals bar coloured by ESG risk.

### 7.4 Worked example — adaptation gap filter

With the default threshold $10B, the matrix shows sectors where
`investmentNeed − currentFinance ≥ 10`:

| Sector | Need | Current | Gap | Shown? |
|---|---|---|---|---|
| Agriculture | 45 | 5.2 | 39.8 | ✓ |
| Infrastructure | 55 | 8.0 | 47.0 | ✓ |
| Water Security | 35 | 4.0 | 31.0 | ✓ |
| Urban Resilience | 25 | 3.0 | 22.0 | ✓ |
| Health Systems | 20 | 2.5 | 17.5 | ✓ |
| Coastal Protection | 15 | 1.8 | 13.2 | ✓ |
| Ecosystems/NbS | 12 | 2.0 | 10.0 | ✓ (= threshold) |
| Early Warning Systems | 5 | 1.5 | 3.5 | ✗ hidden |

Raising the slider to $20B leaves only Agriculture, Infrastructure, Water Security and Urban
Resilience — the intended prioritisation workflow.

### 7.5 Data provenance & limitations

- **No PRNG anywhere** — this module contains zero seeded randomness; all values are static
  literals. They are one-time editorial snapshots (mostly 2022–2024 vintage) and will drift
  from the cited sources without maintenance; reference URLs are placeholders (`url: '#'`).
- Regional aggregates are rounded editorial figures, not computed from country data; the
  mitigation+adaptation split in `flows` does not always sum exactly to `received`
  (e.g. 2018: 12.0+6.5 = 18.5 ✓, but GCF is shown separately and overlaps the total).
- No per-country drill-down, no currency-year normalisation, no uncertainty ranges. A
  production version would ingest OECD DAC CRS climate markers and CPI's Global Landscape of
  Climate Finance rather than hard-coding.

### 7.6 Framework alignment

- **UNFCCC / Paris Art. 9 climate-finance accounting** — the received-vs-needed framing tracks
  the UNFCCC Standing Committee on Finance needs-determination reports; the OECD DAC Rio
  markers are the real-world method behind the "received" series (climate-tagged ODA).
- **UNEP Adaptation Gap Report** — the adaptation matrix's need-vs-flow gap logic is the
  report's core construct (needs estimated from NDC/NAP costings vs tracked flows).
- **COP28 Loss & Damage Fund** — fund status cards reflect the pledge/disbursement state of
  the Fund (now FRLD) plus regional parametric pools (ARC), illustrating the L&D financing
  architecture rather than computing payouts.
- **SDG 7 / IEA universal-access modelling** — the grid/mini-grid/SHS decomposition of the
  electrification pathway follows the IEA's least-cost universal access analysis, where
  decentralised solutions serve the majority of new rural connections.
- **IEA Critical Minerals** — the minerals table mirrors the energy-transition demand framing
  (batteries, magnets, wiring) with ESG-risk overlays akin to responsible-sourcing (OECD
  due-diligence) concerns.

## 9 · Future Evolution

### 9.1 Evolution A — From editorial snapshot to ingested flows with country drill-down (analytics ladder: rung 1 → 2)

**What.** This is a six-tab descriptive dashboard (EP-CJ5): per §7.1 the only live
calculation is the adaptation-matrix gap filter — everything else renders hand-typed
2022–2024 editorial tables (which are at least internally consistent: 600M electrification
sum, $220B gap, $103B minerals all reconcile, and §7.5 confirms zero PRNG). Its honest
next step is the one §7.5 itself names: ingest OECD DAC CRS climate-marker flows and
CPI Global Landscape of Climate Finance data into real tables (`africa_finance_flows`
keyed by country/year/instrument/source), replacing the 5-row regional aggregates with
computed roll-ups and per-country drill-down, plus currency-year normalisation.

**How.** A new ingester following the platform's 19-ingester scaffold pulling the OECD
CRS bulk file (climate Rio markers) filtered to African recipients; `GET
/api/v1/africa-finance/flows?country=&year=` and `/adaptation-gaps` endpoints; the
received-vs-needed chart then computes `gap = need − Σ flows` at runtime instead of
shipping it pre-typed. Rung 2 arrives with the electrification-economics scenario the
guide already promises (`LCOE_minigrid vs LCOE_grid_extension per location`): a simple
two-parameter model (population density, grid distance) sweeping the crossover frontier.

**Prerequisites.** Fix the placeholder reference URLs (`url: '#'`) with real citations;
resolve the documented GCF-overlap inconsistency in the flows table during migration;
OECD CRS bulk download is keyless but large — needs the ingestion framework's chunked
loader. **Acceptance:** the 2023 received figure is computed from ingested CRS rows (and
documented where it diverges from the old $30B editorial figure); selecting Kenya shows
country-level flows; the mini-grid/grid crossover moves when grid distance changes.

### 9.2 Evolution B — Africa finance-gap copilot over the seed tables (LLM tier 1)

**What.** A chat panel answering "why is the adaptation gap biggest in infrastructure?"
($55B need vs $8.0B current, from `ADAPTATION_MATRIX`), "how insured was Cyclone Freddy?"
($0.02–0.8B against $3.2B losses — the protection-gap flag the page colours red), and
"where does the $103B minerals number come from?" (sum of `GREEN_MINERALS.investmentOpp`).
Grounded in this Atlas page and the seed tables; the copilot must state that figures are
editorial snapshots of mostly 2022–2024 vintage from the listed AfDB/IRENA/UNEP sources,
not live data — and flag staleness once Evolution A's ingested series exists to compare.

**How.** Tier-1 roadmap pattern: §7.2's data-anchor annotations (which already map each
headline to its source and vintage) are the ideal grounding corpus — embed them with the
seed tables into `llm_corpus_chunks`; serve via `POST
/api/v1/copilot/africa-climate-finance/ask` with the standard refusal path. Because the
module computes almost nothing, the copilot's value is navigation and sourcing, not
calculation narration; it should decline any request to project or extrapolate (e.g.
"what will the gap be in 2030?") until Evolution A's computed series exists.

**Prerequisites.** Atlas corpus embedded (roadmap D3); reference URLs fixed so citations
resolve. **Acceptance:** every figure cited matches a seed-table value with its vintage
stated; asking for a 2030 projection produces a refusal naming the module's
static-snapshot scope.