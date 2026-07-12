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
