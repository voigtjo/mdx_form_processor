# 11 — Screen Spec Templates

## Ziel

Template-Detail ist die ruhige Pflegeansicht für:

- Template-Quelle
- zugeordnete Workflow-Version
- API-Operationen des Formulars
- Lifecycle

## Header

Der Template-Header bleibt eingeklappt und zeigt kompakt:

- Template-Name und Version
- zugeordneten Workflow mit Version
- Lifecycle-Status

## Hauptbereiche

### Template Source

- editierbare `.form.md`-/MDX-Quelle
- ruhige Preview ohne technische Badges wie `4 Sections`, `2 Zeilen`, `Lookup`

### Workflow-Zuordnung

- einem Template wird genau eine Workflow-Version zugeordnet
- Publish ist nur mit publiziertem Workflow erlaubt
- optionaler `Cascade Publish` bleibt möglich

### API Operations

Das Template zeigt sichtbar:

- welche zentral definierten `operationRef`s das Formular nutzt
- welche Action-/Lookup-Bindings aktiv sind
- welche zentrale Operation alternativ zugeordnet werden kann

Die Definition der Operation bleibt zentral auf `/apis`, die Nutzung wird im Template gepflegt.

## Führende Familien

Die führende Referenzwelt zeigt im Template-Pfad nur:

- `Kundenauftrag`
- `Produktionsdokumentation`
- `Qualifikationsnachweis`
