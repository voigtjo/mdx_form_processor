# 17 — Reference Data Specification

## 1. Ziel dieses Dokuments

Dieses Dokument definiert die führenden Referenzdaten des MVP.

Es legt verbindlich fest:

- welche Referenzobjekte im Standardsystem vorhanden sein sollen
- welche Users, Groups, Memberships, Templates und Workflows als Referenzbestand existieren
- welche Referenz-Documents für Sichtprüfung, Test und Demonstration vorhanden sein sollen
- welche Integrations- und Operationsbezüge im Referenzbestand sichtbar sein sollen
- welche fachlichen Referenzfälle mit diesem Bestand abgedeckt werden

Dieses Dokument ist die führende Wahrheit für den Referenzdatenbestand.

---

## 2. Rolle der Referenzdaten im MVP

Die Referenzdaten dienen dazu:

- die Kernfunktionen des MVP sichtbar zu machen
- manuelle Prüfungen zu ermöglichen
- spätere Seed-Daten fachlich vorzudefinieren
- Beispielobjekte für UI, Workflow und Integrationen bereitzustellen
- Tests nachvollziehbar und reproduzierbar zu machen

Die Referenzdaten sind kein beliebiger Demo-Content.
Sie sind ein gezielt definierter Prüf- und Beispielbestand.

---

## 3. Grundsätze der Referenzdaten

Für den Referenzbestand gelten diese Regeln:

1. Die Referenzdaten müssen den MVP-Kernprozess sichtbar machen.
2. Die Referenzdaten müssen die Hauptobjektarten abdecken.
3. Die Referenzdaten müssen Form, Workflow und Operationen zusammenspielen lassen.
4. Die Referenzdaten müssen verständlich und fachlich lesbar sein.
5. Die Referenzdaten müssen reproduzierbar sein.
6. Der Referenzbestand soll klein, aber vollständig genug für Kernprüfungen sein.

---

## 4. Führende Referenzobjekte

Der Referenzbestand umfasst mindestens:

- Users
- Groups
- Memberships
- Workflow Templates
- Form Templates
- Template Assignments
- Documents
- Assignments
- Tasks
- Attachments
- Audit Events
- Operation-Referenzen

---

## 5. Referenz-Users

Im MVP-Referenzbestand sollen mindestens diese Users existieren:

- Alice
- Bob

Optional später:
- Charlie
- Dana

## 5.1 Alice

### Empfohlene Eigenschaften
- key: `alice`
- displayName: `Alice`
- status: `active`
- email: `alice@example.local`

### Fachliche Rolle im Referenzbestand
- typischer Editor
- teilweise auch auslösend für Save/Submit-Beispiele

## 5.2 Bob

### Empfohlene Eigenschaften
- key: `bob`
- displayName: `Bob`
- status: `active`
- email: `bob@example.local`

### Fachliche Rolle im Referenzbestand
- typischer Approver
- dient für Approve-/Reject-/History-Beispiele

---

## 6. Referenz-Groups

Im MVP-Referenzbestand sollen mindestens diese Groups existieren:

- Ops
- Quality optional

## 6.1 Ops

### Empfohlene Eigenschaften
- key: `ops`
- name: `Ops`
- description: `Operations team`

### Rolle im Referenzbestand
Ops ist die Hauptarbeitsgruppe der Referenzwelt.

## 6.2 Quality

### Empfohlene Eigenschaften
- key: `quality`
- name: `Quality`
- description: `Quality team`

### Rolle im Referenzbestand
Quality ist optional und dient dazu, spätere Sichtbarkeits- oder Prüfkonzepte zu demonstrieren.
Für den minimalen MVP-Referenzbestand ist `Ops` ausreichend.

---

## 7. Referenz-Memberships

Im MVP-Referenzbestand sollen mindestens diese Memberships existieren:

- Alice -> Ops -> rwx
- Bob -> Ops -> rwx

Optional später:
- Bob -> Quality -> r oder rwx je nach Testziel

## 7.1 Mindestziel

Mit diesen Memberships ist sichergestellt:

- beide Users sehen die Hauptgruppe
- beide Users sehen die zugewiesenen Templates
- beide Users können in Referenzflows arbeiten
- unterschiedliche Dokumentrollen werden trotzdem erst über Assignments sichtbar

---

## 8. Referenz-Workflow Templates

Im MVP-Referenzbestand sollen mindestens diese Workflow Templates existieren:

- `customer-order.group-submit.v1`
- `production.standard.v1`
- `evidence.group-submit.v1`

Diese drei Workflows decken die wichtigsten Muster des MVP ab.

---

## 9. Workflow: customer-order.group-submit.v1

## 9.1 Zweck

Referenzworkflow für:
- Customer Order Beispiel
- Submit/Approve
- Hook-Ausführung bei Approval
- Integrationskontext-Nutzung

## 9.2 Fachliche Kernmerkmale

