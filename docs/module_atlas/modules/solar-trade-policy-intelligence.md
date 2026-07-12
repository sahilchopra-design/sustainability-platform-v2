# Solar Trade Policy Intelligence
**Module ID:** `solar-trade-policy-intelligence` · **Route:** `/solar-trade-policy-intelligence` · **Tier:** B (frontend-computed) · **EP code:** EP-ED5 · **Sprint:** ED

## 1 · Overview
Global solar PV trade policy and market access intelligence. Analyses AD/CVD tariff impacts, IRA domestic content incentives (§48C/§48E), EU Net-Zero Industry Act local manufacturing targets, CBAM implications, and UFLPA supply chain compliance affecting import economics.

> **Business value:** Used by solar developers, manufacturers, EPCs, trade policy advisors, and institutional investors to navigate the trade and industrial policy landscape affecting solar supply chain economics in the US and EU.

**How an analyst works this module:**
- Review policy landscape for AD/CVD, IRA, and NZIA with effective dates
- Use IRA §48C/§48E calculator to model US manufacturing returns
- Examine EU NZIA/CBAM for European market access
- Run UFLPA compliance analysis under AD/CVD orders

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLORS`, `COUNTRIES`, `IRA_SCENARIOS`, `KpiCard`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COUNTRIES` | 21 | `country`, `iraDomesticBonus`, `adCvdTariff`, `nziaTarget`, `cbamRisk`, `importDependency`, `annualInstall`, `localMfg`, `policyScore` |
| `IRA_SCENARIOS` | 9 | `itcPct`, `netCost`, `applicability` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `iraCredit` | `useMemo(() => (iraSizeKw * 0.001 * 1800 * computedITC / 100).toFixed(0), [iraSizeKw, computedITC]);` |
| `avgCbam` | `useMemo(() => COUNTRIES.length ? (COUNTRIES.reduce((a, c) => a + c.cbamRisk, 0) / COUNTRIES.length).toFixed(1) : '0.0', []);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `COUNTRIES`, `IRA_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| AD/CVD Effective Rate (%) | `Statutory AD + CVD rate per manufacturer` | US CBP ADDCVD Order 7002 | Circumvention orders extended to Cambodia/Vietnam/Malaysia/Thailand (2022). |
| IRA §48E Production Credit ($/W) | `Applies to US-manufactured modules and cells` | IRS Notice 2023-29 | Direct pay available for 5 years for tax-exempt entities; transferability to third parties. |
| EU NZIA Local Content Target (%) | `% of EU demand met by EU-manufactured solar` | EU NZIA Regulation 2024 | Current EU production <5% of demand; requires €20-30B investment. |
- **CBP tariff database + IRS guidance + EU NZIA text + SEIA market data** → Tariff impact + IRA incentive calculator + CBAM cost model → **Trade policy risk for solar procurement, manufacturing investment, and market access**

## 5 · Intermediate Transformation Logic
**Methodology:** Tariff Impact & IRA Incentive Optimization
**Headline formula:** `Effective_cost = module_price × (1 + AD_CVD_rate); IRA_benefit = CAPEX × ITC_rate + output × PTC_rate`

US AD/CVD on Chinese modules: 30-250% effective rate. IRA §48E: $0.04/W modules, $0.12/kWh cells. EU NZIA: 40% EU demand met by EU manufacturers by 2030. CBAM fertilizers from 2026; potential solar phase-in 2028-2030.

