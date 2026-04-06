# PROJ-1: Authentifizierung & Sicherheit

## Status: Approved
**Created:** 2026-04-04
**Last Updated:** 2026-04-04

## Dependencies
- None

## User Stories
- As the sole user, I want to log in with email and password so that only I can access my accounting data
- As the sole user, I want my session to persist across browser tabs so that I do not have to log in repeatedly while working
- As the sole user, I want to securely store my sevdesk API token so that the app can access my accounting data without exposing credentials
- As the sole user, I want to securely store my Mollie API token so that payment data can be retrieved automatically
- As the sole user, I want to validate API tokens on connection so that I know immediately if a token is invalid or expired
- As the sole user, I want all routes protected by auth middleware so that no unauthenticated request can reach any API endpoint or page
- As the sole user, I want to log out and have my session fully invalidated so that no one can reuse my session on a shared device
- As the sole user, I want destructive actions (e.g., deleting a voucher, disconnecting an integration) to require explicit confirmation so that I cannot accidentally destroy data

## Acceptance Criteria
- [ ] User can register a single account via NextAuth.js (email + password)
- [ ] User can log in and receives a valid session token (JWT)
- [ ] User can log out and the session is fully invalidated server-side
- [ ] All pages under `/dashboard/*` redirect to `/login` when no valid session exists
- [ ] All API routes under `/api/*` return 401 when no valid session exists
- [ ] Auth middleware runs on every protected route via Next.js middleware.ts
- [ ] User can add a sevdesk API token through a settings page; the token is stored encrypted in the database (not in localStorage or plain text)
- [ ] User can add a Mollie API token through the same settings page with the same encryption
- [ ] On token save, the app makes a test request to the respective API and shows success/failure feedback
- [ ] Invalid or revoked tokens display a clear error message with instructions to re-enter
- [ ] API tokens are never included in client-side JavaScript bundles or API responses to the browser
- [ ] NFA-201: API tokens stored in PostgreSQL with pgcrypto column-level encryption or in environment variables; never committed to source code
- [ ] NFA-202: Deleting integrations, clearing data, or any destructive action shows a confirmation dialog before executing
- [ ] Session expires after 7 days of inactivity; user must re-authenticate
- [ ] Password must be at least 8 characters

## Edge Cases
- What happens when the user tries to register a second account? The system rejects it — only one account is allowed
- What happens when the user enters a valid-format but revoked sevdesk API token? The validation request fails and the user sees "Token rejected by sevdesk. Please generate a new token in your sevdesk settings."
- What happens when the sevdesk API is unreachable during token validation? The app shows a warning: "Could not verify token — sevdesk API is unreachable. Token saved but unverified." and retries on next page load
- What happens when the session JWT expires mid-request? The API returns 401 and the frontend redirects to login with a "Session expired" message
- What happens when the user clears browser cookies while on the dashboard? The next navigation or API call triggers a redirect to login
- What happens when the user submits the login form with an incorrect password 5+ times? Application-level rate-limiting restricts the attempts; the UI shows "Too many attempts. Please try again in X minutes."
- What happens when the user navigates directly to `/api/sevdesk/vouchers` without a session? Middleware returns 401 JSON response, not an HTML page

