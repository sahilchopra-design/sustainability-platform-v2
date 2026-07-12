# Technology & Cyber Risk
**Module ID:** `technology-risk` · **Route:** `/technology-risk` · **Tier:** A (backend vertical) · **EP code:** EP-BB2 · **Sprint:** BB

## 1 · Overview
Technology and cyber operational-risk panel scoring 45 entities across cyber/ransomware, AI & model risk, cloud concentration, third-party vendor, OT/ICS security, data privacy, supply-chain software and legacy tech-debt dimensions, benchmarked against DORA, NIS2, the EU AI Act and NIST CSF 2.0.

> **Business value:** Cyber and AI/model risk are now board-level and regulatory priorities for financial and technology-adjacent entities: DORA (in force Jan 2025) and NIS2 (transposed by member states from Oct 2024) impose direct ICT risk-management and incident-reporting duties, while the EU AI Act adds governance obligations for high-risk AI systems.

**How an analyst works this module:**
- Review entity-level cyber, AI, cloud, vendor and OT risk scores in the Cyber Risk Scorecard tab
- Assess AI/model governance maturity and EU AI Act obligations in the AI & Model Risk tab
- Monitor simulated incident trends and vendor/cloud concentration in the Incident Landscape tab
- Track readiness against DORA, NIS2, EU AI Act and 7 other frameworks in the Regulatory Compliance tab
- Use vendor concentration and patch-lag metrics to prioritise third-party risk remediation

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AiModelRisk`, `COMPANIES`, `CyberScorecard`, `INCIDENT_TREND`, `IncidentLandscape`, `MATURITY_DATA`, `RADAR_DATA`, `REGS`, `REG_READINESS`, `RISK_CATS`, `RegulatoryCompliance`, `SECTORS`, `TABS`, `VENDOR_CONC`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `RADAR_DATA` | 8 | `value` |
| `VENDOR_CONC` | 9 | `exposure`, `risk` |
| `TABS` | 5 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pick` | `(arr, s) => arr[Math.floor(sr(s) * arr.length)];` |
| `RISK_CATS` | `["Cyber / Ransomware","AI / Model Risk","Cloud Concentration","Third-Party / Vendor","OT / ICS Security","Data Privacy","Supply Chain SW","Legacy Tech Debt","Insider Threat","Regulatory Tech"];` |
| `MATURITY_DATA` | `RISK_CATS.map((c, i) => ({` |
| `sectorAvg` | `SECTORS.map(s => {` |
| `maturityDist` | `["None","Experimental","Deployed","Enterprise"].map(m => ({` |
| `aiRiskByMaturity` | `maturityDist.map((m, i) => ({` |
| `pct` | `(cnt / COMPANIES.length * 100).toFixed(0);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/technology/data-centre` | `assess_data_centre` | api/v1/routes/technology.py |
| POST | `/api/v1/technology/cloud-emissions` | `assess_cloud_emissions` | api/v1/routes/technology.py |
| POST | `/api/v1/technology/ai-carbon` | `assess_ai_carbon` | api/v1/routes/technology.py |
| POST | `/api/v1/technology/semiconductor-risk` | `assess_semiconductor_risk` | api/v1/routes/technology.py |
| POST | `/api/v1/technology/ewaste` | `assess_ewaste` | api/v1/routes/technology.py |
| POST | `/api/v1/technology/eed-compliance` | `eed_compliance` | api/v1/routes/technology.py |
| POST | `/api/v1/technology/integrated-assessment` | `integrated_assessment` | api/v1/routes/technology.py |
| GET | `/api/v1/technology/ref/grid-factors` | `ref_grid_factors` | api/v1/routes/technology.py |
| GET | `/api/v1/technology/ref/cloud-benchmarks` | `ref_cloud_benchmarks` | api/v1/routes/technology.py |
| GET | `/api/v1/technology/ref/pue-benchmarks` | `ref_pue_benchmarks` | api/v1/routes/technology.py |
| GET | `/api/v1/technology/ref/wue-benchmarks` | `ref_wue_benchmarks` | api/v1/routes/technology.py |
| GET | `/api/v1/technology/ref/ai-benchmarks` | `ref_ai_benchmarks` | api/v1/routes/technology.py |
| GET | `/api/v1/technology/ref/semiconductor` | `ref_semiconductor` | api/v1/routes/technology.py |
| GET | `/api/v1/technology/ref/ewaste-rates` | `ref_ewaste_rates` | api/v1/routes/technology.py |

