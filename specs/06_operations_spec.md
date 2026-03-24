# 06 — Operations Specification

## 1. Ziel dieses Dokuments

Dieses Dokument definiert das führende Modell für Integrations- und API-Operationen im MVP.

Es legt verbindlich fest:

- welche Aufgaben Operationen übernehmen
- welche Aufgaben Operationen nicht übernehmen
- wie Operationen identifiziert werden
- wie Operationen mit Formularen und Workflows zusammenwirken
- welche Laufzeitkontexte Operationen lesen und schreiben dürfen
- wie Authentifizierungsstrategien modelliert werden
- wie Input, Output und Mapping fachlich beschrieben werden

Dieses Dokument ist die führende Wahrheit für das Operations-/Integrationsmodell.

---

## 2. Grundsatzentscheidung

Für das MVP gilt:

- **Integrationen und APIs werden als TypeScript-Operationen beschrieben**
- **Operationen werden über `operationRef` referenziert**
- **Form Templates verwenden Operationen in Lookups und Form Actions**
- **Workflow Templates verwenden Operationen in Hooks**
- **apiRef ist nicht führend und gilt nur als Bridge-/Legacy-Konzept**

TypeScript-Operationen sind damit das führende Integrationsmodell des MVP.

---

## 3. Modellgrenze der Operationsspezifikation

Diese Spezifikation beschreibt:

- das fachlich-technische Modell einer Operation
- die Struktur ihrer Referenzierung
- ihre Laufzeitkontexte
- ihre Authentifizierungsstrategie
- ihre erlaubten Einsatzorte
- ihr Mapping-Verhalten

Diese Spezifikation beschreibt nicht:

- das konkrete UI eines Admin-Screens
- die konkrete Datenbanksyntax
- die Implementierung eines Secret Stores
- den vollständigen OAuth-End-to-End-Flow
- externe Monitoring-/Queue-/Retry-Systeme
- Mandantenfähigkeit

---

## 4. Führende Begriffe

### 4.1 Operation

Eine Operation ist eine TypeScript-definierte Integrationsfunktion.

Sie ist das führende technische Ausführungsmodell für:
- Lookups
- Form Actions
- Workflow Hooks

---

### 4.2 operationRef

`operationRef` ist die eindeutige führende Referenz auf eine Operation.

Beispiele:
- `products.listValid`
- `customers.listValid`
- `batches.create`
- `customerOrders.create`
- `customerOrders.setStatusFromContext`

`operationRef` ist führend.
`apiRef` ist nicht führend.

---

### 4.3 Connector

Ein Connector ist die fachlich-technische Gruppierung von Operationen gegen eine bestimmte externe Quelle oder ein bestimmtes Fremdsystem.

Beispiele:
- `erp-sim`
- `salesforce-sandbox`
- `sap-sandbox`

Ein Connector ist kein eigenes Produktmodul im MVP, sondern ein Ordnungs- und Referenzbegriff.

---

### 4.4 Auth Strategy

Eine Auth Strategy beschreibt, wie sich eine Operation gegenüber einem Zielsystem authentifiziert.

Im MVP ist die Auth Strategy vorbereitet, aber noch nicht als voll ausgebautes Credential-System umgesetzt.

---

## 5. Führende Modellstruktur

Eine Operation besteht fachlich aus:

1. Identität
2. Metadaten
3. Authentifizierungsstrategie
4. Laufzeitkontext
5. Ausführungsfunktion
6. optionalen Input-/Output-Schemas
7. optionalen Mapping-Regeln

Normative logische Struktur:

```text
Operation
├── operationRef
├── meta
├── auth
├── inputSchema? 
├── outputSchema?
└── execute(context)
```

---

## 6. Pflichtbestandteile einer Operation

Jede Operation muss mindestens diese Bestandteile besitzen:

- `operationRef`
- `meta`
- `auth`
- `execute(context)`

---

## 7. Meta-Daten einer Operation

`meta` beschreibt lesbare Informationen zur Operation.

### Empfohlene Meta-Felder
- `name`
- `description`
- `connector`
- `useCases`
- `tags`

### Beispiel

```ts
meta: {
  name: 'Create Customer Order',
  description: 'Creates a customer order in the external ERP simulation.',
  connector: 'erp-sim',
  useCases: ['form-action'],
  tags: ['customer-order', 'erp']
}
```

---

## 8. Authentifizierungsstrategien

## 8.1 Grundsatz

