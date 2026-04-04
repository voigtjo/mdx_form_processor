# Ziel-Spec: Qualifikationsnachweis mit Pages und Auswertung

Der Qualifikationsnachweis wird im normalen Dokumentpfad in drei Seiten geschnitten:

1. Nachweis / Stammdaten
2. Fragen / Selbsteinschaetzung / Themen
3. Freigabe / Signatur / Ergebnis

## Seitenstand

- Der aktuelle Seitenstand wird pro User gefuehrt.
- Vor / Zurueck bleibt im bestehenden SSR- und HTMX-Formularcontainer.
- Pro Seite sind nur die Felder der aktuellen Seite sichtbar.

## Erste Auswertung

Der Qualifikationsnachweis fuehrt eine erste berechnete Auswertung:

- `evaluation_status`
- `score_value`
- `passed`
- `evaluated_at`

Die Auswertung wird aus dem Antwortsatz der Beteiligten abgeleitet.

## Bewertungsrichtung

- `pending`, solange noch nicht alle beteiligten Editor-User ihren Nachweis komplett submitted haben
- `passed`, wenn die Pflichtthemen bestaetigt und die Mindestselbsteinschaetzung erreicht sind
- `failed`, wenn Antworten vorliegen, aber die Pass-Regel nicht erreicht ist

## Typed Entity

`qualification_records` fuehrt diese Felder mit:

- `qualification_record_number`
- `qualification_title`
- `owner_user_id`
- `valid_until`
- `qualification_result`
- `evaluation_status`
- `score_value`
- `passed`
- `evaluated_at`
- `approval_status`
