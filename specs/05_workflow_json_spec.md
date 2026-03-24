# 05 — Workflow JSON Specification

## 1. Ziel dieses Dokuments

Dieses Dokument definiert das führende JSON-Format für Workflow Templates im MVP.

Es legt verbindlich fest:

- welche Aufgaben das Workflow-JSON übernimmt
- welche Aufgaben das Workflow-JSON nicht übernimmt
- wie Status, Actions, Rollen, Feldregeln und Hooks beschrieben werden
- wie Workflow und Formular zusammenwirken
- wie Workflow und TypeScript-Operationen zusammenwirken
- wie Workflow Templates in Konfigurations- und Admin-Bereichen gepflegt werden

Dieses Dokument ist die führende Wahrheit für die Workflow-Beschreibung.

---

## 2. Grundsatzentscheidung

Für das MVP gilt:

- **Workflows werden in JSON beschrieben**
- **Form Templates werden in MDX beschrieben**
- **Integrationen und Operationen werden in TypeScript beschrieben**

Das Workflow-JSON ist das führende menschenlesbare Format für:

- Statusmodell
- Initialstatus
- Workflow Actions
- Statusübergänge
- Rollen je Action
- Feldregeln je Status
- Mehrfach-Editor-/Approver-Verhalten
- Hooks mit `operationRef`

Das Workflow-JSON ist **nicht** das führende Format für:

- Formularlayout
- Felddefinitionen im Detail
- MDX-Body
- technische Implementierung von TypeScript-Operationen
- Authentifizierungsimplementierung
- konkrete UI-Komponenten

---

## 3. Modellgrenze des Workflow-JSON

Das Workflow-JSON beschreibt das **Workflow Template**.

Es beschreibt nicht:

- das laufende Document im Einzelfall
- die konkrete Zuweisung einzelner Users
- die technische Implementierung einer Operation
- das Formularlayout
- MDX-Struktur
- Session-, Auth- oder Tenant-Modelle

Das heißt:

### Workflow-JSON beschreibt

- welche Status es gibt
- in welchem Status ein Document startet
- welche Actions erlaubt sind
- von welchem Status in welchen Status eine Action führt
- welche Rollen eine Action ausführen dürfen
- welche Felder pro Status grundsätzlich editierbar oder readonly sind
- welche Hooks bei bestimmten Workflow-Ereignissen automatisch laufen

### Workflow-JSON beschreibt nicht

- welche Felder im Formular wo angezeigt werden
- welche Users konkret Editor oder Approver eines einzelnen Documents sind
- wie eine Operation technisch implementiert wird
- wie ein Button visuell im UI aussieht

---

## 4. Führende Bausteine eines Workflow Templates

Ein Workflow Template besteht fachlich aus diesen Bausteinen:

1. Template-Metadaten
2. Statusmodell
3. Action-Modell
4. Feldregel-Modell
5. Rollen-/Approval-Modell
6. Hook-Modell

---

## 5. Struktur eines Workflow Templates

Das führende Workflow Template besteht fachlich aus:

- Workflow-Metadaten
- workflowJson

Eine normative logische Struktur ist:

```text
WorkflowTemplate
├── meta
└── workflowJson
```

Das `workflowJson` besteht aus:

```text
workflowJson
├── initialStatus
├── statuses
├── actions
├── fieldRules
├── approval
└── hooks
```

Die konkrete Persistenz kann davon abweichen, aber fachlich gilt dieses Modell.

---

## 6. Workflow-Metadaten

Die Metadaten liegen nicht innerhalb der Laufzeitlogik, sondern am Workflow Template.

Sie enthalten u. a.:

- key
- name
- description
- version
- status
- publishedAt
- archivedAt

---

## 7. Statusmodell

## 7.1 Status

Ein Status ist ein definierter Zustand eines Documents innerhalb eines Workflows.

Beispiele:

- `new`
- `created`
- `assigned`
- `started`
- `progressed`
- `submitted`
- `approved`
- `archived`

---

## 7.2 statuses

`statuses` ist die geordnete führende Liste aller erlaubten Status.

### Regel

- `statuses` ist die einzige führende Statusliste
- parallele Felder wie `order` oder doppelte Statusdefinitionen sind nicht zulässig

### Beispiel

```json
"statuses": ["new", "created", "assigned", "started", "progressed", "submitted", "approved", "archived"]
```

---

## 7.3 initialStatus

`initialStatus` definiert den Status, in dem ein neues Document startet.

### Regel

- `initialStatus` muss in `statuses` enthalten sein

### Beispiel

```json
"initialStatus": "new"
```

---

## 8. Workflow Actions

## 8.1 Definition

Eine Workflow Action ist eine benannte prozessbezogene Aktion, die einen Statusübergang auslöst.

Beispiele:

- `create`
- `assign`
- `start`
- `save`
- `submit`
- `approve`
- `reject`
- `reAssign`
- `archive`

Jede Workflow Action wird in der Arbeits-UI als Action-Button sichtbar, wenn:

- der aktuelle Status die Action erlaubt
- die Rolle die Action erlaubt
- der User die nötige Berechtigung hat

---

## 8.2 Führende Struktur von actions

`actions` ist ein Objekt, dessen Schlüssel die Aktionsnamen sind.

Jede Action beschreibt:

- erlaubte Quellstatus
- Zielstatus
- erlaubte Rollen
- optionale Validierung
- optionale Ausführungssemantik

Normative Struktur:

```json
"actions": {
  "assign": {
    "from": ["created"],
    "to": "assigned",
    "allowedRoles": ["editor"]
  }
}
```

---

## 8.3 Pflichtattribute je Action

- `from`
- `to`
- `allowedRoles`

---

## 8.4 Optionale Attribute je Action

- `validation`
- `completionMode`
- `description`

---

## 8.5 from

`from` ist die Liste der Status, aus denen die Action ausgelöst werden darf.

### Beispiel

```json
"from": ["assigned", "progressed"]
```

---

## 8.6 to

`to` ist der Zielstatus, in den die Action führt.

### Beispiel

```json
"to": "submitted"
```

---

## 8.7 allowedRoles

`allowedRoles` ist die Liste der Dokumentrollen, die diese Action ausführen dürfen.

Zulässige Rollen im MVP:

- `editor`
- `approver`

### Beispiel

```json
"allowedRoles": ["approver"]
```

---

## 8.8 completionMode

`completionMode` beschreibt, wann die Action fachlich als abgeschlossen gilt.

Zulässige Werte im MVP:

- `single`
- `all`

### Bedeutung

- `single` = eine Ausführung genügt
- `all` = alle erforderlichen Rolleninhaber müssen die Action ausführen

### Beispiel

Für Submit durch einen beliebigen Editor:

```json
"completionMode": "single"
```

Für Approval durch alle erforderlichen Approver:

```json
"completionMode": "all"
```

---

## 8.9 validation

`validation` beschreibt optionale fachliche Voraussetzungen für die Action.

Das Workflow-JSON kann definieren, dass vor Ausführung einer Action bestimmte Bedingungen erfüllt sein müssen.

Im MVP wird das als einfacher strukturierter Block beschrieben, z. B.:

```json
"validation": {
  "requiredFields": ["customer_id", "customer_order_number"]
}
```

Erweiterte Regelmodelle sind nicht Bestandteil des MVP.

---

## 8.10 Standard-Actions des MVP

Die folgenden Workflow Actions sind im MVP vorgesehen:

- `create`
- `assign`
- `start`
- `save`
- `submit`
- `approve`
- `reject`
- `reAssign`
- `archive`

Ein konkreter Workflow muss nicht alle davon verwenden, darf aber keine konkurrierenden versteckten Primärmodelle dafür einführen.

