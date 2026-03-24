# 18 — Validation and Rules

## 1. Ziel dieses Dokuments

Dieses Dokument definiert die übergreifenden Validierungs-, Konsistenz- und Konfliktregeln des MVP.

Es legt verbindlich fest:

- welche Objekte vor der Nutzung validiert werden müssen
- welche Regeln für Form Templates gelten
- welche Regeln für Workflow Templates gelten
- welche Regeln für Documents gelten
- welche Regeln für Operationen gelten
- welche Regeln für Sichtbarkeit und Rechte gelten
- welche Konflikte unzulässig sind
- an welchen Stellen Fehler, Warnungen oder Blockierungen entstehen müssen

Dieses Dokument ist die führende Wahrheit für Validierung und übergreifende Regeln.

---

## 2. Rolle dieses Dokuments im Gesamtsystem

Die bisherigen Spezifikationen definieren:

- Scope
- Begriffe
- Domain Model
- Form MDX
- Workflow JSON
- Operationsmodell
- Rechte und Sichtbarkeit
- Versionierung
- Navigation
- Screen-Spezifikationen
- User Flows
- Referenzdaten

Dieses Dokument zieht daraus die **übergreifenden Regeln** zusammen.

Es beschreibt nicht:
- konkrete technische Exception-Klassen
- konkrete HTTP-Fehlercodes
- konkrete DB-Constraints
- konkrete Testimplementierungen

Es beschreibt:
- die fachlich führenden Validierungs- und Konfliktregeln

---

## 3. Grundprinzipien aller Validierung

Für das MVP gelten diese Grundprinzipien:

1. Führende Modelle dürfen sich nicht widersprechen.
2. Ein Objekt ist nur gültig, wenn es in seinem fachlichen Kontext konsistent ist.
3. Konfigurationsfehler müssen möglichst früh erkannt werden.
4. Laufzeitfehler dürfen nicht stillschweigend zu inkonsistenten Zuständen führen.
5. Arbeits-UI muss fachlich verständliche Fehlersituationen erzeugen.
6. Konfigurations-UI muss präzise Validierung liefern.

---

## 4. Validierungsebenen

Im MVP gibt es fünf Validierungsebenen:

1. Form-Template-Validierung
2. Workflow-Template-Validierung
3. Operations-Validierung
4. Document-/Laufzeit-Validierung
5. Rechte-/Sichtbarkeits-Validierung

---

## 5. Form-Template-Validierung

Ein Form Template ist nur gültig, wenn alle folgenden Regeln erfüllt sind.

## 5.1 Meta-Regeln

Ein Form Template muss mindestens besitzen:

- `key`
- `name`
- `version`
- `status`
- `workflowTemplateId`
- `mdxBody`

## 5.2 Key-Regeln

- der Template-Key muss vorhanden sein
- der Template-Key muss stabil sein
- der Template-Key darf nicht leer sein
- der Template-Key darf nicht innerhalb desselben fachlichen Template-Stamms doppeldeutig werden

## 5.3 Feldregeln

- alle Feldnamen müssen eindeutig sein
- jeder Feldname muss technisch stabil sein
- unzulässige Feldtypen dürfen nicht verwendet werden
- `templateKey` und `documentKey` dürfen nur auf existierenden Feldern gesetzt sein
- `tableField` darf nur auf existierenden Feldern gesetzt sein

## 5.4 Referenzregeln im MDX-Body

- jede `FieldRef` muss auf ein existierendes Feld verweisen
- jede `JournalRef` muss auf ein existierendes Journalfeld verweisen
- jede `AttachmentAreaRef` muss auf einen existierenden Attachment-Bereich verweisen
- jeder `ActionButton` muss auf eine definierte Form Action verweisen

## 5.5 Journal-Regeln

Ein Journalfeld ist nur gültig, wenn:

- `type = journal`
- `columns` vorhanden ist
- jede Journalspalte einen eindeutigen `key` besitzt
- Journalspalten gültige Typen besitzen

## 5.6 Attachment-Area-Regeln

Ein Attachment-Bereich ist nur gültig, wenn:

- `type = attachmentArea`
- Name und Label konsistent gesetzt sind
- er im Body sinnvoll referenziert wird, wenn er sichtbar sein soll

