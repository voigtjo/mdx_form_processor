# Ziel-Spec: Grid, CSV und Datenaustausch

## Grid

Der erste produktive Grid-Slice ist klein und nutzbar:

- Spalten werden im Template definiert
- Zeilen werden im Dokument gepflegt
- Werte werden strukturiert gespeichert
- readonly rendert kompakt als Tabelle

Führender Referenzfall:

- Produktionsdokumentation
- Grid `process_steps`

## CSV Import

CSV ist der führende Referenzweg für interne Stammdaten:

- `Customers`
- `Products`

## CSV Export

Formulardaten können pro Template als CSV exportiert werden:

- mit Header
- mit Dokumentmetadaten
- optional mit Feldselektion

## JSON APIs

Formulardaten können zusätzlich als JSON bereitgestellt werden:

- Liste pro Template
- Einzelrecord
- optionale Feldselektion
