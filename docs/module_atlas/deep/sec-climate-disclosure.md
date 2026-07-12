## 7 · Methodology Deep Dive

> ⚠️ **Regulatory status note (not a guide↔code mismatch, but material).** The SEC's climate disclosure rule
> (Release 33-11275, adopted March 2024) was voluntarily stayed in April 2024 and then **formally rescinded
> by SEC vote on 27 March 2025** — it never took legal effect and currently imposes no obligation on any
> filer. The MODULE_GUIDES entry (dataPoints like "Readiness Score 72%", "Scope 1+2 Coverage 89%") reads as
> if the rule is a live compliance requirement; it is not. Both the frontend page (a banner comment at the
> top of the file) and the backend engine (`SEC_RULE_STATUS` dict, `current_status: "RESCINDED"`,
> `legal_force: False`) correctly caveat this — the engine is explicitly maintained as a **voluntary/
> educational TCFD-and-ISSB-S2-aligned framework**, not an SEC compliance tool. Readers should treat every
> "compliance," "readiness," or "gap" figure below as advisory self-assessment against a defunct rule text,
> not a legal requirement.

### 7.1 What the module computes

40 synthetic companies (`genCompanies`, seeded `sr(s)=frac(sin(s+1)×10⁴)`) are distributed across 10
sectors and 3 filer tiers (`i<15`→LAF, `i<28`→AF, else NAF — a fixed positional split, not a real
public-float classification). Each carries Scope 1, location- and market-based Scope 2, revenue, an
intensity metric, and several boolean readiness flags:

```js
scope2loc = scope1 × (0.3 + sr()×0.5)                       // location-based always higher than market-based ceiling
scope2mkt = scope2loc × (0.6 + sr()×0.35)                    // market-based always ≤ location-based by construction
intensity = (scope1 + scope2mkt) / revenue × 1000            // tCO2e per $1,000 revenue
readiness = round(20 + sr()×75)                              // 20–95, independent of the other flags
```

`hasSbti`, `hasTransitionPlan`, `physRiskMat`, `tranRiskMat` are independent `sr()>threshold` booleans;
`assuranceLevel` is only assigned for the first 15 (LAF) companies.

### 7.2 Parameterisation

| Reg S-K item | TCFD pillar | ISSB IFRS S2 §§ | Content |
|---|---|---|---|
| Item 1500 | Risk Management | §10–19 | Climate risk identification (physical/transition) |
| Item 1501 | Governance | §6–9 | Board oversight |
| Item 1502 | Strategy | §10–19 | Material impacts on business model |
| Item 1503 | Risk Management | §20–25 | ERM integration process |
| Item 1504 | Metrics & Targets | §29–37 | Scope 1 & 2 GHG (location + market-based) |
| Item 1505 | Metrics & Targets | §38–41 | Targets, transition plans, offsets/RECs |
| Reg S-X §14 | Strategy (financial) | §26–28 | Financial statement effects >1% of line items |

This cross-mapping table (7 items × TCFD pillar × ISSB section) is **real regulatory content** — it
accurately reflects the actual (rescinded) rule's structure and its genuine overlap with TCFD's 4 pillars
and ISSB IFRS S2's paragraph numbering, independently corroborated by the backend engine's docstring
(§1500–1505, Reg S-X §14-02).

| Filer tier | Public float | Scope 1/2 phase-in (as adopted, now moot) | Assurance |
|---|---|---|---|
| Large Accelerated Filer | ≥$700M | FY2025 | Limited FY2027 → Reasonable FY2029 |
| Accelerated Filer | $75M–$700M | FY2026 | Limited FY2028 → Reasonable FY2031 |
| Non-Accelerated/SRC/EGC | <$75M | Exempt from Scope 1/2 | None |

### 7.3 Calculation walkthrough

1. `filtered` narrows the 40-company array by sector/filer-type UI selectors.
2. `kpis = useMemo(() => { const n = Math.max(1, filtered.length); ... })` — guarded portfolio KPI means
   (avg readiness, avg intensity, SBTi %, transition-plan %) computed over `filtered`.
3. **Financial-effects calculator** (interactive tool): `scope3Add = calcScope3 ? base×0.6 : 0`,
   `revenueScale = log10(max(1,calcRevenue)) / log10(100)` (a log-dampened revenue scaling factor —
   larger companies get a sub-linear multiplier), `total = base×revenueScale + scope3Add` — a heuristic
   sizing tool for illustrative "what would financial-statement-effects disclosure look like," not a
   genuine cost model.
4. **TREND** (12-quarter Q3-22→Q2-25 series) and **SECTOR_BENCHMARKS** are `SECTORS.map()`-derived synthetic
   series layered onto the same company pool, used for the readiness-over-time and sector-comparison charts.

### 7.4 Worked example

Company `i=3` (Industrials, LAF), illustrative draw: `scope1 = round(50+sr(21)×4900) ≈ 2,340`,
`scope2loc = 2,340×(0.3+sr(39)×0.5) ≈ 2,340×0.62 ≈ 1,451`, `scope2mkt = 1,451×(0.6+sr(51)×0.35) ≈
1,451×0.78 ≈ 1,132`, `revenue = round(500+sr(33)×49500) ≈ 18,200`.

| KPI | Computation | Result |
|---|---|---|
| Intensity | `(2,340+1,132)/18,200×1000` | 190.8 tCO₂e / $1,000 revenue |
| Readiness | `round(20+sr(9)×75)` | e.g. 63/100 |
| Scope 2 gap | `scope2loc − scope2mkt` | 319 (market-based always lower — illustrates RECs/PPA effect, though mechanically forced by the `×0.6-0.95` multiplier rather than actual contract data) |

### 7.5 Companion analytics on the page

- **TCFD cross-map radar** (`RADAR_BASE`, 6 hardcoded axis scores 41–84) is a single static illustrative
  snapshot, not computed from the 40-company dataset.
- **Scenario adoption trajectory** (`SCENARIO_DATA`, 2025→2050, 4 named pathways Orderly/Delayed/Hot-house/
  Disorderly) is a fixed hand-authored curve set, illustrating NGFS-style scenario-naming conventions
  without being tied to NGFS's actual published trajectories.

### 7.6 Data provenance & limitations

- **All 40 companies and every quantitative field are synthetic**, generated via `sr(seed)=frac(sin(seed+1)×
10⁴)`; filer-tier assignment is a fixed positional split (first 15/13/12), not based on any real public-float
figure.
- `scope2mkt < scope2loc` is guaranteed by construction of the multiplier ranges (`0.6–0.95× scope2loc`),
  not because the company actually purchased RECs/PPAs — a real market-based Scope 2 figure could equal or
  exceed the location-based figure.
- `readiness` is an independent random draw, uncorrelated with `hasSbti`/`hasTransitionPlan`/assurance flags
  — a "95% ready" company could still show `hasTransitionPlan: false`.
- The regulatory item↔TCFD↔ISSB cross-mapping table (§7.2) is the module's most reliably grounded content —
  it reflects the actual rule text structure and should survive as reference material even though the rule
  itself is defunct.

**Framework alignment:** SEC Release 33-11275 (Reg S-K Items 1500–1505, Reg S-X §14) — **rescinded 27 March
2025, advisory-only per the engine's own `SEC_RULE_STATUS`** · TCFD 4-pillar structure (Governance, Strategy,
Risk Management, Metrics & Targets) — genuinely mapped, still a valid voluntary framework · ISSB IFRS S2
paragraph references — genuinely mapped, still current and increasingly the global convergence standard the
former SEC rule was modelled on.
