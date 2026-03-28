# Änderungsspec: Form-/MDX-Konzept

## Zweck

Korrekturrichtung für das bestehende Form-/MDX-Konzept vor einer neuen Zielspezifikation.

## Problem im bisherigen Konzept

- das Formularformat trägt zu viele technische Schichten gleichzeitig
- Formtext, Metadaten, Registry-artige Bezüge und technische Bindings liegen zu dicht beieinander
- Parser und Review-UI müssen zu viele implizite Sonderfälle aus dem Text ableiten
- es entsteht Doppelung zwischen Kopf, technischer Beschreibung und eigentlichem Body

Beobachtbare heutige Stellen:

- `src/modules/templates/form-read.ts`
- `src/views/pages/document-detail.ejs`
- `specs/04_form_mdx_spec.md`

## Künftige Änderungsrichtung

- das Formularformat soll deutlich schlanker und direkter werden
- der eigentliche Formulartext soll wieder im Vordergrund stehen
- technische Hilfskonstrukte sollen reduziert werden
- die Zahl der impliziten Parserregeln soll sinken
- Formdefinition und Nutzungsort sollen leichter lesbar zusammenpassen

## Was künftig verändert werden soll

- weniger technische Schichten im Formulartext
- weniger Wiederholung zwischen Header-/Meta-Bereich und Formular-Body
- weniger indirekte oder verstreute Bindungsinformationen
- klarere Trennung zwischen fachlicher Formdefinition und technischer Laufzeitlogik

## Was bewusst nicht mehr Teil des Formularformats sein soll

- registry-artige technische Beschreibungsschichten im Formulartext
- unnötige doppelte Definition derselben Information an mehreren Stellen
- technische Review-/Debug-Bedürfnisse als regulärer Bestandteil des Formularformats
- parsergetriebene Komplexität, die nur aus historischer Alt-Spec-Schichtung entsteht

## In dieser Änderungsspec bewusst noch nicht ausformuliert

- keine neue endgültige Syntax
- keine abschließende Liste neuer Tags oder Konstrukte
- keine Parserregeln
- keine Renderregeln
