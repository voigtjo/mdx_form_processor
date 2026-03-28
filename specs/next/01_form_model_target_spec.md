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

## Journals und wiederholbare Bereiche

Wiederholbare Bereiche bleiben fachliche Formelemente.

Sie sollen:

- im Formular als fachlicher Bereich erscheinen
- nicht als technische Sonderarchitektur beschrieben werden
- denselben Lesefluss wie andere Controls behalten

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

## In dieser Spec bewusst noch nicht festgelegt

- finale konkrete Syntax jedes Tokens
- Parserverhalten
- Renderdetails
- Kompatibilitaetsregeln zum aktuellen Format
