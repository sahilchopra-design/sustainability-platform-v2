## 9 · Future Evolution

### 9.1 Evolution A — Deliver the promised percentile/z-score engine with coverage reporting (analytics ladder: rung 1 → 3)

**What.** This module is unusual among its siblings: it runs on real fundamentals from `GLOBAL_COMPANY_MASTER` (no `sr()` anywhere), but the §7 mismatch flag shows the guide promises percentile ranks and z-scores that the code never computes — today it offers only medians, means, and one threshold flag (`isHighPE = pe_ratio > medPE × 1.5`). Evolution A closes the guide↔code gap: implement `countLower/(N−1)×100` percentile ranks and peer-group z-scores per pillar metric, and surface the coverage rate that §7.6 notes is currently hidden (companies missing `pe_ratio`/`ghg_intensity`/`roe_pct` are silently dropped, shifting medians invisibly).

**How.** (1) A shared `peerStats(peers, metric)` helper returning {median, mean, sd, percentile(company), n, coverage} — coverage = non-null count ÷ peer-group size, rendered next to every statistic. (2) Winsorised z-scores (clamp at ±3) so a single outlier P/E doesn't dominate small GICS peer groups. (3) Replace the self-labelled "simplified proxy" Paris-2030 sector targets with cited SBTi SDA / TPI benchmark pathways per sector, or at minimum attach the citation gap as an on-page caveat. (4) Flag laggards below the 25th percentile, matching the guide's stated workflow.

**Prerequisites.** None external — data already real; small peer groups (n<5) need an explicit "insufficient peers" state rather than a percentile. **Acceptance:** for a hand-checked GICS group, the rendered percentile equals the countLower formula; every stat displays its coverage denominator.

### 9.2 Evolution B — Peer-comparison narrator with engagement drafting (LLM tier 1)

**What.** A copilot that turns the page's real peer statistics into analyst-ready language: "Company X sits at the 82nd percentile on GHG intensity within Financials, 2.1σ above the peer median — here is the engagement talking point." Because the underlying data is real (unlike most tier-B siblings), this module is one of the safest first candidates for a copilot that discusses named companies — provided it stays strictly within the computed peer set.

**How.** Tier-1 pattern: `POST /api/v1/copilot/sector-benchmarking/ask`, grounding corpus = this Atlas page (§5 formula, §7.2 Paris-target table, §7.6 coverage caveats) plus the live page state (selected sector, computed stats). Engagement-note drafting is template-guided: claim → statistic → peer context → ask, with each statistic linked to the on-page value. The copilot must volunteer the coverage caveat whenever a peer group has dropped companies.

**Prerequisites.** Evolution A's percentile engine — the copilot cannot narrate percentiles that don't exist yet; until then it is limited to median/mean comparisons. **Acceptance:** every percentile or σ figure in an answer matches the page's computed value exactly; asking about a company outside `GLOBAL_COMPANY_MASTER` coverage yields a refusal naming the missing fields.
