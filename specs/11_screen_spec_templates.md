# 11 — Screen Specification: Templates

## 1. Ziel dieses Dokuments

Dieses Dokument definiert die führende Spezifikation für den Bereich **Templates** im MVP.

Es legt verbindlich fest:

- welche Screens der Templates-Bereich besitzt
- wie Templates gefunden, geöffnet, geprüft, bearbeitet und publiziert werden
- welche Tabs und Bereiche dort sichtbar sind
- wie sich Arbeits-UI, Konfigurations-UI und Dokumentzugriff im Template-Kontext trennen
- wie die Dokumenttabelle eines Templates aussieht
- welche Informationen standardmäßig sichtbar sind
- welche Informationen nur in Konfigurations- oder Advanced-Bereichen erscheinen

Dieses Dokument ist die führende Wahrheit für den Templates-Bereich.

---

## 2. Rolle des Templates-Bereichs im Produkt

Der Bereich Templates ist primär **Konfigurations- und Review-UI**.

Er dient dazu:

- Templates zu finden
- Templates zu prüfen
- Templates zu bearbeiten
- Templates zu publizieren
- Template-Versionen zu verwalten
- die zugehörigen Documents eines Templates zu überblicken

Templates ist **nicht** die tägliche primäre Arbeits-UI.
Die tägliche Arbeit findet vor allem in:
- My Workspace
- Documents
- Document Detail

statt.

---

## 3. Führende Screens im Templates-Bereich

Der Templates-Bereich besteht im MVP aus genau diesen Screens:

1. Templates List
2. Template Detail
3. Template Edit

Diese drei Screens sind führend.

---

## 4. Templates List

## 4.1 Zweck

Die Templates List zeigt alle für den aktuellen User sichtbaren Templates.

Sie dient dazu:

- Templates zu finden
- Templates zu filtern
- Templates zu öffnen
- neue Templates anzulegen

## 4.2 Sichtbare Informationen je Template

Mindestens sichtbar:

- Name
- Key
- Version
- Status
- zugewiesenes Workflow Template
- Group-Zuordnung
- Hauptaktion

## 4.3 Hauptaktionen in der Liste

Mindestens:

- View
- Edit
- New Template

## 4.4 Filter und Suche

Die Templates List besitzt mindestens:

- Freitextsuche
- Statusfilter
- Group-Filter

## 4.5 Nicht Ziel der Templates List

Die Templates List ist nicht:
- MDX-Editor
- Workflow-Editor
- Versionsvergleichsoberfläche
- Dokument-Arbeitsfläche

---

## 5. Template Detail

## 5.1 Zweck

Template Detail ist die Review- und Übersichtssicht eines konkreten Templates.

Es dient dazu:

- die wesentlichen Template-Informationen lesbar darzustellen
- das zugewiesene Workflow Template zu zeigen
- die Tabellenfelder zu prüfen
- Version und Status zu sehen
- die Documents dieses Templates zu erreichen

Template Detail ist die führende **Review-Sicht** eines Templates.

## 5.2 Hauptaktionen im Template Detail

Mindestens:

- Edit
- Publish
- Archive

Optional später:
- Duplicate
- New Version

---

## 6. Tabs des Template Detail

Das Template Detail besitzt im MVP genau diese Tabs:

- Overview
- Form
- Workflow
- Integrations
- Versions
- Documents

Diese Tabs sind führend.

---

## 7. Tab: Overview

## 7.1 Zweck

Der Overview-Tab zeigt die wichtigsten Template-Metadaten in lesbarer Form.

## 7.2 Sichtbare Inhalte

Mindestens sichtbar:

- Name
- Key
- Beschreibung
- Version
- Status
- Group-Zuweisungen
- referenziertes Workflow Template
- Template Keys
- Document Keys
- Tabellenfelder

## 7.3 Sichtbarkeitsprinzip

Der Overview-Tab ist lesbar und nicht technisch überfrachtet.
Er ist keine Editorfläche.

---

## 8. Tab: Form

## 8.1 Zweck

Der Form-Tab dient dazu, das Formular des Templates zu verstehen und zu prüfen.

## 8.2 Sichtbare Inhalte

Je nach Kontext mindestens:

