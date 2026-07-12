# Solar Asset Repowering & Life Extension
**Module ID:** `solar-repowering-analytics` · **Route:** `/solar-repowering-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-EC6 · **Sprint:** EC

## 1 · Overview
Solar PV asset repowering and life extension analytics. Models degradation trajectories for aging fleets, quantifies AEP uplift from technology upgrades, evaluates repowering economics, restructures PPA agreements, and provides incremental IRR analysis for capital allocation.

> **Business value:** Used by solar asset managers, institutional owners, project finance banks, and O&M providers to evaluate repowering aging solar fleets and extend productive asset life beyond initial PPA terms.

**How an analyst works this module:**
- Filter by vintage year to identify highest-priority repowering candidates
- Use degradation analysis tab for current output vs nameplate modelling
- Review repowering economics for NPV and incremental IRR
- Analyse PPA restructuring for term extension and price renegotiation

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AEP_UPLIFT_DRIVERS`, `DECOMMISSION_COSTS`, `KPI_CARD`, `OWNERS`, `PPA_RESTRUCTURING`, `PROJECTS`, `STATES_REPOWER`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DECOMMISSION_COSTS` | 7 | `costPerMw`, `note` |
| `AEP_UPLIFT_DRIVERS` | 7 | `uplift`, `source` |
| `PPA_RESTRUCTURING` | 6 | `term`, `impact`, `risk` |
| `TABS` | 7 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `vintageYear` | `2008 + Math.round(sr(i * 7) * 8);` |
| `currentCapacityMw` | `20 + Math.round(sr(i * 11) * 280);` |
| `newCapacityMw` | `currentCapacityMw * (1.2 + sr(i * 13) * 0.8);` |
| `aepUpliftPct` | `15 + sr(i * 17) * 20;` |
| `repowerCapex` | `newCapacityMw * (0.55 + sr(i * 19) * 0.20) * 1e6;` |
| `inverterReplaceCost` | `currentCapacityMw * (0.04 + sr(i * 23) * 0.03) * 1e6;` |
| `moduleUpgradeCost` | `newCapacityMw * (0.25 + sr(i * 29) * 0.12) * 1e6;` |
| `remainingPPAyrs` | `2 + Math.round(sr(i * 31) * 12);` |
| `currentAep` | `currentCapacityMw * 0.21 * 8760 / 1000; // GWh` |
| `newAep` | `currentAep * (1 + aepUpliftPct / 100);` |
| `annualRevDelta` | `(newAep - currentAep) * 50 * 1000; // $k (50 $/MWh)` |
| `repowerIrr` | `7.0 + sr(i * 37) * 5.5;` |
| `lifeExtIrr` | `4.5 + sr(i * 41) * 3.5;` |
| `plantAge` | `2026 - vintageYear;` |
| `kpis` | `useMemo(() => { const totalCurrentMw = filtered.reduce((s, p) => s + p.currentCapacityMw, 0);` |
| `totalNewMw` | `filtered.reduce((s, p) => s + p.newCapacityMw, 0);` |
| `avgAepUplift` | `filtered.length ? filtered.reduce((s, p) => s + p.aepUpliftPct, 0) / filtered.length : 0;` |
| `avgRepowerIrr` | `filtered.length ? filtered.reduce((s, p) => s + p.repowerIrr, 0) / filtered.length : 0;` |
| `avgAge` | `filtered.length ? filtered.reduce((s, p) => s + p.plantAge, 0) / filtered.length : 0;` |
| `repowerVsExtendData` | `useMemo(() => filtered.slice(0, 12).map(p => ({ name: p.name, repowerIrr: p.repowerIrr, lifeExtIrr: p.lifeExtIrr, diff: +(p.repowerIrr - p.lifeExtIrr).toFixed(2), })), [filtered]);` |
| `capexWaterfallData` | `useMemo(() => { const avgInverter = filtered.length ? filtered.reduce((s, p) => s + p.inverterReplaceM, 0) / filtered.length : 0;` |
| `avgModule` | `filtered.length ? filtered.reduce((s, p) => s + p.moduleUpgradeM, 0) / filtered.length : 0;` |
| `avgTotal` | `filtered.length ? filtered.reduce((s, p) => s + p.repowerCapexM, 0) / filtered.length : 0;` |
| `avgOther` | `avgTotal - avgInverter - avgModule;` |
| `degradeOld` | `base * Math.pow(0.9945, yr) * (1 - yr * 0.003);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AEP_UPLIFT_DRIVERS`, `DECOMMISSION_COSTS`, `OWNERS`, `PPA_RESTRUCTURING`, `STATES_REPOWER`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Annual Degradation Rate (%/yr) | `Fit to IV curve measurements` | NREL meta-analysis Jordan et al. 2016 | Year 1 LID 1-3%; subsequent 0.3-0.7%/yr mono-Si; PERC LeTID can increase mid-life degradation. |
| Repowering AEP Uplift (%) | `Uplift = (P_new × tracker_gain) / P_degraded - 1` | Fraunhofer ISE / Wood Mackenzie | Bifacial TOPCon SAT replacing 2008 polycrystalline fixed-tilt can deliver 35% AEP uplift. |
| Incremental IRR (%) | `IRR of (repowering_CAPEX, ΔAEP × price × years)` | Wood Mackenzie Repowering Economics 2023 | Sites with existing grid connection and long remaining land leases have highest incremental returns. |
- **Performance monitoring + degradation models + CAPEX benchmarks** → Degradation trajectory + repowering NPV + PPA restructuring analysis → **Repowering decision: incremental IRR, optimal timing, technology selection, PPA renegotiation**

