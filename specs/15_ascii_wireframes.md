# 15 — ASCII Wireframes

## 1. Ziel dieses Dokuments

Dieses Dokument enthält die führenden ASCII-Wireframes des MVP.

Die Wireframes dienen dazu:

- die in den Screen-Spezifikationen beschriebenen Seiten visuell zu konkretisieren
- die Hauptbereiche, Informationshierarchie und Aktionsplätze verbindlich zu machen
- die Trennung von Arbeits-UI, Konfigurations-UI und Admin-UI sichtbar zu machen

Diese Wireframes sind absichtlich schematisch.
Sie definieren Struktur, Priorität und Platzierung, nicht finale Pixelgestaltung.

---

## 2. Grundregeln für alle Wireframes

1. Standard-Arbeitsseiten bleiben ruhig und handlungsorientiert.
2. Konfigurationsseiten zeigen Objektstruktur, nicht Arbeitsfokus.
3. Admin-Seiten zeigen Verwaltung, nicht Prozessarbeit.
4. JSON und technische Details erscheinen nur in Konfigurations- oder Advanced-Bereichen.
5. Jede Seite hat genau einen klaren primären Zweck.

---

## 3. Hauptnavigation

```text
+------------------------------------------------------------------------------------------------------+
| Digitale Dokumentation und Nachweise                                              User: [ Alice v ] |
+------------------------------------------------------------------------------------------------------+
| My Workspace | Templates | Workflows | Documents | Admin                                             |
+------------------------------------------------------------------------------------------------------+
```

---

## 4. My Workspace

```text
+------------------------------------------------------------------------------------------------------+
| Digitale Dokumentation und Nachweise                                              User: [ Alice v ] |
+------------------------------------------------------------------------------------------------------+
| My Workspace | Templates | Workflows | Documents | Admin                                             |
+------------------------------------------------------------------------------------------------------+
| My Groups                                       | My Tasks                                            |
|-------------------------------------------------|-----------------------------------------------------|
| - Ops                                           | - Approve Customer Order 4711                        |
| - Quality                                       | - Submit Batch B-2026-0042                           |
|                                                 | - Continue Evidence 2026-101                         |
+-------------------------------------------------+-----------------------------------------------------+
| My Templates                                    | My Documents                                         |
|-------------------------------------------------|-----------------------------------------------------|
| - Customer Order Test                           | - Customer Order 4711        submitted               |
| - Production Batch                              | - Batch B-2026-0042         started                  |
| - Evidence Basic                                | - Evidence 2026-101          assigned                |
+------------------------------------------------------------------------------------------------------+
```

### Mobile / schmal
```text
+--------------------------------------------------------------+
| Digitale Dokumentation und Nachweise   User: [ Alice v ]     |
+--------------------------------------------------------------+
| My Workspace | Templates | Workflows | Documents | Admin     |
+--------------------------------------------------------------+
| My Tasks                                                    |
|-------------------------------------------------------------|
| - Approve Customer Order 4711                               |
| - Submit Batch B-2026-0042                                  |
+--------------------------------------------------------------+
| My Documents                                                |
|-------------------------------------------------------------|
| - Customer Order 4711   submitted                           |
| - Batch B-2026-0042    started                              |
+--------------------------------------------------------------+
| My Templates                                                |
|-------------------------------------------------------------|
| - Customer Order Test                                       |
| - Production Batch                                          |
+--------------------------------------------------------------+
| My Groups                                                   |
|-------------------------------------------------------------|
| - Ops                                                       |
| - Quality                                                   |
+--------------------------------------------------------------+
```

---

## 5. Templates List

```text
+------------------------------------------------------------------------------------------------------+
| Templates                                                                             [ New Template ]|
+------------------------------------------------------------------------------------------------------+
| Search [................................]   Status [ all v ]   Group [ all v ]                      |
+------------------------------------------------------------------------------------------------------+
| Name                  | Key                  | Version | Status    | Workflow            | Actions   |
|------------------------------------------------------------------------------------------------------|
| Customer Order Test   | customer-order-test  | 3       | published | customer-order...   | View Edit |
| Production Batch      | production-batch     | 5       | published | production.standard  | View Edit |
| Evidence Basic        | evidence-basic       | 2       | draft     | evidence.group...    | View Edit |
+------------------------------------------------------------------------------------------------------+
```

