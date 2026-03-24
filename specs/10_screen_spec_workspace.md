# 10 — Screen Specification: Workspace

## 1. Ziel dieses Dokuments

Dieses Dokument definiert die führende Spezifikation für den Screen **My Workspace** im MVP.

Es legt verbindlich fest:

- welchen Zweck der Workspace hat
- welche Nutzerperspektive er bedient
- welche Bereiche dort sichtbar sind
- welche Informationen standardmäßig gezeigt werden
- welche Aktionen von dort aus möglich sind
- welche Informationen bewusst nicht dort angezeigt werden
- wie sich der Workspace von Template-, Workflow-, Document- und Admin-Seiten abgrenzt

Dieses Dokument ist die führende Wahrheit für den Workspace-Screen.

---

## 2. Rolle des Workspace im Produkt

Der Workspace ist die führende Start- und Übersichtsseite der Arbeits-UI.

Er dient dazu, dem aktuell ausgewählten User sofort zu zeigen:

- in welchen Groups er arbeitet
- welche Tasks offen oder relevant sind
- welche Templates für ihn verfügbar sind
- welche Documents für ihn aktuell wichtig sind

Der Workspace ist:

- arbeitsorientiert
- userzentriert
- handlungsorientiert

Der Workspace ist nicht:

- ein Konfigurationsscreen
- ein Adminscreen
- eine technische Systemübersicht
- eine JSON-/Debug-Oberfläche
- ein KPI-/BI-Dashboard

---

## 3. Primäre Nutzergruppe des Workspace

Der Workspace richtet sich an den aktuell ausgewählten **Arbeitsnutzer**.

Typische Nutzer:
- Editor
- Approver
- allgemeiner User mit Sicht auf Templates und Documents

Der Workspace ist nicht primär für:
- Template-Design
- Workflow-Design
- technische Integrationspflege
- Administrationspflege

---

## 4. Primärer Zweck des Workspace

Der Workspace beantwortet für den aktuellen User auf einen Blick diese Fragen:

1. In welchen Groups arbeite ich?
2. Was muss ich als Nächstes tun?
3. Welche Templates kann ich verwenden?
4. Welche Documents sind für mich aktuell relevant?

Der Workspace ist damit die führende **Arbeitsorientierungsseite**.

---

## 5. Grundstruktur des Workspace

Der Workspace besteht aus diesen führenden Bereichen:

1. Header mit User-Selektion
2. My Groups
3. My Tasks
4. My Templates
5. My Documents

Diese Bereiche sind im MVP verpflichtend.

---

## 6. Header des Workspace

## 6.1 Zweck

Der Header des Workspace dient dazu:

- den Produktkontext sichtbar zu machen
- den aktuell ausgewählten User zu zeigen
- den Nutzerkontext zu wechseln

## 6.2 Pflichtinhalte

- Produktname oder klarer Produkttitel
- User-Selektion
- Hauptnavigation

## 6.3 User-Selektion

Im MVP gibt es keine Authentifizierung.
Stattdessen wird der aktive User ausgewählt.

Die User-Selektion ist daher Teil des Workspace-Headers.

### Fachliche Regel

Ein Wechsel des ausgewählten Users ändert den gesamten sichtbaren Workspace-Kontext:

- My Groups
- My Tasks
- My Templates
- My Documents

---

## 7. Bereich: My Groups

## 7.1 Zweck

My Groups zeigt dem aktuellen User die Groups, in denen er Mitglied ist.

## 7.2 Sichtbare Informationen

Für jede Group mindestens:

- Name
- optional Beschreibung

## 7.3 Funktionale Bedeutung

My Groups dient:
- der Orientierung
- der Erklärung, warum Templates sichtbar sind
- der Einordnung des organisatorischen Kontexts

## 7.4 Nicht Ziel dieses Bereichs

My Groups ist nicht:
- ein Editor für Groups
- eine Rechteverwaltung
- eine Membership-Verwaltung

---

## 8. Bereich: My Tasks

## 8.1 Zweck

My Tasks zeigt die offenen oder aktuell relevanten Arbeitsaufgaben des ausgewählten Users.

## 8.2 Was ist ein Task im Workspace

