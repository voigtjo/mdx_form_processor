# 09 — Navigation and Information Architecture

## 1. Ziel dieses Dokuments

Dieses Dokument definiert die führende Navigations- und Informationsarchitektur des MVP.

Es legt verbindlich fest:

- welche Hauptbereiche die Anwendung besitzt
- wie Nutzer in diese Bereiche gelangen
- welche Bereiche Arbeits-UI sind
- welche Bereiche Konfigurations-UI sind
- welche Bereiche Admin-UI sind
- welche Informationen standardmäßig sichtbar sind
- welche Informationen nur in Advanced- oder Konfigurationsbereichen sichtbar sind
- wie die Hauptobjekte der Anwendung strukturell erreichbar sind

Dieses Dokument ist die führende Wahrheit für die Informationsarchitektur.

---

## 2. Grundsatzentscheidung

Für das MVP gilt:

- die Anwendung ist objekt- und arbeitsorientiert aufgebaut
- Arbeits-UI und Konfigurations-UI werden klar getrennt
- technische Details werden nicht in der Standard-Arbeits-UI gezeigt
- Navigation folgt dem tatsächlichen Arbeitsablauf, nicht internen Technikmodellen
- Hauptnavigation ist flach und stabil
- Advanced-/JSON-/Techniksichten sind sekundär

---

## 3. Führende Hauptbereiche der Anwendung

Die Anwendung besitzt im MVP genau diese Hauptbereiche:

- My Workspace
- Templates
- Workflows
- Documents
- Admin

Diese Hauptbereiche sind führend.

Zusätzliche Hauptnavigationseinträge sind im MVP nicht vorgesehen.

---

## 4. Bedeutungen der Hauptbereiche

## 4.1 My Workspace

My Workspace ist der zentrale Einstieg für den aktuell ausgewählten User.

Er dient dazu, arbeitsrelevante Dinge sofort sichtbar zu machen:

- My Groups
- My Tasks
- My Templates
- My Documents

My Workspace ist die führende Startseite der Arbeits-UI.

---

## 4.2 Templates

Der Bereich Templates dient dazu:

- Templates zu finden
- Templates zu öffnen
- Templates zu prüfen
- Templates zu bearbeiten
- Templates zu publizieren
- Templates zu archivieren
- Template-Versionen zu sehen
- Template-Dokumente zu öffnen

Templates ist Konfigurations-UI, nicht normale Arbeits-UI.

---

## 4.3 Workflows

Der Bereich Workflows dient dazu:

- Workflow Templates zu finden
- Workflow Templates zu öffnen
- Workflow Templates zu prüfen
- Workflow Templates zu bearbeiten
- Workflow-Versionen zu sehen
- Hook- und Action-Logik zu prüfen

Workflows ist Konfigurations-UI, nicht normale Arbeits-UI.

---

## 4.4 Documents

Der Bereich Documents dient dazu:

- Documents zu finden
- Documents zu filtern
- Documents zu öffnen
- Documents zu bearbeiten
- Documents zuzuweisen
- Documents weiterzuführen

Documents ist Arbeits-UI.

---

## 4.5 Admin

Der Bereich Admin dient dazu:

- Users zu pflegen
- Groups zu pflegen
- Memberships zu pflegen
- Template Assignments zu pflegen

Admin ist Verwaltungs- und Konfigurations-UI.

---

## 5. Führende Nutzerperspektiven

Die Informationsarchitektur orientiert sich an drei Hauptperspektiven.

## 5.1 Arbeitsnutzer

Der Arbeitsnutzer arbeitet primär über:

- My Workspace
- Documents

Er benötigt standardmäßig keine JSON- oder Technikansichten.

---

## 5.2 Template-/Prozessverantwortlicher

Der Template-/Prozessverantwortliche arbeitet primär über:

- Templates
- Workflows

Er benötigt:
- Konfiguration
- Vorschau
- Versionierung
- lesbare Zusammenfassungen
- JSON nur in Konfigurationsbereichen

---

## 5.3 Administrator

Der Administrator arbeitet primär über:

- Admin

