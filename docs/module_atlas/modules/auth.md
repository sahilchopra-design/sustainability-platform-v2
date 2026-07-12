# Auth
**Module ID:** `auth` · **Route:** `/auth` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (3 files)
**Components/functions:** `ROLE_COLORS`, `ROLE_LABELS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `res` | `await axios.get(`/api/auth/invite/${token}`, { withCredentials: true });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-computed`
**Shared context buses:** `AuthContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> **No MODULE_GUIDES entry exists for this route family** (`guide: null`), so there is no guide↔code
> reconciliation to perform. This is an infrastructure module — authentication flows, not
> analytics. There are no formulas, seeds, or scoring rubrics; this deep dive documents the three
> flows and their contracts so the atlas is complete.

### 7.1 What the module implements

Three pages under `frontend/src/features/auth/pages/`:

| Page | Route purpose | Backend contract |
|---|---|---|
| `LoginPage.jsx` | Email + password sign-in | `POST /api/auth/login` (via `AuthContext.login`) |
| `InviteAcceptPage.jsx` | Invite-token onboarding: set name + password | `GET /api/auth/invite/:token` → `POST /api/auth/invite/:token/accept` |
| `AccessExpiredPage.jsx` | Static "access expired" notice | none (informational) |

All server calls go through `axios` with `withCredentials: true` (cookie-based session) **and** a
Bearer token: the shared `AuthContext` (`frontend/src/context/AuthContext.jsx`) persists
`session_token` from the login response under `sessionStorage['a2_session_token']` and installs it
as `axios.defaults.headers.common['Authorization'] = 'Bearer <token>'`, restoring it on page
reload so API calls survive refresh within the browser session.

### 7.2 Flow logic (quoted behaviours)

**LoginPage**
- If `user` is already present in context, a `useEffect` immediately redirects to
  `params.get('returnTo') || '/'` with `replace: true` — so `/auth?returnTo=/some/page` round-trips
  deep links through login.
- On submit: `await login(email, password)` then the same `returnTo` redirect; failures surface
  `err.response.data.detail` or the fallback string "Invalid email or password. Please try again."
