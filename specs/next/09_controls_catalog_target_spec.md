# Ziel-Spec: Controls-Katalog fuer das Formularmodell

## Führende produktive Controls

### Basis

- `text`
- `textarea`
- `number`
- `date`
- `select`

### Aktionen

- `action`
- `lookup`

### Nutzerbezug

- `user-select`
- `user-multiselect`
- `signature`

### Rich Content

- `html-editor`

### Tabellen

- `grid`

### Fragen / Nachweise

- `radio-group`
- `checkbox-group`

## Produktive Nutzung im Referenzstand

- `html-editor` im Kundenauftrag
- `grid` in der Produktionsdokumentation
- `user-select`, `user-multiselect`, `radio-group`, `checkbox-group`, `signature` im Qualifikationsnachweis

## Semantik

Jedes Control muss konsistent in:

- Parser
- Persistenz
- readonly Darstellung
- Submit-Gate
- HTMX-Teilupdates

funktionieren.
