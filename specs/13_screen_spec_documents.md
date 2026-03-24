# 13 — Screen Specification: Documents

## 1. Ziel dieses Dokuments

Dieses Dokument definiert die führende Spezifikation für den Bereich **Documents** im MVP.

Es legt verbindlich fest:

- welche Screens der Documents-Bereich besitzt
- wie Documents gefunden, gefiltert, geöffnet und bearbeitet werden
- welche Informationen im Document Detail sichtbar sind
- wie Work Summary, Formular, Attachments, Journal, History und Actions zusammenwirken
- wie sich Documents von Templates, Workflows und Admin-Flächen abgrenzen
- welche Informationen standardmäßig sichtbar sind
- welche Informationen nicht Teil der normalen Arbeits-UI sind

Dieses Dokument ist die führende Wahrheit für den Documents-Bereich.

---

## 2. Rolle des Documents-Bereichs im Produkt

Der Bereich Documents ist die führende **Arbeits-UI** des MVP.

Er dient dazu:

- Documents zu finden
- Documents zu filtern
- Documents zu öffnen
- Documents zu bearbeiten
- Workflow Actions auszuführen
- Form Actions auszuführen
- Attachments zu verwalten
- Journaldaten zu erfassen
- History und Nachvollziehbarkeit einzusehen

Documents ist **nicht**:
- Konfigurations-UI
- Template-Editor
- Workflow-Editor
- Admin-UI
- technische Debug-Oberfläche

---

## 3. Führende Screens im Documents-Bereich

Der Documents-Bereich besteht im MVP aus genau diesen Screens:

1. Documents List
2. Document Detail

Diese zwei Screens sind führend.

---

## 4. Documents List

## 4.1 Zweck

Die Documents List zeigt sichtbare Documents im aktuellen Arbeitskontext.

Sie dient dazu:

- Documents zu finden
- Documents nach Status oder Template zu filtern
- Documents gezielt zu öffnen
- laufende Arbeit und offene Vorgänge zu überblicken

## 4.2 Varianten der Documents List

Im MVP gibt es zwei führende Varianten:

- **My Documents**
- **Documents by Template**

### My Documents
Zeigt alle für den aktuellen User sichtbaren und relevanten Documents.

### Documents by Template
Zeigt Documents eines konkreten Templates innerhalb des Template-Kontexts.

---

## 5. Filter und Suche in Documents List

## 5.1 Pflichtfilter

Die Documents List besitzt mindestens:

- Statusfilter
- Templatefilter, sofern nicht bereits im Template-Kontext
- offen/archiviert
- Freitextsuche

## 5.2 Standardfilter

Standardmäßig werden gezeigt:

- sichtbare Documents
- nicht archivierte Documents

Archivierte Documents werden erst sichtbar, wenn ein Archivfilter aktiv ist.

---

## 6. Sichtbare Spalten in Documents List

Mindestens sichtbar:

- fachlich verständliche Dokumentanzeige
- Template
- Status
- Assigned Users oder rollennahe Zuordnung, soweit fachlich sinnvoll
- Updated At
- definierte Tabellenfelder des Templates, falls im Kontext sinnvoll
- Open-Aktion

## 6.1 Dokumentanzeige

Es gibt kein führendes Business-Key-Konzept.

Die sichtbare Dokumentanzeige wird aus fachlich geeigneten Feldern gebildet, insbesondere aus:
- Document Keys
- Template Keys
- weiteren anzeigerelevanten Feldern

Diese Anzeige ist eine UI-Darstellung, kein eigenes Domänenobjekt.

---

## 7. Zweck der Documents List

Die Documents List ist ein Arbeitsfinder.

Sie dient nicht dazu:

- Templates zu konfigurieren
- Workflows zu konfigurieren
- rohe JSON-Daten zu zeigen
- technische Integrationszustände zu debuggen

---

## 8. Document Detail

## 8.1 Zweck

Document Detail ist die zentrale Arbeitsseite für ein einzelnes Document.

Hier findet die fachliche Arbeit am konkreten Vorgang statt.

Document Detail dient dazu:

- den aktuellen Arbeitskontext zu verstehen
- das Formular zu bearbeiten
- Workflow Actions auszuführen
- Form Actions auszuführen
- Attachments zu verwalten
- Journaldaten zu pflegen
- History/Audit zu prüfen

Document Detail ist die führende **Arbeitsfläche** des MVP.

---

## 9. Hauptbereiche des Document Detail

Document Detail besitzt im MVP mindestens diese Hauptbereiche:

1. Header
2. Work Summary
3. Form
4. Attachments
5. Journal
6. History
7. Assignment-/Task-Information

Diese Bereiche sind führend.

---

## 10. Header des Document Detail

## 10.1 Zweck

Der Header zeigt den aktuellen Vorgang in kompakter Form und stellt die relevanten Actions bereit.

## 10.2 Sichtbare Inhalte im Header

Mindestens sichtbar:

- fachlich verständliche Dokumentanzeige
- aktueller Status
- primäre Workflow Actions
- relevante Form Actions, wenn sie in diesem Kontext sichtbar sind

## 10.3 Regeln für Actions im Header

Im Header werden nur Actions angezeigt, die:
- für den aktuellen User sichtbar sind
- im aktuellen Status zulässig sind
- fachlich relevant sind

Nicht sichtbare oder nicht zulässige Actions erscheinen nicht als primäre Aktion.

---

## 11. Work Summary

## 11.1 Zweck

Die Work Summary erklärt dem User auf einen Blick, woran er gerade arbeitet.

## 11.2 Sichtbare Inhalte

Mindestens sichtbar:

- Template-Name
- Workflow-Name
- Template-Version
- Workflow-Version
- aktueller Status
- zugewiesene Editors
- zugewiesene Approvers
- optional nächster sinnvoller Handlungshinweis

## 11.3 Ziel

Die Work Summary ist die fachliche Einordnung des Dokuments.
Sie ersetzt keine Detail-History und kein Formular, aber sie macht den Vorgang verständlich.

---

## 12. Form-Bereich

## 12.1 Zweck

Der Form-Bereich zeigt das aus dem Template gerenderte Formular des Documents.

## 12.2 Regeln

- das Formular wird aus der gebundenen Template-Version gerendert
- Felder sind entsprechend Workflowstatus und Rechtemodell editierbar oder readonly
- normale Nutzer sehen kein MDX
- normale Nutzer sehen kein Template-JSON
- normale Nutzer sehen keine technischen Konfigurationsstrukturen

## 12.3 Bearbeitung

Im Form-Bereich dürfen Users nur die Felder bearbeiten, die:
- sichtbar sind
- im aktuellen Status editierbar sind
- für ihre Rolle zulässig sind
- nach Rechtemodell bearbeitbar sind

## 12.4 Nicht Ziel des Form-Bereichs

Der Form-Bereich ist nicht:
- eine Template-Konfigurationsfläche
- eine Builder-Oberfläche
- eine technische Debug-Sicht

---

## 13. Attachments-Bereich

## 13.1 Zweck

Der Attachments-Bereich zeigt und verwaltet Dateien des Documents.

## 13.2 Sichtbare Inhalte

Mindestens sichtbar:

- Upload-Aktion, sofern zulässig
- Liste vorhandener Attachments
- Dateiname
- optional Dateityp, Größe, Upload-Zeit

## 13.3 Regeln

- Attachments gehören zum Document
- Attachments werden nicht als normale Formularfelder gespeichert
- der Bereich ist arbeitsrelevant und Teil der Standard-UI

## 13.4 Nicht Ziel des Attachments-Bereichs

Nicht sichtbar im Standardfall:
- Storage-Keys
- technische Dateipfade
- interne Speicherimplementierung

---

## 14. Journal-Bereich

## 14.1 Zweck

Der Journal-Bereich zeigt und bearbeitet strukturierte wiederholbare Inhalte des Documents.

## 14.2 Sichtbare Inhalte

Mindestens sichtbar:

- Journal-Name
- Journal-Spalten
- vorhandene Zeilen
- Möglichkeit zum Hinzufügen, Bearbeiten oder Anzeigen, sofern zulässig

## 14.3 Regeln

- Journal gehört zum normalen Arbeitskontext
- Journal ist kein Admin-/Template-Konzept, sondern Document-Laufzeitinhalt
- die Bearbeitbarkeit folgt Workflowstatus, Feldregel und Berechtigungsmodell

---

## 15. History-Bereich

## 15.1 Zweck

Der History-Bereich zeigt die nachvollziehbare Ereignisfolge des Documents.

## 15.2 Sichtbare Inhalte

Mindestens sichtbar:

- Zeitstempel
- Actor
- Ereignistyp
- kurze Beschreibung

## 15.3 Standardereignisse

Mindestens sichtbar:

- created
- assigned
- re_assigned
- started
- saved
- submitted
- approved
- rejected
- archived
- attachment_uploaded
- action_executed
- workflow_hook_executed

## 15.4 Regel

History ist eine fachliche Nachvollziehbarkeitssicht, kein technisches Logdump.

---

## 16. Assignment-/Task-Information

## 16.1 Zweck

Dieser Bereich zeigt, wer aktuell mit dem Document arbeitet oder arbeiten soll.

## 16.2 Sichtbare Inhalte

Mindestens sichtbar:

- Editors
- Approvers
- optional offene Tasks oder Task-Hinweise

## 16.3 Ziel

Der Bereich unterstützt die Arbeitskoordination, ohne zu einer eigenen Task-Management-Oberfläche auszuwachsen.

---

## 17. Workflow Actions im Document Detail

## 17.1 Sichtbarkeit

Workflow Actions sind sichtbar, wenn:
- der Status sie zulässt
- die Rolle sie zulässt
- der User sie sehen darf
- `x` vorhanden ist