---

## 9. Feldregeln im Workflow

## 9.1 Ziel von fieldRules

`fieldRules` definieren pro Status, welche Felder grundsätzlich editierbar oder readonly sind.

Sie bilden den führenden allgemeinen Statuskontext für die Bearbeitbarkeit.

---

## 9.2 Struktur von fieldRules

Normative Struktur:

```json
"fieldRules": {
  "assigned": {
    "editable": ["batch_id"],
    "readonly": ["product_id"]
  },
  "submitted": {
    "editable": [],
    "readonly": ["product_id", "batch_id", "inspection_steps"]
  }
}
```

---

## 9.3 Bedeutung von editable

`editable` listet die Felder, die im jeweiligen Status grundsätzlich bearbeitbar sind.

---

## 9.4 Bedeutung von readonly

`readonly` listet die Felder, die im jeweiligen Status grundsätzlich readonly sind.

---

## 9.5 Verhältnis zu Feldregeln im Form Template

Es gibt zwei Regelquellen:

- Workflow-Field Rules
- feldspezifische Regeln im Form Template (`editableIn`, `readonlyIn`)

Für das MVP gilt:

1. Das Workflow-JSON definiert den allgemeinen Statuskontext.
2. Das Form Template darf diesen Kontext pro Feld konkretisieren.
3. Ein Feld darf nicht im Template als editierbar definiert werden, wenn der Workflow es für diesen Status zwingend readonly setzt.
4. Konflikte zwischen Workflow und Form Template sind ungültig.

Damit bleibt der Workflow führend für den Statuskontext, während das Form Template feldbezogene Präzisierungen leisten darf.

---

## 10. Rollen- und Approval-Modell

## 10.1 Ziel

Das Rollen- und Approval-Modell beschreibt:

- ob mehrere Editors zulässig sind
- ob mehrere Approvers zulässig sind
- ob Submit/Approve durch einen oder alle abgeschlossen wird

---

## 10.2 approval

Normative Struktur:

```json
"approval": {
  "editors": "multiple",
  "approvers": "multiple",
  "submitMode": "single",
  "approvalMode": "all"
}
```

---

## 10.3 editors

Zulässige Werte:

- `single`
- `multiple`

### Bedeutung

- `single` = genau ein Editor aktiv
- `multiple` = mehrere Editors zulässig

---

## 10.4 approvers

Zulässige Werte:

- `single`
- `multiple`

### Bedeutung

- `single` = genau ein Approver aktiv
- `multiple` = mehrere Approvers zulässig

---

## 10.5 submitMode

Zulässige Werte:

- `single`
- `all`

### Bedeutung

- `single` = Submit eines Editors genügt
- `all` = alle erforderlichen Editors müssen submitten

---

## 10.6 approvalMode

Zulässige Werte:

- `single`
- `all`

### Bedeutung

- `single` = Approval eines Approvers genügt
- `all` = alle erforderlichen Approvers müssen approven

---

## 11. Hook-Modell

## 11.1 Definition

Hooks sind automatische Systemreaktionen, die bei bestimmten Workflow-Ereignissen laufen.

Hooks sind kein UI-Element und kein Button.
Sie laufen automatisch im Prozesskontext.

---

## 11.2 Führendes Integrationsmodell

Hooks verwenden:

- `operationRef`

`apiRef` ist im Workflow-Modell nicht führend und nur Bridge/Legacy.

---

## 11.3 Hook-Struktur

Normative Struktur:

```json
"hooks": [
  {
    "trigger": "submitted->approved",
    "operationRef": "customerOrders.setStatusFromContext",
    "request": {
      "status": "approved"
    },
    "responseMapping": {
      "snapshot.customer_order_sync_ok": "ok"
    }
  }
]
```

---

## 11.4 Pflichtattribute eines Hooks

- `trigger`
- `operationRef`

---

