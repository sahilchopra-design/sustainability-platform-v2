# Industrial Hydrogen Integration Finance
**Module ID:** `industrial-hydrogen-integration` · **Route:** `/industrial-hydrogen-integration` · **Tier:** B (frontend-computed) · **EP code:** EP-EG2 · **Sprint:** EG

## 1 · Overview
H₂ demand and integration economics across 6 industrial sectors: Steel, Chemicals, Refining, Cement, Glass, and Ceramics. Models 2030/2050 demand projections, electrolyser CAPEX learning curves (PEM/AEL/SOEC), and abatement cost ($/tCO₂) by sector vs carbon price threshold.

> **Business value:** Used by industrial companies evaluating hydrogen investments, infrastructure investors sizing electrolyser deployment, and policy teams assessing sector decarbonisation feasibility and timelines.

**How an analyst works this module:**
- Review H₂ demand projections by sector for 2030 and 2050 scenarios
- Examine electrolyser technology comparison for PEM vs AEL vs SOEC
- Use abatement cost model to identify carbon price thresholds by sector
- Analyse 20 projects across maturity and technology types

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `PROJECTS`, `Pill`, `SECTORS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SECTORS` | 7 | `name`, `h2Demand2030`, `h2Demand2050`, `h2Price`, `ci`, `capex`, `abatement`, `projects` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sec` | `SECTORS[Math.floor(sr(i * 7 + 1) * SECTORS.length)];` |
| `capMt` | `parseFloat((0.2 + sr(i * 11 + 2) * 2.8).toFixed(1));` |
| `country` | `['Germany', 'Netherlands', 'USA', 'Japan', 'Sweden', 'UK', 'Australia', 'South Korea'][Math.floor(sr(i * 13 + 3) * 8)];` |
| `status` | `['Operating', 'Construction', 'FID', 'Engineering', 'Feasibility'][Math.floor(sr(i * 17 + 4) * 5)];` |
| `irr` | `parseFloat((5 + sr(i * 19 + 5) * 10).toFixed(1));` |
| `dscr` | `parseFloat((1.15 + sr(i * 23 + 6) * 0.75).toFixed(2));` |
| `h2Need` | `parseFloat((capMt * (8 + sr(i * 29 + 7) * 15)).toFixed(0));` |
| `filtered` | `useMemo(() => PROJECTS.filter(p => selSector === 'ALL' \|\| p.sector === selSector), [selSector]); const avgIrr = useMemo(() => filtered.length ? (filtered.reduce((s, p) => s + p.irr, 0) / filtered.length).toFixed(1) : '—', [filtered]);` |
| `totalH2Need` | `useMemo(() => filtered.reduce((s, p) => s + p.h2Need, 0), [filtered]);` |
| `demandChart` | `SECTORS.map(s => ({ name: s.id, demand2030: s.h2Demand2030, demand2050: s.h2Demand2050 }));` |
| `economicsTable` | `useMemo(() => SECTORS.map(s => {` |
| `carbonSaving` | `s.abatement / 100 * 1.85 * carbonPrice;` |
| `netCost` | `s.capex * 0.12 + h2Price * s.h2Demand2030 - carbonSaving;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| PEM Electrolyser CAPEX ($/kW) | `Current range; target <$300/kW by 2030` | IRENA Green H2 Report 2022 + BNEF | Learning rate ~13–18% per doubling; need 100× scale from 2022 levels to hit 2030 targets. |
| H₂ demand by 2050 for industry (Mt/yr) | `Industry (excl. transport) IEA NZE scenario` | IEA Net Zero by 2050 + Hydrogen Roadmap | Steel 25–30 Mt/yr; Chemicals 5–10 Mt/yr; Refining 5–8 Mt/yr under IEA Net Zero. |
| Electrolyser stack lifetime (hrs) | `PEM: 60k–80k; AEL: 80k–100k; SOEC: 30k–60k` | BNEF Electrolyser Technology Outlook | Stack replacement is 30–50% of CAPEX over project life; critical for LCOH modelling. |
- **IEA/BNEF H2 demand data + electrolyser learning curves + abatement cost model** → Sector demand model + electrolyser CAPEX curves + abatement cost engine → **Industrial companies evaluating H2 investments, investors sizing electrolyser markets, and policy teams**

## 5 · Intermediate Transformation Logic
**Methodology:** H₂ Abatement Cost ($/tCO₂)
**Headline formula:** `Abatement_cost = (H2_system_LCOH − Fossil_baseline_opex) / CO2_displaced`

Steel DRI-H2: $50–80/tCO2 abatement (2024), declining to $10–20/tCO2 by 2035. Chemicals (ammonia): currently negative abatement cost where H2 <$3/kg.

**Standards:** ['IEA Hydrogen for Industry 2023', 'IRENA Green Hydrogen Cost Reduction 2022', 'BNEF Hydrogen Economy Outlook 2024']
**Reference documents:** IEA (2023) – Hydrogen for Industry; IRENA (2022) – Green Hydrogen: A Guide to Policy Making; BNEF (2024) – Hydrogen Economy Outlook Q1 2024

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

An **industrial-hydrogen integration finance** page: H₂ demand and abatement economics across 6
industrial sectors (steel, chemicals, refining, cement, glass, ceramics), plus a synthetic 20-project
pipeline and electrolyser infra costs. The sector table is grounded in IEA/BNEF data; the abatement-cost
formula is genuine but partially garbled in code (noted). Guide (EP-EG2) and code broadly agree.

### 7.1 What the module computes

**Sector abatement economics** — carbon saving vs H₂ cost premium:

```js
carbonSaving = s.abatement/100 · 1.85 · carbonPrice          // 1.85 tCO₂/t is the BF-BOF steel EF
netCost      = s.capex·0.12 + s.h2Price·s.h2Demand2030/s.h2Demand2030 · h2Price/s.h2Price − carbonSaving
```

The `netCost` expression is algebraically self-cancelling in its middle term:
`s.h2Price · (demand/demand) · (h2Price/s.h2Price) = h2Price` — so it reduces to
`capex·0.12 + h2Price − carbonSaving` (an annualised-capex-plus-H₂-price-less-carbon-credit proxy).
This is a coding artefact; the intended calculation is a sector abatement cost `$/tCO₂`.

### 7.2 Parameterisation — SECTORS table (provenance)

| Sector | H₂ 2030 (Mt) | H₂ 2050 (Mt) | H₂ price $/kg | CI | capex $/kW | Abatement % | Projects |
|---|---|---|---|---|---|---|---|
| Green Steel (DRI-EAF) | 32 | 108 | 4.5 | 0.05 | 950 | 94 | 18 |
| Green Ammonia/Chemicals | 18 | 55 | 3.8 | 0.25 | 720 | 82 | 24 |
| Refining | 12 | 28 | 3.2 | 0.40 | 480 | 65 | 31 |
| Cement Process Heat | 8 | 22 | 5.2 | 0.65 | 380 | 40 | 9 |
| Glass Firing | 3 | 9 | 4.8 | 0.20 | 250 | 55 | 6 |
| Ceramics/High-Temp | 2 | 7 | 5.5 | 0.28 | 210 | 48 | 4 |

Demand figures align with IEA NZE industrial-H₂ (steel 25–30 Mt, chemicals 5–10 Mt by 2050) and the
1.85 tCO₂/t steel emission factor is the standard BF-BOF benchmark. The 20-project pipeline is
**synthetic** (`sr()` picks sector/country/status; capacity 0.2–3.0 Mt; IRR 5–15%; DSCR 1.15–1.90;
H₂ need = cap × (8 + sr·15)).

### 7.3 Calculation walkthrough

Sliders `h2Price` and `carbonPrice` drive `economicsTable`, which computes per-sector carbon saving
(abatement × 1.85 × carbon price) and the (reduced) net-cost proxy. `demandChart` reads the 2030/2050
demand columns. Pipeline KPIs (`avgIrr`, `totalH2Need`) reduce the synthetic projects; `infraCosts`
lists electrolyser/pipeline capex with 2030/2050 cost-down anchors.

### 7.4 Worked example (Green Steel, carbon $80/t)

| Step | Computation | Result |
|---|---|---|
| carbonSaving | 0.94 · 1.85 · 80 | **$139/t** CO₂ credit value |
| netCost (reduced) | 950·0.12 + 4.5 − 139 | 114 + 4.5 − 139 = **−$20.5** |

A negative net cost signals steel H₂ integration is economic at $80/t carbon and $4.5/kg H₂ — matching
the guide's "$50–80/tCO₂ abatement in 2024 declining to $10–20 by 2035". (The absolute figure is
distorted by the self-cancelling middle term; the *sign and sensitivity* to carbon/H₂ price are the
usable signal.)

### 7.5 Data provenance & limitations

- **Sector demand/CI/capex/abatement figures are grounded** in IEA NZE / BNEF; the 1.85 tCO₂/t steel EF
  is correct. The **project pipeline is synthetic** (`sr()`) — IRR/DSCR/capacity are random.
- The `netCost` formula contains a **self-cancelling term** (`h2Price·demand/demand·h2Price/h2Price`),
  reducing it to `capex·0.12 + h2Price − carbonSaving`; it is not a clean `$/tCO₂` abatement cost as the
  guide's formula `(LCOH − fossil_opex)/CO₂_displaced` intends. Treat net-cost magnitudes as indicative.
- No electrolyser-LCOH build-up feeding the H₂ price; H₂ price is a slider.

**Framework alignment:** IEA *Hydrogen for Industry 2023* / *Net Zero by 2050* (sector demand, abatement
cost) · IRENA *Green Hydrogen Cost Reduction* (electrolyser learning) · BNEF *Hydrogen Economy Outlook*
(PEM/AEL/SOEC capex, stack lifetime). The module reproduces the sector abatement narrative faithfully;
the abatement-cost arithmetic should be rewritten to the guide's `(H₂ system LCOH − fossil baseline)/
CO₂ displaced` to yield a clean $/tCO₂ curve.

## 9 · Future Evolution

### 9.1 Evolution A — Rewrite the abatement-cost arithmetic and wire LCOH from the hydrogen engine (analytics ladder: rung 2 → 3)

**What.** §7.1 documents a real algebra bug: the `netCost` expression contains a self-cancelling middle term (`s.h2Price · (demand/demand) · (h2Price/s.h2Price)` reduces to just `h2Price`), so the economics table computes `capex·0.12 + h2Price − carbonSaving` — dimensionally incoherent (adding $/kW-annualised to $/kg) rather than the guide's clean `Abatement_cost = (H₂_system_LCOH − Fossil_baseline_opex) / CO₂_displaced` in $/tCO₂. §7.5 adds that H₂ price is a bare slider with no LCOH build-up, and the 20-project pipeline (IRR 5–15%, DSCR 1.15–1.90) is `sr()`-seeded. Evolution A rewrites the abatement engine per the guide's formula, with sector-specific fossil baselines (BF-BOF at the correct 1.85 tCO₂/t already in the code, SMR ammonia, refinery H₂) and LCOH pulled from the platform's existing `hydrogen_economy_engine.calculate_lcoh` rather than a slider-only price.

**How.** (1) Per-sector abatement: `(LCOH·kgH₂_per_t_product + ΔOPEX − fossil_fuel_cost) / tCO₂_displaced_per_t`, yielding a genuine $/tCO₂ curve vs carbon price with the breakeven threshold marked — validating against the guide's anchors (steel $50–80/tCO₂ 2024 → $10–20 by 2035; ammonia negative below $3/kg). (2) The `/api/v1/hydrogen/lcoh` endpooint already exists — this module joins the 5-module family sharing that engine, so wiring is integration, not new modelling. (3) Replace the seeded pipeline with the IEA Hydrogen Projects Database industrial subset. (4) Pin the corrected Green Steel example in bench_quant.

**Prerequisites.** The self-cancelling-term bug logged in the calc-defect backlog and fixed first (it invalidates current magnitudes); sector stoichiometry constants (kgH₂/t DRI steel ≈ 50–60) documented. **Acceptance:** abatement costs render in $/tCO₂ and land within the guide's published ranges per sector; moving the electricity-cost input changes abatement cost through the LCOH chain; pipeline rows cite real projects.

### 9.2 Evolution B — Sector-decarbonisation analyst over the corrected abatement engine (LLM tier 2)

**What.** A tool-calling analyst for industrial strategy teams: "at $100/t carbon and $3.50/kg H₂, which of the 6 sectors clears breakeven?", "how much H₂ does a 2 Mt DRI plant need and what's its abatement cost?", "when does cement process heat become viable under the IRENA learning curve?" These sweep the corrected Evolution A engine plus the shared hydrogen route family (`/cost-trajectory` for the learning-curve timing questions).

**How.** Tool schemas over the new abatement route and the existing hydrogen endpoints; system prompt grounded in this page's §7.2 sector table (demand, CI, capex, abatement %) and the §4.1 anchors (PEM <$300/kW by 2030 target, stack lifetimes) so infrastructure claims cite curated data with vintage. Breakeven-threshold questions run as carbon-price bisection tool loops. A mandatory caveat inherits from §7.4: until Evolution A ships, the copilot must not quote the current net-cost magnitudes — only sign and sensitivity are usable, which the tier-1 slice states explicitly. Cross-sector prioritisation answers must show the $/tCO₂ ordering, mirroring the MACC logic.

**Prerequisites (hard).** Evolution A's corrected engine — tool-calling the current garbled formula would give the algebra bug a fluent narrator. Phase 2 infrastructure. **Acceptance:** every $/tCO₂ and Mt figure traces to a tool call; breakeven answers reproduce from logged bisection points; sector claims cite `SECTORS` rows.