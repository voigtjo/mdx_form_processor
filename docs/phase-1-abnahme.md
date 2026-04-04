# Phase 1 Abnahme

## Ueberblick

Phase 1 schliesst die Plattform als SSR- und HTMX-basierte Formular-Prozess-Plattform ab.
Fuehrend ist der normale Produktpfad ueber:

- Templates
- Workflows
- Documents
- APIs
- Admin

Der Referenzstand ist auf vier stabile Formtypen gezogen:

- `customer_order`
- `production_record`
- `qualification_record`
- `generic_form`

## Abgeschlossen

- versionierte Templates mit `form_type`, API-Bindings und Lifecycle
- versionierte Workflows mit editierbarer Tabelle, JSON-Modal und Lifecycle
- Documents als fuehrender Prozesscontainer mit Save, Submit, Approve, Reject und Archive
- APIs als DB-Objekte mit UI-Pflege und Runtime
- interne Stammdaten via CSV plus lesende APIs fuer Customers und Products
- typed entity tables fuer alle vier Formtypen
- typed record APIs pro Familie inkl. Detail und CSV-Export
- Grid, `user-select`, `user-multiselect`, `radio-group`, `checkbox-group`, `signature`, `html-editor`
- Mehrbenutzer-Qualifikationsnachweis mit Pages, per-User Save/Submit/Signatur und erster Auswertung
- generisches Formular als vierter echter Produktpfad
- Smoke- und Start-to-End-Tests fuer die Referenzwelt

## Teilweise abgeschlossen

- typed tables sind fachliche Leseschicht und API-Basis, aber noch nicht die alleinige Schreib- und Listenquelle
- Qualification Pages sind fachlich produktiv, aber noch nicht als allgemeines Mehrseitenmodell fuer alle Formtypen verallgemeinert
- typed records sind sichtbar im Produktpfad, aber noch nicht als eigene Fachlistenoberflaechen ausgebaut

## Bewusst erst in Phase 2

- konkrete Fachlogik fuer die eigentliche Handwerkerplattform
- weitere Fachformtypen jenseits der vier Referenztypen
- tiefere Reporting-, Aggregations- oder Dashboardlogik
- Medienausbau ueber Journal/Attachments hinaus
- Ausbau externer Systemanbindungen ueber die vorhandene API-Basis hinaus
- typed-only Runtime ohne `documents.data_json` als Fallback

## Offene Risiken und Restpunkte

- API-Handler laufen im MVP vertrauenswuerdig im Serverprozess; eine haertere Sandbox ist bewusst kein Phase-1-Ziel
- parallele Testlaeufe mit DB-Rebuild koennen Deadlocks ausloesen; die Referenztests sollten nacheinander laufen
- typed read models sind fachlich stark genug fuer Phase 1, aber fuer Phase 2 noch nicht die einzige Quelle

## Abschlussbewertung

Aus meiner Sicht ist Phase 1 abnahmereif.

Der Plattformkern ist stabil vorhanden, die Referenzwelt ist konsistent, die vier Produktfamilien laufen im normalen Produktpfad, APIs und typed records sind als Plattformbausteine sichtbar und testbar, und es gibt ein sauberes manuelles End-to-End-Testhandbuch fuer die Abnahme.
