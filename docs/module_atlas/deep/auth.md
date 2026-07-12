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
