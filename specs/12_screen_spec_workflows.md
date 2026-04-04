# 12 — Screen Spec Workflows

## Ziel

Workflow-Detail ist die produktive Pflegeansicht für das einfache Transition-Modell.

## Führendes Modell

Workflow wird fachlich als Tabelle gepflegt über:

- `Action`
- `From`
- `To`
- `Roles`
- `Mode`
- `API`
- `Condition`

## UI

- Header eingeklappt
- Hauptfläche ist die editierbare Transition-Tabelle
- JSON bleibt Import-/Export-/Editierformat im Modal
- JSON ist nicht die führende Hauptansicht

## Führende Referenz-Workflows

- `Kundenauftrag Freigabe`
- `Produktionsdokumentation Freigabe`
- `Qualifikationsnachweis Review`

## Live-Bezug

Workflow-Rollen werden im Dokumentpfad gegen echte Assignments ausgewertet.

Im Qualifikationsnachweis wird `AND`/`OR` fachlich sichtbar an den Beteiligten dargestellt.
