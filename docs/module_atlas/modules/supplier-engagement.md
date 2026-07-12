# Supplier Engagement
**Module ID:** `supplier-engagement` · **Route:** `/supplier-engagement` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Supplier ESG improvement programme management platform enabling buyers to set targets, track supplier progress, deliver capacity building and report aggregated supply chain ESG improvements.

> **Business value:** CDP data shows suppliers in active engagement programmes reduce emissions 2.4× faster than non-engaged peers; buyer-led supplier programmes are increasingly mandated under CSRD and German LkSG.

**How an analyst works this module:**
- Prioritise suppliers by spend, risk and ESG gap
- Set improvement targets and sign programme agreements
- Deliver capacity-building tools and training
- Monitor quarterly progress against KPIs
- Report aggregate supply chain ESG improvement to CDP and CSRD disclosures

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTION_TYPES`, `ActionTrackerTab`, `BenchmarkingTab`, `CERT_TYPES`, `COUNTRIES`, `DIMS`, `DIM_KEYS`, `DIM_WEIGHTS`, `INDUSTRIES`, `OWNERS`, `PipelineTab`, `QUARTERS`, `RISK_CATEGORIES`, `STAGES`, `STAGE_COLORS`, `STATUSES`, `STATUS_COLORS`, `ScorecardTab`, `TABS`, `TIERS`, `TIER_COLORS`, `TIER_THRESHOLDS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REPORTS` | 5 | `id`, `name`, `desc` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CERT_TYPES` | `['ISO 14001','ISO 45001','SA8000','FSC','GRI Verified','CDP A-List','B-Corp','Fair Trade'];` |
| `RISK_CATEGORIES` | `['Supply Disruption','Regulatory Non-Compliance','Reputational','Environmental Incident','Labour Rights','Data Privacy'];` |
| `suppliers` | `Array.from({length:150},(_,i)=>{const s=n=>sr(i*100+n);` |
| `scores` | `DIM_KEYS.map((_,d)=>Math.round(30+s(d*7+3)*65));` |
| `weighted` | `Math.round(scores.reduce((a,sc,idx)=>a+sc*DIM_WEIGHTS[idx],0));` |
| `composite` | `Math.round(scores.reduce((a,b)=>a+b,0)/6);` |
| `history` | `QUARTERS.map((_,q)=>Math.round(Math.max(15,Math.min(98,composite-10+s(q*13+50)*20))));` |
| `certs` | `CERT_TYPES.filter((_,ci)=>s(ci+90)>0.55);` |
| `risks` | `RISK_CATEGORIES.filter((_,ri)=>s(ri+120)>0.65);` |
| `contactName` | `['A. Martinez','B. Liu','C. Patel','D. Svensson','E. Nakamura','F. Weber','G. Kim','H. Santos','I. Smith','J. Dubois'][Math.floor(s(140)*10)];` |
| `contactRole` | `['VP Supply Chain','Sustainability Director','ESG Manager','Procurement Lead','Compliance Officer'][Math.floor(s(141)*5)];` |
| `engagements` | `Array.from({length:40},(_,i)=>{const s=n=>sr(i*200+n+5000);` |
| `sup` | `suppliers[Math.floor(s(1)*150)];` |
| `stageIdx` | `Math.floor(s(2)*6);` |
| `activities` | `Array.from({length:Math.floor(2+s(30)*6)},(__,a)=>({` |
| `actions` | `Array.from({length:40},(_,i)=>{const s=n=>sr(i*300+n+9000);` |
| `statusIdx` | `Math.floor(s(2)*4);` |
| `daysTotal` | `Math.floor(30+s(10)*120);` |
| `daysElapsed` | `Math.floor(s(11)*daysTotal);` |
| `milestones` | `Array.from({length:Math.floor(2+s(12)*4)},(__,m)=>({` |
| `updates` | `Array.from({length:Math.floor(1+s(40)*5)},(__,u)=>({` |
| `pill` | `(label,color,textColor)=>({display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:600,fontFamily:T.mono,background:color+'22',color:textColor\|\|color,border:`1px solid ${color}44`});` |
| `paged` | `filtered.slice(page*perPage,(page+1)*perPage);` |
| `totalPages` | `Math.ceil(filtered.length/perPage);` |
| `radarData` | `useCallback((sup)=>DIMS.map((d,idx)=>({dim:d,score:sup.scores[idx]})),[]);` |
| `trendData` | `useCallback((sup)=>QUARTERS.map((q,idx)=>({q,score:sup.history[idx]})),[]);` |
| `filteredAvg` | `filtered.length?Math.round(filtered.reduce((a,s)=>a+s.composite,0)/filtered.length):0;` |
| `filteredTotalSpend` | `filtered.reduce((a,s)=>a+s.spend,0);` |
| `peers` | `suppliers.filter(s=>s.industry===selected.industry).sort((a,b)=>b.composite-a.composite).slice(0,10);` |
| `regress` | `(id)=>{setData(prev=>prev.map(e=>e.id===id&&e.stageIdx>0?{...e,stageIdx:e.stageIdx-1,stage:STAGES[e.stageIdx-1]}:e));};` |
| `newE` | `{id:data.length+1,supplierId:sup.id,supplierName:sup.name,industry:sup.industry,country:sup.country,` |
| `stageCounts` | `STAGES.map(st=>data.filter(e=>e.stage===st).length);` |
| `avgTimeByStage` | `STAGES.map(st=>{const items=data.filter(e=>e.stage===st);return items.length?Math.round(items.reduce((a,e)=>a+e.daysInStage,0)/items.length):0;});` |
| `totalPriority` | `data.reduce((a,e)=>a+e.priority,0);` |
| `avgPriority` | `data.length?Math.round(totalPriority/data.length):0;` |
| `completionRate` | `Math.round(data.filter(e=>e.stageIdx>=5).length/data.length*100);` |
| `pct` | `stageCounts[idx]/funnelMax;` |
| `avgEffectiveness` | `Math.round(actions.reduce((a,c)=>a+c.effectiveness,0)/actions.length);` |
| `effectivenessByType` | `ACTION_TYPES.map(t=>{` |
| `industryBenchmarks` | `INDUSTRIES.map(ind=>{` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ACTION_TYPES`, `CERT_TYPES`, `COUNTRIES`, `DIMS`, `DIM_KEYS`, `DIM_WEIGHTS`, `INDUSTRIES`, `OWNERS`, `QUARTERS`, `REPORTS`, `RISK_CATEGORIES`, `STAGES`, `STAGE_COLORS`, `STATUSES`, `TABS`, `TIERS`, `TIER_PIE_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Engaged Suppliers | — | Programme Database | Number of suppliers enrolled in active ESG improvement programmes with defined targets. |
| Avg Score Improvement | — | ESG Assessments | Mean ESG score increase across all engaged suppliers over 12-month programme cycle. |
| Programme Coverage | — | Spend Analysis | Proportion of total procurement spend covered by active engagement programmes. |
- **Supplier ESG Scores, Spend Data, Programme Activity Logs** → Improvement tracking + spend-weighting engine → **Programme dashboards, CSRD supply chain disclosures, CDP submission data**

