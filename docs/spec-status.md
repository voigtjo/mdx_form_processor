# Spec-Status Überblick

Stand: Neuausrichtung auf das Zwischenziel **schlanke Formular-Prozess-Plattform fuer die Handwerker-App**.

## Fuehrende Spezifikationslinie

Aktuell fuehrend sind:

- `specs/README.md`
- `specs/01_mvp_scope.md`
- `specs/03_domain_model.md`
- `specs/05_workflow_json_spec.md`
- `specs/06_operations_spec.md`
- `specs/07_permissions_visibility_spec.md`
- `specs/08_versioning_lifecycle_spec.md`
- `specs/11_screen_spec_templates.md`
- `specs/12_screen_spec_workflows.md`
- `specs/13_screen_spec_documents.md`
- `specs/16_user_flows.md`
- `specs/17_reference_data_spec.md`
- `specs/19_non_goals_and_future_scope.md`
- `specs/20_sample_data_seed.md`
- `specs/next/01_form_model_target_spec.md`
- `specs/next/02_api_action_binding_target_spec.md`
- `specs/next/07_implementation_roadmap.md`
- `specs/next/08_platform_target_for_craftsman_app.md`
- `specs/next/09_controls_catalog_target_spec.md`
- `specs/next/10_template_grid_and_data_exchange_target_spec.md`
- `specs/next/11_reference_and_related_records_target_spec.md`
- `specs/next/12_test_strategy_target_spec.md`

## Produktiv nutzbarer Kern ist vorhanden

Fachlich bereits sinnvoll tragfaehig:

- versionierte Templates mit editierbarer Source und Lifecycle
- versionierte Workflows mit editierbarer Source, Transition View und Lifecycle
- Dokumentstart aus publizierten Template-/Workflow-Staenden
- Dokumentdetail mit Formular, Workflow-Actions, Journal, Attachments und History
- HTMX-Slices fuer den normalen Dokumentpfad
- erste formularuebergreifende readonly Referenz im Produktpfad

## Noch nicht plattformfaehig genug fuer den Meilenstein

Fuer den Meilenstein fehlen oder sind nur angerissen:

- expliziter Controls-Katalog fuer weitere Business-Controls
- Template-Datenblatt-/Grid-Modell
- CSV-Import und CSV-Export
- Formulare als API-Datenquelle
- Signatur-, User-Select- und HTML-Editor-Control
- Medienmodell fuer Journal und Attachments
- klare Start-to-End-Teststrategie

## Bewusst als Hintergrund statt Fuehrung behandelt

Nicht mehr als primaere Richtung behandeln:

- Preview-Pfad als produktiver Hauptweg
- reine Transition-/Umbau-Sprache auf normalen Produktseiten
- Alt-vs-Neu-Doppelbeschreibungen ohne direkten Produktnutzen
- historische Uebergangsdokumente als implizite Hauptsteuerung

## Hintergrund- oder Historienmaterial

Nuetzlich, aber nicht fuehrend fuer die naechste Produktphase:

- `specs/04_form_mdx_spec.md`
- `specs/15_ascii_wireframes.md`
- `specs/21_example_form_template.mdx`
- `specs/22_example_workflow_template.json`
- `specs/23_example_operation_customer_order.ts`
- `specs/next/05_reference_example_craftsman_order_spec.md`
- `specs/next/06_transition_migration_target_spec.md`
- `docs/changes/*`
- `docs/acceptance-checkpoint.md`

## Arbeitsregel

Neue Implementierungsschritte sollen sich jetzt primär an der produktnahen Plattformlinie orientieren:

1. Forms
2. Workflows
3. TypeScript APIs
4. Handwerker-App als erste Ziel-App
5. weitere Testwelten nur soweit vorbereiten, wie sie die Plattform fuer die Handwerker-App staerken
