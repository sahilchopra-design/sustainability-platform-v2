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