- MDX-bezogene Formvorschau
- Feldübersicht
- Template Keys
- Document Keys
- relevante Tabellenfelder

## 8.3 Regel

Der Form-Tab im Detail ist primär eine Review- und Verständnissicht.
Die eigentliche Bearbeitung erfolgt im Template Edit.

---

## 9. Tab: Workflow

## 9.1 Zweck

Der Workflow-Tab zeigt, welches Workflow Template diesem Form Template zugeordnet ist.

## 9.2 Sichtbare Inhalte

Mindestens sichtbar:

- Name des Workflow Templates
- Key
- Version
- lesbare Statusfolge
- zentrale Actions
- Link zum Workflow Detail

## 9.3 Regel

Der Workflow-Tab ist eine Lesesicht und Verweissicht.
Er ersetzt nicht den Workflow-Screen.

---

## 10. Tab: Integrations

## 10.1 Zweck

Der Integrations-Tab zeigt die aus dem Template heraus verwendeten Integrationsbezüge.

## 10.2 Sichtbare Inhalte

Mindestens sichtbar:

- verwendete Form Actions
- deren `operationRef`
- relevante Lookups mit `operationRef`

## 10.3 Sichtbarkeitsprinzip

Der Integrations-Tab zeigt nur die für dieses Template relevanten Integrationsbezüge.
Er ist keine allgemeine Connector-Administration.

## 10.4 Nicht sichtbar im Standardfall

Nicht erforderlich in der Standardsicht:

- technische Bridge-/Legacy-Listen
- tiefe Laufzeitdebugdaten
- ausführliche technische Registry-Informationen

---

## 11. Tab: Versions

## 11.1 Zweck

Der Versions-Tab zeigt die Versionen des Templates.

## 11.2 Sichtbare Inhalte

Mindestens sichtbar:

- Version
- Status
- Erstellungs-/Publikationshinweis
- aktive Version
- archivierte Versionen

## 11.3 Aktionen

Mindestens zulässig:
- publizierte Version erkennen
- archivierte Version erkennen
- eine konkrete Version öffnen

Im MVP nicht zwingend erforderlich:
- komplexer Versionsvergleich

---

## 12. Tab: Documents

## 12.1 Zweck

Der Documents-Tab zeigt die Dokumenttabelle des konkreten Templates.

Das ist der führende Ort, um Documents **eines bestimmten Templates** im Zusammenhang zu sehen.

## 12.2 Sichtbare Documents

Es werden nur Documents angezeigt, die:

- zu genau diesem Template gehören
- für den aktuellen User sichtbar sind
- dem aktuell gewählten Filter entsprechen

## 12.3 Standardfilter

Mindestens:

- Statusfilter
- Freitextsuche
- offen/archiviert

## 12.4 Sichtbare Spalten

Die Dokumenttabelle eines Templates zeigt mindestens:

- fachlich verständliche Dokumentanzeige
- Status
- definierte Tabellenfelder des Templates
- Updated At
- Action zum Öffnen

### Tabellenfelder

Die Spalten des Templates ergeben sich aus:
- den als `tableField = true` markierten Feldern

## 12.5 Regeln für die Dokumentanzeige

- Es gibt kein führendes Business-Key-Konzept.
- Die sichtbare Dokumentanzeige wird aus Template Keys, Document Keys oder sonstigen fachlich geeigneten Feldern abgeleitet.
- Diese Anzeige ist eine UI-Darstellung, kein neues Domänenobjekt.

## 12.6 Zweck der Dokumenttabelle

Die Dokumenttabelle dient dazu:

- Documents dieses Templates zu finden
- ihren Status zu sehen
- sie gezielt zu öffnen
- die Nutzung des Templates im Alltag zu überblicken

---

## 13. Template Edit

## 13.1 Zweck

Template Edit ist die führende Konfigurationsfläche für ein Template.

Hier werden Templates bearbeitet, nicht im Template Detail.

## 13.2 Hauptbereiche von Template Edit

Template Edit besitzt mindestens diese Bereiche:

- Header mit Status- und Speicheraktionen
- Meta
- Workflow-Zuweisung
- Group-Zuweisung
- Tabellenfelder
- MDX Editor
- Preview

## 13.3 Header von Template Edit

Der Header zeigt mindestens:

- Name des Templates
- Versionshinweis
- Status
- Save
- Publish
- Archive

