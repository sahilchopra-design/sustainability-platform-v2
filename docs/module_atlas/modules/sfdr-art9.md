# SFDR Article 9 Dark Green Fund
**Module ID:** `sfdr-art9` · **Route:** `/sfdr-art9` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
SFDR Article 9 fund management with sustainable investment threshold tracking, PAI mandatory indicators (18), taxonomy alignment KPIs, and periodic reporting templates.

> **Business value:** Article 9 (dark green) is the highest SFDR fund classification, requiring sustainable investment as the core objective. This module ensures ongoing compliance with the complex SI threshold, PAI disclosure, and taxonomy alignment requirements, and generates regulatory periodic reports.

**How an analyst works this module:**
- Fund Overview shows SI% gauge and taxonomy alignment
- PAI Tracker covers all 18 mandatory indicators with thresholds
- Holding Screener applies SI criteria to each position
- DNSH Check verifies Do No Significant Harm for each holding
- Periodic Report generates SFDR Annex IV template

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FUNDS`, `MANAGERS`, `MONTHLY`, `OBJECTIVES`, `PAGE`, `PAI_INDICATORS`, `REGIONS`, `STRATEGIES`, `TABS`, `TAXONOMY`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `pct` | `v=>(v*100).toFixed(1)+'%';` |
| `STRATEGIES` | `['Best-in-class','Exclusion','Impact investing','Thematic','Engagement','ESG integration','Positive screening','Negative screening'];` |
| `REGIONS` | `['Europe','North America','Asia-Pacific','Global','Emerging Markets','Nordic','UK & Ireland','Latin America'];` |
| `obj` | `OBJECTIVES[Math.floor(sr(i*3)*OBJECTIVES.length)];` |
| `strat` | `STRATEGIES[Math.floor(sr(i*7)*STRATEGIES.length)];` |
| `reg` | `REGIONS[Math.floor(sr(i*11)*REGIONS.length)];` |
| `mgr` | `MANAGERS[Math.floor(sr(i*13)*MANAGERS.length)];` |
| `names` | `['GHG Scope 1','GHG Scope 2','GHG Scope 3','Carbon Footprint','GHG Intensity','Fossil Fuel Exposure','Non-renewable Energy','Energy Intensity','Biodiversity Impact','Water Emissions','Hazardous Waste','UNGC Violations','` |
| `paged` | `filtered.slice(page*PAGE,page*PAGE+PAGE);` |
| `totalPages` | `Math.ceil(filtered.length/PAGE);` |
| `paiPaged` | `paiFiltered.slice(paiPage*PAGE,paiPage*PAGE+PAGE);` |
| `exportCSV` | `(data,filename)=>{if(!data.length)return;const h=Object.keys(data[0]);const csv=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.` |
| `avgAum` | `filtered.reduce((s,f)=>s+f.aum,0)/d;` |
| `avgSust` | `filtered.reduce((s,f)=>s+parseFloat(f.sustainableInvPct),0)/d;` |
| `avgTax` | `filtered.reduce((s,f)=>s+parseFloat(f.taxonomyAligned),0)/d;` |
| `avgCarb` | `filtered.reduce((s,f)=>s+parseFloat(f.carbonIntensity),0)/d;` |
| `scatterData` | `useMemo(()=>filtered.map(f=>({name:f.name,x:parseFloat(f.carbonIntensity),y:parseFloat(f.returnYtd),z:f.aum})),[filtered]);` |
| `taxChart` | `TAXONOMY.map(t=>({...t,aligned:parseFloat(t.aligned),eligible:parseFloat(t.eligible),notEligible:parseFloat(t.notEligible)}));` |
| `stratDist` | `useMemo(()=>{const m={};STRATEGIES.forEach(s=>m[s]=0);filtered.forEach(f=>m[f.strategy]++);return Object.entries(m).map(([name,value])=>({name,value}));},[filtered]);` |
| `tempBuckets` | `useMemo(()=>{const b={'<1.5C':0,'1.5-2.0C':0,'2.0-2.5C':0,'>2.5C':0};filtered.forEach(f=>{const t=parseFloat(f.tempAlignment);if(t<1.5)b['<1.5C']++;else if(t<2.0)b['1.5-2.0C']++;else if(t<2.5)b['2.0-2.5C']++;else b['>2.5C']++;});return Object.entries(b).map(([name,value])=>({name,value}));},[filtered]); return(` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sfdr-art9/assess` | `assess_art9` | api/v1/routes/sfdr_art9.py |
| POST | `/api/v1/sfdr-art9/portfolio-holdings` | `portfolio_holdings` | api/v1/routes/sfdr_art9.py |
| POST | `/api/v1/sfdr-art9/pai-aggregate` | `pai_aggregate` | api/v1/routes/sfdr_art9.py |
| POST | `/api/v1/sfdr-art9/dnsh-check` | `dnsh_check` | api/v1/routes/sfdr_art9.py |
| GET | `/api/v1/sfdr-art9/ref/dnsh-criteria` | `ref_dnsh_criteria` | api/v1/routes/sfdr_art9.py |
| GET | `/api/v1/sfdr-art9/ref/art9-requirements` | `ref_art9_requirements` | api/v1/routes/sfdr_art9.py |
| GET | `/api/v1/sfdr-art9/ref/esma-qa-2023` | `ref_esma_qa_2023` | api/v1/routes/sfdr_art9.py |

### 2.3 Engine `sfdr_art9_engine` (services/sfdr_art9_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_rts_annex_completeness` | investment_objective_score, impact_strategy_score, additionality_claim, impact_measurement_score, engagement_policy_score | Estimate RTS Annex I/II completeness % for pre-contractual template. |
| `_dnsh_all_pass` | holding |  |
| `_governance_pass` | holding |  |
| `_is_sustainable_investment` | holding | SFDR Art 2(17) check: sustainable objective + DNSH + governance. |
| `_pai_aggregate_from_holdings` | holdings, total_aum | Aggregate 14 mandatory PAI indicators across portfolio holdings. Every returned value is a REAL computation from supplied holding data, or an honest null (``value: None`` with ``data_available: False``) when the required inputs are not present. No indicator is ever fabricated — SFDR Annex I PAI are binding regulatory disclosures and must not display invented numbers. Indicators PAI 5/6/7/8/9/11 ha |
| `_taxonomy_aligned_portfolio_pct` | holdings, total_aum |  |
| `_art9_eligibility_score` | rts_completeness, sustainable_pct, taxonomy_pct, dnsh_pass_pct, governance_pct, additionality_claim, pai_aggregate | Composite Art 9 eligibility score 0-100. |
| `_downgrade_risk` | sustainable_pct, dnsh_fail_count, pai_aggregate, additionality_claim | Estimate downgrade risk score (0-100) and trigger list. |
| `_compliance_tier` | score, eligible |  |
| `_generate_impact_kpis` | strategy | Return the impact-KPI *framework* (IRIS+/GIIN-aligned metric definitions) for the fund strategy. Actual measured values are honest nulls — Art 9 impact figures are regulated disclosures and must be sourced from real measurement, never fabricated. Each entry keeps the kpi/unit/baseline framework shape with ``value: None`` until the caller supplies measured impact data. |
| `assess_art9_eligibility` | req | Full SFDR Art 9 eligibility assessment. Portfolio-level eligibility metrics are computed from supplied holdings only. When no holdings are provided the fund cannot be assessed, so the eligibility metrics, score and downgrade risk are returned as honest nulls (with ``compliance_tier: "insufficient_data"``) rather than fabricated numbers. |
| `_art9_recommendations` | art9_eligible, sustainable_pct, dnsh_fail_count, downgrade_risk, rts_completeness |  |
| `analyse_portfolio_holdings` | req | Portfolio holdings composition analysis for Art 9 purposes. |
| `calculate_pai_aggregate` | req | Aggregate PAI indicators across portfolio for SFDR reporting. |
| `check_dnsh` | req | DNSH verification across all 6 EU Taxonomy objectives. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `Art`, `ESMA`, `SFDR`, `__future__` *(shared)*, `denominator`, `exc` *(shared)*, `fastapi` *(shared)*, `services` *(shared)*, `sustainable`, `typing` *(shared)*
**Frontend seed datasets:** `MANAGERS`, `OBJECTIVES`, `REGIONS`, `STRATEGIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Sustainable Investment % | — | Fund mandate | Minimum threshold for Article 9 classification |
| PAI Indicators | — | SFDR RTS Annex I | 14 environmental + 4 social mandatory Principal Adverse Impacts |
| Taxonomy Alignment | — | EU Taxonomy | Article 9 must disclose taxonomy-aligned % |
- **Holdings ESG data** → SI criteria screening → **Sustainable investment %**
- **Company-level PAI data** → AUM-weighted aggregation → **Fund-level PAI indicators**
- **Taxonomy alignment data** → EU Taxonomy screen → **Taxonomy-aligned %**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sfdr-art9/ref/art9-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regulation', 'level_2_rts', 'effective_date', 'key_distinction', 'requirements', 'compliance_tiers'], 'n_keys': 6}`

**GET /api/v1/sfdr-art9/ref/dnsh-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regulation', 'delegated_acts', 'dnsh_principle', 'objectives', 'sfdr_linkage'], 'n_keys': 5}`

**GET /api/v1/sfdr-art9/ref/esma-qa-2023** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['document', 'reference', 'last_updated', 'applicable_to', 'key_qa_items', 'regulatory_status', 'greenwashing_risk_note'], 'n_keys': 7}`

**GET /api/v1/sfdr-art9/ref/pai-indicators** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regulation', 'reporting_frequency', 'entity_level_pai_threshold', 'mandatory_pai_count', 'optional_pai_count', 'mandatory_pai', 'optional_pai', 'data_quality_note'], 'n_keys': 8}`

