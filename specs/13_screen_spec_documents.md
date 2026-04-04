# 13 — Screen Spec Documents

## Ziel

Die Document-UI ist formularzentriert und bildet im normalen Produktpfad drei Familien ab:

- Kundenauftrag
- Produktionsdokumentation
- Qualifikationsnachweis

## Grundstruktur

Die Seite besteht kompakt aus:

1. eingeklapptem Dokumentheader
2. kompakter Assignment-/Task-Sicht
3. Formularcontainer als HTMX-Hauptkomponente
4. History, Journal und Attachments als platzsparende Nebenbereiche

## Dokumentheader

Der Header zeigt nur einmal klar:

- Formular / Template mit Version
- Workflow mit Version
- aktuellen Status
- nächsten Schritt für den aktuellen User

## Formularbereich

Der Formularbereich ist der führende Arbeitsraum.

Teilaktionen wie:

- Kundendaten laden
- Produktvorschlag holen
- Speichern
- Signieren

laufen lokal im Formularcontainer und halten die Position im Lesefluss.

## Kundenauftrag

Kundenauftrag zeigt im normalen Pfad:

- Auftragsnummer
- internen Customer-Lookup
- Einsatzort
- Rich-Text-Beschreibung
- internen Product-Vorschlag
- readonly Customer-/Product-Stammdaten

Keine ERP-SIM-Abhängigkeit ist Teil der führenden Produkt-UI.

## Produktionsdokumentation

Produktionsdokumentation zeigt:

- Batch-ID
- Seriennummer
- Produkt
- Produktionslinie
- `grid` für Produktions- und Prüfschritte

Der Grid ist im offenen Zustand editierbar und im readonly Zustand als kompakte Tabelle lesbar.

## Qualifikationsnachweis

Qualifikationsnachweis zeigt:

- Owner per `user-select`
- Teilnehmende per `user-multiselect`
- Fragen per `radio-group` und `checkbox-group`
- per-User Save/Submit/Signatur
- kompakte Beteiligten-/Fortschrittssicht

## Readonly / Pflicht

- Pflicht bleibt nur über `*` sichtbar
- readonly erklärt sich über Darstellung, nicht über Hilfstexte
- fehlende Pflichtwerte werden nicht breit ausgeschrieben

## Nicht Ziel

- Builder-Oberfläche
- SPA-Interaktion
- überladene Erklärungstexte im Dokumentpfad
