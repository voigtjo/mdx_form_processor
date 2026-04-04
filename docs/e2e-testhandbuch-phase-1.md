# E2E-Testhandbuch Phase 1

## Reset und Start

Im Projektverzeichnis ausfuehren:

```bash
cd /Users/jvoigt/Projects/_formapps/mdx_form_processor
npm run db:rebuild:reference
npm run build
npm run smoke:forms
npm run smoke:next-form
npm run smoke:reference
npm run e2e:reference
npm run dev
```

Wenn `npm run dev` laeuft, im Browser mit `?user=...` arbeiten.

## Referenz-URLs

- Workspace Admin: `http://localhost:3000/workspace?user=admin`
- Documents Admin: `http://localhost:3000/documents?user=admin`
- APIs: `http://localhost:3000/apis?user=admin`

- Kundenauftrag Service: `http://localhost:3000/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1?user=service-durchfuehrung-dokumentation`
- Kundenauftrag Freigabe: `http://localhost:3000/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1?user=service-auftrag-freigabe`
- Typed Record Customer: `http://localhost:3000/api/typed-records/customer-orders/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1?user=admin`

- Produktion Bearbeitung: `http://localhost:3000/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee2?user=produktion-durchfuehrung-dokumentation`
- Produktion Freigabe: `http://localhost:3000/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee2?user=produktion-auftrag-freigabe`
- Typed Record Produktion: `http://localhost:3000/api/typed-records/production-records/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee2?user=admin`

- Qualifikation Service: `http://localhost:3000/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3?user=service-durchfuehrung-dokumentation`
- Qualifikation Produktion: `http://localhost:3000/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3?user=produktion-durchfuehrung-dokumentation`
- Qualifikation Admin: `http://localhost:3000/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3?user=admin`
- Typed Record Qualifikation: `http://localhost:3000/api/typed-records/qualification-records/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3?user=admin`

- Generisches Formular Bearbeitung: `http://localhost:3000/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee4?user=service-durchfuehrung-dokumentation`
- Generisches Formular Freigabe: `http://localhost:3000/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee4?user=admin`
- Typed Record Generic: `http://localhost:3000/api/typed-records/generic-form-records/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee4?user=admin`

## Testreihenfolge

1. Documents und APIs kurz pruefen
2. Kundenauftrag
3. Produktionsdokumentation
4. Qualifikationsnachweis
5. Generisches Formular
6. typed records und APIs querpruefen
7. Abschlussbewertung

## 1. Documents und APIs kurz pruefen

### Was du tun sollst

- `Documents` als Admin oeffnen
- im Suchfeld nacheinander suchen nach:
  - `KD-2026-1007`
  - `PB-2026-0042`
  - `QN-2026-001`
  - `GF-2026-001`
- danach `/apis` oeffnen

### Was du sehen sollst

- genau die vier Familien sind sichtbar
- in der Liste steht je Familie eine fachliche Leitkennung
- auf `/apis` gibt es:
  - API List
  - Form Data APIs
  - Typed Record APIs
  - Stammdaten APIs

### Fehler erkennen

- Suche findet eine der vier Leitkennungen nicht
- typed record APIs fehlen auf `/apis`
- alte Demo- oder Preview-Pfade tauchen sichtbar als Produktweg auf

## 2. Kundenauftrag

### Was du tun sollst

- Kundenauftrag als `service-durchfuehrung-dokumentation` oeffnen
- `Kundendaten laden` ausloesen
- `Materialvorschlag holen` ausloesen
- Arbeitstext pflegen
- signieren
- speichern
- submitten
- denselben Vorgang als `service-auftrag-freigabe` oeffnen
- approven
- danach typed-record-Detail-API oeffnen

### Was du sehen sollst

- Customer- und Product-Daten kommen aus internen Stammdaten
- Dokumentstatus laeuft sauber bis `approved`
- im Dokumentkontext steht:
  - `form_type`
  - typed table
  - typed record vorhanden
  - `Typed Record API`
- die typed API liefert u. a.:
  - `orderNumber`
  - `customerName`
  - `serviceLocation`
  - `material`
  - `workDescriptionHtml`
  - `workSignatureAt`
  - `approvalStatus`
  - `status`

### Fehler erkennen

- Kundendaten oder Produktvorschlag laden nicht
- Save/Submit/Approve laufen nicht im normalen Dokumentpfad
- typed record zeigt leere oder unpassende Kernfelder

## 3. Produktionsdokumentation

### Was du tun sollst

