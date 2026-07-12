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
