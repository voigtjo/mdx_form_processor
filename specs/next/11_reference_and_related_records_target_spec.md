# Ziel-Spec: Referenzen und related records

## Stammdatenreferenzen

Formulare dürfen interne Stammdaten referenzieren über:

- `customers.lookup`
- `products.suggest`
- lesende Stammdaten-APIs

Im Referenzstand ist das führend im Kundenauftrag sichtbar.

## Formularreferenzen

Formulare dürfen readonly andere Formdatensätze anzeigen.

Der aktuelle erste Slice bleibt klein und readonly.

## Produktregel

Referenzen im Referenzstand basieren nicht auf ERP-SIM, sondern auf:

- internen CSV-befüllten Stammdaten
- internen Formular- und Dokumentdaten

## Qualifikationsnachweis

Der Mehrbenutzerfall ist kein Fremdreferenzfall, sondern eine gemeinsame Dokumentbasis mit per-User-Teilstand.