## 5 · Intermediate Transformation Logic
**Methodology:** Degradation Model & Repowering NPV
**Headline formula:** `P_current = P_initial × (1-d)^age; Repowering_NPV = ΔAEP × PPA_price × life_remaining - repowering_CAPEX`

Annual degradation 0.5-0.8%/yr for c-Si (Jordan et al. 2016). After 20-25 years, typical c-Si retains 70-82% initial power. Repowering CAPEX $0.25-0.65/Wdc. AEP uplift 15-35% from bifacial TOPCon + tracker replacing polycrystalline fixed-tilt.

**Standards:** ['IEC 61724 Solar PV Performance', 'NREL Degradation Rate Meta-Analysis (Jordan 2016)', 'Fraunhofer ISE Repowering Guidelines']
**Reference documents:** Jordan et al. (2016) – PV Degradation Rates, Prog. Photovolt.; Fraunhofer ISE Solar Repowering Guidelines 2022; Wood Mackenzie Repowering Market Report 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (internal disconnect).** The guide's formula
> `Repowering_NPV = ΔAEP × PPA_price × life_remaining − repowering_CAPEX` implies `repowerIrr` should be
> derivable from `aepUpliftPct`, `annualRevDeltaM`, and `repowerCapexM` for the same project. **It is not.**
> `repowerIrr` and `lifeExtIrr` are generated by **independent `sr()` draws** disconnected from the computed
> AEP-uplift revenue and capex figures on the same row.

### 7.1 What the module computes

`PROJECTS` (18 synthetic aging solar sites, real named owners — NextEra Energy, Brookfield RE, Ørsted, EDP
Renewables, Enel Green Power, AES Clean Energy, Invenergy) models degradation and repowering economics:

```js
vintageYear         = 2008 + round(sr(i×7)×8)                    // 2008–2016 vintage
currentCapacityMw   = 20 + round(sr(i×11)×280)
newCapacityMw       = currentCapacityMw × (1.2 + sr(i×13)×0.8)   // 1.2–2.0× expansion
aepUpliftPct        = 15 + sr(i×17)×20                            // 15–35%
currentAep(GWh)      = currentCapacityMw × 0.21(CF) × 8760/1000
newAep               = currentAep × (1 + aepUpliftPct/100)
annualRevDelta($k)   = (newAep − currentAep) × $50/MWh × 1000
repowerIrr           = 7.0 + sr(i×37)×5.5                         // 7.0–12.5%, INDEPENDENT of annualRevDelta/repowerCapex
lifeExtIrr           = 4.5 + sr(i×41)×3.5                         // 4.5–8.0%, INDEPENDENT
recommendation        = repowerIrr>9.5 ? 'Full Repower' : repowerIrr>7.5 ? 'Partial Repower' : 'Life Extension'
```