**POST /api/v1/sfdr-art9/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sfdr-art9/dnsh-check** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sfdr-art9/pai-aggregate** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sfdr-art9/portfolio-holdings** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** SFDR Article 9 sustainable investment criteria
**Headline formula:** `SustInv% = SI_holdings_AUM / Total_AUM; PAI_portfolio = Σ(w_i × PAI_company_i)`

Article 9 funds must have sustainable investment as their objective. All holdings must qualify as sustainable (positive ESG + DNSH + good governance). 18 mandatory PAI indicators tracked at fund and holding level.

**Standards:** ['SFDR (EU) 2019/2088', 'SFDR RTS (EU) 2022/1288', 'EU Taxonomy']
**Reference documents:** SFDR (EU) 2019/2088; SFDR Regulatory Technical Standards (EU) 2022/1288; EU Taxonomy Regulation (EU) 2020/852

**Engine `sfdr_art9_engine` — extracted transformation lines:**
```python
avg = (investment_objective_score + impact_strategy_score + add_score +
pai1_num = sum(h.allocation_eur_m * (h.scope1_tco2e + h.scope2_tco2e) for h in holdings)
has_s12 = any((h.scope1_tco2e + h.scope2_tco2e) > 0 for h in holdings)
pai1 = round(pai1_num / total_aum, 2) if (total_aum > 0 and has_s12) else None
pai2_num = sum((h.allocation_eur_m / total_aum) * (h.scope1_tco2e + h.scope2_tco2e) for h in holdings)
pai3 = round(sum(pai3_vals) / len(pai3_vals), 2) if pai3_vals else None
pai4 = round(fossil_alloc / total_alloc * 100, 2) if total_alloc > 0 else None
pai12 = round(sum(gpg_vals) / len(gpg_vals), 2) if gpg_vals else None
pai13 = round(sum(bfem_vals) / len(bfem_vals), 2) if bfem_vals else None
pai10 = round(ungc_alloc / total_alloc * 100, 2) if total_alloc > 0 else None
pai14 = round(cw_alloc / total_alloc * 100, 2) if total_alloc > 0 else None
si_score = 30.0 if sustainable_pct >= 99.9 else (sustainable_pct / 100.0) * 30.0
dnsh_score = dnsh_pass_pct / 100.0 * 20.0
gov_score = governance_pct / 100.0 * 15.0
rts_score = rts_completeness / 100.0 * 15.0
raw = si_score + dnsh_score + gov_score + rts_score + add_score + ungc_penalty + cw_penalty
delta = 100 - sustainable_pct
sustainable_pct = (si_alloc / total_alloc * 100) if total_alloc > 0 else 0.0
gov_pct = len(gov_pass) / len(req.holdings) * 100
dnsh_pct = len(dnsh_pass) / len(req.holdings) * 100
pai_coverage_pct_out = round(holdings_with_scope / len(req.holdings) * 100, 1)
estimated_data_pct_out = round(100 - pai_coverage_pct_out, 1)
coverage_pct = (holdings_with_scope / len(req.holdings) * 100) if req.holdings else 0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **46** other module(s).

| Connected module | Shared via |
|---|---|
| `blended-finance-structuring` | table:exc |
| `supply-chain-esg-hub` | table:exc |
| `carbon-accounting-ai` | table:exc |
| `green-hydrogen-lcoh` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `adaptation-finance` | table:exc |
| `modern-slavery-intel` | table:exc |
| `supply-chain-resilience` | table:exc |
| `crrem` | table:exc |
| `climate-underwriting-workbench` | table:exc |

## 7 · Methodology Deep Dive

> **Note on prior audit findings.** MEMORY.md's REM-38 backlog (2026-04-06 UAT session) flagged two P0s for
> this module: (1) `filtered.length=0 → Infinity` rendered in KPIs, and (2) PAI-17/18 mislabelled as "Land
> Degradation"/"Deforestation Risk" instead of the correct RE (real estate) fossil-fuel-exposure indicators.
> **Both are fixed in the current code**: `kpis` divides by `Math.max(1, filtered.length)` throughout, and
> `PAI_INDICATORS[16..17]` now correctly read `'RE Fossil Fuel Exposure'` / `'RE Energy Inefficiency'`. This
> deep dive documents the module as it stands today.

### 7.1 What the module computes

60 synthetic Article 9 ("dark green") funds (`FUNDS`, seeded `sr(s)=frac(sin(s+1)×10⁴)`) each carry a full
SFDR-relevant metric set: `sustainableInvPct`, `taxonomyAligned` %, a `dnshPassed` (Do No Significant Harm)
boolean, `carbonIntensity`, `tempAlignment` (implied temperature rise), `paiScore`, and more. A separate
18-row `PAI_INDICATORS` array models the SFDR Annex I mandatory/voluntary Principal Adverse Impact
indicators, and a 6-row `TAXONOMY` array splits EU Taxonomy alignment into aligned/eligible/not-eligible
buckets per environmental objective.

```js
sustainableInvPct = sr()×40 + 55                              // 55–95%, consistent with Art.9's "sustainable investment objective" mandate
taxonomyAligned    = sr()×30 + 15                              // 15–45%
tempAlignment      = sr()×1.5 + 1.2                            // 1.2–2.7°C implied temperature rise
dnshPassed         = sr() > 0.15                                // ~85% pass rate
notEligible (Taxonomy) = 100 − aligned − eligible               // residual bucket, always ≥30 by construction of the ranges
```

### 7.2 Parameterisation — SFDR Annex I PAI indicators (18, corrected)

| # | Indicator | Category | Mandatory |
|---|---|---|---|
| 1–3 | GHG Scope 1/2/3 | Environmental | Yes |
| 4 | Carbon Footprint | Environmental | Yes |
| 5 | GHG Intensity of investee companies | Environmental | Yes |
| 6 | Fossil Fuel Exposure | Environmental | Yes |
| 7 | Non-renewable Energy Consumption | Environmental | Yes |
| 8 | Energy Intensity | Environmental | Yes |
| 9–11 | Biodiversity, Water, Hazardous Waste | Environmental (indices 8–10, `category` cutoff at i<8) | Yes |
| 12–16 | UNGC Violations, Gender Pay Gap, Board Gender Diversity, Controversial Weapons, Social Violations | Social | Yes (i<14) / mixed |
| 17 | RE Fossil Fuel Exposure | Social (real-estate-specific PAI) | No (voluntary) |
| 18 | RE Energy Inefficiency | Social (real-estate-specific PAI) | No (voluntary) |

This now correctly reflects SFDR RTS Annex I Table 1 (climate/environment, 1–9) + Table 1 social indicators
(10–14, mandatory) + Table 2/3 (voluntary, including the real-estate-specific indicators formerly
mislabelled). `category = i<8 ? 'Environmental' : 'Social'` — note the category cutoff (index 8, i.e. PAI 9
Biodiversity) groups Biodiversity/Water/Hazardous Waste as "Social" by this rule even though the real SFDR
Table 1 classifies them as Environmental — a residual labelling looseness worth flagging (category boundary
is one indicator too early relative to the true 9-indicator Environmental table).

### 7.3 Calculation walkthrough

1. `filtered` applies search/objective/region filters over the 60 funds; `kpis` computes guarded portfolio
   averages (`Math.max(1, filtered.length)` denominator) for AUM, sustainable-investment %, taxonomy
   alignment %, and carbon intensity.
2. `objDist`/`regDist` build distribution counts across the 8 `OBJECTIVES` and 8 `REGIONS`.
3. **Fund detail radar** (`radarData`, triggered on row expansion): 6-axis view of Sustainable Investment %,
   Taxonomy %, PAI Score, Engagement %, Green Revenue %, Biodiversity Score — all on a common 0–100 scale
   for direct radar comparison.
4. **PAI table**: independently filterable/sortable by `coverage`, `avgScore`, `trend`, `dataQuality` — a
   descriptive reporting-coverage view, not a portfolio-weighted PAI computation joining back to the 60
   funds' own PAI-related fields.
5. **Taxonomy tab**: 6 environmental objectives (Climate Mitigation/Adaptation, Water & Marine, Circular
   Economy, Pollution Prevention, Biodiversity) each split into aligned/eligible/not-eligible — a standard
   EU Taxonomy 3-bucket disclosure structure.

### 7.4 Worked example

Fund `i=7`: `sustainableInvPct = sr(19×7)×40+55` — illustrative draw ≈ 55+40×0.62 ≈ 79.8%,
`taxonomyAligned ≈ 15+30×0.44 ≈ 28.2%`, `dnshPassed = sr(29×7)>0.15` — with `sr()` typically >0.15 for most
seeds, `dnshPassed=true` in the large majority of draws (~85% base rate, matching the `>0.15` threshold).
`tempAlignment ≈ 1.2+1.5×0.51 ≈ 1.97°C` — an Art.9 fund with an implied 1.5–2°C temperature alignment is
consistent with real-world "dark green" fund disclosures under SFDR/EU Paris-Aligned Benchmark norms.

### 7.5 Companion analytics on the page

- **Monthly flows/AUM trend** (`MONTHLY`, 24 months) — independent `sr()`-seeded series for fund flows,
  AUM, new-product launches, and closures, illustrating Art.9 market growth dynamics, not tied to the 60
  individual funds.
- **Regulatory Compliance tab** — presumably surfaces `sfdrCompliant` (boolean, `sr()>0.1` → ~90% compliant)
  and `dnshPassed` as compliance gates.

### 7.6 Data provenance & limitations

- **All 60 funds, the PAI coverage table, and the monthly flow series are synthetic** — generated via
  `sr(seed)=frac(sin(seed+1)×10⁴)`, not linked to real fund disclosures or the EU's ESAP (European Single
  Access Point) fund registry.
- **PAI `category` cutoff is off by one relative to the true SFDR Annex I structure** (Biodiversity/Water/
  Hazardous Waste should be Environmental, code labels them Social) — a minor residual inconsistency from
  the otherwise-corrected PAI-17/18 relabelling.
- The PAI table's `coverage`/`avgScore` are descriptive, disconnected from the 60 funds' own `paiScore`
  field — there's no join demonstrating how fund-level PAI scores roll up into portfolio-level PAI indicator
  coverage.
- `tempAlignment` (implied temperature rise) is a random draw within a plausible range, not computed from
  any underlying carbon-budget or ITR (implied temperature rise) methodology.

**Framework alignment:** SFDR Regulatory Technical Standards (RTS) Annex I — the 18-indicator PAI structure
(now correctly labelled after the REM-38 fix) directly reflects the real regulatory table · EU Taxonomy
Regulation — the aligned/eligible/not-eligible 3-bucket disclosure convention matches the actual EU
Taxonomy reporting requirement (Article 8 disclosures) · SFDR Article 9 ("dark green") — the module's fund
universe correctly models Art.9's requirement that funds have sustainable investment as their explicit
objective (reflected in the 55–95% `sustainableInvPct` floor, well above Article 8's lower bar).

## 9 · Future Evolution

### 9.1 Evolution A — PAI roll-up on real holdings with pre-trade what-ifs (analytics ladder: rung 1 → 2)

**What.** The backend is genuinely strong — `sfdr_art9_engine` computes PAI-1/PAI-2 with honest nulls (`pai1 = None` when no Scope 1+2 data) across 7 routes — but the lineage sweep records `POST /assess` as **failed** and the two other POST computes as skipped, and the frontend runs on 60 `sr()`-synthetic funds. §7.6 adds three defects: the PAI `category` cutoff is off by one versus SFDR Annex I (Biodiversity/Water/Hazardous-Waste mislabelled Social), the PAI table's coverage figures never join to the funds' own `paiScore`, and `tempAlignment` is a random draw, not an ITR computation. Evolution A wires the module to real holdings and adds the what-if dimension an Art. 9 compliance officer actually needs.

**How.** (1) Diagnose and fix the `/assess` failure (triage pattern from the deployment-prep sweep). (2) Fix the one-line category cutoff. (3) Feed `POST /pai-aggregate` from `portfolios_pg` holdings so fund-level PAI indicators roll up from position-level data through the engine's existing weighted-sum math — eliminating the disconnected coverage table. (4) Pre-trade mode: submit a hypothetical holdings delta and return the SI%, taxonomy-alignment, and PAI movement before the trade — the same endpoints, scenario-parameterised. (5) Replace random `tempAlignment` with the platform's ITR machinery or drop the field (honest-null).

**Prerequisites.** `/assess` bug fix is the gate; a demo Art. 9 portfolio seeded in `portfolios_pg` (the D0 credibility-gap item). **Acceptance:** lineage sweep shows all 4 POST routes passing; PAI table totals reconcile with the sum over holdings; the mislabelled indicators render as Environmental.

### 9.2 Evolution B — Annex IV drafting analyst (LLM tier 2)

**What.** Article 9 periodic reporting (SFDR RTS Annex IV) is a template-filling task with strict numeric grounding — exactly the tier-2 shape. The copilot assembles the periodic report by calling `POST /pai-aggregate`, `POST /dnsh-check`, and `POST /portfolio-holdings` for the live figures, then drafts the narrative sections (how the sustainable investment objective was attained, DNSH assessment description) citing the module's own reference endpoints — `GET /ref/art9-requirements`, `/ref/dnsh-criteria`, and `/ref/esma-qa-2023`, which encode the actual regulatory text and ESMA guidance.

**How.** Tool schemas from the 7 OpenAPI routes; the report template's numeric slots are filled only from tool responses (fabrication validator enforced), while narrative slots must quote the relevant `/ref/*` payload for every regulatory claim. Draft output lands in the report-studio render layer per the Tier-3 composability pattern. A "greenwashing tripwire" refuses to draft language claiming sustainable-investment percentages above what `/assess` returned.

**Prerequisites (hard).** Evolution A first — `/assess` currently 500s, and drafting regulatory disclosures from synthetic fund data would be the exact failure mode SFDR exists to police. **Acceptance:** every figure in a generated Annex IV draft traces to a tool call in the session; a portfolio failing DNSH produces a refusal to draft compliance language, with the failing holdings listed.