# 12 — Screen Specification: Workflows

## 1. Ziel dieses Dokuments

Dieses Dokument definiert die führende Spezifikation für den Bereich **Workflows** im MVP.

Es legt verbindlich fest:

- welche Screens der Workflows-Bereich besitzt
- wie Workflow Templates gefunden, geöffnet, geprüft, bearbeitet und publiziert werden
- welche Tabs und Bereiche dort sichtbar sind
- wie JSON-Bearbeitung, lesbare Zusammenfassung und Hook-Sicht zusammenwirken
- welche Informationen standardmäßig sichtbar sind
- welche Informationen nur in Konfigurations- oder Advanced-Bereichen erscheinen

Dieses Dokument ist die führende Wahrheit für den Workflows-Bereich.

---

## 2. Rolle des Workflows-Bereichs im Produkt

Der Bereich Workflows ist primär **Konfigurations- und Review-UI**.

Er dient dazu:

- Workflow Templates zu finden
- Workflow Templates zu prüfen
- Workflow Templates zu bearbeiten
- Workflow Templates zu publizieren
- Workflow-Versionen zu verwalten
- Hook- und Action-Logik nachvollziehbar zu machen
- die Verwendung eines Workflow Templates in Form Templates sichtbar zu machen

Workflows ist **nicht** die tägliche primäre Arbeits-UI.
Die tägliche Arbeit findet vor allem in:
- My Workspace
- Documents
- Document Detail

statt.

---

## 3. Führende Screens im Workflows-Bereich

Der Workflows-Bereich besteht im MVP aus genau diesen Screens:

1. Workflows List
2. Workflow Detail
3. Workflow Edit

Diese drei Screens sind führend.

---

## 4. Workflows List

## 4.1 Zweck

Die Workflows List zeigt alle für den aktuellen Konfigurationskontext sichtbaren Workflow Templates.

Sie dient dazu:

- Workflows zu finden
- Workflows zu filtern
- Workflows zu öffnen
- neue Workflows anzulegen

## 4.2 Sichtbare Informationen je Workflow

Mindestens sichtbar:

- Name
- Key
- Version
- Status
- lesbare Haupt-Statusfolge
- Hauptaktion

## 4.3 Hauptaktionen in der Liste

Mindestens:

- View
- Edit
- New Workflow

## 4.4 Filter und Suche

Die Workflows List besitzt mindestens:

- Freitextsuche
- Statusfilter

Ein zusätzlicher Filter nach Verwendung in Templates ist zulässig, aber nicht Pflicht im MVP.

## 4.5 Nicht Ziel der Workflows List

Die Workflows List ist nicht:
- JSON-Editor
- Hook-Debugfläche
- laufende Document-Ansicht
- Admin-Übersicht technischer Connectoren

---

## 5. Workflow Detail

## 5.1 Zweck

Workflow Detail ist die führende Review- und Übersichtssicht eines konkreten Workflow Templates.

Es dient dazu:

- die wesentlichen Workflow-Informationen lesbar darzustellen
- Statusfolge, Actions und Rollen zu prüfen
- Hooks und deren operationRef zu sehen
- Version und Status zu sehen
- die Verwendung des Workflows in Templates zu verstehen

Workflow Detail ist die führende **Review-Sicht** eines Workflows.

## 5.2 Hauptaktionen im Workflow Detail

Mindestens:

- Edit
- Publish
- Archive

Optional später:
- Duplicate
- New Version

---

## 6. Tabs des Workflow Detail

Das Workflow Detail besitzt im MVP genau diese Tabs:

- Overview
- JSON
- Hooks
- Usage

Diese Tabs sind führend.

---

## 7. Tab: Overview

## 7.1 Zweck

Der Overview-Tab zeigt die wichtigsten Workflow-Metadaten und die lesbare fachliche Zusammenfassung des Workflows.

## 7.2 Sichtbare Inhalte

Mindestens sichtbar:

- Name
- Key
- Beschreibung
- Version
- Status
- Initialstatus
- lesbare Statusfolge
- Action-Übersicht
- Rollen-/Approval-Logik in lesbarer Form

## 7.3 Lesbare Action-Zusammenfassung

