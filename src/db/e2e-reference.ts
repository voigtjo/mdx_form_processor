import assert from "node:assert/strict";
import { buildApp } from "../app.js";
import { findCustomerOrderRecord, findGenericFormRecord, findProductionRecord, findQualificationRecord } from "../modules/documents/typed-records-read.js";
import { findDocumentDetailVisibleToUser } from "../modules/documents/read.js";
import { closePool } from "./pool.js";
import { rebuildReferenceData } from "./rebuild-reference.js";

const postForm = async (
  app: Awaited<ReturnType<typeof buildApp>>,
  input: { url: string; payload: string },
) => {
  return app.inject({
    method: "POST",
    url: input.url,
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    payload: input.payload,
  });
};

const customerDocumentId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1";
const productionDocumentId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee2";
const qualificationDocumentId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3";
const genericFormDocumentId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee4";

const main = async (): Promise<void> => {
  await rebuildReferenceData();

  const app = await buildApp();

  try {
    const customerOpen = await app.inject({
      method: "GET",
      url: `/documents/${customerDocumentId}?user=service-durchfuehrung-dokumentation`,
    });
    assert.equal(customerOpen.statusCode, 200);
    assert.match(customerOpen.body, /Kundendaten laden/);

    const customerLookup = await postForm(app, {
      url: `/documents/${customerDocumentId}/form?user=service-durchfuehrung-dokumentation&intent=run-action&actionName=load_customer`,
      payload: `order_number=${encodeURIComponent("KD-2026-1007")}`,
    });
    assert.equal(customerLookup.statusCode, 200);
    assert.match(customerLookup.body, /Baukontor Nord/);

    const productLookup = await postForm(app, {
      url: `/documents/${customerDocumentId}/form?user=service-durchfuehrung-dokumentation&intent=run-action&actionName=suggest_material`,
      payload: `work_description=${encodeURIComponent("<p>Wartung Heizung Filterwechsel</p>")}`,
    });
    assert.equal(productLookup.statusCode, 200);
    assert.match(productLookup.body, /Wartungsset Heizung/);

    const customerSave = await postForm(app, {
      url: `/documents/${customerDocumentId}/form?user=service-durchfuehrung-dokumentation`,
      payload: [
        `order_number=${encodeURIComponent("KD-2026-1007")}`,
        `service_date=${encodeURIComponent("2026-04-04")}`,
        `technician=${encodeURIComponent("Service Durchfuehrung / Dokumentation")}`,
        `customer=${encodeURIComponent("Baukontor Nord")}`,
        `service_location=${encodeURIComponent("Lagerhalle 2 Bremen")}`,
        `work_description=${encodeURIComponent("<p>Wartung Heizung Filterwechsel und Testlauf.</p>")}`,
        `material=${encodeURIComponent("Wartungsset Heizung")}`,
        `approval_status=${encodeURIComponent("pruefung")}`,
        `labor_hours=${encodeURIComponent("3.00")}`,
        `travel_hours=${encodeURIComponent("1.00")}`,
        `break_minutes=${encodeURIComponent("20")}`,
      ].join("&"),
    });
    assert.equal(customerSave.statusCode, 303);

    const customerSubmit = await app.inject({
      method: "POST",
      url: `/documents/${customerDocumentId}/submit?user=service-durchfuehrung-dokumentation`,
    });
    assert.equal(customerSubmit.statusCode, 303);

    const customerApprove = await app.inject({
      method: "POST",
      url: `/documents/${customerDocumentId}/approve?user=service-auftrag-freigabe`,
    });
    assert.equal(customerApprove.statusCode, 303);

    const customerApprovedDetail = await findDocumentDetailVisibleToUser(customerDocumentId, "22222222-2222-2222-2222-222222222222");
    assert.equal(customerApprovedDetail?.status, "approved");
    const customerRecord = await findCustomerOrderRecord(customerDocumentId);
    assert.ok(customerRecord);
    assert.equal(customerRecord.orderNumber, "KD-2026-1007");
    assert.equal(customerRecord.customerName, "Baukontor Nord");
    assert.equal(customerRecord.serviceDate, "2026-04-04");
    assert.equal(customerRecord.status, "approved");
    const customerRecordApi = await app.inject({
      method: "GET",
      url: `/api/typed-records/customer-orders/${customerDocumentId}?user=service-durchfuehrung-dokumentation`,
    });
    assert.equal(customerRecordApi.statusCode, 200);
    assert.match(customerRecordApi.body, /approved/);

    const productionOpen = await app.inject({
      method: "GET",
      url: `/documents/${productionDocumentId}?user=produktion-durchfuehrung-dokumentation`,
    });
    assert.equal(productionOpen.statusCode, 200);
    assert.match(productionOpen.body, /PB-2026-0042/);

    const productionGridRows = JSON.stringify([
      { step: "Vorbereitung", station: "Linie 3", target_qty: "12", actual_qty: "12", result: "Material bereitgestellt" },
      { step: "Montage", station: "Linie 3", target_qty: "12", actual_qty: "12", result: "Komponenten verbaut" },
      { step: "Endpruefung", station: "QS", target_qty: "12", actual_qty: "12", result: "Freigabe vorbereitet" },
    ]);

    const productionSave = await postForm(app, {
      url: `/documents/${productionDocumentId}/form?user=produktion-durchfuehrung-dokumentation`,
      payload: [
        `batch_id=${encodeURIComponent("PB-2026-0042")}`,
        `serial_number=${encodeURIComponent("SN-2026-0042-A")}`,
        `product_name=${encodeURIComponent("Steuerkasten Serie S2")}`,
        `production_line=${encodeURIComponent("Linie 3")}`,
        `process_steps=${encodeURIComponent(productionGridRows)}`,
        `approval_status=${encodeURIComponent("pruefung")}`,
      ].join("&"),
    });
    assert.equal(productionSave.statusCode, 303);

    const productionSubmit = await app.inject({
      method: "POST",
      url: `/documents/${productionDocumentId}/submit?user=produktion-durchfuehrung-dokumentation`,
    });
    assert.equal(productionSubmit.statusCode, 303);

    const productionApprove = await app.inject({
      method: "POST",
      url: `/documents/${productionDocumentId}/approve?user=produktion-auftrag-freigabe`,
    });
    assert.equal(productionApprove.statusCode, 303);

    const productionRecord = await findProductionRecord(productionDocumentId);
    assert.ok(productionRecord);
    assert.equal(productionRecord.batchId, "PB-2026-0042");
    assert.equal(productionRecord.productName, "Steuerkasten Serie S2");
    assert.equal(productionRecord.status, "approved");
    const productionRecordApi = await app.inject({
      method: "GET",
      url: `/api/typed-records/production-records/${productionDocumentId}?user=produktion-durchfuehrung-dokumentation`,
    });
    assert.equal(productionRecordApi.statusCode, 200);
    assert.match(productionRecordApi.body, /processStepsJson/);

    const qualificationOpenA = await app.inject({
      method: "GET",
      url: `/documents/${qualificationDocumentId}?user=service-durchfuehrung-dokumentation`,
    });
    assert.equal(qualificationOpenA.statusCode, 200);
    assert.match(qualificationOpenA.body, /Beteiligte/);
    assert.match(qualificationOpenA.body, /Seite 1 von 3/);

    const qualificationPage2A = await postForm(app, {
      url: `/documents/${qualificationDocumentId}/form?user=service-durchfuehrung-dokumentation&intent=navigate-page&page=2`,
      payload: `qualification_current_page=${encodeURIComponent("1")}`,
    });
    assert.equal(qualificationPage2A.statusCode, 303);

    const qualificationSaveA = await postForm(app, {
      url: `/documents/${qualificationDocumentId}/form?user=service-durchfuehrung-dokumentation`,
      payload: [
        `qualification_record_number=${encodeURIComponent("QN-2026-001")}`,
        `qualification_title=${encodeURIComponent("Arbeitsschutz und digitale Dokumentation")}`,
        `owner_user_id=${encodeURIComponent("11111111-1111-1111-1111-111111111111")}`,
        `attendee_user_ids=${encodeURIComponent("33333333-3333-3333-3333-333333333333,55555555-5555-5555-5555-555555555555")}`,
        `valid_until=${encodeURIComponent("2027-03-31")}`,
        `qualification_result=${encodeURIComponent("sicher")}`,
        `qualification_topics=${encodeURIComponent("Arbeitsschutz,Dokumentation,Freigabe")}`,
        `qualification_current_page=${encodeURIComponent("2")}`,
        `approval_status=${encodeURIComponent("offen")}`,
      ].join("&"),
    });
    assert.equal(qualificationSaveA.statusCode, 303);

    const qualificationPage3A = await postForm(app, {
      url: `/documents/${qualificationDocumentId}/form?user=service-durchfuehrung-dokumentation&intent=navigate-page&page=3`,
      payload: `qualification_current_page=${encodeURIComponent("2")}`,
    });
    assert.equal(qualificationPage3A.statusCode, 303);

    const qualificationSignA = await postForm(app, {
      url: `/documents/${qualificationDocumentId}/form?user=service-durchfuehrung-dokumentation`,
      payload: [
        `qualification_current_page=${encodeURIComponent("3")}`,
        `approval_status=${encodeURIComponent("offen")}`,
        "work_signature_requested=sign",
      ].join("&"),
    });
    assert.equal(qualificationSignA.statusCode, 303);

    const qualificationSubmitA = await app.inject({
      method: "POST",
      url: `/documents/${qualificationDocumentId}/submit?user=service-durchfuehrung-dokumentation`,
    });
    assert.equal(qualificationSubmitA.statusCode, 303);

    const qualificationOpenB = await app.inject({
      method: "GET",
      url: `/documents/${qualificationDocumentId}?user=produktion-durchfuehrung-dokumentation`,
    });
    assert.equal(qualificationOpenB.statusCode, 200);
    assert.match(qualificationOpenB.body, /Seite 1 von 3/);

    const qualificationPage2B = await postForm(app, {
      url: `/documents/${qualificationDocumentId}/form?user=produktion-durchfuehrung-dokumentation&intent=navigate-page&page=2`,
      payload: `qualification_current_page=${encodeURIComponent("1")}`,
    });
    assert.equal(qualificationPage2B.statusCode, 303);

    const qualificationSaveB = await postForm(app, {
      url: `/documents/${qualificationDocumentId}/form?user=produktion-durchfuehrung-dokumentation`,
      payload: [
        `qualification_record_number=${encodeURIComponent("QN-2026-001")}`,
        `qualification_title=${encodeURIComponent("Arbeitsschutz und digitale Dokumentation")}`,
        `owner_user_id=${encodeURIComponent("11111111-1111-1111-1111-111111111111")}`,
        `attendee_user_ids=${encodeURIComponent("33333333-3333-3333-3333-333333333333,55555555-5555-5555-5555-555555555555")}`,
        `valid_until=${encodeURIComponent("2027-03-31")}`,
        `qualification_result=${encodeURIComponent("teilweise")}`,
        `qualification_topics=${encodeURIComponent("Arbeitsschutz,Dokumentation")}`,
        `qualification_current_page=${encodeURIComponent("2")}`,
        `approval_status=${encodeURIComponent("offen")}`,
      ].join("&"),
    });
    assert.equal(qualificationSaveB.statusCode, 303);

    const qualificationPage3B = await postForm(app, {
      url: `/documents/${qualificationDocumentId}/form?user=produktion-durchfuehrung-dokumentation&intent=navigate-page&page=3`,
      payload: `qualification_current_page=${encodeURIComponent("2")}`,
    });
    assert.equal(qualificationPage3B.statusCode, 303);

    const qualificationSignB = await postForm(app, {
      url: `/documents/${qualificationDocumentId}/form?user=produktion-durchfuehrung-dokumentation`,
      payload: [
        `qualification_current_page=${encodeURIComponent("3")}`,
        `approval_status=${encodeURIComponent("offen")}`,
        "work_signature_requested=sign",
      ].join("&"),
    });
    assert.equal(qualificationSignB.statusCode, 303);

    const qualificationSubmitB = await app.inject({
      method: "POST",
      url: `/documents/${qualificationDocumentId}/submit?user=produktion-durchfuehrung-dokumentation`,
    });
    assert.equal(qualificationSubmitB.statusCode, 303);

    const qualificationOwnerPage = await app.inject({
      method: "GET",
      url: `/documents/${qualificationDocumentId}?user=admin`,
    });
    assert.equal(qualificationOwnerPage.statusCode, 200);
    assert.match(qualificationOwnerPage.body, /2\/2/);
    assert.match(qualificationOwnerPage.body, /passed|failed|pending/);

    const qualificationApprove = await app.inject({
      method: "POST",
      url: `/documents/${qualificationDocumentId}/approve?user=admin`,
    });
    assert.equal(qualificationApprove.statusCode, 303);

    const qualificationApprovedDetail = await findDocumentDetailVisibleToUser(qualificationDocumentId, "11111111-1111-1111-1111-111111111111");
    assert.equal(qualificationApprovedDetail?.status, "approved");
    const qualificationRecord = await findQualificationRecord(qualificationDocumentId);
    assert.ok(qualificationRecord);
    assert.equal(qualificationRecord.qualificationRecordNumber, "QN-2026-001");
    assert.equal(qualificationRecord.qualificationTitle, "Arbeitsschutz und digitale Dokumentation");
    assert.equal(qualificationRecord.ownerUserId, "11111111-1111-1111-1111-111111111111");
    assert.equal(typeof qualificationRecord.evaluationStatus, "string");
    assert.equal(typeof qualificationRecord.scoreValue, "number");
    assert.equal(qualificationRecord.status, "approved");
    const qualificationRecordApi = await app.inject({
      method: "GET",
      url: `/api/typed-records/qualification-records/${qualificationDocumentId}?user=admin`,
    });
    assert.equal(qualificationRecordApi.statusCode, 200);
    assert.match(qualificationRecordApi.body, /qualificationTopicsJson/);

    const genericOpen = await app.inject({
      method: "GET",
      url: `/documents/${genericFormDocumentId}?user=service-durchfuehrung-dokumentation`,
    });
    assert.equal(genericOpen.statusCode, 200);
    assert.match(genericOpen.body, /Generisches Formular GF-2026-001/);

    const genericSave = await postForm(app, {
      url: `/documents/${genericFormDocumentId}/form?user=service-durchfuehrung-dokumentation`,
      payload: [
        `generic_form_title=${encodeURIComponent("Generisches Formular GF-2026-001")}`,
        `generic_form_description=${encodeURIComponent("Interner Standardfall fuer das generische Formular.")}`,
        `generic_form_note=${encodeURIComponent("<p>Generischer Formularinhalt fuer den Referenzpfad.</p>")}`,
        `approval_status=${encodeURIComponent("pruefung")}`,
      ].join("&"),
    });
    assert.equal(genericSave.statusCode, 303);

    const genericSubmit = await app.inject({
      method: "POST",
      url: `/documents/${genericFormDocumentId}/submit?user=service-durchfuehrung-dokumentation`,
    });
    assert.equal(genericSubmit.statusCode, 303);

    const genericApprove = await app.inject({
      method: "POST",
      url: `/documents/${genericFormDocumentId}/approve?user=admin`,
    });
    assert.equal(genericApprove.statusCode, 303);

    const genericRecord = await findGenericFormRecord(genericFormDocumentId);
    assert.ok(genericRecord);
    assert.equal(genericRecord.formTitle, "Generisches Formular GF-2026-001");
    assert.equal(genericRecord.status, "approved");
    const genericRecordApi = await app.inject({
      method: "GET",
      url: `/api/typed-records/generic-form-records/${genericFormDocumentId}?user=admin`,
    });
    assert.equal(genericRecordApi.statusCode, 200);
    assert.match(genericRecordApi.body, /Interner Standardfall/);
  } finally {
    await app.close();
    await closePool();
  }

  console.log("reference e2e passed");
};

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
