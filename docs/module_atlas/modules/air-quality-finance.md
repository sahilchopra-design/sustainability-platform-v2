# Air Quality Finance
**Module ID:** `air-quality-finance` · **Route:** `/air-quality-finance` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Clean air project financing analytics covering health co-benefit monetisation, PM2.5 abatement NPV, and air quality bond pricing. Integrates WHO AQG 2021 targets, WHO cost-of-illness methodology for DALY valuation, and IFC air quality performance standards to assess investment viability of clean air projects alongside carbon reduction co-benefits.

> **Business value:** Incorporating air quality health co-benefits into project finance models can increase NPV by 30–60% for urban clean energy and transport projects, unlocking commercially viable investment cases that would otherwise fail standalone carbon pricing hurdles. Co-benefit transparency also strengthens green bond use-of-proceeds documentation.

**How an analyst works this module:**
- Input project location and emission reduction profile
- PM2.5 Abatement tab calculates concentration change and DALY avoidance
- Health Co-Benefits monetises DALY using country VSL
- Carbon Co-Benefits adds GHG abatement value at SCC
- Investment Analysis tab computes blended NPV with and without co-benefits
- WHO AQG Compliance tab shows gap to interim and final targets

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ABATEMENTS`, `ABATEMENT_TECHS`, `CITIES`, `CITY_NAMES`, `COMPANIES`, `COMPANY_PREFIXES`, `COMPANY_SUFFIXES`, `POLLUTANTS`, `QUARTERS`, `SECTORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `QUARTERS` | `['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];` |
| `ABATEMENT_TECHS` | `['Electrostatic Precipitator','Scrubber Systems','Catalytic Converter','Baghouse Filter','Low-NOx Burner','Selective Catalytic Reduction','Diesel Particulate Filter','Wet Scrubber','Cyclone Separator','Activated Carbon A` |
| `pm25` | `Math.floor(5+s1*150);` |
| `pm10` | `Math.floor(pm25*1.3+s2*40);` |
| `no2` | `Math.floor(10+s3*80);` |
| `so2` | `Math.floor(3+sr(i*31+5)*60);` |
| `popM` | `+(0.5+s5*25).toFixed(1);` |
| `mortalityCostM` | `Math.floor(pm25*popM*0.8+s1*200);` |
| `morbidityCostM` | `Math.floor(mortalityCostM*0.6+s2*100);` |
| `dalys` | `Math.floor(pm25*popM*15+s3*5000);` |
| `prodLossPct` | `+(pm25*0.03+s4*1).toFixed(1);` |
| `qTrend` | `QUARTERS.map((_,qi)=>({q:QUARTERS[qi],pm25:Math.floor(pm25*(0.85+qi*0.02+sr(i*41+qi*11)*0.15)),no2:Math.floor(no2*(0.9+qi*0.01+sr(i*43+qi*13)*0.1))}));` |
| `sector` | `SECTORS[Math.floor(s1*SECTORS.length)];` |
| `name` | `COMPANY_PREFIXES[Math.floor(s2*COMPANY_PREFIXES.length)]+' '+COMPANY_SUFFIXES[Math.floor(s3*COMPANY_SUFFIXES.length)];` |
| `scope1AirPollutants` | `Math.floor(s4*50000+500);` |
| `regRisk` | `+(sr(i*29+111)*100).toFixed(0);` |
| `abatementCostM` | `Math.floor(sr(i*31+113)*200+5);` |
| `airQualityScore` | `Math.floor(sr(i*37+117)*100);` |
| `pollutantBreakdown` | `POLLUTANTS.map((_,pi)=>Math.floor(sr(i*41+pi*7+119)*scope1AirPollutants/POLLUTANTS.length));` |
| `qEmissions` | `QUARTERS.map((_,qi)=>Math.floor(scope1AirPollutants*(0.9+qi*0.01+sr(i*43+qi*11)*0.08)));` |
| `tierColor` | `(t)=>t==='Severe'\|\|t==='Non-Compliant'?T.red:t==='Very Unhealthy'\|\|t==='At Risk'?T.amber:t==='Unhealthy'\|\|t==='Moderate'?T.gold:T.green;` |
| `fmt` | `(n)=>n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n);` |
| `ABATEMENTS` | `ABATEMENT_TECHS.map((tech,i)=>({` |
| `pollutantPie` | `useMemo(()=>POLLUTANTS.map((p,i)=>({name:p,value:CITIES.reduce((s,c)=>{const vals=[c.pm25,c.pm10,c.no2,c.o3,c.so2,c.co];return s+vals[i];},0)})),[]);` |
| `regionAgg` | `useMemo(()=>{ const regions=['Asia','Africa','Americas/Europe','Middle East','Other'];` |
| `sectorAgg` | `useMemo(()=>SECTORS.map(sec=>{const sc=COMPANIES.filter(c=>c.sector===sec);return{sector:sec,count:sc.length,totalEmissions:sc.reduce((s,c)=>s+c.scope1AirPollutants,0),avgRegRisk:sc.length?Math.floor(sc.reduce((s,c)=>s+c` |
| `healthAgg` | `useMemo(()=>{ const totalMort=CITIES.reduce((s,c)=>s+c.mortalityCostM,0);` |
| `totalMorb` | `CITIES.reduce((s,c)=>s+c.morbidityCostM,0);` |
| `totalDALYs` | `CITIES.reduce((s,c)=>s+c.dalys,0);` |
| `avgProdLoss` | `+(CITIES.length?CITIES.reduce((s,c)=>s+c.prodLossPct,0)/CITIES.length:0).toFixed(1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ABATEMENT_TECHS`, `CITY_NAMES`, `COLORS`, `COMPANY_PREFIXES`, `COMPANY_SUFFIXES`, `POLLUTANTS`, `QUARTERS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| VSL (Value of Statistical Life) | `Country-specific OECD/WHO` | WHO/OECD | Economic value of preventing one statistical premature death used for co-benefit NPV |
| PM2.5 Abatement Cost-Effectiveness | `Project cost / PM25 reduction` | IFC PS3 | Cost per unit ambient PM2.5 concentration reduction |
| Health Co-Benefit NPV | `Σ(DALY × VSL) discounted` | WHO 2021 | Net present value of health benefits from PM2.5 and NO2 reduction |
- **WHO AQG ambient concentration targets** → Apply concentration-response functions to emission reduction scenarios → **DALY avoidance estimates per PM2.5 and NO2 reduction increment**
- **OECD/WHO country VSL data** → Monetise DALYs and discount to NPV; add carbon co-benefit at SCC → **Total co-benefit NPV and blended project IRR**

## 5 · Intermediate Transformation Logic
**Methodology:** WHO DALY-based health co-benefit NPV
**Headline formula:** `NPV_coBenefit = Σ_t [DALY_avoided(t) × VSL / (1+r)^t]; PM25_abatement = Emission_reduction × CF_PM25`

DALY (Disability-Adjusted Life Year) avoidance is monetised using country-specific Value of Statistical Life (VSL) from OECD/WHO. PM2.5 concentration-response functions from WHO 2021 translate emission reductions to health outcomes. Carbon co-benefits use IPCC AR6 social cost of carbon to add to total NPV.

**Standards:** ['WHO Air Quality Guidelines 2021', 'IFC Performance Standard 3', 'GHG Protocol Co-benefits']
**Reference documents:** WHO Air Quality Guidelines 2021; IFC Performance Standard 3 (Resource Efficiency); OECD VSL Meta-analysis 2012; IPCC AR6 Social Cost of Carbon

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry promises a *WHO DALY-based health
> co-benefit NPV engine* — `NPV_coBenefit = Σ_t [DALY_avoided(t) × VSL / (1+r)^t]`, country-specific
> VSLs, concentration–response functions and IPCC AR6 social-cost-of-carbon add-ons. **None of that
> exists in the code.** There is no NPV, no discounting, no VSL table, no concentration–response
> function and no user input of project profiles. What the page actually implements is a
> *descriptive air-quality exposure dashboard*: 50 synthetic cities with heuristic health-cost
> scalars, 80 synthetic companies with air-pollutant emissions and regulatory-risk scores, and a
> 10-technology abatement catalogue with cost/effectiveness/payback attributes. The guide should be
> rewritten; the sections below document the code as shipped.

### 7.1 What the module computes

Two generator functions build the entire dataset at module load, both driven by the seeded PRNG
`sr(s) = frac(sin(s+1)×10⁴)`:

**`genCities(50)`** — per city `i`:

```js
pm25 = floor(5 + s1·150)                       // 5–155 µg/m³
pm10 = floor(pm25·1.3 + s2·40)                 // coupled to PM2.5
no2  = floor(10 + s3·80);  o3 = floor(20 + s4·100)
so2  = floor(3 + sr(i·31+5)·60);  co = floor(200 + sr(i·37+9)·2000)
whoCompliance = (pm25≤15 && no2≤25 && o3≤60) ? 100 : pm25≤25 ? 75 : pm25≤50 ? 50 : pm25≤100 ? 25 : 0
popM = 0.5 + s5·25                             // population, millions
mortalityCostM = floor(pm25·popM·0.8 + s1·200) // $M
morbidityCostM = floor(mortalityCostM·0.6 + s2·100)
dalys          = floor(pm25·popM·15 + s3·5000)
prodLossPct    = pm25·0.03 + s4·1              // % productivity loss
```

**`genCompanies(80)`** — per company: `scope1AirPollutants = floor(s4·50000 + 500)` (tonnes),
`regRisk = sr(·)·100`, `abatementCostM = floor(sr(·)·200 + 5)`, `airQualityScore = floor(sr(·)·100)`,
plus a 6-way pollutant breakdown and 12-quarter emissions trend with mild upward drift
(`0.9 + qi·0.01 + noise·0.08`).

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| PM2.5 city tiering | > 100 Severe · > 50 Very Unhealthy · > 25 Unhealthy · > 15 Moderate · else Good | Loosely mirrors WHO 2021 interim targets (IT-1 = 35 annual is *not* used; the 15/25/50/100 cutpoints are demo values) |
| WHO compliance test | PM2.5 ≤ 15 **and** NO₂ ≤ 25 **and** O₃ ≤ 60 → 100 % | NB: WHO AQG 2021 annual guidelines are PM2.5 = 5, NO₂ = 10; the code's 15/25 are the WHO *24-hour* guideline levels applied as if annual |
| Mortality cost scalar | 0.8 $M per (µg/m³ × M people) | Synthetic demo value (no VSL source) |
| Morbidity ratio | 60 % of mortality cost | Synthetic demo value |
| DALY scalar | 15 DALYs per (µg/m³ × M people) | Synthetic demo value |
| Productivity loss | 0.03 %/µg/m³ PM2.5 | Synthetic demo value |
| Company compliance | regRisk > 70 Non-Compliant · > 40 At Risk · else Compliant | Demo thresholds |
| Abatement techs | 10 named (ESP, scrubbers, SCR, DPF …), cost $5–105M, effectiveness 50–90 %, payback 1–9 yrs, co-benefit 0–100 | Technology names are real control equipment; all numbers are `sr()` draws |

### 7.3 Calculation walkthrough

1. **Tab 1 — AQ Index Dashboard.** KPIs: WHO-compliant count (`whoCompliance === 100`), global mean
   PM2.5 and NO₂ (simple averages over 50 cities), Severe-city count. Charts: horizontal PM2.5 bar
   (top 25 by current sort), global pollutant-sum pie, regional averages, and a 12-quarter trend
   averaging each city's `qTrend` (built with drift `0.85 + qi·0.02 + noise·0.15`, so PM2.5 trends
   *up* ~2 %/quarter in expectation).
2. **Tab 2 — Corporate Exposure.** Sector aggregation sums `scope1AirPollutants` and averages
   `regRisk` per sector; companies sortable by emissions/risk/abatement cost.
3. **Tab 3 — Health Cost Externalities.** `healthAgg` sums mortality/morbidity $M and DALYs across
   all 50 cities and averages `prodLossPct`; per-city detail shows the four health metrics.
4. **Tab 4 — Clean Air Investment.** Aggregates the `ABATEMENTS` catalogue: green-bond-eligible
   count (Bernoulli 0.5 per tech), average payback `Σ paybackYrs / 10`, cost-vs-effectiveness
   bars. No investment cash-flow model — payback is an input attribute, not computed.

### 7.4 Worked example (city i = 0, Beijing)

Seeds: `s1 = sr(3) = 0.2073`, `s2 = sr(7) = 0.9894`, `s3 = sr(11) = 0.4634`,
`s4 = sr(17) = 0.2510`, `s5 = sr(19) = 0.9129`.

| Step | Computation | Result |
|---|---|---|
| PM2.5 | `floor(5 + 0.2073·150)` | **36 µg/m³** |
| PM10 | `floor(36·1.3 + 0.9894·40)` | **86** |
| NO₂ | `floor(10 + 0.4634·80)` | **47** |
| WHO compliance | 36 > 25 and ≤ 50 | **50 %** |
| Tier | 25 < 36 ≤ 50 | **Very Unhealthy** |
| Population | `0.5 + 0.9129·25` | **23.3 M** |
| Mortality cost | `floor(36·23.3·0.8 + 0.2073·200)` | **$712 M** |
| Morbidity cost | `floor(712·0.6 + 0.9894·100)` | **$526 M** |
| DALYs | `floor(36·23.3·15 + 0.4634·5000)` | **14,899** |
| Productivity loss | `36·0.03 + 0.2510·1` | **1.3 %** |

### 7.5 Data provenance & limitations

- **All cities, companies and abatement figures are synthetic**, generated by `sr()` at load;
  city names are real megacities but the pollutant readings attached to them are random (Beijing's
  36 µg/m³ above is a draw, not an observation).
- Health costs are single-scalar heuristics; production practice (per the guide's own references)
  would use GBD/WHO concentration–response functions, country VSLs and discounted NPV.
- The WHO compliance test conflates 24-hour and annual guideline levels and ignores PM10/SO₂/CO.
- Region assignment is positional (first 20 city slots = Asia …), not geographic lookup.
- No backend, no persistence, no cross-module wiring — the module is self-contained JSX.

### 7.6 Framework alignment

- **WHO Air Quality Guidelines 2021** — the real framework sets annual guideline levels
  (PM2.5 = 5, PM10 = 15, NO₂ = 10 µg/m³) plus four interim targets (PM2.5 IT-1…IT-4 =
  35/25/15/10); the module borrows the *concept* of guideline exceedance tiers but with
  non-standard cutpoints.
- **DALY (WHO/GBD)** — properly computed as YLL + YLD via cause-specific relative risks from
  concentration–response functions; here approximated by a linear `pm25 × pop × 15` scalar.
- **IFC Performance Standard 3** — cited by the guide (resource efficiency & pollution
  prevention); nothing in the code references it beyond the abatement-technology theme.
- **Green bond use-of-proceeds (ICMA GBP)** — the "Green Bond Eligible" flag gestures at
  clean-air project eligibility, assigned randomly rather than by criteria.

## 9 · Future Evolution

### 9.1 Evolution A — Real DALY co-benefit NPV engine with concentration-response functions (analytics ladder: rung 1 → 3)

**What.** Per the §7 mismatch flag, the guide's entire premise — `NPV_coBenefit = Σ_t[DALY_avoided(t)
× VSL / (1+r)^t]` with country VSLs, concentration-response functions and SCC add-ons — is **not
implemented**: the page is a descriptive dashboard of 50 synthetic cities (health costs are
single-scalar heuristics like `mortalityCost = pm25·pop·0.8`) and 80 synthetic companies, with no
project input, no discounting and a WHO compliance test that conflates 24-hour and annual guideline
levels (§7.2). Evolution A builds the actual engine: user-entered project emission-reduction
profiles → PM2.5 concentration change via GBD/WHO integrated exposure-response functions → DALYs
avoided → monetisation at country-specific OECD/World Bank VSL → discounted co-benefit NPV, plus a
carbon co-benefit at the platform's SCC, producing the blended-NPV-with-and-without-co-benefits
comparison the guide promises.

**How.** A `air_quality_finance_engine` with `POST /api/v1/aq-finance/co-benefit-npv` (project
profile, location, discount rate → DALY avoidance, health NPV, blended IRR) and `GET
/ref/vsl-by-country` + `/ref/who-aqg`; concentration-response coefficients seeded from GBD 2021 as
cited reference tables. Rung 3 calibration: anchor the DALY-per-µg factors against published WHO
HRAPIE/AirQ+ outputs and validate VSL figures against the OECD meta-analysis the guide names.

**Prerequisites (hard).** Purge the `sr()` city/company generators per the no-fabricated-random
guardrail; fix the WHO annual-vs-24h threshold conflation (annual PM2.5 = 5, not 15) documented in
§7.2; the quarterly trend currently drifts *up* ~2%/quarter by construction — replace with data or
remove. **Acceptance:** a project reducing PM2.5 by a set increment produces a discounted health NPV
that scales with population and VSL; WHO compliance uses the correct annual guideline; carbon
co-benefit adds at the platform SCC.

### 9.2 Evolution B — Clean-air investment-case copilot (LLM tier 1 → 2)

**What.** A copilot answering "what's the health co-benefit case for this PM2.5 abatement project?",
"which abatement technology gives the best cost-effectiveness?" (over the 10-tech catalogue), and
"how does adding co-benefits change the NPV?" — grounded in the page's computed aggregates and, once
Evolution A ships, the real engine. Because today's health costs are heuristic scalars, the tier-1
copilot must state that mortality/morbidity/DALY figures are demo values, not VSL-based estimates.

**How.** Tier-1 roadmap pattern: §7.1 formulas, §7.2 parameter table and §7.6 framework alignment
(WHO AQG 2021, IFC PS3, ICMA GBP) embedded as the module corpus; page state (filtered cities,
selected abatement tech) as context; served via `POST /api/v1/copilot/air-quality-finance/ask` with
the standard refusal path. After Evolution A, graduates to tier 2 by tool-calling
`POST /co-benefit-npv` so "value the health benefit of halving PM2.5 in a 10M-person city" runs the
real engine, with the no-fabrication validator checking every DALY and dollar figure.

**Prerequisites.** Atlas corpus embedded (roadmap D3); grounding carries the §7 mismatch note so the
copilot never presents the heuristic health scalars as VSL-based NPV. **Acceptance:** every figure
cited matches page state with its synthetic status stated; a request for a discounted co-benefit NPV
before Evolution A returns a refusal naming the absent VSL/CRF inputs.