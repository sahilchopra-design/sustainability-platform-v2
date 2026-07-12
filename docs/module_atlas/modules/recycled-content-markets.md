# Recycled Content Markets
**Module ID:** `recycled-content-markets` · **Route:** `/recycled-content-markets` · **Tier:** B (frontend-computed) · **EP code:** EP-EJ4 · **Sprint:** EJ

## 1 · Overview
10 secondary material markets (rPET/rHDPE/rAl/rSteel/rPP/rGlass/rFibre/rPVC/rCu/PLA) with virgin-recycled price gap, 36-month price history, 20 brand buyer demand analytics, 6 certification standards (GRS/ISCC+/RecyClass/APR/SCS/C2C), and demand forecast to 2030.

> **Business value:** Used by brand procurement teams sourcing certified recycled content, recycling infrastructure investors sizing market opportunity, and sustainability analysts benchmarking recycled content performance.

**How an analyst works this module:**
- Review 10 material markets with virgin vs recycled price comparison and CO₂ saving data
- Analyse 36-month price history for rPET, rHDPE, and recycled aluminium
- Sort 20 brand buyer demand by RC target, achieved, gap, volume, and premium paid
- Review 6 certification standards and demand forecast by material 2024–2030

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BUYERS`, `CERTIFICATIONS`, `DEMAND_FORECAST`, `KpiCard`, `MATERIALS`, `PRICE_SERIES`, `Pill`, `RADAR_DATA`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MATERIALS` | 11 | `code`, `virginPrice`, `recycledPrice`, `premium`, `recycleRate`, `demand2024`, `demand2030`, `co2Saving`, `purity`, `regions` |
| `CERTIFICATIONS` | 7 | `org`, `scope`, `chains`, `recognition`, `type` |
| `RADAR_DATA` | 7 | `rPET`, `rHDPE`, `rAl`, `rSteel` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `DEMAND_FORECAST` | `MATERIALS.slice(0, 6).map(m => ({ material: m.code, demand2024: m.demand2024, demand2027: +(m.demand2024 * 1.4).toFixed(1), demand2030: m.demand2030 }));` |
| `sortedMaterials` | `useMemo(() => [...MATERIALS].sort((a, b) => b[sortField] - a[sortField]), [sortField]);` |
| `sortedBuyers` | `useMemo(() => [...BUYERS].sort((a, b) => b[buyerSort] - a[buyerSort]), [buyerSort]);` |
| `avgRecycleRate` | `MATERIALS.reduce((a, b) => a + b.recycleRate, 0) / MATERIALS.length;` |
| `totalDemand2024` | `MATERIALS.reduce((a, b) => a + b.demand2024, 0);` |
| `gap` | `b.rcTarget2025 - b.rcAchieved2024;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CERTIFICATIONS`, `MATERIALS`, `RADAR_DATA`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| rPET price discount to virgin (2024) | `Food-grade rPET vs virgin PET` | ICIS Recycled Plastics Price Report 2024 | rPET has narrowest discount due to brand demand for food-grade RC; virgin PET price collapse (oil) could temporarily reverse to premium. |
| Recycled aluminium CO₂ saving | `vs primary aluminium production` | International Aluminium Institute 2023 | Aluminium recycling saves 95% of energy vs primary smelting; EV demand driving rAl sheet premium for body panels. |
| GRS certified supply chains | `As of 2024 globally` | Textile Exchange GRS Tracker 2024 | GRS now covers all material types; ISCC+ mass balance preferred for chemical recycling streams; dual certification common. |
- **EU PPWR + UK PPT + GRS v4.0 + ISCC+ + RecyClass + APR Design Guide + C2C Institute** → Material market comparison + price history + brand buyer analytics + certification guide + demand forecast → **Brand procurement teams, recycling infrastructure investors, sustainability analysts, and green bond issuers**

