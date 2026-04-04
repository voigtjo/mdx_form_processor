# Schlanke Formular-Prozess-Plattform — Spezifikationspaket

## Zweck dieses Verzeichnisses

Dieses Verzeichnis ist die fuehrende Produktspezifikation fuer das aktuelle Zwischenziel:

- eine schlanke Formular-Prozess-Plattform
- mit einer ersten konkreten kommerziellen Ziel-App
- fuer digitale Dokumentation und Nachweise in der Handwerkerwelt

Die Plattform wird bewusst nicht als allgemeiner Builder beschrieben.
Sie wird nur so weit modelliert, wie es fuer die Handwerker-App und die naechsten nahen Testwelten sinnvoll ist.

## Aktuelles Zwischenziel

Der naechste Meilenstein ist:

- **plattformfaehig fuer die Handwerker-App**

Dafuer muessen drei Kernbausteine gemeinsam tragfaehig sein:

1. **Forms**
2. **Workflows**
3. **TypeScript APIs**

Diese drei Bausteine werden spaeter entlang echter Produktfaelle nachgeschaerft.

## Produktlogik des Zwischenziels

Die Plattform stellt den Rahmen.
Die erste App liefert die produktive Zielschärfe.

### Plattform-Kern

- versionierte Formulare
- `form_type` pro Template als fachlicher Familienanker
- versionierte Workflows
- TypeScript-APIs als zentrale DB-Objekte mit UI-Wartung und Runtime fuer Lookup, Actions, Hooks, Import und Export
- Dokumentstart aus publizierten Template-/Workflow-Staenden
- `documents` als Prozesscontainer plus typed entity tables als fachliche Zielstruktur
- laufende Dokumente auf fester Version
- Journal, Attachments, History
- einfache Rechte- und Zuweisungslogik

### Erste Ziel-App

- digitale Auftragsdokumentation und Nachweise fuer Handwerker
- Kunde, Auftrag, Material/Produkt, Einsatzort, Nachweise, Freigabe

### Spaetere, aber vorbereitete Testwelten

- Produktionsdokumentation mit Batch oder Seriennummer
- Qualifikations- und Nachweisformulare mit Mehrfachzuweisung, Pages, Fragen, Auswertung und Signatur
- generisches Formular als kleinster vierter Formulartyp

## Fuehrende Dokumentgruppen

### Produktnahe Kernspezifikation unter `specs/`

Fuehrend bleiben insbesondere:

1. `01_mvp_scope.md`
2. `02_domain_glossary.md`
3. `03_domain_model.md`
4. `05_workflow_json_spec.md`
5. `06_operations_spec.md`
6. `07_permissions_visibility_spec.md`
7. `08_versioning_lifecycle_spec.md`
8. `09_navigation_information_architecture.md`
9. `10_screen_spec_workspace.md`
10. `11_screen_spec_templates.md`
11. `12_screen_spec_workflows.md`
12. `13_screen_spec_documents.md`
13. `14_screen_spec_admin.md`
14. `16_user_flows.md`
15. `17_reference_data_spec.md`
16. `18_validation_and_rules.md`
17. `19_non_goals_and_future_scope.md`
18. `20_sample_data_seed.md`
19. `25_screen_spec_apis.md`

### Ziel- und Ausbauspezifikation unter `specs/next/`

Fuehrend fuer die naechste Plattformphase sind:

- `01_form_model_target_spec.md`
- `02_api_action_binding_target_spec.md`
- `07_implementation_roadmap.md`
- `08_platform_target_for_craftsman_app.md`
- `09_controls_catalog_target_spec.md`
- `10_template_grid_and_data_exchange_target_spec.md`
- `11_reference_and_related_records_target_spec.md`
- `12_test_strategy_target_spec.md`
- `13_form_types_and_entity_tables_target_spec.md`
- `14_qualification_pages_and_evaluation_target_spec.md`

### Hintergrund- und Uebergangsdokumente

Die folgenden Dokumente bleiben nuetzlich, sind aber nicht mehr der fuehrende Produktweg:

- `04_form_mdx_spec.md`
- `15_ascii_wireframes.md`
- `21_example_form_template.mdx`
- `22_example_workflow_template.json`
- `23_example_operation_customer_order.ts`
- `specs/next/05_reference_example_customer_order_spec.md`
- `specs/next/06_transition_migration_target_spec.md`

Sie dienen als Kontext, Beispiel oder Historie, nicht als primaere Steuerung des naechsten Plattformschritts.

## Leitlinien fuer neue Spezifikationen

Neue Specs sollen:

- produktnah bleiben
- klare Modellgrenzen ziehen
- `forms`, `workflows`, `apis`, `entities` und `lookups` fachlich sauber trennen
- keine doppelte Alt-/Neu-Erzaehlung mitfuehren
- keine Preview- oder Dev-Nebenwelt fuer Formulare aufbauen
- direkte Ableitung fuer kleine Implementierungsschritte ermoeglichen

## Nicht das Ziel dieses Pakets

Dieses Spezifikationspaket beschreibt nicht:

- eine allgemeine Low-Code-Plattform
- einen visuellen Builder als Produktkern
- eine frei modellierbare Meta-Plattform fuer beliebige Domänen
- eine voll ausgebaute Integrations- oder Testplattform in dieser Phase

## Ergebnisregel

Die fuehrende Leserichtung ist jetzt:

1. Plattform-Zwischenziel verstehen
2. Kernbausteine Forms / Workflows / TypeScript APIs verstehen
3. Handwerker-App als erste Ziel-App verstehen
4. naechste Plattformluecken aus `specs/next/` schliessen
5. erst danach Implementierung ableiten
