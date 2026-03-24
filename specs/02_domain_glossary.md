# 02 — Domain Glossary

## 1. Ziel dieses Dokuments

Dieses Dokument definiert die fachlichen Begriffe der Anwendung verbindlich.

Es gilt:

- Jeder Begriff hat genau eine führende Bedeutung.
- Begriffe dürfen in Code, UI und Spezifikation nicht mit abweichender Bedeutung verwendet werden.
- Wenn ein Begriff hier nicht definiert ist, ist er nicht Teil des führenden Fachmodells.

Dieses Glossar ist die sprachliche Grundlage für:
- Produktbeschreibung
- UI-Spezifikation
- MDX-Formatspezifikation
- Workflow-JSON-Spezifikation
- Operations-/Integrationsspezifikation
- Datenmodell
- Implementierung

---

## 2. Grundbegriffe

### 2.1 Anwendung

Die Anwendung ist die Web-App „Digitale Dokumentation und Nachweise“.

Sie dient dazu, strukturierte Formulare und Nachweise zu:
- definieren
- veröffentlichen
- starten
- bearbeiten
- zuweisen
- freigeben
- archivieren
- optional mit Fremdsystemen zu verknüpfen

---

### 2.2 MVP

Das MVP ist die erste produktiv nutzbare Fassung der Anwendung mit bewusst begrenztem Umfang.

Das MVP ist:
- mono-tenant
- ohne Authentifizierung
- mit User-Selektion
- formular- und workflowbasiert
- auf produktive Nutzbarkeit ausgerichtet

Das MVP ist nicht:
- eine generische Low-Code-Plattform
- eine Builder-zentrierte Plattform
- ein vollständiger Integration-Service
- ein DMS für beliebige Inhalte
- eine Multi-Tenant-Enterprise-Plattform

---

## 3. Organisationsbegriffe

### 3.1 User

Ein User ist eine im System auswählbare Person, die mit Templates, Documents und Tasks arbeitet.

Ein User:
- kann Documents lesen
- kann Documents bearbeiten
- kann Actions ausführen
- kann dokumentbezogene Rollen erhalten
- kann Mitglied in einer oder mehreren Groups sein

Im MVP gilt:
- es gibt keine echte Benutzer-Authentifizierung
- der aktive User wird im UI ausgewählt

Ein User ist kein:
- Mandant
- technischer API-Account
- Rollenmodell an sich

---

### 3.2 Group

Eine Group ist eine organisatorische Einheit, der Users und Form Templates zugeordnet werden.

Eine Group dient dazu:
- Nutzer organisatorisch zu bündeln
- Sichtbarkeit auf Templates zu steuern
- Rechte in Kombination mit Memberships zuzuordnen

Beispiele:
- Ops
- Quality

Eine Group ist nicht:
- eine Workflow-Rolle
- eine Task
- ein Template

---

### 3.3 Membership

Eine Membership verbindet einen User mit einer Group und weist Rechte zu.

Eine Membership enthält:
- User
- Group
- Rechte

Die Membership ist die führende Verbindung zwischen:
- organisatorischer Zugehörigkeit
- und Rechten auf Gruppenebene

---

### 3.4 Rechte

Im MVP gibt es genau drei Rechte:

- `r` = read
- `w` = write
- `x` = execute

#### read (`r`)
Erlaubt das Lesen von Templates und Documents im erlaubten Sichtbarkeitsbereich.

#### write (`w`)
Erlaubt das Bearbeiten von konfigurierbaren oder dokumentbezogenen Inhalten, wenn die jeweilige Fachlogik das zulässt.

#### execute (`x`)
Erlaubt das Ausführen von Actions.

Wichtig:
- Rechte allein reichen nicht aus
- zusätzlich gelten Template-, Workflow- und Dokumentregeln

Die Rechte sind bewusst einfach gehalten.
Es gibt im MVP keine komplexe Policy-Engine.

---

## 4. Template- und Workflow-Begriffe

### 4.1 Form Template

Ein Form Template ist die fachliche und technische Vorlage eines Formulars.

Ein Form Template definiert:
- Metadaten
- Formularstruktur
- Felder
- Layout
- Tabellenfelder
- zugewiesene Groups
- referenziertes Workflow Template
- Version
- Status

Das führende Definitionsformat für das Formular ist:
- **MDX**

Ein Form Template ist nicht:
- ein laufendes Formular
- ein Document
- ein Workflow selbst

---

### 4.2 Workflow Template

