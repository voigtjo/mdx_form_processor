# 25 — Screen Spec APIs

## Ziel

Die API-Seite macht den dritten Plattform-Baustein sichtbar:

- zentrale TypeScript-Operationen
- Form-Data-APIs
- interne Stammdaten-APIs
- CSV-Import für Customers und Products
- CSV-Export für Formulardaten

## Struktur

Die Seite bleibt kompakt:

1. Header
2. TypeScript Operations
3. Form Data APIs
4. Stammdaten APIs
5. CSV Import Customers / Products

## Operations

Mindestens sichtbar:

- `customers.lookup`
- `products.suggest`
- `customers.list`
- `products.list`

Je Operation sichtbar:

- `operationRef`
- Request / Response
- Nutzung in Formularen
- Nutzung in Workflows

## Stammdaten APIs

Es gibt lesende interne APIs für:

- `/api/entities/customers`
- `/api/entities/customers/:entityKey`
- `/api/entities/products`
- `/api/entities/products/:entityKey`

Diese APIs sind die führende Referenzbasis für interne Customer- und Product-Stammdaten.

## Form Data APIs

Pro Template sichtbar:

- JSON Liste
- JSON Einzelrecord
- CSV Export

## Pflege-Regel

- zentrale API-Definition auf `/apis`
- konkrete Formularnutzung im Template-Detail
