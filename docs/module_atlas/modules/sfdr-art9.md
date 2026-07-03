# SFDR Article 9 Dark Green Fund
**Module ID:** `sfdr-art9` · **Route:** `/sfdr-art9` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
SFDR Article 9 fund management with sustainable investment threshold tracking, PAI mandatory indicators (18), taxonomy alignment KPIs, and periodic reporting templates.

> **Business value:** Article 9 (dark green) is the highest SFDR fund classification, requiring sustainable investment as the core objective. This module ensures ongoing compliance with the complex SI threshold, PAI disclosure, and taxonomy alignment requirements, and generates regulatory periodic reports.

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
| `names` | `['GHG Scope 1','GHG Scope 2','GHG Scope 3','Carbon Footprint','GHG Intensity','Fossil Fuel Exposure','Non-renewable Energy','Energy Intensity','Biodiv` |
| `paged` | `filtered.slice(page*PAGE,page*PAGE+PAGE);` |
| `totalPages` | `Math.ceil(filtered.length/PAGE);` |
| `paiPaged` | `paiFiltered.slice(paiPage*PAGE,paiPage*PAGE+PAGE);` |
| `exportCSV` | `(data,filename)=>{if(!data.length)return;const h=Object.keys(data[0]);const csv=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(',` |
| `avgAum` | `filtered.reduce((s,f)=>s+f.aum,0)/d;` |
| `avgSust` | `filtered.reduce((s,f)=>s+parseFloat(f.sustainableInvPct),0)/d;` |
| `avgTax` | `filtered.reduce((s,f)=>s+parseFloat(f.taxonomyAligned),0)/d;` |
| `avgCarb` | `filtered.reduce((s,f)=>s+parseFloat(f.carbonIntensity),0)/d;` |
| `scatterData` | `useMemo(()=>filtered.map(f=>({name:f.name,x:parseFloat(f.carbonIntensity),y:parseFloat(f.returnYtd),z:f.aum})),[filtered]);` |

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
| `_pai_aggregate_from_holdings` | holdings, total_aum | Aggregate 14 mandatory PAI indicators across portfolio holdings. |
| `_taxonomy_aligned_portfolio_pct` | holdings, total_aum |  |
| `_art9_eligibility_score` | rts_completeness, sustainable_pct, taxonomy_pct, dnsh_pass_pct, governance_pct, additionality_claim | Composite Art 9 eligibility score 0-100. |
| `_downgrade_risk` | sustainable_pct, dnsh_fail_count, pai_aggregate, additionality_claim | Estimate downgrade risk score (0-100) and trigger list. |
| `_compliance_tier` | score, eligible |  |
| `_generate_impact_kpis` | strategy | Return the impact-KPI *framework* (IRIS+/GIIN-aligned metric definitions) |
| `assess_art9_eligibility` | req | Full SFDR Art 9 eligibility assessment. |
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

## 5 · Intermediate Transformation Logic
**Methodology:** SFDR Article 9 sustainable investment criteria
**Headline formula:** `SustInv% = SI_holdings_AUM / Total_AUM; PAI_portfolio = Σ(w_i × PAI_company_i)`
**Standards:** ['SFDR (EU) 2019/2088', 'SFDR RTS (EU) 2022/1288', 'EU Taxonomy']

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
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **39** other module(s).

| Connected module | Shared via |
|---|---|
| `blended-finance` | table:exc |
| `biodiversity-credits` | table:exc |
| `transition-finance` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `just-transition-adaptation` | table:exc |
| `insurance-climate-hub` | table:exc |
| `nbs-finance` | table:exc |
| `insurance-transition` | table:exc |
| `supply-chain-map` | table:exc |
| `crrem` | table:exc |