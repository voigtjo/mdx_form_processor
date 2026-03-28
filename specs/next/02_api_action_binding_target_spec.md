# Ziel-Spec: Direkte API-/Action-Bindings

## Zweck

Diese Spec beschreibt das Zielmodell fuer direkte und lokale API-/Action-Bindings im vereinfachten Formularmodell.

## Grundregel

Implementierung von APIs und Operationen liegt ausserhalb des Formulartexts.

Im Formular selbst duerfen nur die lokalen Angaben stehen, die fuer die konkrete Nutzung noetig sind.

## Zulaessige Angaben im Formular

Im Formular zulaessig sind nur:

- direkte Referenz auf eine Action oder Operation an der Stelle der Benutzung
- klare lokale Argumentuebergabe
- klare Bindung des Ergebnisses an lokale Felder oder Kontexte
- sichtbare Ausloeser wie Button oder ausloesendes Formelement

## Nicht mehr zulaessige Angaben im Formular

Nicht mehr im Formular stehen sollen:

- API-Registry
- technische API-Beschreibung
- katalogartige Endpunktdefinition
- verteilte technische Integrationsbeschreibung ausserhalb des lokalen Nutzungskontexts

## Bindung von Actions

Workflow- oder Form-Actions sollen direkt am ausloesenden Element referenziert werden.

Das Ziel ist:

- lokale Lesbarkeit
- direkte fachliche Nachvollziehbarkeit
- keine Suche durch getrennte technische Definitionsbloecke

## Argumentuebergabe

Argumente sollen:

- lokal sichtbar
- explizit
- auf den direkten Nutzungskontext begrenzt

sein.

Versteckte oder ueber mehrere Ebenen verteilte Argumentdefinitionen sind nicht Ziel des Modells.

## Ergebnisbindung

Ergebnisse sollen:

- lokal an benannte Felder oder Kontexte gebunden werden
- fuer den Leser des Formulartexts nachvollziehbar bleiben
- keine zweite technische Beschreibungsschicht erfordern

## Bezug zum aktuellen Stand

Diese Spec korrigiert vor allem:

- `specs/06_operations_spec.md`
- `docs/changes/02_api_operations_change.md`
- den heutigen Mischzustand aus `operationRef`-Nutzung und leerer Runtime unter `src/modules/operations/`

## In dieser Spec bewusst noch nicht festgelegt

- konkrete Syntax fuer Referenzierung
- technisches Runtime-Protokoll
- Auth-, Retry- oder Fehlerregeln
- konkrete Datenflussnotation
