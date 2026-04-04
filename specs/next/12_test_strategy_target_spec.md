# Ziel-Spec: Teststrategie

## Führende Reference-Checks

`build`, `smoke:reference`, `smoke:forms` und `e2e:reference` sichern den führenden Plattformstand ab. `smoke:next-form` bleibt vorerst nur als Kompatibilitaetsalias erhalten.

Eine Preview-/Dev-Form-UI ist kein Bestandteil der Teststrategie mehr; der Produktpfad selbst ist die fuehrende Testbasis.

## Pflichtabdeckung im aktuellen Stand

### Referenzwelt

- 5 User
- 2 Gruppen
- 4 Familien
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
- Page-Navigation
- nur aktuelle Page sichtbar
- berechnete Auswertung
- per-User Save/Submit/Signatur

### Generic Form

- startbar im normalen Dokumentpfad
- save / submit / approve
- `generic_form_records` wird befuellt

### APIs / CSV

- `/apis` sichtbar
- `/apis` als Pflegeoberflaeche mit Draft/Publish
- Stammdaten-APIs liefern Daten
- Form-Data-APIs liefern Daten
- CSV Import / Export funktionieren

### Typed Entities

- `form_type` ist an Templates sichtbar
- typed entity tables werden befuellt
- typed records sind per `/api/typed-records/:documentId` lesbar
- typed record family endpoints liefern Listen und Details
- typed record CSV-Exporte sind pro Familie pruefbar
- Documents-Suche findet Familien ueber typed Leitkennungen
- Document Context zeigt typed-record API-Link
- die vier Referenzdokumente haben fachliche Zielrecords

### Start-to-End

- Kundenauftrag: lookup, save, submit, approve
- Produktionsdokumentation: grid, save, submit, approve
- Qualifikationsnachweis: page navigation, per-User save/sign/submit plus owner approval
- Generisches Formular: save, submit, approve

## Nicht Ziel dieses Testpakets

- Medien- und Kamera-Flows
- Reporting oder Aggregationsausbau