Authentifizierung ist Teil des Operationsmodells, aber nicht Teil eines vollständigen Secret- oder Identity-Managements im MVP.

## 8.2 Zulässige Strategien im MVP

- `none`
- `apiKey`
- `basic`
- `bearerToken`
- `oauth2ClientCredentials` vorbereitet

## 8.3 Bedeutung der Strategien

### none
Keine Authentifizierung erforderlich.

### apiKey
Operation erwartet einen API-Key-basierten Zugang.

### basic
Operation erwartet Basic Authentication.

### bearerToken
Operation erwartet ein Bearer Token.

### oauth2ClientCredentials
Vorbereitete Modellstruktur für spätere systemseitige OAuth2-Client-Credentials-Abläufe.

## 8.4 Nicht Bestandteil des MVP
- produktiver Secret Store
- Credential-Verwaltung im Self-Service
- echter OAuth-End-to-End-Lauf
- mandantenfähige Secret-Auflösung

---

## 9. Laufzeitkontext einer Operation

Jede Operation erhält einen klaren Laufzeitkontext.

## 9.1 Pflichtkontexte

- `document`
- `template`
- `workflow`
- `currentUser`
- `data`
- `external`
- `snapshot`
- `integrationContext`
- `request`

## 9.2 Bedeutung der Kontextbereiche

### document
Das aktuelle laufende Document.

### template
Das referenzierte Form Template.

### workflow
Das referenzierte Workflow Template bzw. der aktuelle Workflowkontext.

### currentUser
Der aktuell handelnde User.

### data
Die eigentlichen Formularwerte des Documents.

### external
Externe fachliche Werte, die am Document geführt werden.

### snapshot
Sicht-/Nachweiszustände.

### integrationContext
Persistierter technischer oder halbfachlicher Integrationszustand.

### request
Die aufgelösten Eingabewerte für die aktuelle Operation.

---

## 10. Persistierter Integrationskontext

## 10.1 Grundsatz

`integrationContext` ist der führende persistierte JSON-Bereich für mehrstufige Integrationsprozesse.

## 10.2 Typische Inhalte
- externe IDs
- CRM-/ERP-Referenzen
- Zwischenergebnisse
- spätere Folgeparameter für weitere Operationen

## 10.3 Beispiele
- `customer_order_id`
- `batch_external_ref`
- `salesforce_account_id`

## 10.4 Abgrenzung zu anderen JSON-Bereichen

### data
Normale Formular- und Nutzereingaben

### external
Externe fachliche Werte, die im Fachkontext sichtbar oder relevant sind

### snapshot
Nachweis- oder Sichtzustände

### integrationContext
Persistierter Integrationszustand für Folgeoperationen

---

## 11. Lese- und Schreibrechte einer Operation auf Kontextbereiche

Operationen dürfen je nach Definition:

- aus `data` lesen
- aus `external` lesen
- aus `snapshot` lesen
- aus `integrationContext` lesen
- aus `request` lesen

Operationen dürfen gezielt schreiben in:

- `data`
- `external`
- `snapshot`
- `integrationContext`

Operationen schreiben nicht direkt in:
- Template-Definitionen
- Workflow-Definitionen
- Memberships
- Metaobjekte

---

## 12. Einsatzorte von Operationen

## 12.1 Lookup

Operationen können verwendet werden, um Lookup-Werte für Formfelder zu liefern.

Beispiel:
- `products.listValid`
- `customers.listValid`

## 12.2 Form Actions

Operationen können aus Form Actions aufgerufen werden.

Beispiel:
- `customerOrders.create`
- `batches.create`

## 12.3 Workflow Hooks

Operationen können automatisch aus Workflow Hooks aufgerufen werden.

Beispiel:
- `customerOrders.setStatusFromContext`

---

## 13. Input-Modell

Eine Operation kann Input über mehrere Quellen erhalten:

- feste Werte
- Formularwerte aus `data`
- Werte aus `external`
- Werte aus `snapshot`
- Werte aus `integrationContext`
- Werte aus dem User-/Workflowkontext

### Beispielhafte Input-Quellen
- `data.customer_id`
- `integrationContext.customer_order_id`
- fester Wert `"approved"`

---

## 14. Output-Modell

Der Output einer Operation ist das strukturierte Ergebnis ihrer Ausführung.

Der Output kann:

- direkt zurückgegeben werden
- in definierte Zielbereiche geschrieben werden
- in Audit/History sichtbar gemacht werden

---

## 15. Mapping-Modell

## 15.1 requestMapping

