# PROJ-3: Sevdesk API-Grundlage

## Status: Planned
**Created:** 2026-04-04
**Last Updated:** 2026-04-04

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Sicherheit) — for stored API token

## User Stories
- As the sole user, I want the app to connect to sevdesk via its REST API so that my accounting data is automatically available
- As the sole user, I want the app to handle sevdesk API rate limits gracefully so that requests do not fail silently during bulk operations
- As the sole user, I want to retrieve my transactions, vouchers, invoices, and contacts from sevdesk so that I can view and process them in the dashboard
- As the sole user, I want to upload PDF documents as vouchers to sevdesk so that I can digitize receipts without logging into sevdesk directly
- As the sole user, I want to book amounts against vouchers and invoices so that my bookkeeping stays up to date from within the app
- As the sole user, I want the app to correctly interpret sevdesk's reversed creditDebit convention so that income and expenses are never swapped
- As the sole user, I want failed API calls to retry automatically so that transient network issues do not cause data loss or require manual intervention

## Acceptance Criteria
- [ ] A sevdesk API client module exists at `src/lib/sevdesk/client.ts` that handles authentication, request construction, and response parsing
- [ ] The client authenticates using the API token stored in the database (PROJ-1); the token is retrieved server-side only and never sent to the browser
- [ ] Rate limiting is enforced at ~100 requests per minute; the client queues excess requests and processes them when capacity is available
- [ ] Failed requests retry up to 3 times with exponential backoff (1s, 2s, 4s) as specified in NFA-104
- [ ] After 3 failed retries, the error is logged with full context (endpoint, status code, response body) and surfaced to the caller
- [ ] TypeScript data models exist for: Transaction, Voucher, VoucherPosition, Invoice, Contact, CheckAccount — matching the sevdesk API v1 schema
- [ ] The creditDebit mapping is correctly implemented: `C` = Ausgabe (expense), `D` = Einnahme (income) — with explicit code comments warning about the reversed convention
- [ ] VoucherPosition creation uses `sumNet` (not `sum`) to avoid 422 errors from the sevdesk API
- [ ] taxRule fields are serialized as objects `{"id": N}` not as strings or numbers
- [ ] CRUD operations are implemented for Vouchers: create, read (single + list with pagination), update, delete
- [ ] CRUD operations are implemented for Transactions: read (single + list with filters by date range and CheckAccount)
- [ ] CRUD operations are implemented for Contacts: read (single + list with search by name/company), create
- [ ] Voucher file upload workflow works: upload PDF via `POST /Voucher/Factory/uploadTempFile`, then create voucher via `POST /Voucher/Factory/createVoucherFromFile`
- [ ] Booking operations work: `bookAmount` for both Voucher and Invoice entities
- [ ] All monetary amounts are handled as numbers with exactly 2 decimal places; no floating-point rounding errors (use string-based or integer-cent math where needed)
- [ ] Pagination is handled transparently: list methods accept optional `limit` and `offset` parameters, defaulting to fetching all records

## Edge Cases
- What happens when the sevdesk API returns a 429 (rate limit exceeded)? The client pauses all queued requests, waits for the `Retry-After` header duration (or 60 seconds if absent), then resumes
- What happens when the API token is revoked or invalid (401 response)? The client stops retrying, marks the integration as disconnected in the database, and surfaces an error to the UI: "Sevdesk-Token ungueltig. Bitte in den Einstellungen erneuern."
- What happens when sevdesk returns a 422 for a VoucherPosition because `sum` was used instead of `sumNet`? This should never happen because the client enforces `sumNet`, but if it does, the error message includes the sevdesk validation details for debugging
- What happens when a PDF upload succeeds but the subsequent createVoucherFromFile call fails? The client logs the orphaned temp file ID and returns an error; a cleanup job can be added later
- What happens when sevdesk returns paginated results with >1000 items? The client automatically fetches all pages using offset-based pagination and merges results before returning
- What happens when the sevdesk API is completely down (connection timeout)? After 3 retries with backoff, the client throws a `SevdeskUnavailableError` that upstream code can handle (e.g., show cached data on the dashboard)
- What happens when a monetary amount in a sevdesk response has more than 2 decimal places (e.g., 19.999)? The client rounds to 2 decimal places using banker's rounding (round half to even) and logs a warning
- What happens when the user attempts to book an amount on an already fully booked voucher? The sevdesk API returns an error; the client surfaces it as: "Beleg bereits vollstaendig gebucht"

## Technical Requirements
- Module location: `src/lib/sevdesk/` with separate files for `client.ts`, `types.ts`, `errors.ts`, and entity-specific modules (`vouchers.ts`, `transactions.ts`, `contacts.ts`, `invoices.ts`)
- Base URL: `https://my.sevdesk.de/api/v1/`
- Auth: API token passed as `Authorization` header (preferred) or `token` query parameter (fallback)
- HTTP client: native `fetch` with a wrapper for consistent error handling, retry logic, and rate limiting
- All sevdesk-specific types in `src/lib/sevdesk/types.ts` with JSDoc comments explaining non-obvious fields (especially creditDebit)
- Error classes: `SevdeskApiError` (general API error with status code), `SevdeskRateLimitError`, `SevdeskUnavailableError`, `SevdeskAuthError`
- Unit tests co-located: `src/lib/sevdesk/client.test.ts` with mocked fetch calls testing retry logic, rate limiting, and error handling
- No direct sevdesk API calls outside the `src/lib/sevdesk/` module — all other code must use this client

---
## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