### 2.3 Engine `technology_risk_engine` (services/technology_risk_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_dc_to_dict` | r | Convert DataCentreResult dataclass to serialisable dict. |
| `TechnologyRiskEngine.assess_data_centre` | inp | Full data centre efficiency + emissions assessment. |
| `TechnologyRiskEngine.assess_cloud_emissions` | inp | Estimate Scope 3 Category 1 emissions from cloud services. |
| `TechnologyRiskEngine.assess_ai_carbon` | inp | Estimate AI model training + inference carbon footprint. |
| `TechnologyRiskEngine.assess_semiconductor_risk` | inp | Water intensity + mineral supply chain risk for semiconductor manufacturing. |
| `TechnologyRiskEngine.assess_ewaste` | inp | Hardware lifecycle e-waste and circularity assessment. |
| `TechnologyRiskEngine.eed_compliance_check` | inp | EU Energy Efficiency Directive (recast 2023/1791) Article 12 compliance. From 15 May 2024, data centres with IT load ≥500 kW must report to EU DB. Mandatory KPIs per Delegated Regulation (EU) 2024/1364: - PUE, WUE, REF (Renewable Energy Factor), ERF (Energy Reuse Factor) - Cooling system info, temperature setpoints, waste heat reuse |
| `TechnologyRiskEngine.integrated_assessment` | entity_name, data_centres, cloud_usage, ai_models, semiconductor, ewaste | Comprehensive technology entity sustainability assessment. Aggregates all sub-modules into a unified risk profile with ESG score, CSRD E1 data points, and regulatory readiness. |
| `TechnologyRiskEngine.get_grid_emission_factors` |  |  |
| `TechnologyRiskEngine.get_cloud_provider_benchmarks` |  |  |
| `TechnologyRiskEngine.get_pue_benchmarks` |  |  |
| `TechnologyRiskEngine.get_wue_benchmarks` |  |  |
| `TechnologyRiskEngine.get_ai_training_benchmarks` |  |  |
| `TechnologyRiskEngine.get_semiconductor_water_data` |  |  |
| `TechnologyRiskEngine.get_ewaste_recycling_rates` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `cloud`, `disposal`, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `RADAR_DATA`, `REGS`, `RISK_CATS`, `SECTORS`, `TABS`, `VENDOR_CONC`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Entities Scored | — | Synthetic sample set | Illustrative panel of 45 entities across 10 financial/tech-adjacent sectors (Banking, Insurance, Fintech, Healthcare, Energy, Consumer Tech, etc.) used to demonstrate the scoring framework; not live company data. |
| High Risk Entities (>65) | — | Cyber Risk Scorecard tab | Count of entities whose overall risk score exceeds the high-risk threshold; used to prioritise remediation. |
| DORA / NIS2 Coverage | — | Regulatory Compliance tab | Share of entities flagged as covered by DORA and/or NIS2 obligations, alongside a 10-framework regulatory readiness tracker. |
- **Entity risk-factor sample set (sr()-seeded illustrative data)** → Per-entity 8-dimension scoring + sector/maturity aggregation + regulatory readiness mapping → **Cyber Risk Scorecard, AI & Model Risk view, Incident Landscape, Regulatory Compliance dashboard**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/technology/ref/ai-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'models'], 'n_keys': 2}`

**GET /api/v1/technology/ref/cloud-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pue', 'grid_factors'], 'n_keys': 2}`

**GET /api/v1/technology/ref/ewaste-rates** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'rates'], 'n_keys': 2}`

**GET /api/v1/technology/ref/grid-factors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'factors'], 'n_keys': 2}`

**GET /api/v1/technology/ref/pue-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'benchmarks'], 'n_keys': 2}`

**GET /api/v1/technology/ref/semiconductor** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['water_intensity', 'rare_earth_concentration'], 'n_keys': 2}`