- Produktionsdokumentation als `produktion-durchfuehrung-dokumentation` oeffnen
- Grid-Werte aendern oder ergaenzen
- signieren
- speichern
- submitten
- als `produktion-auftrag-freigabe` approven
- danach typed-record-Detail-API oeffnen

### Was du sehen sollst

- Grid bleibt im Dokument sichtbar und ruhig lesbar
- der Vorgang laeuft bis `approved`
- die typed API liefert u. a.:
  - `batchId`
  - `serialNumber`
  - `productName`
  - `productionLine`
  - `processStepsJson`
  - `workSignatureAt`
  - `approvalStatus`
  - `status`

### Fehler erkennen

- Grid verliert Werte nach Save
- Status springt nicht sauber durch Submit/Approve
- `processStepsJson` fehlt oder ist leer trotz gepflegtem Grid

## 4. Qualifikationsnachweis

### Was du tun sollst

- als `service-durchfuehrung-dokumentation` oeffnen
- auf Seite 2 wechseln
- Radio-/Checkbox-Antworten setzen
- auf Seite 3 wechseln
- signieren
- speichern
- submitten
- als `produktion-durchfuehrung-dokumentation` denselben Ablauf wiederholen
- als `admin` oeffnen und Fortschritt pruefen
- approven
- danach typed-record-Detail-API oeffnen

### Was du sehen sollst

- `Seite 1 von 3`, `Seite 2 von 3`, `Seite 3 von 3`
- nur die aktuelle Seite ist sichtbar
- Beteiligtenfortschritt ist kompakt lesbar
- Auswertung zeigt Status, Score, Pass/Fail/Pending und Zeitpunkt
- typed API liefert u. a.:
  - `qualificationRecordNumber`
  - `qualificationTitle`
  - `ownerUserId`
  - `validUntil`
  - `qualificationResult`
  - `qualificationTopicsJson`
  - `evaluationStatus`
  - `scoreValue`
  - `passed`
  - `approvalStatus`
  - `status`

### Fehler erkennen

- Vor/Zurueck zeigt nicht nur die aktuelle Seite
- per-User-Stand geht verloren
- Auswertung bleibt leer oder fachlich unplausibel
- typed record bildet Antwort- und Bewertungsfelder nicht ab

## 5. Generisches Formular

### Was du tun sollst

- generisches Formular als `service-durchfuehrung-dokumentation` oeffnen
- Titel, Beschreibung und Notiz fuellen
- signieren
- speichern
- submitten
- als `admin` approven
- danach typed-record-Detail-API oeffnen

### Was du sehen sollst

- normaler Formularpfad ohne Sonder-UI
- Status laeuft bis `approved`
- typed API liefert u. a.:
  - `formTitle`
  - `description`
  - `note`
  - `approvalStatus`
  - `status`
  - `payloadJson`

### Fehler erkennen

- generic_form wirkt wie technischer Fallback statt Produktformular
- typed record bleibt leer

## 6. APIs und typed records querpruefen

### Was du tun sollst

- `/apis` oeffnen
- die vier Links im Bereich `Typed Record APIs` pruefen
- zusaetzlich pruefen:
  - `http://localhost:3000/api/typed-records/customer-orders/export.csv?user=admin`
  - `http://localhost:3000/api/typed-records/production-records/export.csv?user=admin`
  - `http://localhost:3000/api/typed-records/qualification-records/export.csv?user=admin`
  - `http://localhost:3000/api/typed-records/generic-form-records/export.csv?user=admin`

### Was du sehen sollst

- Family-Listen liefern echte Referenzdaten
- Family-CSV-Exporte haben Header und Datenzeilen
- `/apis` bleibt kompakt und wartbar

### Fehler erkennen

- typed APIs liefern ausgedachte Daten statt typed-table-Inhalte
- CSV-Exporte fehlen oder enthalten keine fachlichen Kernspalten

## Abschlusspruefung

Der manuelle Phase-1-Test ist insgesamt bestanden, wenn:

- alle vier Familien im normalen Produktpfad sichtbar und bedienbar sind
- Save, Submit und Approve in allen vier Familien funktionieren
- der Qualifikationsnachweis Mehrbenutzer, Pages und Auswertung sauber zeigt
- `/apis` die Plattform-APIs und typed record APIs sichtbar macht
- die typed-record-Detail-APIs nach jedem Fachtest passende Daten liefern
- keine Preview-/Dev-/Paralleloberflaeche als Produktweg auftaucht

Wenn einer dieser Punkte nicht erfuellt ist, gilt Phase 1 fuer den manuellen End-to-End-Test noch nicht als bestanden.
