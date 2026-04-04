# 06 — TypeScript APIs Specification

## Ziel

TypeScript APIs sind der dritte Core-Baustein neben Forms und Workflows.

Sie werden zentral in der Datenbank gefuehrt, ueber `/apis` gepflegt und zur Laufzeit vom Produktpfad genutzt.

## Fuehrende API-Objekte

Eine API wird als wartbares Plattformobjekt gespeichert mit mindestens:

- `id`
- `key`
- `title`
- `status`
- `description`
- `connector`
- `auth_mode`
- `request_schema_json`
- `response_schema_json`
- `handler_ts_source`
- `tags_json`

## UI und Lifecycle

`/apis` ist die fuehrende Pflegeoberflaeche fuer APIs.

Mindestens verfuegbar:

- API-Liste
- Detail / Edit
- New API
- Save Draft
- Publish
- Unpublish
- Archive

## Runtime-Regel

Die fuehrende Wahrheit fuer Lookup- und Action-APIs liegt nicht in Spezialdateien, sondern in den DB-gepflegten API-Objekten.

Die Runtime laedt:

- API-Metadaten
- `handler_ts_source`

und fuehrt diesen Handler im vertrauenswuerdigen internen Serverprozess aus.

## Formular- und Workflow-Bezug

Formulare und Workflows referenzieren APIs ueber denselben zentralen API-Key.

- Templates zeigen und pflegen ihre API-Bindings im normalen Template-Detail.
- Workflows zeigen API-Referenzen aus derselben Quelle in der Transition-Tabelle.

Die Referenzplattform prueft diese APIs inzwischen auch in echten Start-to-End-Pfaden fuer:

- Kundenauftrag
- Produktionsdokumentation
- Qualifikationsnachweis

## Fuehrende Referenz-APIs

- `customers.lookup`
- `products.suggest`
- `customers.list`
- `products.list`

## Referenzwelt

Im Reference Seed greifen die fuehrenden APIs auf interne Stammdaten zu.

ERP-SIM ist nicht Teil des fuehrenden API-Kerns.
