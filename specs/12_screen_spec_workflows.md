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

Workflow Detail ist die führende Review- und Pflegevorbereitungssicht eines konkreten Workflow Templates.

Es dient dazu:

- die führende Workflow-Quelle sichtbar zu machen
- den Workflow fachlich als Transition-Modell lesbar zu machen
- Statusfolge, Actions, Rollen und Übergänge zu prüfen
- Version und Status kompakt zu sehen
- die Verwendung des Workflows in Templates zu verstehen

Workflow Detail ist die führende **Review- und Draft-Pflegesicht** eines Workflows.

## 5.2 Hauptaktionen im Workflow Detail

Im normalen editierbaren Pflegepfad mindestens:

- Save Draft
- Publish
- Unpublish
- Archive

Optional später:
- Duplicate
- New Version

---

## 6. Führende Struktur des Workflow Detail

Das Workflow Detail ist im führenden Pfad nicht mehr primär als Tab-Sammlung gedacht.
Die Seite ist stattdessen ruhig und linear aufgebaut:

1. kompakter Workflow-Kopf
2. kompakter Context-/Versionsbereich
3. editierbare Workflow-Quelle
4. fachliche Transition-Darstellung aus genau dieser Quelle

Der Lifecycle-/Versionsschnitt bleibt dabei klein und verdichtet.
Er liegt im Workflow Detail im selben ruhigen Pflegebereich wie die Quelle und nicht als dominante Nebenansicht.

Diese Struktur ist führend.

---

## 7. Fachliche Darstellung

## 7.1 Zweck

Die fachliche Darstellung zeigt die wichtigsten Workflow-Metadaten und die lesbare Zusammenfassung des Workflows.

## 7.2 Sichtbare Inhalte

Mindestens sichtbar:

- Name
- Key
- Beschreibung
- Version
- Status
- Initialstatus
- lesbare Statusfolge
- Transition-Tabelle
- Rollen-/Approval-Logik in lesbarer Form

## 7.3 Lesbares Transition-Modell

Die Workflow-Seite muss Actions mindestens in dieser fachlichen Leserichtung verständlich machen:

- Aktionsname
- `from`
- `to`
- erlaubte Rollen
- Modus `OR` oder `AND`
- optionale API
- optionale Bedingung

Beispielhaft lesbar:

- assign: created → assigned, role: editor, mode: OR
- submit: assigned/progressed → submitted, role: editor, mode: OR
- approve: submitted → approved, role: approver, mode: AND

## 7.4 Sichtbarkeitsprinzip

Die fachliche Darstellung ist lesbar und nicht technisch überfrachtet.
Sie ist keine eigene Editorfläche, sondern die direkte Ableitung der aktuell bearbeiteten Workflow-Quelle.

---

## 8. Workflow-Quelle

## 8.1 Zweck

Die Workflow-Quelle zeigt das führende Workflow-JSON als primäre Quelle.
Im normalen Workflow Detail ist sie als editierbarer Draft-Bereich nutzbar.

## 8.2 Sichtbare Inhalte

Mindestens sichtbar:

- das vollständige führende Workflow-JSON der aktuell geöffneten Version
- ein editierbarer Source-Bereich
- Save Draft
- oberhalb der fachlichen Transition-Darstellung

## 8.3 Regel

Die Workflow-Quelle ist die führende technische Konfigurationsquelle.
Die fachliche Darstellung darunter wird aus genau dieser Quelle gelesen.

Ein Save Draft schreibt den aktuellen Bearbeitungsstand als Workflow-Draft.
Die Transition View unterhalb der Quelle wird danach aus genau diesem aktuellen Draft-Stand abgeleitet.

## 8.5 Fehlerpfad

Wenn die Workflow-Quelle syntaktisch oder fachlich ungueltig ist:

- bleibt die Seite renderbar
- bleibt der aktuelle Bearbeitungsstand sichtbar
- wird eine verständliche Fehlermeldung im Workflow-Kontext gezeigt
- wird die Transition View nicht aus einem konkurrierenden Nebenstand gerendert

---

## 9. Workflow-Lifecycle

## 9.1 Ziel

Workflow Detail trägt im normalen Pflegepfad auch den Lifecycle der Workflow-Version:

- Save Draft
- Publish
- Unpublish
- Archive

## 9.2 Publish

Publish macht den aktuellen bearbeiteten Stand zu einer publizierten Workflow-Version.

Dabei gilt:

- die Workflow Source bleibt die führende Quelle
- Publish arbeitet aus genau dieser aktuellen Quelle
- frühere Versionen bleiben nachvollziehbar

## 9.3 Unpublish-Regel

Unpublish ist fachlich nur erlaubt, wenn **kein publiziertes Template** genau diese Workflow-Version nutzt.

Wenn publizierte Templates diese Version nutzen:

- ist Unpublish gesperrt
- zeigt die UI den Sperrgrund ruhig und verständlich an

## 9.4 Archive

Archive ist im normalen Pflegepfad erst möglich, wenn die betrachtete Version unveröffentlicht ist.

Eine archivierte Workflow-Version:

- bleibt historisch nachvollziehbar
- verschwindet aber aus den normalen Standardübersichten

## 8.4 Nicht Ziel des JSON-Tabs

Der JSON-Tab ist nicht:
- Teil der normalen Document-Arbeitsfläche
- ein technisches Debug-Panel für Endnutzer
- ein Ort für konkurrierende Workflow-Modelle

---

## 9. Hooks in der Workflow-Seite

## 9.1 Zweck

Hooks sollen fachlich lesbar bleiben, aber die Seite nicht als eigener dominanter Hauptblock überfrachten.

## 9.2 Sichtbare Inhalte

Wenn Hooks für die fachliche Darstellung relevant sind, sollen mindestens sichtbar bleiben:

- Trigger
- operationRef
- optional Beschreibung

## 9.3 Hook-Sichtbarkeitsprinzip

Der Hooks-Tab soll die Hooks fachlich erklären, nicht nur roh dumpen.

## 9.4 Nicht Ziel des Hooks-Tabs

Der Hooks-Tab ist nicht:
- eine Laufzeit-Debugfläche
- eine Connector-Registry
- eine technische Retry-/Monitoring-Ansicht

---

## 10. Context und Usage

## 10.1 Zweck

Der kompakte Context-Bereich zeigt, welche Form Templates dieses Workflow Template verwenden und welche Versionen sichtbar sind.

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
