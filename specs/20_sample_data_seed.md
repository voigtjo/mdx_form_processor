# 20 — Sample Data Seed

## 1. Ziel dieses Dokuments

Dieses Dokument definiert, wie der fachlich gewünschte Referenzbestand des MVP als reproduzierbarer Seed- und Rebuild-Stand bereitgestellt werden soll.

Es legt verbindlich fest:

- welche Seed-Sets es geben soll
- welche Objekte in welcher Reihenfolge erzeugt werden
- welcher Mindestbestand für einen lauffähigen Referenzstand nötig ist
- welche Seed-Daten für Sichtprüfung, Demo und Tests bereitstehen sollen
- wie Reset, Rebuild und Seed fachlich voneinander zu unterscheiden sind
- welche Inhalte bewusst nicht Teil des Standard-Seeds sein sollen

Dieses Dokument ist die führende Wahrheit für den fachlichen Seed-Bestand des MVP.

---

## 2. Rolle des Seed-Bestands im Gesamtsystem

Der Seed-Bestand dient dazu:

- den MVP nach Setup sofort sichtbar und prüfbar zu machen
- die Kernobjekte des Systems reproduzierbar bereitzustellen
- manuelle Sichtprüfungen zu ermöglichen
- UI-, Workflow- und Integrationszusammenspiel sichtbar zu machen
- spätere Tests und Codex-Umsetzungen auf einen klaren Referenzstand zu beziehen

Der Seed-Bestand ist nicht:
- beliebiger Demo-Content
- Lasttest-Datenbestand
- zufällige Entwicklungsabfälle
- ein zweites Fachmodell neben der Spezifikation

---

## 3. Grundprinzipien für Seed-Daten

Für den Seed-Bestand gelten diese Regeln:

1. Seed-Daten müssen die führenden Spezifikationen abbilden.
2. Seed-Daten müssen reproduzierbar sein.
3. Seed-Daten müssen klein, aber fachlich vollständig genug sein.
4. Seed-Daten müssen sichtbaren Nutzen in UI und Tests haben.
5. Seed-Daten dürfen nicht aus zufälligen Altbeständen bestehen.
6. Seed-Daten müssen zwischen Mindestbestand und Referenzbestand unterscheiden.

---

## 4. Führende Seed-Arten

Im MVP werden drei fachliche Seed-Arten unterschieden:

### 4.1 Minimal Seed
Der kleinste lauffähige Bestand für ein leeres, aber nutzbares System.

### 4.2 Reference Seed
Der vollständige fachliche Referenzbestand für Sichtprüfung, Demo und Kernflusstests.

### 4.3 Optional Extended Seed
Ein später möglicher, größerer Beispielbestand für zusätzliche Demo- oder Testfälle.

Für das MVP sind mindestens erforderlich:
- Minimal Seed
- Reference Seed

---

## 5. Unterschied zwischen Reset, Rebuild und Seed

## 5.1 Seed

Seed bedeutet:
- Einspielen eines definierten Startbestands.

## 5.2 Reset

Reset bedeutet:
- Entfernen vorhandener Inhalte oder Rücksetzen bestimmter Laufzeitdaten.

Reset ist technisch möglich, aber fachlich nicht dasselbe wie Rebuild.

## 5.3 Rebuild

Rebuild bedeutet:
- den gewünschten Referenzzustand vollständig und reproduzierbar wiederherstellen

Das ist fachlich die wichtigste Funktion für den MVP-Referenzstand.

### Führende Regel

Für das MVP ist **Rebuild des Referenzbestands** wichtiger als ein bloßes Seed-Kommando ohne klaren Zielzustand.

---

## 6. Empfohlene Seed-Modi

Es sollen fachlich mindestens diese Modi möglich sein:

### 6.1 minimal
Erzeugt den kleinsten brauchbaren Bestand.

### 6.2 reference
Erzeugt den vollständigen fachlichen Referenzbestand.

Optional später:
### 6.3 extended
Erzeugt einen erweiterten Beispielbestand.

