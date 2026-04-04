import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildApp } from "../../app.js";
import { rebuildReferenceData } from "../../db/rebuild-reference.js";
import { parseFormRuntimeSource, readReferenceCustomerOrderForm, referenceCustomerOrderFormPath } from "./read.js";

const customerOrderDocumentId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1";
const genericFormDocumentId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee4";
const serviceUserKey = "service-durchfuehrung-dokumentation";

const main = async (): Promise<void> => {
  await rebuildReferenceData();

  const rawSource = await readFile(referenceCustomerOrderFormPath, "utf8");
  const qualificationSourcePath = new URL("../../../specs/next/examples/qualification_record.form.md", import.meta.url);
  const productionSourcePath = new URL("../../../specs/next/examples/production_batch.form.md", import.meta.url);
  const genericSourcePath = new URL("../../../specs/next/examples/generic_form.form.md", import.meta.url);
  const qualificationSource = await readFile(qualificationSourcePath, "utf8");
  const productionSource = await readFile(productionSourcePath, "utf8");
  const genericSource = await readFile(genericSourcePath, "utf8");
  const parsed = await readReferenceCustomerOrderForm();
  const parsedQualification = parseFormRuntimeSource(qualificationSource);
  const parsedProduction = parseFormRuntimeSource(productionSource);
  const parsedGeneric = parseFormRuntimeSource(genericSource);

  assert.equal(parsed.meta.title, "Kundenauftrag fuer Serviceeinsatz");
  assert.equal(parsed.meta.key, "customer-order");
  assert.equal(parsed.meta.version, "1");
  assert.equal(parsed.sections.length, 4);
  assert.equal(parsed.actions.length, 2);
  assert.throws(
    () => parseFormRuntimeSource(rawSource.replace("text(order_number, required)", "email(order_number, required)")),
    /Control-Typ email wird im vereinfachten Formularmodell aktuell nicht unterstuetzt\./,
  );
  assert.match(rawSource, /html-editor\(work_description, required\)/);
  assert.match(rawSource, /action\(load_customer, ref="customers\.lookup"/);
  assert.match(rawSource, /lookup\(suggest_material, ref="products\.suggest"/);
  assert.match(qualificationSource, /radio-group\(qualification_result, required, options="sicher,teilweise,offen"\)/);
  assert.match(qualificationSource, /checkbox-group\(qualification_topics, required, options="Arbeitsschutz,Dokumentation,Freigabe"\)/);
  assert.match(productionSource, /grid\(process_steps, columns="step:Arbeitsschritt\|station:Station\|target_qty:Sollmenge\|actual_qty:Istmenge\|result:Ergebnis", numberColumns="target_qty,actual_qty", rows=4\)/);
  assert.match(genericSource, /html-editor\(generic_form_note, required\)/);

  assert.equal(parsedQualification.controls.find((control) => control.name === "qualification_result")?.controlType, "radio-group");
  assert.equal(parsedQualification.controls.find((control) => control.name === "qualification_topics")?.controlType, "checkbox-group");
  assert.equal(parsedProduction.controls.find((control) => control.name === "process_steps")?.controlType, "grid");
  assert.equal(parsedGeneric.controls.find((control) => control.name === "generic_form_note")?.controlType, "html-editor");

  const app = await buildApp();

  try {
    const removedPreview = await app.inject({
      method: "GET",
      url: "/dev/forms/preview/customer-order",
    });
    const customerDocument = await app.inject({
      method: "GET",
      url: `/documents/${customerOrderDocumentId}?user=${serviceUserKey}`,
    });
    const genericDocument = await app.inject({
      method: "GET",
      url: `/documents/${genericFormDocumentId}?user=${serviceUserKey}`,
    });
    const runCustomerLookup = await app.inject({
      method: "POST",
      url: `/documents/${customerOrderDocumentId}/form?user=${serviceUserKey}`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `intent=run-action&actionName=load_customer&order_number=${encodeURIComponent("KD-2026-1007")}&customer=&service_location=`,
    });
    const runProductLookup = await app.inject({
      method: "POST",
      url: `/documents/${customerOrderDocumentId}/form?user=${serviceUserKey}`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `intent=run-action&actionName=suggest_material&work_description=${encodeURIComponent("Wartung Heizung Filterwechsel")}&material=`,
    });

    assert.equal(removedPreview.statusCode, 404);

    assert.equal(customerDocument.statusCode, 200);
    assert.match(customerDocument.body, /Kundenauftrag/);
    assert.match(customerDocument.body, /Kundendaten laden/);
    assert.equal(genericDocument.statusCode, 200);
    assert.match(genericDocument.body, /Generisches Formular GF-2026-001/);
    assert.match(genericDocument.body, /generic_form/);

    assert.equal(runCustomerLookup.statusCode, 200);
    assert.match(runCustomerLookup.body, /Kundendaten geladen/);
    assert.match(runCustomerLookup.body, /Baukontor Nord/);
    assert.match(runCustomerLookup.body, /Lagerhalle 2 Bremen/);

    assert.equal(runProductLookup.statusCode, 200);
    assert.match(runProductLookup.body, /Produktvorschlag geladen/);
    assert.match(runProductLookup.body, /Wartungsset Heizung/);
  } finally {
    await app.close();
  }

  console.log("forms smoke passed");
};

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
