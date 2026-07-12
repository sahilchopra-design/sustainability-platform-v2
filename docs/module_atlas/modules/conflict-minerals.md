# Conflict Minerals Compliance
**Module ID:** `conflict-minerals` · **Route:** `/conflict-minerals` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
SEC Rule 13p-1 (3TG) and EU Conflict Minerals Regulation compliance for tin, tantalum, tungsten, and gold. Covers RMAP smelter certification, supply chain traceability, and OECD 5-step framework.

> **Business value:** Conflict minerals due diligence is mandatory for SEC-registered companies and EU importers of 3TG minerals. Non-compliance risks SEC sanctions, customer contract loss, and reputational damage. This module provides the OECD 5-step framework automation needed for efficient annual compliance.

**How an analyst works this module:**
- Supply Chain Map traces 3TG from mine to component
- Smelter Verification shows RMAP certification status
- CAHRA Sourcing flags facilities in conflict zones
- CMRT Review parses Conflict Minerals Reporting Template from suppliers
- Regulatory Filing generates SEC Form SD and EU Regulation report

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COMPANY_NAMES`, `COUNTRIES`, `Card`, `DueDiligenceCompliance`, `KPI`, `MINERALS`, `MineralRiskDashboard`, `RECYCLING_FACILITIES`, `SMELTER_NAMES`, `StrategicFinancialImpact`, `SupplyChainMapping`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MINERALS` | 13 | `id`, `name`, `sym`, `sector`, `crit` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `COMPANY_NAMES` | `['Tesla','Apple','Samsung','BYD','CATL','Panasonic','LG Energy','SK Innovation','BMW','Volkswagen','Mercedes-Benz','Toyota','Ford','GM','Stellantis','Rivian','Lucid','NIO','Sony','Microsoft','Intel','AMD','Qualcomm','TSM` |
| `SMELTER_NAMES` | `['Jiangxi Copper Smelter','Umicore Belgium','LS-Nikko Copper','PT Timah','Thaisarco','Malaysia Smelting','Minsur Peru','Alpha Tungsten','Wolfram Bergbau','KEMET Blue Powder','H.C. Starck Tantalum','Global Advanced Metals` |
| `genMinerals` | `()=>MINERALS.map((m,i)=>{` |
| `supplyRisk` | `sn(i*100+1,35,95);` |
| `hhi` | `sn(i*100+2,1200,8500);` |
| `priceVol` | `sn(i*100+3,8,55);` |
| `recycRate` | `sn(i*100+4,2,65);` |
| `demandGrowth` | `sn(i*100+5,3,28);` |
| `reserveYrs` | `si(i*100+30,8,120);` |
| `prodTonnes` | `si(i*100+31,500,500000);` |
| `countries` | `COUNTRIES.slice(0,si(i*100+6,4,10)).map((c,j)=>({` |
| `totalShare` | `countries.reduce((s,c)=>s+c.share,0);` |
| `topProducers` | `countries.slice(0,3).map(c=>c.country);` |
| `genCompanies` | `()=>COMPANY_NAMES.map((name,i)=>{` |
| `sector` | `sp(['Automotive','Electronics','Mining','Battery','Industrial','Semiconductor','Components','Chemicals'],i*200+1);` |
| `revenue` | `sn(i*200+2,500,250000);` |
| `marketCap` | `revenue*(sn(i*200+60,1.5,8));` |
| `exposure` | `MINERALS.map((m,j)=>({mineral:m.id,name:m.name,level:sn(i*200+j*17+3,0,100)>60?sn(i*200+j*17+4,10,100):0}));` |
| `ddScore` | `sn(i*200+50,25,98);` |
| `doddFrank` | `sn(i*200+51,0,1)>0.3;` |
| `euCrma` | `sn(i*200+52,0,1)>0.4;` |
| `oecdStep` | `si(i*200+53,1,6);` |
| `filingStatus` | `sp(['Filed','Pending','Overdue','Exempt','N/A'],i*200+54);` |
| `gaps` | `si(i*200+55,0,8);` |
| `country` | `sp(['US','DE','JP','KR','CN','TW','NL','CH','AU','UK','FR','SE'],i*200+56);` |
| `employees` | `si(i*200+57,500,300000);` |
| `tier1Suppliers` | `si(i*200+58,5,80);` |
| `supplyChainScore` | `sn(i*200+59,30,95);` |
| `genSmelters` | `()=>SMELTER_NAMES.map((name,i)=>{` |
| `mineral` | `sp(MINERALS,i*300+2);` |
| `rmap` | `sn(i*300+3,0,1)>0.45;` |
| `capacity` | `si(i*300+4,500,50000);` |
| `riskScore` | `sn(i*300+5,15,90);` |
| `cahra` | `sn(i*300+6,0,1)>0.6;` |
| `tier` | `si(i*300+7,1,4);` |
| `cert` | `sp(['RMAP Conformant','RMAP Active','Under Review','Not Certified','Pending Audit'],i*300+8);` |
| `lastAudit` | ``${2024+si(i*300+9,0,3)}-${String(si(i*300+10,1,13)).padStart(2,'0')}`;` |
| `lat` | `sn(i*300+20,-30,60);` |
| `lng` | `sn(i*300+21,-120,140);` |
| `upstreamMines` | `si(i*300+23,2,15);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANY_NAMES`, `COUNTRIES`, `MINERALS`, `RECYCLING_FACILITIES`, `SMELTER_NAMES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| 3TG Minerals | — | SEC/EU | Tin, tantalum, tungsten, gold — conflict mineral scope |
| RMAP Certified Smelters | — | RMI | Responsible Minerals Initiative certified facilities |
| CAHRA Coverage | — | OECD | Conflict-affected and high-risk area definition |
- **Supplier CMRT data** → Smelter identification → **Smelter list**
- **RMAP database** → Certification check → **Compliant vs non-compliant smelters**
- **CAHRA analysis** → Sourcing risk → **SEC Form SD / EU regulatory report**

## 5 · Intermediate Transformation Logic
**Methodology:** OECD 5-step conflict minerals framework
**Headline formula:** `Compliance = Supply_chain_mapping × Risk_identification × Strategy × Audit × Reporting`

3TG: tin, tantalum, tungsten, gold. CAHRAs: Conflict-Affected and High-Risk Areas. RMAP: Responsible Minerals Assurance Process — smelter/refinery certification. EICC/RBA: upstream audit programme.

**Standards:** ['SEC Rule 13p-1', 'EU Conflict Minerals Regulation (EU) 2017/821', 'OECD DDG']
**Reference documents:** SEC Rule 13p-1 Conflict Minerals; EU Conflict Minerals Regulation (EU) 2017/821; OECD Due Diligence Guidance for Responsible Supply Chains; Responsible Minerals Initiative

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Join the real public lists: RMAP facilities, CAHRA countries, USGS shares (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag notes the code is a broader 12-mineral CRM dashboard than
the 3TG module the guide describes, and §7.5 identifies the sharper problem: real
smelter and company names carry Bernoulli-drawn attributes — a real facility can be
randomly labelled "Not Certified" or CAHRA-flagged, a genuine disclosure risk. HHI is
drawn rather than computed from shares. The only sourced numbers are the EU CRMA
10/40/25/65 benchmarks. Evolution A grounds the dashboard in the public lists that
actually exist for this domain.

**How.** (1) RMI RMAP conformant-facility list (published) replaces the seeded
certification tiers — smelter status becomes a joined fact with an as-of date.
(2) The EU CAHRA indicative list (published under Reg. 2017/821) replaces the
`P≈0.4` CAHRA coin-flip. (3) HHI computed from USGS Mineral Commodity Summaries
production shares per mineral — the same source can drive `reserveYrs` and producer
country breakdowns, replacing renormalised random shares. (4) CRMA progress bars read
curated Eurostat/CRMA-monitoring values instead of `sn(9001…)` draws. (5) CMRT
ingestion: parse the RMI CMRT template (a fixed-format workbook — deterministic
parsing, no ML needed) to populate company smelter declarations, enabling the
RCOI→due-diligence flow the guide promises; Form SD assembly then becomes a
templated export over real declarations.

**Prerequisites (hard).** Purge every seeded attribute attached to a real entity name
first — this module's real-names/fake-flags combination is the worst in its class;
list-refresh ownership (RMAP and CAHRA lists update periodically). **Acceptance:**
every smelter's RMAP status matches the RMI list snapshot; HHI for each mineral
reproduces from stored USGS shares; a sample CMRT parses into smelter declarations
without manual correction.

### 9.2 Evolution B — OECD 5-step due-diligence copilot (LLM tier 1 → 2)

**What.** The OECD framework requires evidence per step, not the scalar 1–5 progress
integer the page stores (§7.6). Evolution B operationalizes that: for a selected
supplier, the copilot walks the 5 steps, asks for or evaluates evidence against each
step's OECD DDG expectations (management systems documented? red-flag review of CMRT
declarations? audit reports on file?), and drafts the step-5 public reporting
narrative — the Form SD/EU-report content the guide names but the code never
generates. CMRT anomalies (smelter not on the conformant list, CAHRA-origin
declarations) surface as prioritized findings.

**How.** Tier 1: RAG over the OECD DDG text, Reg. 2017/821, and SEC Rule 13p-1
(refdata catalog additions) plus this Atlas record. Tier 2 pairs with Evolution A's
CMRT ingestion: "review this quarter's CMRTs" becomes tool calls over the parsed
declarations joined to the RMAP/CAHRA lists, with findings citing specific rows. The
drafter never asserts certification status — it quotes the joined list value with its
snapshot date.

**Prerequisites (hard).** Evolution A (list joins and CMRT parsing are the copilot's
entire evidence base; today there is nothing real to review); regulation texts
embedded. **Acceptance:** a due-diligence review of a test CMRT flags exactly the
declarations failing the list joins; the drafted Form SD narrative contains only
evidenced claims; steps without evidence are reported as gaps, not presumed complete.