Er verwaltet:
- Users
- Groups
- Memberships
- Template Assignments

---

## 6. Trennung von UI-Typen

Die Anwendung besteht aus drei UI-Typen:

### 6.1 Arbeits-UI
- My Workspace
- Documents
- Document Detail
- Aufgabenbezogene Listen

### 6.2 Konfigurations-UI
- Templates
- Workflow Templates
- Template-/Workflow-Detail und Bearbeitung
- Versionierung

### 6.3 Admin-UI
- Users
- Groups
- Memberships
- Template Assignments

Diese Trennung ist führend und darf im MVP nicht verwischt werden.

---

## 7. Standard-Sichtbarkeitsregel für Informationen

Die Anwendung folgt diesen Sichtbarkeitsregeln:

1. Standardseiten zeigen nur arbeits- oder konfigurationsrelevante Informationen.
2. Technische Details sind nur in Konfigurations-, Admin- oder Advanced-Bereichen sichtbar.
3. JSON ist niemals Teil normaler Arbeitsseiten.
4. Bridge-/Legacy-Konzepte erscheinen nicht in der Standard-Arbeits-UI.
5. Jede Seite hat genau einen primären Nutzungszweck.

---

## 8. Startpunkt der Anwendung

Die führende Startseite des MVP ist:

- **My Workspace**

Begründung:
- das Produkt ist auf tägliche Arbeit mit Documents ausgerichtet
- Nutzer sollen nicht in Templates oder Admin starten
- Arbeitsrelevanz steht vor Konfigurationsrelevanz

---

## 9. Führende Zugangswege zu Hauptobjekten

## 9.1 Zugang zu Templates

Templates sind erreichbar über:
- Hauptnavigation: Templates
- My Templates im Workspace

## 9.2 Zugang zu Workflows

Workflows sind erreichbar über:
- Hauptnavigation: Workflows
- Verlinkung aus Template Detail

## 9.3 Zugang zu Documents

Documents sind erreichbar über:
- Hauptnavigation: Documents
- My Documents im Workspace
- Dokumentlisten eines Templates
- Tasks im Workspace

## 9.4 Zugang zu Admin-Objekten

Admin-Objekte sind erreichbar über:
- Hauptnavigation: Admin

---

## 10. Führende Unterstruktur von Templates

Der Bereich Templates besitzt im MVP diese Struktur:

### Templates List
- Suche
- Filter
- Liste sichtbarer Templates

### Template Detail
- Overview
- Form
- Workflow
- Integrations
- Versions
- Documents

### Template Edit
- Meta
- MDX
- Preview
- Workflow-Zuweisung
- Group-Zuweisung
- Tabellenfelder
- Version/Status-Aktionen

---

## 11. Führende Unterstruktur von Workflows

Der Bereich Workflows besitzt im MVP diese Struktur:

### Workflow List
- Suche
- Liste sichtbarer Workflows

### Workflow Detail
- Overview
- JSON
- Hooks
- Usage

### Workflow Edit
- Meta
- JSON Editor
- Validierung
- lesbare Zusammenfassung

---

## 12. Führende Unterstruktur von Documents

Der Bereich Documents besitzt im MVP diese Struktur:

### Documents List
- Filter
- Liste sichtbarer Documents

### Document Detail
- Header
- Work Summary
- Form
- Attachments
- Journal
- History
- Assignment-/Task-Information

Die Document-Ansicht ist arbeitsorientiert und zeigt standardmäßig keine technischen JSON-Bereiche.

---

## 13. Führende Unterstruktur des Admin-Bereichs

Der Bereich Admin besitzt im MVP diese Struktur:

- Users
- Groups
- Memberships
- Template Assignments

Diese Unterbereiche erscheinen als Tabs oder sekundäre Unter-Navigation innerhalb des Admin-Bereichs.

---

## 14. Objektzentrierte Navigation

Die Anwendung ist objektzentriert.

Das bedeutet:

- Form Templates haben eigene Detail- und Bearbeitungsseiten
- Workflow Templates haben eigene Detail- und Bearbeitungsseiten
- Documents haben eigene Arbeitsseiten
- Admin-Objekte haben eigene Verwaltungsseiten