## 13.4 Bereich: Meta

Meta enthält mindestens:

- Key
- Name
- Beschreibung

## 13.5 Bereich: Workflow-Zuweisung

Hier wird genau ein Workflow Template zugewiesen.

Mindestens sichtbar:
- aktuelles Workflow Template
- Auswahl oder Wechselmöglichkeit

## 13.6 Bereich: Group-Zuweisung

Hier werden die Groups des Templates gepflegt.

## 13.7 Bereich: Tabellenfelder

Hier wird festgelegt, welche Felder in der Dokumenttabelle des Templates erscheinen.

## 13.8 Bereich: MDX Editor

Hier wird das führende MDX des Formulars bearbeitet.

## 13.9 Bereich: Preview

Die Preview dient dazu, das Formular visuell zu prüfen.

Sie ist eine Review-/Prüffläche und keine zweite konkurrierende Definitionswelt.

---

## 14. Trennung zwischen Detail und Edit

Für Templates gilt die harte Trennung:

### Template Detail
- lesen
- prüfen
- verstehen
- navigieren

### Template Edit
- ändern
- speichern
- publizieren
- archivieren

Template Detail ist nicht die primäre Änderungsoberfläche.
Template Edit ist nicht die primäre Review-Zusammenfassung.

---

## 15. Sichtbarkeitsregeln im Templates-Bereich

## 15.1 Templates List
Zeigt nur Templates, die der User sehen darf.

## 15.2 Template Detail
Darf nur geöffnet werden, wenn das Template sichtbar ist.

## 15.3 Template Edit
Darf nur geöffnet werden, wenn der User konfigurationsseitig ausreichende Rechte besitzt.

Die genaue Rechtekopplung folgt aus:
- Membership
- Sichtbarkeit
- späteren Bearbeitungsregeln

## 15.4 Documents-Tab
Zeigt nur Documents, die der User sehen darf.

---

## 16. Arbeits- vs. Konfigurationsbezug

## 16.1 Konfigurationsbezug

Templates List, Template Detail und Template Edit sind Konfigurations- bzw. Reviewflächen.

## 16.2 Arbeitsbezug

Der Documents-Tab im Template Detail ist die Brücke zum Arbeitskontext.
Er zeigt die reale Nutzung des Templates.

## 16.3 Regel

Der Templates-Bereich darf Documents auffindbar machen, soll aber die eigentliche Arbeit am Document nicht in Templates hineinziehen.
Das Öffnen eines Documents führt in den Document-Kontext.

---

## 17. Layoutprinzipien

## 17.1 Templates List

- ruhige tabellarische Übersicht
- Suche und Filter oberhalb
- klare Hauptaktion

## 17.2 Template Detail

- Objektheader
- darunter Tabs
- je Tab fokussierter Inhalt
- keine Überlagerung vieler technischer Ebenen

## 17.3 Template Edit

- klare Konfigurationsstruktur
- Meta und Zuweisungen getrennt von MDX
- Preview sichtbar, aber dem Editor untergeordnet
- keine Builder-Logik als Primärmodell

---

## 18. Nicht Bestandteil des Templates-Bereichs im MVP

Nicht Bestandteil des führenden Templates-Bereichs sind:

- visueller Form-Builder als Hauptkonzept
- Drag-and-Drop-Konfiguration
- Workflow-JSON-Bearbeitung direkt im Template Edit
- allgemeine Connector-Administration
- technische Registry-Ansichten als Standardtab
- freie konfigurierbare Tabs
- komplexer Versionsvergleich

---

## 19. Normative fachliche Reihenfolge im Template-Kontext

Die inhaltliche Priorität eines Templates ist:

1. was ist dieses Template
2. wie sieht das Formular aus
3. welcher Workflow ist zugeordnet
4. welche Integrationsbezüge existieren
5. welche Versionen gibt es
6. welche Documents laufen darauf

Diese Reihenfolge soll sich im Informationsaufbau wiederfinden.

---

## 20. Ergebnisregel

Der in diesem Dokument beschriebene Templates-Bereich ist das führende Strukturmodell des MVP.

Spätere UI-Implementierungen dürfen davon abweichen **nur**, wenn dieses Dokument zuerst angepasst wird.