Die Overview-Sicht muss mindestens die Actions in dieser Form verständlich machen:

- Aktionsname
- `from`
- `to`
- erlaubte Rollen
- Completion Mode, wenn relevant

Beispielhaft lesbar:

- assign: created → assigned, role: editor
- submit: assigned/progressed → submitted, role: editor
- approve: submitted → approved, role: approver, completion: all

## 7.4 Sichtbarkeitsprinzip

Der Overview-Tab ist lesbar und nicht technisch überfrachtet.
Er ist keine Editorfläche.

---

## 8. Tab: JSON

## 8.1 Zweck

Der JSON-Tab zeigt das führende Workflow-JSON.

## 8.2 Sichtbare Inhalte

Mindestens sichtbar:

- das vollständige führende Workflow-JSON der aktuell geöffneten Version

## 8.3 Regel

Der JSON-Tab ist ein **Konfigurations- und Review-Tab**.
Er gehört nicht zur normalen Arbeits-UI.

## 8.4 Nicht Ziel des JSON-Tabs

Der JSON-Tab ist nicht:
- Teil der normalen Document-Arbeitsfläche
- ein technisches Debug-Panel für Endnutzer
- ein Ort für konkurrierende Workflow-Modelle

---

## 9. Tab: Hooks

## 9.1 Zweck

Der Hooks-Tab zeigt die im Workflow definierten Hooks in lesbarer Form.

## 9.2 Sichtbare Inhalte

Für jeden Hook mindestens sichtbar:

- Trigger
- operationRef
- Request-Information, soweit fachlich lesbar
- Response-Mapping-Ziele in lesbarer Form
- optional Beschreibung

## 9.3 Hook-Sichtbarkeitsprinzip

Der Hooks-Tab soll die Hooks fachlich erklären, nicht nur roh dumpen.

## 9.4 Nicht Ziel des Hooks-Tabs

Der Hooks-Tab ist nicht:
- eine Laufzeit-Debugfläche
- eine Connector-Registry
- eine technische Retry-/Monitoring-Ansicht

---

## 10. Tab: Usage

## 10.1 Zweck

Der Usage-Tab zeigt, welche Form Templates dieses Workflow Template verwenden.

## 10.2 Sichtbare Inhalte

Mindestens sichtbar:

- referenzierende Form Templates
- deren Versionen
- deren Status
- Link zum jeweiligen Template Detail

## 10.3 Fachliche Bedeutung

Der Usage-Tab dient dazu:

- die Auswirkung von Workflow-Änderungen verständlich zu machen
- die Verwendungsbreite eines Workflows zu sehen
- Review und Versionierungsentscheidungen zu unterstützen

---

## 11. Workflow Edit

## 11.1 Zweck

Workflow Edit ist die führende Konfigurationsfläche für ein Workflow Template.

Hier werden Workflows bearbeitet, nicht im Workflow Detail.

## 11.2 Hauptbereiche von Workflow Edit

Workflow Edit besitzt mindestens diese Bereiche:

- Header mit Status- und Speicheraktionen
- Meta
- JSON Editor
- Validierung
- lesbare Zusammenfassung

## 11.3 Header von Workflow Edit

Der Header zeigt mindestens:

- Name des Workflows
- Versionshinweis
- Status
- Save
- Publish
- Archive

## 11.4 Bereich: Meta

Meta enthält mindestens:

- Key
- Name
- Beschreibung

## 11.5 Bereich: JSON Editor

Hier wird das führende Workflow-JSON bearbeitet.

Das Workflow-JSON ist das primäre Definitionsmodell des Workflows.
Es gibt im MVP keinen visuellen Workflow-Builder als führendes Modell.

## 11.6 Bereich: Validierung

Die Validierung muss mindestens sichtbare Rückmeldung geben zu:

- ungültigem JSON
- fehlendem `initialStatus`
- Status nicht in `statuses`
- fehlenden Action-Pflichtfeldern
- ungültigen Rollen
- ungültigen Hook-Definitionen
- Konflikten in fieldRules

## 11.7 Bereich: Lesbare Zusammenfassung

