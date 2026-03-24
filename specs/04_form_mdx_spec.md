# 04 — Form MDX Specification

## 1. Ziel dieses Dokuments

Dieses Dokument definiert das führende MDX-Format für Form Templates im MVP.

Es legt verbindlich fest:

- welche Aufgaben MDX übernimmt
- welche Aufgaben MDX nicht übernimmt
- welche Bausteine und Direktiven erlaubt sind
- wie Felder, Journal-Bereiche, Attachment-Bereiche und Form Actions beschrieben werden
- wie MDX mit Template Keys, Document Keys, Workflow-Regeln und Tabellenfeldern zusammenhängt
- wie ein MDX-Template in UI und Laufzeit interpretiert wird

Dieses Dokument ist die führende Wahrheit für die Formularbeschreibung.

---

## 2. Grundsatzentscheidung

Für das MVP gilt:

- **Form Templates werden in MDX beschrieben**
- **Workflow Templates werden in JSON beschrieben**
- **Integrationen und Operationen werden in TypeScript beschrieben**

MDX ist damit das führende menschenlesbare Format für:

- Formularstruktur
- Formularfelder
- Formularlayout
- Hinweise und Beschreibungstexte
- formularbezogene Actions
- Journal- und Attachment-Bereiche

MDX ist **nicht** das führende Format für:

- Workflow-Übergänge
- Rollenlogik
- Hook-Definitionen
- TypeScript-Operationen
- Authentifizierungsdefinitionen
- Versionierungslogik

---

## 3. Modellgrenze von MDX

MDX beschreibt das **Form Template**.

MDX beschreibt nicht das **laufende Document**.

MDX beschreibt nicht die **Workflow-Engine**.

MDX beschreibt nicht die **Operationsimplementierung**.

Das heißt:

### MDX beschreibt

- was der Nutzer im Formular sieht
- welche Felder vorhanden sind
- wie diese Felder im Formular angeordnet sind
- welche Felder Template Keys oder Document Keys sind
- welche Felder in Dokumenttabellen angezeigt werden können
- welche Form Actions im Formular sichtbar sein können

### MDX beschreibt nicht

- wer ein Feld im konkreten Document bearbeiten darf
- welcher User konkret Editor oder Approver ist
- welche Hooks bei welchem Workflow-Ereignis laufen
- wie eine Operation technisch implementiert ist
- wie Daten in der Datenbank gespeichert werden

---

## 4. Führende Bausteine des Form Templates

Ein Form Template besteht fachlich aus vier Ebenen:

1. **Template-Metadaten**
2. **Felddefinitionen**
3. **Formularbody in MDX**
4. **abgeleitete List-/Tabelleninformationen**

### 4.1 Template-Metadaten

Die Metadaten liegen nicht im Body selbst, sondern im Template-Objekt.

Sie enthalten u. a.:

- key
- name
- description
- version
- status
- workflowTemplateId
- Group-Zuweisungen

### 4.2 Felddefinitionen

Felddefinitionen sind der strukturierte Kern des Formulars.

Sie definieren:

- Feldname
- Typ
- Label
- Schlüsselfunktion
- Sicht-/Bearbeitungsattribute
- Listen-/Tabellenattribute
- optionale Integrationszuordnung

### 4.3 Formularbody

Der Formularbody definiert:

- Abschnitte
- Reihen
- Spalten
- Hinweise
- Verweise auf Felder
- Verweise auf Journal-/Attachment-Bereiche
- Form Actions

### 4.4 Abgeleitete Tabelleninformationen

Bestimmte Felder können als Tabellenfelder markiert werden.
Diese Felder dürfen in Dokumenttabellen eines Templates angezeigt werden.

---

## 5. Struktur eines Form Templates

Das führende Form Template besteht fachlich aus:

- Template-Metadaten
- Felddefinitionen
- MDX-Body

Eine normative logische Struktur ist:

```text
FormTemplate
├── meta
├── fields
└── mdxBody
```

Die konkrete Persistenz kann davon abweichen, aber fachlich gilt dieses Modell.

---

