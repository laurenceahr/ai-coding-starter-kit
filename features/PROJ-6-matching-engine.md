# PROJ-6: Matching-Engine / Bankabgleich

## Status: Planned
**Created:** 2026-04-04
**Last Updated:** 2026-04-04

## Dependencies
- Requires: PROJ-3 (Sevdesk Integration) — API client for invoices, transactions, and booking endpoints
- Requires: PROJ-5 (Bank-Synchronisation) — ensures bank transactions are up to date before matching
- Requires: PROJ-4 (Beleg-Upload Pipeline) — ensures vouchers/invoices exist in Sevdesk for matching
- Requires: PROJ-9 (Entwurfs-Promotion) — draft invoices must be promoted before they are eligible for matching

## User Stories
- As a solo entrepreneur, I want bank transactions automatically matched against open invoices in Sevdesk so that I don't have to manually reconcile each payment.
- As a solo entrepreneur, I want high-confidence matches (>= 0.90 with sufficient gap to second-best) auto-booked so that routine reconciliation happens without my involvement.
- As a solo entrepreneur, I want medium-confidence matches (>= 0.80) presented as suggestions requiring my confirmation so that I maintain control over uncertain matches.
- As a solo entrepreneur, I want a full audit trail for every match decision showing all 4 signal scores (amount, name, date, reference) so that I can understand and verify why a match was made.
- As a solo entrepreneur, I want partial payments and overpayments detected and handled correctly so that invoices paid in installments or with rounding differences are tracked accurately.
- As a solo entrepreneur, I want batch payments (one transaction covering multiple invoices) flagged as hints without auto-booking so that I can manually split and assign them.
- As a solo entrepreneur, I want post-booking verification (paidAmount delta check) so that I can detect if a booking did not apply correctly in Sevdesk.

## Acceptance Criteria
- [ ] FA-401: The matching engine evaluates 4 signals for each transaction-invoice pair: Betrag (amount, mandatory gate at 0.5), Name (optional), Datum (date, supplementary), and Referenz (reference, optional).
- [ ] FA-401: If the Betrag signal scores below 0.5, the pair is immediately rejected without evaluating other signals.
- [ ] FA-402: Amount tolerance scoring follows the defined tiers: exact match (+-0.01) = 1.0, +-0.05 = 0.95, +-1% = 0.8, +-3% = 0.5, >3% = 0.0.
- [ ] FA-403: Name normalization applies: lowercase conversion, stripping of legal forms (GmbH, AG, B.V., Ltd., Inc., SE, KG, OHG, e.K., UG), removal of special characters, and resolution of known bank aliases (MSFT -> Microsoft, UZR -> Haufe Lexware, etc.).
- [ ] FA-403: The bank alias mapping table contains at least 20 known aliases and is configurable (JSON/DB).
- [ ] FA-404: The 5-tier confidence system is implemented exactly as specified:
  - Tier 1: 0.98 — exact reference match + good amount score
  - Tier 1b: 0.88 — exact reference match + foreign currency gateway tolerance
  - Tier 2: 0.92 — exact amount + strong reliable name match
  - Tier 2b: 0.90 — exact amount + partial reference match
  - Tier 3: 0.85-0.87 — exact amount + close date + name similarity
  - Tier 4: 0.78 — exact amount + acceptable date window
  - Tier 5: 0.65 — only excellent amount match, no other signals
