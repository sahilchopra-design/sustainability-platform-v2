# Exchange Intelligence
**Module ID:** `exchange-intelligence` · **Route:** `/exchange-intelligence` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses and compares ESG listing requirements, sustainability disclosure obligations, and climate reporting rules across major stock exchanges globally. Tracks emerging market sustainability index inclusion criteria, voluntary and mandatory ESG reporting frameworks by exchange, and progressive implementation timelines. Supports investor stewardship, market development analysis, and portfolio ESG regulatory exposure mapping.

> **Business value:** Enables institutional investors, stewardship teams, and market development advisors to navigate the rapidly evolving global landscape of exchange-level ESG requirements, identify markets where regulatory tailwinds will drive ESG disclosure improvement, and calibrate engagement priorities accordingly.

**How an analyst works this module:**
- Select exchanges for comparison by region, development status, or specific regulatory framework of interest.
- Review ESG readiness score components and identify disclosure mandate gaps vs. global best-practice peers.
- Map portfolio holdings to exchange domicile to assess regulatory ESG disclosure exposure and improvement trajectory.
- Track regulatory update alerts as exchanges publish new ESG listing rules, TCFD mandates, or index inclusion changes.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ESG_TREND`, `EXCHANGES`, `KpiCard`, `LISTING_STANDARDS`, `STEWARDSHIP_DATA`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `EXCHANGES` | 16 | `name`, `country`, `region`, `marketCap`, `listed`, `esgRequired`, `stewardshipCode`, `disclosureRate`, `esgScore`, `climateScore`, `socialScore`, `govScore`, `sustainabilityIndex`, `greenBonds`, `tcfdAdopters` |
| `LISTING_STANDARDS` | 9 | `standard`, `esgMandatory`, `climateRisk`, `tcfdMandatory`, `scope3`, `boardDiversity`, `remuneration`, `tier`, `year` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ESG_TREND` | `['2019','2020','2021','2022','2023','2024','2025'].map((yr, i) => ({` |
| `STEWARDSHIP_DATA` | `EXCHANGES.map(e => ({` |
| `regions` | `['All', 'Americas', 'Europe', 'Asia-Pacific'];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ESG_TREND`, `EXCHANGES`, `LISTING_STANDARDS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Disclosure Mandate Level (0â€“3) | — | WFE ESG Database | Rating 0=voluntary, 1=apply-or-explain, 2=mandatory rule-based, 3=mandatory+assurance; trend toward 3 in developed markets. |
| TCFD Mandate Status | — | FSB TCFD Status Report 2023 | Whether exchange or market regulator has mandated TCFD-aligned climate disclosure; binary indicator with effective date. |
| ESG Index AUM ($Bn) | — | Index Provider Data | Total assets tracking exchange-domiciled ESG indices; proxy for market-level ESG investor demand and capital allocation signal. |
| Emerging Market ESG Inclusion Rate (%) | — | MSCI EM ESG Leaders | Proportion of exchange-listed companies included in leading EM ESG indices; low rate signals ESG disclosure infrastructure gap. |
- **WFE ESG metrics database and exchange annual reports** → Extract and standardise disclosure mandate level, effective date, and enforcement mechanism per exchange → **Exchange ESG governance matrix with mandate level and TCFD status**
- **MSCI/FTSE ESG index constituent data** → Compute inclusion rate by exchange; track year-on-year trend in EM index eligibility → **ESG index inclusion rate and AUM by exchange**
- **Exchange listing rule documents and regulatory circulars** → Monitor for ESG rule updates; classify as new mandate, enhanced requirement, or guidance only → **Regulatory change alert with implementation date and compliance implication**

## 5 · Intermediate Transformation Logic
**Methodology:** Exchange ESG Readiness Score
**Headline formula:** `EERS = w_d × Disclosure + w_e × Enforcement + w_i × IndexInclusion + w_c × ClimateAmbition`

Composite readiness score across four exchange governance dimensions. Disclosure component assesses whether ESG reporting is mandatory, apply-or-explain, or voluntary. Enforcement tracks regulatory sanction history for non-compliance. Index inclusion assesses ESG index criteria stringency. Climate ambition scores TCFD mandate status and net zero exchange commitment under UN SSE initiative.

**Standards:** ['WFE ESG Guidance and Metrics 2021', 'IFC Model Exchange Guidance 2021', 'IOSCO ESG Ratings Consultation 2021']
**Reference documents:** WFE ESG Guidance and Metrics for Exchanges 2021; IFC Sustainable Banking and Finance Network â€” Model Exchange Guidance 2021; UN SSE Initiative ESG Disclosure Guidance 2023; IOSCO ESG Ratings and Data Providers Consultation 2021; FSB TCFD Status Report 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes an **Exchange ESG Readiness Score**
> `EERS = w_d·Disclosure + w_e·Enforcement + w_i·IndexInclusion + w_c·ClimateAmbition`. **No such
> composite is computed.** The module is a **curated comparative dataset** of 16 exchanges with
> pre-assigned ESG/climate/social/governance scores and a real listing-standards table; the only
> computations are region-filtered averages. The per-exchange scores are editorial estimates (not derived
> from an EERS formula), but the *structural* facts (market cap, listing counts, TCFD mandate status,
> stewardship codes, listing-standard names) are real and credible. Documented below.

### 7.1 What the module computes

The dynamic logic is limited to region filtering and averaging:

```js
filtered = regionFilter==='All' ? EXCHANGES : EXCHANGES.filter(e=>e.region===regionFilter)
kpis: mean(esgScore), mean(disclosureRate), mean(tcfdAdopters), Σ greenBonds  over `filtered`
```

Everything else (`esgScore`, `climateScore`, `socialScore`, `govScore`, `disclosureRate`,
`sustainabilityIndex`, `esgRequired`, `stewardshipCode`) is a **hand-curated field per exchange**, not
a computed readiness score. `STEWARDSHIP_DATA` reprojects a subset for charts.

### 7.2 Parameterisation & provenance

| Field | Example | Provenance |
|---|---|---|
| `marketCap`, `listed` | NYSE $26.8T / 2,330; BSE India 5,200 listings | **Real** order-of-magnitude exchange statistics |
| `esgRequired` | NYSE/LSE/Euronext/SGX true; SSE/SZSE/BSE false | **Real** — reflects mandatory-vs-voluntary ESG listing rules |
| `stewardshipCode` | UK/Japan/Canada/Australia true; China false | **Real** stewardship-code presence |
| `tcfdAdopters` (%) | LSE 92, SGX 85, SSE 38 | Editorial estimates, directionally correct |
| `esgScore` / climate / social / gov | 0–100 per exchange | **Editorial composite estimates** — not an EERS calculation |
| `greenBonds` ($) | NYSE 1,420; SSE 920 | Illustrative green-bond listing volumes |
| `LISTING_STANDARDS` | LSE UK Listing Rules (TCFD mandatory 2021); Euronext CSRD+ESRS Scope 3 2024; JPX Prime Market ESG; HKEX comply-or-explain; SEBI BRSR top-1000 | **Real regulatory standards** with correct mandate flags and years |
| `ESG_TREND` | 6 exchanges 2019–25 | `base + i·slope + sr()·jitter` — **synthetic** upward trend |

The listing-standards table is the module's strongest asset — it correctly encodes which exchanges
mandate TCFD (LSE, JPX Prime, SGX), which require Scope 3 (Euronext via CSRD), and the comply-or-explain
regimes (HKEX, ASX).

### 7.3 Calculation walkthrough

1. `EXCHANGES` (16) render as cards/table with their curated scores.
2. Region filter subsets the list; `kpis` average the ESG/disclosure/TCFD fields and sum green bonds.
3. `ESG_TREND` renders a 6-exchange time series with a synthetic rising slope + jitter.
4. `LISTING_STANDARDS` renders a mandate-comparison matrix (ESG mandatory / climate risk / TCFD / Scope 3
   / board diversity / remuneration) by exchange.

### 7.4 Worked example (Europe filter)

Filtering to Europe (LSE, Euronext, Deutsche Börse):

| Exchange | esgScore | disclosureRate | tcfdAdopters | greenBonds |
|---|---|---|---|---|
| LSE | 91 | 96 | 92 | 690 |
| Euronext | 90 | 95 | 89 | 820 |
| Deutsche Börse | 89 | 94 | 88 | 510 |
| **mean / Σ** | **90.0** | **95.0** | **89.7** | **Σ 2,020** |

Europe shows the highest average ESG readiness — consistent with CSRD/ESRS being the world's most
prescriptive disclosure regime. The averages are correct arithmetic over curated (not modelled) scores.

### 7.5 Data provenance & limitations

- **No EERS computation**: the per-exchange scores are editorial estimates, so the "readiness" ranking is
  a judgement call, not a reproducible model output.
- **`ESG_TREND` is synthetic** (`sr()` jitter on a linear trend) — not a real historical series.
- Structural facts (market cap, listing counts, mandate status, standard names/years) are **real and
  auditable** and constitute the module's genuine value.
- Green-bond volumes and TCFD-adopter %s are illustrative.

**Framework alignment:** Content operationalises the **WFE ESG Guidance and Metrics for Exchanges**, the
**UN Sustainable Stock Exchanges (SSE) Initiative** disclosure-mandate taxonomy (voluntary → comply-or-
explain → mandatory → mandatory+assurance), and **FSB TCFD Status Report** mandate tracking. The listing-
standards table correctly references **UK Listing Rules**, **SEC Climate Rules**, **EU CSRD/ESRS**, **JPX
Prime Market**, **HKEX ESG Guide**, and **SEBI BRSR** — all real regimes. The intended-but-absent artefact
is the guide's four-factor EERS composite.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide's EERS composite is absent; scores are
curated. Below is the production readiness-scoring model.

**8.1 Purpose & scope.** Produce a reproducible, source-traceable ESG-readiness score per exchange to map
portfolio regulatory-disclosure exposure and prioritise stewardship engagement by market.

**8.2 Conceptual approach.** A weighted composite over four transparent, sourced dimensions — mirroring
the **WFE ESG metrics** framework and **UN SSE** maturity model — replacing editorial scores with rule-
derived sub-scores.

**8.3 Mathematical specification.**

```
Disclosure_e   = level ∈ {0 voluntary, 1 comply-or-explain, 2 mandatory, 3 mandatory+assurance} / 3
Enforcement_e  = normalised sanction/monitoring index
IndexInclusion_e = ESG-index-eligible listings / total listings
ClimateAmbition_e = f(TCFD mandate ∈ {0,1}, net-zero-exchange SSE commitment, Scope-3 requirement)
EERS_e = w_d·Disclosure + w_e·Enforcement + w_i·IndexInclusion + w_c·ClimateAmbition   (Σw = 1)
Portfolio exposure = Σ_holding weight · EERS_{domicile}
```

| Parameter | Source |
|---|---|
| Disclosure level | Exchange listing rules; UN SSE database |
| Enforcement | Regulator sanction records |
| Index inclusion | MSCI/FTSE ESG index constituents |
| Climate ambition | FSB TCFD Status Report; SSE net-zero pledges |
| Weights w | Governance-committee judgement, documented |

**8.4 Data requirements.** WFE ESG metrics database; UN SSE disclosure-mandate register; MSCI/FTSE index
constituents by exchange; FSB TCFD mandate list. Platform holds portfolio holdings (for exposure roll-up).

**8.5 Validation & benchmarking plan.** Reconcile Disclosure levels against the UN SSE published database;
cross-check TCFD mandates against the FSB status report; sensitivity of EERS ranking to weights.

**8.6 Limitations & model risk.** Enforcement data is sparse and inconsistent across jurisdictions —
document proxy sources. Index-inclusion rates depend on the chosen index provider. Conservative fallback:
where a dimension is unsourced, exclude it and renormalise weights rather than guess a score.

## 9 · Future Evolution

### 9.1 Evolution A — Compute the EERS from the real structural facts (analytics ladder: rung 1 → 2)

**What.** §7 splits the module cleanly: the guide's `EERS = w_d·Disclosure + w_e·Enforcement + w_i·IndexInclusion + w_c·ClimateAmbition` composite is not computed — the 16 exchanges' ESG/climate/social/governance scores are editorial estimates and the only computation is region-filtered averaging — but "the structural facts (market cap, listing counts, TCFD mandate status, stewardship codes, listing-standard names) are real and credible," as is the 9-row listing-standards table. Evolution A derives the score from the facts instead of asserting it beside them.

**How.** (1) `exchange_profiles` table seeded from the curated rows, refreshed against the WFE ESG database and UN SSE initiative's exchange tracker (both public) with `as_of` dates — the §4 lineage sketch names exactly these sources. (2) `services/exchange_readiness_engine.py`: the EERS computed from codable inputs — disclosure component from the 0–3 mandate level, climate ambition from TCFD-mandate status and SSE net-zero commitment (both boolean facts in the data), index inclusion from constituent rates where obtainable; the enforcement component honestly nulled until sanction-history data exists (partial composites disclosed, not padded). (3) The editorial per-pillar scores retired or kept as clearly-labeled analyst overlays. (4) Rung 2: the portfolio-mapping workflow — holdings joined by listing exchange to regulatory exposure — becomes computable against `portfolios_pg`; regulatory-change alerts become dated events in the profile history.

**Prerequisites.** WFE/SSE data-refresh cadence; the ESG_TREND chart rebuilt from dated mandate events rather than generated. **Acceptance:** a fixture exchange's EERS reproduces from its stored mandate/TCFD/SSE fields with the published weights; missing enforcement data renders as a disclosed component gap; portfolio exposure mapping resolves real holdings to their listing exchanges.

### 9.2 Evolution B — Listing-regime navigator for stewardship and IR teams (LLM tier 2)

**What.** The module's users ask jurisdictional questions with checkable answers: "which of our APAC holdings face mandatory climate disclosure by 2026, and which exchanges still have no stewardship code?" A tool-calling navigator that queries Evolution A's exchange profiles and the portfolio mapping, answers with mandate levels, effective dates, and standard names from stored rows, and drafts the stewardship-priority memo the overview describes ("regulatory tailwind" markets identified by dated mandate events, not vibes).

**How.** Tools: `get_exchange_profile(exchange)`, `compare_exchanges(list)`, `map_portfolio_exposure(portfolio)`, `get_regulatory_changes(since)`. Grounding corpus = this Atlas record plus the WFE/SSE/FSB reference texts, so mandate-level definitions (voluntary / apply-or-explain / mandatory / mandatory+assurance) are quoted consistently. Every mandate claim carries its effective date and source; forward-looking claims ("expected 2026") are only made from stored announced-but-not-effective events, clearly labeled. Jurisdiction-specific legal interpretation refuses with a pointer to the underlying rule document.

**Prerequisites.** Evolution A — a navigator over editorial scores would present analyst impressions as regulatory fact; the dated-events model is what makes "by 2026" questions answerable. **Acceptance:** a golden APAC query's mandate list matches stored profiles with dates; the stewardship memo cites only recorded events; exchanges outside the tracked set return "not covered" with the current coverage list.