---

## 6. Template Detail — Overview

```text
+------------------------------------------------------------------------------------------------------+
| Customer Order Test                                                  published v3   [Edit] [Publish] |
+------------------------------------------------------------------------------------------------------+
| Overview | Form | Workflow | Integrations | Versions | Documents                                     |
+------------------------------------------------------------------------------------------------------+
| Key: customer-order-test                                                                          |
| Description: Test template for customer order processing                                          |
| Groups: Ops                                                                                       |
| Workflow: customer-order.group-submit.v1                                                          |
|                                                                                                   |
| Template Keys                                                                                     |
| - customer_id                                                                                     |
|                                                                                                   |
| Document Keys                                                                                     |
| - customer_order_number                                                                           |
|                                                                                                   |
| Table Fields                                                                                      |
| - customer_id                                                                                     |
| - customer_order_number                                                                           |
| - status label derived in UI                                                                      |
+------------------------------------------------------------------------------------------------------+
```

---

## 7. Template Detail — Form Tab

```text
+------------------------------------------------------------------------------------------------------+
| Customer Order Test                                                  published v3   [Edit] [Publish] |
+------------------------------------------------------------------------------------------------------+
| Overview | Form | Workflow | Integrations | Versions | Documents                                     |
+------------------------------------------------------------------------------------------------------+
| Form Preview                                                                                       |
|------------------------------------------------------------------------------------------------------|
| # Customer Order Test                                                                              |
|                                                                                                      |
| [ Customer Lookup ]             [ Customer Order Number ]                                            |
|                                                                                                      |
| Fulfillment Flags                                                                                   |
| [ ] packed   [ ] reviewed   [ ] released                                                             |
|                                                                                                      |
| Attachments                                                                                         |
| [ Upload supporting files ]                                                                         |
|                                                                                                      |
| [ Create Customer Order ]                                                                           |
+------------------------------------------------------------------------------------------------------+
| Field Summary                                                                                        |
| - customer_id          lookup          templateKey   tableField                                      |
| - customer_order_number text           documentKey   tableField                                      |
| - fulfillment_flags     checkboxGroup                                                          |
| - attachments_main      attachmentArea                                                         |
+------------------------------------------------------------------------------------------------------+
```

---

## 8. Template Detail — Workflow Tab

```text
+------------------------------------------------------------------------------------------------------+
| Customer Order Test                                                  published v3   [Edit] [Publish] |
+------------------------------------------------------------------------------------------------------+
| Overview | Form | Workflow | Integrations | Versions | Documents                                     |
+------------------------------------------------------------------------------------------------------+
| Workflow Template                                                                                   |
|------------------------------------------------------------------------------------------------------|
| Name: Customer Order Group Submit                                                                   |
| Key: customer-order.group-submit.v1                                                                 |
| Version: 2                                                                                          |
|                                                                                                      |
| Status Flow                                                                                         |
| created -> assigned -> started -> progressed -> submitted -> approved -> archived                  |
|                                                                                                      |
| Actions                                                                                             |
| - assign      created    -> assigned    role: editor                                                |
| - submit      assigned   -> submitted   role: editor                                                |
| - approve     submitted  -> approved    role: approver                                              |
| - archive     approved   -> archived    role: approver                                              |
|                                                                                                      |
| [ Open Workflow ]                                                                                   |
+------------------------------------------------------------------------------------------------------+
```

---

## 9. Template Detail — Integrations Tab