Ein Task ist eine konkrete Aufforderung, an einem Document eine nächste sinnvolle Aktion auszuführen.

Beispiele:
- Approve Customer Order 4711
- Submit Batch B-2026-0042
- Continue Evidence Document

## 8.3 Sichtbare Informationen pro Task

Mindestens sichtbar:

- kurze Aufgabenbezeichnung
- Bezug auf Document
- Bezug auf Template oder Prozesskontext
- optional Status oder nächste Action

## 8.4 Aktionen aus My Tasks

Von einem Task aus muss der User mindestens:
- das zugehörige Document öffnen können

Optional später:
- direkte Schnellaktion

## 8.5 Sortierung

My Tasks sollen standardmäßig nach Relevanz sortiert werden.

Empfohlene einfache MVP-Reihenfolge:
1. offene Actions mit Ausführungsbedarf
2. zuletzt aktualisierte
3. optional ältere zuletzt

## 8.6 Nicht Ziel dieses Bereichs

My Tasks ist nicht:
- eine vollständige Workflowhistorie
- eine Team-Queue
- eine Admin-Liste aller Tasks im System

---

## 9. Bereich: My Templates

## 9.1 Zweck

My Templates zeigt dem aktuellen User die für ihn sichtbaren und nutzbaren Templates.

## 9.2 Sichtbare Templates

Ein Template erscheint in My Templates nur, wenn:

- es dem User über Group-Zuweisung und Rechte sichtbar ist
- es im Sinne des Arbeitskontexts relevant ist

### Für neue Document-Starts besonders relevant
Im Workspace sollen standardmäßig bevorzugt Templates sichtbar sein, die:
- `published` sind
- für den User nutzbar sind

## 9.3 Sichtbare Informationen pro Template

Mindestens sichtbar:

- Name
- optional kurze Beschreibung
- optional Statushinweis, wenn relevant

## 9.4 Aktionen aus My Templates

Von einem Template aus muss der User mindestens:
- das Template öffnen können
- ein neues Document starten können, wenn das Template published ist

## 9.5 Nicht Ziel dieses Bereichs

My Templates ist nicht:
- die vollständige Konfigurationsliste aller Versionen
- die Template-Edit-Sicht
- die Workflow-Konfigurationsansicht

---

## 10. Bereich: My Documents

## 10.1 Zweck

My Documents zeigt dem aktuellen User die für ihn sichtbaren und aktuell relevanten Documents.

## 10.2 Sichtbare Documents

Es werden nur Documents angezeigt, die:

- der User sehen darf
- nicht archiviert sind, sofern kein Archivfilter aktiv ist

## 10.3 Sichtbare Informationen pro Document

Mindestens sichtbar:

- fachlich verständlicher Dokumenttitel oder zusammengesetzte Anzeige
- Status
- Bezug auf Template
- optional letzte Aktualisierung
- optional zugeordnete Rolle oder Relevanz

## 10.4 Fachliche Anzeige statt Business-Key-Konzept

Da das Produkt kein führendes Business-Key-Konzept verwendet, muss My Documents eine fachlich verständliche Anzeige aus vorhandenen Template Keys, Document Keys oder anderen anzeigerelevanten Feldern bilden.

Diese Anzeige ist eine UI-Darstellung, kein neues Domänenobjekt.

## 10.5 Aktionen aus My Documents

Von einem Document aus muss der User mindestens:
- das Document öffnen können

Optional später:
- Schnellaktionen, aber nicht Pflicht im MVP

---

## 11. Standardfilter des Workspace

## 11.1 Allgemeine Regel

Der Workspace zeigt standardmäßig nur aktuell relevante Informationen.

## 11.2 Archivierte Documents

Archivierte Documents werden standardmäßig nicht in My Documents gezeigt.

## 11.3 Historische Templates

Nicht aktiv produktiv nutzbare Templates sollen im Workspace nicht dominieren.
Der Workspace ist arbeits- und nicht versionsorientiert.

## 11.4 Technische Informationen

Technische Informationen wie:
- JSON
- operationRef-Listen
- Bridge-/Legacy-Hinweise
werden im Workspace nicht angezeigt.

