# Api::Sfdr_Exclusion
**Module ID:** `api::sfdr_exclusion` · **Route:** `/api/v1/sfdr-compliance` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sfdr-compliance/periodic-report` | `generate_periodic_report` | api/v1/routes/sfdr_exclusion.py |
| POST | `/api/v1/sfdr-compliance/screen` | `screen_holdings` | api/v1/routes/sfdr_exclusion.py |
| GET | `/api/v1/sfdr-compliance/exclusion-rules` | `get_exclusion_rules` | api/v1/routes/sfdr_exclusion.py |
| GET | `/api/v1/sfdr-compliance/pai-reference` | `get_pai_reference` | api/v1/routes/sfdr_exclusion.py |

### 2.3 Engine `exclusion_list_engine` (services/exclusion_list_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ExclusionListEngine.screen_fund` | fund_id, fund_name, sfdr_classification, holdings | Screen all holdings against applicable exclusion rules. |
| `ExclusionListEngine.get_rules` | sfdr_classification | Return all applicable rules for a given SFDR classification. |
| `ExclusionListEngine._get_applicable_rules` | sfdr | Filter default + custom rules by SFDR classification. |
| `ExclusionListEngine._screen_holding` | h, rules, sfdr | Screen a single holding against all applicable rules. |
| `ExclusionListEngine._check_standard_rule` | h, category, rule | Check a single standard exclusion rule. |

### 2.3 Engine `sfdr_report_generator` (services/sfdr_report_generator.py)
| Function | Args | Purpose |
|---|---|---|
| `SFDRReportGenerator.generate` | fund | Generate complete SFDR periodic report data. |
| `SFDRReportGenerator._calculate_proportions` | holdings | Calculate SFDR proportion of investments breakdown. |
| `SFDRReportGenerator._sector_breakdown` | holdings | Aggregate holdings by sector. |
| `SFDRReportGenerator._geography_breakdown` | holdings | Aggregate holdings by country. |
| `SFDRReportGenerator._pai_summary` | current, prior | Generate PAI summary rows with YoY comparison. |

**Engine `sfdr_report_generator` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `ART8_SECTIONS` | `['environmental_social_characteristics', 'investment_strategy', 'proportion_of_investments', 'top_investments', 'sector_breakdown', 'geography_breakdown', 'sustainability_indicators', 'pai_summary', 'taxonomy_alignment']` |
| `PAI_INDICATOR_NAMES` | `{'PAI_1': ('GHG Emissions Scope 1', 'tCO2e'), 'PAI_2': ('GHG Emissions Scope 2', 'tCO2e'), 'PAI_3': ('GHG Emissions Scope 3', 'tCO2e'), 'PAI_4': ('Carbon Footprint', 'tCO2e/MEUR invested'), 'PAI_5': ('GHG Intensity (WACI)', 'tCO2e/MEUR revenue'), 'PAI_6': ('Fossil Fuel Exposure', '%'), 'PAI_7': ('No` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sfdr-compliance/exclusion-rules** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sfdr_classification', 'rules'], 'n_keys': 2}`

**GET /api/v1/sfdr-compliance/pai-reference** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pai_indicators', 'art8_report_sections', 'art9_report_sections'], 'n_keys': 3}`