```text
+------------------------------------------------------------------------------------------------------+
| Customer Order Test                                                  published v3   [Edit] [Publish] |
+------------------------------------------------------------------------------------------------------+
| Overview | Form | Workflow | Integrations | Versions | Documents                                     |
+------------------------------------------------------------------------------------------------------+
| Lookups                                                                                             |
|------------------------------------------------------------------------------------------------------|
| customer_id                -> customers.listValid                                                    |
|                                                                                                      |
| Form Actions                                                                                         |
|------------------------------------------------------------------------------------------------------|
| create_customer_order      -> customerOrders.create                                                  |
|                                                                                                      |
| Referenced Workflow Hook Operations                                                                  |
|------------------------------------------------------------------------------------------------------|
| submitted -> approved      -> customerOrders.setStatusFromContext                                    |
+------------------------------------------------------------------------------------------------------+
```

---

## 10. Template Detail — Versions Tab

```text
+------------------------------------------------------------------------------------------------------+
| Customer Order Test                                                  published v3   [Edit] [Publish] |
+------------------------------------------------------------------------------------------------------+
| Overview | Form | Workflow | Integrations | Versions | Documents                                     |
+------------------------------------------------------------------------------------------------------+
| Version | Status     | Notes / Timing                                                              |
|------------------------------------------------------------------------------------------------------|
| 3       | published  | active                                                                       |
| 2       | archived   | previous productive version                                                  |
| 1       | archived   | initial version                                                              |
+------------------------------------------------------------------------------------------------------+
```

---

## 11. Template Detail — Documents Tab

```text
+------------------------------------------------------------------------------------------------------+
| Customer Order Test                                                  published v3   [Edit] [Publish] |
+------------------------------------------------------------------------------------------------------+
| Overview | Form | Workflow | Integrations | Versions | Documents                                     |
+------------------------------------------------------------------------------------------------------+
| Filter Status [ open v ]   Search [........................]                                          |
+------------------------------------------------------------------------------------------------------+
| Document                | Status     | Customer        | Order No.       | Updated At | Actions     |
|------------------------------------------------------------------------------------------------------|
| Customer Order 4711     | submitted  | Acme Labs       | CO-4711         | 23.03 11:20| Open        |
| Customer Order 4712     | approved   | Beta Medical    | CO-4712         | 23.03 10:05| Open        |
| Customer Order 4713     | assigned   | Delta Health    | CO-4713         | 22.03 16:44| Open        |
+------------------------------------------------------------------------------------------------------+
```

---

## 12. Template Edit

```text
+------------------------------------------------------------------------------------------------------+
| Edit Template: Customer Order Test                                          [Save] [Publish] [Archive]|
+------------------------------------------------------------------------------------------------------+
| Overview | Form | Workflow | Integrations | Versions                                                |
+------------------------------------------------------------------------------------------------------+
| Meta                                              | Preview                                           |
|---------------------------------------------------|---------------------------------------------------|
| Key:  customer-order-test                         | # Customer Order Test                             |
| Name: Customer Order Test                         | [ Rendered preview of current MDX ]               |
| Desc: Test template for customer orders           |                                                   |
|---------------------------------------------------|---------------------------------------------------|
| Workflow Assignment                                                                                  |
| [ customer-order.group-submit.v1 v ]                                                                |
|                                                                                                      |
| Group Assignment                                                                                     |
| [x] Ops      [ ] Quality                                                                            |
|                                                                                                      |
| Table Fields                                                                                         |
| [x] customer_id   [x] customer_order_number   [ ] fulfillment_flags                                 |
|                                                                                                      |
| MDX Editor                                                                                           |
|------------------------------------------------------------------------------------------------------|
| <Fields>                                                                                             |
|   ...                                                                                                |
| </Fields>                                                                                            |
|                                                                                                      |
| # Customer Order Test                                                                                |
| <Section ...>                                                                                        |
| ...                                                                                                  |
+------------------------------------------------------------------------------------------------------+
```

---

## 13. Workflows List