Die lesbare Zusammenfassung dient dazu, das Workflow-JSON fachlich zu prüfen, ohne das JSON allein interpretieren zu müssen.

Mindestens sichtbar:

- Statusfolge
- Actions
- Rollen
- Approval-Modell
- Hooks

---

## 12. Trennung zwischen Detail und Edit

Für Workflows gilt die harte Trennung:

### Workflow Detail
- lesen
- prüfen
- verstehen
- navigieren

### Workflow Edit
- ändern
- speichern
- publizieren
- archivieren

Workflow Detail ist nicht die primäre Änderungsoberfläche.
Workflow Edit ist nicht die primäre Review-Zusammenfassung.

---

## 13. Sichtbarkeitsregeln im Workflows-Bereich

## 13.1 Workflows List
Zeigt nur Workflows, die im aktuellen Konfigurationskontext sichtbar sein sollen.

## 13.2 Workflow Detail
Darf nur geöffnet werden, wenn der Workflow sichtbar ist.

## 13.3 Workflow Edit
Darf nur geöffnet werden, wenn der User konfigurationsseitig ausreichende Rechte besitzt.

## 13.4 Usage-Tab
Zeigt nur referenzierende Templates, die im jeweiligen Sichtkontext angezeigt werden dürfen.

---

## 14. Konfigurationsbezug vs. Arbeitsbezug

## 14.1 Konfigurationsbezug

Workflows List, Workflow Detail und Workflow Edit sind Konfigurations- und Reviewflächen.

## 14.2 Kein direkter Arbeitsbezug

Im Workflows-Bereich werden keine laufenden Documents bearbeitet.
Der Bereich erklärt und konfiguriert den Prozess, nicht den konkreten Vorgang.

## 14.3 Regel

Der Workflows-Bereich darf den fachlichen Prozess erklären, aber er ist keine tägliche Arbeitsfläche.

---

## 15. Layoutprinzipien

## 15.1 Workflows List

- ruhige tabellarische Übersicht
- Suche und Filter oberhalb
- klare Hauptaktion

## 15.2 Workflow Detail

- Objektheader
- darunter Tabs
- je Tab fokussierter Inhalt
- lesbare Status-/Action-Darstellung steht vor rohem JSON

## 15.3 Workflow Edit

- klare Konfigurationsstruktur
- JSON Editor zentral
- Validierung sichtbar
- lesbare Zusammenfassung unterstützend
- kein visueller Builder als Primärmodell

---

## 16. Rolle von JSON im Workflows-Bereich

## 16.1 Grundsatz

JSON ist das führende Workflow-Definitionsformat.

## 16.2 Sichtbarkeitsregel

JSON ist im MVP nur in:
- Workflow Detail
- Workflow Edit
- anderen Konfigurations-/Advanced-Bereichen

zulässig.

JSON ist **nicht** Teil:
- der normalen Arbeits-UI
- des Workspace
- der normalen Document-Arbeitsfläche

## 16.3 Ziel

Das Workflow-JSON soll führend sein, aber nicht die Standard-Arbeitsoberflächen dominieren.

---

## 17. Nicht Bestandteil des Workflows-Bereichs im MVP

Nicht Bestandteil des führenden Workflows-Bereichs sind:

- visueller Workflow-Builder
- Drag-and-Drop-Workflow-Editor
- generische technische Connector-Administration
- Retry-/Queue-/Monitoring-Konfiguration
- Workflow-Ausführungshistorie als Primärscreen
- parallele konkurrierende Workflow-Modelle

---

## 18. Normative fachliche Reihenfolge im Workflow-Kontext

Die inhaltliche Priorität eines Workflows ist:

1. was ist dieser Workflow
2. in welchem Status startet ein Document
3. welche Actions und Transitionen gibt es
4. welche Rollen und Completion Rules gelten
5. welche Hooks laufen
6. wo wird der Workflow verwendet

Diese Reihenfolge soll sich im Informationsaufbau wiederfinden.

---

## 19. Ergebnisregel

Der in diesem Dokument beschriebene Workflows-Bereich ist das führende Strukturmodell des MVP.

Spätere UI-Implementierungen dürfen davon abweichen **nur**, wenn dieses Dokument zuerst angepasst wird.
