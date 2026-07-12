# Article 6 Markets
**Module ID:** `article6-markets` · **Route:** `/article6-markets` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Paris Agreement Article 6.2 bilateral trading and Article 6.4 supervisory mechanism analytics, covering ITMO issuance, corresponding adjustment accounting, host country authorisation tracking, and carbon market additionality assessment. Monitors NDC contribution accounting and safeguard compliance for traded mitigation outcomes.

> **Business value:** Article 6 markets represent the next frontier of carbon price discovery and cross-border climate finance, with billions of dollars of ITMOs expected to trade annually. Rigorous corresponding adjustment accounting is non-negotiable to prevent double-claiming between host and acquiring countries, and robust additionality verification protects carbon credit buyers from non-additional supply.

**How an analyst works this module:**
- ITMOs Registry shows all tracked bilateral agreements and unit balances
- Corresponding Adjustments tab verifies double-entry accounting per trade
- Host Country Authorisation tab tracks formal government approval status
- NDC Contribution tab shows net adjustment to host and acquiring country accounts
- Additionality Analysis tab reviews 6.4 project baseline and additionality documentation
- Safeguards Compliance tab checks environmental and social safeguard adherence

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `AGREEMENTS`, `BUYERS`, `COLORS`, `ITMOS`, `SECTORS`, `SELLERS`, `STATUSES`, `TABS`, `VCM_BY_TYPE`, `VCM_REGISTRY_SHARE`, `VCM_TOTAL`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `buyer` | `BUYERS[Math.floor(sr(i*7)*BUYERS.length)];const seller=SELLERS[i%SELLERS.length];const sector=SECTORS[Math.floor(sr(i*11)*SECTORS.length)];` |
| `vol` | `Math.round(sr(i*19)*50+2);const price=+(sr(i*23)*30+5).toFixed(1);const coSdg=Math.round(sr(i*31)*8+1);` |
| `vintage` | `2022+Math.floor(sr(i*37)*4);const ca=sr(i*41)>0.4;` |
| `quarterly` | `Array.from({length:8},(_,q)=>({q:`Q${(q%4)+1} ${2023+Math.floor(q/4)}`,issued:Math.round(vol/8+sr(i*100+q)*3),transferred:Math.round(vol/10+sr(i*100+q*3)*2),price:+(price+sr(i*100+q*7)*5-2.5).toFixed(1)}));` |
| `ITMOS` | `Array.from({length:60},(_,i)=>{const a=AGREEMENTS[i%30];return{id:i+1,serialNo:`ITMO-${2023+Math.floor(i/20)}-${String(i+1).padStart(4,'0')}`,buyer:a.buyer,seller:a.seller,agreementId:a.id,sector:a.sector,vintage:2022+Ma` |
| `filtered` | `useMemo(()=>{let d=[...AGREEMENTS];if(search)d=d.filter(r=>r.buyer.toLowerCase().includes(search.toLowerCase())\|\|r.seller.toLowerCase().includes(search.toLowerCase()));if(statusF!=='All')d=d.filter(r=>r.status===statusF);if(typeF!=='All')d=d.filter(r=>r.type===typeF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b` |
| `stats` | `useMemo(()=>({count:filtered.length,totalVol:filtered.reduce((s,r)=>s+r.volumeMt,0),totalVal:filtered.reduce((s,r)=>s+r.totalValueM,0).toFixed(0),avgPrice:(filtered.reduce((s,r)=>s+r.priceUSD,0)/filtered.length\|\|0).toFix` |
| `sectorVol` | `useMemo(()=>{const m={};AGREEMENTS.forEach(r=>{m[r.sector]=(m[r.sector]\|\|0)+r.volumeMt;});return Object.entries(m).map(([k,v])=>({sector:k,volume:v})).sort((a,b)=>b.volume-a.volume);},[]);` |
| `buyerRank` | `useMemo(()=>{const m={};AGREEMENTS.forEach(r=>{if(!m[r.buyer])m[r.buyer]={buyer:r.buyer,vol:0,val:0,n:0};m[r.buyer].vol+=r.volumeMt;m[r.buyer].val+=r.totalValueM;m[r.buyer].n++;});return Object.values(m).sort((a,b)=>b.vo` |
| `priceHistory` | `useMemo(()=>{const qs={};AGREEMENTS.forEach(a=>a.quarterly.forEach(q=>{if(!qs[q.q])qs[q.q]={q:q.q,prices:[],vol:0};qs[q.q].prices.push(q.price);qs[q.q].vol+=q.issued;}));return Object.values(qs).map(q=>({q:q.q,avgPrice:+(q.prices.reduce((s,p)=>s+p,0)/q.prices.length).toFixed(1),volume:q.vol}));},[]); const typeDist=useMemo(()=>[{name:'Art` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]).filter(k=>k!=='quarterly');const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const b=new Blob([csv],{t` |
| `methodDist` | `[];const md={};AGREEMENTS.forEach(a=>{md[a.methodology]=(md[a.methodology]\|\|0)+1;});Object.entries(md).forEach(([k,v])=>methodDist.push({name:k,value:v}));` |
| `verifierDist` | `[];const vd={};AGREEMENTS.forEach(a=>{vd[a.verifier]=(vd[a.verifier]\|\|0)+1;});Object.entries(vd).forEach(([k,v])=>verifierDist.push({name:k,value:v}));` |
| `qualityMetrics` | `AGREEMENTS.slice(0,15).map(a=>({name:a.buyer.slice(0,3)+'-'+a.seller.slice(0,3),integrity:a.envIntegrity,additionality:a.additionality,permanence:a.permanence,transparency:a.transparency}));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BUYERS`, `COLORS`, `SECTORS`, `SELLERS`, `STATUSES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ITMOs Tracked | — | UNFCCC Article 6 registry | International Transferable Mitigation Outcomes registered and authorised under bilateral agreements |
| Corresponding Adjustment Applied | — | Host country NDC registry | Whether host country has removed transferred units from its national inventory |
| Additionality Score | — | Article 6.4 SB assessment | Supervisory body additionality rating for 6.4 mechanism project |
- **UNFCCC Article 6 international registry** → Ingest ITMO issuance, transfer, and cancellation records; validate corresponding adjustments → **Reconciled ITMO balance sheet with double-claiming risk flags**
- **Host country NDC inventory submissions** → Verify corresponding adjustment entries match transferred volumes → **Corresponding adjustment compliance status per bilateral agreement**

## 5 · Intermediate Transformation Logic
**Methodology:** Corresponding adjustment double-entry model
**Headline formula:** `Net_NDC_contribution = ITMOs_issued – ITMOs_cancelled; Corresponding_adjustment = ITMOs_transferred × GHG_metric_tonne`

Each ITMO transfer requires the host country to apply a corresponding adjustment: removing transferred units from its NDC inventory and having the acquiring country add them. Double-entry accounting ensures no double-claiming. Article 6.4 Supervisory Body validates additionality and baselines before unit issuance.

**Standards:** ['Paris Agreement Article 6', 'UNFCCC CMA Decision 3/CMA.3', 'Verra VCS v4']
**Reference documents:** Paris Agreement Article 6 (2015); UNFCCC CMA Decision 3/CMA.3 Glasgow Rulebook; Verra VCS v4 Jurisdictional Nested REDD+; ICVCM Core Carbon Principles 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *corresponding-adjustment
> double-entry accounting model* (`Net_NDC_contribution = ITMOs_issued − ITMOs_cancelled`;
> `Corresponding_adjustment = ITMOs_transferred × GHG_metric_tonne`) reconciling host vs acquiring
> country NDC inventories, plus additionality scoring "from the Article 6.4 Supervisory Body". **None
> of that reconciliation logic exists in the code.** The page is a *browsing/visualisation* dashboard
> over 30 synthetic bilateral agreements and 60 synthetic ITMO records: it displays a `correspondingAdj`
> Yes/No flag and quality scores, but performs no double-entry accounting, no NDC balance computation,
> and no SB additionality assessment. The sections below document what the code renders.

### 7.1 What the module computes

`frontend/src/features/article6-markets/pages/Article6MarketsPage.jsx` builds two synthetic datasets and derives filter/sort/aggregation views across 4 tabs (Agreement Dashboard, ITMO Registry, Market Analytics, Methodology):

- `AGREEMENTS` — 30 bilateral Article 6 agreements, each PRNG-generated with buyer/seller/sector/type (6.2 vs 6.4), volume, price, corresponding-adjustment flag, methodology, verifier, four quality scores, and an 8-quarter issuance/price sub-series.
- `ITMOS` — 60 unit records linked to agreements (serial number, vintage, volume, lifecycle status Authorised/Transferred/Used/Cancelled).

Derived aggregations are all straightforward reductions:

```
stats.totalVal = Σ totalValueM ;  stats.avgPrice = (Σ priceUSD / count) || 0
sectorVol      = Σ volumeMt grouped by sector
buyerRank      = Σ volumeMt, Σ totalValueM, count grouped by buyer
priceHistory   = per-quarter avg(quarterly.price), Σ quarterly.issued
totalValueM    = volumeMt × priceUSD          (the one per-row product)
```

### 7.2 Parameterisation — PRNG-seeded fields

Every agreement field is a deterministic draw from `sr(seed) = frac(sin(seed+1)×10⁴)` with per-field seed offsets (row index i times a distinct prime):

| Field | Generator | Range |
|---|---|---|
| buyer | `BUYERS[floor(sr(i×7)×15)]` | 15 Annex-II-style buyer countries |
| seller | `SELLERS[i mod 30]` | 30 host countries |
| type | `sr(i×13) < 0.5 ? 6.2 : 6.4` | 50/50 |
| status | index `floor(sr(i×17)×6)` into `[Active,Active,Active,Pending,Completed,Suspended]` | 50% Active |
| volumeMt | `round(sr(i×19)×50 + 2)` | 2–52 Mt |
| priceUSD | `sr(i×23)×30 + 5` | $5–35/t |
| correspondingAdj | `sr(i×41) > 0.4` | ~60% Yes |
| envIntegrity | `round(sr(i×59)×40 + 60)` | 60–100 |
| additionality | `round(sr(i×61)×30 + 70)` | 70–100 |
| permanence | `round(sr(i×63)×35 + 65)` | 65–100 |
| transparency | `round(sr(i×67)×25 + 75)` | 75–100 |

`shareOfProceeds` is the one rule-based field: **5%** for Art 6.4, 0 for 6.2 — correctly reflecting the Article 6.4 mechanism's mandatory 5% share-of-proceeds levy for the Adaptation Fund. Methodologies drawn from `[CDM, VCS, Gold Standard, JCM, REDD+, CAR]`, verifiers from `[DNV, SGS, RINA, Bureau Veritas, TÜV SÜD]`.

**Real data wired (GAP-009):** `VCM_CREDIT_PRICES_2023` (from `sovereignMacroSeed`) supplies a genuine 2023 voluntary carbon market reference — total ~296 MtCO₂e / $1.9bn, by project type and registry — imported for context, though the primary tables remain synthetic.

### 7.3 Calculation walkthrough

Dashboard: `filtered` = spread-copy of AGREEMENTS → buyer/seller substring search → status filter → type filter → sort on the chosen column (spread-before-sort, no mutation) → 10-per-page slice. KPI strip sums over `filtered`. The detail panel renders a quality radar over {envIntegrity, additionality, permanence, transparency, sdgCount×10} and the row's 8-quarter issuance bars. ITMO tab maps lifecycle status onto the shared status-badge palette (Cancelled→Suspended red, Used→Completed navy). Methodology tab counts methodology/verifier distributions and plots the first 15 agreements' four quality scores.

### 7.4 Worked example — one agreement (i = 0)

`sr(1) = frac(sin(1)×10⁴) = frac(8414.71) = 0.7099`; the per-field seeds use i×prime so for i=0 all offsets collapse to `sr(0)=frac(sin(1)... )` — actually i=0 makes every seed 0, so buyer/sector/type all read `sr(0)`. Taking a non-degenerate row i=1: volumeMt = round(sr(19)×50+2), priceUSD = sr(23)×30+5, and `totalValueM = volumeMt × priceUSD`. If that row yields volume 28 Mt at $18.5/t, its Total Value = 28 × 18.5 = **$518.0M**; being Art 6.4 it carries `shareOfProceeds = 5%` and a corresponding-adjustment flag ~60% likely "Yes". The dashboard's Total Value KPI is simply the Σ of these per-row products across the filtered set.

### 7.5 Data provenance & limitations

- **All 30 agreements and 60 ITMOs are synthetic**, generated by the seeded PRNG `sr(seed)=frac(sin(seed+1)×10⁴)` — reproducible across renders but not real transactions; buyer/seller pairings are illustrative. The only externally-sourced data is the VCM_CREDIT_PRICES_2023 reference block.
- **No corresponding-adjustment accounting**: the guide's core double-entry / NDC-inventory reconciliation is absent; `correspondingAdj` is a display flag, not a reconciled ledger entry, and there is no host-vs-acquiring balance sheet.
- Quality scores (env integrity/additionality/permanence/transparency) are random draws in plausible bands, not ICVCM/CCP assessments; the "Additionality Score 0–100 from Art 6.4 SB" the guide cites is not computed.
- Degenerate seeding at i=0 (all field seeds become 0 → identical `sr(0)`) is a latent artefact; harmless visually but means row 1 is not independently randomised across fields.
- CSV export drops the nested `quarterly` field; sort comparator is on a spread copy (no module-const mutation).

### 7.6 Framework alignment

- **Paris Agreement Article 6.2 (cooperative approaches / ITMOs) & 6.4 (mechanism)** — the type split and the 5% share-of-proceeds levy for Art 6.4 are correctly modelled; ITMO lifecycle states (Authorised→Transferred→Used→Cancelled) match the UNFCCC registry vocabulary. What is *not* modelled is the corresponding adjustment itself — under the Glasgow Rulebook (Decision 3/CMA.3) each first transfer requires the host country to add the transferred tonnes to its emissions balance (a debit) and the acquiring country to subtract them, preventing double-claiming; here that appears only as a boolean.
- **ICVCM Core Carbon Principles** — the four quality dimensions gesture at CCP-style assessment (ICVCM's 10 CCPs are evaluated at program and methodology-category level, covering additionality, permanence, robust quantification, no double counting, and sustainable-development safeguards) but the scores are synthetic, not derived from any CCP rubric.
- **CDM / VCS / Gold Standard / JCM / REDD+ / CAR** — the methodology field references the actual crediting programs eligible for Article 6 correspondence; the module treats them as categorical labels for distribution charts, not as methodology-specific baseline logic.

## 9 · Future Evolution

### 9.1 Evolution A — Real corresponding-adjustment double-entry ledger (analytics ladder: rung 1 → 2)

**What.** The page is a tier-B browsing dashboard over 30 PRNG-generated agreements and 60 synthetic ITMOs, with a documented guide↔code mismatch: the promised double-entry corresponding-adjustment accounting (`Net_NDC_contribution = ITMOs_issued − ITMOs_cancelled`) does not exist — `correspondingAdj` is a random boolean, and quality scores are draws in plausible bands, not ICVCM assessments. Evolution A builds the module's first backend vertical: an actual CA ledger where each first transfer debits the host country's emissions balance and credits the acquirer's, per Decision 3/CMA.3.

**How.** (1) Tables `a6_agreements`, `a6_itmo_units`, `a6_ca_entries` — the CA entry is a paired debit/credit row; an unbalanced pair is a constraint violation, making double-claiming structurally impossible to record. (2) Seed from the public UNFCCC Article 6 database (Art 6.2 initial reports and authorisations are published) rather than regenerating synthetic rows; keep the already-real `VCM_CREDIT_PRICES_2023` block (GAP-009) as the price reference. (3) Endpoints: `GET /ndc-balance/{country}` (net adjustment from ledger), `GET /reconciliation` (transfers lacking matching CA entries → the double-claiming risk flag the guide promises). (4) Rung 2: what-if — "if all Pending authorisations complete, host NDC balances shift by X."

**Prerequisites.** Retire the seeded-PRNG generator including the degenerate i=0 seeding artefact (all field seeds collapse to `sr(0)`); Alembic migration; UNFCCC data is partial and lagged — the ledger must represent unauthorised/unreported trades as explicit unknowns. **Acceptance:** for any transfer, host debit + acquirer credit sum to zero; the reconciliation endpoint flags a deliberately-inserted unmatched transfer; NDC balance recomputes correctly after a cancellation.

### 9.2 Evolution B — ITMO integrity analyst over the ledger (LLM tier 2)

**What.** A tool-calling analyst for the Article 6 desk: "does the Ghana–Switzerland agreement have complete corresponding adjustments?" answered by calling `GET /reconciliation` and `GET /ndc-balance/{country}` and narrating actual ledger state; "explain why this 6.4 unit carries a 5% share of proceeds" answered from the module's one correctly-encoded rule (the Art 6.4 Adaptation Fund levy) with the CMA decision citation.

**How.** Tool schemas from the Evolution-A OpenAPI surface (read-only ledger queries — no confirmation gating; ledger writes stay out of LLM reach entirely, since a fabricated CA entry would be the exact double-claiming failure the module exists to prevent). Grounding corpus: this Atlas page's §7.6 rulebook summary (Glasgow Rulebook CA mechanics, ITMO lifecycle vocabulary Authorised→Transferred→Used→Cancelled) plus the module's methodology tab. The refusal path is critical pre-Evolution-A: the copilot must state that quality scores are synthetic and no CA accounting exists, so a tier-1 slice shipped today would be limited to explaining Article 6 mechanics, never asserting per-agreement compliance.

**Prerequisites (hard).** Evolution A's ledger — narrating the current PRNG agreement set as if they were real bilateral deals would be fabrication with a UI. **Acceptance:** every balance/volume the analyst quotes traces to a ledger endpoint response; asked about an agreement absent from the UNFCCC-sourced data, it reports no-record rather than inventing one.