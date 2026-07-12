# Aviation CORSIA
**Module ID:** `aviation-corsia` · **Route:** `/aviation-corsia` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ICAO CORSIA compliance analytics covering emission unit requirement calculation, eligible emission unit (EEU) procurement strategy, sector growth factor monitoring, and airline-level offsetting obligation tracking. Models Phase 1 (2024–2026), Phase 2 (2027–2035) obligations and supports SAF credit integration as a CORSIA compliance pathway.

> **Business value:** CORSIA is projected to generate demand for 1.5–1.8 billion tonnes of carbon offsets between 2024 and 2035, making it one of the largest compliance-driven carbon market mechanisms. Airlines with proactive SAF blending and EEU procurement strategies can reduce compliance costs materially versus spot-market procurement at the time of obligation.

**How an analyst works this module:**
- Airline Portfolio tab shows each carrier's annual emissions and baseline comparison
- Offset Obligation tab calculates EEU requirement under 3 growth scenarios
- SAF Integration tab models offset reduction from SAF blending credits
- EEU Procurement Strategy tab optimises unit mix by price and eligibility
- Phase Timeline shows Phase 1 vs Phase 2 obligation profile to 2035
- Compliance Export generates ICAO CORSIA MRV submission data

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AIRCRAFT_TYPES`, `AIRLINE_NAMES`, `AirlineDrawer`, `COMPLIANCE_STATUSES`, `CORSIA_PHASES`, `CorsiaComplianceTab`, `CustomTooltip`, `FleetEmissionsTab`, `IATA_CODES`, `InvestmentRiskTab`, `REGIONS`, `REGION_COLORS`, `SAF_MANDATE_TRAJECTORY`, `SafFuelsTab`, `TABS`, `TOP_AIRPORTS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SAF_MANDATE_TRAJECTORY` | 8 | `year`, `mandate`, `actual` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['Europe','N.America','Asia-Pacific','Middle East','LATAM','Africa'];` |
| `REGION_COLORS` | `{'Europe':T.navy,'N.America':T.navyL,'Asia-Pacific':T.sage,'Middle East':T.gold,'LATAM':'#8b5cf6','Africa':'#e17055'};` |
| `AIRCRAFT_TYPES` | `['Narrow-body','Wide-body','Regional Jet','Turboprop','Freighter','Bizjet','Next-gen','Electric'];` |
| `CORSIA_PHASES` | `['Pilot (2024-26)','Phase 1 (2027-35)','Mandatory'];` |
| `COMPLIANCE_STATUSES` | `['Compliant','Partial','Non-compliant','Exempt'];` |
| `b2019` | `annualCO2 * baseline2019_factor;` |
| `b2020` | `annualCO2 * baseline2020_factor; // 2020 was ~60% of 2019 due to COVID` |
| `baseline` | `(b2019 + b2020) / 2;` |
| `regionIdx` | `Math.floor(sr(i*13+1)*6);` |
| `fleetSize` | `Math.floor(40+sr(i*11+2)*460);` |
| `annualCO2` | `parseFloat((fleetSize*0.018+sr(i*19+5)*8).toFixed(2));` |
| `b2020_factor` | `0.4 + sr(i*89+4)*0.25;` |
| `offsetReq` | `corsiaOffset; // replaces random offsetReq` |
| `safPct` | `parseFloat((sr(i*37+9)*12).toFixed(1));` |
| `fleetAge` | `parseFloat((5+sr(i*41+6)*20).toFixed(1));` |
| `emissionsIntensity` | `parseFloat((55+sr(i*43+8)*65).toFixed(1));` |
| `riskScore` | `parseFloat((20+sr(i*67+3)*75).toFixed(0));` |
| `techs` | `['HEFA','Fischer-Tropsch','Alcohol-to-Jet','e-Kerosene','Power-to-Liquid'];` |
| `names` | `['Neste','World Energy','SkyNRG','Gevo','LanzaJet','TotalEnergies','bp SAF','Shell SAF','Velocys','Fulcrum','RedRock Bio','SunFire','Norsk e-Fuel','Infinium','HIF Global'];` |
| `airline` | `AIRLINE_NAMES[Math.floor(sr(i*41+1)*60)];` |
| `spread` | `parseFloat((80+sr(i*43+3)*420).toFixed(0));` |
| `climAdj` | `parseFloat((spread*(1+sr(i*47+5)*0.35)).toFixed(0));` |
| `badge` | `(color)=>({display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:600,background:color+'18',color,fontFamily:T.font});` |
| `compColor` | `(c)=>c==='Compliant'?T.green:c==='Partial'?T.amber:c==='Non-compliant'?T.red:T.textMut;` |
| `paged` | `filtered.slice(page*PER,(page+1)*PER);` |
| `totalPages` | `Math.ceil(filtered.length/PER);` |
| `totalCO2` | `airlines.reduce((s,a)=>s+a.annualCO2,0);` |
| `totalOffset` | `airlines.reduce((s,a)=>s+a.offsetReq,0);` |
| `avgSaf` | `(airlines.reduce((s,a)=>s+a.safPct,0)/airlines.length);` |
| `phaseDist` | `CORSIA_PHASES.map(p=>({name:p,value:airlines.filter(a=>a.phase===p).length}));` |
| `score` | `((comp+partial*0.5)/total*100);` |
| `benchData` | `AIRCRAFT_TYPES.map((t,i)=>{` |
| `base` | `t==='Electric'?8:t==='Next-gen'?42:t==='Turboprop'?65:t==='Narrow-body'?72:t==='Regional Jet'?85:t==='Wide-body'?90:t==='Freighter'?120:95;` |
| `scatterData` | `airlines.map(a=>({name:a.name,iata:a.iata,x:a.fleetAge,y:a.emissionsIntensity,co2:a.annualCO2,region:a.region}));` |
| `year` | `2025+i*5;` |
| `replaced` | `Math.min(100,(replacePct/100)*((i+1)/6)*100);` |
| `reduction` | `replaced*0.01*(replaceType==='Next-gen'?0.35:replaceType==='Electric'?0.85:0.15);` |
| `avg` | `ra.reduce((s,a)=>s+a.fleetAge,0)/(ra.length\|\|1);` |
| `newest` | `ra.length?Math.min(...ra.map(a=>a.fleetAge)):0;` |
| `oldest` | `ra.length?Math.max(...ra.map(a=>a.fleetAge)):0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AIRCRAFT_TYPES`, `AIRLINE_NAMES`, `COMPLIANCE_STATUSES`, `CORSIA_PHASES`, `FLEET_COLORS`, `IATA_CODES`, `PHASE_COLORS`, `REGIONS`, `SAF_MANDATE_TRAJECTORY`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CORSIA Baseline | — | ICAO CORSIA MRV | Industry emission baseline against which growth above which must be offset |
| Sector Growth Factor | `Sector_yr / Sector_baseline` | ICAO annual reporting | Fraction of total sector emission growth requiring offsetting; <1 in 2020/2021 |
| EEU Price | — | Voluntary carbon market | Price of CORSIA-eligible emission units from approved VCS/Gold Standard/REDD+ programmes |
- **ICAO CORSIA MRV system (airline emission reports)** → Calculate sector growth factor and per-airline offsetting obligation → **EEU requirement schedule per airline and phase**
- **Voluntary carbon market EEU price feeds** → Optimise EEU procurement mix for cost minimisation subject to CORSIA eligibility → **Procurement strategy and total compliance cost estimate**

