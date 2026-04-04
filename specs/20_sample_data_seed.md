# 20 — Sample Data Seed

## Ziel

Der führende `reference`-Seed bildet jetzt genau vier Produktfamilien ab:

- `Kundenauftrag`
- `Produktionsdokumentation`
- `Qualifikationsnachweis`
- `Generisches Formular`

Historische Beispielwelten wie reine Evidence-/Umbau-Referenzen sind nicht mehr Teil der führenden Produktsicht.

## Führender Reference Seed

Der Reference Seed enthält reproduzierbar:

- 5 User
- 2 Gruppen
- 4 publizierte Workflows
- 4 publizierte Templates
- sichtbare Referenzdokumente für alle vier Familien
- Aufgaben, Assignments, Audit Events und ausgewählte Attachments
- interne Customer- und Product-Stammdaten aus CSV
- sichtbare TypeScript-Operationen und API-/CSV-Slices
- typed Records fuer alle vier Formulartypen
- typed Leitkennungen pro Familie in Dokumentliste und Suche
- typed record APIs pro Familie

## User

Der führende Seed enthält diese User:

- `Admin`
- `Service Auftrag / Freigabe`
- `Service Durchfuehrung / Dokumentation`
- `Produktion Auftrag / Freigabe`
- `Produktion Durchfuehrung / Dokumentation`

## Gruppen

Der führende Seed enthält diese Gruppen:

- `Kundenservice`
- `Produktion`

Zuordnung:

- Kundenauftrag gehört zu `Kundenservice`
- Produktionsdokumentation gehört zu `Produktion`
- Qualifikationsnachweis wird beiden Gruppen zugewiesen

## Templates und Workflows

### Kundenauftrag

- Template: `Kundenauftrag`
- `form_type`: `customer_order`
- Workflow: `Kundenauftrag Freigabe`
- Stammdatenbasis: interne `Customers` und `Products`
- Leitkennung: `order_number`

### Produktionsdokumentation

- Template: `Produktionsdokumentation`
- `form_type`: `production_record`
- Workflow: `Produktionsdokumentation Freigabe`
- fachlicher Kern: Batch, Serie, Produkt, Grid für Schritte
- Leitkennung: `batch_id`

### Qualifikationsnachweis

- Template: `Qualifikationsnachweis`
- `form_type`: `qualification_record`
- Workflow: `Qualifikationsnachweis Review`
- fachlicher Kern: Mehrbenutzer, Pages, per-User Save/Submit/Signatur, Fragen und Auswertung
- Leitkennung: `qualification_record_number`

### Generisches Formular

- Template: `Generisches Formular`
- `form_type`: `generic_form`
- Workflow: `Generisches Formular Freigabe`
- fachlicher Kern: kleiner allgemeiner Freigabe- und Notizpfad
- Leitkennung: `form_title`

## Stammdaten

Interne Stammdaten werden im Reference Seed nicht mehr manuell im Code gepflegt, sondern per CSV eingespielt:

- `specs/next/examples/customers_import.csv`
- `specs/next/examples/products_import.csv`

Diese CSVs sind der führende Referenzweg für Customer- und Product-Stammdaten.

## Rebuild-Regel

`npm run db:rebuild:reference` muss den vollständigen Reference Seed einschließlich:

- Usern
- Gruppen
- Workflows
- Templates
- Dokumenten
- typed entity tables
- typed record family APIs
- internen Stammdaten

in einem reproduzierbaren Zustand wiederherstellen.
