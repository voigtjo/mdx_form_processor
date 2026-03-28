import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildApp } from "../../app.js";
import { parseNextFormSource, readReferenceCraftsmanOrderForm, referenceCraftsmanOrderFormPath } from "./read.js";

const main = async (): Promise<void> => {
  const rawSource = await readFile(referenceCraftsmanOrderFormPath, "utf8");
  const parsed = await readReferenceCraftsmanOrderForm();
  const parsedFromSource = parseNextFormSource(rawSource);

  assert.equal(parsed.meta.title, "Auftragsdokumentation fuer Handwerker");
  assert.equal(parsed.meta.key, "craftsman-order");
  assert.equal(parsed.meta.version, "1");
  assert.equal(parsed.sections.length, 3, "Expected three sections in the next-form reference.");
  assert.equal(parsed.controls.length, 11, "Expected eleven controls in the next-form reference.");
  assert.equal(parsed.actions.length, 2, "Expected two action-like elements in the next-form reference.");
  assert.deepEqual(parsed.meta, parsedFromSource.meta, "Direct source parse and file parse should match.");
  assert.match(rawSource, /^---/m, "The new slim form syntax should use a frontmatter header.");
  assert.match(rawSource, /^## Auftragsdaten$/m, "The new slim form syntax should use markdown-like section headings.");
  assert.match(rawSource, /- Auftragsnummer: text\(order_number, required\) \| Datum: date\(service_date, required\)/);
  assert.match(rawSource, /- Kundendaten laden: action\(load_customer, ref="customers\.lookup", args="order_number", bind="customer,service_location"\)/);
  assert.match(rawSource, /- Materialvorschlag holen: lookup\(suggest_material, ref="materials\.suggest", args="work_description", bind="material"\)/);

  const orderSection = parsed.sections[0];

  assert.ok(orderSection, "The first section must exist.");
  assert.equal(orderSection.title, "Auftragsdaten");
  assert.equal(orderSection.rows[0]?.slots.length, 2, "The first row should be split into two slots.");
  assert.equal(orderSection.rows[1]?.slots.length, 2, "The second row should be split into two slots.");

  const orderNumber = parsed.controls.find((control) => control.name === "order_number");
  const approvalStatus = parsed.controls.find((control) => control.name === "approval_status");
  const loadCustomerAction = parsed.actions.find((action) => action.name === "load_customer");
  const suggestMaterialLookup = parsed.actions.find((action) => action.name === "suggest_material");
  const timeRow = parsed.sections[1]?.rows.find((row) => row.source.includes("labor_hours"));

  assert.ok(orderNumber, "The order number control must be parsed.");
  assert.equal(orderNumber.controlType, "text");
  assert.equal(orderNumber.label, "Auftragsnummer");
  assert.equal(orderNumber.properties.required, true);

  assert.ok(approvalStatus, "The approval status control must be parsed.");
  assert.equal(approvalStatus.controlType, "select");
  assert.equal(approvalStatus.properties.options, "offen,pruefung,freigegeben");
  assert.equal(timeRow?.slots.length, 3, "The time row should expose three equal-width slots.");
  assert.ok(loadCustomerAction, "The action element must be parsed.");
  assert.equal(loadCustomerAction.kind, "action");
  assert.equal(loadCustomerAction.ref, "customers.lookup");
  assert.deepEqual(loadCustomerAction.args, ["order_number"]);
  assert.deepEqual(loadCustomerAction.bind, ["customer", "service_location"]);
  assert.ok(suggestMaterialLookup, "The lookup element must be parsed.");
  assert.equal(suggestMaterialLookup.kind, "lookup");
  assert.equal(suggestMaterialLookup.ref, "materials.suggest");
  assert.deepEqual(suggestMaterialLookup.bind, ["material"]);

  const app = await buildApp();

  try {
    const previewPage = await app.inject({
      method: "GET",
      url: "/next-form-preview/craftsman-order",
    });
    const applyPreviewPage = await app.inject({
      method: "POST",
      url: "/next-form-preview/craftsman-order",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `source=${encodeURIComponent(rawSource.replace("Auftragsnummer", "Auftrags-ID"))}`,
    });
    const invalidPreviewPage = await app.inject({
      method: "POST",
      url: "/next-form-preview/craftsman-order",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `source=${encodeURIComponent("## Broken\n- invalid")}`,
    });

    assert.equal(previewPage.statusCode, 200, "The next-form preview page should render.");
    assert.match(previewPage.body, /Next Form Preview/);
    assert.match(previewPage.body, /Auftragsdokumentation fuer Handwerker/);
    assert.match(previewPage.body, /Form Source/);
    assert.match(previewPage.body, /name="source"/);
    assert.match(previewPage.body, /Apply Preview/);
    assert.match(previewPage.body, /Read-only Form/);
    assert.match(previewPage.body, /Actions \/ Lookups:/);
    assert.match(previewPage.body, /Pflichtfeld/);
    assert.match(previewPage.body, /Noch kein Wert/);
    assert.match(previewPage.body, /Noch keine Auswahl/);
    assert.match(previewPage.body, /Auswahl: offen, pruefung, freigegeben/);
    assert.match(previewPage.body, /Kundendaten laden/);
    assert.match(previewPage.body, /Materialvorschlag holen/);
    assert.match(previewPage.body, /customers\.lookup/);
    assert.match(previewPage.body, /materials\.suggest/);
    assert.match(previewPage.body, /Args:<\/strong>\s*order_number/);
    assert.match(previewPage.body, /Bind:<\/strong>\s*customer, service_location/);
    assert.match(previewPage.body, /Referenzquelle/);
    assert.match(previewPage.body, /Auftragsnummer/);
    assert.match(previewPage.body, /Kunde/);
    assert.match(previewPage.body, /Arbeitszeit \(Std\.\)/);
    assert.match(previewPage.body, /Status \/ Freigabe/);

    assert.equal(applyPreviewPage.statusCode, 200, "Applying a modified source should re-render the preview.");
    assert.match(applyPreviewPage.body, /Auftrags-ID/);
    assert.doesNotMatch(applyPreviewPage.body, /Quelle aktuell nicht lesbar/);

    assert.equal(invalidPreviewPage.statusCode, 200, "Invalid source should still render the isolated page.");
    assert.match(invalidPreviewPage.body, /Quelle aktuell nicht lesbar/);
  } finally {
    await app.close();
  }

  console.log("next-form smoke passed");
};

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
