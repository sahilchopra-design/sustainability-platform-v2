## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's headline metric is
> `SEII = Σ(ScoreΔ × Spend Weight) / Σ Spend Weight` — a spend-weighted average ESG score
> *improvement*. **No such index is computed anywhere in the code.** The per-supplier
> `improvementRate` field (shown as the "Avg Score Improvement" style metric) is an **independent
> random draw** (`Math.round(-5+s(88)*25)`), not derived from each supplier's own `history` quarterly
> trend — despite the fact that a genuine 12-quarter score history already exists per supplier and
> could trivially compute a real Δscore. Separately, the code computes both an **unweighted**
> `composite` (simple mean of 6 dimensions) and a **weighted** `weighted` score (using real
> `DIM_WEIGHTS`), but supplier **tier assignment uses only the unweighted `composite`** — the
> weighted score is computed but never used for classification.

### 7.1 What the module computes

150 synthetic suppliers, each with 6 independently `sr()`-seeded ESG dimension scores
(Environmental, Social, Governance, Climate, Human Rights, Transparency):

```
scores[d]  = round(30 + s(d×7+3)×65)                              // 30–95, one per dimension
composite  = round(mean(scores))                                    // simple average — DRIVES TIER
weighted   = round(Σ scores[d]×DIM_WEIGHTS[d])                       // real weights [0.20,0.15,0.15,0.20,0.15,0.15] — COMPUTED BUT UNUSED FOR TIER
tier       = composite≥85 Platinum | ≥70 Gold | ≥55 Silver | ≥40 Bronze | else Red
history[12 quarters] = clamp(15,98, composite−10 + s(q×13+50)×20)   // quarterly path around composite
improvementRate = round(−5 + s(88)×25)                              // INDEPENDENT of `history`, not a real Δ
```

40 synthetic engagement records (`engagements`) each linked to a random supplier, with a 6-stage
pipeline (`Assessment→Questionnaire Sent→Response Received→Gap Analysis→Corrective Action→Verified`)
and synthetic activity logs. 40 synthetic corrective-action records (`actions`) with milestones,
severity (Critical/High/Medium/Low via `sr()` thresholds), and progress updates.

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| ESG dimension scores | 30–95 | Synthetic |
| `DIM_WEIGHTS` (Env 0.20, Soc 0.15, Gov 0.15, Climate 0.20, HR 0.15, Transparency 0.15) | Sum to 1.00 | Real, sensible weighting scheme (Environmental and Climate weighted highest) — but structurally disconnected from `tier` |
| `TIER_THRESHOLDS` (Platinum≥85, Gold≥70, Silver≥55, Bronze≥40, Red<40) | — | Reasonable 5-tier scheme, mirrors real supplier-rating platforms (e.g. EcoVadis medal tiers) conceptually |
| `improvementRate` | −5 to +20 pts | Synthetic, independent of `history` |

### 7.3 Calculation walkthrough

1. **Supplier generation** — 150 suppliers with dimension scores, composite, weighted score, tier,
   12-quarter history, certifications (`CERT_TYPES` filtered via `sr()>0.55`), flagged risk categories
   (`RISK_CATEGORIES` filtered via `sr()>0.65`).
2. **Filtering/sorting** — by industry, tier, country, spend, risk.
3. **Portfolio KPIs** — `filteredAvg = round(mean(composite))` over filtered suppliers (again the
   unweighted composite, not spend-weighted as the guide's SEII would require);
   `filteredTotalSpend = Σ spend`.
4. **Engagement funnel** — `stageCounts` (count of engagements per of the 6 stages),
   `avgTimeByStage` (mean `daysInStage` per stage), `completionRate = count(stageIdx≥5)/total×100`.
5. **Corrective action tracking** — `avgEffectiveness`, `effectivenessByType` (grouped by
   `ACTION_TYPES`), `industryBenchmarks` (per-industry aggregate).
6. **Peer comparison** — for a selected supplier, `peers = suppliers.filter(sameIndustry).sort(by
   composite).slice(0,10)`.

### 7.4 Worked example — Supplier-001 (index 0)

```
s(n) = sr(0×100+n) = sr(n)
scores[0..5] = round(30+sr(3+d×7)×65) for d=0..5
composite = round(mean(scores))
weighted  = round(Σ scores[d]×DIM_WEIGHTS[d])
```

Because `DIM_WEIGHTS` gives Environmental and Climate a combined 40% (vs. their 33.3% share under
equal weighting) while Social/Governance/HR/Transparency are each slightly down-weighted (15% vs.
16.7%), `weighted` will differ from `composite` by up to a few points whenever a supplier's
Environmental/Climate scores diverge from its other four dimensions — but since `tier` reads only
`composite`, a supplier with strong E/Climate performance and weak S/G/HR/Transparency performance
gets **no tier credit** for the platform's own stated dimension-importance weighting.

### 7.5 Companion analytics

- **Engagement pipeline funnel** — genuinely computed stage counts and average days-in-stage from
  the 40 synthetic engagement records.
- **Certification/risk flags** — per-supplier boolean flags for 8 real certification schemes (ISO
  14001, ISO 45001, SA8000, FSC, GRI Verified, CDP A-List, B-Corp, Fair Trade) and 6 real risk
  categories — descriptive, independently drawn, not derived from the dimension scores.

### 7.6 Data provenance & limitations

- All supplier, engagement, and action data is synthetic (`sr()`-seeded); no CDP Supply Chain or
  EcoVadis-style real assessment data is ingested.
- **Two fixable inconsistencies found while grounding this section in code:** (1) `weighted` score
  is computed but never used — either wire `tier` off `weighted` or remove the unused field; (2)
  `improvementRate` should be computed as `history[11].value − history[0].value` (a real quarter-over-
  quarter delta already available) rather than an independent random draw, and the guide's SEII
  (spend-weighted average of that delta) is not computed at all despite being the module's headline
  formula.

**Framework alignment:** CDP Supply Chain Programme (named in guide, not ingested) · SBTN Science
Based Targets for Nature (named, not implemented) · OECD Due Diligence Guidance (conceptual only) ·
GRI 308/414 Supplier Assessments (real standard names referenced via `CERT_TYPES`, not scored against
actual GRI criteria).
