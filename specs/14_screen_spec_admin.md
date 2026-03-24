# 14 — Screen Specification: Admin

## 1. Ziel dieses Dokuments

Dieses Dokument definiert die führende Spezifikation für den Bereich **Admin** im MVP.

Es legt verbindlich fest:

- welche Screens und Unterbereiche der Admin-Bereich besitzt
- wie Users, Groups, Memberships und Template Assignments verwaltet werden
- welche Informationen im Admin-Bereich sichtbar sind
- welche Aktionen dort erlaubt sind
- wie sich Admin klar von Arbeits-UI und Konfigurations-UI abgrenzt
- welche Informationen standardmäßig sichtbar sind
- welche Informationen bewusst nicht Teil des MVP-Admin-Bereichs sind

Dieses Dokument ist die führende Wahrheit für den Admin-Bereich.

---

## 2. Rolle des Admin-Bereichs im Produkt

Der Bereich Admin ist die führende Verwaltungs-UI des MVP.

Er dient dazu:

- Users zu pflegen
- Groups zu pflegen
- Memberships zu pflegen
- Template Assignments zu pflegen

Der Admin-Bereich ist **nicht**:

- die tägliche Arbeits-UI
- die primäre Template-Konfigurations-UI
- die primäre Workflow-Konfigurations-UI
- eine technische Debug- oder Integrationsoberfläche
- ein globales Systemcockpit

---

## 3. Führende Unterbereiche des Admin-Bereichs

Der Admin-Bereich besitzt im MVP genau diese Unterbereiche:

- Users
- Groups
- Memberships
- Template Assignments

Diese Unterbereiche sind führend.

Sie können als Tabs oder sekundäre Unter-Navigation umgesetzt werden.

---

## 4. Grundsätze des Admin-Bereichs

Für den Admin-Bereich gelten diese Prinzipien:

1. Der Admin-Bereich ist verwaltungsorientiert.
2. Der Admin-Bereich bleibt bewusst einfach.
3. Es gibt im MVP kein komplexes Admin-Rollenmodell.
4. Der Admin-Bereich verwaltet Kernobjekte, baut aber keine zweite Arbeits-UI auf.
5. Der Admin-Bereich zeigt keine unnötigen technischen Tiefenmodelle.

---

## 5. Unterbereich: Users

## 5.1 Zweck

Der Bereich Users dient dazu, die im MVP auswählbaren Benutzer zu verwalten.

## 5.2 Sichtbare Informationen je User

Mindestens sichtbar:

- Display Name
- Key
- E-Mail, sofern vorhanden
- Status

## 5.3 Hauptaktionen

Mindestens:

- New User
- Edit User
- Deactivate User

Optional später:
- Reactivate User

## 5.4 Bearbeitbare Inhalte

Mindestens bearbeitbar:

- displayName
- key
- email
- status

## 5.5 Nicht Ziel des Users-Bereichs

Nicht Teil des MVP-Users-Bereichs sind:

- Passwortverwaltung
- Login-Daten
- Identity-Provider-Zuordnung
- Session-Management
- MFA-/2FA-Konfiguration

Diese Themen sind nicht Teil des MVP, weil das MVP ohne Authentifizierung startet.

---

## 6. Unterbereich: Groups

## 6.1 Zweck

Der Bereich Groups dient dazu, organisatorische Einheiten zu verwalten.

## 6.2 Sichtbare Informationen je Group

Mindestens sichtbar:

- Name
- Key
- Description, sofern vorhanden
- Status optional

## 6.3 Hauptaktionen

Mindestens:

- New Group
- Edit Group
- Delete Group, wenn fachlich zulässig

## 6.4 Bearbeitbare Inhalte

Mindestens bearbeitbar:

- name
- key
- description
- status optional

## 6.5 Regeln für Delete

Eine Group darf im MVP nur gelöscht werden, wenn dies fachlich sauber möglich ist.

Empfohlene Regel:
- keine aktiven referenzierenden Memberships
- keine relevanten aktiven Template Assignments

Alternativ kann statt Delete auch Deactivate verwendet werden.

---

## 7. Unterbereich: Memberships

## 7.1 Zweck

Der Bereich Memberships dient dazu, Users zu Groups zuzuordnen und Rechte zu vergeben.

## 7.2 Sichtbare Informationen je Membership

Mindestens sichtbar:

- User
- Group
- Rights

## 7.3 Hauptaktionen

Mindestens:

- Add Membership
- Edit Rights
- Remove Membership

## 7.4 Rechtebearbeitung

Im MVP werden genau diese Rechte gepflegt:

- `r`
- `w`
- `x`

Die UI muss klar machen:
- was gesetzt ist
- was nicht gesetzt ist

## 7.5 Regeln

Eine Membership ist die führende Verbindung zwischen:
- User
- Group
- Grundrechten

Sie wird nicht durch Template Assignments oder Document Assignments ersetzt.

---

## 8. Unterbereich: Template Assignments

## 8.1 Zweck

Der Bereich Template Assignments dient dazu, Form Templates Groups zuzuordnen.

## 8.2 Sichtbare Informationen je Assignment

Mindestens sichtbar:

- Template
- Group

Optional sichtbar:
- Versionshinweis oder Statuskontext, wenn fachlich nötig

## 8.3 Hauptaktionen

Mindestens:

- Assign Template to Group
- Remove Assignment

## 8.4 Regeln

Template Assignments definieren:
- welche Groups ein Template sehen dürfen
- und damit mittelbar, welche Users das Template über ihre Membership sehen können

Template Assignments sind nicht:
- Memberships
- Document Assignments
- Workflow Assignments

---

## 9. Gesamtstruktur des Admin-Bereichs

Der Admin-Bereich besteht im MVP aus:

1. Objektauswahl / Tabstruktur
2. Listenbereich
3. Detail-/Editorbereich

Empfohlene Struktur:

- links oder oben: Tab-/Unterbereichsnavigation
- zentral: Liste
- rechts oder darunter: Details / Editor

Die konkrete visuelle Struktur kann variieren, solange die fachliche Struktur erhalten bleibt.

---

## 10. Listen im Admin-Bereich

## 10.1 Grundsatz

Jeder Admin-Unterbereich besitzt mindestens eine führende Liste.

## 10.2 Eigenschaften der Listen

Admin-Listen müssen mindestens unterstützen:

- Übersicht
- Auswahl eines Objekts
- Öffnen des Bearbeitungszustands
- ggf. Anlegen eines neuen Objekts

## 10.3 Such- und Filterfunktion

Mindestens sinnvoll für:
- Users
- Groups
- Memberships
- Template Assignments

Im MVP genügt einfache Suche oder einfache Filterung.

---

## 11. Detail-/Editorflächen im Admin-Bereich

## 11.1 Zweck

Detail-/Editorflächen dienen dazu, genau ein Objekt kontrolliert zu bearbeiten.

## 11.2 Grundsatz

Admin-Editoren sollen:
- einfach
- klar
- nicht überladen
sein

## 11.3 Nicht Ziel

Admin-Editorflächen sind nicht:
- Builder
- technische Rohdaten-Editoren
- JSON-Debugansichten

---

## 12. Sichtbarkeitsregeln im Admin-Bereich

## 12.1 Grundsatz

Der Admin-Bereich ist keine normale Arbeits-UI, sondern Verwaltungs-UI.

## 12.2 Zugriff im MVP

Im MVP wird kein ausgebautes separates Admin-Rollenmodell definiert.

Der Zugriff auf Admin-Flächen wird zunächst über den gewählten Userkontext und die später konkretisierte Berechtigungslogik bestimmt.

## 12.3 Regel

Die Sichtbarkeit des Admin-Bereichs darf im MVP einfach gehalten werden, aber die fachliche Trennung zu Arbeits- und Konfigurations-UI muss klar bleiben.

---

## 13. Nicht Bestandteil des Admin-Bereichs im MVP

Nicht Bestandteil des führenden Admin-Bereichs sind:

- Template-MDX-Bearbeitung
- Workflow-JSON-Bearbeitung
- Operation-/Connector-Registry als Admin-Hauptbereich
- Credential-Verwaltung
- Mandantenverwaltung
- Authentifizierungsverwaltung
- Systemmonitoring
- Queue-/Retry-/Logverwaltung
- globale technische Debugpanels

Diese Themen sind entweder:
- kein MVP-Bestandteil
- oder gehören in andere Konfigurationsbereiche

---

## 14. Beziehung zu anderen Bereichen

## 14.1 Beziehung zu Templates

Der Admin-Bereich verwaltet Template Assignments, aber nicht die inhaltliche Template-Bearbeitung.

## 14.2 Beziehung zu Workflows

Der Admin-Bereich verwaltet keine Workflow-Inhalte.
Workflows werden im Workflow-Bereich gepflegt.

## 14.3 Beziehung zu Documents

Der Admin-Bereich verwaltet keine laufenden Documents als Arbeitsobjekte.

## 14.4 Beziehung zum Workspace

Der Admin-Bereich ist keine Start- oder Arbeitsseite.
Workspace bleibt die führende Arbeitsstartseite.

---

## 15. Layoutprinzipien

## 15.1 Grundsatz

Der Admin-Bereich muss ruhig und funktional sein.

## 15.2 Prioritäten

Wichtig sind:
- Übersicht
- einfache Bearbeitung
- klare Objekttrennung
- keine unnötige Techniklast

## 15.3 Nicht zulässig im Standard-Admin

- technische Registry-Dumps
- Integrations-Rohkonfigurationen
- JSON-Editoren für fachfremde Themen
- Builder- oder Designerlogik

---

## 16. Leere Zustände

## 16.1 Keine Users
Der Users-Bereich zeigt einen leeren Zustand mit Möglichkeit, einen User anzulegen.

## 16.2 Keine Groups
Der Groups-Bereich zeigt einen leeren Zustand mit Möglichkeit, eine Group anzulegen.

## 16.3 Keine Memberships
Der Memberships-Bereich zeigt einen leeren Zustand mit Möglichkeit, eine Membership anzulegen.

## 16.4 Keine Template Assignments
Der Template-Assignments-Bereich zeigt einen leeren Zustand mit Möglichkeit, ein Assignment anzulegen.

---

## 17. Ergebnisregel

Der in diesem Dokument beschriebene Admin-Bereich ist das führende Verwaltungsmodell des MVP.

Spätere UI-Implementierungen dürfen davon abweichen **nur**, wenn dieses Dokument zuerst angepasst wird.
