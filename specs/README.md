# Digitale Dokumentation und Nachweise — MVP Spezifikationsprojekt

## Ziel dieses Verzeichnisses

Dieses Verzeichnis ist die führende Produktspezifikation für das MVP.

Es definiert:

- Produktziel und Scope
- Fachbegriffe
- Domain Model
- Form-Modell
- Workflow-Modell
- Operations-/Integrationsmodell
- Rechte und Sichtbarkeit
- Versionierung
- Navigation
- Screens
- Wireframes
- User Flows
- Referenzdaten
- Validierungsregeln
- Nicht-Ziele und Zukunftsthemen
- Seed-/Rebuild-Zielbestand
- konkrete Beispieldateien

Diese Spezifikation ist die führende Wahrheit für die spätere Umsetzung.

---

## Status

Für dieses Projekt gilt:

- **Keine Implementierung vor Review und Freigabe dieser Spezifikation**
- Der aktuelle Code ist **nicht** die führende Wahrheit
- Führend sind die Spezifikationsdateien in diesem Paket

---

## Führende Definitionsformate

Für das MVP gilt genau eine führende Wahrheit pro Bereich:

- **Form = MDX**
- **Workflow = JSON**
- **Operation / Integration = TypeScript**
- **Persistierte Laufzeitdaten = Postgres + definierte JSON-Felder**

Es dürfen keine konkurrierenden Führungsmodelle entstehen.

---

## Führende Technologieentscheidungen

- Datenbank: Postgres
- Backend: Node.js
- Web-Framework: Fastify
- Sprache: TypeScript
- Server Rendering: EJS
- UI-Stil: Material Design
- Startmodus: mono-tenant, ohne Authentifizierung, mit User-Selektion

---

## Struktur der Spezifikation

### Kernspezifikation

1. `01_mvp_scope.md`
2. `02_domain_glossary.md`
3. `03_domain_model.md`
4. `04_form_mdx_spec.md`
5. `05_workflow_json_spec.md`
6. `06_operations_spec.md`
7. `07_permissions_visibility_spec.md`
8. `08_versioning_lifecycle_spec.md`
9. `09_navigation_information_architecture.md`
10. `10_screen_spec_workspace.md`
11. `11_screen_spec_templates.md`
12. `12_screen_spec_workflows.md`
13. `13_screen_spec_documents.md`
14. `14_screen_spec_admin.md`
15. `15_ascii_wireframes.md`
16. `16_user_flows.md`
17. `17_reference_data_spec.md`
18. `18_validation_and_rules.md`
19. `19_non_goals_and_future_scope.md`
20. `20_sample_data_seed.md`

### Beispieldateien

21. `21_example_form_template.mdx`
22. `22_example_workflow_template.json`
23. `23_example_operation_customer_order.ts`

---

## Lesereihenfolge

Empfohlene Review-Reihenfolge:

1. Scope und Begriffe
2. Domain Model
3. Form / Workflow / Operations
4. Rechte / Versionierung
5. Navigation / Screens / Wireframes
6. User Flows
7. Referenzdaten / Validation / Non-Goals / Seed
8. Beispieldateien

Praktisch bedeutet das:

- zuerst `01` bis `08`
- dann `09` bis `15`
- dann `16` bis `20`
- danach `21` bis `23`

---

## Bedeutung der Beispieldateien

Die Beispieldateien sind keine zweite Spezifikation.

Sie dienen dazu:

- die führenden Modelle konkret zu illustrieren
- Codex später eine eindeutige Richtung zu geben
- Form, Workflow und Operation an einem konsistenten Beispiel zu zeigen

Führend bleiben trotzdem die eigentlichen Spezifikationsdateien `01` bis `20`.

---

## Wichtige Produktgrenzen

Das MVP ist:

- eine fokussierte App für digitale Dokumentation und Nachweise
- dokumentzentriert
- workflowzentriert
- auf produktive Nutzbarkeit ausgerichtet
- anschlussfähig für Brown-field-Umgebungen

Das MVP ist nicht:

- eine generische Low-Code-Plattform
- eine Builder-zentrierte Plattform
- ein allgemeines DMS
- ein separater Integration-Service
- eine Multi-Tenant-Enterprise-Plattform

---

## Leitregel für die spätere Umsetzung

Bei jeder späteren Umsetzung gilt:

1. Erst Spezifikation prüfen
2. Dann Implementierung ableiten
3. Keine stillen Architektur- oder UI-Abweichungen
4. Keine Rückkehr zu konkurrierenden Modellen
5. Neue Abweichungen nur nach Anpassung der Spezifikation

---

## Leitregel für Codex

Wenn Codex später auf Basis dieses Pakets arbeitet, gilt:

- nicht vom aktuellen Altzustand der App ausgehen
- nicht implizit Legacy-Strukturen fortführen
- die Spezifikation ist führend
- die Beispieldateien konkretisieren die Spezifikation, ersetzen sie aber nicht

---

## Ergebnisregel

Dieses README ist der Einstieg in die führende MVP-Spezifikation.

Die Dateien in diesem Paket bilden zusammen die verbindliche Grundlage für Review, Planung, Seed-Definition und spätere Umsetzung.
