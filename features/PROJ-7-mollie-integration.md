# PROJ-7: Mollie-Integration

## Status: Planned
**Created:** 2026-04-04
**Last Updated:** 2026-04-04

## Dependencies
- Requires: PROJ-3 (Sevdesk Integration)

## Overview
Import Mollie payment settlements and fee invoices into sevdesk automatically. Settlements are booked as transactions on account 1805 (sevdesk ID 6192989). Monthly Mollie service fee invoices are created as reverse-charge (section 13b UStG) vouchers with the correct SKR04 accounts.

### Functional Requirements Reference
- **FA-301:** Import Mollie settlements as transactions on account 1805 (sevdesk ID 6192989)
- **FA-302:** Monthly Mollie fee invoices as section 13b EU voucher

### Non-Functional Requirements
- **NFA-101:** Idempotent — multiple runs must not create duplicates
- **NFA-102:** Dry-run mode — preview all changes without writing to sevdesk

### API Details
- **Mollie API v2:** `https://api.mollie.com/v2/`
- **Authentication:** Organization Access Token (Bearer token)
- **Key endpoints:** `/v2/settlements`, `/v2/settlements/{id}/payments`

### SKR04 Account Mapping
| Purpose | Konto | Sevdesk ID | Description |
|---------|-------|------------|-------------|
| Settlements | 1805 | 6192989 | Forderungen aus Zahlungsdienstleistern |
| Mollie fees (expense) | 5923 | — | Nebenkosten des Geldverkehrs (EU) |
| Input VAT (reverse charge) | 1407 | — | Abziehbare VSt section 13b UStG |
| Output VAT (reverse charge) | 3837 | — | USt section 13b UStG |

### Supplier
- **Mollie B.V.** — Lieferanten-Nr. 70032

## User Stories
- As a solo entrepreneur, I want Mollie settlements automatically imported into sevdesk so that my bank account 1805 always reflects the correct receivable balance from Mollie.
- As a solo entrepreneur, I want monthly Mollie fee invoices created as section 13b reverse-charge vouchers so that input VAT and output VAT are correctly reported for EU services.
- As a solo entrepreneur, I want duplicate detection based on amount + date + reference so that running the import multiple times never creates double entries.
- As a solo entrepreneur, I want a dry-run mode that previews all settlements and fee vouchers before writing anything to sevdesk so that I can review and approve changes first.
- As a solo entrepreneur, I want settlement imports to include the Mollie settlement reference ID so that I can trace every sevdesk transaction back to the original Mollie payout.
- As a solo entrepreneur, I want clear error reporting when the Mollie API returns failures or rate limits so that I know exactly which settlements could not be imported and why.
- As a solo entrepreneur, I want the import to handle partial settlement periods (e.g., mid-month start) so that no payout is missed regardless of when I begin using the tool.

## Acceptance Criteria
- [ ] Settlements are fetched from Mollie API v2 `/v2/settlements` using a Bearer Organization Access Token
- [ ] Each settlement is created as a transaction on sevdesk account 1805 (ID 6192989) with the correct amount, date, and Mollie reference
- [ ] Duplicate check prevents re-import: a settlement is skipped if a transaction with matching amount + date + reference already exists in sevdesk
- [ ] Running the import N times produces the same result as running it once (idempotent)
- [ ] Monthly Mollie fee voucher is created with expense on Konto 5923, input VAT on Konto 1407, and output VAT on Konto 3837
- [ ] Fee voucher is linked to supplier Mollie B.V. (Lieferanten-Nr. 70032)
- [ ] Fee voucher uses the correct section 13b reverse-charge tax rule
- [ ] Dry-run mode outputs a complete preview (settlement count, total amount, fee voucher details) without creating or modifying any sevdesk records
- [ ] Dry-run output clearly labels each action as "would create" vs. "already exists (skip)"
- [ ] API errors (401, 429, 500) are caught and reported with the affected settlement ID and HTTP status
- [ ] All amounts are handled in EUR with two decimal precision

## Edge Cases
- What happens when a Mollie settlement has a negative amount (chargeback/refund settlement)? It should still be imported with the negative amount on account 1805.
- What happens when the Mollie API returns paginated results with more settlements than fit in one response? The import must follow pagination links until all settlements are fetched.
- What happens when the Mollie API rate limit (429) is hit? The import should retry with exponential backoff up to 3 times before reporting the error.
- What happens when a settlement reference contains special characters? The duplicate check must still match correctly using exact string comparison.
- What happens when no Mollie fees were charged in a given month (e.g., no transactions)? No fee voucher should be created for that month.
- What happens when the Mollie Organization Access Token is invalid or expired? The import should fail immediately with a clear authentication error, not attempt partial processing.
- What happens when sevdesk is unreachable or returns 5xx errors during import? Already-imported settlements in the current run should be logged, and the error should indicate where to resume.
- What happens when a settlement date falls on a weekend or holiday and sevdesk requires a business day? The original settlement date from Mollie should be used as-is without adjustment.

## Technical Requirements
- Use Mollie API v2 (`api.mollie.com/v2/`) with Organization Access Token (Bearer header)
- Store the Mollie API token as an environment variable (`MOLLIE_API_TOKEN`), never in source code
- Implement pagination handling for `/v2/settlements` endpoint (follow `_links.next`)
- Settlement-to-sevdesk mapping: amount, date (valueDate), reference (settlement ID), account 1805
- Fee voucher creation via sevdesk Voucher API with line items for Konto 5923, tax positions for 1407/3837
- Implement dry-run flag that switches all sevdesk write operations to no-ops while still logging intended actions
- Add structured logging (JSON) for each processed settlement: action taken (created/skipped/error), settlement ID, amount
- Unit tests for duplicate detection logic, amount parsing, and tax rule selection
- Integration test with mocked Mollie and sevdesk API responses

---
## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