### 7.2 Parameterisation

| Parameter | Value | Provenance |
|---|---|---|
| Baseline capacity factor | 0.21 (21%) | plausible fixed-tilt US utility-scale average, applied uniformly regardless of state |
| Energy price for revenue delta | $50/MWh (fixed) | plausible, not state/ISO-specific |
| `AEP_UPLIFT_DRIVERS` (6 hand-set drivers) | Mono-PERC→TOPCon +8%, Fixed-tilt→SAT +5%, Bifacial gain +4%, new inverters +2%, capacity expansion +12%, soiling recovery +3% (Σ=34%) | plausible decomposition matching the guide's cited 15–35% total uplift range; sums close to the upper bound of `aepUpliftPct`'s range |
| `DECOMMISSION_COSTS` (6 components) | Module removal/recycling $18k/MW, structural dismantling $12k/MW, cabling $9k/MW, etc. | plausible order-of-magnitude decommissioning cost benchmarks, not cited to a specific source |
| Recommendation thresholds | Full Repower >9.5% IRR, Partial 7.5–9.5%, else Life Extension | hand-set decision rule that **only inspects `repowerIrr`**, never comparing it against `lifeExtIrr` for the same project — a project with `repowerIrr=8%` and `lifeExtIrr=7.9%` (near-identical economics) is labelled "Partial Repower" without any comparative test against the extension alternative |

### 7.3 Calculation walkthrough

- **AEP calculation**: correctly computes annual energy production from capacity × capacity factor × hours,
  and applies the uplift percentage multiplicatively — a legitimate (if simplified, single-CF) generation
  model.
- **Revenue delta**: correctly multiplies the AEP delta by a flat energy price — arithmetically sound, though
  disconnected from IRR (see mismatch flag).
- **Decision rule**: purely threshold-based on `repowerIrr` in isolation, not a genuine repower-vs-extend
  comparative NPV/IRR test as the guide's formula and the tab name ("Repower vs Extend") imply.

### 7.4 Worked example

Project `i=0`: illustratively `currentCapacityMw≈150`, `aepUpliftPct≈25%`:

| Step | Computation | Result |
|---|---|---|
| `currentAep` | 150 × 0.21 × 8760/1000 | 275.9 GWh |
| `newAep` | 275.9 × 1.25 | 344.9 GWh |
| AEP delta | 344.9 − 275.9 | 69.0 GWh |
| `annualRevDeltaM` | 69.0 × 1000 × 50 / 1e6 | **$3.45M/yr** |
| `repowerIrr` (independent draw) | 7.0 + sr(0×37)×5.5 | illustratively ≈9–10% |

A $3.45M/yr revenue uplift against a repower capex of, say, `newCapacityMw × ~$0.65/W ≈ $150M+` implies a
payback well beyond the typical horizon needed to support a >9.5% IRR on its own — yet the displayed
`repowerIrr` is generated independently and could show any value in the 7.0–12.5% range regardless of
whether the underlying capex/revenue math would actually support it.

### 7.5 Data provenance & limitations

- **All 18 projects are synthetic**, generated by `sr(seed)=frac(sin(seed+1)×10⁴)`; owner names are real
  major renewable IPPs used as a label pool.
- **IRR figures are disconnected from the computed capex/revenue figures on the same row** — see the
  mismatch flag; a production model should derive `repowerIrr` from an actual discounted cash-flow
  calculation using `repowerCapexM`, `annualRevDeltaM`, and `remainingPPAyrs`/plant life, analogous to the
  Newton-Raphson IRR solver already implemented correctly in `smr-project-finance` and `solar-project-finance`.
