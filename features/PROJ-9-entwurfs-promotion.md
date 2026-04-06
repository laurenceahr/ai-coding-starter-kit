# PROJ-9: Entwurfs-Promotion

## Status: Planned
**Created:** 2026-04-04
**Last Updated:** 2026-04-04

## Dependencies
- Requires: PROJ-3 (Sevdesk Integration)
- Requires: PROJ-14 (Lieferanten-Verwaltung)

## Overview
Automatically promote sevdesk voucher drafts (status 50, created by Autobox/OCR) to open vouchers (status 100) by resolving the supplier, determining the correct booking account and tax rule from supplier master data, and validating required fields. Drafts that cannot be fully resolved are skipped with clear reasons. The process uses supplier mappings managed in PROJ-14 to look up the correct Konto and tax rule per supplier.

### Functional Requirements Reference
- **FA-601:** Load all vouchers with status 50 (Autobox/OCR drafts) from sevdesk
- **FA-602:** Resolve supplier via Contact-ID or supplierName field
- **FA-603:** Determine account (Konto) + tax rule from supplier master data (PROJ-14 mappings)
- **FA-604:** Promote voucher to status 100 (Open)
- **FA-605:** Skip if: unknown supplier, missing amount, or missing date

### Non-Functional Requirements
- **NFA-101:** Idempotent — multiple runs must not create duplicates or re-promote already-open vouchers
- **NFA-102:** Dry-run mode — preview all changes without writing to sevdesk

## User Stories
- As a solo entrepreneur, I want OCR draft vouchers automatically promoted to open status so that I do not have to manually review and click through dozens of Autobox drafts each week.
- As a solo entrepreneur, I want the system to resolve the supplier from the draft's Contact-ID or supplierName so that each voucher is correctly linked to its supplier in sevdesk.
- As a solo entrepreneur, I want the correct booking account and tax rule determined from supplier master data so that every promoted voucher is ready for final approval without manual account selection.
- As a solo entrepreneur, I want drafts with unknown suppliers, missing amounts, or missing dates skipped with a clear reason so that I know exactly which vouchers need my manual attention and why.
- As a solo entrepreneur, I want a dry-run mode that lists all drafts and shows what action would be taken (promote or skip with reason) so that I can review before any changes are made.
- As a solo entrepreneur, I want a summary report after each run showing how many drafts were promoted, skipped, and errored so that I have a quick overview of the processing result.
- As a solo entrepreneur, I want the promotion to be idempotent so that running it multiple times never promotes a voucher twice or corrupts its state.

## Acceptance Criteria
- [ ] All vouchers with status 50 (draft) are fetched from sevdesk via the Voucher API
- [ ] Supplier is resolved by first checking Contact-ID on the voucher; if absent, fall back to matching supplierName against known contacts
- [ ] If supplier is resolved, the booking account (Konto) and tax rule are looked up from PROJ-14 supplier mappings
- [ ] Voucher is promoted from status 50 to status 100 (Open) via sevdesk API with the resolved account and tax rule applied
- [ ] Vouchers with an unknown supplier (no Contact-ID match and no supplierName match) are skipped with reason "unknown supplier"
- [ ] Vouchers with a missing or zero amount are skipped with reason "missing amount"
- [ ] Vouchers with a missing date (voucherDate is null or empty) are skipped with reason "missing date"
- [ ] Vouchers already at status 100 or higher are not re-processed (idempotent)
- [ ] Dry-run mode lists every draft voucher with its intended action (promote with account/tax details, or skip with reason) without modifying any sevdesk data
- [ ] A summary is produced after each run: total drafts found, promoted count, skipped count (broken down by reason), error count
- [ ] Promoted vouchers retain all original OCR-extracted data (amount, date, description) and only have account, tax rule, supplier, and status updated

## Edge Cases
- What happens when a draft voucher has a Contact-ID that no longer exists in sevdesk (deleted supplier)? It should be treated as "unknown supplier" and skipped.
- What happens when the supplierName in the draft matches multiple contacts in sevdesk? The system should skip the voucher with reason "ambiguous supplier" and log all matching contact IDs for manual resolution.
- What happens when a supplier exists in sevdesk contacts but has no mapping in PROJ-14 (no account/tax rule configured)? The voucher should be skipped with reason "supplier has no account mapping" so the user can update PROJ-14.
- What happens when sevdesk returns a very large number of status-50 drafts (e.g., 500+)? The system must handle pagination and process all drafts, not just the first page.
- What happens when the sevdesk API fails mid-way through promoting a batch of drafts? Already-promoted vouchers should remain promoted, the error should be logged with the failing voucher ID, and the next run should pick up where it left off (idempotent).
- What happens when a draft voucher has an amount in a currency other than EUR? The system should skip it with reason "unsupported currency" since all SKR04 bookings are in EUR.
- What happens when the OCR-extracted date is in an unexpected format or clearly wrong (e.g., year 1900)? The system should skip with reason "invalid date" rather than promoting with bad data.
- What happens when a draft has both a Contact-ID and a supplierName, but they point to different suppliers? Contact-ID takes precedence, and a warning is logged about the mismatch.

## Technical Requirements
- Fetch drafts via sevdesk Voucher API with status filter (`status=50`)
- Handle pagination for large result sets (sevdesk uses offset/limit pagination)
- Supplier resolution: first try `contact.id` on the voucher, then fuzzy-match `supplierName` against sevdesk contacts
- Account and tax rule lookup from PROJ-14 supplier mapping data structure
- Promotion via sevdesk Voucher API: update status to 100, set `accountingType` (Konto) and tax rule
- Implement dry-run flag that replaces all sevdesk write calls with no-ops while logging intended actions
- Structured logging (JSON) per voucher: action (promoted/skipped/error), voucher ID, supplier, account, tax rule, skip reason
- Summary statistics logged at end of run: total, promoted, skipped (by reason), errors
- Unit tests for supplier resolution logic (Contact-ID vs. name matching, ambiguous matches, missing mappings)
- Unit tests for skip-condition validation (missing amount, missing date, unknown supplier)
- Integration tests with mocked sevdesk API responses covering promotion, pagination, and error scenarios

---
## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
