import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildApp } from "../../app.js";
import { rebuildReferenceData } from "../../db/rebuild-reference.js";
import { parseNextFormSource, readReferenceCraftsmanOrderForm, referenceCraftsmanOrderFormPath } from "./read.js";
import { loadNextFormState } from "./state-store.js";

const main = async (): Promise<void> => {
  await rebuildReferenceData();

  const rawSource = await readFile(referenceCraftsmanOrderFormPath, "utf8");
  const qualificationSourcePath = new URL("../../../specs/next/examples/qualification_record.form.md", import.meta.url);
  const productionSourcePath = new URL("../../../specs/next/examples/production_batch.form.md", import.meta.url);
  const qualificationSource = await readFile(qualificationSourcePath, "utf8");
  const productionSource = await readFile(productionSourcePath, "utf8");
  const parsed = await readReferenceCraftsmanOrderForm();
  const parsedQualification = parseNextFormSource(qualificationSource);
  const parsedProduction = parseNextFormSource(productionSource);

  assert.equal(parsed.meta.title, "Kundenauftrag fuer Serviceeinsatz");
  assert.equal(parsed.meta.key, "craftsman-order");
  assert.equal(parsed.meta.version, "1");
  assert.equal(parsed.sections.length, 4);
  assert.equal(parsed.actions.length, 2);
  assert.throws(
    () => parseNextFormSource(rawSource.replace("text(order_number, required)", "email(order_number, required)")),
    /Control-Typ email wird im vereinfachten Formularmodell aktuell nicht unterstuetzt\./,
  );
  assert.match(rawSource, /html-editor\(work_description, required\)/);
  assert.match(rawSource, /action\(load_customer, ref="customers\.lookup"/);
  assert.match(rawSource, /lookup\(suggest_material, ref="products\.suggest"/);
  assert.match(qualificationSource, /radio-group\(qualification_result, required, options="sicher,teilweise,offen"\)/);
  assert.match(qualificationSource, /checkbox-group\(qualification_topics, required, options="Arbeitsschutz,Dokumentation,Freigabe"\)/);
  assert.match(productionSource, /grid\(process_steps, columns="step:Arbeitsschritt\|station:Station\|target_qty:Sollmenge\|actual_qty:Istmenge\|result:Ergebnis", numberColumns="target_qty,actual_qty", rows=4\)/);

  const qualificationResult = parsedQualification.controls.find((control) => control.name === "qualification_result");
  const qualificationTopics = parsedQualification.controls.find((control) => control.name === "qualification_topics");
  const productionGrid = parsedProduction.controls.find((control) => control.name === "process_steps");

  assert.equal(qualificationResult?.controlType, "radio-group");
  assert.equal(qualificationTopics?.controlType, "checkbox-group");
  assert.equal(productionGrid?.controlType, "grid");

  const app = await buildApp();

  try {
    const previewPage = await app.inject({
      method: "GET",
      url: "/next-form-preview/craftsman-order",
    });
    const runCustomerLookup = await app.inject({
      method: "POST",
      url: "/next-form-preview/craftsman-order",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `source=${encodeURIComponent(rawSource)}&intent=run-action&actionName=load_customer&order_number=${encodeURIComponent("KD-2026-1007")}&customer=&service_location=`,
    });
    const runProductLookup = await app.inject({
      method: "POST",
      url: "/next-form-preview/craftsman-order",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `source=${encodeURIComponent(rawSource)}&intent=run-action&actionName=suggest_material&work_description=${encodeURIComponent("Wartung Heizung Filterwechsel")}&material=`,
    });
    const saveStatePage = await app.inject({
      method: "POST",
      url: "/next-form-preview/craftsman-order",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `source=${encodeURIComponent(rawSource)}&intent=save-state&order_number=${encodeURIComponent("KD-2026-1007")}&customer=${encodeURIComponent("Baukontor Nord")}&service_location=${encodeURIComponent("Lagerhalle 2 Bremen")}`,
    });
    const loadStatePage = await app.inject({
      method: "POST",
      url: "/next-form-preview/craftsman-order",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `source=${encodeURIComponent(rawSource)}&intent=load-state&order_number=&customer=&service_location=`,
    });

    assert.equal(previewPage.statusCode, 200);
    assert.match(previewPage.body, /Kundenauftrag fuer Serviceeinsatz/);
    assert.match(previewPage.body, /Kundendaten laden/);
    assert.match(previewPage.body, /Materialvorschlag holen/);
    assert.match(previewPage.body, /Form Preview/);

    assert.equal(runCustomerLookup.statusCode, 200);
    assert.match(runCustomerLookup.body, /Kundendaten geladen/);
    assert.match(runCustomerLookup.body, /Baukontor Nord/);
    assert.match(runCustomerLookup.body, /Lagerhalle 2 Bremen/);

    assert.equal(runProductLookup.statusCode, 200);
    assert.match(runProductLookup.body, /Produktvorschlag geladen/);
    assert.match(runProductLookup.body, /Wartungsset Heizung/);

    assert.equal(saveStatePage.statusCode, 200);
    assert.match(saveStatePage.body, /Formularzustand gespeichert/);

    const savedState = await loadNextFormState();
    assert.ok(savedState);
    assert.equal(savedState.formKey, "craftsman-order");
    assert.equal(savedState.values.order_number, "KD-2026-1007");
    assert.equal(savedState.values.customer, "Baukontor Nord");

    assert.equal(loadStatePage.statusCode, 200);
    assert.match(loadStatePage.body, /Gespeicherter Zustand geladen/);
    assert.match(loadStatePage.body, /KD-2026-1007/);
    assert.match(loadStatePage.body, /Baukontor Nord/);
  } finally {
    await app.close();
  }

  console.log("next-form smoke passed");
};

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