```text
+------------------------------------------------------------------------------------------------------+
| Workflows                                                                              [ New Workflow ]|
+------------------------------------------------------------------------------------------------------+
| Search [................................]   Status [ all v ]                                         |
+------------------------------------------------------------------------------------------------------+
| Name                         | Key                              | Version | Status    | Actions      |
|------------------------------------------------------------------------------------------------------|
| Customer Order Group Submit  | customer-order.group-submit.v1   | 2       | published | View Edit    |
| Production Standard V1       | production.standard.v1           | 4       | published | View Edit    |
| Evidence Group Submit        | evidence.group-submit.v1         | 1       | draft     | View Edit    |
+------------------------------------------------------------------------------------------------------+
```

---

## 14. Workflow Detail — Overview

```text
+------------------------------------------------------------------------------------------------------+
| Workflow: Customer Order Group Submit                                   published v2   [Edit] [Publish]|
+------------------------------------------------------------------------------------------------------+
| Overview | JSON | Hooks | Usage                                                                     |
+------------------------------------------------------------------------------------------------------+
| Key: customer-order.group-submit.v1                                                                |
| Description: Approval workflow for customer orders                                                  |
| Initial Status: created                                                                             |
|                                                                                                      |
| Status Flow                                                                                         |
| created -> assigned -> started -> progressed -> submitted -> approved -> archived                  |
|                                                                                                      |
| Actions                                                                                             |
| - assign     created      -> assigned    role: editor                                               |
| - start      assigned     -> started     role: editor                                               |
| - save       started      -> progressed  role: editor                                               |
| - submit     assigned/... -> submitted   role: editor                                               |
| - approve    submitted    -> approved    role: approver  completion: all                            |
| - reject     submitted    -> progressed  role: approver                                             |
| - archive    approved     -> archived    role: approver                                             |
+------------------------------------------------------------------------------------------------------+
```

---

## 15. Workflow Detail — JSON Tab

```text
+------------------------------------------------------------------------------------------------------+
| Workflow: Customer Order Group Submit                                   published v2   [Edit] [Publish]|
+------------------------------------------------------------------------------------------------------+
| Overview | JSON | Hooks | Usage                                                                     |
+------------------------------------------------------------------------------------------------------+
| Workflow JSON                                                                                       |
|------------------------------------------------------------------------------------------------------|
| {                                                                                                    |
|   "initialStatus": "created",                                                                        |
|   "statuses": ["created","assigned","started","progressed","submitted","approved","archived"],      |
|   "actions": { ... },                                                                                |
|   "fieldRules": { ... },                                                                             |
|   "approval": { ... },                                                                               |
|   "hooks": [ ... ]                                                                                   |
| }                                                                                                    |
+------------------------------------------------------------------------------------------------------+
```

---

## 16. Workflow Detail — Hooks Tab

```text
+------------------------------------------------------------------------------------------------------+
| Workflow: Customer Order Group Submit                                   published v2   [Edit] [Publish]|
+------------------------------------------------------------------------------------------------------+
| Overview | JSON | Hooks | Usage                                                                     |
+------------------------------------------------------------------------------------------------------+
| Trigger                 | operationRef                             | Mapping                          |
|------------------------------------------------------------------------------------------------------|
| submitted -> approved   | customerOrders.setStatusFromContext      | snapshot.customer_order_sync_ok  |
+------------------------------------------------------------------------------------------------------+
```

---

## 17. Workflow Detail — Usage Tab

```text
+------------------------------------------------------------------------------------------------------+
| Workflow: Customer Order Group Submit                                   published v2   [Edit] [Publish]|
+------------------------------------------------------------------------------------------------------+
| Overview | JSON | Hooks | Usage                                                                     |
+------------------------------------------------------------------------------------------------------+
| Referenced by Templates                                                                              |
|------------------------------------------------------------------------------------------------------|
| Template Name            | Key                   | Version | Status    | Actions                      |
|------------------------------------------------------------------------------------------------------|
| Customer Order Test      | customer-order-test   | 3       | published | Open Template               |
+------------------------------------------------------------------------------------------------------+
```

---

## 18. Workflow Edit

