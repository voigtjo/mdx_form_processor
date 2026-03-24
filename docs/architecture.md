# Zielarchitektur fuer den Greenfield-Start

## Fuehrende Quellen

Die Architektur dieses Repos wird aus den Spezifikationsdateien unter `specs/` abgeleitet. Besonders relevant fuer diesen ersten Stand sind:

- `00_decision_record.md`
- `01_mvp_scope.md`
- `03_domain_model.md`
- `04_form_mdx_spec.md`
- `05_workflow_json_spec.md`
- `09_navigation_information_architecture.md`
- `10_screen_spec_workspace.md`
- `11_screen_spec_templates.md`
- `12_screen_spec_workflows.md`
- `13_screen_spec_documents.md`
- `14_screen_spec_admin.md`
- `19_non_goals_and_future_scope.md`

## Leitentscheidungen

- Laufzeitdaten liegen in Postgres.
- Die App laeuft als Node.js-Anwendung mit Fastify.
- Die Codebasis wird in TypeScript gepflegt.
- Die Web-Oberflaeche rendert serverseitig ueber EJS.
- Die UI folgt einem ruhigen, arbeitsorientierten Material-Design-Stil.
- Form-Definitionen sind MDX.
- Workflow-Definitionen sind JSON.
- Operationen werden als TypeScript-Module geschnitten.
- Das MVP startet mono-tenant und ohne Authentifizierung.
- Nutzerkontext wird ueber User-Selektion statt Login bestimmt.

## Systemschnitt

Die Anwendung wird fuer den MVP in vier klar getrennte Bereiche geschnitten:

1. Web Shell
   Fastify-Server, Rendering, statische Assets und Navigation.
2. Konfiguration
   Templates, Workflows, Operation-Referenzen und Group-Zuweisungen.
3. Laufzeit
   Documents, Assignments, Tasks, Attachments und Audit.
4. Administration
   Users, Groups, Memberships und Template Assignments.

## Domaenenmodule

Die fachlichen Kernmodule werden frueh als eigenstaendige Verzeichnisse angelegt:

- `users`
- `groups`
- `memberships`
- `templates`
- `workflows`
- `documents`
- `operations`
- `assignments`
- `audit`
- `attachments`

Dieser erste Stand liefert nur stabile Modulgrenzen und Typen, aber noch keine volle Fachlogik.

## Datenhaltung

Die relationale Basis bleibt bewusst einfach:

- Organisationsobjekte: `users`, `groups`, `memberships`
- Konfigurationsobjekte: `workflow_templates`, `form_templates`, `template_assignments`, `operations`
- Laufzeitobjekte: `documents`, `assignments`, `attachments`, `audit_events`

JSON-Felder werden gezielt an den in der Spezifikation benannten Stellen verwendet:

- `workflow_json`
- `data_json`
- `external_json`
- `snapshot_json`
- `integration_context_json`
- `payload_json`

## UI-Architektur

Die Hauptnavigation des MVP bleibt flach und stabil:

- My Workspace
- Templates
- Workflows
- Documents
- Admin

Die Seiten trennen sich entlang der Spezifikation in:

- Arbeits-UI: Workspace, Documents
- Konfigurations-UI: Templates, Workflows
- Admin-UI: Admin

## Bewusst nicht in diesem Stand

Folgende Themen werden strukturell nicht vorgezogen:

- visueller Form-Builder
- visueller Workflow-Builder
- Login und Authentifizierung
- Multitenancy
- produktiver Secret Store
- komplexe Connector- oder Queue-Infrastruktur
- ausgedehnte Integrationsimplementierungen
