# 03 — Domain Model

## 1. Ziel dieses Dokuments

Dieses Dokument beschreibt das führende fachliche Domänenmodell der Anwendung.

Es definiert:

- welche Kernobjekte es gibt
- welche Beziehungen zwischen ihnen bestehen
- welche Daten auf welchem Objekt liegen
- welche Objekte Laufzeitobjekte sind
- welche Objekte Konfigurationsobjekte sind

Dieses Dokument beschreibt **nicht**:
- die konkrete Datenbanksyntax
- die konkrete API-Implementierung
- die konkrete UI
- die konkrete MDX-Syntax
- die konkrete Workflow-JSON-Syntax

Diese Themen werden in separaten Dokumenten geregelt.

---

## 2. Modellierungsprinzipien

Für das Domain Model gelten folgende Prinzipien:

1. Es gibt pro fachlichem Thema genau ein führendes Objekt.
2. Konfiguration und Laufzeit werden getrennt.
3. Form, Workflow und Integration sind getrennte Modellbereiche.
4. Ein laufendes Document bleibt an seiner Startversion gebunden.
5. Technische Hilfsmodelle dürfen das fachliche Modell nicht dominieren.
6. Das Modell muss produktiv nutzbar und menschenverständlich bleiben.
7. Template Key und Document Key sind führende Fachkonzepte.
8. Ein allgemeines führendes Business-Key-Konzept existiert nicht.

---

## 3. Hauptklassen von Objekten

Die Anwendung besteht fachlich aus drei Objektklassen:

### 3.1 Organisationsobjekte
- User
- Group
- Membership

### 3.2 Konfigurationsobjekte
- Form Template
- Workflow Template
- Operation
- Template Assignment

### 3.3 Laufzeitobjekte
- Document
- Task
- Attachment
- Audit Event
- Assignment

---

## 4. Organisationsobjekte

## 4.1 User

Ein User ist eine im System auswählbare Person, die mit Templates, Documents und Tasks arbeitet.

### Pflichtattribute
- id
- key
- displayName
- status

### Optionale Attribute
- email
- description

### Fachliche Eigenschaften
- kann Mitglied in mehreren Groups sein
- kann Documents lesen, bearbeiten oder ausführen, wenn Rechte und Rollen dies erlauben
- kann Editor oder Approver in einem Document sein

### Nicht Bestandteil des MVP-User-Modells
- Login-Daten
- Passwort-Handling
- Identity-Provider-Zuordnung
- Sessionmodell

---

## 4.2 Group

Eine Group ist eine organisatorische Einheit, der Users und Form Templates zugeordnet werden.

### Pflichtattribute
- id
- key
- name

### Optionale Attribute
- description
- status

### Fachliche Eigenschaften
- bündelt organisatorische Sichtbarkeit
- dient als Zuweisungsebene für Templates
- dient als Rechtekontext über Memberships

---

## 4.3 Membership

Eine Membership verbindet einen User mit einer Group und weist Rechte zu.

### Pflichtattribute
- id
- userId
- groupId
- rights

### Rechte
- r = read
- w = write
- x = execute

### Fachliche Eigenschaften
- bestimmt die Grundrechte eines Users innerhalb einer Group
- ist die führende Verbindung zwischen User und Group
- ist bewusst einfach gehalten

---

## 5. Konfigurationsobjekte

## 5.1 Form Template

Ein Form Template beschreibt die fachliche und strukturelle Vorlage eines Formulars.

### Pflichtattribute
- id
- key
- name
- version
- status
- workflowTemplateId
- mdxBody

### Weitere Attribute
- description
- templateKeys
- documentKeys
- tableFields
- groupAssignments
- visibilityRules
- publishedAt
- archivedAt

### Fachliche Eigenschaften
- wird in MDX beschrieben
- referenziert genau ein Workflow Template
- kann mehreren Groups zugewiesen werden
- ist versioniert
- darf nur im Status published für neue Documents verwendet werden

### Enthält fachlich
- Felddefinitionen
- Layoutstruktur
- Hinweise/Texte
- Formularaktionen
- Tabellenfelddefinitionen
- Template Keys
- Document Keys

### Enthält fachlich nicht
- laufende Formularwerte
- konkrete Assignments
- konkreten Dokumentstatus
- Integrationszustand eines konkreten Documents

---

## 5.2 Workflow Template

Ein Workflow Template beschreibt den Status- und Aktionsfluss, der für Documents eines Templates gilt.

### Pflichtattribute
- id
- key
- name
- version
- status
- workflowJson

### Weitere Attribute
- description
- publishedAt
- archivedAt

### Fachliche Eigenschaften
- wird als JSON beschrieben
- ist versioniert
- kann von mehreren Form Templates referenziert werden
- definiert Status, Actions, Rollenregeln, Feldregeln und Hooks