Navigation ist nicht builderzentriert und nicht metakonzeptzentriert.

---

## 15. Rolle von Listen

Listen sind im MVP zentrale Orientierungspunkte.

Es gibt insbesondere:

- Template-Liste
- Workflow-Liste
- Document-Liste
- Dokumentliste pro Template
- My Tasks
- My Templates
- My Documents

Listen dienen:
- dem Finden
- dem Filtern
- dem Öffnen
- dem Weiterarbeiten

Listen sind kein Nebenprodukt, sondern zentraler Bestandteil der Informationsarchitektur.

---

## 16. Rolle von Tabs

Tabs werden im MVP eingesetzt, um objektbezogene Sekundärbereiche zu strukturieren.

Tabs sind zulässig für:
- Template Detail
- Workflow Detail
- Admin

Tabs sind nicht dafür gedacht, konkurrierende Modellwelten gleichzeitig sichtbar zu machen, sondern logisch zusammengehörige Objektaspekte zu trennen.

---

## 17. Rolle von Advanced- und Technikansichten

Advanced- und Technikansichten sind im MVP sekundär.

Sie dürfen verwendet werden für:
- JSON-Ansichten
- Hook-/Operationsdetails
- Bridge-/Legacy-Hinweise
- technische Referenzen

Sie dürfen nicht:
- die Arbeits-UI dominieren
- Startseitencharakter haben
- normale Nutzerführung verdrängen

---

## 18. Informationshierarchie pro Objektart

## 18.1 Templates

### Primär sichtbar
- Name
- Key
- Status
- Version
- Workflow
- Groups
- Table Fields

### Sekundär sichtbar
- Integrationsbezüge
- Versionshistorie
- MDX im Edit-/Form-Kontext

### Nur in Konfiguration/Advanced
- technische JSON-/Technikhinweise

---

## 18.2 Workflows

### Primär sichtbar
- Name
- Key
- Statusfolge
- Actions
- Rollen
- Hooks in lesbarer Form

### Sekundär sichtbar
- Usage
- Versionen

### Nur in Konfiguration/Advanced
- JSON-Editor
- technische Details

---

## 18.3 Documents

### Primär sichtbar
- aktueller Status
- Work Summary
- Formular
- Attachments
- Journal
- History
- sichtbare Actions

### Sekundär sichtbar
- Assignment-/Task-Details
- Template- und Workflow-Version

### Nicht standardmäßig sichtbar
- technische JSON-Bereiche
- Integrationsrohkontext
- Bridge-/Legacy-Konzepte

---

## 18.4 Admin

### Primär sichtbar
- Listen und Zuweisungen zu Users, Groups, Memberships, Template Assignments

### Sekundär sichtbar
- Detail-/Editorpaneele
- einfache Status-/Validierungshinweise

---

## 19. Objektfluss in der Navigation

Der führende Nutzungsfluss der Navigation ist:

1. User startet in My Workspace
2. User öffnet Template oder Task oder Document
3. User arbeitet primär im Document-Kontext
4. Verantwortliche wechseln bei Bedarf in Templates oder Workflows
5. Administratoren wechseln bei Bedarf in Admin

Damit gilt:
- Workspace ist Einstieg
- Document ist Arbeitskern
- Template und Workflow sind Konfiguration
- Admin ist Verwaltung

---

## 20. Nicht Teil der Navigationsarchitektur des MVP

Nicht Bestandteil der führenden MVP-Navigation sind:

- Builder als Hauptnavigationspunkt
- API-/Connector-Admin als Hauptnavigationspunkt
- Dashboard mit BI-/KPI-Fokus als Hauptstartpunkt
- Multitenancy-Navigation
- komplexe globale Suchzentren für beliebige Objekte
- frei konfigurierbare Hauptnavigation

---

## 21. Ergebnisregel

Die in diesem Dokument beschriebene Navigations- und Informationsarchitektur ist das führende Strukturmodell des MVP.

Spätere UI-Implementierungen dürfen davon abweichen **nur**, wenn dieses Dokument zuerst angepasst wird.