## 6. Erlaubte Feldtypen im MVP

Die folgenden Feldtypen sind im MVP zulässig:

- `text`
- `textarea`
- `number`
- `date`
- `select`
- `lookup`
- `checkbox`
- `checkboxGroup`
- `radioGroup`
- `journal`
- `attachmentArea`
- `readonlyText`

Andere Feldtypen sind im MVP nicht führend und bedürfen späterer expliziter Erweiterung.

---

## 7. Standardattribute eines Feldes

Jedes Feld kann folgende Attribute haben.

### 7.1 Pflichtattribute

- `name`
- `type`
- `label`

### 7.2 Optionale Standardattribute

- `required`
- `helpText`
- `placeholder`
- `defaultValue`
- `description`
- `editableIn`
- `readonlyIn`
- `templateKey`
- `documentKey`
- `tableField`
- `visibleTo`

### 7.3 Typabhängige Attribute

Zusätzliche Attribute hängen vom Feldtyp ab.

Beispiele:

- `options`
- `operationRef`
- `valueKey`
- `labelKey`
- `columns`

---

## 8. Feldidentität und Namensregeln

### 8.1 Feldname

`name` ist die eindeutige Feldidentität innerhalb eines Templates.

### 8.2 Regeln

- Feldnamen müssen innerhalb eines Templates eindeutig sein
- Feldnamen dürfen nicht mehrfach vergeben werden
- Feldnamen sind technisch stabil
- Feldnamen dürfen nicht von UI-Labels abhängen

### 8.3 Benennung

Empfohlen wird:

- `snake_case`
- fachlich sprechende Namen
- keine spaces
- keine rein technischen oder zufälligen Namen

Beispiele:

- `product_id`
- `batch_id`
- `customer_order_number`
- `fulfillment_flags`
- `inspection_steps`

---

## 9. Template Keys und Document Keys

## 9.1 Template Key

Ein Feld mit `templateKey = true` ist ein Template Key.

### Bedeutung

Template Keys parametrisieren oder prägen die fachliche Verwendung eines Templates.

### Beispiel

- `product_id`

### Regeln

- ein Template kann null, einen oder mehrere Template Keys haben
- Template Keys sind Teil des führenden Fachmodells

---

## 9.2 Document Key

Ein Feld mit `documentKey = true` ist ein Document Key.

### Bedeutung

Document Keys identifizieren ein konkretes Document fachlich.

### Beispiele

- `batch_id`
- `customer_order_number`

### Regeln

- ein Template kann null, einen oder mehrere Document Keys haben
- Document Keys sind Teil des führenden Fachmodells

---

## 9.3 Kein führender Business-Key-Begriff

Ein allgemeines führendes Business-Key-Konzept wird im MVP **nicht** verwendet.

Stattdessen gelten:

- Template Keys
- Document Keys

Wenn später eine zusammengesetzte Anzeige für Listen oder Header gebraucht wird, ist diese eine abgeleitete Darstellung und kein neues Kernmodell.

---

## 10. Tabellenfelder

## 10.1 tableField

`tableField = true` markiert ein Feld als listenfähig für Dokumenttabellen eines Templates.

### Bedeutung

Das Feld darf als Spalte in der Dokumentliste des Templates erscheinen.

### Regeln

- ein Feld kann Tabellenfeld sein, ohne Key zu sein
- nicht jedes Feld muss Tabellenfeld sein
- Tabellenfelder werden explizit und sparsam definiert

### Beispiele

- `customer_id`
- `customer_order_number`
- `batch_id`

---

## 11. Feldtypen im Detail

## 11.1 text

Einzeiliges Textfeld.

### Typische Nutzung

- IDs
- Bezeichnungen
- kurze Freitexte

### Speicherung

- `dataJson[name] = string`

---

## 11.2 textarea

Mehrzeiliges Textfeld.

### Typische Nutzung

- Kommentare
- Beschreibung
- Notizen

### Speicherung

- `dataJson[name] = string`

---

## 11.3 number

Numerisches Feld.

### Speicherung

- `dataJson[name] = number`

