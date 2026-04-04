# 25 — Screen Spec APIs

## Ziel

`/apis` ist die produktive Pflegeoberflaeche fuer den dritten Plattform-Baustein:

- zentrale TypeScript APIs
- Form-Data-JSON/CSV-Schnitte
- interne Stammdaten-APIs
- CSV-Import fuer Customers und Products

## Hauptbereiche

1. kompakter API-Header
2. API-Liste
3. API-Detail / Edit
4. Form-Data-APIs
5. Stammdaten-APIs
6. Typed Record APIs
7. CSV-Import

## API-Liste

Je API sichtbar:

- `key`
- `title`
- `status`
- `connector`
- `auth_mode`
- Request-/Response-Felder
- Nutzung in Templates, Workflows und Documents

## API-Detail

Pflegbar ueber UI:

- Key
- Title
- Description
- Connector
- Auth Mode
- Request Schema JSON
- Response Schema JSON
- Handler Source
- Tags

Layoutregel:

- `Description` ist normales Eingabefeld, kein Codeblock
- `Handler Source` steht oberhalb von `Request / Response`
- Detail bleibt eine wartbare Plattformmaske statt Technik-Review-Fläche

Lifecycle im selben Detail:

- Save Draft
- Publish
- Unpublish
- Archive

## Stammdaten- und Form-Data-Schnitte

Es gibt lesende interne APIs fuer:

- `/api/entities/customers`
- `/api/entities/customers/:entityKey`
- `/api/entities/products`
- `/api/entities/products/:entityKey`

und fuer Formulardaten:

- `/api/form-data/templates/:templateKey`
- `/api/form-data/templates/:templateKey/:documentId`
- `/api/form-data/templates/:templateKey/export.csv`

Ergaenzend gibt es fuer den typed-entity-Slice:

- `/api/typed-records/:documentId`
- `/api/typed-records/customer-orders`
- `/api/typed-records/customer-orders/:documentId`
- `/api/typed-records/production-records`
- `/api/typed-records/production-records/:documentId`
- `/api/typed-records/qualification-records`
- `/api/typed-records/qualification-records/:documentId`
- `/api/typed-records/generic-form-records`
- `/api/typed-records/generic-form-records/:documentId`

Optional und klein gehalten:

- `/api/typed-records/customer-orders/export.csv`
- `/api/typed-records/production-records/export.csv`
- `/api/typed-records/qualification-records/export.csv`
- `/api/typed-records/generic-form-records/export.csv`

Auf `/apis` gibt es dafuer einen eigenen kompakten Bereich `Typed Record APIs` mit JSON- und CSV-Links je Familie.

## Produktregel

`/apis` ist kein reiner Lesekatalog mehr.
Die Seite ist die fuehrende Wartungsoberflaeche fuer APIs, waehrend Templates und Workflows nur deren Nutzung referenzieren.

Start-to-End-relevant sind im Referenzstand besonders:

- `customers.lookup`
- `products.suggest`