## 5.7 Lookup-Regeln

Ein Lookup-Feld ist nur gültig, wenn:

- `operationRef` gesetzt ist
- `valueKey` definiert ist
- `labelKey` definiert ist
- die referenzierte Operation existiert oder im erlaubten Referenzrahmen definiert ist

## 5.8 Form-Action-Regeln

Eine Form Action ist nur gültig, wenn:

- `name` gesetzt ist
- `label` fachlich sinnvoll gesetzt ist
- `operationRef` gesetzt ist
- request-/response-Mappings nur zulässige Quellen und Ziele verwenden

## 5.9 MDX-Regeln

Das MDX ist nur gültig, wenn:

- es parsebar ist
- nur erlaubte Bausteine verwendet werden
- keine konkurrierenden Modellwelten entstehen
- keine Workflow-Definitionen im MDX versteckt werden
- keine Builder-internen Hilfsstrukturen als führende Formdefinition auftauchen

---

## 6. Workflow-Template-Validierung

Ein Workflow Template ist nur gültig, wenn alle folgenden Regeln erfüllt sind.

## 6.1 Meta-Regeln

Ein Workflow Template muss mindestens besitzen:

- `key`
- `name`
- `version`
- `status`
- `workflowJson`

## 6.2 Statusregeln

- `initialStatus` muss vorhanden sein
- `initialStatus` muss in `statuses` enthalten sein
- `statuses` darf keine Duplikate enthalten
- es darf keine zweite konkurrierende Statusliste geben
- die Statusliste ist führend

## 6.3 Action-Regeln

Jede Action ist nur gültig, wenn:

- `from` vorhanden ist
- `to` vorhanden ist
- `allowedRoles` vorhanden ist
- jeder `from`-Status in `statuses` enthalten ist
- `to` in `statuses` enthalten ist
- `allowedRoles` nur zulässige Rollen enthält

## 6.4 Completion-/Approval-Regeln

- `completionMode` darf nur zulässige Werte enthalten
- `submitMode` darf nur zulässige Werte enthalten
- `approvalMode` darf nur zulässige Werte enthalten
- `editors` und `approvers` dürfen nur `single` oder `multiple` sein

## 6.5 Field-Rule-Regeln

`fieldRules` sind nur gültig, wenn:

- jeder referenzierte Status in `statuses` enthalten ist
- jedes referenzierte Feld im zugehörigen Formkontext fachlich existieren kann
- ein Feld im selben Status nicht gleichzeitig in `editable` und `readonly` steht

## 6.6 Hook-Regeln

Ein Hook ist nur gültig, wenn:

- `trigger` vorhanden ist
- `operationRef` vorhanden ist
- `trigger` fachlich gültig ist
- request-/response-Mapping nur zulässige Quellen und Ziele verwendet
- die referenzierte Operation existiert oder im erlaubten Referenzrahmen definiert ist

## 6.7 JSON-Regeln

Das Workflow-JSON ist nur gültig, wenn:

- es parsebar ist
- es nur die zugelassenen führenden Bereiche verwendet
- keine konkurrierenden Primärmodelle eingeführt werden
- `apiRef` nicht als führendes Modell genutzt wird

---

## 7. Form/Workflow-Konsistenzregeln

Da Formular und Workflow fachlich gekoppelt sind, gelten zusätzlich diese Konsistenzregeln.

## 7.1 Feld-/Status-Konsistenz

Ein Formular ist im Workflowkontext nur gültig, wenn:

- workflow-relevante Felder sinnvoll referenzierbar sind
- feldbezogene `editableIn`-/`readonlyIn`-Regeln nicht im Widerspruch zu Workflow-Field Rules stehen

## 7.2 Template Key / Document Key Regeln

- Template Keys dürfen nicht fachlich beliebig dauerhaft editierbar bleiben, wenn der Workflow das ausschließt
- Document Keys dürfen nicht in abgeschlossenen Status editierbar bleiben, wenn das Workflowmodell dies ausschließt

## 7.3 Konfliktregel

Wenn das Workflowmodell ein Feld zwingend readonly macht, darf das Form Template dieses Feld im selben Status nicht als editierbar definieren.

