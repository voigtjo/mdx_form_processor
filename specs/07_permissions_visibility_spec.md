# 07 — Permissions and Visibility Specification

## 1. Ziel dieses Dokuments

Dieses Dokument definiert das führende Rechte- und Sichtbarkeitsmodell des MVP.

Es legt verbindlich fest:

- welche Rechte es gibt
- wie Rechte über Groups und Memberships vergeben werden
- wie Template-Sichtbarkeit funktioniert
- wie Document-Sichtbarkeit funktioniert
- wie Editor- und Approver-Rollen wirken
- wann Actions sichtbar und ausführbar sind
- welche Informationen in Workspace, Listen und Details sichtbar sein dürfen

Dieses Dokument ist die führende Wahrheit für Rechte und Sichtbarkeit.

---

## 2. Grundsatzentscheidung

Für das MVP gilt ein bewusst einfaches Rechte- und Sichtbarkeitsmodell.

Die führenden Ebenen sind:

1. **Membership-Rechte auf Group-Ebene**
2. **Template-Zuweisung an Groups**
3. **dokumentbezogene Rollen**
4. **Workflow- und Action-Regeln**
5. **sichtbarkeitsbezogene Template-/Feldregeln**

Es gibt im MVP **keine** komplexe Policy-Engine.

---

## 3. Rechte des MVP

Im MVP gibt es genau drei Rechte:

- `r` = read
- `w` = write
- `x` = execute

Diese Rechte werden über Memberships zwischen User und Group vergeben.

---

## 4. Bedeutung der Rechte

## 4.1 read (`r`)

`r` erlaubt das Lesen von Objekten, sofern:

- der User über seine Group grundsätzlich Zugriff hat
- das Template oder Document für ihn sichtbar ist

`r` allein erlaubt **nicht**:
- Bearbeitung
- Action-Ausführung

---

## 4.2 write (`w`)

`w` erlaubt das Bearbeiten, sofern zusätzlich:

- das Objekt sichtbar ist
- der Workflowstatus Bearbeitung zulässt
- die dokumentbezogene Rolle Bearbeitung zulässt

`w` allein garantiert **nicht**, dass ein Feld jederzeit bearbeitbar ist.

---

## 4.3 execute (`x`)

`x` erlaubt das Ausführen von Actions, sofern zusätzlich:

- der User das Objekt sehen darf
- der aktuelle Workflowstatus die Action zulässt
- die dokumentbezogene Rolle die Action zulässt

`x` allein garantiert **nicht**, dass jede Action sichtbar oder ausführbar ist.

---

## 5. Rechtevergabe über Membership

## 5.1 Membership als führendes Modell

Die Membership ist die führende Verbindung zwischen:

- User
- Group
- Rechten

Normative Struktur:

```text
Membership
├── userId
├── groupId
└── rights
```

## 5.2 Grundregel

Ein User erhält seine Grundrechte im MVP nicht direkt am Template oder Document, sondern über seine Membership in einer Group.

---

## 6. Template-Sichtbarkeit

## 6.1 Grundregel

Ein User sieht ein Form Template, wenn:

1. seine Group dem Template zugewiesen ist
2. seine Membership in dieser Group mindestens `r` enthält

## 6.2 Template Assignment

Das Template Assignment verbindet:
- Template
- Group

Es ist die führende Sichtbarkeitsbrücke auf Template-Ebene.

## 6.3 Konsequenz

Ohne Group-Zuweisung ist ein Template für einen User im MVP nicht sichtbar, auch wenn der User existiert.

---

## 7. Document-Sichtbarkeit

## 7.1 Grundregel

Ein User sieht ein Document nur, wenn:

1. er das zugrunde liegende Template sehen darf
2. die Sichtbarkeitsregeln des Templates oder Documents dies erlauben

## 7.2 Fachlicher Sichtbarkeitsrahmen

Die Sichtbarkeit eines Documents ist enger als die reine Template-Sicht.

Denn ein Template kann z. B. definieren:
- dass nur Editors und Approvers die Documents sehen
- dass Group-Mitglieder mit Read-Recht die Documents sehen dürfen
- dass bestimmte Felder oder Bereiche eingeschränkt sichtbar sind

## 7.3 Führende Sichtbarkeitsstufen für Documents

