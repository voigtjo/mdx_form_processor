# Vorbereitende Notizen für spätere Richtungsänderung

Status: nur konzeptionelle Vorbereitung. Keine Umsetzung in diesem Schritt.

## Zweck

Dieses Dokument trennt die **spätere Richtungsänderung** bewusst von den noch offenen Alt-Spec-Lücken.

Es ist keine neue führende Spezifikation, sondern eine Arbeitsnotiz für die Phase nach Alt-Spec-Verifikation/-Abnahme.

## Später geplante Korrekturrichtung

### 1. MDX deutlich vereinfachen

- Ziel:
  - weniger implizite Komplexität
  - leichter lesbare und implementierbare Formdefinition
  - weniger parserseitige Sonderbehandlung
- Konsequenz für später:
  - der aktuelle lokale Analysepfad in `src/modules/templates/form-read.ts` ist nicht als Endzustand zu betrachten

### 2. APIs / Operationen direkt und lokal referenzieren

- Ziel:
  - keine unnötige Zwischenarchitektur
  - direkte, nachvollziehbare Referenz statt indirekter oder verteilter Logik
- Konsequenz für später:
  - Operationen und API-Bezüge sollen klarer und lokaler an den tatsächlichen Nutzungsstellen hängen

### 3. `|` als harte horizontale Gleichverteilungsregel

- Ziel:
  - einfache, eindeutige Layout-Semantik
  - keine mehrdeutige oder weich interpretierte Layoutbedeutung
- Für später festhalten:
  - `|` bedeutet horizontale Anordnung
  - die beteiligten Elemente werden gleich verteilt
  - keine zusätzliche komplexe Layoutableitung in dieser Regel

### 4. UI-Umbau erst nach Alt-Spec-Abnahme

- Reihenfolge für spätere Arbeit:
  1. Alt-Spec-Lücken sichtbar machen und bewerten
  2. Alt-Spec-Stand verifizieren oder bewusst abnehmen
  3. erst danach UI-/MDX-Richtungswechsel umsetzen

## Was in dieser Phase bewusst noch nicht passiert

- keine neue MDX-Spezifikation
- keine Parser- oder Render-Neuimplementierung
- keine Änderung bestehender Workflow-/Form-Logik auf die neue Richtung hin
- kein vorgezogener UI-Umbau

## Relevante heutige Code-Stellen für die spätere Korrektur

- `src/modules/templates/form-read.ts`
  - aktueller lokaler MDX-Lese-/Analysepfad
- `src/views/pages/document-detail.ejs`
  - aktuelle Mischung aus Arbeits-UI und MDX-/Techniksicht
- `src/views/pages/templates.ejs`
  - aktueller Placeholder-Review-Stand
- `src/views/pages/workflows.ejs`
  - aktueller Placeholder-Review-Stand

## Arbeitsregel für die nächsten Codex-Schritte

Bis zu einer bewussten Richtungsfreigabe gilt:

- Alt-Spec-Lückenschluss nicht mit der späteren Vereinfachung vermischen
- Abweichungen zuerst transparent dokumentieren
- keinen stillen Umbau in Richtung der späteren MDX-Vereinfachung vorziehen