Ein Workflow Template ist die Vorlage für Status, Actions, Rollenregeln, Feldregeln und Hooks.

Ein Workflow Template definiert:
- Statusliste
- Initialstatus
- Actions
- erlaubte Übergänge
- Rollen je Action
- Feldregeln pro Status
- Mehrfach-Editor-/Approver-Verhalten
- Hooks

Das führende Definitionsformat ist:
- **JSON**

Ein Workflow Template ist nicht:
- ein laufender Vorgang
- ein Task
- ein Formular

---

### 4.3 Template Assignment

Ein Template Assignment ist die Zuordnung eines Form Templates zu einer Group.

Es bestimmt:
- welche Groups ein Template sehen dürfen
- welche Users über ihre Group darauf zugreifen können

Ein Template Assignment ist keine Membership.
Es verbindet:
- Template
- Group

nicht:
- User
- Group

---

### 4.4 Version

Eine Version ist eine konkrete Fassung eines Form Templates oder Workflow Templates.

Versionen sind notwendig, damit:
- neue Documents nur mit einer freigegebenen Version starten
- laufende Documents stabil auf ihrer Startversion bleiben
- Änderungen nicht laufende Prozesse zerstören

---

### 4.5 Draft

Ein Draft ist eine bearbeitbare, noch nicht produktiv freigegebene Version eines Templates oder Workflows.

Ein Draft:
- kann geändert werden
- kann geprüft werden
- kann nicht für neue Documents genutzt werden

---

### 4.6 Published

Published bedeutet:
- diese Version ist die produktiv freigegebene Version
- neue Documents dürfen mit dieser Version gestartet werden

---

### 4.7 Archived

Archived bedeutet:
- diese Version ist nicht mehr für neue Documents nutzbar
- sie bleibt historisch nachvollziehbar

Archived ist nicht gleich gelöscht.

---

## 5. Formularbegriffe

### 5.1 Formular

Ein Formular ist die sichtbare Benutzerschnittstelle, die aus einem Form Template gerendert wird.

Es ist die Arbeitsfläche, in der Users:
- Werte eingeben
- Journaldaten erfassen
- Anhänge hochladen
- Form Actions auslösen

Das Formular ist die gerenderte Nutzungsform des Templates, nicht das Template selbst.

---

### 5.2 Feld

Ein Feld ist ein definierter Eingabe- oder Anzeigeelementtyp innerhalb eines Formulars.

Beispiele:
- Textfeld
- Textarea
- Select
- Lookup
- Checkbox
- CheckboxGroup
- RadioGroup
- Journal
- AttachmentArea
- readonlyText

Ein Feld hat:
- einen Namen
- einen Typ
- ein Label
- optionale Regeln
- optionalen Bezug zu Workflowstatus

---

### 5.3 Template Key

Ein Template Key ist ein Feld, das ein Template fachlich parametrisiert oder bei der Erstellung eines Documents steuert.

Beispiel:
- `product_id`

Template Keys dienen dazu, ein Template im fachlichen Kontext zu prägen oder ein neues Document sinnvoll zu initialisieren.

Template Key ist ein führender Fachbegriff.

---

### 5.4 Document Key

Ein Document Key ist ein Feld, das ein konkretes Document fachlich identifiziert.

Beispiele:
- `batch_id`
- `customer_order_number`

Document Keys sind führende Fachbegriffe.

Wichtig:
- Das frühere Konzept eines allgemeinen „Business Key“ ist **nicht führend**
- Führend sind stattdessen:
  - Template Keys
  - Document Keys

---

### 5.5 Table Field

Ein Table Field ist ein Feld, das in Dokumentlisten eines Templates als Spalte angezeigt werden darf.

Ein Table Field ist kein eigener Feldtyp.
Es ist ein Attribut eines Feldes.

---

### 5.6 Lookup

Ein Lookup ist ein Feld, dessen Werte aus einer externen oder simulierten Quelle geladen werden.

Ein Lookup verwendet:
- `operationRef`
- `valueKey`
- `labelKey`

Ein Lookup dient der Auswahl, nicht der freien Texteingabe.

---

### 5.7 CheckboxGroup

Eine CheckboxGroup ist ein Feld mit mehreren auswählbaren Optionen, das als Mehrfachauswahl gespeichert wird.

Speicherung:
- Array in `dataJson`

---

### 5.8 RadioGroup

Eine RadioGroup ist ein Feld mit mehreren Optionen, bei dem genau eine Option gewählt wird.

