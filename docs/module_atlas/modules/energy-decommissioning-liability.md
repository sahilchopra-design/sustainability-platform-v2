# Decommissioning Liability
**Module ID:** `energy-decommissioning-liability` · **Route:** `/energy-decommissioning-liability` · **Tier:** B (frontend-computed) · **EP code:** EP-CU5 · **Sprint:** CU

## 1 · Overview
Cost estimation, funding gap analysis, regulatory bond requirements, and stranded asset linkage.

**How an analyst works this module:**
- Liability Overview shows cost by asset type
- Funding Gap compares provisions vs estimates

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSETS`, `JURISDICTIONS`, `NGFS_SCENARIOS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ASSETS` | 20 | `type`, `country`, `est_cost_mn`, `provision_mn`, `retirement`, `bond_required` |
| `NGFS_SCENARIOS` | 6 | `retirement_accel`, `cost_mult`, `label` |
| `JURISDICTIONS` | 11 | `bond`, `regulation`, `coverage` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Liability Overview','Asset-Level Provisions','Funding Gap','Regulatory Requirements','Stranded Asset Link','Write-Down Scenarios'];` |
| `totalEst` | `ASSETS.reduce((s, a) => s + a.est_cost_mn, 0);` |
| `totalProv` | `ASSETS.reduce((s, a) => s + a.provision_mn, 0);` |
| `gap` | `totalEst - totalProv;` |
| `fundingRatio` | `(totalProv / totalEst * 100).toFixed(1);` |
| `scenarioData` | `useMemo(() => { return NGFS_SCENARIOS.map(sc => { const adjCost = Math.round(totalEst * sc.cost_mult);` |
| `pct` | `(a.provision_mn / a.est_cost_mn * 100).toFixed(0);` |
| `newRetire` | `a.retirement - accel;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSETS`, `JURISDICTIONS`, `NGFS_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Funding Gap | — | Model | 38% underfunded |

## 5 · Intermediate Transformation Logic
**Methodology:** Decommissioning gap analysis
**Headline formula:** `Gap = EstimatedLiability - CurrentProvision`

Costs by asset type. Scenario-accelerated: NZ2050 brings forward retirement dates.

**Standards:** ['National regulations', 'IEA']
**Reference documents:** IEA Decommissioning Report

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The guide's `Gap = EstimatedLiability − CurrentProvision` is implemented exactly, and the NGFS
scenario overlay (accelerated retirement + cost multiplier) matches the "scenario-accelerated"
description. The module is faithful to its guide; the only simplification worth flagging is that
provisions and estimated costs are **undiscounted nominal figures**, whereas an IFRS/GAAP Asset
Retirement Obligation is a discounted present value that unwinds over time (see §7.6).

### 7.1 What the module computes

The data layer is a **hand-authored 19-asset table** (`est_cost_mn`, `provision_mn`, `retirement`,
`bond_required`). Headline arithmetic:

```js
totalEst     = Σ est_cost_mn
totalProv    = Σ provision_mn
gap          = totalEst − totalProv
fundingRatio = totalProv / totalEst × 100      // %
```

Per-asset funding: `pct = provision_mn / est_cost_mn × 100`.

The **scenario engine** overlays five NGFS-labelled pathways:
```js
adj_cost  = round(totalEst × cost_mult)
adj_gap   = adj_cost − totalProv
writedown = adj_cost − totalProv               // = adj_gap
newRetire = retirement − retirement_accel      // years brought forward
```

### 7.2 Parameterisation / scoring rubric

Scenario multipliers (cost inflation + retirement acceleration):

| Scenario | `cost_mult` | `retirement_accel` (yrs) | Label |
|---|---|---|---|
| Net Zero 2050 | 1.15 | −5 | Orderly |
| Below 2 °C | 1.08 | −3 | Orderly |
| NDCs (baseline) | 1.00 | 0 | Current |
| Delayed Transition | 1.25 | −8 | Disorderly |
| Divergent | 1.12 | −4 | Disorderly |

The ordering encodes the NGFS logic that *disorderly* transitions cost the most (Delayed Transition
carries the highest 1.25× cost multiplier and the sharpest 8-year retirement pull-forward), while the
NDCs baseline leaves costs unchanged.

**Jurisdiction table (10 rows)** — real regulatory citations, hand-authored and accurate:

| Country | Bond | Regulation |
|---|---|---|
| Australia | ✓ | EPBC Act s.261+ (mining & offshore decom bond) |
| USA | ✓ | SMCRA / BSEE 30 CFR 250 (surety + P&A bonds) |
| UK | ✓ | OSPAR / Energy Act 2008 (Decommissioning Security Agreement) |
| Canada | ✓ | AER Directive 006 (Licensee Liability Rating) |
| France | ✓ | ASN nuclear decommissioning funds |
| China | ✗ | Evolving — no mandatory bond system |
| Indonesia | ✗ | PP 78/2010 (post-mining plan, limited enforcement) |

Asset cost/provision magnitudes are realistic per type (nuclear €1.4–1.8B, oil sands $2.4B, gas CCGT
$60–85M) but are **editorial synthetic values**.

### 7.3 Calculation walkthrough

Load 19 assets → sum estimated costs and provisions → gap and funding ratio → scenario overlay
recomputes cost and gap under each NGFS multiplier and pulls retirement dates forward → the
retirement-by-decade view aggregates count and cost. The single lever is `scenarioIdx` (default 2 =
NDCs baseline).

### 7.4 Worked example

Summing the 19-asset table: `totalEst ≈ $11,260M` and `totalProv ≈ $5,005M` (coal + oil sands + the
two nuclear plants dominate the provision base). Then:
```
gap          = 11,260 − 5,005 = $6,255M underfunded
fundingRatio = 5,005 / 11,260 × 100 = 44.4%
```
Under **Delayed Transition** (`cost_mult = 1.25`):
```
adj_cost  = round(11,260 × 1.25) = $14,075M
adj_gap   = 14,075 − 5,005 = $9,070M
```
So a disorderly transition widens the funding gap by ≈$2.8B (from $6.3B to $9.1B) and brings every
asset's retirement 8 years forward — the module's central message that unfunded decommissioning
liabilities are amplified by transition speed. (The guide's headline "$3.1B / 38% underfunded" reflects
an earlier asset set; the current 19-row table yields ≈44% funded.)

### 7.5 Companion analytics

- **Stranded-asset link:** retirement acceleration feeds the write-down view, connecting early
  closure to provision shortfalls (the module is the "Stranded Asset Link" node the guide references).
- **Regulatory requirements:** the jurisdiction table maps each asset's country to its bonding regime,
  distinguishing bonded jurisdictions (Australia, USA, UK, Canada) from unbonded (China, Kuwait).
- **Write-down scenarios:** `writedown = adj_gap` under each scenario — the P&L hit if the gap must
  be recognised.

### 7.6 Data provenance & limitations

- **All 19 assets are synthetic/editorial** (fictional names shared with the asset-registry module);
  the jurisdictional regulations are real and accurately cited.
- **Undiscounted:** `est_cost_mn` and `provision_mn` are nominal totals. A production ARO would
  discount the future decommissioning cash outflow to present value at a credit-adjusted risk-free
  rate and unwind the discount as interest expense each period; scenario cost multipliers here scale
  nominal cost, not the discounted PV.
- Retirement acceleration is a flat per-scenario constant applied to all assets, not asset-specific.

**Framework alignment:** **NGFS Phase IV scenarios** — the five-pathway cost/retirement overlay
mirrors NGFS's orderly/disorderly/hot-house taxonomy (Delayed Transition worst). **IAS 37 / ASC 410
Asset Retirement Obligations** — the est-cost-vs-provision gap is the core ARO adequacy test, though
the module omits discounting. **IEA decommissioning guidance** and the cited national statutes
(EPBC, SMCRA, OSPAR, ASN) provide the bonding-requirement basis for the regulatory tab.

## 9 · Future Evolution

### 9.1 Evolution A — Discounted ARO mechanics on registry-linked assets (analytics ladder: rung 2 → 3)

**What.** §7 rates the module faithful to its guide: `Gap = EstimatedLiability − Provision` implemented exactly, with a real NGFS scenario overlay (cost multipliers + retirement acceleration) — genuine rung 2. The flagged simplification is material, though: provisions and estimates are **undiscounted nominal figures**, whereas an IFRS/GAAP Asset Retirement Obligation is a discounted present value that unwinds over time. And the 19-asset table is hand-authored, disconnected from the platform's `energy-asset-registry`. Evolution A adds proper ARO mechanics and real cost anchors.

**How.** (1) `services/decommissioning_engine.py`: per-asset ARO = discounted expected cost at the retirement date (discount-rate input, accretion/unwind schedule per IAS 37 / ASC 410), so the funding gap becomes PV-correct and the scenario overlay reprices both timing (acceleration shortens the discount period, *raising* PV — an effect the current nominal model cannot show) and cost. (2) Assets join the registry's `energy_assets` table (its Evolution A) instead of a parallel list — retirement dates and book values come from one source. (3) Rung 3: calibrate per-type cost benchmarks against published decommissioning actuals (North Sea Transition Authority cost estimates for offshore, IEA/NEA data for nuclear, EPA bonding data for coal), replacing the authored `est_cost_mn` values with sourced ranges; bench-pin the PV arithmetic with a worked unwind schedule.

**Prerequisites.** Registry Evolution A (shared asset table); discount-rate policy decision (risk-free vs credit-adjusted, disclosed). **Acceptance:** a fixture asset's ARO reproduces a hand-computed PV and unwind table; NZ2050 acceleration shows the PV-increase effect; each cost estimate cites its benchmark source.

### 9.2 Evolution B — Provisioning what-if analyst for CFO and regulator questions (LLM tier 2)

**What.** A tool-calling analyst for the module's decision questions: "if Delayed Transition brings coal retirements forward 8 years, what's our PV funding gap, which jurisdictions' bond requirements bind, and what annual top-up closes the gap by retirement?" It chains Evolution A's endpoints — ARO recompute per scenario, per-jurisdiction bond rules from the existing 11-row `JURISDICTIONS` table (promoted to reference data), funding-schedule solver — and drafts the provisioning memo with every figure from tool output.

**How.** Tools: `compute_aro(asset, scenario, discount_rate)`, `get_funding_gap(portfolio, scenario)`, `get_bond_requirements(jurisdiction)`, `solve_funding_schedule(gap, years)`. Grounding corpus = this Atlas record's §7.1 formulas plus the scenario multiplier table, so the analyst explains *why* acceleration raises PV rather than hand-waving. The memo distinguishes regulatory bond shortfalls (hard obligations) from economic underfunding (judgment), a distinction already latent in the module's `bond_required` field.

**Prerequisites (hard).** Evolution A — the current nominal arithmetic would have the analyst confidently reporting gaps that ignore discounting, and the hand-authored assets aren't anyone's real book. **Acceptance:** a golden scenario memo's gap equals the engine's PV output; the funding schedule's terminal value closes the gap exactly; jurisdictions absent from the reference table are reported as uncovered.