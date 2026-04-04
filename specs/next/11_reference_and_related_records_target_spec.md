# Ziel-Spec: Referenzen und related records

## Stammdatenreferenzen

Formulare dürfen interne Stammdaten referenzieren über:

- `customers.lookup`
- `products.suggest`
- lesende Stammdaten-APIs

Diese APIs kommen aus derselben zentralen DB- und UI-gepflegten API-Quelle wie Template- und Workflow-Referenzen.

Im Referenzstand ist das führend im Kundenauftrag sichtbar.

## Formularreferenzen

Formulare dürfen readonly andere Formdatensätze anzeigen.

Der aktuelle erste Slice bleibt klein und readonly.

## Produktregel

Referenzen im Referenzstand basieren nicht auf ERP-SIM, sondern auf:

- internen CSV-befüllten Stammdaten
- internen Formular- und Dokumentdaten
- denselben zentralen APIs und typed Records, die auch im normalen Produktpfad sichtbar sind
- einem kleinen Read-Slice auf typed Records per `/api/typed-records/:documentId`

## Qualifikationsnachweis

Der Mehrbenutzerfall ist kein Fremdreferenzfall, sondern eine gemeinsame Dokumentbasis mit per-User-Teilstand.
Pages und Auswertung bleiben dabei Teil desselben Dokuments und desselben typed Records.