### Enthält fachlich
- Statusliste
- Initialstatus
- Actions
- Transitionen
- Rollen je Action
- Feldregeln je Status
- Mehrfach-Editor-/Approver-Modell
- Hooks mit operationRef

### Enthält fachlich nicht
- konkrete User-Zuweisungen eines Documents
- konkrete Dokumentwerte
- konkrete UI-Layouts eines Formulars

---

## 5.3 Operation

Eine Operation ist eine TypeScript-definierte Integrationsfunktion.

### Pflichtattribute
- operationRef
- modulePath
- authStrategy

### Weitere Attribute
- name
- connector
- description
- inputSchema optional
- outputSchema optional
- tags optional

### Fachliche Eigenschaften
- ist das führende Ausführungsmodell für Integrationen
- kann aus Form Actions aufgerufen werden
- kann aus Workflow Hooks aufgerufen werden
- kann auf Dokumentkontext lesen und in Integrationskontext schreiben

### Beispiele
- products.listValid
- customers.listValid
- batches.create
- customerOrders.create
- customerOrders.setStatusFromContext

---

## 5.4 Template Assignment

Ein Template Assignment ist die Zuordnung eines Form Templates zu einer Group.

### Pflichtattribute
- id
- templateId
- groupId

### Weitere Attribute
- status
- assignedAt

### Fachliche Eigenschaften
- bestimmt, welche Groups auf ein Template zugreifen dürfen
- ist nicht identisch mit einer Membership
- verbindet Template und Group, nicht User und Group

---

## 6. Laufzeitobjekte

## 6.1 Document

Ein Document ist die laufende Instanz eines publizierten Form Templates in einer konkreten Template-Version.

### Pflichtattribute
- id
- templateId
- templateVersion
- workflowTemplateId
- workflowTemplateVersion
- status
- dataJson
- createdBy
- createdAt
- updatedAt

### Weitere Attribute
- externalJson
- snapshotJson
- integrationContextJson
- archivedAt

### Fachliche Eigenschaften
- ist das zentrale Laufzeitobjekt der Anwendung
- bleibt an der Startversion von Template und Workflow gebunden
- speichert Formularwerte, Nachweise und Integrationszustand
- hat einen aktuellen Workflowstatus
- kann Assignments, Tasks, Audit Events und Attachments besitzen

### Führende JSON-Bereiche am Document
- dataJson
- externalJson
- snapshotJson
- integrationContextJson

### Nicht Bestandteil des Documents
- Template-Definition selbst
- Workflow-Definition selbst
- Operation-Definition selbst

---

## 6.2 Assignment

Ein Assignment ist die dokumentbezogene Zuweisung eines Users zu einer Rolle innerhalb eines Documents.

### Pflichtattribute
- id
- documentId
- userId
- role

### Weitere Attribute
- assignedBy
- assignedAt
- active

### Zulässige Rollen im MVP
- editor
- approver

### Fachliche Eigenschaften
- mehrere Editors sind zulässig
- mehrere Approvers sind zulässig
- Assignments sind dokumentbezogen, nicht global
- Assignments definieren keine Memberships und ersetzen diese nicht

---

## 6.3 Task

Ein Task ist eine konkrete Arbeitsaufforderung für einen User im Kontext eines Documents.

### Pflichtattribute
- id
- documentId
- userId
- action
- status
- createdAt

### Weitere Attribute
- role
- dueAt
- closedAt

### Fachliche Eigenschaften
- ergibt sich aus Workflowzustand und Assignment
- macht offene Arbeit sichtbar
- wird in My Tasks angezeigt

### Beispiele
- approve customer order
- submit batch
- continue evidence document

---

## 6.4 Attachment

Ein Attachment ist eine Datei, die an einem Document hängt.

### Pflichtattribute
- id
- documentId
- filename
- mimeType
- size
- storageKey
- uploadedBy
- createdAt

### Fachliche Eigenschaften
- gehört zu genau einem Document
- wird in einer Attachment Area oder im Attachment-Bereich des Documents sichtbar
- ist nicht Teil des eigentlichen Formularwertmodells in dataJson

---

## 6.5 Audit Event

Ein Audit Event ist ein nachvollziehbarer Verlaufseintrag zu einem Document.

### Pflichtattribute
- id
- documentId
- eventType
- createdAt

### Weitere Attribute
- actorUserId
- message
- payloadJson

### Fachliche Eigenschaften
- bildet die nachvollziehbare History eines Documents
- ist für Nutzer sichtbar
- dient nicht nur technischem Debugging

### Standardereignisse
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

---

## 7. Beziehungen zwischen den Objekten

## 7.1 Organisation

- Ein User kann mehrere Memberships haben.
- Eine Group kann mehrere Memberships haben.
- Eine Membership gehört genau zu einem User und genau zu einer Group.

## 7.2 Konfiguration

