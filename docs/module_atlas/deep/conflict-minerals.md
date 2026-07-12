## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a focused **3TG conflict-minerals
> compliance module** (SEC Rule 13p-1, CMRT parsing, SEC Form SD / EU regulation report
> generation). The code is actually a much broader **12-mineral critical-raw-materials risk
> dashboard** (lithium, cobalt, nickel, manganese, graphite, rare earths, copper, platinum + the
> four 3TG minerals) with an EU CRMA strategic-autonomy flavour. OECD 5-step tracking, RMAP
> certification, and CAHRA flags *are* implemented (as synthetic attributes), but **no CMRT is
> parsed and no Form SD or EU regulatory report is generated** — the "Export" produces a mineral
> risk CSV. All quantitative content is PRNG-seeded.

### 7.1 What the module computes

Four seeded generators build the universe at module load using the platform PRNG family
`sr(s)=frac(sin(s+1)×10⁴)`, `sn(s,min,max)=min+sr(s)(max−min)`, `si` (integer), `sp` (pick):

- **`genMinerals()`** — 12 minerals: `supplyRisk = sn(i·100+1, 35, 95)`, `hhi = sn(…, 1200, 8500)`,
  `priceVol` 8–55%, `recycRate` 2–65%, `demandGrowth` 3–28%, `reserveYrs` 8–119, plus 4–9 producer
  countries whose random shares are renormalised to sum to 100%.
- **`genCompanies()`** — 80 real-world company names with synthetic attributes: revenue
  $0.5–250B, per-mineral exposure (40% chance of 10–100 intensity), due-diligence score
  `ddScore = sn(…, 25, 98)`, `doddFrank` flag (P≈0.7), `euCrma` flag (P≈0.6), OECD step
  `si(…,1,6)` → 1–5, filing status ∈ {Filed, Pending, Overdue, Exempt, N/A}, gap count 0–7.
- **`genSmelters()`** — 40 named smelters/refiners: RMAP certification tier ∈ {Conformant,
  Active, Under Review, Not Certified, Pending Audit}, `cahra` flag (P≈0.4), risk score 15–90,
  supply-chain tier 1–3, random lat/lng.
- **`genRecycling()`** — 20 recycling facilities with capacity, recovery rate 60–98%, technology.

Risk classification: `ddScore > 75 → Low`, `> 50 → Medium`, `> 30 → High`, else `Critical`.
HHI colour bands: >4000 highly concentrated, 2500–4000 moderate (the classical DOJ/FTC merger
bands scaled to a 0–10,000 index).

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| 3TG set | Sn, Ta, W, Au tagged `crit:'Conflict'` | SEC Rule 13p-1 / EU 2017/821 scope (real) |
| EU CRMA 2030 targets | Mining 10%, Processing 40%, Recycling 25%, single-country cap 65% | **Real EU CRMA (Reg. (EU) 2024/1252) Art. 5 benchmarks** — the only externally sourced numbers on the page |
| "Current" progress vs targets | `sn(9001…9004, …)` random | Synthetic |
| OECD 5 steps | Management systems → Identify risks → Risk strategy → 3rd-party audit → Report | Real OECD DDG structure (labels) |
| DD gap rules | `oecdStep < 3` ⇒ management-systems gap; `filingStatus='Overdue'` ⇒ filing gap; `≥4` ⇒ audit strength | Hand-authored rubric in `runDdAssessment` |
| Substitution TRL | `si(…,3,9)` → 3–8 | Synthetic (TRL scale itself is real NASA/EU convention) |

### 7.3 Calculation walkthrough

Tab 1 (Mineral Risk Dashboard) computes portfolio KPIs — mean supply risk and recycle rate over
the 12 minerals, count of `hhi > 4000`, companies with `totalExposure > 3` — and renders the
supply-risk bar, a multi-dimensional radar (concentration plotted as `min(hhi/85, 100)` to fit the
0–100 axis), and HHI/demand charts. Tab 2 (Due Diligence & Compliance) aggregates the OECD step
distribution over companies, RMAP status counts over smelters, the CAHRA smelter list, and an
on-click `runDdAssessment(c)` that assembles gaps / strong areas / recommendations from the
rubric above. Tab 3 (Supply Chain Mapping) filters smelters (All / CAHRA / Certified /
Not Certified) and draws the mine→smelter→OEM tier table. Tab 4 (Strategic & Financial Impact)
renders EU CRMA gauge dials, a 2020-25 autonomy trend, substitution feasibility (feasibility %,
cost premium, TRL), investment areas with ROI 3–22%, and per-company price-volatility impact
`sn(i·800+1, 0.5, 8.5)` % of revenue — all independent PRNG draws.

### 7.4 Worked example — Lithium row (i = 0)

| Field | Computation | Result |
|---|---|---|
| supplyRisk | 35 + sr(1)×60; sr(1)=frac(sin(2)×10⁴)=0.9743 | **93.5** (red, ≥75) |
| HHI | 1200 + sr(2)×7300; sr(2)=frac(sin(3)×10⁴)=0.2001 | **2661** (amber band) |
| priceVol | 8 + sr(3)×47; sr(3)=frac(sin(4)×10⁴)=0.9751 | **53.8%** |
| recycRate | 2 + sr(4)×63; sr(4)=0.7573 | **49.7%** |
| demandGrowth | 3 + sr(5)×25; sr(5)=0.8450 | **24.1%** |

