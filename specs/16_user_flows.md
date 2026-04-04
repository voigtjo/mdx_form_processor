# 16 — User Flows

## 1. Ziel dieses Dokuments

Dieses Dokument definiert die führenden Benutzer- und Prozessflüsse des MVP.

Es legt verbindlich fest:

- welche linearen Kernabläufe das MVP unterstützen muss
- in welcher fachlichen Reihenfolge diese Abläufe stattfinden
- welche Objekte dabei betroffen sind
- welche Screens dabei typischerweise benutzt werden
- welche Ergebnisse am Ende eines Flows vorliegen müssen

Dieses Dokument ist die führende Wahrheit für die zentralen Nutzungspfade des MVP.

---

## 2. Rolle der User Flows im Gesamtsystem

Die User Flows verbinden:

- Produktziel
- Domain Model
- Form MDX
- Workflow JSON
- Operationsmodell
- Screen-Spezifikationen
- Referenzdaten
- spätere Testabläufe

Die User Flows beschreiben **nicht**:
- technische Implementierungsdetails
- Datenbanksyntax
- konkrete Seed-Skripte
- Pixel-UI

Sie beschreiben:
- den fachlichen Ablauf aus Nutzersicht

---

## 3. Grundregeln für alle Flows

Für alle Flows gelten diese Grundregeln:

1. Jeder Flow startet in einem klaren fachlichen Ausgangszustand.
2. Jeder Flow hat einen klaren Nutzer oder Rollenträger.
3. Jeder Flow führt zu einem nachvollziehbaren Ergebnis.
4. Workflowstatus, Rechte und Sichtbarkeit gelten immer mit.
5. Alle Schritte müssen später testbar und reproduzierbar sein.
6. JSON, MDX und technische Details sind nicht Teil normaler Arbeitsflows.

## 3.1 Regel fuer serverseitige Teilupdates

Wenn im Document Detail HTMX genutzt wird, bleiben die Flows serverseitig gerendert.
Teilupdates muessen alle fachlich betroffenen Bereiche gemeinsam aktualisieren:

- Save und Workflow-Statuswechsel ziehen Header und History mit
- Formular-Lookups bleiben auf den Formular-/Workflow-Bereich begrenzt
- Journal- und Attachment-Aktionen aktualisieren ihr eigenes Panel und zusaetzlich nur die wirklich betroffenen Nachbarbereiche
- Form-Saves, Submits und Lookups sollen den Nutzer im laufenden Formularbereich halten und keine unnoetigen Spruenge in tiefere Seitenbereiche ausloesen
- lokale Formular-Teilaktionen sollen nur den fachlich passenden Formularabschnitt als Hauptfragment nachladen und sichtbare Statusleisten darueber nur gezielt OOB aktualisieren
- die normale Arbeits-UI bleibt dabei ruhig: kurze Statuszeilen statt grosser Hinweisbloecke, keine wiederholten Metaerklaerungen, kein dauerhafter Readonly-Erklaertext

---

## 4. Beteiligte Hauptrollen in den Flows

Die führenden Rollen in den Flows sind:

- Fachadministrator
- Prozessverantwortlicher
- Editor
- Approver
- allgemeiner User mit Sichtrechten

Im MVP ohne Login wird der jeweilige User-Kontext per User-Selektion gewählt.

---

## 5. Hauptgruppen von Flows

Die Flows des MVP gliedern sich in fünf Gruppen:

1. Template- und Workflow-Konfigurationsflows
2. Document-Start- und Zuweisungsflows
3. Bearbeitungs- und Freigabeflows
4. Integrationsflows
5. Archivierungs- und Versionsflows

Ein neuer sichtbarer Integrationsfluss ist jetzt zusaetzlich vorhanden:

- API-Katalog oeffnen
- Operationen lesen
- Formulardaten als JSON oder CSV abrufen
- Customers oder Products per CSV importieren

Ein zweiter produktiver Dokumentfluss neben dem Handwerker-Auftrag ist jetzt ausdruecklich vorgesehen:

- Produktionsdokumentation mit Batch-/Serienbezug
- tabellarischen Produktions- oder Pruefschritten
- produktzentriert statt kundenauftragszentriert

---

## 6. Flow: Form Template erstellen

## 6.1 Ziel

Ein neues Form Template wird in Draft angelegt.

## 6.2 Beteiligte Rolle

- Fachadministrator
- Template-Verantwortlicher

## 6.3 Ausgangslage

- der Nutzer befindet sich im Templates-Bereich
- ein neues Template soll angelegt werden

## 6.4 Ablauf

1. Nutzer öffnet `Templates`
2. Nutzer wählt `New Template`
3. Nutzer erfasst:
   - Key
   - Name
   - Beschreibung
4. Nutzer weist ein Workflow Template zu
5. Nutzer weist Groups zu
6. Nutzer definiert Tabellenfelder
7. Nutzer erfasst oder bearbeitet das MDX des Formulars
8. Nutzer speichert das Template

## 6.5 Ergebnis

- ein neues Form Template existiert
- Status = `draft`
- es ist noch nicht für neue Documents nutzbar

---

## 7. Flow: Workflow Template erstellen

## 7.1 Ziel

Ein neues Workflow Template wird in Draft angelegt.

## 7.2 Beteiligte Rolle

- Fachadministrator
- Prozessverantwortlicher

## 7.3 Ausgangslage

- der Nutzer befindet sich im Workflows-Bereich
- ein neuer Workflow soll angelegt werden

## 7.4 Ablauf

1. Nutzer öffnet `Workflows`
2. Nutzer wählt `New Workflow`
3. Nutzer erfasst:
   - Key
   - Name
   - Beschreibung
4. Nutzer erstellt das Workflow-JSON
5. Nutzer prüft:
   - Initialstatus
   - Statusliste
   - Actions
   - Feldregeln
   - Approval-Modell
   - Hooks
6. Nutzer speichert den Workflow

## 7.5 Ergebnis

- ein neues Workflow Template existiert
- Status = `draft`
- es ist noch nicht aktiv produktiv nutzbar

---

## 8. Flow: Form Template publizieren

## 8.1 Ziel

Ein Draft-Template wird produktiv freigegeben.

## 8.2 Beteiligte Rolle

- Fachadministrator
- Template-Verantwortlicher

## 8.3 Ausgangslage

- ein Form Template liegt als `draft` vor
- es ist fachlich geprüft

## 8.4 Ablauf

1. Nutzer öffnet `Template Detail` oder `Template Edit`
2. Nutzer prüft:
   - Meta
   - Workflow-Zuweisung
   - Groups
   - Tabellenfelder
   - MDX / Preview
3. Nutzer wählt `Publish`

## 8.5 Ergebnis

- das Template erhält Status `published`
- neue Documents dürfen aus dieser Version gestartet werden
- ältere bisher aktive Versionen werden archiviert oder funktional deaktiviert

---

## 9. Flow: Workflow Template publizieren

## 9.1 Ziel

Ein Draft-Workflow wird produktiv freigegeben.

## 9.2 Beteiligte Rolle

- Fachadministrator
- Prozessverantwortlicher

## 9.3 Ausgangslage

- ein Workflow Template liegt als `draft` vor
- das JSON ist fachlich geprüft

## 9.4 Ablauf

1. Nutzer öffnet `Workflow Detail` oder `Workflow Edit`
2. Nutzer prüft:
   - Statusfolge
   - Actions
   - Rollen
   - Feldregeln
   - Hooks
3. Nutzer wählt `Publish`

## 9.5 Ergebnis

- der Workflow erhält Status `published`
- neue oder neu veröffentlichte Form Templates können diese Version nutzen
- alte aktive Versionen werden archiviert oder funktional deaktiviert

---

## 10. Flow: Document starten

## 10.1 Ziel

Ein neues Document wird aus einem publizierten Template erzeugt.

## 10.2 Beteiligte Rolle

- allgemeiner User
- Editor

## 10.3 Ausgangslage

- ein Form Template ist `published`
- die zugeordnete Workflow-Version ist `published`
- der User darf das Template sehen
- der User befindet sich z. B. in `My Templates`

