## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes **transformer-based NLP sentiment
> scoring** (`Sentiment = softmax(W·h_CLS + b)`) over investor calls, ESG questionnaires and
> social media, with a `Engagement_index = Response_rate × avg(Sentiment)`. **None of that
> exists.** The code is a **deterministic rules-based stewardship engine**: 20 engagement rules
> are evaluated against portfolio holdings to trigger prioritised engagements and auto-generate
> letters. No BERT, no softmax, no sentiment, no response-rate tracking. Sections document the
> code as written.

### 7.1 What the module computes

For each of up to 80 portfolio holdings (loaded from `localStorage` portfolio, else the first 80
of `GLOBAL_COMPANY_MASTER`), the engine evaluates 20 engagement rules and scores the company:

```
triggered   = rules.filter(r => r.enabled && evalCondition(r.condition, company, peers))
totalScore  = Σ PRIORITY_SCORE[r.priority]        // Critical 4 · High 3 · Medium 2 · Low 1
urgency     = 'Immediate' if totalScore > 10 · 'Quarter' if > 5 · else 'Annual'
topAction   = action of the highest-priority triggered rule
```

Only companies with ≥1 triggered rule enter the `needsEngagement` register.

### 7.2 Parameterisation — the 20-rule library

`DEFAULT_RULES` spans 6 categories (weights = trigger counts): Climate (4), ESG (3),
Disclosure (3), Governance (3), Social (4), Nature (3). Each rule has a trigger description,
a `condition` key, priority, an escalation ladder (e.g. "Letter > Meeting > Proxy vote"), a
target KPI and a full **letter template** with interpolation placeholders. Examples:

| Rule | Trigger | Priority | Condition logic |
|---|---|---|---|
| R03 | GHG intensity > 500 tCO₂e/$M | Critical | `ghg_intensity > 500` (deterministic) |
| R01 | No SBTi commitment | High | `!sbti_committed && sRand > 0.35` |
| R02 | Net-zero absent or > 2060 | High | `!target_year \|\| target_year > 2060` |
| R05 | ESG score < 40 | Medium | `esg_score < 40` (deterministic) |
| R06 | ESG bottom quartile of sector | Medium | `esg_score < 25th-pctile(sector peers)` |
| R18 | No deforestation policy (high-risk sector) | High | sector ∈ {Materials, Consumer Staples, Energy} && `sRand > 0.5` |

**Provenance of conditions:** some are *data-driven* off enriched company fields
(`ghg_high`, `transition_high`, `esg_low`, `esg_bottom_q`, `scope_missing`, `data_quality_low`,
`netzero`); the rest are **seeded coin-flips** — `evalCondition` calls
`sRand(hash(company_name) + offset) > threshold`, a deterministic-per-company pseudo-random
gate (e.g. `no_tcfd` fires when `sRand(s+203) > 0.55`). So a company's flag set is stable across
renders but partly synthetic.

### 7.3 Calculation walkthrough

1. **Enrichment (`enrichEng`):** any missing company field is filled from the PRNG
   `sRand(s)=frac(sin(s+1)×10⁴)` seeded on the DJB2 hash of the company name — e.g. `esg_score =
   20 + sRand·70`, `ghg_intensity = 5 + sRand·800`, `carbon_neutral_target_year` present with
   p≈0.6.
2. **Scoring:** each enabled rule's condition is tested; priority points summed to `totalScore`;
   urgency bucketed at the 10/5 thresholds.
3. **KPIs:** count needing engagement, count with any Critical/High rule, `avgScore` over the
   register, and `topIssue` = most frequently triggered trigger across the portfolio.
4. **Letter generation (`fillTemplate`):** the selected rule's template is interpolated with the
   company's live fields, including a computed `[SECTOR_AVG]` GHG intensity (mean over sector
   peers) so the letter cites a real peer benchmark.
5. **Persistence:** rule enable/priority overrides and engagement history are saved to
   `localStorage` (`ra_engagement_rules_v1`, `ra_stewardship_v1`).

### 7.4 Worked example — company scoring

A Materials company with `ghg_intensity = 620`, `esg_score = 35`, `transition_risk = 74`,
`scope2_mt = 0`, and (from its seeded gates) no-TCFD and deforestation flags set:

| Triggered rule | Priority | Points |
|---|---|---|
| R03 GHG > 500 | Critical | 4 |
| R04 transition risk > 70 | High | 3 |
| R10 No TCFD | High | 3 |
| R05 ESG < 40 | Medium | 2 |
| R08 Missing Scope 2 | Medium | 2 |
| R18 No deforestation policy | High | 3 |
| **totalScore** | | **17** |

17 > 10 → urgency **Immediate**; `topAction` = R03's "Urgent decarbonization engagement"
(highest priority). The R03 letter interpolates the company's 620 GHG intensity against its
sector-average benchmark.

### 7.5 Data provenance & limitations

- **Rule *logic* is real and professionally drafted** (SBTi, net-zero 2050/interim-42%, TCFD
  four pillars, TNFD, NDPE deforestation, modern slavery) — the letter templates are genuinely
  usable stewardship correspondence.
- **Company data is largely synthetic:** absent fields are PRNG-filled, and ~11 of 20 conditions
  are seeded coin-flips rather than data tests, so trigger sets are plausible-looking but not
  fully evidence-based.
- **No sentiment/NLP anywhere:** the guide's transformer sentiment scoring and engagement index
  are absent; there is no response-rate tracking, no stakeholder-cohort analysis, no social-media
  ingestion.
- Priority weights (4/3/2/1) and urgency thresholds (10/5) are platform choices without external
  citation; the escalation ladders are illustrative, not enforced workflow.

### 7.6 Framework alignment

- **PRI Active Ownership 2.0 / stewardship codes (UK Stewardship Code, ICGN)** — the
  trigger→engage→escalate model (letter → meeting → proxy vote → filing/divestment) mirrors
  standard escalation frameworks for investor stewardship.
- **SBTi** — R01/R02 encode SBTi commitment and the net-zero-by-2050 / interim-2030 (−42%)
  ambition tests directly.
- **TCFD / TNFD** — R10/R20 request four-pillar TCFD and TNFD-aligned nature disclosure.
- **GRI / SASB** — R07 requests GRI/SASB-aligned sustainability reporting; the guide cites
  GRI 2-29 stakeholder engagement, which frames the engagement register even though the
  quantitative engagement index is not computed.
- **CDP** — R08's escalation ends in a "CDP request", reflecting real disclosure-campaign
  practice. The engine's value is the codified rule library, not an AI model.