## 17.2 Ausführbarkeit

Workflow Actions sind ausführbar, wenn zusätzlich:
- Validierungen erfüllt sind
- keine fachlichen Blocker bestehen
- das Document nicht archiviert ist

## 17.3 Typische Workflow Actions

Im MVP relevant:
- create
- assign
- start
- save
- submit
- approve
- reject
- reAssign
- archive

Nicht jeder Workflow muss alle dieser Actions verwenden.

---

## 18. Form Actions im Document Detail

## 18.1 Zweck

Form Actions sind fachliche Formularaktionen, die im Kontext des konkreten Documents ausgeführt werden.

## 18.2 Beispiele

- create_customer_order
- create_batch

## 18.3 Regeln

- Form Actions erscheinen nur, wenn sie im aktuellen Kontext sichtbar sind
- sie verwenden `operationRef`
- sie dürfen nicht das Workflow-Modell ersetzen
- sie dürfen Daten aus Formular und Kontext lesen und in definierte Zielbereiche schreiben

---

## 19. Sichtbarkeitsregeln im Document Detail

Ein User darf ein Document Detail nur öffnen, wenn das Document für ihn sichtbar ist.

Innerhalb des Document Detail gilt:

- Felder nur sichtbar, wenn Sichtbarkeit und Rolle es erlauben
- Felder nur editierbar, wenn Status, Rolle und Rechte es erlauben
- Actions nur sichtbar, wenn Status, Rolle und Rechte es erlauben
- technische Integrationszustände sind nicht Teil der Standard-Arbeitssicht

---

## 20. Beziehung zu Templates und Workflows

## 20.1 Beziehung zu Templates

Document Detail nutzt ein Template, bearbeitet es aber nicht.

Das heißt:
- keine Template-Bearbeitung im Document Detail
- keine MDX-Bearbeitung
- keine Group-Zuweisung
- keine Tabellenfeld-Konfiguration

## 20.2 Beziehung zu Workflows

Document Detail zeigt den Workflowkontext in arbeitsrelevanter Form, bearbeitet den Workflow aber nicht.

Das heißt:
- keine Workflow-JSON-Bearbeitung
- keine Hook-Konfiguration
- keine Action-Modellierung

---

## 21. Umgang mit archivierten Documents

## 21.1 Standardregel

Archivierte Documents sind nicht Teil des normalen aktiven Arbeitskontexts.

## 21.2 Sichtbarkeit

Archivierte Documents können sichtbar werden, wenn:
- ein entsprechender Filter aktiv ist
- der User das Document grundsätzlich sehen darf

## 21.3 Bearbeitbarkeit

Archivierte Documents sind readonly.
Workflow Actions und normale Bearbeitungsfunktionen stehen nicht mehr zur Verfügung, außer eine spätere Spezifikation definiert ausdrücklich Ausnahmen.

---

## 22. Leere Zustände und Fehlersituationen

## 22.1 Keine Attachments

Der Attachments-Bereich zeigt einen ruhigen leeren Zustand statt einer leeren technischen Liste.

## 22.2 Kein Journal-Inhalt

Der Journal-Bereich zeigt eine leere, fachlich verständliche Ausgangssicht.

## 22.3 Keine sichtbaren Actions

Wenn keine Actions verfügbar sind, bleibt der Header verständlich und ruhig.
Es wird keine technische Begründung in der Standard-UI angezeigt.

## 22.4 Nicht sichtbares Document

Wenn ein Document nicht sichtbar ist, darf der Detailscreen nicht regulär geöffnet werden.

---

## 23. Layoutprinzipien

## 23.1 Grundsatz

Document Detail ist eine Arbeitsseite.

Das Layout muss:
- ruhig
- fachlich verständlich
- handlungsorientiert
sein.

## 23.2 Bereichsreihenfolge

Empfohlene fachliche Reihenfolge:

1. Header
2. Work Summary
3. Form
4. Attachments
5. Journal
6. History
7. Assignment-/Task-Information

Die visuelle Umsetzung darf variieren, die fachliche Priorität bleibt.

## 23.3 Nicht zulässig in der Standard-Arbeitssicht

- Workflow-JSON
- MDX-Rohtext
- technische Registry-Informationen
- Bridge-/Legacy-Integrationsübersichten
- Debug-Panels

---

## 24. Nicht Bestandteil des Documents-Bereichs im MVP

Nicht Bestandteil des führenden Documents-Bereichs sind:

- Builder-UI
- Template-Konfigurationslogik
- Workflow-Konfigurationslogik
- technische Integrationsadministration
- globale Monitoring-/Retry-Sichten
- generische Admin-Steuerung

---

## 25. Ergebnisregel

Der in diesem Dokument beschriebene Documents-Bereich ist das führende Arbeitsmodell des MVP.

Spätere UI-Implementierungen dürfen davon abweichen **nur**, wenn dieses Dokument zuerst angepasst wird.
