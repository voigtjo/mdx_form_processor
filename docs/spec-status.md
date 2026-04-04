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
- `specs/next/13_form_types_and_entity_tables_target_spec.md`
- `docs/meilenstein-handwerkerplattform.md`

## Produktiv nutzbarer Kern ist vorhanden

Fachlich bereits sinnvoll tragfaehig:

- versionierte Templates mit editierbarer Source und Lifecycle
- versionierte Workflows mit editierbarer Source, Transition View und Lifecycle
- Dokumentstart aus publizierten Template-/Workflow-Staenden
- Dokumentdetail mit Formular, Workflow-Actions, Journal, Attachments und History
- HTMX-Slices fuer den normalen Dokumentpfad
- erste formularuebergreifende readonly Referenz im Produktpfad
- APIs als DB-Objekte mit UI-Wartung und Runtime
- form_type plus typed entity tables als erster echter Fach-Slice
- Qualification Pages plus erste Auswertung
- `generic_form` als vierter produktiver Formulartyp
- Start-to-End-Tests fuer Kundenservice-Dokumentation, Produktion, Qualifikation und generic_form

## Fuer den Meilenstein noch teilweise oder offen

- typed entity tables sind jetzt als fachliche Leseschicht mit Familien-APIs und typed-basierter Dokumentsuche vorhanden, aber noch nicht die einzige Runtime-Quelle
- Qualification Pages sind aktuell bewusst qualification-spezifisch, noch kein allgemeines Mehrseitenmodell
- Medienfunktionen bleiben bewusst auf der kompakten Basis

## Bewusst als Hintergrund statt Fuehrung behandelt

Nicht mehr als primaere Richtung behandeln:

- Preview-/Dev-Form-Pfade als Produktbestandteil
- historischer `next-form`-Begriff als fuehrender Architekturname
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
- `specs/next/05_reference_example_customer_order_spec.md`
- `specs/next/06_transition_migration_target_spec.md`
- `docs/changes/*`
- `docs/acceptance-checkpoint.md`

## Arbeitsregel

Neue Implementierungsschritte sollen sich jetzt primär an der produktnahen Plattformlinie orientieren:

1. Forms
2. Workflows
3. TypeScript APIs
4. Handwerker-App als erste Ziel-App
5. Kundenservice-Dokumentation als erster sichtbarer Leitfall im Produkt