- [ ] FA-405: Auto-Book decision: confidence >= 0.90 AND gap to second-best candidate >= 0.10 triggers automatic booking via Sevdesk API.
- [ ] FA-405: Suggestion decision: confidence >= 0.80 (but below auto-book threshold or insufficient gap) presents the match to the user for confirmation.
- [ ] FA-405: No-match decision: confidence < 0.80 — transaction is left unmatched with a log entry.
- [ ] FA-406: Partial payments are detected when transaction amount is less than invoice amount. The system books a partial payment and updates the invoice's remaining open amount.
- [ ] FA-406: Overpayments are detected when transaction amount exceeds invoice amount. The excess is logged and flagged for user review.
- [ ] FA-407: Batch payments (one transaction amount matching the sum of multiple invoices) are detected and flagged as hints. They are NEVER auto-booked — user must confirm the split.
- [ ] FA-408: After each auto-booking, the engine re-queries the invoice's paidAmount from Sevdesk and verifies the delta matches the booked amount. Mismatches are logged as warnings.
- [ ] FA-409: Every match decision produces a full audit record containing: transaction ID, invoice ID, all 4 signal names with their individual score, detail text, and available flag, the final composite confidence, the tier matched, and the action taken.
- [ ] NFA-302: The engine processes a single transaction against up to 500 candidate invoices in under 1 second.

## Edge Cases
- What happens when a transaction has no reference text and no recognizable name? Only the Betrag signal is evaluated. If amount scores above 0.5, the match may reach Tier 5 (0.65) at most, which falls below auto-book and suggestion thresholds — the transaction is left unmatched.
- What happens when two invoices have the exact same amount, same supplier name, and similar dates? Both candidates will score nearly identically, meaning the gap between first and second is < 0.10. Even if confidence is >= 0.90, the insufficient gap prevents auto-booking. Both are presented as suggestions for user decision.
- What happens when a transaction amount matches an invoice exactly but the name is a known alias not yet in the mapping table? The Name signal scores 0.0 (no match). The pair may still reach Tier 4 (0.78) or Tier 5 (0.65) via amount alone, resulting in no-match or suggestion at best. The missing alias should be flagged in logs for the user to add.
- What happens when the Sevdesk API is unavailable during auto-booking? The booking attempt fails, the transaction is marked as "booking failed" in the audit trail, and the engine continues processing remaining transactions. No data is lost.
- What happens when an invoice has already been fully paid (paidAmount == totalAmount)? The invoice is excluded from the candidate pool before matching begins. If no candidates remain, the transaction is left unmatched.
- What happens with foreign currency transactions (e.g., USD payment for a EUR invoice)? The amount signal uses the gateway tolerance defined in Tier 1b. The engine does NOT perform currency conversion — it relies on the payment gateway's converted EUR amount appearing in the bank transaction.
- What happens when a partial payment was previously booked and the remaining amount now matches a new transaction? The engine uses the invoice's remaining open amount (totalAmount - paidAmount) as the comparison value, not the original total.
- What happens when the candidate pool exceeds 500 invoices? The engine pre-filters candidates by amount range (e.g., +-10% of transaction amount) to reduce the pool below 500 before running full signal evaluation. If still over 500 after filtering, only the top 500 by amount proximity are evaluated.

## Technical Requirements
- Signal evaluation module with pluggable signal functions: `evaluateAmount()`, `evaluateName()`, `evaluateDate()`, `evaluateReference()`. Each returns `{ score: number, detail: string, available: boolean }`.
- Confidence tier resolver that takes all 4 signal results and returns the matching tier, composite score, and tier label.
- Decision engine that compares top-2 candidates by score and gap, then applies the auto-book / suggestion / no-match rules.
- Name normalization utility with: lowercase, legal-form stripping regex, special character removal, and alias lookup table.
- Amount tolerance calculator that implements the defined scoring tiers with configurable thresholds.
- Sevdesk booking integration: `POST /BookAccount` or equivalent endpoint to book a transaction against an invoice.
- Sevdesk query integration: `GET /Invoice` (open invoices), `GET /CheckAccountTransaction` (unmatched transactions).
- Audit trail storage: each match decision is persisted as a JSON record with all signal details, queryable by transaction ID or invoice ID.
- Batch payment detection heuristic: for unmatched transactions, check if the amount equals the sum of any combination of 2-5 open invoices from the same supplier.
- Performance target: < 1 second per transaction with up to 500 candidates. Pre-filtering by amount range to keep candidate pools manageable.
- All monetary calculations use integer cents (or Decimal type) to avoid floating-point precision errors.

---
## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
