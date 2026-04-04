# Ziel-Spec: Teststrategie

## Führende Reference-Checks

`build`, `smoke:reference` und `smoke:next-form` müssen den führenden Plattformstand absichern.

## Pflichtabdeckung im aktuellen Stand

### Referenzwelt

- 5 User
- 2 Gruppen
- 3 Familien
- interne Customer-/Product-Stammdaten

### Kundenauftrag

- interner Customer-Lookup
- interner Product-Vorschlag
- HTMX-Teilupdates

### Produktionsdokumentation

- Grid wird gerendert
- Grid-Werte bleiben nach Save erhalten
- readonly Grid funktioniert

### Qualifikationsnachweis

- `user-select`
- `user-multiselect`
- `radio-group`
- `checkbox-group`
- per-User Save/Submit/Signatur

### APIs / CSV

- `/apis` sichtbar
- Stammdaten-APIs liefern Daten
- Form-Data-APIs liefern Daten
- CSV Import / Export funktionieren

## Nicht Ziel dieses Testpakets

- vollständige End-to-End-Suite
- Medien- und Kamera-Flows
- Reporting oder Aggregationsausbau