```text
+------------------------------------------------------------------------------------------------------+
| Edit Workflow: Customer Order Group Submit                                   [Save] [Publish] [Archive]|
+------------------------------------------------------------------------------------------------------+
| Overview | JSON | Hooks | Usage                                                                     |
+------------------------------------------------------------------------------------------------------+
| Meta                                                                                                 |
|------------------------------------------------------------------------------------------------------|
| Key:  customer-order.group-submit.v1                                                                 |
| Name: Customer Order Group Submit                                                                    |
| Desc: Approval workflow for customer orders                                                          |
|                                                                                                      |
| JSON Editor                                                                                          |
|------------------------------------------------------------------------------------------------------|
| {                                                                                                    |
|   "initialStatus": "created",                                                                        |
|   "statuses": [...],                                                                                 |
|   "actions": { ... },                                                                                |
|   "fieldRules": { ... },                                                                             |
|   "approval": { ... },                                                                               |
|   "hooks": [ ... ]                                                                                   |
| }                                                                                                    |
+------------------------------------------------------------------------------------------------------+
| Validation                                                                                            |
|------------------------------------------------------------------------------------------------------|
| [ok] valid JSON                                                                                      |
| [ok] initialStatus exists in statuses                                                                |
| [ok] all actions reference valid statuses                                                            |
| [ok] all roles valid                                                                                 |
| [ok] all hooks reference operationRef                                                                |
+------------------------------------------------------------------------------------------------------+
| Readable Summary                                                                                     |
|------------------------------------------------------------------------------------------------------|
| created -> assigned -> started -> progressed -> submitted -> approved -> archived                   |
| Hooks: submitted -> approved => customerOrders.setStatusFromContext                                  |
+------------------------------------------------------------------------------------------------------+
```

---

## 19. Documents List

```text
+------------------------------------------------------------------------------------------------------+
| Documents                                                                                             |
+------------------------------------------------------------------------------------------------------+
| View [ My Documents v ]  Status [ open v ]  Template [ all v ]  Search [.........................]  |
+------------------------------------------------------------------------------------------------------+
| Document                | Template               | Status     | Assigned       | Updated At          |
|------------------------------------------------------------------------------------------------------|
| Customer Order 4711     | Customer Order Test    | submitted  | Alice, Bob     | 2026-03-22 23:06    |
| Batch B-2026-0042       | Production Batch       | started    | Alice          | 2026-03-22 18:20    |
| Evidence 2026-101       | Evidence Basic         | assigned   | Bob            | 2026-03-21 09:15    |
+------------------------------------------------------------------------------------------------------+
```

---

## 20. Document Detail

```text
+------------------------------------------------------------------------------------------------------+
| Customer Order 4711                                               submitted    [Approve] [Reject]    |
+------------------------------------------------------------------------------------------------------+
| Work Summary                                                                                         |
|------------------------------------------------------------------------------------------------------|
| Template: Customer Order Test                                                                        |
| Workflow: Customer Order Group Submit                                                                |
| Template Version: 3                                                                                  |
| Workflow Version: 2                                                                                  |
| Editors: Alice                                                                                       |
| Approvers: Bob                                                                                       |
+------------------------------------------------------------------------------------------------------+
| Form                                                                                                 |
|------------------------------------------------------------------------------------------------------|
| Customer                           [ Lookup value: Acme Labs ]                                       |
| Customer Order Number              [ CO-4711 ]                                                       |
| Fulfillment Flags                  [x] packed  [ ] reviewed  [x] released                            |
|                                                                                                      |
| [ Create Customer Order ]                                                                            |
+------------------------------------------------------------------------------------------------------+
| Attachments                                                                                          |
|------------------------------------------------------------------------------------------------------|
| [Upload]                                                                                             |
| - contract.pdf                                                                                       |
| - signed-order.png                                                                                   |
+------------------------------------------------------------------------------------------------------+
| Journal                                                                                              |
|------------------------------------------------------------------------------------------------------|
| Inspection Steps                                                                                     |
| Step                      | Result                                                                   |
|--------------------------|-------------------------------------------------------------------------|
| Receive order            | ok                                                                       |
| Check release flags      | ok                                                                       |
+------------------------------------------------------------------------------------------------------+
| History                                                                                              |
|------------------------------------------------------------------------------------------------------|
| 22.03.2026 23:06  Alice   workflow_hook_executed   customerOrders.setStatusFromContext              |
| 22.03.2026 23:05  Bob     approved                 Document approved                                 |
| 22.03.2026 22:50  Alice   submitted                Document submitted                                |
+------------------------------------------------------------------------------------------------------+
| Assignment / Tasks                                                                                    |
|------------------------------------------------------------------------------------------------------|
| Editors: Alice                                                                                        |
| Approvers: Bob                                                                                        |
| Open Tasks: Approve Customer Order 4711                                                              |
+------------------------------------------------------------------------------------------------------+
```