---

## 11.4 date

Datumsfeld.

### Speicherung

- `dataJson[name] = string` oder normalisierte Datumsrepräsentation gemäß Implementierungsregel

Im Fachmodell bleibt es ein Datumswert.

---

## 11.5 select

Auswahlliste aus statisch definierten Optionen.

### Typische Attribute

- `options`

### Speicherung

- `dataJson[name] = value`

---

## 11.6 lookup

Auswahlliste mit extern oder systemseitig geladenen Werten.

### Typische Attribute

- `operationRef`
- `valueKey`
- `labelKey`

### Bedeutung

Ein Lookup referenziert eine Operation, die Auswahlwerte liefert.

### Beispiel

- `products.listValid`
- `customers.listValid`

### Speicherung

Der Wert wird fachlich gemäß Template-Definition gespeichert.
Im MVP ist zulässig:

- ID als führender Wert
- ggf. ergänzende zusätzliche sichtbare Werte in `externalJson` oder abgeleiteter Anzeige

---

## 11.7 checkbox

Einzelne Checkbox.

### Speicherung

- `dataJson[name] = boolean`

---

## 11.8 checkboxGroup

Mehrfachauswahl.

### Pflichtattribute

- `options`

### Speicherung

- `dataJson[name] = string[]`

### Regeln

- Reihenfolge der Optionen ist definitionsgetrieben
- die Auswahl wird als Menge fachlicher Werte behandelt

---

## 11.9 radioGroup

Genau-eine-Auswahl.

### Pflichtattribute

- `options`

### Speicherung

- `dataJson[name] = string`

---

## 11.10 journal

Wiederholbarer strukturierter Bereich.

### Pflichtattribute

- `columns`

### Bedeutung

Ein Journal ist kein einzelnes primitives Feld, sondern ein strukturierter Datensatzbereich.

### Speicherung

- `dataJson[name] = array of row objects`

### Beispiel

```json
[
  { "step": "Receive batch", "result": "ok" },
  { "step": "Check label", "result": "ok" }
]
```

---

## 11.11 attachmentArea

Definierter Bereich für Dateien.

### Bedeutung

Eine Attachment Area markiert im Formular, wo Dateiuploads logisch angezeigt und bearbeitet werden.

### Speicherung

Die Dateien selbst werden nicht als normales Feld im `dataJson` gespeichert.

Stattdessen:

- Dateimetadaten separat
- Verknüpfung zum Document

### Das Feld dient fachlich

- der Platzierung
- der Sichtbarkeit
- der logischen Zuordnung im Formular

---

## 11.12 readonlyText

Reines Anzeige-/Ausgabefeld.

### Bedeutung

Ein readonlyText-Feld dient zur nicht editierbaren Anzeige eines Wertes oder Textes.

### Speicherung

- typischerweise kein eigener editierbarer Eingabewert
- Anzeige kann aus data, external oder snapshot erfolgen

---

## 12. Typabhängige Zusatzattribute

## 12.1 options

Für:

- select
- checkboxGroup
- radioGroup

### Typ

Liste fachlicher Werte oder Wert/Label-Kombinationen

---

## 12.2 operationRef

Für:

- lookup
- Form Actions

### Bedeutung

Referenz auf eine TypeScript-Operation.

### Regel

`operationRef` ist das führende Integrationsmodell.
`apiRef` ist im MDX-Modell nicht führend.

---

## 12.3 valueKey und labelKey

Für:

- lookup

### Bedeutung

Definieren, welcher Rückgabewert gespeichert und welcher angezeigt wird.

---

## 12.4 columns

Für:

- journal

### Bedeutung

Definiert die Spaltenstruktur des Journals.

---

## 13. Workflow-bezogene Feldattribute

## 13.1 editableIn

Liste von Workflow-Status, in denen das Feld editierbar ist.

### Beispiel

- `editableIn = ["new", "assigned"]`

---

## 13.2 readonlyIn

Liste von Workflow-Status, in denen das Feld readonly ist.

### Beispiel

- `readonlyIn = ["submitted", "approved"]`

