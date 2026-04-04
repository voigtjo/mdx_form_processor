# 19 — Non-Goals and Future Scope

## 1. Ziel dieses Dokuments

Dieses Dokument definiert:

- was **nicht** Bestandteil des MVP ist
- welche Themen bewusst späteren Ausbaustufen vorbehalten sind
- welche naheliegenden, aber ausdrücklich ausgeschlossenen Erweiterungen es gibt
- welche Zukunftsrichtungen grundsätzlich vorgesehen, aber nicht Teil des MVP sind

Dieses Dokument ist die führende Grenze zwischen MVP und späterem Ausbau.

---

## 2. Grundsatz

Für das MVP gilt:

- Das Produkt soll **produktiv nutzbar** sein
- Das Produkt soll **plattformfaehig fuer die Handwerker-App** werden
- Es soll **einfach** wirken
- Es soll **nicht** alles auf einmal lösen
- Es soll **keine verdeckte zweite Produktvision** im MVP mittragen

Alles, was hier als Nicht-Ziel oder Zukunftsthema definiert ist, darf das MVP nicht stillschweigend dominieren.

---

## 3. Nicht-Ziele des MVP

Die folgenden Themen sind **nicht** Bestandteil des MVP.

---

## 4. Kein visueller Form-Builder als MVP-Ziel

Nicht Bestandteil des MVP ist:

- ein visueller Form-Builder
- ein Drag-and-Drop-Builder
- ein WYSIWYG-Form-Designer als Primärmodell
- ein Canvas-Builder als führende Formularlogik

Für das MVP ist **MDX** das führende Formularmodell.

Ein späterer Builder darf MDX unterstützen, aber MDX bleibt für das MVP die führende Definition.

---

## 5. Kein visueller Workflow-Builder als MVP-Ziel

Nicht Bestandteil des MVP ist:

- ein visueller Workflow-Builder
- ein State-Machine-Canvas
- Drag-and-Drop für Workflow-Modellierung
- grafisches Hook-Mapping als Primärmodell

Für das MVP ist **JSON** das führende Workflowmodell.

Ein späterer Builder darf Workflow-JSON unterstützen, aber JSON bleibt für das MVP die führende Definition.

---

## 6. Keine generische Low-Code-/No-Code-Plattform

Nicht Ziel des MVP ist:

- eine allgemeine Low-Code-Plattform
- eine beliebige Workflow-Plattform für alle Fachdomänen
- ein Meta-Builder für beliebige Geschäftsanwendungen
- eine frei modellierbare Prozessplattform ohne inhaltlichen Fokus

Das Produkt bleibt im MVP eine fokussierte Plattform mit erster Ziel-App fuer:

- digitale Dokumentation
- Nachweise
- Freigaben
- Brown-field-nahe Anbindung

---

## 7. Keine Multitenancy im MVP

Nicht Bestandteil des MVP ist:

- echte Multitenancy
- Tenant-Isolation
- tenantabhängige Konfiguration
- tenantabhängige Credentials
- tenantabhängige Branding- oder Routingmodelle

Das MVP startet bewusst:

- mono-tenant
- einfach
- direkt nutzbar

---

## 8. Keine echte Authentifizierung im MVP

Nicht Bestandteil des MVP ist:

- Login
- Passwortverwaltung
- lokale Authentifizierung
- Entra-/OIDC-/OAuth-Login
- MFA/2FA
- Sessionmanagement als Produktkern

Das MVP startet mit:

- User-Selektion statt Login

Spätere Authentifizierung ist geplant, aber kein MVP-Bestandteil.

---

## 9. Kein produktiver Secret Store im MVP

Nicht Bestandteil des MVP ist:

- produktiver Secret Store
- verschlüsselte Credential-Verwaltung als ausgebautes System
- mandantenfähige Geheimnisverwaltung
- selbstbediente Credential-Pflege für Fremdsysteme

Das MVP darf Auth-Strategien modellieren, aber keine vollständige produktive Secret-Architektur voraussetzen.

---

## 10. Kein vollständiger OAuth-End-to-End-Flow im MVP

Nicht Bestandteil des MVP ist:

- vollständiger OAuth Client Credentials Flow in Produktion
- vollständiger Authorization Code Flow
- Token Refresh Management
- Mandanten-/Benutzer-gebundene OAuth-Verwaltung
- vollwertige Provider-Konfiguration im UI

Vorbereitete Strukturen sind zulässig, aber keine vollständige Produktfunktion.

---

## 11. Kein separater Integration-Service im MVP

Nicht Bestandteil des MVP ist:

- ein eigenes externes Integrationssystem
- ein getrennt deployter Connector-Service
- eine Queue-/Worker-/Broker-Architektur als Pflichtmodell
- ein Integrations-Hub als separates Produkt

Im MVP sind Operationen:

- TypeScript-basiert
- innerhalb des App-Kontexts modelliert
- strukturell so geschnitten, dass spätere Auslagerung möglich bleibt

---

## 12. Keine komplexe Retry-/Monitoring-/Queue-Infrastruktur

Nicht Bestandteil des MVP ist:

- technische Retry-Orchestrierung
- visuelles Retry-Management
- globale Queue-Monitore
- Dead-Letter-Konzepte
- umfassendes technisches Integrationsmonitoring

Das MVP darf Audit und nachvollziehbare Fachereignisse haben, aber keine große Betriebsplattform werden.

---

## 13. Keine komplexe Rechte- und Policy-Engine

Nicht Bestandteil des MVP ist:

- ABAC
- komplexe Policy-Sprachen
- frei modellierbare Security-Matrix
- globale Ausnahme- oder Eskalations-Policies
- dynamische Rechteausdrücke

Das MVP verwendet bewusst:

- `r`
- `w`
- `x`
- Groups
- Memberships
- dokumentbezogene Rollen
- Workflow-/Statusregeln

---

## 14. Kein Builder-zentriertes Produktmodell

Nicht Ziel des MVP ist, dass das Produkt sich um Builder oder Designoberflächen dreht.

Das MVP ist:

- nutzungszentriert
- dokumentzentriert
- workflowzentriert
- arbeitsorientiert

Nicht MVP-Kern sind:

- Builder als Hauptnavigation
- Designer als Produktzentrum
- Modellierungsoberflächen als Hauptverkaufsargument

---

## 15. Keine technische Arbeits-UI

Nicht Bestandteil des MVP ist eine Arbeits-UI, die standardmäßig zeigt:

- Workflow-JSON
- MDX-Rohtext
- operationRef-Listen
- technische Registry-Daten
- Bridge-/Legacy-Strukturen
- technische Logs

Die Standard-Arbeits-UI bleibt:

- ruhig
- fachlich
- handlungsorientiert

---

## 16. Kein Reporting-/BI-Ausbau im MVP

Nicht Bestandteil des MVP ist:

- KPI-Dashboard als Hauptfunktion
- BI-Auswertungen
- erweiterte Reporting-Engine
- freie Pivot-/Analysefunktionen
- Management-Dashboard als Produktkern

Ein späterer Ausbau ist möglich, aber nicht Bestandteil des MVP.

---

## 17. Kein vollwertiges DMS als Ziel des MVP

Nicht Ziel des MVP ist:

- Dokumentenmanagement für beliebige Inhalte
- Metadatenverwaltung für beliebige Dokumenttypen
- Aktenmanagement
- revisionssicheres allgemeines Archivsystem
- ECM-/DMS-Funktionsumfang

Attachments und Nachweise sind Teil des MVP, aber das Produkt ist kein allgemeines DMS.

---

## 18. Keine freie Produkt-Konfiguration durch Endnutzer

Nicht Bestandteil des MVP ist:

- frei konfigurierbare Hauptnavigation
- frei konfigurierbare Objektarten
- frei konfigurierbare beliebige Felddomänen ohne definierte Spezifikation
- User-seitige Designerfreiheit ohne Konfigurationsrahmen

Das Produkt bleibt im MVP bewusst strukturiert und geführt.

---

## 19. Zukunftsrichtungen nach dem MVP

Die folgenden Themen sind ausdrücklich **Zukunftsrichtungen**, aber kein MVP-Bestandteil.

---

## 20. Spätere Authentifizierung

Mögliche spätere Ausbaustufen:

- lokale Auth
- OIDC
- Microsoft Entra
- rollenbasierte Anmeldung
- MFA/2FA

---

## 21. Spätere Multitenancy

Mögliche spätere Ausbaustufen:

- TenantContext
- tenantgebundene Daten
- tenantgebundene Credentials
- tenantgebundene Konfiguration
- tenantgebundene Brandingmodelle

---

## 22. Spätere Builder

Mögliche spätere Ausbaustufen:

- Form Builder
- Workflow Builder
- visuelle Regelunterstützung
- MDX-/JSON-gestützte Designhilfen

Wichtig:
- spätere Builder dürfen kommen
- sie ersetzen nicht rückwirkend die jetzt führenden Spezifikationen
- sie müssen auf den definierten Modellen aufsetzen

---

## 23. Spätere Integrationsausbauten

Mögliche spätere Ausbaustufen:

- produktiver Secret Store
- vollständige OAuth-Flows
- SAP-Connectoren
- Salesforce-Connectoren
- separater Integration-Service
- Retry-/Queue-/Monitoring-Ausbau

---

## 24. Spätere Workspace- und Teamfunktionen

Mögliche spätere Ausbaustufen:

- Work Queues
- Team-Boards
- Due Dates
- Eskalationslogik
- SLA-Konzepte
- persönliche Ansichten

---

## 25. Spätere Reporting-Funktionen

Mögliche spätere Ausbaustufen:

- erweiterte Tabellen
- CSV-/Excel-/PDF-Exporte
- KPI-Sichten
- Verlaufsauswertungen
- Management-Reporting

---

## 26. Spätere Admin- und Betriebsfunktionen

Mögliche spätere Ausbaustufen:

- erweiterte Admin-Rollen
- Credential-Verwaltung
- Connector-Konfiguration
- technische Monitoring-Sichten
- Betriebsdiagnostik
- Health-/Audit-Konsolen

---

## 27. Nicht-Ziele dürfen das MVP nicht verdeckt dominieren

Ein zentrales Regelprinzip lautet:

Themen, die hier als Nicht-Ziel oder Zukunftsthema definiert sind, dürfen:

- nicht die Hauptnavigation dominieren
- nicht die Arbeits-UI dominieren
- nicht die Spezifikation stillschweigend umlenken
- nicht die Implementierung in Richtung eines anderen Produkts verschieben

Das MVP bleibt fokussiert.

---

## 28. Ergebnisregel

Die in diesem Dokument definierten Nicht-Ziele und Zukunftsthemen sind verbindlich für die Abgrenzung des MVP.

Spätere Implementierungen, Entscheidungen und Erweiterungen dürfen davon abweichen **nur**, wenn dieses Dokument zuerst angepasst wird.