---

## 12. Sichtbarkeitsregeln im Workspace

## 12.1 Allgemeine Regel

Jeder Block zeigt nur Inhalte, die für den aktuell ausgewählten User sichtbar sind.

## 12.2 My Groups
zeigt nur die Groups des Users

## 12.3 My Tasks
zeigt nur Tasks des Users

## 12.4 My Templates
zeigt nur sichtbare Templates

## 12.5 My Documents
zeigt nur sichtbare Documents

---

## 13. Abgrenzung zu anderen Screens

## 13.1 Abgrenzung zu Templates

Der Workspace zeigt nur einen nutzungsbezogenen Ausschnitt von Templates.
Er ersetzt nicht die vollständige Templates-Liste oder Template-Konfiguration.

## 13.2 Abgrenzung zu Documents

Der Workspace zeigt nur einen relevanten Ausschnitt von Documents.
Er ersetzt nicht die vollständige Documents-Liste.

## 13.3 Abgrenzung zu Admin

Der Workspace zeigt keine Verwaltungsfunktionen für:
- Users
- Groups
- Memberships
- Template Assignments

## 13.4 Abgrenzung zu Workflows

Der Workspace zeigt keine Workflow-Definitionen oder JSON-Inhalte.

---

## 14. Layoutprinzipien des Workspace

## 14.1 Ziel

Der Workspace muss auf einen Blick verständlich und ruhig sein.

## 14.2 Strukturprinzip

Empfohlenes Layout:
- oberer Header
- darunter ein ruhiges Grid aus Arbeitsblöcken

## 14.3 Führende Blöcke

Empfohlen:
- links My Groups
- rechts My Tasks
- unten My Templates und My Documents

Die konkrete visuelle Verteilung darf implementierungsseitig angepasst werden, solange die fachliche Struktur erhalten bleibt.

## 14.4 Keine Überladung

Nicht zulässig im Standard-Workspace:
- große Technikpanels
- JSON-Editoren
- Konfigurationsformulare
- Bridge-/Legacy-Listen
- Versionsmatrizen

---

## 15. Zustand des Workspace ohne Daten

## 15.1 Keine Groups

Wenn ein User keiner Group zugeordnet ist, zeigt My Groups einen leeren Zustand mit klarem Hinweis.

## 15.2 Keine Tasks

Wenn keine Tasks vorhanden sind, zeigt My Tasks einen ruhigen leeren Zustand.

## 15.3 Keine Templates

Wenn keine Templates sichtbar sind, zeigt My Templates einen leeren Zustand mit Hinweis auf fehlende Zuweisung oder fehlende produktive Templates.

## 15.4 Keine Documents

Wenn keine Documents sichtbar sind, zeigt My Documents einen leeren Zustand statt einer leeren Tabelle.

---

## 16. Mobile/kleinere Darstellung

Für kleinere Bildschirmbreiten gilt:

- die Blöcke dürfen untereinander statt nebeneinander angeordnet werden
- die inhaltliche Priorität bleibt gleich
- User-Selektion und Navigation bleiben sichtbar
- Arbeitsrelevanz geht vor dekorativer Darstellung

---

## 17. Nicht Bestandteil des Workspace im MVP

Nicht Bestandteil des führenden Workspace-Modells sind:

- KPI- oder Reporting-Kacheln
- freie Widget-Konfiguration
- technische Integrationsübersichten
- Workflow-JSON
- Template-MDX-Editor
- globale Systemwarnzentren
- Builder-Einstiege
- Admin-Bearbeitung direkt im Workspace

---

## 18. Normative inhaltliche Reihenfolge

Im Workspace gilt diese inhaltliche Priorität:

1. User-Kontext
2. My Tasks
3. My Documents
4. My Templates
5. My Groups

Die visuelle Anordnung darf leicht variieren, aber die Arbeitsrelevanz dieser Reihenfolge soll erhalten bleiben.

---

## 19. Ergebnisregel

Der Workspace ist die führende arbeitsorientierte Startseite des MVP.

Spätere UI-Implementierungen dürfen davon abweichen **nur**, wenn dieses Dokument zuerst angepasst wird.