Ein Document kann im MVP fachlich in diesen Sichtbarkeitsmodellen betrieben werden:

### Modell A — Group-visible
Alle Group-Mitglieder mit `r` dürfen die Documents des Templates sehen.

### Modell B — Role-visible
Nur dokumentbezogene Rollen wie Editor und Approver dürfen die Documents sehen.

### Modell C — Mixed-visible
Group-Mitglieder mit `r` dürfen das Document sehen, aber bestimmte Bearbeitungs- oder Detailbereiche bleiben rollenbezogen.

Die konkrete Auswahl wird in der Template-/Screen-Spezifikation präzisiert.

---

## 8. Dokumentbezogene Rollen

Im MVP gibt es zwei führende dokumentbezogene Rollen:

- `editor`
- `approver`

Diese Rollen sind **nicht** identisch mit Membership-Rechten.

Sie sind:
- dokumentbezogen
- laufzeitbezogen
- für konkrete Documents vergeben

---

## 9. Editor

Ein Editor ist ein User, der ein Document in dafür vorgesehenen Status bearbeiten darf.

### Typische fachliche Wirkung
- Formfelder bearbeiten
- speichern
- submitten
- je nach Workflow auch assign/reAssign ausführen

### Voraussetzungen
Ein Editor benötigt in der Praxis:
- Sichtbarkeit auf das Document
- ausreichende Group-Rechte
- dokumentbezogene Editor-Zuweisung
- passenden Workflowstatus

---

## 10. Approver

Ein Approver ist ein User, der ein Document freigeben oder zurückweisen darf.

### Typische fachliche Wirkung
- approve
- reject
- ggf. archive

### Voraussetzungen
Ein Approver benötigt:
- Sichtbarkeit auf das Document
- ausreichende Group-Rechte
- dokumentbezogene Approver-Zuweisung
- passenden Workflowstatus

---

## 11. Mehrfach-Zuweisung

Das MVP unterstützt:

- mehrere Editors
- mehrere Approvers

Die genaue Semantik, wann eine Action mit mehreren Rolleninhabern als erfüllt gilt, wird über das Workflow-Modell bestimmt.

Beispiele:
- Submit genügt durch einen Editor
- Approval erfordert alle Approvers

---

## 12. Sichtbarkeit von Actions

Eine Action ist nur sichtbar, wenn alle folgenden Bedingungen erfüllt sind:

1. der User darf das Document sehen
2. der aktuelle Workflowstatus erlaubt die Action
3. die dokumentbezogene Rolle erlaubt die Action
4. der User besitzt `x`
5. optionale weitere Validierungen verhindern die Anzeige nicht

---

## 13. Ausführbarkeit von Actions

Eine sichtbare Action ist nur dann tatsächlich ausführbar, wenn zusätzlich:

- alle Validierungsregeln erfüllt sind
- Pflichtfelder erfüllt sind
- kein Statuskonflikt vorliegt
- das Document nicht archiviert ist

Das bedeutet:
- Sichtbarkeit und Ausführbarkeit sind nicht identisch
- eine Action kann sichtbar, aber disabled sein

---

## 14. Feldsichtbarkeit

Die Sichtbarkeit eines Feldes ergibt sich aus:

1. Formularstruktur
2. optionalem `visibleTo`
3. Rollen- und Sichtbarkeitsmodell
4. Document-Sichtbarkeit

## 14.1 visibleTo

`visibleTo` darf Felder zusätzlich einschränken.

### Beispiel
Ein Feld oder Bereich kann nur für:
- `editor`
- `approver`
- beide
- allgemeine Leser

sichtbar sein.

## 14.2 Regel

`visibleTo` darf die Sichtbarkeit enger machen, aber nicht das grundlegende Group-/Document-Rechtemodell ersetzen.

---

## 15. Feldbearbeitbarkeit

Die Bearbeitbarkeit eines Feldes ergibt sich nicht nur aus `w`, sondern aus der Kombination von:

1. Sichtbarkeit des Documents
2. Rollen-Zuweisung
3. Workflowstatus
4. Workflow-Feldregeln
5. Template-Feldregeln
6. `w`

Ein User mit `w` darf also nicht automatisch alles bearbeiten.

---

## 16. Sichtbarkeit im Workspace