## 5 · Intermediate Transformation Logic
**Methodology:** CORSIA offsetting obligation model
**Headline formula:** `Offset_req = (Airline_emissions_yr – Airline_emissions_baseline) × Sector_growth_factor; Baseline = avg(2019,2020) emissions`

CORSIA baseline is the average of 2019 and 2020 industry emissions. Airlines offset the fraction of growth above baseline equal to their share of sector growth. Sector growth factor (SGF) is computed annually from total sector emissions vs baseline. SAF blending reduces offset requirement proportionally via CORSIA SAF Life Cycle Assessment credits.

**Standards:** ['ICAO CORSIA Standards & Recommended Practices', 'ICAO Doc 9501 Vol IV', 'IATA SAF Registry']
**Reference documents:** ICAO CORSIA Standards and Recommended Practices (SARPs); ICAO Doc 9501 Environmental Protection Vol IV; IATA SAF Registry and Tracking System; CORSIA Eligible Emissions Units list (ICAO 2024)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes the *real* CORSIA mechanism —
> a **sector growth factor** (`Offset_req = (E_yr − E_baseline) × SGF`), EEU procurement
> optimisation, and ICAO MRV export. The code implements a **per-airline route-based approximation
> instead**: each airline's own baseline = average of its 2019 and 2020 emissions, and its offset
> requirement = its own growth above that baseline × a flat ratio (no sector-wide SGF, no EEU
> price optimisation, no MRV export). Phase labels also disagree with ICAO's actual timeline: the
> code's phases are `'Pilot (2024-26)', 'Phase 1 (2027-35)', 'Mandatory'`, whereas ICAO's pilot
> phase was 2021–2023, first phase 2024–2026, second (mandatory) phase 2027–2035. Finally, the
> authoritative `CORSIA_BASELINES` reference dataset (ICAO sector emissions 2010–2024, 589 MtCO₂
> 2019 baseline) is **imported but never used**.