- Mehrfach-Editoren möglich
- Mehrfach-Approver möglich
- Submit durch einen Editor genügt
- Approval durch alle erforderlichen Approver möglich bzw. demonstrierbar
- Hook bei `submitted -> approved`

## 9.3 Wichtige Beispiel-Action

- `approve`

## 9.4 Wichtiger Beispiel-Hook

- `customerOrders.setStatusFromContext`

---

## 10. Workflow: production.standard.v1

## 10.1 Zweck

Referenzworkflow für:
- Produktions-/Batch-Beispiel
- Start / Save / Submit
- Document Key Bearbeitung
- Journal und Attachments

## 10.2 Fachliche Kernmerkmale

- Template Key früh editierbar
- Document Key in `assigned` editierbar
- Journal im Bearbeitungskontext editierbar
- Attachments im Bearbeitungskontext sichtbar

---

## 11. Workflow: evidence.group-submit.v1

## 11.1 Zweck

Referenzworkflow für:
- einfachen Nachweis- oder Evidence-Prozess
- kompakten Freigabefluss
- Attachments
- Journal
- einfache Visibility-/Statusprüfungen

---

## 12. Referenz-Form Templates

Im MVP-Referenzbestand sollen mindestens diese Form Templates existieren:

- `customer-order-test`
- `production-batch`
- `evidence-basic`

Diese drei Templates decken die wichtigsten Muster des MVP ab.

---

## 13. Template: customer-order-test

## 13.1 Zweck

Referenztemplate für:
- Lookup-Felder
- Form Action
- Submit / Approve
- Workflow Hook
- Integrationskontext

## 13.2 Erwartete Felder

Mindestens:

- `customer_id` (lookup, templateKey, tableField)
- `customer_order_number` (text, documentKey, tableField)
- `fulfillment_flags` (checkboxGroup)
- `attachments_main` (attachmentArea)

## 13.3 Zugewiesener Workflow

- `customer-order.group-submit.v1`

## 13.4 Relevante Form Action

- `create_customer_order` -> `customerOrders.create`

---

## 14. Template: production-batch

## 14.1 Zweck

Referenztemplate für:
- Template Key
- Document Key
- Journal
- Attachment Area
- Save-/Start-/Submit-Abläufe

## 14.2 Erwartete Felder

Mindestens:

- `product_id` (lookup, templateKey, tableField)
- `batch_id` (text, documentKey, tableField)
- `fulfillment_flags` (checkboxGroup)
- `inspection_steps` (journal)
- `attachments_main` (attachmentArea)

## 14.3 Zugewiesener Workflow

- `production.standard.v1`

## 14.4 Relevante Form Action

- `create_batch` -> `batches.create`

---

## 15. Template: evidence-basic

## 15.1 Zweck

Referenztemplate für:
- Evidence-/Nachweisfall
- kompaktes Formular
- Journal
- Attachments
- einfacher Freigabefluss

## 15.2 Erwartete Felder

Mindestens:

- ein oder zwei textuelle Nachweisfelder
- `evidence_notes` oder vergleichbar
- `evidence_steps` oder vergleichbar als Journal
- `attachments_main` als attachmentArea

## 15.3 Zugewiesener Workflow

- `evidence.group-submit.v1`

---

## 16. Referenz-Template Assignments

Mindestens sollen diese Template Assignments existieren:

- `customer-order-test` -> Ops
- `production-batch` -> Ops
- `evidence-basic` -> Ops

Damit sind die Kern-Templates im Workspace und Templates-Kontext sichtbar.

---

## 17. Referenz-Operationen

Die folgenden Operationen sollen im Referenzkontext fachlich vorhanden und referenzierbar sein:

- `products.listValid`
- `customers.listValid`
- `batches.create`
- `customerOrders.create`
- `customerOrders.setStatus`
- `customerOrders.setStatusFromContext`

Optional vorbereitbar:
- `salesforce.accounts.listRecent`

---

## 18. Referenz-Documents

Im MVP-Referenzbestand sollen mindestens diese Documents existieren:

1. ein Customer Order Document
2. ein Production Batch Document
3. ein Evidence Document

Zusätzlich sinnvoll:
- je ein weiteres Document in anderem Status zur Listendarstellung

---

## 19. Referenz-Document: Customer Order 4711

## 19.1 Zweck

Dieses Document ist der zentrale Referenzfall für:
- Submit
- Approve
- Workflow Hook
- Integrationskontext
- History
- Form Action

## 19.2 Empfohlene Eigenschaften

- Template: `customer-order-test`
- Status: `submitted` oder `approved` je nach Prüffall
- Customer gewählt
- Customer Order Number vorhanden
- Fulfillment Flags gesetzt

## 19.3 Empfohlene Assignments

- Alice = Editor
- Bob = Approver

## 19.4 Erwartete History-Beispiele

- `created`
- `assigned`
- `saved`
- `submitted`
- `approved`
- `workflow_hook_executed`

