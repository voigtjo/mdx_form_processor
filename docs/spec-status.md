# Spec-Status Überblick

Stand: aktueller Repo-Ist-Stand gegen bestehende Specs.

## Erfüllt

- Hauptnavigation `Workspace / Templates / Workflows / Documents / Admin`
  - Spec: `specs/09_navigation_information_architecture.md`
  - Code: `src/views/layouts/main.ejs`, `src/services/app-context.ts`
- Persistenter Reference Seed mit Postgres als Primärquelle
  - Spec: `specs/17_reference_data_spec.md`, `specs/20_sample_data_seed.md`
  - Code: `sql/001_initial_schema.sql`, `src/db/reference-data.ts`, `src/db/rebuild-reference.ts`
- DB-basierte Hauptseiten statt `sample-data.ts`
  - Spec: `specs/10_screen_spec_workspace.md`, `specs/11_screen_spec_templates.md`, `specs/12_screen_spec_workflows.md`, `specs/13_screen_spec_documents.md`, `specs/14_screen_spec_admin.md`
  - Code: `src/services/app-context.ts`, `src/routes/web.ts`
- Document Detail mit Header, Assignments, Tasks, Attachments und History
  - Spec: `specs/13_screen_spec_documents.md`
  - Code: `src/routes/web.ts`, `src/views/pages/document-detail.ejs`
- Kleiner persistenter Workflow-Schnitt für `start`, `save`, `submit`, `approve`, `reject`, `archive`
  - Spec: `specs/05_workflow_json_spec.md`, `specs/08_versioning_lifecycle_spec.md`
  - Code: `src/modules/documents/*.ts`
- Attachment-Upload mit Audit und lokaler Persistenz
  - Spec-Nähe: `specs/13_screen_spec_documents.md`
  - Code: `src/modules/attachments/upload.ts`, `src/modules/attachments/read.ts`, `src/routes/web.ts`

## Teilweise erfüllt

- Workspace als Arbeits-Startseite
  - Spec: `specs/10_screen_spec_workspace.md`
  - Code: `src/views/pages/workspace.ejs`
  - Stand: Gruppen, Tasks, Templates und Documents sind sichtbar; Tasks und Documents sind jetzt verlinkbar und My Templates bietet einen kleinen Start-Einstieg, weitergehende Task-Schnellaktionen oder Workspace-Varianten fehlen noch.
- Templates als Konfigurations-/Review-UI
  - Spec: `specs/11_screen_spec_templates.md`
  - Code: `src/views/pages/templates.ejs`, `src/views/pages/template-detail.ejs`, `src/views/pages/template-new.ejs`
  - Stand: Listen-, Detail- und kleiner Draft-Neuanlage-Schnitt vorhanden; Status, Version, Workflow-Bezug, Group-Zuordnung, Form-Review, Integrationsbezug, Versionsliste und Documents-Link sind sichtbar, waehrend Edit-, Filter- und vollwertige Tab-Schnitte weiter fehlen.
- Workflows als Konfigurations-/Review-UI
  - Spec: `specs/12_screen_spec_workflows.md`
  - Code: `src/views/pages/workflows.ejs`, `src/views/pages/workflow-detail.ejs`, `src/views/pages/workflow-new.ejs`
  - Stand: Listen-, Detail- und kleiner Draft-Neuanlage-Schnitt vorhanden; Status, Version, Initialstatus, lesbare Haupt-Transitions, Hooks, JSON-Review und Template-/Document-Nutzung sind sichtbar, waehrend Edit- und vollwertige Tab-Schnitte weiter fehlen.
- Documents List als Arbeitsfinder
  - Spec: `specs/13_screen_spec_documents.md`
  - Code: `src/views/pages/documents.ejs`
  - Stand: Liste, Start-Einstieg, Detail-Link, kleine Textsuche, Statusfilter und Archivschalter sind vorhanden; `Documents by Template` und weitergehende spec-nahe Varianten fehlen noch.
- Admin als Verwaltungs-UI
  - Spec: `specs/14_screen_spec_admin.md`
  - Code: `src/views/pages/admin.ejs`
  - Stand: Read-Übersichten vorhanden; keine Pflegepfade.
