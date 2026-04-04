# 06 — TypeScript APIs Specification

## Ziel

TypeScript APIs sind der dritte Plattform-Kernbaustein neben Forms und Workflows.

Sie werden im aktuellen Plattformstand für drei Dinge genutzt:

- Formular-Lookups und Form-Actions
- lesende Stammdaten-APIs
- Formular-Datenbereitstellung als JSON und CSV

## Führende Operationen im Referenzstand

- `customers.lookup`
- `products.suggest`
- `customers.list`
- `products.list`

## Modellregel

Eine Operation wird zentral definiert über:

- `operationRef`
- Name / Beschreibung
- Connector
- Auth Strategy
- Request / Response
- Module Path

## Formularbezug

Formulare referenzieren Operationen über `operationRef`.

Im Template-Detail ist sichtbar und editierbar:

- welche Operationen das Formular nutzt
- welche Action-/Lookup-Bindings aktiv sind

## Referenzwelt

Im Reference Seed greifen die führenden Formularoperationen auf interne Stammdatentabellen zu.

ERP-SIM ist nicht mehr Grundlage des Referenzkerns.

## Nicht Ziel

- OpenAPI-/Swagger-Vollausbau
- vollständige Rechte- oder Tokenplattform
- allgemeine Integrationsplattform für alle künftigen Fälle
