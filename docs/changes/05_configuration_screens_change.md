# Änderungsspec: Konfigurationsscreens für Templates und Workflows

## Zweck

Korrekturrichtung für Templates- und Workflows-Screens ausgehend vom aktuellen korrigierten Repo-Stand.

## Problem im bisherigen und zuletzt korrigierten Stand

- Templates und Workflows sind inzwischen ruhiger als früher, aber noch keine vollständig definierte objektzentrierte Screen-Familie
- frühere Inline-Review-Ansätze unter Tabellen haben gezeigt, dass solche Mischformen schnell unübersichtlich werden
- Konfigurationsscreens brauchen eine klarere Objektzentrierung statt paralleler Listen- und Review-Flächen

Beobachtbare heutige Stellen:

- `src/views/pages/templates.ejs`
- `src/views/pages/template-detail.ejs`
- `src/views/pages/workflows.ejs`
- `src/views/pages/workflow-detail.ejs`

## Künftige Änderungsrichtung

- Liste → Detail → New/Edit bleibt das führende Navigationsmodell
- keine Review-Karten unter Tabellen
- klare Einzelansichten für einzelne Objekte
- ruhige, objektzentrierte Konfigurationsscreens ohne unnötige Doppelanzeigen

## Was künftig gestärkt werden soll

- klare Listensicht als Finder
- klare Einzelansicht als Fokusfläche
- New/Edit als eigene, getrennte Kontexte
- nachvollziehbare Objektzentrierung statt Mischscreen

## Was vermieden werden soll

- Review-Flächen unter Tabellen
- parallele Listen- und Tiefensicht auf derselben Ebene ohne klaren Fokus
- unruhige Mischungen aus Finder, Review und Edit auf einer Seite

## In dieser Änderungsspec bewusst noch nicht ausformuliert

- keine endgültige Tab- oder Subnavigation
- keine endgültige Feldaufteilung in Detail- und Edit-Screens
- keine neue UI-Sprache oder Layoutspezifikation
