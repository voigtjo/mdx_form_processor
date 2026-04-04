# Ziel-Spec: Vereinfachtes Form-/MDX-Modell

## Zweck

Diese Spec beschreibt das Zielmodell fuer ein deutlich vereinfachtes Formularformat.

Das Format soll:

- direkt lesbar sein
- schlank bleiben
- praezise sein
- menschlich editierbar bleiben
- keine unnötige technische Schichtung tragen

## Grundbausteine

Das neue Format besteht nur aus diesen fachlichen Grundbausteinen:

- Dokumentkopf / Meta-Angaben
- Sections
- Controls
- lokale Actions
- einfache Layout-Zeilen

Nicht fuehrend sind:

- Registry-Schichten
- technische Katalogdefinitionen
- getrennte technische Beschreibungsblöcke fuer dieselbe fachliche Struktur

## Grundstruktur

Ein Formular besteht aus:

1. einem kleinen Kopfbereich mit den noetigen Metadaten
2. einer Folge von Sections
3. Controls und Actions direkt in ihrem Nutzungskontext

## Controls

Controls werden direkt und lokal notiert.

Ein Control beschreibt:

- fachlichen Namen
- Typ
- Label
- optionale fachliche Hilfetexte
- optionale lokale Bindungen

Controls sind primaer fachliche Formelemente und keine technischen Beschreibungscontainer.

## Aktuell explizit unterstuetzte Control-Typen

Im aktuellen `.form.md`-Stand sind diese Control-Typen explizit vorgesehen:

- `text`
- `date`
- `textarea`
- `number`
- `select`
- `user-select`
- `user-multiselect`
- `signature`
- `html-editor`
- `grid`
- `action`
- `lookup`

Diese Control-Typen sind die aktuell erlaubte Teilmenge des neuen Modells. Weitere Typen sollen erst nach expliziter Erweiterung eingefuehrt werden.

## Explizite Control-Semantik

Die aktuelle Semantik trennt bewusst:

- Control-Typ
- Editierbarkeit
- Pflichtstatus
- Lookup-Rolle

Ein Feld kann damit z. B. sein:

- editierbares Eingabefeld
- editierbares, durch Lookup vorbefuellbares Feld
- readonly Lookup-Ergebnis
- readonly Workflow-/Statusfeld
- readonly Stammdatenanzeige
- tabellarische Mehrzeilen-Erfassung

Wichtig:

- `required` bedeutet fachlich fuer das aktuelle Submit-Gate relevant
- `readonly` bedeutet nicht bearbeitbar im aktuellen Arbeitskontext
- Lookup-Ergebnisse duerfen readonly oder editierbar-vorbefuellt sein
- Stammdatenanzeigen sind eigene readonly Ausgaben und keine normalen Eingabefelder

## Lookup-nahe Rollen

Lookup-nahe Controls werden im Zielbild klar unterschieden:

- Lookup-Eingabe
  Beispiel: `Auftragsnummer`, `Taetigkeitsbeschreibung`
- Lookup-Ergebnis
  Beispiel: `Kunde`, `Material`
- Lookup-vorbefuelltes editierbares Feld
  Beispiel: `Einsatzort`
- readonly Stammdatenanzeige
  Beispiel: Kunden- oder Produktattribute im Formularumfeld
- einzelner verantwortlicher User
  Beispiel: `Verantwortlich`
- mehrere bezogene User
  Beispiel: `Teilnehmende`

Die Lookup-Aktion selbst soll lokal beim fachlich passenden Feld erscheinen und nicht als separater technischer Bedienblock.

## Property-Form

Die Property-Form ist:

- direkt
- lokal
- flach
- eindeutig

Ziel ist:

- keine tief geschachtelten technischen Property-Strukturen
- keine versteckten Ableitungen aus mehreren Schichten
- keine doppelte Definition derselben Information in Kopf und Body

## Sections

Sections strukturieren das Formular in klar lesbare fachliche Abschnitte.

Eine Section:

- hat eine sichtbare fachliche Bezeichnung
- enthaelt Controls, Actions und Layout-Zeilen
- bildet den primären Leserahmen fuer das Formular

Lookup-Aktionen sollen spaeter direkt im fachlich passenden Feldkontext erscheinen.
Readonly Stammdaten duerfen im Document als ruhige Form-Nebensektionen sichtbar werden, wenn sie aus denselben Lookup-Ergebnissen abgeleitet werden.
Ein erster formularuebergreifender Produktpfad darf readonly Werte aus einem anderen Formular im normalen Document Detail einblenden, wenn der Bezug klein, fachlich eindeutig und testbar ist.

## Grid-Control

Ein erster kleiner Grid-Control ist explizit Teil des Modells.

Er erlaubt:

- definierte Spalten in der Formularquelle
- mehrere Zeilen im Dokument
- strukturierte Speicherung pro Zeile
- ruhige readonly Darstellung im Formular

Die aktuelle `.form.md`-Minimsyntax ist:

```md
- Schritte: grid(process_steps, columns="step:Schritt|station:Station|target_qty:Sollmenge|actual_qty:Istmenge|result:Ergebnis", numberColumns="target_qty,actual_qty", rows=4)
```

Der erste produktive Einsatz liegt in `production-batch`.

## Journale und Attachments im Zielbild

Journale und Attachments gehoeren im Zielbild nicht in den eigentlichen `.form.md`-Body.

Sie sollen:

- ueber den Header derselben Template-Quelle freigeschaltet werden
- im Document als eigene Arbeitsbereiche ausserhalb des Formularlayouts erscheinen
- fachlich sichtbar bleiben, ohne als normale Formularfelder modelliert zu werden

## Nicht Teil des Zielmodells

Nicht Teil dieses Zielmodells sind:

- technische Registry-Bloecke
- technische API-Beschreibungen im Formular
- uebermaessige Trennung zwischen Meta-Definition und eigentlicher Form
- mehrschichtige Beschreibungsformate fuer dieselbe Formularstruktur

## Bezug zum aktuellen Stand

Diese Spec korrigiert vor allem:

- `specs/04_form_mdx_spec.md`
- `docs/changes/01_form_mdx_change.md`
- die heute sichtbare Komplexitaet in `src/modules/templates/form-read.ts`

Der Preview-Pfad `/next-form-preview/craftsman-order` kann als Dev-/Debug-Referenz bestehen bleiben, ist aber nicht mehr der fuehrende Produktweg fuer neue Form-Funktionen.

## In dieser Spec bewusst noch nicht festgelegt

- finale konkrete Syntax jedes Tokens
- Parserverhalten
- Renderdetails
- Kompatibilitaetsregeln zum aktuellen Format
