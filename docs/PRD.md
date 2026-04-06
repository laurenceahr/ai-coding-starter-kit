# Product Requirements Document

## Vision
APA (Ahrabian Personal Assistant) ist eine eigenstaendige Web-App, die die Buchhaltung eines E-Commerce-Einzelunternehmens (3 Online-Shops, SKR04, quartalsweise UStVA) vollautomatisch abwickelt. Das System ersetzt eine bestehende CLI-basierte Automatisierung (Claude Code + Python) durch eine produktionsreife Anwendung mit Scheduler, Dashboard und Benachrichtigungen. Ziel: 5+ Stunden manuelle Arbeit pro Woche einsparen.

## Target Users
**Primaernutzer:** Solo E-Commerce Einzelunternehmer (Laurence Ahrabian)

**Geschaeftskontext:**
- 3 Online-Shops: Agrocenter24, Greenstoff, 7Pets Shop (Shopify/WooCommerce)
- Kontenrahmen SKR04, Buchungssystem sevdesk
- Payment Provider: Mollie (Klarna, Karte, Apple Pay), PayPal (3 Konten), Amex
- UStVA-Rhythmus: Quartalsweise
- Steuerberater: Drexler & Partner mbB, Brannenburg

**Needs & Pain Points:**
- Verbringt zu viel Zeit mit manueller Buchhaltung (Belege erfassen, Bankabgleich, UStVA)
- Belege kommen ueber mehrere Kanaele und muessen in sevdesk erfasst werden
- Braucht ein zentrales Dashboard statt zwischen Tools zu wechseln
- Routine-Tasks sollen automatisch laufen, Bestaetigung nur bei wichtigen Entscheidungen

## Core Features (Roadmap)

| Priority | Feature | Status |
|----------|---------|--------|
| P0 (MVP) | PROJ-1: Authentifizierung & Sicherheit | Planned |
| P0 (MVP) | PROJ-3: Sevdesk API-Grundlage | Planned |
| P0 (MVP) | PROJ-14: Lieferanten-Verwaltung | Planned |
| P0 (MVP) | PROJ-4: Beleg-Upload Pipeline | Planned |
| P0 (MVP) | PROJ-5: Bank-Synchronisation | Planned |
| P0 (MVP) | PROJ-7: Mollie-Integration | Planned |
| P0 (MVP) | PROJ-9: Entwurfs-Promotion | Planned |
| P0 (MVP) | PROJ-6: Matching-Engine (Bankabgleich) | Planned |
| P0 (MVP) | PROJ-8: PayPal-Sonderbuchungen | Planned |
| P1 | PROJ-10: Reporting & UStVA | Planned |
| P1 | PROJ-11: Stornierung | Planned |
| P1 | PROJ-12: Scheduler & Pipeline-Orchestrierung | Planned |
| P1 | PROJ-13: Benachrichtigungen | Planned |
| P1 | PROJ-2: Dashboard | Planned |

### Empfohlene Reihenfolge

1. **Grundlage:** PROJ-1 (Auth) → PROJ-3 (Sevdesk API) → PROJ-14 (Lieferanten)
2. **Daten-Import (parallel):** PROJ-4 (Beleg-Upload) + PROJ-5 (Bank-Sync) + PROJ-7 (Mollie)
3. **Verarbeitung:** PROJ-9 (Entwurfs-Promotion) → PROJ-6 (Matching-Engine) → PROJ-8 (PayPal)
4. **Auswertung (parallel):** PROJ-10 (Reporting) + PROJ-11 (Stornierung)
5. **Orchestrierung:** PROJ-12 (Scheduler) → PROJ-13 (Benachrichtigungen) → PROJ-2 (Dashboard)

## Success Metrics
- Zeitersparnis bei Buchhaltungs-Tasks pro Woche (Ziel: 5+ Stunden)
- Prozentsatz automatisch erfasster Belege vs. manuelle Eingabe (Ziel: >80%)
- Matching-Genauigkeit: <2% False Positives bei Auto-Book
- Kompletter Pipeline-Durchlauf in < 5 Minuten
- Dashboard-Ladezeit unter 2 Sekunden
- Null verpasste Belege ueber 30 Tage

## Constraints
- **Team:** Solo-Entwickler
- **Budget:** ~50-100 EUR/Monat fuer APIs und Services
- **Tech Stack:** Next.js (App Router), TypeScript, Sevalla (PostgreSQL, Object Storage, Hosting), NextAuth.js
- **APIs:** sevdesk REST API v1, Mollie REST API v2, finAPI (via sevdesk)
- **Sprache:** Deutsche Sprache im gesamten UI (NFA-504)
- **Waehrung:** EUR mit 2 Nachkommastellen, deutsches Format (1.234,56 EUR)
- **Bestehendes System:** 7 Python-Tasks, Matching-Engine, 95 Lieferanten-Mappings (Uebernahme-Kandidaten)

## Non-Goals
- **Nicht in dieser Version:** ELSTER-Uebermittlung (laeuft ueber sevdesk-UI oder Steuerberater)
- **Nicht in dieser Version:** Steuerberatung/automatisierte Empfehlungen bei unbekannten Vorfaellen
- **Nicht in dieser Version:** Jahresabschluss (Steuerberater-Aufgabe)
- **Nicht in dieser Version:** Rechnungserstellung (laeuft ueber Shopify/WooCommerce → sevdesk Sync)
- **Nicht in dieser Version:** Sammelbuchungen 1:N / Ratenerkennung N:1 / Gutschriften (Phase 2)
- **Nicht in dieser Version:** Mobile App — nur Web
- **Nicht in dieser Version:** Multi-User Features

## Externe Schnittstellen

| System | API | Auth | Zweck |
|--------|-----|------|-------|
| sevdesk | REST v1 (`my.sevdesk.de/api/v1/`) | API Token | Buchhaltungs-Backend (CRUD) |
| Mollie | REST v2 (`api.mollie.com/v2/`) | Bearer Token (Org) | Zahlungsdaten (Read + Settlements) |
| finAPI | via sevdesk | Managed | Bank-Import Trigger |

## Risiken

| Risiko | Auswirkung | Mitigation |
|--------|-----------|------------|
| sevdesk API-Aenderungen | Buchungen schlagen fehl | API-Version pinnen, Monitoring |
| Mollie Org-Token-Ablauf | Settlement-Import stoppt | Token-Refresh-Mechanismus |
| Falsche Lieferanten-Zuordnung | Falsche Steuerbuchung | Review-Ordner + Benachrichtigung |
| Matching False Positive | Falsche Zuordnung | Gegenpruefung + Audit-Trail |
| Sammelbuchungen (Phase 2) | Manuelle Arbeit noetig | Hinweis-System |

---

Use `/requirements` to create detailed feature specifications for each item in the roadmap above.
