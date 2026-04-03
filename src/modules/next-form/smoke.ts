import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildApp } from "../../app.js";
import { parseNextFormSource, readReferenceCraftsmanOrderForm, referenceCraftsmanOrderFormPath } from "./read.js";
import { loadNextFormState } from "./state-store.js";

const main = async (): Promise<void> => {
  const rawSource = await readFile(referenceCraftsmanOrderFormPath, "utf8");
  const parsed = await readReferenceCraftsmanOrderForm();
  const parsedFromSource = parseNextFormSource(rawSource);

  assert.equal(parsed.meta.title, "Auftragsdokumentation fuer Handwerker");
  assert.equal(parsed.meta.key, "craftsman-order");
  assert.equal(parsed.meta.version, "1");
  assert.equal(parsed.sections.length, 4, "Expected four sections in the next-form reference.");
  assert.equal(parsed.controls.length, 11, "Expected eleven controls in the next-form reference.");
  assert.equal(parsed.actions.length, 2, "Expected two action-like elements in the next-form reference.");
  assert.deepEqual(parsed.meta, parsedFromSource.meta, "Direct source parse and file parse should match.");
  assert.throws(
    () => parseNextFormSource(rawSource.replace("text(order_number, required)", "email(order_number, required)")),
    /Control-Typ email wird im vereinfachten Formularmodell aktuell nicht unterstuetzt\./,
    "Only explicitly supported control types should be accepted by the next-form parser.",
  );
  assert.match(rawSource, /^---/m, "The new slim form syntax should use a frontmatter header.");
  assert.match(rawSource, /^## Auftrag$/m, "The new slim form syntax should use markdown-like section headings.");
  assert.match(rawSource, /^## Kunde$/m);
  assert.match(rawSource, /- Auftragsnummer: text\(order_number, required\) \| Kundendaten laden: action\(load_customer, ref="customers\.lookup", args="order_number", bind="customer,service_location"\)/);
  assert.match(rawSource, /- Einsatzort: textarea\(service_location\)$/m);
  assert.doesNotMatch(rawSource, /- Einsatzort: textarea\(service_location, required\)$/m);
  assert.match(rawSource, /- Material: textarea\(material\) \| Materialvorschlag holen: lookup\(suggest_material, ref="products\.suggest", args="work_description", bind="material"\)/);

  const orderSection = parsed.sections[0];

  assert.ok(orderSection, "The first section must exist.");
  assert.equal(orderSection.title, "Auftrag");
  assert.equal(orderSection.rows[0]?.slots.length, 2, "The first row should be split into two slots.");
  assert.equal(orderSection.rows[1]?.slots.length, 2, "The second row should be split into two slots.");

  const orderNumber = parsed.controls.find((control) => control.name === "order_number");
  const serviceLocation = parsed.controls.find((control) => control.name === "service_location");
  const approvalStatus = parsed.controls.find((control) => control.name === "approval_status");
  const loadCustomerAction = parsed.actions.find((action) => action.name === "load_customer");
  const suggestMaterialLookup = parsed.actions.find((action) => action.name === "suggest_material");
  const timeRow = parsed.sections[2]?.rows.find((row) => row.source.includes("labor_hours"));

  assert.ok(orderNumber, "The order number control must be parsed.");
  assert.equal(orderNumber.controlType, "text");
  assert.equal(orderNumber.label, "Auftragsnummer");
  assert.equal(orderNumber.properties.required, true);

  assert.ok(approvalStatus, "The approval status control must be parsed.");
  assert.ok(serviceLocation, "The service location control must be parsed.");
  assert.equal(approvalStatus.controlType, "select");
  assert.equal(serviceLocation.controlType, "textarea");
  assert.notEqual(serviceLocation.properties.required, true);
  assert.equal(approvalStatus.properties.options, "offen,pruefung,freigegeben");
  assert.equal(timeRow?.slots.length, 3, "The time row should expose three equal-width slots.");
  assert.ok(loadCustomerAction, "The action element must be parsed.");
  assert.equal(loadCustomerAction.kind, "action");
  assert.equal(loadCustomerAction.ref, "customers.lookup");
  assert.deepEqual(loadCustomerAction.args, ["order_number"]);
  assert.deepEqual(loadCustomerAction.bind, ["customer", "service_location"]);
  assert.ok(suggestMaterialLookup, "The lookup element must be parsed.");
  assert.equal(suggestMaterialLookup.kind, "lookup");
  assert.equal(suggestMaterialLookup.ref, "products.suggest");
  assert.deepEqual(suggestMaterialLookup.bind, ["material"]);

  const erpHealth = await fetch("http://localhost:3001/health");
  assert.equal(erpHealth.status, 200, "ERP-SIM must be reachable on localhost:3001 for the live next-form slice.");

  const customersResponse = await fetch("http://localhost:3001/api/customers?valid=true");
  assert.equal(customersResponse.status, 200, "ERP-SIM customers endpoint should respond.");
  const customersPayload = (await customersResponse.json()) as {
    items: Array<{ id: string; name: string }>;
  };

  let liveLookupSample:
    | {
        orderNumber: string;
        customerName: string;
      }
    | undefined;

  for (const customer of customersPayload.items) {
    const ordersResponse = await fetch(
      `http://localhost:3001/api/customer-orders?customer_id=${encodeURIComponent(customer.id)}`,
    );

    assert.equal(ordersResponse.status, 200, "ERP-SIM customer-orders endpoint should respond.");
    const ordersPayload = (await ordersResponse.json()) as {
      items: Array<{ order_number: string }>;
    };
    const firstOrder = ordersPayload.items[0];

    if (firstOrder) {
      liveLookupSample = {
        orderNumber: firstOrder.order_number,
        customerName: customer.name,
      };
      break;
    }
  }

  assert.ok(liveLookupSample, "ERP-SIM should expose at least one customer order for the live next-form lookup slice.");

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
    const runActionPage = await app.inject({
      method: "POST",
      url: "/next-form-preview/craftsman-order",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `source=${encodeURIComponent(rawSource)}&intent=run-action&actionName=load_customer&order_number=${encodeURIComponent(liveLookupSample.orderNumber)}&customer=&service_location=`,
    });
    const runMaterialLookupPage = await app.inject({
      method: "POST",
      url: "/next-form-preview/craftsman-order",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `source=${encodeURIComponent(rawSource)}&intent=run-action&actionName=suggest_material&work_description=${encodeURIComponent("batch")}&material=`,
    });
    const saveStatePage = await app.inject({
      method: "POST",
      url: "/next-form-preview/craftsman-order",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `source=${encodeURIComponent(rawSource)}&intent=save-state&order_number=${encodeURIComponent(liveLookupSample.orderNumber)}&customer=${encodeURIComponent(liveLookupSample.customerName)}&service_location=${encodeURIComponent("Nicht im ERP-SIM vorhanden")}`,
    });
    const loadStatePage = await app.inject({
      method: "POST",
      url: "/next-form-preview/craftsman-order",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `source=${encodeURIComponent(rawSource)}&intent=load-state&order_number=&customer=&service_location=`,
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
    assert.match(previewPage.body, /Formularquelle/);
    assert.match(previewPage.body, /Single Source of Truth/);
    assert.match(previewPage.body, /name="source"/);
    assert.match(previewPage.body, /Apply Preview/);
    assert.match(previewPage.body, /Restore Last Saved/);
    assert.match(previewPage.body, /Save/);
    assert.match(previewPage.body, /Reset to File/);
    assert.doesNotMatch(previewPage.body, /Live Lookup Slice/);
    assert.match(previewPage.body, /In dieser Formularquelle erkannt:\s*<strong>2 Action-\/Lookup-Elemente<\/strong>/);
    assert.match(previewPage.body, /Kundendaten laden<\/strong> · Action/);
    assert.match(previewPage.body, /Materialvorschlag holen<\/strong> · Lookup/);
    assert.match(previewPage.body, /Form Preview/);
    assert.match(previewPage.body, /Actions \/ Lookups:/);
    assert.match(previewPage.body, /Pflichtfeld/);
    assert.match(previewPage.body, /Noch kein Wert/);
    assert.match(previewPage.body, /Noch keine Auswahl/);
    assert.match(previewPage.body, /Auswahl: offen, pruefung, freigegeben/);
    assert.match(previewPage.body, /Kundendaten laden/);
    assert.match(previewPage.body, /Materialvorschlag holen/);
    assert.match(previewPage.body, /customers\.lookup/);
    assert.match(previewPage.body, /products\.suggest/);
    assert.match(previewPage.body, /Args:<\/strong>\s*order_number/);
    assert.match(previewPage.body, /Bind:<\/strong>\s*customer, service_location/);
    assert.match(previewPage.body, /Kundendaten laden: action\(load_customer, ref=&#34;customers\.lookup&#34;, args=&#34;order_number&#34;, bind=&#34;customer,service_location&#34;\)/);
    assert.match(previewPage.body, /Materialvorschlag holen: lookup\(suggest_material, ref=&#34;products\.suggest&#34;, args=&#34;work_description&#34;, bind=&#34;material&#34;\)/);
    assert.match(previewPage.body, /craftsman_order\.form\.md/);
    assert.doesNotMatch(previewPage.body, /Referenzquelle/);
    assert.match(previewPage.body, /Auftragsnummer/);
    assert.match(previewPage.body, /## Kunde|Kunde/);
    assert.match(previewPage.body, /Kunde/);
    assert.match(previewPage.body, /Arbeitszeit \(Std\.\)/);
    assert.match(previewPage.body, /Status \/ Freigabe/);
    assert.match(previewPage.body, /Aktiver Eingabewert fuer den ersten ERP-SIM-Lookup/);
    assert.match(previewPage.body, /Wird bei erfolgreichem `Kundendaten laden` aus dem ERP-SIM gebunden/);
    assert.match(previewPage.body, /Kann aus dem Kundenlookup vorbefuellt und danach manuell angepasst werden\./);

    assert.equal(applyPreviewPage.statusCode, 200, "Applying a modified source should re-render the preview.");
    assert.match(applyPreviewPage.body, /Auftrags-ID/);
    assert.doesNotMatch(applyPreviewPage.body, /Quelle aktuell nicht lesbar/);

    assert.equal(runActionPage.statusCode, 200, "Running the live ERP-SIM action should re-render the isolated page.");
    assert.match(runActionPage.body, new RegExp(liveLookupSample.orderNumber.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(runActionPage.body, new RegExp(liveLookupSample.customerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(runActionPage.body, /Kundendaten geladen/);
    assert.match(runActionPage.body, /Nicht im ERP-SIM vorhanden/);
    assert.match(runActionPage.body, /Kundendaten fuer/);
    assert.match(runActionPage.body, /name="order_number"/);
    assert.match(runActionPage.body, /class="next-form-action-button next-form-action-submit"/);

    assert.equal(runMaterialLookupPage.statusCode, 200, "Running the product-based material lookup should re-render the isolated page.");
    assert.match(runMaterialLookupPage.body, /Materialvorschlag geladen/);
    assert.match(runMaterialLookupPage.body, /Batch Product A/);
    assert.match(runMaterialLookupPage.body, /Materialvorschlag fuer/);

    assert.equal(saveStatePage.statusCode, 200, "Saving the isolated next-form state should re-render the page.");
    assert.match(saveStatePage.body, /Formularzustand gespeichert/);
    assert.match(saveStatePage.body, /Zuletzt gespeichert:/);

    const savedState = await loadNextFormState();
    assert.ok(savedState, "The isolated next-form state should be written to storage.");
    assert.equal(savedState.formKey, "craftsman-order");
    assert.equal(savedState.values.order_number, liveLookupSample.orderNumber);
    assert.equal(savedState.values.customer, liveLookupSample.customerName);
    assert.equal(savedState.values.service_location, "Nicht im ERP-SIM vorhanden");

    assert.equal(loadStatePage.statusCode, 200, "Loading the isolated next-form state should re-render the page.");
    assert.match(loadStatePage.body, /Gespeicherter Zustand geladen/);
    assert.match(loadStatePage.body, new RegExp(liveLookupSample.orderNumber.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(loadStatePage.body, new RegExp(liveLookupSample.customerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(loadStatePage.body, /Nicht im ERP-SIM vorhanden/);

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
