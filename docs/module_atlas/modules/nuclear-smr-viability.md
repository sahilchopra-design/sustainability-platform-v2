# Nuclear SMR Viability
**Module ID:** `nuclear-smr-viability` · **Route:** `/nuclear-smr-viability` · **Tier:** B (frontend-computed) · **EP code:** EP-CL4 · **Sprint:** CL

## 1 · Overview
5 SMR designs (NuScale, BWRX-300, RR, Xe-100, Natrium) with LCOE, deployment pipeline, and regulatory status.

**How an analyst works this module:**
- Technology Comparison shows 5 designs side-by-side
- Regulatory Approval Tracker shows NRC/ONR/CNSC status
- Investment Thesis presents bull and bear cases

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `DESIGNS`, `GRID_SERVICES`, `KPI`, `PIPELINE`, `REG_TRACKER`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DESIGNS` | 6 | `vendor`, `type`, `capacityMW`, `modulesPerPlant`, `totalMW`, `lcoe2024`, `lcoe2030`, `lcoe2040`, `constructionMo`, `trl`, `regStatus`, `country`, `capexPerKW`, `h2Capable`, `loadFollow`, `color` |
| `REG_TRACKER` | 5 | `designs`, `status`, `timeline` |
| `PIPELINE` | 7 | `location`, `design`, `capacity`, `fid`, `cod`, `status` |
| `GRID_SERVICES` | 7 | `value`, `desc`, `smrAdvantage` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `radarData` | `DESIGNS.map(d=>({ name:d.name, Cost:Math.round(100-d.lcoe2030), Capacity:Math.round(d.totalMW/5), Timeline:Math.round(100-d.constructionMo*2), TRL:d.trl*10, Versatility:(d.h2Capable?20:0)+(d.loadFollow?20:0)+40 }));` |
| `totalPipeline` | `PIPELINE.reduce((s,p)=>s+parseInt(p.capacity),0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DESIGNS`, `GRID_SERVICES`, `PIPELINE`, `REG_TRACKER`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Designs Compared | — | WNA | NuScale VOYGR, BWRX-300, RR SMR, Xe-100, Natrium |
| First Commercial | — | NRC/ONR | Expected first commercial deployment |

## 5 · Intermediate Transformation Logic
**Methodology:** SMR LCOE comparison
**Headline formula:** `LCOE = (CapEx×CRF + OpEx + Fuel) / AnnualOutput`

5 designs compared on capacity, cost, deployment timeline, and regulatory approval status. Grid services value stack: baseload + load-following + H₂ co-production.

**Standards:** ['WNA', 'NRC', 'ONR']
**Reference documents:** World Nuclear Association; NRC SMR Applications; ONR GDA Process

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

Like its sibling `nuclear-market-intelligence`, this module is primarily a **curated static
reference dataset** for five real SMR programmes, with one lightweight derived radar-normalisation
formula. There is no LCOE *calculation* engine here (contrast with `nuclear-lcoe-economics`) — the
`lcoe2024/2030/2040` figures are hand-entered per design, not computed from capex/opex inputs.

### 7.1 What the module computes

`DESIGNS` — 5 real SMR programmes with real vendor names and plausible technical/regulatory detail:

| Design | Vendor | Type | MW (total) | LCOE 2024→2040 | Build (mo) | TRL | Reg. status |
|---|---|---|---|---|---|---|---|
| NuScale VOYGR | NuScale Power | iPWR | 462 (6×77) | $89→$48 | 36 | 8 | **NRC Design Certified** (real, 2023) |
| BWRX-300 | GE-Hitachi | BWR | 300 | $75→$42 | 24 | 7 | NRC Review |
| Rolls-Royce SMR | Rolls-Royce | PWR | 470 | $82→$45 | 48 | 6 | **ONR GDA Step 3** (real, UK process) |
| Xe-100 | X-energy | HTGR | 320 (4×80) | $95→$50 | 30 | 6 | NRC Pre-Application |
| Natrium | TerraPower | SFR+Storage | 345 | $85→$46 | 42 | 5 | NRC Pre-Application |

These TRL levels, regulatory-status labels, and design configurations (NuScale's 6-module VOYGR-77
plant architecture, Natrium's sodium-fast-reactor + molten-salt storage hybrid, Xe-100's 4×80MW
pebble-bed HTGR) are **factually consistent with each vendor's real, publicly disclosed design**.

The only computed field is a **radar-chart normalisation**, not an LCOE model:

```js
radarData[d] = {
  Cost:        100 − lcoe2030                          // higher = cheaper (inverted scale)
  Capacity:    round(totalMW / 5)                        // arbitrary /5 scaling to fit 0–100 axis
  Timeline:    100 − constructionMo × 2                   // higher = faster build
  TRL:         trl × 10                                   // TRL 1–9 → 10–90
  Versatility: (h2Capable?20:0) + (loadFollow?20:0) + 40   // base 40 + flexibility bonuses
}
```

### 7.2 Parameterisation

`REG_TRACKER` (4 regulators: NRC, ONR, CNSC, ASN) lists each design's real approval stage and a
target-completion year (NuScale "Completed," others 2025–2030) — a genuine regulatory-status
tracker, not scored. `PIPELINE` (6 named real/plausible projects — Carbon Free Power Project Idaho,
Darlington Ontario, Wylfa Wales, Kemmerer Wyoming, DOW Chemical Texas, Kozloduy Bulgaria) each carry
an FID year, COD year, and status. `GRID_SERVICES` (6 services — Baseload, Load Following, H₂
Co-production, District Heating, Desalination, Grid Inertia) each score an illustrative `value`
(15–45) and a qualitative `smrAdvantage` (High/Medium) rating — not derived from the DESIGNS table.

### 7.3 Calculation walkthrough

1. `totalPipeline = Σ parseInt(p.capacity)` sums the 6 `PIPELINE` projects' capacity strings (e.g.
   `"462 MW"` → `parseInt` extracts `462`) to a headline "Pipeline Capacity" KPI.
2. `radarData` normalises each design's 5 attributes onto a common ~0–100 scale for the Technology
   Comparison radar — this is a **display-normalisation trick**, not a composite viability score;
   the axes are not combined into a single ranking number anywhere.
3. Selecting a design (`selectedDesign`) filters the KPI strip and highlights its row/radar trace
   across all six tabs; no other tab recomputes anything from the selection beyond display
   filtering.
4. **Cost Learning Curves tab** plots the static `lcoe2024→2030→2040` three-point series per design
   — a hand-set decline path, not a Wright's-Law fit (contrast with `nuclear-lcoe-economics`'s
   `learningCurveData`, which does apply a progress-ratio formula).

### 7.4 Worked example

NuScale VOYGR radar values: `Cost = 100−65 = 35`; `Capacity = round(462/5) = 92`;
`Timeline = 100−36×2 = 28`; `TRL = 8×10 = 80`; `Versatility = 0(not h2Capable)+20(loadFollow)+40 =
60`. Compare Rolls-Royce SMR: `Cost = 100−60=40`; `Capacity = round(470/5)=94`;
`Timeline = 100−48×2=4`; `TRL=6×10=60`; `Versatility=20(h2)+20(loadFollow)+40=80`. The radar
correctly surfaces NuScale's TRL/regulatory-maturity lead (TRL 80 vs. 60, reflecting its real 2023
NRC certification) against Rolls-Royce's longer build time penalty (Timeline 4 vs. 28, reflecting
its later 48-month construction estimate) — the relative ordering is sensible even though the
underlying numbers are hand-entered rather than modelled.

### 7.5 Data provenance & limitations

- Design specs, TRL levels, and regulatory statuses are **plausible and broadly consistent with
  real, public 2024-era SMR programme status** for all five vendors — one of the platform's more
  factually grounded reference tables.
- `lcoe2024/2030/2040` are **manually authored, not computed** from capex/opex/capacity-factor
  inputs — unlike `nuclear-lcoe-economics`, there is no underlying financial formula a user could
  audit or stress-test by changing capex assumptions.
- The radar axes' scaling constants (`/5` for capacity, `×2` for timeline, `×10` for TRL) are
  arbitrary choices to fit a 0–100 display range, not a validated multi-criteria weighting scheme —
  no combined "viability score" is computed from them.
- `GRID_SERVICES` values and `smrAdvantage` ratings are qualitative judgments, not derived from the
  DESIGNS table's `h2Capable`/`loadFollow` flags (e.g. H₂ Co-production is scored "High" advantage
  independent of which specific designs are actually `h2Capable`).

**Framework alignment:** NRC Design Certification / ONR Generic Design Assessment (GDA) / CNSC
Vendor Design Review — all four regulatory processes and the designs' stage-labels are real and
current as of the page's authoring · WNA — SMR classification (≤300 MWe factory-fabricated) matches
the standard industry definition, though several tracked designs (Rolls-Royce 470MW, Natrium 345MW)
exceed the strict ≤300MWe threshold, reflecting the industry's looser real-world usage of "SMR" to
include these larger advanced designs.

## 9 · Future Evolution

### 9.1 Evolution A — Compute SMR LCOE instead of hand-entering it (analytics ladder: rung 1 → 3)

**What.** §7 confirms this is primarily a curated static reference for five real SMR programmes (NuScale VOYGR, BWRX-300, Rolls-Royce SMR, Xe-100, Natrium) with factually accurate vendor/TRL/regulatory detail (NuScale NRC design-certified 2023, RR ONR GDA Step 3), plus one lightweight radar normalisation. Critically, the `lcoe2024/2030/2040` figures are hand-entered per design, not computed — unlike the sibling `nuclear-lcoe-economics`, which has a real annuitized-LCOE engine. Evolution A connects the two so SMR LCOE is derived, and the radar reflects computed economics.

**How.** (1) Feed each SMR design's capex/opex/fuel/capacity-factor into the `nuclear-lcoe-economics` engine (the real annuitized model with IDC compounding already exists — reuse it rather than hand-typing LCOE) so `lcoe2024→2040` becomes computed output, with the 2030/2040 decline driven by a factory-learning curve rather than three hand-set numbers. (2) The radar-chart `Cost` axis (`100 − lcoe2030`) then reflects a real LCOE, and the arbitrary `Capacity: totalMW/5` and `Timeline: 100 − mo×2` scalings get principled 0–100 normalisations. (3) Keep the accurate regulatory-status and TRL data as-is (it is real and valuable) but tag each with its source and date.

**Prerequisites.** Consuming the `nuclear-lcoe-economics` engine (shared dependency — pin both before wiring); per-design capex/opex inputs sourced to vendor disclosures or NEA estimates rather than back-solved from the hand-entered LCOE. **Acceptance:** each SMR's LCOE reproduces from its cost inputs via the shared engine; the 2040 figure derives from a learning curve; the radar Cost axis tracks computed LCOE.

### 9.2 Evolution B — SMR-diligence copilot with bull/bear framing (LLM tier 1 → 2)

**What.** A copilot for the investment-thesis workflow §1 describes: "compare NuScale and BWRX-300 on cost and regulatory maturity", "what's the bear case on Natrium?", "which SMRs are furthest along NRC approval?" — grounded in the five designs' real technical/regulatory data and (post-Evolution-A) their computed LCOE.

**How.** Tier 1 works now on the accurate static data: system prompt from this Atlas page's design table (§7.1) plus the WNA/NRC/ONR references named in §5; the copilot compares designs citing real TRL, regulatory status, and configuration facts, and articulates bull/bear cases from the module's own investment-thesis content. Tier 2, post-Evolution-A: tool calls to the shared LCOE engine for computed cost comparisons and sensitivity, with the fabrication validator matching every $/MWh to a tool response. The copilot must distinguish real regulatory milestones (NuScale certified, RR GDA Step 3) from projected timelines, and refuse to predict approval dates.

**Prerequisites.** Tier 1 on current data; computed cost comparisons need Evolution A. The copilot must not present hand-entered LCOE as modelled until then. **Acceptance:** design comparisons cite real regulatory/TRL facts; LCOE comparisons (post-Evolution-A) trace to engine calls; refusal on speculative approval-date questions.