- Ein Form Template referenziert genau ein Workflow Template.
- Ein Workflow Template kann von mehreren Form Templates referenziert werden.
- Ein Form Template kann mehreren Groups zugewiesen werden.
- Eine Group kann mehreren Templates zugewiesen sein.

## 7.3 Laufzeit

- Ein Document wird aus genau einer publizierten Version eines Form Templates gestartet.
- Ein Document verweist auf genau eine konkrete Workflow-Template-Version.
- Ein Document kann mehrere Assignments haben.
- Ein Document kann mehrere Tasks haben.
- Ein Document kann mehrere Attachments haben.
- Ein Document kann mehrere Audit Events haben.

## 7.4 Integrationen

- Form Actions können Operationen referenzieren.
- Workflow Hooks können Operationen referenzieren.
- Operationen lesen und schreiben im Kontext eines Documents.

---

## 8. Führende Datenverantwortung je Objekt

## 8.1 User
Verantwortet:
- Identität im MVP-Sinn
- Anzeige-Name
- organisatorische Nutzbarkeit

## 8.2 Group
Verantwortet:
- organisatorische Bündelung
- Template-Zugriffskontext

## 8.3 Membership
Verantwortet:
- Rechte auf Gruppenebene

## 8.4 Form Template
Verantwortet:
- Formularstruktur
- Felddefinition
- MDX
- Tabellenfelder
- Template Keys
- Document Keys

## 8.5 Workflow Template
Verantwortet:
- Statusmodell
- Workflow Actions
- Feldregeln
- Approval-Modell
- Hooks

## 8.6 Document
Verantwortet:
- Formularlaufzeitdaten
- aktuellen Status
- externen Kontext
- Snapshot
- Integrationskontext

## 8.7 Assignment
Verantwortet:
- dokumentbezogene Rollen-Zuweisung

## 8.8 Task
Verantwortet:
- sichtbare Arbeitsaufforderung

## 8.9 Attachment
Verantwortet:
- Dateien am Document

## 8.10 Audit Event
Verantwortet:
- nachvollziehbare History

## 8.11 Operation
Verantwortet:
- auszuführende Integrationslogik

---

## 9. Führende JSON-Bereiche des Documents

## 9.1 dataJson
Enthält:
- normale Formularwerte
- CheckboxGroup-Werte
- RadioGroup-Werte
- Journalinhalte

Nicht enthalten:
- reine externe Referenzen als Integrationszustand
- technische Hook-Zustände

---

## 9.2 externalJson
Enthält:
- externe fachliche Werte, die am Document gehalten werden sollen

Beispiele:
- externe Nummern oder Statuswerte, die fachlich sichtbar sein sollen

---

## 9.3 snapshotJson
Enthält:
- Sicht- und Nachweiszustände

Beispiele:
- bestätigte Integrationsnachweise
- synchronisierte fachliche Sichtwerte

---

## 9.4 integrationContextJson
Enthält:
- persistierten Integrationszustand
- technische oder halbfachliche Zwischenergebnisse mehrstufiger Integrationsflüsse

Beispiele:
- customer_order_id
- externe Referenzschlüssel
- spätere Folgewerte für weitere Operationen

---

## 10. Versionierungsregeln im Domain Model

1. Form Templates sind versioniert.
2. Workflow Templates sind versioniert.
3. Documents binden sich an die beim Start aktive Template-Version.
4. Documents binden sich an die beim Start aktive Workflow-Version.
5. Publish einer neuen Template-Version ändert keine laufenden Documents.
6. Publish einer neuen Workflow-Version ändert keine laufenden Documents.

---

## 11. Was das Domain Model bewusst nicht enthält

Nicht Bestandteil des führenden Domain Models sind:

- visueller Form-Builder
- visueller Workflow-Builder
- Authentifizierung
- Tenant-Kontext
- produktiver Secret Store
- Retry-/Queue-System
- externe Monitoring-Infrastruktur
- generische Low-Code-Metamodelle
- Builder-interne UI-Hilfszustände als Fachobjekte

---

## 12. Modellgrenzen

### 12.1 Form-Modell
Führend über:
- Form Template
- MDX
- Felder
- Template Keys
- Document Keys

### 12.2 Workflow-Modell
Führend über:
- Workflow Template
- Status
- Actions
- Rollen
- Feldregeln
- Hooks

### 12.3 Integrations-Modell
Führend über:
- Operation
- operationRef
- Auth Strategy
- Integrationskontext

### 12.4 Laufzeit-Modell
Führend über:
- Document
- Assignment
- Task
- Attachment
- Audit Event

---

## 13. Gültigkeitsregel

Dieses Domain Model ist die führende fachliche Struktur der Anwendung.

Alle Folgedokumente müssen mit diesem Modell konsistent sein.
Wenn spätere Spezifikationsdokumente zusätzliche Objekte oder Beziehungen einführen wollen, müssen diese zuerst hier ergänzt oder korrigiert werden.