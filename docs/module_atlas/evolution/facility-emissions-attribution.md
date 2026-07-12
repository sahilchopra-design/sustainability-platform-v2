## 9 · Future Evolution

### 9.1 Evolution A — Multi-year facility trends and verified ownership registry (analytics ladder: rung 2 → 3)

**What.** Today the module is one of the platform's genuinely live pages — the `climate_trace.py` backend proxies Climate TRACE v6 asset-level emissions (verified live in §7), and the frontend layers two honest local calculators: ownership attribution (facility × user-set equity %) and the measured-vs-disclosed gap. Its documented weakness is that both calculators are entirely user-driven — ownership shares and the disclosed Scope 1 total are unverified free inputs. Evolution A benchmarks them: pull multi-year Climate TRACE data (the v6 API serves 2015–2024) to compute per-facility emission trajectories, and resolve facility owners against the platform's GLEIF `entity_lei` layer so ownership percentages start from a sourced default instead of a blank slider.

**How.** (1) Extend the `/api/v1/climate-trace` proxy to accept a year range and cache annual snapshots in a `climate_trace_assets` table (new ingester following the platform's 19-ingester scaffold). (2) Compute YoY facility deltas and flag facilities whose trend contradicts the company's disclosed reduction claims. (3) Join Climate TRACE's `owners` field to GLEIF LEIs; render provenance badges (sourced vs user-override), mirroring the `resolution_tier` convention.

**Prerequisites.** GLEIF bulk ingest at scale (roadmap D0 — `entity_lei` was found nearly empty); Climate TRACE rate-limit handling for multi-year pulls. **Acceptance:** a facility card shows a 3+ year emissions series reproducible by direct API call, and ownership defaults display their source; the demo fallback stays badged "○ Demo".

### 9.2 Evolution B — Disclosure-gap interrogation copilot (LLM tier 2)

**What.** A copilot that operates the gap analysis conversationally: "compare Company X's disclosed Scope 1 against Climate TRACE for their Polish power assets" becomes tool calls — fetch facilities via the Climate TRACE proxy, apply ownership shares, compute `gapT`/`gapPct` exactly as the page does — followed by a narration that distinguishes measurement-basis explanations (GWP horizon, boundary, equity vs operational control) from genuine under-reporting signals.

**How.** Expose the proxy endpoint plus a small server-side attribution function (port of the page's `attributed` reducer, so the LLM never does the arithmetic) as tools. Ground the system prompt in §7's own caveats — it already documents that Climate TRACE uses co2e_100yr and that the comparison is only as good as the ownership inputs — so the copilot leads with those caveats rather than asserting greenwashing. Cross-link to `greenwashing-detection` for escalation.

**Prerequisites.** The attribution reducer moved server-side (currently frontend-only — a tier-B trait this evolution partially lifts); Tier-1 corpus embedding. **Acceptance:** every tonnage in a copilot answer matches a logged Climate TRACE response or the attribution tool's output; asked about Scope 2/3 (which Climate TRACE assets don't provide here), it states the module doesn't compute them.