---

## 8. Operations-Validierung

Eine Operation ist nur gültig, wenn alle folgenden Regeln erfüllt sind.

## 8.1 Grundregeln

- `operationRef` ist vorhanden
- `operationRef` ist eindeutig
- ein Modul ist vorhanden
- `execute(context)` ist vorhanden
- eine zulässige Auth Strategy ist definiert

## 8.2 Auth-Regeln

Zulässige Auth Strategies im MVP:

- `none`
- `apiKey`
- `basic`
- `bearerToken`
- `oauth2ClientCredentials` vorbereitet

Andere Strategien sind nicht führend und bedürfen späterer Erweiterung.

## 8.3 Mapping-Regeln

Eine Operation ist nur gültig, wenn:

- Input-Mapping nur zulässige Quellen verwendet
- Output-/Response-Mapping nur zulässige Ziele verwendet

Zulässige Zielbereiche:

- `data`
- `external`
- `snapshot`
- `integrationContext`

## 8.4 Kontext-Regeln

Operationen dürfen nicht direkt Führungsdaten verändern von:

- Form Templates
- Workflow Templates
- Memberships
- Groups
- Users

Operationen arbeiten im MVP führend auf dem Laufzeitkontext des Documents.

## 8.5 Legacy-/Bridge-Regel

`apiRef` ist nicht führend.
Neue Operationen und neue Spezifikation nutzen `operationRef`.

---

## 9. Rechte- und Sichtbarkeitsvalidierung

## 9.1 Template-Sichtbarkeit

Ein Template ist für einen User nur sichtbar, wenn:

- Group-Zuweisung vorhanden ist
- passende Membership vorhanden ist
- mindestens `r` vorhanden ist

## 9.2 Document-Sichtbarkeit

Ein Document ist nur sichtbar, wenn:

- das zugrunde liegende Template sichtbar ist
- das Sichtbarkeitsmodell des Templates/Contexts es erlaubt

## 9.3 Rollen-/Rechte-Kombination

Ein User darf nicht allein aufgrund einer Dokumentrolle etwas sehen oder ausführen, wenn die grundlegende Sichtbarkeit über Group/Membership fehlt, sofern das Produktmodell dies nicht ausdrücklich erweitert.

Im MVP gilt:
- Group-/Membership-Sichtbarkeit ist Grundvoraussetzung

## 9.4 Feldbearbeitung

Ein Feld ist nur bearbeitbar, wenn **alle** Bedingungen erfüllt sind:

- Document sichtbar
- Feld sichtbar
- User hat `w`
- Rolle erlaubt Bearbeitung
- Workflowstatus erlaubt Bearbeitung
- Feldregel erlaubt Bearbeitung

## 9.5 Action-Ausführung

Eine Action ist nur ausführbar, wenn **alle** Bedingungen erfüllt sind:

- Document sichtbar
- User hat `x`
- Rolle erlaubt Action
- Workflowstatus erlaubt Action
- Validierungen sind erfüllt
- Document ist nicht archiviert

---

## 10. Document-Laufzeitvalidierung

Ein Document darf nur korrekt laufen, wenn folgende Regeln eingehalten werden.

## 10.1 Start-Regeln

Ein neues Document darf nur gestartet werden, wenn:

- das Form Template `published` ist
- die gebundene Template-Version gültig ist
- das referenzierte Workflow Template `published` ist
- die gebundene Workflow-Version gültig ist

## 10.2 Versionsbindung

Ein laufendes Document bleibt an seiner Startversion gebunden.

Ungültig ist:
- automatischer Wechsel auf neue Template-Version
- automatischer Wechsel auf neue Workflow-Version

## 10.3 Statuswechsel

Ein Statuswechsel ist nur gültig, wenn:

- die Action im aktuellen Status erlaubt ist
- der Zielstatus gültig ist
- die Rolle die Action ausführen darf
- alle Validierungen erfüllt sind

## 10.4 Archiv-Regel

Ein archiviertes Document ist readonly.
Normale Bearbeitungs- und Fortschrittsaktionen dürfen nicht mehr verfügbar sein.

---