**Standards:** ['IRS IRA §48C/§48E Guidance', 'US CBP AD/CVD Order Database', 'EU NZIA Regulation (2024)']
**Reference documents:** IRS IRA §48C Advanced Manufacturing Credit Guidance (2023); US CBP ADDCVD Order Database; EU Net-Zero Industry Act (NZIA) Regulation (2024)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`COUNTRIES` (20 rows, no `sr()` PRNG) is a **hand-curated, real-policy dataset** covering IRA domestic-
content bonus eligibility, AD/CVD (anti-dumping/countervailing duty) tariff rates, EU NZIA local-content
targets, a qualitative CBAM-risk score, import dependency %, annual installs, and local manufacturing
capacity — several figures match real, verifiable trade-policy facts (USA AD/CVD 254% — consistent with the
real 2024 US combined circumvention tariff on Southeast-Asian-routed Chinese solar cells/modules; India
Basic Customs Duty 40% — matches India's real BCD on solar modules). The one genuinely interactive
calculation is the **IRA ITC stack optimiser**:

```js
computedITC:
  itc = 6                                    // base rate WITHOUT prevailing wage/apprenticeship compliance
  if (prevailingWage) itc = 30               // base rate WITH compliance (IRA §48E structure)
  if (domestic)        itc += 10
  if (energyCommunity)  itc += 10
  if (lowIncome)        itc += 10
  itc = min(itc, 70)

iraCredit = iraSizeKw × 0.001 × $1,800/kW × computedITC/100
```

### 7.2 Parameterisation

| Parameter | Value | Provenance |
|---|---|---|
| Base ITC without prevailing wage | 6% | correctly reflects the real IRA §48E rule: projects that don't meet prevailing-wage/apprenticeship requirements receive only a 6% base credit (vs 30% for compliant projects) — a detail many simplified ITC calculators omit |
| Base ITC with prevailing wage | 30% | correct |
| Adders | +10% domestic content, +10% energy community, +10% low-income (this module uses a flat +10 for all three, unlike `solar-plus-storage-finance`'s `ITC_TIERS` which correctly shows low-income as up to +20%) | partially correct — **understates the low-income adder**, which under IRC §48E(h) can reach +20% for qualified low-income *economic benefit* projects, not just +10% |
| Max ITC cap | 70% | matches the real maximum combined stack (30+10+10+20=70%) |
| System cost assumption | $1,800/kW ($1.80/W) | plausible turnkey utility-scale solar cost assumption for the credit-value calculation |
| `COUNTRIES.adCvdTariff` | USA 254%, India 40%, Vietnam/Malaysia/Thailand 15%, Brazil 12% | consistent with real, documented AD/CVD determinations (US Commerce Dept circumvention rulings on SE Asia-routed Chinese cells; India's solar BCD) |
| `COUNTRIES.nziaTarget` | 40% for EU and EU member states (Germany, Spain, Italy, Poland), 0 elsewhere | correctly reflects the EU Net-Zero Industry Act's 40% domestic-manufacturing-by-2030 target applying at the EU level |
| `COUNTRIES.localMfg` (GW) | China 640GW, Vietnam 28GW, Malaysia 22GW, USA 5.8GW, EU 4.2GW | plausible ordering consistent with real global manufacturing capacity concentration in China/Southeast Asia |
| `cbamRisk` (1–10 qualitative score) | China 8 (highest), USA 2 (lowest, no CBAM exposure) | qualitative platform judgment, not a computed exposure metric |

### 7.3 Calculation walkthrough

- **IRA Incentive Optimizer tab**: live-updates `computedITC` and `iraCredit` as the user toggles the 4
  adder checkboxes — the one genuinely interactive, correctly-structured calculation in the module.
- **Policy Landscape / Trade Flow Map tabs**: filtered rendering of `COUNTRIES` by region — descriptive, no
  derived scoring.
- **KPI strip**: `highTariffCountries` = count where `adCvdTariff>10`; `nziaCountries` = count where
  `nziaTarget>0`; `avgCbam` = mean of the qualitative `cbamRisk` scores — simple aggregations.
- **`policyScore`** (per country, 45–95) is a **hand-set overall composite** (e.g. China 95, highest) — not
  computed from a weighted combination of the other fields shown for the same row (tariff level, NZIA
  target, CBAM risk, local manufacturing share); no formula ties `policyScore` to the underlying columns.

### 7.4 Worked example

5MW commercial system, prevailing wage compliant, domestic content + energy community adders (not low-
income):

| Step | Computation | Result |
|---|---|---|
| Base (with prevailing wage) | 30 | 30% |
| + Domestic content | +10 | 40% |
| + Energy community | +10 | 50% |
| `computedITC` | min(50, 70) | **50%** |
| `iraCredit` | 5,000 × 0.001 × 1,800 × 0.50 | **$4,500,000** |

### 7.5 Data provenance & limitations

- **The `COUNTRIES` trade-policy dataset is hand-curated but genuinely well-grounded** in real, verifiable
  2024-era trade-policy facts (AD/CVD rates, NZIA targets) — one of the more evidence-based modules in this
  batch on that dimension.
- **`policyScore` is an un-derived composite judgment**, not computed from the tariff/NZIA/CBAM/local-mfg
  columns on the same row — a user cannot audit how the score was assigned.
- The low-income ITC adder is modelled as a flat +10% rather than the real up-to-+20% tiered structure
  correctly shown in the sibling module `solar-plus-storage-finance` — an internal platform inconsistency
  between two modules covering the same statutory provision.
- `cbamRisk` is a static qualitative 1–10 score, not derived from each country's actual solar-export volume
  to the EU or embedded-carbon intensity (the two factors that would genuinely determine CBAM exposure once
  solar potentially enters CBAM's product scope).

### 7.6 Framework alignment

- **IRS Notice 2023-29 (IRA §48C/§48E ITC guidance)** — the base-rate/prevailing-wage distinction (6% vs
  30%) and the domestic-content/energy-community adder structure are correctly modelled; the low-income
  adder is understated relative to its real maximum.
- **US CBP AD/CVD Order Database** — the country tariff figures are consistent with real, documented US
  trade-remedy determinations against Chinese-origin and circumvention-routed solar products.
- **EU Net-Zero Industry Act (NZIA) Regulation (2024)** — the 40%-by-2030 target is correctly applied at the
  EU/member-state level, not to non-EU countries.
- **EU CBAM Regulation** — solar PV is **not currently in CBAM's product scope** (CBAM currently covers
  cement, iron/steel, aluminium, fertilisers, electricity, hydrogen); the module's `cbamRisk` field
  represents a forward-looking risk assessment of *potential* future CBAM expansion to solar, which should be
  clearly labelled as speculative rather than a current regulatory fact.

## 9 · Future Evolution

### 9.1 Evolution A — Correct the low-income adder, label CBAM speculation, and live-refresh AD/CVD orders (analytics ladder: rung 1 → 2)

**What.** This is a well-grounded tier-B policy module: `COUNTRIES` (20 rows, no `sr()`) is hand-curated real trade-policy data with verifiable figures (USA AD/CVD 254% matching the 2024 SE-Asia circumvention tariff; India BCD 40%), and the IRA ITC optimiser correctly captures the 6%-vs-30% prevailing-wage base-rate distinction that many simplified calculators omit. Three §7.6 defects need fixing: the low-income adder is hardcoded at +10% but IRC §48E(h) allows up to +20% for qualified low-income economic-benefit projects; the `cbamRisk` field treats potential future CBAM expansion to solar as if current, when solar is **not** in CBAM's product scope today; and the policy data is a static snapshot of a fast-moving landscape.

**How.** (1) Fix the low-income adder to a discrete tier reaching +20% (align with the sibling `solar-plus-storage-finance`'s correct `ITC_TIERS`). (2) Relabel `cbamRisk` explicitly as speculative/forward-looking, since solar is outside current CBAM scope (cement/steel/aluminium/fertiliser/electricity/hydrogen) — an honesty fix, not a calculation change. (3) A refresh path for AD/CVD determinations: US CBP publishes order data; a light ingester keeps `adCvdTariff` current with cited effective dates rather than a frozen snapshot. (4) Scenario the effective landed cost: module price × (1 + AD/CVD) net of IRA benefit, across sourcing-country options — turning the two static calculators into a comparative sourcing tool.

**Prerequisites.** CBP AD/CVD data cadence; the §48E(h) low-income allocation rules. **Acceptance:** the low-income adder can reach +20%; `cbamRisk` is labelled speculative wherever shown; landed-cost scenarios rank sourcing countries under current tariffs.

### 9.2 Evolution B — Trade-policy navigation copilot (LLM tier 1)

**What.** A copilot for the developer/manufacturer/trade-advisor users: "what's my effective module cost importing from Vietnam under current AD/CVD?", "which IRA adders can this project stack?", "does CBAM affect my EU solar exports?" — answered from the real `COUNTRIES` policy data and the correctly-structured ITC optimiser, with the CBAM answer stating plainly that solar is outside current scope.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/solar-trade-policy-intelligence/ask`, corpus = this Atlas record (the policy dataset, ITC structure, framework notes) plus live calculator state. Effective-cost answers run the tariff/IRA calculators and narrate results; adder-eligibility answers walk the §48E structure. The copilot must assert the CBAM-scope fact (solar not currently covered) rather than repeating the speculative `cbamRisk` as current regulation — the specific honesty guardrail this module needs.

**Prerequisites.** Evolution A's CBAM relabelling and low-income fix — otherwise the copilot would confidently state solar CBAM liability that doesn't exist and understate the low-income credit. **Acceptance:** every tariff/ITC figure traces to the calculators; a CBAM question returns "solar is not in current CBAM scope"; the low-income adder answer reflects the up-to-20% rule.