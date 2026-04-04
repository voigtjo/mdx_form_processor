# Ziel-Spec: form_type und typed entity tables

## Fuehrendes Modell

Die Plattform trennt jetzt zwischen:

- `documents` als Prozess- und Workflow-Container
- `form_type` als fachlicher Typ eines Templates
- typed entity tables als fachliche Zielstruktur pro Familie

## Form Types

Gefuehrt werden mindestens:

- `customer_order`
- `production_record`
- `qualification_record`
- `generic_form`

`form_templates.form_type` ist damit Pflichtfeld fuer den Plattformkern.

## Typed Entity Tables

Die erste Zielstruktur besteht aus:

- `customer_orders`
- `production_records`
- `qualification_records`
- `generic_form_records`

## Aktueller Sync- und Read-Slice

Im aktuellen Plattformstand gilt bewusst noch:

- `documents.data_json` bleibt die generische Arbeits- und Fallbackschicht
- typed Tabellen werden zusaetzlich synchron befuellt
- Save, Submit, Approve, Reject und Archive halten die typed Records mit aktuell
- typed Tabellen dienen zugleich als fachliche Leseschicht fuer Listen-, Detail- und API-Schnitte

## Erwartete Kernfelder

### customer_orders

- `document_id`
- `order_number`
- `customer_name`
- `service_location`
- `material`
- `service_date`
- `technician`
- `work_description_html`
- `work_signature_at`
- `approval_status`
- `status`

### production_records

- `document_id`
- `batch_id`
- `serial_number`
- `product_name`
- `production_line`
- `process_steps_json`
- `work_signature_at`
- `approval_status`
- `status`

### qualification_records

- `document_id`
- `qualification_record_number`
- `qualification_title`
- `owner_user_id`
- `valid_until`
- `qualification_result`
- `qualification_topics_json`
- `evaluation_status`
- `score_value`
- `passed`
- `evaluated_at`
- `approval_status`
- `status`

### generic_form_records

- `document_id`
- `form_title`
- `description`
- `note`
- `approval_status`
- `status`
- `payload_json`

## Produktregel

Diese typed Tabellen sind kein zweiter UI-Pfad.
Sie sind die fachliche Zielstruktur hinter demselben normalen Produktpfad.

Lesend verfuegbar sind sie mindestens ueber:

- `/api/typed-records/:documentId`
- `/api/typed-records/customer-orders`
- `/api/typed-records/production-records`
- `/api/typed-records/qualification-records`
- `/api/typed-records/generic-form-records`

Dokumentliste und Suche duerfen typed Leitkennungen aus diesen Tabellen als primaere Fachschluessel verwenden.
