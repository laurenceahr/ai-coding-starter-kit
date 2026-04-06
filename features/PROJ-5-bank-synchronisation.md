# PROJ-5: Bank-Synchronisation

## Status: Planned
**Created:** 2026-04-04
**Last Updated:** 2026-04-04

## Dependencies
- Requires: PROJ-3 (Sevdesk Integration) — Sevdesk API client for CheckAccount and finAPI trigger endpoints

## User Stories
- As a solo entrepreneur, I want the system to monitor all 6 of my bank accounts (PayPal x3, N26, Amex, Mollie) so that I have a single place to check if transactions are up to date.
- As a solo entrepreneur, I want stale accounts (last transaction > 3 days old) to automatically trigger a finAPI import so that my Sevdesk data stays current without manual intervention.
- As a solo entrepreneur, I want auto-sync accounts (managed by finAPI) to be skipped so that the system does not interfere with finAPI's own sync schedule.
- As a solo entrepreneur, I want rate limiting enforced (max 1 import per account per minute) so that I don't hit API limits or cause duplicate imports.
- As a solo entrepreneur, I want a dry-run mode so that I can see which accounts would be synced without actually triggering any imports.
- As a solo entrepreneur, I want a clear summary after each sync run showing which accounts were synced, which were skipped, and which had errors so that I can quickly spot problems.
- As a solo entrepreneur, I want the sync to be idempotent so that running it multiple times in quick succession does not cause duplicate finAPI import requests.

## Acceptance Criteria
- [ ] FA-201: The system queries all 6 configured bank accounts via the Sevdesk CheckAccount API and retrieves the last transaction date and current balance for each.
- [ ] FA-201: Account configuration includes: Sevdesk CheckAccount ID, account name, provider (PayPal/N26/Amex/Mollie), and auto-sync flag.
- [ ] FA-202: If the last transaction date for a non-auto-sync account is more than 3 days old (relative to current date), a finAPI import is triggered for that account.
- [ ] FA-202: Accounts flagged as auto-sync are never triggered for import, regardless of staleness.
- [ ] FA-202: Rate limiting ensures no more than 1 finAPI import request per account per 60-second window. If a second request would occur within the window, it is skipped with a log entry.
- [ ] FA-202: The 3-day staleness threshold is configurable (environment variable or config).
- [ ] NFA-101: Re-running the sync within the rate-limit window for the same account does not produce a duplicate import request (idempotency).
- [ ] NFA-102: Dry-run mode logs all planned actions (which accounts would be synced, which skipped) without making any Sevdesk or finAPI API calls.
- [ ] The sync run produces a structured JSON summary report with: account name, last transaction date, balance, action taken (synced/skipped/error), and timestamp.
- [ ] All API errors (network failures, 4xx, 5xx) are caught, logged with full context, and do not crash the entire sync run — remaining accounts are still processed.

## Edge Cases
- What happens when the Sevdesk API returns no transactions for an account (brand new or empty account)? The account should be treated as stale (last transaction date = null → always older than 3 days) and a sync should be triggered.
- What happens when finAPI import returns a 429 (rate limited) or 503 (service unavailable)? The error is logged for that account, the account is marked as "error" in the summary, and the sync continues with remaining accounts. No retry within the same run.
- What happens when an account's last transaction date is exactly 3 days ago (boundary condition)? The condition is "> 3 days", so exactly 3 days should NOT trigger a sync. Only strictly older than 3 days triggers.
- What happens when the system clock or timezone differs from Sevdesk's server time? All date comparisons should use UTC to avoid timezone-related off-by-one errors.
- What happens when one of the 6 accounts is removed from Sevdesk but still in the local config? The Sevdesk API will return a 404 or empty result. The system should log a warning ("account not found in Sevdesk") and continue processing other accounts.
- What happens when the sync is triggered concurrently (e.g., two cron jobs overlapping)? The rate-limit mechanism (tracked per account with timestamps) should prevent duplicate imports even under concurrent execution.
- What happens when all 6 accounts are auto-sync? The run completes successfully with all accounts marked as "skipped (auto-sync)" and zero API import calls.

## Technical Requirements
- Account configuration stored in a config file or database table with fields: Sevdesk CheckAccount ID, display name, provider, auto-sync boolean.
- Sevdesk API endpoints used: `GET /CheckAccount` (list accounts), `GET /CheckAccountTransaction` (last transaction date), finAPI import trigger endpoint.
- Rate-limit tracking: in-memory or file-based timestamp log per account to enforce the 1-per-minute rule across runs.
- Staleness threshold configurable via `BANK_SYNC_STALE_DAYS` environment variable (default: 3).
- Dry-run flag (`--dry-run` or `DRY_RUN=true`) that prevents all side effects while producing the full summary report.
- Structured JSON logging for all operations (account queries, sync triggers, skips, errors).
- The sync should complete within 30 seconds for all 6 accounts under normal conditions.

---
## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