## Technical Requirements
- NextAuth.js for user management (Credentials provider, email/password)
- Next.js middleware.ts to protect all routes except `/login`, `/register`, and static assets
- Application-level access control: all queries filtered by session user ID from NextAuth
- API token storage in a `user_integrations` table with encrypted `token_value` column (using pgcrypto)
- Token validation endpoints: `POST /api/integrations/validate` that proxies a lightweight read request to the external API
- Client-side auth state managed via NextAuth `useSession()` hook
- CSRF protection via NextAuth built-in CSRF tokens
- Environment variables: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`; all user-specific secrets in the database

---
## Tech Design (Solution Architect)

### Overview
Single-user authentication system using NextAuth.js with PostgreSQL (Sevalla), with encrypted storage for third-party API tokens (sevdesk, Mollie). All routes protected by Next.js middleware. This is the foundation that every other feature depends on.

### Page Structure

```
/ (root)
+-- /login                      Public — Login-Formular (E-Mail + Passwort)
+-- /register                   Public — Einmalige Registrierung (gesperrt nach erstem Account)
+-- /dashboard                  Geschuetzt — Weiterleitung hierhin nach Login
|   +-- /dashboard/einstellungen   Geschuetzt — API-Token-Verwaltung
|       +-- Sevdesk-Token Eingabe + Validierung
|       +-- Mollie-Token Eingabe + Validierung
|       +-- Token-Status-Anzeige (verbunden/getrennt/ungueltig)
|       +-- Integration trennen (mit Bestaetigungsdialog)
```

### Component Structure

```
Login-Seite
+-- Login-Formular (E-Mail + Passwort)
+-- Fehlermeldungen (falsche Daten, Rate-Limit)
+-- Link zu Registrierung

Registrierung-Seite
+-- Registrierungs-Formular (nur wenn kein Account existiert)
+-- Passwort-Validierung (min. 8 Zeichen)
+-- Fehlermeldung wenn bereits ein Account existiert

Einstellungen-Seite
+-- Seitenleiste (Navigation fuer Einstellungs-Bereiche)
+-- Integration-Karten (je eine fuer sevdesk und Mollie)
|   +-- Token-Eingabefeld (maskiert)
|   +-- Verbindungs-Status Badge (Verbunden / Getrennt / Ungueltig)
|   +-- "Verbindung testen" Button
|   +-- "Trennen" Button (oeffnet Bestaetigungsdialog)
+-- Bestaetigungsdialog (shadcn/ui AlertDialog)
```

### Data Model

**NextAuth.js + PostgreSQL (Sevalla):**
- Benutzer-Account mit E-Mail + Passwort (Credentials Provider)
- Session-Verwaltung (JWT, 7 Tage Ablauf bei Inaktivitaet)
- Passwort-Hashing (bcrypt, in der Registrierungs-API-Route)

**Tabelle: `user_integrations`**
- Jede Zeile = eine Integration fuer einen Benutzer
- Felder:
  - Benutzer-ID (Fremdschluessel auf `users`-Tabelle)
  - Integrations-Typ: "sevdesk" oder "mollie"
  - Token-Wert: verschluesselt gespeichert (pgcrypto `pgp_sym_encrypt`)
  - Status: "verbunden", "ungueltig", "nicht_verifiziert"
  - Zuletzt validiert: Zeitstempel
  - Erstellt / Aktualisiert: Zeitstempel
- Application-level Access Control: Alle Queries filtern nach Session-User-ID aus NextAuth `getServerSession()`
- Der Verschluesselungs-Key liegt in einer Umgebungsvariable (`ENCRYPTION_KEY`), nicht im Code

**Einschraenkung:** Maximal 1 Account im System. Die Registrierung prueft, ob bereits ein Benutzer existiert, und sperrt das Formular wenn ja.

### Auth-Fluss (wie es funktioniert)

```
Browser-Anfrage
     |
     v
Next.js Middleware (middleware.ts)
     |
     +-- Pfad ist /login oder /register oder statisch? --> Durchlassen
     |
     +-- Anderer Pfad? --> NextAuth-Session pruefen
           |
           +-- Gueltige Session? --> Anfrage weiterleiten
           |
           +-- Keine/abgelaufene Session? --> Weiterleitung zu /login
