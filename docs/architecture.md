# Architektur und Ist-Stand für mdx_form_processor

## Zweck

Dieses Dokument beschreibt den **tatsächlichen aktuellen Stand** des Repos und dient als technische Leitplanke für die nächsten Codex-Schritte.

Führend bleiben die Produktspezifikationen unter `specs/`.

Dieses Dokument trennt bewusst zwischen:

- aktuellem Implementierungsstand
- noch offenen Alt-Spec-Lücken
- späterer, separat vorzubereitender Richtungsänderung
- Alt-Spec-Abnahmepunkt und nächster Entscheidungsphase

## Führende Quellen

Für den aktuellen Stand besonders relevant:

- `specs/00_decision_record.md`
- `specs/01_mvp_scope.md`
- `specs/03_domain_model.md`
- `specs/04_form_mdx_spec.md`
- `specs/05_workflow_json_spec.md`
- `specs/07_permissions_visibility_spec.md`
- `specs/08_versioning_lifecycle_spec.md`
- `specs/09_navigation_information_architecture.md`
- `specs/10_screen_spec_workspace.md`
- `specs/11_screen_spec_templates.md`
- `specs/12_screen_spec_workflows.md`
- `specs/13_screen_spec_documents.md`
- `specs/14_screen_spec_admin.md`
- `specs/17_reference_data_spec.md`
- `specs/18_validation_and_rules.md`
- `specs/19_non_goals_and_future_scope.md`
- `specs/20_sample_data_seed.md`

## Leitentscheidungen

Der aktuelle Stand folgt weiterhin diesen Grundentscheidungen:

- Laufzeitdaten liegen in Postgres.
- Web-Server und Routing laufen auf Node.js + Fastify.
- Der Anwendungscode ist TypeScript.
- Serverseitiges Rendering erfolgt mit EJS.
- Die App ist mono-tenant.
- Das MVP arbeitet ohne Auth; der Kontext wird über User-Selektion bestimmt.
- Form-Definitionen werden aus `form_templates.mdx_body` gelesen.
- Workflow-Definitionen werden aus `workflow_templates.workflow_json` gelesen.
- Operationen bleiben als TypeScript-Referenzen modelliert, werden aktuell aber noch nicht ausgeführt.

## Aktueller Systemzuschnitt

### 1. Web Shell

Der Web-Schnitt ist produktiv vorhanden:

- Fastify-App und Server-Entry
- EJS-Rendering mit gemeinsamem Layout
- Hauptnavigation
- User-Selektion über Query-Kontext
- formulargestützte POST-Routen für kleine MVP-Arbeitsschritte
- schließbarer HTML-Fehlerdialog für HTML-basierte Fehlerpfade

Zentrale Dateien:

- `src/app.ts`
- `src/server.ts`
- `src/routes/web.ts`
- `src/views/layouts/main.ejs`
- `src/public/js/app.js`
- `src/public/css/app.css`

### 2. Persistenzbasis

Die Persistenzbasis ist nicht mehr nur vorbereitet, sondern aktiv im Einsatz:

- SQL-Grundschema für Kernobjekte liegt vor
- Migrationslauf ist über Skript nutzbar
- reproduzierbarer Reference Rebuild ist vorhanden
- Seed-Daten decken Nutzer, Gruppen, Templates, Workflows, Documents, Assignments, Tasks, Attachments und Audit ab

Zentrale Dateien:

- `sql/001_initial_schema.sql`
- `src/db/migrate.ts`
- `src/db/seed-reference.ts`
- `src/db/reference-data.ts`
- `src/db/rebuild-reference.ts`
- `src/db/pool.ts`

### 3. Read-Layer

Es existiert ein kleiner modulbezogener DB-Read-Layer unter `src/modules/*/read.ts`.

Aktiv genutzt werden Read-Pfade für:

- users
- groups
- memberships
- templates
- workflows
- documents
- assignments
- attachments
- audit

Die Hauptseiten und die Document-Detailseite lesen nicht mehr aus `sample-data.ts`, sondern über den DB-Layer und `src/services/app-context.ts`.

Konsolidierte kleine Regel im aktuellen Alt-Spec-Modell:

- Template-Sichtbarkeit läuft im Laufzeitpfad über aktive `template_assignments` plus Membership-Recht `r`.
- Document-Sichtbarkeit läuft über sichtbares Template plus denselben Membership-Kontext.
- Bearbeitungsnahe Aktionen wie Save, Journal Add und Attachment Upload setzen zusätzlich aktive Editor-Zuweisung plus Membership-Recht `w` voraus.
- Workflow-Aktionen wie Submit, Approve, Reject und Archive setzen sichtbares Document, passende Dokumentrolle, zulässigen Status und Membership-Recht `x` voraus.

### 4. Document-Arbeitsfluss

Im aktuellen Stand existiert ein kleiner, aber echter Arbeitsfluss für Documents:

- Start eines Documents aus publiziertem Template
- Save einfacher Formwerte nach `documents.data_json`
- Submit
- Approve
- Reject
- Archive

Diese Schritte sind jeweils bewusst klein und als eigene Module geschnitten, nicht als allgemeine Action-Engine.

Zentrale Dateien:

- `src/modules/documents/start.ts`
- `src/modules/documents/save.ts`
- `src/modules/documents/submit.ts`
- `src/modules/documents/approve.ts`
- `src/modules/documents/reject.ts`
- `src/modules/documents/archive.ts`

## Aktueller fachlicher Ist-Stand

### Hauptseiten

Vorhanden und aus Postgres gelesen:

- `/workspace`
- `/templates`
- `/workflows`
- `/documents`
- `/admin`

Die Seiten sind lauffähig und datenbasiert, aber noch nicht durchgehend spec-nah in ihrer finalen UI-Ausprägung.

### Document Detail

Vorhanden:

- `GET /documents/:id`
- read-only Detailkopf
- Assignments
- Tasks
- Attachments
- Audit-History
- Form-Bereich

Die Seite ist aktuell die funktional am weitesten ausgebaute Arbeitsseite.

### Form-Read

Der Form-Bereich liest das verknüpfte `form_templates.mdx_body` aus Postgres.

Aktuell umgesetzt ist **kein vollwertiges MDX-Rendering**, sondern ein kleiner lokaler Analyse-/Leseschnitt:

- Frontmatter-Auslese
- Sections
- Fields
- Actions
- workflowbasierte `fieldRules`-Einbeziehung
- read-only Darstellung
- kleine Save-Freigabe für einfache Feldtypen

Zentrale Datei:

- `src/modules/templates/form-read.ts`

### Start / Save / Submit / Approve / Reject / Archive

Aktuell umgesetzt:

- Start legt ein neues Document an und schreibt initiale Audit-Einträge.
- Save persistiert einfache Werte in `documents.data_json`.
- Submit / Approve / Reject / Archive lesen jeweils die konkrete Transition aus dem verknüpften Workflow-Template.
- Der Statuswechsel wird persistiert.
- Audit-Events werden fortgeschrieben.
- Form-Bearbeitung wird in abgeschlossenen Status read-only.

Wichtig:

- Es gibt weiterhin **keine allgemeine Workflow-Engine**.
- Es gibt weiterhin **keine allgemeine Action-Engine**.
- Es gibt weiterhin **keine Hook- oder Operation-Ausführung**.

### Attachments

Ein erster MVP-Upload-Schnitt ist vorhanden:

- Upload über die Document-Detailseite
- lokale Dateispeicherung unter `storage/attachments`
- Attachment-Metadaten in Postgres
- Anzeige im Attachments-Bereich
- Bild-Thumbnails für Bilddateien
- read-only Content-Route für sichtbare Attachments
- Audit-Eintrag `attachment_uploaded`

Wichtig:

- keine allgemeine Storage-Plattform
- keine Versionierung
- keine Download-/Lifecycle-Architektur über den kleinen MVP-Schnitt hinaus

### Audit

Audit ist im aktuellen Stand ein echter Persistenz- und Anzeige-Schnitt:

- Reference Seed enthält Audit-Events
- Start / Save / Submit / Approve / Reject / Archive / Attachment Upload schreiben Audit-Einträge
- die Document-Detailseite rendert die History aus Postgres

## Alt-Spec-Abnahmepunkt

Der aktuelle Systemkern kann im Alt-Spec-Sinn heute belastbar:

- Reference-Daten reproduzierbar aufbauen
- Hauptseiten aus Postgres lesen
- Templates, Workflows, Documents, Users und Groups als echte Objekte aufrufen
- Documents im kleinen MVP-Schnitt starten, speichern und durch die vorhandenen Workflow-Statuspfade führen
- Attachments und Journal-Einträge klein persistieren
- die wichtigsten Admin-Zuordnungen sichtbar und klein pflegbar machen

