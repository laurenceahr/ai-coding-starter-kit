# PROJ-10: Reporting & UStVA

## Status: Planned
**Created:** 2026-04-04
**Last Updated:** 2026-04-04

## Dependencies
- Requires: PROJ-3 (Sevdesk Integration) — needs access to bookings, accounts, and vouchers via Sevdesk API

## User Stories
- As a solo entrepreneur, I want to generate a UStVA (Umsatzsteuer-Voranmeldung) for any quarter or month so that I can file my VAT return without manual calculation
- As a solo entrepreneur, I want to see a monthly overview of all bookings grouped by SKR04 account so that I can verify my bookkeeping is correct before filing
- As a solo entrepreneur, I want to identify transactions missing vouchers and vouchers missing transactions so that I can fix gaps before the tax deadline
- As a solo entrepreneur, I want to view open items (Forderungen and Verbindlichkeiten) grouped by debtor/creditor so that I know who owes me money and whom I owe
- As a solo entrepreneur, I want to be reminded of the UStVA deadline (10th of the month after quarter end) so that I never miss a filing
- As a solo entrepreneur, I want to export the UStVA data in a format compatible with ELSTER so that I can submit it directly
- As a solo entrepreneur, I want to drill down from any UStVA Kennzahl into the underlying transactions so that I can verify each line item

## Acceptance Criteria
- [ ] FA-701: UStVA calculation produces correct values for all required Kennzahlen:
  - Kz. 81: Steuerpflichtige Umsaetze 19% (Netto from Konto 4400)
  - Kz. 21: EU-Fernverkauf (Netto from Konto 4320, broken down by country)
  - Kz. 46: Innergemeinschaftliche Lieferungen (tax-free intra-EU supplies)
  - Kz. 43: nach §13b bezogene Leistungen (Netto from Konto 5923 + 5925)
  - Kz. 66: Abziehbare Vorsteuer (sum of Konto 1406)
  - Kz. 67: Vorsteuer nach §13b (sum of Konto 1407)
  - Kz. 83: Verbleibende USt-Vorauszahlung (calculated from above)
- [ ] FA-702: Open items report lists all Forderungen and Verbindlichkeiten grouped by Debitor/Kreditor with outstanding amounts
- [ ] FA-703: Document audit report identifies transactions without vouchers and vouchers without matching transactions
- [ ] FA-704: Monthly overview displays all bookings for a selected month with sums per SKR04 account
- [ ] User can select any month or quarter as the reporting period
- [ ] Each Kennzahl is clickable and drills down to the underlying transaction list
- [ ] GR-205: UStVA deadline reminder triggers on the 10th of the month after quarter end
- [ ] Reports can be exported as PDF or CSV
- [ ] All monetary values displayed in EUR with 2 decimal places and German number formatting (1.234,56)
- [ ] Report generation completes within 10 seconds for up to 12 months of data

## Edge Cases
- What happens when a quarter has zero transactions? -> Show empty report with all Kennzahlen at 0,00 EUR and a note "Keine Buchungen im Zeitraum"
- What happens when Konto 4320 (EU-Fernverkauf) has entries for countries not yet configured? -> Flag as "Land unbekannt" and include in Kz. 21 total with a warning
- What happens when a transaction is booked to the wrong account? -> Document audit highlights mismatches; user must correct in Sevdesk manually
- What happens when vouchers exist in Sevdesk but have no linked transaction? -> Show in FA-703 audit as "Beleg ohne Buchung"
- What happens when the Sevdesk API returns partial data during sync? -> Show last complete report with a "Daten moeglicherweise unvollstaendig" warning banner
- What happens when the user generates a report for a future period? -> Block with message "Zeitraum liegt in der Zukunft"
- What happens when §13b transactions have incorrect Vorsteuer/Umsatzsteuer pairing? -> Highlight as validation error in the document audit (FA-703)
- What happens when the deadline falls on a weekend or holiday? -> Adjust reminder to the last business day before the deadline

## Technical Requirements
- Sevdesk API endpoints: /AccountingType, /CheckAccount, /Voucher, /VoucherPos, /Invoice, /CreditNote
- SKR04 account mapping must be configurable (stored in database, not hardcoded)
- UStVA Kennzahlen calculation logic isolated in a dedicated service module for testability
- Report caching: generated reports cached for 1 hour to avoid redundant API calls
- German locale for all number and date formatting (de-DE)
- PDF generation using a server-side library (e.g., @react-pdf/renderer or puppeteer)
- All calculations use integer cents internally to avoid floating-point errors

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
