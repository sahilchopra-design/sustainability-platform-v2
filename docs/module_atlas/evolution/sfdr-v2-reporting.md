## 9 · Future Evolution

### 9.1 Evolution A — Close the REM-38 residue and adopt the family's backend (analytics ladder: rung 1 → 2)

**What.** This tier-B page has two audit findings still open per §7: the main Dashboard fund table and detail side panel render `$` on AUM in an EU SFDR context (the KPI header and Fund Screening table were fixed to `€`), and `PAI_INDICATORS` still lists only 14 of 18 indicators — PAI-15/16 (sovereign) and PAI-17/18 (real estate) are absent, with §7.6 noting PAI-14's label also needs an SME pass. Meanwhile its sibling `sfdr-pai-dashboard` carries the correct 18-row taxonomy and the family's `sfdr_pai_engine` exposes 14 routes this page never calls. Evolution A is hygiene-then-adoption: fix the residue, then make this the product-level (Article 8/9 template) view over the shared engine rather than a third synthetic PAI implementation.

**How.** (1) One-line currency fixes at the two documented `$` sites. (2) Import the sibling's 18-indicator array (explicitly recommended by this page's own §7.6 as the template). (3) Replace the per-fund `paiValues` synthetic draws with `POST /api/v1/sfdr-pai/calculate-all` responses, keeping this page's differentiator — the product-level disclosure templates and the genuine `CarbonCreditContext` feed (`ccReg.pai_1_ghg_offset`, `taxonomy_aligned_pct`), which is real cross-module data worth preserving. (4) Sustainable-investment ratio substantiation becomes scenario-capable: vary the Article 2(17) qualifying screen and show the SI% band.

**Prerequisites.** None external — sibling taxonomy and engine already exist in-repo; the fixed hand-authored `cls` classification array should be retained (it is reproducible, unlike the `sr()` fields). **Acceptance:** zero `$` symbols render on any AUM figure; the indicator list length is 18; a fund's PAI values match a direct engine call.

### 9.2 Evolution B — Product-disclosure template copilot (LLM tier 1)

**What.** The module's purpose is the SFDR Level 2 reporting cycle: pre-contractual and periodic Article 8/9 templates plus website statements. Evolution B is a copilot that walks a user through template completion — "what goes in the 'minimum share of sustainable investments' field for an Article 8+ product?" — answering from the RTS structure the page encodes (`DISCLOSURE_SECTIONS`), the ESMA Q&A corpus, and the fund's computed figures, and drafting the boilerplate-with-numbers sections for review.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/sfdr-v2-reporting/ask`, corpus = this Atlas record plus the disclosure-section catalogue; numeric slots fill only from page state (post-Evolution-A, engine-backed). Template drafts inherit the CarbonCreditContext figures with their provenance labels intact.

**Prerequisites (hard).** Evolution A's currency and indicator fixes first — a copilot drafting regulatory disclosures from a page displaying `$` AUM and a 14-indicator PAI set would compound documented defects into filed documents. **Acceptance:** generated template text never references an indicator absent from the fund's computed set; every figure traces to page state or an engine response.
