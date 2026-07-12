## 9 · Future Evolution

### 9.1 Evolution A — Ground the 15 hand-scored KPIs in source data (analytics ladder: rung 1 → 3)

**What.** This is the cleanest module in the net-zero family: §7 confirms it is entirely hand-authored expert scoring with no PRNG — 15 companies each get 15 KPI scores (0–10) from analyst judgment, and the composite (`Σ scores, 0–150`) with A–E rating (A≥120…E<40) is honest arithmetic. The scores are credible (Orsted 135/A, Shell ~71/C). The limitation is that each KPI is a bare number with no traceable evidence, and the universe is only 15 companies. Evolution A anchors the KPIs to their real sources and widens coverage.

**How.** (1) Wire the KPIs that have public sources to those feeds: SBTi Validation (SBTi registry — a binary/status lookup), CDP Score (CDP public scores), RE Procurement (RE100 disclosures), Lobbying Alignment (InfluenceMap scores) — all four named as standards in §5. Each KPI cell becomes `value + source + as_of` instead of a naked 0–10, so an analyst can audit it. (2) Keep genuinely judgment-based KPIs (board climate expertise, just transition) as expert scores but tag them as such — an honest hybrid. (3) Add companies by templating the same 15-KPI structure, with a validation gate that flags KPIs left unsourced. Backend-optional; can remain tier-B if the sourcing is a build-time data join.

**Prerequisites.** Source-feed access (SBTi/CDP/RE100/InfluenceMap — mostly public); a mapping from each KPI's 0–10 scale to the underlying source metric, documented per Atlas §8. **Acceptance:** at least the four externally-sourced KPIs display their provenance and reconcile to the source; the composite still reproduces `Σ scores`; unsourced KPIs are visibly flagged as expert judgment.

### 9.2 Evolution B — Credibility-index copilot with KPI-level explanation (LLM tier 1)

**What.** A copilot answering "why is Shell rated C?", "which KPIs drag HSBC down?", "compare Microsoft and Iberdrola on CapEx alignment and lobbying" — grounded in the 15 hand-scored (post-Evolution-A, partly sourced) KPIs and the SBTi/CDP/InfluenceMap/RE100 references named in §5. Because the scoring is transparent and additive, this is an ideal tier-1 pilot: every rating decomposes cleanly into 15 visible components.

**How.** System prompt from this Atlas page (§5 KPI list, §7.1 composite/rating logic) plus the serialized `COMPANIES`×`KPIS` score matrix; the copilot explains a rating by naming the specific KPIs above/below the company's average and citing each KPI's source (post-Evolution-A) or flagging it as expert judgment. Served via the roadmap's shared copilot router with prompt caching (static corpus). Refusal path for companies outside the 15-name set and for forward-looking predictions ("will Shell reach A?") the static index does not model.

**Prerequisites.** None hard — the additive scoring is already transparent; Evolution A improves citation quality but tier-1 explanation is safe today provided the copilot labels scores as expert judgment where unsourced. **Acceptance:** every rating explanation reproduces the exact composite and names the driving KPIs; asking about a 16th company refuses rather than extrapolates.
