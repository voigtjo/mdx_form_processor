# 08 — Versioning and Lifecycle Specification

## 1. Ziel dieses Dokuments

Dieses Dokument definiert das führende Modell für Versionierung und Lifecycle von Templates, Workflows und Documents im MVP.

Es legt verbindlich fest:

- welche Status ein Form Template und ein Workflow Template im MVP haben
- wie Draft, Published und Archived zu verstehen sind
- wie Publish funktioniert
- wie Unpublish bzw. Archivierung funktioniert
- wie neue Versionen entstehen
- wie laufende Documents an Versionen gebunden bleiben
- wie sich Template-Version und Workflow-Version fachlich auf Documents auswirken

Dieses Dokument ist die führende Wahrheit für Versionierung und Lifecycle.

---

## 2. Grundsatzentscheidung

Für das MVP gilt:

- Form Templates sind versioniert
- Workflow Templates sind versioniert
- neue Documents dürfen nur aus publizierten Form Templates gestartet werden
- laufende Documents bleiben an ihrer Startversion gebunden
- neue Versionen verändern laufende Documents nicht rückwirkend

Versionierung ist damit ein führendes Produktkonzept und kein technisches Nebenmerkmal.

---

## 3. Versionierungsobjekte

Im MVP sind folgende Objekte versioniert:

- Form Template
- Workflow Template

Nicht versioniert im MVP-Sinn sind:

- User
- Group
- Membership
- Task
- Assignment
- Attachment
- Audit Event
- Operation als Laufzeitreferenz

Operationen können sich technisch ändern, sind aber im MVP nicht als separates fachliches Versionsobjekt modelliert.

---

## 4. Lifecycle-Status von Form Templates

Ein Form Template kennt im MVP genau diese fachlichen Status:

- `draft`
- `published`
- `archived`

Diese Status sind führend.

Andere konkurrierende Statusmodelle für Templates sind im MVP nicht zulässig.

---

## 5. Bedeutung der Template-Status

## 5.1 draft

`draft` bedeutet:

- die Version ist bearbeitbar
- die Version ist noch nicht produktiv freigegeben
- aus dieser Version dürfen keine neuen Documents gestartet werden

Ein Draft ist die Bearbeitungs- und Review-Version.

---

## 5.2 published

`published` bedeutet:

- diese Version ist produktiv freigegeben
- neue Documents dürfen aus dieser Version gestartet werden
- diese Version ist die aktive Nutzversion des Templates

Im MVP gilt:
- pro Template-Key ist genau eine aktive veröffentlichte Version vorgesehen

---

## 5.3 archived

`archived` bedeutet:

- diese Version ist nicht mehr für neue Documents nutzbar
- die Version bleibt historisch nachvollziehbar
- bestehende Documents, die mit dieser Version gestartet wurden, bleiben gültig

Archived bedeutet nicht gelöscht.

---

## 6. Lifecycle-Status von Workflow Templates

Ein Workflow Template kennt im MVP ebenfalls diese fachlichen Status:

- `draft`
- `published`
- `archived`

Die Bedeutung entspricht dem Template-Modell:

- `draft` = in Bearbeitung
- `published` = aktiv referenzierbar
- `archived` = historisch vorhanden, aber nicht mehr aktiv für neue Nutzung

---

## 7. Version als führendes Fachkonzept

## 7.1 Version

Eine Version ist eine konkrete, fachlich unterscheidbare Fassung eines Templates oder Workflows.

Versionen dienen dazu:

- Änderungen kontrolliert einzuführen
- laufende Documents stabil zu halten
- alte Konfigurationen nachvollziehbar zu erhalten

## 7.2 Version ist nicht nur technische Revision

Eine Version ist im MVP keine bloße technische Änderungshistorie, sondern eine produktiv relevante Fassung.

---

## 8. Neue Versionen

## 8.1 Form Template

Eine neue Version eines Form Templates entsteht, wenn eine bestehende fachliche Vorlage inhaltlich verändert und als neue Fassung gespeichert wird.