---

## 21. Admin — Users

```text
+------------------------------------------------------------------------------------------------------+
| Admin                                                                                                 |
+------------------------------------------------------------------------------------------------------+
| Users | Groups | Memberships | Template Assignments                                                  |
+------------------------------------------------------------------------------------------------------+
| Users List                                   | User Detail / Editor                                  |
|----------------------------------------------|-------------------------------------------------------|
| Alice                                        | Display Name: Alice                                   |
| Bob                                          | Key: alice                                            |
|                                              | Email: alice@example.local                            |
|                                              | Status: active                                        |
|                                              | [Save] [Deactivate]                                   |
+------------------------------------------------------------------------------------------------------+
| [New User]                                                                                           |
+------------------------------------------------------------------------------------------------------+
```

---

## 22. Admin — Groups

```text
+------------------------------------------------------------------------------------------------------+
| Admin                                                                                                 |
+------------------------------------------------------------------------------------------------------+
| Users | Groups | Memberships | Template Assignments                                                  |
+------------------------------------------------------------------------------------------------------+
| Groups List                                  | Group Detail / Editor                                 |
|----------------------------------------------|-------------------------------------------------------|
| Ops                                          | Name: Ops                                             |
| Quality                                      | Key: ops                                              |
|                                              | Description: Operations team                          |
|                                              | [Save] [Delete]                                      |
+------------------------------------------------------------------------------------------------------+
| [New Group]                                                                                          |
+------------------------------------------------------------------------------------------------------+
```

---

## 23. Admin — Memberships

```text
+------------------------------------------------------------------------------------------------------+
| Admin                                                                                                 |
+------------------------------------------------------------------------------------------------------+
| Users | Groups | Memberships | Template Assignments                                                  |
+------------------------------------------------------------------------------------------------------+
| Memberships                                                                                          |
|------------------------------------------------------------------------------------------------------|
| User    | Group    | Rights | Actions                                                                |
|------------------------------------------------------------------------------------------------------|
| Alice   | Ops      | rwx    | Edit Remove                                                            |
| Bob     | Ops      | rwx    | Edit Remove                                                            |
+------------------------------------------------------------------------------------------------------+
| [Add Membership]                                                                                     |
+------------------------------------------------------------------------------------------------------+
```

---

## 24. Admin — Template Assignments

```text
+------------------------------------------------------------------------------------------------------+
| Admin                                                                                                 |
+------------------------------------------------------------------------------------------------------+
| Users | Groups | Memberships | Template Assignments                                                  |
+------------------------------------------------------------------------------------------------------+
| Template Assignments                                                                                 |
|------------------------------------------------------------------------------------------------------|
| Template               | Group   | Actions                                                          |
|------------------------------------------------------------------------------------------------------|
| Customer Order Test    | Ops     | Remove                                                           |
| Production Batch       | Ops     | Remove                                                           |
| Evidence Basic         | Ops     | Remove                                                           |
+------------------------------------------------------------------------------------------------------+
| [Assign Template to Group]                                                                           |
+------------------------------------------------------------------------------------------------------+
```

---

## 25. Ergebnisregel

Diese ASCII-Wireframes sind die führende strukturelle Visualisierung des MVP.

Spätere UI-Implementierungen dürfen davon abweichen **nur**, wenn die zugrunde liegenden Screen-Spezifikationen oder dieses Dokument zuerst angepasst werden.