### 7.1 What the module computes

For 120 synthetic airlines (real names/IATA codes, seeded data), the page computes CORSIA
baselines and offsetting obligations, fleet-emission analytics, an SAF supplier landscape, and an
aviation credit-risk table. Core formula (`calcCORSIA_offset`, with its own inline citation
"ICAO Doc 9501 Vol.IV"):

```js
b2019     = annualCO2 × baseline2019_factor            // factor 1.0 → 2019 = current emissions
b2020     = annualCO2 × baseline2020_factor            // 0.4–0.65: "2020 was ~60% of 2019 (COVID)"
baseline  = (b2019 + b2020) / 2
offsetting = max(0, (annualCO2 − baseline) × offset_ratio)   // ratio 1.0 Pilot, 0.85 otherwise
```

Because `baseline2019_factor = 1.0`, the baseline is always
`annualCO2 × (1 + b2020_factor)/2 < annualCO2`, so **every airline always has a positive
offsetting obligation** — a structural artefact of anchoring 2019 emissions to *current*
emissions.

### 7.2 Parameterisation

| Parameter | Value | Provenance |
|---|---|---|
| Baseline definition | mean(2019, 2020) | ICAO CORSIA 2024 update (inline comment); note ICAO later re-based to 85% of 2019 — code keeps the original 2019/2020 average |
| 2020 COVID factor | 0.4 + sr(i·89+4)×0.25 → 0.40–0.65 | synthetic; comment "~60% of 2019" (ICAO actual: 237/589 ≈ 0.40) |
| offset_ratio | 1.0 (Pilot) / 0.85 (Phase 1, Mandatory) | code constants; real CORSIA uses an annually published sector growth factor, not 0.85 |
| Fleet size | 40–500 aircraft | synthetic |
| annualCO2 (MtCO₂) | fleetSize × 0.018 + sr(·)×8 | synthetic scaling (≈18 kt/aircraft base) |
| SAF share | 0–12% | synthetic (sector actual ~0.2–0.5% in 2024) |
| Emissions intensity | 55–120 gCO₂/RPK-scale | synthetic; benchmark bases per aircraft type hard-coded (Electric 8, Next-gen 42, Turboprop 65, Narrow-body 72, Regional 85, Wide-body 90, Freighter 120) |
| SAF mandate trajectory | 2% (2025) → 6% (2030) → 20% (2035) → 70% (2050) | matches EU ReFuelEU Aviation mandate schedule |
| Phase assignment | s<0.3 Pilot / s<0.75 Phase 1 / else Mandatory | seeded split 30/45/25% |
| Compliance status | 55% Compliant / 25% Partial / 15% Non-compliant / 5% Exempt | seeded split |

### 7.3 Calculation walkthrough

1. **CORSIA Compliance tab** — KPIs `totalCO2 = Σ annualCO2`, `totalOffset = Σ offsetReq`,
   `avgSaf = Σ safPct / 120`, phase distribution pie, compliance score
   `(compliant + 0.5×partial)/total × 100`, and a paginated airline table with region/phase
   filters.
