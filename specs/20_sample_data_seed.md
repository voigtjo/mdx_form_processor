# 20 — Sample Data Seed

## Ziel

Der führende `reference`-Seed bildet jetzt genau drei Produktfamilien ab:

- `Kundenauftrag`
- `Produktionsdokumentation`
- `Qualifikationsnachweis`

Historische Beispielwelten wie reine Evidence-/Umbau-Referenzen sind nicht mehr Teil der führenden Produktsicht.

## Führender Reference Seed

Der Reference Seed enthält reproduzierbar:

- 5 User
- 2 Gruppen
- 3 publizierte Workflows
- 3 publizierte Templates
- sichtbare Referenzdokumente für alle drei Familien
- Aufgaben, Assignments, Audit Events und ausgewählte Attachments
- interne Customer- und Product-Stammdaten aus CSV
- sichtbare TypeScript-Operationen und API-/CSV-Slices

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
- Workflow: `Kundenauftrag Freigabe`
- Stammdatenbasis: interne `Customers` und `Products`

### Produktionsdokumentation

- Template: `Produktionsdokumentation`
- Workflow: `Produktionsdokumentation Freigabe`
- fachlicher Kern: Batch, Serie, Produkt, Grid für Schritte

### Qualifikationsnachweis

- Template: `Qualifikationsnachweis`
- Workflow: `Qualifikationsnachweis Review`
- fachlicher Kern: Mehrbenutzer, per-User Save/Submit/Signatur, Fragen

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
- internen Stammdaten

in einem reproduzierbaren Zustand wiederherstellen.