Note the internal contradiction this illustrates: lithium's stored HHI (2661) is independent of
its generated country shares — the real Herfindahl of those shares (`Σ sᵢ²` after
renormalisation) is never computed, so the table's HHI and its own "Top Producers" column can
disagree with each other and with reality (actual lithium mining HHI ≈ 2800–3200 on USGS 2023
shares; refining is far more concentrated).

### 7.5 Data provenance & limitations

- **Everything numeric is synthetic** via the seeded PRNG; company, smelter, and facility names
  are real-world entities carrying fabricated attributes — a disclosure risk if screenshots
  circulate (e.g. a real smelter randomly labelled "Not Certified" or CAHRA-flagged).
- HHI is drawn, not computed from shares; supply risk is a raw draw, not a function of HHI,
  governance, or recycling as real criticality methodologies require.
- RMAP status, CAHRA flags, Dodd-Frank/CRMA applicability are Bernoulli draws — no linkage to the
  RMI conformant-smelter list or the EU CAHRA indicative list.
- No CMRT ingestion, no reasonable-country-of-origin inquiry (RCOI) logic, no Form SD assembly.

### 7.6 Framework alignment

- **SEC Rule 13p-1 / Form SD:** scope (3TG) and filing-status vocabulary reflected; the actual
  RCOI → due diligence → Form SD/CMR workflow is not implemented.
- **EU Conflict Minerals Regulation (EU) 2017/821:** importer due-diligence obligation mirrored
  by the `euCrma`-style flags; volume thresholds not modelled.
- **OECD Due Diligence Guidance (5-step):** implemented as an integer progress attribute and a
  rules-based gap narrative; the real DDG requires evidence per step, not a scalar.
- **RMI RMAP:** certification statuses use the genuine RMAP vocabulary (Conformant / Active);
  in production these come from RMI's published facility lists.
- **EU CRMA (Reg. (EU) 2024/1252):** the 10/40/25/65 2030 benchmarks are correctly quoted;
  progress values are synthetic.

## 8 · Model Specification — Critical Mineral Supply Risk Score

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Produce a defensible 0–100 supply-risk score per mineral and a
company-level exposure/compliance score, supporting procurement risk appetite, CRMA benchmark
tracking, and 3TG compliance triage across the 12-mineral universe.

**8.2 Conceptual approach.** Adopt the **EU/JRC criticality assessment methodology** (used for
the official EU Critical Raw Materials list) with the **British Geological Survey Risk List** and
**Yale/Graedel criticality space** as cross-benchmarks: supply risk is a composite of
concentration × governance, import reliance, recycling substitution, and substitutability —
deterministic, from public data.

**8.3 Mathematical specification.**

```
HHI_m        = Σ_c (share_{m,c})²                       share from USGS MCS production data (0–10,000)
HHI_WGI_m    = Σ_c (share_{m,c})² × (WGI_scaled_c)      WGI_scaled = (10 − 2·WGI_gov_c)/10, per JRC
SR_m         = [ (HHI_WGI_m/10,000)^0.5 × IR_m × (1 − EoL_RIR_m) × (1 − SI_m·0.3) ] × 100
  IR_m       = net import reliance (0–1, USGS/Eurostat)
  EoL_RIR_m  = end-of-life recycling input rate (0–1, UNEP/JRC)
  SI_m       = substitutability index (0–1, JRC survey-based)
CompanyRisk_i = Σ_m w_{i,m} · SR_m × (1 − DD_i/100)      w_{i,m} = spend share on mineral m
DD_i          = 20·(OECD steps evidenced) capped at 100, minus 10 per open CMRT gap
```

| Parameter | Source |
|---|---|
| Production shares by country | USGS Mineral Commodity Summaries (annual, free) |
| WGI governance | World Bank Worldwide Governance Indicators (free; already used platform-wide) |
| EoL-RIR, SI | EU JRC RMIS criticality dataset (free) |
| Import reliance | Eurostat Comext / USGS import data (free) |
| RMAP conformance | RMI public facility lists (free download) |
| CAHRA geography | EU indicative CAHRA list (Reg. 2017/821 Art. 14) |

**8.4 Data requirements.** Mineral–country production table, WGI by country (present in platform
reference data), company spend by mineral (procurement input), CMRT responses per supplier
(upload), RMI smelter list refresh (quarterly). Vendor optional: S&P Global Market Intelligence
metals supply data for refining-stage shares.

**8.5 Validation & benchmarking.** Reconcile SR_m ranking against the official EU CRM list 2023
(all EU "critical" minerals should score above non-critical controls); back-compare HHI to JRC
RMIS published values (tolerance ±10%); sensitivity: ±1 σ on WGI and shares must not reorder the
top-3 risk minerals; company scores stress-tested by removing the single largest supplier.

**8.6 Limitations & model risk.** Mining-stage shares understate Chinese refining concentration
(mitigate by computing SR at both stages and taking the max); WGI lags coups/conflict (overlay
ACLED events as a fast-moving adjustment); CMRT self-reporting bias (weight audited RMAP evidence
above declarations); conservative fallback: unknown-origin volumes are scored at the CAHRA-max
country risk.