**GET /api/v1/technology/ref/wue-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'benchmarks'], 'n_keys': 2}`

**POST /api/v1/technology/ai-carbon** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Composite Technology & Cyber Risk Score
**Headline formula:** `overallRisk (0-100) per entity; sectorAvg = mean(overallRisk) by sector; aiRiskByMaturity = mean(aiRisk) by AI maturity tier`

Each entity is scored across 8 independent risk dimensions (cyber, AI/model, cloud concentration, vendor, OT/ICS, data privacy, legacy debt, overall). Sector and maturity-tier views aggregate these via simple unweighted means and counts.

**Standards:** ['EU AI Act', 'NIS2 Directive (EU 2022/2555)', 'DORA (EU 2022/2554)', 'NIST CSF 2.0', 'ISO 27001:2022']
**Reference documents:** EU AI Act (Regulation 2024/1689); NIS2 Directive (EU) 2022/2555; DORA (EU) 2022/2554; NIST Cybersecurity Framework 2.0; ISO/IEC 27001:2022

**Engine `technology_risk_engine` — extracted transformation lines:**
```python
it_mwh = inp.it_load_mw * 8760 * 0.70  # 70% avg utilization
total_mwh = it_mwh * pue
overhead_mwh = total_mwh - it_mwh
scope2_location = total_mwh * grid_ef / 1000  # tCO2e
scope2_market = scope2_location * (1 - inp.renewable_pct / 100)
cue = (scope2_market * 1_000_000) / max(it_mwh * 1000, 1)  # gCO2/kWh IT
annual_water_m3 = wue * it_mwh * 1000 / 1000  # L → m3
embodied = inp.total_floor_area_m2 * 0.35  # tCO2e amortised
total_carbon = scope2_market + embodied
carbon_intensity = (scope2_market * 1000) / max(it_mwh, 1)  # kgCO2/kWh IT
efficiency_gap = ((pue - best_pue) / best_pue) * 100 if pue > best_pue else 0
cpu_power_w = 10 * max(inp.avg_cpu_utilization / 0.5, 0.4)
compute_kwh = inp.compute_hours * cpu_power_w / 1000
gpu_kwh = inp.gpu_hours * 0.350 / 1  # assume A100-class 350W
storage_kwh = inp.storage_tb_months * 0.1 * 730 / 1000  # 730 hrs/month
network_kwh = inp.network_egress_tb * 1000 * 0.05
total_kwh = compute_kwh + gpu_kwh + storage_kwh + network_kwh
total_with_pue = total_kwh * pue
scope3_cat1 = total_with_pue * grid_ef / 1_000_000  # tCO2e
scope2_on_prem = total_kwh * on_prem_pue * grid_ef / 1_000_000
savings_pct = ((scope2_on_prem - scope3_cat1) / max(scope2_on_prem, 0.001)) * 100
carbon_per_vcpu = (scope3_cat1 * 1_000_000) / max(inp.compute_hours, 1)  # gCO2
train_kwh = inp.training_hours * inp.gpu_count * inp.gpu_tdp_w / 1000
train_kwh_with_pue = train_kwh * inp.pue
train_tco2e = train_kwh_with_pue * grid_ef / 1_000_000
power_per_request_wh = (inp.gpu_tdp_w * inp.inference_latency_ms / 1000) / 3600
annual_requests = inp.inference_requests_per_day * 365
infer_kwh = annual_requests * power_per_request_wh / 1000
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ✅ **Guide↔code mismatch — resolved.** This module_id previously had a three-way naming collision:
> the MODULE_GUIDES entry described a **clean-technology disruption/stranded-asset** platform
> (`TDRS = (LegacyCost/CleanTechCost)⁻¹ × MarketPenetrationRate`, covering solar/wind/EV/heat-pump/
> hydrogen cost curves threatening legacy fossil assets, cited to BloombergNEF EVO and Carbon
> Tracker), while the frontend page actually implements a **cyber/IT operational-risk panel**
> (`EP-BB2`, "Coverage: cyber risk scoring, AI/model risk, operational technology risk, supply chain
> concentration, vendor dependency, tech obsolescence, regulatory exposure"), and a **third,
> independent concept** — genuine **data-centre/AI carbon-footprint calculators** — lives in the
> orphaned backend engine (`backend/services/technology_risk_engine.py` and its routes in
> `api/v1/routes/technology.py`).
>
> **Resolution (this pass):** the guide/documentation has been rewritten (in
> `frontend/src/data/moduleGuides.js`, `docs/module_atlas/module_guides.json`, and
> `docs/module_atlas/modules/technology-risk.md` §1/§4.1/§5) to honestly describe what the frontend
> page actually does — cyber/IT operational risk — since the cyber/IT implementation is a genuinely
> useful, working feature and rewriting the frontend to chase the old stranded-asset description
> would have been a much larger, unjustified scope change. The frontend page itself already carried
> accurate self-description (`"Technology Risk Panel"` / `EP-BB2` / "Cyber · AI/Model · OT · DORA ·
> NIS2 · EU AI Act · 45 Entities"` in both the in-page header and the `App.js` nav label), so no
> frontend code changes were needed there. The backend carbon-footprint engine remains unwired to any
> frontend route (see §7.5) — it has been left as-is per design decision, with a note added at the
> top of the engine file flagging it as an orphaned capability for a future dedicated module.

### 7.1 What the frontend page computes

45 synthetic companies (`COMPANIES`) across 10 financial/tech-adjacent sectors (Banking, Insurance,
Asset Management, Fintech, Healthcare, Energy, Industrials, Consumer Tech, Telecom, Government), each
independently `sr()`-seeded across 8 risk-category scores (`cyberScore`, `aiRisk`, `cloudConc`,
`vendorRisk`, `otRisk`, `dataPrivacy`, `legacyDebt`, `overallRisk`, all 0–100), plus
`incidents12m` (0–8), `patchLag` (5–90 days), cloud provider, AI maturity tier, and DORA/NIS2
coverage flags. A 12-month incident-trend series (`INCIDENT_TREND`, 5 attack types), a 7-axis
governance radar (`RADAR_DATA`), a 10-category risk-maturity-vs-benchmark comparison
(`MATURITY_DATA`), an 8-vendor concentration table (`VENDOR_CONC`, Microsoft/AWS/Palo Alto/Broadcom-
VMware/Oracle/SAP/Crowdstrike/Cisco), and a 10-regulation readiness table (`REG_READINESS`).

### 7.2 Genuine aggregation formulas

```js
sectorAvg[sector] = mean(overallRisk) across companies in that sector
maturityDist[tier] = { count: companies with aiMaturity===tier, pct: count/COMPANIES.length×100 }
aiRiskByMaturity[tier] = mean(aiRisk) across companies with that aiMaturity tier
```

These are correct, guard-appropriate unweighted means/percentages (`COMPANIES.length=45` is a fixed
non-empty constant). All inputs being aggregated are independently `sr()`-seeded per-company random
draws, so cross-tabulations (e.g. "does higher AI maturity correlate with higher AI risk?") reflect
the PRNG's coincidental patterns, not a modelled relationship.

### 7.3 Worked example

Company `i=10`: `sector = pick(SECTORS, 70)`. `cyberScore = round(30+sr(30)×65)`. `sr(30) =
frac(sin(31)×10⁴)`; `sin(31 rad)≈-0.404`, ×10⁴=-4040, frac (negative handled via `x−floor(x)`)
≈0.05 → `cyberScore ≈ round(30+0.05×65) = round(33.25) = 33`. Independently, `aiRisk =
round(20+sr(70)×75)` uses a completely different seed multiplier (`i×7=70`), so this company's
cyber score and AI risk score have no derived relationship — a company can show a low cyber score
(good defence) alongside a high AI risk score (poor model governance) purely by chance, which is
realistic in spirit (different risk dimensions genuinely can diverge) but not evidence of any
underlying causal model in this specific implementation.

### 7.4 Companion analytics

- **Vendor concentration** (`VENDOR_CONC`) — 8 real technology vendors with hand-assigned exposure %
  and risk tier (Microsoft 82%/High, AWS 71%/High, Broadcom/VMware 63%/High) — plausible
  concentration figures reflecting real hyperscaler/enterprise-software dependency patterns, static
  rather than computed from the 45-company dataset.
- **Regulatory readiness** — 10 real regulations (EU AI Act, NIS2, DORA, SEC Cyber Rule, NIST CSF 2.0,
  ISO 27001:2022, GDPR Art 32, UK NCSC CAF, NYDFS 500, FCA Operational Resilience) — accurate
  real-world regulatory citations, paired with `doraCovered`/`nisCovered` per-company boolean flags
  from the synthetic dataset.
- **Incident trend** — 5 attack-type time series (Ransomware, Data Breach, Supply Chain, OT Attack,
  Phishing) over 12 months, independently `sr()`-seeded per type/month, no seasonality or
  cross-type correlation modelled.

### 7.5 The backend engine (unused by this frontend page — left as-is by design)

`backend/services/technology_risk_engine.py` (986 lines) implements five genuine calculators —
`DataCentreResult` (PUE-based energy/carbon), `CloudEmissionsResult`, `AIModelCarbonResult` (training
compute → carbon), `SemiconductorRiskResult`, `EWasteResult` — exposed via `api/v1/routes/technology.py`
(`GET /ref/pue-benchmarks`, `GET /ref/grid-factors`, `GET /ref/semiconductor`, `POST /ai-carbon`,
etc.). These are legitimate, differently-scoped calculators (data-centre/AI environmental footprint,
not cyber risk and not clean-tech stranded-asset risk) that exist in the codebase but are **not
invoked anywhere in `TechnologyRiskPage.jsx`** — no `fetch`/API call to these endpoints appears in
the frontend file. This backend capability would need its own dedicated frontend page (e.g. an
"AI Carbon Accounting" module) or a new tab on this one to be surfaced to users; a top-of-file
comment has been added to `technology_risk_engine.py` documenting this so a future session can pick
it up without re-discovering the gap.

### 7.6 Data provenance & limitations

- **All 45 companies and every risk score are `sr()`-seeded synthetic data.**
- The guide's former `TDRS` clean-tech-disruption formula, BloombergNEF/Carbon Tracker data points,
  and asset-impairment-timeline modelling never existed anywhere in this route's code — the guide
  text has been corrected to remove that framing (see resolution note above).
- The genuinely-implemented backend AI/data-centre carbon engine remains orphaned from this frontend
  page — a real capability gap between what exists in the codebase and what a user can access via
  this route, intentionally left unaddressed this pass (see §7.5).
- Vendor concentration and regulatory readiness tables are accurate real-world reference content but
  static, not computed from company-level vendor/compliance data.

**Framework alignment:** EU AI Act, NIS2, DORA, NIST CSF 2.0, ISO 27001:2022, GDPR Art. 32 are
correctly named and current as real cyber/AI/operational-resilience regulations — this is the
module's genuine strength (an accurate regulatory-landscape reference), independent of both the
former stranded-asset guide framing and the orphaned backend carbon engine.

## 9 · Future Evolution

### 9.1 Evolution A — Surface the orphaned data-centre/AI carbon engine and derive the cyber scores (analytics ladder: rung 1 → 2)

**What.** The §7 resolution note documents a rare situation: a genuine 986-line backend engine (`technology_risk_engine.py` — PUE-based data-centre carbon, cloud Scope 3, AI training/inference footprint, semiconductor water risk, e-waste, EED Art. 12 compliance) is exposed via 14 real routes but **never called by the frontend page**, which instead renders 45 `sr()`-seeded synthetic companies (§7.5, left as-is by design with a marker comment). Evolution A closes that gap and adds derived scoring to the cyber panel.

**How.** (1) Wire the orphaned engine into the user-facing surface: either a new "Technology Footprint" tab on this page calling `POST /integrated-assessment` and the 7 reference GETs, or a dedicated module route — the engine already returns ESG scores and CSRD E1 data points. The lineage harness shows `POST /ai-carbon` currently fails: fix that first (it's a traced live failure, not hypothetical). (2) On the cyber panel, derive `overallRisk` from the seven dimension scores with documented weights instead of an independent random draw (§7.3 shows every score is separately seeded, so cross-tabs like AI-maturity-vs-AI-risk reflect PRNG coincidence). (3) Compute vendor concentration from company-level cloud-provider fields already in the dataset rather than the static 8-vendor table.

**Prerequisites.** Decision on placement (new module vs tab) — the §7.5 marker comment anticipated exactly this pick-up; the `POST /ai-carbon` failure diagnosed and fixed. **Acceptance:** a user can obtain an AI-training carbon estimate through the UI end-to-end; `overallRisk` reproduces from the seven dimensions; the traced POST failure is green in the next lineage sweep.

### 9.2 Evolution B — DORA/NIS2 readiness analyst over the regulatory reference layer (LLM tier 2)

**What.** The module's genuine strength (§7.6) is its accurate regulatory landscape — 10 real regulations with correct citations (DORA, NIS2, EU AI Act, NIST CSF 2.0, ISO 27001:2022, GDPR Art. 32, NYDFS 500...). A copilot answers CISO/board questions — "which of our entities are in NIS2 scope and what incident-reporting deadlines apply?", "estimate the training carbon of a 70B-parameter run on 512 H100s" — the latter as a tool call to the engine's `POST /ai-carbon`, never estimated in-context.

**How.** Tier 2 is unusually cheap here because the backend already exists: tool schemas auto-generate from the 14 Pydantic-typed routes (7 reference GETs are read-only and safe for the first slice). Grounding corpus: this Atlas record plus the `REG_READINESS` regulatory table and the engine's own benchmark payloads (`ref/pue-benchmarks`, `ref/grid-factors`, `ref/ai-benchmarks` — all traced passing). The copilot must partition its answers: engine outputs (carbon, PUE gaps, EED compliance) are computed and citable; the 45-entity cyber scores are synthetic demo data (§7.6) and must be labelled as such whenever quoted; regulatory text answers cite the named regulation.

**Prerequisites.** The `POST /ai-carbon` fix (shared with Evolution A); regulation table given an `as_of` vintage. **Acceptance:** every carbon/energy numeric traces to an engine tool call; every regulatory claim names its instrument; asking "what is JPMorgan's actual cyber score?" gets the synthetic-data disclaimer, not an authoritative-sounding answer.