## 5 · Intermediate Transformation Logic
**Methodology:** Recycled Content Premium Cost
**Headline formula:** `RC_Premium_Cost = (RecycledPrice − VirginPrice) × RCVolume; Demand_Gap = RC_Target_Pct × TotalVolume − RC_Achieved_Pct × TotalVolume; GHG_Saving = RCVolume × CO2_Saving_per_tonne`

rAluminium shows largest CO₂ saving (8.4 tCO₂e/t vs virgin) and deepest price discount (25%); rPET faces tightest supply-demand balance with EU PPWR 30% mandate by 2030.

**Standards:** ['EU PPWR 2024', 'UK Plastic Packaging Tax 2022', 'GRS Global Recycled Standard v4.0']
**Reference documents:** ICIS (2024) – Recycled Plastics Price Report; International Aluminium Institute (2023) – Environmental Sustainability Update; Textile Exchange (2024) – GRS Market Report

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

Unlike most modules in this family, `RecycledContentMarketsPage.jsx` is predominantly a **curated
reference-data display** — 10 materials, 20 brand buyers, 6 certification schemes, and a 36-month
price history are hard-coded arrays of researched-looking figures (not seeded-random), with only a
thin layer of derived arithmetic on top:

```js
gap              = buyer.rcTarget2025 - buyer.rcAchieved2024
avgRecycleRate   = mean(MATERIALS[*].recycleRate)
totalDemand2024  = Σ MATERIALS[*].demand2024
demand2027       = demand2024 × 1.4                    // straight-line interpolation guess
RC_Premium_Cost  = (recycledPrice − virginPrice) × RCVolume     [guide formula; not computed in code — no RCVolume field exists]
```

The guide's formula set (`RC_Premium_Cost`, `Demand_Gap`, `GHG_Saving`) describes per-transaction
cost/saving calculations that would require a volume input; the code implements only the simpler
`gap` (target − achieved, percentage points) and portfolio-level averages/sums — the multiplicative
cost/GHG formulas are not executed anywhere in the file.

### 7.2 Parameterisation — the 10-material dataset

| Material | Virgin $/t | Recycled $/t | Premium* | Recycle rate | CO₂ saving (t/t) |
|---|---|---|---|---|---|
| rPET (food-grade) | 1,080 | 940 | −13% | 58% | 1.8 |
| rHDPE | 1,140 | 920 | −19% | 34% | 1.6 |
| Recycled Aluminium | 2,650 | 1,980 | −25% | 76% | **8.4** |
| Recycled Steel (EAF) | 720 | 580 | −19% | 85% | 1.4 |
| rPP | 1,020 | 850 | −17% | 22% | 1.5 |
| Recycled Glass (cullet) | 180 | 95 | **−47%** | 75% | 0.3 |
| Recycled Paper/Cardboard | 680 | 520 | −24% | 72% | 0.8 |
| rPVC | 980 | 720 | −27% | 18% | 1.4 |
| Recycled Copper | 9,800 | 8,200 | −16% | 43% | 3.2 |
| Bio-based PLA | 2,100 | 1,650 | −21% | 12% | 2.1 |

\*Premium is a hard-coded field, not recomputed from the two price columns in every row (spot
check: rPET `(940−1080)/1080 = −13.0%` ✓ consistent; the field is pre-baked, not derived live).

**Provenance**: guide cites ICIS Recycled Plastics Price Report 2024, International Aluminium
Institute 2023, and Textile Exchange GRS Tracker 2024 as sources for the headline figures (rPET
−13% discount, rAl 8.4 tCO₂e/t saving, 5,800+ GRS chains) — these three numbers do match the
dataset (`rPET.premium=-13`, `rAl.co2Saving=8.4`, `CERTIFICATIONS[0].chains='5,800+'`), i.e. the
curated constants are internally consistent with the cited sources, though full source-to-value
traceability for every row cannot be independently verified from the code alone.

### 7.3 Calculation walkthrough

1. **Material table**: sortable by any numeric field (`sortField`); no aggregation beyond simple
   mean/sum for the two KPI cards (`avgRecycleRate`, `totalDemand2024`).
