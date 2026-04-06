# PROJ-11: Stornierung

## Status: Planned
**Created:** 2026-04-04
**Last Updated:** 2026-04-04

## Dependencies
- Requires: PROJ-3 (Sevdesk Integration) — needs ability to create credit notes and counter-vouchers in Sevdesk

## User Stories
- As a solo entrepreneur, I want to cancel an invoice by creating a reversal booking (Soll/Haben vertauscht) so that my books remain balanced and audit-compliant
- As a solo entrepreneur, I want to be explicitly asked for confirmation before any cancellation is executed so that I never accidentally reverse a booking
- As a solo entrepreneur, I want a Storno document (credit note or counter-voucher) to be automatically created in Sevdesk so that my accounting records are complete
- As a solo entrepreneur, I want to see a history of all cancellations with links to the original and reversal documents so that I can trace any storno back to its source
- As a solo entrepreneur, I want to cancel a partial amount on an invoice so that I can handle partial refunds without cancelling the entire invoice
- As a solo entrepreneur, I want the cancellation to update the open items report (Forderungen/Verbindlichkeiten) immediately so that my balances stay accurate
- As a solo entrepreneur, I want to add a reason/note to every cancellation so that I have an audit trail explaining why the storno was performed

## Acceptance Criteria
- [ ] FA-801: Cancellation creates a reversal booking with Soll and Haben swapped relative to the original booking
- [ ] FA-802: Every cancellation requires explicit user confirmation via a modal dialog showing the original document, reversal amount, and affected accounts
- [ ] FA-803: A Storno document (Credit Note for invoices, counter-voucher for expenses) is created in Sevdesk via the API
- [ ] NFA-202: No destructive or irreversible action is performed without user confirmation — the confirm dialog must require an active click (no auto-dismiss, no keyboard shortcut bypass)
- [ ] Reversal booking references the original document number (e.g., "Storno zu RE-2026-0042")
- [ ] Partial cancellations are supported: user can specify a partial amount that is less than or equal to the original amount
- [ ] Cancellation reason is mandatory (free text, minimum 5 characters) and stored with the reversal document
- [ ] Cancelled documents are visually marked in the UI (strikethrough or "Storniert" badge) and cannot be cancelled again
- [ ] Cancellation history page lists all stornos with: date, original document, reversal document, amount, reason, and user who confirmed
- [ ] After cancellation, the open items report (PROJ-10 FA-702) reflects the updated balances within 1 minute

## Edge Cases
- What happens when the user tries to cancel an already-cancelled document? -> Block with message "Dieses Dokument wurde bereits storniert" and link to the existing reversal
- What happens when the Sevdesk API fails during credit note creation? -> Roll back the local reversal booking, show error, and prompt user to retry
- What happens when a partial cancellation amount exceeds the remaining open amount? -> Validate and reject with "Stornobetrag uebersteigt den offenen Betrag (X,XX EUR)"
- What happens when the original document has already been fully paid? -> Allow cancellation but warn: "Dokument bereits bezahlt — Storno erzeugt eine Gutschrift-Forderung"
- What happens when the user cancels a §13b transaction? -> Ensure both the Vorsteuer (1407) and Umsatzsteuer (3837) entries are reversed correctly
- What happens when the network connection drops during the confirmation step? -> Do not execute the cancellation; show "Verbindung unterbrochen — bitte erneut versuchen"
- What happens when multiple users (future multi-user) try to cancel the same document simultaneously? -> Use optimistic locking; second request gets "Dokument wird gerade bearbeitet"

## Technical Requirements
- Sevdesk API endpoints: /CreditNote (create), /Voucher (create counter-voucher), /Invoice (update status)
- Reversal booking logic must be atomic: either both the local record and Sevdesk document are created, or neither is
- Confirmation dialog must be a blocking modal (not a toast or inline confirmation)
- All cancellation operations logged with timestamp, user ID, original document ID, reversal document ID, and reason
- Cancellation reason stored in both the local database and as a note on the Sevdesk credit note
- Partial cancellation: amount validated as positive number, max 2 decimal places, <= remaining open amount
- API retry: 1 automatic retry on 5xx errors before showing failure to user

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
