# PROJ-2: Dashboard

## Status: Planned
**Created:** 2026-04-04
**Last Updated:** 2026-04-04

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Sicherheit)
- Requires: PROJ-3 (Sevdesk API-Grundlage)
- Requires: PROJ-6 (Invoice Income Tracker / Matching-Engine)
- Requires: PROJ-10 (Reporting) — for UStVA-Report quick action
- Requires: PROJ-12 (Scheduler) — for pipeline status display

## User Stories
- As the sole user, I want a central dashboard as my landing page after login so that I can see my full accounting status at a glance
- As the sole user, I want to switch between Tages-, Monats-, and Quartals-Ansicht so that I can analyze my finances at different time granularities
- As the sole user, I want to see the pipeline status (last run, errors) so that I know whether automated processes are running correctly
- As the sole user, I want to see my offene Posten (Forderungen and Verbindlichkeiten) so that I know what money is owed to me and what I owe
- As the sole user, I want a badge showing unrecognized documents (unerkannte Belege) so that I can quickly process items that need manual attention
- As the sole user, I want a badge showing matching suggestions (confidence 0.80-0.90) so that I can review and approve semi-certain matches
- As the sole user, I want to see bank sync status per account (last update timestamp) so that I know my data is current
- As the sole user, I want quick-action buttons for manual pipeline trigger and UStVA report so that I can perform common tasks without navigating away

## Acceptance Criteria
- [ ] Dashboard is the default route after login (`/dashboard`)
- [ ] Unauthenticated users are redirected to `/login` (PROJ-1 middleware)
- [ ] Time period selector offers three options: Tag (day), Monat (month), Quartal (quarter) — default is Monat
- [ ] Switching time period re-fetches data and updates all dashboard widgets without a full page reload
- [ ] Pipeline status widget shows: last successful run timestamp, last error (if any), and a green/yellow/red indicator
- [ ] Offene Posten widget shows two columns: Forderungen (receivables) with total sum, and Verbindlichkeiten (payables) with total sum
- [ ] Unerkannte Belege badge displays the count of unmatched/unrecognized documents; clicking it navigates to the document review page
- [ ] Matching-Vorschlaege badge displays the count of matches with confidence between 0.80 and 0.90; clicking it navigates to the matching review page
- [ ] Bank sync status shows each connected CheckAccount with its name and last sync timestamp; accounts not synced in >24h show a warning icon
- [ ] Quick action: "Pipeline starten" button triggers a manual pipeline run and shows a toast confirmation
- [ ] Quick action: "UStVA-Report" button navigates to the reporting page with the current quarter pre-selected
- [ ] All monetary values are formatted in EUR German locale: `1.234,56 EUR` (dot as thousands separator, comma as decimal)
- [ ] All UI text is in German
- [ ] Dashboard fully loads (all widgets populated) in under 2 seconds on a standard connection (NFA-501)
- [ ] Layout is responsive: usable on desktop (1280px+) and tablet (768px+); mobile is not required

## Edge Cases
- What happens when sevdesk API is unreachable? Dashboard shows cached data (if available) with a banner: "Sevdesk-Verbindung fehlgeschlagen. Daten moeglicherweise veraltet."
- What happens when no bank accounts are connected yet? Bank sync widget shows an empty state: "Keine Bankkonten verbunden" with a link to integration settings
- What happens when there are zero offene Posten? The widget shows 0,00 EUR for both Forderungen and Verbindlichkeiten with a positive message: "Keine offenen Posten"
- What happens when the matching engine has not run yet (fresh install)? Matching badge shows "0" and pipeline status shows "Noch nicht ausgefuehrt"
- What happens when the user has >100 offene Posten? The widget shows the total sum and count, with a "Alle anzeigen" link to a full list page; it does not try to render all rows inline
- What happens when the time period selector is set to Tag and there is no data for today? Widgets show zero values with a note: "Keine Buchungen fuer heute"
- What happens when the pipeline is currently running and the user clicks "Pipeline starten"? The button is disabled with a spinner and tooltip: "Pipeline laeuft bereits"

## Technical Requirements
- Next.js App Router page at `src/app/dashboard/page.tsx`
- Server components for initial data fetch; client components for interactive widgets (time selector, quick actions)
- Data fetched via internal API routes that proxy to sevdesk (PROJ-3 client)
- Dashboard widgets as separate components in `src/components/dashboard/`
- shadcn/ui components: Card, Badge, Button, Select, Skeleton (for loading states)
- SWR or React Query for client-side data fetching with stale-while-revalidate
- EUR formatting utility in `src/lib/format.ts` using `Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })`
- Loading skeletons for each widget while data is being fetched
- Error boundaries per widget so that one failing widget does not crash the entire dashboard

---
## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