2. **Price history** (`PRICE_SERIES`, 36 months): `basePrice + sr(i×k)×noiseRange + i×drift` — a
   synthetic random-walk-with-drift series for rPET/rHDPE/rAl, layered on top of the (otherwise
   curated) material table; this is the one seeded-random series in the file.
3. **Brand buyer demand** (`BUYERS`, 20 named FMCG companies): `rcTarget2025`, `rcAchieved2024`,
   `annualVolumet`, `premiumPaid`, `certRequired` are all seeded-random (`sr(i×k)`), not real
   corporate disclosures, despite using real company names (Unilever, Nestlé, P&G, etc.) as
   labels. `gap = rcTarget2025 − rcAchieved2024` is the only derived field.
4. **Certifications table**: 6 static rows (GRS, ISCC+, RecyClass, APR Design Guide, SCS, C2C) —
   purely descriptive, no calculation.
5. **Demand forecast**: `demand2027 = demand2024 × 1.4` for the first 6 materials — a flat 40%
   growth assumption applied uniformly regardless of material-specific growth drivers (contrast
   with `demand2030`, which is a distinct hard-coded figure per material implying materially
   different CAGRs by material — e.g. rPET 12.4→22.8 (2024→2030, ~10.7%/yr) vs rSteel 680→820
   (~3.2%/yr) — so the `×1.4` interpolation for 2027 is not consistent with each material's own
   2024→2030 trajectory).
6. **Radar** (`RADAR_DATA`): 6 static dimensions (Collection Rate, Quality Premium, Demand Growth,
   Regulatory Drive, Tech Readiness, GHG Abatement) scored 0–100 for 4 materials — hand-curated,
   not computed from the material table's own fields (e.g. "GHG Abatement" for rAl is 98, roughly
   consistent with its 8.4 t/t saving being the highest in the table, but the mapping is implicit).

### 7.4 Worked example

Buyer `i=0` (Unilever), `rcTarget2025 = round(sr(17)×35+15)`, `rcAchieved2024 =
round(sr(11)×28+8)`:

| Field | Formula | Illustrative result |
|---|---|---|
| `rcTarget2025` | `sr(17)≈0.66` → `round(0.66×35+15)` | **38%** |
| `rcAchieved2024` | `sr(11)≈0.66` → `round(0.66×28+8)` | **26%** |
| `gap` | `38−26` | **12 pts** shortfall vs 2025 target |
| Material cost signal (rPET, guide formula) | `(940−1080) × RCVolume` — no `RCVolume` field exists for this buyer, so this cannot be computed from the current schema | n/a — guide formula not executable as specified |

### 7.5 Certification recognition rubric

| Scheme | Scope | Chain-of-custody type |
|---|---|---|
| GRS | All materials, ≥20% recycled | Chain-of-custody |
| ISCC+ | Plastic + chemical recycling | Mass balance |
| RecyClass | Packaging recyclability | Design for recycling |
| APR Design Guide | US plastic packaging | Design guidance |
| SCS Recycled Content | All materials | Product certification |
| Cradle to Cradle | Multi-material | Material health + circular |

### 7.6 Companion analytics

Market Overview (KPI band + material table), Material Pricing (36-month price history line chart),
Brand Buyer Demand (20-buyer sortable table + gap analysis), Certifications (6-scheme reference
table), Demand Forecast (2024→2027→2030 bar), Investment Thesis (narrative text tab).

### 7.7 Data provenance & limitations

- **Material, buyer-target-range, and certification tables are curated constants**, not derived
  from a live data feed — genuinely closer to "real" reference data than most sibling modules
  (three headline figures verifiably match the cited sources), but not independently re-derivable
  or auditable from the code alone since the raw source documents are not embedded.
- **Buyer-level RC achievement/target/volume figures are synthetic** (`sr()`-seeded), despite
  being attributed to 20 real, named companies — these numbers do not represent actual disclosed
  Unilever/Nestlé/etc. recycled-content performance and should not be cited as such.