## 5 · Intermediate Transformation Logic
**Methodology:** Supplier ESG Improvement Index
**Headline formula:** `SEII = Σ (ScoreΔ × Spend Weight) / Σ Spend Weight`

Spend-weighted average ESG score change across the active supplier engagement programme.

**Standards:** ['CDP Supply Chain Programme', 'Science Based Targets for Nature']
**Reference documents:** CDP Supply Chain Programme Annual Report; SBTN Science Based Targets for Nature; OECD Due Diligence Guidance for Responsible Business Conduct; GRI 308/414 Supplier Assessments

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's headline metric is
> `SEII = Σ(ScoreΔ × Spend Weight) / Σ Spend Weight` — a spend-weighted average ESG score
> *improvement*. **No such index is computed anywhere in the code.** The per-supplier
> `improvementRate` field (shown as the "Avg Score Improvement" style metric) is an **independent
> random draw** (`Math.round(-5+s(88)*25)`), not derived from each supplier's own `history` quarterly
> trend — despite the fact that a genuine 12-quarter score history already exists per supplier and
> could trivially compute a real Δscore. Separately, the code computes both an **unweighted**
> `composite` (simple mean of 6 dimensions) and a **weighted** `weighted` score (using real
> `DIM_WEIGHTS`), but supplier **tier assignment uses only the unweighted `composite`** — the
> weighted score is computed but never used for classification.