---

## 13A. Globales Default-Modell für Editierbarkeit

Für das MVP gilt ein globales Default-Modell für die Editierbarkeit von Feldern.

Dieses Default-Modell ist **nicht pro Feld zufällig**, sondern gehört zur fachlichen Grundregel des Formulars.

### Default-Regel für normale Formularfelder

Wenn ein Feld keine eigene abweichende Regel hat, gilt:

- im Status `new` ist ein Feld editierbar, sofern das Feld fachlich in der Erstanlage gepflegt werden soll
- im Status `created` ist ein Feld editierbar, sofern das Feld fachlich im frühen Initialkontext gepflegt werden soll
- im Status `assigned` ist ein Feld editierbar, sofern das Feld fachlich bei Übernahme oder Zuweisung gepflegt werden soll
- im Status `started` ist ein Feld editierbar, sofern das Feld zur eigentlichen Bearbeitung gehört
- im Status `progressed` bleibt ein zuvor im Bearbeitungskontext editierbares Feld editierbar, sofern keine strengere Regel greift
- im Status `submitted` sind Felder standardmäßig readonly
- im Status `approved` sind Felder standardmäßig readonly
- im Status `archived` sind Felder readonly

Diese Default-Regel wird fachlich durch das Workflow-Modell konkretisiert, kann aber im Form Template pro Feld überschrieben werden.

---

## 13B. Default-Verhalten für Template Keys

Template Keys haben ein eigenes Default-Verhalten.

### Grundregel

Ein Template Key ist standardmäßig in dem Status editierbar, in dem das Document fachlich initialisiert oder parametrisiert wird.

Typischerweise ist das:

- `new`
- `created`

### Normative Regel

Wenn ein Feld `templateKey = true` gesetzt hat und keine abweichende Feldregel definiert ist, gilt:

- das Feld ist im Initial-/Erstanlagestatus editierbar
- ab dem ersten fortgeschrittenen Prozessstatus ist das Feld readonly

### Begründung

Ein Template Key prägt das Document fachlich.
Er soll nach dem fachlichen Start nicht stillschweigend beliebig veränderbar bleiben.

### Beispiel

`product_id` ist Template Key:

- editierbar in `new`
- readonly ab `assigned`, sofern nicht überschrieben

---

## 13C. Default-Verhalten für Document Keys

Document Keys haben ein eigenes Default-Verhalten.

### Grundregel

Ein Document Key ist standardmäßig in dem Status editierbar, in dem das konkrete fachliche Document identifiziert oder erzeugt wird.

Typischerweise ist das:

- `assigned`
- `started`
- oder ein anderer ausdrücklich dafür vorgesehener Status

### Normative Regel

Wenn ein Feld `documentKey = true` gesetzt hat und keine abweichende Feldregel definiert ist, gilt:

- das Feld ist in dem fachlich vorgesehenen Identifikationsstatus editierbar
- nach `submit` ist es readonly
- nach `approve` und `archive` ist es readonly

### Beispiel

`batch_id` ist Document Key:

- editierbar in `assigned`
- readonly ab `submitted`, sofern nicht überschrieben

---

## 13D. Feldspezifische Überschreibung des Default-Verhaltens

Jedes Feld darf sein Default-Verhalten explizit überschreiben.

### Führende feldbezogene Attribute

- `editableIn`
- `readonlyIn`

### Normative Regel

Wenn `editableIn` oder `readonlyIn` auf einem Feld definiert sind, dann überschreiben diese Angaben das allgemeine feldtyp- oder schlüsselspezifische Default-Verhalten.

Das bedeutet:

- normale Felder folgen dem globalen Default
- Template Keys folgen ihrem Key-Default
- Document Keys folgen ihrem Key-Default
- **wenn das Feld selbst `editableIn` oder `readonlyIn` angibt, gilt diese Felddefinition vorrangig**

---

## 13E. Vorrangregeln bei Konflikten

Für die Editierbarkeit gilt folgende Prioritätsreihenfolge:

1. **explizite Felddefinition im Form Template**
   - `editableIn`
   - `readonlyIn`

