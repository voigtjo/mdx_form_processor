# Implementierungsroadmap bis zum Meilenstein

## Ziel

Diese Roadmap beschreibt die Reihenfolge bis zum Meilenstein:

- **plattformfaehig fuer die Handwerker-App**

Sie priorisiert klar:

- was die Plattform dafuer noch unbedingt braucht
- was erst danach in breitere Produktauspraegungen gehen soll

## Leitprinzipien

1. Kein Builder zuerst.
2. Kein Big-Bang-Umbau.
3. Neue Produktfaehigkeit im normalen Pfad, nicht im Preview-Pfad.
4. Forms, Workflows und TypeScript APIs gemeinsam denken.
5. Alles entlang echter Handwerker-Nutzung pruefen.

## Phase 1: Plattform-Kern konsolidieren

Ziel:

- fuehrende Specs bereinigen
- Produktpfad staerken
- Preview- und Uebergangsballast zuruecknehmen

Ergebnis:

- klare Plattformlinie
- klare Roadmap
- stabile Kernbegriffe

## Phase 2: Formularmodell vervollstaendigen

Ziel:

- Controls-Katalog explizit machen
- User-Select, User-Multiselect, Signatur und HTML-/WYSIWYG-Control festziehen
- readonly, required, lookup und reference konsistent modellieren

Ohne diese Phase ist die Plattform fuer reale Handwerker- und Nachweisfaelle noch zu schmal.

## Phase 3: Workflow-Modell als Transition-Modell festigen

Ziel:

- Workflow fachlich voll auf Status / Actions / From / To / Roles / Mode / API / Condition ausrichten
- JSON klar als technisches Speicherformat behandeln
- Verknuepfung zu Formularen und APIs ruhig und produktnah halten

## Phase 4: Datenblatt-, Referenz- und Datenaustauschmodell

Ziel:

- Template-Datenblatt / Grid pro Template
- Referenzen auf Stammdaten
- Referenzen auf andere Formulare
- CSV-Import fuer Entitaeten
- CSV-Export fuer Formulardaten
- Formulare als API-Datenquelle

Diese Phase macht die Plattform erstmals fuer echte Datendrehscheiben-Aufgaben brauchbar.

## Phase 5: Medien und Nachweisfaehigkeit

Ziel:

- Medienmodell fuer Journal und Attachments sauber festziehen
- Bilder und Nachweise in beiden Zielwelten fachlich konsistent fuehren

Das ist fuer die Handwerker-App wesentlich, soll aber erst auf dem stabilen Form-/Referenzrahmen aufsetzen.

## Phase 6: Start-to-End-Teststrategie umsetzen

Ziel:

- Smoke-Tests um echte Start-to-End-Linien ergaenzen
- getrennte Testdatensaetze fuer Handwerkerwelt und Produktionswelt
- dritter Testfall fuer Qualifikations-/Nachweisformulare vorbereiten

## Meilenstein: Plattformfaehig fuer die Handwerker-App

Der Meilenstein ist erreicht, wenn mindestens vorhanden sind:

- Forms als ruhiger produktiver Pfad
- Workflows als einfaches Transition-Modell
- TypeScript APIs als dritter Kernbaustein
- Controls-Katalog fuer reale Business-Controls
- Referenzen auf Stammdaten und andere Formulare
- Tabellen-/Grid-Modell pro Template
- CSV-Import und CSV-Export
- Formulare als API-Datenquelle
- Medienmodell fuer Nachweise
- belastbare Start-to-End-Testlinie fuer die Handwerker-App

## Danach

Erst nach diesem Meilenstein sollen breiter ausgebaut werden:

- Produktionsdokumentation als eigener staerkerer Produktstrang
- Qualifikations- und Nachweisformulare als eigene App-Familie
- weitergehende Integrations- oder Reporting-Themen
- Builder-nahe Themen, falls spaeter ueberhaupt sinnvoll
