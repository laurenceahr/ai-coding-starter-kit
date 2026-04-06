# PROJ-12: Scheduler & Pipeline-Orchestrierung

## Status: Planned
**Created:** 2026-04-04
**Last Updated:** 2026-04-04

## Dependencies
- Requires: PROJ-4 (Beleg-Upload) — voucher upload step in pipeline
- Requires: PROJ-5 (Bank-Sync) — bank transaction sync step in pipeline
- Requires: PROJ-6 (Matching-Engine) — transaction-voucher matching step in pipeline
- Requires: PROJ-7 (Mollie) — Mollie payment sync step in pipeline
- Requires: PROJ-8 (PayPal) — PayPal auto-booking step in pipeline
- Requires: PROJ-9 (Entwurfs-Promotion) — draft promotion step in pipeline

## User Stories
- As a solo entrepreneur, I want a daily automated pipeline that syncs banks, uploads vouchers, promotes drafts, and matches transactions so that my bookkeeping stays current without manual intervention
- As a solo entrepreneur, I want to trigger the full pipeline or any individual task on demand so that I can force a sync when I know new data is available
- As a solo entrepreneur, I want the pipeline to continue running remaining tasks even if one task fails so that a single API error does not block my entire workflow
- As a solo entrepreneur, I want to see a run log for every pipeline execution showing which tasks succeeded, failed, and how long each took so that I can diagnose issues
- As a solo entrepreneur, I want a quarterly UStVA report to be generated automatically 3 days after quarter end so that I have time to review before the filing deadline
- As a solo entrepreneur, I want to receive immediate notification when a critical pipeline error occurs so that I can take action before it affects my bookkeeping
- As a solo entrepreneur, I want new documents detected in my email to automatically trigger voucher upload and draft promotion so that incoming invoices are processed promptly

## Acceptance Criteria
- [ ] Pipeline executes tasks in strict sequential order: 1. sync_banks -> 2. sync_mollie -> 3. upload_vouchers -> 4. promote_drafts -> 5. match_all
- [ ] auto_book_paypal runs in parallel with match_all (not sequentially)
- [ ] Scheduled trigger: full pipeline runs daily at 08:00 UTC
- [ ] Event trigger: new document detection triggers upload_vouchers + promote_drafts
- [ ] Manual trigger: user can start full pipeline or any individual task from the dashboard
- [ ] Quarterly trigger: UStVA report generation runs automatically Q-end + 3 days (April 3, July 3, October 3, January 3)
- [ ] Error isolation: failure in task N does not prevent task N+1 from executing
- [ ] API error handling: each task retries up to 3 times with exponential backoff (1s, 2s, 4s) before marking as failed
- [ ] Run log stored as JSON per execution with: pipeline_id, start_time, end_time, tasks[] (name, status, duration_ms, error_message, retry_count)
- [ ] Critical errors (sync failure after all retries, data integrity issues) trigger immediate push notification
- [ ] NFA-301: Full pipeline completes in under 5 minutes for typical daily volume
- [ ] Pipeline status visible on dashboard: "Running", "Completed", "Completed with errors", "Failed"
- [ ] Concurrent pipeline runs are prevented — if a run is in progress, new triggers queue or are rejected with a message

## Edge Cases
- What happens when the daily 08:00 trigger fires but a manual run is already in progress? -> Skip the scheduled run and log "Uebersprungen — manueller Lauf aktiv"
- What happens when sync_banks fails but sync_mollie succeeds? -> Continue pipeline; match_all runs with stale bank data and logs a warning
- What happens when all 3 retries for a task are exhausted? -> Mark task as "failed" in run log, send critical notification, continue to next task
- What happens when the server is restarted mid-pipeline? -> Detect incomplete run on startup, mark as "aborted", do not auto-resume (user must trigger manually)
- What happens when the pipeline takes longer than 5 minutes? -> Log a performance warning but do not forcefully terminate; set a hard timeout at 15 minutes
- What happens when the quarterly trigger date falls on a day the server is down? -> On next startup, check if a missed quarterly run exists and prompt the user to run it manually
- What happens when two event triggers fire simultaneously (e.g., two new documents detected)? -> Deduplicate: merge into a single upload_vouchers + promote_drafts run
- What happens when a task produces partial results before failing? -> Partial results are committed (idempotent design); the retry picks up where it left off

## Technical Requirements
- Scheduler: use a cron-compatible library (e.g., Sevalla Cron Jobs or node-cron)
- Pipeline orchestrator: custom sequential runner with parallel branch support
- Run log storage: JSON documents in PostgreSQL (Sevalla) (table: pipeline_runs)
- Exponential backoff: delays of 1000ms, 2000ms, 4000ms between retries
- Pipeline lock: database-level advisory lock or row-level flag to prevent concurrent runs
- Each task must be idempotent — re-running a task with the same input produces the same result
- Event triggers: webhook or polling-based detection of new documents (implementation depends on email integration)
- Monitoring: pipeline execution metrics (duration, success rate) exposed via dashboard
- Timezone: all scheduled times in UTC, displayed to user in Europe/Berlin

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