`requestMapping` beschreibt, wie Eingaben aus dem Dokument- und Laufzeitkontext in den Request einer Operation geschrieben werden.

### Beispiel

```json
{
  "requestMapping": {
    "customerId": "data.customer_id",
    "status": "literal.approved"
  }
}
```

## 15.2 responseMapping

`responseMapping` beschreibt, wie Rückgabewerte einer Operation in Zielbereiche geschrieben werden.

Zulässige Zielbereiche:

- `data`
- `external`
- `snapshot`
- `integrationContext`

### Beispiel

```json
{
  "responseMapping": {
    "integrationContext.customer_order_id": "result.id",
    "snapshot.customer_order_sync_ok": "result.ok"
  }
}
```

---

## 16. TypeScript-Modulstruktur

Für das MVP gilt:

- jede Operation ist ein TypeScript-Modul
- Module werden in einer klaren Connector-/Operationsstruktur organisiert
- die Implementierung muss leicht in einen späteren separaten Integration-Service überführbar bleiben

### Empfohlene Struktur

```text
connectors/
├── erp-sim/
│   ├── customers.ts
│   ├── products.ts
│   ├── batches.ts
│   └── customer-orders.ts
├── salesforce-sandbox/
│   └── accounts.ts
└── registry.ts
```

---

## 17. Beispiel einer normativen Operation

```ts
export const operation = {
  operationRef: 'customerOrders.setStatusFromContext',
  meta: {
    name: 'Set Customer Order Status From Context',
    description: 'Sets the customer order status in the ERP simulation using the stored integration context.',
    connector: 'erp-sim',
    useCases: ['workflow-hook'],
    tags: ['customer-order', 'status-sync']
  },
  auth: {
    strategy: 'none'
  },
  async execute(ctx) {
    const customerOrderId = ctx.integrationContext.customer_order_id;
    const status = ctx.request.status;

    const result = await ctx.http.post('/erp/orders/status', {
      id: customerOrderId,
      status
    });

    ctx.writeSnapshot('customer_order_sync_ok', result.ok);
    return result;
  }
};
```

---

## 18. Standardbeispiele für Operationen im MVP

Die folgenden Operationen sind als führende Beispiele vorgesehen:

- `products.listValid`
- `customers.listValid`
- `batches.create`
- `customerOrders.create`
- `customerOrders.setStatus`
- `customerOrders.setStatusFromContext`

Optional vorbereitbar:
- `salesforce.accounts.listRecent`

---

## 19. Verhältnis zu Form- und Workflow-Modell

## 19.1 Form Template

Das Form Template darf Operationen referenzieren in:
- Lookups
- Form Actions

Das Form Template definiert nicht die technische Implementierung der Operation.

## 19.2 Workflow Template

Das Workflow Template darf Operationen referenzieren in:
- Hooks

Das Workflow Template definiert nicht die technische Implementierung der Operation.

---

## 20. Verhältnis zu apiRef

Für das MVP gilt eindeutig:

- `operationRef` ist führend
- `apiRef` ist Bridge/Legacy

Neue Spezifikation und neue Umsetzung verwenden `operationRef`.

`apiRef` darf nur noch dort vorkommen, wo Legacy-Kompatibilität zwingend notwendig ist.

---

## 21. Validierungsregeln

Eine Operation ist fachlich nur gültig, wenn:

1. `operationRef` eindeutig ist
2. ein TypeScript-Modul existiert
3. eine zulässige Auth Strategy definiert ist
4. `execute(context)` vorhanden ist
5. Input-/Output-Mapping nur zulässige Quellen und Ziele verwendet
6. Zielbereiche nur `data`, `external`, `snapshot` oder `integrationContext` verwenden
7. keine Operation direkt Führungsdaten von Templates, Workflows oder Memberships verändert

---

## 22. Nicht zulässig im Operationsmodell des MVP

Nicht zulässig oder nicht führend im MVP sind:

- `apiRef` als Primärmodell
- visuelle Connector-Modellierung als Kernmodell
- produktive Secret-Store-Abhängigkeit
- Retry-/Queue-/Monitoring-Engine als Pflichtbestandteil
- Mandantenlogik im Operationsmodell
- Builder-interne Hilfsmodelle als führende Integrationsdefinition

---

## 23. Ergebnisregel

Das Operationsmodell ist das führende Integrationsmodell des MVP.

Spätere UI, Laufzeit oder Admin-Tools dürfen davon abweichen **nur**, wenn dieses Dokument zuerst angepasst wird.