2. **schlüsselspezifische Default-Regel**
   - Template Key Default
   - Document Key Default

3. **globale Formular-/Workflow-Default-Regel**

4. **archivierte oder abgeschlossene Zustände erzwingen readonly**
   - `submitted`
   - `approved`
   - `archived`
   sofern nicht ausdrücklich anders geregelt

### Konfliktregel

Ein Widerspruch zwischen Template und Workflow ist nicht zulässig.
Wenn das Workflow-Modell ein Feld zwingend readonly macht, darf das Template dieses Feld nicht gleichzeitig als editierbar definieren, außer die Workflow-Spezifikation erlaubt ausdrücklich feldspezifische Ausnahmen.

---

## 13F. Normative Beispiele für Editierbarkeit

### Beispiel 1 — normales Feld ohne Überschreibung

```mdx
<Field
  name="comment"
  type="textarea"
  label="Comment"
/>
```

Ergebnis:

- normales Feld
- kein Template Key
- kein Document Key
- keine Feldüberschreibung
- folgt dem globalen Default-Modell

---

### Beispiel 2 — Template Key mit Default-Verhalten

```mdx
<Field
  name="product_id"
  type="lookup"
  label="Product"
  operationRef="products.listValid"
  valueKey="id"
  labelKey="name"
  templateKey
/>
```

Ergebnis:

- standardmäßig im Initial-/Erstanlagestatus editierbar
- danach readonly, sofern nicht überschrieben

---

### Beispiel 3 — Template Key mit expliziter Überschreibung

```mdx
<Field
  name="product_id"
  type="lookup"
  label="Product"
  operationRef="products.listValid"
  valueKey="id"
  labelKey="name"
  templateKey
  editableIn={["new", "created"]}
  readonlyIn={["assigned", "started", "progressed", "submitted", "approved", "archived"]}
/>
```

Ergebnis:

- das explizite Feldverhalten ist führend

---

### Beispiel 4 — Document Key mit expliziter Überschreibung

```mdx
<Field
  name="batch_id"
  type="text"
  label="Batch ID"
  documentKey
  editableIn={["assigned"]}
  readonlyIn={["started", "progressed", "submitted", "approved", "archived"]}
/>
```

Ergebnis:

- `batch_id` ist nur in `assigned` editierbar
- danach readonly

---

## 13G. Empfohlene MVP-Regel

Für das MVP wird empfohlen:

- **Template Keys** standardmäßig nur im frühen Initialkontext editierbar
- **Document Keys** standardmäßig nur in dem Status editierbar, in dem das konkrete Document fachlich identifiziert wird
- **alle übrigen Felder** standardmäßig im Bearbeitungskontext editierbar
- **nach submit** standardmäßig alles readonly, sofern nicht ausdrücklich anders definiert

Damit ist das Verhalten einfach, nachvollziehbar und mit dem fachlichen Ziel konsistent.

---

## 14. Sichtbarkeitsattribute

## 14.1 visibleTo

Optionales Attribut zur Steuerung, für welche Rollen oder Kontexte ein Feld sichtbar ist.

### Ziel

Sichtbarkeit im Formular kann eingeschränkt werden, ohne das Feld aus dem Modell zu entfernen.

### Regel

Dieses Attribut ist optional und darf nur für fachlich sinnvolle Differenzierung verwendet werden.
Es ersetzt nicht das Rechte- oder Workflowmodell.

---

## 15. Verhältnis zu Workflow-Feldregeln

Es gibt zwei Regelquellen:

- Workflow-Feldregeln
- feldspezifische Attribute im Template

Für das MVP gilt:

1. Das Workflow-Modell ist führend für den allgemeinen Statuskontext.
2. Feldattribute im Template dürfen ergänzen oder konkretisieren.
3. Widersprüche zwischen Template und Workflow sind nicht zulässig.

Die genaue Auflösung folgt der in diesem Dokument definierten Vorranglogik und den ergänzenden Regeln der Workflow-Spezifikation.

---

## 16. Form Actions