## 10.4 Ablauf

1. Nutzer öffnet `My Workspace` oder `Templates`
2. Nutzer wählt ein publiziertes Template
3. Nutzer startet `New Document`
4. System erzeugt ein Document mit:
   - gebundener Template-Version
   - gebundener Workflow-Version
   - Initialstatus des Workflows

## 10.5 Ergebnis

- ein neues Document existiert
- das Document ist an Template- und Workflow-Version gebunden
- das Document erscheint in relevanten Listen
- spaetere Aenderungen an neueren Template- oder Workflow-Versionen wirken nicht rueckwirkend auf dieses Document

---

## 11. Flow: Document zuweisen

## 11.1 Ziel

Ein Document wird Editors und/oder Approvers zugewiesen.

## 11.2 Beteiligte Rolle

- Editor oder anderer berechtigter Nutzer
- je nach Workflowkontext

## 11.3 Ausgangslage

- ein Document existiert
- der aktuelle Status erlaubt `assign`

## 11.4 Ablauf

1. Nutzer öffnet `Document Detail`
2. Nutzer wählt `Assign`
3. Nutzer weist zu:
   - einen oder mehrere Editors
   - einen oder mehrere Approvers
4. System speichert Assignments
5. Workflowstatus springt in den Zielstatus der Assign-Action

## 11.5 Ergebnis

- Assignments sind gesetzt
- das Document ist zugewiesen
- relevante Tasks können sichtbar werden
- Audit enthält `assigned`

---

## 12. Flow: Document starten / Bearbeitung beginnen

## 12.1 Ziel

Der Editor beginnt die eigentliche Bearbeitung des Documents.

## 12.2 Beteiligte Rolle

- Editor

## 12.3 Ausgangslage

- das Document ist dem Editor zugewiesen
- der Workflowstatus erlaubt `start`

## 12.4 Ablauf

1. Editor öffnet `Document Detail`
2. Editor wählt `Start`
3. Workflowstatus springt in den Bearbeitungsstatus
4. die dafür vorgesehenen Felder werden editierbar

## 12.5 Ergebnis

- das Document befindet sich im Bearbeitungskontext
- die vorgesehenen Felder sind editierbar
- Audit enthält `started`

---

## 13. Flow: Document bearbeiten und speichern

## 13.1 Ziel

Ein Editor bearbeitet das Formular und speichert Zwischenstände.

## 13.2 Beteiligte Rolle

- Editor

## 13.3 Ausgangslage

- das Document ist im Bearbeitungsstatus
- relevante Felder sind editierbar

## 13.4 Ablauf

1. Editor öffnet `Document Detail`
2. Editor bearbeitet sichtbare und erlaubte Felder
3. Editor ergänzt ggf.:
   - Checkbox-/Radio-Werte
   - Journal-Einträge
   - Attachments
4. Editor wählt `Save`
5. System speichert die Formulardaten

## 13.5 Ergebnis

- `dataJson` ist aktualisiert
- Journal ist aktualisiert
- Attachments sind aktualisiert
- Audit enthält `saved`
- der Workflowstatus bleibt oder wechselt gemäß Workflowregel, z. B. nach `progressed`
- sichtbare Pflichtmarkierungen und Readonly-Zustaende bleiben am aktuellen Schritt und Submit-Gate ausgerichtet
- lookup-vorbefuellte Felder duerfen editierbar bleiben, ohne dadurch automatisch Pflichtfelder zu werden
- HTML-/Rich-Text-Felder muessen ihren gespeicherten Inhalt nach Save wieder im Formularkontext zeigen und spaeter readonly sauber anzeigen
- kleine Signatur-Controls duerfen im offenen Formular signiert werden und werden nach Submit oder spaeterem readonly Status gesperrt
- readonly Referenzen auf andere Formulare duerfen im laufenden Document sichtbar werden, wenn sie sich fachlich aus den aktuellen Formularwerten ergeben
- Formularheader, Feldabstaende und Nebenbereiche sollen auf hohe Informationsdichte ohne visuelle Unruhe optimiert bleiben