Typische Änderungen:
- Feldstruktur
- Label
- Template Keys
- Document Keys
- Tabellenfelder
- MDX-Body
- Group Assignment
- zugewiesene Workflow-Version

## 8.2 Workflow Template

Eine neue Version eines Workflow Templates entsteht, wenn der Status-/Action-/Hook-/Regelkontext fachlich geändert wird.

Typische Änderungen:
- Statusliste
- Initialstatus
- Actions
- Feldregeln
- Approval-Modell
- Hooks

---

## 9. Publish-Regeln für Form Templates

## 9.1 Publish eines Drafts

Wenn ein Draft publiziert wird:

1. erhält diese Version den Status `published`
2. wird sie zur aktiven Nutzversion
3. dürfen neue Documents ab diesem Zeitpunkt aus dieser Version gestartet werden

## 9.2 Wirkung auf ältere veröffentlichte Versionen

Wenn eine neue Version eines Form Templates publiziert wird:

- die bisher aktive publizierte Version wird aus dem aktiven Nutzkontext genommen
- sie wird im MVP nicht parallel weiter als zweite aktive Produktivversion geführt

Normativ gilt:
- im MVP ist pro Template-Key genau eine aktive publizierte Version vorgesehen

## 9.3 Archivierung der alten Produktivversion

Die alte aktive Version wird im MVP beim Publish einer neuen Produktivversion in den Status `archived` überführt oder funktional wie archiviert behandelt.

Führend ist die Regel:
- sie ist nicht mehr für neue Documents verwendbar

---

## 10. Publish-Regeln für Workflow Templates

## 10.1 Publish eines Drafts

Wenn ein Draft eines Workflow Templates publiziert wird:

1. erhält diese Version den Status `published`
2. wird sie zur aktiven Workflow-Version
3. kann sie von neuen oder aktualisierten Form Template-Versionen referenziert werden

## 10.2 Wirkung auf ältere Workflow-Versionen

Eine ältere publizierte Workflow-Version wird nach Publikation einer neuen Version im MVP nicht als gleichrangig aktive Standardversion geführt.

Sie bleibt historisch nachvollziehbar, aber nicht führend aktiv.

---

## 11. Unpublish im MVP

Für das MVP gilt:

- ein separates Fachkonzept `unpublished` ist nicht führend erforderlich
- die fachlich relevante Zielwirkung eines Unpublish ist `archived`

Das bedeutet:
- wenn eine aktive Version aus dem Produktivbetrieb entfernt wird, endet sie fachlich in `archived`

---

## 12. Start eines neuen Documents

Ein neues Document darf nur gestartet werden, wenn:

1. das Form Template im Status `published` ist
2. eine gültige konkrete Template-Version vorliegt
3. ein gültiges referenziertes Workflow Template bzw. eine konkrete Workflow-Version vorliegt

Im Startzeitpunkt bindet sich das Document an:

- die konkrete Form-Template-Version
- die konkrete Workflow-Template-Version

---

## 13. Versionsbindung eines Documents

## 13.1 Grundsatz

Ein Document wird immer mit der Template-Version zu Ende geführt, mit der es gestartet wurde.

## 13.2 Form Template Version

Ein laufendes Document springt nicht automatisch auf eine neuere Form-Template-Version.

## 13.3 Workflow Template Version

Ein laufendes Document springt nicht automatisch auf eine neuere Workflow-Template-Version.

## 13.4 Konsequenz

Spätere Änderungen an Templates oder Workflows beeinflussen laufende Documents nicht rückwirkend.

Das ist eine harte MVP-Regel.

---

## 14. Document-Lifecycle und Template-/Workflow-Lifecycle

Form Template- und Workflow-Lifecycle sind von Document-Status zu trennen.

### Template-/Workflow-Lifecycle
- draft
- published
- archived

### Document-Workflowstatus
- new
- created
- assigned
- started
- progressed
- submitted
- approved
- archived

Diese Modelle dürfen nicht vermischt werden.

---

## 15. Historische Gültigkeit