## 16.1 Definition

Form Actions sind benutzerseitig aus dem Formular auslösbare Aktionen.

Sie erscheinen als Buttons oder andere bewusst definierte UI-Auslöser innerhalb des Formulars.

### Beispiele

- `create_customer_order`
- `create_batch`

---

## 16.2 Standardattribute von Form Actions

- `name`
- `label`
- `operationRef`
- `visibleIn`
- `enabledIn`
- `requestMapping`
- `responseMapping`

---

## 16.3 Bedeutung

Form Actions:

- sind fachliche Formularaktionen
- unterscheiden sich klar von Workflow Actions
- dürfen Integrationsoperationen auslösen
- dürfen Daten aus dem Formular lesen
- dürfen Rückgaben in definierte Zielbereiche schreiben

---

## 16.4 Nicht erlaubt

Form Actions definieren nicht:

- Workflow-Statusübergänge als Primärmodell
- Rollenmodell
- Hook-Verhalten

Das bleibt im Workflow-Modell.

---

## 17. MDX-Bausteine im Formularbody

Der Body eines Form Templates besteht aus zulässigen MDX-Bausteinen.

### 17.1 Erlaubte Bausteine

- Heading
- Text
- Hint
- Warning
- Section
- Row
- Column
- Stack
- FieldRef
- JournalRef
- AttachmentAreaRef
- ActionButton

Andere Bausteine sind im MVP nicht führend.

---

## 18. Semantik der Body-Bausteine

## 18.1 Heading

Überschrift.

## 18.2 Text

Erklärender Fließtext.

## 18.3 Hint

Unaufdringlicher Hinweistext.

## 18.4 Warning

Wichtiger Hinweis oder Warntext.

## 18.5 Section

Logischer Formularabschnitt.

### Typische Attribute

- `title`
- optional `description`

---

## 18.6 Row

Horizontale Anordnungseinheit.

### Bedeutung

Eine Row strukturiert Felder oder andere Bausteine in einer Zeile.

---

## 18.7 Column

Spalteneinheit innerhalb einer Row.

### Typische Attribute

- `width`

---

## 18.8 Stack

Vertikale Gruppierung innerhalb einer Spalte oder Section.

---

## 18.9 FieldRef

Verweis auf ein definiertes Feld.

### Pflichtattribut

- `name`

---

## 18.10 JournalRef

Verweis auf ein definiertes Journalfeld.

### Pflichtattribut

- `name`

---

## 18.11 AttachmentAreaRef

Verweis auf einen definierten Attachment-Bereich.

### Pflichtattribut

- `name`

---

## 18.12 ActionButton

Sichtbarer Auslöser einer Form Action.

### Pflichtattribute

- `name`
- optional `label`

---

## 19. Beispiel einer normativen Felddefinition

```mdx
<Fields>
  <Field
    name="product_id"
    type="lookup"
    label="Product"
    operationRef="products.listValid"
    valueKey="id"
    labelKey="name"
    templateKey
    editableIn={["new"]}
    tableField
  />

  <Field
    name="batch_id"
    type="text"
    label="Batch ID"
    documentKey
    editableIn={["assigned"]}
    tableField
  />

  <Field
    name="fulfillment_flags"
    type="checkboxGroup"
    label="Fulfillment Flags"
    options={["packed","reviewed","released"]}
    editableIn={["started","progressed"]}
  />

  <Field
    name="inspection_steps"
    type="journal"
    label="Inspection Steps"
    editableIn={["started","progressed"]}
  >
    <ColumnDef key="step" label="Step" type="text" />
    <ColumnDef key="result" label="Result" type="text" />
  </Field>

  <Field
    name="attachments_main"
    type="attachmentArea"
    label="Attachments"
    helpText="Upload supporting files."
  />
</Fields>
```

---

## 20. Beispiel eines normativen Formularbodys