2. **Fleet Emissions Analyzer** — fleet-mix allocation (each aircraft type takes
   `floor(remaining × sr(·) × 0.45)`, last type gets the remainder), fleet age vs emissions
   intensity scatter, and a **fleet-replacement what-if**: over 2025–2050 in 5-year steps,
   `replaced = min(100, (replacePct/100)×((i+1)/6)×100)` and
   `reduction = replaced × 0.01 × (Next-gen 0.35 | Electric 0.85 | else 0.15)` — i.e. next-gen
   aircraft cut 35% and electric 85% of replaced-fleet emissions.
3. **SAF & Alternative Fuels** — 15 real supplier names across 5 pathways (HEFA,
   Fischer-Tropsch, Alcohol-to-Jet, e-Kerosene, Power-to-Liquid) with synthetic capacity
   (50–1,000 kt), price ($1,800–5,000/t) and lifecycle reduction (50–95%); plotted against the
   ReFuelEU-style mandate curve.
4. **Investment & Credit Risk** — 30 synthetic instruments (Green Bond/SLL/…): spread 80–500 bp
   and `climateSpread = spread × (1 + sr(·)×0.35)` — a flat 0–35% climate uplift, plus stranded
   risk buckets and a TCFD score 40–95.

### 7.4 Worked example — airline i = 0 (Lufthansa row)

- `fleetSize = floor(40 + sr(2)×460)`; sr(2) = frac(sin(3)×10⁴) = frac(1411.20) = 0.2001 →
  fleetSize = floor(40+92.05) = **132**.
- `annualCO2 = 132×0.018 + sr(5)×8`; sr(5) = frac(sin(6)×10⁴) = frac(−2794.15…) = 0.8449 →
  2.376 + 6.759 = **9.14 MtCO₂**.
- `b2020_factor = 0.4 + sr(4)×0.25`; sr(4) = frac(sin(5)×10⁴) = frac(−9589.24) = 0.7576 → 0.589.
- `baseline = 9.14 × (1 + 0.589)/2 = 9.14 × 0.7945 =` **7.26 MtCO₂**.
- Phase seed `s = sr(3)` = frac(sin(4)×10⁴) = 0.9750 → ≥ 0.75 → **Mandatory**, ratio 0.85.
- `offsetReq = max(0, 9.14 − 7.26) × 0.85 = 1.88 × 0.85 =` **1.60 MtCO₂e** of eligible units.

### 7.5 Data provenance & limitations

- **All airline, supplier, bond and airport rows are synthetic**, seeded via
  `sr(seed) = frac(sin(seed+1)×10⁴)`; names are real but data is not. The one genuinely sourced
  dataset — `CORSIA_BASELINES` (ICAO Environmental Report sector emissions, 589 MtCO₂ 2019) — is
  imported and unused.
- The per-airline "growth vs own baseline" scheme resembles CORSIA's *individual/route-based*
  attribution option but omits the sectoral growth factor that ICAO actually applies through 2032;
  the 0.85 ratio is a placeholder for it.
- Baseline uses avg(2019, 2020) per the original CORSIA design; ICAO Assembly A41 (2022) re-based
  the threshold to **85% of 2019 emissions** from 2024 — the code has not adopted this.
- No EEU eligibility, pricing or procurement optimisation; offset purchases in the quarterly view
  are seeded fractions of the requirement (0.6–1.4 × pro-rata).