## 11.5 Optionale Attribute eines Hooks

- `request`
- `responseMapping`
- `description`

---

## 11.6 trigger

`trigger` beschreibt das Workflow-Ereignis, bei dem der Hook läuft.

Im MVP ist die normative Trigger-Form:

```text
<fromStatus>-><toStatus>
```

### Beispiel

- `submitted->approved`

---

## 11.7 request

`request` beschreibt optionale feste oder aus Kontext auflösbare Werte, die an die Operation übergeben werden.

---

## 11.8 responseMapping

`responseMapping` beschreibt, in welche Zielbereiche Rückgabewerte geschrieben werden.

Zulässige Zielbereiche:

- `data`
- `external`
- `snapshot`
- `integrationContext`

---

## 11.9 Beschreibung eines Hook-Beispiels

Ein Hook bei `submitted->approved` kann:

- die externe Referenz aus `integrationContext` lesen
- einen Status in einem Fremdsystem setzen
- einen sichtbaren Nachweis in `snapshot` schreiben

---

## 12. Vollständiges normatives Beispiel

```json
{
  "initialStatus": "new",
  "statuses": ["new", "created", "assigned", "started", "progressed", "submitted", "approved", "archived"],
  "actions": {
    "create": {
      "from": ["new"],
      "to": "created",
      "allowedRoles": ["editor"],
      "completionMode": "single"
    },
    "assign": {
      "from": ["created"],
      "to": "assigned",
      "allowedRoles": ["editor"],
      "completionMode": "single"
    },
    "start": {
      "from": ["assigned"],
      "to": "started",
      "allowedRoles": ["editor"],
      "completionMode": "single"
    },
    "save": {
      "from": ["started"],
      "to": "progressed",
      "allowedRoles": ["editor"],
      "completionMode": "single"
    },
    "submit": {
      "from": ["assigned", "progressed"],
      "to": "submitted",
      "allowedRoles": ["editor"],
      "completionMode": "single",
      "validation": {
        "requiredFields": ["customer_id"]
      }
    },
    "approve": {
      "from": ["submitted"],
      "to": "approved",
      "allowedRoles": ["approver"],
      "completionMode": "all"
    },
    "reject": {
      "from": ["submitted"],
      "to": "progressed",
      "allowedRoles": ["approver"],
      "completionMode": "single"
    },
    "reAssign": {
      "from": ["assigned", "started", "progressed"],
      "to": "assigned",
      "allowedRoles": ["editor", "approver"],
      "completionMode": "single"
    },
    "archive": {
      "from": ["approved"],
      "to": "archived",
      "allowedRoles": ["approver"],
      "completionMode": "single"
    }
  },
  "fieldRules": {
    "new": {
      "editable": ["product_id"],
      "readonly": ["batch_id"]
    },
    "assigned": {
      "editable": ["batch_id"],
      "readonly": ["product_id"]
    },
    "started": {
      "editable": ["batch_id", "inspection_steps", "fulfillment_flags"],
      "readonly": ["product_id"]
    },
    "progressed": {
      "editable": ["batch_id", "inspection_steps", "fulfillment_flags"],
      "readonly": ["product_id"]
    },
    "submitted": {
      "editable": [],
      "readonly": ["product_id", "batch_id", "inspection_steps", "fulfillment_flags"]
    },
    "approved": {
      "editable": [],
      "readonly": ["product_id", "batch_id", "inspection_steps", "fulfillment_flags"]
    }
  },
  "approval": {
    "editors": "multiple",
    "approvers": "multiple",
    "submitMode": "single",
    "approvalMode": "all"
  },
  "hooks": [
    {
      "trigger": "submitted->approved",
      "operationRef": "customerOrders.setStatusFromContext",
      "request": {
        "status": "approved"
      },
      "responseMapping": {
        "snapshot.customer_order_sync_ok": "ok"
      }
    }
  ]
}
