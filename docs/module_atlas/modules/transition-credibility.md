# Transition Credibility
**Module ID:** `transition-credibility` · **Route:** `/transition-credibility` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Corporate climate transition plan credibility assessment platform evaluating plans against GFANZ, IPCC and regulatory criteria for ambition, specificity, governance, financing and accountability.

> **Business value:** A 2023 GFANZ analysis found only 10% of Fortune 500 transition plans meet minimum credibility criteria; most lack interim targets, explicit financing plans or governance accountability mechanisms.

**How an analyst works this module:**
- Collect transition plan disclosures and supporting data
- Score plan on GFANZ credibility criteria: ambition, targets, governance, financing, implementation
- Cross-check stated targets against actual capital allocation
- Compare plans to IPCC 1.5°C mitigation pathways
- Generate credibility scorecard and red-flag report

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANIES`, `COMPANY_NAMES`, `COUNTRIES`, `CapExTab`, `Card`, `KPI_DESCS`, `KPI_KEYS`, `KPI_NAMES`, `LobbyingTab`, `MiniBar`, `Pill`, `PortfolioTab`, `SECTORS`, `ScorecardTab`, `SectionTitle`, `Stat`, `TABS`, `TIERS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `genCompanies` | `()=>COMPANY_NAMES.map((name,i)=>{` |
| `sector` | `SECTORS[Math.floor(sr(i*7)*SECTORS.length)];` |
| `country` | `COUNTRIES[Math.floor(sr(i*11)*COUNTRIES.length)];` |
| `composite` | `Math.round(sum/12);` |
| `greenCapex` | `Math.round(sr(i*19)*40+10);` |
| `transCapex` | `Math.round(sr(i*23)*25+5);` |
| `brownCapex` | `Math.max(0,100-greenCapex-transCapex);` |
| `lobbyScore` | `Math.round(sr(i*31)*80+10);` |
| `commitScore` | `Math.round(sr(i*37)*80+10);` |
| `lobbySpend` | `Math.round(sr(i*41)*18+2)*100;` |
| `greenInvest` | `Math.round(sr(i*43)*400+50);` |
| `weight` | `parseFloat((sr(i*53)*3+0.2).toFixed(2));` |
| `tradeAssocs` | `Math.floor(sr(i*61)*4)+1;` |
| `revenue` | `Math.round(sr(i*67)*45+5)*100;` |
| `employees` | `Math.round(sr(i*71)*95+5)*1000;` |
| `netZeroYear` | `netZeroClaim?2040+Math.floor(sr(i*89)*11):null;` |
| `sbtiStatus` | `['Committed','Target Set','None'][Math.floor(sr(i*91)*3)];` |
| `paged` | `filtered.slice(page*PER,(page+1)*PER);` |
| `pages` | `Math.ceil(filtered.length/PER);` |
| `radarData` | `selected?KPI_KEYS.map((k,i)=>{` |
| `avg` | `Math.round(sectorPeers.reduce((s,c)=>s+c[k],0)/Math.max(1,sectorPeers.length));` |
| `best` | `Math.max(...sectorPeers.map(c=>c[k]));` |
| `avgScore` | `Math.round(COMPANIES.reduce((a,c)=>a+c.composite,0)/COMPANIES.length);` |
| `medianScore` | `(()=>{const sorted=[...COMPANIES].sort((a,b)=>a.composite-b.composite);return sorted[49].composite;})();` |
| `diff` | `c.composite-selected.composite;` |
| `kpiAvgs` | `KPI_KEYS.map(k=>Math.round(sc.reduce((a,c)=>a+c[k],0)/sc.length));` |
| `overall` | `Math.round(kpiAvgs.reduce((a,v)=>a+v,0)/kpiAvgs.length);` |
| `sectorBenchmarks` | `useMemo(()=>SECTORS.map(s=>{` |
| `misaligned` | `useMemo(()=>COMPANIES.filter(c=>c.netZeroClaim&&c.brownCapex>30).sort((a,b)=>b.brownCapex-a.brownCapex),[]);` |
| `alignmentTrend` | `useMemo(()=>Array.from({length:5},(_,y)=>{ const yr=2021+y;` |
| `avgG` | `Math.round(COMPANIES.reduce((a,c)=>a+(c.capexTrend[y]?.green\|\|0),0)/100);` |
| `avgT` | `Math.round(COMPANIES.reduce((a,c)=>a+(c.capexTrend[y]?.trans\|\|0),0)/100);` |
| `avgB` | `Math.round(COMPANIES.reduce((a,c)=>a+(c.capexTrend[y]?.brown\|\|0),0)/100);` |
| `avgComp` | `cos.length?Math.round(cos.reduce((a,c)=>a+c.composite,0)/cos.length):0;` |
| `scatterData` | `useMemo(()=>COMPANIES.map(c=>({` |
| `sayDoFlags` | `useMemo(()=>scatterData.filter(c=>c.commitScore>60&&c.lobbyScore<35).sort((a,b)=>b.sayDoGap-a.sayDoGap),[scatterData]);  const TRADE_ASSOCS=[ 'Global Industry Alliance','Fossil Fuel Producers Forum','Clean Energy Council', 'Carbon Markets Association','Mining & Resources Group','Chemical Manufacturers Assoc', 'Petroleum Institute','Renewa` |
| `tradeData` | `useMemo(()=>TRADE_ASSOCS.map((ta,i)=>{` |
| `memberCount` | `Math.floor(sr(i*97)*30)+5;` |
| `avgLobby` | `Math.round(sr(i*101)*50+25);` |
| `climateAlignment` | `Math.round(sr(i*103)*80+10);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANY_NAMES`, `COUNTRIES`, `KPI_DESCS`, `KPI_KEYS`, `KPI_NAMES`, `PIE_COLORS`, `SECTORS`, `TABS`, `TIERS`, `TRADE_ASSOCS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Avg Credibility Score | — | Credibility Engine | Mean transition plan credibility score across assessed companies; 70+ considered credible by GFANZ standards. |
| Net Zero Commitment Rate | — | Corporate Disclosures | Proportion of assessed companies with net zero commitments backed by interim science-based targets. |
| Capital Alignment Rate | — | Credibility Engine | Companies whose stated net zero commitments are reflected in capex and R&D allocation patterns. |
- **Corporate Transition Plans, ESG Disclosures, Capex Data, SBTi Registry** → Credibility scoring engine + capital alignment analysis → **Credibility scorecards, red-flag reports, ISSB S2 transition plan disclosures**

## 5 · Intermediate Transformation Logic
**Methodology:** Transition Credibility Score
**Headline formula:** `TCS = Σ (Criterion Score × Weight) / Σ Weight`

Weighted average of credibility criteria scores covering ambition, interim targets, policy coherence, governance and capital allocation alignment.

**Standards:** ['GFANZ Transition Finance Frameworks 2023', 'IPCC AR6 Mitigation Pathways']
**Reference documents:** GFANZ Transition Finance Frameworks 2023; IPCC AR6 Working Group III 2022; ISSB IFRS S2 Transition Plan Requirements; TCFD Guidance on Transition Plans 2021

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

100 synthetic companies are scored on 12 transition-credibility KPIs (CapEx Green Ratio, Lobbying
Consistency, Exec Pay Linkage, Fossil Expansion, Carbon Lock-in, Scope 3 Coverage, Offset
Dependency, Short-term Targets, Governance Oversight, Just Transition, R&D Allocation, Disclosure
Quality), all generated once at module load by the seeded PRNG `sr(s)=frac(sin(s+1)×10⁴)`. The
guide describes a weighted composite (`TCS = Σ(Criterion × Weight) / ΣWeight`); the code implements
the **equal-weight special case** of that formula:

```
composite = round( Σ(12 KPI scores) / 12 )        // unweighted mean — all weights = 1
tier = composite≥72 'Credible' | ≥55 'Moderate' | ≥38 'Questionable' | else 'Incredible'
```

### 7.2 Parameterisation

| Element | Formula | Range | Provenance |
|---|---|---|---|
| KPI score (each of 12) | `round(sr(i×13+ki×17)×60+20+sr(i+ki)×20)`, clamped 0–100 | ~20–100 (two-PRNG blend) | Synthetic demo value |
| Composite tier thresholds | 72 / 55 / 38 | — | Platform-defined 4-tier scale (Credible / Moderate / Questionable / Incredible), no external standard cited |
| `greenCapex` / `transCapex` / `brownCapex` | `sr(i×19)×40+10`, `sr(i×23)×25+5`, `100−green−trans` | 10–50% / 5–30% / remainder | Synthetic 3-way capex split; brown is a plug so the three always sum to exactly 100% |
| `lobbyScore` / `commitScore` | `sr(i×31)×80+10`, `sr(i×37)×80+10` | 10–90 | Synthetic, independent of each other — this pairing feeds the "Say-Do Gap" flag (§7.5) |
| `netZeroClaim` | `sr(i×83) > 0.3` | ~70% true | Synthetic boolean |
| `sbtiStatus` | `['Committed','Target Set','None'][⌊sr(i×91)×3⌋]` | 3 categories | Real SBTi status taxonomy, randomly assigned |
| `capexTrend` (5-year, 2021–2025) | Green/trans/brown drift from the base split by further PRNG terms scaled by year index | — | Synthetic 5-year trajectory, not a real reported capex history |

### 7.3 Calculation walkthrough

1. **Composite & tier**: unweighted mean of the 12 KPI scores maps to one of 4 tiers via fixed
   cutoffs; this is the module's single "credibility score."
2. **CapEx alignment**: `greenCapex + transCapex + brownCapex = 100` by construction (brown is the
   residual), so the split is always internally consistent, but the specific 3-way ratio for any
   company is arbitrary rather than sourced from a capex disclosure.
3. **"Say-Do Gap" flag** (`sayDoFlags`): companies with `commitScore > 60` AND `lobbyScore < 35` are
   flagged — i.e. a company claiming strong climate commitment while showing weak lobbying alignment
   (a real, well-known transition-credibility red flag pattern used by InfluenceMap and similar
   trackers), computed here from two independently-seeded synthetic scores.
4. **Misaligned companies**: `netZeroClaim && brownCapex > 30` — flags net-zero claimants whose own
   generated capex split still shows >30% brown spend, again a real-world-relevant pattern applied
   to synthetic inputs.
5. **Sector/portfolio benchmarking**: `sectorBenchmarks` and `alignmentTrend` average composite,
   green/trans/brown capex by sector and by year across all 100 companies.
6. **Trade association scoring**: a separate 12-row static-ish table (`TRADE_ASSOCS`) scores
   member count, average lobby alignment, and climate alignment per association via further
   independent PRNG draws — not linked back to which companies belong to which association.

### 7.4 Worked example (Company #1, `i=0`, "Meridian Energy")

| Step | Computation | Result |
|---|---|---|
| Sector | `⌊sr(0)×10⌋=7` | **Consumer** |
| Country | `⌊sr(11)×15⌋=10` | **Norway** |
| 12 KPI scores | `sr(13+ki×17)×60+20+sr(ki)×20` per KPI, clamped | 77, 47, 34, 56, 44, 62, 90, 38, 75, 84, 76, 71 |
| Composite | `round(Σ/12)` | **63** |
| Tier | `55 ≤ 63 < 72` | **Moderate** |
| Green / Trans / Brown capex | `sr(19)×40+10`, `sr(23)×25+5`, residual | 38% / 23% / 39% |
| Lobby / Commit score | `sr(31)×80+10`, `sr(37)×80+10` | 67 / 67 (no Say-Do gap flag here since both are equal) |
| Net-zero claim | `sr(83)=0.71 > 0.3` | **True** |
| Misaligned flag | `netZeroClaim && brownCapex(39%) > 30%` | **Flagged** — claims net zero but 39% of capex is still brown |

### 7.5 Companion analytics

- **Portfolio credibility tab** — aggregates a hypothetical portfolio's `weight`-weighted composite
  score across whichever companies are selected, using the per-company `weight` field
  (`sr(i×53)×3+0.2`, a synthetic 0.2–3.2% position size).
- **Trade association table** — separate synthetic scoring of 12 industry associations
  (member count, average lobbying score, climate alignment), used to contextualise the Lobbying &
  Advocacy tab independent of the company-level Say-Do Gap analysis.
- **Radar comparison** — selected company's 12 KPI scores plotted against sector peer average and
  sector best, useful for relative positioning even though all three series are synthetic.

### 7.6 Data provenance & limitations

- **100% synthetic demo data.** All 100 companies (fictional names), sectors, countries, KPI
  scores, capex splits, lobbying scores, and net-zero claims are generated by
  `sr(s)=frac(sin(s+1)×10⁴)` — no real corporate disclosures, CDP submissions, or InfluenceMap
  scores are ingested.
- The composite score is an **unweighted** mean of 12 KPIs, whereas the guide's formula implies a
  genuinely weighted aggregation (some criteria — e.g. Fossil Expansion, Carbon Lock-in — would
  typically carry more weight in a real GFANZ-aligned assessment than, say, R&D Allocation). No
  weight vector is exposed in the code or UI.
- The Say-Do Gap and net-zero/brown-capex misalignment flags implement genuinely useful,
  real-world-relevant screening logic, but because both sides of each flag are independently random
  draws, the flagged companies in this demo do not represent any actual detected greenwashing
  pattern — they are illustrative of the *type* of red flag a production version would surface.
- No confidence bands, data-quality scores, or source citations accompany any individual KPI value.

### 7.7 Framework alignment

- **GFANZ Transition Finance Frameworks (2023)**: the credibility-tier structure (Credible/
  Moderate/Questionable/Incredible) and the multi-dimension KPI set (ambition, governance,
  financing alignment) mirror GFANZ's credibility criteria conceptually, though GFANZ does not
  itself prescribe these exact 12 KPIs or these exact score cutoffs.
- **IPCC AR6 WGIII mitigation pathways**: referenced in the guide as a comparison benchmark for
  capex trajectories; not implemented — the module's capex splits are not checked against any
  sector decarbonisation pathway.
- **ISSB IFRS S2 transition-plan disclosure requirements** and **TCFD transition-plan guidance**:
  the `tcfdAligned` boolean flag references TCFD alignment status but is itself a synthetic draw,
  not a real disclosure-completeness assessment.
- **"Say-do gap" methodology** (as used by InfluenceMap's Climate Lobbying tracker): the module's
  commitment-vs-lobbying screening logic is directionally faithful to this real, established
  practice of cross-checking public commitments against political-influence activity.

## 9 · Future Evolution

### 9.1 Evolution A — Weighted GFANZ scoring on real disclosures, IPCC-pathway capex checks (analytics ladder: rung 1 → 3)

**What.** The module scores 100 companies on 12 credibility KPIs but §7.6 documents it is 100% synthetic (fictional names, `sr()`-seeded KPIs, capex splits, lobbying scores) and implements the **equal-weight** special case of the guide's `TCS = Σ(Criterion × Weight)/ΣWeight` — no weight vector exists, though real GFANZ assessment weights Fossil Expansion and Carbon Lock-in above R&D Allocation. Its genuine strength is the screening *logic*: the Say-Do Gap flag (`commitScore>60 AND lobbyScore<35`, InfluenceMap-style) and net-zero-vs-brown-capex misalignment (`netZeroClaim AND brownCapex>30`) are real red-flag patterns (§7.3) — just applied to independently-random inputs so the flagged companies mean nothing today.

**How.** (1) Introduce the weight vector the guide implies, GFANZ-informed and disclosed, converting the mean into a genuine weighted composite. (2) Replace synthetic inputs with real disclosures: CDP transition-plan data, InfluenceMap climate-lobbying scores (the Say-Do methodology's actual source), SBTi registry status, and reported green/transition/brown capex splits — the module already names real companies elsewhere in the platform (`COMPANY_NAMES` here is fictional; wire to `GLOBAL_COMPANY_MASTER`). (3) Make the capex-alignment check real: compare each company's capex trajectory against its sector's IPCC AR6 / IEA NZE pathway (the guide cites IPCC AR6 but §7.7 confirms it's unimplemented). (4) Attach data-quality flags and source citations per KPI (§7.6 notes none exist).

**Prerequisites (hard).** All `sr()`-seeded KPI/capex/lobbying fields deleted — this is a fabrication-heavy module the guardrail polices; real InfluenceMap/CDP feeds are the build (verify access terms). **Acceptance:** flagged Say-Do-Gap companies correspond to real commitment-vs-lobbying divergence; the composite responds to disclosed capex; weights are visible and adjustable.

### 9.2 Evolution B — Transition-plan red-flag copilot for stewardship teams (LLM tier 1)

**What.** A copilot that produces the module's stated deliverable — a "credibility scorecard and red-flag report" (§1) — for a company: narrating its weighted KPI profile, the specific red flags it trips (Say-Do Gap, brown-capex misalignment, offset dependency), and how it compares to sector peers, in GFANZ/ISSB S2 register.

**How.** Tier 1, grounded in this Atlas record (the 12 KPI definitions, the tier thresholds, the flag logic in §7.3) plus live page state. The copilot's value is explaining *why* a flag fired — "flagged because it claims net-zero by 2045 yet 39% of capex remains brown" — which is transparent arithmetic over the company's fields, reproducible and citable. The Say-Do Gap explanation references the real InfluenceMap methodology the module mirrors (§7.7). Hard guardrail: pre-Evolution-A the entire dataset is synthetic with fictional company names, so the copilot must not present any company-specific flag as a real finding — it demonstrates the flag *type*, per §7.6. Post-Evolution-A, with real InfluenceMap/CDP inputs, the flags become genuine and the copilot's red-flag reports become actionable stewardship material.

**Prerequisites.** For real reports, Evolution A's data wiring; the tier-1 explanation-of-logic slice ships now with the synthetic-data caveat enforced. **Acceptance:** every flag explanation reproduces from the stated threshold and company fields; the InfluenceMap/GFANZ framing is cited; pre-Evolution-A output is labelled illustrative-of-pattern, never a real greenwashing finding about a named company.