### 7.1 What the module computes

150 synthetic suppliers, each with 6 independently `sr()`-seeded ESG dimension scores
(Environmental, Social, Governance, Climate, Human Rights, Transparency):

```
scores[d]  = round(30 + s(d×7+3)×65)                              // 30–95, one per dimension
composite  = round(mean(scores))                                    // simple average — DRIVES TIER
weighted   = round(Σ scores[d]×DIM_WEIGHTS[d])                       // real weights [0.20,0.15,0.15,0.20,0.15,0.15] — COMPUTED BUT UNUSED FOR TIER
tier       = composite≥85 Platinum | ≥70 Gold | ≥55 Silver | ≥40 Bronze | else Red
history[12 quarters] = clamp(15,98, composite−10 + s(q×13+50)×20)   // quarterly path around composite
improvementRate = round(−5 + s(88)×25)                              // INDEPENDENT of `history`, not a real Δ
```

40 synthetic engagement records (`engagements`) each linked to a random supplier, with a 6-stage
pipeline (`Assessment→Questionnaire Sent→Response Received→Gap Analysis→Corrective Action→Verified`)
and synthetic activity logs. 40 synthetic corrective-action records (`actions`) with milestones,
severity (Critical/High/Medium/Low via `sr()` thresholds), and progress updates.

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| ESG dimension scores | 30–95 | Synthetic |
| `DIM_WEIGHTS` (Env 0.20, Soc 0.15, Gov 0.15, Climate 0.20, HR 0.15, Transparency 0.15) | Sum to 1.00 | Real, sensible weighting scheme (Environmental and Climate weighted highest) — but structurally disconnected from `tier` |
| `TIER_THRESHOLDS` (Platinum≥85, Gold≥70, Silver≥55, Bronze≥40, Red<40) | — | Reasonable 5-tier scheme, mirrors real supplier-rating platforms (e.g. EcoVadis medal tiers) conceptually |
| `improvementRate` | −5 to +20 pts | Synthetic, independent of `history` |

### 7.3 Calculation walkthrough

1. **Supplier generation** — 150 suppliers with dimension scores, composite, weighted score, tier,
   12-quarter history, certifications (`CERT_TYPES` filtered via `sr()>0.55`), flagged risk categories
   (`RISK_CATEGORIES` filtered via `sr()>0.65`).
