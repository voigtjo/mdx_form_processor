# 01 — Plattform-Zwischenziel und MVP Scope

## 1. Produktname

Schlanke Formular-Prozess-Plattform

Erste konkrete Ziel-App:
Digitale Dokumentation und Nachweise fuer Handwerker

---

## 2. Produktziel

Das aktuelle Zwischenziel ist eine schlanke Plattform fuer:

- versionierte Formulare
- versionierte Workflows
- TypeScript-APIs fuer Lookup, Actions, Hooks sowie spaeter Import und Export

Auf dieser Plattform soll als erste konkrete kommerzielle Anwendung eine digitale Dokumentations- und Nachweisplattform fuer Handwerker produktiv gebaut werden.

Das Produkt ist keine generische Low-Code-Plattform.
Es ist eine fokussierte Formular-Prozess-Plattform mit klaren Templates, klaren Workflows und anschlussfaehigen TypeScript-APIs.

## 2.1 Plattform-Kern

Zum Plattform-Kern gehoeren:

- Forms
- Workflows
- TypeScript APIs
- Versionierung und Lifecycle fuer Templates und Workflows
- Dokumentstart aus publizierten Staenden
- feste Bindung laufender Documents an ihre Startversion
- Journal, Attachments und Audit

## 2.2 Erste produktive Ziel-App

Die erste Ziel-App fokussiert:

- Auftragsdokumentation bei Kunden
- Nachweise, Bilder und Freigaben
- ruhige mobile und desktop-faehige Arbeitsoberflaechen fuer Handwerker und Pruefer

## 2.3 Spaetere, aber vorbereitete Testwelten

Spaeter sinnvoll vorzubereiten sind:

- Produktionsdokumentation mit Batch oder Seriennummer
- Qualifikations- und Nachweisformulare mit Mehrfachzuweisung, Schulungsmaterial, Fragen und Signatur

---

## 3. Zielgruppen

### 3.1 Primäre Zielgruppe

- kleine und mittlere Unternehmen
- operative Teams
- Fachbereiche mit Nachweis- und Freigabeprozessen
- Brown-field-Umgebungen mit vorhandenen Fremdsystemen

### 3.2 Sekundäre Zielgruppe

- Fachadministratoren
- Prozessverantwortliche
- Personen, die Templates und Workflows definieren

### 3.3 Nicht primär adressiert

- anonyme Endkunden
- breite Self-Service-Portale
- generische Low-Code-Nutzergruppen
- hochkomplexe Enterprise-Multitenancy-Szenarien

---

## 4. Betriebsmodell des MVP

- Start als mono-tenant Anwendung
- keine Benutzer-Authentifizierung im MVP-Kern
- Nutzer werden per User-Selektion gewählt
- Deployment als interne oder einfache externe Webanwendung
- produktiv nutzbar auch ohne echte SAP- oder Salesforce-Anbindung

---

## 5. MVP-Kernprozess

Das MVP muss einen vollständigen, produktiv nutzbaren Kernprozess zuverlässig abbilden:

1. Ein publiziertes Form Template steht einer Group zur Verfügung.
2. Ein User startet daraus ein Document.
3. Das Document wird Editors und/oder Approvers zugewiesen.
4. Der Editor bearbeitet das Document gemäß Workflowstatus.
5. Der Editor speichert und submitted das Document.
6. Ein Approver approved oder rejected das Document.
7. Beim Workflow-Übergang können definierte TypeScript-Operationen ausgeführt werden.
8. Das Document bleibt über Status, Historie, Attachments und Journal vollständig nachvollziehbar.

Dieser Kernprozess ist die primäre Produktfunktion des MVP.

---

## 6. Primärer Nutzen des MVP

Das MVP soll folgende typische Problemkombination ersetzen oder reduzieren:

- Word-/Excel-basierte Formulare
- unstrukturierte Dokumentation
- Freigaben per E-Mail oder Zuruf
- unklare Zustände und Verantwortlichkeiten
- einfache Makro-/DMS-/Bridge-Lösungen ohne klaren Prozessfluss

Das MVP soll einfach wirken, obwohl die technische Grundlage spätere Flexibilität für Brown-field-Integration ermöglicht.

---

## 7. Zwingend enthalten im MVP

