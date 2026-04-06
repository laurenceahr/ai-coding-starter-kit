# PROJ-4: Beleg-Upload Pipeline

## Status: Planned
**Created:** 2026-04-04
**Last Updated:** 2026-04-04

## Dependencies
- Requires: PROJ-3 (Sevdesk Integration) — API client for voucher/document upload
- Requires: PROJ-14 (Lieferanten-Verwaltung) — supplier mapping table and tax rules

## User Stories
- As a solo entrepreneur, I want incoming invoices (PDF/PNG/JPG) automatically uploaded to Sevdesk so that I don't have to manually upload each document.
- As a solo entrepreneur, I want the system to identify the supplier from the filename so that each document is booked to the correct Sevdesk account and tax rule without my intervention.
- As a solo entrepreneur, I want unknown suppliers routed to a review folder (not silently uploaded) so that I can manually verify and categorize them before they enter my accounting.
- As a solo entrepreneur, I want my own outgoing invoices (pattern "Belege_Rechnung_RE...") filtered out automatically so that they don't get double-booked as expenses.
- As a solo entrepreneur, I want processed documents archived into date-based folders (`archiv/YYYY-MM/`) so that the input folder stays clean and I have an organized file history.
- As a solo entrepreneur, I want a dry-run mode so that I can preview what the pipeline would do before it actually uploads anything to Sevdesk.
- As a solo entrepreneur, I want the pipeline to be idempotent so that re-running it after a crash or interruption does not create duplicate vouchers in Sevdesk.

## Acceptance Criteria
- [ ] FA-101: The pipeline scans a configurable input folder and recognizes PDF, PNG, and JPG files as valid documents.
- [ ] FA-101: Supplier is identified from the filename convention `YYYY-MM-DD_Lieferantenname_Betrag.pdf` by extracting the second segment.
- [ ] FA-101: At least 95 predefined supplier mappings are loaded from a configuration source (JSON/DB) and matched against the extracted supplier name.
- [ ] FA-101: Files matching the outgoing invoice pattern `Belege_Rechnung_RE*` are skipped and not uploaded.
- [ ] FA-102: Known suppliers are uploaded to Sevdesk with the correct account number and tax rule, and the voucher is created with status 100 (finalized).
- [ ] FA-102: Unknown suppliers are moved to a `nicht-erkannt/` review folder and a JSON protocol file is written alongside each document recording the filename, extracted supplier name, timestamp, and reason for rejection.
- [ ] FA-102: The system NEVER silently uploads a document for an unknown supplier — this is a hard safety rule.
- [ ] FA-103: For suppliers flagged as section 13b (Reverse Charge), the extracted amount is treated as net and uploaded directly.
- [ ] FA-103: For suppliers with 19% VAT, the extracted amount is treated as gross and divided by 1.19 to derive the net amount before upload.
- [ ] FA-103: If no amount can be extracted from the filename, the voucher is uploaded as a draft (status 50) so Sevdesk OCR can fill in the amount.
- [ ] FA-104: Successfully processed documents are moved to `archiv/YYYY-MM/` based on the document date.
- [ ] FA-104: Unrecognized documents are moved to `nicht-erkannt/`. No files remain in the input folder after a complete run.
- [ ] NFA-101: Re-running the pipeline on the same input folder produces no duplicate vouchers in Sevdesk (idempotency via filename hash or tracking log).
- [ ] NFA-102: Dry-run mode logs all planned actions (upload, move, skip) to stdout/JSON without making any Sevdesk API calls or moving any files.

## Edge Cases
- What happens when the input folder is empty? The pipeline should complete successfully with a "no documents found" log message and zero API calls.
- What happens when a filename does not match the expected convention (e.g., `random-file.pdf`)? It should be treated as unknown supplier and moved to `nicht-erkannt/` with a JSON protocol entry noting "filename pattern mismatch".
- What happens when the same file appears in the input folder on two consecutive runs? The idempotency check (filename hash log) should detect the duplicate and skip it, logging "already processed".
- What happens when the Sevdesk API is unreachable or returns a 5xx error during upload? The file should NOT be moved to archive; it should remain in the input folder for retry on the next run. The error is logged with full details.
- What happens when a supplier name matches multiple mappings (e.g., "Amazon" vs "Amazon AWS")? The pipeline should use the longest/most-specific match. If ambiguous, treat as unknown and route to review.
- What happens when a file has a valid supplier but the amount segment contains non-numeric characters (e.g., `2026-03-15_Telekom_abc.pdf`)? Treat as "no amount" and upload as draft (status 50).
- What happens when the `archiv/YYYY-MM/` or `nicht-erkannt/` target directory does not exist? The pipeline should create it automatically before moving the file.
- What happens when a file is a 0-byte or corrupted PDF? The pipeline should log a warning, skip the file, and leave it in the input folder (do not move to archive or nicht-erkannt).

## Technical Requirements
- Configurable input folder path, archive base path, and review folder path (environment variables or config file).
- Supplier mapping table with fields: name pattern, Sevdesk account ID, tax rule ID, VAT type (13b / 19% / exempt), and any aliases.
- Filename parser module that extracts date, supplier name, and amount from the `YYYY-MM-DD_Lieferantenname_Betrag.ext` convention.
- Sevdesk Voucher API integration: `POST /Voucher` with file upload, account assignment, and status setting.
- Processing log (JSON) that records every file processed with: filename, hash, action taken, Sevdesk voucher ID (if uploaded), timestamp, and any errors.
- Dry-run flag (`--dry-run` or `DRY_RUN=true`) that prevents all side effects (API calls, file moves) while still producing the full processing log.
- File move operations must be atomic where possible (rename on same filesystem, copy+delete across filesystems).
- All log output should include structured JSON for machine parsing alongside human-readable console output.

---
## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
