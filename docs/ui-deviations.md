# UI-Abweichungen zum Alt-Spec-Stand

Stand: verdichtete Abnahmesicht auf UI-nahe Alt-Spec-Lücken.

## UI-Lücken, die inzwischen geschlossen sind

- Documents haben echte Detailsicht statt Placeholder
  - Code: `src/views/pages/documents.ejs`, `src/views/pages/document-detail.ejs`
- Templates haben Liste, Einzelansicht und New-Pfad statt Inline-Review unter der Tabelle
  - Code: `src/views/pages/templates.ejs`, `src/views/pages/template-detail.ejs`, `src/views/pages/template-new.ejs`
- Workflows haben Liste, Einzelansicht und New-Pfad statt Inline-Review unter der Tabelle
  - Code: `src/views/pages/workflows.ejs`, `src/views/pages/workflow-detail.ejs`, `src/views/pages/workflow-new.ejs`
- Admin ist nicht mehr nur Read-only für Users und Groups
  - Code: `src/views/pages/admin.ejs`, `src/views/pages/admin-user-*.ejs`, `src/views/pages/admin-group-*.ejs`
- Memberships und Template Assignments sind im Admin nicht mehr nur statisch
  - Code: `src/views/pages/admin-user-detail.ejs`, `src/views/pages/admin-group-detail.ejs`, `src/views/pages/template-detail.ejs`

## UI-Punkte, die nur teilweise alt-spec-nah sind

- Workspace
  - Code: `src/views/pages/workspace.ejs`
  - Stand: gute Arbeitsübersicht mit Links und kleinem Start-Einstieg, aber noch kein weitergehender persönlicher Arbeitsfeed oder variantenspezifischer Screen
- Templates
  - Code: `src/views/pages/templates.ejs`, `src/views/pages/template-detail.ejs`
  - Stand: Liste und Detail sind brauchbar, aber keine echte Tab-Familie und kein Edit-Screen
- Workflows
  - Code: `src/views/pages/workflows.ejs`, `src/views/pages/workflow-detail.ejs`
  - Stand: Liste und Detail sind brauchbar, aber keine echte Tab-Familie und kein Edit-Screen
- Documents List
  - Code: `src/views/pages/documents.ejs`
  - Stand: Such-/Status-/Archivschnitt vorhanden, aber noch keine spec-nahe Trennung `My Documents` vs. `Documents by Template`
- Document Detail
  - Code: `src/views/pages/document-detail.ejs`
  - Stand: funktional weit, aber noch ohne klar getrennten `Work Summary`-Bereich und mit starker Vermischung von Arbeits- und Review-Sicht
- Admin
  - Code: `src/views/pages/admin.ejs`, `src/views/pages/admin-user-*.ejs`, `src/views/pages/admin-group-*.ejs`
  - Stand: erste echte Pflegepfade vorhanden, aber noch keine untergliederte Verwaltungs-UI

## UI-Themen, die bewusst erst in der neuen Richtung angegangen werden sollen

- Technische Review-Sicht von `Document Detail` sauber aus der Arbeitsseite herauslösen
  - Heute sichtbar in: `src/views/pages/document-detail.ejs`
  - Grund: weitere Alt-Ausbauten würden die Mischseite weiter vergrößern
- Vollständige Form-/MDX-Darstellung als spätere vereinfachte Richtung
  - Heute sichtbar in: `src/modules/templates/form-read.ts`, `src/views/pages/document-detail.ejs`
  - Grund: gehört in die kommende vereinfachte MDX-Richtung, nicht in weiteren Alt-Spec-Lückenschluss
- Größerer UI-Umbau für Templates/Workflows/Admin
  - Heute sichtbar in: `src/views/pages/templates.ejs`, `src/views/pages/workflows.ejs`, `src/views/pages/admin.ejs`
  - Grund: der aktuelle kleine List/Detail/New-Kern reicht als Abnahmestand; größere Screen-Familien sollen erst nach der Richtungsentscheidung kommen

## Stärkste verbleibende Vermischung von Arbeits-UI und Technik-/Spec-Sicht

- am stärksten: `src/views/pages/document-detail.ejs`
- mittel: `src/views/pages/template-detail.ejs`
- mittel: `src/views/pages/workflow-detail.ejs`

## Screens, die bewusst nicht als alt-spec-vollständig markiert werden

- `Template Edit`
- `Workflow Edit`
- `Documents by Template`
- tiefere Admin-Unterbereiche über den aktuellen Pflegekern hinaus
