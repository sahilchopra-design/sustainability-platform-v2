## 9 · Future Evolution

### 9.1 Evolution A — Server-side client book with real portfolio bindings (analytics ladder: rung 1 → 2)

**What.** §7 reclassifies this module honestly: despite the guide's talk of PCAF
carbon footprints, WACI, ITR, and entitlement filtering, the code is a
`localStorage`-backed **CRM console** — client roster CRUD, SLA/delivery tracker,
framework coverage matrix, fee revenue estimator — with zero carbon arithmetic.
Evolution A does two things in order: (1) promotes the CRM to a backend vertical
(`client_accounts`, `client_deliveries` tables + router) so the book of business
survives browsers and respects RBAC; (2) implements the *binding* the guide promises —
each client account links to one or more `portfolios_pg` portfolios, and the dashboard
surfaces that portfolio's WACI/footprint/ITR **by calling the platform's existing
portfolio-analytics endpoints**, not by reimplementing PCAF math in this page.

**How.** (1) Standard CRUD router with the existing seed clients as fixtures; the
delivery tracker's SLA analytics (`avgImpl`-style lead times) recomputed over DB rows.
(2) `client_portfolio_links(client_id, portfolio_id)` join table; the entitlement
formula the guide cites (`ClientView = PortfolioData ∩ Entitlements`) becomes this
join filtered by the caller's RBAC scope. (3) Guide rewritten to describe portal =
CRM + linked analytics, clearing the §7 flag.

**Prerequisites.** Portfolio-analytics endpoints must be healthy for the linked
metrics (the 2026-07-05 sweep fixed live 500s in that router — verify before binding);
REQUIRE_AUTH posture for the new mutating routes. **Acceptance:** a client's dashboard
WACI equals the portfolio-analytics module's value for the linked portfolio; a user
without entitlement to a portfolio cannot see its metrics through any portal route.

### 9.2 Evolution B — Relationship-desk assistant (LLM tier 2)

**What.** An assistant for the client-servicing workflow: "which clients have SFDR
deliverables due this month?", "summarise Nordfund's delivery history and open
items", "draft the quarterly touch-point note for a client whose portfolio WACI
improved 12%" — list/filter questions as tool calls over the Evolution A CRUD routes,
the drafting task grounded in delivery rows plus the linked portfolio metrics, with
every number validated against tool outputs.

**How.** Tool schemas from the new router (read-only first; delivery-status mutations
gated behind user confirmation); the framework matrix (`ALL_FRAMEWORKS` per
jurisdiction) forms the corpus for obligation questions; client-facing draft text goes
through a review-before-send flow — the assistant proposes, the relationship manager
approves.

**Prerequisites (hard).** Evolution A first: there are no endpoints today, and client
data in `localStorage` is invisible to any server-side assistant. Per-client data
isolation verified so the assistant can never mix two clients' books in one answer.
**Acceptance:** a deadline query reconciles to a SQL filter over deliveries; a drafted
note contains only metrics returned by the portfolio-analytics tool calls it cites.