Speicherung:
- einzelner Wert in `dataJson`

---

### 5.9 Journal

Ein Journal ist ein strukturierter, wiederholbarer Datenerfassungsbereich innerhalb eines Documents.

Ein Journal besteht aus:
- Zeilen
- Spalten
- definierten Spaltentypen

Ein Journal dient dazu, wiederkehrende strukturierte Einträge zu erfassen.

Beispiele:
- Inspektionsschritte
- Arbeitsnachweise
- Prüfergebnisse

---

### 5.10 Attachment Area

Eine Attachment Area ist ein definierter Formularbereich zum Hochladen und Anzeigen von Dateien.

Sie beschreibt:
- wo Attachments im Formular logisch hingehören
- mit welchem Label und Hilfetext sie angezeigt werden

---

### 5.11 Form Action

Eine Form Action ist eine benutzerseitig aus dem Formular auslösbare Aktion.

Beispiele:
- create_customer_order
- create_batch

Form Actions:
- erscheinen als Buttons im Formular
- verwenden optional `operationRef`
- sind fachliche Formularaktionen

Form Actions sind nicht dasselbe wie Workflow Actions.

---

## 6. Workflow-Begriffe

### 6.1 Status

Ein Status ist ein definierter Zustand eines Documents innerhalb eines Workflows.

Beispiele:
- new
- created
- assigned
- started
- progressed
- submitted
- approved
- archived

Ein Status bestimmt:
- welche Actions sichtbar sind
- welche Felder editierbar sind
- welche Rollen aktiv arbeiten können

---

### 6.2 Initialstatus

Der Initialstatus ist der Status, in dem ein neues Document startet.

---

### 6.3 Workflow Action

Eine Workflow Action ist eine prozessbezogene Aktion, die einen Statusübergang auslöst.

Beispiele:
- create
- assign
- start
- save
- submit
- approve
- reject
- reAssign
- archive

Jede Workflow Action:
- hat ein `from`
- hat ein `to`
- hat erlaubte Rollen
- wird in der UI als Button sichtbar

Workflow Actions sind keine Form Actions.

---

### 6.4 Transition

Eine Transition ist der Übergang eines Documents von einem Status in einen anderen Status.

Beispiele:
- `submitted -> approved`
- `assigned -> started`

Transitions werden typischerweise durch Workflow Actions ausgelöst.

---

### 6.5 Editor

Editor ist eine dokumentbezogene Rolle, die ein Document in dafür vorgesehenen Status bearbeiten darf.

Editors:
- können mehrere sein
- haben typischerweise Schreibrechte
- dürfen nur die ihnen erlaubten Workflow Actions ausführen

---

### 6.6 Approver

Approver ist eine dokumentbezogene Rolle, die ein Document freigeben oder zurückweisen darf.

Approver:
- können mehrere sein
- dürfen typischerweise approve/reject ausführen
- arbeiten im submitted-Kontext oder anderen dafür definierten Status

---

### 6.7 Approval Rule

Eine Approval Rule beschreibt, wann ein Freigabeschritt als erfüllt gilt.

Beispiel:
- alle erforderlichen Approver müssen approved haben

---

### 6.8 Hook

Ein Hook ist eine automatisch ausgelöste Systemreaktion im Workflow-Kontext.

Hooks werden z. B. ausgelöst:
- bei bestimmten Transitionen
- bei bestimmten Workflow-Ereignissen

Hooks verwenden:
- `operationRef`

Hooks sind keine UI-Buttons.
Sie sind automatische Hintergrundreaktionen.

---

## 7. Document- und Laufzeitbegriffe

### 7.1 Document

Ein Document ist eine laufende Instanz eines publizierten Form Templates in einer festen Template-Version.

Ein Document enthält:
- Status
- Formulardaten
- Journaldaten
- Attachments
- Integrationszustand
- Audit-Historie

Ein Document ist das zentrale Laufzeitobjekt der Anwendung.

---

### 7.2 Template-Version-Bindung

Ein Document bleibt immer an der Template-Version gebunden, mit der es gestartet wurde.

Es springt nicht automatisch auf eine neue Version.

---

### 7.3 Assignment

Ein Assignment ist die Zuordnung eines Documents zu einem oder mehreren Users in einer bestimmten Rolle.

Assignments betreffen typischerweise:
- Editors
- Approvers

---

### 7.4 Task

Ein Task ist eine konkrete Arbeitsaufforderung für einen User im Kontext eines Documents.

