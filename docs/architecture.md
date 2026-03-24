# Zielarchitektur für mdx_form_processor

## 1. Zweck dieses Dokuments

Dieses Dokument beschreibt die Zielarchitektur des Projekts `mdx_form_processor` auf Basis des vollständigen Spezifikationssatzes unter `specs/`.

Es hat zwei Funktionen:

1. Es dient als technische Leitplanke für die weitere Entwicklung mit Codex.
2. Es stellt klar, was der aktuelle Greenfield-Stand bereits leistet und was als Nächstes umzusetzen ist.

Dieses Dokument ist **kein Ersatz** für die Spezifikation.  
Führend bleiben die Dateien unter `specs/`.

---

## 2. Führende Quellen

Die Architektur dieses Repos wird aus den Spezifikationsdateien unter `specs/` abgeleitet.

Besonders relevant sind:

- `00_decision_record.md`
- `01_mvp_scope.md`
- `03_domain_model.md`
- `04_form_mdx_spec.md`
- `05_workflow_json_spec.md`
- `06_operations_spec.md`
- `07_permissions_visibility_spec.md`
- `08_versioning_lifecycle_spec.md`
- `09_navigation_information_architecture.md`
- `10_screen_spec_workspace.md`
- `11_screen_spec_templates.md`
- `12_screen_spec_workflows.md`
- `13_screen_spec_documents.md`
- `14_screen_spec_admin.md`
- `16_user_flows.md`
- `17_reference_data_spec.md`
- `18_validation_and_rules.md`
- `19_non_goals_and_future_scope.md`
- `20_sample_data_seed.md`

---

## 3. Leitentscheidungen

Für den MVP gelten diese technischen Leitentscheidungen:

- Laufzeitdaten liegen in Postgres.
- Die App läuft als Node.js-Anwendung mit Fastify.
- Der Codebasis wird in TypeScript gepflegt.
- Die Web-Oberfläche rendert serverseitig über EJS.
- Die UI folgt einem ruhigen, arbeitsorientierten Material-Design-Stil.
- Form-Definitionen sind MDX.
- Workflow-Definitionen sind JSON.
- Operationen werden als TypeScript-Module geschnitten.
- Das MVP startet mono-tenant und ohne Authentifizierung.
- Der Nutzerkontext wird über User-Selektion statt Login bestimmt.

---

## 4. Führende Modellwahrheiten

Für jeden Bereich gibt es genau ein führendes Modell:

- Form = MDX
- Workflow = JSON
- Operation / Integration = TypeScript
- Persistierte Laufzeitdaten = Postgres + definierte JSON-Felder

Nicht zulässig sind konkurrierende Primärmodelle wie:

- Builder-interne Layoutmodelle als führende Wahrheit
- parallele Workflowmodelle neben JSON
- API-Bridge-Strukturen als neues Primärmodell
- Sample-Daten als dauerhafte Laufzeitquelle

---

## 5. Aktueller Ist-Stand des Projekts

Der aktuelle Greenfield-Stand des Repos ist:

- das Repo ist neu aufgebaut
- der vollständige Spezifikationssatz liegt unter `specs/`
- ein technisches Grundgerüst mit Fastify / TypeScript / EJS ist vorhanden
- die Hauptseiten existieren bereits:
  - `/workspace`
  - `/templates`
  - `/workflows`
  - `/documents`
  - `/admin`
- die App läuft im Browser
- die Postgres-Verbindung ist jetzt eingerichtet und erreichbar
- `DATABASE_URL` ist gesetzt
- `npm run db:check` ist grün

Wichtig ist:

Der aktuelle Stand ist **noch kein echter persistenter MVP-Kern**.  
Die ersten Seiten sind bisher als Greenfield-Rahmen bzw. mit Sample-/Placeholder-Daten aufgebaut worden.

---

## 6. Architekturziel des nächsten Schritts

Der nächste Entwicklungsschritt ist **nicht**:

- Builder
- volle Workflow-Engine
- Integrationsausbau
- Auth
- Multitenancy
- DMS-Ausbau
- visuelle Designer

Der nächste Entwicklungsschritt ist:

**Persistente Basisschicht + Reference Seed + echte DB-Daten auf den Hauptseiten**

Das ist der kleinste sinnvolle Vertikalschnitt, weil damit:

- die App nicht mehr nur eine UI-Hülle ist
- der Referenzbestand aus der Spezifikation real existiert
- Hauptseiten mit echten Daten arbeiten
- spätere Umsetzungsstufen sauber darauf aufbauen können

---

## 7. Zielbild des MVP-Systemschnitts

Die Anwendung ist im MVP in vier klar getrennte Bereiche zu schneiden:

### 7.1 Web Shell
Verantwortlich für:

- Fastify-Server
- Routen
- Rendering
- Layout
- statische Assets
- User-Selektion
- Navigation

### 7.2 Konfiguration
Verantwortlich für:

- Form Templates
- Workflow Templates
- Versionsstatus
- Group-Zuweisungen
- operationRef-Verweise

### 7.3 Laufzeit
Verantwortlich für:

- Documents
- Document Assignments
- Audit Events
- spätere Journal-/Attachment-Nutzung
- Sichtbarkeit im Workspace
- spätere Action-/Statusausführung

### 7.4 Integration
Verantwortlich für:

- TypeScript-Operationen
- spätere Hook-Ausführung
- Lookup-Operationen
- Form Actions
- strukturierte Auth-Strategien

Im aktuellen nächsten Schritt wird der Fokus bewusst auf **Konfiguration + Laufzeitbasis + Persistenz** gelegt.

---

## 8. Ziel-Datenmodell des nächsten Vertikalschnitts

Für den nächsten echten Persistenzschritt sollen mindestens diese Kernobjekte sauber in Postgres liegen:

- users
- groups
- memberships
- workflow_templates
- form_templates
- template_assignments
- documents
- document_assignments
- audit_events

Noch nicht voll auszubauen, nur falls technisch vorbereitet erforderlich:

- attachments
- journals
- operation runtime state

---

## 9. Ziel-Datenfluss

Der führende Datenfluss soll mittelfristig so aussehen:

### 9.1 Konfiguration
- Form Template wird aus MDX definiert
- Workflow Template wird aus JSON definiert
- Template referenziert Workflow
- Template ist Groups zugewiesen

### 9.2 Laufzeit
- User wählt sich aktiv aus
- Workspace zeigt Daten passend zu Memberships und Document-Zuordnungen
- Document wird aus publiziertem Template gestartet
- Document bleibt an Template-Version und Workflow-Version gebunden

### 9.3 Spätere Interaktion
- Form Actions referenzieren `operationRef`
- Workflow Hooks referenzieren `operationRef`
- Operationen arbeiten auf dem Laufzeitkontext des Documents

Im nächsten Schritt wird davon zunächst der **Read-/Übersichtspfad** umgesetzt.

---

## 10. Verzeichnisstrategie im Repo

Die Repo-Struktur soll langfristig so lesbar bleiben:

- `specs/` = führende Produktspezifikation
- `docs/` = Architektur und begleitende technische Leitdokumente
- `sql/` = Migrationen / Setup / Rebuild-nahe SQL-Artefakte
- `src/config/` = Konfiguration
- `src/db/` = DB-Anbindung
- `src/modules/` = fachliche Modulgrenzen
- `src/routes/` = Web-Routen
- `src/services/` = anwendungsnahe Orchestrierung
- `src/views/` = EJS-Templates
- `src/public/` = Assets

### Wichtige Regel

Views rendern Daten.  
Views sind **nicht** der Ort für Geschäftslogik oder direkte DB-Zugriffe.

---

## 11. Modulzuschnitt

Die fachlichen Module sind im MVP zunächst entlang der Hauptobjekte zu schneiden:

- users
- groups
- memberships
- templates
- workflows
- documents
- assignments
- audit
- operations
- attachments

Im nächsten Schritt sollen mindestens diese Module echte Lesepfade über Repositories bekommen:

- users
- groups
- memberships
- templates
- workflows
- documents
- assignments
- audit

---

## 12. Repositories statt Direktzugriffe

Ab dem nächsten Schritt gilt:

- keine DB-Zugriffe direkt in Routen
- keine DB-Zugriffe direkt in Views
- keine Sample-Daten als Primärquelle

Stattdessen:

- Query-/Repository-Layer pro Kernmodul
- schmale, lesbare Read-Modelle für die Hauptseiten
- klare Trennung zwischen Persistenzzugriff und Rendering