---

## 7. Mindestobjekte im Minimal Seed

Der Minimal Seed soll mindestens erzeugen:

- 1 User
- 1 Group
- 1 Membership
- 1 published Workflow Template
- 1 published Form Template
- 1 Template Assignment
- 1 startbares Document optional oder nur Template/Workflow-Bestand

### Empfohlener Minimalbestand

- User: Alice
- Group: Ops
- Membership: Alice -> Ops -> rwx
- Workflow: production.standard.v1 (published)
- Template: production-batch (published)
- Template Assignment: production-batch -> Ops

Dieser Minimalbestand erlaubt:
- Login-freie User-Selektion
- sichtbares Template
- Start eines ersten Documents

---

## 8. Mindestobjekte im Reference Seed

Der Reference Seed soll mindestens erzeugen:

- Users
- Groups
- Memberships
- Workflow Templates
- Form Templates
- Template Assignments
- Documents
- Assignments
- Tasks oder task-nahe Sichtbarkeit
- Attachments
- Audit Events
- referenzierte operationRefs

Der Reference Seed ist der führende sichtbare Beispiel- und Prüfbestand.

---

## 9. Erzeugungsreihenfolge des Seed-Bestands

Die Objekte müssen in einer stabilen fachlichen Reihenfolge erzeugt werden.

## 9.1 Führende Erzeugungsreihenfolge

1. Users
2. Groups
3. Memberships
4. Workflow Templates
5. Form Templates
6. Template Assignments
7. Documents
8. Document Assignments
9. Attachments
10. Audit Events
11. optionale Tasks oder task-relevante Sichtbarkeiten

Diese Reihenfolge ist fachlich führend.

---

## 10. Seed: Users

Der Reference Seed soll mindestens diese Users erzeugen:

- Alice
- Bob

### Alice
- key: `alice`
- displayName: `Alice`
- email: `alice@example.local`
- status: `active`

### Bob
- key: `bob`
- displayName: `Bob`
- email: `bob@example.local`
- status: `active`

---

## 11. Seed: Groups

Der Reference Seed soll mindestens diese Groups erzeugen:

- Ops

Optional:
- Quality

### Ops
- key: `ops`
- name: `Ops`
- description: `Operations team`

---

## 12. Seed: Memberships

Der Reference Seed soll mindestens diese Memberships erzeugen:

- Alice -> Ops -> rwx
- Bob -> Ops -> rwx

Optional später:
- Bob -> Quality -> r oder rwx

---

## 13. Seed: Workflow Templates

Der Reference Seed soll mindestens diese Workflow Templates erzeugen:

- `customer-order.group-submit.v1`
- `production.standard.v1`
- `evidence.group-submit.v1`

### Status
Diese Workflows sollen im Referenzbestand als `published` vorliegen.

### Version
Jeder Workflow liegt mindestens in einer aktiven Version vor.

Optional später:
- archivierte Vorgängerversionen

---

## 14. Seed: Form Templates

Der Reference Seed soll mindestens diese Form Templates erzeugen:

- `customer-order-test`
- `production-batch`
- `evidence-basic`

### Status
Diese Templates sollen im Referenzbestand als `published` vorliegen.

### Zuweisung
Jedes dieser Templates soll:
- genau einen gültigen Workflow referenzieren
- mindestens einer Group zugewiesen sein

---

## 15. Seed: Template Assignments

Mindestens sollen folgende Assignments erzeugt werden:

- customer-order-test -> Ops
- production-batch -> Ops
- evidence-basic -> Ops

Damit erscheinen die Templates:
- in My Templates
- im Templates-Bereich
- im fachlich sichtbaren Referenzkontext

---

## 16. Seed: Referenz-Operationen

Der Seed muss die referenzierten operationRefs nicht zwingend in einer fachlichen Datenbanktabelle erzeugen, wenn sie aus TypeScript-Registry kommen.

Fachlich muss aber sichergestellt sein, dass der Referenzbestand diese Operationen verwendet:

- `products.listValid`
- `customers.listValid`
- `batches.create`
- `customerOrders.create`
- `customerOrders.setStatus`
- `customerOrders.setStatusFromContext`

Optional vorbereitet:
- `salesforce.accounts.listRecent`

### Führende Regel

Der Seed-Bestand muss fachlich referenzierbar machen, welche operationRefs im Referenzkontext genutzt werden.

---

## 17. Seed: Documents

Der Reference Seed soll mindestens diese Documents erzeugen:

### 17.1 Customer Order 4711
Zweck:
- Submit / Approve / Hook / Integrationskontext / History

### 17.2 Batch B-2026-0042
Zweck:
- Template Key / Document Key / Journal / Attachments / Save

### 17.3 Evidence 2026-101
Zweck:
- einfacher Evidence-/Nachweisfall

Optional später:
- weitere Documents in alternativen Status

---

## 18. Seed: Customer Order 4711

### Zugehöriges Template
- `customer-order-test`

### Empfohlener Zustand
- `submitted` oder `approved`

### Empfohlene Daten
- `customer_id` gesetzt
- `customer_order_number` gesetzt
- `fulfillment_flags` gesetzt

### Empfohlene Assignments
- Alice = Editor
- Bob = Approver

### Empfohlene History
- created
- assigned
- saved
- submitted
- approved optional
- workflow_hook_executed optional, je nach Seed-Status

### Empfohlenes Attachment
- `contract.pdf` optional

---

## 19. Seed: Batch B-2026-0042

### Zugehöriges Template
- `production-batch`

### Empfohlener Zustand
- `started` oder `progressed`

### Empfohlene Daten
- `product_id` gesetzt
- `batch_id` = `B-2026-0042`
- `fulfillment_flags` gesetzt
- `inspection_steps` mit mindestens zwei Zeilen gefüllt

### Empfohlenes Assignment
- Alice = Editor

### Empfohlenes Attachment
- `batch-photo.jpg` oder `batch-note.pdf`

### Empfohlene History
- created
- assigned
- started
- saved
- attachment_uploaded

---

## 20. Seed: Evidence 2026-101

### Zugehöriges Template
- `evidence-basic`

### Empfohlener Zustand
- `assigned` oder `submitted`

### Empfohlene Daten
- ein oder zwei textuelle Evidence-Felder
- optional ein kleiner Journalbestand

### Empfohlenes Assignment
- Bob oder Alice, je nach gewünschtem Prüffall

### Empfohlene History
- created
- assigned
- optional saved

---

## 21. Seed: Document Assignments

Der Reference Seed soll mindestens diese Assignments erzeugen:

- Customer Order 4711
  - Alice = Editor
  - Bob = Approver

- Batch B-2026-0042
  - Alice = Editor

- Evidence 2026-101
  - Alice oder Bob als fachlich sichtbarer Träger

---

## 22. Seed: Attachments

Der Reference Seed soll mindestens diese sichtbaren Attachments bereitstellen:

- Customer Order 4711:
  - `contract.pdf` optional

- Batch B-2026-0042:
  - `batch-photo.jpg` oder `batch-note.pdf`

- Evidence 2026-101:
  - optional ein Evidence-Attachment

### Regel

Attachments müssen im Dateisystem bzw. Storage-Pfad reproduzierbar so angelegt sein, dass:
- die Document Detail View sie anzeigen kann
- die Referenzprüfung sie eindeutig sieht

---

## 23. Seed: Audit Events

Der Reference Seed soll Audit Events so bereitstellen, dass mindestens folgende Typen sichtbar geprüft werden können:

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

### Führende Regel

Audit Events müssen im Referenzbestand nicht theoretisch modelliert, sondern sichtbar nachvollziehbar vorhanden sein.

---

## 24. Seed: Tasks

Tasks können technisch dynamisch entstehen oder explizit im Seed angelegt werden.

Fachlich muss der Referenzbestand diese sichtbaren Aufgaben unterstützen:

- Approve Customer Order 4711
- Submit Batch B-2026-0042
- Continue Evidence 2026-101

### Regel

Wenn Tasks nicht persistiert gesät werden, muss der Referenzbestand trotzdem so aufgebaut sein, dass diese Tasks aus dem Zustand ableitbar und im UI sichtbar sind.

---

## 25. Rebuild-Regel

Ein Rebuild des Referenzbestands muss:

1. einen konsistenten Referenzzustand herstellen
2. Alt-/Neumischungen vermeiden
3. die drei Kern-Templates sicher bereitstellen
4. die drei Kern-Workflows sicher bereitstellen
5. die drei Kern-Documents sicher bereitstellen
6. sichtbare Audit- und Attachment-Beispiele bereitstellen

### Führender Zielzustand

Nach einem Rebuild muss ein Benutzer die App starten und ohne weitere manuelle Fachpflege sofort:

- Workspace prüfen
- Templates sehen
- Workflows sehen
- Documents sehen
- History sehen
- Attachments sehen
- Journal sehen
- Integrationsreferenzen sehen

können.

---

## 26. Reset-Regel

Ein Reset darf vorhandene Laufzeitinhalte entfernen oder zurücksetzen, aber fachlich gilt:

- Reset allein ist nicht der Referenzzielzustand
- der Zielzustand ist der anschließende Rebuild

Für MVP-Nutzung und Codex-Arbeit ist daher der wichtige Vorgang:
- **Rebuild Reference Data**

---

## 27. Empfohlene Kommandostruktur fachlich

Fachlich sollen mindestens diese wiederholbaren Modi vorhanden sein:

- `minimal`
- `reference`

Optional:
- `extended`

### Führende MVP-Empfehlung

Der Standardweg für Sichtprüfung und Entwicklung soll sein:
- **Reference Rebuild**

---

## 28. Sichtbare Prüfpunkte nach Reference Seed

Nach Einspielen des Reference Seed sollen mindestens diese sichtbaren Prüfpunkte möglich sein:

1. Alice kann als aktiver User gewählt werden
2. Bob kann als aktiver User gewählt werden
3. My Workspace zeigt My Groups
4. My Workspace zeigt My Templates
5. My Workspace zeigt My Documents
6. My Workspace zeigt Tasks oder task-nahe Arbeit
7. Customer Order 4711 ist sichtbar
8. Batch B-2026-0042 ist sichtbar
9. Evidence 2026-101 ist sichtbar
10. Customer Order 4711 zeigt History mit Submit/Approve/Hook-Kontext
11. Batch B-2026-0042 zeigt Journal
12. Batch B-2026-0042 zeigt Attachment
13. Template Documents-Tabelle zeigt Table Fields
14. Workflow Usage zeigt referenzierendes Template
15. Template Integrations zeigt operationRefs

---

## 29. Nicht Bestandteil des Standard-Seed

Nicht Bestandteil des führenden Standard-Seed-Bestands sind:

- große Mengen zufälliger Testdaten
- alte Legacy-Altbestände
- unvollständige Demoobjekte ohne Sichtnutzen
- technische Rohdaten ohne UI-Bezug
- Massendaten für Performance-/Lasttests
- verdeckte alternative Produktmodelle

---

## 30. Beziehung zu späteren Beispieldateien

Dieses Dokument definiert den fachlichen Seed-Bestand.

Darauf aufbauend können später separat erstellt werden:

- Beispiel-MDX-Datei
- Beispiel-Workflow-JSON-Datei
- Beispiel-TS-Operation-Datei

Diese Beispieldateien müssen mit diesem Seed-Bestand konsistent sein.

---

## 31. Ergebnisregel

Der in diesem Dokument beschriebene Sample-Data- und Rebuild-Bestand ist das führende Seed-Modell des MVP.

Spätere Seed-Implementierungen, Rebuild-Skripte und Referenzdatensätze dürfen davon abweichen **nur**, wenn dieses Dokument zuerst angepasst wird.
