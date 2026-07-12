# Disclosure Hub
**Module ID:** `disclosure-hub` · **Route:** `/disclosure-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Centralised sustainability disclosure management platform aggregating all framework obligations, filing calendars, document versions, and approval workflows in one place. Supports CSRD, GRI, TCFD, SFDR, ISSB, CDP, and national regulatory filings. Status dashboards provide real-time readiness across all jurisdictions.

> **Business value:** Eliminates the risk of missed disclosure deadlines and approval gaps by centralising all framework obligations in a single managed workflow. Readiness dashboards give leadership early warning of filing risks before they become regulatory breaches.

**How an analyst works this module:**
- Configure the entity profile with applicable jurisdictions and frameworks in Hub Settings
- Review the filing calendar and set internal preparation deadlines for each submission
- Assign section owners for each framework module and track completion progress
- Route completed disclosure packages through the approval workflow for CFO/CSO sign-off before filing

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLORS`, `DATA`, `ENTITY_TYPES`, `FRAMEWORKS`, `NAMES`, `RISK_LEVELS`, `STATUSES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `FRAMEWORKS` | `['CSRD/ESRS','SFDR','ISSB/IFRS S1-S2','SEC Climate','TCFD','UK SDR','EU Taxonomy','CDP'];` |
| `badgeS` | `(bg)=>({display:'inline-block',padding:'2px 10px',borderRadius:99,fontSize:11,fontWeight:600,fontFamily:T.mono,background:bg+'18',color:bg});` |
| `exportCSV` | `(rows,fn)=>{if(!rows.length)return;const ks=Object.keys(rows[0]);const csv=[ks.join(','),...rows.map(r=>ks.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.cre` |
| `framework` | `FRAMEWORKS[Math.floor(s(17)*FRAMEWORKS.length)];const entityType=ENTITY_TYPES[Math.floor(s(23)*ENTITY_TYPES.length)];` |
| `status` | `STATUSES[Math.floor(s(29)*STATUSES.length)];const risk=RISK_LEVELS[Math.floor(s(31)*RISK_LEVELS.length)];` |
| `paged` | `useMemo(()=>filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),[filtered,page]);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);` |
| `kpis` | `useMemo(()=>{const d=filtered;if(!d.length)return{count:0,avgCompletion:0,avgQuality:0,totalGaps:0,auditReady:0,avgAuto:0}; return{count:d.length,avgCompletion:d.reduce((a,r)=>a+r.completionRate,0)/d.length,avgQuality:d.reduce((a,r)=>a+r.dataQuality,0)/d.length,totalGaps:d.reduce((a,r)=>a+r.gaps,0),auditReady:d.filter(r=>r.auditReady==='Y` |
| `fwDist` | `useMemo(()=>{const m={};filtered.forEach(r=>{m[r.framework]=(m[r.framework]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name:name.length>14?name.slice(0,14)+'..':name,value})).sort((a,b)=>b.value-a.value);},[` |
| `statusDist` | `useMemo(()=>STATUSES.map(s=>({name:s,value:filtered.filter(r=>r.status===s).length})),[filtered]);` |
| `radarData` | `useMemo(()=>{if(!filtered.length)return[];const avg=k=>filtered.reduce((a,r)=>a+r[k],0)/filtered.length;` |
| `fwCompletion` | `useMemo(()=>FRAMEWORKS.map(f=>{const items=filtered.filter(r=>r.framework===f);if(!items.length)return null;return{name:f.length>14?f.slice(0,14)+'..':f,completion:items.reduce((a,r)=>a+r.completionRate,0)/items.length,q` |
| `trendData` | `useMemo(()=>['Q1','Q2','Q3','Q4'].map((q,i)=>({quarter:q,completion:filtered.reduce((a,r)=>a+[r.q1,r.q2,r.q3,r.q4][i],0)/(filtered.length\|\|1)})),[filtered]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `ENTITY_TYPES`, `FRAMEWORKS`, `NAMES`, `RISK_LEVELS`, `STATUSES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Frameworks | — | Framework registry | Count of sustainability frameworks with active filing obligations for the current entity |
| Overall DRI | — | Readiness engine | Weighted disclosure readiness index across all active frameworks; target ≥0.90 at T−30 days |
| Upcoming Filing Deadlines (30d) | — | Calendar engine | Count of framework filing deadlines occurring within the next 30 days |
| Documents Pending Approval | — | Workflow engine | Sustainability disclosure documents awaiting sign-off in the approval chain |
- **Framework obligation registry (requirements per framework per entity type)** → Applicability determination based on entity size, sector, and jurisdiction → **Personalised framework obligation list with filing deadlines**
- **Disclosure document repository** → Version control, section tagging, and completeness tracking → **Document readiness status per framework section**
- **Approval workflow engine** → Multi-level sign-off routing with escalation triggers → **Audit trail of approvals with timestamps and approver identity**

## 5 · Intermediate Transformation Logic
**Methodology:** Disclosure Readiness Index
**Headline formula:** `DRI = Σ (Completed Items / Required Items × Weight) per Framework`

The readiness index aggregates completion across all active framework modules, weighting each by regulatory penalty severity and filing deadline proximity. A DRI below 0.85 triggers escalation alerts to the Chief Sustainability Officer dashboard.

**Standards:** ['CSRD Article 29a', 'SFDR Article 10', 'CDP 2024 Questionnaire', 'ISSB IFRS S1/S2']
**Reference documents:** CSRD Directive 2022/2464 â€” Article 29a Sustainability Reporting Requirements; SFDR Regulation 2019/2088 â€” Article 10 Sustainability-related Disclosures; CDP (2024) Technical Note â€” Reporting Guidance; IFRS S1 (2023) General Requirements for Disclosure of Sustainability-related Financial Information

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide names a *Disclosure Readiness Index* `DRI = Σ(Completed
> Items / Required Items × Weight) per Framework`, weighted by regulatory penalty severity and deadline
> proximity, with a DRI<0.85 escalation trigger. **No DRI is computed.** The 50 entities and every
> field — completion rate, data quality, gaps, automation, quarterly progress — are drawn from the
> seeded PRNG `sr()`. The framework list is real; the readiness metrics are synthetic. This is a
> disclosure-workflow *dashboard mock*, not a readiness engine.

### 7.1 What the module computes

```js
DATA = genData(50): per entity, all fields seeded via s(idx)=sr(i·idx+idx):
  framework   = FRAMEWORKS[⌊s(17)·8⌋]          // CSRD/ESRS, SFDR, ISSB, SEC, TCFD, UK SDR, EU Tax, CDP
  completionRate = ⌊10 + s(41)·88⌋              // %
  dataQuality = ⌊20 + s(43)·78⌋ ; gaps = ⌊s(47)·25⌋
  envDisc/socDisc/govDisc, q1..q4 quarterly, aum, employees — all seeded
KPIs (over filtered set): avgCompletion, avgQuality, totalGaps, auditReady count, avgAuto
```

Aggregates are plain means/sums over the synthetic set: framework distribution, status distribution,
an E/S/G radar, per-framework completion, and a Q1–Q4 trend line.

### 7.2 Parameterisation

| Element | Value | Provenance |
|---|---|---|
| Frameworks (8) | CSRD/ESRS, SFDR, ISSB/IFRS S1-S2, SEC Climate, TCFD, UK SDR, EU Taxonomy, CDP | real standards |
| Entity types | Asset Manager, Bank, Insurance, Pension, Corporate, Sovereign | labels |
| Entity names | BlackRock, Vanguard, State Street … NBIM, GIC, ADIA | real institution names (labels) |
| All metrics | completion/quality/gaps/automation/quarterly | synthetic (`sr()`) |

### 7.3 Calculation walkthrough

`genData(50)` seeds all entity rows once. The dashboard filters by framework/type/status/search, sorts,
paginates. KPIs average completion/quality/automation and sum gaps over the filtered set. Charts show
framework and status distributions, an average E/S/G disclosure radar, per-framework mean completion,
and a four-quarter completion trend from the seeded `q1..q4` fields.

### 7.4 Worked example

Entity i=0 (BlackRock): `completionRate = ⌊10 + s(41)·88⌋` where `s(41) = sr(0·41+41) = sr(41)`.
`sr(41) = frac(sin(42)·10⁴)`… suppose 0.62 → `⌊10 + 54.6⌋ = 64%`. `dataQuality = ⌊20 + sr(43)·78⌋`,
`gaps = ⌊sr(47)·25⌋`, `auditReady = sr(61) > 0.5 ? Yes : No`. The KPI "Avg Completion" is the mean of
these seeded values across the filtered set — a plausible-looking but manufactured readiness figure.
No DRI weighting by penalty severity or deadline proximity is applied.

### 7.5 Data provenance & limitations

- **Entirely synthetic** entity metrics (`sr(seed) = frac(sin(seed+1)×10⁴)`); only institution names
  and the 8 framework labels are real.
- The guide's DRI (weighted completion with penalty/deadline weighting and 0.85 escalation) is
  unimplemented — the page reports unweighted mean completion.
- No real filing calendar, no document repository, no approval-workflow state machine — these are UI
  concepts over seeded data.

**Framework alignment:** CSRD Art. 29a, SFDR Art. 10, CDP questionnaire, ISSB IFRS S1/S2, EU Taxonomy,
UK SDR — the module correctly enumerates the live obligations an FI faces, so it works as a *framework
inventory*; a production hub would connect each framework to its real requirement set and a filing-
deadline calendar to compute a genuine, penalty-weighted readiness index. See
`disclosure-adequacy-analyzer` §8 for the coverage-scoring spec that would feed such a DRI.

## 9 · Future Evolution

### 9.1 Evolution A — A computed DRI over real obligations and deadlines (analytics ladder: rung 1 → 2, honestly attained)

**What.** The §7 flag is blunt: this is "a disclosure-workflow *dashboard mock*, not a readiness engine" — all 50 entities' completion rates, quality scores, gaps, and quarterly trends are `sr()`-seeded, and the guide's penalty/deadline-weighted DRI with its 0.85 escalation trigger is unimplemented. The real assets are the 8-framework obligation list and the workflow concepts. Evolution A builds the readiness engine: a persisted obligation register per entity, real filing deadlines, and the actual `DRI = Σ(completed/required × weight)` computation.

**How.** (1) Tables `disclosure_obligations` (entity × framework × requirement-count × deadline) and `disclosure_progress` (items completed, section owner, sign-off state). Deadlines come from the existing `regulatory-calendar` backend (`api/v1/routes/regulatory_calendar.py`) rather than a new calendar. (2) Requirement counts per framework come from `disclosure-adequacy-analyzer`'s Evolution-A inventory (its §8 spec is explicitly cited by this page as the DCS feed) — the hub aggregates, it doesn't re-derive. (3) `services/disclosure_hub_engine.py` computes DRI with deadline-proximity and penalty-severity weights (documented constants, not seeds), plus the <0.85 escalation flag. (4) Q1–Q4 trend becomes a snapshot history table, replacing seeded `q1..q4` fields.

**Prerequisites.** The adequacy analyzer's requirement inventory shipped first; seeded institution-name rows (BlackRock, NBIM…) replaced with org-scoped demo entities to avoid implying real firms' readiness. **Acceptance:** DRI for a fixture entity with 45/50 CSRD items done at T−20 days matches the documented weighted formula by hand; zero `sr()` in any KPI path.

### 9.2 Evolution B — Disclosure-desk orchestrator across the reporting module family (LLM tier 3)

**What.** The hub is the natural seat for a desk-level assistant, not a per-page copilot: "are we ready for our CSRD filing?" should route across modules — coverage gaps from `disclosure-adequacy-analyzer`, datapoint status from `esrs-datapoint-navigator`, deadlines from `regulatory-calendar`, taxonomy alignment from `eu-taxonomy` — and return a synthesized readiness memo with the DRI decomposition and the top remediation actions by owner.

**How.** Routing knowledge from `module_tags.json` (disclosure/reporting sector tags) plus the Atlas interconnection graph; tool surface = the read-only endpoints of the 4–5 disclosure-family modules, auto-filtered per the Atlas endpoint map. Output composes into the report-studio render layer per the roadmap's tier-3 pattern, producing a signed-off-able readiness memo with a "show work" expander listing every tool call. Escalation behavior mirrors the engine: if computed DRI < 0.85, the memo leads with the breach, not buries it.

**Prerequisites (hard).** Evolution A first — today every readiness number on this page is fabricated, and a tier-3 orchestrator narrating seeded completion rates would automate the fabrication. Sibling modules need their own honest scoring (see their §9 entries). **Acceptance:** the memo's every figure traces to a named module endpoint response; asking about a framework the entity hasn't registered obligations for yields "no obligation on file," not an invented status.