- The `recommendation` field's threshold-only logic does not implement a genuine repower-vs-extend
  comparison, despite the tab being named "Repower vs Extend."

### 7.6 Framework alignment

- **Jordan et al. (2016) PV Degradation Rates meta-analysis / Fraunhofer ISE Solar Repowering Guidelines** —
  cited in the guide; the module's qualitative uplift-driver decomposition (technology upgrade, tracking
  conversion, bifacial gain) is directionally consistent with these sources' documented repowering value
  drivers, though the specific per-driver percentages are illustrative, not fitted.
- **Wood Mackenzie Repowering Market Report** — cited as the source for the "8–16% incremental IRR" guide
  claim; the module's IRR figures fall in a similar range by construction of the random draw bounds
  (7.0–12.5%), coincidentally rather than because they are derived from a comparable methodology.

## 9 · Future Evolution

### 9.1 Evolution A — Derive repowering IRR from the AEP-uplift economics it already computes (analytics ladder: rung 1 → 2)

**What.** The §7 mismatch flag is the defining defect: the guide's `Repowering_NPV = ΔAEP × PPA_price × life_remaining − repowering_CAPEX` implies `repowerIrr` should follow from the computed `aepUpliftPct`, `annualRevDeltaM`, and `repowerCapexM` — but `repowerIrr` and `lifeExtIrr` are **independent `sr()` draws** disconnected from those figures. The module coincidentally lands IRRs in a plausible 7–12.5% band, but they cannot be reconciled with the project's own economics. The `AEP_UPLIFT_DRIVERS` decomposition (TOPCon +8%, tracking +5%, bifacial +4%, etc.) and `DECOMMISSION_COSTS` are genuinely useful, cited-plausible reference data. Evolution A makes the IRR real.

**How.** (1) Build the actual repowering cash flow: incremental AEP × PPA price over remaining/extended life, net of repowering CAPEX and decommissioning cost, discounted to NPV and solved for IRR — the guide's formula, implemented, so `repowerIrr` derives from the same-row inputs. (2) Make the AEP uplift additive from the `AEP_UPLIFT_DRIVERS` a user selects (which upgrades are applied) rather than a single `sr()` draw. (3) State- and ISO-specific PPA prices and capacity factors replacing the flat $50/MWh and 0.21 CF applied uniformly. (4) Recommendation logic (`Full Repower`/`Partial`/`Life Extension`) keyed to the *computed* incremental IRR versus a hurdle rate.

**Prerequisites.** PPA price and CF by state/vintage; the decommissioning and uplift tables are already present. **Acceptance:** `repowerIrr` recomputes from ΔAEP, PPA price, life, and CAPEX and matches the NPV/IRR math; selecting different uplift drivers changes both AEP and IRR; the recommendation flips at the hurdle rate.

### 9.2 Evolution B — Fleet-repowering prioritisation copilot (LLM tier 1)

**What.** A copilot for the asset-manager/owner/lender users: "which of my 2010-vintage sites are the top repowering candidates?", "what's the incremental IRR of adding trackers plus TOPCon at this site?", "should this project repower or extend life?" — answered from the computed degradation curves and, post-Evolution-A, the connected repowering economics.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/solar-repowering-analytics/ask`, corpus = this Atlas record (§7.1 degradation and uplift model, the driver decomposition, Jordan et al. / Fraunhofer framework notes) plus live page state. Prioritisation narrates deterministic sorts over the computed IRRs; the repower-vs-life-extension recommendation reads the computed logic and cites the driving economics. The copilot decomposes the AEP uplift by driver from `AEP_UPLIFT_DRIVERS`.

**Prerequisites (hard).** Evolution A — prioritising sites by a random `repowerIrr` would produce a plausible but meaningless ranking; the copilot ships once IRR is derived. **Acceptance:** every IRR/NPV figure in an answer traces to the computed economics; the recommendation matches the computed logic; a site absent from the portfolio returns a refusal.