2. **Filtering/sorting** — by industry, tier, country, spend, risk.
3. **Portfolio KPIs** — `filteredAvg = round(mean(composite))` over filtered suppliers (again the
   unweighted composite, not spend-weighted as the guide's SEII would require);
   `filteredTotalSpend = Σ spend`.
4. **Engagement funnel** — `stageCounts` (count of engagements per of the 6 stages),
   `avgTimeByStage` (mean `daysInStage` per stage), `completionRate = count(stageIdx≥5)/total×100`.
5. **Corrective action tracking** — `avgEffectiveness`, `effectivenessByType` (grouped by
   `ACTION_TYPES`), `industryBenchmarks` (per-industry aggregate).
6. **Peer comparison** — for a selected supplier, `peers = suppliers.filter(sameIndustry).sort(by
   composite).slice(0,10)`.

### 7.4 Worked example — Supplier-001 (index 0)

```
s(n) = sr(0×100+n) = sr(n)
scores[0..5] = round(30+sr(3+d×7)×65) for d=0..5
composite = round(mean(scores))
weighted  = round(Σ scores[d]×DIM_WEIGHTS[d])
```

Because `DIM_WEIGHTS` gives Environmental and Climate a combined 40% (vs. their 33.3% share under
equal weighting) while Social/Governance/HR/Transparency are each slightly down-weighted (15% vs.
16.7%), `weighted` will differ from `composite` by up to a few points whenever a supplier's
Environmental/Climate scores diverge from its other four dimensions — but since `tier` reads only
`composite`, a supplier with strong E/Climate performance and weak S/G/HR/Transparency performance
gets **no tier credit** for the platform's own stated dimension-importance weighting.

### 7.5 Companion analytics

- **Engagement pipeline funnel** — genuinely computed stage counts and average days-in-stage from
  the 40 synthetic engagement records.
- **Certification/risk flags** — per-supplier boolean flags for 8 real certification schemes (ISO
  14001, ISO 45001, SA8000, FSC, GRI Verified, CDP A-List, B-Corp, Fair Trade) and 6 real risk
  categories — descriptive, independently drawn, not derived from the dimension scores.

### 7.6 Data provenance & limitations

- All supplier, engagement, and action data is synthetic (`sr()`-seeded); no CDP Supply Chain or
  EcoVadis-style real assessment data is ingested.
- **Two fixable inconsistencies found while grounding this section in code:** (1) `weighted` score
  is computed but never used — either wire `tier` off `weighted` or remove the unused field; (2)
  `improvementRate` should be computed as `history[11].value − history[0].value` (a real quarter-over-
  quarter delta already available) rather than an independent random draw, and the guide's SEII
  (spend-weighted average of that delta) is not computed at all despite being the module's headline
  formula.

**Framework alignment:** CDP Supply Chain Programme (named in guide, not ingested) · SBTN Science
Based Targets for Nature (named, not implemented) · OECD Due Diligence Guidance (conceptual only) ·
GRI 308/414 Supplier Assessments (real standard names referenced via `CERT_TYPES`, not scored against
actual GRI criteria).

## 9 · Future Evolution

### 9.1 Evolution A — Compute the real SEII from supplier history and fix the two wiring bugs (analytics ladder: rung 1 → 2)

**What.** The §7 flag documents that the guide's headline `SEII = Σ(ScoreΔ × Spend Weight) / Σ Spend Weight` (spend-weighted average ESG improvement) **is not computed** — the per-supplier `improvementRate` is an independent random draw (`round(−5 + sr(88)×25)`) despite a genuine 12-quarter score `history` existing per supplier from which a real Δscore could be trivially computed. Two more §7.6-flagged bugs: the module computes a real `DIM_WEIGHTS`-weighted score but assigns supplier tiers off the **unweighted** `composite` (the weighted score is dead), and the 150 suppliers are `sr()`-synthetic with no CDP/EcoVadis data. Evolution A fixes the arithmetic and grounds the data.

**How.** (1) Compute `improvementRate` as the real quarter-over-quarter delta (`history[11].value − history[0].value`) already available per supplier, then implement the spend-weighted SEII the guide promises. (2) Fix the tier assignment: either drive `tier` off the weighted score (using the real `DIM_WEIGHTS`) or remove the unused weighted field — one source of truth. (3) Ingest real supplier assessment data (CDP Supply Chain Programme responses, EcoVadis scores) to replace the synthetic 150, feeding real dimension scores and histories. (4) Wire the engagement-pipeline and corrective-action records to real programme data rather than random supplier linkage.

**Prerequisites.** CDP/EcoVadis data access for real assessments; the delta and SEII computations are trivial with the existing history structure. **Acceptance:** `improvementRate` equals the supplier's actual first-to-last quarter delta; SEII is the spend-weighted average of those deltas; tier assignment uses a single (weighted or unweighted) score consistently.

### 9.2 Evolution B — Supplier-programme management copilot (LLM tier 1)

**What.** A copilot for the buyer's sustainable-procurement team: "which suppliers should I prioritise by spend, risk, and ESG gap?", "what's our aggregate supply-chain ESG improvement for CDP/CSRD reporting?", "draft the corrective-action plan for this underperforming supplier" — answered from the (Evolution-A) real SEII, supplier scores, and engagement-pipeline data, grounded in the OECD DDG and GRI 308/414 frameworks the module references.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/supplier-engagement/ask`, corpus = this Atlas record (the SEII formula, the 6 ESG dimensions and weights, CDP/SBTN/OECD/GRI framework notes) plus live supplier data. Prioritisation narrates the deterministic spend × risk × gap ranking; the CDP/CSRD aggregate reports the computed SEII; corrective-action drafts follow the 6-stage pipeline the module already models. The copilot cites the specific ESG dimension driving each supplier's gap.

**Prerequisites.** Evolution A's real SEII and single-source tier so prioritisation and reporting rest on computed improvement rather than a random draw and a dead weighted score. **Acceptance:** every SEII/score figure traces to computed supplier data; the prioritisation ranking reflects the real spend/risk/gap inputs; a supplier outside the programme returns a refusal.