Die folgenden Bereiche sind zwingender Produktkern des MVP.

### 7.1 Benutzer- und Gruppenkonzept

Enthalten sind:
- Users
- Groups
- Memberships
- Rechte r, w, x
- Zuweisung von Templates zu Groups
- Zuweisung von dokumentbezogenen Rollen zu Users

### 7.2 Form-Templates

Enthalten sind:
- Form-Template-Metadaten
- MDX-basierte Formularbeschreibung
- Formfelder
- explizite Controls
- Template Keys
- Document Keys
- Lookup-Felder
- Referenzen auf Stammdaten
- erste Referenzen auf andere Formulare
- Journal-Bereiche
- Attachment-Bereiche
- Tabellenfelder für Dokumentlisten

### 7.3 Workflow-Templates

Enthalten sind:
- Statusliste
- Actions
- einfache Transitionen `from -> to`
- Rollen fuer Actions
- Modus `OR` / `AND`
- Feldregeln je Status
- Mehrfach-Editoren
- Mehrfach-Approver
- Workflow-Hooks mit operationRef
- JSON-basierte Bearbeitung im Konfigurations-/Admin-Bereich

### 7.4 Documents

Enthalten sind:
- Start aus publiziertem Template
- Bindung an konkrete Template-Version
- Bearbeitung gemäß Workflow-Regeln
- Anhänge
- Journal-Daten
- Historie / Audit
- Integrationskontext

### 7.5 Workspace

Enthalten sind:
- My Workspace
- My Groups
- My Tasks
- My Templates
- My Documents
- Standardfilter: nicht archivierte Dokumente

### 7.6 Listen und Tabellen

Enthalten sind:
- Dokumentliste pro Template
- My Documents
- Filter nach Status
- Sichtbarkeit abhängig von Rechten
- definierte Tabellenfelder pro Template

### 7.7 Versionierung

Enthalten sind:
- Template-Versionen
- Draft
- Published
- Archived
- Publish einer neuen Version unpublisht bzw. archiviert die alte produktive Version
- laufende Documents bleiben auf ihrer Startversion

### 7.8 TypeScript APIs

Enthalten sind:
- TypeScript-Operationen
- operationRef
- Aufruf aus Form-Actions
- Aufruf aus Workflow-Hooks
- Input-/Output-Mapping
- persistierter Integrationskontext
- CSV-Import und CSV-Export als vorbereitete Ausbaurichtung
- Formulare als API-Datenquelle

### 7.9 Audit / Historie

Enthalten sind mindestens:
- created
- assigned
- re-assigned
- started
- saved
- submitted
- approved
- rejected
- archived
- attachment_uploaded
- workflow_hook_executed
- action_executed

---

## 8. Technisch vorbereitet, aber nicht Kernnutzen des MVP

Die folgenden Punkte dürfen im MVP strukturell vorbereitet sein, zählen aber nicht zum primären Nutzungsversprechen:

- Auth-Strategien für spätere Fremdsystemanbindung
- vorbereitete Anschlussfähigkeit für Salesforce, SAP und ähnliche Systeme
- persistierter Integrationskontext für mehrstufige Integrationsabläufe
- spätere Auslagerbarkeit in einen separaten Integration-Service
- erweiterbare Connector-Struktur
- vorbereitete OAuth-Client-Credentials-Modelle ohne vollständigen End-to-End-Betrieb

Diese Punkte dürfen das MVP technisch vorbereiten, aber nicht die Produkt-UI dominieren.

---

## 9. Nicht im MVP enthalten

Nicht Bestandteil des MVP sind:

- visueller Form-Builder
- visueller Workflow-Builder
- generische Connector-/API-Administration als Haupt-UI
- Multitenancy
- Login-/Auth-System
- produktiver Secret Store
- vollständige OAuth-End-to-End-Flows
- generische Low-Code-/No-Code-Plattform
- Reporting-/BI-Ausbau
- Drag-and-Drop-Editoren
- allgemeine Regel-Engine für beliebige Prozesse
- offene Plattform für beliebige Fachanwendungen

---

## 10. Brown-field-Integrationsprinzip des MVP

Das MVP unterstützt Brown-field-Integration in klar begrenzter Form über:

- Lookup-Operationen
- Form-Actions
- Workflow-Hooks
- persistierten Integrationskontext

Das MVP enthält bewusst nicht:

- zentrale Integrationsadministration als Hauptbedienoberfläche
- produktiven Credential-/Secret-Store
- visuelle Connector-Modellierung
- komplexe Retry-/Monitoring-/Queue-Infrastruktur
- separate Integrationslaufzeit außerhalb der App

---

## 11. Technische Leitentscheidungen

Für das MVP gelten diese Technologieentscheidungen:

- Datenbank: Postgres
- Backend: Node.js
- Web-Framework: Fastify
- Sprache: TypeScript
- Server Rendering: EJS
- UI-Stil: Material Design
- Form-Definition: MDX
- Workflow-Definition: JSON
- Integrations-/API-Logik: TypeScript-Operationen

---

## 12. Führende Definitionsformate

Für das MVP gilt genau eine führende Wahrheit pro Bereich:

- Form = MDX
- Workflow = JSON
- Operation / Integration = TypeScript
- Persistierte Laufzeitdaten = Postgres + definierte JSON-Felder

Es darf keine parallelen konkurrierenden Führungsmodelle geben.

---

## 13. Verbindliche UI-Prinzipien

Für das gesamte MVP gelten diese UI-Prinzipien:

1. Standardansichten sind arbeitsorientiert und ruhig.
2. Technische Details erscheinen nur in Konfigurations-, Advanced- oder Admin-Bereichen.
3. JSON ist niemals Teil der normalen Arbeits-UI.
4. JSON ist im MVP ausschließlich in Konfigurations- und Admin-Bereichen zulässig.
5. Standardseiten zeigen nur Informationen mit unmittelbarem Nutzungswert.
6. Jede Hauptseite hat genau einen klaren primären Zweck.
7. Es gibt keine sichtbaren konkurrierenden Modellwelten in der Standard-UI.
8. Builder- oder Techniklogik darf die Arbeitsflächen nicht dominieren.
9. Dialoge, Tabs und Advanced-Bereiche werden genutzt, um Komplexität auf Nachfrage zu öffnen.

---

## 14. Workflow-Definition im MVP

Workflows werden im MVP nicht visuell gebaut.

Stattdessen gilt:

- Workflows werden als JSON definiert
- die Bearbeitung erfolgt durch Admins oder Prozessverantwortliche
- die Bearbeitung erfolgt in einer Konfigurations-/Admin-UI
- normale Endnutzer sehen dieses JSON nicht in ihrer Arbeits-UI
- eine lesbare Workflow-Zusammenfassung für Review und Verständnis ist zulässig und erwünscht

Damit gilt:
- kein visueller Workflow-Builder
- aber ein JSON-basierter Workflow-Editor im Konfigurationsbereich ist Teil des MVP

---

## 15. MVP-Erfolgskriterien

Das MVP gilt als inhaltlich erreicht, wenn:

1. Ein Form-Template in MDX erstellt und publiziert werden kann.
2. Ein Workflow-Template in JSON erstellt, bearbeitet und zugewiesen werden kann.
3. Ein Document daraus gestartet werden kann.
4. Assign, Start, Save, Submit, Approve, Reject, Re-Assign und Archive funktionieren.
5. Anhänge und Journaleinträge erfasst werden können.
6. Eine Form-Action eine TypeScript-Operation auslösen kann.
7. Ein Workflow-Hook eine TypeScript-Operation auslösen kann.
8. History/Audit sichtbar und nachvollziehbar ist.
9. Workspace und Dokumentlisten im Alltag benutzbar sind.
10. Das System ohne echte SAP-/Salesforce-Anbindung sinnvoll nutzbar ist.
11. Ein vollständiger Referenzfall Ende-zu-Ende funktioniert:
    - Template publiziert
    - Document gestartet
    - Document bearbeitet
    - submit
    - approve
    - Hook läuft
    - Audit ist sichtbar

---

## 16. Review-Regel

Vor Implementierung weiterer größerer UI-, Architektur- oder Modelländerungen muss diese MVP-Spezifikation reviewed und freigegeben sein.

Die Spezifikation ist die führende Wahrheit.
Der aktuelle Code ist kein Ersatz für diese Produktentscheidung.