- 2027 demand interpolation (`×1.4` flat factor) is inconsistent with each material's own
  2024→2030 hard-coded growth path.
- No `RCVolume` field exists anywhere, so the guide's own `RC_Premium_Cost` and `GHG_Saving`
  formulas cannot be executed by this module as written — they would need a per-buyer or
  per-material volume input added to the schema.

**Framework alignment:** EU Packaging and Packaging Waste Regulation (PPWR) 2024 — referenced for
context (30% RC mandate by 2030) but not used to compute compliance gap against any buyer's actual
target trajectory · UK Plastic Packaging Tax 2022 — referenced, not computed · GRS v4.0 / ISCC+ /
RecyClass / APR / SCS / C2C — represented as a descriptive certification-scope table, not wired
into any buyer's certification-compliance calculation.

## 9 · Future Evolution

### 9.1 Evolution A — Executable premium/gap formulas over disclosed buyer data (analytics ladder: rung 1 → 2)

**What.** The module's reference layer is unusually good — curated material/certification tables with three headline figures verifiably matching cited sources (ICIS, IAI, Textile Exchange) — but §7.7 flags two problems: buyer RC achievement/target figures are `sr()`-seeded yet attributed to 20 real named companies (a citation risk the atlas explicitly warns against), and no `RCVolume` field exists, so the guide's own `RC_Premium_Cost`, `Demand_Gap`, and `GHG_Saving` formulas cannot execute as written. Also the 2027 forecast is a flat ×1.4 factor inconsistent with each material's own 2024→2030 path. Evolution A adds the missing volume dimension and replaces the fabricated buyer figures with disclosed ones.

**How.** (1) Schema: per-buyer `rc_volume_tonnes` and per-material user-entered procurement volumes, enabling `POST /api/v1/recycled-content/premium-cost` computing `(recycledPrice − virginPrice) × volume`, the compliance gap vs PPWR 2030 mandates, and `GHG_Saving = volume × co2Saving` — three small, honest calculations. (2) Buyer table repopulated from public commitments (Ellen MacArthur Global Commitment progress reports publish exactly these RC-target/achieved figures for the named brands, annually and freely) with source-year stamps; seeded rows deleted. (3) The 2027 interpolation derived per-material from its own 2024→2030 CAGR. (4) Price history retained as curated reference with dates and source labels.

**Prerequisites.** EMF report ingestion (annual PDF/data release — modest parsing effort); volume-input UX for procurement users. **Acceptance:** a bench buyer's premium cost and PPWR gap reproduce by hand from its row; every buyer figure carries a source-year; the 2027 point lies on each material's own growth path.

### 9.2 Evolution B — Procurement sourcing copilot (LLM tier 1 → 2)

**What.** Brand procurement teams ask exactly the questions this module's tables answer jointly: "we need 12kt of food-grade rPET in EU — what premium should we budget, which certifications do customers recognize, and what does it save in CO₂?" The copilot composes material prices, certification scopes (GRS/ISCC+/RecyClass recognition matrix), and the new premium-cost endpoint into a sourcing brief.

**How.** Tier 1 ships on the curated reference tables (legitimately real content, unlike most B-tier siblings) via the standard copilot router, with the §7.7 caveat encoded: buyer-specific performance claims only from disclosed-source rows, never presented as insider knowledge of named brands. Tier 2 adds the `POST /premium-cost` tool call for volume-specific budgeting and PPWR-gap checks. Certification answers cite the specific standard's scope row (e.g. ISCC+ mass-balance for chemical recycling streams); regulatory answers cite PPWR articles from the corpus. Price answers always carry the price-series date — recycled-content spreads move with oil, as the module's own ICIS note explains, and the copilot must surface staleness.

**Prerequisites.** Evolution A for buyer data and volume math; PPWR text chunked. **Acceptance:** a sourcing brief's premium, gap, and CO₂ figures match endpoint output; every buyer claim carries its disclosure source; stale prices are flagged with their as-of date.