---

## 13. Seiten, die als Nächstes auf echte DB-Daten umzustellen sind

Die folgenden Seiten sollen im nächsten Vertikalschnitt auf echte Daten umgestellt werden:

- `/workspace`
- `/templates`
- `/workflows`
- `/documents`
- `/admin`

Wichtig:

- zunächst Read-only / Übersicht / Listenfokus
- noch keine Voll-CRUD-Pflicht
- lieber echte Daten sauber lesen als zu viel halb bauen

---

## 14. Reference Seed als Pflichtbestand

Der Referenzbestand ist keine Nebensache, sondern ein führender Bestandteil der Architektur.

Der nächste Schritt muss daher einen reproduzierbaren **Reference Seed** schaffen, passend zu:

- `17_reference_data_spec.md`
- `20_sample_data_seed.md`

Dieser Referenzstand soll mindestens enthalten:

- Alice
- Bob
- Ops
- Memberships
- drei Referenz-Workflows
- drei Referenz-Templates
- Template Assignments
- mindestens drei Referenz-Documents
- passende Document Assignments
- erste Audit Events

---

## 15. Rebuild statt losem Seed

Für dieses Projekt ist nicht nur „Seed“ wichtig, sondern ein reproduzierbarer **Rebuild**.

Ziel ist:

- Schema aufbauen
- Referenzdaten zuverlässig herstellen
- vorhandene Alt-/Testmischungen vermeiden
- immer wieder auf einen klaren Referenzstand zurückkehren können

Darum soll der nächste Umsetzungsschritt klare Kommandos für mindestens Folgendes vorsehen:

- Migration ausführen
- Reference Seed einspielen
- kompletter Rebuild des Referenzstands

---

## 16. Was bewusst noch nicht zur Zielarchitektur des nächsten Schritts gehört

Die folgenden Themen sind **nicht** Ziel des nächsten Umsetzungsschritts:

- visueller Form-Builder
- visueller Workflow-Builder
- Authentifizierung
- Multitenancy
- Secret Store
- komplexe Integrationen
- vollständige Workflow-Engine
- vollständige Hook-Orchestrierung
- Journal-/Attachment-Vollausbau
- vollwertige Admin-CRUD-Strecken
- generischer Low-Code-Ansatz

Diese Themen dürfen die nächste Implementierungsphase nicht dominieren.

---

## 17. Rolle von Codex in der weiteren Entwicklung

Die weitere Entwicklung soll mit Codex umgesetzt werden.

Für die Zusammenarbeit mit Codex gilt:

- Codex soll auf den tatsächlichen Repo-Stand schauen
- Codex soll die Spezifikation unter `specs/` als führend behandeln
- Codex soll nicht auf Altwissen aus früheren Projekten oder Builder-Experimenten zurückfallen
- Codex soll in kleinen, sauberen Vertikalschnitten arbeiten
- jeder Schritt muss sichtbar, testbar und reproduzierbar sein

Wichtig:
Dieses Projekt wird **nicht** durch paralleles Improvisieren vervollständigt, sondern durch kontrollierte Spezifikationsumsetzung.

---

## 18. Nächster verbindlicher Implementierungsauftrag

Der nächste verbindliche Architekturzug lautet:

**Die App ist mit einer echten Postgres-Basisschicht auszustatten, so dass mit dynamischen Daten gearbeitet werden kann.**

Dazu gehören mindestens:

1. Analyse des Ist-Stands im Repo
2. Ableitung des minimalen Postgres-Schemas aus der Spezifikation
3. Migrationen / SQL für die Kernobjekte
4. reproduzierbarer Reference Seed
5. Repository-/Query-Layer
6. Umstellung der Hauptseiten auf echte DB-Daten
7. Entkopplung der bisherigen Sample-Daten
8. klare Setup-/Rebuild-Kommandos

---

## 19. Ergebnisregel

Dieses Dokument definiert die technische Zielrichtung des aktuellen Greenfield-Standes.

Es beschreibt, wie das vorhandene Grundgerüst in den nächsten sinnvollen persistierten MVP-Schritt überführt wird.

Wenn aktuelle Implementierungen davon abweichen, gelten:

1. die Spezifikation unter `specs/`
2. dieses Architekturpapier als technische Leitplanke
3. dann erst der bestehende Code
