# PROJ-13: Benachrichtigungen

## Status: Planned
**Created:** 2026-04-04
**Last Updated:** 2026-04-04

## Dependencies
- Requires: PROJ-1 (User Authentication) — notifications are user-scoped
- Requires: PROJ-12 (Scheduler & Pipeline-Orchestrierung) — pipeline events are a primary notification source

## User Stories
- As a solo entrepreneur, I want to receive push notifications for high-priority events (booking errors, UStVA deadline) so that I can act immediately on critical issues
- As a solo entrepreneur, I want to approve or reject matching suggestions directly from a push notification so that I can handle medium-confidence matches without opening the full app
- As a solo entrepreneur, I want low-priority events to appear as dashboard badges instead of push notifications so that I am not overwhelmed by non-urgent alerts
- As a solo entrepreneur, I want to receive an email notification in addition to push for high-priority events so that I do not miss critical alerts even when I am away from the app
- As a solo entrepreneur, I want to see a notification history log so that I can review past alerts and their resolution status
- As a solo entrepreneur, I want to configure which notification channels (push, email, dashboard-only) are active for each event type so that I can customize alert behavior to my preferences
- As a solo entrepreneur, I want notifications to be grouped and batched when multiple events of the same type occur within a short window so that I do not receive 50 individual alerts during a pipeline run

## Acceptance Criteria
- [ ] Notification events are defined with correct priorities and channels:
  - Unerkannter Beleg in Review-Ordner (Medium) -> Push + Email
  - Matching-Vorschlag confidence 0.80-0.90 (Medium) -> Push with inline Approve/Reject actions
  - Matching fehlgeschlagen (Low) -> Dashboard badge only
  - Buchung mit Gegenpruefungs-Fehler (High) -> Push + Email
  - UStVA-Faelligkeit in 7 Tagen (High) -> Push + Email
  - Bank-Sync > 5 Tage veraltet (Medium) -> Push
  - Pipeline-Lauf erfolgreich (Low) -> Dashboard log entry
  - Pipeline-Lauf mit Fehlern (High) -> Push
- [ ] Push notifications delivered via browser Web Push API (service worker)
- [ ] Email notifications sent via a transactional email service (e.g., Resend, SendGrid)
- [ ] Matching-Vorschlag notifications include Approve and Reject action buttons that update the matching result without navigating to the app
- [ ] Dashboard notification center shows unread count badge in the header and a dropdown with recent notifications
- [ ] Notification history page lists all notifications with: timestamp, event type, priority, channel, message, and read/unread status
- [ ] User can configure notification preferences per event type (enable/disable each channel) in settings
- [ ] Notifications of the same type are batched if more than 3 occur within a 5-minute window (single summary notification)
- [ ] High-priority notifications are never batched — each is delivered individually and immediately
- [ ] Unread notification count updates in real-time (via WebSocket or polling)

## Edge Cases
- What happens when the user has not granted browser push permission? -> Show an in-app banner prompting to enable push; fall back to email-only for push events
- What happens when the email service is down? -> Queue the email notification and retry up to 3 times over 15 minutes; log failure if all retries exhausted
- What happens when the user has disabled all channels for a high-priority event? -> Override and always show in dashboard log (cannot fully suppress high-priority events)
- What happens when 50 matching suggestions arrive in one pipeline run? -> Batch into a single summary notification: "12 neue Matching-Vorschlaege zur Pruefung"
- What happens when the user clicks Approve on a matching notification but the match was already resolved? -> Show "Dieser Vorschlag wurde bereits bearbeitet" and dismiss the notification
- What happens when the UStVA deadline reminder fires but the report has already been generated? -> Adjust message to "UStVA-Bericht bereits erstellt — bitte pruefen und einreichen"
- What happens when notifications accumulate while the user is offline for days? -> On next login, show a summary banner: "X ungelesene Benachrichtigungen seit [date]" instead of flooding with individual items

## Technical Requirements
- Web Push: service worker registration for browser push notifications (VAPID keys stored server-side)
- Email: transactional email via Resend or SendGrid API (HTML templates for each notification type)
- Notification storage: PostgreSQL table (Sevalla) (notifications) with columns: id, user_id, event_type, priority, channel, message, payload (JSON), read, created_at
- Real-time unread count: WebSocket or Server-Sent Events or 30-second polling fallback
- Batching logic: server-side aggregation with a 5-minute sliding window per event type
- Action buttons in push notifications: use Notification Actions API with postMessage to service worker
- Email rate limiting: max 10 emails per hour per user to prevent spam in error loops
- Notification preferences stored in user_settings table with JSON column for per-event-type channel configuration

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
