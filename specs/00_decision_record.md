# 00 — Decision Record

## 1. Grundsatz

Dieses Projekt bleibt im bestehenden Technologie-Stack und wird nicht als Greenfield-Rewrite auf einer anderen Gesamtarchitektur neu aufgebaut.

## 2. Behaltene Technologie

- Postgres bleibt
- Node.js bleibt
- Fastify bleibt
- TypeScript bleibt
- EJS bleibt zunächst
- Server-side Rendering bleibt
- Material Design wird als führender UI-Stil eingeführt
- Tailwind ist nicht das führende UI-System

## 3. Führende Definitionsformate

- Form Templates werden in MDX beschrieben
- Workflow Templates werden in JSON beschrieben
- Integrationen und API-Funktionen werden als TypeScript-Operationen beschrieben

## 4. Builder-Entscheidung

Ein visueller Form-Builder und ein visueller Workflow-Builder sind nicht Bestandteil des MVP-Kerns.
Der MVP setzt auf gut definierte, menschenlesbare Formate statt auf generische Builder.

## 5. Produktentscheidung

Das Produkt ist eine fokussierte App für digitale Dokumentation und Nachweise.
Es ist keine allgemeine Low-Code-Plattform.

## 6. Betriebsentscheidung

Der Start erfolgt mono-tenant und ohne Authentifizierung.
Die Benutzerwahl erfolgt zunächst über User-Selektion.

## 7. UI-Entscheidung

Die UI muss ruhig, arbeitsorientiert und standardmäßig einfach sein.
Technische Details werden nur auf Nachfrage sichtbar gemacht.

## 8. Integrationsentscheidung

Integrationen werden im MVP nicht als externer Integration-Service ausgelagert.
Sie werden als TypeScript-Operationen im App-Kontext implementiert.
Spätere Auslagerung muss möglich bleiben.

## 9. Review-Regel

Vor Implementierung weiterer UI- oder Architekturteile ist die Produktspezifikation zu reviewen und freizugeben.