---

## 14. Flow: Document submitten

## 14.1 Ziel

Ein Editor gibt das Document in den Freigabekontext.

## 14.2 Beteiligte Rolle

- Editor

## 14.3 Ausgangslage

- das Document wurde bearbeitet
- der Workflowstatus erlaubt `submit`
- Validierungen sind erfüllt

## 14.4 Ablauf

1. Editor öffnet `Document Detail`
2. Editor prüft das Formular
3. Editor wählt `Submit`
4. System prüft:
   - Pflichtfelder
   - Workflowregeln
   - Berechtigungen
5. Workflowstatus springt in `submitted`

## 14.5 Ergebnis

- das Document ist submitted
- Felder sind typischerweise readonly
- Approver-Kontext wird relevant
- Audit enthält `submitted`

---

## 15. Flow: Document approven

## 15.1 Ziel

Ein Approver gibt das Document frei.

## 15.2 Beteiligte Rolle

- Approver

## 15.3 Ausgangslage

- das Document ist `submitted`
- der Approver ist zugewiesen
- der Workflow erlaubt `approve`

## 15.4 Ablauf

1. Approver öffnet `Document Detail`
2. Approver prüft:
   - Work Summary
   - Form
   - Attachments
   - Journal
   - History
3. Approver wählt `Approve`
4. System prüft:
   - Rolle
   - Action-Zulässigkeit
   - Completion-Regel
5. Status springt nach Regel auf `approved`

## 15.5 Ergebnis

- das Document ist freigegeben
- Audit enthält `approved`
- Hooks können automatisch ausgeführt werden

---

## 16. Flow: Document rejecten

## 16.1 Ziel

Ein Approver weist ein Document zur weiteren Bearbeitung zurück.

## 16.2 Beteiligte Rolle

- Approver

## 16.3 Ausgangslage

- das Document ist `submitted`
- der Workflow erlaubt `reject`

## 16.4 Ablauf

1. Approver öffnet `Document Detail`
2. Approver wählt `Reject`
3. System setzt den Zielstatus gemäß Workflow
4. Bearbeitungskontext wird wieder aktiv

## 16.5 Ergebnis

- das Document ist zurück im Bearbeitungsfluss
- Audit enthält `rejected`

---

## 17. Flow: Document neu zuweisen

## 17.1 Ziel

Ein laufendes Document wird erneut zugewiesen.

## 17.2 Beteiligte Rolle

- berechtigter Editor
- Approver
- anderer fachlich zulässiger Nutzer je Workflow

## 17.3 Ausgangslage

- das Document existiert
- der Workflow erlaubt `reAssign`

## 17.4 Ablauf

1. Nutzer öffnet `Document Detail`
2. Nutzer wählt `Re-Assign`
3. Nutzer ändert Editors und/oder Approvers
4. System speichert neue Assignments
5. Workflow springt gemäß Definition nach `assigned` oder bleibt in einem kontrollierten Zwischenstatus

## 17.5 Ergebnis

- neue Verantwortlichkeiten sind gesetzt
- Audit enthält `re_assigned`

---

## 18. Flow: Form Action ausführen

## 18.1 Ziel

Ein Nutzer löst eine fachliche Formularaktion aus, die eine TypeScript-Operation ausführt.

## 18.2 Beteiligte Rolle

- typischerweise Editor
- je nach Sichtbarkeit und Action-Regel

## 18.3 Ausgangslage

- das Document ist sichtbar
- die Form Action ist sichtbar und zulässig

## 18.4 Ablauf

1. Nutzer öffnet `Document Detail`
2. Nutzer klickt eine Form Action, z. B.:
   - `Create Customer Order`
   - `Create Batch`
3. System löst die referenzierte `operationRef` aus
4. die Operation liest aus:
   - data
   - external
   - snapshot
   - integrationContext
   - requestMapping
5. die Rückgabewerte werden in Zielbereiche gemappt

## 18.5 Ergebnis

