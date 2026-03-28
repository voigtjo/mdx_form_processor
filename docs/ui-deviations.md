# UI-Abweichungen zum Alt-Spec-Stand

## Hauptnavigation

- Grob passend zur Spec
  - Spec: `specs/09_navigation_information_architecture.md`
  - Code: `src/views/layouts/main.ejs`
- Ist-Stand:
  - die fünf führenden Hauptbereiche sind vorhanden
  - User-Selektion ist global sichtbar

## Workspace

- Grob passend
  - Spec: `specs/10_screen_spec_workspace.md`
  - Code: `src/views/pages/workspace.ejs`
- Bereits passend:
  - `My Groups`
  - `My Tasks`
  - `My Templates`
  - `My Documents`
- Abweichungen:
  - keine direkte Template-Detailöffnung aus `My Templates`
  - keine Schnellaktionen ausser dem kleinen Document-Start aus `My Templates`
  - die Seite bleibt ein ruhiger Uebersichtsschnitt und noch kein weitergehender persoenlicher Arbeitsfeed

## Templates

- Teilweise spec-nahe Listen-, Detail- und New-Sicht
  - Spec: `specs/11_screen_spec_templates.md`
  - Code: `src/views/pages/templates.ejs`, `src/views/pages/template-detail.ejs`, `src/views/pages/template-new.ejs`
- Ist-Stand:
  - Listensicht mit sichtbarem Status, Version, Workflow- und Group-Zuordnung sowie Detailsprung
  - eigene Template-Detailseite mit `Overview`, `Form`, `Workflow`, `Integrations`, `Versions` und `Documents`
  - kleine New-Seite fuer Draft-Anlage
- Abweichungen:
  - kein Template Edit
  - keine echte Tab-Navigation `Overview / Form / Workflow / Integrations / Versions / Documents`
  - keine bearbeitbare Edit-Sicht
  - Listenfilter fuer Suche / Status / Group fehlen noch

## Workflows

- Teilweise spec-nahe Listen-, Detail- und New-Sicht
  - Spec: `specs/12_screen_spec_workflows.md`
  - Code: `src/views/pages/workflows.ejs`, `src/views/pages/workflow-detail.ejs`, `src/views/pages/workflow-new.ejs`
- Ist-Stand:
  - Listensicht mit sichtbarem Status, Version, Initialstatus und lesbarer Haupt-Statusfolge sowie Detailsprung
  - eigene Workflow-Detailseite mit `Overview`, `Action Overview`, `Hooks`, `JSON`, `Usage` und `Versions`
  - kleine New-Seite fuer Draft-Anlage
- Abweichungen:
  - kein Workflow Edit
  - keine echte Tab-Navigation `Overview / JSON / Hooks / Usage`
  - keine bearbeitbare Edit-Sicht
  - Listenfilter fuer Suche / Status fehlen noch

## Documents List

- Teilweise passend, aber noch nicht spec-nah
  - Spec: `specs/13_screen_spec_documents.md`
  - Code: `src/views/pages/documents.ejs`
- Bereits passend:
  - sichtbare Documents
  - Status
  - Template-Bezug
  - Workflow-Bezug in der Liste
  - Link in die Detailseite
  - kleiner Start-Einstieg
  - kleiner Such-/Status-/Archivfilter
- Abweichungen:
  - keine Trennung von `My Documents` und `Documents by Template`
  - keine Templatefilterung
  - die Liste bleibt tabellarisch und noch ohne weitergehende Arbeitszusammenfassung oder gruppierte Varianten

## Document Detail

- Funktional weit, aber UI-seitig abweichend
  - Spec: `specs/13_screen_spec_documents.md`
  - Code: `src/views/pages/document-detail.ejs`
- Bereits vorhanden:
  - Header
  - Assignments
  - Tasks
  - Form-Bereich
  - Attachments
  - Journal in kleinem MVP-Schnitt
  - History
  - Workflow-Aktionspfade
- Abweichungen:
  - Work Summary ist nicht als eigener, klarer Bereich umgesetzt
  - Journal ist vorhanden, aber noch nicht als voll strukturierter wiederholbarer Bearbeitungsbereich mit spaltenbezogener UI
  - Arbeits-UI und Technik-/Spec-Sicht sind vermischt
  - sichtbare Bereiche wie `Template Metadata`, `Sections`, `Fields`, `Actions`, `MDX Source` sind eher Review-/Techniksicht als reine Arbeits-UI
  - primäre Actions liegen im Form-Panel statt klar im Header-Kontext

## Admin

- Read-Übersicht vorhanden, aber nicht spec-nah vollständig
  - Spec: `specs/14_screen_spec_admin.md`
  - Code: `src/views/pages/admin.ejs`
- Bereits passend:
  - Users
  - Groups
  - Memberships
  - Template Assignments
- Abweichungen:
  - keine Unter-Navigation oder Tabs
  - keine Pflegepfade
  - `New User` und `New Group` sind nur UI-Hüllen

## Vermischung von Arbeits-UI und Technik-/Spec-Sicht

- stärkste Vermischung in `src/views/pages/document-detail.ejs`
- schwächere Vermischung in `src/views/pages/templates.ejs` und `src/views/pages/workflows.ejs`
- Ursache im aktuellen Ist-Stand:
  - Document Detail dient gleichzeitig als Arbeitsfläche und als MDX-/Workflow-Verifikationsfläche
  - Templates/Workflows sind noch keine vollwertigen Review-Screens und tragen deshalb Placeholder-Charakter

## Screens ohne spec-nahen Zustand

- Template Detail
- Template Edit
- Workflow Detail
- Workflow Edit
- Documents by Template
- Admin-Unterbereiche mit echten Pflegepfaden