## 11. History-/Audit-Regeln

## 11.1 Grundsatz

Fachlich relevante Laufzeitereignisse müssen nachvollziehbar protokolliert werden.

## 11.2 Mindestereignisse

Mindestens diese Ereignisse müssen fachlich abbildbar sein:

- `created`
- `assigned`
- `re_assigned`
- `started`
- `saved`
- `submitted`
- `approved`
- `rejected`
- `archived`
- `attachment_uploaded`
- `action_executed`
- `workflow_hook_executed`

## 11.3 Regel

History/Audit ist kein reiner Techniklog.
Es ist eine fachlich sichtbare Nachvollziehbarkeit.

---

## 12. Versionierungsregeln

## 12.1 Template-Versionen

- ein Draft ist nicht für neue Documents nutzbar
- nur `published` ist für neue Documents nutzbar
- `archived` ist historisch sichtbar, aber nicht produktiv startbar

## 12.2 Publish-Regel

Beim Publish einer neuen Produktivversion gilt:

- neue Version wird `published`
- bisher aktive Produktivversion wird `archived` oder funktional deaktiviert
- laufende Documents bleiben unverändert

## 12.3 Workflow-Versionen

Für Workflows gilt dieselbe Logik:
- neue Version aktiv
- alte Version historisch
- laufende Documents bleiben auf ihrer gebundenen Version

---

## 13. UI-Validierungsregeln

## 13.1 Arbeits-UI

Die Arbeits-UI ist nur gültig, wenn:

- sie keine technischen JSON-/Bridge-Details standardmäßig zeigt
- sie arbeitsorientiert bleibt
- sie keine Konfigurationslogik in die tägliche Arbeit zieht

## 13.2 Konfigurations-UI

Die Konfigurations-UI ist nur gültig, wenn:

- sie die führenden Modelle bearbeitet
- sie keine konkurrierenden Modellwelten aufbaut
- JSON nur dort zeigt, wo es führendes Konfigurationsformat ist

## 13.3 Admin-UI

Die Admin-UI ist nur gültig, wenn:

- sie Verwaltungsobjekte zeigt
- sie keine Arbeits-UI ersetzt
- sie keine Template-/Workflow-Konfigurationslogik übernimmt

---

## 14. Fehlerklassen im Fachsinn

Im MVP sind fachlich drei Arten von Validierungsergebnissen relevant.

## 14.1 Blockierender Fehler

Ein blockierender Fehler verhindert:
- Speichern
- Publish
- Statuswechsel
- Action-Ausführung
- Start eines neuen Documents

Beispiele:
- ungültiges Workflow-JSON
- fehlender Initialstatus
- nicht existierende operationRef
- Konflikt zwischen Feldregel und Workflowregel

## 14.2 Warnung

Eine Warnung weist auf potenzielle Probleme hin, blockiert aber nicht zwingend.

Beispiele:
- unnötig komplexes Mapping
- optional fehlende Beschreibung
- unklare, aber noch gültige Konfiguration

## 14.3 Leerer/ruhiger Zustand

Ein leerer Zustand ist kein Fehler.

Beispiele:
- keine Tasks
- keine Attachments
- kein Journalinhalt
- keine Documents sichtbar

---

## 15. Nicht zulässige Konflikte im MVP

Die folgenden Konflikte sind im MVP ausdrücklich unzulässig:

- Feld gleichzeitig `editable` und `readonly` im selben Status
- Workflowstatus nicht in `statuses`
- Action verweist auf nicht existierenden Status
- Hook ohne gültige `operationRef`
- Lookup ohne gültige `operationRef`
- neues Document aus nicht publiziertem Template
- laufendes Document springt implizit auf neue Version
- Template und Workflow definieren widersprüchliche Bearbeitbarkeit desselben Feldes
- Arbeits-UI zeigt technische Konfigurationsmodelle als Standard

---

## 16. Ergebnisregel

Die in diesem Dokument beschriebenen Validierungs- und Konfliktregeln sind die führenden übergreifenden Regeln des MVP.

Spätere Implementierungen, Prüfungen und Testfälle dürfen davon abweichen **nur**, wenn dieses Dokument zuerst angepasst wird.