**POST /api/v1/sfdr-compliance/periodic-report** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sfdr-compliance/screen** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `sfdr_report_generator` — extracted transformation lines:**
```python
waci = sum(h.weight_pct / 100.0 * h.carbon_intensity for h in holdings)
avg_esg = sum(h.weight_pct / 100.0 * h.esg_score for h in holdings)
dnsh_pct = dnsh_wt / total_weight * 100 if total_weight > 0 else 0.0
tax_wt = sum(h.weight_pct * h.taxonomy_aligned_pct / 100.0 for h in holdings)
env_wt = sum(h.weight_pct * h.sustainable_environmental_pct / 100.0 for h in holdings)
soc_wt = sum(h.weight_pct * h.sustainable_social_pct / 100.0 for h in holdings)
tax_pct = tax_wt / total_weight * 100
env_pct = env_wt / total_weight * 100
soc_pct = soc_wt / total_weight * 100
not_sus = max(0, 100.0 - tax_pct - env_pct - soc_pct)
taxonomy_env_objective_1_pct=round(tax_pct * 0.6, 2),
taxonomy_env_objective_2_pct=round(tax_pct * 0.3, 2),
taxonomy_other_objectives_pct=round(tax_pct * 0.1, 2),
sus = h.taxonomy_aligned_pct + h.sustainable_environmental_pct + h.sustainable_social_pct
yoy = round((curr - prev) / abs(prev) * 100, 2)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Evidence-backed screening and honest taxonomy-objective splits (analytics ladder: rung 2 → 3)

**What.** Two engines: `exclusion_list_engine` screens holdings against 7 standard
negative-screening categories plus custom rules (hard breach at zero-threshold, soft otherwise,
`breached_weight_pct` de-duplicated), and `sfdr_report_generator` computes the quantitative core of
an Art 8/9 periodic report (look-through taxonomy/sustainable splits, WACI, top-15, PAI YoY). One
§5 line deserves scrutiny: the taxonomy-objective breakdown is fabricated proportionally —
`objective_1 = tax_pct × 0.6, objective_2 × 0.3, other × 0.1` — a fixed split presented as an
objective allocation. Screening inputs (revenue shares per category) are also caller-asserted. Both
POST endpoints trace **failed/skipped**. Evolution A fixes these.

**How.** (1) Replace the fixed 60/30/10 objective split with the actual per-objective alignment from
`eu_taxonomy_activities` (the evidence table `gar` and `pcaf_regulatory` use), or return honest
nulls when activity-level data is absent — a fixed split is exactly the fabrication pattern the
platform has been purging. (2) Back exclusion screening with evidence: coal revenue from
`sat_coal_checker`/GEM data, controversies from `gdelt_controversy`, so breaches cite a source
rather than only self-declared shares. (3) Repair `POST /screen` (failed) and `/periodic-report`
(skipped). (4) Bench-pin WACI, the look-through splits, and breach weighting.

**Prerequisites.** `eu_taxonomy_activities` linkage; evidence-source integrations; the two POST
endpoints repaired. **Acceptance:** objective splits derive from activity data or return null (never
the 60/30/10 constant); breaches carry an evidence source where available; both POSTs return
`passed`; report quantities bench-pinned.

### 9.2 Evolution B — Exclusion-screening and periodic-report copilot (LLM tier 2)

**What.** A copilot that screens a fund — "which holdings breach our Article 9 exclusions and how
much weight is affected?" (calling `/screen` and citing per-holding breaches and the de-duplicated
`breached_weight_pct`) — then assembles the periodic report via `/periodic-report`, narrating WACI,
sustainable-investment proportions, and PAI year-on-year moves.

**How.** Two POST engines plus two reference GETs (`/exclusion-rules` scoped by SFDR classification,
`/pai-reference` with report sections) that ground every rule and threshold. The hard/soft severity
distinction drives the copilot's escalation language; what-ifs ("drop the two hard-breach names")
re-run the screen statelessly and quote the new breached weight. Pairs with `sfdr_annex` (which
templates the same report) and `fund_management`. Node for a fund-compliance desk.

**Prerequisites.** Evolution A's endpoint repair is mandatory; the objective-split fix before the
copilot narrates taxonomy objectives (it would otherwise present the 60/30/10 constant as fund
data). **Acceptance:** every breach, weight, and report figure traces to a tool response; the
copilot names the rule and threshold behind each breach from `/exclusion-rules`; it flags
self-declared vs evidence-backed inputs and refuses to confirm Art 8/9 compliance beyond the
computed screen.