## 16.1 My Groups

Zeigt die Groups des aktuell ausgewählten Users.

## 16.2 My Tasks

Zeigt Tasks des aktuell ausgewählten Users, die noch relevant oder offen sind.

## 16.3 My Templates

Zeigt nur Templates, die:
- dem User über seine Groups zugewiesen sind
- und für die der User mindestens `r` besitzt

## 16.4 My Documents

Zeigt nur Documents, die:
- der User sehen darf
- nicht archiviert sind, sofern kein Archivfilter aktiv ist

---

## 17. Sichtbarkeit in Dokumentlisten

## 17.1 My Documents

Listet Documents, die für den User sichtbar sind.

## 17.2 Documents by Template

Listet Documents eines konkreten Templates, aber nur innerhalb der für den User zulässigen Sichtbarkeit.

## 17.3 Tabellenfelder

Tabellenfelder eines Templates dürfen nur dann gezeigt werden, wenn:
- das Document sichtbar ist
- das jeweilige Feld sichtbar ist

---

## 18. Sichtbarkeit im Document Detail

Ein User darf das Document Detail nur öffnen, wenn das Document sichtbar ist.

Im Detail gilt:

- Work Summary nur für sichtbare Documents
- Form nur für sichtbare Documents
- Attachments nur, wenn sicht- und rollenbezogen erlaubt
- History nur für sichtbare Documents
- Action-Buttons nur nach Action-Regeln

---

## 19. Admin-Sichtbarkeit

Der Admin-Bereich ist eine Konfigurationsfläche.

Im MVP gilt:

- Admin ist kein gesondertes komplexes Superuser-Modell
- Admin-Sichtbarkeit wird durch den gewählten Userkontext und dessen Rechte abgebildet
- administrative Pflege bezieht sich auf:
  - Users
  - Groups
  - Memberships
  - Template Assignments

Eine spätere feinere Admin-Rollenmodellierung ist nicht Bestandteil des MVP.

---

## 20. Standardregeln für archivierte Objekte

## 20.1 Archivierte Documents

Archivierte Documents sind standardmäßig nicht in normalen Arbeitslisten sichtbar.

Sie werden nur sichtbar, wenn:
- ein entsprechender Filter aktiv ist
- der User das Document grundsätzlich sehen darf

## 20.2 Archivierte Templates

Archivierte Templates dürfen historisch sichtbar bleiben, aber nicht für neue Documents genutzt werden.

---

## 21. Konfliktregeln

## 21.1 Membership vs. Dokumentrolle

Wenn ein User keine ausreichende Membership-Grundsichtbarkeit hat, darf ihn eine dokumentbezogene Rolle nicht künstlich sichtbar machen, außer das Produktmodell lässt das ausdrücklich zu.

Für das MVP gilt:
- Group-/Membership-Sichtbarkeit ist die Grundvoraussetzung

## 21.2 Template-Sichtbarkeit vs. Feldsichtbarkeit

Wenn ein User das Document nicht sehen darf, helfen auch feldbezogene Sichtbarkeiten nicht.
Das heißt:
- Document-Sichtbarkeit geht vor Feldsichtbarkeit

## 21.3 Workflowstatus vs. write-Recht

Ein User mit `w` darf ein Feld nicht bearbeiten, wenn der Workflowstatus oder die Feldregel das nicht zulässt.

## 21.4 execute-Recht vs. Action-Regel

Ein User mit `x` darf eine Action nicht ausführen, wenn:
- seine Rolle die Action nicht ausführen darf
- oder der Status die Action nicht zulässt

---

## 22. Nicht Bestandteil des MVP-Rechtemodells

Nicht Bestandteil des führenden MVP-Modells sind:

- komplexe Policy-Engine
- Attribut-basierte Zugriffskontrolle
- rollenübergreifende globale Ausnahme-Policies
- mandantenfähige Sichtbarkeitsregeln
- dynamische Regelsprachen
- frei modellierbare Security-Matrix

---

## 23. Ergebnisregel

Das in diesem Dokument beschriebene Rechte- und Sichtbarkeitsmodell ist das führende Modell des MVP.

Spätere UI-, Workflow- oder Laufzeitlogik darf davon abweichen **nur**, wenn dieses Dokument zuerst angepasst wird.
