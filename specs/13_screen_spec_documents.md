# 13 — Screen Spec Documents

## Ziel

Die Document-UI ist formularzentriert und bildet im normalen Produktpfad vier Familien ab:

- Kundenservice-Dokumentation
- Produktionsdokumentation
- Qualifikationsnachweis
- Generisches Formular

## Grundstruktur

Die Seite besteht kompakt aus:

1. eingeklapptem Dokumentheader
2. kompakter Assignment-/Task-Sicht
3. Formularcontainer als HTMX-Hauptkomponente
4. History, Journal und Attachments als platzsparende Nebenbereiche

## Dokumentheader

Der Header zeigt nur einmal klar:

- Formular / Template mit Version
- Form Type
- Workflow mit Version
- aktuellen Status
- nächsten Schritt für den aktuellen User

## Formularbereich

Der Formularbereich ist der führende Arbeitsraum.
Der Formular-POST-Pfad ist `/documents/:id/form`.

`documents` bleibt dabei der Prozesscontainer.
Zusätzlich werden Kernfelder in typed entity tables pro `form_type` synchronisiert und dort fachlich lesbar gehalten.
Der Dokumentkontext zeigt dezent:

- `form_type`
- typed table
- typed Record vorhanden / nicht vorhanden
- Link zur typed-record API des aktuellen Dokuments

Lookup- und Action-Aufrufe laufen gegen publizierte zentrale APIs aus der Datenbank, nicht gegen eine separate Preview- oder Dev-Form-UI.

Teilaktionen wie:

- Kundendaten laden
- Produktvorschlag holen
- Speichern
- Signieren

laufen lokal im Formularcontainer und halten die Position im Lesefluss.

## Kundenservice-Dokumentation

Kundenservice-Dokumentation zeigt im normalen Pfad:

- Einsatz- / Auftragsnummer
- internen Customer-Lookup
- Einsatzort
- Rich-Text-Beschreibung fuer Taetigkeit / Befund
- internen Product-Vorschlag
- Arbeitszeit, Fahrzeit und Pause
- Techniker / Monteur
- readonly Customer-/Product-Stammdaten

Die Dokumentliste und Suche duerfen dabei `order_number` als fachliche Leitkennung nutzen, statt nur auf Titelstrings zu vertrauen.

Der sichtbare Produktpfad wirkt dabei wie Serviceeinsatz- und Monteursdokumentation, nicht wie eine generische Formularprobe.

Keine ERP-SIM-Abhängigkeit ist Teil der führenden Produkt-UI.

## Produktionsdokumentation

Produktionsdokumentation zeigt:

- Batch-ID
- Seriennummer
- Produkt
- Produktionslinie
- `grid` für Produktions- und Prüfschritte

Der Grid ist im offenen Zustand editierbar und im readonly Zustand als kompakte Tabelle lesbar.
Die Dokumentliste und Suche duerfen `batch_id` als Leitkennung nutzen.

## Qualifikationsnachweis

Qualifikationsnachweis zeigt:

- Owner per `user-select`
- Teilnehmende per `user-multiselect`
- Fragen per `radio-group` und `checkbox-group`
- 3 Pages mit Vor / Zurueck
- per-User Save/Submit/Signatur
- kompakte Beteiligten-/Fortschrittssicht
- sichtbare Auswertung mit Status, Score, Pass und Zeitpunkt

Nur die aktuelle Qualifikations-Seite ist gleichzeitig sichtbar.
Die Dokumentliste und Suche duerfen `qualification_record_number` als Leitkennung nutzen.

## Generisches Formular

Generisches Formular zeigt als kleinster vierter Typ:

- Titel
- Beschreibung
- Notiz
- Freigabestatus
- Signatur

Der Typ laeuft ohne Sonder-UI im normalen Dokumentpfad und befuellt `generic_form_records`.
Die Dokumentliste und Suche duerfen `form_title` als Leitkennung nutzen.

## Readonly / Pflicht

- Pflicht bleibt nur über `*` sichtbar
- readonly erklärt sich über Darstellung, nicht über Hilfstexte
- fehlende Pflichtwerte werden nicht breit ausgeschrieben

## Nicht Ziel

- Builder-Oberfläche
- SPA-Interaktion
- überladene Erklärungstexte im Dokumentpfad
