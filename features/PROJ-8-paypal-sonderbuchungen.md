# PROJ-8: PayPal-Sonderbuchungen

## Status: Planned
**Created:** 2026-04-04
**Last Updated:** 2026-04-04

## Dependencies
- Requires: PROJ-3 (Sevdesk Integration)
- Requires: PROJ-5 (Microsoft 365 Email Integration / Bank-Synchronisation)

## Overview
Automatically recognize and book PayPal special transactions (fees and Working Capital repayments) in sevdesk. PayPal fees are identified by sender name, grouped monthly into a collective voucher, and booked on Konto 6855 without VAT. Working Capital loan repayments are booked individually on Konto 3150. The system handles 3 separate PayPal accounts.

### Functional Requirements Reference
- **FA-501:** Recognize PayPal fees by sender ("Paypal Inc.", "PayPal Europe S.a r.l. et Cie S.C.A."), book on Konto 6855 with no VAT (TaxRule 9), create monthly grouped collective voucher with individual transaction line items
- **FA-502:** Recognize Working Capital repayments, book on Konto 3150 (Verbindlichkeiten gegenueber Kreditinstituten), no VAT

### Non-Functional Requirements
- **NFA-101:** Idempotent — multiple runs must not create duplicates
- **NFA-102:** Dry-run mode — preview all changes without writing to sevdesk

### SKR04 Account Mapping
| Purpose | Konto | Description | Tax Rule |
|---------|-------|-------------|----------|
| PayPal fees | 6855 | Nebenkosten des Geldverkehrs | TaxRule 9 (no VAT) |
| Working Capital repayments | 3150 | Verbindlichkeiten ggue. Kreditinstituten | No VAT |

### PayPal Sender Identification
| Sender Name | Transaction Type |
|-------------|-----------------|
| Paypal Inc. | Fee |
| PayPal Europe S.a r.l. et Cie S.C.A. | Fee |

### Accounts
- 3 PayPal accounts must be processed independently

## User Stories
- As a solo entrepreneur, I want PayPal fees automatically recognized by sender name so that I do not have to manually search through hundreds of PayPal transactions each month.
- As a solo entrepreneur, I want PayPal fees grouped into one collective voucher per month so that my sevdesk bookkeeping stays clean with one fee voucher per account per month instead of dozens of individual entries.
- As a solo entrepreneur, I want each individual PayPal fee still recorded as a separate line item within the collective voucher so that I can trace any fee back to its original transaction.
- As a solo entrepreneur, I want Working Capital repayments booked on Konto 3150 so that my loan balance is accurately tracked in sevdesk without manual intervention.
- As a solo entrepreneur, I want all 3 of my PayPal accounts handled by the same process so that I do not need separate configurations or manual runs per account.
- As a solo entrepreneur, I want a dry-run mode that shows me which transactions would be booked and how they would be grouped before anything is written to sevdesk.
- As a solo entrepreneur, I want idempotent processing so that re-running the import after a failure or for verification never creates duplicate vouchers or bookings.

## Acceptance Criteria
- [ ] Transactions with sender "Paypal Inc." or "PayPal Europe S.a r.l. et Cie S.C.A." are recognized as PayPal fees (case-insensitive match)
- [ ] PayPal fees are booked on Konto 6855 with TaxRule 9 (no VAT, 0%)
- [ ] A single collective voucher (Sammelbeleg) is created per PayPal account per month containing all fee transactions as individual line items
- [ ] Each line item in the collective voucher includes: transaction date, amount, and PayPal transaction reference
- [ ] The collective voucher total equals the sum of all individual fee line items for that month
- [ ] Working Capital repayments are detected and booked individually on Konto 3150 with no VAT
- [ ] All 3 PayPal accounts are processed in a single run, each producing its own set of vouchers
- [ ] Duplicate detection prevents re-booking: transactions already present in a collective voucher or as individual bookings are skipped
- [ ] Running the process multiple times for the same period produces identical sevdesk state (idempotent)
- [ ] Dry-run mode outputs a complete preview per account: fee count, fee total, Working Capital repayment count and total, grouped by month
- [ ] Dry-run mode does not create, modify, or delete any sevdesk records
- [ ] Amounts are processed in EUR with two decimal precision, matching the original PayPal transaction amounts exactly

## Edge Cases
- What happens when a PayPal fee sender name has slight variations (e.g., extra whitespace, different capitalization like "PAYPAL INC.")? The match should be case-insensitive and trim whitespace.
- What happens when a month has zero PayPal fees for one account but fees for another? No collective voucher is created for the account with zero fees; the other accounts are processed normally.
- What happens when a Working Capital repayment amount is zero (e.g., a skipped payment month)? Zero-amount transactions should be skipped with a warning log.
- What happens when a PayPal fee transaction has a positive amount instead of the expected negative amount? The system should flag it as anomalous and skip it rather than booking an income entry on an expense account.
- What happens when the same PayPal transaction appears in bank sync data from two different import runs with slightly different timestamps? Duplicate detection should use the PayPal transaction reference ID, not the timestamp alone.
- What happens when a collective voucher for a given month already exists in sevdesk but new fee transactions for that month are discovered (e.g., late settlement)? The system should warn that the month's voucher needs amendment and skip those transactions rather than creating a second voucher for the same month.
- What happens when one of the 3 PayPal accounts fails during processing? The other two accounts should still complete successfully, and the error for the failed account should be reported clearly.
- What happens when a Working Capital repayment description does not clearly indicate it is a repayment? The system should use a configurable keyword list (e.g., "Working Capital", "Loan Repayment") to identify repayments.

## Technical Requirements
- PayPal transaction data sourced from bank sync (PROJ-5), not directly from PayPal API
- Sender name matching: case-insensitive, whitespace-trimmed comparison against known PayPal fee sender names
- Collective voucher creation via sevdesk Voucher API with multiple line items (one per fee transaction)
- Working Capital repayment detection via configurable keyword matching on transaction description
- Configuration for 3 PayPal accounts: each account identified by its bank account ID in sevdesk
- Implement dry-run flag that prevents all sevdesk write operations while logging intended actions
- Structured logging (JSON) per transaction: action (created/skipped/error), account, type (fee/repayment), amount, reference
- Duplicate detection key: PayPal transaction reference ID per account
- Unit tests for sender name matching, fee grouping logic, and duplicate detection
- Integration tests with mocked bank sync data and sevdesk API responses
- Monthly grouping logic must handle timezone-aware date boundaries (Europe/Berlin)

---
## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
