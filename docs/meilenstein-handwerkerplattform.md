# Meilensteinpruefung — plattformfaehig fuer die Handwerkerplattform

## Bewertungslogik

- `erfuellt`: im normalen Produktpfad produktiv sichtbar und getestet
- `teilweise`: Richtung klar, aber noch nicht voll tragfaehig
- `offen`: noch kein belastbarer Slice
- `Risiko`: worauf bei den naechsten Schritten zu achten ist

## Checkliste

| Baustein | Status | Notiz | Risiko |
| --- | --- | --- | --- |
| Templates | erfuellt | versioniert, UI-pflegbar, Workflow-Zuordnung, API-Bindings | form_type-Editor spaeter noch straffer ziehen |
| Workflows | erfuellt | DB, UI, Transition-Tabelle, Lifecycle | Hook-/API-Ausbau spaeter vertiefen |
| Documents | erfuellt | SSR + HTMX, kompakter Dokumentpfad, Journal, Attachments, typed Leitkennung in Liste und Suche | Listen lesen weiterhin ueber `documents` plus typed joins |
| APIs als DB + UI + Runtime | erfuellt | `/apis` pflegt zentrale DB-APIs mit `handler_ts_source` | keine Sandbox fuer fremde Handler im MVP |
| interne Stammdaten via CSV + lesende APIs | erfuellt | Customers und Products werden per CSV importiert und gelesen | spaeter Delta-/Validierungslogik erweitern |
| Lookup-/Action-Bindings | erfuellt | Templates und Workflows referenzieren zentrale APIs | noch keine breite Bibliothek |
| Grid | erfuellt | produktiv im Produktionsnachweis | Aggregationen noch offen |
| html-editor | erfuellt | produktiv in der Kundenservice-Dokumentation | WYSIWYG bleibt bewusst klein |
| signature | erfuellt | global und per User im Qualifikationsfall | keine Bild-/Canvas-Signatur |
| user-select / user-multiselect | erfuellt | produktiv im Qualifikationsnachweis | noch kein grosser People-Picker |
| radio-group / checkbox-group | erfuellt | produktiv im Qualifikationsnachweis | Auswertung spaeter fachlich vertiefen |
| Mehrbenutzerfall | erfuellt | per-User Save/Submit/Signatur, kompakte Fortschrittssicht | noch keine allgemeine Collaboration-Engine |
| Qualification Pages + Auswertung | erfuellt | 3 Seiten, per-User Seitenstand, erste Bewertung sichtbar und in `qualification_records` synchronisiert | noch kein allgemeines Seiten-Framework |
| typed entity tables | erfuellt | Tabellen werden synchron befuellt, tragen fachliche Kernfelder und sind ueber Detail-, Listen- und CSV-Schnitte lesbar | Schreibseite bleibt vorerst an `documents.data_json` gekoppelt |
| generisches Formular | erfuellt | `generic_form` ist Template, Workflow, Dokument und typed Record im normalen Produktpfad | Typ bleibt bewusst minimal |
| Journal / Attachments | erfuellt | vorhanden und verdichtet | Medienausbau spaeter |
| Start-to-End-Tests fuer 4 Familien | erfuellt | `e2e:reference` prueft Kundenservice-Dokumentation, Produktion, Qualifikation und generic_form | derzeit noch referenzdatengestuetzt, nicht browsergetrieben |

## Fazit

Der Zwischenstand ist fuer den Meilenstein **plattformfaehig fuer die Handwerkerplattform** tragfaehig.

Offene Restpunkte liegen nicht mehr im fehlenden Plattformkern, sondern in der naechsten Vertiefung:

- typed entities spaeter noch staerker als fuehrende Listen- und Reportingbasis nutzen
- generischen Formulartyp spaeter in Richtung mehr Felder und Referenzen ausbauen
- Qualification Pages spaeter vorsichtig generalisieren
