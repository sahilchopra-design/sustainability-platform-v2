## 9 · Future Evolution

### 9.1 Evolution A — Reconcile real provider values with the advertised deviation rule (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag is double: the guide's Conflict Resolution Score
(`CRS = Σ|vᵢ−v̄|/v̄ × wᵢ`, deviation-plus-reliability election) is not implemented —
the winner is a pure priority-integer sort, with reliability displayed but never
used — and every provider value is *simulated* (djb2-hashed `sRand` noise bands
around a base value), so the module reconciles synthetic disagreements. The
workflow shell is genuinely good: priority registry persisted to config, manual
overrides, a capped resolution history, agreement heatmaps. Evolution A gives it
real inputs and the real election rule.

**How.** (1) Real candidate values: the platform holds genuine multi-source
overlap today — BRSR Supabase (live table), the curated company master, and the
enrichment service (EODHD/Alpha Vantage) all report revenue/market-cap/emissions
for Indian issuers; wire `simulateSourceValue` out and provider reads in.
(2) Election rule: implement the CRS — deviation from the provisional mean weighted
by reliability — with priority as the tiebreaker, so the displayed reliability
scores finally matter; document the rule per §8. (3) Golden records persist
server-side (`golden_records` table) with the winning source, CRS, and override
lineage — the "publish downstream and lock for disclosure" promise requires
persistence beyond `localStorage`. (4) The 10%-spread conflict flag stays; the
guide's illustrative headline rates (82% auto-resolved) become measured outputs.

**Prerequisites (hard).** Simulation purge; provider adapters for the three real
sources; coordination with `data-hub-ingester`'s fusion evolution — reconciliation
(golden record election) and fusion (weighted blend) are different policies over
the same conflict store and must share it, not duplicate it. **Acceptance:** a
real BRSR-vs-enrichment revenue disagreement appears in the queue with genuine
values; the winner reproduces from the documented CRS arithmetic; a locked golden
record survives sessions and reports its lineage.

### 9.2 Evolution B — Override-rationale assistant and restatement drafter (LLM tier 2)

**What.** Two judgment points in this workflow suit an LLM. First, manual
overrides: when a steward overrides the CRS election, the assistant drafts the
rationale from the evidence (values, vintages, known scope/unit mismatches — the
usual true cause of "conflicts"), giving the audit trail the *why* that GRI 2-4 and
ESRS BP-2 restatement disclosures later require. Second, restatements: when a
golden record locked for a prior disclosure changes, the assistant drafts the
GRI 2-4/BP-2 restatement note — what changed, why, and the effect — from the
resolution history the module already keeps.

**How.** Tier-2 read tools over the conflict store, resolution history, and
provider metadata; drafts attach to the override/restatement records pending
steward confirmation. Grounding: the PCAF source-hierarchy guidance and
GRI 2-4/ESRS BP-2 texts §5 cites (refdata additions). The assistant never elects a
winner — it documents elections and overrides humans make, which is exactly the
auditability this module sells.

**Prerequisites (hard).** Evolution A's real conflict store and persistence (a
rationale for a simulated conflict is doubly fictional); regulation texts embedded.
**Acceptance:** every drafted rationale cites the actual candidate values and
vintages; restatement notes reproduce the before/after from the locked history;
drafts require steward sign-off before attaching.
