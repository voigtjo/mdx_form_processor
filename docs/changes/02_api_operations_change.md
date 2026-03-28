# Änderungsspec: API-/Operation-Referenzierung

## Zweck

Korrekturrichtung für den bisherigen API-/Operation-Ansatz vor einer neuen Zielspezifikation.

## Problem im bisherigen Konzept

- API-/Operation-Bezüge sind im bisherigen Denkmodell zu schwergewichtig
- Formulare tragen zu viel technische Beschreibungslogik für externe oder interne Datenzugriffe
- eine Registry- oder Kataloglogik im Formulartext erhöht die Komplexität, ohne den Nutzwert im MVP proportional zu steigern
- Review- und Implementierungsaufwand steigen, weil Formularformat und technische Integrationsbeschreibung zu eng gekoppelt sind

Beobachtbare heutige Stellen:

- `specs/06_operations_spec.md`
- `specs/04_form_mdx_spec.md`
- `src/modules/templates/form-read.ts`
- `src/modules/operations/`

## Künftige Änderungsrichtung

- APIs und Operationen werden außerhalb des Formulartexts implementiert
- im Formular wird nur direkt und lokal dort referenziert, wo eine Nutzung fachlich nötig ist
- technische API-Beschreibung gehört nicht in das Formular als eigene Schicht
- es soll keine gesonderte Formular-interne API-Registry geben

## Was künftig vereinfacht werden soll

- weniger indirekte Referenzierung
- weniger technische Beschreibung im Formular selbst
- klarere lokale Bindung zwischen Feld/Aktion und referenzierter Operation
- geringere Einstiegshürde für Lesen, Review und spätere Implementierung

## Was zurückgebaut oder vermieden werden soll

- API-Registry im Formularkonzept
- technische Katalogbeschreibung von Endpunkten oder Operationen im Formulartext
- zusätzliche Schichten, die nur für allgemeine Wiederverwendung gedacht sind, aber den MVP unnötig belasten

## In dieser Änderungsspec bewusst noch nicht ausformuliert

- keine neue Referenzsyntax
- kein endgültiges Runtime-Modell für Operationen
- keine Implementierungsregeln für Auth, Fehler oder Caching