- SAF blending does **not** reduce the offset requirement in code (contrary to both CORSIA rules
  and the guide's claim) — `safPct` is display-only.

### 7.6 Framework alignment

- **ICAO CORSIA (Annex 16 Vol IV / Doc 9501 Vol IV)** — CORSIA obliges operators on international
  routes between participating states to offset `(sector emissions − baseline) × SGF`, with the
  sectoral growth factor published annually by ICAO and a gradual shift to individual growth
  factors from 2033; eligible units must appear on ICAO's TAB-approved EEU list. The module
  approximates the arithmetic shape (growth above a 2019/2020-average baseline) at airline level
  but omits SGF, the 85%-of-2019 re-basing, and unit eligibility.
- **EU ReFuelEU Aviation (Reg. 2023/2405)** — the SAF mandate trajectory in code (2%→6%→20%→34%→
  42%→70% for 2025/2030/2035/2040/2045/2050) matches the regulation's blending mandates,
  including the e-fuel sub-quotas implied at pathway level.
- **EU ETS aviation** — referenced in the header copy only; no allowance-price math exists.
- **TCFD** — the bond table's `tcfdScore` is a synthetic 40–95 label, not a disclosure assessment.

## 9 · Future Evolution

### 9.1 Evolution A — Correct CORSIA mechanics using the reference data already imported (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag documents three substantive defects: the code computes a per-airline baseline (mean of own 2019/2020) with a flat 0.85 ratio instead of ICAO's sector growth factor; the phase labels are wrong (code says "Pilot (2024-26)" — ICAO's pilot was 2021–2023, first phase 2024–2026, mandatory phase 2027–2035); and the authoritative `CORSIA_BASELINES` dataset (ICAO sector emissions 2010–2024, 589 MtCO₂ 2019 baseline) is **imported but never used**. Worse, §7.1 shows a structural artefact: because `baseline2019_factor = 1.0` anchors 2019 to *current* emissions, every airline always has a positive obligation. Evolution A implements the real mechanism.

**How.** (1) Compute the sector growth factor from `CORSIA_BASELINES`: `SGF_yr = (Sector_yr − Sector_baseline)/Sector_yr`, applying ICAO's 2024 re-basing to 85% of 2019 (§7.2 notes the code kept the superseded 2019/2020 average). (2) `offset_req = airline_emissions_yr × SGF_yr` per the SARPs' sectoral approach, with the phase timeline corrected. (3) Decouple airline 2019 baselines from current emissions so obligations can be zero (route-level growth below baseline). (4) Rung 2: the three growth scenarios the guide promises become parameterised sector-recovery paths over the reference series; SAF credit deduction uses the mandate trajectory already encoded (which correctly matches ReFuelEU).

**Prerequisites.** The 120 airlines' emissions remain synthetic (real names, seeded tonnage) — either label the roster illustrative or seed from public EU ETS aviation/ICAO reporting for a verifiable subset; the SAF shares (0–12%) are ~20× sector actuals per §7.2 and need re-anchoring. **Acceptance:** with sector emissions below the 85%-of-2019 baseline, computed SGF and all obligations go to zero (the real 2021 outcome); phase labels match ICAO Doc 9501 Vol IV; a bench case pins one airline's obligation arithmetic.

### 9.2 Evolution B — CORSIA compliance explainer with scenario tools (LLM tier 1 → 2)

**What.** CORSIA's mechanics are genuinely confusing (sectoral vs individual growth factors, phase participation, SAF crediting), which makes this module a strong copilot candidate. First slice (tier 1): answer "why does airline X have an obligation when its emissions fell?" and "what changes in 2027?" strictly from this Atlas record — including the §7.2 provenance table's honest labels of what is synthetic — and refuse EEU-price or procurement questions the module does not compute (the guide's procurement optimiser does not exist).

**How.** Tier-1 grounding corpus: this record's §7.1 formula walk-through and §7.6-style framework notes; the mismatch flag is embedded so the copilot explains the *corrected* mechanism after Evolution A, and before it, discloses the approximation ("this page uses a per-airline baseline, not ICAO's sector growth factor"). Tier 2 lands once Evolution A ships a backend route (`POST /corsia/obligation` with airline emissions, year, SAF volumes): the copilot runs what-ifs — "obligation under fast-recovery scenario with 5% SAF blending" — as tool calls, every tonne figure from engine output.

**Prerequisites.** Copilot router (tier 1); Evolution A's backend extraction (tier 2 — obligations computed in React state cannot be tool-called). **Acceptance:** tier-1 answers cite the atlas and refuse procurement-cost questions; tier-2 what-if answers restate scenario, year, and SAF assumption, with every tonne traceable to a tool response.