- eine fachliche Folgeoperation wurde ausgeführt
- Rückgabewerte sind gespeichert
- Audit enthält `action_executed`

---

## 19. Flow: Workflow Hook ausführen

## 19.1 Ziel

Ein Workflow-Übergang löst automatisch eine Operation aus.

## 19.2 Beteiligte Rolle

- kein direkter UI-Nutzer als Auslöser
- fachlich ausgelöst durch den Übergang eines Users

## 19.3 Ausgangslage

- ein definierter Transition Trigger tritt ein
- der Workflow enthält einen passenden Hook

## 19.4 Ablauf

1. ein User führt eine Workflow Action aus, z. B. `Approve`
2. der Statusübergang tritt ein
3. das System erkennt einen passenden Hook
4. die referenzierte Operation wird ausgeführt
5. Rückgabewerte werden in die Zielbereiche geschrieben

## 19.5 Ergebnis

- der Hook ist gelaufen
- technische oder fachliche Rückgabewerte sind gespeichert
- Audit enthält `workflow_hook_executed`

---

## 20. Flow: Attachment hochladen

## 20.1 Ziel

Ein Nutzer ergänzt einen Nachweis als Datei.

## 20.2 Beteiligte Rolle

- typischerweise Editor
- ggf. andere Rolle, wenn erlaubt

## 20.3 Ausgangslage

- das Document ist sichtbar
- der Attachment-Bereich ist sichtbar
- Upload ist zulässig
- der Bereich zeigt klar, ob Upload im aktuellen Kontext erlaubt ist und warum nicht, falls er gesperrt ist

## 20.4 Ablauf

1. Nutzer öffnet `Document Detail`
2. Nutzer wählt `Upload`
3. Nutzer lädt Datei hoch
4. System speichert Datei und Metadaten
5. die Datei erscheint in der Attachment-Liste
6. Summary und Zähler im Attachment-Bereich sind aktualisiert

## 20.5 Ergebnis

- ein Attachment ist mit dem Document verknüpft
- Audit enthält `attachment_uploaded`

---

## 21. Flow: Journal pflegen

## 21.1 Ziel

Ein Nutzer ergänzt oder bearbeitet strukturierte wiederholbare Journaldaten.

## 21.2 Beteiligte Rolle

- typischerweise Editor

## 21.3 Ausgangslage

- das Journal-Feld ist sichtbar
- das Journal ist im aktuellen Status editierbar
- vorhandene Einträge werden als vollbreite Tabelle mit neuestem Eintrag oben dargestellt

## 21.4 Ablauf

1. Nutzer öffnet `Document Detail`
2. Nutzer ergänzt einen neuen Journal-Eintrag
3. der neue Eintrag erscheint oben in der Tabelle
4. bei Bedarf öffnet Nutzer die Vollansicht des Eintrags in einem modalen Dialog

## 21.5 Ergebnis

- das Journal im `dataJson` ist aktualisiert
- Audit enthält mindestens `journal_added`

---

## 22. Flow: Document archivieren

## 22.1 Ziel

Ein abgeschlossenes Document wird aus dem aktiven Arbeitskontext genommen.

## 22.2 Beteiligte Rolle

- typischerweise Approver
- oder andere im Workflow zugelassene Rolle

## 22.3 Ausgangslage

- der Workflow erlaubt `archive`
- das Document ist in einem archivierungsfähigen Status

## 22.4 Ablauf

1. Nutzer öffnet `Document Detail`
2. Nutzer wählt `Archive`
3. System setzt den Status auf `archived`

## 22.5 Ergebnis

- das Document ist archiviert
- es erscheint standardmäßig nicht mehr in offenen Arbeitslisten
- Audit enthält `archived`

---

## 23. Flow: Neue Template-Version veröffentlichen

## 23.1 Ziel

Eine neue Template-Version ersetzt die bisher aktive Produktivversion.

## 23.2 Beteiligte Rolle

- Fachadministrator
- Template-Verantwortlicher

## 23.3 Ausgangslage

- eine neue Draft-Version existiert
- die bisherige Produktivversion ist veröffentlicht

## 23.4 Ablauf