---

## 20. Referenz-Document: Batch B-2026-0042

## 20.1 Zweck

Dieses Document ist der Referenzfall für:
- Template Key + Document Key
- Journal
- Attachments
- Start / Save / Submit
- editierbare Felder im Bearbeitungskontext

## 20.2 Empfohlene Eigenschaften

- Template: `production-batch`
- Status: `started` oder `progressed`
- Product ausgewählt
- Batch ID gesetzt
- Fulfillment Flags gesetzt
- Journal befüllt
- mindestens ein Attachment vorhanden

## 20.3 Empfohlene Assignments

- Alice = Editor

---

## 21. Referenz-Document: Evidence 2026-101

## 21.1 Zweck

Dieses Document ist der Referenzfall für:
- kompakten Evidence-/Nachweisprozess
- einfache Liste
- Attachments
- Journal
- Sichtbarkeit in My Documents

## 21.2 Empfohlene Eigenschaften

- Template: `evidence-basic`
- Status: `assigned` oder `submitted`
- mindestens ein Nachweisfeld befüllt oder leer im sinnvollen Ausgangszustand

---

## 22. Referenz-Assignments

Mindestens sollen folgende Document-Assignments existieren:

- Customer Order 4711:
  - Alice = Editor
  - Bob = Approver

- Batch B-2026-0042:
  - Alice = Editor

- Evidence 2026-101:
  - Bob oder Alice je nach Prüffall

---

## 23. Referenz-Tasks

Mindestens sollen Tasks sichtbar gemacht werden können für:

- Approve Customer Order 4711
- Submit Batch B-2026-0042
- Continue Evidence 2026-101

Die genaue technische Ableitung kann dynamisch oder seed-basiert sein.
Fachlich müssen diese Aufgaben im Referenzkontext darstellbar sein.

---

## 24. Referenz-Attachments

Mindestens sollen im Referenzbestand vorhandene sichtbare Attachments existieren für:

- Customer Order 4711
  - z. B. `contract.pdf`
- Batch B-2026-0042
  - z. B. `batch-photo.jpg` oder `batch-note.pdf`

Für Evidence kann ein Attachment optional vorhanden sein.

---

## 25. Referenz-Audit Events

Mindestens sollen Audit Events sichtbar sein, die diese Kernereignisse im Referenzbestand zeigen:

- created
- assigned
- started
- saved
- submitted
- approved
- rejected optional
- archived optional
- attachment_uploaded
- action_executed
- workflow_hook_executed

---

## 26. Führende Referenzfälle des MVP

Die Referenzdaten müssen mindestens diese fachlichen Referenzfälle sichtbar machen:

### 26.1 Customer Order Flow
- Template published
- Document started
- assigned
- submitted
- approved
- Hook läuft
- Audit sichtbar

### 26.2 Production Batch Flow
- Product Lookup
- Batch ID setzen
- Journal pflegen
- Attachment hochladen
- Save sichtbar

### 26.3 Evidence Flow
- einfaches Nachweisformular
- Assignment
- Sichtbarkeit in Workspace und My Documents

---

## 27. Sichtbare Prüfpunkte anhand des Referenzbestands

Der Referenzbestand muss mindestens diese sichtbaren Prüfpunkte ermöglichen:

1. Alice sieht My Groups
2. Alice sieht My Templates
3. Alice sieht My Documents
4. Bob sieht Approve-Task
5. Customer Order 4711 zeigt History mit Hook-Eintrag
6. Batch B-2026-0042 zeigt Journal
7. Batch B-2026-0042 zeigt Attachment
8. Template Documents-Tabelle zeigt definierte Table Fields
9. Workflow Usage zeigt referenzierendes Template
10. Template Integrations zeigt verwendete operationRefs

---

## 28. Referenzdaten und spätere Seed-Dateien

Dieses Dokument definiert den **fachlichen Referenzbestand**.

Die spätere Datei `20_sample_data_seed.md` übersetzt diesen Referenzbestand in:

- konkrete Seed-Struktur
- Reihenfolge der Erzeugung
- minimale vs. vollständige Seed-Sets
- Rebuild-/Reset-Konzept

---

## 29. Nicht Ziel des Referenzbestands

Nicht Ziel des Referenzbestands sind:

- große Mengen beliebiger Demo-Records
- zufällige Testdaten ohne fachlichen Bezug
- umfangreiche Massen- oder Lastdaten
- unverständliche technische Seed-Artefakte ohne Sichtbezug

Der Referenzbestand soll klein, lesbar und prüfbar bleiben.

---

## 30. Ergebnisregel

Der in diesem Dokument beschriebene Referenzbestand ist das führende fachliche Referenzmodell des MVP.

Spätere Seeds, Demo-Daten und Testdaten dürfen davon abweichen **nur**, wenn dieses Dokument zuerst angepasst wird.