Auch wenn ein Template oder Workflow archiviert ist, bleiben folgende Dinge fachlich gültig und nachvollziehbar:

- laufende Documents, die auf dieser Version gestartet wurden
- abgeschlossene Documents, die diese Version genutzt haben
- Audit-Historien dieser Documents
- Darstellbarkeit des damaligen Formulars und Workflows im historischen Kontext

---

## 16. Sichtbarkeit alter Versionen

## 16.1 Form Templates

Alte Versionen bleiben in Versions- und Historienansichten sichtbar.

## 16.2 Workflow Templates

Alte Versionen bleiben in Versions- und Historienansichten sichtbar.

## 16.3 Standard-UI

Die Standard-Arbeits-UI zeigt typischerweise nur die aktuell aktive veröffentlichte Version, sofern kein Versions- oder History-Kontext gewählt ist.

---

## 17. Änderungsgrenzen einer Draft-Version

Eine Draft-Version darf verändert werden, ohne laufende Documents zu beeinflussen, solange sie nicht publiziert ist.

Das betrifft insbesondere:
- MDX-Struktur
- Feldattribute
- Tabellenfelder
- Workflow-Zuweisung
- Workflow-JSON
- Hooks
- Integrationszuordnungen

---

## 18. Nicht zulässige Verhaltensweisen im MVP

Im MVP nicht zulässig sind:

- automatisches Hochziehen laufender Documents auf neue Template-Versionen
- automatisches Hochziehen laufender Documents auf neue Workflow-Versionen
- parallele mehrere aktive publizierte Form-Template-Versionen pro Template-Key als Standardmodell
- parallele mehrere aktive publizierte Workflow-Versionen pro Workflow-Key als Standardmodell
- Migrationslogik für laufende Documents
- Branch-/Merge-Versionierung
- implizite Versionierung ohne sichtbaren Versionsbegriff

---

## 19. UI-Folgen der Versionierung

Die UI muss den Versionszustand fachlich korrekt abbilden.

### Form Templates
Die UI muss unterscheiden können zwischen:
- Draft
- Published
- Archived

### Workflows
Die UI muss unterscheiden können zwischen:
- Draft
- Published
- Archived

### Documents
Die UI muss im Detailkontext anzeigen können:
- mit welcher Template-Version das Document gestartet wurde
- mit welcher Workflow-Version das Document läuft

---

## 20. Normative Beispiele

## 20.1 Beispiel — Form Template

Template `customer-order-test`

- Version 1 = `published`
- Version 2 = `draft`

Wenn Version 2 publiziert wird:

- Version 2 wird `published`
- Version 1 wird `archived`
- neue Documents starten mit Version 2
- laufende Documents aus Version 1 bleiben auf Version 1

---

## 20.2 Beispiel — Workflow Template

Workflow `customer-order.group-submit`

- Version 1 = `published`
- Version 2 = `draft`

Wenn Version 2 publiziert wird:

- Version 2 wird `published`
- Version 1 wird `archived`
- neue oder neu publizierte Form Templates referenzieren Version 2
- laufende Documents mit Version 1 bleiben auf Version 1

---

## 21. Validierungsregeln

Ein Lifecycle-/Versionsmodell ist im MVP nur gültig, wenn:

1. ein Form Template genau einen klaren Status aus `draft`, `published`, `archived` besitzt
2. ein Workflow Template genau einen klaren Status aus `draft`, `published`, `archived` besitzt
3. `published`-Versionen für neue Documents nutzbar sind
4. `draft`-Versionen nicht für neue Documents nutzbar sind
5. `archived`-Versionen nicht für neue Documents nutzbar sind
6. Documents ihre Startversion fest speichern
7. laufende Documents nicht implizit auf neue Versionen springen

---

## 22. Ergebnisregel

Das in diesem Dokument beschriebene Versionierungs- und Lifecycle-Modell ist das führende Modell des MVP.

Spätere UI-, Laufzeit- oder Admin-Logik darf davon abweichen **nur**, wenn dieses Dokument zuerst angepasst wird.
