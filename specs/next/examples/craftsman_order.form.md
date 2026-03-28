---
title: Auftragsdokumentation fuer Handwerker
key: craftsman-order
version: 1
---

## Auftragsdaten

- Auftragsnummer: text(order_number, required) | Datum: date(service_date, required)
- Kunde: text(customer, required) | Techniker / Monteur: text(technician, required)
- Einsatzort: textarea(service_location, required)
- Kundendaten laden: action(load_customer, ref="customers.lookup", args="order_number", bind="customer,service_location")

## Leistung

- Taetigkeitsbeschreibung: textarea(work_description, required)
- Materialvorschlag holen: lookup(suggest_material, ref="materials.suggest", args="work_description", bind="material")
- Material: textarea(material)
- Arbeitszeit (Std.): number(labor_hours, required) | Fahrtzeit (Std.): number(travel_hours) | Pause (Min.): number(break_minutes)

## Freigabe

- Status / Freigabe: select(approval_status, options="offen,pruefung,freigegeben", required)
