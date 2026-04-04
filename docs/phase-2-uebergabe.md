# Phase 2 Uebergabe

## Stabil vorhandene Plattformbausteine aus Phase 1

- versionierte Templates mit `form_type`, Workflow-Zuordnung und API-Bindings
- versionierte Workflows mit Tabelle, JSON-Modal und Lifecycle
- Documents als normaler Arbeits- und Prozesspfad
- APIs als DB-, UI- und Runtime-Baustein
- interne Stammdatenbasis via CSV und lesende APIs
- typed entity tables fuer:
  - `customer_order`
  - `production_record`
  - `qualification_record`
  - `generic_form`
- typed record APIs pro Familie
- HTMX-Teilupdates im normalen Dokumentpfad
- Journal, Attachments, Grid, Signatur, HTML-Editor
- Mehrbenutzer-Qualifikationsnachweis mit Pages und erster Auswertung
- Referenz-Smokes und Start-to-End-Tests

## Worauf Phase 2 direkt aufbauen kann

- konkrete Handwerkerfachprozesse koennen als weitere Templates, Workflows und APIs in dieselbe Plattformstruktur gesetzt werden
- typed records koennen je Fachdomäne weiter zu staerkeren Read-Modellen ausgebaut werden
- bestehende API-Bindings erlauben den Ausbau externer Anbindungen ohne neue Parallelarchitektur
- Qualification-Mechanik bietet bereits ein Muster fuer Mehrbenutzer- und Bewertungsfluesse
- `generic_form` bietet einen kleinen Ausgangspunkt fuer bewusst einfache, neue Formularpfade

## Bewusst nicht weiter ausgebaut in Phase 1

- keine neue Builder- oder Meta-Plattformlogik
- keine Preview- oder Dev-UI neben dem Produktpfad
- keine komplette Migration weg von `documents.data_json`
- keine allgemeine typed-only Runtime
- kein Reporting- oder Dashboard-Ausbau
- keine Medien- oder Kameraerweiterungen
- keine tiefe externe Systemintegration ueber den vorhandenen API-MVP hinaus

## Sinnvolle Startpunkte fuer Phase 2

1. konkrete Handwerker-Fachdomänen auf den vier vorhandenen Plattformbausteinen aufsetzen
2. typed read models pro Fachbereich noch staerker fuer Listen, Suche und spaetere Reports nutzen
3. API-Bibliothek je Fachprozess verbreitern und wiederverwendbare Connector-Muster herausziehen
4. Qualification-Fall fachlich in Richtung echter Nachweis-, Schulungs- und Freigabeprozesse vertiefen
5. Generic-Form-Pfad nur dort erweitern, wo ein bewusst einfacher Standardtyp wirklich hilft

## Uebergabestand

Phase 1 liefert jetzt keinen Prototypen mit Nebenpfaden mehr, sondern eine konsistente Plattformbasis.
Phase 2 kann direkt auf demselben normalen Produktpfad aufsetzen, ohne zuerst Architektur oder Referenzwelt erneut bereinigen zu muessen.
