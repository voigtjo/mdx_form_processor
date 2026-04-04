---
title: Produktionsdokumentation fuer Batch und Serie
key: production-batch
version: 1
attachments_enabled: true
journal_enabled: true
---

## Produktionsauftrag

- Batch-ID: text(batch_id, required) | Seriennummer: text(serial_number)
- Produkt: text(product_name, required) | Produktionslinie: text(production_line)

## Pruef- und Arbeitsschritte

- Schritte: grid(process_steps, columns="step:Arbeitsschritt|station:Station|target_qty:Sollmenge|actual_qty:Istmenge|result:Ergebnis", numberColumns="target_qty,actual_qty", rows=4)

## Freigabe

- Status / Freigabe: select(approval_status, options="offen,pruefung,freigegeben")
- Signatur: signature(work_signature)
