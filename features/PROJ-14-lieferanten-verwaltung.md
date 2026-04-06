# PROJ-14: Lieferanten-Verwaltung

## Status: Planned
**Created:** 2026-04-04
**Last Updated:** 2026-04-04

## Dependencies
- Requires: PROJ-3 (Sevdesk Integration) — supplier data synced with Sevdesk contacts

## User Stories
- As a solo entrepreneur, I want a CRUD interface for managing my supplier master data so that I can add, edit, and remove suppliers without touching code or config files
- As a solo entrepreneur, I want to import my existing 95 supplier mappings from the legacy Python config so that I do not have to re-enter all supplier data manually
- As a solo entrepreneur, I want to search and filter suppliers by name, category, or tax rule so that I can quickly find a specific supplier in a growing list
- As a solo entrepreneur, I want each supplier to have a defined tax rule (19%, §13b EU, §13b Drittland, keine USt) so that bookings are automatically assigned the correct VAT treatment
- As a solo entrepreneur, I want to define bank alias mappings (e.g., MSFT -> Microsoft, UZR -> Haufe Lexware) per supplier so that the matching engine can identify suppliers from abbreviated bank statement text
- As a solo entrepreneur, I want the supplier list to be extensible without code changes so that I can add new suppliers as my business grows (NFA-401)
- As a solo entrepreneur, I want to see which SKR04 account is assigned to each supplier so that I can verify correct expense categorization at a glance

## Acceptance Criteria
- [ ] CRUD UI: user can create, read, update, and delete suppliers through a dedicated management page
- [ ] Supplier data model includes: name (required), contact_number (optional), account (SKR04 account, required), tax_rule (enum: 19%, §13b_EU, §13b_Drittland, keine_USt, required), category (required)
- [ ] Tax rule mappings are enforced:
  - 19% (standard): standard Vorsteuer on Konto 1406
  - §13b EU: expense on Konto 5923, Vorsteuer on 1407, Umsatzsteuer on 3837
  - §13b Drittland: expense on Konto 5925, Vorsteuer on 1407, Umsatzsteuer on 3837
  - keine USt: TaxRule 9 in Sevdesk (no VAT applied)
- [ ] Import function: bulk import from JSON/CSV of existing 95 supplier mappings with validation report (imported, skipped with reason)
- [ ] Search: real-time text search across supplier name and category with results updating as the user types
- [ ] Filter: dropdown filters for tax_rule and category, combinable with text search
- [ ] Validation: duplicate supplier names are rejected with error message "Lieferant mit diesem Namen existiert bereits"
- [ ] Validation: all required fields (name, account, tax_rule, category) must be filled before save
- [ ] Bank alias mappings: each supplier can have 0..n bank aliases; aliases must be unique across all suppliers
- [ ] Special cases documented in UI tooltips:
  - Microsoft DE (19%) vs Microsoft Ireland (§13b EU) are separate supplier entries
  - Mollie B.V. fees use keine_USt (TaxRule 9)
- [ ] NFA-401: supplier list is data-driven (database table), not hardcoded — adding a supplier requires zero code changes
- [ ] Supplier data syncs bidirectionally with Sevdesk contacts (create/update in APA reflects in Sevdesk and vice versa)

## Edge Cases
- What happens when the user tries to delete a supplier that has existing bookings? -> Block deletion with message "Lieferant hat X zugeordnete Buchungen — bitte zuerst Buchungen umbuchen"
- What happens when two suppliers share the same bank alias? -> Reject the duplicate alias at save time with "Alias 'MSFT' ist bereits Lieferant 'Microsoft DE' zugeordnet"
- What happens when the import file contains a supplier that already exists? -> Skip with note "Uebersprungen: Lieferant 'Microsoft DE' existiert bereits" in the import report
- What happens when the import file has invalid data (missing required fields)? -> Skip the row, include in validation report: "Zeile 42: Pflichtfeld 'account' fehlt"
- What happens when a supplier's tax rule is changed after bookings have been made? -> Warn: "Aenderung betrifft nur zukuenftige Buchungen. X bestehende Buchungen behalten die alte Steuerregel."
- What happens when the Sevdesk API is unavailable during supplier sync? -> Save locally, queue sync, show "Aenderung lokal gespeichert — Sevdesk-Sync ausstehend" badge
- What happens when the user searches for a supplier with special characters (umlauts, ampersand)? -> Search handles UTF-8 correctly; "Muller" matches "Mueller" via normalized search (optional: fuzzy matching)
- What happens when the supplier list grows to 500+ entries? -> Paginate with 50 per page, virtual scrolling, server-side search to maintain performance

## Technical Requirements
- Database table: suppliers (id, name, contact_number, account, tax_rule, category, created_at, updated_at)
- Database table: bank_aliases (id, supplier_id FK, alias, created_at) with unique constraint on alias
- Sevdesk API endpoints: /Contact (CRUD), /ContactAddress for supplier sync
- Import: accept JSON and CSV formats; parse and validate server-side before insert
- Search: PostgreSQL full-text search or ILIKE with index on name and category columns
- Pagination: cursor-based for consistent performance on growing datasets
- Tax rule enum stored as database enum type for type safety
- Supplier changes logged in an audit table (supplier_audit_log) with: supplier_id, field_changed, old_value, new_value, changed_at, changed_by
- API: REST endpoints under /api/suppliers with GET (list/search), POST (create), PUT (update), DELETE (soft delete)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
