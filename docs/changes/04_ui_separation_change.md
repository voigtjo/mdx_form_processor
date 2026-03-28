# Änderungsspec: Trennung von Arbeits-UI und Technik-/Review-Sicht

## Zweck

Korrekturrichtung dafür, wie Arbeits-UI und technische Modell-/Review-Sicht künftig sauberer getrennt werden sollen.

## Problem im bisherigen Stand

- Arbeitsseiten zeigen heute an mehreren Stellen technische oder review-orientierte Details
- besonders `Document Detail` vermischt Bedienung, Modellprüfung und Source-/Binding-Sicht
- dadurch werden zentrale Arbeitsseiten schwerer, unruhiger und weniger klar

Beobachtbare heutige Stellen:

- `src/views/pages/document-detail.ejs`
- `src/views/pages/template-detail.ejs`
- `src/views/pages/workflow-detail.ejs`
- `docs/ui-deviations.md`

## Künftige Änderungsrichtung

- Standard-Arbeitsseiten zeigen nur die für Arbeit und Entscheidung nötigen Informationen
- technische Modell-, Source- und Binding-Sichten gehören nur in gezielte Review- oder Konfigurationskontexte
- Arbeitskontext und Review-Kontext sollen künftig klarer getrennt sein

## Was auf Arbeitsseiten künftig vermieden werden soll

- vollständige Source-Sichten
- technische Metadatenblöcke ohne unmittelbaren Arbeitsnutzen
- parser- oder bindingnahe Detailanzeigen als Standardbestandteil des Arbeitsflusses

## Was in Review-/Konfigurationskontexte gehört

- Source-/Modelldetails
- technische Bindungen
- tiefe Feld- oder Actionsicht
- JSON-/Hook-/Integrationssicht

## In dieser Änderungsspec bewusst noch nicht ausformuliert

- keine neue Screen-Architektur
- keine endgültige Verteilung aller Inhalte auf künftige Screens
- keine konkrete Navigations- oder Tab-Spezifikation
