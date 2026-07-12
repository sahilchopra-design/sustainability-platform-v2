# Solar + Storage Co-located Finance
**Module ID:** `solar-plus-storage-finance` · **Route:** `/solar-plus-storage-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EC3 · **Sprint:** EC

## 1 · Overview
Co-located solar PV and BESS project finance analytics. Covers IRA Investment Tax Credit stacking (base 30% plus domestic content, energy community, and low-income adders), revenue stack modelling across energy/capacity/ancillary markets, and merchant risk quantification.

> **Business value:** Used by solar+storage developers, project finance banks, and tax equity investors to evaluate co-located solar and battery projects benefiting from IRA incentive stacking and multi-market revenue optimization.

**How an analyst works this module:**
- Use IRA incentive model to calculate total ITC by project location
- Review revenue stack for energy/capacity/ancillary decomposition
- Analyse merchant risk for P90/P50 revenue scenarios
- Examine storage sizing for optimal battery duration

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUPLING_TYPES`, `DEGRADATION_CURVE`, `ITC_TIERS`, `KPI_CARD`, `PROJECTS`, `STATES`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ITC_TIERS` | 5 | `rate`, `requirement`, `color` |
| `TABS` | 7 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `COUPLING_TYPES` | `['AC-Coupled', 'DC-Coupled', 'Hybrid (Both)'];` |
| `capacityMwAc` | `50 + Math.round(sr(i * 7) * 450);` |
| `dcAcRatio` | `1.15 + sr(i * 11) * 0.45;` |
| `storageMwh` | `capacityMwAc * (1.0 + sr(i * 13) * 3.0);` |
| `itcAddedPct` | `6 + sr(i * 17) * 4;` |
| `clippingLossPct` | `2 + sr(i * 19) * 5;` |
| `totalItcPct` | `baseItc + itcAddedPct;` |
| `energyRevM` | `capacityMwAc * 0.22 * 8760 * 48 / 1e6;` |
| `capacityRevM` | `capacityMwAc * 5.5 / 1e3;` |
| `ancillaryRevM` | `storageMwh * 0.8 / 1e3;` |
| `irrBase` | `7.5 + sr(i * 23) * 4.5;` |
| `irrWithStorage` | `irrBase + 1.5 + sr(i * 29) * 2.0;` |
| `augmentationYr` | `8 + Math.round(sr(i * 31) * 5);` |
| `kpis` | `useMemo(() => { const totalMwAc = filtered.reduce((s, p) => s + p.capacityMwAc, 0);` |
| `totalMwh` | `filtered.reduce((s, p) => s + p.storageMwh, 0);` |
| `avgDcAc` | `filtered.length ? filtered.reduce((s, p) => s + p.dcAcRatio, 0) / filtered.length : 0;` |
| `avgIrrBase` | `filtered.length ? filtered.reduce((s, p) => s + p.irrBase, 0) / filtered.length : 0;` |
| `avgIrrStorage` | `filtered.length ? filtered.reduce((s, p) => s + p.irrWithStorage, 0) / filtered.length : 0;` |
| `avgItc` | `filtered.length ? filtered.reduce((s, p) => s + p.totalItcPct, 0) / filtered.length : 0;` |
| `revenueData` | `useMemo(() => filtered.slice(0, 12).map(p => ({ name: p.name, energy: p.revenueStack.energy, capacity: p.revenueStack.capacity, ancillary: p.revenueStack.ancillary, total: +(p.revenueStack.energy + p.revenueStack.capacity + p.revenueStack.ancillary).toFixed(2), })), [filtered]);` |
| `irrComparison` | `useMemo(() => filtered.slice(0, 14).map(p => ({ name: p.name, irrBase: p.irrBase, irrStorage: p.irrWithStorage, uplift: +(p.irrWithStorage - p.irrBase).toFixed(2), })), [filtered]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUPLING_TYPES`, `ITC_TIERS`, `STATES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| IRA ITC Total (%) | `ITC = 30 + DC(10) + EC(10) + LI(20)` | IRS Notice 2023-29 | Maximum 70% ITC combining all four adders; domestic content requires ≥40% US steel/iron and manufactured products. |
| BESS Duration (hours) | `Rated_capacity_MWh / Rated_power_MW` | NREL Storage Futures Study | 4-hour BESS qualifies for capacity market; 2-hour for energy arbitrage and frequency regulation. |
| Revenue Stack ($/MWh solar) | `Rev = energy + capacity/8760 + AS_revenue` | CAISO/PJM market data | Ancillary services $20-60/MW-hr in CAISO; capacity $50-200/MW-yr in PJM; energy arbitrage $15-50/MWh in ERCOT. |
- **CAISO/PJM market prices + IRA guidance + project cost data** → ITC stack calculation + revenue optimization + DSCR/IRR model → **Solar+storage project finance: ITC benefit, revenue stack, merchant risk, IRR**

## 5 · Intermediate Transformation Logic
**Methodology:** IRA ITC Stack & Revenue Optimization
**Headline formula:** `ITC_total = ITC_base + DC_adder + EC_adder + LI_adder; Revenue = energy_arb + capacity_payment + AS_revenue`

IRA ITC base 30%; domestic content adder +10%; energy community adder +10%; low-income adder +20%. Revenue stacking: energy arbitrage, capacity market payments (PJM/MISO/CAISO), ancillary services (frequency regulation highest $/MW in CAISO).

**Standards:** ['IRA §48C/48E Investment Tax Credit Guidance (IRS 2023)', 'FERC Order 841', 'NREL Storage Futures Study']
**Reference documents:** IRA §48C/48E ITC Guidance (IRS 2023); FERC Order 841 Storage Market Participation Rule; NREL Storage Futures Study (2021)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (internal disconnect).** The guide's formula
> `Revenue = energy_arb + capacity_payment + AS_revenue` implies the IRR uplift from storage should be
> derivable from the computed revenue stack. **It is not.** `irrWithStorage` is generated by an
> **independently seeded random draw** (`irrBase + 1.5 + sr(i*29)×2.0`), disconnected from the
> `revenueStack.energy/capacity/ancillary` figures computed for the same project row. A project's displayed
> revenue stack and its displayed IRR uplift cannot be reconciled with each other.

### 7.1 What the module computes

`PROJECTS` (22 synthetic solar+storage sites across 10 US states, `sr()`-seeded) carries `capacityMwAc`
(50–500MW), `dcAcRatio` (1.15–1.60), `storageMwh` (1–4× the AC capacity), a coupling type (AC/DC/Hybrid),
an IRA ITC stack, and three independently-computed elements:

```js
// Revenue stack ($M)
energyRevM    = capacityMwAc × 0.22(capacity factor) × 8760 × $48/MWh / 1e6
capacityRevM  = capacityMwAc × $5.5k/MW-yr / 1e3
ancillaryRevM = storageMwh × $0.8k/MWh-yr / 1e3

// ITC stack
totalItcPct = 30 (base) + itcAddedPct   // itcAddedPct = 6–10%, synthetic — should map to the discrete ITC_TIERS adders (10/10/20) but is drawn as a continuous random value instead

// IRR (disconnected from the revenue stack above)
irrBase        = 7.5 + sr(i×23)×4.5              // 7.5–12.0%
irrWithStorage = irrBase + 1.5 + sr(i×29)×2.0    // +1.5 to +3.5pp uplift, NOT derived from ancillaryRevM
```

### 7.2 Parameterisation

| Parameter | Value | Provenance |
|---|---|---|
| `ITC_TIERS` | Base 30% (prevailing wage + apprenticeship), +10% domestic content (IRA §48E, ≥40% US-manufactured content), +10% energy community, +20% low-income community | correctly reflects the real IRA §48E adder structure — base + 3 stackable bonus tiers summing to a maximum 70% |
| `itcAddedPct` (per project) | continuous 6–10% synthetic draw | **inconsistent with `ITC_TIERS`**, which specifies discrete 10/10/20-point adders — a real project would stack whole adders (e.g. 30+10=40% or 30+10+10=50%), not a continuous 6-10% increment |
| Capacity factor assumption | 22% (fixed across all projects) | reasonable US utility-scale solar average, but applied uniformly regardless of each project's actual state (Arizona/Nevada sun-belt sites should plausibly show higher CF than North Carolina/Colorado) |
| Energy price | $48/MWh (fixed) | plausible PPA-equivalent price, not state- or ISO-specific (ERCOT/CAISO/PJM pricing differs materially) |
| Capacity payment | $5.5k/MW-yr | plausible order of magnitude for a capacity market clearing price, not sourced to a specific ISO auction result |
| Ancillary payment | $0.8k/MWh-yr of storage | plausible order of magnitude, not sourced |
| `couplingComparison` (hand-set, not per-project) | DC-coupled: lowest clipping loss (1.8%), highest round-trip efficiency (92%), highest ITC eligibility (40%), lower dispatch flexibility (85%) vs AC-coupled | consistent with the real engineering trade-off between AC- and DC-coupled solar+storage systems |

### 7.3 Calculation walkthrough

- **IRA Tax Credit Optimizer tab**: sums `totalItcPct = 30 + itcAddedPct` per project — a simple addition,
  but see the parameterisation note above regarding the mismatch between the continuous `itcAddedPct` draw
  and the discrete `ITC_TIERS` structure it's meant to represent.
- **Revenue Stacking tab**: bars `energy`/`capacity`/`ancillary` per project and sums to `total` — correct
  arithmetic on the underlying (synthetic) revenue components.
- **DC vs AC Coupling tab**: renders the static `couplingComparison` table — not project-specific, applies
  uniformly regardless of which project a user is viewing.
- **Degradation & Augmentation tab**: `DEGRADATION_CURVE` models solar output declining ~0.55%/yr and BESS
  capacity declining ~2.1%/yr, with a +30-percentage-point step-change at year 10 representing a battery
  augmentation event (partial re-powering) — a reasonable illustrative shape for battery capacity fade +
  mid-life augmentation, though the specific 2.1%/yr BESS fade rate and +30pp augmentation jump are not
  cited to a specific chemistry or vendor warranty curve.

### 7.4 Worked example (project `i=0`)

`capacityMwAc = 50 + round(sr(0)×450)`; illustratively assume `capacityMwAc=280`, `storageMwh=280×(1+sr(0×13)×3)≈560`:

| Step | Computation | Result |
|---|---|---|
| Energy revenue | 280 × 0.22 × 8760 × 48 / 1e6 | **$25.87M/yr** |
| Capacity revenue | 280 × 5.5 / 1e3 | **$1.54M/yr** |
| Ancillary revenue | 560 × 0.8 / 1e3 | **$0.448M/yr** |
| Total revenue | 25.87+1.54+0.45 | **$27.86M/yr** |
| `irrBase` | 7.5 + sr(0×23)×4.5 | illustratively ≈10% |
| `irrWithStorage` | irrBase + 1.5 + sr(0×29)×2.0 | illustratively ≈12–13% (independent of the $0.45M ancillary revenue figure above) |

The IRR uplift (+1.5 to +3.5pp) bears no arithmetic relationship to the ancillary revenue's actual share of
total project revenue (here just 1.6%) — a $0.45M ancillary stream on a $280M+ capex project would not
plausibly move project IRR by 1.5-3.5 percentage points on its own; this confirms the two figures are
generated independently rather than causally linked.

### 7.5 Data provenance & limitations

- **All 22 project figures are synthetic**, generated by `sr(seed)=frac(sin(seed+1)×10⁴)`.
- **IRR uplift is disconnected from the computed revenue stack** — see the mismatch flag above; a production
  model should derive `irrWithStorage` from a full project-finance cash-flow model incorporating the
  `ancillaryRevM` figure, not an independent random draw.
- ITC adder modelling uses a continuous random percentage rather than the real discrete stacking structure
  (10/10/20-point bonus tiers) defined in its own `ITC_TIERS` reference table.
- Energy price, capacity payment, and ancillary payment are flat constants applied to all 22 projects
  regardless of state/ISO — real revenue varies substantially by market (ERCOT vs CAISO vs PJM).

### 7.6 Framework alignment

- **IRA §48C/§48E ITC guidance (IRS Notice 2023-29)** — the `ITC_TIERS` structure (base 30% + 3 stackable
  10/10/20-point adders) is a faithful representation of the real statutory adder framework; per-project
  application is simplified to a continuous draw rather than discrete tier selection.
- **FERC Order 841** — cited as enabling storage market participation; not modelled as a specific market-rule
  constraint in the revenue calculation.
- **NREL Storage Futures Study** — cited for BESS duration/revenue-stack context; the module's revenue-stream
  categories (energy arbitrage, capacity, ancillary services) match the study's standard revenue-stacking
  taxonomy.

## 9 · Future Evolution

### 9.1 Evolution A — Connect IRR to the revenue stack and discretise the ITC tiers (analytics ladder: rung 1 → 2)

**What.** The §7 mismatch flag identifies the core defect: the guide implies IRR should derive from the computed `revenueStack.energy/capacity/ancillary`, but `irrWithStorage = irrBase + 1.5 + sr(i×29)×2.0` is an **independent random draw** disconnected from the revenue figures on the same row — a project's displayed revenue stack and its IRR uplift cannot be reconciled. A second gap: `totalItcPct = 30 + itcAddedPct` draws the adder as a continuous random value instead of mapping to the discrete `ITC_TIERS` (10/10/20) the module correctly documents. The good news is `ITC_TIERS` itself faithfully encodes the real IRA §48E adder structure. Evolution A wires IRR to the revenue stack and makes the ITC discrete.

**How.** (1) Build a real project-finance calculation: revenue stack (energy arbitrage + capacity + ancillary) net of opex and debt service → project and equity IRR, so `irrWithStorage` is *derived*, and the storage uplift is exactly the ancillary/capacity revenue the battery adds. (2) Replace the continuous `itcAddedPct` draw with discrete tier selection from `ITC_TIERS` (domestic content +10, energy community +10, low-income up to +20), so the ITC stack matches the statutory structure. (3) Scenario the merchant P90/P50 revenue cases the overview promises against real market price bands (PJM/MISO/CAISO). (4) Storage-duration optimisation: sweep battery MWh and show the IRR-maximising duration.

**Prerequisites.** Market price assumptions per ISO (illustrative bands acceptable if cited); the synthetic `PROJECTS` roster should be seedable from real project parameters. **Acceptance:** IRR uplift equals the incremental storage revenue divided through the model, not a random draw; ITC stack takes only discrete tier values; duration sweep produces an optimum.

### 9.2 Evolution B — IRA-stacking and revenue-optimisation copilot (LLM tier 1)

**What.** A copilot for the developer/tax-equity/lender users: "what's my total ITC if this project is in an energy community with domestic-content modules?", "how much does 4-hour storage add to IRR vs 2-hour?", "decompose this project's revenue stack" — answered from the `ITC_TIERS` structure and, post-Evolution-A, the connected revenue/IRR model.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/solar-plus-storage-finance/ask`, corpus = this Atlas record (the §48E adder structure, FERC Order 841, NREL Storage Futures taxonomy) plus live page state. ITC-stacking answers walk the discrete tiers and cite each adder's eligibility rule; revenue and IRR answers narrate the computed model. The copilot flags the honest caveat (pre-Evolution-A) that IRR and revenue don't yet reconcile.

**Prerequisites (hard).** Evolution A — narrating the current disconnected IRR would present a random number as if it followed from the revenue stack, exactly the reconciliation failure the §7 flag warns about. **Acceptance:** every ITC and IRR figure traces to the computed model; ITC answers use only discrete tier values; a location's adder eligibility cites the governing rule.