```mdx
# Production Batch

<Section title="Header">
  <Row>
    <Column width={6}>
      <FieldRef name="product_id" />
    </Column>
    <Column width={6}>
      <FieldRef name="batch_id" />
    </Column>
  </Row>
</Section>

<Section title="Processing">
  <Row>
    <Column width={12}>
      <FieldRef name="fulfillment_flags" />
    </Column>
  </Row>
</Section>

<Section title="Inspection">
  <JournalRef name="inspection_steps" />
</Section>

<Section title="Attachments">
  <AttachmentAreaRef name="attachments_main" />
</Section>

<ActionButton name="create_batch" label="Create Batch" />
```

---

## 21. Rendering-Regeln

## 21.1 Grundsatz

Das Formular wird serverseitig aus MDX gerendert.

## 21.2 Komponentenstil

Atomare Controls werden in Material-Design-nahe UI-Komponenten übersetzt.

Dazu gehören insbesondere:

- Textfelder
- Selects
- Checkboxen
- Radios
- Buttons

---

## 21.3 Zusammengesetzte Fach-Controls

Die folgenden Bausteine werden nicht als einzelne atomare Material-Komponenten betrachtet, sondern als eigene zusammengesetzte Fach-UI-Blöcke:

- checkboxGroup
- radioGroup
- journal
- attachmentArea

---

## 21.4 Lesbarkeit vor Technisierung

Das gerenderte Formular muss:

- ruhig
- arbeitsorientiert
- menschenverständlich

sein.

Technische Metastrukturen dürfen im Formular nicht sichtbar dominieren.

---

## 22. Speicherregeln

## 22.1 Normale Felder

- `text`
- `textarea`
- `number`
- `date`
- `select`
- `checkbox`
- `checkboxGroup`
- `radioGroup`

werden in `dataJson` gespeichert.

---

## 22.2 Lookup-Felder

Lookup-Felder speichern den fachlich führenden Wert gemäß Definition.
Ergänzende externe sichtbare Werte können zusätzlich außerhalb von `dataJson` gehalten werden, falls nötig.

---

## 22.3 Journal

Journaldaten werden in `dataJson` unter dem Feldnamen als strukturierte Liste gespeichert.

---

## 22.4 Attachment Areas

Attachments werden nicht als normales Wertfeld in `dataJson` gespeichert.

Stattdessen:

- Dateimetadaten separat
- Verknüpfung zum Document
- Attachment Area dient der logischen Platzierung im Formular

---

## 22.5 Integrationsrückgaben

Rückgabewerte aus Form Actions werden gemäß Mapping gespeichert in:

- `dataJson`
- `externalJson`
- `snapshotJson`
- `integrationContextJson`

Die konkrete Zielzuordnung wird durch die Action-/Operationsdefinition bestimmt, nicht durch das MDX-Grundmodell.

---

## 23. Validierungsregeln

Ein Form Template ist nur gültig, wenn:

1. alle Feldnamen eindeutig sind
2. alle `FieldRef` auf definierte Felder verweisen
3. alle `JournalRef` auf definierte Journalfelder verweisen
4. alle `AttachmentAreaRef` auf definierte Attachment-Bereiche verweisen
5. `tableField` nur auf existierenden Feldern gesetzt ist
6. `templateKey` und `documentKey` nur auf existierenden Feldern gesetzt sind
7. `operationRef` nur auf referenzierbaren Operationen verwendet wird
8. unzulässige Feldtypen nicht verwendet werden
9. Feldregeln nicht im Widerspruch zu Workflow-Regeln stehen

---

## 24. Nicht zulässig im MDX-Modell des MVP

Nicht zulässig sind im führenden MDX-Modell:

- Workflow-Statusdefinitionen
- Workflow-Hook-Definitionen
- Rollenlogik als Primärmodell
- technische Bridge-/Legacy-API-Definitionen als führendes Modell
- Builder-interne UI-Hilfsstrukturen
- parallele konkurrierende Definitionsmodelle für dasselbe Formular

---

## 25. Ergebnisregel

Das MDX-Formmodell ist das führende, menschenlesbare Formularmodell des MVP.

Spätere Implementierungen, Builder oder Admin-Tools dürfen davon abweichen **nur**, wenn dieses Dokument zuerst angepasst wird.