- Form-Read aus MDX
  - Spec: `specs/04_form_mdx_spec.md`
  - Code: `src/modules/templates/form-read.ts`
  - Stand: lokaler Lese-/Analysepfad für Frontmatter, Sections, Fields und Actions; kein vollwertiges MDX-Rendering.
- Journal im Document Detail
  - Spec: `specs/04_form_mdx_spec.md`, `specs/13_screen_spec_documents.md`, `specs/16_user_flows.md`
  - Code: `src/modules/journal/add.ts`, `src/modules/templates/form-read.ts`, `src/views/pages/document-detail.ejs`, `src/routes/web.ts`
  - Stand: Journal-Einträge werden aus `documents.data_json` gelesen und koennen als kleine Text-Eintraege ergaenzt werden; kein Editieren oder komplexes Tabellenschema.

## Offen

- Template Detail / Template Edit
  - Spec: `specs/11_screen_spec_templates.md`
  - Code-Lücke: `Template Detail` ist vorhanden, `Template Edit` noch nicht
- Workflow Detail / Workflow Edit
  - Spec: `specs/12_screen_spec_workflows.md`
  - Code-Lücke: `Workflow Detail` ist vorhanden, `Workflow Edit` noch nicht
- Such- und Filterschnitte auf Listenebene ausserhalb von Documents
  - Spec: `specs/11_screen_spec_templates.md`, `specs/12_screen_spec_workflows.md`
  - Code-Lücke: keine Such-/Filterlogik in `src/routes/web.ts` und den Listen-Views fuer Templates und Workflows
- Hook- und Operation-Ausführung
  - Spec: `specs/05_workflow_json_spec.md`, `specs/06_operations_spec.md`
  - Code-Lücke: `src/modules/operations/` ist strukturell leer, keine Runtime-Ausführung
- Admin-Pflegepfade
  - Spec: `specs/14_screen_spec_admin.md`
  - Code-Lücke: nur Read-UI

## Abweichend

- Document Detail mischt Arbeits-UI mit Technik-/Spec-Sicht
  - Spec: `specs/09_navigation_information_architecture.md`, `specs/13_screen_spec_documents.md`
  - Code: `src/views/pages/document-detail.ejs`
  - Abweichung: Template Metadata, Sections, Fields, Actions und MDX Source liegen direkt in der Arbeitsseite.
- Templates- und Workflows-Seiten sind aktuell eher kleine Read-/Review-Screens statt der spezifizierten Screen-Familien
  - Spec: `specs/11_screen_spec_templates.md`, `specs/12_screen_spec_workflows.md`
  - Code: `src/views/pages/templates.ejs`, `src/views/pages/workflows.ejs`
- Upload-Persistenz ist lokal-dateibasiert statt als weitergehende DMS-/Storage-Architektur
  - Spec-Nähe: `specs/13_screen_spec_documents.md`
  - Code: `src/modules/attachments/upload.ts`
  - Abweichung: bewusster kleiner MVP-Schnitt
- Fehlerbehandlung läuft aktuell über Dialog-Redirect im HTML-Pfad
  - Code: `src/routes/web.ts`, `src/views/layouts/main.ejs`
  - Abweichung: kein separates, umfassendes Fehlerkonzept aus der Spec abgeleitet

## Richtungsrisiken

- `src/modules/templates/form-read.ts` bildet MDX aktuell per Regex-/Attribut-Analyse aus.
  - Risiko: Alt-Spec-Lückenschluss und spätere vereinfachte MDX-Richtung dürfen nicht vermischt werden.
- `src/views/pages/document-detail.ejs` ist funktional stark gewachsen.
  - Risiko: weitere Produktlogik würde Arbeits-UI und technische Review-Sicht noch stärker vermengen.
- `src/routes/web.ts` bündelt mehrere kleine POST-Arbeitsflüsse.
  - Risiko: ohne saubere Priorisierung droht aus vielen Einzelpfaden implizit doch eine Action-Engine zu werden.
