# Spec-Status Überblick

Stand: Abnahmesicht auf den aktuellen Repo-Ist-Stand gegen die bestehende Alt-Spec unter `specs/`.

## Erfüllt

- Hauptnavigation und Shell `Workspace / Templates / Workflows / Documents / Admin`
  - Spec: `specs/09_navigation_information_architecture.md`
  - Code: `src/views/layouts/main.ejs`, `src/routes/web.ts`, `src/services/app-context.ts`
- Persistenter Reference Seed und Postgres als führende Datenquelle
  - Spec: `specs/17_reference_data_spec.md`, `specs/20_sample_data_seed.md`
  - Code: `sql/001_initial_schema.sql`, `src/db/reference-data.ts`, `src/db/rebuild-reference.ts`
- DB-basierte Hauptseiten statt `sample-data.ts`
  - Spec: `specs/10_screen_spec_workspace.md`, `specs/11_screen_spec_templates.md`, `specs/12_screen_spec_workflows.md`, `specs/13_screen_spec_documents.md`, `specs/14_screen_spec_admin.md`
  - Code: `src/services/app-context.ts`, `src/routes/web.ts`
- Document Detail mit Header, Assignments, Tasks, Attachments, Journal und History
  - Spec: `specs/13_screen_spec_documents.md`, `specs/16_user_flows.md`
  - Code: `src/views/pages/document-detail.ejs`, `src/modules/documents/read.ts`, `src/modules/journal/add.ts`
- Kleiner persistenter Laufzeitpfad für `start`, `save`, `submit`, `approve`, `reject`, `archive`
  - Spec: `specs/05_workflow_json_spec.md`, `specs/08_versioning_lifecycle_spec.md`, `specs/16_user_flows.md`
  - Code: `src/modules/documents/start.ts`, `src/modules/documents/save.ts`, `src/modules/documents/submit.ts`, `src/modules/documents/approve.ts`, `src/modules/documents/reject.ts`, `src/modules/documents/archive.ts`
- Attachment-Upload mit Persistenz, Anzeige, Content-Route und Audit
  - Spec-Nähe: `specs/13_screen_spec_documents.md`
  - Code: `src/modules/attachments/upload.ts`, `src/modules/attachments/read.ts`, `src/routes/web.ts`
- Kleine Admin-Pflegepfade für Users, Groups, Memberships und Template Assignments
  - Spec: `specs/14_screen_spec_admin.md`, `specs/07_permissions_visibility_spec.md`
  - Code: `src/views/pages/admin.ejs`, `src/views/pages/admin-user-*.ejs`, `src/views/pages/admin-group-*.ejs`, `src/modules/users/*.ts`, `src/modules/groups/*.ts`, `src/modules/memberships/*.ts`, `src/modules/templates/assign.ts`
- Kleine konsolidierte Laufzeitregel für Sichtbarkeit und Erlaubnis
  - Spec: `specs/07_permissions_visibility_spec.md`, `specs/16_user_flows.md`
  - Code: `src/modules/documents/access.ts`, `src/modules/templates/read.ts`, `src/modules/documents/read.ts`, `src/modules/documents/*.ts`, `src/modules/attachments/*.ts`

## Teilweise erfüllt

- Workspace als persönliche Arbeits-Startseite
  - Spec: `specs/10_screen_spec_workspace.md`
  - Code: `src/views/pages/workspace.ejs`
  - Stand: My Groups, My Tasks, My Templates und My Documents sind nutzbar; weitergehende Arbeitsfeed-, Schnellaktions- oder Variantenlogik fehlt.
- Templates als spec-nahe Screen-Familie
  - Spec: `specs/11_screen_spec_templates.md`
  - Code: `src/views/pages/templates.ejs`, `src/views/pages/template-detail.ejs`, `src/views/pages/template-new.ejs`
  - Stand: Liste, Detail und kleiner New-Pfad vorhanden; Edit, Filter und vollwertige Screen-Familie fehlen.
- Workflows als spec-nahe Screen-Familie
  - Spec: `specs/12_screen_spec_workflows.md`
  - Code: `src/views/pages/workflows.ejs`, `src/views/pages/workflow-detail.ejs`, `src/views/pages/workflow-new.ejs`
  - Stand: Liste, Detail und kleiner New-Pfad vorhanden; Edit, Filter und vollwertige Screen-Familie fehlen.
- Documents List als vollständiger Arbeitsfinder
  - Spec: `specs/13_screen_spec_documents.md`
  - Code: `src/views/pages/documents.ejs`
  - Stand: Start, Suche, Statusfilter, Archivschalter und Detailsprung vorhanden; `Documents by Template` und weitere spec-nahe Varianten fehlen.
- Form-MDX als vollständige Spec-Interpretation
  - Spec: `specs/04_form_mdx_spec.md`
  - Code: `src/modules/templates/form-read.ts`
  - Stand: kleiner Analyse-/Read-Schnitt für Sections, Fields, Journals und Actions; kein vollwertiges MDX-Rendering.
- Rechte-/Sichtbarkeitsmodell
  - Spec: `specs/07_permissions_visibility_spec.md`
  - Code: `src/modules/documents/access.ts`, `src/services/app-context.ts`
  - Stand: kleiner konsolidierter Runtime-Kern für `r/w/x`, Template Assignment und Dokumentrollen; keine voll ausgearbeitete Policy-Schicht.

## Offen

- Template Edit
  - Spec: `specs/11_screen_spec_templates.md`
  - Code-Lücke: kein Edit-Pfad in `src/routes/web.ts`, keine Edit-View unter `src/views/pages/`
- Workflow Edit
  - Spec: `specs/12_screen_spec_workflows.md`
  - Code-Lücke: kein Edit-Pfad in `src/routes/web.ts`, keine Edit-View unter `src/views/pages/`
- Listenfilter ausserhalb von Documents
  - Spec: `specs/11_screen_spec_templates.md`, `specs/12_screen_spec_workflows.md`
  - Code-Lücke: keine Such-/Filterlogik in `src/routes/web.ts` und den Listen-Views für Templates und Workflows
- Hook- und Operation-Ausführung
  - Spec: `specs/05_workflow_json_spec.md`, `specs/06_operations_spec.md`
  - Code-Lücke: keine Runtime-Ausführung in `src/modules/operations/`
- Weitergehende Admin-Pflegepfade
  - Spec: `specs/14_screen_spec_admin.md`
  - Code-Lücke: kein Delete, keine tieferen Unterbereiche, keine weitergehende Edit-/Filter-Pflege

## Bewusst nicht weiter in Alt-Richtung ausbauen

- Vollständige MDX-/Form-Interpretation im aktuellen Parser
  - Heute: `src/modules/templates/form-read.ts`
  - Grund: gehört in die kommende Richtungsänderung, nicht in weiteren Alt-Spec-Ausbau
- Weitere technische Review-Flächen direkt auf `Document Detail`
  - Heute: `src/views/pages/document-detail.ejs`
  - Grund: die Seite ist bereits an der Grenze zwischen Arbeits-UI und Technik-/Spec-Sicht
- Allgemeine Action-, Policy- oder Workflow-Engine aus den vielen kleinen POST-Pfaden heraus
  - Heute: `src/routes/web.ts`, `src/modules/documents/*.ts`
  - Grund: würde die Alt-Richtung ungeordnet weiter aufblasen
- Große CRUD-/Admin-Plattform
  - Heute: `src/views/pages/admin*.ejs`, `src/routes/web.ts`
  - Grund: der aktuelle Admin-Kern reicht für Alt-Spec-Abnahme; weiterer Ausbau sollte erst nach Richtungsentscheidung erfolgen
