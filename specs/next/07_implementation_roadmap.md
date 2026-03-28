# Implementierungsroadmap fuer die vereinfachte Richtung

## Zweck

Diese Roadmap beschreibt die empfohlene Reihenfolge fuer die naechste Produktphase auf Basis von:

- `docs/acceptance-checkpoint.md`
- `docs/changes/`
- `specs/next/`

Sie legt die Umsetzungsreihenfolge fest, ohne selbst schon Runtime oder UI zu implementieren.

## High-Level-Reihenfolge

1. neue Richtung zuerst parallel und kontrolliert aufbauen
2. den neuen Referenzfall frueh als Leitbeispiel nutzen
3. zuerst Formmodell und Read-Pfade stabilisieren
4. erst danach UI- und Bindingschritte darauf aufsetzen
5. Alt-Modell nicht per Big Bang abloesen, sondern schrittweise zurueckdrängen

## Was zunaechst bestehen bleibt

In den ersten Phasen bleiben bestehen:

- Postgres- und Rebuild-Basis
- Hauptnavigation und Shell
- bestehende Alt-Modelle fuer Templates, Workflows und Documents
- bestehende Laufzeitpfade fuer Start, Save, Submit, Approve, Reject, Archive
- bestehende Admin-Grundpflege

## Was zuerst ersetzt oder parallel aufgebaut werden soll

Zuerst parallel aufzubauen sind:

- das vereinfachte Formmodell
- die direkte lokale Bindinglogik als neues Zielmodell
- der neue Referenzfall `Auftragsdokumentation fuer Handwerker`

Noch nicht frueh zu ersetzen sind:

- der gesamte Workflow-Laufzeitpfad
- der gesamte Admin-Bereich
- die gesamte bestehende Documents-Arbeits-UI

## Phasen

## Phase 1: Neuer Referenz-Slice ohne UI-Umbau

Zweck:

- die neue Richtung an einem klaren Beispiel materialisieren
- das neue Formmodell klein und isoliert pruefbar machen

Umfang:

- Referenzartefakte fuer `Auftragsdokumentation fuer Handwerker`
- erster isolierter Read-/Validierungsslice fuer das neue vereinfachte Formularmodell
- noch keine Umschaltung bestehender Screens

Warum zuerst:

- niedriges Risiko
- hohe Klarheit
- gute Testbarkeit
- trennt neue Richtung sauber vom Alt-Modell

## Phase 2: Paralleler Read-Pfad fuer das neue Formmodell

Zweck:

- das neue Modell ausserhalb des Alt-Parsers lesbar machen
- die Grundbausteine des neuen Formats stabilisieren

Umfang:

- neuer, kleiner Read-Pfad fuer das neue Formularmodell
- keine allgemeine Migration aller Templates
- keine alte Logik entfernen

Warum jetzt:

- erst wenn der neue Read-Pfad stabil ist, lohnt sich weitere UI-Anbindung

## Phase 3: Konfigurationskontexte fuer das neue Modell

Zweck:

- Templates und Workflows im neuen objektzentrierten Modell ruhig abbilden

Umfang:

- Detail-/Review-Kontexte fuer das neue Modell
- New/Edit entlang `Liste -> Detail -> New/Edit`
- keine Review-Karten unter Tabellen

Warum erst nach Phase 2:

- Konfigurationsscreens sollen auf einem lesbaren Zielmodell aufbauen, nicht auf einer halb fertigen Syntax

## Phase 4: Arbeits-UI sauber vom Technikmodell trennen

Zweck:

- Standard-Arbeitsseiten beruhigen
- Review-/Konfigurationssicht aus Arbeitsseiten herausloesen

Umfang:

- klare Trennung von Arbeits- und Technik-/Review-Kontext
- kein Vollumbau aller Screens auf einmal

Warum hier:

- erst nachdem das Zielmodell in Konfigurationskontexten tragfaehig ist

## Phase 5: Direkte API-/Action-Bindings im neuen Modell

Zweck:

- lokale, direkte Bindings im neuen Formularmodell anschliessen

Umfang:

- lokale Referenzierung am Nutzungspunkt
- keine Registry-Wiederbelebung
- keine allgemeine Operationsplattform als erster Schritt

Warum spaeter:

- Bindings sollen auf das neue Formmodell aufsetzen, nicht parallel zu einem instabilen Format entstehen

## Phase 6: Kontrollierter Uebergang des Laufzeitpfads

Zweck:

- neue Richtung schrittweise in die eigentliche Produktlaufzeit bringen

Umfang:

- einzelne vertikale Uebernahmen in den echten Produktfluss
- Alt- und Neumodell fuer eine begrenzte Uebergangszeit parallel
- keine Big-Bang-Ablösung

Warum zuletzt:

- hier ist das Risiko am hoechsten
- dieser Schritt braucht die vorherigen Phasen als stabile Grundlage

## Referenzbeispiel in der Roadmap

Der Referenzfall `Auftragsdokumentation fuer Handwerker` wird:

- in Phase 1 als neuer Leitfall eingefuehrt
- in Phase 2 als Read- und Modellslice genutzt
- in Phase 3 als erster sinnvoller Konfigurationsfall verwendet
- spaeter in Phase 6 als priorisierter produktnaher Uebergangsfall genutzt

## Erster empfohlener Implementierungsschritt

Der erste echte Implementierungsschritt der neuen Richtung sollte sein:

- ein isolierter Parallel-Slice fuer das neue vereinfachte Formmodell am Referenzbeispiel `Auftragsdokumentation fuer Handwerker`

Eigenschaften dieses ersten Schritts:

- klein
- risikoarm
- gut testbar
- ohne UI-Umbau
- ohne Umschaltung bestehender Laufzeitpfade

## Was bewusst spaeter kommt

Bewusst spaeter kommen:

- direkte Bindings mit echter Laufzeitwirkung
- Umbau der bestehenden Documents-Arbeitsseite
- breitere Migration vorhandener Templates
- Ausbau tieferer Workflow- oder Policy-Logik

## Nicht empfohlen

Nicht empfohlen ist:

- Big-Bang-Umbau
- gleichzeitiger Parser-, UI- und Runtime-Wechsel
- sofortige Ablösung des Alt-Modells ohne Parallelphase

## Ableitbarkeit fuer spaetere Codex-Schritte

Jede Phase soll spaeter in kleine Codex-taugliche Implementierungsschritte zerlegt werden.

Die Roadmap dient dafuer als:

- Reihenfolgespezifikation
- Abgrenzungshilfe
- Migrationsrahmen
