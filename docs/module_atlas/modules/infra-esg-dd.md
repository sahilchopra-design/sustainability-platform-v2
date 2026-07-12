# Infrastructure ESG Due Diligence
**Module ID:** `infra-esg-dd` · **Route:** `/infra-esg-dd` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides pre-investment ESG due diligence framework for infrastructure assets aligned with GIIA Global ESG Reporting and Performance Framework, covering environmental baseline assessment, social impact, stakeholder engagement, and governance of the investee entity. Supports GP/LP reporting and infrastructure-specific ESG risk mitigation planning.

> **Business value:** Enables infrastructure investors to identify material ESG risks before financial close, structure ESG covenants in financing agreements, meet GIIA ESG framework reporting obligations, and demonstrate alignment with IFC Performance Standards required for development finance institution co-investment.

**How an analyst works this module:**
- Complete the infrastructure ESG screening questionnaire covering asset type, geography, technology, and operating phase.
- Run the environmental baseline gap analysis to identify studies required before financial close under IFC Performance Standards.
- Assess the social impact and stakeholder engagement plan against GIIA community engagement requirements.
- Generate the investment committee ESG risk memorandum with IERR score and recommended ESG action plan.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSET_TYPES`, `Badge`, `COUNTRIES`, `Card`, `DD_ITEMS`, `DEFAULT_INFRA_PORTFOLIO`, `EP_COLORS`, `KPI`, `PIE_COLORS`, `SDG_NAMES`, `STORAGE_KEY`, `SortIcon`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ASSET_TYPES` | `['Solar','Wind','Toll Road','Port','Airport','Water','Telecom','Mining','Storage','Geothermal','Hydro','Rail','Waste-to-Energy','Gas Pipeline'];` |
| `pct` | `(v, d = 1) => v != null ? `${v.toFixed(d)}%` : '-';` |
| `fmt` | `(v, d = 1) => v != null ? v.toFixed(d) : '-';` |
| `fmtB` | `v => v >= 1000 ? `${(v / 1000).toFixed(1)}B` : `${v.toFixed(0)}M`;` |
| `fmtK` | `v => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`;` |
| `updated` | `{ ...data, assets: data.assets.map(a => a.id === assetId ? { ...a, ...changes } : a) };` |
| `nextId` | ``INF-${String(data.assets.length + 1).padStart(2, '0')}`;` |
| `final` | `{ ...asset, id: nextId, composite_esg: Math.round((asset.environmental_score + asset.social_score + asset.governance_score) / 3) };` |
| `types` | `useMemo(() => ['All', ...new Set(assets.map(a => a.type))], [assets]);` |
| `totalInvestment` | `assets.reduce((s, a) => s + a.total_investment_usd_mn, 0);` |
| `avgESG` | `assets.length ? assets.reduce((s, a) => s + a.composite_esg, 0) / assets.length : 0;` |
| `totalAvoided` | `assets.reduce((s, a) => s + a.avoided_emissions_tco2e, 0);` |
| `totalJobs` | `assets.reduce((s, a) => s + a.jobs_created, 0);` |
| `avgCommunity` | `assets.length ? assets.reduce((s, a) => s + a.community_impact_score, 0) / assets.length : 0;` |
| `ddTotalAll` | `assets.reduce((acc, a) => {` |
| `ddPct` | `ddTotalAll.total > 0 ? (ddTotalAll.done / ddTotalAll.total * 100) : 0;` |
| `typeDistrib` | `useMemo(() => { const m = {}; assets.forEach(a => { m[a.type] = (m[a.type] \|\| 0) + 1; }); return Object.entries(m).map(([name, value]) => ({ name, value })); }, [assets]);` |
| `investByType` | `useMemo(() => { const m = {}; assets.forEach(a => { m[a.type] = (m[a.type] \|\| 0) + a.total_investment_usd_mn; }); return Object.entries(m).map(([type, investment]) => ({ type, investment })).sort((a, b) => b.investment -` |
| `avgPS` | `useMemo(() => { const sums = {ps1:0,ps2:0,ps3:0,ps4:0,ps5:0,ps6:0,ps7:0,ps8:0}; assets.forEach(a => { Object.keys(sums).forEach(k => { sums[k] += a.ifc_ps[k]; }); }); Object.keys(sums).forEach(k => { sums[k] /= assets.le` |
| `radarData` | `psLabels.map((label, i) => { const k = `ps${i + 1}`; return { subject: label, asset: sel?.ifc_ps?.[k] \|\| 0, average: Math.round(avgPS[k]) }; });` |
| `sdgFreq` | `useMemo(() => { const m = {}; assets.forEach(a => a.sdg_alignment.forEach(s => { m[s] = (m[s] \|\| 0) + 1; })); return Object.entries(m).map(([sdg, count]) => ({ sdg: `SDG ${sdg}`, label: SDG_NAMES[sdg] \|\| `Goal ${sdg}`, c` |
| `ddHeatmap` | `useMemo(() => assets.map(a => { const eD = a.dd_checklist.environmental.filter(Boolean).length, eT = a.dd_checklist.environmental.length; const sD = a.dd_checklist.social.filter(Boolean).length, sT = a.dd_checklist.socia` |
| `emissionsComparison` | `useMemo(() => assets.filter(a => a.avoided_emissions_tco2e > 0).map(a => ({ name: a.name.length > 18 ? a.name.slice(0, 16) + '..' : a.name, avoided: a.avoided_emissions_tco2e / 1000, actual: (a.scope1_tco2e + a.scope2_tc` |
| `blendedData` | `useMemo(() => assets.map(a => ({ name: a.name.length > 14 ? a.name.slice(0, 12) + '..' : a.name, Equity: a.blended_finance.equity_pct, 'Commercial Debt': a.blended_finance.commercial_debt_pct, DFI: a.blended_finance.dfi_` |
| `concessionData` | `useMemo(() => assets.map(a => { const elapsed = a.construction_pct === 100 ? Math.min(5, a.concession_years) : 0; return { name: a.name.length > 14 ? a.name.slice(0, 12) + '..' : a.name, remaining: a.concession_years - e` |
| `exportCSV` | `(rows, filename) => { if (!rows.length) return; const keys = Object.keys(rows[0]); const csv = [keys.join(','), ...rows.map(r => keys.map(k => { const v = r[k]; return typeof v === 'string' && v.includes(',') ? `"${v}"` ` |
| `exportPortfolio` | `() => exportCSV(assets.map(a => ({ ID: a.id, Name: a.name, Type: a.type, Country: a.country, 'Investment ($M)': a.total_investment_usd_mn, 'EP Cat': a.ep_category, ESG: a.composite_esg, Status: a.status, 'Avoided (tCO2e)` |
| `exportDD` | `() => exportCSV(ddHeatmap.map(d => ({ ID: d.id, Name: d.name, 'Env %': d.envPct.toFixed(1), 'Soc %': d.socPct.toFixed(1), 'Gov %': d.govPct.toFixed(1), 'Total %': d.totalPct.toFixed(1) })), 'infra_dd_completion.csv');` |
| `exportIFC` | `() => exportCSV(assets.map(a => ({ ID: a.id, Name: a.name, PS1: a.ifc_ps.ps1, PS2: a.ifc_ps.ps2, PS3: a.ifc_ps.ps3, PS4: a.ifc_ps.ps4, PS5: a.ifc_ps.ps5, PS6: a.ifc_ps.ps6, PS7: a.ifc_ps.ps7, PS8: a.ifc_ps.ps8, 'EP Cat':` |
| `numVal` | `Math.min(100, Math.max(0, Number(val)));` |
| `otherSum` | `others.reduce((s, f) => s + bf[f], 0);` |
| `total` | `Object.values(bf).reduce((s, v) => s + v, 0);` |
| `avg` | `Math.round(Object.values(ps).reduce((s, v) => s + v, 0) / 8);` |
| `statusColor` | `checks[idx] ? T.green : meta.status === 'In Progress' ? T.amber : meta.status === 'N/A' ? T.textMut : T.red;` |
| `remedCost` | `gap > 30 ? `$${(gap * 50).toLocaleString()}K` : gap > 10 ? `$${(gap * 30).toLocaleString()}K` : `$${(gap * 15).toLocaleString()}K`;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_TYPES`, `COUNTRIES`, `PIE_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Infrastructure ESG Score | — | GIIA / EDHECinfra | Composite ESG rating for infrastructure assets; energy transition assets (wind, solar, batteries) typically score 70â€“85; fossil fuel infrastructure 30â€“50. |
| Environmental Baseline Completeness (%) | — | IFC Performance Standard 6 | Percentage of required environmental baseline studies completed (biodiversity, noise, air, water, soil); IFC PS6 requires 100% before financial close. |
| Community Benefit Agreement Coverage (%) | — | Social impact assessment | Proportion of affected communities with documented community benefit agreements covering employment, access, and compensation. |
| Transition Risk Score | — | IEA NZE / NGFS | Climate transition risk for the asset relative to sector decarbonisation pathway; stranded asset risk rises steeply for fossil fuel infrastructure in 1.5°C scenarios. |
- **Infrastructure asset technical data (capacity, technology, geography)** → Score against GIIA ESG criteria by sub-pillar → **Infrastructure ESG sub-pillar scores**
- **Environmental impact assessment reports** → Cross-reference against IFC PS checklist → **Environmental baseline completeness gap analysis**
- **Community consultation records** → Assess against GIIA social engagement standards → **Social license risk rating**

## 5 · Intermediate Transformation Logic
**Methodology:** Infrastructure ESG Risk Rating
**Headline formula:** `IERR = w_E × Environmental_score + w_S × Social_score + w_G × Governance_score + w_Transition × Transition_risk`

Constructs an infrastructure-specific ESG risk rating weighted toward environmental and transition risk factors, which dominate value destruction risk in long-duration infrastructure assets. The transition risk sub-score applies stranded asset probability and carbon intensity relative to IEA NZE pathway for energy infrastructure.

**Standards:** ['GIIA Global ESG Reporting and Performance Framework', 'EDHECinfra ESG Methodology', 'IFC Performance Standards']
**Reference documents:** GIIA â€” Global ESG Reporting and Performance Framework (2021); IFC Performance Standards on Environmental and Social Sustainability (2012); EDHECinfra â€” Infrastructure ESG Scores Methodology (2023); GI Hub â€” ESG in Infrastructure Investment (2022)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

An **infrastructure ESG due-diligence** workbench: a fully-editable 20-asset portfolio (persisted to
localStorage) scored on environmental/social/governance sub-scores, IFC Performance Standards (PS1–PS8),
an IFC E&S category (A/B/C), a 40-item DD checklist and blended-finance structure. The dataset is
**hand-authored from real projects** (Rajasthan Solar, North Sea Wind, Nhava Sheva Port, SQM Lithium…)
— no PRNG. The composite ESG and DD-completion arithmetic is genuine, though the guide's transition-risk
sub-score is not implemented. Flagged below.

> ⚠️ **Guide↔code note.** The guide's IERR formula weights in a **transition-risk sub-score**
> (`IERR = w_E·Env + w_S·Soc + w_G·Gov + w_Transition·TransitionRisk`, with stranded-asset probability
> vs IEA NZE). The code's composite is a **plain equal-weight mean of the three ESG scores**
> (`(env+soc+gov)/3`) — there is no transition-risk term, no stranded-asset probability, no IEA-NZE
> pathway comparison. Env/soc/gov scores are entered per asset, not derived from GIIA criteria.

### 7.1 What the module computes

**Composite ESG** — equal-weight mean:

```js
composite_esg = round((environmental_score + social_score + governance_score) / 3)
```

**IFC PS radar** — portfolio-average of each of the 8 Performance Standards:

```js
avgPS[psk] = Σ_assets a.ifc_ps[psk] / assets.length          // k = 1..8
```

**DD completion** — share of the 40 checklist items marked true:

```js
ddPct = ddTotalAll.total>0 ? ddTotalAll.done/ddTotalAll.total*100 : 0
// per-pillar: envDone/envTotal, socDone/socTotal, govDone/govTotal
```

**Blended-finance balance** and **remediation-cost heuristic**:

```js
total_bf = Σ blended_finance percentages         (should sum to 100)
remedCost = gap>30 ? $(gap·50)K : gap>10 ? $(gap·30)K : $(gap·15)K   // gap = 100 − PS avg
```

### 7.2 Parameterisation — the asset schema (real data)

| Field group | Content | Provenance |
|---|---|---|
| `DD_ITEMS` | 15 env + 15 social + 10 gov DD items | Standard infra ESDD checklist (EIA, resettlement, anti-corruption…) |
| `ifc_ps` | PS1–PS8 scores 0–100 | **Real IFC Performance Standards** framework |
| `ep_category` | A / B / C | **IFC E&S risk category** (A = high, C = low) |
| `sdg_alignment` | SDG list per asset | Curated |
| `blended_finance` | equity/commercial/DFI/concessional % | Curated capital stack |
| 20 assets | capacity, capex, emissions, avoided emissions, scores | Hand-authored from real projects |

Assets are real and internally consistent — e.g. SQM Lithium (Chile): category A, env 42, PS6 (biodiv)
45, "Atacameño community water rights"; Rajasthan Solar: category B, env 85, 680 000 tCO₂e avoided.

### 7.3 Calculation walkthrough

`data` initialises from localStorage or `DEFAULT_INFRA_PORTFOLIO`; `updateAsset`/`addAsset`/`deleteAsset`
mutate and persist. `avgESG`, `totalInvestment`, `totalAvoided`, `totalJobs`, `avgCommunity` reduce the
portfolio. `ddHeatmap` computes per-asset env/soc/gov DD completion %; `avgPS` averages each PS across
assets for the radar. `investByType`/`typeDistrib` group by asset type. New assets get
`composite_esg = round((env+soc+gov)/3)` on add.

### 7.4 Worked example (Rajasthan Solar Park, INF-01)

| Step | Computation | Result |
|---|---|---|
| composite_esg | (85 + 68 + 72)/3 | **75** |
| Env DD completion | 12 of 15 items true | **80%** |
| Social DD completion | 12 of 15 true | **80%** |
| Gov DD completion | 9 of 10 true | **90%** |
| IFC category | B | significant-but-manageable impacts |
| PS6 gap remediation | gap = 100−78 = 22 → $(22·30)K | **$660K** est. remediation |

### 7.5 Data provenance & limitations

- **Data is real and editable** — 20 curated projects, user can add/edit/delete with localStorage
  persistence. **No `sr()` PRNG.** IFC PS and E&S category frameworks are real.
- The **composite ESG is an equal-weight mean**, not the guide's transition-risk-weighted IERR — no
  stranded-asset probability, no IEA-NZE comparison. Env/soc/gov scores are analyst inputs, not derived.
- The remediation-cost heuristic (`gap × $15–50K`) is a rule-of-thumb, not a costed gap analysis.

## 8 · Model Specification — Infrastructure ESG Risk Rating with transition sub-score (IERR)

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce a transition-aware infrastructure ESG rating so long-duration assets (30–50 yr concessions) are
scored on stranded-asset risk, not just static E/S/G — supporting pre-financial-close IC decisions and
ESG covenant structuring.

### 8.2 Conceptual approach
Weighted composite with an explicit transition-risk sub-score, mirroring **EDHECinfra**'s infrastructure
ESG methodology and **GIIA** framework, with the transition term derived from carbon intensity vs the
**IEA NZE** sector pathway (stranded-asset probability à la Carbon Tracker).

### 8.3 Mathematical specification
```
IERR = w_E·Env + w_S·Soc + w_G·Gov + w_T·(100 − TransitionRisk)
TransitionRisk = 100 · P(stranded)
P(stranded) = Φ( (CI_asset − CI_NZE_pathway(t)) / σ_sector )        (probit on intensity gap)
Env/Soc/Gov = Σ_criteria GIIA_subscore · criterion_weight
w = (0.30, 0.20, 0.20, 0.30)   (transition-heavy for energy infra; w_T→0.1 for social infra)
```

| Parameter | Source |
|---|---|
| `CI_asset` | Asset carbon intensity (tCO₂/output) — in schema |
| `CI_NZE_pathway(t)` | IEA NZE sector decarbonisation trajectory |
| `σ_sector` | Sector intensity dispersion | EDHECinfra / Trucost |
| GIIA sub-scores | GIIA ESG criteria | GIIA framework |
| `w_T` | Transition weight by asset type | Calibrated to EDHECinfra |

### 8.4 Data requirements
Asset carbon intensity + output (in schema), IEA NZE sector pathways (needs ingestion), GIIA criterion
scores (partially the env/soc/gov inputs), sector intensity dispersion. Avoided-emissions and Scope 1/2
already captured per asset.

### 8.5 Validation & benchmarking plan
Reconcile IERR ranking against EDHECinfra published infra-ESG scores; validate that fossil assets (LNG,
WtE incineration) score low transition and renewables high; sensitivity to `w_T` and NZE-pathway vintage.

### 8.6 Limitations & model risk
Stranded-asset probability is scenario-dependent — present under multiple NGFS/IEA scenarios, not one.
Social infra (water, telecom) has low transition risk but high social risk; do not let a low `w_T` mask
category-A social impacts — retain a category-A override that floors the rating.

**Framework alignment:** GIIA *Global ESG Reporting Framework* · EDHECinfra *Infrastructure ESG Scores* ·
IFC *Performance Standards* (PS1–PS8, the module's real radar) and E&S categorisation (A/B/C) · IEA NZE
(transition pathway). The code implements the IFC PS scoring and DD checklist faithfully on real data;
the transition-weighted IERR the guide names remains a specification.

## 9 · Future Evolution

### 9.1 Evolution A — Transition-weighted IERR on the existing asset schema (analytics ladder: rung 2 → 3)

**What.** The workbench's data layer is genuinely strong — 20 curated real projects (Rajasthan Solar, SQM Lithium with its Atacameño water-rights note), fully editable with localStorage persistence, real IFC PS1–PS8 scoring, E&S categories and a 40-item DD checklist, no PRNG. The §7 flag isolates what's missing: the composite is a plain equal-weight mean `(env+soc+gov)/3`, not the guide's `IERR = w_E·Env + w_S·Soc + w_G·Gov + w_T·(100−TransitionRisk)` — no stranded-asset probability, no IEA-NZE pathway comparison, despite the schema already carrying the carbon-intensity and output fields §8.4 says are needed. The remediation-cost heuristic (`gap × $15–50K`) is also a rule-of-thumb. Evolution A implements the §8 spec: `P(stranded) = Φ((CI_asset − CI_NZE(t))/σ_sector)`, transition weights by asset type (0.30 energy, ~0.1 social infra), and §8.6's category-A floor override so low transition weight never masks high social risk.

**How.** (1) Ingest IEA NZE sector pathway intensities into refdata (a small, public table). (2) A scoring function (candidate first backend route, since localStorage-only persistence also blocks team sharing — move the portfolio to a proper table with org scoping) computing IERR per asset with the four weighted terms exposed. (3) Validate per §8.5: LNG/WtE assets score low transition, renewables high; rank order sanity-checked against EDHECinfra published score patterns. (4) Remediation cost re-based on per-PS gap-closure cost bands with sources, replacing the scalar heuristic.

**Prerequisites.** NZE pathway ingestion; sector dispersion (σ) estimates documented; DB persistence migration (localStorage → table) sequenced first so scores attach to durable records. **Acceptance:** a gas pipeline and a solar park with identical E/S/G means produce different IERRs for a shown transition reason; category-A assets floor correctly; the Rajasthan worked example (§7.4) reproduces its DD percentages post-migration.

### 9.2 Evolution B — IC memo copilot over the DD workbench (LLM tier 2)

**What.** The module's §1 workflow ends at "generate the investment committee ESG risk memorandum" — currently manual. Evolution B drafts it: "prepare the IC ESG memo for SQM Lithium" produces a structured memo from the asset's record — composite/IERR decomposition, IFC PS radar vs portfolio average, E&S category rationale, DD checklist gaps with the items named, community/stakeholder flags, and a covenant recommendation list — every number from the stored asset, every framework claim from the curated IFC/GIIA alignment text.

**How.** Tier 2: tool schemas over the Evolution A scoring route and portfolio queries; memo structure fixed by template with the no-fabrication validator on all scores and percentages. Two discipline rules: DD-gap statements must enumerate the actual unchecked `DD_ITEMS` (e.g. "resettlement plan: In Progress"), not summarise vaguely — the checklist granularity is the module's value; and social-risk narrative for sensitive cases (indigenous water rights) stays within the recorded fields, cross-referencing the indigenous-rights-fpic module where a case overlaps its universe. Covenant suggestions map gaps to standard ESG covenant categories rather than inventing legal terms.

**Prerequisites.** Evolution A's persistence migration and scoring route (memos need durable, addressable records; localStorage state is invisible to the backend). **Acceptance:** a generated memo's every figure traces to the asset record; DD gaps list the exact items; memos for category-A assets always include the escalation flag.