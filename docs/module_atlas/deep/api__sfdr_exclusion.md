## 7 · Methodology Deep Dive

### 7.1 What the domain computes

`/api/v1/sfdr-compliance` couples two engines:

1. **Exclusion screening** (`exclusion_list_engine.py`) — screens holdings against 7 standard
   negative-screening categories plus user-defined custom rules, scoped by the fund's SFDR
   classification, and reports hard/soft breaches and breached portfolio weight.
2. **Periodic report generation** (`sfdr_report_generator.py`) — computes the quantitative core
   of an SFDR Art 8/9 periodic report: proportion-of-investments breakdown, top-15 investments,
   sector/geography tables, PAI year-on-year summary, WACI, DNSH-compliant weight, and
   minimum-commitment compliance flags.

Key formulas:

```
breached_weight_pct = Σ weight of holdings with ≥1 breach (holding de-duplicated)
severity = "hard" if threshold == 0 else "soft"

taxonomy_pct = Σ(w_h × taxonomy_aligned_h/100) / Σw_h × 100      (look-through weighting)
sustainable  = taxonomy + other_environmental + social
WACI         = Σ (w_h/100 × carbon_intensity_h)
yoy_change   = (current − prior) / |prior| × 100                  per PAI indicator
```

### 7.2 Exclusion rubric (`DEFAULT_EXCLUSION_RULES`)

| Category | Threshold | Applies to | Stated regulatory basis |
|---|---|---|---|
| Controversial weapons | 0 % (zero tolerance) | art6/8/8+/9 | SFDR RTS PAI 15 (sic — RTS Table 1 numbers it 14); Ottawa Treaty; Convention on Cluster Munitions |
| Tobacco production | > 5 % revenue | art8/8+/9 | WHO FCTC; common ESG policy |
| Thermal coal | > 10 % revenue (mining) OR > 30 % generation (power) | art8+/9 | Paris Agreement; IEA NZE; EU PAB requirements |
| Arctic oil & gas | > 5 % revenue | art9 | Arctic Council; IUCN |
| Oil sands | > 5 % revenue | art9 | Paris alignment |
| Nuclear weapons | involvement flag (0 %) | art8+/9 | NPT; common ESG policy |
| UNGC/OECD violations | verified-violation flag | art8/8+/9 | SFDR RTS PAI 12 (RTS numbers it 10); UNGC; OECD MNE Guidelines |

The header cites the Norwegian GPFG exclusion guidelines and SVVK-ASIR as design references —
the tiering (stricter set for Art 9 than Art 8) is the platform's own policy encoding, not an SFDR
legal requirement. Custom rules are boolean-flag based and always severity "hard".

### 7.3 Calculation walkthrough

**Screening** (`POST /screen`): rules are filtered by classification; each holding's revenue
percentages/flags are compared; thermal coal checks revenue first, then generation (the breach
records whichever threshold tripped). A holding can breach multiple categories (all recorded),
but `breached_weight_pct` counts each holding once. `is_compliant` requires zero breaches.

**Periodic report** (`POST /periodic-report`): proportions use holding-level look-through
percentages weighted by portfolio weight; `not_sustainable = max(0, 100 − tax − env − soc)`. The
taxonomy slice is split across environmental objectives with a **hard-coded 60/30/10** allocation
(mitigation/adaptation/other four objectives) — flagged "Simplified" in a comment. Sector rows add
a `min(sus, 100)` cap on per-holding sustainability. Art 9 funds must additionally show
`sustainable ≥ 90 %` ("some flexibility for hedging/cash") or `is_art9_compliant = False`; any
missed minimum also sets `is_art8_compliant = False`. The PAI summary covers a 12-indicator subset
with names/units (note this generator's numbering treats PAI_1/2/3 as separate Scope 1/2/3
tonnages, PAI_5 as WACI, PAI_15 as controversial weapons — a vendor-style expansion rather than
the strict RTS Table-1 numbering used elsewhere in the platform).

### 7.4 Worked example — Art 8+ fund, 3 holdings

Holdings: A (40 %, coal power generation 35 %), B (35 %, tobacco revenue 4 %), C (25 %,
taxonomy 20 %, sust-env 10 %). Classification `art8plus` (thermal coal applies; arctic/oil-sands
do not).

*Screening:* A breaches thermal coal via generation channel (35 % > 30 %, severity soft — threshold
≠ 0); B's tobacco 4 % ≤ 5 % → no breach. Result: `breach_count = 1`, `hard = 0`, `soft = 1`,
`breached_weight_pct = 40.0`, `is_compliant = False`.

*Report:* taxonomy = (25×20/100)/100 × 100 = **5.0 %**; other-env = (25×10/100) = **2.5 %**;
social 0; sustainable = **7.5 %**; not-sustainable = 92.5 %. Objective split: 3.0/1.5/0.5.
With `minimum_taxonomy_pct = 10`, issue "Taxonomy alignment 5.0 % below minimum 10.0 %" and
`is_art8_compliant = False`.

### 7.5 Data provenance & limitations

- **No synthetic data, no PRNG** — both engines are pure functions of caller-supplied holdings;
  exposure percentages must come from an upstream data vendor (not sourced here).
- Screening thresholds (5 %/10 %/30 %) match common market practice (e.g. EU Paris-Aligned
  Benchmark exclusions use 1 % coal, 10 % oil, 50 % gas revenue — **note the platform's coal
  threshold is looser than PAB's 1 %**); they are policy defaults, not statutory SFDR limits
  (SFDR itself mandates disclosure, not exclusion).
- PAI indicator numbering is internally inconsistent across the two engines (report generator's
  PAI_5=WACI/PAI_15=weapons vs RTS Table 1's 3=GHG intensity/14=weapons); consumers should map by
  name, not id.
- The 60/30/10 taxonomy-objective split is fabricated structure — real reporting requires
  activity-level objective attribution.
- Art 9's "90 % sustainable" check is a supervisory rule-of-thumb (ESMA guidance expects
  "only sustainable investments" with limited liquidity/hedging exceptions); the numeric 90 is a
  platform choice.

### 7.6 Framework alignment

- **SFDR (EU) 2019/2088 + RTS (EU) 2022/1288** — the periodic-report fields (proportion of
  investments, top-15 table, sector/geography, PAI table with YoY comparison) follow the RTS
  Annex II/IV periodic templates the docstring cites.
- **EU Taxonomy Regulation 2020/852** — taxonomy-aligned percentages are consumed as inputs; the
  six environmental objectives are represented by the simplified 60/30/10 split.
- **EU Paris-Aligned / Climate-Transition Benchmark exclusions** — referenced as the basis of the
  thermal-coal rule; PAB actually excludes ≥1 % coal revenue companies, so the module's 10 %/30 %
  encoding is closer to common asset-manager coal policies (e.g. Global Coal Exit List screening).
- **Norwegian GPFG / SVVK-ASIR** — the category set (controversial weapons, tobacco, coal,
  UNGC violations) mirrors the Norges Bank product- and conduct-based exclusion structure.
- **UN Global Compact / OECD MNE Guidelines** — conduct screen implemented as a verified-violation
  boolean, consistent with PAI 10/11's compliance-monitoring framing.