Tasks dienen dazu, Arbeitsdruck und Zuständigkeit sichtbar zu machen.

Beispiele:
- approve customer order
- submit batch
- continue evidence form

---

### 7.5 History / Audit

History oder Audit ist die nachvollziehbare Ereignisfolge eines Documents.

Sie enthält wichtige Ereignisse wie:
- erstellt
- zugewiesen
- gespeichert
- submitted
- approved
- rejected
- Hook ausgeführt
- Attachment hochgeladen

History ist nicht Debug-Logging.
History ist fachlich sichtbare Nachvollziehbarkeit.

---

### 7.6 Snapshot

Snapshot ist ein JSON-Bereich für sicht- oder nachweisrelevante Zustände, die nicht direkt normale Formulardaten sind.

---

### 7.7 External

External ist ein JSON-Bereich für externe fachliche Werte, die in Bezug auf das Document gehalten werden.

---

### 7.8 Integration Context

Der Integration Context ist ein persistierter JSON-Bereich am Document, in dem Integrationszustände und Zwischenergebnisse gespeichert werden.

Beispiele:
- externe IDs
- CRM-/ERP-Referenzen
- Zwischenergebnisse für Folgeoperationen

Der Integration Context ist führend für mehrstufige Integrationsprozesse.

---

## 8. Integrationsbegriffe

### 8.1 Operation

Eine Operation ist eine TypeScript-definierte Integrationsfunktion.

Sie ist das führende technische Ausführungsmodell für:
- Lookups
- Form Actions
- Workflow Hooks

---

### 8.2 operationRef

operationRef ist die eindeutige Referenz auf eine Operation.

Beispiele:
- products.listValid
- customers.listValid
- customerOrders.create
- customerOrders.setStatusFromContext

operationRef ist führend.
apiRef ist nicht führend.

---

### 8.3 apiRef

apiRef ist, falls noch vorhanden, nur ein Bridge- oder Legacy-Begriff.

apiRef ist nicht das führende Integrationsmodell des MVP.

---

### 8.4 Auth Strategy

Eine Auth Strategy beschreibt, wie sich eine Operation gegenüber einem Fremdsystem authentifiziert.

Im MVP vorbereitet:
- none
- apiKey
- basic
- bearerToken
- oauth2ClientCredentials vorbereitet

---

### 8.5 Connector

Ein Connector ist die fachlich-technische Gruppierung von Operationen gegen ein bestimmtes Fremdsystem oder eine bestimmte Quelle.

Beispiele:
- erp-sim
- salesforce-sandbox

---

## 9. UI-Begriffe

### 9.1 Arbeits-UI

Arbeits-UI ist die normale Benutzeroberfläche für die tägliche Nutzung.

Sie zeigt:
- Aufgaben
- Formulare
- Status
- Dokumente
- Historie
- Aktionen

Sie zeigt nicht standardmäßig:
- JSON
- technische Integrationsdetails
- Bridge-/Legacy-Strukturen

---

### 9.2 Konfigurations-UI

Konfigurations-UI ist die Oberfläche für Fachadministratoren und Prozessverantwortliche.

Sie dient dazu:
- Templates zu definieren
- Workflows zu definieren
- Versionen zu verwalten
- Zuordnungen zu pflegen

Hier ist JSON in begrenzter Form zulässig.

---

### 9.3 Admin-UI

Admin-UI ist die Oberfläche für Users, Groups, Memberships und Template Assignments.

Sie ist keine Arbeits-UI.

---

### 9.4 Advanced / Technical View

Advanced / Technical View ist eine optionale Sicht für technische Informationen, die nicht Teil der normalen Arbeits-UI ist.

Dazu gehören:
- JSON-Ansichten
- Bridge-/Legacy-Hinweise
- Operationsübersichten
- technische Referenzen

---

## 10. Nicht führende oder verbotene Begriffe

Die folgenden Begriffe sind nicht führend oder sollen vermieden werden, wenn sie als konkurrierende Modelle auftreten:

- Business Key als führendes Kernkonzept
- apiRef als führendes Integrationskonzept
- parallele konkurrierende Statusmodelle
- implizite Builder-Logik als führende Definition
- nicht definierte „Meta“-Begriffe ohne Fachbedeutung

---

## 11. Regel für alle Folgedokumente

Alle weiteren Spezifikationsdokumente müssen diese Begriffe in genau dieser Bedeutung verwenden.

Wenn ein Begriff in einem späteren Dokument anders benutzt werden müsste, ist zuerst dieses Glossar anzupassen.