- No client-side validation beyond HTML input semantics; no rate limiting client-side (that is the
  server's job).

**InviteAcceptPage**
- On mount, `GET /api/auth/invite/${token}` validates the invite and returns the invitee context
  (email/role); invalid or consumed tokens render an error state instead of the form.
- Client-side `validate()` enforces exactly two rules before submit:
  `password.length < 8 → "Password must be at least 8 characters."` and
  `password !== confirmPassword → "Passwords do not match."` The confirm field also gets live
  visual feedback (red border + message while mismatched). Inputs use `autoComplete="new-password"`.
- On success: `POST /api/auth/invite/${token}/accept` with `{ name: name.trim(), password }`.

**AccessExpiredPage**
- Static branded notice ("Your access to the A² Intelligence platform has expired.") shown when
  the server reports an expired account/trial; no API interaction or retry logic on the page.

**AuthContext extras relevant to these pages**
- `GET /api/auth/me` hydrates the session on load; a development fallback fabricates a user with
  `days_remaining: 365, session_token: 'dev-token'` when the backend is unreachable — dev
  convenience, must never ship enabled in production.
- `logout` posts `/api/auth/logout` and swallows failures (`.catch(() => {})`) so the client
  always clears local state.

### 7.3 Walkthrough — invite acceptance end-to-end

1. Admin issues invite (email system, built 2026-04-07 session) → user receives
   `/invite/<token>` link.
2. Page mounts → `GET /api/auth/invite/<token>` → shows invitee email, name + password form.
3. User submits; client checks the two §7.2 rules; server re-validates the token (single-use,
   expiry) and creates the account.
4. Post-accept, the user proceeds to LoginPage; on login the session token is installed and any
   `returnTo` deep link is honoured.

### 7.4 Data provenance & limitations

- **No synthetic data / PRNG** in this module — nothing to flag.
- Password policy is length-only (≥ 8 chars) on the client; complexity, breach checks and hashing
  are server-side concerns not visible from these files. Whatever the server enforces beyond
  length is unknowable from this code.
- Session token in `sessionStorage` (not `localStorage`) limits token lifetime to the tab session,
  but remains readable by any XSS in the app; the parallel cookie (`withCredentials`) is the
  stronger channel if flagged HttpOnly server-side (not verifiable from frontend code).
- The dev fallback user in `AuthContext` (§7.2) bypasses authentication when `/api/auth/me` fails;
  it is gated in code but is the single riskiest line in the module if the gate regresses.
- The expired-access page offers no self-service renewal; recovery is administrative.

### 7.5 Framework alignment

- **OWASP ASVS v4 (V2 Authentication)** — partially reflected: ≥ 8-character minimum matches ASVS
  2.1.1's floor; no client-visible lockout, MFA, or password-strength feedback.
- **RBAC / invite-based provisioning** — accounts exist only via admin-issued single-use invite
  tokens (no open registration), consistent with least-privilege onboarding for an institutional
  platform; roles are attached server-side at invite time.
- **Session management** — dual cookie + Bearer pattern; `sessionStorage` scoping aligns with
  OWASP guidance to prefer session-scoped storage over persistent `localStorage` for tokens when
  cookies cannot carry the whole burden.

## 9 · Future Evolution

### 9.1 Evolution A — Auth hardening to ASVS level 2 (analytics ladder: rung 1 → 1 — infrastructure, not an analytics climb)

**What.** This is an infrastructure module (login, invite-accept, access-expired pages over `AuthContext`), not an analytics engine, so its honest evolution is hardening rather than ladder-climbing. §7.4 names the priorities precisely: the dev fallback in `AuthContext` that fabricates a user with `session_token: 'dev-token'` when `/api/auth/me` is unreachable is "the single riskiest line in the module if the gate regresses"; the password policy is length-only (≥8 chars, ASVS 2.1.1's bare floor); and there is no MFA, lockout feedback, or self-service recovery on the expired page.

**How.** (1) Make the dev fallback structurally unshippable: compile it out of production builds (dead-code elimination on `NODE_ENV`) rather than gating at runtime, and add a CI check that greps the production bundle for the fallback token string — the same guardrail pattern as `check_no_fabricated_random.py`. (2) Raise password policy toward ASVS L2: breach-list check server-side, strength feedback client-side (the invite form's live-validation pattern extends naturally). (3) TOTP-based MFA on the login flow, enforced per-role via the existing RBAC system for admin-tier accounts. (4) Server-side login-attempt telemetry into the audit tables (the platform's `REQUIRE_AUTH=false` dev posture makes this the right moment to define what production auth events look like).

**Prerequisites.** Backend `auth_pg.py` owns most enforcement — coordinate; the platform-wide `REQUIRE_AUTH=true` POST-blocking issue (documented 2026-07-05, pre-existing) must be resolved before production hardening is meaningful. **Acceptance:** production bundle contains no dev-fallback path (CI-verified); an 8-character breached password is rejected; admin login without MFA is refused.

### 9.2 Evolution B — Identity substrate for the LLM tier stack (LLM tier 2 enabler)

**What.** Auth is not a copilot candidate — it is the module every Tier-2/Tier-3 deployment depends on. The productization roadmap's tool-calling contract requires that "the copilot inherits the user's session, never a service account": this module's dual cookie + Bearer pattern (`sessionStorage['a2_session_token']`, axios default header) is the mechanism that must carry LLM tool calls. Evolution B specifies that plumbing.

**How.** (1) Copilot requests to `module_copilot.py` execute tool calls under the requesting user's session, so RBAC middleware evaluates each tool call exactly as if the user clicked the UI — no privilege the user lacks, no separate LLM identity to audit. (2) Scoped short-lived tokens for orchestrated (Tier-3) flows: a desk orchestration spanning modules mints a child token scoped to the modules in its plan, expiring with the conversation, so a runaway agent cannot roam the full API surface. (3) Every LLM-initiated call is tagged in the audit stream (`initiator: llm, conversation_id`) so the audit-trail module can distinguish human clicks from copilot actions — a prerequisite for any assurance story about LLM-assisted workflows. (4) The invite system extends to provision copilot access as a role capability, not a default.

**Prerequisites.** RBAC per-module permissions must be complete enough to gate tool schemas (the Atlas endpoint map supplies the module↔endpoint mapping); audit-table support for the initiator tag. **Acceptance:** a viewer-role user's copilot cannot invoke an admin-gated tool (server-enforced, verified by test); every tool call in an LLM trace carries the human user's identity plus the LLM initiator tag; child tokens expire and cannot call out-of-scope modules.