1. Nutzer öffnet `Template Edit`
2. Nutzer prüft neue Version
3. Nutzer wählt `Publish`
4. System setzt:
   - neue Version = `published`
   - bisher aktive Version = `archived`

## 23.5 Ergebnis

- neue Documents starten mit der neuen Version
- laufende Documents bleiben auf der alten Version

---

## 24. Flow: Neue Workflow-Version veröffentlichen

## 24.1 Ziel

Eine neue Workflow-Version ersetzt die bisher aktive Produktivversion.

## 24.2 Beteiligte Rolle

- Fachadministrator
- Prozessverantwortlicher

## 24.3 Ausgangslage

- eine neue Draft-Version des Workflows existiert
- eine alte Produktivversion ist aktiv

## 24.4 Ablauf

1. Nutzer öffnet `Workflow Edit`
2. Nutzer prüft neue Version
3. Nutzer wählt `Publish`
4. System setzt:
   - neue Version = `published`
   - alte aktive Version = `archived`

## 24.5 Ergebnis

- neue oder neu veröffentlichte Templates können die neue Workflow-Version nutzen
- laufende Documents auf alter Workflow-Version bleiben unverändert

---

## 25. Flow: Workspace als täglicher Einstieg

## 25.1 Ziel

Der User soll seine tägliche Arbeit vom Workspace aus verstehen und beginnen können.

## 25.2 Beteiligte Rolle

- jeder Arbeitsnutzer

## 25.3 Ablauf

1. Nutzer wählt sich als aktiven User
2. Nutzer sieht:
   - My Groups
   - My Tasks
   - My Templates
   - My Documents
3. Nutzer entscheidet den nächsten Einstieg:
   - Task öffnen
   - Document öffnen
   - neues Document aus Template starten

## 25.4 Ergebnis

- der Workspace funktioniert als arbeitsorientierter Einstiegspunkt

---

## 26. Flow: Qualification Record mit mehreren Beteiligten

## 26.1 Ziel

Ein Qualifikations- oder Nachweisdokument wird mehreren Users zugewiesen, wobei jeder Beteiligte seinen persoenlichen Stand speichert, signiert und submitted.

## 26.2 Beteiligte Rolle

- Owner / Verantwortlicher
- mehrere Teilnehmende
- spaeter im Flow ein Reviewer oder Approver

## 26.3 Ausgangslage

- ein `Qualification Record` ist gestartet
- Owner und Teilnehmende sind im Document gebunden
- der Workflow nutzt fuer `submit` einen sichtbaren `AND`-Modus

## 26.4 Ablauf

1. Owner oeffnet das Document und pflegt die globalen Kopfdaten
2. Teilnehmende oeffnen dasselbe Document und sehen ihren eigenen Formularstand
3. jeder Beteiligte speichert und signiert fuer sich
4. ein erster Beteiligter submitted
5. die UI zeigt kompakt, wer bereits fertig ist und wer noch offen ist
6. erst wenn alle erforderlichen Beteiligten submitted haben, wechselt das Document nach `submitted`
7. danach kann der zustaendige Approver freigeben oder ablehnen

## 26.5 Ergebnis

- mehrere Users arbeiten im normalen Produktpfad am selben Document
- Save, Submit und Signatur bleiben pro User nachvollziehbar
- Rollen und `AND`/`OR` werden im Live-Workflow sichtbar ausgewertet

---

## 27. Nicht Bestandteil der führenden User Flows

Nicht Bestandteil der führenden MVP-Flows sind:

- visueller Builder-Flow
- generische Connector-Admin-Flows
- Secret-Store-Verwaltung
- OAuth-Konfigurationsflüsse
- Multitenancy-Flows
- frei modellierbare Low-Code-Flows
- technische Debug-Flows als Standardnutzung

---

## 28. Ergebnisregel

Die in diesem Dokument beschriebenen User Flows sind die führenden fachlichen Kernabläufe des MVP.

Spätere Implementierungen, Seeds und Testabläufe dürfen davon abweichen **nur**, wenn dieses Dokument zuerst angepasst wird.