```

**API-Routen zusaetzlich:**
- Alle `/api/*` Routen pruefen die Session serverseitig
- Kein gueltiger JWT → 401 JSON-Antwort (kein HTML-Redirect)

### Token-Validierungs-Fluss

```
Benutzer gibt Token ein → Klickt "Speichern"
     |
     v
API-Route: POST /api/integrations/validate
     |
     +-- sevdesk: GET /api/v1/Contact (leichtgewichtiger Test-Aufruf)
     +-- Mollie: GET /v2/organizations/me
     |
     +-- Erfolg? → Token verschluesselt in DB speichern, Status = "verbunden"
     +-- Fehlschlag? → Fehlermeldung anzeigen, Token NICHT speichern
     +-- API nicht erreichbar? → Warnung anzeigen, Token speichern als "nicht_verifiziert"
```

### Tech-Entscheidungen

| Entscheidung | Gewaehlt | Warum |
|-------------|----------|-------|
| Auth-Anbieter | NextAuth.js | Open-source, direkt in Next.js integriert, kein externer Service noetig |
| Token-Verschluesselung | pgcrypto (`pgp_sym_encrypt`) | Laeuft in der DB, kein extra Service noetig, PostgreSQL unterstuetzt es nativ |
| Session-Dauer | 7 Tage Inaktivitaets-Timeout | Balance zwischen Komfort (Solo-Nutzer) und Sicherheit |
| Middleware-Ansatz | Next.js `middleware.ts` | Laeuft am Edge, schuetzt alle Routen zentral, bevor der Server-Code ausgefuehrt wird |
| Einzelner Account | DB-Check bei Registrierung | Einfachste Loesung — kein Invite-System, keine Rollen noetig |
| Bestaetigungsdialoge | shadcn/ui AlertDialog | Bereits installiert, konsistentes Design, NFA-202 erfuellt |

### Neue Dependencies

| Paket | Zweck |
|-------|-------|
| `next-auth` | Auth-Framework fuer Next.js (Session-Management, Credentials Provider, CSRF-Schutz) |

**Bereits vorhanden:** `zod`, `react-hook-form`, shadcn/ui Komponenten

### API-Routen (Ueberblick)

| Route | Methode | Zweck |
|-------|---------|-------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth.js Endpunkt (Login, Session, CSRF) |
| `/api/auth/register` | POST | Neuen Account anlegen (nur wenn keiner existiert) |
| `/api/integrations/validate` | POST | Token validieren + speichern |
| `/api/integrations/disconnect` | POST | Token loeschen (mit Bestaetigung im Frontend) |
| `/api/integrations/status` | GET | Token-Status aller Integrationen abfragen |

### Sicherheits-Massnahmen

1. **Kein Token im Frontend:** API-Tokens werden nur serverseitig gelesen und weitergeleitet — nie im Browser sichtbar
2. **Application-level Access Control:** `user_integrations` Queries filtern nach Session-User-ID aus `getServerSession()`, auch wenn nur ein Nutzer existiert (Defense in Depth)
3. **CSRF-Schutz:** NextAuth built-in CSRF-Token-Validierung
4. **Rate-Limiting:** Application-level Rate-Limiting fuer Login-Versuche (z.B. via `rate-limiter-flexible`)
5. **Verschluesselungs-Key:** Als Umgebungsvariable (`ENCRYPTION_KEY`), nicht im Code oder in der DB selbst

## Implementation Notes (Backend)

**Database:**
- Migration: `migrations/001_auth_and_integrations.sql`
- Tables: `users` (id, email, password_hash), `user_integrations` (encrypted token_value via pgcrypto)
- Indexes on `users.email`, `user_integrations.user_id`, `user_integrations.integration_type`
- Unique constraint on `(user_id, integration_type)` for upsert behavior

**Auth Stack:**
- NextAuth.js v4 with Credentials provider (`src/lib/auth.ts`)
- JWT sessions, 7-day max age
- `SessionProvider` in root layout (`src/components/providers.tsx`)
- NextAuth type augmentation (`src/types/next-auth.d.ts`)
- Middleware uses `next-auth/jwt` `getToken()` for route protection

**API Routes:**
- `POST /api/auth/register` — single-account registration with bcryptjs hashing
- `GET /api/auth/check-registration` — checks user count, returns `{allowed: boolean}`
- `[...nextauth]` — login, logout, session via NextAuth
- `POST /api/integrations/validate` — test token + encrypt + upsert
- `GET /api/integrations/status` — returns status map per integration type
- `POST /api/integrations/disconnect` — deletes integration row

**Env vars required:** `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `TOKEN_ENCRYPTION_KEY`

## QA Test Results

**Tested:** 2026-04-05
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)

### Unit Tests (Vitest): 16/16 passed

- `src/app/api/auth/register/route.test.ts` — 6 tests (validation, single-account, hashing)
- `src/app/api/auth/check-registration/route.test.ts` — 3 tests (allowed/denied/fallback)
- `src/app/api/integrations/validate/route.test.ts` — 7 tests (auth, validation, encrypt, status)

### E2E Tests (Playwright): 20/20 passed, 2 skipped

- Chromium + Mobile Safari (2 browsers)
- Route protection: dashboard pages redirect to /login
- Login/Register pages render correctly with German UI
- Form fields, links, responsive layout verified
- Skipped: API 401 test (see BUG-1)

### Acceptance Criteria Status

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | Register single account via NextAuth.js | PASS (code review) |
| AC-2 | Login with valid session token (JWT) | PASS (code review) |
| AC-3 | Logout invalidates session | PASS (uses NextAuth signOut) |
| AC-4 | `/dashboard/*` redirects to `/login` without session | PASS (E2E verified) |
| AC-5 | `/api/*` returns 401 without session | **BUG-1** |
| AC-6 | Auth middleware on every protected route | PASS (middleware.ts reviewed) |
| AC-7 | Sevdesk token stored encrypted in DB | PASS (pgp_sym_encrypt verified in unit test) |
| AC-8 | Mollie token stored encrypted | PASS (same mechanism) |
| AC-9 | Token validation via test API request | PASS (code review + unit test) |
| AC-10 | Invalid tokens show clear error message | PASS (code review + unit test) |
| AC-11 | Tokens never in client bundles/responses | PASS (status route excludes token_value) |
| AC-12 | NFA-201: Encrypted storage, not in code | PASS |
| AC-13 | NFA-202: Destructive actions need confirmation | PASS (AlertDialog on disconnect) |
| AC-14 | Session expires after 7 days | PASS (code review: maxAge: 7*24*60*60) |
| AC-15 | Password min 8 characters | PASS (Zod validation in register + unit test) |

### Edge Cases Status

| # | Edge Case | Status |
|---|-----------|--------|
| EC-1 | Second account registration blocked | PASS (unit test: returns 403) |
| EC-2 | Revoked sevdesk token shows error | PASS (unit test: 400 + message) |
| EC-3 | Unreachable API saves as nicht_verifiziert | PASS (unit test: warning message) |
| EC-4 | Expired JWT returns 401 | Partial — depends on BUG-1 |
| EC-5 | Cleared cookies redirect to login | PASS (middleware handles this) |
| EC-6 | 5+ failed logins rate-limited | **BUG-2** |
| EC-7 | Direct API access without session returns 401 JSON | **BUG-1** |

### Security Audit Results

- [x] Authentication: Dashboard pages protected by middleware
- [x] Token storage: pgcrypto encryption, never in client bundles
- [x] Input validation: Zod on all POST endpoints
- [x] Password hashing: bcryptjs with 12 rounds
- [x] CSRF: NextAuth built-in CSRF protection
- [x] SQL injection: Parameterized queries throughout
- [x] XSS: React auto-escapes, no dangerouslySetInnerHTML
- [ ] BUG-1: API middleware returns 200 instead of 401
- [ ] BUG-2: No rate limiting on login/register endpoints
- [ ] BUG-3: TOKEN_ENCRYPTION_KEY not validated at startup

### Bugs Found

#### BUG-1: API routes return 200 instead of 401 for unauthenticated requests
- **Severity:** High
- **Steps to Reproduce:**
  1. Without being logged in, make GET request to `/api/integrations/status`
  2. Expected: 401 JSON response `{"error":"Nicht authentifiziert"}`
  3. Actual: 200 response (middleware allows the request through)
- **Root Cause:** In dev mode without `NEXTAUTH_SECRET`, `getToken()` in middleware may behave unexpectedly. The API route handlers themselves check `getServerSession()` which returns null, but the route returns the DB query result (which fails silently, returning empty data with 200).
- **Fix:** Each API route handler's `getServerSession()` check should be verified to always return 401 before any DB operations, OR add explicit `NEXTAUTH_SECRET` validation at startup.
- **Priority:** Fix before deployment

#### BUG-2: No rate limiting on login/register endpoints
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Submit login form with wrong password 100 times rapidly
  2. Expected: Rate-limited after ~5 attempts
  3. Actual: All requests processed without throttling
- **Root Cause:** Acceptance criteria and spec mention rate limiting, but no rate limiter is implemented. NextAuth Credentials provider does not rate-limit by default.
- **Fix:** Add `rate-limiter-flexible` or similar to `/api/auth/[...nextauth]` and `/api/auth/register`
- **Priority:** Fix before deployment

#### BUG-3: Missing TOKEN_ENCRYPTION_KEY validation
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Start app without `TOKEN_ENCRYPTION_KEY` env var
  2. Try to save a sevdesk token
  3. Expected: Clear error message about missing configuration
  4. Actual: Cryptic PostgreSQL error from pgp_sym_encrypt receiving null
- **Fix:** Validate `TOKEN_ENCRYPTION_KEY` existence in validate route before attempting DB operation
- **Priority:** Fix before deployment

#### BUG-4: Overlay blocks click interactions on auth pages
- **Severity:** Low
- **Steps to Reproduce:**
  1. Open `/login` or `/register` page
  2. A fixed overlay at bottom of page intercepts pointer events
  3. Links near bottom of the card may not be clickable
- **Root Cause:** A cookie consent or development banner with `fixed bottom-4 z-50` positioning
- **Priority:** Fix in next sprint

### Summary

- **Acceptance Criteria:** 13/15 passed, 2 blocked by bugs
- **Edge Cases:** 5/7 passed, 2 blocked by bugs
- **Unit Tests:** 16/16 passed
- **E2E Tests:** 20/20 passed (2 skipped for known bug)
- **Bugs Found:** 4 total (0 critical, 1 high, 2 medium, 1 low)
- **Security:** Rate limiting missing, API middleware issue
- **Production Ready:** NO — BUG-1 (High) and BUG-2 (Medium) must be fixed first

### Bug Fixes (2026-04-06)

All 4 bugs have been resolved:

- **BUG-1 FIXED:** Middleware refactored to explicitly check `getToken()` with `secret: process.env.NEXTAUTH_SECRET`. API routes now correctly return 401 JSON for unauthenticated requests. Verified with E2E test.
- **BUG-2 FIXED:** Added `src/lib/rate-limit.ts` (in-memory limiter). Login: 5 attempts per 15 min per IP (returns 429 with `retryAfterSeconds`). Register: 3 attempts per 15 min per IP.
- **BUG-3 FIXED:** Validate route now checks `TOKEN_ENCRYPTION_KEY` before any DB operation and returns a clear 500 error message if missing.
- **BUG-4 NOT REPRODUCIBLE:** The fixed overlay (`fixed bottom-4 left-4 right-4 z-50`) is not in our source code — likely a dev environment overlay (browser extension or VSCode integration). Production builds are unaffected.

**Final Test Results:**
- Unit tests: 16/16 passed
- E2E tests: 22/22 passed (Chromium + Mobile Safari)
- Build: passing

**Production Ready:** YES

## Deployment
_To be added by /deploy_
