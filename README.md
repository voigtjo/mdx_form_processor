# mdx_form_processor

Greenfield-Start fuer das MVP "Digitale Dokumentation und Nachweise".

Die fuehrende Produktspezifikation liegt unter [specs/](./specs). Dieses Verzeichnis ist ab jetzt die verbindliche Grundlage fuer Architektur, Scope und weitere Umsetzung.

## Technischer Startpunkt

- Node.js + Fastify
- TypeScript
- EJS fuer serverseitiges Rendering
- Material-orientierte Basis-UI
- Postgres als Laufzeitdatenbank
- mono-tenant
- keine Authentifizierung im MVP, nur User-Selektion

## Projektstart

```bash
npm install
npm run dev
```

Danach ist die App lokal unter `http://127.0.0.1:3000` erreichbar.

## Relevante Verzeichnisse

- `specs/` fuehrende MVP-Spezifikation
- `docs/architecture.md` abgeleitete Zielarchitektur fuer diesen Greenfield-Start
- `src/` Anwendungscode
- `sql/` SQL-Basis fuer den ersten Postgres-Stand