Gleichzeitig ist die Grenze des Alt-Modells erreicht:

- weitere Alt-Ausbauten würden vor allem bestehende Mischscreens vergrößern
- Parser-, Policy- und Action-Logik würden ohne neue Zielrichtung nur weiter implizit anwachsen
- der nächste sinnvolle Schritt ist deshalb nicht ungeordneter Feature-Ausbau, sondern Spezifikationsänderung und neue Zielrichtung

## Datenmodell im Ist-Stand

Im aktuellen Schema aktiv relevant:

- `users`
- `groups`
- `memberships`
- `workflow_templates`
- `form_templates`
- `template_assignments`
- `operations`
- `documents`
- `document_assignments`
- `tasks`
- `attachments`
- `audit_events`

Benennungsentscheidung:

- im Code bleibt das Fachmodul `assignments`
- in Postgres heißt die Tabelle `document_assignments`

Diese Entscheidung ist umgesetzt und soll bis auf Weiteres stabil bleiben.

## Repo- und Modulstrategie

Die aktuelle Struktur bleibt führend:

- `specs/` führende Produktspezifikation
- `docs/` technische Begleitdokumente
- `sql/` Schema-Basis
- `src/db/` DB-nahe Laufzeit- und Rebuild-Skripte
- `src/modules/` fachliche Module
- `src/services/` ViewModel- und App-Kontext-Orchestrierung
- `src/routes/` HTTP-Routen
- `src/views/` EJS-Templates
- `src/public/` Assets

Regel:

- keine DB-Zugriffe in Views
- keine Sample-Daten als Primärquelle für Hauptseiten
- kein Ausbau über generische Framework-Abstraktionen, wenn ein kleiner lokaler Schnitt reicht

## Tests und Reproduzierbarkeit

Vorhanden:

- `npm run build`
- `npm run db:check`
- `npm run db:migrate`
- `npm run db:seed:reference`
- `npm run db:rebuild:reference`
- `npm run smoke:reference`

Der Smoke-Test baut den Referenzzustand selbst neu auf und prüft den aktuellen Vertikalschnitt einschließlich:

- DB-basierte Hauptseiten
- Document Detail
- Start
- Save
- Submit
- Reject
- Archive
- Attachment Upload
- Attachment Content

## Offene Alt-Spec-Lücken

Nicht oder nur teilweise umgesetzt sind weiterhin:

- spec-nahe Detailseiten für Templates und Workflows
- Such-/Filter-Schnitte auf Listenebene
- Form- und Workflow-Actions gemäß voller Spec
- Hook-/Operation-Ausführung
- differenziertere Rechte-/Policy-Regeln
- vollwertige Konfigurations- und Admin-CRUD-Strecken
- spec-nahe Trennung zwischen Arbeits-UI und Review-/Konfigurations-UI auf allen Screens

Diese Punkte sind **Alt-Spec-Lücken**, aber nicht alle sollten noch in der alten Richtung maximal ausgebaut werden.

## Spätere Richtungsänderung

Eine spätere Korrekturrichtung ist bereits fachlich absehbar, wird aber in diesem Stand **noch nicht umgesetzt**:

- MDX soll später deutlich vereinfacht werden
- API-/Operationsreferenzen sollen später direkter und lokaler werden
- `|` soll später eine harte horizontale Gleichverteilungsregel bilden
- ein UI-Umbau in diese Richtung kommt erst nach Alt-Spec-Verifikation/-Abnahme

Diese Punkte sind bewusst **separat** von den offenen Alt-Spec-Lücken zu behandeln.

## Übergangsregel für die nächste Phase

Bis zur nächsten Produktphase gilt:

- keine weitere implizite Vergrößerung des Alt-Modells ohne neue Spec-Entscheidung
- offene Restpunkte zuerst gegen Abnahme und Nutzen priorisieren
- neue Richtung erst nach bewusstem Änderungsdokument / neuer Spec vorbereiten und umsetzen

## Ergebnisregel für die nächsten Schritte

Bei Konflikten gilt weiterhin:

1. `specs/`
2. dieses Architekturpapier
3. der aktuelle Code

Wenn der Code vom Alt-Spec-Stand abweicht, wird das in der nächsten Phase zuerst transparent dokumentiert und geordnet priorisiert, statt still implizit umzubauen.
